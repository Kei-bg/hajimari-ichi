// はじまりの市 — 文字で遊ぶための入り口(AI のテストプレイ用)
// ブラウザ版と同じ描画結果を文字にして見せ、ボタンは番号で押す。状態はファイルに保存して続きから遊べる。
//
// 使い方: node tools/play.mjs <保存ファイル> <コマンド>
//   new [種]            新しい村を始める(種を決めると同じ展開になる)
//   look                画面全体を見る
//   press <番号> [回数]  ボタンを押す(例: press w3 / press w3 3)。回数を付けると同じボタンを続けて押す
//   trade <出す品> <量> <欲しい品>   市場で自分から持ちかける(例: trade 木の実 2 塩)
//   auto <日数>          おまかせで日を進める
// press・trade・auto のあとは、変わった欄だけを表示する。番号は欄ごとの記号+連番(w3 = 仕事の欄の3番目)。
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const code = fs.readFileSync(path.join(here, '..', 'src', 'game.js'), 'utf8');
const [file, cmd = 'look', ...args] = process.argv.slice(2);
if (!file) { console.log('使い方: node tools/play.mjs <保存ファイル> new|look|press|trade|auto ...'); process.exit(1); }

/* 種つきの乱数(保存して続きも同じ並びにする) */
let seed = 0;
const rng = () => { seed = (seed + 0x6D2B79F5) | 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const M = Object.create(Math); M.random = rng;

/* DOM の最小スタブ。クリック処理だけは拾っておき、ボタンを押すときに呼ぶ */
const el = () => ({ innerHTML: '', textContent: '', value: '', options: [], dataset: {}, disabled: false, hidden: false,
  setAttribute() {}, parentElement: { clientWidth: 0, clientHeight: 0, hidden: false }, getContext() { return null; } });
const els = {};
let onClick = null;
const ctx = {
  console, Math: M, JSON, Date, setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
  document: { getElementById: id => els[id] || (els[id] = el()), addEventListener(t, f) { if (t === 'click') onClick = f; }, documentElement: {} },
  window: { __HAJIMARI_HEADLESS__: true, addEventListener() {}, matchMedia: () => ({ addEventListener() {} }), devicePixelRatio: 1 },
  localStorage: { getItem: () => null, setItem() {} },
  getComputedStyle: () => ({ getPropertyValue: () => '' }),
};
vm.createContext(ctx);
vm.runInContext(code, ctx, { filename: 'game.js' });
const run = s => vm.runInContext(s, ctx);

let meta = { last: {} };
if (cmd === 'new') {
  seed = args[0] ? (parseInt(args[0], 10) || [...args[0]].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)) : (Date.now() | 0);
  const seed0 = seed;
  run('freshWorld();save();render()');
  fs.writeFileSync(file + '.history.txt', `新しい村(種 ${seed0})\n`);
} else {
  if (!fs.existsSync(file)) { console.log(`保存ファイル ${file} がない。まず new で始める。`); process.exit(1); }
  const saved = JSON.parse(fs.readFileSync(file, 'utf8'));
  seed = saved.seed; meta = saved.meta || meta;
  ctx.__json = JSON.stringify(saved.S); run("start({state:JSON.parse(__json)})");
}
run('toasts=[]');

/* ---------- 画面を文字にする ---------- */
const PANELS = [ // [記号, 見出し, 要素id, 隠れているかを見る要素id]
  ['t', '上の帯', 'status'], ['c', '今日の出来事', 'card'], ['k', '声かけ', 'calls'], ['y', 'あなたの暮らし', 'you'], ['l', 'あなたの土地', 'land'],
  ['w', '仕事', 'work'], ['j', '村の大事業', 'works'], ['b', '道具づくり', 'bench'], ['r', '珍品帳', 'rares'], ['a', 'あゆみ帳', 'ayumi'],
  ['m', '市場', 'market'], ['n', 'お金の芽', 'moneyP'], ['p', '物価', 'pricesP'], ['g', '年代記', 'logP'], ['v', '村人', 'villP'], ['o', '画面中央', 'over'],
];
const decode = s => s.replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const attr = (a, k) => { const m = a.match(new RegExp(`\\s${k}="([^"]*)"`)); return m ? m[1] : null; };
function toText(html, letter, buttons) {
  let tile = 0;
  html = html.replace(/\s*\n\s*/g, ' '); // ソースの改行は区切りにしない
  if (letter === null) html = html.replace(/<span class="gl(?: [^"]*)?"[^>]*>[^<]*<\/span>/g, ''); // ボタンの中の飾り文字は落とす
  html = html.replace(/<button([^>]*)>([\s\S]*?)<\/button>/g, (_, a, inner) => {
    const data = {}; for (const m of a.matchAll(/\sdata-([a-z]+)="([^"]*)"/g)) data[m[1]] = m[2];
    const id = attr(a, 'id'), dis = /\sdisabled(\s|$)/.test(a + ' '), pressed = attr(a, 'aria-pressed') === 'true';
    let label = attr(a, 'aria-label') || toText(inner, null, null).replace(/\s+/g, ' ').trim();
    if (/\bsel\b/.test(attr(a, 'class') || '')) label += '(選択中)';
    if (pressed) label += '✓';
    /* 番号はボタンの働き(id と data-*)ごとに一度だけ振り、保存して使い回す。ほかのボタンが消えても番号がずれない */
    const sig = letter + '|' + (id || '') + '|' + JSON.stringify(data) + (id || Object.keys(data).length ? '' : '|' + label);
    meta.ids = meta.ids || {}; meta.next = meta.next || {};
    const no = meta.ids[sig] || (meta.ids[sig] = letter + (meta.next[letter] = (meta.next[letter] || 0) + 1));
    buttons.push({ no, sig, id, data, dis, label });
    const tail = data.tile != null && (++tile) % 6 === 0 ? '\n' : ' ';
    return `${dis ? '[--]' : '[' + no + ']'}${label}${tail}`;
  });
  html = html.replace(/<span class="gl(?: [^"]*)?" title="([^"]*)">[^<]*<\/span>/g, (m, t, off, s) => {
    const next = s.slice(off + m.length).replace(/<[^>]+>/g, '').trimStart();
    return next.startsWith(t) ? '' : t + ' ';
  }).replace(/<span class="gl(?: [^"]*)?">[^<]*<\/span>/g, '');
  html = html.replace(/<td><span class="bar[^"]*"><i style="width:(\d+)%"><\/i><\/span>/g, '<td>$1'); // 村人の体力のバーは数字で
  html = html.replace(/<(b|small|em|strong|span)[^>]*>|<\/(span|b|small|em|strong)>/g, ' ');
  html = html.replace(/<i class="on"><\/i>/g, '●').replace(/<i class=""><\/i>/g, '○').replace(/<i class="x"><\/i>/g, '×');
  html = html.replace(/<h2[^>]*>/g, '\n■ ').replace(/<h3[^>]*>/g, '\n◆ ').replace(/<h4[^>]*>/g, '\n◇ ')
    .replace(/<\/(div|p|h2|h3|h4|li|tr|section)>/g, '\n').replace(/<br\s*\/?>/g, '\n').replace(/<\/t[dh]>/g, ' | ');
  return decode(html.replace(/<[^>]+>/g, '')).split('\n').map(l => l.replace(/[ \t]+/g, ' ').trim()).filter(Boolean).join('\n');
}
function screen() {
  const buttons = [], out = {};
  const h = id => els[id] ? els[id].innerHTML : '';
  const vis = id => !els[id] || !els[id].hidden;
  for (const [letter, title, id] of PANELS) {
    let html;
    if (id === 'status') html = h('status') + `<div><button id="end"${els.end && els.end.disabled ? ' disabled' : ''}>日を終える</button> <button id="auto"${els.auto && els.auto.disabled ? ' disabled' : ''}>おまかせで進める(auto 日数 でも可)</button></div>`;
    else if (id === 'market') html = `<h2>市場</h2>${h('offers')}<h3>いま村で足りない物</h3><div>${h('demand')}</div><h3>自分から持ちかける</h3><div>trade 出す品 量 欲しい品 で相手を探す${els.pGo && els.pGo.disabled ? '(今はできない)' : ''}</div>${h('pMsg')}`;
    else if (id === 'moneyP') { if (!vis(id)) continue; html = `<h2>お金の芽</h2><p>${h('moneyLead')}</p>${h('money')}`; }
    else if (id === 'pricesP') { if (!vis(id)) continue; html = `<h2>物価</h2><p>${els.unitNote ? els.unitNote.textContent : ''}</p>${h('prices')}${els.chart && !els.chart.parentElement.hidden ? '<p>(物価の推移のグラフ)</p>' : ''}`; }
    else if (id === 'logP') { const items = h('log').match(/<li[\s\S]*?<\/li>/g) || []; html = `<h2>年代記</h2><ul>${items.slice(0, 10).join('')}</ul>${items.length > 10 ? '<p>(古い記録は省略)</p>' : ''}${h('resetBox')}`; }
    else if (id === 'villP') { if (!vis(id)) continue; html = `<h2>村人 ${els.popNote ? els.popNote.textContent : ''}</h2><table>${h('vt')}</table>`; }
    else { if (!vis(id) || !h(id)) continue; html = h(id); }
    out[letter] = { title, text: toText(html, letter, buttons) };
  }
  return { out, buttons };
}
function notices() { const t = run('toasts.map(t=>t.html)'); run('toasts=[]'); return t.map(x => '・' + toText(x, 'x', [])); }

/* ---------- 操作 ---------- */
const history = [];
function press(no, sc) {
  const b = sc.buttons.find(x => x.no === no);
  if (!b) return `${no} というボタンは今の画面にない。look で確かめる。`;
  if (b.dis) return `「${b.label}」は今は押せない。`;
  if (b.id === 'auto') return 'おまかせは auto 日数 で進める。';
  const d = { ...b.data };
  onClick({ target: { closest: () => ({ id: b.id, dataset: d }) } });
  history.push(`press ${no} 「${b.label}」`);
  return null;
}
const itemKey = name => run('ORDER').find(g => run(`ITEMS[${JSON.stringify(g)}].name`) === name);

let msg = [];
const before = screen();
if (cmd === 'press') {
  const no = args[0], times = Math.max(1, Math.min(10, parseInt(args[1] || '1', 10) || 1));
  const label = (before.buttons.find(x => x.no === no) || {}).label;
  for (let i = 0; i < times; i++) {
    const sc = i ? screen() : before;
    let target = no;
    if (i && !sc.buttons.some(x => x.no === no)) { msg.push(`${i}回押したところで「${label}」が見当たらなくなった。`); break; }
    const e = press(target, sc); if (e) { msg.push(i ? `${i}回押したところで止まった: ${e}` : e); break; }
  }
} else if (cmd === 'trade') {
  const [give, amt, want] = args, gk = itemKey(give), wk = itemKey(want);
  if (!gk || !wk || !amt) msg.push('trade 出す品 量 欲しい品 の形で書く(品名は画面の表記のまま。例: trade 木の実 2 塩)。');
  else { const E = ctx.document.getElementById; E("pGive").value = gk; E("pWant").value = wk; E("pAmt").value = String(amt); onClick({ target: { closest: () => ({ id: 'pGo', dataset: {} }) } }); history.push(`trade ${give} ${amt} ${want}`); }
} else if (cmd === 'auto') {
  const n = Math.max(1, Math.min(30, parseInt(args[0] || '1', 10) || 1));
  run(`autoTimer=1;for(let i=0;i<${n};i++){if(player().health<=0)break;endDay()}autoTimer=null;render()`);
  history.push(`auto ${n}日`);
} else if (cmd !== 'look' && cmd !== 'new') msg.push(`知らないコマンド: ${cmd}`);

/* ---------- 表示と保存 ---------- */
const after = screen(), nt = notices();
const full = cmd === 'look' || cmd === 'new';
const lines = [];
lines.push(`=== 第${run('S.day')}日 ===`);
if (msg.length) lines.push(...msg.map(m => '! ' + m));
if (nt.length) lines.push('お知らせ:', ...nt);
const changed = [], same = [];
for (const [letter, p] of Object.entries(after.out)) {
  if (full || letter === 't' || meta.last[letter] !== p.text) { lines.push('', `【${p.title}】`, p.text); changed.push(p.title); }
  else same.push(p.title);
}
if (!full && same.length) lines.push('', `(変わっていない欄: ${same.join('・')}。見直すときは look)`);
console.log(lines.join('\n'));

meta.last = Object.fromEntries(Object.entries(after.out).map(([k, p]) => [k, p.text]));
fs.writeFileSync(file, JSON.stringify({ seed, meta, S: run('S') }));
if (history.length) fs.appendFileSync(file + '.history.txt', history.map(h => `第${run('S.day')}日まで | ${h}`).join('\n') + '\n');
