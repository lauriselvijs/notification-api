import type { Express } from "express";
import health from "./health.ts";
import { route } from "./util/routes.ts";

export const routes = (app: Express) => {
  app.use(route("/health"), health);
};
