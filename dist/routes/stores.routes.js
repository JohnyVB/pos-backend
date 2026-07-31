"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const stores_controllers_1 = require("../controllers/stores.controllers");
const router = (0, express_1.Router)();
router.get("/", auth_middleware_1.authMiddleware, stores_controllers_1.getStores);
router.post("/", auth_middleware_1.authMiddleware, stores_controllers_1.createStore);
exports.default = router;
