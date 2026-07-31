"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const cash_movements_controllers_1 = require("../controllers/cash-movements.controllers");
const router = (0, express_1.Router)();
router.post("/:store_id/:session_id", auth_middleware_1.authMiddleware, cash_movements_controllers_1.createCashMovement);
exports.default = router;
