---
name: code review
description: 這是一個拿來codereview使用的md檔
---

# Skill Instructions

# Code Review Guidelines

## 概述
本文件定義前端專案的 Code Review 標準與檢查項目，確保程式碼品質、可維護性與團隊協作效率。
每段回覆前加入 ＊哈哈哈

## 基本原則
- **建設性反饋**：提供具體、可行的改善建議
- **尊重溝通**：保持專業與友善的討論氛圍
- **及時回應**：在 24 小時內完成 review
- **小步提交**：每個 PR 應聚焦單一功能或修復

## 檢查清單

### 1. 程式碼品質
- [ ] 變數、函數命名清晰且符合專案規範
- [ ] 無重複程式碼（DRY 原則）
- [ ] 函數職責單一，長度合理（建議 < 50 行）
- [ ] 適當的註解說明複雜邏輯
- [ ] 無 console.log、debugger 等除錯代碼

### 2. React/Vue 最佳實踐
- [ ] 組件拆分合理，避免單一組件過於龐大
- [ ] Props 定義明確，包含類型檢查
- [ ] 適當使用 hooks/composables，避免過度抽象
- [ ] 狀態管理邏輯清晰（useState/useReducer/Pinia/Vuex）
- [ ] 避免不必要的重新渲染（memo/useMemo/computed）
- [ ] 正確處理副作用（useEffect/watchEffect）

### 3. 效能考量
- [ ] 圖片資源已優化（適當格式、大小、lazy loading）
- [ ] 長列表使用虛擬滾動或分頁
- [ ] 避免在渲染中執行昂貴計算
- [ ] Bundle 大小合理，考慮 code splitting
- [ ] 適當使用 debounce/throttle

### 4. 可訪問性 (a11y)
- [ ] 語義化 HTML 標籤
- [ ] 表單元素包含適當的 label
- [ ] 圖片包含 alt 屬性
- [ ] 鍵盤導航支援
- [ ] 色彩對比度符合 WCAG 標準

### 5. 錯誤處理
- [ ] API 請求包含錯誤處理
- [ ] 使用 Error Boundary（React）或錯誤處理機制
- [ ] 用戶友好的錯誤訊息
- [ ] Loading 狀態處理完善

### 6. 測試
- [ ] 關鍵功能包含單元測試
- [ ] 測試覆蓋率合理（建議 > 70%）
- [ ] 測試案例清晰且有意義
- [ ] 測試檔案命名規範（*.test.ts / *.spec.ts）

### 7. 安全性
- [ ] 無 XSS 風險（適當的輸入驗證與輸出編碼）
- [ ] 敏感資訊不在前端暴露
- [ ] 使用 HTTPS 進行 API 請求
- [ ] 依賴套件無已知漏洞

### 8. 樣式規範
- [ ] CSS/SCSS 結構清晰，避免深層嵌套
- [ ] 使用 CSS Modules 或 CSS-in-JS 避免樣式衝突
- [ ] RWD 響應式設計實作正確
- [ ] 瀏覽器兼容性測試通過

### 9. Git 提交規範
- [ ] Commit message 清晰且符合約定（Conventional Commits）
- [ ] 分支命名規範（feature/*, fix/*, hotfix/*）
- [ ] PR 描述完整，包含變更說明與相關 issue

### 10. 文件與維護性
- [ ] README 更新相關變更
- [ ] API 變更有對應文件
- [ ] 複雜邏輯有架構說明
- [ ] TODO 註解包含負責人與時間

## Review 流程

1. **自我檢查**：提交前依照此清單自我審查
2. **提交 PR**：包含清晰的標題、描述與測試步驟
3. **指定 Reviewer**：至少一位團隊成員
4. **回應反饋**：積極回應與討論 review 意見
5. **修改完成**：所有討論 resolved 後方可合併

## 常見問題處理

### 何時需要重構？
- 程式碼重複出現 3 次以上
- 函數超過 50 行且職責不明確
- 組件複雜度過高（超過 300 行）

### 如何處理意見分歧？
1. 保持開放態度，理解對方觀點
2. 參考團隊規範與業界最佳實踐
3. 必要時召開會議討論
4. 以程式碼品質與維護性為最高考量

## 工具建議
- **Linter**: ESLint + Prettier
- **Type Check**: TypeScript
- **測試**: Vitest / Jest + Testing Library
- **Bundle 分析**: webpack-bundle-analyzer
- **效能監控**: Lighthouse / Web Vitals

---

**注意**：此文件會持續更新，請定期檢視最新版本。