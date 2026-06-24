# Figma「game」frame vs 目前實作:落差檢查與優化建議

來源:`assets/ui-final/ui_final_final/game/`(含 `figma_game_node_raw.json` 完整 spec + @2x 切圖)。
設計畫布:**440 × 956**。字型統一 **Baloo 2 / 800 / 全大寫(UPPER)/ letter-spacing 0 / line-height ≈160%(Auto)**。

---

## A. 字型規格(從 spec 抽出的真值)

| 文字 | 字級 | 行高(px) | 色 | 用途 |
|---|---|---|---|---|
| WAVE 2 / EXIT / Target / SUM / CHAIN / HP / 86% | 16 | 25.6 | #FFFFFF | HUD 標籤 |
| ACT(標籤)| 18 | 28.8 | #000000 | ACT 字(黑) |
| SWAP / STRIKE | 18 | 28.8 | #FFFFFF | 技能名 |
| 18 / 12 / 4(stat 大數值)| 36 | 57.7 | #FFFFFF | Target/SUM/CHAIN 值 |
| 3(ACT 倒數)| 28 | 44.9 | #FFFFFF | 行動倒數 |
| 3(護盾數)| 22 | 35.2 | #FFFFFF | 護盾層數 |
| 7,520 / 12,000 | 12 | 19.2 | #FFFFFF | 敵人 HP 數字 |

全部 Baloo 2、weight 800、letter-spacing 0、行高都是字級 × 1.6(Baloo 2 的 Auto)。

## B. 版面座標(設計 440 寬;@2x 圖需顯示成一半尺寸)

- 敵人場景背景 `image 199`:0,0,440,367 / 盤面背景 `image 198`:0,360,440,408 / 底板:0,619~956
- WAVE 徽章:155,22,128×40 ｜ EXIT:344,22,70×40 ｜ ACT:24,68,70×70 ｜ 護盾:344,68,70×70
- 敵人 HP:94,222,242×34(殼+填充圖 + 置中數字)
- **Stat 列:23,261,394×94 = 三張 130×94 卡**(Target 23 / SUM 155 / CHAIN 287,間距 2),每卡:標籤 16 上、值 36 下
- 玩家 HP:愛心 26,768,46×40；殼 105,771,274×32；HP 標籤 78,774；86% 383,774
- 技能:SWAP(紫)115,822,146×110；STRIKE(橘)268,822,146×110;每顆 icon 52×52 + 名稱 18
- navbar:0,826~956;怪物分頁 26,849

---

## C. 落差表(Figma → 現況 → 建議)

| # | 元件 | Figma spec | 目前實作 | 建議 |
|---|---|---|---|---|
| 1 | **基準字型** | Baloo 2 800 全站 | `body` 仍是 `Avenir Next…`(只有部分元件用 Baloo 2)| 把 `body` 基準字改成 Baloo 2 stack,讓所有 HUD 繼承 |
| 2 | **字級/大寫** | 精確字級 + 全大寫 | 字級用肉眼、未統一、未大寫 | 建一組 `--type-*` token(見 E)+ Latin 標籤 `text-transform:uppercase` |
| 3 | **Stat 列** | 三張 130×94 chunky 卡,值 36px,用 `battle_stat_{target,sum,chain}_normal.png`(_pulse 為強調)| `#targetRow` 一行擠「目標/目前/鏈」小字 | 重build 成三張圖卡;**保留 `#targetVal`/`#curSum`/`#chainInfo` id** 讓 JS 不動,只包外層 |
| 4 | **敵人 HP** | 殼+填充圖 + 12px「x / y」置中 | CSS `.barFill` | 換 `battle_enemy_hp_shell/fill.png`,填充用寬度裁切 |
| 5 | **玩家 HP** | 愛心圖 + 殼+填充 + HP + % | 已有 hpHeart/hpLabel/barFill(接近)| 換成 `battle_player_hp_heart/shell/fill(_low)`,低血用 _low |
| 6 | **ACT 倒數** | `battle_act_badge_normal/warning` + 28px 數字 | `#countdown` 純文字 | 用徽章圖;倒數 ≤1 換 warning 版 |
| 7 | **護盾** | `battle_icon_shield_stack` + 22px 數 | emoji ✨🛡️ | 換圖 + 數字疊上 |
| 8 | **EXIT / WAVE** | `battle_exit_button_*` / `battle_wave_badge` | 文字按鈕 / 文字 | 換圖(EXIT 有 normal/pressed/disabled)|
| 9 | **技能鈕** | `battle_skill_button_{purple,orange}_{normal,pressed,disabled}` 146×110 + icon 52 + 名稱 18 | data-skill CSS icon | 用按鈕框圖(走 ui-kit 九宮格或固定圖)+ 設計版 skill icon |
| 10 | **打擊/連擊 FX** | combo badge(small/med/large/gold)、drag_spark(9 格)、impact(8)、slash(9)、`fx/board_fx_sheet` | CSS combo meter + canvas 粒子 | combo 依 tier 換 badge 圖;拖曳/命中/斬擊播放對應 sprite 影格 |
| 11 | **字型載入** | — | `@import`(render-blocking)放在 CSS 第 1 行 | 改成 index.html `<link rel=preconnect>` + `<link>`,避免閃爍/阻塞 |

---

## D. 一個必須先決定的產品問題:HUD 標籤用英文還中文?

設計稿全是英文(Target / SUM / CHAIN / ACT / SWAP / STRIKE),Baloo 2 對英文與數字最漂亮;但你的遊戲是中文,而 **Baloo 2 沒有中文字符**(中文會 fallback 到 Noto Sans TC,長相不同、也無法大寫)。
- **建議**:這些「短 HUD 標籤」維持英文(與設計 1:1、Baloo 2 最好看,且 Target/SUM/CHAIN 對學數學的小孩是好認的詞),教學/敘事文字仍用中文。
- 若堅持中文標籤:就接受它跟設計稿不會像素一致,並指定中文用 `--font-cjk`(Noto Sans TC 800)。
這題請你定;它決定第 1/2 項怎麼做。

---

## E. 可直接用的字型 token(請放 `game.css` `:root`,數值來自 spec)

```css
:root{
  --font-display:"Baloo 2","Arial Rounded MT Bold",sans-serif;        /* 英數 HUD */
  --font-cjk:"Baloo 2","Noto Sans TC","PingFang TC",sans-serif;       /* 含中文 */
  --type-label:16px;    /* WAVE/EXIT/Target/SUM/CHAIN/HP/% */
  --type-skill:18px;    /* ACT/SWAP/STRIKE */
  --type-stat:36px;     /* 18/12/4 大數值 */
  --type-count:28px;    /* ACT 倒數 */
  --type-count-sm:22px; /* 護盾層數 */
  --type-hpnum:12px;    /* 7,520 / 12,000 */
}
.hudLabel{font-family:var(--font-display);font-weight:800;font-size:var(--type-label);
  line-height:1.6;letter-spacing:0;text-transform:uppercase;color:#fff;}
.hudStat{font-family:var(--font-display);font-weight:800;font-size:var(--type-stat);line-height:1.6;color:#fff;}
```
行高一律 1.6;letter-spacing 一律 0(spec 即 0)。ACT 標籤是黑字(`color:#000`)。

---

## F. 給 Codex 的執行順序(由小到大、由高 CP 到低)

- **P0 字型基礎(最高 CP,改動最小)**:#1 #2 #11 — 設 base 字型、加 `--type-*` token + `.hudLabel/.hudStat`、字型改 `<link>` 載入。做完整體立刻「對版」。
- **P1 Stat 三卡**:#3 — 用 `battle_stat_*` 圖 + 36px 值,保留既有 id。
- **P2 HP 條**:#4 #5 — 敵/我 HP 換圖。
- **P3 技能鈕**:#9 — purple/orange 按鈕框圖(走 ui-kit)+ 設計 skill icon + 18px 名稱。
- **P4 徽章**:#6 #7 #8 — ACT / 護盾 / EXIT / WAVE 換圖。
- **P5 FX**:#10 — combo badge tier 圖 + spark/impact/slash 影格。

每項做完:`python3 assets/ui/kit/make_kit.py`(若新增到 manifest)→ `node build.cjs && node check_ui.cjs && node qa.cjs` 全綠。
注意:#3 動到 `src/index.html` DOM(共同檔)需走 handoff,且**務必保留 `#targetVal/#curSum/#chainInfo/#enemyHpFill/#playerHpFill/#countdown` 等 id**,否則 `game.main.js` 會找不到元素。

---

## G. 我看到最值得先做的三件事
1. **P0 字型基礎**:目前 `body` 還不是 Baloo 2、沒統一字級、沒大寫——這是「為什麼排版對不上」的最大主因,且最好修。
2. **P1 三張 stat 卡**:現在最廉價字、最不像設計的地方;exported 圖已就緒,換上去質感跳最多。
3. **決定 D(英文/中文標籤)**:這題不定,P0/P1 會反覆。
