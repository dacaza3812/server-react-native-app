import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";

interface CustomError {
  statusCode: number;
  msg: string;
}

interface ErrorWithStatus extends Error {
  statusCode?: number;
  code?: number;
  keyValue?: Record<string, any>;
  errors?: Record<string, { message: string }>;
  name: string;
  value?: any;
}

const errorHandlerMiddleware = (
  err: ErrorWithStatus,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let customError: CustomError = {
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    msg: err.message || "Something went wrong try again later",
  };

  if (err.name === "ValidationError" && err.errors) {
    customError.msg = Object.values(err.errors)
      .map((item) => item.message)
      .join(",");
    customError.statusCode = 400;
  }
  if (err.code && err.code === 11000 && err.keyValue) {
    customError.msg = `Duplicate value entered for ${Object.keys(
      err.keyValue
    )} field, please choose another value`;
    customError.statusCode = 400;
  }
  if (err.name === "CastError") {
    customError.msg = `No item found with id : ${err.value}`;
    customError.statusCode = 404;
  }

  res.status(customError.statusCode).json({ msg: customError.msg });
};

export default errorHandlerMiddleware;
