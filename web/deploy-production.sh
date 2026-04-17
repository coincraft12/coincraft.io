#!/bin/bash
# Next.js 운영 배포 스크립트 — 스테이징 빌드를 운영으로 프로모트
# 사용법: cd web && bash deploy-production.sh
# 스테이징: custody-staging:/opt/coincraft-staging
# 운영:     coincraft:/opt/coincraft-web, PM2: coincraft-web

set -e

STAGING_HOST="custody-staging"
STAGING_PATH="/opt/coincraft-staging"
PROD_HOST="coincraft"
PROD_PATH="/opt/coincraft-web"
TAR_FILE="/tmp/coincraft-promote.tar.gz"
SERVER_JS="/tmp/coincraft-server.js"
PUBLIC_TAR="/tmp/coincraft-public-promote.tar.gz"

echo ">>> [1/4] 스테이징 빌드 수집..."
ssh "$STAGING_HOST" "
  cd $STAGING_PATH
  tar -czf /tmp/staging-next.tar.gz --exclude='.next/cache' --exclude='.next/dev' --exclude='.next/standalone' .next/
  tar -czf /tmp/staging-public.tar.gz public/
"
scp "$STAGING_HOST:/tmp/staging-next.tar.gz" "$TAR_FILE"
scp "$STAGING_HOST:$STAGING_PATH/server.js" "$SERVER_JS"
scp "$STAGING_HOST:$STAGING_PATH/package.json" "/tmp/coincraft-web-package.json"
scp "$STAGING_HOST:$STAGING_PATH/package-lock.json" "/tmp/coincraft-web-package-lock.json"
scp "$STAGING_HOST:/tmp/staging-public.tar.gz" "$PUBLIC_TAR"
ssh "$STAGING_HOST" "rm -f /tmp/staging-next.tar.gz /tmp/staging-public.tar.gz"
echo "    크기: $(ls -lh $TAR_FILE | awk '{print $5}')"

echo ">>> [2/4] 운영 서버 업로드..."
scp "$TAR_FILE" "$PROD_HOST:$PROD_PATH/next-build.tar.gz"
scp "$SERVER_JS" "$PROD_HOST:$PROD_PATH/server.js"
scp "/tmp/coincraft-web-package.json" "$PROD_HOST:$PROD_PATH/package.json"
scp "/tmp/coincraft-web-package-lock.json" "$PROD_HOST:$PROD_PATH/package-lock.json"
scp "$PUBLIC_TAR" "$PROD_HOST:$PROD_PATH/public.tar.gz"
rm "$TAR_FILE" "$SERVER_JS" "$PUBLIC_TAR" "/tmp/coincraft-web-package.json" "/tmp/coincraft-web-package-lock.json"

echo ">>> [3/4] 서버 교체 및 재시작..."
ssh "$PROD_HOST" "
  set -e
  cd $PROD_PATH

  tar -xzf public.tar.gz && rm public.tar.gz

  pm2 stop coincraft-web || true
  kill $(lsof -ti:3000) 2>/dev/null || true
  sleep 1
  rm -rf .next-old
  mv .next .next-old
  tar -xzf next-build.tar.gz
  rm next-build.tar.gz

  npm install --omit=dev --prefer-offline 2>/dev/null || npm install --omit=dev

  if [ -f ecosystem.config.js ]; then
    pm2 start ecosystem.config.js
  else
    API_INTERNAL_URL=http://localhost:4000 NODE_ENV=production PORT=3000 pm2 start server.js --name coincraft-web
  fi

  sleep 3
  pm2 status coincraft-web
"

echo ">>> [4/4] 헬스체크..."
sleep 3
curl -sf https://coincraft.io > /dev/null && echo "    Web: OK" || echo "    Web: FAIL"
curl -sf https://coincraft.io/api/v1/courses > /dev/null && echo "    API: OK" || echo "    API: FAIL"

echo ""
echo ">>> 완료: https://coincraft.io"
