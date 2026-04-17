#!/bin/bash
# Next.js 운영 배포 스크립트
# 사용법: cd web && bash deploy-production.sh
# 스테이징과 동일한 서버(204.168.242.99), 동일 경로 배포

set -e

PROD_HOST="custody-staging"
PROD_PATH="/opt/coincraft-staging"
TAR_FILE="/tmp/coincraft-next-prod.tar.gz"

echo ">>> [1/5] 운영 빌드 (.env.production 사용)..."
cp .env.production .env.production.build
NODE_ENV=production NEXT_PUBLIC_API_URL= npm run build
rm -f .env.production.build

echo ">>> [2/5] .next 패키징..."
tar -czf "$TAR_FILE" --exclude='.next/cache' --exclude='.next/dev' .next/
echo "    크기: $(ls -lh $TAR_FILE | awk '{print $5}')"

echo ">>> [3/5] 서버 업로드..."
scp "$TAR_FILE" "$PROD_HOST:$PROD_PATH/next-build.tar.gz"
rm "$TAR_FILE"
scp .next/standalone/server.js "$PROD_HOST:$PROD_PATH/server.js"
tar -czf /tmp/coincraft-public.tar.gz public/
scp /tmp/coincraft-public.tar.gz "$PROD_HOST:$PROD_PATH/public.tar.gz"
rm /tmp/coincraft-public.tar.gz
ssh "$PROD_HOST" "cd $PROD_PATH && tar -xzf public.tar.gz && rm public.tar.gz"

echo ">>> [4/5] 서버 교체 및 재시작..."
ssh "$PROD_HOST" "
  set -e
  cd $PROD_PATH
  pm2 stop coincraft-staging
  rm -rf .next-old
  mv .next .next-old
  tar -xzf next-build.tar.gz
  rm next-build.tar.gz
  pm2 start coincraft-staging
  sleep 3
  pm2 status coincraft-staging
"

echo ">>> [5/5] 헬스체크..."
sleep 3
curl -sf http://204.168.242.99:3000 > /dev/null && echo "    Web: OK" || echo "    Web: FAIL"
curl -sf http://204.168.242.99:4001/api/v1/courses > /dev/null && echo "    API: OK" || echo "    API: FAIL"

echo ""
echo ">>> 완료. 도메인 전환 후 https://coincraft.io 확인"
