"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleUserStatus = exports.getUsers = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const postgresql_config_1 = require("../config/postgresql.config");
// Registrar usuario
const register = async (req, res) => {
    const { name, username, email, password, role, store_id } = req.body;
    let userEmail = "";
    if (!email || email === "") {
        userEmail = "no-email@" + username + ".com";
    }
    else {
        userEmail = email;
    }
    try {
        const hash = await bcrypt_1.default.hash(password, 10);
        const result = await postgresql_config_1.pool.query("INSERT INTO users (name, username, email, password, role, store_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *", [name, username, userEmail, hash, role, store_id]);
        res.status(201).json({
            response: "success",
            user: result.rows[0],
        });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ response: "error", message: err.message });
    }
};
exports.register = register;
const getUsers = async (req, res) => {
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
          u.id,
          u.name,
          u.username,
          u.email,
          u.role,
          u.store_id,
          s.name AS store_name,
          u.active,
          u.created_at
      FROM public.users u
      LEFT JOIN public.stores s ON u.store_id = s.id
      WHERE ($1::uuid IS NULL OR u.store_id = $1)
      ORDER BY u.created_at DESC;`, [storeId]);
        res.status(200).json({
            response: "success",
            users: result.rows,
        });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ response: "error", message: err.message });
    }
};
exports.getUsers = getUsers;
const toggleUserStatus = async (req, res) => {
    const { user_id } = req.params;
    const { active } = req.body;
    try {
        const result = await postgresql_config_1.pool.query("UPDATE users SET active = $1 WHERE id = $2 RETURNING *", [active, user_id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ response: "error", message: "Usuario no encontrado" });
        }
        res.status(200).json({
            response: "success",
            user: result.rows[0],
        });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ response: "error", message: err.message });
    }
};
exports.toggleUserStatus = toggleUserStatus;
