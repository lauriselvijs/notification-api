import { ticketConsumerHandler } from "./consumers/ticketConsumer.ts";
import { startTicketConsumer } from "./config/rabbit.ts";
import { createApp } from "./app.ts";

const PORT = Number(process.env.PORT) || 3000;

const app = createApp();

await startTicketConsumer(ticketConsumerHandler);

app.listen(PORT, () => {
  console.log(`🚀 API running on http://localhost:${PORT}`);
});
