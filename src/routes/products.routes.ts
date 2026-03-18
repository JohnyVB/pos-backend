import { Router } from "express";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProductByQuery,
  getProductByBarcode,
} from "../controllers/products.controllers";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/:store_id", authMiddleware, getProducts); // listar productos activos
router.post("/:store_id", authMiddleware, createProduct); // crear producto
router.put("/:id", authMiddleware, updateProduct); // editar producto
router.delete("/:id", authMiddleware, deleteProduct); // eliminar producto
router.get("/search/:query/:store_id", authMiddleware, searchProductByQuery); // buscar productos por nombre o barcode
router.get("/barcode/:barcode/:store_id", authMiddleware, getProductByBarcode)

export default router;
