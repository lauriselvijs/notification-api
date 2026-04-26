import type { NextFunction, Request, Response } from "express";

export const logger = (req: Request, _: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
};
