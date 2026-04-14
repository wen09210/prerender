# Prerender Service

將 JavaScript 渲染後的頁面預先產生靜態 HTML，供 SEO 爬蟲使用。

---

## 環境需求

- Docker
- （部署至 GCP）Google Cloud SDK（`gcloud`）、Artifact Registry 權限

---

## 環境變數說明

| 變數名稱 | 預設值 | 說明 |
|---------|--------|------|
| `PORT` | `8080` | 服務監聽的 Port |
| `CACHE_TTL` | `3600` | 快取存活時間（秒） |
| `CACHE_MAXSIZE` | `100` | 最大快取頁面數量 |
| `PROXY_SERVER` | — | Chrome 使用的代理伺服器，例如 `http://proxy:3128` |
| `NEXUS_URL` | — | （Build 時）私有 Nexus 倉庫網址，不設定則走公開 registry |
| `RPM_PACKAGES` | — | （Build 時）額外安裝的 RPM 套件，空格分隔 |

---

## Docker Build

### 一般環境（公開 registry）

```bash
docker build -t prerender:latest .
```

### 指定 image tag

```bash
docker build -t prerender:1.0.0 .
```

### 使用私有 Nexus registry

```bash
docker build \
  --build-arg NEXUS_URL=your.nexus.host \
  -t prerender:latest .
```

### 推送至 GCP Artifact Registry

```bash
# 設定 Docker 認證
gcloud auth configure-docker asia-east1-docker.pkg.dev

# Build 並 tag
docker build -t asia-east1-docker.pkg.dev/<PROJECT_ID>/<REPO>/prerender-image:latest .

# Push
docker push asia-east1-docker.pkg.dev/<PROJECT_ID>/<REPO>/prerender-image:latest
```

---

## Docker Run

### 基本啟動

```bash
docker run --rm -p 8080:8080 prerender:latest
```

### 指定 Port

```bash
docker run --rm -p 3000:3000 -e PORT=3000 prerender:latest
```

### 調整快取設定

```bash
docker run --rm -p 8080:8080 \
  -e CACHE_TTL=7200 \
  -e CACHE_MAXSIZE=200 \
  prerender:latest
```

### 使用代理伺服器

```bash
docker run --rm -p 8080:8080 \
  -e PROXY_SERVER=http://your-proxy:3128 \
  prerender:latest
```

### 完整參數範例

```bash
docker run --rm \
  -p 8080:8080 \
  -e PORT=8080 \
  -e CACHE_TTL=3600 \
  -e CACHE_MAXSIZE=100 \
  -e PROXY_SERVER=http://your-proxy:3128 \
  --name prerender \
  prerender:latest
```

---

## 使用方式

服務啟動後，將要預渲染的目標 URL 附加在服務網址後面即可：

```
http://localhost:8080/{目標網址}
```

**範例：**

```bash
curl http://localhost:8080/https://www.example.com
```

---

## GCP Cloud Run 部署

```bash
gcloud run deploy prerender-service \
  --image asia-east1-docker.pkg.dev/<PROJECT_ID>/<REPO>/prerender-image:latest \
  --region asia-east1 \
  --platform managed \
  --min-instances 1 \
  --max-instances 3 \
  --concurrency 1 \
  --cpu 1 \
  --memory 4Gi \
  --no-cpu-throttling \
  --execution-environment gen2 \
  --set-env-vars "HOME=/tmp,DBUS_SESSION_BUS_ADDRESS=disabled:" \
  --port 8080
```

> **注意事項：**
> - `--no-cpu-throttling`：Chrome 需要持續 CPU 才能正常啟動，不可省略
> - `--execution-environment gen2`：使用標準 Linux kernel，避免 gVisor 導致 Chrome Segfault
> - `--concurrency 1`：每個實例同時只處理 1 個請求（Chrome 為 CPU 密集型）
> - `--min-instances 1`：保持最少一個熱實例，避免冷啟動失敗
