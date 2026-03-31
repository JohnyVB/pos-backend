import { Request, Response } from "express";
import { pool } from "../config/postgresql.config";
import { UpdateInventory } from "../helper/UpdateInventory.helper";
import { UpdateSaleItems } from "../helper/UpdateSaleItems.helper";
import { AuthRequest } from "../interfaces/auth.interface";

export const createSale = async (req: AuthRequest, res: Response) => {
  const { store_id } = req.params;
  const user_id = req.user?.id;
  const client = await pool.connect();
  try {
    const { payment_method, amount_received, reference, cash_box_id, items } = req.body;
    await client.query("BEGIN");

    let total = 0;
    let vat_total = 0;
    let sub_total = 0;
    let change_amount = 0;

    for (const item of items) {
      const { product_id, quantity, price, vat } = item;
      const subtotal = price * quantity;
      const vatAmount = (subtotal * vat) / 100;
      total += (subtotal + vatAmount);
      vat_total += vatAmount;
      sub_total += subtotal;
      change_amount = payment_method === "CASH" ? amount_received - total : 0;

      // descontar inventario
      await client.query(
        "UPDATE inventory SET quantity = quantity - $1 WHERE product_id=$2",
        [quantity, product_id],
      );

      // registrar movimiento
      await client.query(
        `INSERT INTO inventory_movements (product_id, movement_type, quantity, reference, created_at, store_id) 
          VALUES ($1,'SALE',$2,$3,NOW(), $4)
        `,
        [product_id, quantity, reference, store_id],
      );
    }

    // registrar venta
    const saleRes = await client.query(
      `INSERT INTO sales (user_id, session_id, subtotal, vat_total, total, payment_method, amount_received, change_amount, created_at, card_reference, transaction_reference, store_id) 
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8, NOW(), $9, $10, $11) 
        RETURNING *
      `,
      [user_id, cash_box_id, sub_total, vat_total, total, payment_method, amount_received, change_amount, reference, `SALE_${Date.now()}`, store_id],
    );
    const sale_id = saleRes.rows[0].id;

    // registrar detalle_venta
    for (const item of items) {
      const { product_id, quantity } = item;
      const productRes = await client.query(
        "SELECT price, vat FROM products WHERE id=$1",
        [product_id],
      );
      const product = productRes.rows[0];
      const subtotal = product.price * quantity;
      await client.query(
        "INSERT INTO sale_items (sale_id, product_id, quantity, price, vat, subtotal) VALUES ($1,$2,$3,$4,$5,$6)",
        [sale_id, product_id, quantity, product.price, product.vat, subtotal],
      );
    }

    await client.query("COMMIT");
    res.status(201).json({
      response: "success",
      data: {
        sale_id,
        total,
        vat_total,
        sub_total,
        payment_method,
        amount_received,
        change_amount,
        cash_box_id,
        items,
      }
    });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.log("Error en createSale", err)
    res.status(500).json({ response: "error", message: "Error al registrar venta" });
  } finally {
    client.release();
  }
};

export const getSalesBySessionId = async (req: Request, res: Response) => {
  const { session_id } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  try {
    const result = await pool.query(
      `(
          -- BLOQUE 1: VENTAS
          SELECT
              s.created_at,
              'SALE' AS record_type,
              s.id AS record_id,
              s.payment_method,
              s.status AS record_status,
              s.total AS amount,
              s.subtotal AS sale_subtotal,
              s.vat_total AS sale_vat_total,
              COALESCE(r.total_refunded_sum, 0) AS total_refunded,
              'Venta de productos' AS reason, -- Texto genérico para ventas
              -- Desglose de productos (Tu lógica actual)
              JSON_AGG(
                  JSON_BUILD_OBJECT(
                      'item_id', si.id,
                      'product_name', p.name,
                      'barcode', p.barcode,
                      'quantity', si.quantity,
                      'returned', COALESCE(si.returned_quantity, 0),
                      'price', si.price,
                      'subtotal', si.subtotal
                  )
              ) AS details
          FROM public.sales s
          LEFT JOIN public.sale_items si ON s.id = si.sale_id
          LEFT JOIN public.products p ON si.product_id = p.id
          LEFT JOIN (
              SELECT sale_id, SUM(total_refunded) AS total_refunded_sum
              FROM public.refunds GROUP BY sale_id
          ) r ON s.id = r.sale_id
          WHERE s.session_id = $1 -- Filtro por sesión
          GROUP BY s.id, r.total_refunded_sum, s.created_at
      )
      UNION ALL
      (
          -- BLOQUE 2: MOVIMIENTOS DE CAJA (CASH IN / OUT)
          SELECT
              cm.created_at,
              CASE WHEN cm.type = 'IN' THEN 'CASH_IN' ELSE 'CASH_OUT' END AS record_type,
              cm.id AS record_id,
              'CASH' AS payment_method,
              'COMPLETED' AS record_status,
              cm.amount AS amount,
              cm.amount AS sale_subtotal,
              0 AS sale_vat_total,
              0 AS total_refunded,
              cm.reason AS reason,
              NULL AS details
          FROM public.cash_movements cm
          WHERE cm.session_id = $1
      )
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3`, [session_id, limit, offset]);

    const totalSales = await pool.query(
      `SELECT COUNT(*) as total FROM (
        SELECT s.id FROM public.sales s WHERE s.session_id = $1
        UNION ALL
        SELECT cm.id FROM public.cash_movements cm WHERE cm.session_id = $1
      ) as combined`,
      [session_id]
    );

    const total = parseInt(totalSales.rows[0].total);
    const totalPages = Math.ceil(total / Number(limit));

    res.status(200).json({
      response: "success",
      sales: result.rows,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages
      }
    });
  } catch (err: any) {
    console.log("Error en getSalesBySessionId", err)
    res.status(500).json({ response: "error", message: "Error al obtener las ventas" });
  }
};

export const processRefund = async (req: Request, res: Response) => {
  const { store_id } = req.params;
  const {
    sale_id,
    session_id,
    user_id,
    reason,
    items
  } = req.body;

  const total_refunded = items.reduce((acc: number, item: any) => {
    const qty = item.quantity_to_reintegrate || item.quantity || 0;
    const itemTotal = item.price_at_sale * qty;
    const itemVat = (itemTotal * (item.vat_rate || 0)) / 100;
    return acc + itemTotal + itemVat;
  }, 0);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const refundQuery = `
      INSERT INTO public.refunds (sale_id, user_id, session_id, total_refunded, reason, store_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id;
    `;
    await client.query(refundQuery, [sale_id, user_id, session_id, total_refunded, reason, store_id]);

    await UpdateInventory(items, "add", pool);
    await UpdateSaleItems(items, sale_id, pool);

    const saleRes = await client.query(
      "SELECT (CASE WHEN total = subtotal THEN total + vat_total ELSE total END) as original_total FROM sales WHERE id = $1",
      [sale_id]
    );
    const original_total = Number(saleRes.rows[0]?.original_total || 0);

    const allRefundsRes = await client.query(
      "SELECT COALESCE(SUM(total_refunded), 0) as total_refunded_sum FROM refunds WHERE sale_id = $1",
      [sale_id]
    );
    const allRefunds = Number(allRefundsRes.rows[0]?.total_refunded_sum || 0);

    const status = allRefunds >= original_total ? "REFUNDED" : "PARTIALLY_REFUNDED";

    const updateSaleQuery = `
      UPDATE public.sales 
      SET status = $1 
      WHERE id = $2;
    `;
    await client.query(updateSaleQuery, [status, sale_id]);

    await client.query('COMMIT');

    res.status(200).json({
      response: "success",
      message: "Devolución procesada, stock restaurado y estado de venta actualizado."
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error en la transacción de devolución:", error);
    res.status(500).json({
      response: "error",
      message: "Error procesando la devolución. No se realizaron cambios."
    });
  } finally {
    client.release();
  }
};
