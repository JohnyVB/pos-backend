"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTerminal = exports.getTerminals = void 0;
const postgresql_config_1 = require("../config/postgresql.config");
// 1. Listar todas las cajas
const getTerminals = async (req, res) => {
    const { store_id } = req.params;
    const { user } = req;
    let storeId = null;
    if (user && user.role === "superadmin") {
        storeId = null;
    }
    else {
        storeId = store_id;
    }
    try {
        const result = await postgresql_config_1.pool.query(`SELECT
          pt.id,
          pt.name,
          pt.active,
          pt.store_id,
          s.name AS store_name
      FROM public.pos_terminals pt
      JOIN public.stores s ON pt.store_id = s.id
      WHERE pt.active = true AND ($1::uuid IS NULL OR pt.store_id = $1)
      ORDER BY pt.id DESC;`, [storeId]);
        res.status(200).json({ response: "success", terminals: result.rows });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ response: "error", message: "Error al obtener terminales" });
    }
};
exports.getTerminals = getTerminals;
// 2. Crear nueva caja
const createTerminal = async (req, res) => {
    const { name } = req.body;
    const { store_id } = req.params;
    try {
        const result = await postgresql_config_1.pool.query('INSERT INTO pos_terminals (name, active, store_id) VALUES ($1, true, $2) RETURNING *', [name, store_id]);
        res.status(201).json({ response: "success", terminal: result.rows[0] });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ response: "error", message: "Error al crear terminal (el nombre debe ser único)" });
    }
};
exports.createTerminal = createTerminal;
