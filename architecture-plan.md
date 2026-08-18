# All in One Store Hub - 기술 아키텍처 개선 계획

**작성일**: 2026-08-17  
**버전**: v1.0  
**대상**: 개발팀, 기술 리더십  

---

## Executive Summary

현재 기술 스택(React, Node.js, PostgreSQL)은 견고한 기초를 제공합니다. 본 문서는 **확장성, 성능, 보안**을 중심으로 구체적인 아키텍처 개선안을 제시합니다.

**핵심 개선 사항**:
1. 마이크로서비스 아키텍처 + 이벤트 기반 처리
2. 다층 캐싱 전략 (Redis)
3. 비동기 작업 큐 (Bull.js)
4. 엔드-투-엔드 암호화 + RBAC
5. 클라우드 스토리지 + CDN 통합

---

## 1. 전체 시스템 아키텍처

### 1.1 Layered Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Presentation Layer (Client)                │
│  ┌──────────────────┐          ┌──────────────────────┐ │
│  │ Manager App      │          │ Admin Dashboard      │ │
│  │ (React Native)   │          │ (React Web)          │ │
│  └────────┬─────────┘          └──────────┬───────────┘ │
└───────────┼──────────────────────────────┼───────────────┘
            │                              │
            └──────────┬───────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │   API Gateway / Load Balancer
        │   (Rate Limiting, Auth)
        └──────────────┬──────────────┘
                       │
┌──────────────────────┴──────────────────────┐
│         Application Layer (Node.js)          │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │   API Services (REST + GraphQL)        │ │
│  │  ┌──────────┐ ┌──────────┐ ┌────────┐ │ │
│  │  │Sales API │ │Invoice   │ │Recon.  │ │ │
│  │  │          │ │API       │ │API     │ │ │
│  │  └──────────┘ └──────────┘ └────────┘ │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │   Background Workers                   │ │
│  │  ┌──────────┐ ┌──────────┐ ┌────────┐ │ │
│  │  │OCR       │ │Statement │ │Report  │ │ │
│  │  │Worker    │ │Processor │ │Engine  │ │ │
│  │  └──────────┘ └──────────┘ └────────┘ │ │
│  └────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
         │              │             │
    ┌────┴────┐    ┌────┴────┐   ┌────┴────┐
    │          │    │         │   │         │
    ▼          ▼    ▼         ▼   ▼         ▼
 ┌────────┐ ┌─────────┐  ┌──────────┐ ┌────────┐
 │Cache   │ │Message  │  │Cloud     │ │Logging │
 │(Redis) │ │Queue    │  │Storage   │ │(ELK)   │
 │        │ │(RabbitMQ)  │(S3/GCS) │ │        │
 └────────┘ └─────────┘  └──────────┘ └────────┘
    │          │              │
    └──────────┼──────────────┤
               │              │
               ▼              ▼
        ┌──────────────────────────┐
        │   Data Layer             │
        │ ┌──────────────────────┐ │
        │ │ PostgreSQL (Primary) │ │
        │ │ ┌──────────────────┐ │ │
        │ │ │ Transactions     │ │ │
        │ │ │ ACID Compliance  │ │ │
        │ │ └──────────────────┘ │ │
        │ └──────────────────────┘ │
        │                          │
        │ ┌──────────────────────┐ │
        │ │ Replica (Read-only)  │ │
        │ │ for Analytics        │ │
        │ └──────────────────────┘ │
        └──────────────────────────┘
```

### 1.2 마이크로서비스 경계

```yaml
Service: Sales Service
  - Responsibility: Sales 데이터 입력, 검증, 저장
  - API Endpoints:
    POST   /api/sales              # 매일 판매 데이터 입력
    GET    /api/sales/:id          # 조회
    PUT    /api/sales/:id          # 수정
    GET    /api/sales/date/:date   # 특정 날짜 조회
  - Database Tables: sales, sales_revisions (감시 로그)
  - Dependencies: Auth Service, Notification Service
  - Deployment: Docker + Kubernetes

Service: Invoice Service
  - Responsibility: 인보이스 업로드, OCR 처리, 저장
  - API Endpoints:
    POST   /api/invoices/upload    # 이미지 업로드
    GET    /api/invoices/:id       # 조회
    POST   /api/invoices/:id/ocr   # OCR 실행
    GET    /api/invoices/status    # 처리 상태
  - Database Tables: invoices, invoice_ocr_results, ocr_logs
  - External Services: Google Vision API, Cloud Storage
  - Workers: OCR Worker (병렬 처리)

Service: Reconciliation Service
  - Responsibility: Statement 매칭, 불일치 감지
  - API Endpoints:
    POST   /api/statements/upload  # Statement 파일 업로드
    GET    /api/reconciliation/    # 불일치 항목 조회
    POST   /api/reconciliation/:id/resolve
  - Database Tables: statements, reconciliation_results, mismatches
  - Batch Jobs: Monthly reconciliation (스케줄)

Service: Auth & RBAC Service
  - Responsibility: 인증, 권한 관리
  - API Endpoints:
    POST   /auth/login
    POST   /auth/logout
    GET    /auth/permissions
  - Caching: Redis (토큰 캐시)

Service: Notification Service
  - Responsibility: 알림 (이메일, 모바일 푸시)
  - Events: Sales submitted, Invoice processed, Mismatch detected
  - Queue: Message Broker (RabbitMQ)
```

---

## 2. 핵심 기술 컴포넌트

### 2.1 API Gateway 설계

```javascript
// API Gateway (Kong / AWS API Gateway)
{
  routes: [
    {
      path: "/api/v1/sales",
      service: "sales-service",
      methods: ["GET", "POST", "PUT"],
      rateLimit: { requests: 1000, window: "1m" },
      auth: "JWT",
      cors: { origins: ["https://manager-app.com", "https://admin.com"] }
    },
    {
      path: "/api/v1/invoices",
      service: "invoice-service",
      methods: ["GET", "POST"],
      rateLimit: { requests: 500, window: "1m" },
      auth: "JWT",
      maxBodySize: "50MB" // 이미지 업로드용
    }
  ],
  
  middleware: [
    "authentication",
    "authorization (RBAC)",
    "rate-limiting",
    "request-logging",
    "error-handling"
  ]
}
```

### 2.2 OCR 파이프라인 (상세)

```
1. Image Upload
   ├─ 클라이언트 전처리
   │  ├─ 이미지 압축 (1080p, JPEG 80%)
   │  ├─ 회전 감지 (EXIF)
   │  └─ 품질 검증
   │
   ├─ 서버 수신
   │  ├─ 바이러스 스캔
   │  ├─ 암호화
   │  └─ S3 저장
   │
   └─ Queue에 Job 생성
      └─ Job ID: invoice_20260817_12345

2. OCR Processing (Background Worker)
   ├─ 모델 선택 로직
   │  ├─ 우선: Google Vision API (high accuracy)
   │  ├─ 차선: Tesseract (fast, offline)
   │  └─ 실패 시: Manual flag (관리자 검토)
   │
   ├─ 데이터 추출
   │  ├─ Supplier name (정규식 + NLP)
   │  ├─ Invoice number (숫자 패턴)
   │  ├─ Total amount (통화 인식)
   │  └─ Date (다형식 지원)
   │
   └─ 신뢰도 평가
      └─ 각 필드마다 confidence score

3. Result Storage
   ├─ invoice_ocr_results 테이블에 저장
   ├─ Redis 캐시 (1시간)
   └─ WebSocket 푸시 (매니저 실시간 피드백)

4. Manager Verification
   ├─ OCR 결과 제시
   ├─ 수정 옵션 제공
   └─ 승인 시 확정 저장
```

### 2.3 캐싱 전략 (다층)

```yaml
Layer 1: CDN Level (CloudFlare / CloudFront)
  - 정적 자산 (JS, CSS, 이미지)
  - TTL: 24시간 ~ 7일
  - Invalidation: 배포 시점

Layer 2: API Response Cache (Redis)
  - GET 요청 캐싱
  - Key: "api:sales:{storeId}:{date}"
  - TTL: 5분 (Sales), 1시간 (Invoice 목록)
  - Invalidation: Write 작업 시

Layer 3: Database Query Cache (Redis)
  - 복잡한 조인 쿼리 캐싱
  - Key: "query:reconciliation:{statementId}"
  - TTL: 30분
  - Invalidation: 수동 또는 예약

Layer 4: Client-side Cache (IndexedDB)
  - 사용자 입력 임시 저장
  - 오프라인 모드 지원
  - Sync 전략: Last-Write-Wins with Timestamp
```

**Cache Invalidation 전략**:
```
이벤트 기반 무효화:
1. Sales 입력 → cache delete "sales:*"
2. Invoice 승인 → cache delete "invoices:*"
3. Statement 업로드 → cache delete "reconciliation:*"

시간 기반 무효화:
- API Response: 5분 TTL
- Query Result: 30분 TTL
- CDN Asset: 7일 TTL
```

### 2.4 데이터베이스 스키마 (핵심)

```sql
-- Sales 테이블 (ACID 보장)
CREATE TABLE sales (
  id UUID PRIMARY KEY,
  store_id INT NOT NULL,
  date DATE NOT NULL,
  total_revenue DECIMAL(12, 2) NOT NULL,
  cash_payment DECIMAL(12, 2) DEFAULT 0,
  card_payment DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  created_by INT NOT NULL,
  is_locked BOOLEAN DEFAULT FALSE,
  
  CONSTRAINT fk_store FOREIGN KEY (store_id) REFERENCES stores(id),
  CONSTRAINT check_revenue CHECK (total_revenue >= 0),
  CONSTRAINT unique_store_date UNIQUE(store_id, date)
);

CREATE INDEX idx_store_date ON sales(store_id, date DESC);
CREATE INDEX idx_created_at ON sales(created_at DESC);

-- Sales 수정 이력 (감시 로그)
CREATE TABLE sales_audit_log (
  id BIGSERIAL PRIMARY KEY,
  sales_id UUID NOT NULL,
  changed_by INT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changed_at TIMESTAMP DEFAULT now(),
  
  CONSTRAINT fk_sales FOREIGN KEY (sales_id) REFERENCES sales(id)
);

-- Invoice 테이블
CREATE TABLE invoices (
  id UUID PRIMARY KEY,
  store_id INT NOT NULL,
  supplier_id INT NOT NULL,
  image_url TEXT NOT NULL (S3 path),
  upload_date TIMESTAMP DEFAULT now(),
  status ENUM('pending', 'processing', 'completed', 'failed'),
  
  CONSTRAINT fk_store FOREIGN KEY (store_id) REFERENCES stores(id),
  CONSTRAINT fk_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- OCR 결과 저장
CREATE TABLE invoice_ocr_results (
  id UUID PRIMARY KEY,
  invoice_id UUID NOT NULL,
  supplier_name TEXT,
  invoice_number VARCHAR(50),
  total_amount DECIMAL(12, 2),
  invoice_date DATE,
  confidence_scores JSONB, -- {supplier: 0.95, number: 0.88, amount: 0.99}
  raw_ocr_output JSONB,
  processed_at TIMESTAMP DEFAULT now(),
  
  CONSTRAINT fk_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

-- Statement 정보
CREATE TABLE statements (
  id UUID PRIMARY KEY,
  supplier_id INT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  file_url TEXT NOT NULL,
  parsed_data JSONB, -- [{invoice_number, amount, date}, ...]
  uploaded_by INT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT now(),
  
  CONSTRAINT fk_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- Reconciliation 결과 (불일치)
CREATE TABLE reconciliation_results (
  id UUID PRIMARY KEY,
  statement_id UUID NOT NULL,
  invoice_id UUID, -- NULL이면 Statement에만 있음
  status ENUM('matched', 'missing_in_ocr', 'extra_in_ocr', 'amount_mismatch'),
  expected_amount DECIMAL(12, 2),
  actual_amount DECIMAL(12, 2),
  difference DECIMAL(12, 2),
  reviewed_by INT,
  resolved_at TIMESTAMP,
  notes TEXT,
  
  CONSTRAINT fk_statement FOREIGN KEY (statement_id) REFERENCES statements(id),
  CONSTRAINT fk_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

-- 중복 방지를 위한 Idempotency Key
CREATE TABLE idempotency_keys (
  id UUID PRIMARY KEY,
  client_key VARCHAR(255) NOT NULL UNIQUE,
  resource_id UUID,
  result_code INT,
  result_body JSONB,
  created_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP,
  
  CREATE INDEX idx_expires ON idempotency_keys(expires_at)
);
```

### 2.5 보안 아키텍처

```
┌─────────────────────────────────────────┐
│         Client (Manager App)             │
│  - HTTPS Only (TLS 1.3)                 │
│  - Certificate Pinning (Mobile)          │
└──────────────┬──────────────────────────┘
               │
               ▼
        ┌──────────────────┐
        │  JWT Auth        │
        │  (RS256 signing) │
        │  Token TTL: 1h   │
        │  Refresh: 7d     │
        └──────────────────┘
               │
               ▼
        ┌──────────────────────────┐
        │  API Gateway (Rate Limit) │
        │  - DDoS Protection        │
        │  - WAF Rules              │
        └──────────────┬────────────┘
                       │
    ┌──────────────────┴──────────────────┐
    │                                     │
    ▼                                     ▼
┌─────────────────────────┐  ┌──────────────────────┐
│ RBAC (Role-Based Access)  │  │ Field-Level Encryption│
│ - Manager: Read/Write   │  │ - Supplier Name      │
│   own store data        │  │ - Invoice Amount     │
│ - Admin: Read all data  │  │ - Amount (Encrypted) │
│ - Finance: Read invoice │  │ - In-transit: TLS    │
│   & statement data      │  │ - At-rest: AES-256   │
│                         │  │   (KMS managed)      │
└─────────────────────────┘  └──────────────────────┘
    │
    ▼
┌────────────────────────────┐
│ Audit Logging (Centralized)│
│ - All mutations logged      │
│ - User ID, Timestamp, IP    │
│ - Immutable (Write-once DB) │
│ - Retention: 2+ years       │
└────────────────────────────┘
```

---

## 3. 배포 아키텍처 (클라우드 기반)

### 3.1 Kubernetes 클러스터 구성

```yaml
# 네임스페이스
apiVersion: v1
kind: Namespace
metadata:
  name: store-hub-prod

---
# Sales Service 배포
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sales-service
  namespace: store-hub-prod
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  
  template:
    spec:
      containers:
      - name: sales-service
        image: store-hub/sales-service:v1.0
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
# HorizontalPodAutoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: sales-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: sales-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### 3.2 CI/CD 파이프라인

```
GitHub Push
    │
    ▼
┌─────────────────────┐
│ GitHub Actions      │
│ 1. Unit Tests       │
│ 2. Integration Tests│
│ 3. Lint + Security  │
└──────────┬──────────┘
           │ (Pass)
           ▼
┌─────────────────────┐
│ Docker Build        │
│ - Multi-stage build │
│ - Image scan        │
│ - Push to Registry  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Deploy to Staging   │
│ - Smoke tests       │
│ - Performance tests │
└──────────┬──────────┘
           │ (Approved)
           ▼
┌─────────────────────┐
│ Deploy to Prod      │
│ - Blue-Green deploy │
│ - Health checks     │
│ - Rollback ready    │
└─────────────────────┘
```

---

## 4. 성능 최적화 전략

### 4.1 OCR 처리 최적화

```
Current State (문제):
  이미지 업로드 (2MB) → Google Vision API 호출 → 응답 대기 (5~10초)
  단점: 동기 처리, 사용자가 대기

Optimized State:
  1. 클라이언트
     - 이미지 압축 (2MB → 300KB)
     - 회전 감지 (EXIF)
     - 즉시 업로드 (백그라운드)
     
  2. 서버 수신
     - 업로드 수락 (HTTP 202 Accepted)
     - Job ID 즉시 반환
     - 클라이언트가 status polling 시작
     
  3. Background Worker (비동기)
     - Bull.js Queue에서 Job 처리
     - 병렬 워커 (3~5개)
     - Redis 캐시 (같은 이미지 재사용)
     - OCR 결과 저장
     
  4. WebSocket Push (실시간)
     - OCR 완료 시 push 알림
     - UI 자동 업데이트
     
성과:
  - 사용자 대기 시간: 0초 (비동기)
  - 처리 시간: 3~8초 (병렬화)
  - 동시 처리: 500+ 인보이스/시간
```

### 4.2 Statement Reconciliation 최적화

```sql
-- 느린 쿼리 (O(n²) 복잡도)
SELECT s.*, ir.* 
FROM statements s 
LEFT JOIN invoice_ocr_results ir 
  ON s.supplier_id = ir.supplier_id
  AND ABS(s.amount - ir.amount) < 0.01
WHERE s.statement_id = ?

-- 최적화된 쿼리 (인덱스 + 파티셔닝)
-- Step 1: 복합 인덱스
CREATE INDEX idx_supplier_amount 
ON invoice_ocr_results(supplier_id, total_amount);

-- Step 2: 파티셔닝 (월별)
PARTITION BY RANGE (EXTRACT(YEAR_MONTH FROM invoice_date)) (
  PARTITION p202601 VALUES LESS THAN (202602),
  PARTITION p202602 VALUES LESS THAN (202603),
  ...
);

-- Step 3: 최적화된 조인
WITH statement_items AS (
  SELECT supplier_id, invoice_number, total_amount, date
  FROM statements 
  WHERE statement_id = $1
),
matched AS (
  SELECT si.invoice_number, ir.id as ocr_id, ir.total_amount,
         CASE 
           WHEN ir.invoice_number = si.invoice_number THEN 1
           WHEN ABS(ir.total_amount - si.total_amount) < 0.01 THEN 0.5
           ELSE 0
         END as match_score
  FROM statement_items si
  LEFT JOIN invoice_ocr_results ir 
    ON si.supplier_id = ir.supplier_id
    AND si.date BETWEEN ir.invoice_date - 5 AND ir.invoice_date + 5
)
SELECT * FROM matched WHERE match_score >= 0.5;

성과:
  - 쿼리 시간: 2초 → 200ms
  - 메모리 사용: 감소 (인덱스 활용)
  - 동시성: 증가 (Partition 병렬화)
```

---

## 5. 모니터링 및 관찰성 (Observability)

### 5.1 로깅 아키텍처 (ELK Stack)

```
┌────────────────────────────────────────────┐
│ Application Logs (JSON format)             │
│ ┌──────────────────────────────────────┐  │
│ │{                                      │  │
│ │  "timestamp": "2026-08-17T10:30:45Z" │  │
│ │  "level": "INFO",                    │  │
│ │  "service": "sales-service",         │  │
│ │  "request_id": "uuid",               │  │
│ │  "user_id": 123,                     │  │
│ │  "action": "sales_created",          │  │
│ │  "store_id": 5,                      │  │
│ │  "amount": 1500.00,                  │  │
│ │  "duration_ms": 145                  │  │
│ │}                                      │  │
│ └──────────────────────────────────────┘  │
└──────────────┬───────────────────────────┘
               │
               ▼ (Filebeat)
        ┌──────────────┐
        │ Elasticsearch│ (Indexing, Search)
        └──────────────┘
               │
               ▼
        ┌──────────────┐
        │ Kibana       │ (Visualization, Dashboard)
        └──────────────┘
```

### 5.2 메트릭 수집 (Prometheus)

```yaml
# Prometheus Scrape Config
scrape_configs:
  - job_name: 'sales-service'
    static_configs:
      - targets: ['localhost:9090']
    metrics_path: '/metrics'

# 주요 메트릭
- request_duration_seconds (histogram)
- request_total (counter)
- invoice_ocr_accuracy (gauge)
- db_connection_pool_usage (gauge)
- cache_hit_ratio (gauge)
- reconciliation_processing_time (histogram)

# 알람 규칙 (AlertManager)
- AlertRule: APILatency > 5s (15분 지속)
- AlertRule: ErrorRate > 1% (5분 지속)
- AlertRule: DBConnections > 80%
- AlertRule: CacheHitRatio < 70%
```

### 5.3 분산 추적 (Distributed Tracing)

```
클라이언트 요청
  │
  ├─ [Trace ID: uuid]
  │
  ├─ Span: API Gateway
  │  ├─ Span: Auth Service (15ms)
  │  └─ Span: Rate Limiter (2ms)
  │
  ├─ Span: Sales Service
  │  ├─ Span: Validate Input (5ms)
  │  ├─ Span: DB Query (120ms)
  │  │  ├─ Span: Connection Acquire (2ms)
  │  │  └─ Span: Query Execution (118ms)
  │  └─ Span: Cache Update (8ms)
  │
  └─ Span: Notification Service (50ms)

Tools: Jaeger, Zipkin
```

---

## 6. 아키텍처 검증 리스트

- [ ] 보안 아키텍처 peer review 완료
- [ ] 성능 요구사항 충족 (OCR ≤5초, Recon ≤30초)
- [ ] 확장성 테스트 (10배 사용자 증가 시 성능)
- [ ] 재해복구 계획 (RTO: 1시간, RPO: 5분)
- [ ] 모니터링 대시보드 구성
- [ ] 데이터베이스 백업 전략 검증
- [ ] 3rd-party 의존성 위험도 평가

---

## 7. 다음 단계

1. **프로토타입 개발** (Weeks 1-2)
   - API 설계 문서 확정
   - 데이터베이스 스키마 최종 설정
   - 기본 보안 구현

2. **MVP 구현** (Weeks 3-8)
   - Core services 개발
   - OCR 파이프라인 구축
   - Admin Dashboard 기본 기능

3. **성능 & 보안 최적화** (Weeks 9-12)
   - 로드 테스트 + 성능 튜닝
   - 보안 감사 + 펜테스트
   - 모니터링 시스템 구성

---

**문서 버전**: v1.0  
**최종 검토**: 2026-08-17
