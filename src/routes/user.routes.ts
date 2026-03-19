import { Router } from "express";
import { getUsers, register } from "../controllers/user.controllers";

const router = Router();

router.post("/register", register); // registrar usuario/cajero
router.get("/:store_id", getUsers); // obtener usuarios

export default router;