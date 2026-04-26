import { createApp } from "./app.ts";
import { handleTicketIntegrationEventUseCase } from "./container.ts";
import { startTicketIntegrationConsumer } from "./infrastructure/messaging/rabbit/rabbit.consumer.ts";

const PORT = Number(process.env.PORT) || 3000;

const app = createApp();

await startTicketIntegrationConsumer((eventType, payload) =>
  handleTicketIntegrationEventUseCase.execute(eventType, payload)
);

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
