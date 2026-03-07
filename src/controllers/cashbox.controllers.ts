import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { pool } from "../config/postgresql.config";

export const openCashBox = async (req: AuthRequest, res: Response) => {
  const { openingAmount } = req.body;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      "INSERT INTO cash_boxes (opened_at, opening_amount, user_id) VALUES (NOW(), $1, $2) RETURNING *",
      [openingAmount, userId],
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const closeCashBox = async (req: AuthRequest, res: Response) => {
  const { closingAmount, cashBoxId } = req.body;
  try {
    const result = await pool.query(
      "UPDATE cash_boxes SET closed_at=NOW(), closing_amount=$1 WHERE id=$2 RETURNING *",
      [closingAmount, cashBoxId],
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
