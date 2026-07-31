import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../interfaces/auth.interface";
import { User } from "../interfaces/user.interface";
import { envConfig } from "../config/environment.config";

const jwt_secret = envConfig.jwt_secret!;

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ response: "error", message: "No token provided" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, jwt_secret);
    req.user = decoded as User;
    next();
  } catch (err) {
    res.status(401).json({ response: "error", message: "Invalid token" });
  }
};
