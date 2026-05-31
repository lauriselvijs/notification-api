export type ChoreographySagaHandler<TPayload> = (
  payload: TPayload,
) => Promise<void>;

export class ChoreographySaga<TEventType extends string, TPayload> {
  private readonly handlers = new Map<
    TEventType,
    ChoreographySagaHandler<TPayload>
  >();

  constructor(private readonly name: string) {}

  on(
    eventType: TEventType,
    handler: ChoreographySagaHandler<TPayload>,
  ): ChoreographySaga<TEventType, TPayload> {
    this.handlers.set(eventType, handler);
    return this;
  }

  async handle(eventType: TEventType, payload: TPayload): Promise<void> {
    const handler = this.handlers.get(eventType);

    if (!handler) {
      throw new Error(
        `Saga "${this.name}" does not handle event "${eventType}"`,
      );
    }

    await handler(payload);
  }
}
