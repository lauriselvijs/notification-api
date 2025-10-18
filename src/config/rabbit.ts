import amqplib, { ChannelModel, ConfirmChannel, ConsumeMessage } from "amqplib";
import { checkEnv } from "../util/variables.ts";
import { ticketRoutingKeys } from "../enums/tickets.ts";

const requiredEnvVars = [
  "RABBIT_HOST",
  "RABBIT_PORT",
  "RABBITMQ_DEFAULT_USER",
  "RABBITMQ_DEFAULT_PASS",
];
checkEnv(requiredEnvVars);

const HOST = process.env.RABBIT_HOST!;
const PORT = process.env.RABBIT_PORT!;
const USER = process.env.RABBITMQ_DEFAULT_USER!;
const PASS = process.env.RABBITMQ_DEFAULT_PASS!;
const URL = `amqp://${USER}:${PASS}@${HOST}:${PORT}`;
const EXCHANGE = "tickets";

let conn: ChannelModel | null = null;
let channel: ConfirmChannel | null = null;

export const connectToRabbit = async (): Promise<{
  conn: ChannelModel;
  ch: ConfirmChannel;
}> => {
  if (conn && channel) return { conn, ch: channel };

  conn = await amqplib.connect(URL);
  channel = await conn.createConfirmChannel();
  await channel.assertExchange(EXCHANGE, "topic", { durable: true });
  channel.prefetch(10);

  conn.on("error", (err) => console.error("RabbitMQ connection error:", err));
  conn.on("close", () => console.warn("RabbitMQ connection closed"));

  console.log(`✅ Connected to RabbitMQ and exchange "${EXCHANGE}" is ready.`);
  return { conn, ch: channel };
};

export const startTicketConsumer = async (
  onMessage: (routingKey: string, payload: unknown) => Promise<void> | void
): Promise<void> => {
  const { ch } = await connectToRabbit();
  const q = await ch.assertQueue("", { exclusive: true, autoDelete: true });

  for (const key of Object.values(ticketRoutingKeys)) {
    await ch.bindQueue(q.queue, EXCHANGE, key);
    console.log(`🔗 Bound queue "${q.queue}" → "${EXCHANGE}" with "${key}"`);
  }

  console.log(`👂 Waiting for messages in queue "${q.queue}"...`);

  ch.consume(
    q.queue,
    async (msg: ConsumeMessage | null) => {
      if (!msg) return;
      const routingKey = msg.fields.routingKey;
      const body = msg.content.toString();

      try {
        const parsed = JSON.parse(body);
        console.log(`📥 [${routingKey}]`, parsed);
        await onMessage(routingKey, parsed);
        ch.ack(msg);
      } catch (err) {
        console.error("❌ Failed to process message:", err);
        ch.nack(msg, false, false);
      }
    },
    { noAck: false }
  );
};

export const closeRabbit = async (): Promise<void> => {
  try {
    if (channel) await channel.close();
    if (conn) await (conn as any).close?.();
  } catch (err) {
    console.error("⚠️ Error closing RabbitMQ connection:", err);
  } finally {
    conn = null;
    channel = null;
  }
};
