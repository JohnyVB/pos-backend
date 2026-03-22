import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { createCashMovement } from "../controllers/cash-movements.controllers";

const router = Router();

router.post("/:store_id/:session_id", authMiddleware, createCashMovement);

export default router;