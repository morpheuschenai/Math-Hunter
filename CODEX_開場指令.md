# 給 Codex 的開場指令(可直接貼)

> 用法:在 Codex 開啟這個專案後,把下面整段貼進去當「專案規則 / 第一則指令」。

---

$gamestudio 你負責這個遊戲專案的「視覺與 UI/UX」。核心玩法與架構由另一位 agent(Claude)負責。請嚴格遵守以下協作規則。

## 你的職責(只動這些檔)
- `src/game.css` — 全部外觀:配色、版面、RWD、字體、所有動畫 keyframes
- `assets/characters/**` — 角色 sprite PNG(各表情)
- 視覺相關的 DOM 微調只能改 `src/index.html`,且要在交接區註明

## 絕對不要碰
- `src/game.logic.js`、`src/game.art.js`、`src/game.main.js`(玩法邏輯,Claude 擁有)
- 根目錄 `index.html`(是 build 產物,改了會被覆蓋)
- `math-chain-v10.html`(凍結快照)

## 動手前先讀
1. `VIEW_CONTRACT.md` — 介面契約(id / class / CSS 變數 / 事件 / 擁有權)
2. `HANDOFF.md` — 目前狀態與風險
3. 現有 `src/game.css` 與 `src/index.html` 結構,沿用既有慣例

## 外觀只透過契約做,不要自己發明
- 顏色/字級集中在 `game.css` 的 `:root` CSS 變數(如 `--combo-c1..c4`、`--combo-size-*`)
- 連擊/傷害用 `[data-tier="1..4"]` 選擇器決定色與字級(`data-tier` 由邏輯設定,你只定外觀)
- 角色表情動畫綁定 `.motion-idle/think/happy/attack/hurt/miss/surprise/enraged`
- **不要改任何 DOM id 或邏輯用到的 class 名**;真要改 → 先在交接區標「契約變動」並等確認

## 開發與驗證流程
- 開發預覽:直接開 `src/index.html`(外連 css/js,即時看 CSS 改動)
- 交付前:`node build.cjs`(inline 成單檔 index.html)→ `node qa.cjs`(回歸,必須全綠)
- 部署 GitHub Pages:上傳 build 後的 `index.html` + 整個 `assets/` 資料夾

## 每次重要回覆結尾,附上交接區塊
```text
【交接狀態】
- HANDOFF.md 是否已更新:
- 本次修改檔案:
- 契約變動(VIEW_CONTRACT):無 / 說明
- 測試結果(build + qa.cjs):
- 目前風險:
- 下一個最安全任務:
```

## 重大動作前先問
大改版面結構、刪 DOM 節點、改契約、發布上傳前,先暫停詢問,不要逕行執行。
