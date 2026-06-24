# 發版與預覽流程(GitHub + Pages)

目標:Claude / Codex 每次更新都自動產生一個版本上 GitHub,你用**固定連結**就能預覽最新版。

## 一次性設定(由你完成,需 GitHub 帳號權限)

我(Claude)已在本機建好 git repo 並完成第一次 commit。你只要把它連到 GitHub 並開啟 Pages:

```bash
# 1) 在 GitHub 建一個新的空 repo(網頁建立,或用 gh):
gh repo create math-hunter --public --source=. --remote=origin --push
#   若用網頁建 repo,改用:
#   git remote add origin https://github.com/<你的帳號>/<repo>.git
#   git branch -M main
#   git push -u origin main
```

接著開啟 Pages(只需一次):
- GitHub repo → **Settings → Pages → Build and deployment → Source 選「GitHub Actions」**。

完成後,固定預覽連結是:
```
https://<你的帳號>.github.io/<repo>/
```
之後每次 push 到 `main`,Actions 會自動 build + 部署,這個連結永遠是最新版。

> 說明:我無法替你建立 repo 或輸入帳密(帳號層級操作),這步要你來;其餘自動化都已就緒。

## 每次更新的標準流程(Claude / Codex / 你都用同一支)

```bash
./release.sh "這次改了什麼"
```
它會自動:`make_kit.py` → `build.cjs` → `check_ui.cjs` → `qa.cjs` → `git commit` → `git push`。
push 後 GitHub Actions 自動部署,稍等 1–2 分鐘到固定連結看新版本。

手動版(等同上面):
```bash
python3 assets/ui/kit/make_kit.py
node build.cjs && node check_ui.cjs && node qa.cjs
git add -A && git commit -m "訊息" && git push
```

## CI 自動部署做了什麼(`.github/workflows/deploy.yml`)
1. checkout → 裝 Node → `node build.cjs`(用 src/ 重新產生根目錄 index.html,確保部署的就是最新原始碼)。
2. 從**預覽**移除純設計用的大資料夾(`assets/ui-final`、`ui-concepts`、`quest-final`、`pipeline`、`math-puzzle-godot`、mockups、舊 `math-chain-*.html`)——**只精簡部署,repo 內仍完整保留版控**。
3. 上傳並部署到 GitHub Pages。

## 規則
- **永遠用 `release.sh` 或先 `build.cjs` 再 push**:根目錄 `index.html` 是 build 產物;CI 也會再 build 一次保險。
- 大型設計檔仍進 repo(版控),但不會拖慢預覽(CI 會精簡)。
- 想要「某版本的固定連結」做 A/B:在該 commit 打 tag,或開分支由 Actions 部署到該環境(進階,需要時再設)。
