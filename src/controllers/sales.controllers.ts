import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { pool } from "../config/postgresql.config";

export const createSale = async (req: AuthRequest, res: Response) => {
  console.log(JSON.stringify(req.body, null, 2))
  console.log(JSON.stringify(req.user, null, 2))
  const user_id = req.user.id;
  const client = await pool.connect();
  try {
    const { payment_method, amount_received, cash_box_id, items } = req.body;
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
      change_amount = amount_received - total;

      // descontar inventario
      await client.query(
        "UPDATE inventory SET quantity = quantity - $1 WHERE product_id=$2",
        [quantity, product_id],
      );

      // registrar movimiento
      await client.query(
        `INSERT INTO inventory_movements (product_id, movement_type, quantity, reference, created_at) 
          VALUES ($1,'SALE',$2,'sale',NOW())
        `,
        [product_id, quantity],
      );
    }

    // registrar venta
    const saleRes = await client.query(
      `INSERT INTO sales (user_id, cash_box_id, subtotal, vat_total, total, payment_method, amount_received, change_amount, created_at) 
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8, NOW()) 
        RETURNING *
      `,
      [user_id, cash_box_id, sub_total, vat_total, total, payment_method, amount_received, change_amount],
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
