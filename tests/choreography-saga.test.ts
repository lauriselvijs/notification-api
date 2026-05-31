import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ChoreographySaga } from "../src/application/sagas/ChoreographySaga.ts";

describe("choreography saga", () => {
  it("handles registered event types", async () => {
    const handled: string[] = [];
    const saga = new ChoreographySaga<"created" | "deleted", { id: string }>(
      "TestChoreographySaga",
    )
      .on("created", async (payload) => {
        handled.push(`created:${payload.id}`);
      })
      .on("deleted", async (payload) => {
        handled.push(`deleted:${payload.id}`);
      });

    await saga.handle("created", { id: "ticket-1" });
    await saga.handle("deleted", { id: "ticket-1" });

    assert.deepEqual(handled, ["created:ticket-1", "deleted:ticket-1"]);
  });

  it("rejects unregistered event types", async () => {
    const saga = new ChoreographySaga<string, { id: string }>(
      "TestChoreographySaga",
    );

    await assert.rejects(
      () => saga.handle("unknown", { id: "ticket-1" }),
      /does not handle event "unknown"/,
    );
  });
});
