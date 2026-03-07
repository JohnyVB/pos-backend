import { Router } from "express";
import { openCashBox, closeCashBox } from "../controllers/cashbox.controllers";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/open", authMiddleware, openCashBox); // abrir caja
router.post("/close", authMiddleware, closeCashBox); // cerrar caja

export default router;
