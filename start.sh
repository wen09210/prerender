#!/bin/bash
export CHROME_BIN=/usr/local/bin/chrome
export CHROME_PATH=/usr/local/bin/chrome
export PORT=${PORT:-8080}
export HOME=/tmp
export DBUS_SESSION_BUS_ADDRESS=disabled:

# 清除可能殘留的 Chrome lock 檔
rm -rf /tmp/prerender-chrome-profile

echo "Starting Prerender on port ${PORT}..."
exec node server.js
