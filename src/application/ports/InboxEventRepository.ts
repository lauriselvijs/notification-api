import { InboxProcessingDecision } from "../events/inbox/InboxProcessingDecision.ts";

export interface RegisterInboxEventInput {
  messageId: string;
  exchange: string;
  routingKey: string;
  eventType: string;
  payload: object;
}

export interface InboxEventRepository {
  startProcessing(
    input: RegisterInboxEventInput,
  ): Promise<InboxProcessingResult>;
  markProcessed(messageId: string, leaseToken: string): Promise<boolean>;
  markFailed(messageId: string, leaseToken: string, error: unknown): Promise<boolean>;
}

export interface InboxProcessingResult {
  decision: InboxProcessingDecision;
  leaseToken: string | null;
}
