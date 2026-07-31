"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const cashbox_sessions_controllers_1 = require("../controllers/cashbox-sessions.controllers");
const router = (0, express_1.Router)();
router.post("/open/:store_id", auth_middleware_1.authMiddleware, cashbox_sessions_controllers_1.openCashBoxSession); // abrir sesion de caja
router.put("/close", auth_middleware_1.authMiddleware, cashbox_sessions_controllers_1.closeCashBoxSession); // cerrar sesion de caja
router.post("/get/:store_id", auth_middleware_1.authMiddleware, cashbox_sessions_controllers_1.getCashBoxSessions); // obtener sesiones de caja
exports.default = router;
