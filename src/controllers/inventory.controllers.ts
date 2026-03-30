import { Request, Response } from "express";
import { pool } from "../config/postgresql.config";
import { AuthRequest } from "../interfaces/auth.interface";

export const movement = async (req: Request, res: Response) => {
  const { product_id, quantity, type, reference, cost_price } = req.body;
  const { store_id } = req.params;

  console.log({ product_id, quantity, type, reference, cost_price, store_id });

  try {
    await pool.query(
      `INSERT INTO inventory_movements
      (product_id, movement_type, quantity, reference, store_id, unit_cost)
      VALUES ($1,$2,$3,$4,$5,$6)`,
      [product_id, type, quantity, reference, store_id, cost_price]
    )

    if (type === "IN") {
      await pool.query(
        `UPDATE inventory
         SET quantity = quantity + $1
         WHERE product_id = $2`,
        [quantity, product_id]
      )

    } else {
      await pool.query(
        `UPDATE inventory
         SET quantity = quantity - $1
         WHERE product_id = $2`,
        [quantity, product_id]
      )
    }
    await pool.query(
      `UPDATE products
       SET cost_price = $1
       WHERE id = $2`,
      [cost_price, product_id]
    )
    res.status(200).json({ response: "success", message: "Movimiento registrado" });
  } catch (error) {
    console.error("Error registrando movimiento:", error);
    res.status(500).json({ response: "error", message: "Error interno del servidor" });
  }
};

export const loadInventory = async (req: AuthRequest, res: Response) => {
  const { store_id } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const { user } = req;
  let storeId = null;

  if (user && user.role === "superadmin") {
    storeId = null
  } else {
    storeId = store_id
  }

  const offset = (Number(page) - 1) * Number(limit);

  try {
    const { rows } = await pool.query(
      `SELECT
          i.id,
          i.product_id,
          p.name,
          p.barcode,
          p.cost_price,
          i.quantity,
          i.store_id,
          s.name AS store_name
      FROM public.inventory i
      INNER JOIN public.products p ON i.product_id = p.id
      INNER JOIN public.stores s ON i.store_id = s.id
      WHERE i.quantity > 0
        AND ($1::uuid IS NULL OR i.store_id = $1)
      ORDER BY s.name ASC, i.id DESC
      LIMIT $2 OFFSET $3
      `, [storeId, limit, offset]);

    const totalResult = await pool.query(`
      SELECT COUNT(*) as total
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      JOIN stores s ON i.store_id = s.id
      WHERE i.quantity > 0
        AND ($1::uuid IS NULL OR i.store_id = $1)
      `, [storeId]);

    const total = parseInt(totalResult.rows[0].total);
    const totalPages = Math.ceil(total / Number(limit));

    res.status(200).json({
      response: "success",
      inventory: rows,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages
      }
    });
  } catch (error) {
    console.error("Error cargando inventario:", error);
    res.status(500).json({ response: "error", message: "Error interno del servidor" });
  }
}