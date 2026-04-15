# coincraft.io/web — 개발 규칙

## 스테이징 배포 (절대 규칙)

**반드시 deploy-staging.sh 사용. scp 개별 파일 업로드 절대 금지.**

```bash
cd F:/Workplace/coincraft.io/web
bash deploy-staging.sh
```

스크립트가 하는 일:
1. `npm run build`
2. `.next/` → tar.gz 패키징
3. 서버에 tar.gz 업로드
4. 서버에서 `.next` 교체 (stop → swap → start)

### 이유
scp -r 로 디렉토리 업로드 시 대상 디렉토리가 존재하면 중첩(nesting) 발생 → 서버 다운.
tar.gz 방식만 안전.

## 서버 정보
- 스테이징: `ssh custody-staging` (204.168.242.99)
- 앱 경로: `/opt/coincraft-staging/`
- PM2 프로세스: `coincraft-staging`
- API 경로: `/opt/coincraft-api/`
- PM2 프로세스: `coincraft-api`
