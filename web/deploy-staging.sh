#!/bin/bash
# Next.js 스테이징 배포 스크립트
# 사용법: cd web && bash deploy-staging.sh
# 서버: custody-staging (204.168.242.99), 경로: /opt/coincraft-staging, PM2: coincraft-staging

set -e

STAGING_HOST="custody-staging"
STAGING_PATH="/opt/coincraft-staging"
TAR_FILE="/tmp/coincraft-next-build.tar.gz"

echo ">>> [1/5] 스테이징 빌드..."
NEXT_PUBLIC_API_URL= NODE_ENV=production npm run build

echo ">>> [2/5] .next 패키징..."
tar -czf "$TAR_FILE" --exclude='.next/cache' --exclude='.next/dev' --exclude='.next/standalone' .next/ || true
echo "    크기: $(ls -lh $TAR_FILE | awk '{print $5}')"

echo ">>> [3/5] 서버 업로드..."
scp "$TAR_FILE" "$STAGING_HOST:$STAGING_PATH/next-build.tar.gz"
rm "$TAR_FILE"

scp .next/standalone/server.js "$STAGING_HOST:$STAGING_PATH/server.js"

tar -czf /tmp/coincraft-public.tar.gz public/
scp /tmp/coincraft-public.tar.gz "$STAGING_HOST:$STAGING_PATH/public.tar.gz"
rm /tmp/coincraft-public.tar.gz

echo ">>> [4/5] 서버 교체 및 재시작..."
ssh "$STAGING_HOST" "
  set -e
  cd $STAGING_PATH

  tar -xzf public.tar.gz && rm public.tar.gz

  pm2 stop coincraft-staging
  rm -rf .next-old
  mv .next .next-old
  tar -xzf next-build.tar.gz
  rm next-build.tar.gz

  if [ -f ecosystem.config.js ]; then
    pm2 start ecosystem.config.js
  else
    API_INTERNAL_URL=http://localhost:4001 NODE_ENV=production PORT=3000 pm2 start server.js --name coincraft-staging
  fi

  sleep 3
  pm2 status coincraft-staging
"

echo ">>> [5/5] 헬스체크..."
sleep 3
curl -sf https://staging.coincraft.io > /dev/null && echo "    Web: OK" || echo "    Web: FAIL"
curl -sf https://staging.coincraft.io/api/v1/courses > /dev/null && echo "    API: OK" || echo "    API: FAIL"

echo ""
echo ">>> 완료: https://staging.coincraft.io"
