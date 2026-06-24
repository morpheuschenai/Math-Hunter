#!/usr/bin/env bash
# 一鍵整理:偵測未使用素材 → 搬進 _archive(gitignore,不上傳)→ 重新驗證沒破圖 → build。
# 安全:工具/設定檔(kit/pipeline/icons、json/py)永不搬;搬完若有破圖會明確標出。
# 用法: bash scripts/tidy_assets.sh
set -e
cd "$(dirname "$0")/.."

echo "▶ 1/4 偵測未使用素材"
python3 scripts/find_unused_assets.py >/dev/null

echo "▶ 2/4 搬未使用素材到 _archive(保留路徑)"
n=0
while IFS= read -r f; do
  [ -e "$f" ] || continue
  mkdir -p "_archive/$(dirname "$f")"; mv "$f" "_archive/$f"; n=$((n+1))
done < UNUSED_ASSETS.txt
find assets -type d -empty -delete 2>/dev/null || true
echo "   搬移 $n 個檔"

echo "▶ 3/4 重新偵測破圖"
python3 scripts/find_unused_assets.py | sed -n '/不存在/,/完整/p'

echo "▶ 4/4 build + 守門"
node build.cjs >/dev/null && node check_ui.cjs
echo "✅ 完成。上面若顯示『(無)』破圖,即可安全上傳 GitHub。"
