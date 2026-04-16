# STATUS — coincraft.io

> 이 파일은 어떤 세션/AI/수동 작업 이후에도 반드시 업데이트한다.
> 다음 작업자가 이 파일 하나만 읽어도 현재 상태를 파악할 수 있어야 한다.

## 현재 상태
- **단계**: Phase 4 완료 + 검정 접수·알림 시스템 운영 중
- **마지막 업데이트**: 2026-04-16
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
| **4** | 자격증 시스템 | ✅ 완료 (2026-04-13) |
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

## Phase 3 완료 항목 (2026-04-13)
**백엔드 API:**
- POST /api/v1/payments/prepare — 결제 준비 (임시 주문 생성)
- POST /api/v1/payments/confirm — 결제 확인 (PortOne V2 서버 검증)
- POST /api/v1/payments/webhook — PortOne 웹훅 처리
- GET /api/v1/payments/history — 결제 내역
- GET /api/v1/ebooks — 전자책 목록 (구매 여부 포함)
- GET /api/v1/ebooks/:id — 전자책 메타
- GET /api/v1/ebooks/:id/file — EPUB 파일 API 프록시 (inline 뷰어 전용)

**프론트엔드:**
- /checkout/[courseId] — PortOne V2 결제 페이지
- /checkout/success, /checkout/fail — 결제 결과 페이지
- /ebooks — 전자책 목록
- /ebooks/[id] — react-reader EPUB 뷰어 (다운로드 불가, inline only)

**환경:**
- PORTONE_STORE_ID, PORTONE_CHANNEL_KEY, PORTONE_SECRET_KEY 스테이징 .env 반영 완료
- GOOGLE_CLIENT_ID/SECRET 스테이징 .env 반영 완료

## Phase 4 완료 항목 (2026-04-13)
**백엔드 API:**
- GET /api/v1/exams — 응시 가능 시험 목록
- GET /api/v1/exams/:id — 시험 상세 (문제 포함)
- POST /api/v1/exams/:id/attempts — 시험 시작 (attempt 생성)
- POST /api/v1/attempts/:id/submit — 시험 제출 + 자동 채점
- GET /api/v1/attempts/:id/result — 채점 결과
- GET /api/v1/certificates — 내 인증서 목록
- GET /api/v1/certificates/:number — 공개 인증서 조회
- POST /api/v1/admin/exams — 시험 생성 (admin)
- POST /api/v1/admin/exams/:id/questions — 문제 추가 (admin)
- 인증서 번호: `CC-{LEVEL}-{YYMMDD}-{SEQ:4}` Redis INCR 원자적 채번

**프론트엔드:**
- /exams — 시험 목록
- /exams/[id]/attempt — 보안 시험 응시 화면 (fullscreen, copy/paste 차단, visibilitychange 3회→자동제출, 카운트다운 타이머)
- /certificates/[number] — 공개 인증서 검증 페이지

**시드 데이터:**
- Basic 레벨 블록체인 기초 시험 5문항 (api/src/db/seed-exam.ts)

## 2026-04-17 작업 내역

**강사 포털 기능 추가 (스테이징 배포 완료):**
- 강좌 삭제/복제 버튼: `/instructor/courses/[id]` 헤더 + `/instructor` 대시보드 강좌별 현황 테이블
  - 삭제: cascade (lessonProgress → lessons → chapters → courseReviews → wishlists → enrollments → course), 활성 수강생 있으면 차단
  - 복제: title "[복사]" 접두사, slug "-copy" 접미사, isPublished: false
  - `/instructor/courses/[id]` 삭제 → `/instructor` 이동, 복제 → `/instructor/courses/[new-id]` 이동
  - `/instructor` 삭제/복제 → 그 자리 유지 (invalidateQueries로 즉시 목록 갱신)
- 강좌 삭제 후 목록 미반영 버그 수정: `router.refresh()` → `queryClient.invalidateQueries` 교체

**브랜딩 — 헤더/푸터 로고 교체 (스테이징 배포 완료):**
- 헤더 로고: `헤더_로고7.png` → `logo-header-v4.png`
- 푸터 로고: `푸터_로고3.png` → `logo-footer-v4.png`
- 푸터 사업자 정보 텍스트 가운데 정렬 적용

**배포 스크립트 개선 (`web/deploy-staging.sh`):**
- `.next/dev`, `.next/cache` 제외 (tar 파일 변경 오류 방지)
- `public/` 폴더 tar.gz 동기화 추가 (이미지 누락 방지)
- `.next/standalone/server.js` 배포 추가 (next.config.ts 변경사항 스테이징에 즉시 반영)
- `next.config.ts`에 `imageSizes: [32,48,64,96,128,160,220,256,384]` 추가

**버그 수정 기록 (CLAUDE.md 추가):**
- `output: standalone` 빌드에서 `next.config.ts` 변경이 스테이징에 미반영되는 원인: config가 `server.js`에 하드코딩됨 → 매 배포 시 `server.js`도 교체해야 함

**캐시 무효화 전수 감사 + 수정 (스테이징 배포 완료):**
- 강좌 삭제 후 `/courses` ISR 캐시 즉시 무효화 — `cache-revalidate` 엔드포인트 호출 추가 (instructor/page.tsx, instructor/courses/[id]/page.tsx)
- 레슨 완료 시 `['my-enrollments']` React Query 캐시 무효화 → `/my/courses` 진도율 즉시 반영
- 무료 수강 신청 후 `router.refresh()` → `setEnrolled(true)` 직접 전환 (버튼 즉시 "이어서 학습")
- 레슨 수정 저장 후 `['instructor-course', courseId]` 무효화 → 강좌 상세 목록 즉시 반영

**강좌 카테고리 전면 제거 (배포 대기):**
- Header: "전체 강좌" 서브메뉴(Web3, 온체인 데이터 분석) 제거 → 단일 링크
- `/courses/[slug]`: 강좌 상세 카테고리 라벨 제거
- 강좌 생성/수정 폼: 카테고리 입력 필드 제거

## 2026-04-16 작업 내역

**기능 추가 — 로컬 구현 완료 (배포 대기):**
- 정가/판매가/할인율 분리 표시: `CourseCard` + `original_price` 컬럼 마이그레이션
- 강사 페이지: `/instructors` (카드 그리드) + `/instructors/apply` (신청 폼)
- 헤더 "강사" 메뉴 추가 (강사진 소개 + 강사 등록 신청)
- 관리자 메일 알림: `lib/admin-notify.ts` (SMTP) — 결제/시험접수/강사신청 트리거
- **관리자 무료 입과**: `POST /api/v1/admin/enroll` + `/admin/enroll` 페이지 (이메일 → 강좌 무료 등록)
- PDF 자동 발송 스케줄러: `jobs/pdf-delivery.ts` (node-cron, 매일 09:00 KST)
- 마이그레이션: `0004_original_price_instructors_exams.sql` (미실행)
- `.env.example`: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ADMIN_EMAIL 추가
- ⚠️ 배포 전: `cd api && npm install` (node-cron) + `npm run migrate` + .env SMTP 변수 설정 필요

**검정 접수 시스템 고도화 (스테이징 배포 완료):**
- 레슨 영상 페이지 X 닫기 버튼 추가
- 에러 핸들러 버그 수정: `err.status` → `err.statusCode` 매핑 누락으로 모든 커스텀 에러가 500으로 반환되던 문제 수정
- API: `GET /api/v1/users/me/exam-registrations` 신규 endpoint 추가
- 헤더 '검정' 메뉴에 '나의 검정' 동적 서브메뉴 추가 (접수자에게만 표시, 해당 시험 페이지 링크)
- 로컬 개발 환경 정비: `.env.local`에 `API_INTERNAL_URL`, `NEXT_PUBLIC_API_URL` 추가
- `deploy-staging.sh` 신규 생성 (tar.gz 방식, scp 개별 업로드 금지)
- `web/CLAUDE.md` 생성 — 배포 규칙 고정
- 배포 규칙: `NEXT_PUBLIC_API_URL= npm run build`로 스테이징 빌드 시 nginx 프록시 사용

**배포 규칙 (필수):**
- 웹 배포: Sharon 명시 요청 시에만 `bash web/deploy-staging.sh` 실행
- API 배포: Sharon 명시 요청 시에만 개별 파일 scp

**스테이징 DB 직접 삽입 항목 (운영 반영 불필요):**
- 김응준 / coincraft.press@gmail.com 시험 접수 (WEB3-B-260416-0001)

## 2026-04-14 작업 내역
**전자책 뷰어 (`/ebooks/[id]`) UI 개선:**
- 페이지 넘김 Canvas 애니메이션 구현 (forward/backward, 흰 종이 접힘 효과)
- 넘김 효과 토글 버튼 추가 (localStorage 영구 저장)
- 첫/마지막 페이지 토스트 알림
- epub.js 흰 flash 차단: 렌디션 패치로 navigation 전에 애니메이션 즉시 시작
- canvas clipBounds clamping으로 경계 이탈 방지
- RAF deps 최소화로 리렌더 시 애니메이션 중단 방지
- ⚠️ 미완: 일부 환경/페이지에서 애니메이션 누락 발생 가능 (추후 개선 여지)

**To-Do (다음 세션):**
- 솔라피 알림톡 새 템플릿 승인 후 `notifications.ts`의 `TEMPLATES.EXAM` 업데이트 (수험번호 + 시험규정 변수 포함)
- 검정료 DB 복원: 현재 100원 → 30,000원 (테스트용으로 낮춘 것)
- `api-client` 401 자동 refresh + 재시도 로직 추가 (현재 액세스 토큰 15분 만료 시 강제 로그아웃됨)
- 전자책 뷰어 페이지 넘김 효과 가끔 두 번 넘어가는 현상 추가 개선
- `/my` 내 계정 페이지: 구매한 전자책 리스트 추가 (현재 강좌만 표시됨)
- 전자책 미리보기 제한: 비구매 시 20페이지까지만 열람, 이후 결제 유도

## 홈페이지 개선 요청 (Sharon)
1. ✅ 정가/판매가 분리 표시 — 구현 완료 (배포 대기)
2. ✅ 1회 신청자 대상 PDF 자동 발송 — 구현 완료 (배포 대기)
3. ✅ 강사 페이지 — 구현 완료 (배포 대기)
4. ✅ 강사 등록 버튼 추가 — 구현 완료 (배포 대기)
5. ✅ 관리자 메일 알림 — 구현 완료 (배포 대기, SMTP .env 설정 필요)
6. ✅ 관리자 무료 입과 — 구현 완료 (배포 대기)

## 다음 작업 (Phase 5 — 모바일 앱 또는 강사 포털)
Phase 5~8 중 우선순위 결정 필요:
- Phase 5: 모바일 앱 (Expo)
- Phase 6: 강사 포털
- Phase 7: WordPress 마이그레이션
- Phase 8: x402 프로토콜

## Sharon 처리 필요 항목
- [x] GitHub Secrets 설정 (STAGING_SSH_KEY, STAGING_HOST, STAGING_USER) — 자동 배포 완료
- [x] Google OAuth CLIENT_ID/SECRET 발급 → 스테이징 .env 반영 완료
- [ ] Kakao 개발자 앱 등록 + REST_API_KEY 발급 → 스테이징 .env 업데이트
  - ⚠️ 카카오계정(이메일) 권한은 비즈니스 앱 심사 후 활성화 가능 → 닉네임만 사용하는 방식으로 구현됨
- [ ] `staging-api.coincraft.io` DNS A레코드 등록 (204.168.242.99)
- [x] 포트원 v2 가맹점 등록 + 키 발급 → 스테이징 .env 반영 완료

## 로컬 개발
- API: `cd api && npm run dev` → localhost:4000
- Web: `cd web && npm run dev` → localhost:3000
- DB/Redis: `docker compose up -d` (프로젝트 루트)
- 마이그레이션: `cd api && npm run migrate`

## 작업 전 필독 (CIO)
- `Work/CIO/coincraft_platform_roadmap.md` — Phase별 개요
- `Work/CIO/coincraft_platform_todo.md` — 세부 To-Do 체크리스트
- `Work/CIO/coincraft_platform_architecture.md` — 설계 문서
