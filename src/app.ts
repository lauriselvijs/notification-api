import express from "express";
import { configureExpress } from "./presentation/http/config/express.ts";
import { globalErrorHandler } from "./presentation/http/middleware/errors.ts";
import { middleware } from "./presentation/http/middleware/index.ts";
import { routes } from "./presentation/http/routes/index.ts";

const createApp = () => {
  const app = express();

  configureExpress(app);
  middleware(app);
  routes(app);

  app.use(globalErrorHandler);

  return app;
};

export { createApp };
