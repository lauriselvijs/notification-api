import type { Express } from "express";
import { logger } from "./logging.ts";

export const middleware = (app: Express) => {
  app.use(logger);
};
