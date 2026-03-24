import { Router } from "express";
import { getUsers, register, toggleUserStatus } from "../controllers/user.controllers";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", authMiddleware, register); // registrar usuario/cajero
router.get("/:store_id", authMiddleware, getUsers); // obtener usuarios
router.patch("/toggle-status/:user_id", authMiddleware, toggleUserStatus); // activar/desactivar usuario

export default router;