import type { Express } from "express";
import { route } from "../util/routes.ts";
import health from "./health.ts";

export const routes = (app: Express) => {
  app.use(route("/health"), health);
};
