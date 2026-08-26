import { Response } from 'express';
import { pool } from "../config/postgresql.config";
import { AuthRequest } from '../interfaces/auth.interface';

// 1. Obtener todas las Zonas con sus Mesas y consumo actual
export const getBarLayout = async (req: AuthRequest, res: Response) => {
  try {
    const { store_id } = req.params
    const query = `
      SELECT
        z.id AS zone_id,
        z.name AS zone_name,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', t.id,
            'name', t.name,
            'status', t.status,
            'active_sale_id', t.active_sale_id,
            'total', COALESCE(s.total, 0)
          ) ORDER BY t.id
        ) AS tables
      FROM public.restaurant_zones z
      LEFT JOIN public.restaurant_tables t ON z.id = t.zone_id
      LEFT JOIN public.sales s ON t.active_sale_id = s.id
      WHERE z.store_id = $1
      GROUP BY z.id, z.name
      ORDER BY z.id;
    `;

    const { rows } = await pool.query(query, [store_id]);
    return res.status(200).json({
      response: "success",
      zones: rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      response: "error",
      message: "Error al obtener el mapa del bar",
    });
  }
};

// 2. Guardar o Actualizar Cuenta Abierta en una Mesa
export const saveTableAccount = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { tableId, items, total, netTotal, vatTotal } = req.body;
    const storeId = req.user?.store_id;
    const userId = req.user?.id;

    // Verificar estado de la mesa
    const tableRes = await client.query(
      'SELECT status, active_sale_id FROM public.restaurant_tables WHERE id = $1',
      [tableId]
    );
    const table = tableRes.rows[0];

    let saleId = table.active_sale_id;

    if (!saleId) {
      // Crear nueva venta con estado PENDING
      const newSale = await client.query(
        `INSERT INTO public.sales (store_id, user_id, table_id, total, net_total, vat_total, status, payment_method)
         VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', 'PENDING') RETURNING id`,
        [storeId, userId, tableId, total, netTotal, vatTotal]
      );
      saleId = newSale.rows[0].id;

      // Marcar mesa como ocupada
      await client.query(
        `UPDATE public.restaurant_tables SET status = 'BUSY', active_sale_id = $1 WHERE id = $2`,
        [saleId, tableId]
      );
    } else {
      // Reemplazar detalles anteriores y actualizar totales
      await client.query(`DELETE FROM public.sale_details WHERE sale_id = $1`, [saleId]);
      await client.query(
        `UPDATE public.sales SET total = $1, net_total = $2, vat_total = $3 WHERE id = $4`,
        [total, netTotal, vatTotal, saleId]
      );
    }

    // Insertar ítems actualizados de la comanda
    for (const item of items) {
      await client.query(
        `INSERT INTO public.sale_details (sale_id, product_id, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [saleId, item.productId, item.quantity, item.unitPrice, item.subtotal]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Cuenta de la mesa guardada correctamente', saleId });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Error al actualizar la cuenta de la mesa' });
  } finally {
    client.release();
  }
};

// 3. Cobrar y Cerrar Mesa
export const checkoutTable = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { tableId, paymentMethod } = req.body; // paymentMethod: 'CASH', 'CARD', etc.

    const tableRes = await client.query(
      'SELECT active_sale_id FROM public.restaurant_tables WHERE id = $1',
      [tableId]
    );
    const saleId = tableRes.rows[0]?.active_sale_id;

    if (!saleId) {
      return res.status(400).json({ error: 'La mesa no tiene ninguna cuenta abierta' });
    }

    // 1. Cambiar venta a COMPLETED y asignar método de pago
    await client.query(
      `UPDATE public.sales SET status = 'COMPLETED', payment_method = $1 WHERE id = $2`,
      [paymentMethod, saleId]
    );

    // 2. Liberar la mesa
    await client.query(
      `UPDATE public.restaurant_tables SET status = 'FREE', active_sale_id = NULL WHERE id = $1`,
      [tableId]
    );

    // 3. Descontar del inventario los productos consumidos
    const details = await client.query(
      'SELECT product_id, quantity FROM public.sale_details WHERE sale_id = $1',
      [saleId]
    );

    for (const item of details.rows) {
      await client.query(
        `UPDATE public.inventory SET quantity = quantity - $1 WHERE product_id = $2`,
        [item.quantity, item.product_id]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Mesa cobrada y liberada con éxito' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Error al cobrar la mesa' });
  } finally {
    client.release();
  }
};