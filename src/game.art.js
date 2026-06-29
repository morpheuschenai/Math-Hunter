const svgEyes = (x1, x2, y, r = 6) => `
  <circle cx="${x1}" cy="${y}" r="${r}" fill="#fff"/><circle cx="${x2}" cy="${y}" r="${r}" fill="#fff"/>
  <circle cx="${x1 + 1}" cy="${y + 1}" r="${r * .55}" fill="#2b2440"/><circle cx="${x2 + 1}" cy="${y + 1}" r="${r * .55}" fill="#2b2440"/>
  <circle cx="${x1 - 1}" cy="${y - 1.5}" r="${r * .22}" fill="#fff"/><circle cx="${x2 - 1}" cy="${y - 1.5}" r="${r * .22}" fill="#fff"/>`;
const svgSmile = (x, y, w) => `<path d="M${x - w} ${y} q${w} ${w * .9} ${w * 2} 0" stroke="#2b2440" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
const svgBlush = (x1, x2, y) => `<circle cx="${x1}" cy="${y}" r="4" fill="#ff8da3" opacity=".55"/><circle cx="${x2}" cy="${y}" r="4" fill="#ff8da3" opacity=".55"/>`;

const CHAR_SVG = {
  kiki: `<ellipse cx="50" cy="60" rx="29" ry="25" fill="#ff9b3d"/>
    <path d="M50 36 q-3 -13 11 -17" stroke="#e07b1a" stroke-width="5" fill="none" stroke-linecap="round"/>
    <circle cx="61" cy="19" r="5" fill="#ffd84d"/>
    <circle cx="50" cy="56" r="10" fill="#fff"/><circle cx="51" cy="57" r="5.5" fill="#2b2440"/>
    <circle cx="48.5" cy="54.5" r="1.6" fill="#fff"/>
    ${svgSmile(50, 70, 8)}${svgBlush(33, 67, 66)}`,
  oo: `<circle cx="39" cy="62" r="21" fill="#5b8def"/><circle cx="61" cy="62" r="21" fill="#5b8def"/>
    <path d="M38 42 v-9 m24 9 v-9" stroke="#3a6cd4" stroke-width="4.5" stroke-linecap="round"/>
    <circle cx="38" cy="31" r="4" fill="#9ecbff"/><circle cx="62" cy="31" r="4" fill="#9ecbff"/>
    ${svgEyes(39, 61, 58, 6)}${svgSmile(50, 70, 7)}${svgBlush(26, 74, 67)}`,
  prima: `<path d="M50 12 L60 40 L90 42 L66 60 L74 90 L50 72 L26 90 L34 60 L10 42 L40 40 Z" fill="#9b5de5"/>
    ${svgEyes(43, 58, 52, 5.5)}${svgSmile(50, 62, 6)}${svgBlush(33, 67, 58)}
    <circle cx="78" cy="22" r="3" fill="#e3c9ff"/><circle cx="20" cy="28" r="2.2" fill="#e3c9ff"/>`,
  swapy: `<circle cx="50" cy="40" r="16" fill="#29c4cf"/><circle cx="50" cy="70" r="20" fill="#1fa3ad"/>
    <path d="M24 52 l6 -6 v12 Z M76 60 l-6 6 v-12 Z" fill="#bff5f9"/>
    ${svgEyes(44, 56, 38, 5)}${svgSmile(50, 46, 5)}
    <circle cx="44" cy="70" r="3.5" fill="#fff" opacity=".7"/><circle cx="57" cy="74" r="2.5" fill="#fff" opacity=".5"/>`,
  starle: `<circle cx="50" cy="26" r="9" fill="none" stroke="#ffd84d" stroke-width="3"/>
    <path d="M50 34 L58 52 L78 54 L62 66 L68 86 L50 74 L32 86 L38 66 L22 54 L42 52 Z" fill="#ff7ab8"/>
    ${svgEyes(44, 57, 58, 5)}${svgSmile(50, 67, 5)}${svgBlush(36, 65, 63)}`,
  guardy: `<ellipse cx="50" cy="58" rx="27" ry="26" fill="#2ec4b6"/>
    <path d="M50 50 l13 5 v10 q0 11 -13 15 q-13 -4 -13 -15 v-10 Z" fill="#bff0ec" stroke="#15897d" stroke-width="2"/>
    <path d="M50 56 v17 M43 63 h14" stroke="#15897d" stroke-width="2.4" stroke-linecap="round"/>
    ${svgEyes(40, 60, 44, 5.5)}${svgSmile(50, 49, 5)}`,
  dubdragon: `<path d="M30 30 l7 12 M70 30 l-7 12" stroke="#3f8f46" stroke-width="6" stroke-linecap="round"/>
    <ellipse cx="50" cy="60" rx="27" ry="24" fill="#57b85e"/>
    <path d="M20 58 q-9 -3 -8 -13 q8 2 11 8 Z M80 58 q9 -3 8 -13 q-8 2 -11 8 Z" fill="#79d381"/>
    <path d="M73 76 q12 4 14 -6" stroke="#57b85e" stroke-width="6" fill="none" stroke-linecap="round"/>
    ${svgEyes(41, 60, 55, 6)}${svgSmile(50, 67, 6)}
    <text x="50" y="84" font-size="11" font-weight="800" fill="#2e6b34" text-anchor="middle">×2</text>`,
  munchdragon: `<ellipse cx="50" cy="58" rx="30" ry="27" fill="#a3d65c"/>
    <path d="M28 36 l5 9 M72 36 l-5 9" stroke="#7cab3a" stroke-width="5" stroke-linecap="round"/>
    ${svgEyes(40, 61, 48, 5.5)}
    <path d="M36 64 q14 14 28 0 q-3 12 -14 12 q-11 0 -14 -12 Z" fill="#5c3b52"/>
    <ellipse cx="50" cy="73" rx="7" ry="4" fill="#ff8da3"/>${svgBlush(28, 72, 58)}`,
  chaos: `<path d="M50 14 q22 -4 30 14 q14 8 6 26 q6 20 -12 26 q-8 16 -24 10 q-18 6 -24 -10 q-18 -8 -12 -26 q-8 -18 6 -26 q8 -18 30 -14 Z" fill="#3b2b52"/>
    <circle cx="40" cy="48" r="7" fill="#ff4d4d"/><circle cx="62" cy="48" r="7" fill="#ff4d4d"/>
    <circle cx="41" cy="49" r="3" fill="#7a0c0c"/><circle cx="63" cy="49" r="3" fill="#7a0c0c"/>
    <path d="M38 68 q12 -8 24 0" stroke="#ff4d4d" stroke-width="3" fill="none" stroke-linecap="round"/>
    <text x="26" y="34" font-size="13" fill="#b07ce8" font-weight="800">?</text>
    <text x="68" y="30" font-size="11" fill="#b07ce8" font-weight="800">?</text>
    <text x="74" y="74" font-size="12" fill="#b07ce8" font-weight="800">?</text>`,
};
const CROWN_SVG = `<path d="M28 22 L35 7 L44 16 L52 4 L60 16 L69 7 L76 22 q-24 9 -48 0 Z" fill="#ffd84d" stroke="#d9a521" stroke-width="2" stroke-linejoin="round"/><circle cx="52" cy="4" r="2.5" fill="#ff7ab8"/>`;
// 單張 PNG 角色(目前無);多表情圖角色用 SPRITE_OF 對應到 CHARACTER_ASSETS。
const ASSET_BASE = (() => {
  const p = (location && location.pathname ? location.pathname : '').replace(/\\/g, '/');
  return p.includes('/src/') ? '../assets' : 'assets';
})();
const assetPath = p => `${ASSET_BASE}/${p}`;
const HAS_PNG = {};
const SPRITE_OF = {
  kiki: 'ch01',
  oo: 'ch02',
  prima: 'ch03',
  munchdragon: 'ch08',
  crystalAdd: 'ch14',
  crystalSub: 'ch15',
  crystalChaos: 'ch16',
};   // 數靈 → 多表情圖角色
function charSVG(id, crowned = false) {
  if (SPRITE_OF[id]) return charSprite(SPRITE_OF[id], 'idle', crowned);
  if (HAS_PNG[id]) {
    return `<span class="pngChar"><img src="${assetPath(`${id}.png`)}" alt="" draggable="false">${crowned ? '<span class="crown">👑</span>' : ''}</span>`;
  }
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${CHAR_SVG[id] || ''}${crowned ? CROWN_SVG : ''}</svg>`;
}
// 多表情圖片角色（ch01）。新增角色把資料夾與 expressions 加進這裡即可。
const CHAR_EXPR = ['idle', 'think', 'happy', 'attack', 'hurt', 'miss', 'surprise', 'enraged'];
function buildExpr(folder) {
  const o = {};
  CHAR_EXPR.forEach(e => { o[e] = assetPath(`characters/${folder}/${e}.png`); });
  return o;
}
const CHARACTER_ASSETS = {
  ch01: { name: '01 橘色單眼數靈', expressions: buildExpr('ch01') },
  ch02: { name: '02 藍色偶數數靈', expressions: buildExpr('ch02') },
  ch03: { name: '03 紫色星形質數靈', expressions: buildExpr('ch03') },
  ch08: { name: '08 綠色大胃龍', expressions: buildExpr('ch08') },
  ch14: { name: '14 樂晶獸', expressions: buildExpr('ch14'), avatar: assetPath('characters/ch14/avatar.png') },
  ch15: { name: '15 憂晶獸', expressions: buildExpr('ch15'), avatar: assetPath('characters/ch15/avatar.png') },
  ch16: { name: '16 裂晶獸', expressions: buildExpr('ch16'), avatar: assetPath('characters/ch16/avatar.png') },
};
function charSprite(id, expression = 'idle', crowned = false) {
  const asset = CHARACTER_ASSETS[id];
  if (!asset) return charSVG(id, crowned);
  const src = asset.expressions[expression] || asset.expressions.idle;
  return `<span class="spriteChar motion-${expression}"><img src="${src}" alt="" draggable="false">${crowned ? '<span class="crown">👑</span>' : ''}</span>`;
}
function charAvatar(id, crowned = false) {
  const spriteId = SPRITE_OF[id];
  const asset = spriteId ? CHARACTER_ASSETS[spriteId] : CHARACTER_ASSETS[id];
  if (!asset?.avatar) return charSVG(id, crowned);
  return `<span class="spriteChar avatarChar"><img src="${asset.avatar}" alt="" draggable="false">${crowned ? '<span class="crown">👑</span>' : ''}</span>`;
}
function eggSVG(attrColor) {
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="50" cy="58" rx="26" ry="33" fill="#fdf3e3" stroke="#e8d4b8" stroke-width="2"/>
    <circle cx="42" cy="46" r="5" fill="${attrColor}" opacity=".7"/>
    <circle cx="60" cy="62" r="7" fill="${attrColor}" opacity=".55"/>
    <circle cx="44" cy="74" r="4" fill="${attrColor}" opacity=".6"/></svg>`;
}
