import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UnauthenticatedError, NotFoundError } from "../errors";
import UserV1, { IUserV1 } from "../models/UserV1";

export interface AuthenticatedRequestV1 extends Request {
  user: {
    id: string;
    phone: string;
  };
  io?: any;
}

const authV1 = async (
  req: AuthenticatedRequestV1,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    throw new UnauthenticatedError("Authentication invalid");
  }
  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as {
      id: string;
      phone: string;
    };
    req.user = { id: payload.id, phone: payload.phone };
    (req as any).socket = req.io;

    const user = await UserV1.findById(payload.id);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    next();
  } catch (error) {
    throw new UnauthenticatedError("Authentication invalid");
  }
};

export default authV1;
