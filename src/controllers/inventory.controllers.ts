import { Request, Response } from "express";
import { pool } from "../config/postgresql.config";

export const movement = async (req: Request, res: Response) => {
  const { product_id, quantity, type, reference } = req.body;

  try {
    await pool.query(
      `INSERT INTO inventory_movements
      (product_id, movement_type, quantity, reference)
      VALUES ($1,$2,$3,$4)`,
      [product_id, type, quantity, reference]
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