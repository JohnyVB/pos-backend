import bcrypt from "bcrypt";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { envConfig } from "../config/environment.config";
import { pool } from "../config/postgresql.config";

const jwt_secret = envConfig.jwt_secret!;

// Login
export const login = async (req: Request, res: Response) => {
  const { user, password } = req.body;
  try {
    const result = await pool.query(
      `SELECT * FROM users 
        WHERE (username = $1 OR email = $1)
        AND active = true
      `,
      [user],
    );
    if (result.rows.length === 0) {
      return res
        .status(400)
        .json({ response: "error", message: "Usuario no encontrado" });
    }

    const userData = result.rows[0];
    const match = await bcrypt.compare(password, userData.password);

    if (!match) {
      return res
        .status(400)
        .json({ response: "error", message: "Contraseña incorrecta" });
    }

    const token = jwt.sign({ id: userData.id, role: userData.role }, jwt_secret, {
      expiresIn: "12h",
    });

    return res.status(200).json({
      response: "success",
      token,
      user: {
        id: userData.id,
        name: userData.name,
        username: userData.username,
        email: userData.email,
        store_id: userData.store_id,
        role: userData.role,
      },
    });
  } catch (err: any) {
    console.log(err);
    res.status(500).json({
      response: "error",
      message: err.message,
    });
  }
};

// autentificación de token
export const verifyToken = (req: Request, res: Response, next: any) => {
  const bodyToken = req.body?.token;
  const authHeader = req.headers.authorization;
  const token = bodyToken || (authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : undefined);

  if (!token) {
    return res
      .status(401)
      .json({ response: "error", message: "No token provided" });
  }

  jwt.verify(token, jwt_secret, (err: any) => {
    if (err) {
      return res
        .status(401)
        .json({ response: "error", message: "Invalid token" });
    }

    return res.status(200).json({ response: "success", message: "Token is valid" });
  });
}
