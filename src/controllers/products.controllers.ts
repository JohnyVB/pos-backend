import { Request, Response } from "express";
import { pool } from "../config/postgresql.config";

// Listar productos activos
export const getProducts = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT * FROM products WHERE active = true",
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Crear producto
export const createProduct = async (req: Request, res: Response) => {
  const { name, barcode, price, vat, categoryId } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO products (name, barcode, price, vat, category_id, active)
       VALUES ($1,$2,$3,$4,$5,true)
       RETURNING *`,
      [name, barcode, price, vat, categoryId],
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getProductByBarcode = async (req: Request, res: Response) => {
  const { barcode } = req.params;

  const result = await pool.query("SELECT * FROM products WHERE barcode=$1", [
    barcode,
  ]);

  if (result.rows.length === 0) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.json(result.rows[0]);
};
