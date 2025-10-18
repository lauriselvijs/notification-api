import express from "express";
import { middleware } from "./middleware/index.ts";
import { routes } from "./routes/index.ts";
import { config } from "./config/express.ts";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

config(app);
routes(app);
middleware(app);

app.listen(PORT, () => {
  console.log(`🚀 API running on http://localhost:${PORT}`);
});
