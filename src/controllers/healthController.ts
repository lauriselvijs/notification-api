import type { Request, Response } from "express";

export const getHealthStatus = (_req: Request, res: Response) =>
  res.json({
    ok: true,
    service: process.env.SERVICE_NAME,
    timestamp: new Date().toISOString(),
  });
