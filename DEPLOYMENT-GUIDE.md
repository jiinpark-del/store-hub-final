# 🚀 Store Hub - 배포 가이드

**작성일**: 2026-08-18  
**버전**: 1.0  
**상태**: 배포 준비 완료

---

## 📋 **빠른 시작 (3단계)**

### 1️⃣ 환경 변수 설정
```bash
# .env.production 파일 수정
nano .env.production

# 다음 값들을 실제 환경에 맞게 변경:
# - DB_PASSWORD: 강력한 비밀번호로 변경
# - JWT_SECRET: 무작위 문자열로 변경
# - OCR_API_KEY: Google Vision API 키 입력
```

### 2️⃣ Docker 이미지 빌드
```bash
# 프론트엔드 이미지 빌드
docker build -t store-hub-admin:1.0 .

# 빌드 확인
docker images | grep store-hub
```

### 3️⃣ 컨테이너 실행
```bash
# 모든 서비스 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 상태 확인
docker-compose ps
```

---

## 🏗️ **상세 배포 가이드**

### **개발 환경 (로컬)**

```bash
# 1. 의존성 설치
npm install --legacy-peer-deps

# 2. 개발 서버 시작
npm run dev

# 3. 브라우저에서 확인
# http://localhost:5173
```

### **스테이징 환경 (Docker)**

#### Step 1: 환경 준비
```bash
# 프로젝트 디렉토리로 이동
cd /path/to/store-hub-docs

# 환경 변수 파일 복사
cp .env.production .env.staging

# 스테이징용 설정 수정
nano .env.staging
# NODE_ENV=staging
# DB_PASSWORD=staging_password
# API_URL=https://staging-api.yourdomain.com
```

#### Step 2: 이미지 빌드
```bash
# 프론트엔드 빌드
docker build -t store-hub-admin:staging .

# 빌드 결과 확인
docker history store-hub-admin:staging
```

#### Step 3: 컨테이너 시작
```bash
# 환경 파일 로드하여 시작
docker-compose --env-file .env.staging up -d

# 서비스 상태 확인
docker-compose ps
# 예상 출력:
# postgres    Up (healthy)
# redis       Up (healthy)
# backend     Up (healthy)
# frontend    Up (healthy)
```

#### Step 4: 확인
```bash
# 데이터베이스 연결 확인
docker exec store-hub-postgres psql -U postgres -d store_hub -c "SELECT 1"

# Redis 연결 확인
docker exec store-hub-redis redis-cli ping
# 출력: PONG

# 프론트엔드 접근
curl http://localhost:5173

# 백엔드 API 테스트
curl http://localhost:3000/health
```

### **프로덕션 환경**

#### Step 1: 보안 설정
```bash
# 강력한 비밀번호 생성
openssl rand -base64 32

# .env.production 수정
nano .env.production
# DB_PASSWORD=generated_password
# JWT_SECRET=generated_secret
# API_URL=https://api.yourdomain.com
# VITE_API_URL=https://api.yourdomain.com
```

#### Step 2: SSL/TLS 설정
```bash
# Nginx에서 SSL 설정
# 또는 AWS ALB에서 SSL 인증서 설정
```

#### Step 3: Docker Compose 프로덕션 설정
```yaml
# docker-compose.production.yml 사용
# 또는 환경별로 override 파일 생성
docker-compose -f docker-compose.yml \
               -f docker-compose.prod.yml \
               --env-file .env.production \
               up -d
```

#### Step 4: 모니터링 설정
```bash
# 로그 수집
docker-compose logs --follow --tail 100

# 헬스 체크 모니터링
docker-compose ps

# 디스크 사용량 확인
docker system df
```

---

## 🐳 **Docker 명령어 참조**

### 시작/중지
```bash
# 모든 서비스 시작
docker-compose up -d

# 모든 서비스 중지
docker-compose down

# 서비스 재시작
docker-compose restart backend
```

### 로그
```bash
# 실시간 로그 (모든 서비스)
docker-compose logs -f

# 특정 서비스 로그
docker-compose logs -f backend

# 마지막 100줄만
docker-compose logs --tail 100
```

### 상태 확인
```bash
# 서비스 상태
docker-compose ps

# 이미지 목록
docker images

# 컨테이너 상태 상세
docker stats
```

### 데이터 관리
```bash
# 데이터베이스 백업
docker exec store-hub-postgres pg_dump -U postgres store_hub > backup.sql

# 데이터베이스 복원
docker exec -i store-hub-postgres psql -U postgres store_hub < backup.sql

# Redis 데이터 확인
docker exec store-hub-redis redis-cli INFO
```

---

## 🔍 **문제 해결**

### 포트 충돌
```bash
# 포트 사용 확인
lsof -i :5173  # 프론트엔드
lsof -i :3000  # 백엔드
lsof -i :5432  # 데이터베이스

# 포트 변경 (docker-compose.yml 또는 .env에서)
FRONTEND_PORT=5174
BACKEND_PORT=3001
```

### 데이터베이스 연결 오류
```bash
# PostgreSQL 로그 확인
docker-compose logs postgres

# 데이터베이스 초기화
docker-compose down
docker volume rm store_hub_postgres_data
docker-compose up -d postgres
docker exec store-hub-postgres psql -U postgres -d store_hub < database-schema-final.sql
```

### 메모리 부족
```bash
# 컨테이너 메모리 확인
docker stats

# 정리
docker system prune -a  # 사용하지 않는 이미지 삭제
docker volume prune      # 사용하지 않는 볼륨 삭제
```

### 서비스 연결 실패
```bash
# 네트워크 확인
docker network ls

# 컨테이너 간 연결 테스트
docker exec store-hub-backend ping postgres
docker exec store-hub-backend ping redis
```

---

## 📊 **성능 최적화**

### Docker 이미지 크기 최소화
```bash
# 다단계 빌드 사용 (이미 Dockerfile에 포함됨)
# builder stage와 production stage 분리

# 빌드 결과 확인
docker image ls store-hub-admin
# 예상 크기: ~200-300MB
```

### 캐싱 전략
```bash
# 브라우저 캐싱 헤더
Cache-Control: public, max-age=31536000  # JS/CSS
Cache-Control: public, max-age=3600      # HTML

# Redis 캐싱 (이미 구성됨)
# - API 응답 캐시 (1시간)
# - 쿼리 결과 캐시 (30분)
```

### 네트워크 최적화
```bash
# Gzip 압축 (Nginx)
gzip on;
gzip_types text/plain text/css application/json application/javascript;

# 번들 크기: 111 KB (gzip)
# 로딩 시간: < 2초
```

---

## ✅ **배포 체크리스트**

### 사전 배포
- [ ] 환경 변수 설정 완료
- [ ] SSL 인증서 준비
- [ ] 데이터베이스 백업
- [ ] 모니터링 설정 완료

### 배포 중
- [ ] Docker 이미지 빌드 성공
- [ ] 컨테이너 시작 성공
- [ ] 모든 서비스 헬스체크 통과
- [ ] 네트워크 연결 확인

### 배포 후
- [ ] 프론트엔드 접근 가능
- [ ] API 응답 확인
- [ ] 데이터베이스 쿼리 작동
- [ ] Redis 캐시 작동
- [ ] 로그 모니터링 활성화

### 성능 검증
- [ ] 페이지 로딩 시간 < 2초
- [ ] API 응답 시간 < 500ms
- [ ] 에러 로그 없음
- [ ] 메모리 사용량 < 50%

---

## 📞 **지원**

### 로그 분석
```bash
# 에러 로그 검색
docker-compose logs | grep -i error

# 특정 서비스 에러
docker-compose logs backend | grep -i error
```

### 성능 모니터링
```bash
# 실시간 메트릭
docker stats

# 디스크 사용량
docker system df

# 네트워크 사용량
docker exec store-hub-backend netstat -an
```

---

**🎉 배포 준비 완료! 이제 시작하세요! 🚀**
