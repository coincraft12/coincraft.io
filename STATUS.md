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

## 다음 작업
- [x] 스테이징 GitHub Actions 정상 동작 확인 ✅ (2026-04-24)
- [x] 운영 배포 완료 ✅ (2026-04-24)
- [x] on-chain-signals [4-1]~[4-3] Vimeo URL 수정 ✅ (2026-04-24, 3개 환경 모두)
- [ ] **[4-4] 나만의 쿼리 작성 레슨 Vimeo URL 교체** — Sharon이 올바른 Vimeo URL 제공 필요
- [ ] 인프런 벤치마킹 기반 기능 (Q&A, 로드맵, 쿠폰, 수강생 현황)
