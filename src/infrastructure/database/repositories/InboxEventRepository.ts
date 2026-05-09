import { randomUUID } from "node:crypto";
import { Prisma } from "../../../../generated/prisma/client.ts";
import { InboxProcessingDecision } from "../../../application/events/inbox/InboxProcessingDecision.ts";
import { InboxEventStatus } from "../../../application/events/inbox/InboxEventStatus.ts";
import type {
  InboxProcessingResult,
  InboxEventRepository as InboxEventRepositoryPort,
  RegisterInboxEventInput,
} from "../../../application/ports/InboxEventRepository.ts";
import { prisma } from "../prisma.ts";

const INBOX_PROCESSING_TIMEOUT_MS = 5 * 60 * 1000;

export class InboxEventRepository implements InboxEventRepositoryPort {
  async startProcessing(
    input: RegisterInboxEventInput,
  ): Promise<InboxProcessingResult> {
    const now = new Date();
    const leaseToken = randomUUID();

    try {
      await prisma.inboxEvent.create({
        data: {
          id: randomUUID(),
          messageId: input.messageId,
          exchange: input.exchange,
          routingKey: input.routingKey,
          eventType: input.eventType,
          payload: toPrismaJson(input.payload),
          status: InboxEventStatus.PROCESSING,
          leaseToken,
          attempts: 1,
          processingStartedAt: now,
        },
      });

      return {
        decision: InboxProcessingDecision.PROCESS,
        leaseToken,
      };
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        const existingRecord = await prisma.inboxEvent.findUnique({
          where: { messageId: input.messageId },
        });

        if (!existingRecord) {
          throw new Error(
            `Inbox event "${input.messageId}" conflicted on create but could not be loaded`,
          );
        }

        if (existingRecord.status === InboxEventStatus.PROCESSED) {
          return {
            decision: InboxProcessingDecision.SKIP,
            leaseToken: null,
          };
        }

        if (existingRecord.status === InboxEventStatus.POISONED) {
          return {
            decision: InboxProcessingDecision.DEAD_LETTER,
            leaseToken: null,
          };
        }

        if (existingRecord.status === InboxEventStatus.FAILED) {
          if (existingRecord.attempts >= input.maxAttempts) {
            await prisma.inboxEvent.updateMany({
              where: {
                messageId: input.messageId,
                status: InboxEventStatus.FAILED,
              },
              data: {
                status: InboxEventStatus.POISONED,
                leaseToken: null,
                failedAt: new Date(),
              },
            });

            return {
              decision: InboxProcessingDecision.DEAD_LETTER,
              leaseToken: null,
            };
          }

          const retried = await prisma.inboxEvent.updateMany({
            where: {
              messageId: input.messageId,
              status: InboxEventStatus.FAILED,
            },
            data: {
              status: InboxEventStatus.PROCESSING,
              leaseToken,
              attempts: { increment: 1 },
              error: null,
              failedAt: null,
              processedAt: null,
              processingStartedAt: now,
            },
          });

          return retried.count === 1
            ? {
                decision: InboxProcessingDecision.PROCESS,
                leaseToken,
              }
            : {
                decision: InboxProcessingDecision.SKIP,
                leaseToken: null,
              };
        }

        if (existingRecord.status !== InboxEventStatus.PROCESSING) {
          return {
            decision: InboxProcessingDecision.SKIP,
            leaseToken: null,
          };
        }

        const timeoutThreshold = new Date(
          now.getTime() - INBOX_PROCESSING_TIMEOUT_MS,
        );

        if (existingRecord.attempts >= input.maxAttempts) {
          const poisoned = await prisma.inboxEvent.updateMany({
            where: {
              messageId: input.messageId,
              status: InboxEventStatus.PROCESSING,
              processingStartedAt: {
                lte: timeoutThreshold,
              },
            },
            data: {
              status: InboxEventStatus.POISONED,
              leaseToken: null,
              failedAt: now,
            },
          });

          return poisoned.count === 1
            ? {
                decision: InboxProcessingDecision.DEAD_LETTER,
                leaseToken: null,
              }
            : {
                decision: InboxProcessingDecision.SKIP,
                leaseToken: null,
              };
        }

        const reclaimed = await prisma.inboxEvent.updateMany({
          where: {
            messageId: input.messageId,
            status: InboxEventStatus.PROCESSING,
            processingStartedAt: {
              lte: timeoutThreshold,
            },
          },
          data: {
            status: InboxEventStatus.PROCESSING,
            leaseToken,
            attempts: { increment: 1 },
            error: null,
            failedAt: null,
            processedAt: null,
            processingStartedAt: now,
          },
        });

        return reclaimed.count === 1
          ? {
              decision: InboxProcessingDecision.PROCESS,
              leaseToken,
            }
          : {
              decision: InboxProcessingDecision.SKIP,
              leaseToken: null,
            };
      }

      throw error;
    }
  }

  async markProcessed(messageId: string, leaseToken: string): Promise<boolean> {
    const result = await prisma.inboxEvent.updateMany({
      where: {
        messageId,
        leaseToken,
        status: InboxEventStatus.PROCESSING,
      },
      data: {
        status: InboxEventStatus.PROCESSED,
        leaseToken: null,
        processedAt: new Date(),
        error: null,
        failedAt: null,
      },
    });

    return result.count === 1;
  }

  async markFailed(
    messageId: string,
    leaseToken: string,
    error: unknown,
  ): Promise<boolean> {
    const result = await prisma.inboxEvent.updateMany({
      where: {
        messageId,
        leaseToken,
        status: InboxEventStatus.PROCESSING,
      },
      data: {
        status: InboxEventStatus.FAILED,
        leaseToken: null,
        error: this.formatError(error),
        failedAt: new Date(),
      },
    });

    return result.count === 1;
  }

  async markPoisoned(
    messageId: string,
    leaseToken: string,
    error: unknown,
  ): Promise<boolean> {
    const result = await prisma.inboxEvent.updateMany({
      where: {
        messageId,
        leaseToken,
        status: InboxEventStatus.PROCESSING,
      },
      data: {
        status: InboxEventStatus.POISONED,
        leaseToken: null,
        error: this.formatError(error),
        failedAt: new Date(),
      },
    });

    return result.count === 1;
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    );
  }

  private formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.stack ?? error.message;
    }

    return String(error);
  }
}

const toPrismaJson = (
  payload: object,
): Prisma.InputJsonValue | typeof Prisma.JsonNull => {
  return JSON.parse(JSON.stringify(payload)) as Prisma.InputJsonValue;
};
