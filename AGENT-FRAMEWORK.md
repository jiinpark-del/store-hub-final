# Store Hub 프로젝트 - 맞춤형 서브에이전트 프레임워크

**작성일**: 2026-08-18  
**프로젝트**: All in One Store Hub  
**에이전트 수**: 4개 전문가 에이전트 (Option B)

---

## 📌 에이전트 프레임워크 개요

### 에이전트 구성도

```
┌─────────────────────────────────────────────────────────┐
│              Coordinator (You)                          │
│  프로젝트 매니저, 의사결정, 우선순위 조정              │
└──────────┬──────────────────────────────────────────────┘
           │
    ┌──────┼──────┬──────────────┬──────────────┐
    │      │      │              │              │
    ▼      ▼      ▼              ▼              ▼
┌────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│   OCR      │ │   DB &   │ │   API &  │ │Frontend &│
│ Pipeline   │ │Performance│ │ Backend  │ │ Offline │
│ Specialist │ │Specialist│ │Specialist│ │Specialist│
└────────────┘ └──────────┘ └──────────┘ └──────────┘
   Week 5-6    Week 3-4     Week 3-4     Week 6-7
```

---

## 🤖 Agent 1: OCR Pipeline Specialist

### 역할 & 책임

**주요 목표**:
- OCR 정확도 **92% 이상** 달성
- 처리 시간 **≤5초** (P95)
- 비용 최적화 (Google Vision API)

**담당 영역**:
1. 이미지 전처리 (회전, 명도, 노이즈 제거)
2. Google Vision API vs Tesseract 비교 분석
3. 하이브리드 OCR 전략 (정확도 vs 속도 트레이드오프)
4. 데이터 후처리 (정규화, 신뢰도 점수)
5. 캐싱 전략 (동일 이미지 재사용)
6. 성능 테스트 & 벤치마킹

### 사용 시기

```
Phase 2 (Weeks 5-6): 초기 OCR 파이프라인 구축
Phase 3 (Week 9-10): 정확도 개선 & 최적화
```

### 호출 방법

```
당신: "@ocr-specialist 다음 요구사항을 만족하는 OCR 파이프라인을 설계해줘:
- 정확도 92% 달성 (공급사명, 인보이스 번호, 금액)
- 처리 시간 3~5초 (병렬 처리 고려)
- Google Vision + Tesseract 하이브리드
- 신뢰도 점수 반환 (각 필드별)
- 동일 이미지 캐싱 전략"

OCR-specialist 응답:
→ image-preprocessing.js (이미지 처리 유틸)
→ ocr-hybrid-strategy.ts (하이브리드 로직)
→ ocr-accuracy-tests.test.ts (테스트 스위트)
→ performance-benchmark.js (성능 비교)
→ implementation-guide.md (단계별 구현)
```

### 출력 결과물

```
✅ 이미지 전처리 함수 라이브러리
✅ OCR 모델 선택 알고리즘
✅ 데이터 후처리 파이프라인
✅ 신뢰도 점수링 로직
✅ 성능 벤치마크 리포트
✅ 정확도 검증 테스트
✅ 구현 가이드 & 트러블슈팅
```

---

## 🤖 Agent 2: Database & Performance Specialist

### 역할 & 책임

**주요 목표**:
- 데이터 무결성 **100%** (수식 깨짐 0)
- Query 성능 **≤200ms** (P99)
- 동시성 제어 (Race condition 0)

**담당 영역**:
1. PostgreSQL 스키마 최적 설계
2. 인덱스 전략 (복합 인덱스, 파티셔닝)
3. Query 성능 튜닝 (JOIN, GROUP BY 최적화)
4. 동시성 제어 (Optimistic Locking, MVCC)
5. 트랜잭션 격리 수준 결정
6. 마이그레이션 스크립트 (Flyway/Liquibase)
7. 성능 모니터링 (pg_stat_statements)

### 사용 시기

```
Phase 1 (Weeks 3-4): DB 스키마 설계
Phase 2 (Weeks 7-8): Query 최적화
Phase 3 (Weeks 9-10): 성능 튜닝
```

### 호출 방법

```
당신: "@db-specialist Statement reconciliation 쿼리를 최적화해줘:
- 월말에 1000개의 인보이스 vs Statement 비교
- 현재 성능: 2.5초 → 목표: 200ms 이내
- 정확한 매칭 필요 (발주처 + 인보이스 번호)
- 부분 매칭도 지원 (금액 ±1%)"

DB-specialist 응답:
→ reconciliation-schema-optimized.sql
→ reconciliation-query-optimized.sql
→ index-strategy.md (인덱스 설계)
→ performance-test.sql (성능 검증)
→ migration-script.sql (마이그레이션)
```

### 출력 결과물

```
✅ 최적화된 DB 스키마 (DDL)
✅ 복합 인덱스 전략
✅ 마이그레이션 스크립트 (v001~v010)
✅ 성능 튜닝된 Query 모음
✅ 동시성 제어 가이드
✅ 성능 벤치마크 & 비교
✅ 모니터링 쿼리 & 대시보드
```

---

## 🤖 Agent 3: API & Backend Architecture Specialist

### 역할 & 책임

**주요 목표**:
- 안정적인 API 계층 구축
- 중복 요청 방지 (Idempotency)
- 높은 동시성 지원 (1000+ req/s)

**담당 영역**:
1. REST API 상세 설계 (요청/응답 스펙)
2. 에러 핸들링 & 상태 코드 전략
3. 유효성 검증 (Schema validation)
4. 중복 방지 (Idempotency Key)
5. Rate Limiting & Throttling
6. 비동기 작업 큐 설계 (Bull.js)
7. API 문서 (Swagger/OpenAPI)
8. 마이크로서비스 패턴 (Event-driven)

### 사용 시기

```
Phase 1 (Weeks 3-4): API 설계 & 스펙
Phase 2 (Weeks 5-8): API 구현
Phase 3 (Week 11): 성능 & 안정성 강화
```

### 호출 방법

```
당신: "@api-specialist Sales API를 설계해줘:
- 엔드포인트: POST /api/v1/sales
- 바디: {store_id, date, total_revenue, cash, card}
- 요구사항: 
  * 중복 제출 방지 (같은 날짜/지점)
  * 비동기 이벤트 발행 (Reconciliation 트리거)
  * 감시 로그 자동 기록
  * Rate limit 1000 req/min"

API-specialist 응답:
→ sales-api.openapi.yaml (API 스펙)
→ sales-controller.ts (Express 컨트롤러)
→ sales-validator.ts (입력 검증)
→ idempotency-middleware.ts (중복 방지)
→ error-handling.md (에러 처리 가이드)
```

### 출력 결과물

```
✅ OpenAPI/Swagger 스펙
✅ 검증 스키마 (Joi/Zod)
✅ 에러 처리 미들웨어
✅ Idempotency Key 구현
✅ Rate Limiting 설정
✅ 비동기 작업 큐 템플릿
✅ 감시 로그 인터셉터
✅ API 문서 & 예제
```

---

## 🤖 Agent 4: Frontend & Offline Specialist

### 역할 & 책임

**주요 목표**:
- 네트워크 불안정성 해결
- 매끄러운 오프라인 UX
- 상태 관리 최적화

**담당 영역**:
1. 오프라인 모드 (IndexedDB + Service Worker)
2. 데이터 동기화 전략 (Queue, Retry)
3. 낙관적 업데이트 (Optimistic Update)
4. 상태 관리 라이브러리 선택 (Zustand vs Redux)
5. Form 상태 & 유효성 검증 (React Hook Form)
6. 실시간 동기화 (WebSocket)
7. 오프라인 감지 & UX 피드백

### 사용 시기

```
Phase 2 (Weeks 6-7): 기본 구현
Phase 3 (Week 11): 안정성 강화
```

### 호출 방법

```
당신: "@frontend-specialist Manager App의 Sales Input에 오프라인 모드를 추가해줘:
- 네트워크 없을 때도 입력 가능
- 입력 데이터를 IndexedDB에 임시 저장
- 네트워크 복구 시 자동 동기화
- 동기화 상태 UI 피드백
- 충돌 시 Last-Write-Wins 전략"

Frontend-specialist 응답:
→ useOfflineSync.ts (Custom Hook)
→ SalesForm.tsx (업데이트된 컴포넌트)
→ offline-storage.ts (IndexedDB wrapper)
→ sync-queue.ts (동기화 큐)
→ offline-mode-guide.md (구현 가이드)
```

### 출력 결과물

```
✅ Service Worker 구현
✅ IndexedDB 캡슐화 계층
✅ useOfflineSync Custom Hook
✅ 동기화 큐 시스템
✅ 낙관적 업데이트 로직
✅ 상태 관리 설정 (Zustand)
✅ Form 검증 스키마
✅ 오프라인 UX 가이드
```

---

## 📋 에이전트 호출 체크리스트

### Week 3-4: 기초 구축 단계

```
Monday (Week 3):
☐ @db-specialist
  "PostgreSQL 스키마 설계:
   - 모든 테이블 정의 (sales, invoices, statements, etc.)
   - 제약 조건, 인덱스 포함
   - 트랜잭션 격리 수준 결정
   → 결과: database-schema-v1.0.sql, DDL 스크립트"

☐ @api-specialist
  "API 스펙 설계:
   - 3개 핵심 서비스 정의 (Sales, Invoice, Reconciliation)
   - 각 엔드포인트의 요청/응답 스펙
   - 에러 코드 및 메시지
   → 결과: api-specification.openapi.yaml"
```

### Week 5-6: MVP 개발 단계

```
Monday (Week 5):
☐ @ocr-specialist
  "OCR 파이프라인 구축:
   - 이미지 전처리 로직
   - Google Vision + Tesseract 하이브리드
   - 정확도 목표: 92%
   → 결과: ocr-pipeline-complete.zip (모든 함수)"

Wednesday (Week 6):
☐ @frontend-specialist
  "Sales Input Form 구현:
   - 오프라인 모드 지원
   - IndexedDB 임시 저장
   - 네트워크 복구 시 자동 동기화
   → 결과: SalesForm.tsx, offline-sync-hook.ts"
```

### Week 9-10: 최적화 단계

```
Monday (Week 9):
☐ @db-specialist
  "Statement Reconciliation 성능 최적화:
   - Query 성능 2.5s → 200ms 달성
   - 인덱싱 전략 재검토
   → 결과: reconciliation-query-optimized.sql, 성능 보고서"

☐ @ocr-specialist
  "OCR 정확도 개선:
   - 현재 정확도 분석
   - 모델 미세조정
   - 신뢰도 임계값 조정
   → 결과: accuracy-improvement-report.md"
```

---

## 🔄 에이전트 간 협업 패턴

### 패턴 1: Sequential (순차적)
```
당신: "@db-specialist 동시성 제어 방식 결정해줘"
       ↓
DB-specialist 응답: Optimistic Locking 추천
       ↓
당신: "@api-specialist Optimistic Locking 기반 API 설계"
       ↓
API-specialist 응답: version field 포함 API 스펙
```

### 패턴 2: Parallel (병렬)
```
당신: "@ocr-specialist 이미지 전처리 로직"
     "@api-specialist Invoice Upload API"
     "@frontend-specialist Image Picker 컴포넌트"
       ↓ (동시 진행)
3개 에이전트 독립 작업
       ↓
당신: 결과물 통합
```

### 패턴 3: Feedback Loop (피드백)
```
당신: "@api-specialist API Rate Limit 설정"
       ↓
API-specialist: 초안 제시
       ↓
당신: "수정 요청: 프리미엄 계정은 10배 더 높은 limit"
       ↓
API-specialist: 수정된 버전
```

---

## 📊 에이전트별 예상 산출물

| 에이전트 | Phase | 주요 산출물 | 파일 수 |
|---------|-------|-----------|--------|
| OCR | 2, 3 | 이미지 처리, 모델 선택, 테스트 | 8-10개 |
| DB | 1, 2, 3 | 스키마, 마이그레이션, 쿼리 | 10-15개 |
| API | 1, 2, 3 | 스펙, 컨트롤러, 미들웨어 | 12-18개 |
| Frontend | 2, 3 | 컴포넌트, Hook, 서비스 | 10-12개 |

---

## 🎯 성공 기준

### 각 에이전트의 성과 지표

**OCR Specialist**:
- ✅ OCR 정확도 ≥92%
- ✅ 처리 시간 P99 ≤5초
- ✅ 캐시 히트율 ≥15%

**DB Specialist**:
- ✅ 데이터 무결성 100% (중복 0)
- ✅ Query 성능 ≤200ms (P99)
- ✅ 동시성 테스트 통과 (1000 concurrent users)

**API Specialist**:
- ✅ API 문서 완전성 100%
- ✅ 유효성 검증 커버리지 ≥95%
- ✅ Idempotency 테스트 통과

**Frontend Specialist**:
- ✅ 오프라인 모드 정상 작동
- ✅ 동기화 성공률 ≥99.5%
- ✅ Form 에러율 0 (검증됨)

---

## 🚀 에이전트 활성화 명령어

```bash
# 전체 활성화
@activate-all-agents

# 개별 활성화
@activate-ocr-specialist
@activate-db-specialist
@activate-api-specialist
@activate-frontend-specialist

# 특정 작업 할당
@task-ocr-specialist "이미지 전처리 로직 구축"
@task-db-specialist "동시성 제어 설계"
@task-api-specialist "Sales API 설계"
@task-frontend-specialist "오프라인 모드 구현"
```

---

## 📌 주의사항

1. **에이전트는 독립적**: 각 에이전트는 자신의 영역에만 집중
2. **문서화 필수**: 모든 결과물은 README/가이드 포함
3. **테스트 코드 필수**: 구현 코드와 함께 테스트 제공
4. **버전 관리**: 모든 산출물은 버전 번호 포함
5. **협업**: 에이전트 간 의존성 있을 때는 조율 필요

---

**프레임워크 버전**: v1.0  
**시작 시점**: 2026-08-18 (Week 3)  
**예상 종료**: 2026-11-09 (Week 16)
