# FIGMA → CSS 精準排版標準 (FIGMA_CSS_STANDARD.md)

> **Codex & Claude 共同遵守。** 本文件定義將 Figma 設計稿轉譯為 CSS 的精確規則。
> 每條規則附「為何」說明，以便判斷邊界情境。
> 框架：主容器 440 × 956 px（同 Figma frame 尺寸）。

---

## 1. 座標轉換：Figma absoluteBoundingBox → CSS %

```
left %   = (node.x - frame.x) / frame.width  × 100
top %    = (node.y - frame.y) / frame.height × 100
width %  = node.width  / frame.width  × 100
height % = node.height / frame.height × 100
```

- 用 `position: absolute` + 上述 % 定位每個元素。
- **不靠 flex 推擠位置**：字型渲染差異會讓元素偏移。

**找 Figma frame 原點：** 取 `type=FRAME, width≈440, height≈956` 的 `absoluteBoundingBox.x/y`。

---

## 2. 比例容器（必要前置）

所有 440×956 的比例容器都必須加這兩項：

```css
/* 比例鎖定 */
width: min(100vw, calc(100dvh * 440 / 956), 440px);
aspect-ratio: 440 / 956;
max-width: 440px;

/* 啟用 cqw */
container-type: inline-size;
```

現行容器：`#gachaInner`（Summon）、`#mapZones`（Quest）、`#mapActions`（Quest navbar）、`#mainNav`（共用 navbar）。

---

## 3. 字型大小：用 `cqw` 取代 `vw`

```
font-size: (Figma px / 440) × 100 + cqw
```

| Figma px | CSS cqw |
|---|---|
| 16 | 3.636cqw |
| 19.2 | 4.364cqw |
| 20 | 4.545cqw |
| 33 | 7.5cqw |
| 36 | 8.182cqw |
| 46 | 10.455cqw |
| 60 | 13.636cqw |
| 80 | 18.182cqw |

**為何：** `vw` 在高度受限手機上（容器被 dvh 限縮）會大於容器寬，字就太大。`cqw = container 寬的 1%`，永遠等比。

---

## 4. 文字描邊：Figma 外側 N px → CSS 需要 2N px

```css
-webkit-text-stroke: calc(Figma_stroke × 2) px  #color;
paint-order: stroke fill;  /* 必須！ */
```

**為何：** CSS `-webkit-text-stroke` 是**居中描邊**（一半在字形內、一半在字形外）。加 `paint-order: stroke fill`，fill 蓋掉內半，只剩外半可見。
公式：`CSS stroke = Figma 外側 stroke × 2`

| Figma 外側 | CSS stroke |
|---|---|
| 2px | 4px |
| 6px | 12px |

---

## 5. 背景圖片：Figma `scaleMode: STRETCH` → CSS

```css
background: url("path/to/image.png") left top / 100% 100% no-repeat;
/* 不用 contain / cover */
```

---

## 6. 全域 CSS 陷阱：必須在 scoped 規則顯式重設

CSS 每個屬性獨立計算。全域對同 id 設過的屬性，在 scoped 規則沒有顯式覆蓋時永遠有效。

**作法：** 每次寫新 overlay 的 scoped 規則，先找出全域對同一 id 設過的所有屬性，逐一在 scoped 規則裡重設。

常見已知陷阱：

| 選擇器 | 危險全域屬性 | scoped 重設 |
|---|---|---|
| `#gachaCount` | `max-width: 314px / 326px`, `min-height: 48px`, `display: flex` | `max-width: none !important; min-height: 0 !important; display: block` |
| `#gachaDrawBtn` | `max-width: 330px`, `min-height: 64px`, `display: grid` | `max-width: none !important; min-height: 0; display: flex` |
| `#gachaArt` | `height: 238px`, `overflow: hidden`, `border`, `:before/:after` | 全部 `!important` 覆蓋，`:before/:after { display:none !important }` |
| `.btn.disabled` | `opacity: .5`, `filter: grayscale(.7)` | 在**元素本身**的 `.disabled` 規則加 `opacity: 1; filter: none`（不能在 `::after` 加） |

---

## 7. `opacity` 繼承規則

`opacity` 作用在元素本身，子元素無法反向覆蓋。
**必須在套用 `opacity` 的那一層元素本身設回來，不能設在 `::after`。**

---

## 8. 全域 `position: absolute` 子元素

當容器設為比例容器時，所有直接子元素建議 `position: absolute`：

```css
#gachaInner > * { position: absolute; }
```

這確保 % 定位精確，不受 flex/grid 影響。

---

## 9. Navbar 共用設計

本專案三個頁面（Quest / Monster / Summon）共用 `#mainNav`（`src/index.html`）。

- 尺寸：440 × 139 px（`aspect-ratio: 440 / 139`）
- 背景：`assets/ui/quest/navbar.png`
- Tab 圖片：`assets/ui/quest/tab_<name>_<state>.png`（state: default / selected / pressed）
- Active 狀態：`body:has(#<overlay>:not(.hidden)) #<tab>` → CSS variable `--tab-img` 切換
- 字型：3.636cqw（Figma 16px）/ fw=800 / uppercase / -webkit-text-stroke: 4px #000

**Navigation onclick 模式（mainNav buttons）：**
- 先呼叫 `gachaBack.click()` 和 `teamBack.click()` 關閉當前 overlay
- 再 `setTimeout(80ms)` 後呼叫目標頁的 open button

---

## 附錄：主容器尺寸參考

| 元素 | Figma 尺寸 | CSS |
|---|---|---|
| `#gachaInner` | 440 × 956 | `aspect-ratio: 440/956` |
| `#mapZones` | 440 × 956 | `aspect-ratio:` controlled by `#selectOverlay` |
| `#mainNav` | 440 × 139 | `aspect-ratio: 440/139` |
