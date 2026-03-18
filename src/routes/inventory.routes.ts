import { Router } from "express";
import { loadInventory, movement } from "../controllers/inventory.controllers";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/movement/:store_id", authMiddleware, movement);
router.get("/:store_id", authMiddleware, loadInventory)

export default router;