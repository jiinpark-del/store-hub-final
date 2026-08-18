# Store Hub - 추가 2개 에이전트 (총 6명팀)

**작성일**: 2026-08-18  
**추가 에이전트**: 프로젝트 매니저 + 코드 리뷰어  

---

## 📊 전체 에이전트 팀 구성

```
기존 4명 (기술 전문가):
├─ OCR Pipeline Specialist
├─ Database & Performance Specialist
├─ API & Backend Architecture Specialist
└─ Frontend & Offline Specialist

신규 2명 (관리 & 품질):
├─ Project Manager Agent (전체 조율, 위험 관리)
└─ Code Review Agent (코드 품질, 보안, 성능)

총 6명의 전문가팀 🤖
```

---

# 🤖 Agent 5: Project Manager

## 역할 & 책임

**주요 목표**:
- 16주 프로젝트 완벽 관리
- 일정 준수, 위험도 조기 감지
- 주간/월간 리포트 작성
- 팀 간 협력 조율

## 담당 영역

### 1. 주간 프로젝트 추적

```
매주 월요일:
- 이번 주 목표 정의
- 각 에이전트별 작업 할당
- 예상 완료일정 설정

매주 목요일:
- 진행 상황 점검
- 문제 사항 감지
- 우선순위 조정

매주 금요일:
- 완료물 검수
- 팀 피드백 수집
- 다음 주 준비
```

### 2. 위험도 관리

```
실시간 감시:
□ 일정 지연 (> 1일)
□ 성능 미달 (정확도, 처리시간)
□ 팀 리소스 부족
□ 의존성 충돌
□ 기술적 장애물

대응:
- 즉시 에이전트 피드백
- 우선순위 재조정
- 대체 방안 검토
- 이해관계자 보고
```

### 3. 마일스톤 관리

```
Week 4 (기초 구축):
- DB 스키마 ✓
- API 스펙 ✓
- 보안 아키텍처 ✓
→ Go/No-Go 결정

Week 8 (MVP):
- OCR 90%+ 정확도 ✓
- API 구현 ✓
- Manager App 작동 ✓
→ Go/No-Go 결정

Week 12 (최적화):
- OCR 92% 정확도 ✓
- 성능 최적화 ✓
- 테스트 커버리지 80%+ ✓
→ Go/No-Go 결정

Week 16 (파일럿):
- 5개 지점 성공 ✓
- 만족도 4.0+ ✓
→ Full Rollout 승인
```

### 4. 문서 & 커뮤니케이션

```
주간 리포트:
- 진행도 (%)
- 완료 항목
- 진행 중 항목
- 문제점 & 해결책
- 다음 주 계획

월간 리포트:
- 마일스톤 달성도
- 위험도 평가
- 비용 추적
- 팀 성과 평가
- CEO 요약

실시간 알림:
- Critical 문제 발생 시
- 일정 변경 시
- 위험도 상승 시
```

---

## 🎯 Project Manager 호출 방법

### **주간 상태 보고**

```
@project-manager "
Week 5 프로젝트 상태:
- OCR 파이프라인 개발 진행 중 (80%)
- API 구현 완료 (100%)
- Frontend 개발 중 (60%)

이슈:
- OCR 정확도 88% (목표 92%)
- API latency 450ms (목표 ≤200ms)

다음 주 계획:
- OCR 정확도 개선
- API 성능 최적화
- Frontend 통합 테스트

리포트 원함: 주간 요약 + 위험도 평가
"
```

### **위험도 평가**

```
@project-manager "
현재 문제점 분석:
- OCR 정확도 미달: 88% vs 92% 목표
- 예상 영향: Phase 3 일정 2주 지연
- 근본 원인: 전처리 로직 미흡

질문:
1. 이 위험이 얼마나 심각한가?
2. 추천하는 대응 방안은?
3. Phase 3 일정을 조정해야 하나?
4. 팀에 알려야 하나?

리포트 원함: 위험도 평가 + 액션 플랜
"
```

### **마일스톤 체크**

```
@project-manager "
Week 8 마일스톤 평가:
- OCR 파이프라인: 정확도 90%, 처리시간 4.2초 ✓
- Sales API: 구현 완료, 테스트 커버리지 85% ✓
- Manager App: 기본 기능 완료, 오프라인 모드 개발 중 ⚠️
- Admin Dashboard: 프로토타입 완료 ✓

Go/No-Go 결정 필요
리포트 원함: 마일스톤 체크리스트 + 결정 권고
"
```

---

# 🤖 Agent 6: Code Review Agent

## 역할 & 책임

**주요 목표**:
- 코드 품질 보증 (버그 0)
- 보안 취약점 사전 차단
- 성능 최적화
- 테스트 커버리지 ≥80%

## 담당 영역

### 1. 코드 리뷰 기준

```
보안 (Security):
□ SQL Injection 방지
□ XSS 방지
□ 인증/인가 제대로 구현
□ 민감 데이터 암호화
□ 로깅 레벨 적절
□ 에러 메시지 안전

성능 (Performance):
□ N+1 쿼리 없음
□ 불필요한 루프 없음
□ 캐싱 활용
□ 메모리 누수 없음
□ API 응답 시간 기준 충족
□ 번들 크기 최적화

신뢰성 (Reliability):
□ Exception 처리 완전
□ Null 체크
□ 동시성 제어
□ 트랜잭션 ACID 준수
□ 재시도 로직
□ Timeout 설정

테스트 (Testing):
□ Unit 테스트 (커버리지 ≥80%)
□ Integration 테스트
□ E2E 테스트 (Critical path)
□ Mock 사용 적절
□ 엣지 케이스 테스트

가독성 (Readability):
□ 변수명 명확
□ 함수 한 가지만 수행
□ 주석 필요한 곳만
□ 코드 포맷 일관성
□ Linting 통과
```

### 2. 리뷰 프로세스

```
Step 1: 자동 검사
- Linting (ESLint, Pylint)
- Type checking (TypeScript)
- SAST (정적 분석)
- 의존성 취약점 스캔

Step 2: 수동 코드 리뷰
- 로직 검증
- 보안 재검사
- 성능 분석
- 테스트 커버리지 확인

Step 3: 성능 테스트
- 단위 성능 (함수)
- 통합 성능 (API)
- 부하 테스트 (1000 concurrent)
- 메모리 프로파일링

Step 4: 보안 감사
- 권한 검증
- 데이터 흐름 추적
- 외부 입력 검증
- 암호화 강도 확인

Step 5: 최종 승인
- 모든 리뷰 완료
- 문제 모두 해결
- 테스트 통과
- 문서화 완료
→ Merge 승인
```

### 3. 버그 카테고리 & 심각도

```
🔴 Critical (즉시 수정):
- 보안 취약점
- 데이터 손실 위험
- 시스템 크래시
- 프로덕션 영향

🟠 High (24시간 내):
- 주요 기능 오류
- 성능 저하 (> 50%)
- 회귀 (이전 기능 깨짐)

🟡 Medium (1주일 내):
- 부가 기능 오류
- 사용성 문제
- 코드 냄새

🔵 Low (스프린트 계획):
- 경미한 UI 이슈
- 코드 스타일
- 드문 엣지 케이스
```

---

## 📋 Code Review 호출 방법

### **풀 리퀘스트 리뷰**

```
@code-review "
검토 대상: PR #42 - OCR 파이프라인 구현
Commit: abc1234 ~ def5678

확인 사항:
- Google Vision API 통합 코드
- 이미지 전처리 로직
- 캐싱 구현
- 에러 처리
- 테스트 커버리지

리포트 원함:
1. 발견된 모든 이슈 (심각도별)
2. 성능 분석
3. 보안 체크 결과
4. 테스트 커버리지 평가
5. 승인/반려 판정
"
```

### **특정 파일 리뷰**

```
@code-review "
파일: src/services/sales.service.ts
내용: Optimistic Locking 구현

검사:
- 동시성 제어 로직 정확성
- 버전 충돌 처리
- 트랜잭션 격리 수준
- 성능 (concurrent 100+ users)
- 테스트 케이스

리포트 원함: 상세 분석 + 개선 제안
"
```

### **보안 감사**

```
@code-review "
보안 감사: Authentication/Authorization 모듈
파일:
- src/middleware/auth.ts
- src/services/rbac.service.ts
- src/controllers/user.controller.ts

검사 항목:
□ JWT 토큰 검증
□ RBAC 권한 체크
□ 레이트 제한
□ CORS 설정
□ 암호화 강도
□ 로깅 (민감 데이터 제외)
□ 세션 관리
□ SQL Injection 방지

리포트 원함: 보안 등급 + 취약점 목록 + 수정안
"
```

### **성능 리뷰**

```
@code-review "
성능 분석: Reconciliation 쿼리
파일: src/services/reconciliation.service.ts

확인:
- 현재 실행 시간: 2.5초
- 목표: 200ms 이내
- 병목: N+1 쿼리, 인덱스 미활용

리포트 원함:
1. 성능 병목 분석
2. 개선 방안 (구체적 코드)
3. 예상 개선 효과
4. 리스크 평가
"
```

---

## 🎯 전체 에이전트 팀 협력

```
개발 사이클:

1️⃣ 기술 에이전트들 개발
   ├─ OCR Specialist: 파이프라인 코드 작성
   ├─ DB Specialist: 쿼리 최적화
   ├─ API Specialist: 엔드포인트 구현
   └─ Frontend Specialist: UI 컴포넌트 개발

2️⃣ Code Review Agent 검사
   └─ 모든 코드 품질/보안/성능 체크
      → 문제 발견 → 개발자에 피드백

3️⃣ Project Manager 조율
   └─ 진행도 추적
      → 일정 조정 필요 시
      → 위험도 평가
      → 팀에 보고

4️⃣ 반복 & 개선
   └─ 리뷰 완료 → 병합
      → 다음 기능으로 진행
```

---

## 📊 성공 기준

### Code Review Agent

```
목표:
- 모든 코드 리뷰: 24시간 내 완료
- 버그 발견율: 초기 발견 ≥95%
- 프로덕션 버그: ≤0.1% (리뷰 후 발생)
- 테스트 커버리지: ≥80% 유지
- 보안 이슈: 0건 (프로덕션)

측정:
- 월간 리뷰 건수
- 발견된 버그/보안 이슈
- 리뷰 후 프로덕션 결함율
- 평균 리뷰 시간
- 코드 품질 점수
```

### Project Manager Agent

```
목표:
- 일정 준수: 계획 ±3일
- 위험도 조기 감지: ≥80%
- 주간 리포트: 매주 목요일
- 팀 만족도: ≥4.0/5.0
- 이슈 해결율: ≥90%

측정:
- 마일스톤 달성도 (%)
- 발견된 위험도 개수
- 리포트 제시간성
- 팀 피드백
- 최종 프로젝트 성공도
```

---

## 📅 호출 스케줄

### **Project Manager**

```
매주 월요일 오전:
- 주간 목표 설정 및 작업 할당

매주 목요일 오후:
- 진행 상황 점검
- 문제점 평가
- 우선순위 조정

매주 금요일:
- 주간 리포트 작성
- 다음 주 준비

매월 마지막 금요일:
- 월간 리포트
- 마일스톤 평가
```

### **Code Review**

```
매 개발 완료 후:
- PR 제출 시 자동 트리거
- 24시간 내 리뷰 완료

Critical 코드:
- 보안 관련 코드: 즉시 리뷰
- 성능 관련 코드: 우선 리뷰
- 핵심 비즈니스 로직: 깊이 있는 리뷰

정기 감사:
- 월 1회: 전체 코드베이스 보안 감사
- 월 1회: 성능 최적화 검토
- 월 1회: 테스트 커버리지 평가
```

---

## 🚀 사용 예시

### **주중 개발 사이클**

```
Monday AM:
@project-manager "Week X 계획: [요청]"
→ 주간 작업 할당, 우선순위 설정

Monday PM - Friday AM:
4명의 기술 에이전트들 개발
→ 코드 작성

Friday 오후:
@code-review "PR #X 리뷰: [요청]"
→ 모든 코드 검사 및 승인

Friday PM:
@project-manager "Week X 완료 리포트: [요청]"
→ 진행도 평가, 다음 주 조정
```

---

## ✨ 최종 팀 구성 (6명)

```
🏗️ 기술 전문가 (4명):
  1. OCR Pipeline Specialist
  2. Database & Performance Specialist
  3. API & Backend Architecture Specialist
  4. Frontend & Offline Specialist

📊 관리 & 품질 (2명):
  5. Project Manager Agent
  6. Code Review Agent

= 완벽한 개발팀 🎯
```

---

**문서 버전**: v1.0  
**최종 검토**: 2026-08-18  
**총 에이전트 수**: 6명
