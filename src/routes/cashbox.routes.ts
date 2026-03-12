import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { closeCashBox, getCashBoxes, openCashBox } from "../controllers/cashbox.controllers";

const router = Router();

router.post("/open", authMiddleware, openCashBox); // abrir caja
router.put("/close", authMiddleware, closeCashBox); // cerrar caja
router.get("/", authMiddleware, getCashBoxes); // obtener cajas

export default router;
