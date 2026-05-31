import Notification from "../../domain/notification/entities/Notification.ts";
import type { NotificationRepository } from "../../domain/notification/repositories/NotificationRepository.ts";
import type { TicketIntegrationEventPayload } from "../events/ticket/TicketIntegrationEventPayload.ts";
import { TicketIntegrationEventType } from "../events/ticket/TicketIntegrationEventType.ts";
import { ChoreographySaga } from "../sagas/ChoreographySaga.ts";

export class HandleTicketIntegrationEventUseCase {
  private readonly saga: ChoreographySaga<
    TicketIntegrationEventType,
    TicketIntegrationEventPayload
  >;

  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {
    this.saga = new ChoreographySaga<
      TicketIntegrationEventType,
      TicketIntegrationEventPayload
    >("TicketNotificationChoreographySaga")
      .on(TicketIntegrationEventType.CREATED, (payload) =>
        this.upsertNotification(payload),
      )
      .on(TicketIntegrationEventType.UPDATED, (payload) =>
        this.upsertNotification(payload),
      )
      .on(TicketIntegrationEventType.DELETED, (payload) =>
        this.deleteNotification(payload),
      );
  }

  async execute(
    eventType: TicketIntegrationEventType,
    payload: TicketIntegrationEventPayload,
  ): Promise<void> {
    await this.saga.handle(eventType, payload);
  }

  private async upsertNotification(
    payload: TicketIntegrationEventPayload,
  ): Promise<void> {
    await this.notificationRepository.save(this.toNotification(payload));
  }

  private async deleteNotification(
    payload: TicketIntegrationEventPayload,
  ): Promise<void> {
    const notification = await this.notificationRepository.findById(payload.id);

    if (!notification || notification.isDeleted()) {
      return;
    }

    notification.delete();
    await this.notificationRepository.save(notification);
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
