import { Router } from "express";
import { createSale, getSalesBySessionId, processRefund } from "../controllers/sales.controllers";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authMiddleware, createSale);
router.get("/:session_id", authMiddleware, getSalesBySessionId);
router.post("/:sale_id/refund", authMiddleware, processRefund);

export default router;
