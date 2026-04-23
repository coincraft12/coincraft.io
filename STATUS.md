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
- FIX 1: web3intro 3-2강 FILE_MAP에 `sourceFile` 필드 추가 — 존재하지 않는 파일명 키 제거
- FIX 2+7: 전체 5개 벌크 업로드 스크립트 — try/finally pool 정리 + index 기반 order 값 적용
- FIX 3: deploy-production.yml — S3 env vars를 pm2 restart 이전으로 이동 + `--update-env` 추가
- FIX 4+8: deploy-staging.yml — seed 스크립트 `|| echo` 처리 + pm2 `--update-env` 추가
- FIX 5: 양쪽 워크플로우 health check — sleep+단일 curl → 30초 retry loop로 교체
- FIX 6: vimeo-upload.store.ts에 `lessonId` + `setLessonId` 추가; VimeoUploader에 `lessonId` prop + useEffect 연결
- FIX 9: findNextLessonId 챕터 간 정렬 오류 — 챕터 order 기준 정렬 후 레슨 정렬로 수정
- FIX 10: Vimeo whitelist 등록을 setImmediate(fire-and-forget) → await(응답 전 처리)로 변경 (2곳)
- PENDING: on-chain-signals [4-4] 레슨 Vimeo URL 중복 — Sharon이 올바른 URL 제공 후 DB 수정 필요

## 다음 작업
- [x] 스테이징 GitHub Actions 정상 동작 확인 ✅ (2026-04-24)
- [x] 운영 배포 완료 ✅ (2026-04-24)
- [ ] **[4-4] 나만의 쿼리 작성 레슨 Vimeo URL 교체** — 현재 [4-3]과 동일 URL, Sharon이 올바른 Vimeo URL 제공 필요
- [ ] 인프런 벤치마킹 기반 기능 (Q&A, 로드맵, 쿠폰, 수강생 현황)
