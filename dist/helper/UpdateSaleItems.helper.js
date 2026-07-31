"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateSaleItems = void 0;
const UpdateSaleItems = async (products, sale_id, pool) => {
    try {
        for (const item of products) {
            await pool.query(`UPDATE public.sale_items
          SET returned_quantity = returned_quantity + $1
          WHERE sale_id = $2 AND product_id = $3;
      `, [item.quantity_to_reintegrate, sale_id, item.product_id]);
        }
    }
    catch (error) {
        console.log("Error en UpdateSaleItems", error);
    }
};
exports.UpdateSaleItems = UpdateSaleItems;
