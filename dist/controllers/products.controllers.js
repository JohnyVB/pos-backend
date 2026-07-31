"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductsWithLowStock = exports.getProductByBarcode = exports.searchProductByQuery = exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProducts = void 0;
const postgresql_config_1 = require("../config/postgresql.config");
const getProducts = async (req, res) => {
    const { user } = req;
    const { store_id } = req.params;
    const { vat, min_stock, category_id, sale_type, page = 1, limit = 10, searchTerm = "" } = req.body;
    const offset = (Number(page) - 1) * Number(limit);
    let finalStoreId = null;
    if (user?.role !== "superadmin") {
        finalStoreId = store_id || null;
    }
    else {
        finalStoreId = user.store_id;
    }
    const formattedSearch = searchTerm ? `%${searchTerm}%` : null;
    try {
        const result = await postgresql_config_1.pool.query(`SELECT
          p.id,
          p.name,
          p.barcode,
          p.price,
          p.cost_price,
          p.vat,
          p.sale_type,
          p.category_id,
          p.min_stock,
          p.active,
          p.store_id,
          p.created_at,
          c.name AS category_name,
          s.name AS store_name,
          i.quantity AS stock,
          -- Nuevos campos de promoción
          pr.name AS promo_name,
          pr.type AS promo_type,
          pr.discount_rate,
          pr.buy_qty,
          pr.pay_qty
      FROM public.products p
      JOIN public.categories c ON p.category_id = c.id
      JOIN public.stores s ON p.store_id = s.id
      LEFT JOIN public.inventory i ON p.id = i.product_id AND i.store_id = p.store_id
      -- Unimos con la tabla intermedia
      LEFT JOIN public.promotion_items pi ON p.id = pi.product_id
      -- Unimos con la tabla de promociones validando que esté vigente
      LEFT JOIN public.promotions pr ON pi.promotion_id = pr.id
          AND pr.active = true
          AND NOW() BETWEEN pr.start_date AND pr.end_date
      WHERE p.active = true
          AND ($1::uuid IS NULL OR p.store_id = $1)
          AND ($2::numeric IS NULL OR p.vat = $2)
          AND ($3::numeric IS NULL OR p.min_stock = $3)
          AND ($4::integer IS NULL OR p.category_id = $4)
          AND ($5::text IS NULL OR p.sale_type = $5)
          AND ($6::text IS NULL OR p.name ILIKE $6 OR p.barcode ILIKE $6)
      ORDER BY p.name ASC
      LIMIT $7 OFFSET $8`, [finalStoreId, vat, min_stock, category_id, sale_type, formattedSearch, limit, offset]);
        const countResult = await postgresql_config_1.pool.query(`SELECT COUNT(*) as total
       FROM public.products p
       WHERE p.active = true
         AND ($1::uuid IS NULL OR p.store_id = $1)
         AND ($2::numeric IS NULL OR p.vat = $2)
         AND ($3::numeric IS NULL OR p.min_stock = $3)
         AND ($4::integer IS NULL OR p.category_id = $4)
         AND ($5::text IS NULL OR p.sale_type = $5)`, [finalStoreId, vat, min_stock, category_id, sale_type]);
        const total = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(total / Number(limit));
        res.status(200).json({
            response: "success",
            products: result.rows,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages
            }
        });
    }
    catch (err) {
        res.status(500).json({ response: "error", message: err.message });
    }
};
exports.getProducts = getProducts;
const createProduct = async (req, res) => {
    const { store_id } = req.params;
    const { name, barcode, price, vat, category_id, sale_type, cost_price } = req.body;
    try {
        // crear el producto en la base de datos
        const result = await postgresql_config_1.pool.query(`INSERT INTO products (name, barcode, price, vat, category_id, sale_type, cost_price, active, store_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,true,$8)
       RETURNING *`, [name, barcode, price, vat, category_id, sale_type, cost_price, store_id]);
        // agregar el producto al inventario con cantidad 0
        await postgresql_config_1.pool.query(`INSERT INTO inventory (product_id, quantity, store_id)
       VALUES ($1, 0, $2)`, [result.rows[0].id, store_id]);
        res.status(201).json({ response: "success", product: result.rows[0] });
    }
    catch (err) {
        res.status(500).json({ response: "error", message: err.message });
    }
};
exports.createProduct = createProduct;
const updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, barcode, price, vat, category_id, sale_type, min_stock, cost_price } = req.body;
    try {
        const result = await postgresql_config_1.pool.query(`UPDATE products SET name=$1, barcode=$2, price=$3, vat=$4, category_id=$5, sale_type=$6, min_stock=$7, cost_price=$8
       WHERE id=$9 RETURNING *`, [name, barcode, price, vat, category_id, sale_type, min_stock, cost_price, id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ response: "error", message: "Product not found" });
        }
        res.status(200).json({ response: "success", product: result.rows[0] });
    }
    catch (err) {
        res.status(500).json({ response: "error", message: err.message });
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await postgresql_config_1.pool.query("UPDATE products SET active=false WHERE id=$1 RETURNING *", [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ response: "error", message: "Product not found" });
        }
        res.status(200).json({ response: "success", product: result.rows[0] });
    }
    catch (err) {
        res.status(500).json({ response: "error", message: err.message });
    }
};
exports.deleteProduct = deleteProduct;
const searchProductByQuery = async (req, res) => {
    const { query, store_id } = req.params;
    const { user } = req;
    let storeId = null;
    if (user && user.role === "superadmin") {
        storeId = null;
    }
    else {
        storeId = store_id;
    }
    try {
        const result = await postgresql_config_1.pool.query(`
      SELECT p.*, COALESCE(i.quantity, 0) as quantity, s.name as store_name 
        FROM products p 
        LEFT JOIN inventory i ON p.id = i.product_id
        INNER JOIN stores s ON p.store_id = s.id
        WHERE p.active = true 
          AND ($2::uuid IS NULL OR p.store_id = $2) 
          AND (p.name ILIKE $1 OR p.barcode ILIKE $1)
       `, [`%${query}%`, storeId]);
        res.status(200).json({ response: "success", product: result.rows[0] });
    }
    catch (err) {
        res.status(500).json({ response: "error", message: err.message });
    }
};
exports.searchProductByQuery = searchProductByQuery;
const getProductByBarcode = async (req, res) => {
    const { barcode, store_id } = req.params;
    try {
        const result = await postgresql_config_1.pool.query(`
      SELECT 
        p.id, 
        p.name, 
        p.barcode, 
        p.price, 
        p.vat, 
        p.sale_type, 
        p.cost_price,
        i.quantity AS stock,
        -- Campos de la promoción (vendrán NULL si no hay una activa)
        pr.id AS promo_id,
        pr.name AS promo_name,
        pr.type AS promo_type,
        pr.discount_rate,
        pr.buy_qty,
        pr.pay_qty
      FROM public.products p
      JOIN public.inventory i ON p.id = i.product_id AND i.store_id = p.store_id
      LEFT JOIN public.promotion_items pi ON p.id = pi.product_id
      LEFT JOIN public.promotions pr ON pi.promotion_id = pr.id 
        AND pr.active = true 
        AND NOW() BETWEEN pr.start_date AND pr.end_date
      WHERE p.barcode = $1 
        AND p.active = true 
        AND p.store_id = $2;
    `, [barcode, store_id]);
        res.status(200).json({ response: "success", product: result.rows[0] });
    }
    catch (err) {
        res.status(500).json({ response: "error", message: err.message });
    }
};
exports.getProductByBarcode = getProductByBarcode;
const getProductsWithLowStock = async (req, res) => {
    const { store_id } = req.params;
    const { user } = req;
    let storeId = null;
    if (user && user.role === "superadmin") {
        storeId = null;
    }
    else {
        storeId = store_id;
    }
    try {
        const result = await postgresql_config_1.pool.query(`SELECT
            p.id,
            p.name,
            p.barcode,
            p.min_stock,
            COALESCE(i.quantity, 0) AS current_stock,
            c.name AS category_name,
            s.name AS store_name
        FROM public.products p
        JOIN public.categories c ON p.category_id = c.id
        JOIN public.stores s ON p.store_id = s.id
        LEFT JOIN public.inventory i ON p.id = i.product_id AND i.store_id = p.store_id
        WHERE p.active = true
          AND ($1::uuid IS NULL OR p.store_id = $1)
          AND COALESCE(i.quantity, 0) <= p.min_stock
        ORDER BY
            s.name ASC,
            (COALESCE(i.quantity, 0) / NULLIF(p.min_stock, 0)) ASC;
      `, [storeId]);
        res.status(200).json({ response: "success", products: result.rows });
    }
    catch (err) {
        res.status(500).json({ response: "error", message: err.message });
    }
};
exports.getProductsWithLowStock = getProductsWithLowStock;
