import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import HttpError from "../errors/HttpError.ts";

export const globalErrorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message });
  }

  return res
    .status(StatusCodes.INTERNAL_SERVER_ERROR)
    .json({ message: err.message || "Internal Server Error" });
};
