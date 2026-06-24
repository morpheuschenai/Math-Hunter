# 給 Codex 的任務:做出主按鈕(button.primary)的圖片素材

> 用法:把下面整段貼給 Codex。這是「圖片式 UI」的第一個實作,做完開始畫面的金色按鈕就會從佔位圖變成真圖。

---

$gamestudio 你要做數字獵人的第一個正式 UI 素材:主按鈕 `button.primary`。請嚴格照圖片式 UI 流程,不要用 CSS 畫外觀。

## 先讀
- `UI_ASSET_GUIDE.md`(黃金守則 + 四步流程)
- `assets/ui/kit/ui_manifest.json` 裡的 `button.primary` 這筆

## 規格(以 manifest 為準)
- id:`button.primary`
- 尺寸:每個狀態 384 × 132 px,透明背景(去背 PNG)
- 九宮格角落:上 40 / 右 44 / 下 52 / 左 44(角落不可被拉伸,中段才拉伸)
- 需要狀態:`normal`、`pressed`、`disabled`
- 風格:Cute Chunky Math Quest——金黃色、厚黑描邊(約 8px)、圓角、底部厚 lip 立體感、頂部小亮面、扁平高彩度,跟 `assets/ui-concepts/cute-chunky-math-quest-board.png` 一致

## 生圖 prompt(可直接用,生一張三格表)
> "Cute Chunky Math Quest UI button, golden-yellow rounded pill with thick black outline and thick bottom lip (3D toy), small top gloss. One image, three cells side by side: left = normal, middle = pressed (bottom lip thinner, whole button shifted down, slightly darker), right = disabled (desaturated gray). Each cell 384×132, transparent background, flat, high-saturation, no realistic gradient."

## 落地步驟
1. 生出上面的三格狀態表。
2. 切成三張透明 PNG,放到(檔名必須一字不差):
   - `assets/ui/kit/art/button.primary.normal.png`
   - `assets/ui/kit/art/button.primary.pressed.png`
   - `assets/ui/kit/art/button.primary.disabled.png`
   每張 384×132、透明背景。
3. 跑 `python3 assets/ui/kit/make_kit.py`(它偵測到 art/ 有真圖就會自動改用真圖、覆蓋佔位圖規則)。
4. 跑 `node build.cjs && node check_ui.cjs && node qa.cjs`,三個都要綠。

## 驗收
- 開始畫面(`#startOverlay`)的「⚔️ 數字獵人」按鈕應顯示你的真圖,不再是佔位圖。
- 按下去要看得到 `pressed` 狀態(`:active`)。
- `check_ui.cjs` 通過(代表你沒有用 CSS 畫 chrome)。

## 禁止
- ❌ 不要用 `linear-gradient / box-shadow / 帶色 border` 去畫按鈕外觀(守門會擋)。
- ❌ 不要改 `src/game.main.js` / `game.logic.js` 的玩法邏輯,也不要改 `make_kit.py` 的輸出規則。
- ❌ 不要動 manifest 以外的素材路徑。

## 完成後(接著做)
照同樣流程做 `button.jr`(藍色,規格同 manifest),開始畫面的「🐣 小小獵人」就也會變真圖。之後再往 `panel.cream`、`badge.pill` 等推進。

回報時附:生了哪些檔、`make_kit.py` 輸出、build/check_ui/qa 結果、有沒有改到玩法(預期應為無)。
