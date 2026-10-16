// はじまりの市 — ヘッドレス・シミュレーター
// ブラウザなしで src/game.js を動かし、村の経済がどう育つかを数値で確かめる。
// 使い方: node tools/simulate.mjs [村の数=4] [日数=120] [--seed-region=plain]
//   プレイヤーは「おまかせ」(村人と同じ考え方)で動き、出来事カードは積極的な選択肢を選ぶ。
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const code = fs.readFileSync(path.join(here, '..', 'src', 'game.js'), 'utf8');

// DOM の最小スタブ(描画処理が落ちない程度)
const el = () => ({ innerHTML: '', textContent: '', value: '', options: [], dataset: {}, disabled: false, hidden: false,
  setAttribute() {}, parentElement: { clientWidth: 0, clientHeight: 0 }, getContext() { return null; } });
const els = {};
const ctx = {
  console, Math, JSON, Date, setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
  document: { getElementById: id => els[id] || (els[id] = el()), addEventListener() {}, documentElement: {} },
  window: { __HAJIMARI_HEADLESS__: true, addEventListener() {}, matchMedia: () => ({ addEventListener() {} }), devicePixelRatio: 1 },
  localStorage: { getItem: () => null, setItem() {} },
  getComputedStyle: () => ({ getPropertyValue: () => '' }),
};
vm.createContext(ctx);
vm.runInContext(code, ctx, { filename: 'game.js' });

const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const RUNS = +args[0] || 4, DAYS = +args[1] || 120;
const regionArg = (process.argv.find(a => a.startsWith('--seed-region=')) || '').split('=')[1];

ctx.__RUNS = RUNS; ctx.__DAYS = DAYS; ctx.__REGION = regionArg || null;
vm.runInContext(`
for (let k = 0; k < __RUNS; k++) {
  const t0 = Date.now();
  freshWorld();
  chooseRegion(__REGION || ['plain','river','coast','forest'][k % 4]);
  autoTimer = 1; // プレイヤーもおまかせで動かす
  for (let d = 0; d < __DAYS; d++) {
    if (player().health <= 0) player().health = 100;
    if (S.card) { const o = S.card.opts.find(o => !o.plain && !o.dis) || S.card.opts[0]; resolveCard(o.id); }
    endDay();
  }
  const L = live();
  const avg = f => Math.round(L.reduce((s, a) => s + f(a), 0) / L.length);
  const m = moneyGood();
  console.log('== 村' + (k + 1) + ' (あなた: ' + REG[player().region].name + ') ' + __DAYS + '日 / ' + (Date.now() - t0) + 'ms');
  console.log('  人口 ' + L.length + '  平均体力 ' + avg(a => a.health) + '  畑 ' + L.reduce((s, a) => s + facCount(a, 'field'), 0)
    + '  道具 ' + L.reduce((s, a) => s + TOOLS.reduce((t, x) => t + cnt(a, x), 0), 0) + '  型 ' + Object.keys(S.designs).length);
  console.log('  お金の主役 ' + (m.g ? ITEMS[m.g].name + ' ' + Math.round(m.v * 100) + '%' : 'なし')
    + '  上位: ' + GOODS.slice().sort((x, y) => S.money[y] - S.money[x]).slice(0, 4).map(g => ITEMS[g].name + Math.round(S.money[g] * 100) + '%').join(' '));
  const use = {};
  L.forEach(a => TOOLS.forEach(t => { if (cnt(a, t) > 0) use[ITEMS[t].name] = (use[ITEMS[t].name] || 0) + cnt(a, t); }));
  console.log('  使われている道具 ' + Object.entries(use).sort((x, y) => y[1] - x[1]).map(([n, c]) => n + '×' + c).join(' '));
  console.log('  物価(穀物=1) ' + ['fish','salt','wood','pot','copper','pearl','gold'].map(g => ITEMS[g].name + (S.prices[g] / S.prices.grain).toFixed(1)).join(' '));
  for (const a of L) for (const t of TOOLS) if (cnt(a, t) !== ((a.durs[t] || []).length)) console.log('  !! 耐久の数が合わない: ' + a.name + ' ' + t);
}
`, ctx);
