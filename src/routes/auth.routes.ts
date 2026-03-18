import { Router } from "express";
import { login, verifyToken } from "../controllers/auth.controllers";

const router = Router();

router.post("/login", login); // login y obtener JWT
router.post("/verifyToken", verifyToken); // endpoint para autenticación (puede ser el mismo que login)

export default router;
