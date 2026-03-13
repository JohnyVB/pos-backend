import bcrypt from "bcrypt";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { envConfig } from "../config/environment.config";
import { pool } from "../config/postgresql.config";

const JWT_SECRET = envConfig.JWT_SECRET || "your_jwt_secret_key";

// Registrar usuario
export const register = async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role",
      [name, email, hash, role || "CASHIER"],
    );
    res.status(201).json({
      response: "success",
      user: result.rows[0],
    });
  } catch (err: any) {
    console.log(err);
    res.status(500).json({ response: "error", message: err.message });
  }
};

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

    const token = jwt.sign({ id: userData.id, role: userData.role }, JWT_SECRET, {
      expiresIn: "12h",
    });

    return res.status(200).json({
      response: "success",
      token,
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
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
  const { token } = req.body;

  if (!token) {
    return res
      .status(401)
      .json({ response: "error", message: "No token provided" });
  }

  jwt.verify(token, JWT_SECRET, (err: any) => {
    if (err) {
      return res
        .status(403)
        .json({ response: "error", message: "Invalid token" });
    } else {
      return res.status(200).json({ response: "success", message: "Token is valid" });
    }
  });
}
