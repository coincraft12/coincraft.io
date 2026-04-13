# STATUS — coincraft.io

> 이 파일은 어떤 세션/AI/수동 작업 이후에도 반드시 업데이트한다.
> 다음 작업자가 이 파일 하나만 읽어도 현재 상태를 파악할 수 있어야 한다.

## 현재 상태
- **단계**: Phase 2 완료 — LMS (수강/진도/레슨 플레이어) 구현 완료, 스테이징 배포 완료
- **마지막 업데이트**: 2026-04-13
- **결정 근거**: CIO-003 (WordPress 완전 제거 — 자체 풀스택 플랫폼)

## 아키텍처 (CIO-003 확정)

```
Next.js 16 (web/)  ← staging.coincraft.io (port 3000)
       ↓ Nginx
  /api/* → Fastify API (api/, port 4001 staging / 4000 prod)
       ↓
  PostgreSQL (Docker: custody-postgres) + Redis
```

## 서버 정보
| 환경 | 서버 | Next.js | API |
|---|---|---|---|
| 스테이징 | 204.168.242.99 | port 3000 (PM2: coincraft-staging) | port 4001 (PM2: coincraft-api-staging) |
| 운영 | 46.62.212.134 | port 3000 (미설치) | port 4000 (미설치) |

- 스테이징 Nginx: `staging.coincraft.io` → port 3000, `/api/*` → port 4001
- 스테이징 DB: PostgreSQL `custody-postgres` Docker, DB: `coincraft_staging`, 유저: `coincraft`
- 배포: 로컬 빌드 → SCP → pm2 restart (GitHub Actions 시크릿 미설정으로 수동 배포 중)

## Phase 진행 현황
| Phase | 내용 | 상태 |
|---|---|---|
| **0** | 기반 인프라 | ✅ 완료 |
| **1** | Auth + 강좌 목록 API | ✅ 완료 (2026-04-13) |
| **2** | LMS (수강/진도) | ✅ 완료 (2026-04-13) |
| **3** | 결제 + 전자책 | ✅ 완료 (2026-04-13) |
| **4** | 자격증 시스템 | ⏳ |
| **5** | 모바일 앱 (Expo) | ⏳ |
| **6** | 강사 포털 | ⏳ |
| **7** | WordPress 마이그레이션 | ⏳ |
| **8** | x402 프로토콜 | ⏳ |

## Phase 0 완료 항목
**백엔드:**
- Fastify 앱 (app.ts, server.ts), env 검증, CORS/Swagger/헬스체크
- Drizzle ORM + 첫 마이그레이션 (21 테이블), Redis
- ecosystem.config.js (PM2), .env.example

**프론트엔드:**
- Next.js 16 App Router, Tailwind, Header/Footer/홈페이지
- api-client.ts, auth.store.ts (Zustand), query-client.ts (React Query)
- UI 컴포넌트: Button, Input, Card, Badge, Spinner
- AppProviders (QueryClientProvider + AuthInitializer)

**CI/CD:**
- `.github/workflows/ci.yml` (PR lint+typecheck)
- `.github/workflows/deploy-staging.yml` (master push → 스테이징 자동 배포)
  - ⚠️ GitHub Secrets 미설정 (STAGING_SSH_KEY, STAGING_HOST, STAGING_USER) — Sharon 설정 필요

## Phase 1 완료 항목 (2026-04-13)
**백엔드 API (모두 `/api/v1/auth/`, `/api/v1/courses/` 접두사):**
- 이메일 회원가입/로그인/로그아웃/토큰 갱신
- 이메일 인증, 비밀번호 재설정
- Google OAuth / Kakao OAuth 콜백
- JWT (Node.js crypto HS256, Access 1h / Refresh 30d, Rotation)
- Rate limit (로그인 5회/15분 블락)
- GET /courses (목록, 필터, 페이지네이션)
- GET /courses/:slug (상세, 커리큘럼, 수강여부)
- authenticate / optional-auth / require-role 미들웨어

**프론트엔드:**
- /login, /register — 실제 폼 (이메일 + 소셜 로그인)
- /auth/callback, /auth/verify-email, /auth/email-verified
- /auth/forgot-password, /auth/reset-password
- /courses — API 연동 목록 (revalidate 60s)
- CourseCard, CourseFilters 컴포넌트
- use-auth-init.ts (localStorage 토큰 복원)
- middleware.ts (/my, /exams 보호 라우트)

## Phase 2 완료 항목 (2026-04-13)
**백엔드 API (`/api/v1/` 접두사):**
- POST /courses/:id/enroll — 무료 수강 신청
- GET /courses/:slug/lessons/:lessonId — 레슨 상세 + 수강 권한 검증
- POST /lessons/:id/progress — 진도 업데이트 (GREATEST 보장)
- POST /lessons/:id/complete — 레슨 완료 + 강좌 진도 재계산
- GET /courses/:id/progress — 강좌 진도 조회
- GET /users/me/enrollments — 내 수강목록
- VideoProvider 추상화 (Vimeo/YouTube factory pattern)

**프론트엔드:**
- /courses/[slug] — 강좌 상세 (ISR 3600s, 커리큘럼 아코디언, OG 메타)
- /courses/[slug]/lessons/[lessonId] — 레슨 플레이어 (Vimeo/YouTube iframe, 텍스트 레슨)
- /my/courses — 내 수강목록 (React Query, 진도 퍼센트)
- EnrollButton — 무료/유료/이어보기 상태 분기
- CurriculumAccordion — 챕터별 아코디언, 잠금/미리보기/완료 표시
- LessonSidebar — 진도 퍼센트 바, 현재 레슨 하이라이트
- use-lesson-progress 훅 — 진도 추적 + 완료 처리

## 다음 작업 (Phase 4 — 자격증 시스템)
**백엔드:**
- 포트원 v2 (PortOne) 결제 연동
- POST /api/v1/payments/prepare — 결제 준비 (임시 주문 생성)
- POST /api/v1/payments/confirm — 결제 확인 (PortOne 서버 검증)
- POST /api/v1/payments/webhook — PortOne 웹훅 처리
- 전자책 다운로드 토큰 발급 (시간제한 서명 URL)
- ObjectStorage 추상화 (Hetzner S3)

**프론트엔드:**
- 결제 페이지 `/checkout/[courseId]`
- 결제 완료/실패 페이지
- 전자책 다운로드 버튼 (구매 완료 시)

## Sharon 처리 필요 항목
- [ ] GitHub Secrets 설정 (STAGING_SSH_KEY, STAGING_HOST, STAGING_USER)
- [ ] Google OAuth 앱 등록 + CLIENT_ID/SECRET 발급 → 스테이징 .env 업데이트
- [ ] Kakao 개발자 앱 등록 + REST_API_KEY 발급 → 스테이징 .env 업데이트
- [ ] `staging-api.coincraft.io` DNS A레코드 등록 (204.168.242.99)
- [ ] 포트원 v2 가맹점 등록 (Phase 3 시작 전)

## 로컬 개발
- API: `cd api && npm run dev` → localhost:4000
- Web: `cd web && npm run dev` → localhost:3000
- DB/Redis: `docker compose up -d` (프로젝트 루트)
- 마이그레이션: `cd api && npm run migrate`

## 작업 전 필독 (CIO)
- `Work/CIO/coincraft_platform_roadmap.md` — Phase별 개요
- `Work/CIO/coincraft_platform_todo.md` — 세부 To-Do 체크리스트
- `Work/CIO/coincraft_platform_architecture.md` — 설계 문서
