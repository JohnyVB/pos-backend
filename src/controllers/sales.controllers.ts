import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { pool } from "../config/postgresql.config";

export const createSale = async (req: AuthRequest, res: Response) => {
  const { items, paymentType, cashBoxId } = req.body; // items: [{productId, quantity}]
  const userId = req.user.id;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let total = 0;
    let vatTotal = 0;

    for (const item of items) {
      const { productId, quantity } = item;
      const productRes = await client.query(
        "SELECT price, vat FROM products WHERE id=$1",
        [productId],
      );
      if (!productRes.rows.length) throw new Error("Product not found");
      const product = productRes.rows[0];

      const subtotal = product.price * quantity;
      const vatAmount = (subtotal * product.vat) / 100;
      total += subtotal;
      vatTotal += vatAmount;

      // descontar inventario
      await client.query(
        "UPDATE inventory SET quantity = quantity - $1 WHERE product_id=$2",
        [quantity, productId],
      );

      // registrar movimiento
      await client.query(
        "INSERT INTO inventory_movements (product_id, type, quantity, reference, created_at) VALUES ($1,'SALE',$2,'sale',NOW())",
        [productId, quantity],
      );
    }

    // registrar venta
    const saleRes = await client.query(
      "INSERT INTO sales (total, vat_total, payment_type, created_at, user_id, cash_box_id) VALUES ($1,$2,$3,NOW(),$4,$5) RETURNING *",
      [total, vatTotal, paymentType, userId, cashBoxId],
    );
    const saleId = saleRes.rows[0].id;

    // registrar detalle_venta
    for (const item of items) {
      const { productId, quantity } = item;
      const productRes = await client.query(
        "SELECT price, vat FROM products WHERE id=$1",
        [productId],
      );
      const product = productRes.rows[0];
      const subtotal = product.price * quantity;
      await client.query(
        "INSERT INTO sale_items (sale_id, product_id, quantity, price, vat, subtotal) VALUES ($1,$2,$3,$4,$5,$6)",
        [saleId, productId, quantity, product.price, product.vat, subtotal],
      );
    }

    await client.query("COMMIT");
    res.json({ saleId, total, vatTotal });
  } catch (err: any) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};
