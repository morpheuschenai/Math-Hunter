# 介面契約 VIEW_CONTRACT.md

> **平台決策(定案):主線 = HTML / web,UI 用「圖片素材(AI 生圖 → 切圖 → 九宮格 ui-kit)」。**
> **Godot 已結案、勿再投入**(舊實驗在 `_archive/math-puzzle-godot/`)。質感一律靠圖片素材達成,不用 CSS 畫 chrome(`check_ui` 會擋)。

> 這份檔定義「玩法邏輯」與「視覺/UI」之間的邊界。
> **Codex 只要照這份契約,就能自由重設計外觀,不必碰邏輯;Claude 保證邏輯只輸出契約裡的語義標記,不寫死外觀。**
> 任何一方要改契約(新增/改名 id、class、CSS 變數、事件),都必須在 `HANDOFF.md` 註明「契約變動」。
> **CSS 排版精確度標準(Figma→CSS 公式、cqw、stroke×2、全域陷阱)**:見 `FIGMA_CSS_STANDARD.md`。

## 1. 檔案擁有權

| 檔案 | 擁有者 | 內容 |
|---|---|---|
| `src/game.css` | **Codex** | 全部外觀:配色、版面、RWD、動畫 keyframes、字體 |
| `assets/characters/**` | **Codex** | 角色 sprite PNG(各表情) |
| `assets/ui/**` | **Codex** | UI / icon PNG(需要時新增) |
| `assets/ui/kit/ui_manifest.json` | **共同** | UI 素材契約(元件×狀態×尺寸×9-slice×prompt);加元件改這裡 |
| `assets/ui/kit/art/**` | **使用者切圖 + Codex 生圖** | 真實九宮格 PNG,命名 `<id>.<state>.png` |
| `src/ui-kit.generated.css` | **生成物,勿手改** | `make_kit.py` 由 manifest 產生 |
| `src/game.logic.js` | **Claude** | solver、盤面生成、數值常數 |
| `src/game.art.js` | **Claude(資料層)** | sprite 對應表 `CHARACTER_ASSETS` / `SPRITE_OF`、render 函式骨架 |
| `src/game.main.js` | **Claude**,但 **`CANVAS_VISUAL` 圍欄內 = Codex 可改** | 狀態機、戰鬥、combo、技能、遙測、關卡流程;圍欄內為純繪圖層(見 4.4) |
| `src/index.html` | **共同**(改動需 handoff) | DOM 骨架。新增/刪 DOM 節點兩邊都要知道 |
| `index.html`(根目錄) | **build 產物,勿手改** | `node build.cjs` 由 src/ inline 而成,用於部署 |

**鐵則**:Claude 的 JS **不得**出現 `el.style.color=...`、寫死的 px 字級、hex 色碼來控制外觀。
要表達狀態 → 切換 class 或寫 `dataset.*`,外觀一律在 `game.css` 決定。

## 2. 建置與測試流程

```
# 改 UI 素材(art/ 或 manifest)後:
python3 assets/ui/kit/make_kit.py   # 產佔位圖 + 生成 src/ui-kit.generated.css
# 改 src/ 後:
node build.cjs     # 把 src/ inline 成根目錄 index.html(部署用單檔)
node check_ui.cjs  # UI 守門:.ui-* 元件不可用 CSS 畫 chrome
node qa.cjs        # 對 index.html 跑自動化遊玩回歸
```

**圖片式 UI(重要)**:UI 外觀(面板/按鈕/徽章/框)一律用九宮格 PNG,不用 CSS 畫。
完整流程見 `UI_ASSET_GUIDE.md`;素材清單見 `assets/ui/kit/ui_manifest.json`。
參考實作:`#startOverlay`(全圖片、零 CSS 畫)。

**發版規則(Claude / Codex 都必守)**:每次完工(改完且本地驗證後)**必跑 `./release.sh "說明"`**——它會自動 `make_kit → build → check_ui → qa → commit → push`,GitHub Actions 隨即部署到固定 Pages 連結。不要只改檔不發版;完整說明見 `RELEASE_PROCESS.md`。
**實驗 / 試做檔請放 `_archive/`(已 gitignore,不會上傳)**,別散在專案根目錄。

Codex 開發時可直接開 `src/index.html`(外連 css/js,即時看 CSS 改動),不必每次 build。
部署到 GitHub Pages 前務必 `node build.cjs`,並上傳 `assets/` 整個資料夾。

## 3. CSS 變數(主題 token,Codex 可自由調)

定義於 `game.css` 的 `:root`:

| 變數 | 用途 |
|---|---|
| `--ink / --ink-2 / --ink-3` | 深色底、頂欄、HUD 暗面 |
| `--stroke` | Cute Chunky 粗描邊主色 |
| `--paper / --paper-2` | 米色資訊面板與獎勵卡 |
| `--sun / --sun-2` | 主 CTA、星星、目標亮點 |
| `--orange / --red / --pink / --sky / --blue / --green / --purple` | 屬性、狀態、珠子與 UI 強調色 |
| `--outline / --outline-thin` | 全域粗框 |
| `--press-shadow / --panel-shadow` | 厚按鈕與面板陰影 |
| `--combo-c1` | 無連擊 / 基本傷害數字色 |
| `--combo-c2` | combo 2–3 |
| `--combo-c3` | combo 4–5 |
| `--combo-c4` | combo 6+ |
| `--combo-size-base / -3 / -4` | 連擊計量器字級(各層級) |

> 新增主題色(例如棋盤格、HUD)請集中放這裡,並在 handoff 註記。

## 4. 邏輯 → 視覺 的語義 hook

### 4.1 連擊 / 傷害(`#comboMeter`、`#dmgPop`)
邏輯只設 `data-tier`(1=無連擊,2=combo2-3,3=combo4-5,4=combo6+);
顏色與字級由 `game.css` 的 `[data-tier="n"]` 決定。
- `#comboMeter`:`.punch`(每次跳動加 130ms)、`.hidden`(連擊中斷時)
- `#dmgPop`:`.big`(最終放大定格)、`.hidden`

### 4.2 角色表情(sprite)
邏輯呼叫 `renderEnemyArt(expr)`,`expr` ∈
`idle / think / happy / attack / hurt / miss / surprise / enraged`。
渲染後外層元素帶 `.motion-<expr>` class → **所有表情動畫的 keyframes 由 `game.css` 定義**。
- 換新角色:Codex 加 `assets/characters/<id>/<expr>.png`,Claude 在 `game.art.js` 的 `CHARACTER_ASSETS` / `SPRITE_OF` 登錄 id。

### 4.3 狀態 class(邏輯切換,外觀 Codex 定)
| class | 套在 | 意義 |
|---|---|---|
| `.enraged` | `#enemyArt` / `#enemyZone` | 魔王狂暴 |
| `.boss` | `#enemyArt` | 魔王體型 |
| `.corrupted` | 角色 | 暗化敵人 |
| `.hit` | `#enemyArt` | 受擊(位移由 JS,光影可由 CSS) |
| `.shake` | `#app` | 畫面震動 |
| `.targeting` | 棋盤 | 拖鏈中 |
| `.jr` | `body` | 幼兒模式主題 |
| `.hidden` | 各 overlay | 顯示/隱藏 |
| `.sel` / `.on` / `.disabled` | 按鈕/選項 | 選取/啟用/停用 |

### 4.3.1 技能 icon 視覺 hook

`#skillRow .skillBtn` 由邏輯建立,但可提供純視覺屬性給 Codex:

| hook | 套在 | 意義 |
|---|---|---|
| `data-skill="plus1/minus1/reroll/split/swapUp/purify/lucky/shield/hint"` | `.skillBtn` | 技能種類,只供 CSS 決定 icon 顏色/符號 |
| `.skillIcon` | `.skillBtn` 內部 span | 純視覺 icon 容器,不可綁定點擊或玩法資料 |

Claude 可重建技能按鈕,但請保留 `data-skill` 與 `.skillIcon`,讓 Codex 能維持一致的 chunky toy icon 外觀。

### 4.3.2 關卡選擇主挑戰卡(Codex v3 視覺 DOM hook)

`renderMap()` 會在 `#mapZones` 內最前方建立一張 mockup 方向的「主挑戰卡」,用來承載當前推薦/預覽關卡。這是**視覺導覽層**,不改關卡解鎖、星星、戰鬥數值或選關邏輯。

| hook | 套在 | 意義 |
|---|---|---|
| `.mapHero` | `#mapZones` 第一個子節點 | 關卡選擇主視覺卡;可依 zone class(`.z0..z5/.zj`)換背景 |
| `.mapHeroSettings` | `.mapHero` 內 | Quest 卡片左上角設定入口;事件只開啟既有 `settingsOverlay` |
| `.mapHeroBadge / .mapHeroMode` | `.mapHero` 內 | STAGE banner 與關卡類型 pill |
| `.mapHeroArtWrap / .mapHeroArt / .mapHeroArrow` | `.mapHero` 內 | 主怪物大圖與左右預覽按鈕 |
| `.mapHeroRewards / .mapHeroRewardEgg / .eggNest / .eggShell` | `.mapHero` 內 | 三顆蛋獎勵資訊卡與 1/2/3 星門檻;`.cracked` 代表已領取/已達成 |
| `.mapHeroStart` | `.mapHero` 內 button | 開始挑戰 CTA;事件仍呼叫既有 `pickCaptainThenStart(stageIndex)` |
| `.uiIcon.reward-coin/star/egg/chest` | inline icon | Codex-owned PNG icon hook |

Claude 若需重構 `renderMap()`,請保留上述 class 或先在 handoff 標註契約變動。原本 `.zone / .zoneHead / .stageRow / .stageBtn` 仍保留作完整選關列表。

Quest 主畫面已移除 mockup 早期殘留的 `.mapHeroHp`、`.mapHeroPlayer`、`.mapHeroAvatar` 顯示區。底部 `#mapActions` 仍使用既有 button id,但視覺語意改成四個 tab:

| id | 顯示 tab | 目前事件 |
|---|---|---|
| `settingsBtn` | Quests | 留在/刷新 Quest 畫面;真正設定入口改由 `.mapHeroSettings` |
| `teamBtn` | Monster | 開啟 `teamOverlay` |
| `gachaBtn` | Summon | 開啟 `gachaOverlay` |
| `towerBtn` | Events | 開啟無限塔 |

### 4.3.3 結算 / 孵化視覺展示 hook(Codex v3)

結果頁與孵化頁使用以下純視覺 hook 來接近 mockup 的 chunky toy reward flow。這些 hook 不承載獎勵計算、抽蛋機率或收藏邏輯。

| hook | 套在 | 意義 |
|---|---|---|
| `#resultHero` | `#resultOverlay` 內 | 結算主角色展示舞台;由 `stageClear()` 填入目前隊長角色 |
| `#resultStars` | `#resultOverlay` 內 | 大星星結果列;邏輯只更新文字,外觀由 CSS 控制 |
| `#resultStats / #drawReward` | `#resultOverlay` 內 | 結算獎勵資訊卡 |
| `#gachaArt` | `#gachaOverlay` 內 | 孵化蛋 / 新角色展示舞台;邏輯可換入 egg 或 character art |
| `#gachaCount / #gachaMsg` | `#gachaOverlay` 內 | 孵化資訊卡 |

Claude 若需重構結算或孵化 DOM,請保留上述 id 或先標註契約變動。內嵌顏色/字級請避免寫在 JS,交由 `game.css` 控制。

### 4.4 棋盤 Canvas 視覺繪製層(Codex 可改的 JS 區段)

`#board` 是 canvas。為了讓 Codex 能把珠子做到 AI mockup 的 chunky toy 方塊風,`game.main.js` 內所有「純繪圖」程式都圍在註解圍欄裡,**Codex 可直接編輯圍欄內的程式**:

```
// === CANVAS_VISUAL_CONFIG_BEGIN ... CONFIG_END ===   // readBoardColors():把 CSS 變數讀進 BOARD_C cache
// === CANVAS_VISUAL_BEGIN ... CANVAS_VISUAL_END ===     // 所有繪圖 helper
```

**圍欄內 Codex 可改的函式**:
`readBoardColors`、`roundRect`、`tileColor` / `tileColorHi` / `beadFill`(色階對應)、
`drawBoardBg`、`drawHintCell`、`drawPathLine`、`drawBead`、`drawParticles`、`drawFloaters`,
以及任何**新增的純繪圖 helper**。

**圍欄規則**:只決定「畫成什麼樣子」。可改珠子厚底/亮面/外框/陰影/圓角、數字字體與描邊/陰影、運算 icon、路徑線、hint 框、粒子顏色。
❌ 不可讀寫遊戲狀態(`tiles`/`path`/`enemy`/`target`/傷害/冷卻…)、不可改判定或任何數值。
幾何與語義(座標、哪種珠、選不選取、要顯示的字)都由 `draw()` 算好後**當參數傳進** helper。

**Codex 禁止修改的函式 / 區塊**(Claude 擁有):
`draw()`(編排層,但外觀都已委派給上面的 helper,通常不必動)、`setupCanvas()` 尺寸邏輯(要改先確認)、
`tiles` 資料結構、`randCell`、`cellAt`、`removeAndRefill`、`chainCalc`、`chainValid`、
`useSkill`、`spendSkill`、`enemyAttack`、`afterSkillBoardCheck`、
以及任何傷害 / 血量 / 冷卻 / 關卡 / 抽蛋 / 收集 / 會改變遊戲結果的數值邏輯。

盤面 CSS 變數(定義於 `game.css` `:root`;字串型=顏色,數值型請給**純數字不加單位**):

| 變數 | 用途 |
|---|---|
| `--board-bg` | canvas 盤面底色 |
| `--board-radius` | 盤面圓角(數值 px) |
| `--board-hint-rgb` | 提示閃框色(**rgb 三元組**如 `255,216,77`,alpha 由程式動態給) |
| `--board-hint-w` | 提示框線寬(數值 px) |
| `--bead-num-1 / -2 / -3` 與 `-hi` | 數字珠底色(1-3 / 4-6 / 7+)與選取高亮 |
| `--bead-digit-1..9` 與 `-hi` | 單一數字珠底色與選取高亮;若存在則優先於三段色階 |
| `--bead-div / -div-hi`、`--bead-mul / -mul-hi`、`--bead-minus / -minus-hi` | 除/乘/減珠 底色 / 選取色 |
| `--bead-banned` | 被封印珠底色 |
| `--bead-radius` | 珠子圓角(數值,相對珠寬比例,0=方形 0.5=圓) |
| `--bead-pad` | 珠與格邊間距(數值,相對 CELL 比例) |
| `--bead-outline` / `--bead-outline-w` | 珠子外框色 / 寬(px;`-w` >0 開啟粗描邊) |
| `--bead-thick` / `--bead-thick-h` | 珠子厚底色 / 高度(px;`-h` >0 開啟立體厚底) |
| `--bead-highlight` | 珠子左上亮面(半透明白=塑膠光澤) |
| `--bead-sel-glow` / `--bead-shadow` | 珠子選取光暈 / 一般陰影 |
| `--bead-text` / `--bead-icon` | 珠面數字色 / `−×÷` 運算符色 |
| `--bead-num-stroke` / `--bead-num-stroke-w` | 數字描邊色 / 寬(px) |
| `--bead-num-shadow` / `--bead-num-shadow-blur` | 數字陰影色 / 模糊(px) |
| `--path-valid / -hit / -over / -under` | 拖鏈路徑線:成立 / 達標但結尾非數字 / 超過 / 未達 |
| `--path-glow` | 路徑線發光基數(數值) |

> 註:`--board-hint-rgb` 必須是「逗號分隔的 rgb 三元組」而非 hex,因為程式要疊動態 alpha。
> chunky 立體參數(outline-w / thick-h / highlight / num-stroke …)預設=關閉,維持現狀;Codex 把它們調大即生效。
> 全螢幕 `flash()` 的語義色(狂暴紅、爆擊金)仍由邏輯依事件給,屬玩法回饋,暫不抽變數。
> 若要新增 UI/icon PNG,放 `assets/ui/**`(Codex 擁有)。

### 4.4.1 z-index ladder

Battle 畫面內的 HUD / card / HP / FX z-index 必須維持在 `0–99`。會蓋在目前戰鬥畫面上的 modal overlay 必須使用 `200+`。

目前 instruction dialogue 使用 `--z-instruction-overlay:240`。之後若為了修 HP、stat card、combo FX 而提高 battle 元件層級,不得超過 99,避免再次蓋到 instruction modal 前景。

### 4.5 全域 DOM id 一覽
overlay:`startOverlay surveyOverlay selectOverlay captainPickOverlay gachaOverlay
resultOverlay failOverlay settingsOverlay splitOverlay`(教學)。
戰鬥 HUD:`enemyArt enemyName enemyHpFill playerHpFill playerHpText skillRow
chainInfo curSum targetVal comboMeter dmgPop flash bossBanner`。
> 改名或刪除任何 id 都會破壞另一方,務必走 handoff。

### 4.6 Battle layout wrappers(Codex v2 視覺骨架)

Phase 2B 新增的 wrapper class 只服務 layout/CSS。**既有 id 全保留,邏輯仍應用 id 查找元素。**

```html
<div id="app" class="battleShell" data-layout="balanced">
  <section class="battleHeader">#topRow</section>
  <section class="enemyPanel">#enemyZone</section>
  <section class="mathHud">#targetRow + #playerRow</section>
  <section class="boardPanel">#boardWrap</section>
  <section class="skillPanel">#captainChip + #skillRow</section>
</div>
```

`#app[data-layout]` 可選值:

| 值 | 用途 |
|---|---|
| `board-first` | 盤面手感優先,敵人區較矮 |
| `balanced` | 預設比例 |
| `showcase` | Boss / 展示演出,敵人區較高 |

目前 `data-layout="balanced"` 固定寫在 HTML。未來若 Claude 要依狀態切比例,只可改 `#app.dataset.layout`,不可改 wrapper 結構。

## 5. 待辦(漸進解耦,非阻塞)
- canvas 珠色/棋盤色尚有寫死 hex → 之後遷移到 CSS 變數(Claude)。
- `flash()` 的全螢幕閃光色仍寫死於 JS → 可改吃 CSS 變數(低優先)。
