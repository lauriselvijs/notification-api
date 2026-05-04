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
import { RABBIT_EXCHANGES } from "./rabbit.constants.ts";
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

  const q = await rabbitChannel.assertQueue("", {
    exclusive: true,
    autoDelete: true,
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
        });
        const { decision } = processingResult;
        leaseToken = processingResult.leaseToken;

        if (decision === InboxProcessingDecision.SKIP) {
          console.log(`Skipping claimed ticket message "${messageId}"`);
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
