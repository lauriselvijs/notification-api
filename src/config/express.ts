import express from "express";
import type { Express } from "express";
import { logger } from "../middleware/logging.ts";

export const config = (app: Express) => {
  app.use(express.json());
  app.use(logger);
};
