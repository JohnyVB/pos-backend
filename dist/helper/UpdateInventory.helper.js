"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateInventory = void 0;
const UpdateInventory = async (products, operation, pool) => {
    try {
        for (const item of products) {
            if (item.reintegrate) {
                await pool.query(`UPDATE inventory SET quantity = quantity ${operation === "add" ? "+" : "-"} $1 WHERE product_id=$2`, [item.quantity_to_reintegrate, item.product_id]);
            }
        }
    }
    catch (error) {
        console.log("Error en updateInventory", error);
    }
};
exports.UpdateInventory = UpdateInventory;
