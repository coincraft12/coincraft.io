#!/bin/bash
# Next.js 스테이징 배포 스크립트
# 사용법: cd web && ./deploy-staging.sh
# 방식: tar.gz 패키징 → 업로드 → 서버에서 교체 → PM2 재시작

set -e

STAGING_HOST="custody-staging"
STAGING_PATH="/opt/coincraft-staging"
TAR_FILE="/tmp/coincraft-next-build.tar.gz"

echo ">>> [1/4] 빌드..."
# 스테이징 빌드: NEXT_PUBLIC_API_URL은 비워서 nginx 프록시(/api/)를 타도록 함
NEXT_PUBLIC_API_URL= npm run build

echo ">>> [2/4] .next 패키징..."
tar -czf "$TAR_FILE" --exclude='.next/cache' --exclude='.next/dev' .next/
echo "    크기: $(ls -lh $TAR_FILE | awk '{print $5}')"

echo ">>> [3/4] 서버 업로드..."
scp "$TAR_FILE" "$STAGING_HOST:$STAGING_PATH/next-build.tar.gz"
rm "$TAR_FILE"
# server.js (next.config 변경사항 반영된 standalone 버전)
scp .next/standalone/server.js "$STAGING_HOST:$STAGING_PATH/server.js"
# public/ 폴더도 동기화 (이미지·정적파일)
tar -czf /tmp/coincraft-public.tar.gz public/
scp /tmp/coincraft-public.tar.gz "$STAGING_HOST:$STAGING_PATH/public.tar.gz"
rm /tmp/coincraft-public.tar.gz
ssh "$STAGING_HOST" "cd $STAGING_PATH && tar -xzf public.tar.gz && rm public.tar.gz"

echo ">>> [4/4] 서버 교체 및 재시작..."
ssh "$STAGING_HOST" "
  set -e;
  cd $STAGING_PATH
  pm2 stop coincraft-staging
  rm -rf .next-old
  mv .next .next-old
  tar -xzf next-build.tar.gz
  rm next-build.tar.gz
  pm2 start coincraft-staging
  sleep 3
  pm2 status coincraft-staging
"

echo ">>> 완료: https://staging.coincraft.io"
