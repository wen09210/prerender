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

RUN CHROME_PATH=$(which chromium-browser || which chromium) && \
    echo "系統安裝的 Chromium 位於: $CHROME_PATH" && \
    ln -sf "$CHROME_PATH" /usr/local/bin/chrome && \
    chmod +x /usr/local/bin/chrome && \
    echo "=== 驗證 Chrome 安裝 ===" && \
    /usr/local/bin/chrome --version

RUN mkdir -p /app && \
    echo '#!/bin/bash' > /app/start.sh && \
    echo 'export CHROME_BIN=/usr/local/bin/chrome' >> /app/start.sh && \
    echo 'export CHROME_PATH=/usr/local/bin/chrome' >> /app/start.sh && \
    echo 'export PORT=${PORT:-8080}' >> /app/start.sh && \
    echo 'echo "Starting Prerender on port ${PORT}..."' >> /app/start.sh && \
    echo 'exec node server.js' >> /app/start.sh && \
    chmod +x /app/start.sh

USER $USER_UID

EXPOSE 8080
CMD ["/app/start.sh"]