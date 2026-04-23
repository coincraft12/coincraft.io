# coincraft.io — 개발 시스템 가이드

> 세션 시작 시 반드시 읽을 것. 모든 개발 규칙·환경 차이·배포 절차가 여기 있다.

---

## 1. 아키텍처

```
web/ (Next.js 16 App Router, port 3000)
  ↓ Nginx (/api/* → API)
api/ (Fastify + Drizzle ORM, port 4001 staging / 4000 local)
  ↓
PostgreSQL + Redis (Docker)
```

---

## 2. 환경별 설정 차이 (핵심)

| 항목 | 로컬 | 스테이징 |
|---|---|---|
| 진입점 | `http://localhost` (nginx Docker :80) | `https://staging.coincraft.io` (nginx :443) |
| `NEXT_PUBLIC_API_URL` | 빈값 (`""`) | 빈값 (`""`) |
| API URL 처리 | 상대 URL → nginx → API:4000 | 상대 URL → nginx → API:4001 |
| `API_INTERNAL_URL` | `http://localhost:4000` (SSR 직접 접근) | `http://localhost:4001` |
| DB | Docker `coincraft_dev` (localhost:5432) | Docker `coincraft_staging` (custody-postgres) |
| Redis | Docker localhost:6379 | 서버 내 Redis |
| PM2 프로세스명 | 없음 (npm run dev) | `coincraft-staging` / `coincraft-api` |

### 규칙: API URL은 반드시 빈값 + 상대경로 사용
```ts
// ✅ 올바른 방법 — 로컬/스테이징 모두 동작
const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';
fetch(`${apiBase}/api/v1/...`)   // NEXT_PUBLIC_API_URL='' → '/api/v1/...' → nginx가 라우팅

// ❌ 절대 금지
fetch('http://localhost:4000/api/v1/...')  // 로컬만 동작
fetch('/api/v1/...')                       // 하드코딩 금지 (apiBase 통해서 쓸 것)
```

---

## 3. 로컬 개발 환경 시작 (PC 재시작 후)

> **접속 주소: `http://localhost`** (포트 번호 없음 — nginx가 80번으로 받아서 라우팅)

```bash
# 터미널 1 — Docker (nginx + DB + Redis) 시작
cd F:/Workplace/coincraft.io/api
docker compose up -d

# 터미널 2 — API 서버
cd F:/Workplace/coincraft.io/api
npm run dev          # → localhost:4000 (직접 접근용, 브라우저에선 쓰지 않음)

# 터미널 3 — 웹 서버
cd F:/Workplace/coincraft.io/web
npm run dev          # → localhost:3000 (직접 접근용, 브라우저에선 쓰지 않음)
```

브라우저에서 **`http://localhost`** 접속 → nginx가 Next.js(:3000)로 프록시
API 요청은 nginx가 자동으로 API(:4000)로 라우팅

### Docker 컨테이너 확인
```bash
cd F:/Workplace/coincraft.io/api
docker compose ps
# nginx, postgres, redis 모두 running 상태여야 함
```

### 마이그레이션 (신규 컬럼/테이블 있을 때)
```bash
cd F:/Workplace/coincraft.io/api
npm run migrate
```

---

## 4. 스테이징 배포

### 웹 배포 (Sharon 승인 후)
```bash
cd F:/Workplace/coincraft.io/web
bash deploy-staging.sh
```
**절대 규칙: `scp -r` 금지 → tar.gz 방식만 사용 (중첩 발생 위험)**

빌드 내부 동작:
```bash
NEXT_PUBLIC_API_URL=  npm run build   # 빈값으로 빌드 → 상대 URL → nginx 프록시
```

### API 배포
```bash
cd F:/Workplace/coincraft.io/api
npm run build
tar -czf /tmp/coincraft-api-build.tar.gz dist/ src/db/migrations/ package.json package-lock.json
scp /tmp/coincraft-api-build.tar.gz custody-staging:/opt/coincraft-api/api-build.tar.gz
ssh custody-staging "cd /opt/coincraft-api && tar -xzf api-build.tar.gz && rm api-build.tar.gz && npm install --omit=dev && node dist/db/migrate.js && pm2 restart coincraft-api"
```

---

## 5. DB 마이그레이션 관리

### 중요 원칙
- 마이그레이션 파일은 `ADD COLUMN IF NOT EXISTS` 방식 사용 (재실행 안전)
- 스키마(`src/db/schema/*.ts`) 변경 시 반드시 마이그레이션 파일도 함께 작성
- **스키마만 바꾸고 마이그레이션 파일 안 만들면 로컬은 되고 스테이징은 깨짐**

### 마이그레이션 충돌 시 (스테이징에 컬럼이 이미 있는 경우)
```sql
-- 1. 직접 컬럼 추가
ALTER TABLE xxx ADD COLUMN IF NOT EXISTS yyy type;

-- 2. Drizzle 저널에 적용 완료로 기록
INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ('...hash...', timestamp);
```

### 로컬에 없는 테이블 발생 시
```bash
# 마이그레이션 재실행
cd api && npm run migrate
# 그래도 없으면 직접 CREATE TABLE
```

---

## 6. 스테이징 서버 정보

| 항목 | 값 |
|---|---|
| IP | 204.168.242.99 |
| SSH | `ssh custody-staging` |
| 웹 경로 | `/opt/coincraft-staging/` |
| API 경로 | `/opt/coincraft-api/` |
| 웹 PM2 | `coincraft-staging` |
| API PM2 | `coincraft-api` |
| DB 컨테이너 | `custody-postgres` |
| DB 이름 | `coincraft_staging` |
| DB 유저 | `coincraft` |
| Nginx | `staging.coincraft.io` → :3000, `/api/*` → :4001 |

### 스테이징 DB 직접 접근
```bash
ssh custody-staging "docker exec custody-postgres psql -U coincraft -d coincraft_staging -c 'SQL;'"
```

---

## 7. 파일 업로드 구조

- 업로드 엔드포인트: `POST /api/v1/instructor/upload/image`
- 저장 위치: 서버 `/opt/coincraft-api/uploads/`
- 서빙 URL: `/api/v1/files/:filename`
- 로컬: `api/uploads/`
- next.config.ts `remotePatterns`에 허용 도메인 등록 필요 (images.unsplash.com 등)

---

## 8. GitHub Actions (CI/CD)

### GitHub CLI 경로 (PATH 미등록)
```bash
"C:\Program Files\GitHub CLI\gh.exe" run list --repo coincraft12/coincraft.io --limit 3
"C:\Program Files\GitHub CLI\gh.exe" run view <run_id> --repo coincraft12/coincraft.io --log-failed
```

### 브랜치 → 서버 매핑
- `main` push → Deploy to Staging (staging.coincraft.io)
- `production` push → Deploy to Production (coincraft.io)

---

## 9. 자주 발생하는 실수 및 해결법

| 증상 | 원인 | 해결 |
|---|---|---|
| `http://localhost` 접속 안 됨 | nginx 컨테이너 미실행 | `cd api && docker compose up -d` |
| API 요청 실패 (로컬) | API 서버 미실행 | `cd api && npm run dev` |
| 로컬 회원가입 "이미 등록된 이메일" | `.env.local`이 스테이징 API 가리킴 | `API_INTERNAL_URL=http://localhost:4000` 확인 |
| 강좌 API 500 에러 | 스키마에 컬럼 있는데 마이그레이션 누락 | 스테이징 DB에 `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` |
| next/image 도메인 에러 | `next.config.ts` remotePatterns 미등록 | 해당 도메인 추가 후 개발 서버 재시작 |
| 마이그레이션 "column already exists" | 스테이징에 수동으로 추가한 컬럼을 다시 migration이 추가 시도 | Drizzle 저널에 해당 migration hash 수동 삽입 |
| PUT/PATCH/DELETE CORS 에러 | `cors.ts`에 methods 미지정 → 기본값(GET/POST)만 허용 | `methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS']` 추가 |
| 이미지 업로드 후 깨짐 (스테이징) | nginx regex location이 `/api/v1/files/*.jpg`를 가로챔 | nginx `/api/` location에 `^~` 있는지 확인 |
| 버튼 클릭 후 엉뚱한 페이지로 이동 | Next.js App Router 클라이언트 캐시가 이전 컴포넌트 유지 | `router.push()` 대신 `window.location.href` (이동) 또는 `router.refresh()` (현재 페이지 유지) 사용 |
| 스테이징에서 `next/image` 400 오류 / `imageSizes` 등 config 변경이 반영 안 됨 | `output: standalone` 빌드는 config를 `server.js`에 하드코딩 → `.next/`만 배포하면 `server.js`는 옛날 config 그대로 | `deploy-staging.sh`가 `.next/standalone/server.js`도 같이 교체하도록 되어 있음. 수동 핫픽스 시: `ssh custody-staging "sed -i 's/\"imageSizes\":\[...\]/\"imageSizes\":[...새값...]/' /opt/coincraft-staging/server.js && pm2 restart coincraft-staging"` |
