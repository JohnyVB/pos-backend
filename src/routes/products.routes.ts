import { Router } from "express";
import {
  getProducts,
  createProduct,
  getProductByBarcode,
} from "../controllers/products.controllers";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authMiddleware, getProducts); // listar productos activos
router.post("/", authMiddleware, createProduct); // crear producto
router.get("/barcode/:barcode", authMiddleware, getProductByBarcode);

export default router;
