import { Router } from "express";
import { loadInventory, movement } from "../controllers/inventory.controllers";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/movement", authMiddleware, movement);
router.get("/", authMiddleware, loadInventory)

export default router;