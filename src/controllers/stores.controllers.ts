import { Request, Response } from "express";

import { pool } from "../config/postgresql.config";

export const getStores = async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query("SELECT * FROM stores");
    return res.json({ response: "success", stores: rows });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ response: "error", message: "Error al obtener tiendas" });
  }
}

export const createStore = async (req: Request, res: Response) => {
  const { name, address, city, phone, cif_nif, legal_name, zip_code } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO stores (name, address, city, phone, cif_nif, legal_name, zip_code) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *
      `,
      [name, address, city, phone, cif_nif, legal_name, zip_code]
    );
    return res.json({ response: "success", store: rows[0] });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ response: "error", message: "Error al crear tienda" });
  }
}