# 🎯 Store Hub - 사용자 액션 플랜

**작성일**: 2026-08-18  
**상태**: Phase 2 MVP 완료 → Phase 3 배포 준비  
**담당**: Oliver Brown (사용자)

---

## 📋 **지금 바로 해야 할 일 (우선순위순)**

### **1️⃣ 우선순위: 높음 - 배포 환경 설정** ⏰ 1-2시간

#### 1.1 Docker 설정
```bash
# 1. Dockerfile 확인/수정
cat Dockerfile

# 2. Docker 이미지 빌드
docker build -t store-hub:1.0 .

# 3. Docker Compose 확인
cat docker-compose.yml

# 4. 컨테이너 실행 테스트
docker-compose up -d

# 5. 로그 확인
docker-compose logs -f
```

**체크리스트:**
- [ ] Dockerfile 준비됨
- [ ] docker-compose.yml 준비됨
- [ ] 이미지 빌드 성공
- [ ] 컨테이너 실행 확인

---

#### 1.2 환경 변수 설정
```bash
# 1. .env.production 파일 생성
cat > .env.production << EOF
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=store_hub
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# API
API_URL=http://localhost:3000
JWT_SECRET=your_jwt_secret

# OCR
OCR_API_KEY=your_google_vision_key
EOF

# 2. 환경 변수 확인
echo $DB_HOST  # postgres 출력되는지 확인
```

**체크리스트:**
- [ ] .env.production 생성
- [ ] 모든 환경 변수 설정
- [ ] 민감 정보 보호 (Git 제외)

---

### **2️⃣ 우선순위: 높음 - 프로덕션 빌드 검증** ⏰ 30분

```bash
# 1. 프로덕션 빌드 수행
npm run build

# 2. 빌드 결과 확인
ls -lh dist/

# 3. 번들 크기 확인
# 예상: 111 KB (gzip)
du -sh dist/

# 4. 빌드된 앱 미리보기
npm run preview
```

**검증 항목:**
- [ ] 빌드 완료 (에러 없음)
- [ ] dist/ 폴더 생성
- [ ] 번들 크기 < 150 KB (목표: 111 KB)
- [ ] 미리보기 접근 가능 (http://localhost:4173)

---

### **3️⃣ 우선순위: 높음 - 브라우저 기능 테스트** ⏰ 1시간

#### 3.1 개발 서버에서 테스트
```bash
# 1. 개발 서버 시작
npm run dev

# 2. 브라우저에서 테스트 (http://localhost:5173)

# 3. 각 기능 확인
```

**테스트 체크리스트:**
```
대시보드:
- [ ] 페이지 로드 (< 2초)
- [ ] KPI 타일 표시
- [ ] 판매 테이블 렌더링
- [ ] 매출 차트 표시
- [ ] 경고 알림 표시

송장 관리:
- [ ] 페이지 접근
- [ ] 업로드 폼 표시
- [ ] 송장 목록 표시
- [ ] 모달 열기/닫기

대조 관리:
- [ ] 페이지 접근
- [ ] 불일치 항목 표시
- [ ] 모달 상호작용
- [ ] 상태 배지 표시

네비게이션:
- [ ] 탭 전환 작동
- [ ] 대시보드 ↔ 송장 ↔ 대조 전환
```

#### 3.2 E2E 테스트 실행
```bash
# 모든 E2E 테스트 실행
npm run test:e2e

# 예상 결과: 22/22 통과
```

**체크리스트:**
- [ ] 모든 E2E 테스트 통과
- [ ] 오류 없음
- [ ] 실행 시간 < 30초

---

### **4️⃣ 우선순위: 중간 - API 연동** ⏰ 2-3시간

#### 4.1 실제 PostgreSQL 연결
```bash
# 1. PostgreSQL 확인
psql -h localhost -U postgres -d store_hub

# 2. 데이터베이스 스키마 초기화
# database-schema-final.sql 실행

# 3. Mock DB 제거
# src/config/database.ts에서 useMockDb = false
```

**파일 수정:**
- [ ] `src/config/database.ts`: Mock DB 비활성화
- [ ] 환경 변수에서 DB 연결 정보 로드
- [ ] 연결 테스트

#### 4.2 API 엔드포인트 업데이트
```bash
# 각 컴포넌트에서 API 엔드포인트 확인
grep -r "localhost:3000" src/

# 프로덕션 API로 변경
# 개발: http://localhost:3000
# 프로덕션: https://api.yourdomain.com
```

**체크리스트:**
- [ ] PostgreSQL 연결 성공
- [ ] 테이블 생성 확인
- [ ] API 엔드포인트 업데이트
- [ ] 통합 테스트 통과

---

### **5️⃣ 우선순위: 중간 - 보안 검토** ⏰ 1시간

```bash
# 1. 환경 변수 확인
# .env 파일이 .gitignore에 포함되어 있는지 확인
cat .gitignore | grep .env

# 2. 민감한 정보 확인
grep -r "password\|API_KEY\|secret" src/

# 3. 린팅 확인
npm run lint
```

**보안 체크리스트:**
- [ ] .env 파일 Git 제외
- [ ] 하드코딩된 비밀번호 없음
- [ ] API 키 환경 변수로 관리
- [ ] HTTPS 설정 (프로덕션)
- [ ] CORS 정책 설정

---

### **6️⃣ 우선순위: 낮음 - 파일럿 준비** ⏰ 향후

```
📅 일정:
2026-08-20: 스테이징 배포
2026-08-25: 최종 테스트
2026-09-01: 파일럿 시작 (5개 지점)
2026-09-15: 피드백 수집
2026-09-30: 프로덕션 배포
```

**준비할 것:**
- [ ] 사용자 매뉴얼 작성
- [ ] 운영 가이드 작성
- [ ] 지원팀 교육 자료
- [ ] 모니터링 대시보드 설정

---

## 📞 **문제 발생 시**

### 배포 문제
```bash
# 1. 로그 확인
docker-compose logs -f backend

# 2. 데이터베이스 연결 확인
docker exec store-hub-postgres psql -U postgres -d store_hub

# 3. 서비스 재시작
docker-compose restart
```

### 성능 문제
```bash
# Chrome DevTools → Network 탭에서 확인
# 목표: 번들 크기 111 KB, 로딩 < 2초
```

### 기능 문제
```bash
# 1. 브라우저 콘솔 확인 (F12)
# 2. 서버 로그 확인
# 3. E2E 테스트 실행하여 재현 확인
npm run test:e2e
```

---

## ✅ **완료 확인 체크리스트**

```
Phase 2 MVP 완료:
✅ 1. Backend API 완성
✅ 2. Frontend Dashboard 완성
✅ 3. E2E 테스트 (22/22 통과)
✅ 4. 성능 최적화 (111 KB gzip)

Phase 3 배포 준비:
□ 5. Docker 설정 완료
□ 6. 환경 변수 설정 완료
□ 7. 프로덕션 빌드 검증
□ 8. 브라우저 테스트 완료
□ 9. API 연동 완료
□ 10. 보안 검토 완료
```

---

## 📊 **다음 단계별 일정**

```
2026-08-20
├── Docker 빌드 완료
├── 환경 변수 설정
└── 스테이징 배포 시작

2026-08-25
├── 기능 테스트 완료
├── 성능 검증 완료
└── 보안 검토 완료

2026-09-01
├── 5개 지점 파일럿 시작
├── 실시간 모니터링
└── 피드백 수집

2026-09-30
└── 프로덕션 배포
```

---

**🎯 목표: 2026-08-25까지 배포 환경 완성!**

