import { Response } from "express";
import { pool } from "../config/postgresql.config";
import { AuthRequest } from "../interfaces/auth.interface";

export const openCashBoxSession = async (req: AuthRequest, res: Response) => {
  const { opening_amount, pos_terminal_id } = req.body;
  const userId = req.user?.id;
  const { store_id } = req.params;
  try {
    const result = await pool.query(
      `INSERT INTO cash_box_sessions (opened_at, opening_amount, user_id, pos_terminal_id, status, store_id) 
      VALUES (NOW(), $1, $2, $3, 'OPEN', $4) 
      RETURNING id as session_id, *
      `,
      [opening_amount, userId, pos_terminal_id, store_id],
    );
    res.status(200).json({ response: "success", cashBoxSession: result.rows[0] });
  } catch (err: any) {
    console.log(err)
    res.status(500).json({ response: "error", error: err.message });
  }
};

export const closeCashBoxSession = async (req: AuthRequest, res: Response) => {
  const { cash_box_id, closing_amount } = req.body;
  try {
    const result = await pool.query(
      "UPDATE cash_box_sessions SET closed_at=NOW(), closing_amount=$1, status='CLOSED' WHERE id=$2 RETURNING id as session_id, *",
      [closing_amount, cash_box_id],
    );
    res.status(200).json({ response: "success", cashBoxSession: result.rows[0] });
  } catch (err: any) {
    console.log(err)
    res.status(500).json({ response: "error", error: err.message });
  }
};

export const getCashBoxSessions = async (req: AuthRequest, res: Response) => {
  const { store_id } = req.params;
  const { pos_terminal_id, start_date, end_date, user_id } = req.body;
  try {
    const result = await pool.query(`
        SELECT 
            cbs.id AS session_id, 
            cbs.opening_amount, 
            cbs.closing_amount, 
            cbs.opened_at, 
            cbs.closed_at, 
            cbs.status AS session_status,

            -- Datos del Usuario (Cajero)
            u.id AS user_id, 
            u.name AS name, 
            u.username AS user_name,

            -- Datos de la Terminal (Caja Física)
            pt.id AS pos_terminal_id,
            pt.name AS terminal_name,
            
            -- OPCIONAL: Un conteo rápido de cuántas ventas se hicieron en ese turno
            (SELECT COUNT(*) FROM public.sales s WHERE s.session_id = cbs.id) AS total_sales_count,
            (SELECT SUM(total) FROM public.sales s WHERE s.session_id = cbs.id) AS total_collected
        FROM public.cash_box_sessions cbs
        LEFT JOIN public.users u ON cbs.user_id = u.id
        LEFT JOIN public.pos_terminals pt ON cbs.pos_terminal_id = pt.id
        WHERE 
            -- Filtros dinámicos
            ($1::int IS NULL OR cbs.pos_terminal_id = $1)
            AND ($2::timestamp IS NULL OR cbs.opened_at >= $2)
            AND ($3::timestamp IS NULL OR cbs.opened_at <= $3)
            AND ($4::int IS NULL OR cbs.user_id = $4)
            AND cbs.store_id = $5
        ORDER BY cbs.opened_at DESC;
      `,
      [pos_terminal_id, start_date, end_date, user_id, store_id]
    );
    res.status(200).json({ response: "success", cashBoxSessions: result.rows });
  } catch (err: any) {
    console.log(err)
    res.status(500).json({ response: "error", error: err.message });
  }
};