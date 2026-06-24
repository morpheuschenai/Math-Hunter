const rnd = n => Math.floor(Math.random() * n);
const randDigit = (max = 9) => 1 + rnd(max);
// 0 = 減法珠；-2 = ×2 倍率珠（負值代表倍率珠，倍數 = -v）
const randCell = (minusRate, maxDigit = 9, mulRate = 0, divRate = 0) => {
  const r = Math.random();
  if (r < minusRate) return 0;
  if (r < minusRate + mulRate) return -2;                 // ×2 珠
  if (r < minusRate + mulRate + divRate) return Math.random() < .5 ? -102 : -103;  // ÷2 / ÷3 珠
  return randDigit(maxDigit);
};

function genBoardValues(minusRate = 0, maxDigit = 9, size = 6, mulRate = 0, divRate = 0) {
  return Array.from({length: size}, () => Array.from({length: size}, () => randCell(minusRate, maxDigit, mulRate, divRate)));
}

/* 珠值：>0 數字；0 減法珠；<0 倍率珠(×(-v))。
   opt: minLen, banned, needOdd(奇數盾), needRun(共鳴盾), maxLen */
function countSolutions(values, target, opt = {}) {
  const N = values.length;
  const maxLen = opt.maxLen ?? 7, cap = opt.cap ?? 60;
  const minLen = opt.minLen ?? 2, banned = opt.banned ?? 0;
  const needOdd = opt.needOdd ?? 0, needRun = opt.needRun ?? 0, exG = opt.exactGroups ?? 0;
  const divisor = opt.divisor ?? 0;   // 整除盾：湊出 divisor 的倍數（不看 target）
  let count = 0, best = 0, hasMinus = false, hasMul = false, hasDiv = false;
  for (const row of values) for (const v of row) { if (v === 0) hasMinus = true; if (v < 0 && v > -100) hasMul = true; if (v <= -100) hasDiv = true; }
  const MX = hasMul ? 18 : 9;
  const loose = divisor || hasDiv;    // 有除法或整除目標 → 總和不再單調，停用 sum 邊界剪枝
  const visited = Array.from({length: N}, () => Array(N).fill(false));

  function dfs(r, c, sum, digits, len, nextNeg, pMul, odd, lastVal, curRun, maxRun) {
    if (count >= cap) return;
    const okGroups = !exG || (digits === exG && maxRun === exG);
    const goalHit = divisor ? (sum > 0 && sum % divisor === 0) : (sum === target);
    if (!nextNeg && pMul === 1 && goalHit && digits >= minLen && odd >= needOdd && maxRun >= needRun && okGroups) {
      count++; if (digits > best) best = digits;
    }
    if (len >= maxLen) return;
    if (exG && digits >= exG) return;   // 不必再延長
    const left = maxLen - len;
    if (!loose) {
      if (sum - MX * left > target) return;
      if (sum + MX * left < target) return;
      if (!hasMinus && sum > target) return;
    }
    if (digits + left < minLen) return;
    if (odd + left < needOdd) return;
    if (maxRun < needRun && curRun + left < needRun) return;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= N || nc < 0 || nc >= N || visited[nr][nc]) continue;
      const v = values[nr][nc];
      if (v === 0) {                       // 減法珠
        if (nextNeg || pMul !== 1) continue;
        visited[nr][nc] = true;
        dfs(nr, nc, sum, digits, len + 1, true, 1, odd, 0, curRun, maxRun);
        visited[nr][nc] = false;
      } else if (v <= -100) {              // 除法珠（後置，須整除、須已有數字）
        const d = -v - 100;
        if (nextNeg || pMul !== 1 || digits === 0 || sum % d !== 0) continue;
        visited[nr][nc] = true;
        dfs(nr, nc, sum / d, digits, len + 1, false, 1, odd, 0, curRun, maxRun);
        visited[nr][nc] = false;
      } else if (v < 0) {                  // 倍率珠
        if (nextNeg || pMul !== 1) continue;
        visited[nr][nc] = true;
        dfs(nr, nc, sum, digits, len + 1, false, -v, odd, 0, curRun, maxRun);
        visited[nr][nc] = false;
      } else {                            // 數字珠
        if (v === banned) continue;
        const val = v * pMul, nrun = (v === lastVal) ? curRun + 1 : 1;
        visited[nr][nc] = true;
        dfs(nr, nc, sum + (nextNeg ? -val : val), digits + 1, len + 1, false, 1,
            odd + (v % 2), v, nrun, Math.max(maxRun, nrun));
        visited[nr][nc] = false;
      }
    }
  }

  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const v = values[r][c];
    if (v <= 0 || v === banned) continue;
    visited[r][c] = true;
    dfs(r, c, v, 1, 1, false, 1, v % 2, v, 1, 1);
    visited[r][c] = false;
  }
  return { count, maxChain: best };
}

/* 找一條解路徑（提示用，回傳最先找到的，偏好短鏈） */
function findSolutionPath(values, target, opt = {}) {
  const N = values.length;
  const maxLen = opt.maxLen ?? 7, minLen = opt.minLen ?? 2, banned = opt.banned ?? 0;
  const needOdd = opt.needOdd ?? 0, needRun = opt.needRun ?? 0, exG = opt.exactGroups ?? 0;
  const divisor = opt.divisor ?? 0;
  let hasMinus = false, hasMul = false, hasDiv = false;
  for (const row of values) for (const v of row) { if (v === 0) hasMinus = true; if (v < 0 && v > -100) hasMul = true; if (v <= -100) hasDiv = true; }
  const MX = hasMul ? 18 : 9;
  const loose = divisor || hasDiv;
  const visited = Array.from({length: N}, () => Array(N).fill(false));
  let found = null;

  function dfs(r, c, sum, digits, len, nextNeg, pMul, odd, lastVal, curRun, maxRun, trail) {
    if (found) return;
    const okGroups = !exG || (digits === exG && maxRun === exG);
    const goalHit = divisor ? (sum > 0 && sum % divisor === 0) : (sum === target);
    if (!nextNeg && pMul === 1 && goalHit && digits >= minLen && odd >= needOdd && maxRun >= needRun && okGroups) { found = [...trail]; return; }
    if (len >= maxLen) return;
    if (exG && digits >= exG) return;
    const left = maxLen - len;
    if (!loose) {
      if (sum - MX * left > target || sum + MX * left < target) return;
      if (!hasMinus && sum > target) return;
    }
    if (odd + left < needOdd) return;
    if (maxRun < needRun && curRun + left < needRun) return;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (found) return;
      if (!dr && !dc) continue;
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= N || nc < 0 || nc >= N || visited[nr][nc]) continue;
      const v = values[nr][nc];
      if (v === 0) {
        if (nextNeg || pMul !== 1) continue;
        visited[nr][nc] = true; trail.push({r:nr,c:nc});
        dfs(nr, nc, sum, digits, len + 1, true, 1, odd, 0, curRun, maxRun, trail);
        trail.pop(); visited[nr][nc] = false;
      } else if (v <= -100) {
        const d = -v - 100;
        if (nextNeg || pMul !== 1 || digits === 0 || sum % d !== 0) continue;
        visited[nr][nc] = true; trail.push({r:nr,c:nc});
        dfs(nr, nc, sum / d, digits, len + 1, false, 1, odd, 0, curRun, maxRun, trail);
        trail.pop(); visited[nr][nc] = false;
      } else if (v < 0) {
        if (nextNeg || pMul !== 1) continue;
        visited[nr][nc] = true; trail.push({r:nr,c:nc});
        dfs(nr, nc, sum, digits, len + 1, false, -v, odd, 0, curRun, maxRun, trail);
        trail.pop(); visited[nr][nc] = false;
      } else {
        if (v === banned) continue;
        const val = v * pMul, nrun = (v === lastVal) ? curRun + 1 : 1;
        visited[nr][nc] = true; trail.push({r:nr,c:nc});
        dfs(nr, nc, sum + (nextNeg ? -val : val), digits + 1, len + 1, false, 1,
            odd + (v % 2), v, nrun, Math.max(maxRun, nrun), trail);
        trail.pop(); visited[nr][nc] = false;
      }
    }
  }

  for (let L = Math.max(2, minLen); L <= maxLen && !found; L++) {
    for (let r = 0; r < N && !found; r++) for (let c = 0; c < N && !found; c++) {
      const v = values[r][c];
      if (v <= 0 || v === banned) continue;
      visited[r][c] = true;
      dfs(r, c, v, 1, 1, false, 1, v % 2, v, 1, 1, [{r,c}]);
      visited[r][c] = false;
    }
    if (found && found.length > L) found = null; // 偏好短解：逐步放寬
    if (found) break;
  }
  return found;
}

function pickTarget(values, lo, hi, opt = {}, minSol = 4) {
  const ok = [];
  for (let t = lo; t <= hi; t++) {
    if (countSolutions(values, t, { ...opt, cap: minSol }).count >= minSol) ok.push(t);
  }
  return ok.length ? ok[rnd(ok.length)] : -1;
}
