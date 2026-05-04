import Notification from "../../domain/notification/entities/Notification.ts";
import type { NotificationRepository } from "../../domain/notification/repositories/NotificationRepository.ts";
import type { TicketIntegrationEventPayload } from "../events/ticket/TicketIntegrationEventPayload.ts";
import { TicketIntegrationEventType } from "../events/ticket/TicketIntegrationEventType.ts";

export class HandleTicketIntegrationEventUseCase {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async execute(
    eventType: TicketIntegrationEventType,
    payload: TicketIntegrationEventPayload,
  ): Promise<void> {
    const handlers: Record<TicketIntegrationEventType, () => Promise<void>> = {
      [TicketIntegrationEventType.CREATED]: () =>
        this.notificationRepository.save(this.toNotification(payload)),
      [TicketIntegrationEventType.UPDATED]: () =>
        this.notificationRepository.save(this.toNotification(payload)),
      [TicketIntegrationEventType.DELETED]: async () => {
        const notification = await this.notificationRepository.findById(payload.id);

        if (!notification || notification.isDeleted()) {
          return;
        }

        notification.delete();
        await this.notificationRepository.save(notification);
      },
    };

    await handlers[eventType]();
  }

  private toNotification(
    payload: TicketIntegrationEventPayload,
  ): Notification {
    return Notification.rehydrate(
      payload.id,
      payload.title,
      payload.description,
      payload.createdAt ? new Date(payload.createdAt) : new Date(),
      null,
    );
  }
}
