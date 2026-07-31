"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reports_controllers_1 = require("../controllers/reports.controllers");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.post("/top-products", auth_middleware_1.authMiddleware, reports_controllers_1.getTopProducts);
exports.default = router;
