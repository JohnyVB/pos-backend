import { Router } from "express";
import { getUsers, register, toggleUserStatus } from "../controllers/user.controllers";

const router = Router();

router.post("/register", register); // registrar usuario/cajero
router.get("/:store_id", getUsers); // obtener usuarios
router.patch("/toggle-status/:user_id", toggleUserStatus); // activar/desactivar usuario

export default router;