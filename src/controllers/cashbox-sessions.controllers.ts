import { Response } from "express";
import { pool } from "../config/postgresql.config";
import { AuthRequest } from "../interfaces/auth.interface";

export const openCashBoxSession = async (req: AuthRequest, res: Response) => {
  const { opening_amount, pos_terminal_id } = req.body;
  const userId = req.user?.id;
  const { store_id } = req.params;
  try {
    const result = await pool.query(
      `INSERT INTO cash_box_sessions (opened_at, opening_amount, user_id, pos_terminal_id, status, store_id) 
      VALUES (NOW(), $1, $2, $3, 'OPEN', $4) 
      RETURNING id as session_id, *
      `,
      [opening_amount, userId, pos_terminal_id, store_id],
    );
    res.status(200).json({ response: "success", cashBoxSession: result.rows[0] });
  } catch (err: any) {
    console.log(err)
    res.status(500).json({ response: "error", error: err.message });
  }
};

export const closeCashBoxSession = async (req: AuthRequest, res: Response) => {
  const { cash_box_id, closing_amount } = req.body;
  try {
    const result = await pool.query(
      "UPDATE cash_box_sessions SET closed_at=NOW(), closing_amount=$1, status='CLOSED' WHERE id=$2 RETURNING id as session_id, *",
      [closing_amount, cash_box_id],
    );
    res.status(200).json({ response: "success", cashBoxSession: result.rows[0] });
  } catch (err: any) {
    console.log(err)
    res.status(500).json({ response: "error", error: err.message });
  }
};

export const getCashBoxSessions = async (req: AuthRequest, res: Response) => {
  const user = req.user; // Datos del token JWT (id, role, store_id)
  const { store_id: paramStoreId } = req.params as { store_id: string };
  const { pos_terminal_id, start_date, end_date, user_id: bodyUserId } = req.body;
  const { page = 1, limit = 10 } = req.query as { page?: string, limit?: string };

  // Variables que irán a la base de datos
  let finalStoreId: string | null = null;
  let finalUserId: number | null = null;

  // --- APLICACIÓN DE REGLAS DE NEGOCIO ---

  if (user && user.role === "superadmin") {
    // 1. SUPERADMIN: 
    // Por default ve todo (null). 
    // Pero si envía store_id o user_id para filtrar, se los respetamos.
    finalStoreId = paramStoreId || null;
    finalUserId = bodyUserId || null;
  }
  else if (user && user.role === "admin") {
    // 2. ADMIN: 
    // Por default ve todo lo de SU tienda.
    // Sobrescribimos cualquier store_id que venga de afuera por el suyo propio (Seguridad).
    finalStoreId = user.store_id;
    // Puede filtrar por cualquier usuario de su tienda si lo manda en el body.
    finalUserId = bodyUserId || null;
  } else if (user && user.role === "cashier") {
    // 3. CASHIER: 
    // Solo puede ver sus propias sesiones.
    // Forzamos su store_id y su propio user_id (Ignoramos lo que mande en el body).
    finalStoreId = user.store_id;
    finalUserId = user.id;
  }

  const offset = (Number(page) - 1) * Number(limit);

  try {
    const result = await pool.query(`
        SELECT 
            -- Datos de la sesión
            cbs.id AS session_id, 
            cbs.opening_amount, 
            cbs.closing_amount, 
            cbs.opened_at, 
            cbs.closed_at, 
            cbs.status AS session_status,

            -- Datos del Usuario (Cajero)
            u.id AS user_id, 
            u.name AS user_full_name,

            -- Datos de la Terminal (Caja Física)
            pt.name AS terminal_name,

            -- Datos de la Tienda
            cbs.store_id,
            s.name AS store_name,
            
            -- 1. total_sales_count: Conteo de ventas
            (SELECT COUNT(*) FROM public.sales s WHERE s.session_id = cbs.id) AS total_sales_count,
            -- 2. total_sales_amount: Monto de ventas completadas
            (SELECT COALESCE(SUM(total), 0) FROM public.sales s WHERE s.session_id = cbs.id AND s.status = 'COMPLETED') AS total_sales_amount,
            -- 3. total_collected: Alias para el total recaudado (usualmente igual a sales_amount bruto)
            (SELECT COALESCE(SUM(total), 0) FROM public.sales s WHERE s.session_id = cbs.id AND s.status = 'COMPLETED') AS total_collected,

            -- Movimientos de efectivo
            (SELECT COALESCE(SUM(amount), 0) FROM public.cash_movements cm WHERE cm.session_id = cbs.id AND cm.type = 'IN') AS total_cash_in,
            (SELECT COALESCE(SUM(amount), 0) FROM public.cash_movements cm WHERE cm.session_id = cbs.id AND cm.type = 'OUT') AS total_cash_out,
            
            -- expected_cash_balance: Saldo esperado en efectivo físico
            (
                cbs.opening_amount + 
                (SELECT COALESCE(SUM(total), 0) FROM public.sales s WHERE s.session_id = cbs.id AND s.status = 'COMPLETED' AND s.payment_method = 'CASH') +
                (SELECT COALESCE(SUM(amount), 0) FROM public.cash_movements cm WHERE cm.session_id = cbs.id AND cm.type = 'IN') -
                (SELECT COALESCE(SUM(amount), 0) FROM public.cash_movements cm WHERE cm.session_id = cbs.id AND cm.type = 'OUT')
            ) AS expected_cash_balance

        FROM public.cash_box_sessions cbs
        LEFT JOIN public.users u ON cbs.user_id = u.id
        LEFT JOIN public.pos_terminals pt ON cbs.pos_terminal_id = pt.id
        LEFT JOIN public.stores s ON cbs.store_id = s.id
        WHERE 
            ($1::timestamp IS NULL OR cbs.opened_at >= $1)
            AND ($2::timestamp IS NULL OR cbs.opened_at <= $2)
            AND ($3::int IS NULL OR cbs.pos_terminal_id = $3)
            AND ($4::int IS NULL OR cbs.user_id = $4)
            AND ($5::uuid IS NULL OR cbs.store_id = $5)
        ORDER BY cbs.opened_at DESC
        LIMIT $6 OFFSET $7;
      `,
      [
        start_date || null,
        end_date || null,
        pos_terminal_id || null,
        finalUserId,
        finalStoreId,
        limit,
        offset
      ]
    );

    const countResult = await pool.query(`
        SELECT COUNT(*) as total_records
        FROM public.cash_box_sessions cbs
        LEFT JOIN public.users u ON cbs.user_id = u.id
        LEFT JOIN public.pos_terminals pt ON cbs.pos_terminal_id = pt.id
        LEFT JOIN public.stores s ON cbs.store_id = s.id
        WHERE 
            ($1::timestamp IS NULL OR cbs.opened_at >= $1)
            AND ($2::timestamp IS NULL OR cbs.opened_at <= $2)
            AND ($3::int IS NULL OR cbs.pos_terminal_id = $3)
            AND ($4::int IS NULL OR cbs.user_id = $4)
            AND ($5::uuid IS NULL OR cbs.store_id = $5)
    `, [
      start_date || null,
      end_date || null,
      pos_terminal_id || null,
      finalUserId,
      finalStoreId,
    ]);

    const total = Number(countResult.rows[0].total_records);
    const totalPages = Math.ceil(total / Number(limit));

    res.status(200).json({
      response: "success",
      cashBoxSessions: result.rows,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages
      }
    });
  } catch (err: any) {
    console.error("Error en getCashBoxSessions:", err);
    res.status(500).json({ response: "error", error: err.message });
  }
};