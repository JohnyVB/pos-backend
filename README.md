# 🛒 POSApp - Sistema de Punto de Venta & Gestión de Inventario

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Bootstrap-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white" alt="Bootstrap" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
</p>

**POSApp** es una solución integral y escalable para la gestión de ventas, inventario, promociones avanzadas y control de cajas en tiempo real para negocios de retail o comercio multi-tienda.

---

## 🚀 Características Principales

### 🏷️ Motor de Promociones Inteligente
* **Promociones Porcentuales:** Aplicación de % de descuento automático sobre el precio base.
* **Ofertas Multibuy (2x1, 3x2, etc.):** Cálculo dinámico en el POS identificando automáticamente las unidades a descontar.
* **Priorización y Exclusividad:** Algoritmo que evita sobreposiciones de descuentos infinitos.

### 💰 Gestión de Caja y Sesiones
* Apertura y Cierre de caja registradora con arqueo automático.
* Registro de movimientos manuales de caja (*Cash In / Cash Out*).
* Historial detallado por terminal, usuario y rango de fechas.
* Detección visual de descuadres de dinero esperados vs. recaudados.

### 📦 Inventario & Buscador Optimizado
* Buscador en tiempo real de productos por nombre o código de barras mediante servidor con **Debounce**.
* Control estricto de stock mediante **transacciones SQL** que evitan ventas sin inventario suficiente.
* Soporte para productos por **Unidad** o por **Peso**.

### 🔄 Historial de Ventas y Devoluciones
* Registro detallado de ventas con desglose de IVA y descuentos totales acumulados.
* Módulo de devoluciones parciales o totales con re-inyección automática al stock.
* Métricas financieras integradas.

### 👥 Multitienda & Roles de Usuario
* **Superadmin:** Acceso global a todas las tiendas e informes consolidados.
* **Admin:** Control total de una tienda específica, catálogo e inventario.
* **Cajero:** Interfaz simplificada para cobro y gestión de caja diaria.

---

## 🛠️ Stack Tecnológico

* **Frontend:** React, TypeScript, React-Bootstrap, Zustand / React Store, Lucide/Bootstrap Icons.
* **Backend:** Node.js, Express.js, TypeScript, PG (PostgreSQL client).
* **Base de Datos:** PostgreSQL con extensiones UUID.

---

## 🗄️ Base de Datos (DDL & Seed)

Ejecuta este script completo en tu PostgreSQL para crear la base de datos, todas sus tablas, índices y cargar los datos iniciales (Seed).

```sql
-- ==========================================
-- 1. CREACIÓN DE LA BASE DE DATOS Y EXTENSIONES
-- ==========================================
CREATE DATABASE pos_db;
\c pos_db;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 2. ESTRUCTURA DE TABLAS (DDL)
-- ==========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- TABLA TIENDAS (STORES)
CREATE TABLE public.stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    phone VARCHAR(20),
    cif_nif VARCHAR(50),
    legal_name VARCHAR(150),
    zip_code VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA USUARIOS (USERS)
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    username VARCHAR(100) NOT NULL DEFAULT '',
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('superadmin', 'admin', 'cashier')) DEFAULT 'cashier',
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA TERMINALES (POS TERMINALS)
CREATE TABLE public.pos_terminals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA CATEGORÍAS (CATEGORIES)
CREATE TABLE public.categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA PRODUCTOS (PRODUCTS)
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    barcode VARCHAR(100),
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    cost_price NUMERIC(10, 2) DEFAULT 0.00,
    vat NUMERIC(5, 2) DEFAULT 0.00,
    sale_type VARCHAR(20) CHECK (sale_type IN ('UNIT', 'WEIGHT')) DEFAULT 'UNIT',
    category_id INTEGER REFERENCES public.categories(id) ON DELETE SET NULL,
    min_stock NUMERIC(10, 2) DEFAULT 0.00,
    active BOOLEAN DEFAULT TRUE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA INVENTARIO (INVENTORY)
CREATE TABLE public.inventory (
    id SERIAL PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    quantity NUMERIC(10, 3) NOT NULL DEFAULT 0.000,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_product_store UNIQUE (product_id, store_id)
);

-- TABLA MOVIMIENTOS DE INVENTARIO
CREATE TABLE public.inventory_movements (
    id BIGSERIAL PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    movement_type VARCHAR(20) NOT NULL,
    quantity NUMERIC(10, 3) NOT NULL,
    reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE
);

-- TABLA PROMOCIONES (PROMOTIONS)
CREATE TABLE public.promotions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('PERCENTAGE', 'MULTIBUY')) NOT NULL,
    discount_rate NUMERIC(5, 2) DEFAULT 0.00,
    buy_qty INTEGER DEFAULT 0,
    pay_qty INTEGER DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA INTERMEDIA PROMOCIONES-PRODUCTOS (PROMOTION_ITEMS)
CREATE TABLE public.promotion_items (
    id SERIAL PRIMARY KEY,
    promotion_id INTEGER NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    CONSTRAINT unique_product_promotion UNIQUE (promotion_id, product_id)
);

-- TABLA SESIONES DE CAJA (CASH_BOX_SESSIONS)
CREATE TABLE public.cash_box_sessions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id),
    pos_terminal_id INTEGER NOT NULL REFERENCES public.pos_terminals(id),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    opening_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    closing_amount NUMERIC(10, 2),
    status VARCHAR(10) CHECK (status IN ('OPEN', 'CLOSED')) DEFAULT 'OPEN',
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE
);

-- TABLA VENTAS (SALES)
CREATE TABLE public.sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id),
    session_id INTEGER NOT NULL REFERENCES public.cash_box_sessions(id),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    vat_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(20) CHECK (payment_method IN ('CASH', 'CARD', 'MIXED')) DEFAULT 'CASH',
    amount_received NUMERIC(10, 2) DEFAULT 0.00,
    change_amount NUMERIC(10, 2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'COMPLETED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA ÍTEMS DE VENTA (SALE_ITEMS)
CREATE TABLE public.sale_items (
    id SERIAL PRIMARY KEY,
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    quantity NUMERIC(10, 3) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    original_price NUMERIC(10, 2) NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    vat NUMERIC(5, 2) DEFAULT 0.00,
    returned_quantity NUMERIC(10, 3) DEFAULT 0.000,
    promo_id INTEGER REFERENCES public.promotions(id),
    discount_applied NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA MOVIMIENTOS DE CAJA (CASH_MOVEMENTS)
CREATE TABLE public.cash_movements (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES public.cash_box_sessions(id) ON DELETE CASCADE,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id),
    type VARCHAR(10) CHECK (type IN ('IN', 'OUT')) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA DEVOLUCIONES (REFUNDS)
CREATE TABLE public.refunds (
    id SERIAL PRIMARY KEY,
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id),
    session_id INTEGER NOT NULL REFERENCES public.cash_box_sessions(id),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    total_refunded NUMERIC(10, 2) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA ÍTEMS DE DEVOLUCIÓN (REFUND_ITEMS)
CREATE TABLE public.refund_items (
    id SERIAL PRIMARY KEY,
    refund_id INTEGER NOT NULL REFERENCES public.refunds(id) ON DELETE CASCADE,
    sale_item_id INTEGER NOT NULL REFERENCES public.sale_items(id),
    product_id UUID NOT NULL REFERENCES public.products(id),
    quantity NUMERIC(10, 3) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ÍNDICES
CREATE INDEX idx_products_search ON public.products (store_id, active, name, barcode);
CREATE INDEX idx_sales_session ON public.sales (session_id);
CREATE INDEX idx_inventory_product ON public.inventory (product_id, store_id);
CREATE INDEX idx_users_store ON public.users (store_id);
CREATE INDEX idx_categories_store ON public.categories (store_id);
CREATE INDEX idx_terminals_store ON public.pos_terminals (store_id);

-- ==========================================
-- 3. DATOS INICIALES DE PRUEBA (SEED)
-- ==========================================

-- Tienda Inicial
INSERT INTO public.stores (id, name, address, phone)
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Tienda Principal - Centro', 'Calle Mayor 123, Madrid', '+34 912 345 678');

-- Terminal Inicial
INSERT INTO public.terminals (id, name, store_id)
VALUES (1, 'Caja Principal 01', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

-- Categoría Inicial
INSERT INTO public.categories (id, name, store_id)
VALUES (1, 'Bebidas y Refrescos', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

-- Usuarios (Contraseña para los 3: 123456)
INSERT INTO public.users (id, name, email, password, role, store_id)
VALUES 
('11111111-1111-1111-1111-111111111111', 'Super Administrador', 'superadmin@pos.com', '$2b$10$iM.o3U3hZ6R7WjV.D/5K..VvG8nB7yD.s8K2Z6Z6Z6Z6Z6Z6Z6Z6Z', 'superadmin', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
('22222222-2222-2222-2222-222222222222', 'Admin Tienda', 'admin@pos.com', '$2b$10$iM.o3U3hZ6R7WjV.D/5K..VvG8nB7yD.s8K2Z6Z6Z6Z6Z6Z6Z6Z6Z', 'admin', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
('33333333-3333-3333-3333-333333333333', 'Cajero Demo', 'cashier@pos.com', '$2b$10$iM.o3U3hZ6R7WjV.D/5K..VvG8nB7yD.s8K2Z6Z6Z6Z6Z6Z6Z6Z6Z', 'cashier', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

-- Producto Inicial e Inventario
INSERT INTO public.products (id, name, barcode, price, cost_price, vat, sale_type, category_id, min_stock, active, store_id)
VALUES ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Coca-Cola Original 330ml', '8412345678901', 1.50, 0.60, 21.00, 'UNIT', 1, 10.00, true, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

INSERT INTO public.inventory (product_id, store_id, quantity)
VALUES ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 100.000);
