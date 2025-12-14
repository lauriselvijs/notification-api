import type { ChannelModel, ConfirmChannel, ConsumeMessage } from "amqplib";
import amqplib from "amqplib";
import { checkEnv } from "../util/variables.ts";
import { ticketRoutingKeys } from "../enums/tickets.ts";
import type { Ticket, TicketRoutingKey } from "../types/tickets.ts";

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

let rabbitConn: ChannelModel | null = null;
let rabbitChannel: ConfirmChannel | null = null;

let connecting: Promise<void> | null = null;

export const connectToRabbit = async (): Promise<void> => {
  if (connecting) {
    await connecting;
  }

  connecting = (async () => {
    const conn = await amqplib.connect(URL);
    const ch = await conn.createConfirmChannel();

    conn.on("error", (err) => console.error("RabbitMQ connection error:", err));
    conn.on("close", () => {
      console.warn("RabbitMQ connection closed");
      rabbitConn = null;
      rabbitChannel = null;
    });

    await ch.assertExchange(EXCHANGE, "topic", { durable: true });

    rabbitConn = conn;
    rabbitChannel = ch;
  })();

  await connecting;

  connecting = null;
};

export const startTicketConsumer = async (
  onMessage: (
    routingKey: TicketRoutingKey,
    payload: Ticket
  ) => Promise<void> | void
): Promise<void> => {
  if (!rabbitChannel) {
    await connectToRabbit();
  }

  if (!rabbitChannel) {
    throw new Error("RabbitMQ channel not available after reconnect");
  }

  const q = await rabbitChannel.assertQueue("", {
    exclusive: true,
    autoDelete: true,
  });

  for (const key of Object.values(ticketRoutingKeys)) {
    await rabbitChannel.bindQueue(q.queue, EXCHANGE, key);
    console.log(`🔗 Bound queue "${q.queue}" → "${EXCHANGE}" with "${key}"`);
  }

  console.log(`👂 Waiting for messages in queue "${q.queue}"...`);

  rabbitChannel.consume(
    q.queue,
    async (msg: ConsumeMessage | null) => {
      if (!msg || !rabbitChannel) return;
      const routingKey = msg.fields.routingKey as TicketRoutingKey;
      const body = msg.content.toString();

      try {
        const parsed = JSON.parse(body);
        console.log(`📥 [${routingKey}]`, parsed);
        await onMessage(routingKey, parsed);
        rabbitChannel.ack(msg);
      } catch (err) {
        console.error("❌ Failed to process message:", err);
        rabbitChannel.nack(msg, false, false);
      }
    },
    { noAck: false }
  );
};

export const getRabbitConnection = (): ChannelModel => {
  if (!rabbitConn) throw new Error("❌ RabbitMQ connection not established");
  return rabbitConn;
};

export const getRabbitChannel = (): ConfirmChannel => {
  if (!rabbitChannel) throw new Error("❌ RabbitMQ channel not established");
  return rabbitChannel;
};

export const closeRabbit = async (): Promise<void> => {
  try {
    if (rabbitChannel) await rabbitChannel.close();
    if (rabbitConn) await rabbitConn.close();
  } finally {
    rabbitChannel = null;
    rabbitConn = null;
  }
};
