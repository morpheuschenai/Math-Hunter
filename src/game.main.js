(() => {
  // ---------- 技能定義 ----------
  const SKILL_DEFS = {
    plus1:  { ic:'✏️', name:'加一',  cd:3, type:'target',  tip:'點一顆珠，讓它 +1（9 會變回 1）' },
    minus1: { ic:'➖', name:'減一',  cd:3, type:'target',  tip:'點一顆珠，讓它 −1（1 會變成 9）' },
    reroll: { ic:'🎲', name:'重擲',  cd:2, type:'target',  tip:'點一顆珠，把它變成隨機新珠' },
    split:  { ic:'✂️', name:'分裂',  cd:4, type:'target',  tip:'點一顆珠，把它拆成兩顆（上面那顆會被蓋掉）' },
    swapUp: { ic:'🔄', name:'上下換', cd:2, type:'target',  tip:'點一顆珠，和上面那顆交換位置' },
    purify: { ic:'💫', name:'淨化',  cd:4, type:'target',  tip:'點一顆珠，直接消除它' },
    lucky:  { ic:'🍀', name:'幸運',  cd:5, type:'instant', tip:'下一條鏈傷害 ×1.5！' },
    shield: { ic:'🛡️', name:'護盾',  cd:5, type:'instant', tip:'擋下敵人的下一次攻擊！' },
  };

  const ATTRS = { odd:{n:'奇數系',c:'#ff9b3d'}, even:{n:'偶數系',c:'#5b8def'}, prime:{n:'質數系',c:'#b07ce8'}, multi:{n:'倍數系',c:'#57b85e'} };
  const SPECIES = [
    { id:'kiki',        name:'奇奇',   attr:'odd',   skill:'plus1',  pool:0 },
    { id:'oo',          name:'偶偶',   attr:'even',  skill:'minus1', pool:0 },
    { id:'prima',       name:'質寶',   attr:'prime', skill:'reroll', pool:1 },
    { id:'swapy',       name:'換換',   attr:'even',  skill:'swapUp', pool:1 },
    { id:'starle',      name:'星星靈', attr:'prime', skill:'purify', pool:2 },
    { id:'guardy',      name:'守護靈', attr:'even',  skill:'shield', pool:2 },
    { id:'dubdragon',   name:'倍倍龍', attr:'multi', skill:'split',  pool:3 },
    { id:'munchdragon', name:'大胃龍', attr:'multi', skill:'lucky',  pool:3 },
  ];
  const SP = id => SPECIES.find(s => s.id === id);

  // ---------- 隊長技（常駐，只讀「路徑組成」，絕不碰總和；以此避開固定目標的矛盾）----------
  // calc(cc) 回傳 { mult, addLen, crit, proc }：傷害倍率、額外鏈長、是否爆擊、是否觸發(給演出)
  const CAPTAIN_DEFS = {
    prime: { name:'質數共鳴', ic:'💠', c:'#b07ce8',
      desc:'路徑每串 1 顆質數珠（2·3·5·7），傷害 +18%',
      calc: cc => ({ mult: 1 + 0.18 * cc.primes, proc: cc.primes > 0, tag: cc.primes ? `質×${cc.primes}` : '' }) },
    odd:   { name:'奇襲',     ic:'🔆', c:'#ff9b3d',
      desc:'路徑每串 1 顆奇數珠，傷害 +12%',
      calc: cc => ({ mult: 1 + 0.12 * cc.odds, proc: cc.odds > 0, tag: cc.odds ? `奇×${cc.odds}` : '' }) },
    even:  { name:'偶數連動', ic:'🔗', c:'#5b8def',
      desc:'路徑每 2 顆偶數珠，鏈長倍率 +1',
      calc: cc => ({ addLen: Math.floor(cc.evens / 2), proc: cc.evens >= 2, tag: cc.evens >= 2 ? `偶+${Math.floor(cc.evens/2)}` : '' }) },
    multi: { name:'倍數爆擊', ic:'⚡', c:'#57b85e',
      desc:'鏈長是 3 的倍數時，傷害 ×2',
      calc: cc => ({ mult: (cc.digits % 3 === 0 && cc.digits > 0) ? 2 : 1, crit: cc.digits % 3 === 0 && cc.digits > 0, proc: cc.digits % 3 === 0 && cc.digits > 0, tag: (cc.digits % 3 === 0) ? '倍數爆擊' : '' }) },
  };
  // 隊長 = 出戰第一隻；回傳其 attr 對應的隊長技
  const captainAttr = () => (EQUIP[0] && SP(EQUIP[0])) ? SP(EQUIP[0]).attr : null;
  const captainDef = () => CAPTAIN_DEFS[captainAttr()] || null;

  // ---------- 關卡表 ----------
  const STAGES_STD = [
    { key:'1', name:'草原・一', zone:0, foesSp:['kiki','oo','kiki'], band:[10,14], minusRate:0, size:6, maxDigit:9, foes:[
      {hp:60,atk:10,every:5},{hp:90,atk:12,every:4},{hp:120,atk:14,every:4}]},
    { key:'2', name:'草原・二', zone:0, foesSp:['oo','kiki','oo'], band:[10,16], minusRate:0, size:6, maxDigit:9, foes:[
      {hp:90,atk:12,every:4},{hp:120,atk:14,every:4},{hp:230,atk:14,every:4,gim:{type:'bossGentle',name:'👑 草原王・大偶偶'}}]},
    { key:'3', name:'森林・一', zone:1, foesSp:['prima','swapy','prima'], band:[12,18], minusRate:0, size:6, maxDigit:9, foes:[
      {hp:100,atk:14,every:4},{hp:130,atk:16,every:4},{hp:170,atk:18,every:4,gim:{type:'shell',n:3}}]},
    { key:'4', name:'森林・二', zone:1, foesSp:['swapy','prima','swapy'], band:[12,18], minusRate:.10, intro:'minus', size:6, maxDigit:9, foes:[
      {hp:110,atk:16,every:4},{hp:150,atk:18,every:4},{hp:280,atk:18,every:4,gim:{type:'bossShell',n:3,name:'👑 森林王・換換大公'}}]},
    { key:'5', name:'洞窟・一', zone:2, foesSp:['starle','guardy','starle'], band:[12,20], minusRate:.08, size:6, maxDigit:9, foes:[
      {hp:120,atk:16,every:4,gim:{type:'weakOdd',n:2}},{hp:160,atk:18,every:4,gim:{type:'ban'}},{hp:200,atk:20,every:3,gim:{type:'ban'}}]},
    { key:'6', name:'洞窟・二', zone:2, foesSp:['guardy','starle','guardy'], band:[14,20], minusRate:.10, size:6, maxDigit:9, foes:[
      {hp:130,atk:18,every:4,gim:{type:'ban'}},{hp:170,atk:20,every:3,gim:{type:'shell',n:4}},{hp:330,atk:20,every:4,gim:{type:'bossBan',name:'👑 洞窟王・封印守衛'}}]},
    { key:'7', name:'火山・一', zone:3, foesSp:['dubdragon','munchdragon','dubdragon'], band:[14,22], minusRate:.10, size:6, maxDigit:9, foes:[
      {hp:150,atk:20,every:3,gim:{type:'shell',n:4}},{hp:190,atk:22,every:3,gim:{type:'ban'}},{hp:240,atk:24,every:3,gim:{type:'shell',n:5}}]},
    { key:'8', name:'火山・二', zone:3, foesSp:['munchdragon','dubdragon','chaos'], band:[16,24], minusRate:.12, size:6, maxDigit:9, foes:[
      {hp:170,atk:22,every:3,gim:{type:'ban'}},{hp:220,atk:24,every:3,gim:{type:'shell',n:5}},{hp:400,atk:24,every:4,gim:{type:'boss'}}]},
    // ===== 乘法谷（Pack 3：同數共鳴 + ×2 倍率珠）=====
    { key:'m1', name:'乘法谷・一', zone:4, foesSp:['dubdragon','munchdragon','dubdragon'], band:[12,20], minusRate:0, size:6, maxDigit:9, foes:[
      {hp:160,atk:18,every:4,gim:{type:'weakRun',n:2}},{hp:190,atk:20,every:4},{hp:230,atk:20,every:3,gim:{type:'weakRun',n:3}}]},
    { key:'m2', name:'乘法谷・二', zone:4, foesSp:['munchdragon','dubdragon','munchdragon'], band:[14,22], minusRate:0, mulRate:.14, intro:'mul', size:6, maxDigit:9, foes:[
      {hp:180,atk:20,every:4},{hp:210,atk:22,every:3},{hp:250,atk:22,every:3,gim:{type:'weakRun',n:2}}]},
    { key:'m3', name:'乘法谷・霸主', zone:4, foesSp:['dubdragon','munchdragon','dubdragon'], band:[16,24], minusRate:0, mulRate:.10, size:6, maxDigit:9, foes:[
      {hp:200,atk:22,every:3,gim:{type:'weakRun',n:2}},{hp:240,atk:24,every:3},{hp:420,atk:24,every:4,gim:{type:'bossRun',n:3,name:'👑 乘法谷霸主・倍倍龍王'}}]},
    // ===== 除法谷（Pack 4：等分挑戰 = 除法）=====
    // e1：整除盾入門（湊 N 的倍數，靈活多解）
    { key:'e1', name:'除法谷・一', zone:5, foesSp:['prima','starle','prima'], band:[6,18], minusRate:0, size:6, maxDigit:9, foes:[
      {hp:170,atk:18,every:4,gim:{type:'divisor',n:2}},{hp:200,atk:20,every:4,gim:{type:'divisor',n:2}},{hp:240,atk:20,every:3,gim:{type:'divisor',n:3}}]},
    // e2：÷珠登場（先堆再除，命中固定目標）
    { key:'e2', name:'除法谷・二', zone:5, foesSp:['starle','guardy','starle'], band:[12,24], minusRate:0, divRate:.14, intro:'div', size:6, maxDigit:9, foes:[
      {hp:200,atk:20,every:4},{hp:230,atk:22,every:3},{hp:260,atk:22,every:3,gim:{type:'divisor',n:4}}]},
    // e3：整除盾 + ÷珠 混合 + 霸主
    { key:'e3', name:'除法谷・霸主', zone:5, foesSp:['starle','prima','dubdragon'], band:[12,28], minusRate:0, divRate:.10, size:6, maxDigit:9, foes:[
      {hp:220,atk:22,every:3,gim:{type:'divisor',n:3}},{hp:250,atk:24,every:3},{hp:440,atk:24,every:4,gim:{type:'bossDivisor',n:4,name:'👑 除法谷霸主・整除守衛'}}]},
  ];
  const STAGES_JR = [
    { key:'j1', name:'小小草原', zone:0, foesSp:['kiki','oo','kiki'], band:[6,9],   minusRate:0, size:5, maxDigit:5, foes:[
      {hp:36,every:6},{hp:48,every:6},{hp:60,every:5}]},
    { key:'j2', name:'小小花園', zone:0, foesSp:['oo','kiki','oo'],   band:[7,11],  minusRate:0, size:5, maxDigit:5, foes:[
      {hp:48,every:6},{hp:60,every:5},{hp:120,every:5,gim:{type:'bossGentle',name:'👑 花園大王・偶偶'}}]},
    { key:'j3', name:'小小森林', zone:1, foesSp:['prima','swapy','prima'], band:[8,13], minusRate:0, size:5, maxDigit:9, foes:[
      {hp:60,every:5},{hp:76,every:5},{hp:90,every:5}]},
    { key:'j4', name:'小小山丘', zone:1, foesSp:['swapy','oo','prima'], band:[10,16], minusRate:0, size:5, maxDigit:9, foes:[
      {hp:70,every:5},{hp:90,every:5},{hp:160,every:4,gim:{type:'bossShell',n:3,name:'👑 山丘大王・質寶'}}]},
  ];
  const ZONES_STD = [
    { n:'🌿 湊十草原', cls:'z0' }, { n:'🌲 進位森林', cls:'z1' },
    { n:'🕳️ 封印洞窟', cls:'z2' }, { n:'🌋 烈焰火山', cls:'z3' },
    { n:'✖️ 乘法谷', cls:'z4' },
    { n:'➗ 除法谷', cls:'z5' },
  ];
  const ZONES_JR = [
    { n:'🐣 小小世界・上', cls:'zj' }, { n:'🐥 小小世界・下', cls:'zj' },
  ];

  // ---------- 存檔 / 遙測 ----------
  const store = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  let EV = store('nh5_events', []);
  function log(t, props = {}) {
    EV.push({ t, ts: Date.now(), mode: MODE, ...props });
    if (EV.length > 8000) EV = EV.slice(-8000);
    save('nh5_events', EV);
  }

  // ---------- 學習數據層（賣給家長的進度依據：逐題熟練度 + 反應時間 + 正確率）----------
  // 運算別:每條鏈一律算「加法」練習(連加是基礎),另依用到的珠/共鳴加記減/乘/除。
  // 數字範圍:依本題目標(或總和)分桶,讓家長看到「個位/到20/到50…」各自的熟練度。
  let MASTERY = store('nh5_mastery', {});       // { op: { range: {att, ok, ms} } }
  function opRange(n) {
    n = Math.abs(n || 0);
    return n <= 9 ? '1-9' : n <= 20 ? '10-20' : n <= 50 ? '21-50' : n <= 99 ? '51-99' : '100+';
  }
  function chainOps(cc) {
    const ops = ['add'];                                   // 連加=基礎,每條鏈都算
    if (cc.usedMinus) ops.push('minus');
    if (cc.usedMul || (RESON && cc.maxRun >= 2)) ops.push('mul');   // ×珠 或 已解鎖的同數共鳴
    if (cc.usedDiv) ops.push('div');
    return ops;
  }
  function recordMastery(ops, range, valid, solveMs) {
    ops.forEach(op => {
      const o = (MASTERY[op] = MASTERY[op] || {});
      const r = (o[range] = o[range] || { att: 0, ok: 0, ms: 0 });
      r.att++;
      if (valid) { r.ok++; r.ms += Math.max(0, solveMs || 0); }
    });
    save('nh5_mastery', MASTERY);
  }
  let STARS = store('nh5_stars', {});
  let COLL = store('nh5_coll', { kiki: 1, prima: 1 });
  let EQUIP = store('nh5_equip', ['kiki', 'prima']);
  let MODE = store('nh5_mode', null);          // 'jr' | 'std'
  let voiceOn = store('nh5_voice', true);

  // ---------- 語音（junior）----------
  function say(txt) {
    if (MODE !== 'jr' || !voiceOn) return;
    try {
      const u = new SpeechSynthesisUtterance(txt);
      u.lang = 'zh-TW'; u.rate = .95;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    } catch (e) {}
  }

  // ---------- 畫布（依關卡盤面大小重設）----------
  const canvas = document.getElementById('board');
  const ctx = canvas.getContext('2d');
  const DPR = Math.min(window.devicePixelRatio || 1, 3);
  let SIZE = 6, CELL = 60, BOARD_PX = 360;

  // === CANVAS_VISUAL_CONFIG_BEGIN: Codex 可編輯(只讀 CSS 變數的盤面視覺 token)===
  // 盤面所有顏色/外框/厚底/亮面/字體描邊…都從這裡讀(對應 game.css 的 :root)。
  // 一次讀進 cache,避免每幀對每顆珠呼叫 getComputedStyle。setupCanvas / 主題切換時刷新。
  // ⚠️ 只可加「視覺 token」與其 fallback;不可在這裡放任何遊戲狀態或數值邏輯。
  let BOARD_C = {};
  function readBoardColors() {
    const cs = getComputedStyle(document.documentElement);
    const v = (n, f) => { const x = cs.getPropertyValue(n).trim(); return x || f; };          // 字串(顏色)
    const num = (n, f) => { const x = cs.getPropertyValue(n).trim(); return x === '' ? f : (parseFloat(x) || 0); }; // 數值(px/比例)
    BOARD_C = {
      // -- 盤面底 / 提示框 / 路徑線 --
      bg:       v('--board-bg', 'rgba(255,255,255,.05)'),
      boardRadius: num('--board-radius', 14),
      hintRgb:  v('--board-hint-rgb', '255,216,77'),       // 提示框(動態 alpha,用 rgb 三元組)
      hintWidth: num('--board-hint-w', 3),
      pathValid: v('--path-valid', 'rgba(93,255,157,.85)'),
      pathHit:   v('--path-hit',   'rgba(255,179,94,.85)'),
      pathOver:  v('--path-over',  'rgba(255,122,122,.8)'),
      pathUnder: v('--path-under', 'rgba(158,203,255,.8)'),
      pathGlow:  num('--path-glow', 6),                    // 鏈長 ≥4 時的發光基數
      // -- 珠子底色(數字 1-3 / 4-6 / 7+,各含選取高亮)--
      num1:   v('--bead-num-1', '#3d7bd9'), num2: v('--bead-num-2', '#3aa66b'), num3: v('--bead-num-3', '#d97b2e'),
      num1Hi: v('--bead-num-1-hi', '#6ea8ff'), num2Hi: v('--bead-num-2-hi', '#5fd694'), num3Hi: v('--bead-num-3-hi', '#ffae5e'),
      digits: {
        1: v('--bead-digit-1', v('--bead-num-1', '#3d7bd9')),
        2: v('--bead-digit-2', v('--bead-num-1', '#3d7bd9')),
        3: v('--bead-digit-3', v('--bead-num-1', '#3d7bd9')),
        4: v('--bead-digit-4', v('--bead-num-2', '#3aa66b')),
        5: v('--bead-digit-5', v('--bead-num-2', '#3aa66b')),
        6: v('--bead-digit-6', v('--bead-num-2', '#3aa66b')),
        7: v('--bead-digit-7', v('--bead-num-3', '#d97b2e')),
        8: v('--bead-digit-8', v('--bead-num-3', '#d97b2e')),
        9: v('--bead-digit-9', v('--bead-num-3', '#d97b2e')),
      },
      digitsHi: {
        1: v('--bead-digit-1-hi', v('--bead-num-1-hi', '#6ea8ff')),
        2: v('--bead-digit-2-hi', v('--bead-num-1-hi', '#6ea8ff')),
        3: v('--bead-digit-3-hi', v('--bead-num-1-hi', '#6ea8ff')),
        4: v('--bead-digit-4-hi', v('--bead-num-2-hi', '#5fd694')),
        5: v('--bead-digit-5-hi', v('--bead-num-2-hi', '#5fd694')),
        6: v('--bead-digit-6-hi', v('--bead-num-2-hi', '#5fd694')),
        7: v('--bead-digit-7-hi', v('--bead-num-3-hi', '#ffae5e')),
        8: v('--bead-digit-8-hi', v('--bead-num-3-hi', '#ffae5e')),
        9: v('--bead-digit-9-hi', v('--bead-num-3-hi', '#ffae5e')),
      },
      div:   v('--bead-div', '#1f9fc4'),   divHi:   v('--bead-div-hi', '#6fe3ff'),
      mul:   v('--bead-mul', '#e0951c'),   mulHi:   v('--bead-mul-hi', '#ffd36b'),
      minus: v('--bead-minus', '#7a4dd9'), minusHi: v('--bead-minus-hi', '#a07ce8'),
      banned: v('--bead-banned', '#4a4a58'),
      // -- chunky toy 立體外觀(預設值=關閉,維持原本外觀;Codex 調 CSS 即生效)--
      outline:   v('--bead-outline', 'transparent'),
      outlineW:  num('--bead-outline-w', 0),              // 珠子外框寬(px)
      thick:     v('--bead-thick', 'rgba(0,0,0,.25)'),    // 珠子厚底色
      thickH:    num('--bead-thick-h', 0),                // 珠子厚底高度(px,往下偏移)
      highlight: v('--bead-highlight', 'transparent'),    // 珠子左上亮面
      beadRadius: num('--bead-radius', 0.26),             // 圓角(相對珠寬比例)
      beadPad:   num('--bead-pad', 0.07),                 // 珠與格邊間距(相對 CELL 比例)
      selGlow:   v('--bead-sel-glow', 'rgba(255,255,255,.7)'),
      shadow:    v('--bead-shadow', 'rgba(0,0,0,.3)'),
      // -- 珠面文字 / 運算 icon --
      text:      v('--bead-text', '#fff'),
      icon:      v('--bead-icon', '#fff'),                // −/×/÷ 符號色
      numStroke: v('--bead-num-stroke', 'transparent'),
      numStrokeW: num('--bead-num-stroke-w', 0),
      numShadow: v('--bead-num-shadow', 'transparent'),
      numShadowBlur: num('--bead-num-shadow-blur', 0),
    };
  }
  readBoardColors();
  // === CANVAS_VISUAL_CONFIG_END ===

  function setupCanvas(size) {
    readBoardColors();   // 主題/尺寸變動時刷新盤面色彩 cache
    SIZE = size;
    // 棋盤大小 = 取「可用寬度」與「剩餘高度」的較小值,確保整個盤面+技能列都在畫面內
    const wrap = canvas.parentElement;
    const wW = wrap && wrap.clientWidth ? wrap.clientWidth : Math.min(window.innerWidth, 440) - 16;
    const wH = wrap && wrap.clientHeight ? wrap.clientHeight : 9999;
    const avail = Math.max(150, Math.min(wW, wH) - 4);
    CELL = Math.floor(avail / SIZE);
    BOARD_PX = CELL * SIZE;
    canvas.width = BOARD_PX * DPR; canvas.height = BOARD_PX * DPR;
    canvas.style.width = BOARD_PX + 'px'; canvas.style.height = BOARD_PX + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  setupCanvas(6);

  // ---------- 狀態 ----------
  let tiles = [], path = [], dragging = false, locked = false;
  let STAGES = STAGES_STD, stageIdx = 0, foeIdx = 0, enemy = null, player = null, target = 0;
  let stageStat = null, boardReadyAt = 0, firstMoveLogged = false, dragT0 = 0, solveStart = 0;
  let floaters = [];
  let skillCd = {}, targeting = null, splitCell = null;
  let luckyNext = false, shieldUp = false, combo = 0, resolving = false, resolveSkip = null;
  let pendingAction = false;   // 敵人延遲動作/換怪未完成時為 true,擋住玩家偷一步
  let battleEpoch = 0;         // 戰局令牌:離開/換關/死亡時 +1,讓殘留 setTimeout 失效
  let hintCells = null, hintT = 0, hintCd = 0;
  let particles = [];
  const assetRoot = location.pathname.includes('/src/') ? '../assets/ui/game/' : 'assets/ui/game/';
  const makeFxFrames = (prefix, count) => {
    const frames = [];
    for (let i = 1; i <= count; i++) {
      const img = new Image();
      img.src = `${assetRoot}${prefix}${String(i).padStart(2, '0')}.png`;
      frames.push(img);
    }
    return frames;
  };
  const FX = {
    spark: makeFxFrames('battle_fx_drag_spark_', 9),
  };
  const SHOW_CHAIN_TEXT_FX = false;
  const SHOW_BATTLE_TEXT_FX = false;
  const SHOW_RESULT_FEEDBACK_TEXT = false;
  // DDA：每模式各記一個難度偏移；foeStat 記錄當前這隻怪的即時表現
  let DDA = store('nh5_dda', { std: 0, jr: 0 });
  let foeStat = null;
  const ddaOff = () => DDA[isJr() ? 'jr' : 'std'] || 0;

  const isJr = () => MODE === 'jr';
  const tierColor = n => n >= 6 ? '#ffd84d' : n >= 5 ? '#ff9bf2' : n >= 4 ? '#9ecbff' : '#d8b4ff';

  function flash(color = '#fff', op = .5) {
    const f = document.getElementById('flash');
    f.style.background = color;
    f.style.opacity = op;
    setTimeout(() => f.style.opacity = 0, 90);
  }
  function spawnParticles(cx, cy, color, n = 6) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 1.4 + Math.random() * 2.8;
      particles.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2,
        r: 1.5 + Math.random() * 2.5, color, t: 0, life: 18 + rnd(10),
        fx: 'spark', frame: rnd(9), size: 12 + Math.random() * 12, rot: Math.random() * Math.PI * 2 });
    }
    if (particles.length > 240) particles = particles.slice(-240);
  }
  function spawnDragSpark(cx, cy, n = 2) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = .45 + Math.random() * 1.05;
      particles.push({
        x: cx + (Math.random() - .5) * CELL * .26,
        y: cy + (Math.random() - .5) * CELL * .26,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        r: 2,
        color: 'rgba(255,225,70,.95)',
        t: 0,
        life: 10 + rnd(7),
        fx: 'spark',
        frame: rnd(9),
        size: 8 + Math.random() * 8,
        rot: Math.random() * Math.PI * 2,
      });
    }
    if (particles.length > 240) particles = particles.slice(-240);
  }

  // ---------- 音效 ----------
  let AC = null;
  function audioInit() { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
  function blip(freq, dur = .08, type = 'sine', vol = .15) {
    if (!AC) return;
    try {
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, AC.currentTime);
      g.gain.exponentialRampToValueAtTime(.001, AC.currentTime + dur);
      o.connect(g); g.connect(AC.destination);
      o.start(); o.stop(AC.currentTime + dur);
    } catch (e) {}
  }

  // ---------- DOM ----------
  const $ = id => document.getElementById(id);
  const elTarget = $('targetVal'), elSum = $('curSum'), elChain = $('chainInfo'),
        elArt = $('enemyArt'), elEName = $('enemyName'), elEHp = $('enemyHpFill'),
        elPHp = $('playerHpFill'), elPHpT = $('playerHpText'), elCd = $('cdVal'),
        elGim = $('gimBadge'), elStage = $('stageName'), elFoeP = $('foeProgress'),
        elToast = $('toast'), elSkillRow = $('skillRow'), elShield = $('shieldIc'),
        elCdLabel = $('cdLabel'), elVoice = $('voiceBtn'), elCap = $('captainChip');

  let toastTimer;
  function toast(msg, ms = 1800) {
    elToast.textContent = msg; elToast.style.opacity = 1;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => elToast.style.opacity = 0, ms);
  }
  function addFloater(text, color, size = 22, dx = 0, dy = 0) {
    floaters.push({ x: BOARD_PX / 2 + dx, y: BOARD_PX * .3 + dy, text, color, t: 0, size });
  }
  const battleChromeBlockers = new Set([
    'startOverlay', 'surveyOverlay', 'selectOverlay', 'settingsOverlay',
    'teamOverlay', 'gachaOverlay', 'captainPickOverlay',
    'resultOverlay', 'failOverlay', 'towerResultOverlay'
  ]);
  function battleChromeBlocked() {
    return [...battleChromeBlockers].some(id => {
      const el = $(id);
      return el && !el.classList.contains('hidden');
    });
  }
  function syncBattleChrome() {
    const app = $('app');
    if (!app) return;
    if (battleChromeBlocked()) app.classList.remove('battle-active');
    else if (enemy && stageStat) app.classList.add('battle-active');
  }
  function show(id) { $(id).classList.remove('hidden'); syncBattleChrome(); }
  function hide(id) { $(id).classList.add('hidden'); syncBattleChrome(); }
  function showDmgPop(v, big) {
    const d = $('dmgPop'); if (!d) return;
    d.textContent = '-' + v; d.classList.remove('hidden');
    d.classList.toggle('big', !!big);
    d.dataset.tier = comboTier(combo);   // 外觀由 CSS [data-tier] 決定
  }
  function hideDmgPop() { const d = $('dmgPop'); if (d) d.classList.add('hidden'); }
  function playBattleFx(kind) {
    const host = $('enemyZone');
    if (!host) return;
    host.querySelectorAll(`.battleFx.${kind}`).forEach(node => node.remove());
    const count = kind === 'impact' ? 8 : 9;
    const el = document.createElement('div');
    el.className = `battleFx ${kind}`;
    for (let i = 1; i <= count; i++) {
      const frame = document.createElement('span');
      frame.className = `fxFrame f${i}`;
      frame.style.setProperty('--i', i - 1);
      el.appendChild(frame);
    }
    host.appendChild(el);
    setTimeout(() => el.remove(), kind === 'impact' ? 460 : 430);
  }
  // 連擊層級（純邏輯；顏色/字級在 game.css 以 [data-tier] 決定）
  function comboTier(n) { return n >= 6 ? 4 : n >= 4 ? 3 : n >= 2 ? 2 : 1; }
  function showCombo(n) {
    const m = $('comboMeter'); if (!m) return;
    if (n < 2) { hideCombo(); return; }
    const frames = Array.from({ length: 8 }, (_, i) => `<span class="comboBurstFrame f${i + 1}" style="--i:${i}"></span>`).join('');
    m.innerHTML = `<span class="comboBurst">${frames}</span><span class="comboLabel">COMBO</span><span class="comboNum">x${n}</span>`;
    m.dataset.comboText = `COMBO\n×${n}`;
    m.dataset.tier = comboTier(n);
    m.classList.remove('hidden');
    m.classList.add('punch'); setTimeout(() => m.classList.remove('punch'), 130);
  }
  function hideCombo() { const m = $('comboMeter'); if (m) { m.classList.add('hidden'); m.innerHTML = ''; delete m.dataset.comboText; } }

  // ---------- 教學對話框：每個概念只跳一次 ----------
  let TAUGHT = store('nh5_taught', {});
  let DRAWS = store('nh5_draws', 0);              // 累積的抽蛋機會（券）
  let RESON = store('nh5_reson', false);          // 同數共鳴能力:進入乘法谷後才解鎖
  let SURVEY = store('nh5_survey', null);         // 開場問卷（年齡/性別/數學程度/暱稱）
  let UNLOCKALL = store('nh5_unlockall', false);  // 預設關閉：循序解鎖（可在設定開啟）
  let teachQueue = [];
  const dialogueAssetRoot = location.pathname.includes('/src/') ? '../assets/ui/dialogue/' : 'assets/ui/dialogue/';
  const ATTRIBUTE_HELP = {
    shell: {
      title: 'HARD SHELL',
      icon: 'instruction_attribute_icon_shell.png',
      condition: n => `${n} CHAIN +`,
      body: n => `ONLY A CHAIN OF ${n}+ BEADS CAN CRACK IT.`
    },
    odd: {
      title: 'ODD SHIELD',
      icon: 'instruction_attribute_icon_shield.png',
      condition: n => `${n} ODD +`,
      body: n => `YOUR CHAIN MUST INCLUDE ${n}+ ODD NUMBERS.`
    },
    resonance: {
      title: 'ECHO SHIELD',
      icon: 'instruction_attribute_icon_resonance.png',
      condition: n => `${n} SAME`,
      body: n => `LINK ${n} OF THE SAME NUMBER IN A ROW.`
    },
    multiple: {
      title: 'MULTIPLE SHIELD',
      icon: 'instruction_attribute_icon_multiple.png',
      condition: n => `MULTIPLE OF ${n}`,
      body: n => `HIT IT WITH ANY MULTIPLE OF ${n}.`
    }
  };
  function teach(id, title, art, body, meta = null) {
    if (TAUGHT[id]) return false;
    TAUGHT[id] = 1; save('nh5_taught', TAUGHT);
    teachQueue.push({ id, title, art, body, meta });
    if (teachQueue.length === 1) showNextTeach();
    return true;
  }
  function showAttributeTeach(kind, num, force = false) {
    const cfg = ATTRIBUTE_HELP[kind];
    if (!cfg) return false;
    const n = Math.max(1, Number(num) || 1);
    const id = `attribute_${kind}`;
    const item = {
      id,
      title: cfg.title,
      art: '',
      body: cfg.body(n),
      meta: { attributeKind: kind, attributeNum: n, condition: cfg.condition(n), icon: cfg.icon }
    };
    if (!force) {
      if (TAUGHT[id]) return false;
      TAUGHT[id] = 1; save('nh5_taught', TAUGHT);
    }
    teachQueue.push(item);
    if (teachQueue.length === 1) showNextTeach();
    return true;
  }
  function renderAttributeTeach(t) {
    const meta = t.meta || {};
    const n = Math.max(1, Number(meta.attributeNum) || 1);
    const icon = `${dialogueAssetRoot}${meta.icon}`;
    $('teachTitle').textContent = t.title;
    $('teachArt').innerHTML = Array.from({ length: n }, () => `<img src="${icon}" alt="">`).join('');
    $('teachBadge').textContent = meta.condition || '';
    $('teachBody').textContent = t.body;
    $('teachOverlay').dataset.attribute = meta.attributeKind || '';
  }
  // 把教學內容唸出來（小小獵人專用，照顧還不識字的孩子）。
  // 取 HTML 的純文字、把 ×/− 換成「乘/減」、+ 換「加」、= 換「等於」，唸起來更自然。
  function speakTeach(t) {
    const tmp = document.createElement('div');
    tmp.innerHTML = t.title + '。' + t.body.replace(/<br>/g, '，');
    let txt = (tmp.textContent || '').replace(/×/g, '乘').replace(/−/g, '減')
      .replace(/＋|\+/g, '加').replace(/＝|=/g, '等於').replace(/\s+/g, '');
    say(txt);
  }
  function showNextTeach() {
    if (!teachQueue.length) return;
    const t = teachQueue[0];
    locked = true;
    if (t.meta && t.meta.attributeKind) renderAttributeTeach(t);
    else {
      $('teachTitle').textContent = t.title;
      $('teachArt').innerHTML = t.art || '';
      $('teachBadge').textContent = '';
      $('teachBody').innerHTML = t.body;
      $('teachOverlay').dataset.attribute = '';
    }
    $('teachReplay').classList.toggle('hidden', !isJr());   // 只有小小獵人顯示「再聽一次」
    show('teachOverlay');
    if (isJr()) speakTeach(t);
    log('teach', { id: t.id, stage: enemy ? stg().key : '-' });
  }
  function closeTeach() {
    teachQueue.shift();
    if (teachQueue.length) { showNextTeach(); }
    else { hide('teachOverlay'); locked = false; }
  }

  // ---------- 盤面 ----------
  function freshTiles(values, dropAnim = false) {
    tiles = values.map((row, r) => row.map(v => ({ v, off: dropAnim ? -(r + 2) * CELL : 0, scale: 1 })));
  }
  const valuesOf = () => tiles.map(row => row.map(t => t.v));
  const isMinus = t => t.v === 0;
  const isMul = t => t.v < 0 && t.v > -100;    // 倍率珠：-2=×2、-3=×3，factor=-v
  const mulFactor = t => -t.v;
  const isDiv = t => t.v <= -100;              // 除法珠：-102=÷2、-103=÷3，divisor=-v-100
  const divFactor = t => -t.v - 100;
  const isOp = t => isMinus(t) || isMul(t) || isDiv(t);   // 運算珠（非數字）
  // 無限塔：用 towerCfg 當「目前關卡」，沿用所有既有戰鬥邏輯（band/珠/solver/gimmick）
  let towerMode = false, towerFloor = 1, towerCfg = null, towerPeak = 0, towerDrawsRun = 0;
  const stg = () => towerMode ? towerCfg : STAGES[stageIdx];
  const baseDmg = () => 12 + EQUIP.reduce((s, id) => s + (COLL[id] || 1) - 1, 0) * 2;

  function solverOpt() {
    return { minLen: enemy?.minLen ?? 2, banned: enemy?.banned ?? 0, needOdd: enemy?.needOdd ?? 0, needRun: enemy?.needRun ?? 0, exactGroups: enemy?.divN ?? 0, divisor: enemy?.divisor ?? 0, maxLen: 7 };
  }

  // DDA：把關卡 band 依難度偏移平移。提高上限讓更大的目標可能出現，
  // 偏移為正時也微抬下限，避免一直送出太簡單的小目標。solver 仍保證有解。
  function ddaBand() {
    const off = ddaOff();
    let [lo, hi] = stg().band;
    hi = hi + off;
    lo = lo + Math.max(0, Math.round(off * 0.4));
    lo = Math.max(isJr() ? 4 : 6, lo);
    hi = Math.max(lo + 2, hi);
    return [lo, hi];
  }

  // DDA：每隻怪結束後依當下表現微調難度偏移（±1，有界限）。
  // 表現好(失敗率低、沒用提示) → 調高；卡關(失敗率高/狂用提示) → 調降。
  // junior 只輕微加難、容易放寬，維持零挫折原則。
  function updateDDA(killed) {
    if (!foeStat) return;
    const a = foeStat.attempts, f = foeStat.fails, h = foeStat.hints;
    const failRate = a ? f / a : 0;
    const jr = isJr();
    let delta = 0;
    if (killed) {
      if (a >= 2 && failRate <= 0.25 && h === 0) delta = +1;       // 輕鬆過 → 加難
      else if (failRate >= 0.55 || h >= 2) delta = -1;             // 很掙扎 → 放寬
    } else {
      delta = -2;                                                  // 整關失敗 → 明顯放寬
    }
    if (jr && delta > 0) delta = 0;                                // 小小獵人不主動加難
    if (delta === 0) return;
    const lim = jr ? [-3, 0] : [-4, 10];
    const key = jr ? 'jr' : 'std';
    const before = DDA[key] || 0;
    const after = Math.max(lim[0], Math.min(lim[1], before + delta));
    if (after === before) return;
    DDA[key] = after;
    save('nh5_dda', DDA);
    log('dda', { mode: MODE, stage: stg().key, offset: after, delta,
      fail_rate: +failRate.toFixed(2), attempts: a, hints: h,
      reason: killed ? 'foe_clear' : 'stage_fail' });
  }

  function setupTargetForEnemy() {
    const [lo, hi] = ddaBand();
    let guard = 0;
    // 整除盾：沒有固定目標，只要盤面湊得出 divisor 的倍數即可
    if (enemy.divisor) {
      target = 0;
      while (guard++ < 25) {
        if (countSolutions(valuesOf(), 0, { ...solverOpt(), cap: 1 }).count > 0) return;
        freshTiles(genBoardValues(stg().minusRate, stg().maxDigit, stg().size, stg().mulRate || 0, stg().divRate || 0), true);
      }
      return;
    }
    while (guard++ < 25) {
      if (enemy.gimType === 'ban' || enemy.gimType === 'boss' || enemy.gimType === 'bossBan') {
        const cands = [2,3,4,5,6,7,8].sort(() => Math.random() - .5);
        for (const d of cands) {
          enemy.banned = d;
          const t = pickTarget(valuesOf(), lo, hi, solverOpt());
          if (t !== -1) { target = t; return; }
        }
      } else {
        const t = pickTarget(valuesOf(), lo, hi, solverOpt());
        if (t !== -1) { target = t; return; }
      }
      freshTiles(genBoardValues(stg().minusRate, stg().maxDigit, stg().size, stg().mulRate || 0, stg().divRate || 0), true);
      toast('盤面洗牌！');
    }
    enemy.minLen = 2; enemy.banned = 0; target = lo;
  }

  // 敵人圖渲染:kiki 暫時用 ch01 多表情圖;其餘沿用 SVG。圖片角色不套暗化濾鏡(自帶光影)。
  function renderEnemyArt(expression = 'idle') {
    if (!enemy) return;
    const spId = enemy.spId;
    const spriteId = SPRITE_OF[spId];
    const crowned = enemy.isBoss && spId !== 'chaos';
    if (spriteId) {
      elArt.innerHTML = charSprite(spriteId, expression, crowned);
      elArt.classList.remove('corrupted');   // 圖片角色自帶光影，不套暗化濾鏡
    } else {
      elArt.innerHTML = charSVG(spId, crowned);
      elArt.classList.toggle('corrupted', spId !== 'chaos');
    }
  }
  function spawnEnemy() {
    const cfg = stg().foes[foeIdx];
    const gim = cfg.gim || null;
    const spId = stg().foesSp[foeIdx];
    const spInfo = SP(spId) || SP('kiki');   // 防呆：未知物種退回預設，避免崩潰
    const BOSS_TYPES = ['boss', 'bossGentle', 'bossShell', 'bossBan', 'bossRun', 'bossDiv', 'bossDivisor'];
    const bossKind = gim && BOSS_TYPES.includes(gim.type) ? gim.type : null;
    enemy = {
      spId, bossKind, isBoss: !!bossKind,
      name: bossKind ? (gim.name || '👑 亂數魔王') : `暗化．${spInfo.name}`,
      maxHp: cfg.hp, hp: cfg.hp, atk: cfg.atk || 0, every: cfg.every, cd: cfg.every,
      gimType: gim ? gim.type : null,
      minLen: gim && (gim.type === 'shell' || gim.type === 'bossShell') ? gim.n
            : (gim && gim.type === 'boss' ? 4 : 2),
      needOdd: gim && gim.type === 'weakOdd' ? (gim.n || 2) : 0,
      needRun: gim && (gim.type === 'weakRun' || gim.type === 'bossRun') ? (gim.n || 3) : 0,
      divN: gim && (gim.type === 'divShare' || gim.type === 'bossDiv') ? (gim.n || 2) : 0,
      divisor: gim && (gim.type === 'divisor' || gim.type === 'bossDivisor') ? (gim.n || 3) : 0,
      banned: 0, enraged: false, shiftCounter: 0,
    };
    setupTargetForEnemy();
    boardReadyAt = Date.now(); solveStart = boardReadyAt; firstMoveLogged = false; combo = 0; hideCombo();
    foeStat = { attempts: 0, fails: 0, hints: 0, t0: Date.now() };
    hintCells = null; hintT = 0;
    renderEnemyArt(enemy.enraged ? 'enraged' : 'idle');
    elArt.classList.toggle('boss', enemy.isBoss);
    elArt.classList.remove('enraged');
    $('enemyZone').classList.remove('enraged');
    if (enemy.isBoss) {
      // 魔王登場演出
      locked = true;
      flash('#7a0c1c', .45);
      blip(98, .4, 'sawtooth', .25); blip(82, .5, 'sawtooth', .25);
      const plainName = enemy.name.replace('👑 ', '');
      const banner = $('bossBanner');
      banner.innerHTML = `⚠️ ${plainName} ⚠️<small>${enemy.bossKind === 'boss' ? '數界的混亂之源現身了！' : '這張地圖的霸主現身了！'}</small>`;
      banner.classList.add('on');
      $('app').classList.add('shake');
      setTimeout(() => $('app').classList.remove('shake'), 400);
      say(`${plainName}出現了！`);
      setTimeout(() => { banner.classList.remove('on'); locked = false; }, 1600);
    }
    renderHud();
    if (!enemy.isBoss) say(enemy.divisor ? `湊出 ${enemy.divisor} 的倍數` : `目標是 ${target}`);
    // 新機制怪物登場 → 教學（每種只跳一次）
    if (enemy.divisor) showAttributeTeach('multiple', enemy.divisor);
    else if (enemy.divN) teach('divShare', '➗ 等分盾怪物！',
      '<span style="font-size:34px;color:#5ad6ff">12÷3=4</span>',
      `這隻怪要你「<b>把目標分成 ${enemy.divN} 等份</b>」。<br>先算：<b>目標 ÷ ${enemy.divN} = 每份多少</b>，再<b>連 ${enemy.divN} 顆一樣的</b>數字！<br><span style="font-size:12px;opacity:.75">例如目標 12、分 3 份 → 12÷3=4 → 連三顆 4。</span>`);
    else if (enemy.needRun) showAttributeTeach('resonance', enemy.needRun);
    else if (enemy.needOdd) showAttributeTeach('odd', enemy.needOdd);
    else if (enemy.minLen > 2) showAttributeTeach('shell', enemy.minLen);
    else if (enemy.banned) teach('ban', '🚫 封印怪物！',
      '<span style="font-size:42px">🚫</span>',
      `這隻怪會<b>封印一個數字</b>（變灰、不能用）。用 ✏️ 加一 / ➖ 減一 技能可以把被封的珠改成別的數字喔！`);
  }

  function gimText() {
    const parts = [];
    if (enemy.minLen > 2) parts.push(`🛡️ 硬殼：只吃 ${enemy.minLen} 顆以上的鏈`);
    if (enemy.banned) parts.push(`🚫 封印：數字 ${enemy.banned} 不能用`);
    if (enemy.needOdd) parts.push(`🔆 奇數盾：鏈裡要有 ${enemy.needOdd} 顆以上奇數`);
    if (enemy.needRun) parts.push(`🔢 共鳴盾：要連 ${enemy.needRun} 顆相同數字`);
    if (enemy.divN) parts.push(`➗ 等分盾：把 ${target} 分成 ${enemy.divN} 等份（連 ${enemy.divN} 顆 ${target % enemy.divN === 0 ? target / enemy.divN : '？'}）`);
    if (enemy.divisor) parts.push(`➗ 整除盾：湊出「${enemy.divisor} 的倍數」(${enemy.divisor}、${enemy.divisor*2}、${enemy.divisor*3}…)`);
    return parts.join('　');
  }

  function gimMeta() {
    if (!enemy) return { text: '', kind: '', num: '' };
    const text = gimText();
    if (enemy.needRun) return { text, kind: 'resonance', num: enemy.needRun };
    if (enemy.minLen > 2) return { text, kind: 'shell', num: enemy.minLen };
    if (enemy.needOdd) return { text, kind: 'odd', num: enemy.needOdd };
    if (enemy.divN) return { text, kind: 'divide', num: enemy.divN };
    if (enemy.divisor) return { text, kind: 'multiple', num: enemy.divisor };
    if (enemy.banned) return { text, kind: 'ban', num: enemy.banned };
    return { text: '', kind: '', num: '' };
  }

  function resultOverlayOpen() {
    return ['resultOverlay', 'failOverlay', 'towerResultOverlay'].some(id => {
      const el = $(id);
      return el && !el.classList.contains('hidden');
    });
  }

  function renderHud() {
    if (!battleChromeBlocked()) $('app').classList.add('battle-active');
    elStage.textContent = stg().name;
    elFoeP.textContent = towerMode ? `🗼 ${towerFloor}F　🥚×${towerDrawsRun}` : `怪物 ${foeIdx + 1} / ${stg().foes.length}`;
    elTarget.textContent = enemy.divisor ? `${enemy.divisor}的倍數` : target;
    elEName.textContent = enemy.name;
    const gim = gimMeta();
    elGim.textContent = gim.text;
    elGim.dataset.gimNum = gim.num || '';
    elGim.dataset.gimKind = gim.kind || '';
    elGim.classList.toggle('hasDetail', !!gim.text);
    const eHpRatio = Math.max(0, Math.min(1, enemy.hp / enemy.maxHp));
    const pHpRatio = Math.max(0, Math.min(1, player.hp / player.maxHp));
    elEHp.style.width = '';
    elPHp.style.width = '';
    elEHp.style.setProperty('--hp-hide', `${(1 - eHpRatio) * 100}%`);
    elPHp.style.setProperty('--hp-hide', `${(1 - pHpRatio) * 100}%`);
    elPHpT.textContent = Math.max(0, player.hp);
    elCd.textContent = enemy.cd;
    elCdLabel.textContent = isJr() ? '搗蛋' : '行動';
    elShield.classList.toggle('on', shieldUp);
    elVoice.classList.toggle('hidden', !isJr());
    elVoice.textContent = voiceOn ? '🔊' : '🔇';
    const capD = captainDef();
    const capId = EQUIP[0];
    elCap.innerHTML = capD && capId
      ? `<span class="mini">${charSVG(capId)}</span><span class="capText">👑 <b style="color:${capD.c}">${capD.ic} ${capD.name}</b> <span style="opacity:.7">${capD.desc}</span></span>`
      : '';
    renderSkills();
  }

  const isPrime = v => v === 2 || v === 3 || v === 5 || v === 7;
  function chainCalc() {
    let sum = 0, digits = 0, nextNeg = false, pendingMul = 1, endsOnDigit = false;
    let usedMinus = false, usedMul = false, usedDiv = false, badDiv = false;
    let primes = 0, evens = 0, odds = 0, mult3 = 0;        // 路徑組成（隊長技與弱點用）
    let lastVal = null, curRun = 0, maxRun = 0, runVal = 0; // 同數共鳴：最長相同連段
    let maxVal = 0;                                         // 學習數據：本鏈最大運算元（數字範圍用）
    for (const p of path) {
      const t = tiles[p.r] && tiles[p.r][p.c];
      if (!t) continue;
      if (isMinus(t)) { nextNeg = true; usedMinus = true; endsOnDigit = false; lastVal = null; }
      else if (isMul(t)) { pendingMul = mulFactor(t); usedMul = true; endsOnDigit = false; lastVal = null; }
      else if (isDiv(t)) {                       // 後置除法：把目前累積總和除下去（須整除）
        const d = divFactor(t); usedDiv = true; lastVal = null;
        if (!endsOnDigit || sum % d !== 0) badDiv = true; else sum = sum / d;
      }
      else {
        const val = t.v * pendingMul;
        sum += nextNeg ? -val : val;
        if (t.v === lastVal) curRun++; else curRun = 1;
        lastVal = t.v; if (curRun > maxRun) { maxRun = curRun; runVal = t.v; }
        if (t.v > maxVal) maxVal = t.v;
        nextNeg = false; pendingMul = 1; digits++; endsOnDigit = true;
        if (isPrime(t.v)) primes++;
        if (t.v % 2 === 0) evens++; else odds++;
        if (t.v % 3 === 0) mult3++;
      }
    }
    return { sum, digits, endsOnDigit, usedMinus, usedMul, usedDiv, badDiv, primes, evens, odds, mult3, maxRun, runVal, maxVal };
  }
  function chainValid() {
    const c = chainCalc();
    const okGroups = !enemy.divN || (c.digits === enemy.divN && c.maxRun === enemy.divN);
    // 整除盾：湊出 N 的倍數；否則一般固定目標
    const goalOk = enemy.divisor ? (c.sum > 0 && c.sum % enemy.divisor === 0) : (c.sum === target);
    return c.endsOnDigit && !c.badDiv && c.digits >= 2 && c.digits >= enemy.minLen
        && c.odds >= (enemy.needOdd || 0) && c.maxRun >= (enemy.needRun || 0)
        && okGroups && goalOk;
  }

  function renderChainUi() {
    const c = chainCalc();
    elSum.textContent = path.length ? c.sum : '–';
    elSum.className = !path.length ? ''
      : chainValid() ? 'exact'
      : enemy.divisor ? ''
      : (c.sum === target && c.endsOnDigit) ? 'short'
      : c.sum > target ? 'over' : '';
    elChain.textContent = `鏈 ×${c.digits}${c.digits >= 5 ? ' 🔥' : ''}`;
    elChain.dataset.chainNum = '' + c.digits;
    elChain.style.color = '';
    elChain.style.fontWeight = '';
    elChain.style.fontSize = '';
  }

  // ---------- 技能與提示 ----------
  function renderSkills() {
    elSkillRow.innerHTML = '';
    EQUIP.forEach(spId => {
      const sp = SP(spId), s = SKILL_DEFS[sp.skill];
      const cd = skillCd[sp.skill] || 0;
      const b = document.createElement('button');
      b.className = 'skillBtn' + (cd > 0 ? ' cooling' : '') + (targeting === sp.skill ? ' armed' : '');
      b.dataset.skill = sp.skill;
      b.innerHTML = `<span class="mini">${charSVG(spId)}</span><span class="skillIcon" aria-hidden="true"></span><span class="lbl"><b>${s.name}</b>${sp.name} Lv${COLL[spId] || 1}</span>${cd > 0 ? `<span class="cd">${cd}</span>` : ''}`;
      b.addEventListener('click', () => {
        if (locked || !enemy || enemy.hp <= 0) return;
        if ((skillCd[sp.skill] || 0) > 0) { toast(`還要 ${skillCd[sp.skill]} 條鏈才能再用`); return; }
        if (s.type === 'instant') { applyInstant(sp.skill); return; }
        if (targeting === sp.skill) { targeting = null; }
        else { targeting = sp.skill; toast(s.tip); }
        canvas.classList.toggle('targeting', !!targeting);
        renderSkills();
      });
      elSkillRow.appendChild(b);
    });
    if (isJr()) {
      const b = document.createElement('button');
      b.className = 'skillBtn' + (hintCd > 0 ? ' cooling' : '');
      b.dataset.skill = 'hint';
      b.innerHTML = `<span class="skillIcon" aria-hidden="true"></span><span class="lbl"><b>提示</b>找找看</span>${hintCd > 0 ? `<span class="cd">${hintCd}</span>` : ''}`;
      b.addEventListener('click', () => {
        if (locked || !enemy || enemy.hp <= 0) return;
        if (hintCd > 0) { toast(`再打 ${hintCd} 條鏈就能再提示`); return; }
        const p = findSolutionPath(valuesOf(), target, solverOpt());
        if (!p) { toast('咦，先打一條鏈看看吧！'); return; }
        hintCells = p; hintT = 110; hintCd = 2;
        if (foeStat) foeStat.hints++;
        log('hint', { stage: stg().key });
        say('找找看，亮亮的珠珠');
        blip(880, .12);
        renderSkills();
      });
      elSkillRow.appendChild(b);
    }
  }

  function spendSkill(id) {
    log('skill', { skill: id, stage: stg().key, foe: foeIdx + 1 });
    skillCd[id] = SKILL_DEFS[id].cd;
    targeting = null;
    canvas.classList.remove('targeting');
    renderSkills();
  }

  function afterSkillBoardCheck() {
    if (countSolutions(valuesOf(), target, { ...solverOpt(), cap: 1 }).count === 0) {
      toast('找不到解，盤面洗牌！');
      freshTiles(genBoardValues(stg().minusRate, stg().maxDigit, stg().size, stg().mulRate || 0, stg().divRate || 0), true);
      setupTargetForEnemy();
      renderHud();
    }
  }

  function applyInstant(id) {
    if (id === 'lucky') { luckyNext = true; addFloater('🍀 下一鏈 ×1.5！', '#a3d65c', 22); blip(660, .12); }
    if (id === 'shield') { shieldUp = true; addFloater('🛡️ 護盾展開！', '#7be3ff', 22); blip(520, .15); }
    spendSkill(id);
    renderHud();
  }

  function removeAndRefill(removedSet) {
    for (let c = 0; c < SIZE; c++) {
      const col = [];
      for (let r = SIZE - 1; r >= 0; r--) if (!removedSet.has(r * SIZE + c)) col.push({ t: tiles[r][c], r });
      let write = SIZE - 1;
      for (const { t, r } of col) {
        tiles[write][c] = t;
        if (write > r) t.off = -(write - r) * CELL;
        write--;
      }
      for (let r = write; r >= 0; r--) tiles[r][c] = { v: randCell(stg().minusRate, stg().maxDigit, stg().mulRate || 0, stg().divRate || 0), off: -(r + 1.5) * CELL, scale: 1 };
    }
  }

  function applySkill(cell) {
    const t = tiles[cell.r][cell.c];
    const id = targeting;
    if (id === 'plus1') {
      if (isOp(t)) { toast('運算珠不能加一'); return; }
      t.v = t.v >= 9 ? 1 : t.v + 1;
      if (t.v === 1) toast('9 轉了一圈變回 1！');
      t.scale = .55; blip(700, .1);
    } else if (id === 'minus1') {
      if (isOp(t)) { toast('運算珠不能減一'); return; }
      t.v = t.v <= 1 ? 9 : t.v - 1;
      if (t.v === 9) toast('1 轉了一圈變成 9！');
      t.scale = .55; blip(500, .1);
    } else if (id === 'reroll') {
      t.v = randCell(stg().minusRate, stg().maxDigit, stg().mulRate || 0, stg().divRate || 0); t.scale = .55; blip(440, .1, 'triangle');
    } else if (id === 'swapUp') {
      if (cell.r === 0) { toast('最上排沒有上面可以換！'); return; }
      const up = tiles[cell.r - 1][cell.c];
      const tmp = t.v; t.v = up.v; up.v = tmp;
      t.scale = .55; up.scale = .55; blip(580, .08); blip(620, .08);
    } else if (id === 'purify') {
      locked = true;
      removeAndRefill(new Set([cell.r * SIZE + cell.c]));
      blip(740, .12); blip(880, .14);
    } else if (id === 'split') {
      if (isOp(t)) { toast('運算珠不能分裂'); return; }
      if (t.v < 2) { toast('1 沒辦法再拆了！'); return; }
      if (cell.r === 0) { toast('最上排不能分裂（上面沒有位置）'); return; }
      splitCell = cell;
      openSplitPicker(t.v);
      return;
    }
    spendSkill(id);
    afterSkillBoardCheck();
  }

  function openSplitPicker(v) {
    $('splitDesc').innerHTML = `把 <b style="color:#ffd84d">${v}</b> 拆成哪兩個數？<br><span style="font-size:12px;opacity:.7">第一個數會放在原位，第二個數會蓋掉上面那顆珠</span>`;
    const box = $('splitChoices');
    box.innerHTML = '';
    for (let a = 1; a <= Math.floor(v / 2); a++) {
      const b = document.createElement('button');
      b.className = 'splitBtn';
      b.textContent = `${v - a} ＋ ${a}`;
      b.addEventListener('click', () => doSplit(v - a, a));
      box.appendChild(b);
    }
    show('splitOverlay');
  }

  function doSplit(a, b) {
    hide('splitOverlay');
    if (!splitCell) return;
    const { r, c } = splitCell;
    tiles[r][c].v = a; tiles[r][c].scale = .55;
    tiles[r - 1][c].v = b; tiles[r - 1][c].scale = .55;
    blip(600, .08); blip(800, .1);
    splitCell = null;
    spendSkill('split');
    afterSkillBoardCheck();
  }

  // ---------- 繪圖 ----------
  const inPath = (r, c) => path.some(p => p.r === r && p.c === c);
  // === CANVAS_VISUAL_BEGIN: Codex 可編輯以下「純繪圖」程式 ===
  // 規則:這段只決定「畫成什麼樣子」。
  //   ✅ 可改:珠子外觀(厚底/亮面/外框/陰影/圓角)、數字字體與描邊/陰影、特殊珠 icon、
  //           路徑線、hint 框、粒子顏色、純繪圖 helper、只讀 BOARD_C(=CSS 變數)的視覺值。
  //   ❌ 不可:讀寫遊戲狀態(tiles/path/enemy/target/傷害/冷卻…)、改判定或任何數值。
  //   幾何與語義(座標、是哪種珠、選不選取、要顯示的字)都由 draw() 算好後當參數傳進來。
  function roundRect(x, y, w, h, rad) {
    w = Math.max(0, w); h = Math.max(0, h);          // 防呆：尺寸不為負
    rad = Math.max(0, Math.min(rad, w / 2, h / 2));  // 半徑夾在 0 ~ 邊長一半，避免 arcTo 負半徑
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }

  // 數字珠依數值取色階(1-3 / 4-6 / 7+),sel=選取高亮
  const tileColor = v => BOARD_C.digits[v] || (v <= 3 ? BOARD_C.num1 : v <= 6 ? BOARD_C.num2 : BOARD_C.num3);
  const tileColorHi = v => BOARD_C.digitsHi[v] || (v <= 3 ? BOARD_C.num1Hi : v <= 6 ? BOARD_C.num2Hi : BOARD_C.num3Hi);
  function beadFill(kind, value, sel, banned) {
    if (banned) return BOARD_C.banned;
    if (kind === 'div') return sel ? BOARD_C.divHi : BOARD_C.div;
    if (kind === 'mul') return sel ? BOARD_C.mulHi : BOARD_C.mul;
    if (kind === 'minus') return sel ? BOARD_C.minusHi : BOARD_C.minus;
    return sel ? tileColorHi(value) : tileColor(value);
  }

  function drawBoardBg() {
    ctx.fillStyle = BOARD_C.bg;
    roundRect(0, 0, BOARD_PX, BOARD_PX, BOARD_C.boardRadius); ctx.fill();
    const gap = Math.max(2, CELL * .035);
    const pad = CELL * .025;
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
      const x = c * CELL + pad, y = r * CELL + pad, w = CELL - pad * 2;
      ctx.fillStyle = 'rgba(255,248,223,.035)';
      roundRect(x + gap, y + gap, w - gap * 2, w - gap * 2, Math.max(8, CELL * .16)); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.18)';
      ctx.lineWidth = 1;
      roundRect(x + gap, y + gap, w - gap * 2, w - gap * 2, Math.max(8, CELL * .16)); ctx.stroke();
    }
  }

  // 提示框。alpha 由 draw() 依 hint 動畫給。
  function drawHintCell(cellX, cellY, cellW, alpha) {
    ctx.strokeStyle = `rgba(${BOARD_C.hintRgb},${alpha})`;
    ctx.lineWidth = BOARD_C.hintWidth;
    roundRect(cellX + 2, cellY + 2, cellW - 4, cellW - 4, 10);
    ctx.stroke();
  }

  // 拖鏈路徑線。pts:[{x,y}],kind:'valid'|'hit'|'over'|'under',digits:鏈長(發光用)
  function drawPathLine(pts, kind, digits) {
    if (pts.length < 2) return;
    const color = kind === 'valid' ? BOARD_C.pathValid
      : kind === 'hit' ? BOARD_C.pathHit
      : kind === 'over' ? BOARD_C.pathOver : BOARD_C.pathUnder;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(11,9,16,.9)';
    ctx.lineWidth = CELL * Math.min(.21 + digits * .012, .30);
    ctx.beginPath();
    pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = CELL * Math.min(.12 + digits * .01, .18);
    if (digits >= 4) { ctx.shadowColor = color; ctx.shadowBlur = BOARD_C.pathGlow + digits * 2; }
    ctx.beginPath();
    pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.stroke();
    ctx.shadowBlur = 0;
    pts.forEach(p => {
      ctx.fillStyle = 'rgba(255,248,223,.92)';
      ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(3, CELL * .045), 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(11,9,16,.92)'; ctx.lineWidth = 2; ctx.stroke();
    });
    ctx.shadowBlur = 0;
  }

  function drawBannedMark(x, y, w) {
    const cx = x + w * .78, cy = y + w * .22, r = w * .13;
    ctx.save();
    ctx.lineWidth = Math.max(2, w * .045);
    ctx.strokeStyle = 'rgba(255,255,255,.82)';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - r * .68, cy + r * .68); ctx.lineTo(cx + r * .68, cy - r * .68); ctx.stroke();
    ctx.restore();
  }

  function drawBeadSurface(x, y, w, rad, fill, sel, banned) {
    const outlineW = Math.max(0, BOARD_C.outlineW);
    const inner = Math.min(outlineW * .82, w * .13);
    const faceX = x + inner, faceY = y + inner * .7;
    const faceW = Math.max(2, w - inner * 2);
    const faceH = Math.max(2, w - inner * 2.05);
    const faceRad = Math.max(1, rad - inner * .55);

    // Thick black toy casing, closer to the mockup than a thin stroke.
    ctx.shadowColor = sel ? BOARD_C.selGlow : BOARD_C.shadow;
    ctx.shadowBlur = sel ? 16 : 5;
    ctx.fillStyle = BOARD_C.outline;
    roundRect(x, y + BOARD_C.thickH, w, w, rad); ctx.fill();
    ctx.shadowBlur = 0;

    if (!banned) {
      ctx.fillStyle = BOARD_C.thick;
      roundRect(x + inner * .55, y + BOARD_C.thickH + inner * .5, w - inner * 1.1, w - inner * .5, rad); ctx.fill();
    }

    ctx.fillStyle = BOARD_C.outline;
    roundRect(x, y, w, w, rad); ctx.fill();
    ctx.fillStyle = fill;
    roundRect(faceX, faceY, faceW, faceH, faceRad); ctx.fill();

    // Bottom lip gives each tile the toy-button weight seen in the AI mockup.
    if (!banned) {
      ctx.fillStyle = 'rgba(0,0,0,.16)';
      roundRect(faceX + faceW * .05, faceY + faceH * .70, faceW * .90, faceH * .23, faceRad * .65); ctx.fill();
    }

    if (BOARD_C.highlight !== 'transparent' && !banned) {
      ctx.fillStyle = BOARD_C.highlight;
      roundRect(faceX + faceW * .11, faceY + faceH * .08, faceW * .46, faceH * .14, faceRad * .55); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.18)';
      roundRect(faceX + faceW * .18, faceY + faceH * .22, faceW * .20, faceH * .08, faceRad * .35); ctx.fill();
    }

    if (sel) {
      ctx.lineWidth = Math.max(3, w * .07);
      ctx.strokeStyle = 'rgba(255,226,54,.95)';
      roundRect(x + 1.5, y + 1.5, w - 3, w - 3, rad); ctx.stroke();
      ctx.lineWidth = Math.max(1.5, w * .03);
      ctx.strokeStyle = 'rgba(255,255,255,.82)';
      roundRect(faceX + 1, faceY + 1, faceW - 2, faceH - 2, faceRad); ctx.stroke();
    }
  }

  // 單顆珠。o:{x,y,w,kind:'num'|'minus'|'mul'|'div',sel,banned,value,label}
  function drawBead(o) {
    const { x, y, w, kind, sel, banned, value, label, scale = 1 } = o;
    const fill = beadFill(kind, value, sel, banned);
    const rad = w * BOARD_C.beadRadius;
    drawBeadSurface(x, y, w, rad, fill, sel, banned);
    // 珠面文字 / 運算符
    const isOp = kind !== 'num';
    const fontSize = CELL * (isOp ? .32 : .52) * scale;
    ctx.font = `900 ${fontSize}px "Arial Rounded MT Bold","Trebuchet MS",-apple-system,sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const textY = y + w / 2 + (isOp ? 0 : 1.5);
    if (BOARD_C.numStrokeW > 0 && !banned) {
      ctx.lineWidth = BOARD_C.numStrokeW; ctx.strokeStyle = BOARD_C.numStroke; ctx.lineJoin = 'round';
      ctx.strokeText(label, x + w / 2, textY);
    }
    if (BOARD_C.numShadowBlur > 0) { ctx.shadowColor = BOARD_C.numShadow; ctx.shadowBlur = BOARD_C.numShadowBlur; }
    ctx.fillStyle = banned ? 'rgba(255,255,255,.35)' : (kind === 'num' ? BOARD_C.text : BOARD_C.icon);
    ctx.fillText(label, x + w / 2, textY);
    ctx.shadowBlur = 0;
    if (banned) drawBannedMark(x, y, w);
  }

  // 粒子 / 浮字(只讀對應陣列來畫,不改內容)
  function drawParticles() {
    particles.forEach(p => {
      ctx.globalAlpha = Math.max(0, 1 - p.t / p.life);
      const frames = p.fx && FX[p.fx];
      const img = frames && frames[p.frame % frames.length];
      if (img && img.complete && img.naturalWidth) {
        const s = p.size * (1 + p.t / p.life * .12);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot + p.t * .08);
        ctx.drawImage(img, -s / 2, -s / 2, s, s);
        ctx.restore();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    });
  }
  function drawFloaters() {
    floaters.forEach(f => {
      ctx.globalAlpha = Math.max(0, 1 - f.t / 60);
      ctx.fillStyle = f.color;
      ctx.font = `900 ${f.size + f.t * .2}px -apple-system,sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(f.text, f.x, f.y - f.t * 1.2);
      ctx.globalAlpha = 1;
    });
  }
  // === CANVAS_VISUAL_END ===

  // draw() = 編排層(Claude 擁有):讀遊戲狀態算出幾何+語義,再交給上面的視覺 helper 畫。
  // Codex 一般不需改這裡;要改外觀請改 CANVAS_VISUAL 區段或 game.css。
  function draw() {
    ctx.clearRect(0, 0, BOARD_PX, BOARD_PX);
    drawBoardBg();
    if (!tiles.length) return;

    if (hintT > 0 && hintCells) {
      const alpha = .75 + .25 * Math.sin(hintT * .25);
      hintCells.forEach(p => {
        if (p.r >= SIZE || p.c >= SIZE) return;
        drawHintCell(p.c * CELL, p.r * CELL, CELL, alpha);
      });
    }

    if (path.length > 1) {
      const cc = chainCalc();
      const kind = chainValid() ? 'valid'
        : (cc.sum === target && cc.endsOnDigit) ? 'hit'
        : cc.sum > target ? 'over' : 'under';
      const pts = [];
      path.forEach(p => {
        const t0 = tiles[p.r] && tiles[p.r][p.c]; if (!t0) return;
        pts.push({ x: p.c * CELL + CELL / 2, y: p.r * CELL + CELL / 2 + t0.off });
      });
      drawPathLine(pts, kind, cc.digits);
    }

    const banned = enemy ? enemy.banned : 0;
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
      const t = tiles[r][c];
      if (t.popped) continue;          // 逐步結算中已彈出的珠不畫
      const minus = isMinus(t), mul = isMul(t), div = isDiv(t);
      const isBanned = !minus && !mul && !div && banned && t.v === banned;
      const sel = inPath(r, c);
      const pad = CELL * BOARD_C.beadPad, s = t.scale;
      const w = (CELL - pad * 2) * s;
      const x = c * CELL + (CELL - w) / 2;
      const y = r * CELL + (CELL - w) / 2 + t.off;
      const kind = div ? 'div' : mul ? 'mul' : minus ? 'minus' : 'num';
      const label = minus ? '−' : mul ? ('×' + mulFactor(t)) : div ? ('÷' + divFactor(t)) : ('' + t.v);
      drawBead({ x, y, w, kind, sel, banned: isBanned, value: t.v, label, scale: s });
    }

    drawParticles();
    drawFloaters();
  }

  function tick() {
    let busy = false;
    for (const row of tiles) for (const t of row) {
      if (t.off < 0) { t.off = Math.min(0, t.off + CELL * .45); busy = true; }
      if (t.scale < 1 && !t.popped) { t.scale = Math.min(1, t.scale + .12); busy = true; }
    }
    floaters.forEach(f => f.t++);
    floaters = floaters.filter(f => f.t < 60);
    particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .28; p.t++; });
    particles = particles.filter(p => p.t < p.life);
    if (hintT > 0) hintT--;
    if (!busy && locked && !pendingAction) { locked = false; solveStart = Date.now(); }   // 盤面結算/補滿完成且敵人動作已結束 → 下一題計時起點
    // draw 用 try 包住：任何一幀出錯也不會讓整個繪製迴圈死掉（盤面消失）
    try { draw(); }
    catch (e) {
      if (!window.__drawErr) { window.__drawErr = e.message; console.error('draw error:', e);
        try { toast('⚠️ 繪製錯誤：' + e.message, 8000); } catch (_) {} }
    }
    requestAnimationFrame(tick);
  }

  // ---------- 輸入 ----------
  function cellAt(px, py) {
    const c = Math.floor(px / CELL), r = Math.floor(py / CELL);
    if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) return null;
    const cx = c * CELL + CELL / 2, cy = r * CELL + CELL / 2;
    if (Math.hypot(px - cx, py - cy) > CELL * .42) return null;
    return { r, c };
  }
  const adjacent = (a, b) => Math.abs(a.r - b.r) <= 1 && Math.abs(a.c - b.c) <= 1 && !(a.r === b.r && a.c === b.c);
  function pos(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }
  function canAppend(cell) {
    const t = tiles[cell.r][cell.c];
    if (enemy.banned && !isOp(t) && t.v === enemy.banned) return false;
    if (!path.length) return !isOp(t);              // 不能以運算珠開頭
    const last = tiles[path[path.length - 1].r][path[path.length - 1].c];
    if (isOp(t) && isOp(last)) return false;        // 運算珠後面不能再接運算珠
    if (isDiv(t)) {                                  // ÷ 珠：須接在數字後、且目前總和能整除
      const c = chainCalc();
      if (!c.endsOnDigit || c.sum <= 0 || c.sum % divFactor(t) !== 0) return false;
    }
    return true;
  }

  canvas.addEventListener('pointerdown', e => {
    if (resolving) { e.preventDefault(); if (resolveSkip) resolveSkip(); return; }   // 結算動畫中再點一下 = 快轉
    if (locked || !enemy || enemy.hp <= 0 || !player || player.hp <= 0) return;
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    const p = pos(e), cell = cellAt(p.x, p.y);
    if (!cell) return;
    if (targeting) { applySkill(cell); return; }
    if (!canAppend(cell)) return;
    if (!firstMoveLogged) {
      firstMoveLogged = true;
      log('first_move', { stage: stg().key, foe: foeIdx + 1, latency_ms: Date.now() - boardReadyAt });
    }
    dragging = true; dragT0 = Date.now();
    path = [cell];
    spawnDragSpark(cell.c * CELL + CELL / 2, cell.r * CELL + CELL / 2, 3);
    blip(330 + tiles[cell.r][cell.c].v * 30);
    renderChainUi();
  });

  canvas.addEventListener('pointermove', e => {
    if (!dragging || locked) return;
    e.preventDefault();
    const p = pos(e), cell = cellAt(p.x, p.y);
    if (!cell) return;
    const last = path[path.length - 1];
    if (cell.r === last.r && cell.c === last.c) return;
    if (path.length > 1 && cell.r === path[path.length - 2].r && cell.c === path[path.length - 2].c) {
      path.pop(); blip(240, .05); renderChainUi(); return;
    }
    if (adjacent(cell, last) && !inPath(cell.r, cell.c) && canAppend(cell)) {
      path.push(cell);
      spawnDragSpark(cell.c * CELL + CELL / 2, cell.r * CELL + CELL / 2, 2);
      blip(330 + path.length * 60 + tiles[cell.r][cell.c].v * 10);
      renderChainUi();
    }
  });

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    const cc = chainCalc(), dragMs = Date.now() - dragT0;
    if (cc.digits >= 2) {
      const valid = chainValid();
      const oddShort = cc.endsOnDigit && cc.sum === target && cc.digits >= enemy.minLen
                    && cc.odds < (enemy.needOdd || 0);
      const runShort = cc.endsOnDigit && cc.sum === target && cc.digits >= enemy.minLen
                    && cc.odds >= (enemy.needOdd || 0) && cc.maxRun < (enemy.needRun || 0);
      const goalMet = enemy.divisor ? (cc.sum > 0 && cc.sum % enemy.divisor === 0) : (cc.sum === target);
      const divBad = enemy.divN && cc.endsOnDigit && cc.sum === target
                    && !(cc.digits === enemy.divN && cc.maxRun === enemy.divN);
      const divisorMiss = enemy.divisor && cc.endsOnDigit && !cc.badDiv && !goalMet;
      if (foeStat) { foeStat.attempts++; if (!valid) foeStat.fails++; }
      const capE = captainDef() ? captainDef().calc(cc) : {};
      // 學習數據:本鏈練到的運算別、數字範圍、解題反應時間(扣掉結算動畫)
      const ops = chainOps(cc);
      const rng = opRange(enemy.divisor ? cc.sum : target);
      const solveMs = Math.max(0, Date.now() - (solveStart || boardReadyAt));
      recordMastery(ops, rng, valid, solveMs);
      log('chain', { stage: stg().key, foe: foeIdx + 1, len: cc.digits, sum: cc.sum, target,
        valid, used_minus: cc.usedMinus, used_mul: cc.usedMul, used_div: cc.usedDiv, odds: cc.odds, primes: cc.primes, run: cc.maxRun,
        cap: captainAttr(), cap_mult: +(capE.mult || 1).toFixed(2), cap_addlen: capE.addLen || 0, combo: valid ? combo + 1 : combo,
        ops, range: rng, max_operand: cc.maxVal, solve_ms: solveMs,
        reason: valid ? 'ok' : cc.badDiv ? 'bad_div' : !cc.endsOnDigit ? 'end_op'
              : divisorMiss ? 'divisor_miss' : !goalMet ? 'sum'
              : divBad ? 'div_shield' : oddShort ? 'odd_shield' : runShort ? 'run_shield' : 'short',
        minLen: enemy.minLen, banned: enemy.banned, need_odd: enemy.needOdd || 0, need_run: enemy.needRun || 0,
        div_n: enemy.divN || 0, divisor: enemy.divisor || 0, drag_ms: dragMs });
      if (valid) { resolveChain(); return; }
      if (cc.badDiv) toast('÷ 珠要整除才能用！(這個數除不盡)');
      else if (!cc.endsOnDigit) toast('鏈不能以運算珠（−／×）結尾！');
      else if (divisorMiss) toast(`要湊出 ${enemy.divisor} 的倍數！${cc.sum} 不是（${enemy.divisor}、${enemy.divisor*2}、${enemy.divisor*3}…）`, 2600);
      else if (divBad) toast(`等分盾！要連剛好 ${enemy.divN} 顆「${target / enemy.divN}」（${target}÷${enemy.divN}=${target / enemy.divN}）➗`, 2600);
      else if (oddShort) toast(`奇數盾！鏈裡要有 ${enemy.needOdd} 顆以上奇數 🔆`);
      else if (runShort) toast(`共鳴盾！要連 ${enemy.needRun} 顆相同數字 🔢`);
      else if (cc.sum === target) toast(`鏈太短了！這隻怪需要 ${enemy.minLen} 顆以上 🛡️`);
      blip(160, .12, 'triangle');
    }
    path = []; renderChainUi();
  }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  // ---------- 結算 ----------
  function resolveChain() {
    locked = true;
    hintCells = null; hintT = 0;
    const cc = chainCalc();
    const len = cc.digits;
    // 隊長技：只讀路徑組成，回傳傷害倍率 / 額外鏈長 / 爆擊
    const cap = captainDef();
    const capEff = cap ? cap.calc(cc) : {};
    const effLen = len + (capEff.addLen || 0);
    // 同數共鳴：連 R 顆相同數字 = 乘法，傷害 ×(1 + 0.5×(R-1))
    // 同數共鳴只有「進入乘法谷解鎖後」才生效（之前連相同數字只是普通加總）
    const resOn = RESON && cc.maxRun >= 2;
    const resMult = resOn ? 1 + 0.5 * (cc.maxRun - 1) : 1;
    // 連擊：每條有效鏈 combo+1，傷害倍率漸升（上限 ×2.5）。combo 只在敵人行動時歸零。
    combo++;
    const comboMult = Math.min(2.5, 1 + 0.15 * (combo - 1));
    let dmg = Math.round(baseDmg() * effLen * (capEff.mult || 1) * resMult * comboMult);
    if (resOn) {
      if (SHOW_BATTLE_TEXT_FX) {
        addFloater(`🔢 ${cc.runVal}×${cc.maxRun} 共鳴！`, '#ffae3d', 24 + cc.maxRun * 3, 0, 30);
      }
      blip(660, .1, 'triangle', .18); blip(880, .12, 'triangle', .18);
      teach('resonance', '✖️ 同數共鳴 = 乘法！',
        '<span style="font-size:40px;color:#ffae3d">4+4+4</span>',
        `你剛剛把<b>幾顆一樣的數字</b>連在一起——這就是<b>乘法</b>！<br><b style="color:#ffae3d">${cc.runVal}+${cc.runVal}+…（${cc.maxRun} 個）= ${cc.runVal}×${cc.maxRun}</b><br>連越多顆相同數字，<b>共鳴傷害越高</b>！`);
    }
    if (capEff.proc) {
      if (SHOW_BATTLE_TEXT_FX) {
        addFloater(`${cap.ic} ${capEff.tag}`, cap.c, capEff.crit ? 30 : 22, -64, -18);
      }
      blip(capEff.crit ? 988 : 740, .12, 'triangle', .16);
    }
    if (luckyNext) {
      dmg = Math.round(dmg * 1.5);
      luckyNext = false;
      if (SHOW_BATTLE_TEXT_FX) addFloater('🍀 ×1.5！', '#a3d65c', 24);
    }
    if (combo >= 2) {
      showCombo(combo);   // 持續顯示的連擊計量器（跨鏈累積）
      blip(440 + Math.min(combo, 12) * 45, .09, 'triangle', .15);
      if (combo >= 5) flash('#ffd84d', .18);
      if (isJr()) say('連擊！');
    }
    if (combo > (stageStat.maxCombo || 0)) stageStat.maxCombo = combo;
    if (towerMode && dmg > towerPeak) towerPeak = dmg;   // 紀錄本次塔內最高單發攻擊力
    stageStat.chains++; stageStat.lenSum += len;
    if (cc.usedMinus) stageStat.minusChains++;
    if (len > stageStat.maxChain) stageStat.maxChain = len;
    if (hintCd > 0) hintCd--;

    const praise = len >= 7 ? ['傳說拆解！！！', '#ffd84d', 40]
                 : len >= 6 ? ['超絕拆解！！', '#ffd84d', 34]
                 : len >= 5 ? ['厲害！', '#ff9bf2', 30]
                 : len >= 4 ? ['精彩！', '#9ecbff', 26] : null;
    if (SHOW_CHAIN_TEXT_FX && praise) { addFloater(praise[0], praise[1], praise[2], 0, -42); if (isJr()) say('太棒了！'); }
    else if (!SHOW_CHAIN_TEXT_FX && praise && isJr()) say('太棒了！');
    if (SHOW_CHAIN_TEXT_FX && cc.usedMinus) addFloater('減法！', '#c5a3ff', 20, -60, -30);
    if (SHOW_CHAIN_TEXT_FX) addFloater(`×${len}`, tierColor(len), 24 + len * 5, 44, -6);

    // ---- 逐步結算動畫：沿路徑一顆顆彈出、傷害一格格累加，最後砸進怪物 ----
    const cells = path.slice();
    path = []; renderChainUi();
    const N = Math.max(1, cells.length);
    // 傷害數字用「固定可讀時長」平滑累加：鏈越長、連擊越高，戲劇時間略長（即使短鏈也看得清）
    const countDur = Math.min(1150, 480 + N * 70 + Math.min(combo, 8) * 45);
    const stepMs = Math.max(85, Math.min(170, countDur / N));   // 每顆珠至少看得到（≥85ms）
    const popColor = t => isDiv(t) ? BOARD_C.divHi : isMul(t) ? BOARD_C.mulHi : isMinus(t) ? BOARD_C.minusHi : tileColorHi(t.v);
    const nowMs = () => (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    let popped = 0, done = false, popTimer = 0, countRAF = 0;
    const t0 = nowMs();
    resolving = true; showDmgPop(0);
    // 數字累加用 rAF 平滑跑（easeOutCubic），與珠子彈出獨立，確保固定可讀時長
    function countUp() {
      const k = Math.min(1, (nowMs() - t0) / countDur);
      showDmgPop(Math.round(dmg * (1 - Math.pow(1 - k, 3))));
      if (k < 1 && !done) countRAF = requestAnimationFrame(countUp);
    }
    countRAF = requestAnimationFrame(countUp);

    function applyResult() {
      if (done) return; done = true; resolving = false; resolveSkip = null;
      setTimeout(hideDmgPop, 340);   // 放大定格停留一下再消失，看得清最終傷害
      // 擊退：鏈越長怪物被打飛越遠（暫停 idle 動畫讓位移可見）
      const kb = Math.min(10 + len * 5, 46);
      elArt.classList.add('hit'); elArt.style.animation = 'none';
      elArt.style.transform = `translateX(${kb}px) scale(${Math.max(.7, .92 - len * .03)}) rotate(-${4 + len * 2}deg)`;
      renderEnemyArt('hurt');   // 受擊表情
      setTimeout(() => { elArt.classList.remove('hit'); elArt.style.transform = ''; elArt.style.animation = ''; }, 180 + len * 25);
      setTimeout(() => { if (enemy && enemy.hp > 0) renderEnemyArt(enemy.enraged ? 'enraged' : 'idle'); }, 520);
      removeAndRefill(new Set(cells.map(p => p.r * SIZE + p.c)));
      for (const k in skillCd) if (skillCd[k] > 0) skillCd[k]--;
      enemy.hp -= dmg;
      enemy.cd--;

    // 魔王二階段：血量過半 → 狂暴化（各魔王機制不同）
    if (enemy.isBoss && !enemy.enraged && enemy.hp > 0 && enemy.hp <= enemy.maxHp / 2) {
      enemy.enraged = true;
      if (!isJr()) enemy.atk = Math.round(enemy.atk * 1.5);
      enemy.every = Math.max(isJr() ? 3 : 2, enemy.every - 1);
      enemy.shiftCounter = 0;
      let msg = isJr() ? '⚠️ 大王生氣了！搗蛋會變快！' : '⚠️ 狂暴化！攻擊變強、行動變快！';
      if (enemy.bossKind === 'bossShell') {
        enemy.minLen = Math.min(enemy.minLen + 1, 5);
        msg = `⚠️ 狂暴化！硬殼變更硬：需要 ${enemy.minLen} 顆以上的鏈！`;
      } else if (enemy.bossKind === 'bossBan') {
        msg = '⚠️ 狂暴化！封印會一直亂換！';
      } else if (enemy.bossKind === 'bossRun') {
        enemy.needRun = Math.min(enemy.needRun + 1, 4);
        msg = `⚠️ 狂暴化！共鳴盾變強：要連 ${enemy.needRun} 顆相同數字！`;
      } else if (enemy.bossKind === 'bossDiv') {
        enemy.divN = Math.min(enemy.divN + 1, 4);
        msg = `⚠️ 狂暴化！等分盾變強：要分成 ${enemy.divN} 等份！`;
        setupTargetForEnemy();   // 重抽一個能被新份數整除的目標
      } else if (enemy.bossKind === 'bossDivisor') {
        enemy.divisor = Math.min(enemy.divisor + 1, 6);
        msg = `⚠️ 狂暴化！整除盾變強：要湊出 ${enemy.divisor} 的倍數！`;
      } else if (enemy.bossKind === 'boss') {
        msg = '⚠️ 魔王狂暴化！攻擊變強、目標會一直亂變！';
      }
      renderEnemyArt('enraged');   // 狂暴表情
      elArt.classList.add('enraged');
      $('enemyZone').classList.add('enraged');
      flash('#ff2828', .4);
      blip(76, .5, 'sawtooth', .28); blip(64, .6, 'sawtooth', .28);
      $('app').classList.add('shake');
      setTimeout(() => $('app').classList.remove('shake'), 500);
      toast(msg, 3000);
      say(isJr() ? '大王生氣了！加油！' : '魔王生氣了！小心！');
      log('boss_enrage', { stage: stg().key, kind: enemy.bossKind });
      // 硬殼/共鳴盾提升後，確認盤面仍有解
      if (enemy.bossKind === 'bossShell' || enemy.bossKind === 'bossRun' || enemy.bossKind === 'bossDiv') setTimeout(afterSkillBoardCheck, 400);
    } else if (enemy.isBoss && enemy.enraged && enemy.hp > 0) {
      enemy.shiftCounter++;
      if (enemy.shiftCounter >= 2) {
        enemy.shiftCounter = 0;
        const [lo, hi] = ddaBand();
        if (enemy.bossKind === 'boss') {
          // 亂數魔王：目標亂變
          const nt = pickTarget(valuesOf(), lo, hi, solverOpt());
          if (nt !== -1 && nt !== target) {
            target = nt;
            flash('#b07ce8', .3);
            addFloater(`亂數！目標 → ${target}`, '#b07ce8', 24, 0, 30);
            blip(440, .08); blip(330, .1);
            say(`目標變成 ${target}`);
          }
        } else if (enemy.bossKind === 'bossBan') {
          // 洞窟王：封印的數字亂換
          const cands = [2,3,4,5,6,7,8].filter(d => d !== enemy.banned).sort(() => Math.random() - .5);
          for (const d of cands) {
            const old = enemy.banned;
            enemy.banned = d;
            const nt = pickTarget(valuesOf(), lo, hi, solverOpt());
            if (nt !== -1) {
              target = nt;
              flash('#4a4a58', .3);
              addFloater(`封印亂換！🚫 ${d}`, '#9aa0b8', 24, 0, 30);
              blip(300, .1); blip(240, .12);
              say(`封印變成 ${d}`);
              break;
            }
            enemy.banned = old;
          }
        }
      }
    }

    const ep = battleEpoch;   // 本次結算所屬戰局;離開/換關後殘留計時器靠它失效
    if (enemy.hp <= 0) {
      log('enemy_kill', { stage: stg().key, foe: foeIdx + 1 });
      pendingAction = true;   // 換怪/結算過場期間擋住玩家輸入
      if (towerMode) {
        DRAWS++; towerDrawsRun++; save('nh5_draws', DRAWS);
        log('tower_floor', { floor: towerFloor, peak: towerPeak });
        player.hp = Math.min(player.maxHp, player.hp + 12);
        addFloater(`🗼 ${towerFloor}F 通過！🥚+1`, '#ffd84d', 24, 0, 30);
        towerFloor++;
        setTimeout(() => { if (ep !== battleEpoch) return; pendingAction = false; buildTowerFloor(towerFloor); spawnEnemy(); }, 600);
      } else {
        updateDDA(true);
        if (foeIdx + 1 >= stg().foes.length) { setTimeout(() => { if (ep !== battleEpoch) return; pendingAction = false; stageClear(); }, 550); }
        else {
          foeIdx++;
          player.hp = Math.min(player.maxHp, player.hp + 15);
          toast('淨化成功！✨');
          setTimeout(() => { if (ep !== battleEpoch) return; pendingAction = false; spawnEnemy(); }, 550);
        }
      }
    } else if (enemy.cd <= 0) {
      pendingAction = true;   // 敵人即將出手,擋住玩家偷一步
      setTimeout(() => {
        if (ep !== battleEpoch) return;
        enemy.cd = enemy.every;
        combo = 0; hideCombo();   // 敵人行動 → 連擊中斷
        if (isJr()) {
          // 搗蛋：打亂幾顆珠，不傷人
          const n = 4;
          for (let i = 0; i < n; i++) {
            const r = rnd(SIZE), c = rnd(SIZE);
            tiles[r][c].v = randCell(stg().minusRate, stg().maxDigit, stg().mulRate || 0, stg().divRate || 0);
            tiles[r][c].scale = .5;
          }
          addFloater('搗蛋！打亂了珠珠 🌀', '#ffd84d', 20);
          say('哎呀，怪物搗蛋了！');
          blip(220, .15, 'triangle');
          afterSkillBoardCheck();
        } else if (shieldUp) {
          shieldUp = false;
          addFloater('🛡️ 擋下了！', '#7be3ff', 24);
          blip(520, .2);
        } else {
          player.hp -= enemy.atk;
          log('player_hit', { stage: stg().key, dmg: enemy.atk });
          addFloater(`受到 ${enemy.atk} 傷害！`, '#ff7a7a', 22);
          blip(110, .25, 'sawtooth', .2);
          $('app').classList.add('shake'); setTimeout(() => $('app').classList.remove('shake'), 400);
        }
        renderHud();
        if (player.hp <= 0) { if (towerMode) towerEnd(false); else stageFail(); }
        pendingAction = false;
      }, 450);
    }

    setTimeout(() => {
      if (ep !== battleEpoch) return;
      if (enemy.hp > 0 && player.hp > 0 &&
          countSolutions(valuesOf(), target, { ...solverOpt(), cap: 1 }).count === 0) {
        toast('找不到解，盤面洗牌！');
        freshTiles(genBoardValues(stg().minusRate, stg().maxDigit, stg().size, stg().mulRate || 0, stg().divRate || 0), true);
        setupTargetForEnemy();
      }
      renderHud();
    }, 320);
      renderHud();
    }   // applyResult 結束

    function bigPunch() {
      cancelAnimationFrame(countRAF);
      showDmgPop(dmg, true);   // 最後放大定格（combo 越高顏色越金）
      playBattleFx('slash');
      setTimeout(() => playBattleFx('impact'), 110);
      if (combo >= 4 || len >= 5) {
        flash(combo >= 6 ? '#ffd84d' : combo >= 4 ? '#ff9bf2' : len >= 6 ? '#ffd84d' : '#fff',
              combo >= 6 || len >= 6 ? .4 : .28);
        $('app').classList.add('shake');
        setTimeout(() => $('app').classList.remove('shake'), combo >= 6 || len >= 6 ? 520 : 360);
      }
    }
    function popStep() {
      if (popped < N) {
        const p = cells[popped];
        const t = tiles[p.r] && tiles[p.r][p.c];
        if (t) { spawnParticles(p.c * CELL + CELL / 2, p.r * CELL + CELL / 2, popColor(t), Math.min(4 + len * 2, 14)); t.popped = true; }
        popped++;
        blip(500 + Math.min(popped, 14) * 50, .07, 'triangle', .13);
        popTimer = setTimeout(popStep, stepMs);
      } else {
        // 珠子彈完後，等數字也跑到底再放大定格（保證可讀時長）
        const remain = Math.max(0, countDur - (nowMs() - t0));
        popTimer = setTimeout(() => { bigPunch(); applyResult(); }, remain);
      }
    }
    function skipPop() {
      clearTimeout(popTimer); cancelAnimationFrame(countRAF);
      for (; popped < N; popped++) { const p = cells[popped]; const t = tiles[p.r] && tiles[p.r][p.c]; if (t) t.popped = true; }
      bigPunch();
      applyResult();
    }
    resolveSkip = skipPop;
    popStep();
  }

  // ---------- 蛋與孵化 ----------
  // 抽蛋池：依玩家進度（已破關的最高區域）決定，越深入池越大
  function curMaxPool() {
    if (isJr()) return 1;
    let z = 0; STAGES.forEach(s => { if ((STARS[s.key] || 0) > 0) z = Math.max(z, s.zone); });
    return z;
  }
  function drawSpecies() {
    const pool = SPECIES.filter(s => s.pool <= curMaxPool());
    return pool[rnd(pool.length)].id;
  }
  // 星星 → 抽蛋機會：依「這次新拿到的星星數」給券（沒進步的重玩 30% 給 1）
  function drawsEarned(prevStars, stars) {
    const gain = Math.max(0, stars - prevStars);
    return gain > 0 ? gain : (Math.random() < .3 ? 1 : 0);
  }

  // ---------- 孵化所（專屬抽蛋頁）----------
  function openGacha() {
    hide('resultOverlay'); hide('selectOverlay');
    renderGacha(true);
    show('gachaOverlay');
  }
  function renderGacha(idle) {
    $('gachaCount').innerHTML = `抽蛋機會 <span class="sCountBadge">${DRAWS}</span> 次`;
    $('gachaDrawBtn').classList.toggle('disabled', DRAWS <= 0);
    $('gachaDrawBtn').textContent = DRAWS > 0 ? '孵化一次' : '沒有機會了';
    if (idle) {
      const art = $('gachaArt');
      art.classList.remove('hatched', 'pop');
      art.classList.toggle('wob', DRAWS > 0);   // 蛋台由 CSS 背景圖呈現(summon_egg_stage_ready)
      art.innerHTML = '';
      $('gachaMsg').innerHTML = DRAWS > 0 ? '點「孵化一次」召喚數靈！' : '去過關拿星星，換更多孵化機會吧！';
    }
  }
  function drawOne() {
    if (DRAWS <= 0) { toast('沒有抽蛋機會了，去過關拿星星！'); return; }
    DRAWS--; save('nh5_draws', DRAWS);
    const spId = drawSpecies(), sp = SP(spId);
    const dup = !!COLL[spId];
    COLL[spId] = dup ? Math.min(5, (COLL[spId] || 1) + 1) : 1;
    save('nh5_coll', COLL);
    log('egg_drop', { source: 'gacha', species: spId });
    log('hatch', { species: spId, dup, level: COLL[spId] });
    const gart = $('gachaArt');                 // 孵化:空巢圖 + 角色疊上
    gart.classList.remove('wob');
    gart.classList.add('hatched', 'pop');
    gart.innerHTML = `<div class="hatchChar">${charSVG(spId)}</div>`;
    $('gachaMsg').innerHTML = dup
      ? `<b>${sp.name}</b> 升級了！Lv${COLL[spId]}（傷害提升）`
      : `🎉 新夥伴 <b>${sp.name}</b>（${ATTRS[sp.attr].n}）！<br><span style="font-size:12px;opacity:.7">${SKILL_DEFS[sp.skill].ic}${SKILL_DEFS[sp.skill].name}　${CAPTAIN_DEFS[sp.attr].ic}${CAPTAIN_DEFS[sp.attr].name}</span>`;
    renderGacha(false);
    say(dup ? `${sp.name}升級了！` : `新夥伴${sp.name}！`);
    blip(523, .1); blip(659, .1); blip(784, .15); blip(1046, .2);
  }

  // ---------- 開戰前選隊長 ----------
  let pendingStage = -1;
  function pickCaptainThenStart(i) {
    if (EQUIP.length < 2) { startStage(i); return; }   // 只有 1 隻就不用選
    pendingStage = i;
    const grid = $('captainPickGrid');
    grid.innerHTML = '';
    EQUIP.forEach(id => {
      const sp = SP(id), cd = CAPTAIN_DEFS[sp.attr];
      const b = document.createElement('button');
      b.className = 'pCard equipped';
      b.style.cursor = 'pointer';
      b.innerHTML = `<div class="art">${charSVG(id, true)}</div>
        <div class="nm">${sp.name}</div>
        <div class="lv" style="color:${cd.c}">${cd.ic}${cd.name}</div>
        <div class="lv" style="opacity:.7;font-size:10px">${cd.desc}</div>`;
      b.addEventListener('click', () => {
        EQUIP = [id, ...EQUIP.filter(x => x !== id)];
        save('nh5_equip', EQUIP);
        hide('captainPickOverlay');
        startStage(pendingStage);
      });
      grid.appendChild(b);
    });
    show('captainPickOverlay');
  }

  // ---------- 無限塔 ----------
  function buildTowerFloor(floor) {
    const lo = 10 + Math.round(floor * 1.5);
    const hi = Math.min(58, lo + 6 + floor);
    let gim = null;
    if (floor >= 3) {
      const r = floor % 4;
      if (r === 0) gim = { type: 'shell', n: 3 + Math.min(2, Math.floor(floor / 8)) };
      else if (r === 1) gim = { type: 'ban' };
      else if (r === 2) gim = { type: 'weakOdd', n: 2 };
      else gim = { type: 'weakRun', n: floor >= 10 ? 3 : 2 };
    }
    const sp = ['dubdragon', 'munchdragon', 'starle', 'guardy', 'prima'][floor % 5];
    towerCfg = {
      key: 'tower', name: `🗼 無限塔 ${floor}F`, zone: 4,
      band: [lo, hi], minusRate: floor >= 4 ? 0.10 : 0, mulRate: floor >= 7 ? 0.10 : 0,
      size: 6, maxDigit: 9, foesSp: [sp],
      foes: [{ hp: 90 + floor * 45, atk: 8 + floor * 2, every: Math.max(3, 5 - Math.floor(floor / 6)), gim }],
    };
    foeIdx = 0;
  }
  function startTower() {
    $('app').classList.add('battle-active');
    towerMode = true; towerFloor = 1; towerPeak = 0; towerDrawsRun = 0;
    if (!RESON) { RESON = true; save('nh5_reson', RESON); }   // 無限塔屬進階內容，解鎖共鳴
    setupCanvas(6);
    player = { hp: 100, maxHp: 100 };
    stageStat = { chains: 0, lenSum: 0, maxChain: 0, minusChains: 0, maxCombo: 0, t0: Date.now() };
    skillCd = {}; EQUIP.forEach(id => skillCd[SP(id).skill] = 0);
    targeting = null; canvas.classList.remove('targeting');
    luckyNext = false; shieldUp = false; combo = 0; hideCombo(); resolving = false; resolveSkip = null; hideDmgPop(); path = []; dragging = false;
    battleEpoch++; pendingAction = false;   // 進新戰局:讓上一場的殘留計時器失效
    hintCells = null; hintT = 0; hintCd = 0;
    buildTowerFloor(1);
    freshTiles(genBoardValues(stg().minusRate, stg().maxDigit, stg().size, stg().mulRate || 0, stg().divRate || 0), true);
    hide('selectOverlay'); hide('settingsOverlay'); hide('towerResultOverlay');
    log('tower_start', { equip: [...EQUIP], captain: captainAttr() });
    spawnEnemy();
    renderChainUi();
    teach('tower', '🗼 無限塔！',
      '<span style="font-size:40px">🗼</span>',
      '一層一層往上爬，怪物會越來越強！<br><b>每過一層 = 🥚 +1 次抽蛋機會</b>。<br>撐不住或想收手時按「↩︎ 離開」撤退，<b>已拿到的券都會保留</b>，還會依你打出的<b>最高一發攻擊力</b>再加碼送券！');
  }
  function peakBonus(p) { return p <= 0 ? 0 : p <= 100 ? 1 : p <= 1000 ? 2 : p <= 5000 ? 3 : p <= 20000 ? 4 : 5; }
  function towerEnd(died) {
    if (!towerMode) return;
    battleEpoch++; pendingAction = false;   // 結束塔:取消殘留計時器
    towerMode = false;
    const floors = towerFloor - 1;
    const bonus = peakBonus(towerPeak);
    DRAWS += bonus; save('nh5_draws', DRAWS);
    log('tower_end', { floors, peak: towerPeak, floor_draws: towerDrawsRun, bonus, died });
    $('towerResultOverlay').querySelector('h1').textContent = died ? '🗼 被擊倒了…' : '🗼 無限塔結算';
    $('towerFloors').textContent = floors;
    $('towerPeak').textContent = towerPeak;
    $('towerBonusMsg').innerHTML = `最高單發攻擊力 <b style="color:#ff9d2e">${towerPeak}</b> → 額外 <b style="color:#ffd84d">${bonus}</b> 券`;
    $('towerDraws').textContent = towerDrawsRun + bonus;
    hide('teachOverlay');
    show('towerResultOverlay');
    say('無限塔結束了！');
  }

  // ---------- 關卡流程 ----------
  function startStage(i) {
    $('app').classList.add('battle-active');
    stageIdx = i; foeIdx = 0;
    if ((stg().zone || 0) >= 4 && !RESON) { RESON = true; save('nh5_reson', RESON); }  // 進入乘法谷 → 解鎖同數共鳴
    setupCanvas(stg().size);
    player = { hp: 100, maxHp: 100 };
    stageStat = { chains: 0, lenSum: 0, maxChain: 0, minusChains: 0, maxCombo: 0, t0: Date.now() };
    skillCd = {}; EQUIP.forEach(id => skillCd[SP(id).skill] = 0);
    targeting = null; canvas.classList.remove('targeting');
    luckyNext = false; shieldUp = false; combo = 0; hideCombo(); resolving = false; resolveSkip = null; hideDmgPop(); path = []; dragging = false;
    battleEpoch++; pendingAction = false;   // 進新戰局:讓上一場的殘留計時器失效
    hintCells = null; hintT = 0; hintCd = 0;
    freshTiles(genBoardValues(stg().minusRate, stg().maxDigit, stg().size, stg().mulRate || 0, stg().divRate || 0), true);
    const capD = captainDef();
    log('stage_start', { stage: stg().key, equip: [...EQUIP], captain: captainAttr() });
    hide('selectOverlay'); hide('resultOverlay'); hide('failOverlay'); hide('teamOverlay');
    spawnEnemy();
    renderChainUi();
    // 隊長技教學（第一次進關卡時介紹「出戰第一隻=隊長」的常駐效果）
    if (capD) teach('captain_' + captainAttr(),
      `${capD.ic} 隊長技：${capD.name}`,
      `<span style="display:inline-block;width:72px;height:72px">${charSVG(EQUIP[0])}</span>`,
      `出戰的<b>第一隻數靈是隊長</b>，牠的隊長技<b>整場常駐</b>：<br><b style="color:${capD.c}">${capD.desc}</b><br><span style="font-size:12px;opacity:.7">換不同隊長 = 換一種數學打法，試試看誰最適合你！</span>`);
    if (stg().intro === 'minus') {
      teach('minus', '🆕 減法珠登場！',
        '<span style="color:#a07ce8;font-size:46px">−</span>',
        '鏈穿過紫色 <b style="color:#c5a3ff">−</b> 珠後，<b>後面那一顆會變成減法</b>。<br>可以「先超過再減回來」：<b>8 + 7 − 3 = 12</b>！<br><span style="font-size:12px;opacity:.7">規則：不能用 − 開頭或結尾。</span>');
    }
    if (stg().intro === 'mul') {
      teach('mul', '🆕 倍率珠 ×2 登場！',
        '<span style="color:#e0951c;font-size:40px">×2</span>',
        '鏈穿過金色 <b style="color:#ffd36b">×2</b> 珠後，<b>後面那一顆數字會變兩倍</b>！<br>例如 <b>4 + ×2 + 3 = 4 + 6 = 10</b>。<br><span style="font-size:12px;opacity:.7">規則：不能用 ×2 開頭或結尾，也不能緊接著另一顆運算珠。</span>');
    }
    if (stg().intro === 'div') {
      teach('divbead', '🆕 除法珠 ÷ 登場！',
        '<span style="color:#1f9fc4;font-size:40px">÷2</span>',
        '鏈穿過藍色 <b style="color:#6fe3ff">÷</b> 珠時，<b>把「目前累積的總和」除下去</b>！<br>例如 <b>8 + 4 → ÷2 = 6</b>。<br><span style="font-size:12px;opacity:.7">只有<b>除得盡</b>才連得上（11 不能 ÷3）。先堆出一個大數，再除到目標！</span>');
    }
  }

  function avgChain() { return stageStat.chains ? stageStat.lenSum / stageStat.chains : 0; }

  function stageClear() {
    $('app').classList.remove('battle-active');
    hideCombo(); hideDmgPop();
    floaters = []; particles = [];
    const dur = Date.now() - stageStat.t0;
    const avg = avgChain();
    const th = isJr() ? { avg: 2.5, max: 4 } : { avg: 3, max: 5 };
    let stars = 1;
    if (avg >= th.avg) stars = 2;
    if (avg >= th.avg && stageStat.maxChain >= th.max) stars = 3;
    const key = stg().key;
    const prevStars = STARS[key] || 0;
    STARS[key] = Math.max(prevStars, stars);
    save('nh5_stars', STARS);
    log('stage_clear', { stage: key, stars, prev_stars: prevStars, dur_ms: dur,
      avg_chain: +avg.toFixed(2), max_chain: stageStat.maxChain, max_combo: stageStat.maxCombo || 0,
      chains: stageStat.chains, minus_chains: stageStat.minusChains });

    $('resultStars').textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    $('resultHero').innerHTML = `<div class="art pop">${charSVG(EQUIP[0] || 'kiki', true)}</div>`;
    const clearFeedbackText = stars < 2 ? '<span style="color:#9ecbff">提示：用更多顆小數字湊出目標，傷害更高、星星更多！</span>'
       : stars < 3 ? `<span style="color:#d8b4ff">差一步！打出一次 ${th.max} 鏈就能拿 3 星 💥</span>`
       : '<span style="color:#5dff9d">完美拆解！你是數字獵人大師 👑</span>';
    $('resultStats').innerHTML =
      `平均鏈長 <b style="color:#ffd84d">${avg.toFixed(2)}</b>　最長鏈 <b>${stageStat.maxChain}</b>` +
      (stageStat.minusChains ? `　減法 <b style="color:#c5a3ff">${stageStat.minusChains}</b> 次` : '') +
      (SHOW_RESULT_FEEDBACK_TEXT ? `<br>${clearFeedbackText}` : '');
    // 星星 → 抽蛋機會（券），累積到 DRAWS，去「孵化所」抽
    const earned = drawsEarned(prevStars, stars);
    DRAWS += earned; save('nh5_draws', DRAWS);
    log('draws_earned', { stage: key, earned, total: DRAWS, stars, prev_stars: prevStars });
    $('drawReward').innerHTML = earned > 0
      ? `⭐×${stars} → 🥚 獲得 <b style="color:#ffd84d">${earned}</b> 次抽蛋機會！（共 ${DRAWS} 次）`
        + (stars < 3 ? `<br><span style="font-size:12px;opacity:.75">拿到 3★（平均鏈長≥${th.avg} 且打出一次 ${th.max} 鏈）= 一次拿 3 券！</span>` : '')
      : `<span style="opacity:.7">這關的 ${prevStars}★ 已經領過抽蛋券了 🥚<br><span style="font-size:12px">打出比 ${prevStars}★ 更高的星，才會有新券！</span></span>`;
    $('gachaGoBtn').textContent = `🥚 前往孵化所抽蛋（${DRAWS}）`;
    $('gachaGoBtn').classList.toggle('hidden', DRAWS <= 0);
    $('nextBtn').textContent = stageIdx + 1 < STAGES.length ? '下一關' : '回地圖';
    show('nextBtn'); show('replayBtn');
    say('過關！太厲害了！');
    show('resultOverlay');
  }

  function stageFail() {
    battleEpoch++; pendingAction = false;   // 失敗:取消殘留計時器
    $('app').classList.remove('battle-active');
    hideCombo(); hideDmgPop();
    floaters = []; particles = [];
    updateDDA(false);
    log('stage_fail', { stage: stg().key, foe: foeIdx + 1, dur_ms: Date.now() - stageStat.t0 });
    $('failStats').innerHTML = '<strong>ALMOST THERE!</strong><span>TRY A LONGER CHAIN</span>';
    show('failOverlay');
  }

  // ---------- 地圖 ----------
  function applyMode(m) {
    MODE = m;
    save('nh5_mode', m);
    STAGES = m === 'jr' ? STAGES_JR : STAGES_STD;
    document.body.classList.toggle('jr', m === 'jr');
  }

  let mapOpenZone = null;   // 地圖手風琴：目前展開的區域（null=未初始化、-1=全收起）
  let mapHeroIndex = null;  // 地圖主挑戰卡:目前預覽的關卡
  function renderMap() {
    $('app').classList.remove('battle-active');
    $('mapTitle').textContent = isJr() ? '🐣 小小世界' : '🗺️ 數界地圖';
    const th = isJr() ? { avg: 2.5, max: 4 } : { avg: 3, max: 5 };
    $('starHint').innerHTML = `⭐ 過關　⭐⭐ 平均鏈長 ≥ ${th.avg}　⭐⭐⭐ 再打出一次 ${th.max} 鏈<br><span style="color:#ffd84d">每拿到一顆「新星星」就抽一次蛋 🥚 (3★ 共 3 顆;進步到更高星會補發)</span>`;
    $('modeBtn').textContent = isJr() ? '🔁 切換到 數字獵人' : '🔁 切換到 小小獵人';
    $('unlockBtn').textContent = UNLOCKALL ? '🔓 全解鎖:開' : '🔒 全解鎖:關';
    $('gachaBtn').textContent = DRAWS > 0 ? `🥚 孵化所 (${DRAWS})` : '🥚 孵化所';
    const ZONES = isJr() ? ZONES_JR : ZONES_STD;
    if (mapOpenZone !== null && mapOpenZone >= ZONES.length) mapOpenZone = null;
    const unlockedAt = i => UNLOCKALL || i === 0 || (STARS[STAGES[i - 1].key] || 0) >= 1;
    // 預設展開「目前該玩的區域」（第一個已解鎖但還沒滿星的關卡所在區）
    if (mapOpenZone === null) {
      let cz = 0;
      for (let i = 0; i < STAGES.length; i++) {
        if (unlockedAt(i) && (STARS[STAGES[i].key] || 0) < 3) { cz = STAGES[i].zone; break; }
      }
      mapOpenZone = cz;
    }
    const box = $('mapZones');
    box.innerHTML = '';
    let heroIdx = 0;
    for (let i = 0; i < STAGES.length; i++) {
      if (unlockedAt(i)) heroIdx = i;
      if (unlockedAt(i) && (STARS[STAGES[i].key] || 0) < 3) { heroIdx = i; break; }
    }
    if (mapHeroIndex !== null && STAGES[mapHeroIndex] && unlockedAt(mapHeroIndex)) heroIdx = mapHeroIndex;
    mapHeroIndex = heroIdx;
    const heroStage = STAGES[heroIdx];
    const heroZone = ZONES[heroStage.zone] || ZONES[0];
    const heroStars = STARS[heroStage.key] || 0;
    const zoneBossSp = ['munchdragon', 'prima', 'guardy', 'munchdragon', 'dubdragon', 'chaos'];
    const heroSp = zoneBossSp[heroStage.zone] || heroStage.foesSp?.[heroStage.foesSp.length - 1] || heroStage.foesSp?.[0] || 'munchdragon';
    const stageNo = heroIdx + 1;
    const rewardEgg = slot => {
      const cracked = heroStars >= slot ? ' cracked' : '';
      const stars = Array.from({ length: slot }, () => '<i class="rewardStar filled" aria-hidden="true"></i>').join('');
      return `<span class="mapHeroRewardEgg slot-${slot}${cracked}">
        <i class="eggNest"><i class="eggShell egg-${slot}"></i></i>
        <em aria-label="${slot} stars">${stars}</em>
      </span>`;
    };
    const hero = document.createElement('section');
    hero.className = `mapHero ${heroZone.cls}`;
    hero.innerHTML = `
      <button class="mapHeroSettings" type="button" aria-label="設定">⚙</button>
      <div class="mapHeroBadge">STAGE ${stageNo}</div>
      <h2>${heroStage.name}</h2>
      <div class="mapHeroMode">BOSS</div>
      <div class="mapHeroArtWrap">
        <button class="mapHeroArrow" type="button" data-dir="-1" aria-label="上一關">‹</button>
        <div class="mapHeroArt">${charSVG(heroSp, false)}</div>
        <button class="mapHeroArrow" type="button" data-dir="1" aria-label="下一關">›</button>
      </div>
      <div class="mapHeroRewards">
        <b>REWARDS</b>
        ${rewardEgg(1)}
        ${rewardEgg(2)}
        ${rewardEgg(3)}
      </div>
      <button class="mapHeroStart" type="button">START CHALLENGE</button>
    `;
    hero.querySelector('.mapHeroSettings').addEventListener('click', () => {
      $('modeBtn').textContent = isJr() ? '🔁 切換到 數字獵人' : '🔁 切換到 小小獵人';
      $('unlockBtn').textContent = UNLOCKALL ? '🔓 全解鎖：開' : '🔒 全解鎖：關';
      hide('selectOverlay'); show('settingsOverlay');
    });
    hero.querySelector('.mapHeroStart').addEventListener('click', () => { audioInit(); pickCaptainThenStart(heroIdx); });
    hero.querySelectorAll('.mapHeroArrow').forEach(btn => {
      btn.addEventListener('click', () => {
        const dir = Number(btn.dataset.dir);
        let next = heroIdx + dir;
        while (next >= 0 && next < STAGES.length && !unlockedAt(next)) next += dir;
        if (next >= 0 && next < STAGES.length) { mapHeroIndex = next; mapOpenZone = STAGES[next].zone; renderMap(); }
      });
    });
    box.appendChild(hero);
    $('settingsBtn').textContent = 'QUESTS';
    $('teamBtn').textContent = 'MONSTER';
    $('gachaBtn').textContent = DRAWS > 0 ? `SUMMON ${DRAWS}` : 'SUMMON';
    $('towerBtn').textContent = 'EVENTS';
    ZONES.forEach((z, zi) => {
      const zoneStages = STAGES.map((st, i) => ({ st, i })).filter(o => o.st.zone === zi);
      if (!zoneStages.length) return;
      const earned = zoneStages.reduce((a, o) => a + (STARS[o.st.key] || 0), 0);
      const maxStars = zoneStages.length * 3;
      const open = mapOpenZone === zi;
      const div = document.createElement('div');
      div.className = `zone ${z.cls}`;
      const head = document.createElement('button');
      head.className = 'zoneHead';
      head.innerHTML = `<span>${open ? '▾' : '▸'} ${z.n}</span><span class="zStars">⭐ ${earned}/${maxStars}</span>`;
      head.addEventListener('click', () => { mapOpenZone = open ? -1 : zi; renderMap(); });
      div.appendChild(head);
      if (open) {
        const row = document.createElement('div');
        row.className = 'stageRow';
        zoneStages.forEach(({ st, i }) => {
          const unlocked = unlockedAt(i);
          const s = STARS[st.key] || 0;
          const btn = document.createElement('button');
          btn.className = 'stageBtn' + (unlocked ? '' : ' locked');
          btn.innerHTML = `${st.name}<span class="stars">${'⭐'.repeat(s)}${'☆'.repeat(3 - s)}</span>`;
          if (unlocked) btn.addEventListener('click', () => { audioInit(); pickCaptainThenStart(i); });
          row.appendChild(btn);
        });
        div.appendChild(row);
      }
      box.appendChild(div);
    });
    show('selectOverlay');
  }

  function renderTeam() {
    const grid = $('teamGrid');
    grid.innerHTML = '';
    const capD = captainDef();
    $('teamCaptain').innerHTML = capD
      ? `👑 隊長 <b>${SP(EQUIP[0]).name}</b>：<span style="color:${capD.c}">${capD.ic} ${capD.name} — ${capD.desc}</span>`
      : '';
    const capSlot = $('teamCaptainSlot');
    const memSlot = $('teamMemberSlot');
    if (capSlot) {
      capSlot.classList.toggle('filled', !!EQUIP[0]);
      capSlot.innerHTML = `<span>CAPTAIN SLOT</span>${EQUIP[0] ? `<div class="slotAvatar">${charSVG(EQUIP[0], true)}</div>` : ''}`;
    }
    if (memSlot) {
      capSlot.classList.remove('pending');
      memSlot.classList.toggle('filled', !!EQUIP[1]);
      memSlot.innerHTML = `<span>MEMBER SLOT</span>${EQUIP[1] ? `<div class="slotAvatar">${charSVG(EQUIP[1])}</div>` : ''}`;
    }
    const owned = SPECIES.filter(sp => COLL[sp.id]);
    const locked = SPECIES.filter(sp => !COLL[sp.id]);
    const cardColors = ['blue', 'green', 'orange', 'purple', 'yellow', 'orange'];
    const cardColor = (sp, i) => cardColors[i % cardColors.length];
    const atkBonus = sp => `+${Math.max(1, COLL[sp.id] || 1) * 2} ATK`;

    // ── 已收服：2 欄大卡片，含一般技 + 隊長技 ──
    const og = document.createElement('div');
    og.className = 'spiritGrid';
    owned.forEach((sp, i) => {
      const idx = EQUIP.indexOf(sp.id), equipped = idx >= 0, isCap = idx === 0;
      const card = document.createElement('div');
      card.className = `sCard mCard color-${cardColor(sp, i)}` + (equipped ? ' equipped' : '') + (isCap ? ' captain' : equipped ? ' member' : '');
      card.innerHTML = `
        ${isCap ? '<span class="teamBadge cap">CAPTAIN</span>' : equipped ? '<span class="teamBadge mem">MEMBER</span>' : ''}
        <div class="art">${charSVG(sp.id, isCap)}</div>
        <div class="cardOverlay" aria-hidden="true"></div>
        <div class="lv">LV. ${COLL[sp.id]}</div>
        <div class="atkBadge" aria-hidden="true"></div>
        <div class="atkText">${atkBonus(sp)}</div>`;
      card.addEventListener('click', () => {
        renderMonsterDetail(sp.id);
      });
      og.appendChild(card);
    });
    locked.slice(0, Math.max(0, 9 - owned.length)).forEach(sp => {
      const chip = document.createElement('div');
      chip.className = 'lockChip mCard locked';
      chip.setAttribute('aria-label', `${sp.name} 尚未解鎖`);
      og.appendChild(chip);
    });
    grid.appendChild(og);

    // ── 還沒收服：剪影 + 去孵化所 CTA ──
    if (false && locked.length) {
      const sec = document.createElement('div');
      sec.className = 'lockSec';
      const row = document.createElement('div');
      row.className = 'lockRow';
      locked.slice(0, 3).forEach(sp => {
        const chip = document.createElement('div');
        chip.className = 'lockChip mCard locked';
        chip.innerHTML = `<div class="art sil">${charSVG(sp.id)}</div>`;
        row.appendChild(chip);
      });
      sec.appendChild(row);
      const go = document.createElement('button');
      go.className = 'btn'; go.style.cssText = 'margin-top:12px;background:linear-gradient(135deg,#ffcf4d,#ff9d2e)';
      go.textContent = `🥚 去孵化所${DRAWS > 0 ? `（${DRAWS} 次）` : ''}`;
      go.addEventListener('click', () => { hide('teamOverlay'); openGacha(); });
      sec.appendChild(go);
      grid.appendChild(sec);
    }
    show('teamOverlay');
  }

  const monsterNameEN = {
    kiki:'Kiki',
    oo:'O-O',
    prima:'Primer',
    swapy:'Swapy',
    starle:'Starle',
    guardy:'Guardy',
    dubdragon:'Dub Dragon',
    munchdragon:'Munch Dragon',
  };
  const leaderDetailEN = {
    prime: { name:'Prime Resonance', desc:'+18% damage for each prime bead (2, 3, 5, 7) in your chain.' },
    odd:   { name:'Odd Strike', desc:'+12% damage for each odd bead in your chain.' },
    even:  { name:'Even Link', desc:'+1 chain multiplier for every 2 even beads in your chain.' },
    multi: { name:'Multiple Burst', desc:'Deal double damage when your chain length is a multiple of 3.' },
  };
  const activeDetailEN = {
    plus1:  { name:'Add One', desc:'Tap a bead to increase it by 1.' },
    minus1: { name:'Minus One', desc:'Tap a bead to decrease it by 1.' },
    reroll: { name:'Reroll', desc:'Tap a bead to change it into a random new one.' },
    split:  { name:'Split', desc:'Tap a bead to split it into two smaller beads.' },
    swapUp: { name:'Swap', desc:'Tap a bead to swap it with the bead above.' },
    purify: { name:'Clean', desc:'Tap a bead to remove it from the board.' },
    lucky:  { name:'Luck', desc:'Make your next chain deal extra damage.' },
    shield: { name:'Shield', desc:'Block the enemy’s next attack.' },
  };

  function renderMonsterDetail(spId) {
    const sp = SP(spId);
    if (!sp) return;
    const level = Math.max(1, COLL[sp.id] || 1);
    const leader = leaderDetailEN[sp.attr] || { name: CAPTAIN_DEFS[sp.attr]?.name || 'Leader Skill', desc: CAPTAIN_DEFS[sp.attr]?.desc || '' };
    const active = activeDetailEN[sp.skill] || { name: SKILL_DEFS[sp.skill]?.name || 'Active Skill', desc: SKILL_DEFS[sp.skill]?.tip || '' };
    const skillDef = SKILL_DEFS[sp.skill] || {};

    $('monsterDetailName').textContent = monsterNameEN[sp.id] || sp.name;
    $('monsterDetailAtk').textContent = `+${level * 2}`;
    $('monsterDetailLeaderName').textContent = leader.name;
    $('monsterDetailLeaderDesc').textContent = leader.desc;
    $('monsterDetailActiveName').textContent = active.name;
    $('monsterDetailActiveDesc').textContent = active.desc;
    $('monsterDetailCooldown').textContent = `COOL DOWN: ${skillDef.cd || 0}`;
    $('monsterDetailActivePanel').dataset.skill = sp.skill;
    $('monsterDetailArt').innerHTML = charSVG(sp.id, EQUIP[0] === sp.id);

    hide('teamOverlay');
    show('monsterDetailOverlay');
  }

  // ---------- 匯出 ----------
  function exportData() {
    const payload = {
      version: 'v10', exported_at: new Date().toISOString(),
      ua: navigator.userAgent, mode: MODE, stars: STARS, collection: COLL, equip: EQUIP,
      survey: SURVEY, dda: DDA, draws: DRAWS, mastery: MASTERY, event_count: EV.length, events: EV,
    };
    const json = JSON.stringify(payload, null, 1);
    try {
      const blob = new Blob([json], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `playtest-v10-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a); a.click(); a.remove();
    } catch (e) {}
    try { navigator.clipboard.writeText(json); } catch (e) {}
    toast(`已匯出 ${EV.length} 筆事件（檔案＋剪貼簿）`);
  }

  // ---------- 綁定 ----------
  $('exitBtn').addEventListener('click', () => {
    if (towerMode) {
      if (!confirm('要從無限塔撤退嗎？\n已拿到的抽蛋券會保留，並依最高攻擊力加碼送券。')) return;
      battleEpoch++; pendingAction = false;   // 取消殘留計時器
      targeting = null; canvas.classList.remove('targeting'); path = []; dragging = false;
      towerEnd(false);
      return;
    }
    if (!stageStat) { renderMap(); return; }
    if (!confirm('要離開這一關回地圖嗎？（這關的進度不會保留）')) return;
    battleEpoch++; pendingAction = false;   // 取消殘留計時器(敵人攻擊/洗牌/換怪)
    log('stage_abort', { stage: stg().key, foe: foeIdx + 1, dur_ms: Date.now() - stageStat.t0 });
    targeting = null; canvas.classList.remove('targeting');
    path = []; dragging = false;
    hide('resultOverlay'); hide('failOverlay'); hide('teamOverlay'); hide('splitOverlay');
    renderMap();
  });
  $('gimBadge').addEventListener('click', () => {
    if (!enemy) return;
    const gim = gimMeta();
    if (gim.kind && ATTRIBUTE_HELP[gim.kind]) showAttributeTeach(gim.kind, gim.num, true);
    else if (gim.text) toast(gim.text, 3600);
  });
  $('startJrBtn').addEventListener('click', () => { audioInit(); applyMode('jr'); hide('startOverlay'); renderMap(); say('歡迎來到小小世界！'); });
  $('startStdBtn').addEventListener('click', () => { audioInit(); applyMode('std'); hide('startOverlay'); renderMap(); });
  $('modeBtn').addEventListener('click', () => { applyMode(isJr() ? 'std' : 'jr'); hide('settingsOverlay'); renderMap(); });
  $('voiceBtn').addEventListener('click', () => { voiceOn = !voiceOn; save('nh5_voice', voiceOn); renderHud(); });
  $('nextBtn').addEventListener('click', () => {
    hide('resultOverlay');
    if (stageIdx + 1 < STAGES.length) startStage(stageIdx + 1);
    else renderMap();
  });
  $('replayBtn').addEventListener('click', () => { hide('resultOverlay'); startStage(stageIdx); });
  $('gachaGoBtn').addEventListener('click', openGacha);
  $('gachaBtn').addEventListener('click', openGacha);
  $('gachaDrawBtn').addEventListener('click', drawOne);
  $('gachaBack').addEventListener('click', () => { hide('gachaOverlay'); renderMap(); });
  $('retryBtn').addEventListener('click', () => { hide('failOverlay'); startStage(stageIdx); });
  $('backBtn').addEventListener('click', () => { hide('failOverlay'); renderMap(); });
  $('teachOk').addEventListener('click', closeTeach);
  $('teachReplay').addEventListener('click', () => { if (teachQueue.length) speakTeach(teachQueue[0]); });
  $('captainPickCancel').addEventListener('click', () => { hide('captainPickOverlay'); renderMap(); });
  $('unlockBtn').addEventListener('click', () => {
    UNLOCKALL = !UNLOCKALL; save('nh5_unlockall', UNLOCKALL);
    $('unlockBtn').textContent = UNLOCKALL ? '🔓 全解鎖：開' : '🔒 全解鎖：關';
    toast(UNLOCKALL ? '🔓 已解鎖所有關卡' : '🔒 恢復循序解鎖');
  });
  $('teamBtn').addEventListener('click', () => { hide('selectOverlay'); renderTeam(); });
  $('teamBack').addEventListener('click', () => { hide('teamOverlay'); renderMap(); });
  $('teamQuestTab').addEventListener('click', () => { hide('teamOverlay'); renderMap(); });
  $('teamMonsterTab').addEventListener('click', () => renderTeam());
  $('teamSummonTab').addEventListener('click', () => { hide('teamOverlay'); openGacha(); });
  $('teamEventsTab').addEventListener('click', () => { hide('teamOverlay'); startTower(); });
  $('monsterDetailBack').addEventListener('click', () => { hide('monsterDetailOverlay'); renderTeam(); });
  $('teamCaptainSlot').addEventListener('click', () => { toast(EQUIP[0] ? '點下方卡片可更換隊長' : '點下方卡片選隊長'); });
  $('teamMemberSlot').addEventListener('click', () => { toast(EQUIP[1] ? '點下方卡片可更換隊員' : '點下方卡片選隊員'); });
  $('towerBtn').addEventListener('click', startTower);
  $('towerAgainBtn').addEventListener('click', startTower);
  $('towerGachaBtn').addEventListener('click', () => { hide('towerResultOverlay'); openGacha(); });
  $('towerBackBtn').addEventListener('click', () => { hide('towerResultOverlay'); renderMap(); });
  $('settingsBtn').addEventListener('click', () => renderMap());
  $('settingsBack').addEventListener('click', () => { hide('settingsOverlay'); renderMap(); });
  $('exportBtn').addEventListener('click', exportData);
  $('clearBtn').addEventListener('click', () => {
    if (!confirm('清除所有測試數據、星星與收集進度？')) return;
    EV = []; STARS = {}; COLL = { kiki: 1, prima: 1 }; EQUIP = ['kiki', 'prima']; DDA = { std: 0, jr: 0 }; TAUGHT = {}; DRAWS = 0;
    MASTERY = {}; save('nh5_mastery', MASTERY);
    RESON = false;
    ['nh5_events','nh5_stars','nh5_coll','nh5_equip','nh5_dda','nh5_taught','nh5_draws','nh5_reson'].forEach(k => { try { localStorage.removeItem(k); } catch (e) {} });
    // 注意：nh5_unlockall(測試開關)刻意保留，不隨清除重置
    hide('settingsOverlay'); renderMap(); toast('已清除');
  });
  $('splitCancel').addEventListener('click', () => {
    hide('splitOverlay'); splitCell = null; targeting = null;
    canvas.classList.remove('targeting'); renderSkills();
  });

  document.body.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
  let resizeT;
  window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(() => setupCanvas(SIZE), 120); });

  // ---------- 開場問卷 ----------
  function buildSurvey() {
    const ageBox = $('svAge'); ageBox.innerHTML = '';
    ['5','6','7','8','9','10','11','12','13+'].forEach(a => {
      const b = document.createElement('button'); b.className = 'svOpt'; b.dataset.v = a; b.textContent = a;
      ageBox.appendChild(b);
    });
    document.querySelectorAll('#surveyOverlay .svOpts').forEach(group => {
      group.onclick = e => {
        const b = e.target.closest('.svOpt'); if (!b) return;
        [...group.children].forEach(c => c.classList.remove('sel'));
        b.classList.add('sel');
      };
    });
  }
  function readSurvey() {
    const pick = id => { const s = $(id).querySelector('.sel'); return s ? s.dataset.v : null; };
    return { age: pick('svAge'), gender: pick('svGender'), math: pick('svMath'),
             nick: ($('svNick').value || '').trim(), ts: Date.now() };
  }
  function previewParam() {
    try {
      const qs = new URLSearchParams(location.search);
      const hash = new URLSearchParams((location.hash || '').replace(/^#/, ''));
      return qs.get('preview') || hash.get('preview') || '';
    } catch (e) {
      return '';
    }
  }
  function openPreview(name) {
    if (name !== 'fail') return false;
    ['startOverlay','surveyOverlay','selectOverlay','settingsOverlay','teamOverlay','gachaOverlay','captainPickOverlay','resultOverlay','towerResultOverlay','monsterDetailOverlay'].forEach(hide);
    $('failStats').innerHTML = '<strong>ALMOST THERE!</strong><span>TRY A LONGER CHAIN</span>';
    show('failOverlay');
    return true;
  }
  // 依年齡決定模式：5~6 歲 → 小小獵人；7 歲以上 → 數字獵人
  const modeByAge = age => (age === '5' || age === '6') ? 'jr' : 'std';
  function enterByAge(age) {
    applyMode(modeByAge(age));
    hide('surveyOverlay'); hide('startOverlay');
    renderMap();
    say(isJr() ? '歡迎來到小小世界！' : '出發吧，數字獵人！');
  }
  $('surveyGo').addEventListener('click', () => {
    const s = readSurvey();
    if (!s.age) { toast('請先選小朋友的年齡（必填）🙂'); return; }
    SURVEY = s; save('nh5_survey', SURVEY);
    log('survey', SURVEY);
    audioInit();
    enterByAge(s.age);
  });
  $('newTesterBtn').addEventListener('click', () => {
    if (!confirm('換一位小朋友？\n會清除「目前這位」的遊玩數據與進度並重填問卷。\n（記得先按「匯出數據」把上一位的 JSON 存下來！）')) return;
    EV = []; STARS = {}; COLL = { kiki: 1, prima: 1 }; EQUIP = ['kiki', 'prima'];
    DDA = { std: 0, jr: 0 }; TAUGHT = {}; DRAWS = 0; SURVEY = null; RESON = false; MASTERY = {};
    ['nh5_events','nh5_stars','nh5_coll','nh5_equip','nh5_dda','nh5_taught','nh5_draws','nh5_survey','nh5_reson','nh5_mastery']
      .forEach(k => { try { localStorage.removeItem(k); } catch (e) {} });
    buildSurvey();
    hide('settingsOverlay'); hide('startOverlay'); show('surveyOverlay');
  });
  buildSurvey();

  log('session_start', { version: 'v10' });
  const preview = previewParam();
  // 已填問卷 → 依（記住的模式 or 年齡）直接進地圖；未填 → 先問卷
  if (preview && openPreview(preview)) {
    applyMode(MODE || 'std');
  } else if (SURVEY) {
    applyMode(MODE || modeByAge(SURVEY.age));
    hide('surveyOverlay'); renderMap();
  } else if (MODE) {
    applyMode(MODE);
  }
  freshTiles(genBoardValues(0, 9, 6));
  tick();
})();
