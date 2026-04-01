import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { createPromotion, deletePromotionItems, getPromotions, stopPromotion } from "../controllers/promotions.controllers";

const router = Router();

router.get("/:store_id", authMiddleware, getPromotions);
router.post("/:store_id", authMiddleware, createPromotion);
router.put("/:id/stop", authMiddleware, stopPromotion);
router.delete("/items", authMiddleware, deletePromotionItems);


export default router;
