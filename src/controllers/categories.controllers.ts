import { Request, Response } from "express";
import { pool } from "../config/postgresql.config";

export const getCategories = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT * FROM categories WHERE active = true ORDER BY created_at DESC",
    );
    res.status(200).json({ response: "success", categories: result.rows });
  } catch (err: any) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ response: "error", message: err.message });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  const { name, description } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO categories (name, created_at, description, active) VALUES ($1, NOW(), $2, true) RETURNING *",
      [name, description],
    );
    res.status(201).json({ response: "success", category: result.rows[0] });
  } catch (err: any) {
    console.error("Error creating category:", err);
    res.status(500).json({ response: "error", message: err.message });
  }
};

export const deactivateCategory = async (req: Request, res: Response) => {
  const { id } = req.body;
  try {
    await pool.query("UPDATE categories SET active = false WHERE id = $1", [
      id,
    ]);
    res.status(200).json({ response: "success" });
  } catch (err: any) {
    console.error("Error deactivating category:", err);
    res.status(500).json({ response: "error", message: err.message });
  }
};
