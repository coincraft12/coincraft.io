# 로컬 개발 환경 시작

**접속 주소: `http://localhost`** (포트 없음)

## 터미널 3개 순서대로

```bash
# 터미널 1 — Docker (nginx + DB + Redis)
cd F:/Workplace/coincraft.io/api
docker compose up -d
docker compose ps   # nginx·postgres·redis 모두 running 확인
```

```bash
# 터미널 2 — API 서버
cd F:/Workplace/coincraft.io/api
npm run dev
```

```bash
# 터미널 3 — 웹 서버
cd F:/Workplace/coincraft.io/web
npm run dev
```

## 자주 있는 상황

| 증상 | 원인 | 해결 |
|---|---|---|
| `http://localhost` 안 열림 | Docker 안 켜짐 | 터미널 1 실행 |
| API 요청 실패 | API 서버 안 켜짐 | 터미널 2 실행 |
| DB 스키마 변경 후 에러 | 마이그레이션 누락 | `cd api && npm run migrate` |
