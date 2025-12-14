import express from "express";
import { middleware } from "./middleware/index.ts";
import { routes } from "./routes/index.ts";
import { config } from "./config/express.ts";
import { ticketConsumerHandler } from "./consumers/ticketConsumer.ts";
import { startTicketConsumer } from "./config/rabbit.ts";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

config(app);
routes(app);
middleware(app);

await startTicketConsumer(ticketConsumerHandler);

app.listen(PORT, () => {
  console.log(`🚀 API running on http://localhost:${PORT}`);
});
