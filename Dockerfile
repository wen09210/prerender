FROM registry.access.redhat.com/ubi8/nodejs-20:1-73.1742991506

USER root
ENV USER=default
ENV USER_UID=1001
ENV USER_GID=100

ENV NODE_TLS_REJECT_UNAUTHORIZED=0

ARG RPM_PACKAGES
ARG NEXUS_URL





RUN if [ -n "${RPM_PACKAGES}" ]; then \
            RHEL_VERSION=$(rpm -E %{rhel})  && \
            echo -e "[nexus-cdn]\nname=Nexus CDN\nbaseurl=https://${NEXUS_URL}/repository/redhat-ubi${RHEL_VERSION}-proxy/\nenabled=1\ngpgcheck=0\nsslverify=0\n\n[nexus-rocky]\nname=Nexus Rocky\nbaseurl=https://${NEXUS_URL}/repository/rocky-ubi${RHEL_VERSION}-proxy/\nenabled=1\ngpgcheck=0\nsslverify=0\n\n[nexus-epel]\nname=Nexus EPEL\nbaseurl=https://${NEXUS_URL}/repository/epel-ubi${RHEL_VERSION}-proxy/\nenabled=1\ngpgcheck=0\nsslverify=0\n\n" > /etc/yum.repos.d/nexus.repo  && \
            echo -e "openssl_conf = default_conf\n[default_conf]\nssl_conf = ssl_sect\n[ssl_sect]\nsystem_default = system_default_sect\n[system_default_sect]\nCipherString = DEFAULT:@SECLEVEL=1" > /etc/ssl/nexus.openssl.cnf && \
            find /etc/yum.repos.d -type f ! -name 'nexus.repo' -delete && \
            export OPENSSL_CONF=/etc/ssl/nexus.openssl.cnf && \
            yum clean all &&  yum --setopt=timeout=300 update -y && \
            yum install -y ${RPM_PACKAGES} && \
            yum clean all && rm -rf /var/cache/yum/* ; \
        fi
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

COPY dist.zip ./
RUN unzip -o dist.zip 2>/dev/null || unzip dist.zip || echo "unzip completed"
# 安裝所有依賴
RUN npm config set strict-ssl false && npm install --reg https://${NEXUS_URL}/repository/npm-all/ puppeteer --unsafe-perm=true --allow-root
# 檢查並設定 Chrome 路徑
RUN CHROME_PATH=$(node -e "console.log(require('puppeteer').executablePath())") && \
        echo "Puppeteer Chrome 位於: $CHROME_PATH" && \
        ln -sf "$CHROME_PATH" /usr/local/bin/chrome && \
        chmod +x /usr/local/bin/chrome && \
        echo "=== 驗證 Chrome 安裝 ===" && \
        ls -la "$CHROME_PATH" && \
        ls -la /usr/local/bin/chrome && \
        /usr/local/bin/chrome --version || echo "Chrome 版本檢查失敗"
# 確保 Chrome 有執行權限
RUN CHROME_EXECUTABLE=$(node -e "console.log(require('puppeteer').executablePath())") && \
        chmod +x $CHROME_EXECUTABLE && \
        ls -la $CHROME_EXECUTABLE && \
        echo "CHROME_BIN=$CHROME_EXECUTABLE" >> /etc/environment && \
        echo "CHROME_PATH=$CHROME_EXECUTABLE" >> /etc/environment

# 測試 Chrome 是否可以啟動
RUN CHROME_EXECUTABLE=$(node -e "console.log(require('puppeteer').executablePath())") && \
        $CHROME_EXECUTABLE --version || echo "Chrome 啟動測試失敗"



RUN mkdir -p /app && \
        echo '#!/bin/bash' >> /app/start.sh && \
        echo '# 載入環境變數' >> /app/start.sh && \
        echo 'set -a' >> /app/start.sh && \
        echo 'source /etc/environment 2>/dev/null || true' >> /app/start.sh && \
        echo 'set +a' >> /app/start.sh && \
        echo '' >> /app/start.sh && \
        echo '# --- MTU 診斷與嘗試修正區塊 ---' >> /app/start.sh && \
        echo 'echo "目前用戶 ID: $(id -u)"' >> /app/start.sh && \
        echo '# 嘗試設定 MTU (如果是 root 或有 cap 權限)' >> /app/start.sh && \
        echo 'ip link set eth0 mtu 1400 2>/dev/null' >> /app/start.sh && \
        echo 'if [ $? -eq 0 ]; then' >> /app/start.sh && \
        echo '    echo ":white_check_mark: 成功將 MTU 設定為 1400"' >> /app/start.sh && \
        echo 'else' >> /app/start.sh && \
        echo '    echo ":warning: 無法設定 MTU (可能是非 Root 用戶)，將依賴外部網路設定"' >> /app/start.sh && \
        echo 'fi' >> /app/start.sh && \
        echo '' >> /app/start.sh && \
        echo '# 動態設定 Chrome 路徑' >> /app/start.sh && \
        echo 'CHROME_EXECUTABLE=$(node -e "console.log(require(\"puppeteer\").executablePath())")' >> /app/start.sh && \
        echo 'export CHROME_BIN=$CHROME_EXECUTABLE' >> /app/start.sh && \
        echo 'export CHROME_PATH=$CHROME_EXECUTABLE' >> /app/start.sh && \
        echo '# 設定 Prerender 監聽端口（公司規定）' >> /app/start.sh && \
        echo 'export PORT=8080' >> /app/start.sh && \
        echo 'echo "=== Chrome 環境變數 ==="' >> /app/start.sh && \
        echo 'echo "CHROME_BIN=$CHROME_BIN"' >> /app/start.sh && \
        echo 'echo "CHROME_PATH=$CHROME_PATH"' >> /app/start.sh && \
        echo 'echo "PORT=$PORT"' >> /app/start.sh && \
        echo 'echo "Starting Prerender with Chrome at: $CHROME_BIN"' >> /app/start.sh && \
        echo 'echo "Prerender will listen on port: $PORT"' >> /app/start.sh && \
        echo '' >> /app/start.sh && \
        # echo 'echo "=== 測試網路連線 GOOGLE ==="' >> /app/start.sh && \
        # echo 'curl -s --connect-timeout 5 https://www.google.com && echo "Google 網路測試完成" || echo "Google 連線失敗"' >> /app/start.sh && \
        # echo '' >> /app/start.sh && \
        echo '' >> /app/start.sh && \
        echo 'node server.js' >> /app/start.sh
RUN chmod +x /app/start.sh

USER $USER_UID

EXPOSE 8080
CMD ["/app/start.sh"]