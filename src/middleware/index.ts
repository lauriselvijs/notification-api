import type { Express } from "express";
import { errorHandler, globalErrorHandler } from "./errors.ts";

export const middleware = (app: Express) => {
  app.use(globalErrorHandler);
  app.use(errorHandler);
};
