# STATUS — coincraft.io

> 이 파일은 어떤 세션/AI/수동 작업 이후에도 반드시 업데이트한다.
> 다음 작업자가 이 파일 하나만 읽어도 현재 상태를 파악할 수 있어야 한다.

## 현재 상태
- **단계**: Next.js 홈페이지 로컬 완성 — Sharon 검토·승인 후 운영 배포 대기
- **마지막 업데이트**: 2026-04-12

## 아키텍처 결정 (2026-04-12 확정)
- `coincraft.io` → Next.js 홈페이지 (신규)
- `academy.coincraft.io` → WordPress + LearnPress 유지
- 이유: WordPress 테마 충돌 반복 문제 해결 + Claude 완전 제어 가능

## 로컬 개발 환경
- Next.js: `localhost:3002` (`coincraft.io/web/`)
- WordPress(academy용): `localhost:8080` (Docker — WordPress 6.9 + MySQL 8.0)
- 스택: Next.js 16, TypeScript, Tailwind CSS

## 완료 항목
- [x] Next.js 프로젝트 셋업 (섹션 7개: Hero / About / 5대 사업 트랙 / Academy / Blog / Patent / Community)
- [x] Academy·Blog 섹션: WordPress REST API 실시간 fetch
- [x] 헤더: 실제 로고 + 드롭다운 메뉴
- [x] 푸터: 사업자 정보·연락처·법무 링크
- [x] About 페이지 제작 + 운영 배포 (기술 중심 리브랜딩)
- [x] ABOUT 메뉴 URL 수정 — `#` → `/about/` (모바일 링크 수정, 2026-04-12)

## 다음 작업 항목
- [ ] Sharon 검토 → 운영 배포 승인
- [ ] Nginx 설정 변경 (coincraft.io → Next.js standalone, academy.coincraft.io → WordPress)
- [ ] 블로그 섹션 WordPress REST API 썸네일 연동 확인

## 서버 정보
- 운영 서버: 46.62.212.134 / SSH: `ssh coincraft` / 유저: root
- WordPress 경로: /var/www/coincraft.io / 테마: eduma-child
- 배포 규칙: 로컬 수정 → Sharon 승인 → 운영 배포 (운영 직접 수정 금지)
