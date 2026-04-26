export interface TicketIntegrationEventPayload {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
