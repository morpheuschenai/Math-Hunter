/* UI 守門:確保「圖片式 UI」不被退回「CSS 畫的」。
   規則:src/game.css 裡任何針對 .ui-* 元件的規則,不可用 gradient / box-shadow / 帶顏色的 border 當外觀
        (那是 chrome,必須來自 ui-kit 的九宮格素材)。違反 → 報錯,build 前擋下。
   另外:被 /* UI_ASSET_ONLY_BEGIN *​/ ... /* UI_ASSET_ONLY_END *​/ 包住的區段同樣禁止上述屬性。
   用法: node check_ui.cjs */
const fs = require('fs');
const path = require('path');
const css = fs.readFileSync(path.join(__dirname, 'src', 'game.css'), 'utf8');

const BANNED = [
  [/linear-gradient|radial-gradient/, 'gradient(漸層)'],
  [/box-shadow\s*:\s*(?!none)/, 'box-shadow'],
  [/\bborder\s*:\s*[^;]*#/, '帶色 border 描邊'],
  [/\bborder(-top|-right|-bottom|-left)?\s*:\s*\d.*\bsolid\b/, 'solid border 描邊'],
];
const problems = [];

function scanBlock(label, body, line) {
  for (const [re, name] of BANNED) {
    if (re.test(body)) problems.push(`${label}(約第 ${line} 行)使用了 ${name} — chrome 必須用 ui-kit 素材`);
  }
}

// 1) 掃所有 selector 含 .ui- 的規則
const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
let m;
while ((m = ruleRe.exec(css))) {
  const sel = m[1].trim();
  if (/\.ui-/.test(sel)) {
    const line = css.slice(0, m.index).split('\n').length;
    scanBlock(`選擇器 "${sel.slice(0, 48)}"`, m[2], line);
  }
}

// 2) 掃 UI_ASSET_ONLY 標記區段
const zoneRe = /UI_ASSET_ONLY_BEGIN([\s\S]*?)UI_ASSET_ONLY_END/g;
while ((m = zoneRe.exec(css))) {
  const line = css.slice(0, m.index).split('\n').length;
  scanBlock('UI_ASSET_ONLY 區段', m[1], line);
}

if (problems.length) {
  console.log('❌ UI 守門失敗:chrome 被用 CSS 畫,請改用 ui-kit 九宮格素材');
  problems.forEach(p => console.log('   - ' + p));
  process.exit(1);
}
console.log('✅ UI 守門通過:.ui-* 元件外觀皆來自圖片素材,無 CSS 畫 chrome');
