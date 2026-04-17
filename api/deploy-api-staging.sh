#!/bin/bash
# API 스테이징 배포 스크립트
# 사용법: cd api && bash deploy-api-staging.sh
# 서버: custody-staging (204.168.242.99), 경로: /opt/coincraft-api, PM2: coincraft-api (port 4001)

set -e

STAGING_HOST="custody-staging"
API_PATH="/opt/coincraft-api"
TAR_FILE="/tmp/coincraft-api-build.tar.gz"

echo ">>> [1/4] 빌드..."
npm run build

echo ">>> [2/4] 패키징..."
tar -czf "$TAR_FILE" dist/ src/db/migrations/ package.json package-lock.json
echo "    크기: $(ls -lh $TAR_FILE | awk '{print $5}')"

echo ">>> [3/4] 서버 업로드..."
scp "$TAR_FILE" "$STAGING_HOST:$API_PATH/api-build.tar.gz"
rm "$TAR_FILE"

echo ">>> [4/4] 서버 교체 및 재시작..."
ssh "$STAGING_HOST" "
  set -e
  cd $API_PATH
  tar -xzf api-build.tar.gz && rm api-build.tar.gz
  npm install --omit=dev
  node dist/db/migrate.js
  pm2 restart coincraft-api
  sleep 2
  pm2 status coincraft-api
"

echo ">>> [5/4] 헬스체크..."
sleep 3
curl -sf https://staging.coincraft.io/api/v1/courses > /dev/null && echo "    API: OK" || echo "    API: FAIL"

echo ""
echo ">>> 완료: https://staging.coincraft.io/api"
