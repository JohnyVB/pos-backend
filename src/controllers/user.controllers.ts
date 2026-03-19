import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { pool } from "../config/postgresql.config";

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
      "INSERT INTO users (name, username, email, password, role, store_id) VALUES ($1, $2, $3, $4, $5, $6)",
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

export const getUsers = async (req: Request, res: Response) => {
  const { store_id } = req.params;
  console.log(store_id);
  try {
    const result = await pool.query(
      `SELECT * FROM public.users
        WHERE active = true
        AND ($1::uuid IS NULL OR store_id = $1);`,
      [store_id]);
    console.log(result);
    res.status(200).json({
      response: "success",
      users: result.rows,
    });
  } catch (err: any) {
    console.log(err);
    res.status(500).json({ response: "error", message: err.message });
  }
}