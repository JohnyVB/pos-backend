"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const categories_controllers_1 = require("../controllers/categories.controllers");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get("/:store_id", auth_middleware_1.authMiddleware, categories_controllers_1.getCategories); // listar categorías
router.post("/:store_id", auth_middleware_1.authMiddleware, categories_controllers_1.createCategory); // crear categoría
router.put("/", auth_middleware_1.authMiddleware, categories_controllers_1.deactivateCategory); // desactivar categoría
exports.default = router;
