import type { ConsumeMessage } from "amqplib";
import type { TicketIntegrationEventPayload } from "../../../application/events/ticket/TicketIntegrationEventPayload.ts";
import { TicketIntegrationEventType } from "../../../application/events/ticket/TicketIntegrationEventType.ts";
import {
  getTicketIntegrationEventTypeFromRoutingKey,
  ticketEventRoutingKeyMap,
} from "../EventRoutingKeys.ts";
import { RABBIT_EXCHANGES } from "./rabbit.constants.ts";
import { connectToRabbit, getRabbitChannel } from "./rabbit.connection.ts";

export const startTicketIntegrationConsumer = async (
  onMessage: (
    eventType: TicketIntegrationEventType,
    payload: TicketIntegrationEventPayload
  ) => Promise<void> | void
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
      `Bound queue "${q.queue}" to "${RABBIT_EXCHANGES.TICKETS}" with "${key}"`
    );
  }

  console.log(`Waiting for ticket messages in queue "${q.queue}"...`);

  rabbitChannel.consume(
    q.queue,
    async (msg: ConsumeMessage | null) => {
      if (!msg) return;

      const eventType = getTicketIntegrationEventTypeFromRoutingKey(
        msg.fields.routingKey
      );
      const body = msg.content.toString();

      try {
        if (!eventType) {
          throw new Error(`Unsupported ticket routing key: ${msg.fields.routingKey}`);
        }

        const parsed = JSON.parse(body);
        console.log(`[${eventType}]`, parsed);
        await onMessage(eventType, parsed);
        rabbitChannel.ack(msg);
      } catch (err) {
        console.error("Failed to process ticket message:", err);
        rabbitChannel.nack(msg, false, false);
      }
    },
    { noAck: false }
  );
};
