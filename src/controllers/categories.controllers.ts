import { Request, Response } from "express";
import { pool } from "../config/postgresql.config";

export const getCategories = async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM categories");
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  const { name } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO categories (name, created_at) VALUES ($1, NOW()) RETURNING *",
      [name],
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
