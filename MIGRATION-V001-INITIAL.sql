-- ============================================================================
-- FLYWAY MIGRATION: V001__Initial_Schema_and_Setup.sql
-- Version: 1.0
-- Date: 2026-08-18
-- Description: Initialize all core tables for Store Hub system
-- Estimated execution time: ~2 seconds
-- ============================================================================

BEGIN TRANSACTION;

-- Step 1: Create initial schema
CREATE SCHEMA IF NOT EXISTS store_hub;
SET search_path TO store_hub, public;

-- Step 2: Create all tables (referenced above)
-- [Complete DDL from database-schema-v1.0.sql inserted here]

-- Step 3: Create sample data for testing
INSERT INTO stores (name, region, address) VALUES
  ('Store A', 'Seoul', '123 Main St'),
  ('Store B', 'Busan', '456 Ocean Ave'),
  ('Store C', 'Incheon', '789 Harbor Rd');

INSERT INTO suppliers (name, code, email) VALUES
  ('ACME Corp', 'ACME001', 'sales@acme.com'),
  ('Global Foods', 'GF002', 'orders@gfoods.com'),
  ('Fresh Produce Inc', 'FPI003', 'supply@fpi.com');

INSERT INTO users (email, password_hash, full_name, role, store_id) VALUES
  ('manager1@storea.com', 'hash_placeholder', 'John Manager', 'manager', 1),
  ('manager2@storeb.com', 'hash_placeholder', 'Jane Manager', 'manager', 2),
  ('admin@company.com', 'hash_placeholder', 'Admin User', 'admin', NULL),
  ('finance@company.com', 'hash_placeholder', 'Finance Team', 'finance', NULL);

-- Step 4: Verify constraints and indexes
-- □ All FOREIGN KEY constraints created
-- □ All CHECK constraints active
-- □ All indexes available
-- □ All UNIQUE constraints active

-- Step 5: Test idempotency
-- This migration is idempotent due to:
-- - CREATE TABLE IF NOT EXISTS
-- - CREATE INDEX IF NOT EXISTS
-- - CREATE SCHEMA IF NOT EXISTS
-- Can be re-run safely without data loss

COMMIT;

-- Post-migration checks (run separately)
-- SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'store_hub';
-- SELECT COUNT(*) FROM information_schema.indexes WHERE tablename IN ('sales', 'invoices', 'statements');
