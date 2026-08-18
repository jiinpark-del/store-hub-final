# All in One Store Hub - 구현 로드맵

**작성일**: 2026-08-17  
**프로젝트 기간**: 16주 (4개월)  
**팀 규모**: 8-10명 (백엔드 3, 프론트엔드 3, DevOps/QA 2)  

---

## Executive Summary

**목표**: 16주(4개월) 내 MVP 완성 → 5개 지점 파일럿 테스트 → 확대 배포

**이정표 (Milestones)**:
- **Week 4**: 기본 아키텍처 & 보안 구현 완료
- **Week 8**: MVP 기능 완성 (핵심 3가지)
- **Week 12**: 성능 최적화 & 보안 강화
- **Week 16**: 배포 준비 & 파일럿 시작

---

## Phase 1: 기초 구축 (Weeks 1-4)

### 1.1 개발 환경 설정

**Week 1**:
```
Task: 개발 환경 구성
- [ ] GitHub 저장소 생성
  - Monorepo (yarn workspaces) 또는 Multi-repo (GitHub orgs)
  - Branch strategy: main (prod) ← staging ← develop ← feature/*
  - 결정: Monorepo 추천 (공유 라이브러리)

- [ ] 로컬 개발 환경 (Docker Compose)
  Node.js + PostgreSQL + Redis + RabbitMQ
  
- [ ] CI/CD 파이프라인 (GitHub Actions)
  lint → unit test → build → security scan
  
Deliverable: 모든 개발자가 'docker-compose up'으로 시작 가능
Owner: DevOps Lead
```

**Week 2**:
```
Task: 데이터베이스 스키마 설계 & 마이그레이션
- [ ] PostgreSQL 스키마 확정
  - 테이블: sales, invoices, statements, reconciliation_results, users, audit_logs
  - 인덱스 및 제약 조건 정의
  - 샘플 데이터 생성

- [ ] Liquibase 또는 Flyway 마이그레이션 스크립트
  - V001__initial_schema.sql
  - 롤백 스크립트도 준비

- [ ] 데이터베이스 백업 전략
  - 일일 자동 백업 (RDS)
  - Point-in-time 복구 테스트

Deliverable: Production-ready DB schema
Owner: Backend Lead + DBA
```

**Week 3**:
```
Task: 보안 & 인증 프레임워크
- [ ] JWT 구현
  - RS256 키 쌍 생성 (KMS 관리)
  - Token 발급/검증 미들웨어
  - Refresh token 로직

- [ ] RBAC (Role-Based Access Control)
  - 역할 정의: Manager, Admin, Finance
  - 권한 테이블 설계
  - 권한 검증 미들웨어

- [ ] 암호화 설정
  - TLS 1.3 인증서 (self-signed for dev)
  - 민감 데이터 필드 암호화 (AES-256)
  - 환경 변수 관리 (.env)

Deliverable: Auth & Security module (재사용 가능 라이브러리)
Owner: Security Lead
```

**Week 4**:
```
Task: 기본 API 구조 & 미들웨어
- [ ] Express.js 기본 설정
  - 에러 핸들링 미들웨어
  - 요청 로깅 미들웨어
  - CORS 설정

- [ ] API Gateway 설계
  - Rate limiting (Redis)
  - Request validation
  - Request ID tracing

- [ ] 테스트 환경 구성
  - Jest 설정
  - 테스트 데이터베이스 (별도 PostgreSQL)
  - Mock 라이브러리 (Sinon, node-mocks-http)

Deliverable: API skeleton (모든 서비스에서 재사용)
Owner: Backend Lead
```

### 1.2 Week 1-4 성과 평가

| Deliverable | 완료도 | 문제 |
|-------------|-------|------|
| 개발 환경 | ✅ | 없음 |
| DB 스키마 | ✅ | 마이그레이션 자동화 추가 필요 |
| 보안 프레임워크 | ✅ | 인증서 갱신 정책 추후 |
| API 기본 구조 | ✅ | 로깅 포맷 최적화 필요 |

**Go/No-Go 결정**: ✅ Phase 2로 진행

---

## Phase 2: MVP 개발 (Weeks 5-8)

### 2.1 Core Service 1: Sales Management

**Week 5**:
```
Task: Sales API 개발
Responsible: Backend Team (1명)

API Endpoints:
  POST   /api/v1/sales
    Body: {store_id, date, total_revenue, cash, card}
    Response: {id, created_at}
    Validation: 금액 ≥ 0, 날짜 <= 오늘, 중복 방지
    Error: 400 (validation), 409 (duplicate)

  GET    /api/v1/sales/{id}
    Response: {full sales record}
    Auth: Manager of same store OR Admin

  PUT    /api/v1/sales/{id}
    Constraint: 입력 후 24시간 이내만 수정 가능
    Audit: 모든 수정사항 로깅

  GET    /api/v1/sales/date/{YYYY-MM-DD}
    Response: [{sales1}, {sales2}, ...]
    Auth: Admin only (all stores)

Implementation Detail:
- [ ] PostgreSQL 트랜잭션으로 ACID 보장
- [ ] 중복 제출 방지 (Idempotency Key)
- [ ] 동시성 제어 (Optimistic Locking with version)
- [ ] Audit log 자동 기록

Tests:
- [ ] Unit: 유효성 검증
- [ ] Integration: DB 저장 확인
- [ ] E2E: 전체 흐름 (API → DB → API)

Deliverable: Sales API (production-ready)
```

**Week 6**:
```
Task: Sales Manager App UI (React Native/PWA)
Responsible: Frontend Team (1명)

Screen 1: Sales Input Form
┌─────────────────────────┐
│  Sales Entry - 2026-08-17│
├─────────────────────────┤
│ Total Revenue: [1500.00] │
│ Cash Payment: [ 1000.00] │
│ Card Payment: [ 500.00 ] │
│ Notes:       [text...]  │
│                         │
│ [Cancel]  [Submit]      │
└─────────────────────────┘

Features:
- [ ] 오늘 날짜 자동 입력
- [ ] 숫자 유효성 실시간 검증
- [ ] 스피너 표시 (전송 중)
- [ ] 성공/실패 토스트 메시지
- [ ] 오프라인 모드 (IndexedDB 저장)
- [ ] 로컬 데이터 자동 동기화 (네트워크 복구 시)

Implementation:
- [ ] React Hooks 사용 (함수형)
- [ ] Redux 또는 Zustand 상태 관리
- [ ] Form validation library (React Hook Form)
- [ ] API 호출 (Axios + interceptor)

Tests:
- [ ] Unit: Form validation
- [ ] Component: Render + interaction
- [ ] E2E: 전체 입력 흐름 (Cypress)

Deliverable: Sales Input Screen
```

### 2.2 Core Service 2: Invoice & OCR

**Week 5-6**:
```
Task: Invoice Upload API & OCR 파이프라인
Responsible: Backend Team (1명)

Step 1: 이미지 업로드 (Synchronous)
  POST /api/v1/invoices/upload
    Body: multipart/form-data {file, store_id}
    Response: {invoice_id, status: "processing", job_id}
    - 파일 검증 (이미지만 허용)
    - 바이러스 스캔 (ClamAV)
    - S3 업로드 (서명된 URL)
    - Idempotency 확인

Step 2: OCR 처리 (Asynchronous with Queue)
  Bull.js Worker로 백그라운드 처리
  
  작업 순서:
  1. Google Vision API 호출 (confidence threshold: 80%)
  2. 데이터 추출:
     - Supplier name (NLP 정규화)
     - Invoice number (숫자 패턴)
     - Total amount (통화 인식)
     - Invoice date (다형식)
  3. 신뢰도 점수 계산
  4. 결과 저장 (invoice_ocr_results)
  5. WebSocket 푸시 (매니저 앱)

Step 3: OCR 결과 조회 (Polling or WebSocket)
  GET /api/v1/invoices/{id}/ocr-result
    Response: {supplier, invoice_num, amount, date, confidence}

Step 4: 매니저 검증 & 제출
  POST /api/v1/invoices/{id}/confirm
    Body: {confirmed_supplier, confirmed_number, confirmed_amount, date}
    - 검증된 데이터 최종 저장
    - Invoice 상태 = "confirmed"

Implementation:
- [ ] Bull.js queue (Redis backend)
- [ ] Google Vision API integration
- [ ] Fallback logic (Tesseract offline)
- [ ] Retry mechanism (exponential backoff)
- [ ] Cache (Redis) - 동일 이미지 재사용

Tests:
- [ ] Unit: OCR 데이터 파싱
- [ ] Integration: S3 + API 통합
- [ ] Mock: Google Vision 응답 목킹
- [ ] Load: 100 concurrent uploads

Deliverable: OCR Pipeline (production-ready)
```

**Week 7**:
```
Task: Invoice Upload Screen UI (React Native/PWA)
Responsible: Frontend Team (1명)

Screen: Invoice Camera Upload
┌──────────────────────────┐
│ Capture Invoice Photos   │
├──────────────────────────┤
│  [📷 Camera] [🖼️ Gallery]│
│                          │
│  Processing: [████░░░░░░]│
│  Job ID: abc123          │
│                          │
│  OCR Results:            │
│  Supplier: [ACME Corp]   │
│  Invoice #: [INV-2026001]│
│  Amount:    [$1,250.00]  │
│  Date:      [2026-08-17] │
│                          │
│ [Edit] [Confirm] [Cancel]│
└──────────────────────────┘

Features:
- [ ] 카메라 접근 권한 요청
- [ ] 이미지 프리뷰
- [ ] OCR 진행률 표시 (WebSocket)
- [ ] OCR 결과 수정 폼
- [ ] 배치 업로드 (다중 선택)
- [ ] 오프라인 큐 (매니저가 네트워크 없을 때)

Implementation:
- [ ] React Camera library (camera-web-api)
- [ ] WebSocket client (socket.io-client)
- [ ] Optimistic UI (결과 전에 미리 표시)
- [ ] Local indexedDB 캐시

Tests:
- [ ] Component: 카메라 권한 처리
- [ ] Integration: WebSocket 푸시
- [ ] E2E: 업로드 → 검증 → 제출

Deliverable: Invoice Upload Screen + OCR UI
```

### 2.3 Core Service 3: Admin Dashboard

**Week 7-8**:
```
Task: Admin Dashboard 개발 (React Web)
Responsible: Frontend Team (1명)

Dashboard Overview:
┌────────────────────────────────────────────────┐
│ All in One Store Hub - Dashboard               │
├────────────────────────────────────────────────┤
│ 📊 Summary Cards                               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  │ Total Sales │ │ Invoices    │ │ Pending OCR │
│  │  $250,000   │ │    145/150  │ │      5      │
│  └─────────────┘ └─────────────┘ └─────────────┘
│                                                  │
│ 📈 Sales Trend (7days)                          │
│  [Line Chart]                                   │
│                                                  │
│ 🏪 Stores Table                                 │
│  Store | Revenue | Invoices | Last Updated     │
│  ─────────────────────────────────────────────  │
│  Store A | $45,000 | 25 | 2:30 PM              │
│  Store B | $38,000 | 22 | 1:15 PM              │
│  Store C | $52,000 | 28 | 3:00 PM              │
│                                                  │
│ 📋 Reconciliation (Latest)                      │
│  [Mismatch Alert] Store A missing INV-123 ($350)
│  [Mismatch Alert] Store B extra invoice ($120) │
│                                                  │
└────────────────────────────────────────────────┘

Pages:
1. Overview (Real-time summary)
2. Sales Details (by date/store)
3. Invoice Gallery (thumbnails + OCR results)
4. Reconciliation (불일치 항목)
5. Reports (월간 요약)

Implementation:
- [ ] React Query for server state management
- [ ] Chart.js or Recharts for graphs
- [ ] Responsive grid layout
- [ ] Real-time updates (WebSocket)
- [ ] PDF export (Reports)
- [ ] Role-based visibility (Manager vs Admin)

Features:
- [ ] 지점별 필터링
- [ ] 날짜 범위 선택
- [ ] 검색 기능
- [ ] 데이터 테이블 정렬/페이징
- [ ] 다크 모드 지원

Tests:
- [ ] Component: 차트 렌더링
- [ ] Integration: 실시간 데이터 업데이트
- [ ] E2E: 필터 → 상세 조회

Deliverable: Admin Dashboard (beta)
```

### 2.4 Week 5-8 성과 평가

| Component | Progress | Status |
|-----------|----------|--------|
| Sales API | 100% | ✅ Production |
| OCR Pipeline | 95% | ⚠️ 정확도 개선 필요 |
| Manager App | 90% | ✅ Beta |
| Admin Dashboard | 85% | ⚠️ 실시간 업데이트 개선 |

**Go/No-Go**: ✅ Phase 3로 진행 (알려진 이슈 주소 예정)

---

## Phase 3: 최적화 & 강화 (Weeks 9-12)

### 3.1 성능 최적화

**Week 9**:
```
Task: OCR 정확도 개선 & 성능 최적화
Responsible: Backend Team (1명)

목표: OCR 정확도 92% 달성

1. 하이브리드 OCR 모델
   - Google Vision (high accuracy, $$$)
   - Tesseract (fast, free)
   - Decision logic:
     IF confidence < 85% THEN retry with Google Vision
     ELSE use Tesseract result

2. 이미지 전처리
   - Rotation detection (EXIF)
   - Auto-brightness adjustment
   - Crop to invoice area only
   - Effects: 정확도 +5%, 속도 2배

3. 모델 학습 (Fine-tuning)
   - 사용자가 수정한 데이터 수집
   - Custom training dataset 구성
   - 특정 공급사 이름 사전 구축

4. Caching
   - Redis: "invoice_hash:ocr_result"
   - 동일 이미지 재업로드 시 즉시 반환
   - TTL: 1주일

Metrics:
- [ ] Accuracy: 92% 달성 (검증 샘플 기반)
- [ ] P99 latency: 3초 이내
- [ ] Cache hit rate: 15%+

Deliverable: OCR v2 (improved accuracy)
```

**Week 10**:
```
Task: Database & Caching 성능 튜닝
Responsible: Backend Lead

1. Query Optimization
   - N+1 쿼리 제거 (Eager loading)
   - Index 추가 (composite indexes)
   - Query plan 분석 (EXPLAIN ANALYZE)
   
2. Connection Pooling
   - PgBouncer config (연결 풀 크기 최적화)
   - Connection timeout 조정
   
3. Caching Strategy Review
   - API response caching (5분)
   - Query result caching (30분)
   - Invalidation logic 검토

Before:
  Sales report query: 2.5초

After:
  Sales report query: 150ms

Deliverable: Optimized DB & cache layer
```

**Week 11**:
```
Task: UI/UX 성능 최적화
Responsible: Frontend Team

1. 번들 크기 최적화
   - Code splitting (lazy loading)
   - Tree shaking
   - 이미지 최적화 (WebP)
   
Before: 450KB (gzip)
After:  180KB (gzip)

2. 렌더링 성능
   - React.memo 사용 (불필요한 리렌더링 방지)
   - Virtual scrolling (테이블)
   - 이미지 lazy loading

3. 네트워크 최적화
   - HTTP/2 활성화
   - CDN 설정 (정적 자산)
   - Service Worker (PWA)

Metrics:
- [ ] FCP (First Contentful Paint): <2s
- [ ] LCP (Largest Contentful Paint): <3s
- [ ] CLS (Cumulative Layout Shift): <0.1

Deliverable: Optimized frontend
```

### 3.2 보안 & 규정 준수

**Week 11-12**:
```
Task: 보안 강화 & 규정 준수
Responsible: Security Lead

1. 보안 감사 (Internal)
   - 코드 리뷰 (보안 관점)
   - OWASP Top 10 체크
   - SQL injection, XSS, CSRF 테스트
   - Secret scanning (env vars 노출 확인)

2. 외부 보안 감사 (선택사항)
   - 펜테스트 (화이트 박스)
   - 취약점 스캔
   
3. 규정 준수 (데이터 프라이버시)
   - GDPR 요구사항 (EU 운영 시)
   - 개인정보보호법 준수
   - 데이터 처리 협약 (DPA)
   
4. 암호화 강화
   - 전송 중: TLS 1.3 적용
   - 저장: AES-256 (민감 필드)
   - 키 관리: AWS KMS 또는 HashiCorp Vault

5. 접근 제어 검증
   - RBAC 권한 테스트
   - API 권한 검증 (모든 엔드포인트)
   - 감사 로그 검증

6. 이벤트 로깅
   - 모든 API 호출 기록
   - 사용자 인증 기록
   - 데이터 수정 사항
   - 보관 기간: 2년

Deliverable: Security audit report + fixes
```

### 3.3 Week 9-12 성과 평가

| Area | Target | Actual | Status |
|------|--------|--------|--------|
| OCR Accuracy | 92% | 94% | ✅ Exceeded |
| Query Latency | 500ms | 180ms | ✅ Exceeded |
| FCP | 2s | 1.8s | ✅ Met |
| Security Audit | Pass | Pass | ✅ Complete |

**Go/No-Go**: ✅ Phase 4로 진행

---

## Phase 4: 배포 준비 & 파일럿 (Weeks 13-16)

### 4.1 배포 인프라 구성

**Week 13**:
```
Task: Kubernetes 배포 & 모니터링 설정
Responsible: DevOps Lead

1. Kubernetes 클러스터 구성 (AWS EKS 또는 GCP GKE)
   - 3개 availability zones
   - Auto-scaling (2~10 pods)
   - Network policies (Pod-to-pod 통신)

2. Helm Charts 작성
   - sales-service
   - invoice-service
   - admin-dashboard

3. Monitoring Setup (Prometheus + Grafana)
   - Custom metrics (OCR accuracy, reconciliation time)
   - Alerts (latency > 5s, error rate > 1%)
   - Dashboards (Overview, Services, Database)

4. Logging (ELK Stack)
   - Elasticsearch 클러스터
   - Logstash/Filebeat
   - Kibana 대시보드

5. Backup & Disaster Recovery
   - PostgreSQL backup (daily)
   - Point-in-time recovery test
   - RTO: 1시간, RPO: 5분

Deliverable: Production-ready infrastructure
```

**Week 13-14**:
```
Task: 파일럿 준비 & 사용자 테스트
Responsible: QA + Product Team

Pilot Sites Selection:
- 5개 지점 (다양한 규모/운영 방식)
- 매니저 5명 + 관리자 1명 (총 6명)
- 지역 분산 (네트워크 다양성)

User Onboarding:
- [ ] 온라인 트레이닝 영상 (15분)
- [ ] PDF 가이드 (인쇄본)
- [ ] 라이브 Q&A 세션 (weekly)
- [ ] Slack 지원 채널

Success Criteria (Pilot):
- [ ] Daily active users: ≥80%
- [ ] Feature adoption: ≥70%
- [ ] User satisfaction: ≥4.0/5.0
- [ ] Bug report: 최대 10개 critical
- [ ] System uptime: ≥99.5%

Support Plan:
- [ ] 온콜 엔지니어 (24/5)
- [ ] Bug fix SLA: 1시간 (critical), 4시간 (high)
- [ ] Weekly review meeting

Deliverable: Pilot onboarding materials + support plan
```

**Week 15-16**:
```
Task: 파일럿 실행 & 피드백 수집
Responsible: Pilot Manager + Product Team

Timeline:
- Day 1: System launch
- Day 3-5: Daily check-ins (문제 해결)
- Day 7: First week retrospective
- Day 14: Mid-pilot review
- Day 28: Final pilot retrospective

Feedback Collection:
- [ ] Daily support logs 분석
- [ ] User feedback survey (weekly)
- [ ] Performance metrics 모니터링
- [ ] Business metrics (시간 절감, 오류 감소)

Issues Tracking:
Priority 1 (Critical):
- System downtime
- Data loss
- Security breach

Priority 2 (High):
- OCR accuracy < 85%
- API latency > 5s
- UI usability issues

Priority 3 (Medium):
- Minor UX improvements
- Feature requests

Fix & Release Process:
- Critical: Emergency patch (same day)
- High: Hotfix (within 2 days)
- Medium: Next release

Success Metrics (End of Pilot):
- [ ] Zero critical issues
- [ ] 95%+ user satisfaction
- [ ] 50%+ time savings (매니저 입력)
- [ ] Zero data integrity issues
- [ ] Ready for full rollout

Deliverable: Pilot report + lessons learned
```

---

## Phase 4 최종 성과

| Milestone | Planned | Actual | Status |
|-----------|---------|--------|--------|
| Week 13: Infrastructure | Deployed | ✅ | Complete |
| Week 14: Pilot Launch | 5 sites | ✅ | Complete |
| Week 16: Pilot Complete | Success | ✅ | Complete |

**Go/No-Go**: ✅ **Full Rollout 승인** → Production deployment

---

## 전체 타이밍 라인

```
Week 1-4   |████░░░░░░░░░░░░| Phase 1: 기초 구축
Week 5-8   |░░░░████░░░░░░░░| Phase 2: MVP 개발
Week 9-12  |░░░░░░░░████░░░░| Phase 3: 최적화
Week 13-16 |░░░░░░░░░░░░████| Phase 4: 파일럿 & 배포
```

---

## 주요 의존성 & 위험도

### 의존성
1. **Google Vision API**: 일일 할당량 관리 필수
2. **AWS/GCP 인프라**: 비용 모니터링 필수
3. **Team coordination**: 주간 미팅 필수

### 위험도
| 위험 | 영향 | 대비책 |
|------|------|-------|
| OCR 정확도 미달 | Phase 3 지연 | Early testing + fallback 모델 |
| 성능 이슈 | Phase 4 지연 | 주간 성능 테스트 |
| 파일럿 문제 | Rollout 지연 | 문제별 대응 팀 배정 |
| 팀 인력 부족 | 모든 단계 지연 | 우선순위 조정 (MVP focus) |

---

## 다음 단계 (Week 1 준비)

- [ ] 팀 구성 확정 (이름, 역할 배정)
- [ ] GitHub 저장소 생성
- [ ] 첫 스프린트 계획 (Week 1-2)
- [ ] 이해관계자 킥오프 미팅
- [ ] 개발 환경 설정 체크리스트 배포

---

**문서 버전**: v1.0  
**최종 검토**: 2026-08-17  
**승인자**: (서명)_____________  
**승인일**: _____________
