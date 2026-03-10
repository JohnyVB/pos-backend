import { Router } from "express";
import { movement } from "../controllers/inventory.controllers";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/movement", authMiddleware, movement);

export default router;