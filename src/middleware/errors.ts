import type { NextFunction, Request, Response } from "express";
import HttpError from "../errors/HttpError.ts";
import { StatusCodes } from "http-status-codes";

export const errorHandler = (
  err: HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err.status) {
    return res.status(err.status).json({ message: err.message });
  }

  return res
    .status(StatusCodes.INTERNAL_SERVER_ERROR)
    .json({ message: err.message });
};

export const globalErrorHandler = (
  err: Error,
  _req: Request,
  _res: Response,
  next: NextFunction
) => {
  const error = new HttpError(err.message, StatusCodes.INTERNAL_SERVER_ERROR);

  next(error);
};
