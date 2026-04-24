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
- Q&A: AI 즉시 답변 + 강사 이메일 발송 (claude-sonnet-4-5), Vimeo transcript 컨텍스트 연동
- 강사 포털 Q&A 관리 페이지: 질문 목록(필터/상태배지) + 상세 + 답변 작성/수정
- FIX: questions.status 업데이트 누락 — AI 답변 시 'ai_answered', 강사 답변 시 'completed' 갱신
- FIX: 강사 대시보드 필터 변경 시 선택 초기화 누락
- FIX: qa-section 반응 버튼 비로그인/실패 시 에러 피드백 없음
- FIX: 좋아요/싫어요 카운트 DB 트리거 의존 → 수동 UPDATE로 교체
- FIX: /instructor/qa API stub → 실제 구현 (getInstructorQuestions)

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
