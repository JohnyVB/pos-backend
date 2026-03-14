import { Response } from "express";
import { pool } from "../config/postgresql.config";
import { AuthRequest } from "../middleware/auth.middleware";

export const openCashBox = async (req: AuthRequest, res: Response) => {
  const { opening_amount } = req.body;
  const userId = req.user.id;
  try {
    const result = await pool.query(
      "INSERT INTO cash_box_sessions (opened_at, opening_amount, user_id, status) VALUES (NOW(), $1, $2, 'OPEN') RETURNING *",
      [opening_amount, userId],
    );
    res.status(200).json({ response: "success", cashBox: result.rows[0] });
  } catch (err: any) {
    console.log(err)
    res.status(500).json({ response: "error", error: err.message });
  }
};

export const closeCashBox = async (req: AuthRequest, res: Response) => {
  const { cash_box_id, closing_amount } = req.body;
  try {
    const result = await pool.query(
      "UPDATE cash_box_sessions SET closed_at=NOW(), closing_amount=$1, status='CLOSED' WHERE id=$2 RETURNING *",
      [closing_amount, cash_box_id],
    );
    res.status(200).json({ response: "success", cashBox: result.rows[0] });
  } catch (err: any) {
    console.log(err)
    res.status(500).json({ response: "error", error: err.message });
  }
};

export const getCashBoxes = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`
        SELECT cbs.id, cbs.user_id, u.name as user_name, cbs.opening_amount, cbs.closing_amount, cbs.opened_at, cbs.closed_at, cbs.status
        FROM cash_box_sessions cbs
        INNER JOIN users u ON cbs.user_id = u.id
        ORDER BY cbs.id DESC
      `);
    res.status(200).json({ response: "success", cashBoxes: result.rows });
  } catch (err: any) {
    console.log(err)
    res.status(500).json({ response: "error", error: err.message });
  }
};
