import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { HandleTicketIntegrationEventUseCase } from "../src/application/use-cases/HandleTicketIntegrationEventUseCase.ts";
import { TicketIntegrationEventType } from "../src/application/events/ticket/TicketIntegrationEventType.ts";
import Notification from "../src/domain/notification/entities/Notification.ts";
import type { NotificationRepository } from "../src/domain/notification/repositories/NotificationRepository.ts";

class InMemoryNotificationRepository implements NotificationRepository {
  readonly notifications = new Map<string, Notification>();

  async create(notification: Notification): Promise<void> {
    this.notifications.set(notification.id, notification);
  }

  async findById(id: string): Promise<Notification | null> {
    return this.notifications.get(id) ?? null;
  }

  async findAll(): Promise<Notification[]> {
    return [...this.notifications.values()];
  }

  async update(notification: Notification): Promise<void> {
    this.notifications.set(notification.id, notification);
  }

  async save(notification: Notification): Promise<void> {
    this.notifications.set(notification.id, notification);
  }
}

describe("handle ticket integration event use case", () => {
  it("creates notification when ticket is created", async () => {
    const repository = new InMemoryNotificationRepository();
    const useCase = new HandleTicketIntegrationEventUseCase(repository);

    await useCase.execute(TicketIntegrationEventType.CREATED, {
      id: "ticket-1",
      title: "Ticket created",
      description: "A new ticket exists",
      status: "open",
      createdAt: "2026-05-31T00:00:00.000Z",
    });

    const notification = await repository.findById("ticket-1");

    assert.ok(notification);
    assert.equal(notification.title, "Ticket created");
    assert.equal(notification.message, "A new ticket exists");
    assert.equal(notification.deletedAt, null);
  });

  it("updates notification when ticket is updated", async () => {
    const repository = new InMemoryNotificationRepository();
    await repository.save(
      Notification.rehydrate(
        "ticket-1",
        "Old title",
        "Old message",
        new Date("2026-05-31T00:00:00.000Z"),
        null,
      ),
    );
    const useCase = new HandleTicketIntegrationEventUseCase(repository);

    await useCase.execute(TicketIntegrationEventType.UPDATED, {
      id: "ticket-1",
      title: "New title",
      description: "New message",
      status: "pending",
      createdAt: "2026-05-31T00:00:00.000Z",
    });

    const notification = await repository.findById("ticket-1");

    assert.ok(notification);
    assert.equal(notification.title, "New title");
    assert.equal(notification.message, "New message");
  });

  it("soft-deletes notification when ticket is deleted", async () => {
    const repository = new InMemoryNotificationRepository();
    await repository.save(
      Notification.rehydrate(
        "ticket-1",
        "Title",
        "Message",
        new Date("2026-05-31T00:00:00.000Z"),
        null,
      ),
    );
    const useCase = new HandleTicketIntegrationEventUseCase(repository);

    await useCase.execute(TicketIntegrationEventType.DELETED, {
      id: "ticket-1",
      title: "Title",
      description: "Message",
      status: "closed",
    });

    const notification = await repository.findById("ticket-1");

    assert.ok(notification);
    assert.ok(notification.deletedAt);
  });

  it("ignores deleted ticket event when notification does not exist", async () => {
    const repository = new InMemoryNotificationRepository();
    const useCase = new HandleTicketIntegrationEventUseCase(repository);

    await useCase.execute(TicketIntegrationEventType.DELETED, {
      id: "ticket-1",
      title: "Title",
      description: "Message",
      status: "closed",
    });

    assert.equal(await repository.findById("ticket-1"), null);
  });
});
