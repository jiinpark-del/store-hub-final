# Store Hub - 동시성 제어 & 트랜잭션 전략

**버전**: v1.0  
**작성일**: 2026-08-18  
**담당**: Database & Performance Specialist

---

## 1. 트랜잭션 격리 수준 (Isolation Level)

### 선택: READ_COMMITTED (Default) + Optimistic Locking

```
격리 수준 비교:

┌─────────────────────┬──────────────────┬─────────────┐
│ 격리 수준            │ 동시성           │ 일관성      │
├─────────────────────┼──────────────────┼─────────────┤
│ READ UNCOMMITTED    │ 가장 높음        │ 가장 낮음   │
│ READ COMMITTED      │ 중간 (추천!)     │ 중간       │
│ REPEATABLE READ     │ 낮음             │ 높음       │
│ SERIALIZABLE        │ 가장 낮음        │ 가장 높음   │
└─────────────────────┴──────────────────┴─────────────┘

선택 이유:
✅ READ_COMMITTED:
  - Balance between performance and safety
  - No dirty reads (읽은 데이터는 커밋된 것)
  - Phantom reads 가능 (하지만 우리 시나리오에선 OK)
  - Most PostgreSQL connections use this by default

✅ Optimistic Locking (Application level):
  - version field로 충돌 감지
  - Read-heavy workload에 최적
  - Deadlock 없음
```

---

## 2. Optimistic Locking 구현

### 개념

```
경쟁 조건 예시:

User A와 B가 동시에 Sales를 수정하려고 함:

시간    User A                      User B
────────────────────────────────────────────────
t1     SELECT * FROM sales
       WHERE id = 'sales-123'
       Result: {id, revenue: 1000, version: 1}

t2                                 SELECT * FROM sales
                                   WHERE id = 'sales-123'
                                   Result: {id, revenue: 1000, version: 1}

t3     UPDATE sales
       SET revenue = 1500, version = 2
       WHERE id = 'sales-123' AND version = 1
       ✓ Success (row updated)

t4                                 UPDATE sales
                                   SET revenue = 1200, version = 2
                                   WHERE id = 'sales-123' AND version = 1
                                   ✗ Failure (0 rows affected)
                                   → 409 Conflict

t5                                 (User B retries)
                                   SELECT * FROM sales
                                   WHERE id = 'sales-123'
                                   Result: {version: 2, revenue: 1500}
                                   
                                   User B decides:
                                   - Retry with version 2
                                   - Or cancel
```

### 구현 코드 (Node.js)

```typescript
// src/services/sales.service.ts

interface UpdateSalesInput {
  store_id: number;
  date: string;
  total_revenue: number;
  cash_payment: number;
  card_payment: number;
  version: number; // ← Optimistic Lock version
}

interface UpdateSalesResult {
  success: boolean;
  data?: Sales;
  error?: {
    code: string;
    message: string;
    current_version?: number;
  };
}

class SalesService {
  async updateSales(
    salesId: string,
    input: UpdateSalesInput,
    userId: number
  ): Promise<UpdateSalesResult> {
    try {
      const query = `
        UPDATE sales
        SET
          total_revenue = $1,
          cash_payment = $2,
          card_payment = $3,
          version = version + 1,
          updated_by = $5,
          updated_at = now()
        WHERE id = $4 AND version = $6
        RETURNING *;
      `;

      const result = await db.query(query, [
        input.total_revenue,
        input.cash_payment,
        input.card_payment,
        salesId,
        userId,
        input.version // WHERE version = input.version
      ]);

      // 0 rows updated → version mismatch (conflict)
      if (result.rowCount === 0) {
        // Get current version
        const currentRow = await db.query(
          'SELECT version FROM sales WHERE id = $1',
          [salesId]
        );

        return {
          success: false,
          error: {
            code: 'VERSION_MISMATCH',
            message: 'Sales record was modified by another user',
            current_version: currentRow.rows[0]?.version
          }
        };
      }

      // Success
      await this.logAudit(salesId, userId, input, result.rows[0]);

      return {
        success: true,
        data: result.rows[0]
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: error.message
        }
      };
    }
  }

  private async logAudit(
    salesId: string,
    userId: number,
    newValues: any,
    updatedRecord: any
  ) {
    await db.query(
      `INSERT INTO sales_audit_log
       (sales_id, action, changed_by, new_values, changed_at)
       VALUES ($1, $2, $3, $4, now())`,
      [salesId, 'UPDATE', userId, JSON.stringify(newValues)]
    );
  }
}
```

### 프론트엔드 처리 (React)

```typescript
// src/hooks/useSalesUpdate.ts

import { useState } from 'react';
import { SalesService } from '../services/sales.service';

interface UseSalesUpdateState {
  loading: boolean;
  error: null | {
    code: string;
    message: string;
    currentVersion?: number;
  };
}

export function useSalesUpdate() {
  const [state, setState] = useState<UseSalesUpdateState>({
    loading: false,
    error: null
  });

  const updateSales = async (
    salesId: string,
    data: UpdateSalesInput
  ): Promise<{ success: boolean; data?: Sales }> => {
    setState({ loading: true, error: null });

    try {
      const result = await SalesService.updateSales(salesId, data);

      if (!result.success && result.error?.code === 'VERSION_MISMATCH') {
        // 충돌 발생
        setState({
          loading: false,
          error: {
            code: 'CONFLICT',
            message: '다른 사용자가 이미 변경했습니다',
            currentVersion: result.error.current_version
          }
        });

        return { success: false };
      }

      setState({ loading: false, error: null });
      return { success: true, data: result.data };
    } catch (error) {
      setState({
        loading: false,
        error: {
          code: 'ERROR',
          message: 'Failed to update sales'
        }
      });
      return { success: false };
    }
  };

  return {
    ...state,
    updateSales
  };
}
```

### UI 충돌 처리

```typescript
// src/components/SalesForm.tsx

export function SalesForm({ salesId, initialData }) {
  const { loading, error, updateSales } = useSalesUpdate();
  const [formData, setFormData] = useState(initialData);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [serverData, setServerData] = useState<Sales | null>(null);

  const handleSubmit = async () => {
    const result = await updateSales(salesId, {
      ...formData,
      version: initialData.version // Current version from state
    });

    if (!result.success && error?.code === 'CONFLICT') {
      // 충돌 모달 표시
      setShowConflictModal(true);

      // 최신 데이터 가져오기
      const fresh = await SalesService.getSales(salesId);
      setServerData(fresh);
    } else if (result.success) {
      // 성공
      showToast('Sales updated successfully');
      setFormData(result.data!);
    }
  };

  const handleConflictResolution = (choice: 'local' | 'server' | 'merge') => {
    if (choice === 'server') {
      // 서버 데이터 사용
      setFormData(serverData!);
      setShowConflictModal(false);
      // Retry with new version
      handleSubmit();
    } else if (choice === 'local') {
      // 로컬 데이터 유지 (재시도)
      setShowConflictModal(false);
      handleSubmit();
    } else if (choice === 'merge') {
      // 수동 병합
      setShowMergeModal(true);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        {/* Form fields */}
      </form>

      {showConflictModal && serverData && (
        <ConflictModal
          localData={formData}
          serverData={serverData}
          onResolution={handleConflictResolution}
        />
      )}
    </>
  );
}
```

---

## 3. Deadlock 방지 전략

### Deadlock이 발생하는 경우

```
시나리오: Circular waiting

User A                          User B
─────────────────────────────────────
LOCK Table sales
  (wants invoice lock)          LOCK Table invoices
                                  (wants sales lock)
  ❌ Deadlock!
```

### 방지 전략

```sql
-- ✅ 일관된 잠금 순서 유지
-- Always lock sales BEFORE invoices

-- Transaction A
BEGIN;
  SELECT * FROM sales WHERE id = $1 FOR UPDATE;
  SELECT * FROM invoices WHERE sales_id = $1 FOR UPDATE;
  -- ... 수정
COMMIT;

-- Transaction B
BEGIN;
  SELECT * FROM sales WHERE id = $1 FOR UPDATE;
  SELECT * FROM invoices WHERE sales_id = $1 FOR UPDATE;
  -- ... 수정
COMMIT;

-- Optimistic Locking으로 Deadlock 제거
-- SELECT는 잠금 없음 → no contention
-- UPDATE는 version check로 충돌 감지
-- 결과: Deadlock 불가능!
```

---

## 4. Statement Reconciliation의 동시성

### 시나리오

```
월말 reconciliation 진행 중:

시간    Process 1                   Process 2
─────────────────────────────────────────────
t1     SELECT COUNT(*) FROM         (다른 사용자)
       reconciliation_results       UPDATE sales
       (1000개 행 읽음)             WHERE store_id = 1
                                    
t2     [여전히 읽는 중]             (이제 커밋됨)
       
t3     UPDATE reconciliation        새로운 invoice
       _results SET ...             확인됨
       WHERE statement_id = ?
       
결과: 새 invoice가 reconciliation에 누락될 수 있음!
```

### 해결책: Serializable Isolation

```typescript
// src/services/reconciliation.service.ts

async runReconciliation(statementId: string): Promise<void> {
  // SERIALIZABLE transaction로 실행
  await db.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');

  try {
    await db.query('BEGIN');

    // Step 1: Statement 데이터 읽음
    const statement = await db.query(
      'SELECT * FROM statements WHERE id = $1',
      [statementId]
    );

    // Step 2: Invoice 데이터 읽음 (Statement 기간 내)
    const invoices = await db.query(
      `SELECT * FROM invoice_ocr_results
       WHERE invoice_date BETWEEN $1 AND $2`,
      [statement.period_start, statement.period_end]
    );

    // Step 3: 매칭 로직 (이 동안 다른 변경 불가)
    const results = this.matchInvoicesToStatement(invoices, statement);

    // Step 4: 결과 저장
    for (const result of results) {
      await db.query(
        `INSERT INTO reconciliation_results (...)
         VALUES (...)`,
        [...]
      );
    }

    await db.query('COMMIT');
  } catch (error) {
    await db.query('ROLLBACK');

    // Serialization conflict 감지
    if (error.code === '40P01') {
      // Retry logic
      logger.warn('Serialization conflict, retrying...');
      await this.runReconciliation(statementId);
    } else {
      throw error;
    }
  }
}
```

---

## 5. 성능 모니터링 쿼리

```sql
-- 동시 트랜잭션 확인
SELECT pid, usename, state, query
FROM pg_stat_activity
WHERE state != 'idle';

-- Locks 확인
SELECT * FROM pg_locks WHERE NOT granted;

-- Lock 대기 시간
SELECT pid, usename, wait_event_type, wait_event, query
FROM pg_stat_activity
WHERE wait_event_type IS NOT NULL;

-- Version 충돌 통계 (Application logs 분석)
SELECT
  DATE_TRUNC('hour', changed_at) as hour,
  COUNT(*) as total_updates,
  SUM(CASE WHEN error_code = 'VERSION_MISMATCH' THEN 1 ELSE 0 END) as conflicts,
  ROUND(
    SUM(CASE WHEN error_code = 'VERSION_MISMATCH' THEN 1 ELSE 0 END)::NUMERIC /
    COUNT(*) * 100,
    2
  ) as conflict_rate_pct
FROM sales_audit_log
GROUP BY DATE_TRUNC('hour', changed_at);
```

---

## 6. 테스트 시나리오

### Test 1: 기본 Optimistic Lock

```
1. User A가 Sales (version=1)를 읽음
2. User B가 Sales (version=1)를 읽음
3. User A가 업데이트 시도: version=1 → 2 ✅ Success
4. User B가 업데이트 시도: version=1 → 2 ❌ Conflict (409)
5. User B가 최신 데이터(version=2) 재읽음
6. User B가 재시도: version=2 → 3 ✅ Success

Pass Criteria: User A와 B의 변경사항 모두 적용됨
```

### Test 2: Idempotency

```
1. User A가 Sales 생성 요청 (Idempotency-Key: 'key-123')
2. Request timeout 발생
3. User A가 같은 요청 재시도 (Idempotency-Key: 'key-123')

Expected: 두 번 INSERT되지 않고, 첫 번째 결과 반환

실현: idempotency_keys 테이블에서 'key-123' 검색
     → 이미 처리됨 → 캐시된 결과 반환
```

### Test 3: Serializable Transaction (Reconciliation)

```
1. Reconciliation process 시작 (SERIALIZABLE)
2. 동시에 새 Invoice 추가
3. Reconciliation query는 새 Invoice를 볼 수 없어야 함
4. Reconciliation 완료
5. 새 Invoice를 포함한 다음 Reconciliation 실행

Pass Criteria: 데이터 일관성 유지, no race conditions
```

---

## 7. 체크리스트

```
구현 확인:
□ 모든 Sales UPDATE에 version field 포함
□ API에서 409 Conflict 응답 처리
□ 프론트엔드에서 충돌 모달 UI 구현
□ Idempotency-Key 검증 미들웨어
□ 감시 로그에 version 정보 기록

테스트 완료:
□ 단위 테스트 (Optimistic Lock 로직)
□ 통합 테스트 (동시 UPDATE 시뮬레이션)
□ 성능 테스트 (conflict rate 측정)
□ E2E 테스트 (다중 사용자)

배포 전:
□ 프로덕션 데이터 마이그레이션 (version 필드 추가)
□ Monitoring query 설정
□ Alert rule 구성 (conflict rate > 5%)
□ Rollback plan 준비
```

---

**문서 버전**: v1.0  
**최종 검토**: 2026-08-18
