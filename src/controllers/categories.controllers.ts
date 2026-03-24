import { Request, Response } from "express";
import { pool } from "../config/postgresql.config";
import { AuthRequest } from "../interfaces/auth.interface";

export const getCategories = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  const { store_id } = req.params as { store_id: string };

  let finalStoreId: string | null = null;
  if (user?.role !== "superadmin") {
    finalStoreId = store_id || null;
  } else {
    finalStoreId = user.store_id;
  }

  try {
    const result = await pool.query(`
      SELECT 
        c.id,
        c.name,
        c.description,
        c.created_at,
        c.store_id,
        s.name AS store_name,
        c.active
      FROM categories c
      JOIN stores s ON c.store_id = s.id
      WHERE ($1::uuid IS NULL OR c.store_id = $1::uuid) AND c.active = true
      ORDER BY c.created_at DESC
      `,
      [store_id],
    );
    res.status(200).json({ response: "success", categories: result.rows });
  } catch (err: any) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ response: "error", message: err.message });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  const { name, description } = req.body;
  const { store_id } = req.params;
  try {
    const result = await pool.query(
      "INSERT INTO categories (name, created_at, description, active, store_id) VALUES ($1, NOW(), $2, true, $3) RETURNING *",
      [name, description, store_id],
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
