# STATUS — coincraft.io

> 이 파일은 어떤 세션/AI/수동 작업 이후에도 반드시 업데이트한다.
> 다음 작업자가 이 파일 하나만 읽어도 현재 상태를 파악할 수 있어야 한다.

## 현재 상태
| 항목 | 내용 |
|---|---|
| 단계 | 강사 포털 강의자료 시스템 완성 + CI/CD 자동화 완료 |
| 마지막 업데이트 | 2026-04-24 |
| 배포 방식 | GitHub Actions (main→staging, production→운영) — 스크립트 배포 완전 제거 |

## 마지막 작업 (2026-04-24)
- `chapter_materials`에 `lesson_id` 컬럼 추가 (migration 0011) — 레슨별 강의자료 분리
- 강사 레슨 수정 페이지에 `LessonMaterialsEditor` 컴포넌트 추가 — PDF 직접 업로드 UI
- 강사 강좌 관리 페이지에서 챕터 단위 강의자료 섹션 제거
- 벌크 업로드 스크립트 3종 dynamic lesson lookup 방식으로 rewrite (hardcoded ID 제거)
- GitHub Actions: API + DB migrate + Web + 강의자료 시딩 전 자동화
- 배포 셸 스크립트 (`deploy-staging.sh`, `deploy-production.sh`, `deploy.sh`) 삭제
- GitHub Secrets 7종 신규 등록 (DATABASE_URL, S3 전체)
- 운영 workflow: 스크립트 컴파일(`dist-scripts/`) 후 SSH로 서버에서 실행

## 다음 작업
- [ ] 커밋 & 스테이징 배포 (Sharon 승인 후 `git push origin main`)
- [ ] 스테이징 GitHub Actions 정상 동작 확인
- [ ] 운영 배포 (Sharon 승인 후 `git push origin production`)
- [ ] 인프런 벤치마킹 기반 기능 (Q&A, 로드맵, 쿠폰, 수강생 현황)
