/* build.cjs — 把 src/ 的 css + 三個 js inline 回單一 self-contained index.html
   供 GitHub Pages 單檔部署。開發時 Codex 可直接開 src/index.html（外連 css/js 即時預覽）。
   用法： node build.cjs   → 產生根目錄 index.html
   流程： 改 src/* → node build.cjs → node qa.cjs */
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, 'src');
const read = f => fs.readFileSync(path.join(SRC, f), 'utf8');

let h = read('index.html');
const fixUrls = s => s.replace(/url\((['"]?)\.\.\/assets\//g, 'url($1assets/');   // 同時處理 "、'、無引號三種寫法
const css = fixUrls(read('game.css')),
      uikit = fixUrls(read('ui-kit.generated.css')),
      logic = read('game.logic.js'),
      art = read('game.art.js'), main = read('game.main.js');

const subs = [
  ['<link rel="stylesheet" href="game.css">',          '<style>\n' + css + '</style>'],
  ['<link rel="stylesheet" href="ui-kit.generated.css">', '<style>\n' + uikit + '</style>'],
  ['<script id="logic" src="game.logic.js"></script>', '<script id="logic">\n' + logic + '</script>'],
  ['<script id="art" src="game.art.js"></script>',     '<script id="art">\n' + art + '</script>'],
  ['<script src="game.main.js"></script>',             '<script>\n' + main + '</script>'],
];
for (const [from, to] of subs) {
  if (!h.includes(from)) { console.error('❌ build 找不到錨點：' + from); process.exit(1); }
  h = h.replace(from, () => to);
}
fs.writeFileSync(path.join(__dirname, 'index.html'), h);
console.log('✅ built index.html (' + h.length + ' bytes)');
