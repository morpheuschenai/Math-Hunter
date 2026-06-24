/* 自動化遊玩 QA：用 jsdom 載入 index.html，透過 solver 算出有效鏈，
   真的「打」過加/減/乘/除關卡 + 無限塔 + 抽蛋，斷言不變式與零 JS 錯誤。
   用法： node qa.cjs           （測 index.html）
         node qa.cjs 檔名.html
   注意：jsdom 會把 canvas 模擬掉，所以這支抓的是「邏輯/流程」回歸，
        不涵蓋真實 canvas 繪製問題（那類請在真瀏覽器測）。 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const file = process.argv[2] || 'index.html';
let html = fs.readFileSync(path.join(__dirname, file), 'utf8');

// 注入測試鉤子（放在 IIFE 內，session_start 之前）
const HOOK = `
  window.__qa = {
    play: () => {
      if (resolving || locked || pendingAction) return 'busy';   // 結算中/敵人回合未結束 → 不可出手(對應 #1 修正)
      if (!enemy || enemy.hp <= 0) return 'no-enemy';
      const p = findSolutionPath(valuesOf(), enemy.divisor ? 0 : target, solverOpt());
      if (!p) return 'no-solution';
      path = p.map(c => ({ r: c.r, c: c.c }));
      dragging = true;
      endDrag();
      return 'played';
    },
    state: () => ({ hp: enemy ? enemy.hp : null, maxhp: enemy ? enemy.maxHp : null,
      foe: foeIdx, stage: stg().key, tower: towerMode, floor: towerFloor, draws: DRAWS,
      resolving: resolving, locked: locked, pendingAction: pendingAction, drawErr: window.__drawErr || null }),
    clears: () => EV.filter(e => e.t === 'stage_clear').length,
    kills: () => EV.filter(e => e.t === 'enemy_kill').length,
    startStageByKey: (k) => { const i = STAGES.findIndex(s => s.key === k); if (i < 0) return false; startStage(i); return true; },
    startTower: () => startTower(),
    setDraws: (n) => { DRAWS = n; },
    openGacha: () => openGacha(),
    draw1: () => drawOne(),
  };
`;
html = html.replace("  log('session_start', { version: 'v10' });",
                    HOOK + "\n  log('session_start', { version: 'v10' });");
if (!html.includes('window.__qa')) { console.log('❌ 注入鉤子失敗（找不到 session_start 錨點）'); process.exit(1); }

const errors = [];
const noop = () => {};
const ctx = new Proxy({}, { get(t, p) {
  if (/Gradient/.test(p)) return () => ({ addColorStop: noop });
  if (p === 'measureText') return () => ({ width: 10 });
  return noop;
}, set() { return true; } });

const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/',
  beforeParse(win) {
    win.HTMLCanvasElement.prototype.getContext = () => ctx;
    win.AudioContext = win.webkitAudioContext = function () { return {
      createOscillator() { return { connect: noop, start: noop, stop: noop, frequency: { value: 0, setValueAtTime: noop }, type: '' }; },
      createGain() { return { connect: noop, gain: { value: 0, setValueAtTime: noop, exponentialRampToValueAtTime: noop, linearRampToValueAtTime: noop } }; },
      get currentTime() { return 0; }, get destination() { return {}; }, resume: noop, state: 'running' }; };
    win.speechSynthesis = { speak: noop, cancel: noop, getVoices() { return []; } };
    win.SpeechSynthesisUtterance = function () {};
    win.confirm = () => true;
    win.requestAnimationFrame = (cb) => setTimeout(cb, 4);   // 讓繪製迴圈真的跑
    win.cancelAnimationFrame = noop;
    win.localStorage.setItem('nh5_survey', JSON.stringify({ age: '10', gender: '男', math: '會乘除', nick: 'QA' }));
    win.localStorage.setItem('nh5_unlockall', 'true');
    win.addEventListener('error', e => errors.push('WINERR ' + (e.error && e.error.stack || e.message)));
  } });

const win = dom.window;
const Q = () => win.__qa;
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const ok = (c, m) => { console.log((c ? '✅' : '❌') + ' ' + m); c ? pass++ : fail++; };

// 在一個關卡裡反覆打有效鏈直到清關或用完次數
async function playStage(key, label) {
  if (!Q().startStageByKey(key)) { ok(false, label + ' 找不到關卡 ' + key); return; }
  await sleep(120);
  const clears0 = Q().clears();
  let played = 0, noSol = 0;
  for (let i = 0; i < 60; i++) {
    await sleep(80);
    { const s = Q().state(); if (s.resolving || s.locked || s.pendingAction) { await sleep(120); continue; } }   // 等結算/敵人回合
    const r = Q().play();
    if (r === 'played') played++;
    else if (r === 'no-solution') noSol++;
    if (Q().clears() > clears0) break;          // 清關了
    await sleep(220);                            // 等結算+掉落+換怪
  }
  const cleared = Q().clears() > clears0;
  ok(cleared && played >= 3 && !Q().state().drawErr,
     `${label}(${key})：打了 ${played} 條有效鏈、no-sol ${noSol}、清關 ${cleared ? '是' : '否'}`);
}

async function run() {
  await sleep(200);
  ok(!!Q(), '測試鉤子注入成功');

  await playStage('1', '加法');
  await playStage('4', '減法(−珠)');
  await playStage('m2', '乘法(×珠)');
  await playStage('e1', '除法(整除盾)');
  await playStage('e2', '除法(÷珠)');

  // 無限塔：爬幾層
  Q().startTower();
  await sleep(150);
  const f0 = Q().state().floor;
  let towerPlayed = 0;
  for (let i = 0; i < 50; i++) {
    await sleep(80);
    { const s = Q().state(); if (s.resolving || s.locked || s.pendingAction) { await sleep(120); continue; } }
    if (Q().play() === 'played') towerPlayed++;
    await sleep(220);
    if (Q().state().floor >= f0 + 3) break;
  }
  ok(Q().state().floor > f0 && Q().state().tower && !Q().state().drawErr,
     `無限塔：從 ${f0}F 爬到 ${Q().state().floor}F（打 ${towerPlayed} 鏈）`);

  // 抽蛋：給券、抽到光
  Q().setDraws(3); Q().openGacha(); await sleep(60);
  const d0 = Q().state().draws;
  Q().draw1(); Q().draw1(); await sleep(60);
  ok(Q().state().draws === d0 - 2, `抽蛋：${d0} → ${Q().state().draws}（扣券正確）`);

  ok(errors.length === 0, `全程零 JS 執行期錯誤` + (errors.length ? '：\n' + errors.slice(0, 3).join('\n') : ''));
  ok(!win.__drawErr, '繪製迴圈無捕捉到錯誤');

  console.log(`\n${fail ? '❌ 有失敗' : '✅ 全部通過'}： ${pass} 通過 / ${fail} 失敗`);
  process.exit(fail ? 1 : 0);
}
run().catch(e => { console.log('❌ 測試本身出錯：', e.stack); process.exit(1); });
