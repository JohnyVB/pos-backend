import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { createTerminal, getTerminals } from "../controllers/terminals.controllers";

const router = Router();

router.get("/:store_id", authMiddleware, getTerminals);
router.post("/:store_id", authMiddleware, createTerminal);

export default router;