"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const environment_config_1 = require("../config/environment.config");
const jwt_secret = environment_config_1.envConfig.jwt_secret;
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(401).json({ response: "error", message: "No token provided" });
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, jwt_secret);
        req.user = decoded;
        next();
    }
    catch (err) {
        res.status(401).json({ response: "error", message: "Invalid token" });
    }
};
exports.authMiddleware = authMiddleware;
