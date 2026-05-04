import { createApp } from "./app.ts";
import {
  handleTicketIntegrationEventUseCase,
  inboxEventRepository,
} from "./container.ts";
import { prisma } from "./infrastructure/database/prisma.ts";
import { startTicketIntegrationConsumer } from "./infrastructure/messaging/rabbit/rabbit.consumer.ts";

const PORT = Number(process.env.PORT) || 3000;

async function start() {
  try {
    await prisma.$connect();

    const app = createApp();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    void startTicketIntegrationConsumerWithRetry();
  } catch (error) {
    console.error("Failed to start application", error);
    process.exit(1);
  }
}

async function startTicketIntegrationConsumerWithRetry(): Promise<void> {
  try {
    await startTicketIntegrationConsumer(
      (eventType, payload) =>
        handleTicketIntegrationEventUseCase.execute(eventType, payload),
      inboxEventRepository,
    );
  } catch (error) {
    console.error("Failed to start RabbitMQ consumer", error);
  }
}

start();
