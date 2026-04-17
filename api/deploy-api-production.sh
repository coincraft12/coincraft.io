#!/bin/bash
# API 운영 배포 스크립트 — 스테이징 빌드를 운영으로 프로모트
# 사용법: cd api && bash deploy-api-production.sh
# 스테이징: custody-staging:/opt/coincraft-api
# 운영:     coincraft:/opt/coincraft-api, PM2: coincraft-api (port 4000)

set -e

STAGING_HOST="custody-staging"
STAGING_API_PATH="/opt/coincraft-api"
PROD_HOST="coincraft"
PROD_API_PATH="/opt/coincraft-api"
TAR_FILE="/tmp/coincraft-api-promote.tar.gz"

echo ">>> [1/4] 스테이징 빌드 수집..."
ssh "$STAGING_HOST" "
  cd $STAGING_API_PATH
  tar -czf /tmp/staging-api.tar.gz dist/ src/db/migrations/ package.json package-lock.json 2>/dev/null || \
  tar -czf /tmp/staging-api.tar.gz dist/ package.json package-lock.json
"
scp "$STAGING_HOST:/tmp/staging-api.tar.gz" "$TAR_FILE"
ssh "$STAGING_HOST" "rm -f /tmp/staging-api.tar.gz"
echo "    크기: $(ls -lh $TAR_FILE | awk '{print $5}')"

echo ">>> [2/4] 운영 서버 업로드..."
scp "$TAR_FILE" "$PROD_HOST:$PROD_API_PATH/api-build.tar.gz"
rm "$TAR_FILE"

echo ">>> [3/4] 서버 교체 및 재시작..."
ssh "$PROD_HOST" "
  set -e
  cd $PROD_API_PATH
  tar -xzf api-build.tar.gz && rm api-build.tar.gz
  npm install --omit=dev
  node dist/db/migrate.js
  pm2 restart coincraft-api
  sleep 2
  pm2 status coincraft-api
"

echo ">>> [4/4] 헬스체크..."
sleep 3
curl -sf https://coincraft.io/api/v1/courses > /dev/null && echo "    API: OK" || echo "    API: FAIL"

echo ""
echo ">>> 완료: https://coincraft.io/api"
