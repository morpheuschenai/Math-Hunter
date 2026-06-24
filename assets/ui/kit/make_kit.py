#!/usr/bin/env python3
"""UI 素材套件生成器。
讀 ui_manifest.json →
  1) 對每個元件每個狀態:有真圖(art/<id>.<state>.png)就用,否則生一張佔位 PNG。
  2) 產生 src/ui-kit.generated.css(border-image 九宮格 + 狀態選擇器 + 按鈕版面)。
這樣畫面永遠是「圖片式、可組裝」,把佔位圖換成 AI 完稿即可,無需改程式。
用法: python3 assets/ui/kit/make_kit.py
"""
import json, os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))   # 專案根
MAN = json.load(open(os.path.join(HERE, 'ui_manifest.json'), encoding='utf-8'))

ART = os.path.join(ROOT, MAN['artDir'])
PLACE = os.path.join(ROOT, MAN['placeholderDir'])
CSSOUT = os.path.join(ROOT, MAN['generatedCss'])
PREFIX = MAN.get('cssPrefix', 'ui')
os.makedirs(ART, exist_ok=True)
os.makedirs(PLACE, exist_ok=True)

def hx(c):
    c = c.lstrip('#'); return tuple(int(c[i:i+2], 16) for i in (0, 2, 4))
def mix(c, f):  # f<1 變暗, >1 變亮(夾住)
    return tuple(max(0, min(255, int(v * f))) for v in c)
def gray(c):
    g = int(0.3*c[0]+0.59*c[1]+0.11*c[2]); g = (g+150)//2; return (g, g, g)

OUTLINE = (11, 9, 16, 255)
try:
    FONT = ImageFont.load_default()
except Exception:
    FONT = None

def kind_of(cid):
    return cid.split('.')[0]   # button / panel / badge / frame

def gen_placeholder(path, cid, w, h, state):
    base = hx(MAN['ninePatch'][cid]['color'])
    kind = kind_of(cid)
    if state == 'pressed': base, offy = mix(base, .85), 8
    elif state == 'disabled': base, offy = gray(base), 0
    else: offy = 0
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    ow = 8
    if kind == 'frame':                       # 中空框
        rad = 44
        d.rounded_rectangle([4, 4, w-4, h-4], radius=rad, fill=base+(255,), outline=OUTLINE, width=ow)
        inset = 40
        d.rounded_rectangle([inset, inset, w-inset, h-inset], radius=rad-12, fill=(0, 0, 0, 0))
    elif kind == 'badge':                      # 膠囊
        rad = h//2 - 4
        d.rounded_rectangle([6, 6, w-6, h-6], radius=rad, fill=base+(255,), outline=OUTLINE, width=ow)
    elif kind == 'button':                     # 厚底立體
        rad = min(40, h//3)
        d.rounded_rectangle([ow, ow+12, w-ow, h-ow], radius=rad, fill=mix(base, .68)+(255,))  # 底 lip
        d.rounded_rectangle([ow, ow+offy, w-ow, h-ow-12+offy], radius=rad, fill=base+(255,), outline=OUTLINE, width=ow)
        d.rounded_rectangle([ow+14, ow+offy+10, w-ow-14, ow+offy+30], radius=10, fill=mix(base, 1.25)+(120,))  # 亮面
    else:                                      # panel
        rad = 40
        d.rounded_rectangle([6, 6, w-6, h-6], radius=rad, fill=base+(255,), outline=OUTLINE, width=ow)
        d.rounded_rectangle([18, 18, w-18, h-18], radius=rad-10, outline=mix(base, .8)+(255,), width=3)
    if FONT:
        d.text((16, 14), f"{cid}\n{state}\n(placeholder)", fill=OUTLINE, font=FONT)
    img.save(path)

def resolved_url(cid, state):
    """有真圖用真圖,否則生佔位圖;回傳給 CSS 用的 ../assets 路徑。"""
    fn = f"{cid}.{state}.png"
    art = os.path.join(ART, fn)
    if os.path.exists(art):
        rel = os.path.relpath(art, ROOT).replace(os.sep, '/')
        return f'../{rel}'
    spec = MAN['ninePatch'][cid]
    place = os.path.join(PLACE, fn)
    gen_placeholder(place, cid, spec['size'][0], spec['size'][1], state)
    rel = os.path.relpath(place, ROOT).replace(os.sep, '/')
    return f'../{rel}'

def cls(cid): return f'.{PREFIX}-' + cid.replace('.', '-')

SEL = {
    'normal':  lambda c: c,
    'hover':   lambda c: f'{c}:hover',
    'pressed': lambda c: f'{c}:active, {c}[data-state="pressed"]',
    'disabled':lambda c: f'{c}:disabled, {c}[disabled], {c}.is-disabled',
}

def nine(slice_, src):
    t, r, b, l = slice_
    rw = [max(12, round(x*0.55)) for x in slice_]   # 渲染邊寬(角落會等比縮放,夠清晰)
    return (f'border-style:solid;border-width:{rw[0]}px {rw[1]}px {rw[2]}px {rw[3]}px;'
            f'border-image-source:url("{src}");border-image-slice:{t} {r} {b} {l} fill;'
            f'border-image-repeat:stretch;background:transparent;box-sizing:border-box;')

lines = ['/* 由 assets/ui/kit/make_kit.py 自動生成,請勿手改;改 ui_manifest.json 或換 art/ 圖後重跑 */']
lines.append('.ui-btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;'
             'padding:8px 18px;min-height:64px;cursor:pointer;color:#0b0910;font-weight:500;'
             'font-size:17px;line-height:1.2;text-align:left;-webkit-tap-highlight-color:transparent;}')
lines.append('.ui-btn>span{display:flex;flex-direction:column;}')
lines.append('.ui-btn small{font-size:11px;font-weight:400;opacity:.78;margin-top:2px;}')
lines.append('.ui-btn:active{transform:translateY(2px);}')
lines.append('.ui-panel{display:block;padding:24px 22px;color:#0b0910;}')

for cid, spec in MAN['ninePatch'].items():
    c = cls(cid)
    for st in spec['states']:
        src = resolved_url(cid, st)
        lines.append(f'{SEL[st](c)}{{{nine(spec["slice"], src)}}}')

open(CSSOUT, 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
n = sum(len(s['states']) for s in MAN['ninePatch'].values())
print(f'✅ 產生 {n} 個狀態圖規則 → {os.path.relpath(CSSOUT, ROOT)}')
print(f'   佔位圖在 {MAN["placeholderDir"]};把真圖放 {MAN["artDir"]}/<id>.<state>.png 重跑即覆蓋')
