# coincraft.io

CoinCraft Web3 교육 플랫폼 — LMS + 자격증 + 전자책 + 강사 포털 풀스택 모노레포

---

## 프로젝트 개요

WordPress + LearnPress 구조를 완전히 걷어내고 자체 설계한 풀스택 플랫폼.  
단일 API 위에 웹(Next.js) + 앱(Expo, 예정)이 올라가는 구조.

**핵심 서비스**

| 서비스 | 상태 |
|---|---|
| LMS (강좌·챕터·레슨·진도 추적) | ✅ 운영 중 |
| 자격증 시스템 (시험·채점·인증서 발급) | ✅ 운영 중 |
| 결제 (PortOne V2) | ✅ 운영 중 |
| 전자책 판매 (EPUB 뷰어) | ✅ 운영 중 |
| 강사 포털 | ✅ 운영 중 |
| 알림 (Solapi 알림톡 + SMTP 관리자 메일) | ✅ 운영 중 |
| 모바일 앱 (Expo) | ⏳ 미시작 |
| x402 온체인 결제 | ⏳ 미시작 |

---

## 시스템 구조

```
[브라우저 / 모바일 앱]
         │ HTTPS
         ▼
    Nginx (:443)
    ├── /api/*  →  Fastify API (:4000 운영 / :4001 스테이징)
    └── /*      →  Next.js    (:3000)
         │
    PostgreSQL + Redis
         │
    외부 서비스: PortOne(결제) · Vimeo(영상) · Solapi(알림톡) · SendGrid(이메일)
```

**레포 구조**

```
coincraft.io/
├── web/      # Next.js 16 App Router (프론트엔드)
├── api/      # Fastify + Drizzle ORM (백엔드 API)
│   └── docker-compose.yml  # nginx + postgres + redis
└── LOCAL_DEV.md
```

**주요 기술 스택**

| 영역 | 스택 |
|---|---|
| 프론트엔드 | Next.js 16, Tailwind CSS, Zustand, React Query |
| 백엔드 | Fastify, Drizzle ORM, Zod, TypeScript |
| DB | PostgreSQL 16, Redis 7 |
| 인증 | JWT (Access 1h / Refresh 30d, Rotation) + Google·Kakao OAuth + SIWE |
| 결제 | PortOne V2 |
| 배포 | GitHub Actions → PM2 (cluster mode) |

---

## 로드맵

| Phase | 내용 | 상태 |
|---|---|---|
| 0 | 기반 인프라 (DB·Auth·CI/CD) | ✅ 완료 |
| 1 | Auth + 강좌 목록 API | ✅ 완료 |
| 2 | LMS (수강·진도·레슨 플레이어) | ✅ 완료 |
| 3 | 결제 + 전자책 | ✅ 완료 |
| 4 | 자격증 시스템 (시험·인증서) | ✅ 완료 |
| 6 | 강사 포털 | ✅ 핵심 완료 |
| 5 | 모바일 앱 (Expo) | ⏳ 미시작 |
| 7 | WordPress 데이터 마이그레이션 | ⏳ 미시작 |
| 8 | x402 온체인 결제 프로토콜 | ⏳ 미시작 |

> 상세 To-Do → `CoinCraft-Operating-System/Work/CIO/coincraft_platform_todo.md`

---

## 로컬 실행

**접속 주소: `http://localhost`** (포트 없음)

### 터미널 3개 순서대로

```bash
# 터미널 1 — Docker (nginx + PostgreSQL + Redis)
cd F:/Workplace/coincraft.io/api
docker compose up -d
docker compose ps   # nginx·postgres·redis 모두 Running 확인
```

```bash
# 터미널 2 — API 서버 (localhost:4000)
cd F:/Workplace/coincraft.io/api
npm run dev
```

```bash
# 터미널 3 — 웹 서버 (localhost:3000)
cd F:/Workplace/coincraft.io/web
npm run dev
```

### DB 마이그레이션 (스키마 변경 시)

```bash
cd F:/Workplace/coincraft.io/api
npm run migrate
```

### 자주 있는 증상

| 증상 | 원인 | 해결 |
|---|---|---|
| `http://localhost` 안 열림 | Docker 미실행 | 터미널 1 실행 |
| API 요청 실패 | API 서버 미실행 | 터미널 2 실행 |
| DB 에러 | 마이그레이션 누락 | `npm run migrate` |

---

## 배포

### 브랜치 → 서버 매핑

| 브랜치 | 서버 | 주소 |
|---|---|---|
| `main` | 스테이징 (204.168.242.99) | staging.coincraft.io |
| `production` | 운영 (46.62.212.134) | coincraft.io |

GitHub Actions가 push 감지 → 자동 빌드·배포.

### 웹 배포

```bash
# 스테이징
git push origin main

# 운영
git push origin main:production
```

### API 배포

```bash
cd F:/Workplace/coincraft.io/api
npm run build
tar -czf /tmp/coincraft-api-build.tar.gz dist/ src/db/migrations/ package.json package-lock.json

# 스테이징
scp /tmp/coincraft-api-build.tar.gz custody-staging:/opt/coincraft-api/api-build.tar.gz
ssh custody-staging "cd /opt/coincraft-api && tar -xzf api-build.tar.gz && rm api-build.tar.gz && npm install --omit=dev && node dist/db/migrate.js && pm2 restart coincraft-api"

# 운영
scp /tmp/coincraft-api-build.tar.gz coincraft:/opt/coincraft-api/api-build.tar.gz
ssh coincraft "cd /opt/coincraft-api && tar -xzf api-build.tar.gz && rm api-build.tar.gz && npm install --omit=dev && node dist/db/migrate.js && pm2 restart coincraft-api"
```

### 배포 규칙

- **기본**: 로컬 수정 → `main` push (스테이징 자동)
- **결제·알림·이메일 등 민감 변경**: 스테이징 확인 후 Sharon 승인
- **운영 배포**: Sharon 명시("긴급 배포" 또는 명확한 지시) 시에만

### 서버 접속

```bash
ssh custody-staging   # 스테이징 (204.168.242.99)
ssh coincraft         # 운영 (46.62.212.134)
```

### PM2 프로세스

| 환경 | 웹 | API |
|---|---|---|
| 스테이징 | `coincraft-staging` | `coincraft-api` |
| 운영 | `coincraft-web` | `coincraft-api` |

---

## 환경변수

- 로컬: `api/.env`, `web/.env.local`
- 예시: `api/.env.example`
- `NEXT_PUBLIC_API_URL`은 항상 빈값(`""`) — 상대 URL로 nginx가 라우팅

---

## GitHub Actions 상태 확인

```bash
"C:\Program Files\GitHub CLI\gh.exe" run list --repo coincraft12/coincraft.io --limit 5
```
