"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStore = exports.getStores = void 0;
const postgresql_config_1 = require("../config/postgresql.config");
const getStores = async (req, res) => {
    try {
        const { rows } = await postgresql_config_1.pool.query("SELECT * FROM stores");
        return res.json({ response: "success", stores: rows });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ response: "error", message: "Error al obtener tiendas" });
    }
};
exports.getStores = getStores;
const createStore = async (req, res) => {
    const { name, address, city, phone, cif_nif, legal_name, zip_code } = req.body;
    try {
        const { rows } = await postgresql_config_1.pool.query(`INSERT INTO stores (name, address, city, phone, cif_nif, legal_name, zip_code) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *
      `, [name, address, city, phone, cif_nif, legal_name, zip_code]);
        return res.json({ response: "success", store: rows[0] });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ response: "error", message: "Error al crear tienda" });
    }
};
exports.createStore = createStore;
