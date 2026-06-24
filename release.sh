#!/usr/bin/env bash
# 標準發版流程:每次更新就跑這支。會自動 build → 守門 → QA → commit → push。
# push 後 GitHub Actions 會自動部署到 Pages 固定連結。
# 用法: ./release.sh "這次改了什麼"
set -e
cd "$(dirname "$0")"

MSG="${1:-update}"

echo "▶ 1/5 產生 UI kit(placeholder + ui-kit.generated.css)"
python3 assets/ui/kit/make_kit.py

echo "▶ 2/5 build 單檔 index.html"
node build.cjs

echo "▶ 3/5 UI 守門(.ui-* 不可用 CSS 畫 chrome)"
node check_ui.cjs

echo "▶ 4/5 自動化遊玩 QA"
if [ -d node_modules/jsdom ]; then
  node qa.cjs
else
  echo "  ⚠️ 未安裝 jsdom,跳過 QA(要啟用請先: npm i jsdom)"
fi

echo "▶ 5/5 commit + push"
git add -A
if git diff --cached --quiet; then
  echo "  沒有變更,略過 commit"
else
  git commit -m "$MSG"
fi
git push
echo "✅ 已推送。GitHub Actions 正在部署,稍後到固定 Pages 連結看新版本。"
