import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { pool } from "../config/postgresql.config";
import { AuthRequest } from "../interfaces/auth.interface";

// Registrar usuario
export const register = async (req: Request, res: Response) => {
  const { name, username, email, password, role, store_id } = req.body;
  let userEmail = "";
  if (!email || email === "") {
    userEmail = "no-email@" + username + ".com";
  } else {
    userEmail = email;
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (name, username, email, password, role, store_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [name, username, userEmail, hash, role, store_id],
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

export const getUsers = async (req: AuthRequest, res: Response) => {
  const { store_id } = req.params;
  const { user } = req;
  let storeId = null;

  if (user && user.role === "superadmin") {
    storeId = null
  } else {
    storeId = store_id
  }

  try {
    const result = await pool.query(
      `SELECT
          u.id,
          u.name,
          u.username,
          u.email,
          u.role,
          u.store_id,
          s.name AS store_name,
          u.active,
          u.created_at
      FROM public.users u
      LEFT JOIN public.stores s ON u.store_id = s.id
      WHERE ($1::uuid IS NULL OR u.store_id = $1)
      ORDER BY u.created_at DESC;`,
      [storeId]);
    res.status(200).json({
      response: "success",
      users: result.rows,
    });
  } catch (err: any) {
    console.log(err);
    res.status(500).json({ response: "error", message: err.message });
  }
};

export const toggleUserStatus = async (req: Request, res: Response) => {
  const { user_id } = req.params;
  const { active } = req.body;
  try {
    const result = await pool.query(
      "UPDATE users SET active = $1 WHERE id = $2 RETURNING *",
      [active, user_id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ response: "error", message: "Usuario no encontrado" });
    }
    res.status(200).json({
      response: "success",
      user: result.rows[0],
    });
  } catch (err: any) {
    console.log(err);
    res.status(500).json({ response: "error", message: err.message });
  }
};