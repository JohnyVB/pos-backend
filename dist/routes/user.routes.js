"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controllers_1 = require("../controllers/user.controllers");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.post("/register", user_controllers_1.register); // registrar usuario/cajero
router.get("/:store_id", auth_middleware_1.authMiddleware, user_controllers_1.getUsers); // obtener usuarios
router.patch("/toggle-status/:user_id", auth_middleware_1.authMiddleware, user_controllers_1.toggleUserStatus); // activar/desactivar usuario
exports.default = router;
