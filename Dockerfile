FROM registry.access.redhat.com/ubi8/nodejs-20:1-73.1742991506

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
    yum install -y chromium nss alsa-lib atk cups-libs gtk3 libXcomposite ${RPM_PACKAGES} && \
    yum clean all && rm -rf /var/cache/yum/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /opt/app-root/src

COPY package*.json ./
RUN if [ -n "${NEXUS_URL}" ]; then \
        npm config set strict-ssl false && npm install --reg https://${NEXUS_URL}/repository/npm-all/ --unsafe-perm=true --allow-root; \
    else \
        npm install --unsafe-perm=true --allow-root; \
    fi

COPY . .

RUN echo "=== 列出 chromium 安裝目錄 ===" && \
    ls -lah /usr/lib64/chromium-browser/ 2>/dev/null || true && \
    ls -lah /usr/lib/chromium-browser/ 2>/dev/null || true && \
    echo "=== 尋找最大的 Chromium 相關 binary ===" && \
    # 找大於 10MB 的 chromium 相關 ELF binary（真正的可執行檔）
    CHROME_REAL=$(find /usr/lib64 /usr/lib -maxdepth 3 -type f \( -name "chromium-browser" -o -name "chromium" \) -size +10M 2>/dev/null | head -1) && \
    if [ -z "$CHROME_REAL" ]; then \
        echo "找不到大型 binary，列出所有 chromium 相關檔案：" && \
        find /usr/lib64 /usr/lib -name "chromium*" -type f 2>/dev/null | xargs ls -lah 2>/dev/null && \
        # 使用 .sh 的 parent dir 找真正 binary
        CHROME_REAL=$(find /usr/lib64/chromium-browser -type f -size +1M 2>/dev/null | head -1); \
    fi && \
    echo "真正的 Chromium binary: $CHROME_REAL" && \
    ln -sf "$CHROME_REAL" /usr/local/bin/chrome && \
    chmod +x /usr/local/bin/chrome && \
    echo "=== 驗證 ===" && \
    ls -lah /usr/local/bin/chrome && \
    ls -lah "$CHROME_REAL"

COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

USER $USER_UID

EXPOSE 8080
CMD ["/app/start.sh"]