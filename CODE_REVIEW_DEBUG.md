# 程式碼審視 + Debug 清單(可交給 Codex 執行)

審視範圍:`src/game.main.js`、`src/game.logic.js`、`build.cjs`、`src/game.css`。
下面依嚴重度排序;每項都附:症狀 / 位置 / 根因 / 修法 / 驗證。

> ⚠️ 範圍授權:本清單的 #1 #2 #5 #6 在 `game.main.js` 玩法邏輯層(平常是 Claude 領域、Codex 禁改)。
> 本文件**僅針對下列指名函式授權 Codex 修改**:`tick`、`resolveChain`/`applyResult`、`exitBtn` handler、`startStage`、`startTower`、`spawnEnemy`。
> 不得順手改其他邏輯、數值、判定。每改一項都要跑 `node build.cjs && node check_ui.cjs && node qa.cjs` 全綠才算完成。

---

## #1【高】敵人回合「輸入空窗」——玩家能在敵人出手前偷一步(並行 bug)

**症狀**:打完一條鏈、盤面補滿後、到敵人真正攻擊(延遲 450ms)之間,有約 200–300ms 玩家可以再拖一條鏈送出。點「快轉結算」後更明顯。可能造成 combo 沒正確中斷、`enemy.cd` 失準、或對「即將被洗牌的盤面」操作。

**根因**:`resolveChain()` 設 `locked = true`,但解鎖是在 `tick()` 裡靠「動畫停了就解鎖」:
```js
// tick() 內
if (!busy && locked) { locked = false; solveStart = Date.now(); }
```
敵人攻擊卻是 `applyResult()` 裡的 `setTimeout(..., 450)`(擊殺後的 `spawnEnemy` 是 550ms)。盤面補滿(busy)通常 <200ms 就結束 → `locked` 被提早清掉,但敵人動作還沒發生 → 空窗期可輸入。

**修法**:加一個「待定動作」旗標,擋住 tick 在敵人動作未完成前解鎖。
1. 在狀態宣告區(`let luckyNext...` 那行附近)新增:`let pendingAction = false;`
2. `tick()` 的解鎖條件改成:
   ```js
   if (!busy && locked && !pendingAction) { locked = false; solveStart = Date.now(); }
   ```
3. 在 `applyResult()` 裡**每一個會延遲改變戰局的 setTimeout 排程前**設 `pendingAction = true`,並在該 callback 結束時設回 `false`:
   - 擊殺分支的 `setTimeout(spawnEnemy, 550)`、塔的 `setTimeout(() => { buildTowerFloor...; spawnEnemy(); }, 600)`、`setTimeout(stageClear, 550)`
   - 敵人攻擊分支 `setTimeout(() => { ... }, 450)`
   範例(敵人攻擊):
   ```js
   pendingAction = true;
   setTimeout(() => {
     ... 原本內容 ...
     pendingAction = false;
   }, 450);
   ```
   注意:`spawnEnemy()` / `stageClear()` 自己會重設 `locked`/狀態,所以在呼叫它們的 callback 開頭或結尾把 `pendingAction = false` 即可。
4. `startStage` / `startTower` 重設區補上 `pendingAction = false;`(避免殘留)。

**驗證**:`node qa.cjs` 仍全綠;另在 `qa.cjs` 加一條斷言(見文末「建議新增 QA」)。

---

## #2【中】離開關卡/撤退時,待定計時器沒被取消——會在地圖上「鬼動作」

**症狀**:在結算動畫或敵人出手的空檔按「離開/撤退」,回到地圖後,先前排定的 `setTimeout`(敵人攻擊、找不到解洗牌、換怪)仍會觸發 → 可能扣血、洗一個看不到的盤面、甚至彈出 stageFail 疊層。`confirm()` 對話框會吃掉部分時間使它較難重現,但屬於不穩定的潛在錯誤。

**根因**:`exitBtn` handler 與 `towerEnd` 沒有讓「進行中的這場戰鬥」失效;所有 `setTimeout` 都直接讀 `enemy`/`player`/`tiles`/`target`。

**修法(與 #1 同根,建議一起做):用「戰鬥 epoch 令牌」**。
1. 新增 `let battleEpoch = 0;`
2. 每次「戰局重置」就 `battleEpoch++`:`startStage`、`startTower`、`exitBtn`(離開時)、`towerEnd`。
3. 所有「會改變戰局」的 setTimeout callback 開頭加守衛:
   ```js
   const ep = battleEpoch;
   setTimeout(() => { if (ep !== battleEpoch) return; /* 原內容 */ }, 450);
   ```
   套用到 applyResult 的敵人攻擊、`setTimeout(stageClear,550)`、換怪、塔換層、以及 320ms 的「找不到解洗牌」那段。
4. 這樣離開後 epoch 變了,殘留計時器一律 no-op,#1 的空窗副作用也順帶更安全。

**驗證**:手動——進關卡、打一鏈、立刻按離開;回地圖後血條/盤面不應再變動,也不應彈失敗框。

---

## #3【中】`build.cjs` 只改寫雙引號的 `url("../assets/`,單引號/無引號會漏改 → 部署版圖片 404

**症狀**:Codex 之後在 `game.css` 若寫 `url('../assets/...')` 或 `url(../assets/...)`,`node build.cjs` 產生的根目錄 `index.html` 路徑不會被改寫,部署到 GitHub Pages 後該圖 404(本地 src 預覽卻正常,難察覺)。

**位置**:`build.cjs` 的 `.replaceAll('url("../assets/', 'url("assets/')`(css 與 uikit 兩處)。

**修法**:改成一條 regex 同時處理三種引號:
```js
const fixUrls = s => s.replace(/url\((['"]?)\.\.\/assets\//g, 'url($1assets/');
const css   = fixUrls(read('game.css'));
const uikit = fixUrls(read('ui-kit.generated.css'));
```
**驗證**:`node build.cjs`;`grep -c 'url("\.\./assets' index.html` 應為 0;`node qa.cjs` 綠。

---

## #4【低 / 防呆】`#board` 不可加 transform / scale / border / padding,否則點擊命中會偏移

**現況**:目前 `#board` 只有 box-shadow / filter / border-radius,**不影響座標,是安全的**。但這是給 Codex 的**護欄提醒**:`pos()` 與 `cellAt()` 假設 canvas 版面框 = `BOARD_PX` 1:1(`setupCanvas` 設 `style.width/height = BOARD_PX`)。

**規則**:美化盤面外框請用 box-shadow / outline / 背後另一層 DOM(如 `frame.board` 九宮格)來做,**不要**對 `#board` 用 `transform: scale()`、`padding`、或會改變 border-box 尺寸的 `border`。要做請先告知 Claude,連動改 `pos()`。
**驗證**:`node check_ui.cjs`(已擋 .ui-* 的 CSS 畫);此項以人工 code review 把關。

---

## #5【低】每走一步寫兩次 localStorage(`nh5_events` + `nh5_mastery`)

**症狀**:`endDrag` 每條鏈都 `save('nh5_events')`(EV 陣列最大 8000 筆)+ `save('nh5_mastery')`。低階手機長時間遊玩可能偶有寫入卡頓。

**位置**:`log()`(每次 push 都 save)、`recordMastery()`(每次都 save)。

**修法(非必要,優化)**:節流寫入——例如改為「每 N 次或每 2 秒 flush 一次」,並在 `pagehide`/`visibilitychange` 時強制 flush,避免資料遺失。**注意**:這會碰到 `log`/`recordMastery` 核心,屬 Claude 領域,建議交 Claude 做,不在 Codex 授權內。

---

## #6【低】`solveStart` 在 tick 每次解鎖都重設,污染學習數據的反應時間

**症狀**:`solveStart` 在「魔王登場 banner 解鎖」「教學對話框關閉後」等任何 `locked` 清除時都會重設,使 `solve_ms` 偶爾偏短/偏長。

**位置**:`tick()` 的解鎖行(同 #1)。

**修法(非必要)**:把 `solveStart` 的重設改成只在「真的開始新一題(spawnEnemy / 補滿可動)」時設,而不是所有解鎖。屬 Claude 領域,建議交 Claude。

---

## 建議新增 QA(回歸測試,放 `qa.cjs`)

針對 #1,加一條:打出有效鏈後、在「敵人動作未完成」期間呼叫 `__qa.play()` 應回傳 `busy`(而非成功再出一鏈)。需要在注入的 `__qa` 介面多曝光 `pendingAction`/`locked` 狀態以便斷言。這條能防止 #1 日後回歸。

---

## 執行順序建議
1. 先做 **#1 + #2 一起**(同根因,epoch + pendingAction),這是唯一會影響玩家體驗的真 bug。
2. 再做 **#3**(部署陷阱,5 分鐘)。
3. #4 當規則寫進你的 review checklist。
4. #5 #6 交 Claude 之後排程。

每完成一項:`node build.cjs && node check_ui.cjs && node qa.cjs` 必須全綠;回報改了哪些函式、測試結果、有無動到授權範圍外的程式(預期應為無)。
