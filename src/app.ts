import express from "express";
import { middleware } from "./middleware/index.ts";
import { routes } from "./routes/index.ts";
import { config } from "./config/express.ts";

const createApp = () => {
  const app = express();

  app.use(express.json());

  config(app);
  routes(app);
  middleware(app);

  return app;
};

export { createApp };
