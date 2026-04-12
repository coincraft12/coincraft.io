#!/bin/bash
# CoinCraft 테마 배포 스크립트
# 사용법: ./deploy.sh

SSH_KEY="F:/Workplace/_Archive/04_사업행정/SSH키/coincraft_io"
PROD_HOST="46.62.212.134"
PROD_USER="root"
PROD_PATH="/var/www/coincraft.io/wp-content/themes/blocksy-child"
LOCAL_THEME="./themes/blocksy-child"

echo "🚀 CoinCraft 테마 배포 시작..."

# 로컬 → 서버 rsync
rsync -avz --delete \
  -e "ssh -i \"$SSH_KEY\" -o StrictHostKeyChecking=no" \
  "$LOCAL_THEME/" \
  "$PROD_USER@$PROD_HOST:$PROD_PATH/"

if [ $? -eq 0 ]; then
  echo "✅ 배포 완료: https://coincraft.io"
else
  echo "❌ 배포 실패"
  exit 1
fi
