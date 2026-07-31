"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCashMovement = void 0;
const postgresql_config_1 = require("../config/postgresql.config");
const createCashMovement = async (req, res) => {
    try {
        const { type, amount, reason } = req.body;
        const { store_id, session_id } = req.params;
        const userId = req.user?.id;
        await postgresql_config_1.pool.query(`INSERT INTO cash_movements (session_id, store_id, user_id, type, amount, reason) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [session_id, store_id, userId, type, amount, reason]);
        return res.status(201).json({
            response: "success"
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            response: "error",
            error: "Error al crear el movimiento de caja",
        });
    }
};
exports.createCashMovement = createCashMovement;
