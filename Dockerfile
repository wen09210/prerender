FROM registry.access.redhat.com/ubi9/nodejs-20

# 使用 UBI + microdnf 安裝 RPM 套件（假設可從內建 repo 或 EPEL 取得）
USER 0
RUN set -eux; \
    PKGS="ca-certificates dejavu-sans-fonts dejavu-serif-fonts alsa-lib at-spi2-atk atk glibc cairo cups-libs dbus-libs expat fontconfig mesa-libgbm libgcc glib2 gtk3 nspr nss nss-util nss-softokn libxkbcommon pango libstdc++ libX11 libxcb libXcomposite libXcursor libXdamage libXext libXfixes libXi libXrandr libXrender libXScrnSaver libXtst libX11-xcb wget unzip"; \
    if command -v microdnf >/dev/null 2>&1; then \
    microdnf update -y; microdnf install -y epel-release || true; microdnf install -y $PKGS; microdnf clean all; \
    elif command -v dnf >/dev/null 2>&1; then \
    dnf -y makecache; dnf install -y epel-release || true; dnf install -y $PKGS; dnf clean all; \
    elif command -v yum >/dev/null 2>&1; then \
    yum -y makecache; yum install -y epel-release || true; yum install -y $PKGS; yum clean all; \
    else \
    echo "No supported package manager found (microdnf/dnf/yum)."; exit 1; \
    fi

# 增加 symbolic link（若 chromium 安裝在不同路徑，請調整）
RUN [ -x "/usr/bin/chromium" ] && ln -sf /usr/bin/chromium /usr/bin/google-chrome || true && \
    [ -x "/usr/bin/chromium" ] && ln -sf /usr/bin/chromium /usr/bin/chromium-browser || true

# 允許 Puppeteer 在 npm install 階段下載 Chromium（若你想改回使用系統 chromium，請改為 true 並提供可執行路徑）
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false

WORKDIR /app

# 複製 zip 檔進容器
COPY prerender.zip ./

# 解壓縮 zip 檔
RUN unzip prerender.zip

# 安裝 npm 依賴
RUN npm install

# 若專案沒有 puppeteer，顯式安裝 puppeteer 以便在 build 時下載 Chromium
RUN npm install puppeteer --unsafe-perm=true --allow-root || true

# 將 Puppeteer 下載的 Chromium binary 連結到 /usr/bin/chromium，讓程式可用固定路徑啟動
RUN set -eux; \
    if node -e "try{console.log(require('puppeteer').executablePath());}catch(e){process.exit(2)}" >/tmp/puppeteer_path 2>/tmp/puppeteer_err; then \
    CHROME_PATH=$(cat /tmp/puppeteer_path); \
    echo "Found puppeteer chromium at: $CHROME_PATH"; \
    # Do not attempt to symlink into /usr/bin (may not be writable in base image).
    # server.js will prefer puppeteer's executablePath at runtime, so no symlink is required.
    else \
    echo "puppeteer executablePath not found:"; cat /tmp/puppeteer_err || true; \
    fi

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]