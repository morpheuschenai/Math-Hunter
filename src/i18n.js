// i18n.js — 雙語字典 + t() 翻譯函式 + 語言切換
// 用法：t('key') 或 t('key', { n: 5, name: 'Kiki' })
// 在 game.main.js 之前載入（build.cjs 會 inline）

const I18N = {
  zh: {
    // ── 戰鬥 HUD ──────────────────────────────────────────────
    'hud.target':  '目標',
    'hud.current': '目前',
    'hud.action':  '行動',
    'hud.chain':   '鏈 ×{n}',
    'hud.exit':    '↩︎ 離開',

    // ── Boss 橫幅 ─────────────────────────────────────────────
    'boss.chaos': '數界的混亂之源現身了！',
    'boss.zone':  '這張地圖的霸主現身了！',

    // ── 問卷 ──────────────────────────────────────────────────
    'survey.title':            '👋 開始之前',
    'survey.intro':            '幫我們一個小忙，回答幾個小問題（給大人填也行）。\n這些資料只用來改進遊戲 😊',
    'survey.age.q':            '小朋友幾歲？',
    'survey.age.required':     '＊必填',
    'survey.gender.q':         '性別',
    'survey.gender.m':         '男生',
    'survey.gender.f':         '女生',
    'survey.gender.x':         '不想說',
    'survey.math.q':           '數學程度（自己感覺就好）',
    'survey.math.beginner':    '剛開始學加減',
    'survey.math.ok':          '加減很OK',
    'survey.math.advanced':    '會乘法/除法',
    'survey.math.expert':      '數學很拿手',
    'survey.nick.q':           '暱稱／代號（可留空）',
    'survey.nick.placeholder': '例如：小明、A1',
    'survey.submit':           '開始遊戲 ▶',

    // ── 開始畫面 ──────────────────────────────────────────────
    'start.title':    '🔢 數字獵人',
    'start.story':    '數界 Numeria 被「亂數魔王」攪亂了，可愛的<b>數靈</b>全都暗化成怪物！',
    'start.rules':    '拖曳相鄰數字，加總等於目標數就能淨化牠們。<b>數字越多顆，傷害倍率越高！</b>',
    'start.jr.label': '小小獵人',
    'start.jr.desc':  '5–6 歲・小盤面・只有加法・不會輸・有語音',
    'start.std.label':'數字獵人',
    'start.std.desc': '7 歲以上・完整冒險・減法珠與技能',

    // ── 地圖 ──────────────────────────────────────────────────
    'map.title.std':   '🗺️ 數界地圖',
    'map.title.jr':    '🐣 小小世界',
    'map.star.hint':   '⭐ 過關　⭐⭐ 平均鏈長 ≥ {avg}　⭐⭐⭐ 再打出一次 {max} 鏈\n每拿到一顆「新星星」就抽一次蛋 🥚 (3★ 共 3 顆;進步到更高星會補發)',

    // ── 地圖操作按鈕 ─────────────────────────────────────────
    'map.tower':       '🗼 無限塔',
    'map.gacha':       '🥚 孵化所',
    'map.gacha.draws': '🥚 孵化所 ({n})',
    'map.team':        '👥 我的數靈',
    'map.settings':    '⚙️ 設定',

    // ── 設定 ──────────────────────────────────────────────────
    'settings.title':        '⚙️ 設定',
    'settings.mode.to.std':  '🔁 切換到 數字獵人',
    'settings.mode.to.jr':   '🔁 切換到 小小獵人',
    'settings.unlock.on':    '🔓 全解鎖：開',
    'settings.unlock.off':   '🔒 全解鎖：關',
    'settings.export':       '📤 匯出數據',
    'settings.new_tester':   '🧒 換一位小朋友（重填問卷）',
    'settings.clear':        '🗑️ 刪除數據',
    'settings.back':         '返回',
    'settings.lang':         '🌐 語言 / Language',

    // ── 無限塔結算 ────────────────────────────────────────────
    'tower.result.title':  '🗼 無限塔結算',
    'tower.result.died':   '🗼 被擊倒了…',
    'tower.result.bonus':  '最高單發攻擊力 <b style="color:#ff9d2e">{peak}</b> → 額外 <b style="color:#ffd84d">{bonus}</b> 券',
    'tower.result.draws':  '本次共獲得 🥚 <b style="color:#ffd84d">{n}</b> 次抽蛋機會！',
    'tower.result.again':  '再挑戰 🗼',
    'tower.result.gacha':  '🥚 去孵化所',
    'tower.result.back':   '回地圖',

    // ── 孵化所 ────────────────────────────────────────────────
    'gacha.count':       '抽蛋機會 <span class="sCountBadge">{n}</span> 次',
    'gacha.draw.btn':    '孵化一次',
    'gacha.draw.empty':  '沒有機會了',
    'gacha.msg.ready':   '點「孵化一次」召喚數靈！',
    'gacha.msg.empty':   '去過關拿星星，換更多孵化機會吧！',

    // ── Toast 訊息 ────────────────────────────────────────────
    'toast.skill.cd':        '還要 {n} 條鏈才能再用',
    'toast.hint.cd':         '再打 {n} 條鏈就能再提示',
    'toast.hint.no_chain':   '咦，先打一條鏈看看吧！',
    'toast.no_sol':          '找不到解，盤面洗牌！',
    'toast.op_plus1':        '運算珠不能加一',
    'toast.wrap_9to1':       '9 轉了一圈變回 1！',
    'toast.op_minus1':       '運算珠不能減一',
    'toast.wrap_1to9':       '1 轉了一圈變成 9！',
    'toast.swap_top':        '最上排沒有上面可以換！',
    'toast.op_split':        '運算珠不能分裂',
    'toast.split_1':         '1 沒辦法再拆了！',
    'toast.split_top':       '最上排不能分裂（上面沒有位置）',
    'toast.draw_err':        '⚠️ 繪製錯誤：{msg}',
    'toast.div_not_clean':   '÷ 珠要整除才能用！(這個數除不盡)',
    'toast.chain_end_op':    '鏈不能以運算珠（−／×）結尾！',
    'toast.divisor_miss':    '要湊出 {n} 的倍數！{sum} 不是（{n}、{n2}、{n3}…）',
    'toast.equal_split_bad': '等分盾！要連剛好 {divN} 顆「{val}」（{target}÷{divN}={val}）➗',
    'toast.odd_shield':      '奇數盾！鏈裡要有 {n} 顆以上奇數 🔆',
    'toast.resonance_shield':'共鳴盾！要連 {n} 顆相同數字 🔢',
    'toast.chain_short':     '鏈太短了！這隻怪需要 {n} 顆以上 🛡️',
    'toast.no_draws':        '沒有抽蛋機會了，去過關拿星星！',
    'toast.unlock.on':       '🔓 已解鎖所有關卡',
    'toast.unlock.off':      '🔒 恢復循序解鎖',
    'toast.cleared':         '已清除',
    'toast.survey.age':      '請先選小朋友的年齡（必填）🙂',
    'toast.captain.change':  '點下方卡片可更換隊長',
    'toast.captain.pick':    '點下方卡片選隊長',
    'toast.member.change':   '點下方卡片可更換隊員',
    'toast.member.pick':     '點下方卡片選隊員',
    'toast.exported':        '已匯出 {n} 筆事件（檔案＋剪貼簿）',
    'toast.purified':        '淨化成功！✨',

    // ── Confirm 對話框 ────────────────────────────────────────
    'confirm.tower.retreat': '要從無限塔撤退嗎？\n已拿到的抽蛋券會保留，並依最高攻擊力加碼送券。',
    'confirm.stage.exit':    '要離開這一關回地圖嗎？（這關的進度不會保留）',
    'confirm.new_tester':    '換一位小朋友？\n會清除「目前這位」的遊玩數據與進度並重填問卷。\n（記得先按「匯出數據」把上一位的 JSON 存下來！）',
    'confirm.clear':         '清除所有測試數據、星星與收集進度？',

    // ── 浮字特效 ──────────────────────────────────────────────
    'floater.lucky':          '🍀 下一鏈 ×1.5！',
    'floater.shield':         '🛡️ 護盾展開！',
    'floater.resonance':      '🔢 {v}×{n} 共鳴！',
    'floater.tower_pass':     '🗼 {n}F 通過！🥚+1',
    'floater.shuffled':       '搗蛋！打亂了珠珠 🌀',
    'floater.blocked':        '🛡️ 擋下了！',
    'floater.damage':         '受到 {n} 傷害！',
    'floater.chaos_target':   '亂數！目標 → {n}',
    'floater.ban_changed':    '封印亂換！🚫 {d}',
    'floater.praise.legendary':'傳說拆解！！！',
    'floater.praise.ultra':   '超絕拆解！！',
    'floater.praise.great':   '厲害！',
    'floater.praise.nice':    '精彩！',
    'floater.minus':          '減法！',

    // ── 狂暴訊息 ──────────────────────────────────────────────
    'enrage.default':    '⚠️ 狂暴化！攻擊變強、行動變快！',
    'enrage.shell':      '⚠️ 狂暴化！硬殼變更硬：需要 {n} 顆以上的鏈！',
    'enrage.ban':        '⚠️ 狂暴化！封印會一直亂換！',
    'enrage.resonance':  '⚠️ 狂暴化！共鳴盾變強：要連 {n} 顆相同數字！',
    'enrage.equal':      '⚠️ 狂暴化！等分盾變強：要分成 {n} 等份！',
    'enrage.divisor':    '⚠️ 狂暴化！整除盾變強：要湊出 {n} 的倍數！',
    'enrage.chaos':      '⚠️ 魔王狂暴化！攻擊變強、目標會一直亂變！',
    'enrage.jr':         '⚠️ 大王生氣了！搗蛋會變快！',

    // ── 語音（Jr 模式）────────────────────────────────────────
    'voice.hint':         '找找看，亮亮的珠珠',
    'voice.combo':        '連擊！',
    'voice.great':        '太棒了！',
    'voice.enrage.jr':    '大王生氣了！加油！',
    'voice.enrage.std':   '魔王生氣了！小心！',
    'voice.shuffle':      '哎呀，怪物搗蛋了！',
    'voice.welcome.jr':   '歡迎來到小小世界！',
    'voice.welcome.std':  '出發吧，數字獵人！',
    'voice.tower_end':    '無限塔結束了！',
    'voice.win':          '過關！太厲害了！',
    'voice.chaos_target': '目標變成 {n}',
    'voice.ban_changed':  '封印變成 {d}',
    'voice.levelup':      '{name}升級了！',
    'voice.new_char':     '新夥伴{name}！',

    // ── 教學 ──────────────────────────────────────────────────
    'teach.resonance.title': '✖️ 同數共鳴 = 乘法！',
    'teach.resonance.cond':  '你剛剛打出了 {v}×{n}',
    'teach.resonance.body':  '你剛剛把<b>幾顆一樣的數字</b>連在一起——這就是<b>乘法</b>！<br><b style="color:#ffae3d">{v}+{v}+…（{n} 個）= {v}×{n}</b><br>連越多顆相同數字，<b>共鳴傷害越高</b>！',
    'teach.tower.title':     '🗼 無限塔！',
    'teach.tower.body':      '一層一層往上爬，怪物會越來越強！<br><b>每過一層 = 🥚 +1 次抽蛋機會</b>。<br>撐不住或想收手時按「↩︎ 離開」撤退，<b>已拿到的券都會保留</b>，還會依你打出的<b>最高一發攻擊力</b>再加碼送券！',
    'teach.minus.title':     '🆕 減法珠登場！',
    'teach.minus.body':      '鏈穿過紫色 <b style="color:#c5a3ff">−</b> 珠後，<b>後面那一顆會變成減法</b>。<br>可以「先超過再減回來」：<b>8 + 7 − 3 = 12</b>！<br><span style="font-size:12px;opacity:.7">規則：不能用 − 開頭或結尾。</span>',
    'teach.mul.title':       '🆕 倍率珠 ×2 登場！',
    'teach.mul.body':        '鏈穿過金色 <b style="color:#ffd36b">×2</b> 珠後，<b>後面那一顆數字會變兩倍</b>！<br>例如 <b>4 + ×2 + 3 = 4 + 6 = 10</b>。<br><span style="font-size:12px;opacity:.7">規則：不能用 ×2 開頭或結尾，也不能緊接著另一顆運算珠。</span>',
    'teach.divbead.title':   '🆕 除法珠 ÷ 登場！',
    'teach.divbead.body':    '鏈穿過藍色 <b style="color:#6fe3ff">÷</b> 珠時，<b>把「目前累積的總和」除下去</b>！<br>例如 <b>8 + 4 → ÷2 = 6</b>。<br><span style="font-size:12px;opacity:.7">只有<b>除得盡</b>才連得上（11 不能 ÷3）。先堆出一個大數，再除到目標！</span>',
    'teach.captain.cond':    '{ic} 隊長技：{name}',
    'teach.captain.body':    '出戰的<b>第一隻數靈是隊長</b>，牠的隊長技<b>整場常駐</b>：<br><b style="color:{c}">{desc}</b><br><span style="font-size:12px;opacity:.7">換不同隊長 = 換一種數學打法，試試看誰最適合你！</span>',

    // ── 過關畫面 ──────────────────────────────────────────────
    'result.title.win':        '🎉 淨化成功！',
    'result.feedback.1star':   '<span style="color:#9ecbff">提示：用更多顆小數字湊出目標，傷害更高、星星更多！</span>',
    'result.feedback.2star':   '<span style="color:#d8b4ff">差一步！打出一次 {max} 鏈就能拿 3 星 💥</span>',
    'result.feedback.3star':   '<span style="color:#5dff9d">完美拆解！你是數字獵人大師 👑</span>',
    'result.draws.earned':     '⭐×{stars} → 🥚 獲得 <b style="color:#ffd84d">{earned}</b> 次抽蛋機會！（共 {total} 次）',
    'result.draws.3star_hint': '<br><span style="font-size:12px;opacity:.75">拿到 3★（平均鏈長≥{avg} 且打出一次 {max} 鏈）= 一次拿 3 券！</span>',
    'result.draws.already':    '<span style="opacity:.7">這關的 {prev}★ 已經領過抽蛋券了 🥚<br><span style="font-size:12px">打出比 {prev}★ 更高的星，才會有新券！</span></span>',
    'result.gacha_btn':        '🥚 前往孵化所抽蛋（{n}）',

    // ── 隊伍 ──────────────────────────────────────────────────
    'team.desc':           '點未出戰的可上場；點出戰中的可設為👑隊長；點👑隊長則卸下。最多 2 隻。',
    'team.captain.label':  '👑 隊長 <b>{name}</b>：<span style="color:{c}">{ic} {capName} — {desc}</span>',
    'team.locked':         '{name} 尚未解鎖',
    'team.go_gacha':       '🥚 去孵化所',
    'team.go_gacha.draws': '🥚 去孵化所（{n} 次）',
    'team.back':           '回地圖',

    // ── 孵化結果 ──────────────────────────────────────────────
    'gacha.result.levelup': '<b>{name}</b> 升級了！Lv{lv}（傷害提升）',
    'gacha.result.new':     '🎉 新夥伴 <b>{name}</b>（{attr}）！<br><span style="font-size:12px;opacity:.7">{skillIc}{skillName}　{capIc}{capName}</span>',

    // ── 分裂 dialog ───────────────────────────────────────────
    'split.desc':    '把 <b style="color:#ffd84d">{v}</b> 拆成哪兩個數？<br><span style="font-size:12px;opacity:.7">第一個數會放在原位，第二個數會蓋掉上面那顆珠</span>',

    // ── 技能按鈕（提示）─────────────────────────────────────
    'skill.hint.label': '<span class="skillIcon" aria-hidden="true"></span><span class="lbl"><b>提示</b>找找看</span>',

    // ── 屬性名稱 ──────────────────────────────────────────────
    'attr.odd':   '奇數系',
    'attr.even':  '偶數系',
    'attr.prime': '質數系',
    'attr.multi': '倍數系',

    // ── 技能名稱 & 說明 ────────────────────────────────────────
    'skill.plus1.name':  '加一',
    'skill.plus1.tip':   '點一顆珠，讓它 +1（9 會變回 1）',
    'skill.minus1.name': '減一',
    'skill.minus1.tip':  '點一顆珠，讓它 −1（1 會變成 9）',
    'skill.reroll.name': '重擲',
    'skill.reroll.tip':  '點一顆珠，把它變成隨機新珠',
    'skill.split.name':  '分裂',
    'skill.split.tip':   '點一顆珠，把它拆成兩顆（上面那顆會被蓋掉）',
    'skill.swapUp.name': '上下換',
    'skill.swapUp.tip':  '點一顆珠，和上面那顆交換位置',
    'skill.purify.name': '淨化',
    'skill.purify.tip':  '點一顆珠，直接消除它',
    'skill.lucky.name':  '幸運',
    'skill.lucky.tip':   '下一條鏈傷害 ×1.5！',
    'skill.shield.name': '護盾',
    'skill.shield.tip':  '擋下敵人的下一次攻擊！',

    // ── 隊長技 ────────────────────────────────────────────────
    'captain.prime.name': '質數共鳴',
    'captain.prime.desc': '路徑每串 1 顆質數珠（2·3·5·7），傷害 +18%',
    'captain.prime.tag':  '質×{n}',
    'captain.odd.name':   '奇襲',
    'captain.odd.desc':   '路徑每串 1 顆奇數珠，傷害 +12%',
    'captain.odd.tag':    '奇×{n}',
    'captain.even.name':  '偶數連動',
    'captain.even.desc':  '路徑每 2 顆偶數珠，鏈長倍率 +1',
    'captain.even.tag':   '偶+{n}',
    'captain.multi.name': '倍數爆擊',
    'captain.multi.desc': '鏈長是 3 的倍數時，傷害 ×2',
    'captain.multi.tag':  '倍數爆擊',

    // ── 角色名稱 ──────────────────────────────────────────────
    'char.kiki.name':        '奇奇',
    'char.oo.name':          '偶偶',
    'char.prima.name':       '質寶',
    'char.swapy.name':       '換換',
    'char.starle.name':      '星星靈',
    'char.guardy.name':      '守護靈',
    'char.dubdragon.name':   '倍倍龍',
    'char.munchdragon.name': '大胃龍',

    // ── 區域名稱 ──────────────────────────────────────────────
    'zone.0':    '🌿 湊十草原',
    'zone.1':    '🌲 進位森林',
    'zone.2':    '🕳️ 封印洞窟',
    'zone.3':    '🌋 烈焰火山',
    'zone.4':    '✖️ 乘法谷',
    'zone.5':    '➗ 除法谷',
    'zone.jr.a': '🐣 小小世界・上',
    'zone.jr.b': '🐥 小小世界・下',

    // ── 關卡名稱 ──────────────────────────────────────────────
    'stage.1':  '草原・一',
    'stage.2':  '草原・二',
    'stage.3':  '森林・一',
    'stage.4':  '森林・二',
    'stage.5':  '洞窟・一',
    'stage.6':  '洞窟・二',
    'stage.7':  '火山・一',
    'stage.8':  '火山・二',
    'stage.m1': '乘法谷・一',
    'stage.m2': '乘法谷・二',
    'stage.m3': '乘法谷・霸主',
    'stage.e1': '除法谷・一',
    'stage.e2': '除法谷・二',
    'stage.e3': '除法谷・霸主',
    'stage.j1': '小小草原',
    'stage.j2': '小小花園',
    'stage.j3': '小小森林',
    'stage.j4': '小小山丘',
  },

  en: {
    // ── 戰鬥 HUD ──────────────────────────────────────────────
    'hud.target':  'Target',
    'hud.current': 'Sum',
    'hud.action':  'Moves',
    'hud.chain':   'Chain ×{n}',
    'hud.exit':    '↩︎ Retreat',

    // ── Boss 橫幅 ─────────────────────────────────────────────
    'boss.chaos': "The source of Numeria's chaos appears!",
    'boss.zone':  'The zone boss appears!',

    // ── 問卷 ──────────────────────────────────────────────────
    'survey.title':            '👋 Before We Start',
    'survey.intro':            'Help us improve the game with a few quick questions (parents welcome).',
    'survey.age.q':            "How old is the player?",
    'survey.age.required':     '* Required',
    'survey.gender.q':         'Gender',
    'survey.gender.m':         'Boy',
    'survey.gender.f':         'Girl',
    'survey.gender.x':         'Prefer not to say',
    'survey.math.q':           'Math level (how does it feel?)',
    'survey.math.beginner':    'Just starting addition',
    'survey.math.ok':          'Addition is easy',
    'survey.math.advanced':    'Can do multiplication / division',
    'survey.math.expert':      'Math is my superpower',
    'survey.nick.q':           'Nickname (optional)',
    'survey.nick.placeholder': 'e.g. Alex, A1',
    'survey.submit':           'Start Game ▶',

    // ── 開始畫面 ──────────────────────────────────────────────
    'start.title':    '🔢 Math Hunter',
    'start.story':    'The Chaos Lord has thrown Numeria into chaos! All the cute <b>Numlings</b> have been corrupted into monsters!',
    'start.rules':    'Drag adjacent numbers to chain them — match the target to purify monsters. <b>Longer chains deal more damage!</b>',
    'start.jr.label': 'Little Hunter',
    'start.jr.desc':  'Ages 5–6 · Small board · Addition only · No game over · Voice',
    'start.std.label':'Math Hunter',
    'start.std.desc': 'Ages 7+ · Full adventure · Subtraction beads & skills',

    // ── 地圖 ──────────────────────────────────────────────────
    'map.title.std':   '🗺️ Numeria Map',
    'map.title.jr':    '🐣 Little World',
    'map.star.hint':   '⭐ Clear  ⭐⭐ Avg chain ≥ {avg}  ⭐⭐⭐ Land a {max}-chain\nEach new star = 1 egg hatch 🥚 (3★ = 3 total; retroactive on improvement)',

    // ── 地圖操作按鈕 ─────────────────────────────────────────
    'map.tower':       '🗼 Infinite Tower',
    'map.gacha':       '🥚 Hatchery',
    'map.gacha.draws': '🥚 Hatchery ({n})',
    'map.team':        '👥 My Team',
    'map.settings':    '⚙️ Settings',

    // ── 設定 ──────────────────────────────────────────────────
    'settings.title':        '⚙️ Settings',
    'settings.mode.to.std':  '🔁 Switch to Math Hunter',
    'settings.mode.to.jr':   '🔁 Switch to Little Hunter',
    'settings.unlock.on':    '🔓 Unlock All: ON',
    'settings.unlock.off':   '🔒 Unlock All: OFF',
    'settings.export':       '📤 Export Data',
    'settings.new_tester':   '🧒 New Player (re-take survey)',
    'settings.clear':        '🗑️ Delete Data',
    'settings.back':         'Back',
    'settings.lang':         '🌐 語言 / Language',

    // ── 無限塔結算 ────────────────────────────────────────────
    'tower.result.title':  '🗼 Infinite Tower Results',
    'tower.result.died':   '🗼 Defeated…',
    'tower.result.bonus':  'Highest hit <b style="color:#ff9d2e">{peak}</b> → bonus <b style="color:#ffd84d">{bonus}</b> hatches',
    'tower.result.draws':  'Total earned: 🥚 <b style="color:#ffd84d">{n}</b> hatch chance(s)!',
    'tower.result.again':  'Try Again 🗼',
    'tower.result.gacha':  '🥚 Go to Hatchery',
    'tower.result.back':   'Back to Map',

    // ── 孵化所 ────────────────────────────────────────────────
    'gacha.count':       'Hatch chances: <span class="sCountBadge">{n}</span>',
    'gacha.draw.btn':    'Hatch Once',
    'gacha.draw.empty':  'No chances left',
    'gacha.msg.ready':   'Tap "Hatch Once" to summon a Numling!',
    'gacha.msg.empty':   'Clear stages to earn stars and more hatch chances!',

    // ── Toast 訊息 ────────────────────────────────────────────
    'toast.skill.cd':        '{n} more chain(s) until skill ready',
    'toast.hint.cd':         '{n} more chain(s) until next hint',
    'toast.hint.no_chain':   'Make a chain first!',
    'toast.no_sol':          'No solution — shuffling board!',
    'toast.op_plus1':        "Can't +1 an operator bead",
    'toast.wrap_9to1':       '9 wrapped back to 1!',
    'toast.op_minus1':       "Can't −1 an operator bead",
    'toast.wrap_1to9':       '1 wrapped up to 9!',
    'toast.swap_top':        'Nothing above the top row to swap!',
    'toast.op_split':        "Can't split an operator bead",
    'toast.split_1':         "1 can't be split further!",
    'toast.split_top':       "Can't split the top row (no space above)",
    'toast.draw_err':        '⚠️ Draw error: {msg}',
    'toast.div_not_clean':   "÷ bead needs a clean division! (doesn't divide evenly)",
    'toast.chain_end_op':    'Chain must end with a number, not an operator!',
    'toast.divisor_miss':    'Need a multiple of {n}! {sum} is not one ({n}, {n2}, {n3}…)',
    'toast.equal_split_bad': 'Equal split shield! Need exactly {divN} beads of "{val}" ({target}÷{divN}={val}) ➗',
    'toast.odd_shield':      'Odd shield! Need {n}+ odd numbers in your chain 🔆',
    'toast.resonance_shield':'Echo shield! Need {n} of the same number in a row 🔢',
    'toast.chain_short':     'Chain too short! This enemy needs {n}+ beads 🛡️',
    'toast.no_draws':        'No hatches left — clear stages to earn more!',
    'toast.unlock.on':       '🔓 All stages unlocked',
    'toast.unlock.off':      '🔒 Sequential unlock restored',
    'toast.cleared':         'Cleared',
    'toast.survey.age':      'Please select the player age (required) 🙂',
    'toast.captain.change':  'Tap a card below to change captain',
    'toast.captain.pick':    'Tap a card below to pick a captain',
    'toast.member.change':   'Tap a card below to change member',
    'toast.member.pick':     'Tap a card below to pick a member',
    'toast.exported':        'Exported {n} events (file + clipboard)',
    'toast.purified':        'Purified! ✨',

    // ── Confirm 對話框 ────────────────────────────────────────
    'confirm.tower.retreat': 'Retreat from the Infinite Tower?\nAll hatches earned so far are kept, plus a bonus based on your highest hit.',
    'confirm.stage.exit':    "Leave this stage and return to map? (Progress won't be saved)",
    'confirm.new_tester':    "Switch to a new player?\nThis clears the current player's data and restarts the survey.\n(Export data first to save it!)",
    'confirm.clear':         'Delete all test data, stars, and collection progress?',

    // ── 浮字特效 ──────────────────────────────────────────────
    'floater.lucky':           '🍀 Next chain ×1.5!',
    'floater.shield':          '🛡️ Shield up!',
    'floater.resonance':       '🔢 {v}×{n} Echo!',
    'floater.tower_pass':      '🗼 Floor {n} cleared! 🥚+1',
    'floater.shuffled':        'Mischief! Board scrambled 🌀',
    'floater.blocked':         '🛡️ Blocked!',
    'floater.damage':          '{n} damage!',
    'floater.chaos_target':    'Chaos! Target → {n}',
    'floater.ban_changed':     'Ban switched! 🚫 {d}',
    'floater.praise.legendary':'LEGENDARY!!!',
    'floater.praise.ultra':    'AMAZING!!',
    'floater.praise.great':    'GREAT!',
    'floater.praise.nice':     'NICE!',
    'floater.minus':           'Minus!',

    // ── 狂暴訊息 ──────────────────────────────────────────────
    'enrage.default':    '⚠️ ENRAGED! Stronger attacks & faster!',
    'enrage.shell':      '⚠️ ENRAGED! Shell hardened: need {n}+ bead chain!',
    'enrage.ban':        '⚠️ ENRAGED! Banned number keeps changing!',
    'enrage.resonance':  '⚠️ ENRAGED! Echo shield stronger: need {n} matching beads!',
    'enrage.equal':      '⚠️ ENRAGED! Split shield stronger: need {n} equal parts!',
    'enrage.divisor':    '⚠️ ENRAGED! Divisor shield stronger: need a multiple of {n}!',
    'enrage.chaos':      '⚠️ CHAOS LORD ENRAGED! Stronger attacks, target keeps changing!',
    'enrage.jr':         '⚠️ Boss is angry! Mischief gets faster!',

    // ── 語音（Jr 模式）────────────────────────────────────────
    'voice.hint':         'Look for the glowing beads!',
    'voice.combo':        'Combo!',
    'voice.great':        'Amazing!',
    'voice.enrage.jr':    'Boss is angry! Keep going!',
    'voice.enrage.std':   'Boss enraged! Watch out!',
    'voice.shuffle':      'Oops, the monster messed things up!',
    'voice.welcome.jr':   'Welcome to Little World!',
    'voice.welcome.std':  "Let's go, Math Hunter!",
    'voice.tower_end':    'Tower run complete!',
    'voice.win':          'Stage clear! Amazing!',
    'voice.chaos_target': 'Target changed to {n}',
    'voice.ban_changed':  'Ban changed to {d}',
    'voice.levelup':      '{name} leveled up!',
    'voice.new_char':     'New partner {name}!',

    // ── 教學 ──────────────────────────────────────────────────
    'teach.resonance.title': '✖️ Echo = Multiplication!',
    'teach.resonance.cond':  'You just hit {v}×{n}',
    'teach.resonance.body':  'You chained <b>multiple of the same number</b> — that\'s <b>multiplication</b>!<br><b style="color:#ffae3d">{v}+{v}+… ({n} times) = {v}×{n}</b><br>More matching beads = <b>higher echo damage</b>!',
    'teach.tower.title':     '🗼 Infinite Tower!',
    'teach.tower.body':      'Climb floor by floor — enemies get stronger!<br><b>Each floor cleared = 🥚 +1 hatch chance</b>.<br>Tap "↩︎ Retreat" to bail — <b>all hatches earned are kept</b>, plus a bonus based on your <b>highest single hit</b>!',
    'teach.minus.title':     '🆕 Minus Bead!',
    'teach.minus.body':      'Chain through a purple <b style="color:#c5a3ff">−</b> bead to make the <b>next bead subtract</b>.<br>Go over then subtract back: <b>8 + 7 − 3 = 12</b>!<br><span style="font-size:12px;opacity:.7">Rules: chain can\'t start or end with −.</span>',
    'teach.mul.title':       '🆕 ×2 Multiplier Bead!',
    'teach.mul.body':        'Chain through a gold <b style="color:#ffd36b">×2</b> bead to <b>double the next number</b>!<br>Example: <b>4 + ×2 + 3 = 4 + 6 = 10</b>.<br><span style="font-size:12px;opacity:.7">Rules: can\'t start or end with ×2, can\'t follow another operator.</span>',
    'teach.divbead.title':   '🆕 ÷ Division Bead!',
    'teach.divbead.body':    'Chain through a blue <b style="color:#6fe3ff">÷</b> bead to <b>divide your running sum</b>!<br>Example: <b>8 + 4 → ÷2 = 6</b>.<br><span style="font-size:12px;opacity:.7">Only works if it divides evenly. Build a big sum, then divide down to the target!</span>',
    'teach.captain.cond':    '{ic} Captain Skill: {name}',
    'teach.captain.body':    'The <b>first Numling on your team is the captain</b> — their skill <b>stays active all battle</b>:<br><b style="color:{c}">{desc}</b><br><span style="font-size:12px;opacity:.7">Swap captains to try different math strategies!</span>',

    // ── 過關畫面 ──────────────────────────────────────────────
    'result.title.win':        '🎉 Purified!',
    'result.feedback.1star':   '<span style="color:#9ecbff">Tip: use more small numbers in your chain — more damage, more stars!</span>',
    'result.feedback.2star':   '<span style="color:#d8b4ff">So close! Land a {max}-bead chain for 3 stars 💥</span>',
    'result.feedback.3star':   '<span style="color:#5dff9d">Perfect run! You\'re a true Math Hunter 👑</span>',
    'result.draws.earned':     '⭐×{stars} → 🥚 Earned <b style="color:#ffd84d">{earned}</b> hatch chance(s)! (Total: {total})',
    'result.draws.3star_hint': '<br><span style="font-size:12px;opacity:.75">Get 3★ (avg chain ≥{avg} + land a {max}-chain) = 3 hatches at once!</span>',
    'result.draws.already':    '<span style="opacity:.7">Hatches for {prev}★ already claimed on this stage 🥚<br><span style="font-size:12px">Beat your current star count to earn more!</span></span>',
    'result.gacha_btn':        '🥚 Go Hatch ({n})',

    // ── 隊伍 ──────────────────────────────────────────────────
    'team.desc':           'Tap a benched card to field it; tap an active card to set as 👑 Captain; tap 👑 Captain to demote. Max 2.',
    'team.captain.label':  '👑 Captain <b>{name}</b>: <span style="color:{c}">{ic} {capName} — {desc}</span>',
    'team.locked':         '{name} not yet unlocked',
    'team.go_gacha':       '🥚 Go to Hatchery',
    'team.go_gacha.draws': '🥚 Go to Hatchery ({n})',
    'team.back':           'Back to Map',

    // ── 孵化結果 ──────────────────────────────────────────────
    'gacha.result.levelup': '<b>{name}</b> leveled up! Lv{lv} (damage boost)',
    'gacha.result.new':     '🎉 New partner <b>{name}</b> ({attr})!<br><span style="font-size:12px;opacity:.7">{skillIc}{skillName}　{capIc}{capName}</span>',

    // ── 分裂 dialog ───────────────────────────────────────────
    'split.desc':    'Split <b style="color:#ffd84d">{v}</b> into two numbers?<br><span style="font-size:12px;opacity:.7">First number stays in place, second replaces the bead above</span>',

    // ── 技能按鈕（提示）─────────────────────────────────────
    'skill.hint.label': '<span class="skillIcon" aria-hidden="true"></span><span class="lbl"><b>Hint</b> Find a path</span>',

    // ── 屬性名稱 ──────────────────────────────────────────────
    'attr.odd':   'Odd',
    'attr.even':  'Even',
    'attr.prime': 'Prime',
    'attr.multi': 'Multiple',

    // ── 技能名稱 & 說明 ────────────────────────────────────────
    'skill.plus1.name':  '+1',
    'skill.plus1.tip':   'Tap a bead to add 1 (9 wraps to 1)',
    'skill.minus1.name': '−1',
    'skill.minus1.tip':  'Tap a bead to subtract 1 (1 wraps to 9)',
    'skill.reroll.name': 'Reroll',
    'skill.reroll.tip':  'Tap a bead to replace it with a random one',
    'skill.split.name':  'Split',
    'skill.split.tip':   'Tap a bead to split it in two (bead above gets replaced)',
    'skill.swapUp.name': 'Swap Up',
    'skill.swapUp.tip':  'Tap a bead to swap it with the one above',
    'skill.purify.name': 'Purify',
    'skill.purify.tip':  'Tap a bead to remove it instantly',
    'skill.lucky.name':  'Lucky',
    'skill.lucky.tip':   'Next chain deals ×1.5 damage!',
    'skill.shield.name': 'Shield',
    'skill.shield.tip':  "Block the enemy's next attack!",

    // ── 隊長技 ────────────────────────────────────────────────
    'captain.prime.name': 'Prime Resonance',
    'captain.prime.desc': '+18% damage per prime bead (2·3·5·7) in chain',
    'captain.prime.tag':  'Prime×{n}',
    'captain.odd.name':   'Odd Strike',
    'captain.odd.desc':   '+12% damage per odd bead in chain',
    'captain.odd.tag':    'Odd×{n}',
    'captain.even.name':  'Even Link',
    'captain.even.desc':  '+1 chain length bonus per 2 even beads',
    'captain.even.tag':   'Even+{n}',
    'captain.multi.name': 'Multi Crit',
    'captain.multi.desc': '×2 damage when chain length is a multiple of 3',
    'captain.multi.tag':  'Multi Crit',

    // ── 角色名稱 ──────────────────────────────────────────────
    'char.kiki.name':        'Kiki',
    'char.oo.name':          'Oo',
    'char.prima.name':       'Prima',
    'char.swapy.name':       'Swapy',
    'char.starle.name':      'Starle',
    'char.guardy.name':      'Guardy',
    'char.dubdragon.name':   'Dubdragon',
    'char.munchdragon.name': 'Munchdragon',

    // ── 區域名稱 ──────────────────────────────────────────────
    'zone.0':    '🌿 Ten Plains',
    'zone.1':    '🌲 Carry Forest',
    'zone.2':    '🕳️ Sealed Cave',
    'zone.3':    '🌋 Lava Volcano',
    'zone.4':    '✖️ Multiply Valley',
    'zone.5':    '➗ Divide Valley',
    'zone.jr.a': '🐣 Little World · Part 1',
    'zone.jr.b': '🐥 Little World · Part 2',

    // ── 關卡名稱 ──────────────────────────────────────────────
    'stage.1':  'Plains · I',
    'stage.2':  'Plains · II',
    'stage.3':  'Forest · I',
    'stage.4':  'Forest · II',
    'stage.5':  'Cave · I',
    'stage.6':  'Cave · II',
    'stage.7':  'Volcano · I',
    'stage.8':  'Volcano · II',
    'stage.m1': 'Multiply Valley · I',
    'stage.m2': 'Multiply Valley · II',
    'stage.m3': 'Multiply Valley · Boss',
    'stage.e1': 'Divide Valley · I',
    'stage.e2': 'Divide Valley · II',
    'stage.e3': 'Divide Valley · Boss',
    'stage.j1': 'Little Plains',
    'stage.j2': 'Little Garden',
    'stage.j3': 'Little Forest',
    'stage.j4': 'Little Hill',
  }
};

// ── 語言狀態 ─────────────────────────────────────────────────────
let LANG = (function() {
  try { return localStorage.getItem('nh5_lang') || 'zh'; } catch (_) { return 'zh'; }
})();

// ── 翻譯函式 ──────────────────────────────────────────────────────
// t('toast.skill.cd', { n: 3 }) → '還要 3 條鏈才能再用'  (zh)
//                               → '3 more chain(s) until skill ready'  (en)
function t(key, vars) {
  const dict = I18N[LANG] || I18N.zh;
  let str = dict[key];
  if (str === undefined) {
    str = I18N.zh[key];                     // fallback 到中文
    if (str === undefined) return key;      // 最後 fallback：顯示 key 名稱
  }
  if (vars) {
    str = str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : '{' + k + '}'));
  }
  return str;
}

// ── 舊存檔遷移（中文 data-v → 中性 code）─────────────────────────
// 僅在讀取時執行一次；不寫回，讓 readSurvey() 存新格式
function migrateSurvey(s) {
  if (!s) return s;
  const gMap = { '男生': 'm', '女生': 'f', '不想說': 'x' };
  const mMap = { '剛開始學': 'beginner', '還可以': 'ok', '會乘除': 'advanced', '很拿手': 'expert' };
  if (s.gender && gMap[s.gender]) s.gender = gMap[s.gender];
  if (s.math   && mMap[s.math])   s.math   = mMap[s.math];
  return s;
}

// ── 靜態 HTML 套用翻譯 ───────────────────────────────────────────
// 對 [data-i18n] 元素依 LANG 更新文字
// mode="html" → innerHTML；mode="placeholder" → placeholder；預設 → textContent
function applyI18nToStaticHtml() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key  = el.dataset.i18n;
    const mode = el.dataset.i18nMode || 'text';
    if      (mode === 'html')        el.innerHTML   = t(key);
    else if (mode === 'placeholder') el.placeholder = t(key);
    else                             el.textContent  = t(key);
  });
  // 更新問卷選項按鈕文字
  const surveyBtnMap = {
    svGender: ['survey.gender.m', 'survey.gender.f', 'survey.gender.x'],
    svMath:   ['survey.math.beginner', 'survey.math.ok', 'survey.math.advanced', 'survey.math.expert'],
  };
  Object.entries(surveyBtnMap).forEach(([groupId, keys]) => {
    const group = document.getElementById(groupId);
    if (!group) return;
    [...group.querySelectorAll('.svOpt')].forEach((btn, i) => {
      if (keys[i]) btn.textContent = t(keys[i]);
    });
  });
}

// ── 切換語言 ──────────────────────────────────────────────────────
// 儲存後更新靜態 HTML，再 re-render 目前可見的 overlay
function setLang(lang) {
  if (!I18N[lang]) return;
  LANG = lang;
  try { localStorage.setItem('nh5_lang', lang); } catch (_) {}
  applyI18nToStaticHtml();
  // 通知 game.main.js 重新 render 目前畫面（函式由 game.main.js 提供）
  if (typeof renderCurrentView === 'function') renderCurrentView();
}
