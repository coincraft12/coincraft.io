# STATUS — coincraft.io

> 이 파일은 어떤 세션/AI/수동 작업 이후에도 반드시 업데이트한다.
> 다음 작업자가 이 파일 하나만 읽어도 현재 상태를 파악할 수 있어야 한다.

## 현재 상태
| 항목 | 내용 |
|---|---|
| 단계 | Q&A AI 답변 + Vimeo transcript 기반 강의노트 자동생성 구현 완료 (로컬) |
| 마지막 업데이트 | 2026-04-25 |
| 배포 방식 | GitHub Actions (main→staging, production→운영) |

## 마지막 작업 (2026-04-25)
- Q&A: AI 즉시 답변 + 강사 이메일 발송 (claude-sonnet-4-5, 404 에러 수정)
- Vimeo 자막(transcript) DB 저장 + 강의노트 자동생성 파이프라인 구축 (레슨 등록/수정 시 자동 트리거)
- DB: lessons 테이블에 transcript, notes_status 컬럼 추가 (직접 ALTER TABLE 적용)
- 강사 포털 Q&A 관리 페이지 완성: 질문 목록(필터/상태배지) + 상세 + 답변 작성/수정
- FIX: /instructor/qa API stub → 실제 구현 (getInstructorQuestions), import 경로 오류 수정
- FIX: 좋아요/싫어요 반영 안 되는 버그 — DB 트리거 의존 → 수동 카운트 갱신으로 교체
- 강사 포털 nav에 Q&A 관리 링크 추가

## DB 데이터 픽스 규칙 (영구)

> **스키마 변경(DDL)** → Drizzle 마이그레이션 (`npm run migrate`)
> **데이터 수정(DML)** → `api/scripts/data-fix-YYYYMMDD-설명.ts` 스크립트로 작성

- 템플릿: `api/scripts/data-fix-template.ts`
- 실행: `DATABASE_URL=postgres://... npx ts-node scripts/data-fix-YYYYMMDD-xxx.ts`
- DRY RUN: `DRY_RUN=true DATABASE_URL=... npx ts-node ...` (실제 변경 없이 쿼리만 출력)
- **환경별 별도 실행 필수** — 로컬 → 스테이징 → 운영 순서로 각각 실행
- 실행 완료 후 STATUS.md "마지막 작업"에 적용 환경(local/staging/production) 명시

## 다음 작업
- [x] 스테이징 GitHub Actions 정상 동작 확인 ✅ (2026-04-24)
- [x] 운영 배포 완료 ✅ (2026-04-24)
- [x] on-chain-signals [4-1]~[4-3] Vimeo URL 수정 ✅ (2026-04-24, 3개 환경 모두)
- [ ] **[4-4] 나만의 쿼리 작성 레슨 Vimeo URL 교체** — Sharon이 올바른 Vimeo URL 제공 필요
- [ ] 스테이징 배포 및 동작 확인 (Q&A + 강의노트 기능)
- [ ] 버그/오류 전체 재점검 (다음 세션)
- [ ] 인프런 벤치마킹 기반 기능 (로드맵, 쿠폰, 수강생 현황)
