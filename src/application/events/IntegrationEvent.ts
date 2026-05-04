export interface IntegrationEvent<TPayload extends object = object> {
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  payload: TPayload;
  occurredAt: Date;
}
