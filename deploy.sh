#!/bin/bash
# deploy.sh – run this on EC2 after every git pull
# Usage: bash deploy.sh
set -e  # stop on any error

APP_DIR="/home/ec2-user/app"
cd "$APP_DIR"

echo "=== [1/5] Pulling latest code ==="
git pull origin main

echo "=== [2/5] Installing server dependencies ==="
cd server && npm install --omit=dev && cd ..

echo "=== [3/5] Building React frontend ==="
cd client && npm install && npm run build && cd ..

echo "=== [4/5] Restarting Express via PM2 ==="
pm2 restart dynamodb-crud-server || pm2 start ecosystem.config.js --env production
pm2 save

echo "=== [5/5] Applying Nginx config ==="
sudo cp nginx.conf /etc/nginx/conf.d/dynamodb-crud.conf
sudo rm -f /etc/nginx/conf.d/default.conf
sudo nginx -t
sudo systemctl reload nginx

echo ""
echo "==== Deploy complete. Running smoke tests... ===="
sleep 2

echo ""
echo "--- Direct Express test (port 5000) ---"
curl -s http://localhost:5000/api/read | head -c 200
echo ""

echo ""
echo "--- Through Nginx test (port 80) ---"
curl -s http://localhost/api/read | head -c 200
echo ""

echo ""
echo "==== If both show JSON above, everything is working! ===="
