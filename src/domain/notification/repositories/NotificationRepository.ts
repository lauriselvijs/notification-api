import Notification from "../entities/Notification.ts";

export interface NotificationRepository {
  create(notification: Notification): Promise<void>;
  findById(id: string): Promise<Notification | null>;
  findAll(): Promise<Notification[]>;
  update(notification: Notification): Promise<void>;
  save(notification: Notification): Promise<void>;
}
