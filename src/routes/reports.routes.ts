import { Router } from "express";
import { getTopProducts } from "../controllers/reports.controllers";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/top-products", authMiddleware, getTopProducts);

export default router;