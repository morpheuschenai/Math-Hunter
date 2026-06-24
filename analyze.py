#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Math Chain 遊玩數據分析腳本  (對應 math-chain-v6 / v7 匯出 JSON)
================================================================
用法:
    python3 analyze.py playtest-v6-2026-06-15.json
    python3 analyze.py *.json                 # 多檔合併(多位小孩)分析
    python3 analyze.py --demo                  # 用合成資料產生範例報告

產出:
    report.html  — 在瀏覽器打開,含三條核心曲線 + 卡關點 + 技能/減法偏好
    並在終端機印出重點摘要。

零依賴:只用 Python 標準庫,不需 pip install 任何東西。
圖表用內嵌 SVG 手繪,離線也能看。
"""

import sys, json, glob, math, html, statistics, random
from collections import defaultdict, Counter

# v6/v7 關卡順序(標準模式)。用於把事件按關卡進度排序,看「成長」。
STAGE_ORDER = ['1', '2', '3', '4', '5', '6', '7', '8',
               'j1', 'j2', 'j3', 'j4']
STAGE_NAME = {
    '1': '草原一', '2': '草原二', '3': '森林一', '4': '森林二',
    '5': '洞窟一', '6': '洞窟二', '7': '火山一', '8': '火山二',
    'j1': '小草原', 'j2': '小花園', 'j3': '小森林', 'j4': '小山丘',
}


# ----------------------------------------------------------------------
# 讀檔
# ----------------------------------------------------------------------
def load_files(paths):
    """讀入一或多個匯出 JSON,回傳 (sessions, all_events)。
    每個 event 會被標上 _src(來源檔)與 _sess(第幾個 session)。"""
    sessions, events = [], []
    for i, path in enumerate(paths):
        try:
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            print(f"⚠️  讀不到 {path}: {e}")
            continue
        evs = data.get('events', [])
        for e in evs:
            e['_src'] = path
            e['_sess'] = i
        sessions.append({
            'src': path,
            'version': data.get('version', '?'),
            'mode': data.get('mode', '?'),
            'exported_at': data.get('exported_at', '?'),
            'stars': data.get('stars', {}),
            'collection': data.get('collection', {}),
            'survey': data.get('survey') or {},
            'draws': data.get('draws', 0),
            'event_count': data.get('event_count', len(evs)),
        })
        events.extend(evs)
    events.sort(key=lambda e: (e.get('_sess', 0), e.get('ts', 0)))
    return sessions, events


# ----------------------------------------------------------------------
# 指標計算
# ----------------------------------------------------------------------
def by_type(events, t):
    return [e for e in events if e.get('t') == t]


def stage_rank(key):
    try:
        return STAGE_ORDER.index(key)
    except ValueError:
        return 99


def compute(events):
    """回傳一個 dict,裝所有要畫/要印的指標。"""
    chains = by_type(events, 'chain')
    valid_chains = [c for c in chains if c.get('valid')]
    hints = by_type(events, 'hint')
    skills = by_type(events, 'skill')
    clears = by_type(events, 'stage_clear')
    fails = by_type(events, 'stage_fail')
    aborts = by_type(events, 'stage_abort')
    firsts = by_type(events, 'first_move')
    hatches = by_type(events, 'hatch')

    m = {}

    # --- 核心 1:平均鏈長成長(按關卡進度) ---
    # 對每個關卡,算「成功鏈」的平均長度。關卡越後面值越高 = 在學會找長鏈。
    per_stage_len = defaultdict(list)
    for c in valid_chains:
        per_stage_len[c.get('stage', '?')].append(c.get('len', 0))
    m['chainlen_by_stage'] = [
        (k, round(statistics.mean(v), 2), len(v))
        for k, v in sorted(per_stage_len.items(), key=lambda kv: stage_rank(kv[0]))
    ]
    # 也算「按時間切 10 段」的滾動平均,看單一 session 內的進步
    m['chainlen_timeline'] = chunk_mean([c.get('len', 0) for c in valid_chains], 10)

    # --- 核心 2:提示依賴遞減 ---
    # 每關提示次數 / 該關成功鏈數。比例下降 = 越來越不靠提示。
    hint_by_stage = Counter(h.get('stage', '?') for h in hints)
    m['hint_rate_by_stage'] = [
        (k, round(hint_by_stage.get(k, 0) / max(1, n), 2), hint_by_stage.get(k, 0))
        for k, _, n in m['chainlen_by_stage']
    ]
    m['total_hints'] = len(hints)

    # --- 核心 3:sum 失誤率(挫折度) ---
    # 失敗鏈中 reason=='sum'(湊錯數)占所有出鏈嘗試的比例,按關卡。
    attempts_by_stage = Counter(c.get('stage', '?') for c in chains)
    sumfail_by_stage = Counter(c.get('stage', '?') for c in chains
                               if not c.get('valid') and c.get('reason') == 'sum')
    m['sumfail_rate_by_stage'] = [
        (k, round(sumfail_by_stage.get(k, 0) / max(1, attempts_by_stage.get(k, 0)), 2),
         sumfail_by_stage.get(k, 0))
        for k, _, _ in m['chainlen_by_stage']
    ]
    # 失敗原因總分布
    m['fail_reasons'] = Counter(c.get('reason', '?') for c in chains if not c.get('valid'))

    # --- 思考速度:first_move 延遲趨勢 ---
    m['firstmove_timeline'] = chunk_mean(
        [f.get('latency_ms', 0) / 1000 for f in firsts], 10)
    m['firstmove_median'] = round(statistics.median(
        [f.get('latency_ms', 0) / 1000 for f in firsts]), 2) if firsts else 0

    # --- 技能偏好 ---
    m['skill_pref'] = Counter(s.get('skill', '?') for s in skills)

    # --- 四則運算的「主動採用率」(只在成功鏈中看) ---
    n_valid = max(1, len(valid_chains))
    m['minus_adoption'] = round(sum(1 for c in valid_chains if c.get('used_minus')) / n_valid, 3)
    m['mul_adoption'] = round(sum(1 for c in valid_chains if c.get('used_mul')) / n_valid, 3)
    m['div_adoption'] = round(sum(1 for c in valid_chains if c.get('used_div')) / n_valid, 3)
    m['resonance_rate'] = round(sum(1 for c in valid_chains if c.get('run', 0) >= 2) / n_valid, 3)
    m['minus_count'] = sum(1 for c in valid_chains if c.get('used_minus'))
    # 整除盾命中率(該怪有 divisor 的嘗試中,成功比例)
    div_att = [c for c in chains if c.get('divisor')]
    div_ok = [c for c in div_att if c.get('valid')]
    m['divisor_hitrate'] = round(len(div_ok) / len(div_att), 3) if div_att else None

    # --- 無限塔 ---
    tends = by_type(events, 'tower_end')
    m['tower'] = {
        'runs': len(tends),
        'best_floor': max([t.get('floors', 0) for t in tends], default=0),
        'best_peak': max([t.get('peak', 0) for t in tends], default=0),
        'floor_draws': sum(t.get('floor_draws', 0) + t.get('bonus', 0) for t in tends),
    }

    # --- 抽蛋券經濟 ---
    de = by_type(events, 'draws_earned')
    m['draws_earned_total'] = sum(d.get('earned', 0) for d in de)

    # --- 隊長使用分布 ---
    m['captain_dist'] = Counter(s.get('captain') for s in by_type(events, 'stage_start') if s.get('captain'))

    # --- 卡關 / 棄玩點 ---
    m['fails_by_stage'] = Counter(f.get('stage', '?') for f in fails)
    m['aborts_by_stage'] = Counter(a.get('stage', '?') for a in aborts)

    # --- DDA(v7 才有):難度偏移軌跡 ---
    dda = by_type(events, 'dda')
    m['dda_timeline'] = [(d.get('ts', 0), d.get('offset', 0), d.get('reason', '')) for d in dda]

    # --- 整體摘要 ---
    durs = [c.get('dur_ms', 0) for c in clears] + [c.get('dur_ms', 0) for c in fails]
    m['summary'] = {
        'total_events': len(events),
        'total_chains': len(chains),
        'valid_chains': len(valid_chains),
        'valid_rate': round(len(valid_chains) / max(1, len(chains)), 3),
        'avg_chain_len': round(statistics.mean([c.get('len', 0) for c in valid_chains]), 2) if valid_chains else 0,
        'max_chain_len': max([c.get('len', 0) for c in valid_chains], default=0),
        'stages_cleared': len(clears),
        'stages_failed': len(fails),
        'stages_aborted': len(aborts),
        'eggs_hatched': len(hatches),
        'play_minutes': round(sum(durs) / 60000, 1),
    }
    return m


def chunk_mean(values, n_chunks):
    """把序列切成 n_chunks 段,每段取平均。回傳 [(段序, 平均), ...]"""
    if not values:
        return []
    size = max(1, math.ceil(len(values) / n_chunks))
    out = []
    for i in range(0, len(values), size):
        seg = values[i:i + size]
        out.append((i // size + 1, round(statistics.mean(seg), 2)))
    return out


# ----------------------------------------------------------------------
# SVG 圖表(零依賴手繪)
# ----------------------------------------------------------------------
def svg_line(points, w=520, h=200, color='#5dff9d', label_y='', invert_good=False):
    """points: [(x_label, value), ...]  畫折線 + 點 + 數值。"""
    if not points:
        return '<p style="color:#888">（沒有資料）</p>'
    vals = [p[1] for p in points]
    vmax = max(vals + [0.001]); vmin = min(vals + [0])
    rng = (vmax - vmin) or 1
    pad = 38
    iw, ih = w - pad * 2, h - pad * 2
    n = len(points)
    def X(i): return pad + (iw * i / max(1, n - 1))
    def Y(v): return pad + ih - (ih * (v - vmin) / rng)
    pts = " ".join(f"{X(i):.1f},{Y(v):.1f}" for i, v in enumerate(vals))
    dots, labels = "", ""
    for i, (lab, v) in enumerate(points):
        dots += f'<circle cx="{X(i):.1f}" cy="{Y(v):.1f}" r="3.5" fill="{color}"/>'
        dots += f'<text x="{X(i):.1f}" y="{Y(v)-8:.1f}" fill="#cfe" font-size="10" text-anchor="middle">{v}</text>'
        labels += f'<text x="{X(i):.1f}" y="{h-12}" fill="#9ab" font-size="10" text-anchor="middle">{html.escape(str(lab))}</text>'
    grid = f'<line x1="{pad}" y1="{pad+ih}" x2="{w-pad}" y2="{pad+ih}" stroke="#2a3550"/>' \
           f'<line x1="{pad}" y1="{pad}" x2="{pad}" y2="{pad+ih}" stroke="#2a3550"/>'
    return f'''<svg viewBox="0 0 {w} {h}" width="100%" style="max-width:{w}px">
      {grid}
      <text x="6" y="{pad}" fill="#9ab" font-size="10">{vmax:.1f}</text>
      <text x="6" y="{pad+ih}" fill="#9ab" font-size="10">{vmin:.1f}</text>
      <polyline points="{pts}" fill="none" stroke="{color}" stroke-width="2.5"/>
      {dots}{labels}
    </svg>'''


def svg_bars(pairs, w=520, h=200, color='#9ecbff'):
    """pairs: [(label, value), ...]  直條圖。"""
    if not pairs:
        return '<p style="color:#888">（沒有資料）</p>'
    vmax = max([v for _, v in pairs] + [0.001])
    pad = 38; iw, ih = w - pad * 2, h - pad * 2
    n = len(pairs); bw = iw / n * 0.62
    bars = ""
    for i, (lab, v) in enumerate(pairs):
        x = pad + iw * (i + 0.5) / n - bw / 2
        bh = ih * v / vmax
        y = pad + ih - bh
        bars += f'<rect x="{x:.1f}" y="{y:.1f}" width="{bw:.1f}" height="{bh:.1f}" rx="3" fill="{color}"/>'
        bars += f'<text x="{x+bw/2:.1f}" y="{y-5:.1f}" fill="#cfe" font-size="10" text-anchor="middle">{v}</text>'
        bars += f'<text x="{x+bw/2:.1f}" y="{h-12}" fill="#9ab" font-size="10" text-anchor="middle">{html.escape(str(lab))}</text>'
    base = f'<line x1="{pad}" y1="{pad+ih}" x2="{w-pad}" y2="{pad+ih}" stroke="#2a3550"/>'
    return f'<svg viewBox="0 0 {w} {h}" width="100%" style="max-width:{w}px">{base}{bars}</svg>'


# ----------------------------------------------------------------------
# 報告產生
# ----------------------------------------------------------------------
SKILL_NAME = {'plus1': '加一', 'minus1': '減一', 'reroll': '重擲',
              'split': '分裂', 'swapUp': '上下換', 'purify': '淨化',
              'lucky': '幸運', 'shield': '護盾'}


def verdict(m):
    """根據三條核心指標,自動給一句白話判讀(賣給父母用)。"""
    out = []
    cl = m['chainlen_by_stage']
    if len(cl) >= 2:
        first, last = cl[0][1], cl[-1][1]
        if last > first + 0.3:
            out.append(f"✅ 平均鏈長從第一關 {first} 上升到最後 {last}，孩子在學會「拆得更細、湊得更長」。")
        elif last < first - 0.3:
            out.append(f"⚠️ 平均鏈長從 {first} 下降到 {last}，後段可能變太難或疲乏，建議看卡關點。")
        else:
            out.append(f"➖ 平均鏈長大致持平({first}→{last}),機制穩定但還沒看到明顯成長,可拉長觀察。")
    hr = m['hint_rate_by_stage']
    if len(hr) >= 2 and m['total_hints'] > 0:
        if hr[-1][1] < hr[0][1]:
            out.append("✅ 提示依賴隨關卡下降,孩子越來越能自己找解。")
        else:
            out.append("⚠️ 提示依賴沒有下降,可能題目偏難或孩子習慣先按提示。")
    elif m['total_hints'] == 0:
        out.append("ℹ️ 完全沒用提示——對這年齡可能偏簡單,或孩子很獨立。")
    sf = m['sumfail_rate_by_stage']
    if sf:
        avg_sf = round(statistics.mean([r for _, r, _ in sf]), 2)
        if avg_sf > 0.5:
            out.append(f"⚠️ 平均 sum 失誤率 {avg_sf}(湊錯數佔多數嘗試),挫折偏高,DDA 應調降難度。")
        elif avg_sf < 0.2:
            out.append(f"✅ sum 失誤率僅 {avg_sf},孩子多半一次湊對,流暢度高(或可調難)。")
        else:
            out.append(f"➖ sum 失誤率 {avg_sf},落在健康的「試了會錯但常成功」區間。")
    return out


def age_band(sv):
    a = (sv or {}).get('age')
    if not a: return '未填'
    if a in ('5', '6'): return '5–6'
    if a in ('7', '8'): return '7–8'
    if a in ('9', '10'): return '9–10'
    if a in ('11', '12'): return '11–12'
    return '13+'


def cohort_rows(sessions, events):
    bands = {}
    for i, sess in enumerate(sessions):
        bands.setdefault(age_band(sess.get('survey')), []).append(i)
    rows = []
    for b in ['5–6', '7–8', '9–10', '11–12', '13+', '未填']:
        if b not in bands: continue
        idxs = set(bands[b])
        cm = compute([e for e in events if e.get('_sess') in idxs])
        cl = cm['chainlen_by_stage']
        growth = f"{cl[0][1]}→{cl[-1][1]}" if len(cl) >= 2 else (str(cl[0][1]) if cl else '–')
        rows.append([b, len(bands[b]), f"{int(cm['summary']['valid_rate']*100)}%", growth,
                     f"{int(cm['minus_adoption']*100)}%", f"{int(cm['mul_adoption']*100)}%",
                     f"{int(cm['div_adoption']*100)}%", cm['total_hints']])
    return rows


OP_NAME = {'add': '加法', 'minus': '減法', 'mul': '乘法', 'div': '除法'}
OP_ORDER = ['add', 'minus', 'mul', 'div']
RANGE_ORDER = ['1-9', '10-20', '21-50', '51-99', '100+']


def _derive_ops(c):
    """舊版匯出(無 ops 欄)時,由旗標還原運算別。"""
    ops = ['add']
    if c.get('used_minus'): ops.append('minus')
    if c.get('used_mul') or c.get('run', 0) >= 2: ops.append('mul')
    if c.get('used_div'): ops.append('div')
    return ops


def _derive_range(c):
    n = abs(c.get('sum') if c.get('divisor') else c.get('target', 0) or c.get('sum', 0))
    return ('1-9' if n <= 9 else '10-20' if n <= 20 else '21-50' if n <= 50
            else '51-99' if n <= 99 else '100+')


def learning_report(events):
    """逐題學習數據聚合:各運算別 × 數字範圍的 正確率 / 反應速度 / 進步趨勢。
    這是賣給家長的核心:不是『破第幾關』,而是『哪種數學、哪個範圍熟不熟、有沒有變快』。"""
    chains = by_type(events, 'chain')
    stat = {}   # op -> {att, ok, ms:[], rng:{range:{att,ok,ms:[]}}, ms_seq:[(ts,ms)]}
    for c in chains:
        ops = c.get('ops') or _derive_ops(c)
        rng = c.get('range') or _derive_range(c)
        valid = bool(c.get('valid'))
        sms = c.get('solve_ms')
        sms = sms if isinstance(sms, (int, float)) and sms > 0 else None
        for op in ops:
            o = stat.setdefault(op, {'att': 0, 'ok': 0, 'ms': [], 'rng': {}, 'seq': []})
            o['att'] += 1
            r = o['rng'].setdefault(rng, {'att': 0, 'ok': 0, 'ms': []})
            r['att'] += 1
            if valid:
                o['ok'] += 1; r['ok'] += 1
                if sms is not None:
                    o['ms'].append(sms); r['ms'].append(sms); o['seq'].append((c.get('ts', 0), sms))
    # 整理成可呈現的列
    rows = []
    for op in OP_ORDER:
        if op not in stat: continue
        o = stat[op]
        acc = round(o['ok'] / max(1, o['att']) * 100)
        med = round(statistics.median(o['ms']) / 1000, 1) if o['ms'] else None
        # 進步:依時間排序的有效解題時間,比較前半 vs 後半中位數
        seq = [ms for _, ms in sorted(o['seq'])]
        trend = None
        if len(seq) >= 6:
            half = len(seq) // 2
            first = statistics.median(seq[:half]) / 1000
            last = statistics.median(seq[half:]) / 1000
            trend = (round(first, 1), round(last, 1))
        rng_rows = []
        for rg in RANGE_ORDER:
            if rg not in o['rng']: continue
            rr = o['rng'][rg]
            rng_rows.append({
                'range': rg, 'att': rr['att'],
                'acc': round(rr['ok'] / max(1, rr['att']) * 100),
                'med': round(statistics.median(rr['ms']) / 1000, 1) if rr['ms'] else None,
            })
        rows.append({'op': op, 'name': OP_NAME[op], 'att': o['att'], 'ok': o['ok'],
                     'acc': acc, 'med': med, 'trend': trend, 'ranges': rng_rows})
    return rows


def learning_verdict(rows):
    """把學習數據翻成白話、可直接給父母看的句子。"""
    out = []
    for r in rows:
        if r['att'] < 4:
            continue
        spd = f"、平均 {r['med']} 秒" if r['med'] is not None else ""
        if r['acc'] >= 85:
            level = "已熟練 ✅"
        elif r['acc'] >= 65:
            level = "穩定發展中 🟡"
        else:
            level = "還需要多練習 🔴"
        line = f"{r['name']}:{level}（正確率 {r['acc']}%{spd}，練習 {r['att']} 次）"
        if r['trend']:
            f0, f1 = r['trend']
            if f1 < f0 - 0.3:
                line += f"　反應變快了 ⚡ {f0}s→{f1}s"
            elif f1 > f0 + 0.5:
                line += f"　最近變慢(可能在挑戰更難題){f0}s→{f1}s"
        out.append(line)
    if not out:
        out.append("資料還太少,多玩幾關就會出現各運算的熟練度分析。")
    return out


def render_html(sessions, events, m):
    s = m['summary']
    def kv(label, val): return f'<div class="card"><div class="k">{label}</div><div class="v">{val}</div></div>'

    verdicts = "".join(f'<li>{html.escape(v)}</li>' for v in verdict(m))

    chainlen_line = svg_line([(STAGE_NAME.get(k, k), v) for k, v, _ in m['chainlen_by_stage']],
                             color='#5dff9d')
    chainlen_tl = svg_line([(f'{i}', v) for i, v in m['chainlen_timeline']], color='#ffd84d')
    hint_bars = svg_bars([(STAGE_NAME.get(k, k), v) for k, v, _ in m['hint_rate_by_stage']],
                         color='#9ecbff')
    sumfail_line = svg_line([(STAGE_NAME.get(k, k), v) for k, v, _ in m['sumfail_rate_by_stage']],
                            color='#ff9e9e')
    fm_tl = svg_line([(f'{i}', v) for i, v in m['firstmove_timeline']], color='#c5a3ff')

    skill_bars = svg_bars([(SKILL_NAME.get(k, k), c) for k, c in m['skill_pref'].most_common()],
                          color='#7cf0d0')
    fail_bars = svg_bars([(STAGE_NAME.get(k, k), c) for k, c in
                          (m['fails_by_stage'] + m['aborts_by_stage']).most_common()],
                         color='#ff7a7a')
    reason_bars = svg_bars([(k, c) for k, c in m['fail_reasons'].most_common()], color='#e0a0ff')

    op_bars = svg_bars([('減法', int(m['minus_adoption'] * 100)), ('乘法×珠', int(m['mul_adoption'] * 100)),
                        ('同數共鳴', int(m['resonance_rate'] * 100)), ('除法÷珠', int(m['div_adoption'] * 100))],
                       color='#7cf0d0')
    cap_bars = svg_bars([(k, c) for k, c in m['captain_dist'].most_common()], color='#b8a0ff')

    # 學習數據:家長進度報告(運算別 × 數字範圍)
    lrows = learning_report(events)
    lverdict = "".join(f'<li>{html.escape(v)}</li>' for v in learning_verdict(lrows))
    learn_html = ''
    if lrows:
        head = ('<tr><th>運算</th><th>練習次數</th><th>正確率</th><th>中位反應</th>'
                '<th>數字範圍細項(範圍 · 次數 · 正確率 · 秒)</th></tr>')
        body = ''
        for r in lrows:
            med = '—' if r['med'] is None else f"{r['med']}s"
            sub = ' ／ '.join(
                f"{x['range']}:{x['att']}次 {x['acc']}%"
                + ('' if x['med'] is None else f" {x['med']}s")
                for x in r['ranges'])
            body += (f"<tr><td><b>{r['name']}</b></td><td>{r['att']}</td>"
                     f"<td>{r['acc']}%</td><td>{med}</td>"
                     f"<td style='text-align:left;font-size:12px'>{html.escape(sub)}</td></tr>")
        learn_html = (
            '<section class="verdict"><h2>🎓 學習進度報告 '
            '<span class="note">每條成功鏈=一次練習。看各運算「熟不熟、哪個數字範圍卡、有沒有變快」(賣家長的核心)</span></h2>'
            f'<ul>{lverdict}</ul>'
            f'<table class="ct">{head}{body}</table>'
            '<p class="note">正確率=成功鏈/總嘗試;中位反應=從盤面可動到送出鏈的時間中位數(已扣結算動畫)。'
            '加法為基礎運算,幾乎每條鏈都會計入。</p></section>')

    co = cohort_rows(sessions, events)
    cohort_html = ''
    if co:
        head = '<tr><th>年齡</th><th>人數</th><th>成功率</th><th>鏈長成長</th><th>減法</th><th>乘法</th><th>除法</th><th>提示</th></tr>'
        body = ''.join('<tr>' + ''.join(f'<td>{c}</td>' for c in r) + '</tr>' for r in co)
        cohort_html = (f'<section><h2>👧🧒 依年齡分群 <span class="note">不同年齡的學習表現對比(賣父母的分眾證據)</span></h2>'
                       f'<table class="ct">{head}{body}</table></section>')

    tw = m['tower']
    dh = '—' if m['divisor_hitrate'] is None else f"{int(m['divisor_hitrate'] * 100)}%"
    tower_gacha = (f'<div class="cards">'
                   f'{kv("🗼 塔挑戰次數", tw["runs"])}{kv("🗼 最高層", tw["best_floor"])}'
                   f'{kv("🗼 最高單發", tw["best_peak"])}{kv("🥚 累計獲券", m["draws_earned_total"])}'
                   f'{kv("整除盾命中", dh)}</div>')

    dda_block = ""
    if m['dda_timeline']:
        dda_line = svg_line([(str(i + 1), off) for i, (_, off, _) in enumerate(m['dda_timeline'])],
                            color='#ffb45e')
        dda_block = f'<section><h2>🎚️ DDA 難度偏移軌跡 (v7)</h2><p class="note">正值=系統調高難度,負值=放寬。理想是繞著 0 上下微調,代表難度貼著孩子走。</p>{dda_line}</section>'

    def survey_str(sv):
        if not sv:
            return '<span style="opacity:.5">（無問卷）</span>'
        parts = []
        if sv.get('nick'): parts.append(f"「{html.escape(str(sv['nick']))}」")
        if sv.get('age'): parts.append(f"{html.escape(str(sv['age']))} 歲")
        if sv.get('gender'): parts.append(html.escape(str(sv['gender'])))
        if sv.get('math'): parts.append(f"數學:{html.escape(str(sv['math']))}")
        return '　'.join(parts) or '（問卷未完成）'

    src_list = "".join(
        f"<li><b>{survey_str(x['survey'])}</b><br>"
        f"<span style='font-size:12px;opacity:.65'>{html.escape(x['src'])} — {x['version']} / {x['mode']} / "
        f"{len(x['collection'])} 隻數靈 / {sum(x['stars'].values())} ⭐ / 抽蛋券 {x.get('draws',0)}</span></li>"
        for x in sessions)

    return f'''<!doctype html><html lang="zh-TW"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Math Chain 遊玩數據報告</title>
<style>
  body{{font-family:-apple-system,"PingFang TC",sans-serif;background:#0d1320;color:#e8eefc;
       margin:0;padding:24px;line-height:1.6}}
  h1{{font-size:22px;margin:0 0 4px}} h2{{font-size:16px;margin:28px 0 8px;color:#9ecbff}}
  .sub{{color:#8aa;font-size:13px;margin-bottom:18px}}
  .cards{{display:flex;flex-wrap:wrap;gap:10px;margin:14px 0}}
  .card{{background:#16203a;border:1px solid #243150;border-radius:10px;padding:10px 14px;min-width:96px}}
  .card .k{{font-size:11px;color:#8aa}} .card .v{{font-size:20px;font-weight:700;color:#ffd84d}}
  section{{background:#111a2e;border:1px solid #1e2a47;border-radius:14px;padding:16px 18px;margin:14px 0}}
  .verdict{{background:#13241c;border-color:#1f4733}} .verdict li{{margin:6px 0}}
  .note{{color:#8aa;font-size:12px;margin:2px 0 10px}}
  ul{{padding-left:20px}} li{{font-size:14px}}
  .grid2{{display:grid;grid-template-columns:1fr 1fr;gap:14px}}
  @media(max-width:720px){{.grid2{{grid-template-columns:1fr}}}}
  table.ct{{width:100%;border-collapse:collapse;font-size:13px}}
  table.ct th,table.ct td{{border:1px solid #243150;padding:6px 8px;text-align:center}}
  table.ct th{{color:#9ecbff;font-weight:600}}
</style></head><body>
<h1>🐲 Math Chain 遊玩數據報告</h1>
<div class="sub">{len(sessions)} 個 session · {s['play_minutes']} 分鐘遊玩 · {s['total_events']} 筆事件</div>

<section class="verdict"><h2>📋 白話判讀(可直接給父母看)</h2><ul>{verdicts}</ul></section>

{learn_html}

<div class="cards">
  {kv('成功鏈', s['valid_chains'])}{kv('出鏈成功率', f"{int(s['valid_rate']*100)}%")}
  {kv('平均鏈長', s['avg_chain_len'])}{kv('最長鏈', s['max_chain_len'])}
  {kv('過關', s['stages_cleared'])}{kv('失敗', s['stages_failed'])}
  {kv('中離', s['stages_aborted'])}{kv('孵蛋', s['eggs_hatched'])}
  {kv('減法採用率', f"{int(m['minus_adoption']*100)}%")}{kv('乘法×珠', f"{int(m['mul_adoption']*100)}%")}
  {kv('除法÷珠', f"{int(m['div_adoption']*100)}%")}{kv('首動中位', f"{m['firstmove_median']}s")}
</div>

{cohort_html}

<section><h2>✚➖✖️➗ 四則運算「主動採用率」 <span class="note">在成功鏈中用到該運算的比例 = 孩子是否真的把運算當策略在用</span></h2>{op_bars}</section>
{tower_gacha}

<section><h2>① 平均鏈長 × 關卡進度 <span class="note">越往右越高 = 在學會找長鏈(核心學習訊號)</span></h2>{chainlen_line}</section>
<div class="grid2">
  <section><h2>① 補充:單局內鏈長走勢</h2><p class="note">把所有成功鏈切 10 段取平均,看單次遊玩內的熱身/進步。</p>{chainlen_tl}</section>
  <section><h2>④ 思考速度:首動延遲趨勢(秒)</h2><p class="note">下降=越來越快進入狀況;持平偏高=還在動腦想(未必是壞事)。</p>{fm_tl}</section>
</div>

<section><h2>② 提示依賴 × 關卡 <span class="note">(提示次數 / 成功鏈),下降 = 越來越能自己解</span></h2>{hint_bars}</section>
<section><h2>③ sum 失誤率 × 關卡 <span class="note">湊錯數的比例。太高=挫折;太低=可能太簡單;0.2–0.5 是健康甜蜜點</span></h2>{sumfail_line}</section>

<div class="grid2">
  <section><h2>🎯 失敗原因分布</h2><p class="note">sum=湊錯數 · short=鏈太短(硬殼) · end_minus=以減號結尾</p>{reason_bars}</section>
  <section><h2>🧰 技能偏好</h2><p class="note">哪個技能最受歡迎 → 決定夥伴/技能設計重心</p>{skill_bars}</section>
</div>

<div class="grid2">
  <section><h2>🧱 卡關 / 棄玩點(失敗+中離)</h2><p class="note">某關特別高 → 難度斷層,優先用 DDA 或調 band 處理</p>{fail_bars}</section>
  <section><h2>👑 隊長使用分布</h2><p class="note">孩子最常用哪個數系隊長 → 構築偏好</p>{cap_bars}</section>
</div>

{dda_block}

<section><h2>👥 測試者（問卷）</h2><ul>{src_list}</ul></section>
</body></html>'''


def print_summary(m, events=None):
    s = m['summary']
    print("\n" + "=" * 52)
    print("  Math Chain 數據摘要")
    print("=" * 52)
    print(f"  遊玩時間      {s['play_minutes']} 分鐘 / {s['total_events']} 事件")
    print(f"  出鏈成功率    {int(s['valid_rate']*100)}%  ({s['valid_chains']}/{s['total_chains']})")
    print(f"  平均鏈長      {s['avg_chain_len']}   最長 {s['max_chain_len']}")
    print(f"  過關/失敗/中離 {s['stages_cleared']} / {s['stages_failed']} / {s['stages_aborted']}")
    print(f"  運算採用率    減{int(m['minus_adoption']*100)}% 乘{int(m['mul_adoption']*100)}% 除{int(m['div_adoption']*100)}% 共鳴{int(m['resonance_rate']*100)}%")
    print(f"  無限塔        {m['tower']['runs']} 趟 / 最高 {m['tower']['best_floor']} 層 / 最高單發 {m['tower']['best_peak']}")
    print(f"  首動中位      {m['firstmove_median']}s")
    print("-" * 52)
    print("  核心判讀:")
    for v in verdict(m):
        print(f"   {v}")
    if events is not None:
        print("-" * 52)
        print("  🎓 學習進度(運算別):")
        for v in learning_verdict(learning_report(events)):
            print(f"   {v}")
    print("=" * 52 + "\n")


# ----------------------------------------------------------------------
# 合成資料(--demo / 自我測試)
# ----------------------------------------------------------------------
def make_demo(age='9', nick='範例小明', skill=0.0):
    """產一份假的 v10 匯出,涵蓋四則運算/塔/抽蛋,讓報告/腳本可被驗證。
    skill:0~1,越高越強(成功率高、鏈更長、更會用運算)。"""
    ev, ts = [], 1_700_000_000_000
    cap = random.choice(['odd', 'prime', 'even', 'multi'])
    # 關卡:加→減→乘→除,模擬概念逐步進場
    stages = [('1', None), ('2', None), ('4', 'minus'), ('m1', None), ('m2', 'mul'), ('e1', 'divisor'), ('e2', 'div')]
    for si, (st, feat) in enumerate(stages):
        ev.append({'t': 'stage_start', 'ts': ts, 'stage': st, 'mode': 'std', 'captain': cap}); ts += 1000
        base_len = 2.2 + si * 0.3 + skill * 1.5
        fail_p = max(0.08, 0.55 - si * 0.05 - skill * 0.25)
        for foe in range(1, 4):
            ev.append({'t': 'first_move', 'ts': ts, 'stage': st, 'foe': foe,
                       'latency_ms': int(max(700, 5000 - si * 350 - skill * 1500 + random.randint(-400, 400)))}); ts += 500
            for _ in range(random.randint(4, 7)):
                length = max(2, round(random.gauss(base_len, 0.9)))
                target = 10 + si + random.randint(0, 6)
                valid = random.random() > fail_p
                c = {'t': 'chain', 'ts': ts, 'stage': st, 'foe': foe, 'len': length,
                     'sum': target if valid else target + random.choice([-2, 3]), 'target': target,
                     'valid': valid, 'used_minus': False, 'used_mul': False, 'used_div': False,
                     'run': 1, 'cap': cap, 'minLen': 2, 'banned': 0, 'drag_ms': random.randint(900, 3500)}
                if feat == 'minus': c['used_minus'] = valid and random.random() < 0.3 + skill * 0.2
                if feat == 'mul': c['used_mul'] = valid and random.random() < 0.35 + skill * 0.2
                if feat == 'div': c['used_div'] = valid and random.random() < 0.3 + skill * 0.2
                if st in ('m1', 'm2'): c['run'] = random.choice([1, 2, 2, 3]) if valid else 1
                if feat == 'divisor':
                    c['divisor'] = 3
                    c['reason'] = 'ok' if valid else 'divisor_miss'
                else:
                    c['reason'] = 'ok' if valid else random.choice(['sum', 'sum', 'short', 'odd_shield'])
                # 學習數據欄位(對應遊戲 v10 chain 事件)
                ops = ['add']
                if c['used_minus']: ops.append('minus')
                if c['used_mul'] or (st in ('m1', 'm2') and c['run'] >= 2): ops.append('mul')
                if c['used_div']: ops.append('div')
                c['ops'] = ops
                c['range'] = ('1-9' if target <= 9 else '10-20' if target <= 20 else
                              '21-50' if target <= 50 else '51-99' if target <= 99 else '100+')
                c['max_operand'] = random.randint(1, 9)
                c['solve_ms'] = int(max(600, random.gauss(4400 - si * 320 - skill * 1900, 950)))
                ev.append(c); ts += random.randint(1500, 5000)
            if random.random() < max(0.05, 0.45 - si * 0.06 - skill * 0.2):
                ev.append({'t': 'hint', 'ts': ts, 'stage': st}); ts += 800
            if random.random() < 0.5:
                ev.append({'t': 'skill', 'ts': ts, 'stage': st, 'foe': foe,
                           'skill': random.choice(['split', 'plus1', 'reroll', 'minus1', 'lucky'])}); ts += 600
        if random.random() < 0.8 + skill * 0.15:
            stars = random.randint(1, 3)
            ev.append({'t': 'stage_clear', 'ts': ts, 'stage': st, 'stars': stars, 'prev_stars': 0,
                       'dur_ms': random.randint(110000, 200000), 'avg_chain': round(base_len, 2),
                       'max_chain': int(base_len + 2), 'chains': 15, 'minus_chains': 2})
            ev.append({'t': 'draws_earned', 'ts': ts + 50, 'stage': st, 'earned': stars, 'total': stars})
            for _ in range(stars):
                ev.append({'t': 'egg_drop', 'ts': ts + 80, 'source': 'gacha', 'species': 'kiki'})
                ev.append({'t': 'hatch', 'ts': ts + 90, 'species': 'kiki', 'dup': True, 'level': 2})
        else:
            ev.append({'t': 'stage_fail', 'ts': ts, 'stage': st, 'foe': 3, 'dur_ms': random.randint(80000, 150000)})
        ts += 3000
    # 無限塔一趟
    ev.append({'t': 'tower_start', 'ts': ts, 'captain': cap}); ts += 500
    floors = random.randint(3, 8) + int(skill * 6)
    peak = random.randint(80, 400) * (1 + int(skill * 8))
    for f in range(1, floors + 1):
        ev.append({'t': 'tower_floor', 'ts': ts, 'floor': f, 'peak': peak}); ts += 4000
    ev.append({'t': 'tower_end', 'ts': ts, 'floors': floors, 'peak': peak,
               'floor_draws': floors, 'bonus': 2, 'died': True})
    return {'version': 'v10-demo', 'exported_at': '2026-06-15T00:00:00Z', 'mode': 'std',
            'stars': {st: 2 for st, _ in stages}, 'collection': {'kiki': 3, 'prima': 1, 'oo': 1, 'dubdragon': 1},
            'survey': {'age': age, 'gender': random.choice(['男生', '女生']), 'math': '還可以', 'nick': nick},
            'draws': 4, 'event_count': len(ev), 'events': ev}


# ----------------------------------------------------------------------
def main():
    args = sys.argv[1:]
    if not args or '--demo' in args:
        print("（沒給檔案或 --demo:用合成資料產生範例報告,含 7 歲與 10 歲兩位)")
        demos = [make_demo(age='7', nick='範例小明', skill=0.2),
                 make_demo(age='10', nick='範例小華', skill=0.7)]
        sessions, events = [], []
        for i, data in enumerate(demos):
            for e in data['events']:
                e['_src'] = 'demo'; e['_sess'] = i
            events.extend(data['events'])
            sessions.append({'src': f'demo{i}', 'version': data['version'], 'mode': data['mode'],
                             'exported_at': data['exported_at'], 'stars': data['stars'],
                             'collection': data['collection'], 'survey': data.get('survey') or {},
                             'draws': data.get('draws', 0), 'event_count': data['event_count']})
    else:
        paths = []
        for a in args:
            paths.extend(glob.glob(a))
        if not paths:
            print("找不到符合的檔案。"); sys.exit(1)
        sessions, events = load_files(paths)
        if not events:
            print("沒有任何事件可分析。"); sys.exit(1)

    m = compute(events)
    print_summary(m, events)
    out = 'report.html'
    with open(out, 'w', encoding='utf-8') as f:
        f.write(render_html(sessions, events, m))
    print(f"📊 已產生報告:{out}（用瀏覽器打開）\n")


if __name__ == '__main__':
    main()
