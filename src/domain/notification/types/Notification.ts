import { NewNotification } from "./NewNotification.ts";

export type Notification = NewNotification & {
  id: string;
  createdAt: Date;
  deletedAt: Date | null;
};
