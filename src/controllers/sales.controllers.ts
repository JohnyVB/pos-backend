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
      total += subtotal;
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

export const getSales = async (req: Request, res: Response) => {
  const { cash_box_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT
          s.id,
          s.created_at,
          u.username AS seller_name,
          s.payment_method,
          s.total,
          s.subtotal,
          s.vat_total,
          s.cash_box_id
      FROM sales s
      JOIN users u ON s.user_id = u.id
      WHERE
        (s.created_at >= $1 OR $1 IS NULL) -- Fecha Inicio
        AND (s.created_at <= $2 OR $2 IS NULL) -- Fecha Fin
        AND (s.cash_box_id = $3 OR $3 IS NULL) -- Caja específica
      ORDER BY s.created_at DESC;`,
      [cash_box_id],
    );
    res.status(200).json({
      response: "success",
      sales: result.rows,
    });
  } catch (err: any) {
    console.log("Error en getSalesByCashBoxId", err)
    res.status(500).json({ response: "error", message: "Error al obtener las ventas" });
  }
};

export const getSalesBySessionId = async (req: Request, res: Response) => {
  const { session_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT
          s.id AS sale_id,
          s.total AS original_total,
          s.subtotal AS sale_subtotal,
          s.vat_total AS sale_vat_total,
          s.payment_method,
          s.created_at,
          s.change_amount,
          s.status AS sale_status,

          -- Totales de la venta (Dinero)
          COALESCE(r.total_refunded_sum, 0) AS total_refunded,
          (s.total - COALESCE(r.total_refunded_sum, 0)) AS net_total,

          -- Desglose de productos con lógica de retorno
          JSON_AGG(
              JSON_BUILD_OBJECT(
                  'item_id', si.id,
                  'product_id', si.product_id,
                  'product_name', p.name,
                  'barcode', p.barcode,
                  'original_quantity', si.quantity,
                  'returned_quantity', COALESCE(si.returned_quantity, 0),

                  -- Cantidad neta (lo que el cliente aún tiene)
                  'current_quantity', (si.quantity - COALESCE(si.returned_quantity, 0)),

                  'price_at_sale', si.price,
                  'vat_rate', si.vat,

                  -- Subtotal original vs Subtotal actual (tras devoluciones)
                  'original_item_subtotal', si.subtotal,
                  'current_item_subtotal', ((si.quantity - COALESCE(si.returned_quantity, 0)) * si.price)
              )
          ) AS items

      FROM public.sales s
      LEFT JOIN public.sale_items si ON s.id = si.sale_id
      LEFT JOIN public.products p ON si.product_id = p.id

      -- Subconsulta para el total de dinero devuelto (para el resumen de la venta)
      LEFT JOIN (
          SELECT sale_id, SUM(total_refunded) AS total_refunded_sum
          FROM public.refunds
          GROUP BY sale_id
      ) r ON s.id = r.sale_id

      WHERE s.session_id = $1 -- Filtro por sesión de caja
      GROUP BY s.id, r.total_refunded_sum
      ORDER BY s.created_at DESC;
      `,
      [session_id],
    );
    res.status(200).json({
      response: "success",
      sales: result.rows,
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

  const total_refunded = items.reduce((acc: number, item: any) => acc + item.price_at_sale * item.quantity, 0);

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

    const status = total_refunded ===
      items.reduce((acc: number, item: any) => acc + item.price_at_sale * item.quantity_to_reintegrate, 0)
      ? "REFUNDED"
      : "PARTIALLY_REFUNDED";

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
