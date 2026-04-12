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
- [x] WP Super Cache + mod_rewrite 활성화 (전 페이지 서버 응답 ~0ms, 2026-04-12)
- [x] 미사용 플러그인 11개 삭제 (2026-04-12)

## 다음 작업 항목
- [ ] Sharon 검토 → 운영 배포 승인
- [ ] Nginx 설정 변경 (coincraft.io → Next.js standalone, academy.coincraft.io → WordPress)
- [ ] 블로그 섹션 WordPress REST API 썸네일 연동 확인
- [ ] Google 소셜 로그인 연동 (nextend-facebook-connect 플러그인 설치됨)
  - Sharon이 Google Cloud Console에서 OAuth 클라이언트 ID·Secret 발급 후 진행
  - 리디렉션 URI: `https://coincraft.io/?oauth=1&action=nextendLogin&provider=google`
  - 기존 회원 이메일 자동 매칭 설정 켜기
- [ ] 스테이징 서버 구축 — custody 스테이징 VPS 활용 검토
  - GitHub Secrets에서 STAGING_HOST IP 확인 (Sharon 직접)
  - 서버 사양 확인 (RAM/디스크 여유 → coincraft Next.js + Nginx 추가 가능 여부)
  - 가능하면 staging.coincraft.io 서브도메인으로 구성

- [ ] 전자책 ePub 변환
  - 살아남기 위한 생존전략 WEB3: `_Archive/05_집필/01. 살아남기 위한 생존전략 WEB3/final_ver1.0.docx` (Sharon 최종본 확인 필요)
  - 온체인 시그널: `_Archive/05_집필/02. 온체인시그널/prologue.docx + chapter1~4.docx` (Sharon 최종본 확인 필요)
  - 사토시 픽션: 9차 퇴고 완료 + 분권 결정 후 진행
  - 완료 후 Next.js 사이트에서 직접 판매 페이지 연동

## 아키텍처 장기 방향 (2026-04-12 확정, CIO-001)
- **완전 헤드리스 WordPress** 구조로 장기 전환
- Next.js = 메인 프론트엔드 (모든 라우팅·렌더링·헤더·푸터)
- WordPress = 백엔드 전용 (REST API로 데이터 제공, 사용자에게 직접 노출 안 함)
- 단계별 마이그레이션: 강좌 목록 → 강좌 상세 → 계정/결제 순
- 급하지 않음 — CIO 주도 장기 로드맵으로 관리
- 현재 스테이징 혼재 구조는 과도기 상태로 인정, 운영 배포 전까지 유지

## 모바일 앱 계획 (2026-04-12 확정, CIO-002)
- 강의 수강 + 전자책 + 콘텐츠 제공 전용 앱
- 기술 스택 후보: React Native / Expo (Next.js 코드 재사용 가능)
- 백엔드: WordPress REST API + Node.js API 연계
- 선행 조건: 헤드리스 WordPress 전환(CIO-001) 완료 후 착수
- 앱스토어(iOS) + 플레이스토어(Android) 양쪽 배포 목표

## 작업 전 필독 (CIO)
- `Work/CIO/coincraft_platform_roadmap.md` — Phase별 세부 To-Do
- `Work/CIO/cso_cio_protocol.md` — CIO-CSO 협조 규칙
- `Work/CIO/decisions.md` — 기존 결정 확인
- `Work/CIO/daily_log.md` — 최근 작업 맥락 확인
- `Work/CSO/decisions.md` — 전사 우선순위 확인

## 서버 정보
- 운영 서버: 46.62.212.134 / SSH: `ssh coincraft` / 유저: root
- WordPress 경로: /var/www/coincraft.io / 테마: eduma-child
- 배포 규칙: 로컬 수정 → Sharon 승인 → 운영 배포 (운영 직접 수정 금지)
