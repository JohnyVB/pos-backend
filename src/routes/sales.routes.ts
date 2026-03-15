import { Router } from "express";
import { createSale, getSalesBySessionId } from "../controllers/sales.controllers";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authMiddleware, createSale);
router.get("/:session_id", authMiddleware, getSalesBySessionId);

export default router;
