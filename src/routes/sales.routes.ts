import { Router } from "express";
import { createSale } from "../controllers/sales.controllers";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authMiddleware, createSale);

export default router;
