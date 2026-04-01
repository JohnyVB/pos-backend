import { Response } from "express";
import { pool } from "../config/postgresql.config";
import { AuthRequest } from "../interfaces/auth.interface";

export const getPromotions = async (req: AuthRequest, res: Response) => {
  const { store_id } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const user = req.user;
  let finalStoreId = user?.role === "superadmin" ? (store_id || null) : user?.store_id;

  const offset = (Number(page) - 1) * Number(limit);

  try {
    const result = await pool.query(`
      SELECT 
          pr.id,
          pr.name,
          pr.type,
          pr.discount_rate,
          pr.buy_qty,
          pr.pay_qty,
          pr.start_date,
          pr.end_date,
          (pr.active = true AND NOW() BETWEEN pr.start_date AND pr.end_date) AS is_effective,
          COALESCE(
              json_agg(
                  json_build_object(
                      'id', p.id,
                      'name', p.name,
                      'barcode', p.barcode,
                      'price', p.price
                  )
              ) FILTER (WHERE p.id IS NOT NULL), 
              '[]'
          ) AS associated_products
      FROM public.promotions pr
      LEFT JOIN public.promotion_items pi ON pr.id = pi.promotion_id
      LEFT JOIN public.products p ON pi.product_id = p.id
      WHERE ($1::uuid IS NULL OR pr.store_id = $1::uuid)
      GROUP BY pr.id
      ORDER BY pr.start_date DESC
      LIMIT $2::int OFFSET $3::int
    `, [finalStoreId, limit, offset]);

    const countResult = await pool.query(`
      SELECT COUNT(*) as total
      FROM public.promotions pr
      WHERE ($1::uuid IS NULL OR pr.store_id = $1::uuid)
    `, [finalStoreId]);

    const total = Number(countResult.rows[0].total);
    const totalPages = Math.ceil(total / Number(limit));

    res.status(200).json({
      response: "success",
      promotions: result.rows,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      response: "error",
      message: "Error al obtener promociones",
    });
  }
}

export const createPromotion = async (req: AuthRequest, res: Response) => {
  const { store_id } = req.params;
  const { name, type, discount_rate, buy_qty, pay_qty, start_date, end_date } = req.body.promotion;
  const { product_ids } = req.body;
  try {
    const result = await pool.query(`
      INSERT INTO public.promotions (name, type, discount_rate, buy_qty, pay_qty, start_date, end_date, active, store_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *;
    `, [name, type, discount_rate, buy_qty, pay_qty, start_date, end_date, true, store_id]);

    const promotion = result.rows[0];

    if (product_ids && product_ids.length > 0) {
      for (const productId of product_ids) {
        await pool.query(`
          INSERT INTO public.promotion_items (promotion_id, product_id)
          VALUES ($1, $2) RETURNING *;
        `, [promotion.id, productId]);
      }
    }

    res.status(201).json({
      response: "success",
      promotion: promotion,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      response: "error",
      message: "Error al crear promocion",
    });
  }
}

export const stopPromotion = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query(`
      UPDATE public.promotions
      SET active = false
      WHERE id = $1 RETURNING *;
    `, [id]);
    res.status(200).json({
      response: "success",
      message: "Promocion detenida correctamente",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      response: "error",
      message: "Error al eliminar promocion",
    });
  }
}

export const deletePromotionItems = async (req: AuthRequest, res: Response) => {
  const { promotion_id, product_ids } = req.body;
  try {
    await pool.query(`
      DELETE FROM public.promotion_items
      WHERE promotion_id = $1 AND product_id = ANY($2::int[]) RETURNING *;
    `, [promotion_id, product_ids]);
    res.status(200).json({
      response: "success",
      message: "Promocion eliminada correctamente",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      response: "error",
      message: "Error al eliminar promocion",
    });
  }
}

