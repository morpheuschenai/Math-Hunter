# Current UI Target

用途：新開 Codex 對話時，先讀這份文件，再繼續產剩下頁面的 UI mockup。這份文件是目前 UI 視覺工作的唯一短版目標紀錄。

## 唯一視覺目標

目前 UI 目標是 **Cute Chunky Math Quest**：真正手機遊戲感、粗黑框、厚實 toy-like UI、深藍洞窟背景、cream 資訊卡、黃色主 CTA、可愛怪物與蛋的獎勵儀式感。

主要視覺錨點：

- 使用者提供的高保真四頁圖：Quest / Battle / Result-Hatch / Monster。
- 專案內對照圖：`assets/ui-final/flow-contact-v2/quest_battle_summon_instruction_contact_v2.png`
- Quest / Battle / Monster 的質感已是方向，不要回到低質感拼圖。

## 必讀參考

1. `VISUAL_DIRECTION.md`
2. `UIUX_PRODUCTION_FLOW.md`
3. `QUEST_FINAL_LAYOUT_SPEC.md`
4. `GAME_FINAL_LAYOUT_SPEC.md`
5. `MONSTER_FINAL_LAYOUT_SPEC.md`
6. `SUMMON_FINAL_LAYOUT_SPEC.md`
7. `VIEW_CONTRACT.md`
8. `HANDOFF.md`

## 已定方向

- Quest：高保真大 Boss、Rewards egg panel、Start Challenge、底部 nav。
- Battle：高保真 cave battle、6x6 chunky board、Target/Sum/Chain、HP、技能列。
- Monster：高保真 Monster Team 卡牌、slot、badge、locked card、底部 nav。
- Result / Hatch：附圖中的 CLEAR/HATCH 質感可作為 Summon 的美術參考，但 Summon 不要顯示過關資訊。

## 下一步要產的 mockup

優先產以下頁面，全部要放回同一張 contact sheet 檢查一致性：

1. Summon / 孵化所  
   內容只需要：轉蛋標題、目前抽獎機會、蛋/蛋巢主視覺、HATCH 按鈕、底部 nav。  
   禁止出現：CLEAR、Stage、星星結算、Next Stage、Back to Map。

2. Instruction Dialog / 說明對話框  
   用途：技能說明或特殊怪物屬性說明。  
   形式：Battle 背景暗化 + chunky cream 對話框 + 大 icon + 2-3 個短規則 + OK 按鈕。  
   不做完整新頁，不做長文規則表。

3. Events / 無限塔頁  
   內容：事件/無限塔標題、挑戰入口、目前進度或獎勵、Start/Enter CTA、底部 nav。

4. Monster Detail / 怪物詳情頁  
   內容：角色大圖、隊長技、一般技能、屬性/攻擊力、設定 captain/member CTA。

5. Fail / 失敗結算頁  
   內容：失敗標題、敵人/角色狀態、簡短鼓勵、Retry / Back CTA。

## 生成規則

- 優先用 contact sheet：至少包含 Quest、Battle、目前新頁，讓新頁被既有風格校準。
- 測試/調教生成圖片時，先新增或使用 `testing/` 下的批次資料夾保存；等使用者確認最終版本後，才正式移動到 `assets/`。
- 不要單獨生成一張新頁後直接採用，容易跑風格。
- 文字先保持可讀，不追求最終 100%；最後再集中微調文字。
- 新 mockup 是視覺確認用，不是直接切圖 asset。
- 確認方向後，才進 Figma 排版、標 `SPEC_` frame、輸出正式 assets。

## 禁止回退

- 不要使用早期低質感 `summon-ui-mockup.png` 作為方向。
- 不要回到 CSS 拼圖感、網頁感、玻璃感、AI 漸層。
- 不要把 Summon 做成結算頁。
- 不要把 Instruction 做成教材式長文頁。
- 不要把文字做成固定 PNG，因為後續要支援英文與中文。

## 給新對話的起始指令

請先讀 `CURRENT_UI_TARGET.md`、`VISUAL_DIRECTION.md`、`UIUX_PRODUCTION_FLOW.md`、`HANDOFF.md`。  
接著以現有高保真 Quest/Battle/Monster 風格為唯一 UI 目標，產出剩下頁面的 UI mockup。  
下一步優先做：`Summon / Instruction / Events / Monster Detail / Fail` 的 contact sheet。  
所有新頁都必須和 Quest/Battle/Monster 放在同一張圖中檢查一致性。
