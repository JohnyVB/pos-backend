"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivateCategory = exports.createCategory = exports.getCategories = void 0;
const postgresql_config_1 = require("../config/postgresql.config");
const getCategories = async (req, res) => {
    const user = req.user;
    const { store_id } = req.params;
    const { page, limit } = req.query;
    let finalStoreId = null;
    if (user?.role !== "superadmin") {
        finalStoreId = store_id || null;
    }
    else {
        finalStoreId = user.store_id;
    }
    const offset = (Number(page) - 1) * Number(limit);
    try {
        const result = await postgresql_config_1.pool.query(`
      SELECT 
        c.id,
        c.name,
        c.description,
        c.created_at,
        c.store_id,
        s.name AS store_name,
        c.active
      FROM categories c
      JOIN stores s ON c.store_id = s.id
      WHERE ($1::uuid IS NULL OR c.store_id = $1::uuid) AND c.active = true
      ORDER BY c.created_at DESC
      LIMIT $2 OFFSET $3
      `, [store_id, limit, offset]);
        const totalResult = await postgresql_config_1.pool.query(`
      SELECT COUNT(*) as total
      FROM categories c
      JOIN stores s ON c.store_id = s.id
      WHERE ($1::uuid IS NULL OR c.store_id = $1::uuid) AND c.active = true
      `, [store_id]);
        const total = parseInt(totalResult.rows[0].total);
        const totalPages = Math.ceil(total / Number(limit));
        res.status(200).json({
            response: "success",
            categories: result.rows,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages
            }
        });
    }
    catch (err) {
        console.error("Error fetching categories:", err);
        res.status(500).json({ response: "error", message: err.message });
    }
};
exports.getCategories = getCategories;
const createCategory = async (req, res) => {
    const { name, description } = req.body;
    const { store_id } = req.params;
    try {
        const result = await postgresql_config_1.pool.query("INSERT INTO categories (name, created_at, description, active, store_id) VALUES ($1, NOW(), $2, true, $3) RETURNING *", [name, description, store_id]);
        res.status(201).json({ response: "success", category: result.rows[0] });
    }
    catch (err) {
        console.error("Error creating category:", err);
        res.status(500).json({ response: "error", message: err.message });
    }
};
exports.createCategory = createCategory;
const deactivateCategory = async (req, res) => {
    const { id } = req.body;
    try {
        await postgresql_config_1.pool.query("UPDATE categories SET active = false WHERE id = $1", [
            id,
        ]);
        res.status(200).json({ response: "success" });
    }
    catch (err) {
        console.error("Error deactivating category:", err);
        res.status(500).json({ response: "error", message: err.message });
    }
};
exports.deactivateCategory = deactivateCategory;
