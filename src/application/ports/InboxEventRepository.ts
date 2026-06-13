export interface RegisterInboxEventInput {
  messageId: string;
  exchange: string;
  routingKey: string;
  eventType: string;
  payload: object;
}

export interface InboxEventRepository {
  create(input: RegisterInboxEventInput): Promise<boolean>;
}
