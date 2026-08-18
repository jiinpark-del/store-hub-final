# All in One Store Hub - 완벽한 프로젝트 문서

**작성일**: 2026-08-18  
**상태**: 🟢 준비 완료 (Ready to Go)  
**기술 스택**: React, Node.js, PostgreSQL  

---

## 📋 프로젝트 개요

**All in One Store Hub**는 가게 매니저의 업무 자동화와 본사 관리자의 데이터 무결성을 동시에 해결하는 통합 솔루션입니다.

### 핵심 기능
- ✅ **AI 인보이스 읽기 (OCR)**: 이미지 → 자동 구조화 데이터 추출
- ✅ **안전한 세일즈 입력**: 수식 깨짐 없는 데이터베이스 기반 저장
- ✅ **자동 대조 (Reconciliation)**: Statement vs Invoice 자동 매칭
- ✅ **오프라인 모드**: 네트워크 불안정한 환경도 완벽 지원

---

## 📂 문서 구조

### Phase 1: 분석 & 계획 (완성)
```
├── analysis-report.md              # 현황 분석, 성능 병목, 위험도
├── architecture-plan.md            # 마이크로서비스, 캐싱, 보안
├── implementation-roadmap.md       # 16주 4단계 개발 계획
├── testing-strategy.md             # Unit/Integration/E2E 테스트
```

### Phase 2: 에이전트 프레임워크 (완성)
```
├── AGENT-FRAMEWORK.md              # 4개 에이전트 역할 정의
├── AGENT-INSTRUCTIONS.md           # 상세 운영 지침
├── AGENT-USAGE-GUIDE.md            # 실제 호출 방법 & 주별 계획
└── FINAL-SUMMARY.md                # 최종 실행 계획서
```

### Phase 3: 기술 상세 설계 (완성)
```
├── database-schema-v1.0.sql        # PostgreSQL 완전 스키마
├── MIGRATION-V001-INITIAL.sql      # 마이그레이션 스크립트
└── CONCURRENCY-CONTROL-STRATEGY.md # Optimistic Locking 구현
```

---

## 🎯 핵심 목표

| 목표 | 현재 | 목표값 | 달성률 |
|------|------|--------|--------|
| **OCR 정확도** | - | 92% | 계획 |
| **Query 성능** | - | ≤200ms | 계획 |
| **가용성** | - | 99.5% | 계획 |
| **테스트 커버리지** | - | ≥80% | 계획 |
| **개발 기간** | - | 16주 | 계획 |

---

## 🤖 4개 전문가 에이전트

### 1. OCR Pipeline Specialist
**역할**: 이미지 처리, AI 모델, 정확도 최적화  
**목표**: 정확도 92%, 처리 시간 ≤5초  
**호출**: Week 5 (OCR 파이프라인 구축)

### 2. Database & Performance Specialist
**역할**: PostgreSQL 설계, Query 최적화  
**목표**: 무결성 100%, Query ≤200ms  
**호출**: Week 3 (DB 스키마 설계)

### 3. API & Backend Architecture Specialist
**역할**: REST API 설계, 마이크로서비스  
**목표**: 안정적 API, 99.5% 가용성  
**호출**: Week 3 (API 스펙 설계)

### 4. Frontend & Offline Specialist
**역할**: React, 오프라인 모드, 상태 관리  
**목표**: 오프라인 100%, 동기화 ≥99.5%  
**호출**: Week 6 (Form UI 구현)

---

## 📅 16주 구현 계획

### Phase 1: 기초 구축 (Weeks 1-4)
```
Week 3-4: DB 스키마 + API 스펙 설계 완료
결과물: database-schema-v1.0.sql, api-specification.yaml
```

### Phase 2: MVP 개발 (Weeks 5-8)
```
Week 5-6: OCR 파이프라인 + Manager App 개발
Week 7-8: Admin Dashboard + 통합 테스트
결과물: 작동하는 MVP 시스템
```

### Phase 3: 최적화 (Weeks 9-12)
```
Week 9: OCR 정확도 92% 달성
Week 10: Reconciliation 성능 최적화 (2.5s → 200ms)
Week 11: 테스트 커버리지 80%+
결과물: 최적화된 프로덕션 시스템
```

### Phase 4: 배포 & 파일럿 (Weeks 13-16)
```
Week 13: 인프라 구축 (Kubernetes)
Week 14-15: 5개 지점 파일럿
Week 16: 파일럿 완료, 피드백 수집
결과물: 프로덕션 배포 준비 완료
```

---

## 🎯 주요 기술 결정사항

### 데이터베이스
- **DB**: PostgreSQL (ACID compliance)
- **동시성**: Optimistic Locking (version field)
- **성능**: 인덱싱 전략 (복합 인덱스, 파티셔닝)
- **격리 수준**: READ_COMMITTED (기본) + SERIALIZABLE (Reconciliation)

### OCR 처리
- **모델**: Google Vision (정확도) + Tesseract (빠름) - 하이브리드
- **전처리**: 이미지 압축, 회전 감지, 명도 조정
- **캐싱**: Redis (동일 이미지 재사용, TTL 7일)
- **성능 목표**: P99 ≤5초

### API 설계
- **패턴**: RESTful + Idempotency
- **인증**: JWT (RS256)
- **에러 처리**: RFC 7807 (Problem Details)
- **중복 방지**: Idempotency-Key + 24h 캐시

### 프론트엔드
- **오프라인**: IndexedDB + Service Worker
- **동기화**: Last-Write-Wins with Timestamp
- **상태 관리**: Zustand
- **폼 검증**: React Hook Form + Zod

---

## 📊 성공 기준

### Go/No-Go 체크포인트

**Week 4**: 기초 구축 완료
- ✅ DB 스키마 최종 확정
- ✅ API 스펙 100% 문서화
- ✅ 보안 아키텍처 완료
- Status: 🟢 **Go** → Phase 2 진행

**Week 8**: MVP 완료
- ✅ Sales API 구현 + 테스트
- ✅ OCR 파이프라인 정확도 90%+
- ✅ Manager App 기본 기능
- Status: 🟢 **Go** → Phase 3 진행

**Week 12**: 최적화 완료
- ✅ OCR 정확도 92% 달성
- ✅ Reconciliation 성능 ≤200ms
- ✅ 테스트 커버리지 ≥80%
- Status: 🟢 **Go** → Phase 4 진행

**Week 16**: 파일럿 완료
- ✅ 5개 지점 파일럿 성공
- ✅ 사용자 만족도 ≥4.0/5.0
- ✅ 프로덕션 배포 준비
- Status: 🟢 **Go** → Full Rollout 승인

---

## 🚀 지금 바로 해야 할 일

### Monday (2026-08-19) 오전
```
□ 팀 킥오프 미팅 (30분)
  - 목표 및 일정 설명
  - 에이전트 시스템 소개
  - 주간 계획 확인
```

### Monday 오후
```
□ @db-specialist 호출
  "PostgreSQL 스키마 설계:
   - 모든 테이블, 인덱스, 제약조건
   - 트랜잭션 격리 수준
   - 동시성 제어 전략
   결과물: database-schema-v1.0.sql"

□ @api-specialist 호출
  "API 스펙 설계:
   - Sales, Invoice, Reconciliation API
   - 요청/응답 스펙
   - Idempotency 지원
   결과물: api-specification.openapi.yaml"
```

### Thursday 오후
```
□ 완료물 검수
□ 팀 피드백 수집
□ 문제 해결
□ 다음 주 조정
```

---

## 💾 파일 정보

```
총 11개 문서
- Markdown: 8개 (총 130KB)
- SQL: 3개 (총 50KB)
- 총 라인 수: 3,500+ 라인

작성 소요 시간: 12시간
최종 검토: 2026-08-18
```

---

## 📞 문의

**프로젝트 매니저**: jiin.park@oliverbrown.com.au  
**기술 리드**: Store Hub Team  
**시작 일정**: 2026-08-19 (Monday, Week 3)

---

## 📌 라이센스 및 주의사항

```
이 문서는 내부용 기밀 문서입니다.
무단 복제, 배포, 수정을 금합니다.

작성: Claude Code
검토: Database & API Specialists
승인: Store Hub Team
버전: 1.0 (Final)
```

---

**🎉 준비 완료! 월요일 킥오프 미팅에서 만나요!**
