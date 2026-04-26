import { TicketIntegrationEventType } from "../../application/events/ticket/TicketIntegrationEventType.ts";

export const ticketEventRoutingKeyMap = {
  [TicketIntegrationEventType.CREATED]: "tickets.created",
  [TicketIntegrationEventType.UPDATED]: "tickets.updated",
  [TicketIntegrationEventType.DELETED]: "tickets.deleted",
} as const;

export const getTicketIntegrationEventTypeFromRoutingKey = (
  routingKey: string,
): TicketIntegrationEventType | null => {
  const entry = Object.entries(ticketEventRoutingKeyMap).find(
    ([_key, value]) => value === routingKey,
  );

  return entry ? (entry[0] as TicketIntegrationEventType) : null;
};
