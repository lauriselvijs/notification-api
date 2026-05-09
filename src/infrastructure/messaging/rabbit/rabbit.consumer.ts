import type { ConsumeMessage } from "amqplib";
import type {
  TicketIntegrationEvent,
  TicketIntegrationEventPayload,
} from "../../../application/events/ticket/TicketIntegrationEventPayload.ts";
import { InboxProcessingDecision } from "../../../application/events/inbox/InboxProcessingDecision.ts";
import { TicketIntegrationEventType } from "../../../application/events/ticket/TicketIntegrationEventType.ts";
import type { InboxEventRepository } from "../../../application/ports/InboxEventRepository.ts";
import {
  getTicketIntegrationEventTypeFromRoutingKey,
  ticketEventRoutingKeyMap,
} from "../EventRoutingKeys.ts";
import { RABBIT_EXCHANGES, RABBIT_QUEUES } from "./rabbit.constants.ts";
import { rabbitConfig } from "./rabbit.config.ts";
import { connectToRabbit, getRabbitChannel } from "./rabbit.connection.ts";

export const startTicketIntegrationConsumer = async (
  onMessage: (
    eventType: TicketIntegrationEventType,
    payload: TicketIntegrationEventPayload,
  ) => Promise<void> | void,
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

      const eventType = getTicketIntegrationEventTypeFromRoutingKey(
        msg.fields.routingKey,
      );
      const body = msg.content.toString();
      let messageId: string | null = null;
      let leaseToken: string | null = null;

      try {
        messageId = getMessageId(msg);

        if (!eventType) {
          throw new Error(
            `Unsupported ticket routing key: ${msg.fields.routingKey}`,
          );
        }

        const parsed = parseTicketIntegrationEvent(body);
        const processingResult = await inboxEventRepository.startProcessing({
          messageId,
          exchange: msg.fields.exchange,
          routingKey: msg.fields.routingKey,
          eventType,
          payload: parsed,
          maxAttempts: rabbitConfig.ticketMaxRetries + 1,
        });
        const { decision } = processingResult;
        leaseToken = processingResult.leaseToken;

        if (decision === InboxProcessingDecision.SKIP) {
          console.log(`Skipping claimed ticket message "${messageId}"`);
          rabbitChannel.ack(msg);
          return;
        }

        if (decision === InboxProcessingDecision.DEAD_LETTER) {
          await publishToDeadLetterQueue(msg, "Inbox event is poisoned");
          rabbitChannel.ack(msg);
          return;
        }

        console.log(`[${eventType}]`, parsed);
        await onMessage(eventType, parsed.payload);
        if (!leaseToken) {
          throw new Error(`Missing lease token for message "${messageId}"`);
        }

        const markedProcessed = await inboxEventRepository.markProcessed(
          messageId,
          leaseToken,
        );

        if (!markedProcessed) {
          throw new Error(
            `Lost inbox lease before marking message "${messageId}" as processed`,
          );
        }

        rabbitChannel.ack(msg);
      } catch (err) {
        console.error("Failed to process ticket message:", err);

        if (shouldDeadLetter(msg)) {
          if (messageId && leaseToken) {
            await inboxEventRepository
              .markPoisoned(messageId, leaseToken, err)
              .catch((markError) => {
                console.error(
                  "Failed to mark inbox event as poisoned:",
                  markError,
                );
              });
          }

          await publishToDeadLetterQueue(msg, err);
          rabbitChannel.ack(msg);
          return;
        }

        if (messageId && leaseToken) {
          await inboxEventRepository
            .markFailed(messageId, leaseToken, err)
            .catch((markError) => {
              console.error("Failed to mark inbox event as failed:", markError);
            });
        }
        rabbitChannel.nack(msg, false, false);
      }
    },
    { noAck: false },
  );
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
