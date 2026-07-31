"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inventory_controllers_1 = require("../controllers/inventory.controllers");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.post("/movement/:store_id", auth_middleware_1.authMiddleware, inventory_controllers_1.movement);
router.get("/:store_id", auth_middleware_1.authMiddleware, inventory_controllers_1.loadInventory);
exports.default = router;
