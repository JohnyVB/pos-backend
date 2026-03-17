import { Pool } from "pg";

export const UpdateSaleItems = async (
  products: { product_id: number, quantity_to_reintegrate: number }[],
  sale_id: number,
  pool: Pool
) => {
  try {
    for (const item of products) {
      await pool.query(
        `UPDATE public.sale_items
          SET returned_quantity = returned_quantity + $1
          WHERE sale_id = $2 AND product_id = $3;
      `,
        [item.quantity_to_reintegrate, sale_id, item.product_id]
      )
    }
  } catch (error) {
    console.log("Error en UpdateSaleItems", error)
  }
}