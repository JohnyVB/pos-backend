import { Request, Response } from "express";

import { pool } from "../config/postgresql.config";

// 1. Listar todas las cajas
export const getTerminals = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM pos_terminals WHERE active = true ORDER BY id ASC');
    res.status(200).json({ response: "success", terminals: result.rows });
  } catch (error) {
    console.log(error);
    res.status(500).json({ response: "error", message: "Error al obtener terminales" });
  }
};

// 2. Crear nueva caja
export const createTerminal = async (req: Request, res: Response) => {
  const { name } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO pos_terminals (name, active) VALUES ($1, true) RETURNING *',
      [name]
    );
    res.status(201).json({ response: "success", terminal: result.rows[0] });
  } catch (error) {
    console.log(error);
    res.status(500).json({ response: "error", message: "Error al crear terminal (el nombre debe ser único)" });
  }
};