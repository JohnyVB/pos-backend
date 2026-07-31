"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const products_controllers_1 = require("../controllers/products.controllers");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.post("/:store_id", auth_middleware_1.authMiddleware, products_controllers_1.getProducts); // listar productos activos
router.post("/:store_id", auth_middleware_1.authMiddleware, products_controllers_1.createProduct); // crear producto
router.put("/:id", auth_middleware_1.authMiddleware, products_controllers_1.updateProduct); // editar producto
router.delete("/:id", auth_middleware_1.authMiddleware, products_controllers_1.deleteProduct); // eliminar producto
router.get("/search/:query/:store_id", auth_middleware_1.authMiddleware, products_controllers_1.searchProductByQuery); // buscar productos por nombre o barcode
router.get("/barcode/:barcode/:store_id", auth_middleware_1.authMiddleware, products_controllers_1.getProductByBarcode);
router.get("/low-stock/:store_id", auth_middleware_1.authMiddleware, products_controllers_1.getProductsWithLowStock);
exports.default = router;
