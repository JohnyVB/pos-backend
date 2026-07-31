"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.login = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const environment_config_1 = require("../config/environment.config");
const postgresql_config_1 = require("../config/postgresql.config");
const jwt_secret = environment_config_1.envConfig.jwt_secret;
// Login
const login = async (req, res) => {
    const { user, password } = req.body;
    try {
        const result = await postgresql_config_1.pool.query(`SELECT * FROM users 
        WHERE (username = $1 OR email = $1)
        AND active = true
      `, [user]);
        if (result.rows.length === 0) {
            return res
                .status(400)
                .json({ response: "error", message: "Usuario no encontrado" });
        }
        const userData = result.rows[0];
        const match = await bcrypt_1.default.compare(password, userData.password);
        if (!match) {
            return res
                .status(400)
                .json({ response: "error", message: "Contraseña incorrecta" });
        }
        const token = jsonwebtoken_1.default.sign({ id: userData.id, role: userData.role }, jwt_secret, {
            expiresIn: "12h",
        });
        return res.status(200).json({
            response: "success",
            token,
            user: {
                id: userData.id,
                name: userData.name,
                username: userData.username,
                email: userData.email,
                store_id: userData.store_id,
                role: userData.role,
            },
        });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({
            response: "error",
            message: err.message,
        });
    }
};
exports.login = login;
// autentificación de token
const verifyToken = (req, res, next) => {
    const { token } = req.body;
    if (!token) {
        return res
            .status(401)
            .json({ response: "error", message: "No token provided" });
    }
    jsonwebtoken_1.default.verify(token, jwt_secret, (err) => {
        if (err) {
            return res
                .status(403)
                .json({ response: "error", message: "Invalid token" });
        }
        else {
            return res.status(200).json({ response: "success", message: "Token is valid" });
        }
    });
};
exports.verifyToken = verifyToken;
