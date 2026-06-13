import Notification from "../../../domain/notification/entities/Notification.ts";
import type { NotificationRepository } from "../../../domain/notification/repositories/NotificationRepository.ts";
import { getPrisma } from "../prisma.ts";

export class PrismaNotificationRepository implements NotificationRepository {
  async create(notification: Notification): Promise<void> {
    await getPrisma().notification.create({
      data: {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        createdAt: notification.createdAt,
        deletedAt: notification.deletedAt,
      },
    });
  }

  async findById(id: string): Promise<Notification | null> {
    const notification = await getPrisma().notification.findUnique({
      where: { id },
    });

    return notification ? this.toDomain(notification) : null;
  }

  async findAll(): Promise<Notification[]> {
    const notifications = await getPrisma().notification.findMany({
      orderBy: { createdAt: "desc" },
    });

    return notifications.map((notification) => this.toDomain(notification));
  }

  async update(notification: Notification): Promise<void> {
    await getPrisma().notification.update({
      where: { id: notification.id },
      data: {
        title: notification.title,
        message: notification.message,
        deletedAt: notification.deletedAt,
      },
    });
  }

  async save(notification: Notification): Promise<void> {
    await getPrisma().notification.upsert({
      where: { id: notification.id },
      create: {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        createdAt: notification.createdAt,
        deletedAt: notification.deletedAt,
      },
      update: {
        title: notification.title,
        message: notification.message,
        deletedAt: notification.deletedAt,
      },
    });
  }

  private toDomain(notification: {
    id: string;
    title: string;
    message: string;
    createdAt: Date;
    deletedAt: Date | null;
  }): Notification {
    return Notification.rehydrate(
      notification.id,
      notification.title,
      notification.message,
      notification.createdAt,
      notification.deletedAt,
    );
  }
}
