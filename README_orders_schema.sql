-- Orders tracking schema (PostgreSQL)
-- Run this in your database (Neon/Postgres) to create the required tables.

BEGIN;

-- Stores one row per order.
-- items_json stores an array of { name, qty, unitPrice, lineTotal }
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE,
  total_price NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SR',
  items_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Stores customer/delivery data, 1 row per order.
CREATE TABLE IF NOT EXISTS order_customers (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  address1 TEXT NOT NULL,
  address2 TEXT NOT NULL DEFAULT '',
  district TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_customers_name ON order_customers(name);

COMMIT;
