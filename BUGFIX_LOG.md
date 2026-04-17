# BUGFIX LOG — 2026-04-17

코드베이스 전체 점검 결과. 발견된 모든 버그·보안 취약점·성능 문제 목록과 수정 내역.

---

## 수정 완료 (FIXED)

### [BUG-01] `getMyEnrollments` — Drizzle WHERE 조건 논리 오류
- **파일**: `api/src/modules/lms/lms.service.ts` (289번째 줄)
- **문제**: `eq(enrollments.userId, userId) && eq(enrollments.status, 'active')` — `&&` 연산자를 사용했기 때문에 두 번째 조건(`eq(...)`)이 항상 truthy 객체로 평가되어 사실상 **첫 번째 조건만 적용**됨. `active` 상태 필터링이 무시되어 취소된 수강 이력도 반환될 수 있음.
- **심각도**: 높음 (데이터 노출)
- **수정**: `and(eq(...), eq(...))` Drizzle 함수로 교체.

### [BUG-02] `authenticate` 미들웨어 — 토큰 검증 실패 후 `return` 누락
- **파일**: `api/src/middleware/authenticate.ts`
- **문제**: 잘못된 토큰일 때 `reply.send(401)`을 보낸 후 `return`이 없어 핸들러가 계속 실행됨. Fastify는 reply 전송 후에도 핸들러 코드가 계속 실행되므로 미인증 상태에서 다음 로직이 실행될 수 있음.
- **심각도**: 높음 (인증 우회 가능)
- **수정**: `return` 추가.

### [BUG-03] `requireRole` 미들웨어 — 권한 거부 후 `return` 누락
- **파일**: `api/src/middleware/require-role.ts`
- **문제**: 권한 없음(403) 응답 전송 후 `return`이 없어 핸들러가 계속 실행됨.
- **심각도**: 높음 (권한 우회 가능)
- **수정**: `return` 추가.

### [BUG-04] `loginRateLimit` 미들웨어 — 차단 후 `return` 누락
- **파일**: `api/src/middleware/rate-limit.ts`
- **문제**: 429 응답 전송 후 `return`이 없어 차단된 요청이 계속 처리됨.
- **심각도**: 중간 (rate limit 우회)
- **수정**: `return` 추가.

### [SECURITY-01] JWT 서명 검증 — 타이밍 공격 취약점
- **파일**: `api/src/lib/jwt.ts`
- **문제**: `sig !== expected` 문자열 비교는 타이밍 공격(timing attack)에 취약. 공격자가 응답 시간 차이로 서명 값을 추측할 수 있음.
- **심각도**: 높음 (보안)
- **수정**: `crypto.timingSafeEqual()`로 교체.

### [SECURITY-02] 관리자 액션 토큰 — 타이밍 공격 취약점
- **파일**: `api/src/modules/admin/admin.routes.ts`
- **문제**: `sig !== expected` 문자열 비교 — 위와 동일.
- **심각도**: 높음 (보안)
- **수정**: `crypto.timingSafeEqual()`로 교체.

### [SECURITY-03] `admin.routes.ts` — 환경변수 직접 참조 (검증 우회)
- **파일**: `api/src/modules/admin/admin.routes.ts`
- **문제**: `process.env.JWT_ACCESS_SECRET`와 `process.env.FRONTEND_URL`을 직접 참조 → env 검증 로직을 우회하여 비어있는 값으로 실행될 수 있음.
- **심각도**: 중간
- **수정**: `env` 모듈에서 import하도록 변경.

### [SECURITY-04] `upload.routes.ts` — VIMEO_TOKEN 환경변수 직접 참조
- **파일**: `api/src/modules/upload/upload.routes.ts`
- **문제**: `process.env.VIMEO_ACCESS_TOKEN` 직접 참조 → env 검증 우회.
- **심각도**: 낮음
- **수정**: `env` 모듈에서 import.

### [SECURITY-05] `cors.ts` — 환경변수 직접 참조
- **파일**: `api/src/plugins/cors.ts`
- **문제**: `process.env.ALLOWED_ORIGINS` 직접 참조 → env 검증 우회.
- **심각도**: 낮음
- **수정**: `env` 모듈에서 import.

### [SECURITY-06] Vimeo 상태 조회 — SSRF 취약점
- **파일**: `api/src/modules/upload/upload.routes.ts` (`/vimeo-status` 엔드포인트)
- **문제**: `videoUri` 파라미터를 검증 없이 Vimeo API URL에 그대로 삽입. 공격자가 임의의 경로를 넣어 내부 Vimeo API 리소스에 접근 가능.
- **심각도**: 중간 (SSRF)
- **수정**: `/videos/<numeric_id>` 형식만 허용하는 정규식 검증 추가.

### [SECURITY-07] Web3 verify 엔드포인트 — 입력 크기 제한 없음
- **파일**: `api/src/modules/auth/auth.routes.ts`
- **문제**: `message`와 `signature` 필드에 크기 제한이 없어 대용량 페이로드를 통한 DoS 가능.
- **심각도**: 중간
- **수정**: `message` 최대 1000자, `signature` 최대 200자 제한 추가.

### [SECURITY-08] 캐시 재검증 라우트 — 인증 없음
- **파일**: `web/src/app/cache-revalidate/route.ts`
- **문제**: `POST /cache-revalidate`에 인증이 없어 누구나 캐시를 무효화할 수 있음. 또한 paths 배열 유형 검증도 없음.
- **심각도**: 낮음
- **수정**: 프로덕션 환경에서 내부 요청만 허용하는 검증 추가. paths 배열 유효성 검사 추가.

### [SECURITY-09] LMS 레슨 상세 — 프리뷰 레슨에 인증 강제
- **파일**: `api/src/modules/lms/lms.routes.ts`
- **문제**: `GET /api/v1/courses/:slug/lessons/:lessonId`에 `authenticate`를 강제하지만, `getLessonDetail` 서비스는 `isPreview` 레슨에 대해 인증 없이도 접근 허용. 결과적으로 비로그인 사용자는 프리뷰 레슨도 볼 수 없음 (기능 버그).
- **심각도**: 중간 (기능 오동작)
- **수정**: `optionalAuth` 미들웨어로 변경.

### [BUG-05] 결제 확인 — 트랜잭션 미적용 (데이터 정합성)
- **파일**: `api/src/modules/payment/payment.service.ts`
- **문제**: `confirmPayment`, `confirmEbookPayment`, `confirmExamPayment`, `confirmSubscriptionPayment`, `refundPayment` 모두 payment 상태 업데이트 + 접근권한 생성/삭제를 별도 DB 호출로 처리. 중간에 서버가 크래시하면 결제는 완료되었는데 수강 등록이 안 되거나, 환불은 됐는데 수강 권한이 남아있는 상태가 발생함.
- **심각도**: 높음 (데이터 정합성)
- **수정**: 모든 confirm/refund 함수에 `db.transaction()` 적용.

### [BUG-06] `instructor.routes.ts` — `updateChapter` Zod `.parse()` 사용
- **파일**: `api/src/modules/instructor/instructor.routes.ts`
- **문제**: 다른 라우트들은 `.safeParse()` → 400 반환하지만 `updateChapter`만 `.parse()` 사용 → 검증 실패 시 Zod 에러가 uncaught exception으로 throw되어 500 응답.
- **심각도**: 중간 (에러 처리)
- **수정**: `.safeParse()`로 통일.

### [BUG-07] 전자책 진행도 저장 — `cfi` 필드 검증 없음
- **파일**: `api/src/modules/ebook/ebook.routes.ts`
- **문제**: `PATCH /api/v1/ebooks/:id/progress`의 `cfi` 필드를 타입 검증 없이 바로 DB에 저장.
- **심각도**: 낮음
- **수정**: `typeof body.cfi === 'string'` 검증 추가.

### [BUG-08] 일괄 업로드 — 강좌 소유권 검증 누락
- **파일**: `api/src/modules/upload/upload.routes.ts` (`/bulk-generate` 엔드포인트)
- **문제**: 임의의 강사가 자신 소유가 아닌 강좌 ID로 챕터/레슨을 생성할 수 있음.
- **심각도**: 높음 (권한 오류)
- **수정**: 요청한 `userId`가 해당 `courseId`의 소유자인지 확인하는 쿼리 추가.

### [XSS-01] 레슨 텍스트 콘텐츠 — `dangerouslySetInnerHTML` 사용
- **파일**: `web/src/app/courses/[slug]/lessons/[lessonId]/page.tsx`
- **문제**: `lesson.textContent`를 `dangerouslySetInnerHTML`로 직접 렌더링 — XSS 취약점. 악의적인 관리자/강사가 스크립트를 삽입할 수 있음.
- **심각도**: 높음 (XSS)
- **수정**: `MarkdownContent` 컴포넌트로 교체 (ReactMarkdown이 안전하게 렌더링).

### [BUG-09] `useEffect` 의존성 배열 누락
- **파일**: `web/src/app/courses/[slug]/lessons/[lessonId]/page.tsx`, `web/src/app/checkout/[courseId]/page.tsx`
- **문제**: `fetchData` 콜백에서 `pathname` 사용하지만 의존성 배열에 미포함. `pathname` 변경 시 stale closure 참조 문제.
- **심각도**: 낮음
- **수정**: 의존성 배열에 `pathname` 추가.

---

## 수정 불가 / 권고 사항 (NOTED — 수정 필요하나 현재 세션에서 진행 불가)

### [PERF-01] N+1 쿼리 — `getCourseBySlug`
- **파일**: `api/src/modules/courses/courses.service.ts`
- **내용**: 챕터 목록 조회 후 레슨 목록을 별도 조회 → in-memory join으로 처리. 현재 구조에서는 큰 문제 없지만 강좌 규모 증가 시 챕터별 N+1이 될 수 있음.
- **권고**: 향후 `chapterId IN (...)` 방식 유지하되 인덱스 확인 필요.

### [PERF-02] N+1 쿼리 — `cert.service.ts` `getExam`
- **파일**: `api/src/modules/certificates/cert.service.ts`
- **내용**: `getExam`에서 prerequisite course를 별도 쿼리로 조회. LEFT JOIN으로 통합 가능.
- **권고**: 향후 단일 JOIN 쿼리로 통합 권장.

### [SECURITY-10] 결제 confirm — orderId 검색 방식
- **파일**: `api/src/modules/payment/payment.service.ts`
- **내용**: `allPending` 배열 전체를 fetch 후 JS에서 `find()`로 orderId 매칭. 동시 요청이 많을 경우 메모리 낭비. 또한 `metadata->>'orderId'` 인덱스가 없으면 전체 scan.
- **권고**: PostgreSQL jsonb 연산자로 DB 레벨에서 필터링 권장. `where(sql\`metadata->>'orderId' = ${orderId}\`)` 형태.

### [NOTE-01] 시험 날짜 하드코딩
- **파일**: `api/src/modules/payment/payment.service.ts` (489번째 줄)
- **내용**: `const examDateTime = '2026년 5월 2일 (토) 오후 2시';` — 하드코딩된 시험 날짜. DB의 `certExams` 테이블에서 가져와야 함.
- **권고**: DB에 `exam_datetime` 컬럼 추가 또는 기존 컬럼 활용.

### [NOTE-02] 액세스 토큰 localStorage 저장
- **파일**: `web/src/hooks/use-auth-init.ts`, `web/src/lib/api-client.ts`
- **내용**: 액세스 토큰을 `localStorage`에 저장 → XSS 발생 시 토큰 탈취 가능. HttpOnly 쿠키 방식이 더 안전하지만, 아키텍처 변경이 필요.
- **권고**: 현재 아키텍처 유지하되 CSP 헤더 적용으로 XSS 위험 감소 권장.

### [NOTE-03] `isNull` import 미사용
- **파일**: `api/src/modules/upload/upload.routes.ts`
- **내용**: `import { eq, and, isNull, desc }` — `isNull`이 사용되지 않음.
- **권고**: 다음 정리 시 제거.

---

## 수정 파일 목록

| 파일 | 수정 항목 |
|------|-----------|
| `api/src/middleware/authenticate.ts` | BUG-02: return 누락 |
| `api/src/middleware/require-role.ts` | BUG-03: return 누락 |
| `api/src/middleware/rate-limit.ts` | BUG-04: return 누락 |
| `api/src/lib/jwt.ts` | SECURITY-01: timingSafeEqual |
| `api/src/plugins/cors.ts` | SECURITY-05: env 모듈 사용 |
| `api/src/modules/admin/admin.routes.ts` | SECURITY-02, SECURITY-03: timingSafeEqual + env |
| `api/src/modules/upload/upload.routes.ts` | SECURITY-04, SECURITY-06, BUG-08: env + SSRF + 소유권 |
| `api/src/modules/auth/auth.routes.ts` | SECURITY-07: 입력 크기 제한 |
| `api/src/modules/lms/lms.service.ts` | BUG-01: and() 수정 |
| `api/src/modules/lms/lms.routes.ts` | SECURITY-09: optionalAuth |
| `api/src/modules/payment/payment.service.ts` | BUG-05: 트랜잭션 적용 (4개 함수) |
| `api/src/modules/instructor/instructor.routes.ts` | BUG-06: safeParse |
| `api/src/modules/ebook/ebook.routes.ts` | BUG-07: cfi 검증 |
| `web/src/app/courses/[slug]/lessons/[lessonId]/page.tsx` | XSS-01 + BUG-09 |
| `web/src/app/checkout/[courseId]/page.tsx` | BUG-09: pathname 의존성 |
| `web/src/app/cache-revalidate/route.ts` | SECURITY-08: 인증 추가 |

---

## 2차 점검 — 수정 완료 (2026-04-17)

### [SECURITY-11] `cert.routes.ts` — 로컬 `requireRole` 함수 `return` 누락
- **파일**: `api/src/modules/certificates/cert.routes.ts`
- **문제**: 파일 내 독립 정의된 `requireRole` 함수에서 403 응답 전송 후 `return` 없음 → 미들웨어가 계속 실행될 수 있음. 또한 동일 파일의 로컬 `optionalAuth`가 미들웨어 `authenticate`를 직접 호출해 무효 토큰 시 401을 응답하고도 핸들러가 실행 계속.
- **심각도**: 높음 (권한 우회)
- **수정**: `return` 추가. 로컬 `optionalAuth` 제거 후 표준 `optional-auth` 미들웨어로 교체.

### [SECURITY-12] 오픈 리다이렉트 — 로그인/OAuth 콜백
- **파일**: `web/src/app/login/page.tsx`, `web/src/app/auth/callback/page.tsx`
- **문제**: `login` 페이지의 `redirectTo`는 `?redirect=` 쿼리 파라미터를 검증 없이 `router.replace()`에 사용. `//evil.com` 같은 값을 주면 외부 사이트로 리다이렉트 가능. OAuth 콜백도 `sessionStorage`의 `auth_redirect` 값을 검증 없이 사용.
- **심각도**: 중간 (오픈 리다이렉트 → 피싱)
- **수정**: 두 곳 모두 `/`로 시작하고 `//`로 시작하지 않는 상대 경로만 허용하는 검증 추가.

### [SECURITY-13] `forgot-password` 엔드포인트 — rate limit 없음
- **파일**: `api/src/modules/auth/auth.routes.ts`
- **문제**: `POST /api/v1/auth/forgot-password`에 rate limit이 없어 단일 IP에서 무제한 이메일 발송 요청 가능 (이메일 폭격, 사용자 열거 보조).
- **심각도**: 중간 (DoS / 이메일 폭격)
- **수정**: IP당 시간당 5회 제한 추가 (Redis 기반).

### [SECURITY-14] 업로드 라우트 — `requireRole` 없음 (학생도 접근 가능)
- **파일**: `api/src/modules/upload/upload.routes.ts`
- **문제**: `/api/v1/instructor/upload/*` 하위 모든 엔드포인트가 `authenticate`만 체크하고 `requireRole('instructor', 'admin')`이 없어 일반 학생 계정도 이미지 업로드, Vimeo 슬롯 생성, 일괄 업로드 가능.
- **심각도**: 높음 (권한 오류)
- **수정**: 모든 업로드 엔드포인트에 `requireRole('instructor', 'admin')` 추가.

### [SECURITY-15] `vimeo-init` — 강좌 소유권 미확인
- **파일**: `api/src/modules/upload/upload.routes.ts`
- **문제**: `POST /vimeo-init`에서 `courseId`를 넘기면 해당 강좌가 요청 강사 소유인지 확인하지 않아 다른 강사의 강좌로 영상 업로드 슬롯 생성 가능 (1차 BUG-08은 `bulk-generate`만 수정, `vimeo-init`과 `bulk-vimeo-init` 미수정).
- **심각도**: 높음 (권한 오류)
- **수정**: `vimeo-init`과 `bulk-vimeo-init` 모두 강좌 소유 확인 쿼리 추가.

### [BUG-10] `completeLesson` / `updateLessonProgress` — 수강 권한 미확인
- **파일**: `api/src/modules/lms/lms.service.ts`
- **문제**: 레슨 완료 표시(`POST /api/v1/lessons/:id/complete`)와 진도 저장(`POST /api/v1/lessons/:id/progress`) 시 해당 강좌의 수강 등록 여부를 확인하지 않아, 미수강 인증 사용자가 임의 레슨의 진도를 조작 가능.
- **심각도**: 중간 (데이터 무결성)
- **수정**: 두 함수 모두 `checkEnrollmentAccess()` 검사 추가.

### [BUG-11] `review.routes.ts` — comment 필드 길이 제한 없음
- **파일**: `api/src/modules/reviews/review.routes.ts`
- **문제**: POST 리뷰의 `comment` 필드에 길이 제한이 없어 수만 자 텍스트 저장 가능.
- **심각도**: 낮음
- **수정**: 1000자 제한 추가.

### [BUG-12] `bulk-uploads PATCH` — status 허용값 미검증
- **파일**: `api/src/modules/upload/upload.routes.ts`
- **문제**: `PATCH /bulk-uploads/:id`의 `status` 필드에 허용값 검증이 없어 임의 문자열이 DB에 저장 가능.
- **심각도**: 낮음
- **수정**: `['uploading', 'done', 'error']` 허용값 검증 추가.

### [BUG-13] `vimeo-init` / `bulk-vimeo-init` — size 필드 음수/0/과대값 허용
- **파일**: `api/src/modules/upload/upload.routes.ts`
- **문제**: Fastify JSON schema가 `size: number`만 체크하고 양수 범위 검증이 없어 `size: -1` 또는 `size: 0` 같은 값이 Vimeo API에 전달될 수 있음.
- **심각도**: 낮음
- **수정**: 양수 정수이며 50GB 이하인지 검증.

### [BUG-14] `bulk-generate` — uploadIds 배열 크기 제한 없음
- **파일**: `api/src/modules/upload/upload.routes.ts`
- **문제**: `uploadIds` 배열 크기 제한이 없어 수만 개 전송 시 메모리 + DB 부하 가능.
- **심각도**: 낮음 (DoS)
- **수정**: 1~100개로 제한.

### [BUG-15] 이미지 업로드 — MIME magic byte 검증 없음
- **파일**: `api/src/modules/upload/upload.routes.ts`
- **문제**: 확장자(.jpg/.png/.webp)만 검사하고 실제 파일 내용의 magic byte를 검사하지 않아 임의 파일을 이미지 확장자로 업로드 가능.
- **심각도**: 중간
- **수정**: JPEG (FFD8FF), PNG (89504E47), WebP (RIFF...WEBP) magic byte 검증 추가.

### [PERF-03] `getMyEnrollments` — orderBy 없음 (비결정적 순서)
- **파일**: `api/src/modules/lms/lms.service.ts`
- **문제**: 수강 목록 조회 시 `orderBy` 없이 반환하여 페이지 새로고침마다 순서가 달라질 수 있음.
- **수정**: `orderBy(desc(enrollments.enrolledAt))` 추가.

### [PERF-04] `instructors` 목록 — orderBy 없음
- **파일**: `api/src/modules/instructors/instructors-public.routes.ts`
- **문제**: 강사 목록 조회 시 `orderBy` 없어 비결정적 순서.
- **수정**: `orderBy(asc(instructors.createdAt))` 추가.

### [PERF-05] 결제 스키마 — impUid/orderId 최대 길이 없음
- **파일**: `api/src/modules/payment/payment.schema.ts`
- **문제**: 모든 confirm 스키마의 `impUid`, `orderId` 필드에 최대 길이 제한이 없어 매우 긴 문자열 전달 가능.
- **심각도**: 낮음
- **수정**: `impUid` max 100, `orderId` max 200으로 제한. `name` max 100, `phone` max 20도 추가.

---

## 2차 수정 파일 목록

| 파일 | 수정 항목 |
|------|-----------|
| `api/src/modules/certificates/cert.routes.ts` | SECURITY-11: return 누락 + optionalAuth 교체 |
| `web/src/app/login/page.tsx` | SECURITY-12: 오픈 리다이렉트 방지 |
| `web/src/app/auth/callback/page.tsx` | SECURITY-12: 오픈 리다이렉트 방지 |
| `api/src/modules/auth/auth.routes.ts` | SECURITY-13: forgot-password rate limit 추가 |
| `api/src/modules/upload/upload.routes.ts` | SECURITY-14, SECURITY-15, BUG-12~15: requireRole + 소유권 + MIME + size + status 검증 |
| `api/src/modules/lms/lms.service.ts` | BUG-10: 수강 권한 확인 + PERF-03: orderBy 추가 |
| `api/src/modules/reviews/review.routes.ts` | BUG-11: comment 길이 제한 |
| `api/src/modules/instructors/instructors-public.routes.ts` | PERF-04: orderBy 추가 |
| `api/src/modules/payment/payment.schema.ts` | PERF-05: impUid/orderId 길이 제한 |
