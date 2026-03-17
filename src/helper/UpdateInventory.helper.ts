import { Pool } from "pg";

export const updateInventory = async (
  products: { product_id: number, quantity: number, reintegrate?: boolean }[],
  operation: "add" | "subtract",
  pool: Pool
) => {
  try {
    for (const item of products) {
      if (item.reintegrate) {
        await pool.query(
          `UPDATE inventory SET quantity = quantity ${operation === "add" ? "+" : "-"} $1 WHERE product_id=$2`,
          [item.quantity, item.product_id],
        );
      }
    }
  } catch (error) {
    console.log("Error en updateInventory", error);
  }
}