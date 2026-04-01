import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { createPromotion, deletePromotion, deletePromotionItems, getPromotions, updatePromotion } from "../controllers/promotions.controllers";

const router = Router();

router.get("/:store_id", authMiddleware, getPromotions);
router.post("/:store_id", authMiddleware, createPromotion);
router.put("/:id", authMiddleware, updatePromotion);
router.delete("/:id", authMiddleware, deletePromotion);
router.delete("/items", authMiddleware, deletePromotionItems);


export default router;
