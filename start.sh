#!/bin/bash
# 載入環境變數
set -a
source /etc/environment 2>/dev/null || true
set +a

# --- MTU 診斷與嘗試修正區塊 ---
echo "目前用戶 ID: $(id -u)"
# 嘗試設定 MTU (如果是 root 或有 cap 權限)
ip link set eth0 mtu 1400 2>/dev/null
if [ $? -eq 0 ]; then
    echo ":white_check_mark: 成功將 MTU 設定為 1400"
else
    echo ":warning: 無法設定 MTU (可能是非 Root 用戶)，將依賴外部網路設定"
fi

# 動態設定 Chrome 路徑
CHROME_EXECUTABLE=$(node -e "console.log(require('puppeteer').executablePath())")
export CHROME_BIN=$CHROME_EXECUTABLE
export CHROME_PATH=$CHROME_EXECUTABLE
# 設定 Prerender 監聽端口（公司規定）
export PORT=8080
echo "=== Chrome 環境變數 ==="
echo "CHROME_BIN=$CHROME_BIN"
echo "CHROME_PATH=$CHROME_PATH"
echo "PORT=$PORT"
echo "Starting Prerender with Chrome at: $CHROME_BIN"
echo "Prerender will listen on port: $PORT"

echo "=== 測試網路連線 GOOGLE ==="
curl -s --connect-timeout 5 https://www.google.com && echo "Google 網路測試完成" || echo "Google 連線失敗"

node server.js
