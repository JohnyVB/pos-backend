import { Request, Response } from "express";
import { pool } from "../config/postgresql.config";

export const movement = async (req: Request, res: Response) => {
  const { product_id, quantity, type, reference } = req.body;
  const { store_id } = req.params;
  try {
    await pool.query(
      `INSERT INTO inventory_movements
      (product_id, movement_type, quantity, reference, store_id)
      VALUES ($1,$2,$3,$4,$5)`,
      [product_id, type, quantity, reference, store_id]
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
    res.status(200).json({ response: "success", message: "Movimiento registrado" });
  } catch (error) {
    console.error("Error registrando movimiento:", error);
    res.status(500).json({ response: "error", message: "Error interno del servidor" });
  }
};

export const loadInventory = async (req: Request, res: Response) => {
  try {
    const { store_id } = req.params;
    const { rows } = await pool.query(
      `SELECT i.id, i.product_id, p.name, p.barcode, i.quantity FROM inventory i
       INNER JOIN products p ON i.product_id = p.id
       WHERE i.store_id = $1 AND i.quantity > 0 ORDER BY i.id DESC`,
      [store_id],
    );
    res.status(200).json({ response: "success", inventory: rows });
  } catch (error) {
    console.error("Error cargando inventario:", error);
    res.status(500).json({ response: "error", message: "Error interno del servidor" });
  }
}