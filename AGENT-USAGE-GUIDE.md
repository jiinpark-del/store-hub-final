# Store Hub 프로젝트 - 에이전트 사용 가이드

**작성일**: 2026-08-18  
**대상**: 프로젝트 매니저, 개발 리더, 팀 리더  
**목적**: 에이전트 호출 및 협업 방법

---

## 🚀 빠른 시작 (5분)

### Step 1: 에이전트 4개 이해하기

```
┌─────────────────────────────────────────┐
│ 당신이 할 일                             │
│ (조율, 의사결정, 결과물 통합)           │
└──────────────┬──────────────────────────┘
               │
    ┌──────────┼──────────┬──────────┬──────────┐
    │          │          │          │          │
    ▼          ▼          ▼          ▼          ▼
  OCR        DB         API      Frontend    (당신)
 정확도      성능       구조        UX
 92%        200ms      안정       오프라인
```

### Step 2: 에이전트 소환 구문

```
@[에이전트명] "[구체적인 요청]"

예시:
@ocr-specialist "이미지 전처리 로직을 구축하고 정확도 92% 달성 방법 제시"
@db-specialist "Reconciliation 쿼리 2.5초 → 200ms 최적화 전략"
@api-specialist "Sales API 설계: 중복 방지 메커니즘 포함"
@frontend-specialist "오프라인 모드 구현: IndexedDB + 자동 동기화"
```

### Step 3: 결과물 받기

```
각 에이전트는 다음을 제공:
✅ 상세한 분석 & 설명
✅ 실행 가능한 코드 (프로덕션 수준)
✅ 테스트 코드 포함
✅ 구현 가이드 문서
✅ 성능 벤치마크
```

---

## 📅 주별 에이전트 활용 계획

### Week 3-4: 기초 구축 단계

#### Monday, Week 3

```
당신: "이번 주 DB와 API 설계를 진행합니다.
      팀 역량을 고려하면 동시 진행이 최적입니다."

To: @db-specialist
📝 요청: "PostgreSQL 최종 스키마 설계:
   - 모든 테이블 정의 (sales, invoices, statements, reconciliation_results, users, audit_logs)
   - 각 테이블의 제약 조건, 인덱스 포함
   - 트랜잭션 격리 수준 결정 (READ_COMMITTED vs SERIALIZABLE)
   - 동시성 제어 전략 (Optimistic Locking with version field)
   결과물: database-schema-v1.0.sql, 마이그레이션 스크립트"

To: @api-specialist
📝 요청: "3가지 핵심 서비스 API 스펙 설계:
   1. Sales API (POST, GET, PUT, LIST)
   2. Invoice API (POST, GET, status, confirm)
   3. Reconciliation API (POST statement, GET mismatches)
   
   각 엔드포인트마다:
   - 요청/응답 스펙 (JSON schema)
   - 에러 코드 (400, 409, 500)
   - Idempotency 지원
   - 감시 로그 기록
   
   결과물: api-specification.openapi.yaml"
```

**예상 결과 (Thursday):**
```
DB-specialist 완료물:
✅ database-schema-v1.0.sql (200줄)
✅ migration-v001-initial.sql
✅ performance-expectations.md
✅ concurrency-strategy.md

API-specialist 완료물:
✅ api-specification.openapi.yaml (500줄)
✅ error-handling-guide.md
✅ idempotency-implementation.ts
✅ validation-schemas.ts
```

#### Friday, Week 3 Review

```
당신: "완료물 검토 & 팀 피드백 수집"

체크리스트:
□ 스키마가 정규화되어 있는가? (3NF 이상)
□ 모든 인덱스가 명시되어 있는가?
□ API 에러 처리가 일관성 있는가?
□ Idempotency 구현 가능한가?
□ 감시 로그 구조가 명확한가?

피드백:
"좋습니다. Monday부터 Phase 2 MVP 개발을 시작합시다."
```

---

### Week 5-6: MVP 개발 단계

#### Monday, Week 5

```
당신: "OCR 파이프라인 구축을 시작합니다."

To: @ocr-specialist
📝 요청: "OCR 파이프라인 완전 구현:
   1. 이미지 전처리 (회전, 명도, 노이즈)
   2. 모델 선택 로직 (Tesseract vs Google Vision)
   3. 후처리 (정규화, 신뢰도 점수)
   4. 캐싱 (동일 이미지 재사용)
   
   목표: 정확도 92%, 처리 시간 3~5초
   
   결과물:
   - image-preprocessing.ts
   - ocr-model-selector.ts
   - ocr-accuracy-tests.test.ts
   - performance-benchmark.js
   - implementation-guide.md"

병렬 진행:

To: @api-specialist (Sales API 구현)
📝 요청: "Sales API 백엔드 구현:
   - Express.js 컨트롤러
   - 유효성 검증 미들웨어
   - Idempotency Key 구현
   - 중복 방지 (unique constraint)
   - 감시 로그 자동 기록
   
   결과물: sales-controller.ts, sales-validator.ts, ..."

To: @frontend-specialist (Form UI)
📝 요청: "Sales Input Form 컴포넌트:
   - React Hook Form 기반
   - 실시간 유효성 검증
   - 로딩 상태 표시
   - 오프라인 모드 (데이터 임시 저장)
   
   결과물: SalesForm.tsx, useOfflineSync.ts, ..."
```

**예상 결과 (Thursday):**
```
OCR-specialist 완료물:
✅ image-preprocessing.ts (OCR 전 처리)
✅ ocr-model-selector.ts (하이브리드 로직)
✅ ocr-accuracy-benchmark.json (정확도 92% 검증)

API-specialist 완료물:
✅ sales-controller.ts (API 구현)
✅ sales-service.ts (비즈니스 로직)
✅ sales.test.ts (100+ 테스트)

Frontend-specialist 완료물:
✅ SalesForm.tsx (완성된 컴포넌트)
✅ useOfflineSync.ts (오프라인 훅)
✅ sales-storage.ts (IndexedDB)
```

#### Wednesday, Week 6

```
To: @frontend-specialist (Invoice Upload)
📝 요청: "Invoice 업로드 & OCR UI:
   - 카메라 촬영 또는 갤러리 선택
   - 이미지 프리뷰
   - OCR 진행률 표시 (WebSocket)
   - OCR 결과 검증 폼
   - 배치 업로드 지원
   
   결과물: InvoiceUploadForm.tsx, camera-utils.ts, ..."
```

---

### Week 9-10: 최적화 단계

#### Monday, Week 9

```
당신: "Phase 3: 성능 최적화를 시작합니다."

병렬 진행:

To: @db-specialist
📝 요청: "Reconciliation 쿼리 성능 최적화:
   - 현재: 2.5초 (1000 invoices vs 500 statements)
   - 목표: 200ms 이내
   
   작업:
   1. 쿼리 분석 (EXPLAIN ANALYZE)
   2. 인덱싱 전략 개선
   3. 조인 최적화
   4. 결과 캐싱
   
   결과물:
   - reconciliation-query-optimized.sql
   - performance-comparison.md (2.5s → 150ms)"

To: @ocr-specialist
📝 요청: "OCR 정확도 개선:
   - 현재: 88% → 목표: 92%
   
   작업:
   1. 실제 인보이스 샘플 분석 (100개)
   2. 틀린 경우 분석 (왜 실패했는가)
   3. 모델 미세조정
   4. 신뢰도 임계값 조정
   
   결과물:
   - accuracy-improvement-report.md
   - ocr-tuned-model-params.json"
```

---

## 🎯 에이전트와 협업하는 Best Practices

### Practice 1: 명확한 요청 작성

#### ❌ 나쁜 예시
```
@db-specialist "스키마 설계해줘"
```

#### ✅ 좋은 예시
```
@db-specialist "PostgreSQL 스키마 설계:
- 요구사항: Statement reconciliation에서 1000개의 invoices를 
  500개 statements와 비교할 때 200ms 이내 완료
- 제약조건: Optimistic Locking 필요 (동시 수정 방지)
- 출력: database-schema.sql + 마이그레이션 스크립트 + 성능 예측치"
```

### Practice 2: 컨텍스트 제공

```
@ocr-specialist "
상황: Invoice 이미지 품질이 다양함
- 문제: 정확도가 60~95% 사이로 불안정
- 제약: 처리 시간 ≤5초 (사용자 대기)
- 비용: 월 $200 이내

요청: 정확도 92% 달성 방안
결과: 구현 가능한 코드 + 성능 벤치마크"
```

### Practice 3: 반복적 개선

```
1차 요청: "OCR 파이프라인 기본 구축"
↓
1차 결과물 검토: 정확도 88%로 목표 미달
↓
2차 요청: "@ocr-specialist 현재 실패 패턴 분석:
  - 구조화되지 않은 인보이스 (정확도 70%)
  - 낮은 해상도 (정확도 82%)
  - 이들을 92%로 개선하는 방안"
↓
2차 결과물: 개선된 전처리 로직
↓
3차 검증: 정확도 92% 달성 ✓
```

### Practice 4: 병렬 vs 순차

```
병렬 협업 (독립적 작업):
@ocr-specialist "OCR 파이프라인"
@api-specialist "Sales API"
@frontend-specialist "Form UI"
→ 동시 진행 (팀 효율 최대)

순차 협업 (의존성 있음):
1. @db-specialist "스키마 설계"
   ↓ (스키마 완료 후)
2. @api-specialist "API 설계 (스키마 기반)"
   ↓ (API 스펙 완료 후)
3. @frontend-specialist "Form 구현 (API 스펙 기반)"
```

---

## 📊 에이전트 성과 추적

### 추적 템플릿

```
[Week 5 진행 상황]

OCR-specialist:
├─ 예정: image-preprocessing.ts, ocr-selector.ts, tests
├─ 완료: ✅ image-preprocessing.ts (금요일)
├─ 진행: 🔄 ocr-selector.ts (80%)
├─ 미완: ⏳ tests (미시작)
└─ 문제: Tesseract 정확도 낮음 → 재검토 필요

API-specialist:
├─ 예정: sales-controller, validator, tests
├─ 완료: ✅ sales-controller.ts
├─ 진행: 🔄 tests (60%)
└─ 진행도: 70% (예정 대비 양호)

Frontend-specialist:
├─ 예정: SalesForm.tsx, useOfflineSync.ts
├─ 완료: ✅ SalesForm.tsx
├─ 진행: 🔄 useOfflineSync.ts (90%)
└─ 진행도: 95% (예정 초과)
```

### 문제 해결 프로세스

```
상황: OCR 정확도 목표 미달 (88% vs 92%)

Step 1: 원인 분석
당신: "@ocr-specialist 현재 88%인 이유가 뭡니까?
      특히 어떤 경우에 실패합니까?"

Step 2: 개선안 수집
OCR-specialist: "구조화되지 않은 인보이스에서
               Tesseract 성능이 50%입니다.
               Google Vision을 더 자주 호출해야 합니다."

Step 3: 결정
당신: "Google Vision 호출 빈도를 올리세요.
      비용이 어떻게 되나요?"

Step 4: 다시 시도
OCR-specialist: "정확도 92% 달성했습니다.
               비용은 월 $250 (+$50)입니다."
```

---

## 🔗 에이전트 간 협업 시나리오

### 시나리오: 동시성 충돌 해결

```
당신: "두 매니저가 동시에 같은 Sales를 수정하면?
      어떻게 처리할까요?"

Step 1: DB-specialist에게 물어보기
@db-specialist "동시 수정 충돌:
  - 상황: Sales A를 매니저1, 매니저2가 동시 수정
  - 현재: 누가 이기나? (Last-Write-Wins?)
  - 목표: 데이터 무결성 보장 + 사용자 경험"

DB-specialist 응답:
"Optimistic Locking 제안:
- 각 Sales에 'version' 필드
- 수정 시 version도 함께 제출
- 버전 불일치면 409 Conflict 반환"

Step 2: API-specialist에게 물어보기
@api-specialist "409 Conflict 처리:
  - DB에서 Optimistic Locking으로 충돌 감지
  - API는 어떻게 응답할까요?
  - 응답 포맷 표준화"

API-specialist 응답:
"409 Conflict 응답:
{
  error: {
    code: 'VERSION_MISMATCH',
    message: '이미 변경되었습니다',
    current_version: 5,
    your_version: 3
  }
}"

Step 3: Frontend-specialist에게 물어보기
@frontend-specialist "409 에러 사용자 처리:
  - 에러 메시지 표시
  - 최신 데이터 표시
  - 재시도 또는 병합 옵션"

Frontend-specialist 응답:
"충돌 모달:
1. 최신 데이터 보여주기
2. 사용자 선택:
   - '내 변경 유지' (재시도)
   - '최신 데이터 사용' (취소)
   - '수동 병합' (비교)"

최종 결과: 완벽한 동시성 제어 ✓
```

---

## 📋 주간 체크리스트

### 매주 월요일

```
□ 이번 주 목표 정의
□ 에이전트별 작업 할당 (구체적 요청)
□ 병렬 vs 순차 결정
□ 우선순위 명시
□ 데드라인 설정 (목요일 오후)
```

### 매주 목요일

```
□ 완료물 검수
□ 테스트 코드 포함 확인
□ 문서화 확인
□ 문제 사항 리스트업
□ 다음 주 조정 계획
```

### 매주 금요일

```
□ 최종 통합 테스트
□ 데모/리뷰
□ 팀 피드백 수집
□ Lessons learned 기록
□ 다음 주 시작 준비
```

---

## 🚨 문제 발생 시 대응

### Scenario: 에이전트 완료 지연

```
상황: OCR-specialist이 일정 놓쳤음 (목요일 → 금요일)

Step 1: 원인 파악
당신: "@ocr-specialist 지연 이유?"

OCR-specialist: "Google Vision API 성능이
                예상보다 나깜. 대안을 찾고 있습니다."

Step 2: 의사결정
당신: "현재 정확도는?"
OCR-specialist: "85%"
당신: "3가지 옵션이 있습니다:
      1. 목표 내리기 (85% → OK)
      2. 방식 변경 (다른 모델 시도)
      3. 시간 연장 (다음 주)
      뭐 하시겠어요?"

OCR-specialist: "2번으로 가겠습니다.
               Tesseract 미세조정 시도"

Step 3: 추적
다음 일정: 월요일 아침 보고
```

---

## 💡 팁 & 트릭

### Tip 1: 에이전트에게 문제 아니라 **"결과"** 요청하기

```
❌ 나쁜: "쿼리 최적화해줄래요?"
✅ 좋은: "이 쿼리를 200ms 이내로 만들어 주세요.
        현재 2.5초입니다."
```

### Tip 2: 자신의 제약을 명시하기

```
@ocr-specialist "
제약 조건:
- 비용: 월 $200 이내
- 처리 시간: 5초 이내
- 정확도 목표: 92%

이 세 조건을 모두 만족하는 방안 제시"
```

### Tip 3: 검증 가능하게 요청하기

```
✅ 좋은: "정확도 92% 달성 방법 + 검증 방법 포함"

→ 에이전트가 제공:
  1. 구현 코드
  2. 테스트 코드 (92% 검증)
  3. 벤치마크 (실제 수치)
```

---

**사용 가이드 버전**: v1.0  
**최종 수정**: 2026-08-18
