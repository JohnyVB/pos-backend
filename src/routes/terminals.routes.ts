import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { createTerminal, getTerminals } from "../controllers/terminals.controllers";

const router = Router();

router.get("/", authMiddleware, getTerminals);
router.post("/", authMiddleware, createTerminal);

export default router;