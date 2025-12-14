import type { NextFunction, Request, Response } from "express";
import HttpError from "../errors/HttpError.ts";
import { StatusCodes } from "http-status-codes";

export const globalErrorHandler = (
  err: Error,
  _req: Request,
  _res: Response,
  next: NextFunction
) => {
  const error = new HttpError(err.message, StatusCodes.INTERNAL_SERVER_ERROR);

  next(error);
};
