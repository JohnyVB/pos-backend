import { Router } from "express";
import {
  getCategories,
  createCategory,
  deactivateCategory,
} from "../controllers/categories.controllers";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/:store_id", authMiddleware, getCategories); // listar categorías
router.post("/:store_id", authMiddleware, createCategory); // crear categoría
router.put("/", authMiddleware, deactivateCategory); // desactivar categoría

export default router;
