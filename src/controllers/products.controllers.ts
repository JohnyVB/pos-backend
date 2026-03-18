import { Request, Response } from "express";
import { pool } from "../config/postgresql.config";

// Listar productos activos
export const getProducts = async (req: Request, res: Response) => {
  try {
    const { store_id } = req.params;
    const result = await pool.query(
      "SELECT * FROM products WHERE store_id = $1 AND active = true ORDER BY id DESC",
      [store_id],
    );
    res.status(200).json({ response: "success", products: result.rows });
  } catch (err: any) {
    res.status(500).json({ response: "error", message: err.message });
  }
};

// Crear producto
export const createProduct = async (req: Request, res: Response) => {
  const { store_id } = req.params;
  const { name, barcode, price, vat, category_id, sale_type } = req.body;
  try {
    // crear el producto en la base de datos
    const result = await pool.query(
      `INSERT INTO products (name, barcode, price, vat, category_id, sale_type, active, store_id)
       VALUES ($1,$2,$3,$4,$5,$6,true,$7)
       RETURNING *`,
      [name, barcode, price, vat, category_id, sale_type, store_id],
    );

    // agregar el producto al inventario con cantidad 0
    await pool.query(
      `INSERT INTO inventory (product_id, quantity, store_id)
       VALUES ($1, 0, $2)`,
      [result.rows[0].id, store_id],
    );

    res.status(201).json({ response: "success", product: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ response: "error", message: err.message });
  }
};

// Editar producto
export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, barcode, price, vat, category_id, sale_type } = req.body;
  try {
    const result = await pool.query(
      `UPDATE products SET name=$1, barcode=$2, price=$3, vat=$4, category_id=$5, sale_type=$6
       WHERE id=$7 RETURNING *`,
      [name, barcode, price, vat, category_id, sale_type, id],
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
  const { query, store_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT p.*, i.quantity as inventory_quantity FROM products p 
       INNER JOIN inventory i ON p.id = i.product_id
       WHERE p.active = true AND p.store_id = $2 AND (p.name ILIKE $1 OR p.barcode ILIKE $1)`,
      [`%${query}%`, store_id]
    );
    res.status(200).json({ response: "success", product: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ response: "error", message: err.message });
  }
};

export const getProductByBarcode = async (req: Request, res: Response) => {
  const { barcode, store_id } = req.params
  try {
    const result = await pool.query(
      `SELECT p.id, p.name, p.barcode, p.price, p.vat, p.sale_type, i.quantity AS stock
        FROM products p
        JOIN inventory i ON p.id = i.product_id
        WHERE p.barcode = $1 AND p.active = true AND p.store_id = $2;
      `,
      [barcode, store_id]
    )
    res.status(200).json({ response: "success", product: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ response: "error", message: err.message });
  }
}