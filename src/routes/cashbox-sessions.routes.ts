import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { closeCashBoxSession, getCashBoxSessions, openCashBoxSession } from "../controllers/cashbox-sessions.controllers";

const router = Router();

router.post("/open", authMiddleware, openCashBoxSession); // abrir caja
router.put("/close", authMiddleware, closeCashBoxSession); // cerrar caja
router.get("/", authMiddleware, getCashBoxSessions); // obtener cajas

export default router;
