# coincraft.io/web — 개발 규칙

## 배포 (절대 규칙)

**GitHub Actions를 통해서만 배포. 스크립트 직접 실행 절대 금지.**

- 스테이징: `main` 브랜치 push → staging.coincraft.io 자동 배포
- 운영: `production` 브랜치 push → coincraft.io 자동 배포

배포 절차:
1. 로컬에서 작업 완료
2. Sharon 승인
3. `git push origin main` (스테이징) 또는 `git push origin production` (운영)

## 서버 정보
- 스테이징: `ssh custody-staging` (204.168.242.99)
- 앱 경로: `/opt/coincraft-staging/`
- PM2 프로세스: `coincraft-staging`
- API 경로: `/opt/coincraft-api/`
- PM2 프로세스: `coincraft-api`
