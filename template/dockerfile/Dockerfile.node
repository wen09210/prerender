ARG REGISTRY_URL=registry.access.redhat.com
ARG BASE_IMAGE=ubi8/nodejs-20:1-73.1742991506
FROM ${REGISTRY_URL}/${BASE_IMAGE}

USER root
ENV USER=default
ENV USER_UID=1001
ENV USER_GID=100

ENV NODE_TLS_REJECT_UNAUTHORIZED=0

ARG RPM_PACKAGES
ARG NEXUS_URL

RUN if [ -n "${NEXUS_URL}" ]; then \
        RHEL_VERSION=$(rpm -E %{rhel}) && \
        echo -e "[nexus-cdn]\nname=Nexus CDN\nbaseurl=https://${NEXUS_URL}/repository/redhat-ubi${RHEL_VERSION}-proxy/\nenabled=1\ngpgcheck=0\nsslverify=0\n\n[nexus-rocky]\nname=Nexus Rocky\nbaseurl=https://${NEXUS_URL}/repository/rocky-ubi${RHEL_VERSION}-proxy/\nenabled=1\ngpgcheck=0\nsslverify=0\n\n[nexus-epel]\nname=Nexus EPEL\nbaseurl=https://${NEXUS_URL}/repository/epel-ubi${RHEL_VERSION}-proxy/\nenabled=1\ngpgcheck=0\nsslverify=0\n\n" > /etc/yum.repos.d/nexus.repo && \
        echo -e "openssl_conf = default_conf\n[default_conf]\nssl_conf = ssl_sect\n[ssl_sect]\nsystem_default = system_default_sect\n[system_default_sect]\nCipherString = DEFAULT:@SECLEVEL=1" > /etc/ssl/nexus.openssl.cnf && \
        find /etc/yum.repos.d -type f ! -name 'nexus.repo' -delete && \
        export OPENSSL_CONF=/etc/ssl/nexus.openssl.cnf; \
    else \
        yum install -y https://dl.fedoraproject.org/pub/epel/epel-release-latest-8.noarch.rpm && \
        echo -e "[rocky-baseos]\nname=Rocky BaseOS\nbaseurl=https://dl.rockylinux.org/pub/rocky/8/BaseOS/x86_64/os/\nenabled=1\ngpgcheck=0\n\n[rocky-appstream]\nname=Rocky AppStream\nbaseurl=https://dl.rockylinux.org/pub/rocky/8/AppStream/x86_64/os/\nenabled=1\ngpgcheck=0\n" > /etc/yum.repos.d/rocky.repo; \
    fi && \
    yum clean all && yum --setopt=timeout=300 update -y && \
    yum install -y ${RPM_PACKAGES} && \
    yum clean all && rm -rf /var/cache/yum/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /opt/app-root/src

COPY package*.json ./
RUN if [ -n "${NEXUS_URL}" ]; then \
        npm config set strict-ssl false && npm install --reg https://${NEXUS_URL}/repository/npm-all/; \
    else \
        npm install; \
    fi

# 安裝 puppeteer（取得 executablePath API，Chrome 由 RPM 提供）
RUN if [ -n "${NEXUS_URL}" ]; then \
        npm config set strict-ssl false && npm install --reg https://${NEXUS_URL}/repository/npm-all/ puppeteer --unsafe-perm=true --allow-root; \
    else \
        npm install puppeteer --unsafe-perm=true --allow-root; \
    fi

COPY . .

# 設定 Chrome 路徑：優先使用 puppeteer executablePath，fallback 到 yum 安裝的 chromium
RUN CHROME_PATH=$(node -e "console.log(require('puppeteer').executablePath())") && \
    echo "Puppeteer Chrome 位於: $CHROME_PATH" && \
    if [ -f "$CHROME_PATH" ]; then \
        echo "使用 Puppeteer 內建 Chrome" && \
        ln -sf "$CHROME_PATH" /usr/local/bin/chrome && \
        chmod +x "$CHROME_PATH"; \
    elif [ -f "/usr/lib64/chromium-browser/chromium-browser" ]; then \
        echo "使用 yum 安裝的 chromium" && \
        ln -sf /usr/lib64/chromium-browser/chromium-browser /usr/local/bin/chrome; \
    elif [ -f "/usr/bin/chromium-browser" ]; then \
        echo "使用 /usr/bin/chromium-browser" && \
        ln -sf /usr/bin/chromium-browser /usr/local/bin/chrome; \
    else \
        echo "警告: 找不到 Chrome 執行檔，請確認 RPM_PACKAGES 包含 chromium"; \
    fi && \
    echo "=== 驗證 Chrome 安裝 ===" && \
    ls -la /usr/local/bin/chrome && \
    /usr/local/bin/chrome --version || echo "Chrome 版本檢查失敗（容器啟動時可能正常）"

COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

USER $USER_UID

EXPOSE 8080
CMD ["/app/start.sh"]