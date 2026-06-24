import os, re
SRCS = ['src/index.html','src/game.css','src/ui-kit.generated.css',
        'src/game.logic.js','src/game.art.js','src/game.main.js']
src = ''
for f in SRCS:
    try: src += open(f, encoding='utf-8').read() + '\n'
    except Exception as e: print('skip', f, e)

# 1) 程式碼中出現的 assets 路徑(去掉 ?query)
refs = set(m.split('?')[0] for m in re.findall(r'assets/[A-Za-z0-9_./-]+', src))

# 2) 動態前綴(JS 會用變數組路徑):整個資料夾視為使用
keep_dirs = {'assets/characters/ch01/','assets/characters/ch02/',
             'assets/characters/ch03/','assets/characters/ch08/'}
for r in refs:                       # 任何「沒有副檔名」的 ref 當成資料夾前綴
    if '.' not in os.path.basename(r):
        keep_dirs.add(r.rstrip('/') + '/')

TOOLING = ('assets/ui/kit/', 'assets/ui/pipeline/', 'assets/ui/icons/')  # 工具/manifest/runtime,整包保留
IMG = ('.png', '.jpg', '.jpeg', '.webp', '.gif')

def used(p):
    if p in refs: return True
    if p.startswith(TOOLING): return True            # 工具/設定資料夾不算可刪
    if not p.lower().endswith(IMG): return True       # 非圖片(json/py/js/md)一律保留
    return any(p.startswith(d) for d in keep_dirs)

allf = []
for dp, _, fs in os.walk('assets'):
    for fn in fs: allf.append(os.path.join(dp, fn).replace('\\','/'))

unused = sorted(p for p in allf if not used(p))
missing = sorted(r for r in refs if r.endswith(('.png','.jpg','.webp','.9.png')) and not os.path.exists(r))

def sz(p):
    try: return os.path.getsize(p)
    except: return 0
tot = sum(sz(p) for p in unused)

open('UNUSED_ASSETS.txt','w').write('\n'.join(unused) + '\n')
print(f"檔案總數 {len(allf)} | 有用到 {len(allf)-len(unused)} | 沒用到 {len(unused)} | 沒用到體積 {tot//1024//1024} MB")
print("\n=== 沒用到的『資料夾』(整包可刪)===")
from collections import Counter
dirc = Counter(os.path.dirname(p) for p in unused)
for d,c in sorted(dirc.items(), key=lambda x:-x[1])[:25]:
    print(f"  {c:4}  {d}")
print("\n=== ⚠️ 程式碼有引用、但檔案不存在(可能被你誤搬,會破圖)===")
for m in missing[:40]: print("  ✗", m)
if not missing: print("  (無)")
print("\n完整未使用清單已寫到 UNUSED_ASSETS.txt")
