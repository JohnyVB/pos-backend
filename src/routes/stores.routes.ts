import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { createStore, getStores } from "../controllers/stores.controllers";

const router = Router();

router.get("/", authMiddleware, getStores);
router.post("/", authMiddleware, createStore);

export default router;