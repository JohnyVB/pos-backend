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

router.get("/", authMiddleware, getProducts); // listar productos activos
router.post("/", authMiddleware, createProduct); // crear producto
router.put("/:id", authMiddleware, updateProduct); // editar producto
router.delete("/:id", authMiddleware, deleteProduct); // eliminar producto
router.get("/search/:query", authMiddleware, searchProductByQuery); // buscar productos por nombre o barcode
router.get("/barcode/:barcode", authMiddleware, getProductByBarcode)

export default router;
