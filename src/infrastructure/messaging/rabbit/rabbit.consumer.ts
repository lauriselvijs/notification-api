import type { ConsumeMessage } from "amqplib";
import type {
  TicketIntegrationEvent,
  TicketIntegrationEventPayload,
} from "../../../application/events/ticket/TicketIntegrationEventPayload.ts";
import { TicketIntegrationEventType } from "../../../application/events/ticket/TicketIntegrationEventType.ts";
import type { InboxEventRepository } from "../../../application/ports/InboxEventRepository.ts";
import {
  getTicketIntegrationEventTypeFromRoutingKey,
  ticketEventRoutingKeyMap,
} from "../EventRoutingKeys.ts";
import { runInTransaction } from "../../database/prisma.ts";
import { RABBIT_EXCHANGES, RABBIT_QUEUES } from "./rabbit.constants.ts";
import { rabbitConfig } from "./rabbit.config.ts";
import { connectToRabbit, getRabbitChannel } from "./rabbit.connection.ts";

type TicketIntegrationMessageHandler = (
  eventType: TicketIntegrationEventType,
  payload: TicketIntegrationEventPayload,
) => Promise<void> | void;

export const startTicketIntegrationConsumer = async (
  onMessage: TicketIntegrationMessageHandler,
  inboxEventRepository: InboxEventRepository,
): Promise<void> => {
  await connectToRabbit();

  const rabbitChannel = getRabbitChannel();

  await rabbitChannel.prefetch(10);

  const q = await rabbitChannel.assertQueue(RABBIT_QUEUES.TICKET_INTEGRATION, {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": RABBIT_EXCHANGES.TICKET_RETRY,
    },
  });

  for (const key of Object.values(ticketEventRoutingKeyMap)) {
    await rabbitChannel.bindQueue(q.queue, RABBIT_EXCHANGES.TICKETS, key);
    console.log(
      `Bound queue "${q.queue}" to "${RABBIT_EXCHANGES.TICKETS}" with "${key}"`,
    );
  }

  console.log(`Waiting for ticket messages in queue "${q.queue}"...`);

  rabbitChannel.consume(
    q.queue,
    async (msg: ConsumeMessage | null) => {
      if (!msg) return;

      try {
        await processTicketMessage(msg, onMessage, inboxEventRepository);
        rabbitChannel.ack(msg);
      } catch (err) {
        await handleProcessingFailure(msg, err);
      }
    },
    { noAck: false },
  );
};

const processTicketMessage = async (
  msg: ConsumeMessage,
  onMessage: TicketIntegrationMessageHandler,
  inboxEventRepository: InboxEventRepository,
): Promise<void> => {
  const messageId = getMessageId(msg);
  const eventType = getTicketIntegrationEventTypeFromRoutingKey(
    msg.fields.routingKey,
  );

  if (!eventType) {
    throw new Error(`Unsupported ticket routing key: ${msg.fields.routingKey}`);
  }

  const parsed = parseTicketIntegrationEvent(msg.content.toString());
  let isDuplicate = false;

  await runInTransaction(async () => {
    const created = await inboxEventRepository.create({
      messageId,
      exchange: msg.fields.exchange,
      routingKey: msg.fields.routingKey,
      eventType,
      payload: parsed,
    });

    if (!created) {
      isDuplicate = true;
      return;
    }

    console.log(`[${eventType}]`, parsed);
    await onMessage(eventType, parsed.payload);
  });

  if (isDuplicate) {
    console.log(`Skipping already processed ticket message "${messageId}"`);
  }
};

const handleProcessingFailure = async (
  msg: ConsumeMessage,
  error: unknown,
): Promise<void> => {
  const rabbitChannel = getRabbitChannel();

  console.error("Failed to process ticket message:", error);

  if (shouldDeadLetter(msg)) {
    await publishToDeadLetterQueue(msg, error);
    rabbitChannel.ack(msg);
    return;
  }

  rabbitChannel.nack(msg, false, false);
};

const getMessageId = (msg: ConsumeMessage): string => {
  if (msg.properties.messageId) {
    return msg.properties.messageId;
  }

  throw new Error("Rabbit message is missing required messageId");
};

const parseTicketIntegrationEvent = (body: string): TicketIntegrationEvent => {
  const parsed = JSON.parse(body) as Omit<
    TicketIntegrationEvent,
    "occurredAt"
  > & {
    occurredAt: string | Date;
  };

  return {
    ...parsed,
    occurredAt:
      parsed.occurredAt instanceof Date
        ? parsed.occurredAt
        : new Date(parsed.occurredAt),
  };
};

const shouldDeadLetter = (msg: ConsumeMessage): boolean =>
  getRetryCount(msg) >= rabbitConfig.ticketMaxRetries;

const getRetryCount = (msg: ConsumeMessage): number => {
  const deaths = msg.properties.headers?.["x-death"];

  if (!Array.isArray(deaths)) {
    return 0;
  }

  return deaths
    .filter(
      (death) =>
        death?.queue === RABBIT_QUEUES.TICKET_INTEGRATION_RETRY &&
        death?.reason === "expired",
    )
    .reduce((total, death) => total + Number(death.count ?? 0), 0);
};

const publishToDeadLetterQueue = async (
  msg: ConsumeMessage,
  error: unknown,
): Promise<void> => {
  const rabbitChannel = getRabbitChannel();
  const errorMessage = formatDeadLetterError(error);

  rabbitChannel.publish(
    RABBIT_EXCHANGES.TICKET_DLX,
    msg.fields.routingKey,
    msg.content,
    {
      persistent: true,
      contentType: msg.properties.contentType,
      contentEncoding: msg.properties.contentEncoding,
      correlationId: msg.properties.correlationId,
      messageId: msg.properties.messageId,
      timestamp: msg.properties.timestamp,
      type: msg.properties.type,
      appId: msg.properties.appId,
      headers: {
        ...msg.properties.headers,
        "x-notification-api-dead-letter-reason": errorMessage,
        "x-notification-api-retry-count": getRetryCount(msg),
      },
    },
  );

  await rabbitChannel.waitForConfirms();
  console.warn(
    `Sent ticket message "${msg.properties.messageId ?? "unknown"}" to DLQ after ${getRetryCount(msg)} retries: ${errorMessage}`,
  );
};

const formatDeadLetterError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};
