# STATUS — coincraft.io

> 이 파일은 어떤 세션/AI/수동 작업 이후에도 반드시 업데이트한다.
> 다음 작업자가 이 파일 하나만 읽어도 현재 상태를 파악할 수 있어야 한다.

## 현재 상태
| 항목 | 내용 |
|---|---|
| 단계 | 코드 감사 지적사항 전건 수정 완료 |
| 마지막 업데이트 | 2026-04-24 |
| 배포 방식 | GitHub Actions (main→staging, production→운영) |

## 마지막 작업 (2026-04-24)
- FIX 1~10: 코드 감사 지적사항 전건 수정 (이전 커밋 참조)
- DATA FIX: on-chain-signals [4-1]~[4-3] Vimeo URL 한 칸 밀림 수정 — local/staging/production DB 모두 적용
- 데이터 픽스 스크립트 패턴 도입: `scripts/data-fix-template.ts` + `scripts/data-fix-YYYYMMDD-*.ts`
- 법적 문서 WordPress 원본으로 교체: 이용약관(7조→27조), 개인정보처리방침(6섹션→14섹션), 환불정책(ComingSoon→9섹션 완전판) — 시행일 2026-01-19
- cert/apply: 버튼 위 "현재 0명 접수 완료" 텍스트 제거 (정원초과·잔여5석 이하만 표시)
- 운영 DB: coincraft.edu@gmail.com, eungjungkim0110@gmail.com → role=admin + 7개 전과정 enrollments 등록

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
- [ ] 인프런 벤치마킹 기반 기능 (Q&A, 로드맵, 쿠폰, 수강생 현황)
