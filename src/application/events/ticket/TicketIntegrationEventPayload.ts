import type { IntegrationEvent } from "../IntegrationEvent.ts";

export interface TicketIntegrationEventPayload {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export type TicketIntegrationEvent =
  IntegrationEvent<TicketIntegrationEventPayload>;
