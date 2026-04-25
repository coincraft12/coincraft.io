# STATUS — coincraft.io

> 이 파일은 어떤 세션/AI/수동 작업 이후에도 반드시 업데이트한다.
> 다음 작업자가 이 파일 하나만 읽어도 현재 상태를 파악할 수 있어야 한다.

## 현재 상태
| 항목 | 내용 |
|---|---|
| 단계 | 강의노트 100개 완전 재생성 완료 (max_tokens 4096) + 마크다운 표 수정 |
| 마지막 업데이트 | 2026-04-25 |
| 배포 방식 | GitHub Actions (main→staging, production→운영) |

## 마지막 작업 (2026-04-25)
- feat: 관리자 대시보드 Anthropic API 사용 현황 페이지 추가 (토큰/비용/일별차트/모델별)
- feat: /my 마이페이지 고도화 — 프로필 편집(이름/소개/관심분야/SNS), 아바타 업로드, 학습통계, 연동계정 표시
- feat: users 테이블 bio/interests/social_links 컬럼 추가 (migration 0019)
- feat: PATCH /api/v1/auth/me/profile, GET /api/v1/auth/me/stats 엔드포인트 추가
- fix: 비공개 질문 가시성 — canViewContent 플래그 방식, Q&A 전반 버그 수정 (10패스)

## DB 데이터 픽스 규칙 (영구)

> **스키마 변경(DDL)** → Drizzle 마이그레이션 (`npm run migrate`)
> **데이터 수정(DML)** → `api/scripts/data-fix-YYYYMMDD-설명.ts` 스크립트로 작성

- 템플릿: `api/scripts/data-fix-template.ts`
- 실행: `DATABASE_URL=postgres://... npx ts-node scripts/data-fix-YYYYMMDD-xxx.ts`
- DRY RUN: `DRY_RUN=true DATABASE_URL=... npx ts-node ...` (실제 변경 없이 쿼리만 출력)
- **환경별 별도 실행 필수** — 로컬 → 스테이징 → 운영 순서로 각각 실행
- 실행 완료 후 STATUS.md "마지막 작업"에 적용 환경(local/staging/production) 명시

## 스테이징 배포 시 필수 수동 작업
- migration 0019 (Drizzle 저널 밖 — 직접 실행 필요):
  ```
  ssh custody-staging "docker exec custody-postgres psql -U coincraft -d coincraft_staging -c 'ALTER TABLE users ADD COLUMN IF NOT EXISTS bio text; ALTER TABLE users ADD COLUMN IF NOT EXISTS interests text[]; ALTER TABLE users ADD COLUMN IF NOT EXISTS social_links jsonb;'"
  ```

## 다음 작업
- [x] 스테이징 GitHub Actions 정상 동작 확인 ✅ (2026-04-24)
- [x] 운영 배포 완료 ✅ (2026-04-24)
- [x] on-chain-signals [4-1]~[4-3] Vimeo URL 수정 ✅ (2026-04-24, 3개 환경 모두)
- [ ] **[4-4] 나만의 쿼리 작성 레슨 Vimeo URL 교체** — Sharon이 올바른 Vimeo URL 제공 필요
- [ ] 스테이징 배포 및 동작 확인 (Q&A + 강의노트 + 퀴즈)
- [ ] **[4-4] 나만의 쿼리 작성 레슨 Vimeo URL 교체** — Sharon이 올바른 Vimeo URL 제공 필요
- [ ] 전체 레슨 퀴즈 생성 (generate-lesson-quizzes.ts 전체 실행)
- [ ] 스테이징 DB 마이그레이션: lesson_quizzes 테이블 + quiz_status 컬럼
- [ ] 인프런 벤치마킹 기반 기능 (로드맵, 쿠폰, 수강생 현황)
