import type { NewNotification } from "../types/NewNotification.ts";
import type { UpdateNotification } from "../types/UpdateNotification.ts";

export default class Notification {
  constructor(
    public readonly id: string,
    public title: string,
    public message: string,
    public readonly createdAt: Date,
    public deletedAt: Date | null = null,
  ) {}

  public static create(newNotification: NewNotification): Notification {
    return new Notification(
      crypto.randomUUID(),
      newNotification.title,
      newNotification.message,
      new Date(),
    );
  }

  public static rehydrate(
    id: string,
    title: string,
    message: string,
    createdAt: Date,
    deletedAt: Date | null,
  ): Notification {
    return new Notification(id, title, message, createdAt, deletedAt);
  }

  public delete(): void {
    if (this.deletedAt) {
      throw new Error("Notification is already deleted.");
    }

    this.deletedAt = new Date();
  }

  public isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  public restore(): void {
    if (!this.deletedAt) {
      throw new Error("Notification is not deleted.");
    }

    this.deletedAt = null;
  }

  public update(data: UpdateNotification): Notification {
    if (data.message !== undefined) {
      this.message = data.message;
    }

    if (data.title !== undefined) {
      this.title = data.title;
    }

    return this;
  }
}
