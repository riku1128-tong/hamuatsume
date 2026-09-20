/* はむあつめ — ドット絵描画（ハムスター 6ポーズ × 2フレーム × カラー、グッズ、おへや背景）
   すべてピクセルグリッド → インライン SVG <path>（shape-rendering: crispEdges）で描く。画像ファイルは使わない。
   おへやでは 1 グリッド = PX(5) 画面px。ハムスター 24×24、グッズ 44×36、えさ皿 24×14、背景 256×128 で密度をそろえる。 */
(function (global) {
  'use strict';

  const PX = 5;
  const HAM_W = 24, ITEM_W = 44, ITEM_H = 36, BOWL_W = 24, BOWL_H = 14;

  // =====================================================================
  // ピクセルキャンバス
  // =====================================================================
  class Px {
    constructor(w, h) { this.w = w; this.h = h; this.g = new Array(w * h).fill(null); }
    get(x, y) { return (x < 0 || y < 0 || x >= this.w || y >= this.h) ? null : this.g[y * this.w + x]; }
    set(x, y, c) { if (c && x >= 0 && y >= 0 && x < this.w && y < this.h) this.g[y * this.w + x] = c; }
    del(x, y) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.g[y * this.w + x] = null; }
    rect(x, y, w, h, c) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, c); }
    clear(x, y, w, h) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.del(i, j); }
    ellipse(cx, cy, rx, ry, c) {
      for (let j = Math.floor(cy - ry - 1); j <= Math.ceil(cy + ry + 1); j++) {
        for (let i = Math.floor(cx - rx - 1); i <= Math.ceil(cx + rx + 1); i++) {
          const dx = (i + 0.5 - cx) / (rx + 0.5), dy = (j + 0.5 - cy) / (ry + 0.5);
          if (dx * dx + dy * dy <= 1) this.set(i, j, c);
        }
      }
    }
    line(x0, y0, x1, y1, c, t) {
      t = t || 1;
      let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, err = dx + dy;
      for (;;) {
        if (t <= 1) this.set(x0, y0, c); else this.rect(x0 - Math.floor(t / 2), y0 - Math.floor(t / 2), t, t, c);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
      }
    }
    // 三角形（屋根など）: cx 中心列, top 上端行, halfW 底辺の半幅, h 高さ
    tri(cx, top, halfW, h, c) {
      for (let j = 0; j < h; j++) { const w = Math.round(halfW * j / Math.max(1, h - 1)); this.rect(cx - w, top + j, 2 * w + 1, 1, c); }
    }
    // 塗られた領域のまわり（4近傍）を輪郭色で囲む
    outline(c) {
      const add = [];
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
        if (this.get(x, y)) continue;
        if (this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1)) add.push(x, y);
      }
      for (let i = 0; i < add.length; i += 2) this.set(add[i], add[i + 1], c);
    }
    blit(src, x0, y0) { for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) this.set(x0 + x, y0 + y, src.get(x, y)); }
    // 色ごとに 1 本の <path> にまとめる（横方向の連続ピクセルを 1 矩形に）
    paths() {
      const d = {};
      for (let y = 0; y < this.h; y++) {
        let x = 0;
        while (x < this.w) {
          const c = this.get(x, y);
          if (!c) { x++; continue; }
          let n = 1; while (x + n < this.w && this.get(x + n, y) === c) n++;
          (d[c] = d[c] || []).push(`M${x} ${y}h${n}v1h-${n}z`);
          x += n;
        }
      }
      return Object.keys(d).map((c) => `<path fill="${c}" d="${d[c].join('')}"/>`).join('');
    }
  }

  // 文字列スプライト → Px。pal: 文字 → 色（null/undefined なら透明）
  function sprite(rows, pal) {
    const p = new Px(rows[0].length, rows.length);
    rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const c = pal[r[x]]; if (c) p.set(x, y, c); } });
    return p;
  }
  // 左半分（12列）を書いて右へ鏡映（左右対称ポーズ用）
  const M = (rows) => rows.map((r) => r + r.split('').reverse().join(''));
  // 2フレーム目: 1フレーム目の一部の行だけ差し替える
  const F2 = (rows, over) => rows.map((r, i) => (over[i] !== undefined ? over[i] : r));

  // 色を暗くする（影用）
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => Math.max(0, Math.round(v * (1 - k))).toString(16).padStart(2, '0');
    return '#' + f(n >> 16) + f((n >> 8) & 255) + f(n & 255);
  }

  // =====================================================================
  // ハムスター（24×24 グリッド、右向き基準、各ポーズ 2 フレーム）
  //   L 輪郭  B 体  D 体の影  W おなか  E 耳のうち  S 背中の線  P ぶち  C ほっぺ(ピンク)
  //   R まゆ(ロボ)  F 顔(白)  Y 目  N 鼻  T しっぽ(長)  t しっぽ(短)  n たね  z zzz
  // =====================================================================
  const DEF = { body: '#e0a565', belly: '#fff5e6', ear: '#f3c1b0', stripe: 'none', brow: 'none', eye: '#2b2320', nose: '#e08a8a', line: '#4a3324', spots: 'none', face: 'none', cheek: '#f2a9a0' };
  const SIL = { body: '#cdc3b5', belly: '#cdc3b5', ear: '#cdc3b5', stripe: 'none', brow: 'none', eye: '#cdc3b5', nose: '#cdc3b5', line: '#b5a994', spots: 'none', face: 'none', cheek: 'none' };

  const FRONT = M([
    '............',
    '...LLL......',
    '..LEEEL.....',
    '..LEEEEL....',
    '..LBEEBBLLLL',
    '.LBBBBBBBBBS',
    '.LBBBBBBBBBS',
    'LBBBBBBBBBBB',
    'LBBBRRBBBBBB',
    'LBBBRYYBBBBB',
    'LBCCBYYBFFFF',
    'LBCCBBBFFFFN',
    'LBBBBBBFFLFL',
    '.LBBBBBBFFLF',
    '.LBBBBBBBFFF',
    '.LPPBBBWWWWW',
    '.LPPBBBWWWWW',
    '.LBBBBBWWWWW',
    '..LDBBBWWWWW',
    '..LDDBBBWWWW',
    '...LLDDBWWWW',
    '....LLLLLLLL',
    '....LWWWL...',
    '.....LLL....',
  ]);
  const BACK = M([
    '............',
    '...LLL......',
    '..LBBBL.....',
    '..LBBBBL....',
    '..LBBBBBLLLL',
    '.LBBBBBBBBBS',
    '.LBBBBBBBBBS',
    'LBBBBBBBBBBS',
    'LBBBBBBBBBBS',
    'LBBBBBBBBBBS',
    'LBPPBBBBBBBS',
    'LBPPBBBBBBBS',
    'LBBBBBBBBBBS',
    'LBBBBBBBBBBS',
    '.LBBBBBBBBBS',
    '.LBBBBBBBBBS',
    '.LBBBBBBBBBS',
    '.LBBBBBBBBBB',
    '..LDBBBBBBBB',
    '..LDDBBBBBBB',
    '...LLDDBBBBB',
    '....LLLLLLLL',
    '....LWWWL..t',
    '.....LLL...T',
  ]);
  const EAT = M([
    '............',
    '...LLL......',
    '..LEEEL.....',
    '..LEEEEL....',
    '..LBEEBBLLLL',
    '.LBBBBBBBBBS',
    '.LBBBBBBBBBS',
    'LBBBBBBBBBBB',
    'LBBBRRBBBBBB',
    'LBBBRYYBBBBB',
    'LBCCBYYBFFFF',
    'LBCCBBBFFFFN',
    'LBBBBBBFFLnn',
    '.LBBBBBLBBnn',
    '.LBBBBBLBBBn',
    '.LPPBBBWWWWW',
    '.LPPBBBWWWWW',
    '.LBBBBBWWWWW',
    '..LDBBBWWWWW',
    '..LDDBBBWWWW',
    '...LLDDBWWWW',
    '....LLLLLLLL',
    '....LWWWL...',
    '.....LLL....',
  ]);
  const SIDE = [
    '........................',
    '........................',
    '........................',
    '..............LLL.......',
    '.............LEEEL......',
    '.......LLLLLLLEEEL......',
    '.....LLBBSSSSSBBBLL.....',
    '....LBBBBBBBBBBBBBBL....',
    '...LBBBBBBBBBBBBBBBBL...',
    '..LBBBBBBBBBBBBRRBBBBL..',
    '..LBBBBBBBBBBBBRYYBFBBL.',
    '.LBBBBBBBBBBBBBBYYFFFBL.',
    '.LBPPBBBBBBBBBBBBCFFFFNL',
    '.LBPPBBBBBBBBBBBBCFFLFL.',
    '.LBBBBBBBBBBBBBBBBFFFL..',
    '.LBBBBBBBBBWWWWWWBBBBL..',
    'TLDBBBBBWWWWWWWWWWBBL...',
    'TLDDBBBWWWWWWWWWWWBDL...',
    'TTLDDDBWWWWWWWWWWDDL....',
    '.tLLLDDDDWWWWWWDDDL.....',
    '...LLLLLLLLLLLLLLLL.....',
    '......LWWWL...LWWWL.....',
    '.......LLL.....LLL......',
    '........................',
  ];
  const SLEEP = [
    '........................',
    '.................zzz....',
    '...................z....',
    '..................z.....',
    '.....LLL.........zzz....',
    '....LEEEL.LLLLLL........',
    '...LBEEEBLBBBSSBLL......',
    '..LBBBBBBBBBBBSSBBLL....',
    '.LBBBBBBBBBBBBBBBBBBL...',
    '.LBBRRBBBBBBBBBBBPPBBL..',
    'LBBBLLLBBBBBBBBBBPPBBBL.',
    'LBCCFFFBBBBBBBBBBBBBBBBL',
    'LNFFFFBBBBBBBBBBBBBBBBBL',
    'LBBBBBBBWWWWWWWWWBBBBBBL',
    '.LDBBBBWWWWWWWWWWWBBBBL.',
    '.LDDBBBWWWWWWWWWWWWBDDL.',
    '..LDDDBBWWWWWWWWWWDDDLt.',
    '...LLLDDDDWWWWWWDDDLLTT.',
    '......LLLLLLLLLLLLL..T..',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ];
  const BELLY = [
    '........................',
    '........................',
    '........................',
    '........................',
    '.....LLL................',
    '....LEEEL....LL....LL...',
    '....LEEEL...LWWL..LWWL..',
    '...LLBEBLLLLLBBLLLLBBLL.',
    '..LBRRBBBBBBWWWWWWWWBBBL',
    '.LBBRYYBBBBWWWWWWWWWWBBL',
    '.LBBBYYBBBWWWWWWWWWWWWBL',
    'LNCCBBBBBBWWWWWWWWWWWWBL',
    'LBLCBBBBBBWWWWWWWWWWWBBL',
    '.LBBBBBBBBBWWWWWWWWWBBBL',
    '.LBPPBBBBBBBWWWWWWWBBBLt',
    '.LDPPBBBBBBBBBBBBBBBDDLT',
    '..LDDDBBBBBBBBBBBBBDDLLT',
    '...LLLDDDDDDDDDDDDLLL.T.',
    '......LLLLLLLLLLLL......',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ];

  // 2フレーム目（差分行）と再生のしかた: alt = 交互に 50/50、blink = ほとんど 1 枚目でたまに 2 枚目
  const POSES = {
    front: { f: [FRONT, F2(FRONT, { 9: M(['LBBBRLLBBBBB'])[0], 10: M(['LBCCBBBBFFFF'])[0] })], anim: 'blink', dur: '3.4s' },
    back:  { f: [BACK, F2(BACK, { 1: M(['..LLL.......'])[0], 2: M(['.LBBBL......'])[0], 3: M(['.LBBBBL.....'])[0], 4: M(['..LBBBBBLLLL'])[0] })], anim: 'blink', dur: '2.8s' },
    eat:   { f: [EAT, F2(EAT, { 12: M(['LBBBBBBFFLFL'])[0], 13: M(['.LBBBBBLBBBn'])[0], 14: M(['.LBBBBBLBBnn'])[0] })], anim: 'alt', dur: '.5s' },
    side:  { f: [SIDE, F2(SIDE, { 21: '.......LWWWL.LWWWL......', 22: '........LLL...LLL.......' })], anim: 'alt', dur: '.5s' },
    sleep: { f: [SLEEP, F2(SLEEP, { 0: '.................zzz....', 1: '...................z....', 2: '..................z.....', 3: '.................zzz....', 4: '.....LLL................' })], anim: 'alt', dur: '1.6s' },
    belly: { f: [BELLY, F2(BELLY, { 5: '....LEEEL.....LL....LL..', 6: '....LEEEL....LWWL..LWWL.' })], anim: 'alt', dur: '.9s' },
  };

  // アクセサリーの置き場所（ポーズごと）: head=頭のてっぺん, brow=おでこ, chin=あご
  const HEAD = {
    front: { head: [12, 4], brow: [12, 8], chin: [12, 14] },
    side:  { head: [10, 5], brow: [17, 9], chin: [20, 14] },
    back:  { head: [12, 4], brow: [12, 7], chin: null },
    sleep: { head: [12, 5], brow: [5, 9],  chin: [3, 13] },
    eat:   { head: [12, 4], brow: [12, 8], chin: [12, 15] },
    belly: { head: [6, 7],  brow: [4, 8],  chin: [2, 13] },
  };
  const ACC_PAL = { y: '#f2c14e', Y: '#d9a012', r: '#c9302c', W: '#ffffff', b: '#7fb0c9', L: '#4a3324' };
  // parts: at=置き場所, rows=スプライト, dy=上下ずらし（head/brow は下端を基準、chin は上端を基準）
  const ACC = {
    crown:    [{ at: 'head', rows: ['y.y.y', 'yyyyy', 'YyyyY'] }],
    halo:     [{ at: 'head', dy: -1, rows: ['.yyyyy.', 'y.....y', '.yyyyy.'] }],
    headband: [{ at: 'brow', rows: ['rrrrrrrrrrr', '..........r', '.........r.'] }],
    towel:    [{ at: 'head', rows: ['.WWWWWWW.', 'WWbWWWbWW'] }],
    bucket:   [{ at: 'head', rows: ['.rrrrr.', 'rrrrrrr', 'rrrrrrr'] }],
    beard:    [{ at: 'head', rows: ['..y..', '.yyy.', 'yyyyy'] }, { at: 'chin', rows: ['WWWWWWW', '.WWWWW.', '..WWW..', '...W...'] }],
  };

  function hamsterPalette(c, tail) {
    const nz = (v, fb) => (v && v !== 'none') ? v : fb;
    return {
      L: c.line, B: c.body, D: shade(c.body, 0.18), W: c.belly, E: c.ear,
      S: nz(c.stripe, c.body), P: nz(c.spots, c.body), R: nz(c.brow, c.body), F: nz(c.face, c.body), C: nz(c.cheek, c.body),
      Y: c.eye, N: c.nose, T: tail ? c.body : null, t: c.belly, n: '#6b4a2a', z: c.line,
    };
  }

  /**
   * ハムスターのSVG文字列を返す
   * @param {object} opts { colors, pose, flip, size, silhouette, accessory, tail, className, anim }
   *   anim: true でポーズごとの 2 フレームアニメ（CSS で切り替え）
   */
  function hamster(opts) {
    const pose = POSES[opts.pose] ? opts.pose : 'front';
    const P = POSES[pose];
    const c = Object.assign({}, DEF, opts.silhouette ? SIL : (opts.colors || {}));
    if (opts.silhouette) { c.stripe = 'none'; c.brow = 'none'; c.spots = 'none'; c.face = 'none'; c.cheek = 'none'; }
    const pal = hamsterPalette(c, !!opts.tail);
    if (opts.silhouette) { pal.n = SIL.body; pal.z = SIL.line; }
    const frames = (opts.anim ? P.f : [P.f[0]]).map((rows) => {
      const px = sprite(rows, pal);
      if (opts.accessory && ACC[opts.accessory] && !opts.silhouette) {
        ACC[opts.accessory].forEach((part) => {
          const at = HEAD[pose][part.at]; if (!at) return;
          const sp = sprite(part.rows, ACC_PAL);
          const x0 = at[0] - Math.floor(sp.w / 2);
          const y0 = part.at === 'chin' ? at[1] + (part.dy || 0) : at[1] - sp.h + 1 + (part.dy || 0);
          px.blit(sp, x0, y0);
        });
      }
      return px.paths();
    });
    const size = opts.size || 100;
    const flip = opts.flip ? ` transform="translate(${HAM_W} 0) scale(-1 1)"` : '';
    const cls = `${opts.className || 'hamu'}${opts.anim ? ` anim anim-${P.anim}` : ''}`;
    const inner = opts.anim ? `<g class="f1">${frames[0]}</g><g class="f2">${frames[1]}</g>` : frames[0];
    return `<svg viewBox="0 0 ${HAM_W} ${HAM_W}" width="${size}" height="${size}" class="${cls}" shape-rendering="crispEdges" style="overflow:visible${opts.anim ? `;--dur:${P.dur}` : ''}"><g${flip}>${inner}</g></svg>`;
  }

  // =====================================================================
  // グッズ（44×36 グリッド）・えさ皿（24×14 グリッド）
  // =====================================================================
  const K = {
    L: '#3d2a1e', wood: '#d9b483', woodD: '#a5804f', woodDD: '#7a5433', tan: '#c98a5a', rim: '#d9a35a',
    blue: '#7fb0c9', blueL: '#bfe3f2', blueLL: '#e9f3f7', green: '#8fbf62', greenD: '#5f8a3a', greenL: '#b6d788',
    yellow: '#f2c14e', yellowD: '#d9a012', red: '#c9302c', pink: '#f6c9d4', pinkD: '#dfa0b2', pinkL: '#fbe3ea',
    sand: '#f2e2c4', sandD: '#d9bf8c', hole: '#2b2320', seed: '#6b4a2a', white: '#ffffff', grey: '#b8b8b8',
    terra: '#e8825a', terraD: '#b34f2b', terraL: '#f6a785', orange: '#e0803f', card: '#d9b483', cardD: '#c9a06a',
    roof: '#d98b6a', roofD: '#a65b3d', wall: '#f0c58f', cream: '#f3e3c4', dark: '#4a3b2f', paper: '#e9dcc3', chest: '#c9764f',
  };
  const ITEM_DRAW = {
    wheel(p) {
      p.line(22, 17, 13, 34, K.blue, 3); p.line(22, 17, 31, 34, K.blue, 3); p.rect(10, 33, 24, 3, K.blue);
      p.ellipse(22, 17, 15, 15, K.blue); p.ellipse(22, 17, 12, 12, K.blueLL);
      p.rect(22, 5, 1, 25, K.blueL); p.rect(10, 17, 25, 1, K.blueL); p.line(13, 8, 31, 26, K.blueL); p.line(31, 8, 13, 26, K.blueL);
      p.ellipse(22, 17, 1.5, 1.5, K.blue);
    },
    house(p) {
      p.tri(22, 1, 20, 14, K.roof); p.rect(6, 14, 32, 21, K.wall); p.rect(2, 14, 41, 1, K.roofD);
      p.rect(8, 19, 4, 1, K.woodD); p.rect(8, 23, 3, 1, K.woodD); p.rect(33, 19, 4, 1, K.woodD);
      p.rect(11, 22, 22, 13, K.hole); p.ellipse(22, 22, 10.5, 6, K.hole);
    },
    tunnel(p) {
      p.ellipse(22, 26, 21, 18, K.green); p.clear(0, 27, 44, 9);
      p.rect(13, 12, 1, 15, K.greenD); p.rect(22, 8, 1, 19, K.greenD); p.rect(31, 12, 1, 15, K.greenD);
      p.ellipse(2, 20, 3, 7, K.hole); p.ellipse(41, 20, 3, 7, K.hole);
    },
    sand(p) {
      p.rect(2, 14, 40, 20, K.woodD); p.rect(2, 14, 40, 3, K.wood); p.rect(5, 18, 34, 13, K.sand);
      p.rect(10, 21, 3, 1, K.sandD); p.rect(28, 22, 3, 1, K.sandD); p.rect(19, 26, 3, 1, K.sandD); p.rect(33, 28, 2, 1, K.sandD); p.rect(8, 28, 2, 1, K.sandD);
    },
    box(p) {
      p.rect(7, 13, 30, 21, K.card); p.rect(4, 9, 36, 5, K.cardD); p.rect(7, 18, 30, 1, K.cardD); p.rect(22, 13, 1, 21, K.cardD);
      p.rect(12, 21, 8, 13, K.hole); p.ellipse(16, 21, 4, 4, K.hole);
    },
    chew(p) {
      p.line(8, 30, 34, 13, K.woodD, 6); p.line(8, 30, 34, 13, K.wood, 3);
      p.rect(16, 24, 2, 1, K.woodD); p.rect(22, 20, 2, 1, K.woodD); p.rect(28, 16, 2, 1, K.woodD);
      p.line(34, 13, 39, 7, K.greenD, 1); p.ellipse(39, 6, 4, 3, K.green); p.rect(37, 6, 5, 1, K.greenD);
    },
    bed(p) {
      p.ellipse(22, 27, 20, 6, K.pinkD); p.ellipse(22, 21, 20, 10, K.pink); p.ellipse(22, 19, 14, 6, K.pinkL);
    },
    hammock(p) {
      p.ellipse(22, 18, 17, 9, K.green); p.clear(0, 0, 44, 18); p.rect(8, 19, 28, 1, K.greenL);
      p.line(5, 10, 11, 18, K.woodD); p.line(39, 10, 33, 18, K.woodD);
      p.rect(4, 8, 3, 26, K.woodD); p.rect(37, 8, 3, 26, K.woodD); p.rect(3, 6, 5, 3, K.wood); p.rect(36, 6, 5, 3, K.wood);
    },
    cabbage(p) {
      p.rect(5, 22, 34, 12, K.tan); p.rect(4, 19, 36, 3, K.rim);
      p.ellipse(14, 14, 8, 6, K.greenD); p.ellipse(14, 14, 6, 4, K.green); p.ellipse(14, 13, 3, 2, K.greenL);
      p.ellipse(29, 12, 8, 7, K.greenD); p.ellipse(29, 12, 6, 5, K.green); p.ellipse(29, 11, 3, 2, K.greenL);
    },
    seesaw(p) {
      p.tri(22, 20, 6, 13, K.wood); p.line(4, 27, 40, 13, K.orange, 3); p.rect(21, 19, 3, 2, K.woodDD);
    },
    sunflower(p) {
      p.rect(14, 25, 16, 9, K.tan); p.rect(13, 22, 18, 3, K.rim);
      p.rect(21, 13, 2, 9, K.greenD); p.ellipse(16, 18, 4, 2, K.green); p.ellipse(28, 16, 4, 2, K.green);
      p.ellipse(22, 8, 9, 9, K.yellow); p.set(13, 8, K.yellowD); p.set(31, 8, K.yellowD); p.set(22, 17, K.yellowD);
      p.ellipse(22, 8, 4.5, 4.5, K.seed);
    },
    treasure(p) {
      p.ellipse(22, 16, 16, 7, K.chest); p.rect(6, 16, 32, 18, K.roofD); p.rect(6, 16, 32, 1, K.yellow);
      p.rect(19, 15, 6, 6, K.yellow); p.rect(21, 18, 2, 2, K.hole);
    },
    onsen(p) {
      p.rect(4, 14, 36, 20, K.wood); p.rect(13, 14, 1, 20, K.woodD); p.rect(22, 14, 1, 20, K.woodD); p.rect(31, 14, 1, 20, K.woodD);
      p.ellipse(22, 14, 18, 4, K.blue); p.ellipse(22, 14, 15, 3, K.blueL);
      [[12, 7], [12, 6], [13, 5], [13, 4], [22, 6], [22, 5], [23, 4], [23, 3], [32, 7], [32, 6], [33, 5], [33, 4]].forEach(([x, y]) => p.set(x, y, K.blueL));
    },
    ice(p) {
      p.rect(9, 11, 26, 23, K.blueL); p.rect(6, 17, 32, 17, K.blueL); p.rect(12, 14, 1, 9, K.white); p.rect(31, 14, 1, 9, K.white);
      p.rect(18, 20, 8, 1, K.blueLL); p.set(4, 7, K.blue); p.set(40, 7, K.blue);
    },
    castle(p) {
      p.rect(6, 16, 32, 18, K.cream); p.rect(3, 7, 9, 27, K.cream); p.rect(32, 7, 9, 27, K.cream);
      p.tri(7, 1, 5, 6, K.orange); p.tri(36, 1, 5, 6, K.orange);
      p.rect(13, 13, 4, 3, K.cream); p.rect(20, 13, 4, 3, K.cream); p.rect(27, 13, 4, 3, K.cream);
      p.rect(6, 13, 3, 3, K.woodDD); p.rect(35, 13, 3, 3, K.woodDD);
      p.rect(18, 24, 8, 10, K.hole); p.ellipse(22, 24, 4, 4, K.hole); p.rect(36, 0, 1, 1, K.woodDD); p.rect(37, 0, 3, 1, K.red);
    },
    dojo(p) {
      p.tri(22, 2, 21, 10, K.dark); p.rect(6, 12, 32, 22, K.paper);
      p.rect(6, 21, 32, 1, K.dark); p.rect(13, 12, 1, 22, K.dark); p.rect(22, 12, 1, 22, K.dark); p.rect(31, 12, 1, 22, K.dark);
      p.rect(18, 24, 8, 10, K.hole); p.ellipse(34, 17, 1.5, 1.5, K.red);
    },
    bowl(p) {
      p.ellipse(12, 9, 11, 4, K.terra); p.clear(0, 0, 24, 7);
      p.ellipse(12, 7, 11, 3, K.terraD); p.ellipse(12, 7, 9, 2, K.terraL);
    },
  };
  const FOOD_SPOTS = [[5, 7], [8, 6], [11, 7], [14, 6], [17, 7], [10, 8], [13, 8], [7, 8], [16, 8], [9, 6], [12, 6], [15, 7]];
  const FOOD_DRAW = {
    seed(p, x, y) { p.rect(x, y, 2, 1, K.seed); },
    goldseed(p, x, y) { p.rect(x, y, 2, 1, K.yellow); },
    pellet(p, x, y) { p.rect(x, y, 2, 1, '#9a7a4a'); },
    mix(p, x, y, i) { p.rect(x, y, 2, 1, [K.seed, '#e0b060', K.green, K.rim][i % 4]); },
    worm(p, x, y) { p.rect(x, y, 3, 1, '#e8c27a'); p.set(x + 1, y - 1, '#e8c27a'); },
    cheese(p, x, y) { p.rect(x, y - 1, 3, 2, K.yellow); p.set(x + 1, y, K.yellowD); },
  };

  const itemCache = {};
  function itemPx(id) {
    const isBowl = id === 'bowl';
    const p = new Px(isBowl ? BOWL_W : ITEM_W, isBowl ? BOWL_H : ITEM_H);
    if (ITEM_DRAW[id]) { ITEM_DRAW[id](p); p.outline(K.L); }
    return p;
  }
  function itemSvg(p, inner, w, h) {
    return `<svg viewBox="0 0 ${p.w} ${p.h}" width="${w}" height="${h}" class="item-art" shape-rendering="crispEdges" style="overflow:visible">${inner}</svg>`;
  }
  // w/h 省略時はおへや実寸（1 グリッド = PX px）
  function item(id, w, h, extra) {
    if (!itemCache[id]) itemCache[id] = itemPx(id);
    const p = itemCache[id];
    return itemSvg(p, p.paths() + (extra || ''), w || p.w * PX, h || p.h * PX);
  }
  function bowl(foodId, amount, w, h) {
    const p = itemPx('bowl');
    if (amount > 0) {
      const n = Math.max(1, Math.round(FOOD_SPOTS.length * Math.min(1, amount / 100)));
      const draw = FOOD_DRAW[foodId] || FOOD_DRAW.seed;
      for (let i = 0; i < n; i++) draw(p, FOOD_SPOTS[i][0], FOOD_SPOTS[i][1], i);
    }
    return itemSvg(p, p.paths(), w || p.w * PX, h || p.h * PX);
  }

  // =====================================================================
  // おへや背景（256×128 グリッド = 1280×640 の 1/5）
  // =====================================================================
  const G = { grass: '#8cb864', grassD: '#6f9a47', grassL: '#a3cc78', dirt: '#dcb98a', dirtD: '#c49a63', trunk: '#8a5a2a', leaf: '#5f8a3a', leafL: '#7fa65a', leafLL: '#9ccf6e', rock: '#b8b8b8', rockD: '#8a8a8a', flowerY: '#f2c14e', flowerP: '#f28cb0', flowerW: '#ffffff' };
  let roomCache = null;
  function room() {
    if (roomCache) return roomCache;
    const W = 256, H = 128;
    // 地面（土の小道）
    const ground = new Px(W, H);
    [[126, 102, 40, 15], [164, 98, 12, 7], [178, 91, 10, 6], [190, 82, 9, 6], [200, 72, 8, 5], [210, 62, 8, 5], [218, 51, 7, 5], [225, 40, 7, 5], [231, 29, 7, 5], [236, 16, 7, 8]]
      .forEach(([x, y, rx, ry]) => ground.ellipse(x, y, rx, ry, G.dirt));
    ground.outline(G.dirtD);
    [[112, 100], [130, 108], [140, 96], [120, 94], [166, 97], [207, 71]].forEach(([x, y]) => ground.set(x, y, G.dirtD));

    const ob = new Px(W, H);
    // 柵（まわりをぐるり。右上に門）
    const post = (x, y) => { ob.rect(x, y, 2, 7, K.woodD); ob.rect(x, y, 2, 1, K.wood); };
    const railH = (x, y, len) => { ob.rect(x, y + 2, len, 1, K.wood); ob.rect(x, y + 5, len, 1, K.wood); };
    const railV = (x, y, len) => { ob.rect(x + 1, y, 1, len, K.wood); ob.rect(x + 4, y, 1, len, K.wood); };
    railH(2, 2, 224); railH(246, 2, 8); for (let x = 2; x <= 224; x += 12) post(x, 2); post(246, 2); post(252, 2);
    railH(2, 119, 252); for (let x = 2; x <= 252; x += 12) post(x, 119);
    railV(2, 2, 124); railV(249, 2, 124);
    for (let y = 14; y <= 110; y += 12) { ob.rect(2, y, 7, 2, K.woodD); ob.rect(2, y, 7, 1, K.wood); ob.rect(249, y, 7, 2, K.woodD); ob.rect(249, y, 7, 1, K.wood); }
    // 門柱
    ob.rect(226, 0, 3, 10, K.woodD); ob.rect(226, 0, 3, 1, K.wood); ob.rect(244, 0, 3, 10, K.woodD); ob.rect(244, 0, 3, 1, K.wood);
    // 木
    const tree = (cx, base) => {
      ob.rect(cx - 1, base - 7, 3, 7, G.trunk); ob.ellipse(cx, base - 13, 9, 8, G.leaf);
      ob.ellipse(cx - 2, base - 15, 6, 5, G.leafL); ob.ellipse(cx - 3, base - 17, 3, 2, G.leafLL);
    };
    tree(22, 30); tree(46, 22); tree(150, 20); tree(212, 24); tree(250, 62); tree(176, 122);
    // 茂み
    const bush = (cx, cy) => { ob.ellipse(cx, cy, 6, 3, G.leaf); ob.ellipse(cx - 1, cy - 1, 4, 2, G.leafL); ob.set(cx - 2, cy - 2, G.leafLL); };
    bush(12, 110); bush(84, 12); bush(250, 100); bush(180, 30); bush(8, 72); bush(122, 12); bush(76, 116);
    // 岩
    const rock = (cx, cy) => { ob.ellipse(cx, cy, 2, 1, G.rock); ob.set(cx - 1, cy + 1, G.rockD); ob.set(cx, cy + 1, G.rockD); };
    rock(100, 22); rock(190, 112); rock(6, 60);
    ob.outline(K.L);
    // 花（輪郭なし）
    const flower = (x, y, c) => { ob.set(x, y, c); ob.set(x - 1, y + 1, G.grassD); ob.set(x + 1, y + 1, G.grassD); ob.set(x, y + 1, G.grassD); };
    [[62, 16, G.flowerY], [140, 8, G.flowerP], [172, 14, G.flowerW], [104, 30, G.flowerY], [9, 48, G.flowerP], [7, 78, G.flowerY], [11, 96, G.flowerW],
     [116, 62, G.flowerY], [80, 100, G.flowerP], [92, 112, G.flowerY], [160, 112, G.flowerW], [178, 96, G.flowerY], [184, 50, G.flowerP], [186, 72, G.flowerY],
     [236, 92, G.flowerP], [200, 18, G.flowerY], [128, 36, G.flowerW], [70, 110, G.flowerY]].forEach(([x, y, c]) => flower(x, y, c));

    roomCache = `<svg class="bg" viewBox="0 0 ${W} ${H}" width="1280" height="640" shape-rendering="crispEdges" preserveAspectRatio="none">
<defs><pattern id="hm-tuft" width="16" height="16" patternUnits="userSpaceOnUse"><rect x="3" y="4" width="1" height="1" fill="${G.grassD}"/><rect x="4" y="3" width="1" height="1" fill="${G.grassD}"/><rect x="11" y="10" width="1" height="1" fill="${G.grassD}"/><rect x="12" y="9" width="1" height="1" fill="${G.grassD}"/><rect x="8" y="13" width="2" height="1" fill="${G.grassL}"/><rect x="14" y="2" width="1" height="1" fill="${G.grassL}"/></pattern></defs>
<rect width="${W}" height="${H}" fill="${G.grass}"/><rect width="${W}" height="${H}" fill="url(#hm-tuft)"/>${ground.paths()}${ob.paths()}</svg>`;
    return roomCache;
  }

  // =====================================================================
  // アイコン（12×12）
  // =====================================================================
  function iconSvg(p, size) { return `<svg viewBox="0 0 12 12" width="${size}" height="${size}" shape-rendering="crispEdges">${p.paths()}</svg>`; }
  function seedIcon(c1, c2, size) { const p = new Px(12, 12); p.ellipse(6, 6, 2, 4, c1); p.rect(6, 3, 1, 6, c2); p.outline(K.L); return iconSvg(p, size); }
  const ICONS = {
    seed: seedIcon(K.seed, '#8a6a48', 20),
    gold: seedIcon(K.yellow, K.yellowD, 20),
    star: (on) => iconSvg(sprite(['.....s.....', '....sss....', 'sssssssssss', '.sssssssss.', '..sssssss..', '..sss.sss..', '.ss.....ss.'].map((r) => r + '.'), { s: on ? K.yellow : '#e6d6b4' }), 16),
  };

  // 開発時チェック: スプライトの行長がそろっていなければ警告
  Object.keys(POSES).forEach((k) => POSES[k].f.forEach((rows, fi) => rows.forEach((r, i) => { if (r.length !== HAM_W) console.warn(`sprite ${k} f${fi} row ${i} len ${r.length}`); })));

  global.HamuArt = { hamster, item, bowl, room, ICONS, POSE_LIST: Object.keys(POSES), Px, PX, HAM_W, ITEM_W, ITEM_H, BOWL_W, BOWL_H };
})(window);
