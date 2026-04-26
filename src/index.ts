import { createApp } from "./app.ts";
import { handleTicketIntegrationEventUseCase } from "./container.ts";
import { prisma } from "./infrastructure/database/prisma.ts";
import { closeRabbit } from "./infrastructure/messaging/rabbit/rabbit.connection.ts";
import { startTicketIntegrationConsumer } from "./infrastructure/messaging/rabbit/rabbit.consumer.ts";

const PORT = Number(process.env.PORT) || 3000;

async function start() {
  try {
    await prisma.$connect();

    await startTicketIntegrationConsumer((eventType, payload) =>
      handleTicketIntegrationEventUseCase.execute(eventType, payload),
    );

    const app = createApp();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start application", error);
    process.exit(1);
  }
}

start();
