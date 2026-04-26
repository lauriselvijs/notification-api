import amqplib from "amqplib";
import type { ChannelModel, ConfirmChannel } from "amqplib";
import { RABBIT_EXCHANGES } from "./rabbit.constants.ts";
import { rabbitConfig } from "./rabbit.config.ts";

let rabbitConn: ChannelModel | null = null;
let rabbitChannel: ConfirmChannel | null = null;
let connecting: Promise<void> | null = null;

export const connectToRabbit = async (): Promise<void> => {
  if (connecting) {
    await connecting;
    return;
  }

  if (rabbitConn && rabbitChannel) {
    return;
  }

  connecting = (async () => {
    const conn = await amqplib.connect(rabbitConfig.url);
    const ch = await conn.createConfirmChannel();

    conn.on("error", (err) => {
      console.error("RabbitMQ connection error:", err);
    });

    conn.on("close", () => {
      console.warn("RabbitMQ connection closed");
      rabbitConn = null;
      rabbitChannel = null;
    });

    await ch.assertExchange(RABBIT_EXCHANGES.TICKETS, "topic", {
      durable: true,
    });

    rabbitConn = conn;
    rabbitChannel = ch;
  })();

  try {
    await connecting;
  } finally {
    connecting = null;
  }
};

export const getRabbitConnection = (): ChannelModel => {
  if (!rabbitConn) {
    throw new Error("RabbitMQ connection not established");
  }

  return rabbitConn;
};

export const getRabbitChannel = (): ConfirmChannel => {
  if (!rabbitChannel) {
    throw new Error("RabbitMQ channel not established");
  }

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
