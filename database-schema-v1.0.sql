-- ============================================================================
-- ALL IN ONE STORE HUB - PostgreSQL Schema v1.0
-- Author: Database & Performance Specialist
-- Date: 2026-08-18
-- Description: Complete schema with ACID compliance, Optimistic Locking
-- ============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ============================================================================
-- 1. ENUM TYPES
-- ============================================================================

CREATE TYPE role_type AS ENUM ('manager', 'admin', 'finance');
CREATE TYPE invoice_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'confirmed');
CREATE TYPE reconciliation_status AS ENUM ('matched', 'missing_in_ocr', 'extra_in_ocr', 'amount_mismatch');

-- ============================================================================
-- 2. CORE TABLES
-- ============================================================================

-- Users & Authentication
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role role_type DEFAULT 'manager' NOT NULL,
  store_id INT,
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_store_id ON users(store_id);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Stores (가게 정보)
CREATE TABLE stores (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  region VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_stores_name ON stores(name);
CREATE INDEX idx_stores_region ON stores(region);

-- Suppliers (공급사)
CREATE TABLE suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  code VARCHAR(50) UNIQUE,
  email VARCHAR(255),
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_suppliers_name ON suppliers(name);
CREATE INDEX idx_suppliers_code ON suppliers(code);

-- ============================================================================
-- 3. SALES MANAGEMENT
-- ============================================================================

-- Sales (일일 매출) - 핵심 테이블
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id INT NOT NULL,
  date DATE NOT NULL,
  total_revenue DECIMAL(12, 2) NOT NULL,
  cash_payment DECIMAL(12, 2) DEFAULT 0,
  card_payment DECIMAL(12, 2) DEFAULT 0,
  notes TEXT,

  -- Optimistic Locking
  version INT DEFAULT 1 NOT NULL,

  -- 수정 불가 기간 (입력 후 24시간만 수정 가능)
  is_locked BOOLEAN DEFAULT FALSE,

  -- Audit fields
  created_by INT NOT NULL,
  updated_by INT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),

  -- Constraints
  CONSTRAINT fk_sales_store FOREIGN KEY (store_id) REFERENCES stores(id),
  CONSTRAINT fk_sales_created_by FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT fk_sales_updated_by FOREIGN KEY (updated_by) REFERENCES users(id),
  CONSTRAINT check_revenue CHECK (total_revenue >= 0),
  CONSTRAINT check_payments CHECK (cash_payment + card_payment = total_revenue),
  CONSTRAINT unique_store_date UNIQUE(store_id, date)
);

-- 성능 최적화 인덱스
CREATE INDEX idx_sales_store_date ON sales(store_id, date DESC);
CREATE INDEX idx_sales_created_at ON sales(created_at DESC);
CREATE INDEX idx_sales_date_range ON sales(date) WHERE is_locked = FALSE;

-- Sales Audit Log (감시 로그 - Write-once, append-only)
CREATE TABLE sales_audit_log (
  id BIGSERIAL PRIMARY KEY,
  sales_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  changed_by INT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  change_reason TEXT,
  client_ip INET,
  changed_at TIMESTAMP DEFAULT now(),

  CONSTRAINT fk_audit_sales FOREIGN KEY (sales_id) REFERENCES sales(id),
  CONSTRAINT fk_audit_user FOREIGN KEY (changed_by) REFERENCES users(id)
);

-- 감시 로그 인덱스 (조회용)
CREATE INDEX idx_audit_sales_id ON sales_audit_log(sales_id DESC);
CREATE INDEX idx_audit_changed_at ON sales_audit_log(changed_at DESC);
CREATE INDEX idx_audit_changed_by ON sales_audit_log(changed_by);

-- ============================================================================
-- 4. INVOICE & OCR MANAGEMENT
-- ============================================================================

-- Invoices (인보이스 원본 이미지)
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id INT NOT NULL,
  supplier_id INT,
  image_url TEXT NOT NULL, -- S3/GCS path
  image_hash VARCHAR(64), -- SHA256 for deduplication

  status invoice_status DEFAULT 'pending' NOT NULL,
  upload_date TIMESTAMP DEFAULT now(),

  -- OCR 처리 상태
  ocr_attempted_at TIMESTAMP,
  ocr_completed_at TIMESTAMP,
  ocr_error_message TEXT,

  -- Manual override
  is_manually_entered BOOLEAN DEFAULT FALSE,

  created_by INT NOT NULL,
  confirmed_by INT,
  confirmed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),

  CONSTRAINT fk_invoice_store FOREIGN KEY (store_id) REFERENCES stores(id),
  CONSTRAINT fk_invoice_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  CONSTRAINT fk_invoice_created_by FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT fk_invoice_confirmed_by FOREIGN KEY (confirmed_by) REFERENCES users(id)
);

CREATE INDEX idx_invoices_store_id ON invoices(store_id);
CREATE INDEX idx_invoices_supplier_id ON invoices(supplier_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_image_hash ON invoices(image_hash);
CREATE INDEX idx_invoices_upload_date ON invoices(upload_date DESC);

-- Invoice OCR Results (OCR 추출 결과)
CREATE TABLE invoice_ocr_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL UNIQUE,

  -- Extracted data
  supplier_name VARCHAR(255),
  invoice_number VARCHAR(50),
  total_amount DECIMAL(12, 2),
  invoice_date DATE,

  -- Confidence scores (0.0 ~ 1.0)
  confidence_scores JSONB, -- {"supplier": 0.95, "number": 0.88, "amount": 0.99, "date": 0.92}

  -- Raw OCR output (for debugging)
  raw_ocr_output JSONB,

  -- Which model processed this
  model_used VARCHAR(50), -- "google_vision", "tesseract", "hybrid"
  processing_time_ms INT,

  processed_at TIMESTAMP DEFAULT now(),

  CONSTRAINT fk_ocr_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

CREATE INDEX idx_ocr_invoice_id ON invoice_ocr_results(invoice_id);
CREATE INDEX idx_ocr_supplier_name ON invoice_ocr_results(supplier_name);
CREATE INDEX idx_ocr_invoice_number ON invoice_ocr_results(invoice_number);

-- Invoice OCR Processing Logs (처리 이력)
CREATE TABLE invoice_ocr_logs (
  id BIGSERIAL PRIMARY KEY,
  invoice_id UUID NOT NULL,

  event_type VARCHAR(50), -- "queued", "processing", "success", "failure", "retry"
  retry_count INT DEFAULT 0,
  error_message TEXT,

  model_attempted VARCHAR(50),
  duration_ms INT,

  created_at TIMESTAMP DEFAULT now(),

  CONSTRAINT fk_log_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

CREATE INDEX idx_ocr_logs_invoice_id ON invoice_ocr_logs(invoice_id DESC);
CREATE INDEX idx_ocr_logs_created_at ON invoice_ocr_logs(created_at DESC);

-- ============================================================================
-- 5. RECONCILIATION & STATEMENT MANAGEMENT
-- ============================================================================

-- Statements (공급사 Statement)
CREATE TABLE statements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id INT NOT NULL,

  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  file_url TEXT,
  file_type VARCHAR(20), -- "xlsx", "csv", "pdf"

  -- Parsed statement items
  parsed_data JSONB, -- [{invoice_number, amount, date}, ...]
  total_statement_amount DECIMAL(15, 2),

  uploaded_by INT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT now(),

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),

  CONSTRAINT fk_statement_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  CONSTRAINT fk_statement_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE INDEX idx_statements_supplier_id ON statements(supplier_id);
CREATE INDEX idx_statements_period ON statements(period_start, period_end);
CREATE INDEX idx_statements_uploaded_at ON statements(uploaded_at DESC);

-- Reconciliation Results (Statement vs Invoice 비교 결과)
CREATE TABLE reconciliation_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  statement_id UUID NOT NULL,
  invoice_id UUID, -- NULL if only in Statement

  -- Match info
  status reconciliation_status NOT NULL,
  match_score DECIMAL(3, 2), -- 0.0 ~ 1.0

  -- Amount comparison
  statement_amount DECIMAL(12, 2),
  invoice_amount DECIMAL(12, 2),
  amount_difference DECIMAL(12, 2),
  amount_difference_pct DECIMAL(5, 2),

  -- Invoice info from statement
  statement_invoice_number VARCHAR(50),
  statement_invoice_date DATE,

  -- Resolution
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_by INT,
  resolved_at TIMESTAMP,
  resolution_note TEXT,

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),

  CONSTRAINT fk_recon_statement FOREIGN KEY (statement_id) REFERENCES statements(id),
  CONSTRAINT fk_recon_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id),
  CONSTRAINT fk_recon_resolved_by FOREIGN KEY (resolved_by) REFERENCES users(id),
  CONSTRAINT check_amount_diff CHECK (
    (status != 'matched' AND amount_difference IS NOT NULL) OR
    (status = 'matched' AND amount_difference = 0)
  )
);

-- 성능 최적화 인덱스
CREATE INDEX idx_recon_statement_id ON reconciliation_results(statement_id);
CREATE INDEX idx_recon_invoice_id ON reconciliation_results(invoice_id);
CREATE INDEX idx_recon_status ON reconciliation_results(status);
CREATE INDEX idx_recon_is_resolved ON reconciliation_results(is_resolved) WHERE is_resolved = FALSE;
CREATE INDEX idx_recon_created_at ON reconciliation_results(created_at DESC);

-- Reconciliation Mismatches (최종 불일치 항목)
CREATE TABLE reconciliation_mismatches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  statement_id UUID NOT NULL,
  recon_result_id UUID,

  -- 문제 내용
  issue_type VARCHAR(100), -- "missing_in_ocr", "extra_in_ocr", "amount_mismatch", "date_mismatch"
  severity VARCHAR(20), -- "critical", "high", "medium", "low"

  -- 상세 정보
  store_id INT,
  supplier_name VARCHAR(255),
  invoice_number VARCHAR(50),
  expected_amount DECIMAL(12, 2),
  actual_amount DECIMAL(12, 2),
  invoice_date DATE,

  -- 해결 상태
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_by INT,
  resolved_at TIMESTAMP,
  resolution_action TEXT, -- "manual_entry", "deleted", "merged", "approved"

  created_at TIMESTAMP DEFAULT now(),

  CONSTRAINT fk_mismatch_statement FOREIGN KEY (statement_id) REFERENCES statements(id),
  CONSTRAINT fk_mismatch_recon FOREIGN KEY (recon_result_id) REFERENCES reconciliation_results(id),
  CONSTRAINT fk_mismatch_store FOREIGN KEY (store_id) REFERENCES stores(id),
  CONSTRAINT fk_mismatch_resolved_by FOREIGN KEY (resolved_by) REFERENCES users(id)
);

CREATE INDEX idx_mismatches_statement_id ON reconciliation_mismatches(statement_id);
CREATE INDEX idx_mismatches_is_resolved ON reconciliation_mismatches(is_resolved) WHERE is_resolved = FALSE;
CREATE INDEX idx_mismatches_severity ON reconciliation_mismatches(severity);
CREATE INDEX idx_mismatches_created_at ON reconciliation_mismatches(created_at DESC);

-- ============================================================================
-- 6. IDEMPOTENCY & DEDUPLICATION
-- ============================================================================

-- Idempotency Keys (중복 방지)
CREATE TABLE idempotency_keys (
  id UUID PRIMARY KEY,
  client_key VARCHAR(255) UNIQUE NOT NULL, -- Client가 제공하는 고유 키

  resource_type VARCHAR(50), -- "sales", "invoice", "statement"
  resource_id UUID,

  request_hash VARCHAR(64), -- Request body hash
  result_code INT,
  result_body JSONB,

  created_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP DEFAULT (now() + INTERVAL '24 hours'),

  CONSTRAINT check_expiry CHECK (expires_at > created_at)
);

CREATE INDEX idx_idempotency_client_key ON idempotency_keys(client_key);
CREATE INDEX idx_idempotency_expires_at ON idempotency_keys(expires_at);

-- ============================================================================
-- 7. VIEWS (Analysis & Reporting)
-- ============================================================================

-- Sales Summary View (성능 최적화된 조회)
CREATE VIEW v_sales_summary AS
SELECT
  s.store_id,
  st.name as store_name,
  DATE_TRUNC('day', s.created_at)::DATE as date,
  COUNT(*) as total_entries,
  SUM(s.total_revenue) as daily_revenue,
  SUM(s.cash_payment) as cash_total,
  SUM(s.card_payment) as card_total,
  MAX(s.updated_at) as last_updated
FROM sales s
JOIN stores st ON s.store_id = st.id
GROUP BY s.store_id, st.name, DATE_TRUNC('day', s.created_at)::DATE;

-- Invoice Processing Status View
CREATE VIEW v_invoice_status AS
SELECT
  i.status,
  COUNT(*) as count,
  COUNT(CASE WHEN i.ocr_completed_at IS NOT NULL THEN 1 END) as ocr_completed,
  AVG(EXTRACT(EPOCH FROM (i.ocr_completed_at - i.upload_date))) as avg_processing_time_sec
FROM invoices i
GROUP BY i.status;

-- Reconciliation Summary View
CREATE VIEW v_reconciliation_summary AS
SELECT
  s.supplier_id,
  sup.name as supplier_name,
  s.period_start,
  s.period_end,
  COUNT(rr.id) as total_invoices_checked,
  SUM(CASE WHEN rr.status = 'matched' THEN 1 ELSE 0 END) as matched_count,
  SUM(CASE WHEN rr.status != 'matched' THEN 1 ELSE 0 END) as mismatch_count,
  SUM(CASE WHEN rm.is_resolved = TRUE THEN 1 ELSE 0 END) as resolved_mismatches
FROM statements s
JOIN suppliers sup ON s.supplier_id = sup.id
LEFT JOIN reconciliation_results rr ON s.id = rr.statement_id
LEFT JOIN reconciliation_mismatches rm ON s.id = rm.statement_id
GROUP BY s.id, sup.id, sup.name, s.period_start, s.period_end;

-- ============================================================================
-- 8. FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update timestamp on sales
CREATE TRIGGER trg_sales_update_timestamp
BEFORE UPDATE ON sales
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Function: Auto-lock sales 24h after creation
CREATE OR REPLACE FUNCTION lock_old_sales()
RETURNS VOID AS $$
BEGIN
  UPDATE sales
  SET is_locked = TRUE
  WHERE created_at < now() - INTERVAL '24 hours'
    AND is_locked = FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function: Check invoice ocr rate
CREATE OR REPLACE FUNCTION get_ocr_accuracy(
  p_store_id INT DEFAULT NULL,
  p_period_days INT DEFAULT 7
)
RETURNS TABLE (
  total_invoices BIGINT,
  successful_ocr BIGINT,
  failed_ocr BIGINT,
  success_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(i.id)::BIGINT,
    COUNT(CASE WHEN i.status = 'confirmed' THEN 1 END)::BIGINT,
    COUNT(CASE WHEN i.status = 'failed' THEN 1 END)::BIGINT,
    ROUND(
      COUNT(CASE WHEN i.status = 'confirmed' THEN 1 END)::NUMERIC /
      COUNT(i.id)::NUMERIC * 100,
      2
    )
  FROM invoices i
  WHERE (p_store_id IS NULL OR i.store_id = p_store_id)
    AND i.upload_date >= now() - (p_period_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. TRANSACTION ISOLATION LEVEL
-- ============================================================================

-- Default: READ_COMMITTED (Balance between consistency & performance)
-- For critical sections (Reconciliation): SERIALIZABLE
-- Optimistic Locking handled at application level using version field

-- ============================================================================
-- 10. PERFORMANCE SETTINGS (Query Hints)
-- ============================================================================

-- Enable parallel query execution
ALTER SYSTEM SET max_parallel_workers_per_gather = 4;
ALTER SYSTEM SET max_parallel_workers = 8;

-- Performance statistics
ALTER SYSTEM SET log_statement = 'mod'; -- Log DML only
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log queries > 1000ms

-- Connection pooling recommendation: pgBouncer
-- Pool mode: transaction (for optimal performance)
-- Pool size: min_pool_size = 10, default_pool_size = 25, max_db_connections = 100

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================
/*
마이그레이션 체크리스트:
□ 모든 FOREIGN KEY 참조 테이블이 먼저 생성되었는가?
□ 인덱스가 모두 생성되었는가?
□ 뷰가 정상 작동하는가?
□ 트리거가 정상 작동하는가?
□ 샘플 데이터 INSERT 테스트 완료?
□ 동시성 테스트 (2명 동시 수정) 완료?

성능 목표 달성 확인:
□ EXPLAIN ANALYZE로 각 주요 쿼리 검증
□ Query response time < 200ms (P99)
□ 인덱스 사용 확인 (Index Scan 확인)
□ Cache hit ratio > 90%
*/

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
