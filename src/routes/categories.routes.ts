import { Router } from "express";
import {
  getCategories,
  createCategory,
} from "../controllers/categories.controllers";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authMiddleware, getCategories); // listar categorías
router.post("/", authMiddleware, createCategory); // crear categoría

export default router;
