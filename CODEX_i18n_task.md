# Codex 任務：game.main.js i18n 字串替換

## 背景
`src/i18n.js` 已建立完整的雙語字典（繁體中文 / 英文）和 `t(key, vars)` 翻譯函式。
`src/index.html` 已更新：靜態 HTML 文字加了 `data-i18n` 屬性，問卷 `data-v` 已改成中性 code。
**你的任務：把 `src/game.main.js` 裡的中文硬編碼字串替換成 `t()` 呼叫。**

## 規則
- **只改 `src/game.main.js`，不碰其他檔案**
- `t(key)` 純文字；`t(key, { n: value })` 含插值變數（對應字典的 `{n}` 佔位符）
- 只替換**顯示給玩家看的文字**；JS 邏輯 key（如 localStorage key、CSS class 名稱）**絕對不能改**
- 改完跑 `node build.cjs && node qa.cjs` 確認全過

---

## 一、SKILL_DEFS 物件（第 2–13 行附近）

把每個技能的 `name` 和 `tip` 改成 `t()` 呼叫：

```js
// 改前
plus1:  { ic:'✏️', name:'加一',  cd:3, type:'target',  tip:'點一顆珠，讓它 +1（9 會變回 1）' },

// 改後
plus1:  { ic:'✏️', name:()=>t('skill.plus1.name'),  cd:3, type:'target',  tip:()=>t('skill.plus1.tip') },
```

**注意**：`name` 和 `tip` 改成 getter function（`()=>t(...)`），所有引用 `sp.name`、`s.name`、`SKILL_DEFS[id].name`、`SKILL_DEFS[id].tip` 的地方需要加 `()` 呼叫（`sp.name()`、`s.name()`）。
如果有多處引用，評估後可選擇直接把值改成 `t()` string literal（非 getter），在 `buildSurvey` / render 時動態呼叫，哪種改動量少用哪種。

**技能對應 key（共 8 個）**：
| 技能 id | name key | tip key |
|---------|----------|---------|
| `plus1` | `skill.plus1.name` | `skill.plus1.tip` |
| `minus1` | `skill.minus1.name` | `skill.minus1.tip` |
| `reroll` | `skill.reroll.name` | `skill.reroll.tip` |
| `split` | `skill.split.name` | `skill.split.tip` |
| `swapUp` | `skill.swapUp.name` | `skill.swapUp.tip` |
| `purify` | `skill.purify.name` | `skill.purify.tip` |
| `lucky` | `skill.lucky.name` | `skill.lucky.tip` |
| `shield` | `skill.shield.name` | `skill.shield.tip` |

---

## 二、ATTRS 物件（第 14 行）

```js
// 改前
const ATTRS = { odd:{n:'奇數系',c:'#ff9b3d'}, even:{n:'偶數系',c:'#5b8def'}, prime:{n:'質數系',c:'#b07ce8'}, multi:{n:'倍數系',c:'#57b85e'} };

// 改後
const ATTRS = { odd:{n:()=>t('attr.odd'),c:'#ff9b3d'}, even:{n:()=>t('attr.even'),c:'#5b8def'}, prime:{n:()=>t('attr.prime'),c:'#b07ce8'}, multi:{n:()=>t('attr.multi'),c:'#57b85e'} };
```

所有引用 `ATTRS[x].n` 的地方加 `()` → `ATTRS[x].n()`。

---

## 三、CHARS 陣列（第 16–24 行）

```js
// 改前
{ id:'kiki', name:'奇奇', attr:'odd', skill:'plus1', pool:0 },

// 改後
{ id:'kiki', name:()=>t('char.kiki.name'), attr:'odd', skill:'plus1', pool:0 },
```

所有 8 個角色都改，並在引用 `sp.name` 的地方加 `()`。

**角色對應 key**：
`kiki→char.kiki.name`, `oo→char.oo.name`, `prima→char.prima.name`, `swapy→char.swapy.name`,
`starle→char.starle.name`, `guardy→char.guardy.name`, `dubdragon→char.dubdragon.name`, `munchdragon→char.munchdragon.name`

---

## 四、CAPTAIN_DEFS 物件（第 30–42 行）

把 `name`、`desc`、`calc` 裡的 `tag` 字串全部改成 `t()`：

```js
// 改前
prime: { name:'質數共鳴', ic:'💠', c:'#b07ce8',
  desc:'路徑每串 1 顆質數珠（2·3·5·7），傷害 +18%',
  calc: cc => ({ mult: 1 + 0.18 * cc.primes, proc: cc.primes > 0, tag: cc.primes ? `質×${cc.primes}` : '' }) },

// 改後
prime: { name:()=>t('captain.prime.name'), ic:'💠', c:'#b07ce8',
  desc:()=>t('captain.prime.desc'),
  calc: cc => ({ mult: 1 + 0.18 * cc.primes, proc: cc.primes > 0, tag: cc.primes ? t('captain.prime.tag', { n: cc.primes }) : '' }) },
```

**隊長技對應 key（共 4 個）**：
| attr | name key | desc key | tag key |
|------|----------|----------|---------|
| `prime` | `captain.prime.name` | `captain.prime.desc` | `captain.prime.tag` |
| `odd` | `captain.odd.name` | `captain.odd.desc` | `captain.odd.tag` |
| `even` | `captain.even.name` | `captain.even.desc` | `captain.even.tag` |
| `multi` | `captain.multi.name` | `captain.multi.desc` | `captain.multi.tag` |

---

## 五、STAGES 陣列（第 49–100 行）

每個 stage 的 `name` 改成 `t('stage.KEY')`；ZONES 陣列的 `n` 改成 `t('zone.N')`：

```js
// 改前
{ key:'1', name:'草原・一', zone:0, ... }

// 改後
{ key:'1', name:()=>t('stage.1'), zone:0, ... }
```

**Stage key 對應**：
`1→stage.1`, `2→stage.2`, `3→stage.3`, `4→stage.4`, `5→stage.5`, `6→stage.6`,
`7→stage.7`, `8→stage.8`, `m1→stage.m1`, `m2→stage.m2`, `m3→stage.m3`,
`e1→stage.e1`, `e2→stage.e2`, `e3→stage.e3`, `j1→stage.j1`, `j2→stage.j2`, `j3→stage.j3`, `j4→stage.j4`

**Zone 對應**：
```js
const ZONES = [
  { n:()=>t('zone.0'), cls:'z0' }, { n:()=>t('zone.1'), cls:'z1' },
  { n:()=>t('zone.2'), cls:'z2' }, { n:()=>t('zone.3'), cls:'z3' },
  { n:()=>t('zone.4'), cls:'z4' },
  { n:()=>t('zone.5'), cls:'z5' },
];
// Jr zones:
{ n:()=>t('zone.jr.a'), cls:'zj' }, { n:()=>t('zone.jr.b'), cls:'zj' }
```

---

## 六、無限塔關卡名稱動態生成（第 1672 行附近）

```js
// 改前
key: 'tower', name: `🗼 無限塔 ${floor}F`, zone: 4,

// 改後
key: 'tower', name: () => `🗼 ${LANG === 'en' ? 'Infinite Tower' : '無限塔'} ${floor}F`, zone: 4,
```

---

## 七、Toast 訊息（以下每行一個替換）

| 原始字串 | 替換後 |
|---------|--------|
| `` `還要 ${skillCd[sp.skill]} 條鏈才能再用` `` | `t('toast.skill.cd', { n: skillCd[sp.skill] })` |
| `` `再打 ${hintCd} 條鏈就能再提示` `` | `t('toast.hint.cd', { n: hintCd })` |
| `'咦，先打一條鏈看看吧！'` | `t('toast.hint.no_chain')` |
| `'找不到解，盤面洗牌！'` | `t('toast.no_sol')` |
| `'運算珠不能加一'` | `t('toast.op_plus1')` |
| `'9 轉了一圈變回 1！'` | `t('toast.wrap_9to1')` |
| `'運算珠不能減一'` | `t('toast.op_minus1')` |
| `'1 轉了一圈變成 9！'` | `t('toast.wrap_1to9')` |
| `'最上排沒有上面可以換！'` | `t('toast.swap_top')` |
| `'運算珠不能分裂'` | `t('toast.op_split')` |
| `'1 沒辦法再拆了！'` | `t('toast.split_1')` |
| `'最上排不能分裂（上面沒有位置）'` | `t('toast.split_top')` |
| `` `⚠️ 繪製錯誤：${e.message}` `` | `t('toast.draw_err', { msg: e.message })` |
| `'÷ 珠要整除才能用！(這個數除不盡)'` | `t('toast.div_not_clean')` |
| `'鏈不能以運算珠（−／×）結尾！'` | `t('toast.chain_end_op')` |
| `` `要湊出 ${enemy.divisor} 的倍數！${cc.sum} 不是…` `` | `t('toast.divisor_miss', { n: enemy.divisor, sum: cc.sum, n2: enemy.divisor*2, n3: enemy.divisor*3 })` |
| `` `等分盾！要連剛好 ${enemy.divN} 顆…` `` | `t('toast.equal_split_bad', { divN: enemy.divN, val: target/enemy.divN, target })` |
| `` `奇數盾！鏈裡要有 ${enemy.needOdd} 顆以上奇數 🔆` `` | `t('toast.odd_shield', { n: enemy.needOdd })` |
| `` `共鳴盾！要連 ${enemy.needRun} 顆相同數字 🔢` `` | `t('toast.resonance_shield', { n: enemy.needRun })` |
| `` `鏈太短了！這隻怪需要 ${enemy.minLen} 顆以上 🛡️` `` | `t('toast.chain_short', { n: enemy.minLen })` |
| `'沒有抽蛋機會了，去過關拿星星！'` | `t('toast.no_draws')` |
| `'🔓 已解鎖所有關卡'` / `'🔒 恢復循序解鎖'` | `t('toast.unlock.on')` / `t('toast.unlock.off')` |
| `'已清除'` | `t('toast.cleared')` |
| `'請先選小朋友的年齡（必填）🙂'` | `t('toast.survey.age')` |
| `'點下方卡片可更換隊長'` / `'點下方卡片選隊長'` | `t('toast.captain.change')` / `t('toast.captain.pick')` |
| `'點下方卡片可更換隊員'` / `'點下方卡片選隊員'` | `t('toast.member.change')` / `t('toast.member.pick')` |
| `` `已匯出 ${EV.length} 筆事件（檔案＋剪貼簿）` `` | `t('toast.exported', { n: EV.length })` |
| `'淨化成功！✨'` | `t('toast.purified')` |

---

## 八、Confirm 對話框

| 原始 | 替換後 |
|------|--------|
| `'要從無限塔撤退嗎？\n已拿到…'` | `t('confirm.tower.retreat')` |
| `'要離開這一關回地圖嗎？…'` | `t('confirm.stage.exit')` |
| `'換一位小朋友？\n會清除…'` | `t('confirm.new_tester')` |
| `'清除所有測試數據、星星與收集進度？'` | `t('confirm.clear')` |

---

## 九、浮字特效（addFloater 第一個參數）

| 原始 | 替換後 |
|------|--------|
| `'🍀 下一鏈 ×1.5！'` | `t('floater.lucky')` |
| `'🛡️ 護盾展開！'` | `t('floater.shield')` |
| `` `🔢 ${cc.runVal}×${cc.maxRun} 共鳴！` `` | `t('floater.resonance', { v: cc.runVal, n: cc.maxRun })` |
| `` `🗼 ${towerFloor}F 通過！🥚+1` `` | `t('floater.tower_pass', { n: towerFloor })` |
| `'搗蛋！打亂了珠珠 🌀'` | `t('floater.shuffled')` |
| `'🛡️ 擋下了！'` | `t('floater.blocked')` |
| `` `受到 ${enemy.atk} 傷害！` `` | `t('floater.damage', { n: enemy.atk })` |
| `` `亂數！目標 → ${target}` `` | `t('floater.chaos_target', { n: target })` |
| `` `封印亂換！🚫 ${d}` `` | `t('floater.ban_changed', { d })` |
| `'傳說拆解！！！'` | `t('floater.praise.legendary')` |
| `'超絕拆解！！'` | `t('floater.praise.ultra')` |
| `'厲害！'` | `t('floater.praise.great')` |
| `'精彩！'` | `t('floater.praise.nice')` |
| `'減法！'` | `t('floater.minus')` |

---

## 十、狂暴訊息（`let msg = ...` 區塊，第 1403–1420 行附近）

```js
// 改前
let msg = isJr() ? '⚠️ 大王生氣了！搗蛋會變快！' : '⚠️ 狂暴化！攻擊變強、行動變快！';
// 改後
let msg = isJr() ? t('enrage.jr') : t('enrage.default');
```

| 原始 | 替換後 |
|------|--------|
| `` `⚠️ 狂暴化！硬殼變更硬：需要 ${enemy.minLen} 顆以上的鏈！` `` | `t('enrage.shell', { n: enemy.minLen })` |
| `'⚠️ 狂暴化！封印會一直亂換！'` | `t('enrage.ban')` |
| `` `⚠️ 狂暴化！共鳴盾變強：要連 ${enemy.needRun} 顆相同數字！` `` | `t('enrage.resonance', { n: enemy.needRun })` |
| `` `⚠️ 狂暴化！等分盾變強：要分成 ${enemy.divN} 等份！` `` | `t('enrage.equal', { n: enemy.divN })` |
| `` `⚠️ 狂暴化！整除盾變強：要湊出 ${enemy.divisor} 的倍數！` `` | `t('enrage.divisor', { n: enemy.divisor })` |
| `'⚠️ 魔王狂暴化！攻擊變強、目標會一直亂變！'` | `t('enrage.chaos')` |
| say 裡的 `` isJr() ? '大王生氣了！加油！' : '魔王生氣了！小心！' `` | `isJr() ? t('voice.enrage.jr') : t('voice.enrage.std')` |

---

## 十一、語音行（say() 呼叫）

| 原始 | 替換後 |
|------|--------|
| `'找找看，亮亮的珠珠'` | `t('voice.hint')` |
| `'連擊！'` | `t('voice.combo')` |
| `'太棒了！'` | `t('voice.great')` |
| `'哎呀，怪物搗蛋了！'` | `t('voice.shuffle')` |
| `'歡迎來到小小世界！'` | `t('voice.welcome.jr')` |
| `'出發吧，數字獵人！'` | `t('voice.welcome.std')` |
| `'無限塔結束了！'` | `t('voice.tower_end')` |
| `'過關！太厲害了！'` | `t('voice.win')` |
| `` `目標變成 ${target}` `` | `t('voice.chaos_target', { n: target })` |
| `` `封印變成 ${d}` `` | `t('voice.ban_changed', { d })` |
| `` `${sp.name}升級了！` `` | `t('voice.levelup', { name: sp.name() })` |
| `` `新夥伴${sp.name}！` `` | `t('voice.new_char', { name: sp.name() })` |

---

## 十二、教學字串（teach() 呼叫，第 1325–1757 行附近）

```js
// 改前
teach('resonance', '✖️ 同數共鳴 = 乘法！',
  `你剛剛打出了 ${cc.runVal}×${cc.maxRun}`,
  `你剛剛把<b>幾顆一樣…`);

// 改後
teach('resonance',
  t('teach.resonance.title'),
  t('teach.resonance.cond', { v: cc.runVal, n: cc.maxRun }),
  t('teach.resonance.body', { v: cc.runVal, n: cc.maxRun }));
```

**教學 key 對應**：
| teach id | title key | cond key | body key |
|----------|-----------|----------|---------|
| `resonance` | `teach.resonance.title` | `teach.resonance.cond` | `teach.resonance.body` |
| `tower` | `teach.tower.title` | _(無 cond)_ | `teach.tower.body` |
| `minus` | `teach.minus.title` | _(無 cond)_ | `teach.minus.body` |
| `mul` | `teach.mul.title` | _(無 cond)_ | `teach.mul.body` |
| `divbead` | `teach.divbead.title` | _(無 cond)_ | `teach.divbead.body` |
| `captain` | _(動態)_ | `t('teach.captain.cond', { ic: capD.ic, name: capD.name() })` | `t('teach.captain.body', { c: capD.c, desc: capD.desc() })` |

---

## 十三、動態 UI 字串

| 位置 | 原始 | 替換後 |
|------|------|--------|
| renderMap — mapTitle | `` isJr() ? '🐣 小小世界' : '🗺️ 數界地圖' `` | `t(isJr() ? 'map.title.jr' : 'map.title.std')` |
| renderMap — modeBtn | `` isJr() ? '🔁 切換到 數字獵人' : '🔁 切換到 小小獵人' `` | `t(isJr() ? 'settings.mode.to.std' : 'settings.mode.to.jr')` |
| renderMap — unlockBtn | `` UNLOCKALL ? '🔓 全解鎖:開' : '🔒 全解鎖:關' `` | `t(UNLOCKALL ? 'settings.unlock.on' : 'settings.unlock.off')` |
| renderMap — gachaBtn | `` DRAWS > 0 ? `🥚 孵化所 (${DRAWS})` : '🥚 孵化所' `` | `DRAWS > 0 ? t('map.gacha.draws', { n: DRAWS }) : t('map.gacha')` |
| renderMap — starHint | 長字串 | `t('map.star.hint', { avg: th.avg, max: th.max })` |
| renderMap — towerBtn | `'🗼 無限塔'` | `t('map.tower')` |
| renderMap — teamBtn | `'👥 我的數靈'` | `t('map.team')` |
| renderMap — settingsBtn | `'⚙️ 設定'` | `t('map.settings')` |
| renderGacha — gachaCount | `` `抽蛋機會 <span…>${DRAWS}</span> 次` `` | `t('gacha.count', { n: DRAWS })` |
| renderGacha — drawBtn text | `` DRAWS > 0 ? '孵化一次' : '沒有機會了' `` | `DRAWS > 0 ? t('gacha.draw.btn') : t('gacha.draw.empty')` |
| renderGacha — gachaMsg | 兩段文字 | `t(DRAWS > 0 ? 'gacha.msg.ready' : 'gacha.msg.empty')` |
| renderGacha — result levelup | `` `<b>${sp.name}</b> 升級了！Lv${COLL[spId]}…` `` | `t('gacha.result.levelup', { name: sp.name(), lv: COLL[spId] })` |
| renderGacha — result new | 長字串 | `t('gacha.result.new', { name: sp.name(), attr: ATTRS[sp.attr].n(), skillIc: SKILL_DEFS[sp.skill].ic, skillName: SKILL_DEFS[sp.skill].name(), capIc: capD.ic, capName: capD.name() })` |
| towerResult — title | `` died ? '🗼 被擊倒了…' : '🗼 無限塔結算' `` | `t(died ? 'tower.result.died' : 'tower.result.title')` |
| towerResult — bonusMsg | 長字串 | `t('tower.result.bonus', { peak: towerPeak, bonus })` |
| result — title | `'🎉 淨化成功！'` | `t('result.title.win')` |
| result — clearFeedbackText | 3 段條件字串 | 用 `t('result.feedback.1star')` / `t('result.feedback.2star', { max })` / `t('result.feedback.3star')` |
| result — draws earned | 長字串 | `t('result.draws.earned', { stars, earned, total: DRAWS }) + (stars < 3 ? t('result.draws.3star_hint', { avg: th.avg, max: th.max }) : '')` |
| result — draws already | 長字串 | `t('result.draws.already', { prev: prevStars })` |
| result — gachaGoBtn | `` `🥚 前往孵化所抽蛋（${DRAWS}）` `` | `t('result.gacha_btn', { n: DRAWS })` |
| splitDesc | 長字串 | `t('split.desc', { v })` |
| skill hint button | `<b>提示</b>找找看` | `t('skill.hint.label')` （mode=html） |
| team — captain label | 長字串 | `t('team.captain.label', { name: SP(EQUIP[0]).name(), c: capD.c, ic: capD.ic, capName: capD.name(), desc: capD.desc() })` |
| team — locked | `` `${sp.name} 尚未解鎖` `` | `t('team.locked', { name: sp.name() })` |
| team — go_gacha | `` `🥚 去孵化所${DRAWS > 0 ? `（${DRAWS} 次）` : ''}` `` | `DRAWS > 0 ? t('team.go_gacha.draws', { n: DRAWS }) : t('team.go_gacha')` |
| team — back | `'回地圖'` | `t('team.back')` |
| bossBanner | `` `⚠️ ${name} ⚠️<small>數界的混亂之源…</small>` `` | `` `⚠️ ${name} ⚠️<small>${t(enemy.bossKind === 'boss' ? 'boss.chaos' : 'boss.zone')}</small>` `` |
| settings — modeBtn | 同 renderMap | 同上 |
| settings — unlockBtn | 同 renderMap | 同上 |
| say 裡的 welcome | `'歡迎來到小小世界！'` / `'出發吧，數字獵人！'` | `t('voice.welcome.jr')` / `t('voice.welcome.std')` |

---

## 十四、遷移 survey 存檔舊格式

在載入 `SURVEY` 的那行之後（第 411 行附近），加上：

```js
let SURVEY = store('nh5_survey', null);
SURVEY = migrateSurvey(SURVEY);   // ← 新增：將舊的中文 gender/math 值轉換成中性 code
```

---

## 十五、renderCurrentView() helper（新增）

在 `game.main.js` 末尾（綁定區段附近），新增：

```js
// 供 setLang() 呼叫：重新 render 目前可見的 overlay
function renderCurrentView() {
  if (!document.getElementById('selectOverlay').classList.contains('hidden')) renderMap();
  if (!document.getElementById('gachaOverlay').classList.contains('hidden')) renderGacha();
  if (!document.getElementById('teamOverlay').classList.contains('hidden')) renderTeam();
  if (!document.getElementById('settingsOverlay').classList.contains('hidden')) {
    $('settings.title') && ($('settingsOverlay').querySelector('h1').textContent = t('settings.title'));
  }
}
```

---

## 驗收條件

1. `node build.cjs` → ✅
2. `node qa.cjs` → 全部通過（10 通過 / 0 失敗）
3. `node check_ui.cjs` → ✅
4. 在瀏覽器開 `index.html`，設定頁點 "English"：
   - 問卷、地圖、孵化所、過關畫面、教學全部出現英文
5. 點 "繁體中文"：全部切回中文
6. 舊存檔（localStorage 有 `nh5_survey`）載入後不報錯

---

## 不需要改的（不碰！）

- `game.logic.js`、`game.art.js`、`src/game.css`、`src/index.html`
- localStorage key（`nh5_survey`、`nh5_stars` 等）
- CSS class 名稱、element id、事件 handler
- 任何純數字/符號（`+1`、`-1`、`×2` 等）
