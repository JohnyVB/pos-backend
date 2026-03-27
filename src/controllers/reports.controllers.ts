import { Response } from "express";
import { pool } from "../config/postgresql.config";
import { AuthRequest } from "../interfaces/auth.interface";

export const getTopProducts = async (req: AuthRequest, res: Response) => {
  const { store_id, start_date, end_date, limit = 10 } = req.body;
  const user = req.user;

  let finalStoreId = user?.role === "superadmin" ? (store_id || null) : user?.store_id;

  try {
    const result = await pool.query(`
      SELECT 
          p.id AS product_id,
          p.name AS product_name, 
          SUM(si.quantity)::int AS total_quantity,
          SUM(si.subtotal)::float AS total_revenue
      FROM public.sale_items si
      JOIN public.products p ON si.product_id = p.id
      JOIN public.sales s ON si.sale_id = s.id
      WHERE s.status = 'COMPLETED'
        AND ($1::uuid IS NULL OR s.store_id = $1)
        AND ($2::timestamp IS NULL OR s.created_at >= $2)
        AND ($3::timestamp IS NULL OR s.created_at <= $3)
      GROUP BY p.id, p.name
      ORDER BY total_quantity DESC
      LIMIT $4;
    `, [finalStoreId, start_date || null, end_date || null, limit]);

    res.status(200).json({ response: "success", topProducts: result.rows });
  } catch (err: any) {
    res.status(500).json({ response: "error", error: err.message });
  }
};