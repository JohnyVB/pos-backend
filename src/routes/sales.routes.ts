import { Router } from "express";
import { createSale, getSalesBySessionId, processRefund } from "../controllers/sales.controllers";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/:store_id", authMiddleware, createSale);
router.get("/:session_id", authMiddleware, getSalesBySessionId);
router.post("/refund/:store_id", authMiddleware, processRefund);

export default router;
