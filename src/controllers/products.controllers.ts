import { Request, Response } from "express";
import { pool } from "../config/postgresql.config";

// Listar productos activos
export const getProducts = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT * FROM products WHERE active = true",
    );
    res.status(200).json({ response: "success", products: result.rows });
  } catch (err: any) {
    res.status(500).json({ response: "error", message: err.message });
  }
};

// Crear producto
export const createProduct = async (req: Request, res: Response) => {
  const { name, barcode, price, vat, category_id } = req.body;
  try {

    // crear el producto en la base de datos
    const result = await pool.query(
      `INSERT INTO products (name, barcode, price, vat, category_id, active)
       VALUES ($1,$2,$3,$4,$5,true)
       RETURNING *`,
      [name, barcode, price, vat, category_id],
    );

    // agregar el producto al inventario con cantidad 0
    await pool.query(
      `INSERT INTO inventory (product_id, quantity)
       VALUES ($1, 0)`,
      [result.rows[0].id],
    );

    res.status(201).json({ response: "success", product: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ response: "error", message: err.message });
  }
};

// Editar producto
export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, barcode, price, vat, category_id } = req.body;
  try {
    const result = await pool.query(
      `UPDATE products SET name=$1, barcode=$2, price=$3, vat=$4, category_id=$5
       WHERE id=$6 RETURNING *`,
      [name, barcode, price, vat, category_id, id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ response: "error", message: "Product not found" });
    }
    res.status(200).json({ response: "success", product: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ response: "error", message: err.message });
  }
};

// Eliminar producto (marcar como inactivo)
export const deleteProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "UPDATE products SET active=false WHERE id=$1 RETURNING *",
      [id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ response: "error", message: "Product not found" });
    }
    res.status(200).json({ response: "success", product: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ response: "error", message: err.message });
  }
};

export const searchProductByQuery = async (req: Request, res: Response) => {
  const { query } = req.params;
  try {
    const result = await pool.query(
      `SELECT p.*, i.quantity as inventory_quantity FROM products p 
       INNER JOIN inventory i ON p.id = i.product_id
       WHERE p.active = true AND (p.name ILIKE $1 OR p.barcode ILIKE $1)`,
      [`%${query}%`]
    );
    res.status(200).json({ response: "success", product: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ response: "error", message: err.message });
  }
};

export const getProductByBarcode = async (req: Request, res: Response) => {
  const { barcode } = req.params
  try {
    const result = await pool.query(
      `SELECT p.id, p.name, p.barcode, p.price, p.vat, i.quantity AS stock
        FROM products p
        JOIN inventory i ON p.id = i.product_id
        WHERE p.barcode = $1 AND p.active = true;
      `,
      [barcode]
    )
    res.status(200).json({ response: "success", product: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ response: "error", message: err.message });
  }
}