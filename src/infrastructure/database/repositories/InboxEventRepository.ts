import { randomUUID } from "node:crypto";
import { Prisma } from "../../../../generated/prisma/client.ts";
import type {
  InboxEventRepository as InboxEventRepositoryPort,
  RegisterInboxEventInput,
} from "../../../application/ports/InboxEventRepository.ts";
import { getPrisma } from "../prisma.ts";

export class InboxEventRepository implements InboxEventRepositoryPort {
  async create(input: RegisterInboxEventInput): Promise<boolean> {
    try {
      await getPrisma().inboxEvent.create({
        data: {
          id: randomUUID(),
          messageId: input.messageId,
          exchange: input.exchange,
          routingKey: input.routingKey,
          eventType: input.eventType,
          payload: toPrismaJson(input.payload),
        },
      });

      return true;
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        return false;
      }

      throw error;
    }
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    );
  }
}

const toPrismaJson = (
  payload: object,
): Prisma.InputJsonValue | typeof Prisma.JsonNull => {
  return JSON.parse(JSON.stringify(payload)) as Prisma.InputJsonValue;
};
