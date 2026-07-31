"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const terminals_controllers_1 = require("../controllers/terminals.controllers");
const router = (0, express_1.Router)();
router.get("/:store_id", auth_middleware_1.authMiddleware, terminals_controllers_1.getTerminals);
router.post("/:store_id", auth_middleware_1.authMiddleware, terminals_controllers_1.createTerminal);
exports.default = router;
