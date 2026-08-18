# All in One Store Hub - 테스트 전략

**작성일**: 2026-08-17  
**목표**: 테스트 커버리지 ≥80%, 프로덕션 결함률 ≤0.1%  
**적용 대상**: 모든 개발자, QA 팀  

---

## Executive Summary

**테스트 전략**: 피라미드 모델
```
         /\
        /  \
       / E2E \        5% (10 tests)
      /______\
      /      \
     /  API   \      15% (30 tests)
    /  Tests  \
   /___________\
   /           \
  / Unit Tests  \   80% (160 tests)
 /_______________\
```

**성공 기준**:
- 프로덕션 버그: ≤0.1% (버그 발견 후 출시 전 수정)
- 회귀 테스트 통과율: 100% (모든 기능)
- 개발자 신뢰도: 95%+ (코드 수정 후 테스트 통과 확신)

---

## 1. 단계별 테스트 전략

### 1.1 Unit Tests (개발자가 작성)

**목표**: 개별 함수/메서드 검증 (Input → Output)

**커버리지 범위**:
- ✅ 비즈니스 로직 (Validation, 계산)
- ✅ 에러 핸들링 (Invalid input, edge cases)
- ✅ 유틸리티 함수 (Helper, transformer)
- ❌ UI 컴포넌트는 Component test에서

**예시: Sales Validation Function**

```javascript
// src/services/sales.service.ts
export class SalesService {
  validateSalesInput(input: SalesInput): ValidationResult {
    if (!input.store_id) {
      return { valid: false, error: "Store ID required" };
    }
    if (input.total_revenue < 0) {
      return { valid: false, error: "Revenue cannot be negative" };
    }
    if (input.cash + input.card !== input.total_revenue) {
      return { valid: false, error: "Payment sum mismatch" };
    }
    return { valid: true };
  }
}

// src/services/__tests__/sales.service.test.ts
describe("SalesService.validateSalesInput", () => {
  const service = new SalesService();

  test("should pass valid input", () => {
    const input = {
      store_id: 1,
      date: "2026-08-17",
      total_revenue: 1500,
      cash: 1000,
      card: 500
    };
    const result = service.validateSalesInput(input);
    expect(result.valid).toBe(true);
  });

  test("should reject missing store_id", () => {
    const input = { total_revenue: 1500, cash: 1000, card: 500 };
    const result = service.validateSalesInput(input);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Store ID required");
  });

  test("should reject negative revenue", () => {
    const input = {
      store_id: 1,
      total_revenue: -100,
      cash: 0,
      card: 0
    };
    const result = service.validateSalesInput(input);
    expect(result.valid).toBe(false);
  });

  test("should reject payment sum mismatch", () => {
    const input = {
      store_id: 1,
      total_revenue: 1500,
      cash: 1000,
      card: 400 // ❌ 합이 맞지 않음
    };
    const result = service.validateSalesInput(input);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("sum mismatch");
  });

  test("should handle edge case: zero revenue", () => {
    const input = {
      store_id: 1,
      total_revenue: 0,
      cash: 0,
      card: 0
    };
    const result = service.validateSalesInput(input);
    expect(result.valid).toBe(true); // 가게가 휴무일 수 있음
  });
});
```

**테스트 작성 가이드**:
```
Test structure: Arrange → Act → Assert

✅ Good:
test("should calculate total revenue", () => {
  // Arrange
  const service = new SalesService();
  const sales = { cash: 1000, card: 500 };
  
  // Act
  const total = service.calculateTotal(sales);
  
  // Assert
  expect(total).toBe(1500);
});

❌ Bad:
test("test revenue", () => {
  expect(new SalesService().calculateTotal({...})).toBe(1500);
});

규칙:
1. 한 테스트 = 한 기능만 검증
2. 명확한 실패 메시지 포함
3. 테스트 데이터는 현실적인 값 사용
4. Mock/Stub은 필요할 때만 (외부 API, DB)
```

**실행 & 리포팅**:
```bash
# 개발 중
npm test --watch

# CI에서
npm test -- --coverage --verbose

예상 출력:
  PASS  src/services/__tests__/sales.service.test.ts
    SalesService.validateSalesInput
      ✓ should pass valid input (5ms)
      ✓ should reject missing store_id (2ms)
      ✓ should reject negative revenue (1ms)
      ✓ should reject payment sum mismatch (2ms)
      ✓ should handle edge case: zero revenue (3ms)

Test Suites: 1 passed
Tests:       5 passed
Coverage:    95% (lines), 90% (branches)
```

**커버리지 목표**: 
- 비즈니스 로직: ≥95%
- 유틸리티: ≥90%
- 전체: ≥85%

---

### 1.2 Integration Tests (QA + Backend Dev)

**목표**: 여러 모듈 간 상호작용 검증 (API → DB)

**테스트 범위**:
- ✅ API 엔드포인트 (Request → Response)
- ✅ 데이터베이스 트랜잭션
- ✅ 캐시 무효화
- ✅ 동시성 제어 (2명이 동시 수정)
- ❌ 외부 API (Google Vision) - Mock 사용

**예시: Sales API Integration Test**

```javascript
// src/routes/__tests__/sales.integration.test.ts
describe("POST /api/v1/sales", () => {
  let app;
  let db;
  let testStore;

  beforeAll(async () => {
    // 테스트 DB 연결
    db = await setupTestDatabase();
    app = createApp(db);
    testStore = await db.stores.create({ name: "Store A", id: 1 });
  });

  afterEach(async () => {
    // 각 테스트 후 DB 초기화
    await db.sales.deleteAll();
  });

  afterAll(async () => {
    await db.close();
  });

  test("should create sales record successfully", async () => {
    const payload = {
      store_id: testStore.id,
      date: "2026-08-17",
      total_revenue: 1500,
      cash: 1000,
      card: 500
    };

    const response = await request(app)
      .post("/api/v1/sales")
      .set("Authorization", `Bearer ${validToken}`)
      .send(payload)
      .expect(201);

    expect(response.body).toHaveProperty("id");
    expect(response.body.store_id).toBe(testStore.id);
    expect(response.body.total_revenue).toBe(1500);

    // DB 검증
    const dbRecord = await db.sales.findById(response.body.id);
    expect(dbRecord).toBeDefined();
    expect(dbRecord.total_revenue).toBe(1500);
  });

  test("should prevent duplicate sales for same store/date", async () => {
    // 첫 번째 입력
    await request(app)
      .post("/api/v1/sales")
      .set("Authorization", `Bearer ${validToken}`)
      .send({
        store_id: testStore.id,
        date: "2026-08-17",
        total_revenue: 1500,
        cash: 1000,
        card: 500
      })
      .expect(201);

    // 두 번째 입력 시도 (같은 날짜)
    const response = await request(app)
      .post("/api/v1/sales")
      .set("Authorization", `Bearer ${validToken}`)
      .send({
        store_id: testStore.id,
        date: "2026-08-17",
        total_revenue: 2000,
        cash: 1500,
        card: 500
      })
      .expect(409); // Conflict

    expect(response.body.error).toContain("already exists");
  });

  test("should update sales and log changes", async () => {
    // 초기 생성
    const createRes = await request(app)
      .post("/api/v1/sales")
      .set("Authorization", `Bearer ${validToken}`)
      .send({
        store_id: testStore.id,
        date: "2026-08-17",
        total_revenue: 1500,
        cash: 1000,
        card: 500
      })
      .expect(201);

    const salesId = createRes.body.id;

    // 수정
    const updateRes = await request(app)
      .put(`/api/v1/sales/${salesId}`)
      .set("Authorization", `Bearer ${validToken}`)
      .send({ total_revenue: 1600, cash: 1100, card: 500 })
      .expect(200);

    expect(updateRes.body.total_revenue).toBe(1600);

    // 감시 로그 확인
    const auditLogs = await db.auditLogs.findBySalesId(salesId);
    expect(auditLogs).toHaveLength(1);
    expect(auditLogs[0].old_values.total_revenue).toBe(1500);
    expect(auditLogs[0].new_values.total_revenue).toBe(1600);
  });

  test("should handle concurrent updates gracefully", async () => {
    const createRes = await request(app)
      .post("/api/v1/sales")
      .set("Authorization", `Bearer ${validToken}`)
      .send({
        store_id: testStore.id,
        date: "2026-08-17",
        total_revenue: 1500,
        cash: 1000,
        card: 500,
        version: 1
      })
      .expect(201);

    const salesId = createRes.body.id;

    // 동시에 2개의 수정 요청
    const req1 = request(app)
      .put(`/api/v1/sales/${salesId}`)
      .set("Authorization", `Bearer ${token1}`)
      .send({ total_revenue: 1600, version: 1 });

    const req2 = request(app)
      .put(`/api/v1/sales/${salesId}`)
      .set("Authorization", `Bearer ${token2}`)
      .send({ total_revenue: 1700, version: 1 });

    const [res1, res2] = await Promise.all([req1, req2]);

    // 하나는 성공, 하나는 409 (conflict)
    expect(res1.status).toBe(200);
    expect(res2.status).toBe(409);
    expect(res2.body.error).toContain("version mismatch");
  });

  test("should invalidate cache on update", async () => {
    // 생성
    const createRes = await request(app)
      .post("/api/v1/sales")
      .set("Authorization", `Bearer ${validToken}`)
      .send({
        store_id: testStore.id,
        date: "2026-08-17",
        total_revenue: 1500,
        cash: 1000,
        card: 500
      })
      .expect(201);

    const salesId = createRes.body.id;

    // 조회 (캐시됨)
    const getRes1 = await request(app)
      .get(`/api/v1/sales/${salesId}`)
      .set("Authorization", `Bearer ${validToken}`)
      .expect(200);

    expect(getRes1.body.total_revenue).toBe(1500);

    // 수정
    await request(app)
      .put(`/api/v1/sales/${salesId}`)
      .set("Authorization", `Bearer ${validToken}`)
      .send({ total_revenue: 1600, cash: 1100, card: 500 })
      .expect(200);

    // 재조회 (캐시 무효화되어야 함)
    const getRes2 = await request(app)
      .get(`/api/v1/sales/${salesId}`)
      .set("Authorization", `Bearer ${validToken}`)
      .expect(200);

    expect(getRes2.body.total_revenue).toBe(1600);
  });
});
```

**Integration Test 체크리스트**:
```
- [ ] Happy path 테스트 (정상 흐름)
- [ ] Error path 테스트 (예외 상황)
- [ ] Edge cases (경계값, 특수 상황)
- [ ] 데이터 무결성 (DB 검증)
- [ ] 동시성 (race conditions)
- [ ] 캐시 무효화
- [ ] 감시 로그
- [ ] 권한 검증
```

**수행 빈도**: 각 PR 제출 시 (CI/CD)

---

### 1.3 Component Tests (Frontend Dev)

**목표**: React 컴포넌트 동작 검증

**테스트 범위**:
- ✅ 렌더링 (Props에 따른 UI 변화)
- ✅ 사용자 상호작용 (Click, Input)
- ✅ 상태 변화 (State updates)
- ✅ 콜백 함수 호출
- ❌ 스타일 검증은 최소화 (유지보수 어려움)

**예시: SalesForm Component**

```javascript
// src/components/SalesForm.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SalesForm } from "./SalesForm";

describe("SalesForm", () => {
  test("should render form with today's date pre-filled", () => {
    const today = new Date().toISOString().split("T")[0];
    
    render(<SalesForm onSubmit={jest.fn()} />);
    
    const dateInput = screen.getByLabelText("Date");
    expect(dateInput).toHaveValue(today);
  });

  test("should show validation error for negative revenue", async () => {
    const handleSubmit = jest.fn();
    
    render(<SalesForm onSubmit={handleSubmit} />);
    
    const revenueInput = screen.getByLabelText("Total Revenue");
    await userEvent.clear(revenueInput);
    await userEvent.type(revenueInput, "-100");
    
    const submitButton = screen.getByRole("button", { name: "Submit" });
    fireEvent.click(submitButton);
    
    // 에러 메시지 표시
    await waitFor(() => {
      expect(screen.getByText(/revenue cannot be negative/i)).toBeInTheDocument();
    });
    
    // 제출 호출 안 됨
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  test("should handle successful submission", async () => {
    const handleSubmit = jest.fn();
    
    render(<SalesForm onSubmit={handleSubmit} />);
    
    await userEvent.type(screen.getByLabelText("Total Revenue"), "1500");
    await userEvent.type(screen.getByLabelText("Cash Payment"), "1000");
    await userEvent.type(screen.getByLabelText("Card Payment"), "500");
    
    const submitButton = screen.getByRole("button", { name: "Submit" });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        total_revenue: 1500,
        cash: 1000,
        card: 500,
        date: expect.any(String)
      });
    });
  });

  test("should show loading spinner during submission", async () => {
    const handleSubmit = jest.fn(
      () => new Promise(resolve => setTimeout(resolve, 500))
    );
    
    render(<SalesForm onSubmit={handleSubmit} />);
    
    await userEvent.type(screen.getByLabelText("Total Revenue"), "1500");
    
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    
    // 로딩 표시
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    
    // 완료 후 사라짐
    await waitFor(() => {
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    });
  });

  test("should calculate card payment automatically", async () => {
    render(<SalesForm onSubmit={jest.fn()} />);
    
    const totalInput = screen.getByLabelText("Total Revenue");
    const cashInput = screen.getByLabelText("Cash Payment");
    const cardInput = screen.getByLabelText("Card Payment");
    
    await userEvent.type(totalInput, "1500");
    await userEvent.type(cashInput, "1000");
    
    // Tab으로 포커스 이동 (자동 계산 트리거)
    fireEvent.blur(cashInput);
    
    // Card 자동 계산됨
    expect(cardInput).toHaveValue("500");
  });
});
```

**Component Test 체크리스트**:
```
- [ ] 올바른 props로 렌더링
- [ ] props 변화에 따른 업데이트
- [ ] 사용자 입력 처리
- [ ] 콜백 함수 호출
- [ ] 로딩 상태 표시
- [ ] 에러 메시지 표시
- [ ] 폼 유효성 검증
- [ ] 접근성 (ARIA labels, keyboard navigation)
```

**수행 빈도**: 각 PR 제출 시 (CI/CD)

---

### 1.4 E2E Tests (QA Team)

**목표**: 실제 사용자 시나리오 검증

**테스트 범위**:
- ✅ 전체 워크플로우 (Sales 입력 → 대시보드 표시)
- ✅ 다중 사용자 시나리오
- ✅ 브라우저 호환성 (Chrome, Safari, Firefox)
- ✅ 모바일/태블릿 반응형
- ❌ 시각적 회귀 (별도 도구 사용)

**도구**: Cypress (권장) 또는 Playwright

**예시: Full Sales Workflow E2E Test**

```javascript
// cypress/e2e/sales-workflow.cy.js
describe("Sales Input Workflow", () => {
  beforeEach(() => {
    cy.visit("https://app.store-hub.com/login");
    cy.login("manager1@store.com", "password123");
    cy.url().should("include", "/dashboard");
  });

  it("should complete end-to-end sales input", () => {
    // Step 1: 판매 데이터 입력 페이지로 이동
    cy.get("[data-testid='nav-sales']").click();
    cy.url().should("include", "/sales/new");

    // Step 2: 폼 채우기
    cy.get("[name='total_revenue']").type("1500");
    cy.get("[name='cash']").type("1000");
    cy.get("[name='card']").type("500");
    cy.get("[data-testid='notes']").type("Good day");

    // Step 3: 제출
    cy.get("[data-testid='submit-btn']").click();

    // Step 4: 성공 토스트 확인
    cy.get("[role='alert']")
      .should("contain", "Sales recorded successfully")
      .should("have.class", "success");

    // Step 5: 대시보드로 리다이렉트
    cy.url().should("include", "/dashboard");

    // Step 6: 대시보드에 데이터 표시 확인
    cy.get("[data-testid='today-revenue']")
      .should("contain", "$1,500");
  });

  it("should handle offline submission", () => {
    // 오프라인 모드 시뮬레이션
    cy.intercept("POST", "**/api/v1/sales", {
      statusCode: 503,
      body: { error: "Service unavailable" }
    });

    // 폼 입력
    cy.get("[name='total_revenue']").type("1500");
    cy.get("[data-testid='submit-btn']").click();

    // 오프라인 경고 표시
    cy.get("[role='alert']")
      .should("contain", "Network error")
      .should("have.class", "warning");

    // 재시도 옵션 제시
    cy.get("[data-testid='retry-btn']").should("be.visible");

    // 네트워크 복구 (mock 제거)
    cy.intercept("POST", "**/api/v1/sales", {
      statusCode: 201,
      body: { id: "sales-123", ...testData }
    });

    // 재시도
    cy.get("[data-testid='retry-btn']").click();

    // 성공
    cy.get("[role='alert']")
      .should("contain", "Successfully synced")
      .should("have.class", "success");
  });

  it("should validate form in real-time", () => {
    cy.get("[name='total_revenue']").type("-100");
    
    // 에러 메시지 즉시 표시
    cy.get("[data-testid='error-revenue']")
      .should("contain", "must be positive");

    // 제출 버튼 비활성화
    cy.get("[data-testid='submit-btn']").should("be.disabled");

    // 수정
    cy.get("[name='total_revenue']").clear().type("1500");

    // 에러 사라짐
    cy.get("[data-testid='error-revenue']").should("not.exist");

    // 제출 버튼 활성화
    cy.get("[data-testid='submit-btn']").should("be.enabled");
  });
});
```

**E2E Test 체크리스트**:
```
- [ ] Critical user journeys (주요 워크플로우)
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Mobile responsiveness (iOS, Android 뷰포트)
- [ ] Offline mode
- [ ] Performance (로드 시간 < 3초)
- [ ] Accessibility (스크린리더, 키보드 네비게이션)
- [ ] Internationalization (i18n) - 필요시
```

**수행 빈도**: 일일 (Nighttime) + 배포 전

---

## 2. 테스트 데이터 관리

### 2.1 Test Data Strategy

```
Fixture (고정 테스트 데이터)
├─ Users
│  ├─ manager@store.com (Manager role)
│  ├─ admin@company.com (Admin role)
│  └─ finance@company.com (Finance role)
│
├─ Stores
│  ├─ Store A (실제 운영점)
│  ├─ Store B
│  └─ Store C (특수한 경우 테스트)
│
└─ Sample Data
   ├─ Sales records (past 30 days)
   ├─ Invoices (various OCR accuracy)
   └─ Statements (supplier data)

Factories (동적 테스트 데이터)
├─ SalesFactory
│  └─ build({override props})
│
├─ InvoiceFactory
│  └─ withOCR({supplier, amount, ...})
│
└─ StatementFactory
   └─ forSupplier(supplierId)
```

**예시: Test Data Factory**

```javascript
// tests/factories/sales.factory.ts
export class SalesFactory {
  static build(overrides = {}) {
    const defaults = {
      store_id: 1,
      date: new Date().toISOString().split("T")[0],
      total_revenue: 1500,
      cash: 1000,
      card: 500,
      notes: ""
    };
    return { ...defaults, ...overrides };
  }

  static buildList(count, overrides = {}) {
    return Array.from({ length: count }, (_, i) =>
      this.build({ store_id: (i % 3) + 1, ...overrides })
    );
  }

  static buildWithHighRevenue() {
    return this.build({ total_revenue: 5000, cash: 3000, card: 2000 });
  }
}

// 사용 예시
const sales = SalesFactory.build();
const manySales = SalesFactory.buildList(10);
const highRevenue = SalesFactory.buildWithHighRevenue();
```

---

## 3. 테스트 자동화 (CI/CD)

### 3.1 GitHub Actions Workflow

```yaml
name: Test & Deploy

on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [develop]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Unit Tests
        run: npm test -- --coverage
        
      - name: Integration Tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgres://postgres:postgres@postgres:5432/test_db
          REDIS_URL: redis://redis:6379
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
      
      - name: E2E Tests
        run: npm run test:e2e
        if: success() && github.ref == 'refs/heads/main'

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: SAST (Static Analysis)
        run: npm run security:scan
      
      - name: Dependency Check
        run: npm audit --audit-level=moderate

  performance:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Build & Performance Test
        run: npm run test:performance
      
      - name: Compare with baseline
        run: |
          npm run perf:compare
          # P99 latency > 5s 이면 실패
```

---

## 4. 테스트 실패 처리

### 4.1 Bug Triage & Fix Protocol

```
Test 실패 발생
  │
  ├─ Flaky test?
  │  └─ Yes: 원인 파악 → 재시도 로직 또는 test 수정
  │
  ├─ 실제 버그?
  │  └─ Yes: Issue 생성 → Priority 결정
  │
  └─ 환경 문제?
     └─ Yes: 환경 리셋 → 재실행

Priority 결정:
  🔴 Critical (P0): 프로덕션 영향 큼 → 긴급 수정
  🟠 High (P1): 기능 손상 → 1일 내 수정
  🟡 Medium (P2): UX 문제 → 1주일 내 수정
  🔵 Low (P3): Minor bugs → 스프린트 계획에 반영
```

### 4.2 Regression Testing

```
배포 전 체크리스트:
- [ ] 모든 Unit tests 통과
- [ ] 모든 Integration tests 통과
- [ ] Critical E2E tests 통과
- [ ] 성능 테스트 기준 충족
- [ ] 보안 스캔 통과

배포 후 모니터링:
- [ ] Production 에러율 < 0.5%
- [ ] 사용자 리포트된 버그: 0
- [ ] API latency 정상 범위
- 불리는 경우: 즉시 롤백
```

---

## 5. 성공 지표

### 5.1 테스트 커버리지 목표

```
┌─────────────────────────────────┐
│ Coverage Target by Component    │
├─────────────────────────────────┤
│ Business Logic      | ≥95%      │
│ API Routes          | ≥90%      │
│ Frontend Components | ≥80%      │
│ Utilities           | ≥90%      │
│ Overall             | ≥80%      │
└─────────────────────────────────┘
```

**측정 방법**:
```bash
npm test -- --coverage --verbose

# 결과
---------|----------|----------|----------|----------|
File     | Stmts    | Branch   | Funcs    | Lines    |
---------|----------|----------|----------|----------|
Overall  | 85.2%    | 81.4%    | 88.3%    | 84.9%    |
---------|----------|----------|----------|----------|
```

### 5.2 결함률 및 품질 지표

```
프로덕션 결함 (Bug에서 출시까지):
- 주당 버그: ≤2개
- 심각도: 
  * Critical: 0개 (즉시 수정)
  * High: ≤1개 (1일 내 수정)
  * Medium: ≤5개 (1주일 내)

사용자 보고 버그 (출시 후):
- 월간: ≤1개 (자동 테스트 놓친 것들)
- 평균 수정 시간: ≤2시간 (Critical)

테스트 효율성:
- Flaky test: ≤2%
- Test 실행 시간: <5분 (전체)
- CI/CD 성공률: ≥99%
```

---

## 6. 테스트 체크리스트 (개발자용)

```
PR 제출 전:
☐ 새 기능에 Unit test 추가
☐ 버그 수정 시 regression test 추가
☐ npm test -- --coverage 실행 (80% 이상 확인)
☐ npm run lint 통과
☐ 로컬에서 E2E test 1회 실행
☐ 수정사항이 기존 테스트 통과하는지 확인
☐ 테스트 코드도 코드리뷰 대상

PR 리뷰:
☐ 테스트 커버리지 감소 없는지 확인
☐ 테스트가 명확하고 유지보수 가능한지 확인
☐ Edge cases 다루었는지 확인
☐ Mock/Stub이 적절히 사용되었는지 확인

배포 전:
☐ Staging에서 전체 E2E test 통과
☐ Performance test 기준 충족
☐ Security scan 통과
☐ 1회 Manual QA 테스트
```

---

## 7. 도구 & 라이브러리

```
Unit/Integration Testing:
- Jest: Test framework
- Supertest: HTTP assertions
- @testing-library/jest-dom: DOM matchers

Component Testing:
- @testing-library/react: React testing
- React Testing Library: User-centric testing
- Jest Mock: Mocking

E2E Testing:
- Cypress: Modern E2E framework
- Playwright: Cross-browser testing

Mocking & Fixtures:
- Jest Mock Functions
- Faker.js: Random data generation
- json-server: Mock REST API

Coverage & Reporting:
- Istanbul: Coverage reporter
- codecov.io: Coverage tracking
- GitHub Actions: CI automation

Performance:
- Lighthouse: Web performance audit
- Artillery: Load testing
- K6: Stress testing
```

---

## 8. 다음 단계

1. **Week 1-2**: Test framework 설정 (Jest, Cypress)
2. **Week 3-4**: Core 모듈 테스트 작성 (Unit + Integration)
3. **Week 5-8**: Feature별 테스트 추가 (E2E 포함)
4. **Week 9+**: 성능 & 보안 테스트 자동화

---

**문서 버전**: v1.0  
**최종 검토**: 2026-08-17
