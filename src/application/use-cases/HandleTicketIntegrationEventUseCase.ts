import type { TicketIntegrationEventPayload } from "../events/ticket/TicketIntegrationEventPayload.ts";
import { TicketIntegrationEventType } from "../events/ticket/TicketIntegrationEventType.ts";

export class HandleTicketIntegrationEventUseCase {
  async execute(
    eventType: TicketIntegrationEventType,
    payload: TicketIntegrationEventPayload
  ): Promise<void> {
    const handlers: Record<TicketIntegrationEventType, () => void> = {
      [TicketIntegrationEventType.CREATED]: () =>
        console.log("Ticket integration event received: created", payload),
      [TicketIntegrationEventType.UPDATED]: () =>
        console.log("Ticket integration event received: updated", payload),
      [TicketIntegrationEventType.DELETED]: () =>
        console.log("Ticket integration event received: deleted", payload),
    };

    handlers[eventType]();
  }
}
