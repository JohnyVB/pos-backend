import { Router } from "express";
import { register, login } from "../controllers/auth.controllers";

const router = Router();

router.post("/register", register); // registrar usuario/cajero
router.post("/login", login); // login y obtener JWT

export default router;
