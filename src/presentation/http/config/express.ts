import express from "express";
import type { Express } from "express";

export const configureExpress = (app: Express) => {
  app.use(express.json());
};
