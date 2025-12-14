import type { Express } from "express";
import { globalErrorHandler } from "./errors.ts";

export const middleware = (app: Express) => {
  app.use(globalErrorHandler);
};
