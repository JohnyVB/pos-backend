import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { closeCashBoxSession, getCashBoxSessions, openCashBoxSession } from "../controllers/cashbox-sessions.controllers";

const router = Router();

router.post("/open/:store_id", authMiddleware, openCashBoxSession); // abrir sesion de caja
router.put("/close", authMiddleware, closeCashBoxSession); // cerrar sesion de caja
router.post("/get/:store_id", authMiddleware, getCashBoxSessions); // obtener sesiones de caja

export default router;
