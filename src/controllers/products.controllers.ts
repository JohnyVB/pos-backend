import { AuthRequest } from "../interfaces/auth.interface";
import { Request, Response } from "express";
import { pool } from "../config/postgresql.config";

export const getProducts = async (req: AuthRequest, res: Response) => {
  const { user } = req;
  const { store_id } = req.params as { store_id: string };
  const { vat, min_stock, category_id, sale_type, page = 1, limit = 10 } = req.body;

  const offset = (Number(page) - 1) * Number(limit);

  let finalStoreId: string | null = null;
  if (user?.role !== "superadmin") {
    finalStoreId = store_id || null;
  } else {
    finalStoreId = user.store_id;
  }

  try {
    const result = await pool.query(
      `SELECT
            p.id, p.name, p.barcode, p.price, p.cost_price, p.vat, p.sale_type,
            p.category_id, p.min_stock, p.active, p.store_id, p.created_at,
            c.name AS category_name, s.name AS store_name, i.quantity AS stock
        FROM public.products p
        JOIN public.categories c ON p.category_id = c.id
        JOIN public.stores s ON p.store_id = s.id
        LEFT JOIN public.inventory i ON p.id = i.product_id AND i.store_id = p.store_id
        WHERE p.active = true
          AND ($1::uuid IS NULL OR p.store_id = $1)
          AND ($2::numeric IS NULL OR p.vat = $2)
          AND ($3::numeric IS NULL OR p.min_stock = $3)
          AND ($4::integer IS NULL OR p.category_id = $4)
          AND ($5::text IS NULL OR p.sale_type = $5)
        ORDER BY p.id DESC
        LIMIT $6 OFFSET $7`,
      [finalStoreId, vat, min_stock, category_id, sale_type, limit, offset],
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) as total
       FROM public.products p
       WHERE p.active = true
         AND ($1::uuid IS NULL OR p.store_id = $1)
         AND ($2::numeric IS NULL OR p.vat = $2)
         AND ($3::numeric IS NULL OR p.min_stock = $3)
         AND ($4::integer IS NULL OR p.category_id = $4)
         AND ($5::text IS NULL OR p.sale_type = $5)`,
      [finalStoreId, vat, min_stock, category_id, sale_type]
    );

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / Number(limit));

    res.status(200).json({
      response: "success",
      products: result.rows,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages
      }
    });
  } catch (err: any) {
    res.status(500).json({ response: "error", message: err.message });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  const { store_id } = req.params;
  const { name, barcode, price, vat, category_id, sale_type, cost_price } = req.body;
  try {
    // crear el producto en la base de datos
    const result = await pool.query(
      `INSERT INTO products (name, barcode, price, vat, category_id, sale_type, cost_price, active, store_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,true,$8)
       RETURNING *`,
      [name, barcode, price, vat, category_id, sale_type, cost_price, store_id],
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

export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, barcode, price, vat, category_id, sale_type, min_stock, cost_price } = req.body;
  try {
    const result = await pool.query(
      `UPDATE products SET name=$1, barcode=$2, price=$3, vat=$4, category_id=$5, sale_type=$6, min_stock=$7, cost_price=$8
       WHERE id=$9 RETURNING *`,
      [name, barcode, price, vat, category_id, sale_type, min_stock, cost_price, id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ response: "error", message: "Product not found" });
    }
    res.status(200).json({ response: "success", product: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ response: "error", message: err.message });
  }
};

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

export const searchProductByQuery = async (req: AuthRequest, res: Response) => {
  const { query, store_id } = req.params;
  const { user } = req;
  let storeId = null;

  if (user && user.role === "superadmin") {
    storeId = null
  } else {
    storeId = store_id
  }
  try {
    const result = await pool.query(`
      SELECT p.*, COALESCE(i.quantity, 0) as quantity, s.name as store_name 
        FROM products p 
        LEFT JOIN inventory i ON p.id = i.product_id
        INNER JOIN stores s ON p.store_id = s.id
        WHERE p.active = true 
          AND ($2::uuid IS NULL OR p.store_id = $2) 
          AND (p.name ILIKE $1 OR p.barcode ILIKE $1)
       `, [`%${query}%`, storeId]
    );
    res.status(200).json({ response: "success", product: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ response: "error", message: err.message });
  }
};

export const getProductByBarcode = async (req: Request, res: Response) => {
  const { barcode, store_id } = req.params
  try {
    const result = await pool.query(`
      SELECT 
        p.id, 
        p.name, 
        p.barcode, 
        p.price, 
        p.vat, 
        p.sale_type, 
        p.cost_price,
        i.quantity AS stock
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

export const getProductsWithLowStock = async (req: AuthRequest, res: Response) => {
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
            p.id,
            p.name,
            p.barcode,
            p.min_stock,
            COALESCE(i.quantity, 0) AS current_stock,
            c.name AS category_name,
            s.name AS store_name
        FROM public.products p
        JOIN public.categories c ON p.category_id = c.id
        JOIN public.stores s ON p.store_id = s.id
        LEFT JOIN public.inventory i ON p.id = i.product_id AND i.store_id = p.store_id
        WHERE p.active = true
          AND ($1::uuid IS NULL OR p.store_id = $1)
          AND COALESCE(i.quantity, 0) <= p.min_stock
        ORDER BY
            s.name ASC,
            (COALESCE(i.quantity, 0) / NULLIF(p.min_stock, 0)) ASC;
      `,
      [storeId]
    )
    res.status(200).json({ response: "success", products: result.rows });
  } catch (err: any) {
    res.status(500).json({ response: "error", message: err.message });
  }
}