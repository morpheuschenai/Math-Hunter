# UI 素材工作手冊(給 Codex / 生圖)

這份檔讓你(Codex)能**獨立把整個 UI 變成圖片式**:生圖 → 切圖 → 落地,不用碰玩法邏輯。

## 黃金守則(最重要)

> **UI 的「外觀(chrome)」一律來自圖片素材,絕不用 CSS 畫。**
> 面板、按鈕、徽章、外框的長相 = 九宮格 PNG;CSS 只負責「排版、定位、文字」。
> 禁止用 `linear-gradient / radial-gradient / box-shadow / 帶色 border` 去「畫」一個面板或按鈕。
> `node check_ui.cjs` 會自動擋這件事,違反會 build 失敗。

之前 UI 質感差,就是因為 chrome 被 CSS 畫出來。改成吃圖片就會專業。

## 三方分工

- **Codex(你)**:依 manifest 的 prompt 生「狀態圖表」(一個元件的 normal/pressed/disabled 排在一張圖) → 維護 manifest → 用 kit 類別組裝畫面。
- **使用者**:把你生的圖切成透明背景 PNG,放到 `assets/ui/kit/art/<id>.<state>.png`。
- **Claude**:維護 kit 框架、把元件接到資料、守門與驗證。

## 唯一真相來源

`assets/ui/kit/ui_manifest.json` —— 所有 chrome 元件、尺寸、九宮格邊界、需要的狀態、生圖 prompt 都在這。**要新增元件就改這個檔。**

## 落地流程(四步,記住就好)

1. **生圖**:讀 `ui_manifest.json` 裡某元件的 `prompt` + `artStyle`,生成該元件的各狀態圖(透明背景、指定尺寸)。
2. **切圖**:使用者切成 `assets/ui/kit/art/<id>.<state>.png`(例:`button.primary.normal.png`)。命名必須跟 manifest 的 id 與 state 一致。
3. **產生**:跑 `python3 assets/ui/kit/make_kit.py`。它會偵測 `art/` 有真圖就用真圖、沒有就用佔位圖,並重生 `src/ui-kit.generated.css`。
4. **建置 + 驗證**:`node build.cjs && node check_ui.cjs && node qa.cjs`。

> 重點:有沒有真圖,畫面都能跑(沒真圖用佔位圖)。所以**永遠不需要用 CSS 畫來「先頂著」**。

## 命名規則

`assets/ui/kit/art/<id>.<state>.png`
- `<id>` = manifest 的 key,點改不變(例 `button.primary`、`panel.cream`)。
- `<state>` ∈ `normal / hover / pressed / disabled`(看該元件 manifest 列了哪些)。
- 透明背景、尺寸對齊 manifest 的 `size`。

## 在畫面裡套用(組裝)

CSS class 命名 = `ui-` + id 把點換成減號:

| 元件 id | class | DOM 用法 |
|---|---|---|
| `button.primary` | `.ui-btn .ui-button-primary` | `<button class="ui-btn ui-button-primary">…</button>` |
| `button.jr` | `.ui-btn .ui-button-jr` | 同上 |
| `button.ghost` | `.ui-btn .ui-button-ghost` | 次要按鈕 |
| `panel.cream` | `.ui-panel .ui-panel-cream` | `<div class="ui-panel ui-panel-cream">…</div>` |
| `panel.dark` | `.ui-panel ui-panel-dark` | 深色面板 |
| `badge.pill` | `.ui-badge-pill` | 膠囊標籤 |
| `frame.board` | `.ui-frame-board` | 盤面外框 |

狀態:`:hover` / `:active` 自動切換;程式要強制按下狀態用 `data-state="pressed"`;停用用 `disabled` 或 `.is-disabled`。**已參考實作**:`#startOverlay` 的面板與兩顆按鈕(見 `src/index.html`),照抄即可。

## 新增一個元件(例:想要一個「分頁標籤」)

1. 在 `ui_manifest.json` 的 `ninePatch` 加一筆:
   ```json
   "tab.active": { "color":"#ffc743", "size":[240,96], "slice":[36,40,40,40], "states":["normal"], "use":"分頁", "prompt":"…" }
   ```
2. `python3 assets/ui/kit/make_kit.py` → 自動有佔位圖 + `.ui-tab-active` class。
3. DOM 套 `class="ui-tab-active"`。之後再補真圖即可。

## 給 AI 生圖的範本(整張狀態表)

> 「Cute Chunky Math Quest UI。{元件描述}。一張圖橫向排三格:左=normal、中=pressed(底部變薄、整體下移、略暗)、右=disabled(灰階)。每格 {W}×{H},透明背景,厚黑色描邊約 8px,圓角,扁平玩具風,高彩度。」

生完一張三格圖,使用者切成三個 `<id>.normal/pressed/disabled.png`。

## 千萬別做

- ❌ 用整張完稿當單一背景圖(像 `assets/ui/quest-final` 那種「整頁烤成一張」)來做會變動的畫面——血條、數字、關名會被烤死。會動的畫面一律「元件九宮格 + 文字疊上去」。
- ❌ 用 CSS gradient/box-shadow 畫 chrome。
- ❌ 改 manifest 以外的地方新增素材路徑(集中管理才不會散掉)。
