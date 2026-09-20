/* はむあつめ — ドット絵描画（ハムスター 6ポーズ × カラー、グッズ、おへや背景）
   すべてピクセルグリッド → インライン SVG <path>（shape-rendering: crispEdges）で描く。画像ファイルは使わない。 */
(function (global) {
  'use strict';

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
  // 左半分（10列）を書いて右へ鏡映（左右対称ポーズ用）
  const M = (rows) => rows.map((r) => r + r.split('').reverse().join(''));

  // 色を暗くする（影用）
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => Math.max(0, Math.round(v * (1 - k))).toString(16).padStart(2, '0');
    return '#' + f(n >> 16) + f((n >> 8) & 255) + f(n & 255);
  }

  // =====================================================================
  // ハムスター（20×20 グリッド、右向き基準）
  //   L 輪郭  B 体  D 体の影  W おなか  E 耳のうち  S 背中の線  P ぶち
  //   R まゆ(ロボ)  F 顔(白)  Y 目  N 鼻  T しっぽ(長)  t しっぽ(短)  n たね  z zzz
  // =====================================================================
  const DEF = { body: '#e0a565', belly: '#fff5e6', ear: '#f3c1b0', stripe: 'none', brow: 'none', eye: '#2b2320', nose: '#d98b8b', line: '#4a3324', spots: 'none', face: 'none' };
  const SIL = { body: '#cdc3b5', belly: '#cdc3b5', ear: '#cdc3b5', stripe: 'none', brow: 'none', eye: '#cdc3b5', nose: '#cdc3b5', line: '#b5a994', spots: 'none', face: 'none' };

  const POSES = {
    front: M([
      '..........',
      '..........',
      '..LLL.....',
      '.LEEEL....',
      '.LEEEELLLL',
      '.LBEEBBBBS',
      '..LBBBBBBS',
      '.LBBRRBBBB',
      '.LBBRYBBBB',
      'LBBBBFFFFN',
      'LBBBFFFLFF',
      'LBBBBFFFFF',
      'LPPBWWWWWW',
      'LPPBWWWWWW',
      'LDBBBWWWWW',
      '.LDDBBWWWW',
      '..LLLLLLLL',
      '..LWWWL...',
      '...LLL....',
      '..........',
    ]),
    back: M([
      '..........',
      '..........',
      '..LLL.....',
      '.LBBBL....',
      '.LBBBBLLLL',
      '.LBBBBBBBS',
      '..LBBBBBBS',
      '.LBBBBBBBS',
      'LBBBBBBBBS',
      'LBPPBBBBBS',
      'LBPPBBBBBS',
      'LBBBBBBBBS',
      'LBBBBBBBBS',
      'LBBBBBBBBS',
      'LDBBBBBBBB',
      '.LDDBBBBBB',
      '..LLLLLLLL',
      '..LWWWL..t',
      '...LLL...T',
      '.........T',
    ]),
    eat: M([
      '..........',
      '..LLL.....',
      '.LEEEL....',
      '.LEEEELLLL',
      '.LBEEBBBBS',
      '..LBBBBBBS',
      '.LBBRRBBBB',
      '.LBBRYBBBB',
      'LBBBBFFFFN',
      'LBBBBFFFLn',
      'LPPBBBLBnn',
      'LPPBBLBBBn',
      'LBBBBWWWWW',
      'LBBBWWWWWW',
      'LDBBBWWWWW',
      '.LDDBBWWWW',
      '..LLLLLLLL',
      '..LWWWL...',
      '...LLL....',
      '..........',
    ]),
    side: [
      '....................',
      '....................',
      '....................',
      '...........LLL......',
      '..........LEEEL.....',
      '......LLLLLEEEL.....',
      '....LLBSSSSSBBBLL...',
      '...LBBBBBBBBBBBBBL..',
      '..LBBBBBBBBBBRRBBBL.',
      '.LBBBBBBBBBBBRYBFBBL',
      '.LBPPBBBBBBBBBBFFFNL',
      '.LBPPBBBBBBBBBBFFLL.',
      '.LBBBBBBBBBBBBBBBL..',
      '.LDBBBBWWWWWWWBBBL..',
      'TLDDBBWWWWWWWWWBDL..',
      'TTLDDDBWWWWWWWDDL...',
      '.t.LLLLLLLLLLLLL....',
      '.....LWWL..LWWL.....',
      '......LL....LL......',
      '....................',
    ],
    sleep: [
      '....................',
      '..............zzz...',
      '................z...',
      '...............z....',
      '....LLL.......zzz...',
      '...LEEELLLLLL.......',
      '..LBEEBBBBSSBLL.....',
      '.LBBBBBBBBBSSBBBL...',
      '.LBBRRBBBBBBBBBBBL..',
      'LBBBLLLBBBBBBPPBBBL.',
      'LBBFFFBBBBBBBBPPBBBL',
      'LNFFBBBBBBBBBBBBBBBL',
      'LBBBBBBWWWWWWWBBBBBL',
      '.LDBBBWWWWWWWWWBBBL.',
      '.LDDBBWWWWWWWWWWDDL.',
      '..LDDDDWWWWWWWDDDLt.',
      '...LLLLLLLLLLLLLLTT.',
      '..................T.',
      '....................',
      '....................',
    ],
    belly: [
      '....................',
      '....................',
      '....................',
      '....LLL.............',
      '...LEEEL...LL...LL..',
      '...LEEEL..LWWL.LWWL.',
      '..LLBEBLLLLBBLLLBBLL',
      '.LBRRBBBBWWWWWWWWBBL',
      'LBBRYBBBWWWWWWWWWBBL',
      'LNBBBBBBWWWWWWWWWWBL',
      'LBLBBBBBWWWWWWWWWBBL',
      'LBPPBBBBBWWWWWWWBBBL',
      '.LPPBBBBBBWWWWWBBBLt',
      '.LDDBBBBBBBBBBBBDDLT',
      '..LLDDDBBBBBBBDDLLT.',
      '....LLLLLLLLLLLL....',
      '....................',
      '....................',
      '....................',
      '....................',
    ],
  };

  // アクセサリーの置き場所（ポーズごと）: head=頭のてっぺん, brow=おでこ, chin=あご
  const HEAD = {
    front: { head: [10, 4], brow: [10, 7], chin: [10, 11] },
    side:  { head: [9, 5],  brow: [14, 8], chin: [16, 12] },
    back:  { head: [10, 4], brow: [10, 7], chin: null },
    sleep: { head: [8, 5],  brow: [5, 8],  chin: [3, 12] },
    eat:   { head: [10, 3], brow: [10, 6], chin: [10, 12] },
    belly: { head: [5, 6],  brow: [3, 7],  chin: [2, 11] },
  };
  const ACC_PAL = { y: '#f2c14e', Y: '#d9a012', r: '#c9302c', W: '#ffffff', b: '#7fb0c9', L: '#4a3324' };
  // parts: at=置き場所, rows=スプライト, dy=上下ずらし（head/brow は下端を基準、chin は上端を基準）
  const ACC = {
    crown:    [{ at: 'head', rows: ['y.y.y', 'yyyyy', 'YyyyY'] }],
    halo:     [{ at: 'head', dy: -1, rows: ['.yyy.', 'y...y', '.yyy.'] }],
    headband: [{ at: 'brow', rows: ['rrrrrrrrr', '........r', '.......r.'] }],
    towel:    [{ at: 'head', rows: ['.WWWWW.', 'WWbWbWW'] }],
    bucket:   [{ at: 'head', rows: ['.rrr.', 'rrrrr', 'rrrrr'] }],
    beard:    [{ at: 'head', rows: ['..y..', '.yyy.', 'yyyyy'] }, { at: 'chin', rows: ['WWWWW', '.WWW.', '..W..'] }],
  };

  function hamsterPalette(c, tail) {
    const nz = (v, fb) => (v && v !== 'none') ? v : fb;
    return {
      L: c.line, B: c.body, D: shade(c.body, 0.18), W: c.belly, E: c.ear,
      S: nz(c.stripe, c.body), P: nz(c.spots, c.body), R: nz(c.brow, c.body), F: nz(c.face, c.body),
      Y: c.eye, N: c.nose, T: tail ? c.body : null, t: c.belly, n: '#6b4a2a', z: c.line,
    };
  }

  /**
   * ハムスターのSVG文字列を返す
   * @param {object} opts { colors, pose, flip, size, silhouette, accessory, tail, className }
   */
  function hamster(opts) {
    const pose = POSES[opts.pose] ? opts.pose : 'front';
    const c = Object.assign({}, DEF, opts.silhouette ? SIL : (opts.colors || {}));
    if (opts.silhouette) { c.stripe = 'none'; c.brow = 'none'; c.spots = 'none'; c.face = 'none'; }
    const pal = hamsterPalette(c, !!opts.tail);
    if (opts.silhouette) { pal.n = SIL.body; pal.z = SIL.line; }
    const px = sprite(POSES[pose], pal);
    if (opts.accessory && ACC[opts.accessory] && !opts.silhouette) {
      ACC[opts.accessory].forEach((part) => {
        const at = HEAD[pose][part.at]; if (!at) return;
        const sp = sprite(part.rows, ACC_PAL);
        const x0 = at[0] - Math.floor(sp.w / 2);
        const y0 = part.at === 'chin' ? at[1] + (part.dy || 0) : at[1] - sp.h + 1 + (part.dy || 0);
        px.blit(sp, x0, y0);
      });
    }
    const size = opts.size || 100;
    const flip = opts.flip ? ' transform="translate(20 0) scale(-1 1)"' : '';
    return `<svg viewBox="0 0 20 20" width="${size}" height="${size}" class="${opts.className || 'hamu'}" shape-rendering="crispEdges" style="overflow:visible"><g${flip}>${px.paths()}</g></svg>`;
  }

  // =====================================================================
  // グッズ（30×24 グリッド）
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
      p.line(15, 11, 9, 22, K.blue, 2); p.line(15, 11, 21, 22, K.blue, 2); p.rect(7, 21, 16, 2, K.blue);
      p.ellipse(15, 11, 9, 9, K.blue); p.ellipse(15, 11, 7, 7, K.blueLL);
      p.rect(15, 4, 1, 15, K.blueL); p.rect(8, 11, 15, 1, K.blueL); p.line(10, 6, 20, 16, K.blueL); p.line(20, 6, 10, 16, K.blueL);
      p.ellipse(15, 11, 1, 1, K.blue);
    },
    house(p) {
      p.tri(15, 1, 13, 9, K.roof); p.rect(5, 10, 21, 13, K.wall); p.rect(2, 9, 27, 1, K.roofD);
      p.rect(7, 13, 4, 1, K.woodD); p.rect(7, 16, 6, 1, K.woodD); p.rect(20, 13, 4, 1, K.woodD);
      p.rect(12, 16, 7, 7, K.hole); p.ellipse(15, 16, 3, 3, K.hole);
    },
    tunnel(p) {
      p.ellipse(15, 17, 14, 12, K.green); p.clear(0, 18, 30, 6);
      p.rect(9, 8, 1, 10, K.greenD); p.rect(15, 6, 1, 12, K.greenD); p.rect(21, 8, 1, 10, K.greenD);
      p.ellipse(2, 13, 2, 5, K.hole); p.ellipse(28, 13, 2, 5, K.hole);
    },
    sand(p) {
      p.rect(2, 9, 26, 13, K.woodD); p.rect(2, 9, 26, 2, K.wood); p.rect(4, 12, 22, 8, K.sand);
      p.rect(7, 14, 2, 1, K.sandD); p.rect(19, 15, 2, 1, K.sandD); p.rect(13, 17, 2, 1, K.sandD); p.rect(22, 18, 1, 1, K.sandD);
    },
    box(p) {
      p.rect(5, 9, 20, 13, K.card); p.rect(3, 6, 24, 3, K.cardD); p.rect(5, 12, 20, 1, K.cardD); p.rect(15, 9, 1, 13, K.cardD);
      p.rect(9, 14, 5, 8, K.hole); p.ellipse(11, 14, 2, 2, K.hole);
    },
    chew(p) {
      p.line(6, 20, 23, 9, K.woodD, 4); p.line(6, 20, 23, 9, K.wood, 2);
      p.set(11, 16, K.woodD); p.set(15, 14, K.woodD); p.set(19, 11, K.woodD);
      p.line(23, 9, 26, 5, K.greenD, 1); p.ellipse(26, 4, 3, 2, K.green); p.set(26, 4, K.greenD); p.set(27, 4, K.greenD);
    },
    bed(p) {
      p.ellipse(15, 18, 13, 4, K.pinkD); p.ellipse(15, 14, 13, 7, K.pink); p.ellipse(15, 13, 9, 4, K.pinkL);
    },
    hammock(p) {
      p.ellipse(15, 12, 11, 6, K.green); p.clear(0, 0, 30, 12); p.rect(6, 13, 18, 1, K.greenL);
      p.line(4, 7, 8, 12, K.woodD); p.line(26, 7, 22, 12, K.woodD);
      p.rect(3, 6, 2, 17, K.woodD); p.rect(25, 6, 2, 17, K.woodD); p.rect(2, 5, 4, 2, K.wood); p.rect(24, 5, 4, 2, K.wood);
    },
    cabbage(p) {
      p.rect(4, 15, 22, 7, K.tan); p.rect(3, 13, 24, 2, K.rim);
      p.ellipse(10, 10, 5, 4, K.greenD); p.ellipse(10, 10, 4, 3, K.green); p.ellipse(10, 10, 2, 1, K.greenL);
      p.ellipse(20, 9, 5, 5, K.greenD); p.ellipse(20, 9, 4, 4, K.green); p.ellipse(20, 9, 2, 2, K.greenL);
    },
    seesaw(p) {
      p.tri(15, 14, 4, 8, K.wood); p.line(3, 18, 27, 9, K.orange, 2); p.set(15, 13, K.woodDD); p.set(15, 14, K.woodDD);
    },
    sunflower(p) {
      p.rect(10, 17, 10, 5, K.tan); p.rect(9, 15, 12, 2, K.rim);
      p.rect(14, 9, 2, 6, K.greenD); p.ellipse(11, 12, 3, 2, K.green); p.ellipse(19, 11, 3, 2, K.green);
      p.ellipse(15, 6, 6, 6, K.yellow); p.set(9, 6, K.yellowD); p.set(21, 6, K.yellowD); p.set(15, 0, K.yellowD); p.set(15, 12, K.yellowD);
      p.ellipse(15, 6, 3, 3, K.seed);
    },
    treasure(p) {
      p.ellipse(15, 11, 11, 5, K.chest); p.rect(4, 11, 22, 11, K.roofD); p.rect(4, 11, 22, 1, K.yellow);
      p.rect(13, 10, 4, 4, K.yellow); p.rect(14, 12, 2, 1, K.hole);
    },
    onsen(p) {
      p.rect(3, 10, 24, 12, K.wood); p.rect(9, 10, 1, 12, K.woodD); p.rect(15, 10, 1, 12, K.woodD); p.rect(21, 10, 1, 12, K.woodD);
      p.ellipse(15, 10, 12, 3, K.blue); p.ellipse(15, 10, 10, 2, K.blueL);
      [[9, 5], [9, 4], [10, 3], [15, 4], [15, 3], [16, 2], [21, 5], [21, 4], [22, 3]].forEach(([x, y]) => p.set(x, y, K.blueL));
    },
    ice(p) {
      p.rect(6, 8, 18, 14, K.blueL); p.rect(4, 12, 22, 10, K.blueL); p.rect(8, 10, 1, 6, K.white); p.rect(21, 10, 1, 6, K.white);
      p.rect(12, 14, 6, 1, K.blueLL); p.set(3, 5, K.blue); p.set(27, 5, K.blue);
    },
    castle(p) {
      p.rect(4, 11, 22, 11, K.cream); p.rect(2, 5, 6, 17, K.cream); p.rect(22, 5, 6, 17, K.cream);
      p.tri(4, 1, 3, 4, K.orange); p.tri(25, 1, 3, 4, K.orange);
      p.rect(9, 9, 3, 2, K.cream); p.rect(14, 9, 3, 2, K.cream); p.rect(19, 9, 3, 2, K.cream);
      p.rect(4, 9, 2, 2, K.woodDD); p.rect(24, 9, 2, 2, K.woodDD);
      p.rect(13, 17, 5, 5, K.hole); p.ellipse(15, 17, 2, 2, K.hole); p.rect(14, 0, 1, 2, K.woodDD); p.rect(15, 0, 3, 1, K.red);
    },
    dojo(p) {
      p.tri(15, 2, 14, 7, K.dark); p.rect(4, 9, 22, 13, K.paper);
      p.rect(4, 15, 22, 1, K.dark); p.rect(9, 9, 1, 13, K.dark); p.rect(15, 9, 1, 13, K.dark); p.rect(21, 9, 1, 13, K.dark);
      p.rect(12, 16, 6, 6, K.hole); p.ellipse(23, 12, 1, 1, K.red);
    },
    bowl(p) {
      p.ellipse(15, 17, 12, 5, K.terra); p.clear(0, 0, 30, 13);
      p.ellipse(15, 13, 12, 4, K.terraD); p.ellipse(15, 13, 10, 3, K.terraL);
    },
  };
  const FOOD_SPOTS = [[9, 13], [12, 12], [15, 13], [18, 12], [21, 13], [14, 14], [17, 14], [11, 14], [20, 14], [13, 11], [16, 12], [8, 12]];
  const FOOD_DRAW = {
    seed(p, x, y) { p.rect(x, y, 2, 1, K.seed); },
    goldseed(p, x, y) { p.rect(x, y, 2, 1, K.yellow); },
    pellet(p, x, y) { p.rect(x, y, 2, 1, '#9a7a4a'); },
    mix(p, x, y, i) { p.rect(x, y, 2, 1, [K.seed, '#e0b060', K.green, K.rim][i % 4]); },
    worm(p, x, y) { p.rect(x, y, 3, 1, '#e8c27a'); p.set(x + 1, y - 1, '#e8c27a'); },
    cheese(p, x, y) { p.rect(x, y - 1, 3, 2, K.yellow); p.set(x + 1, y, K.yellowD); },
  };

  const ITEM_W = 30, ITEM_H = 24;
  const itemCache = {};
  function itemPx(id) {
    const p = new Px(ITEM_W, ITEM_H);
    if (ITEM_DRAW[id]) { ITEM_DRAW[id](p); p.outline(K.L); }
    return p;
  }
  function itemSvg(inner, w, h) {
    return `<svg viewBox="0 0 ${ITEM_W} ${ITEM_H}" width="${w}" height="${h}" class="item-art" shape-rendering="crispEdges" style="overflow:visible">${inner}</svg>`;
  }
  function item(id, w, h, extra) {
    if (!itemCache[id]) itemCache[id] = itemPx(id).paths();
    return itemSvg(itemCache[id] + (extra || ''), w, h);
  }
  function bowl(foodId, amount, w, h) {
    const p = itemPx('bowl');
    if (amount > 0) {
      const n = Math.max(1, Math.round(FOOD_SPOTS.length * Math.min(1, amount / 100)));
      const draw = FOOD_DRAW[foodId] || FOOD_DRAW.seed;
      for (let i = 0; i < n; i++) draw(p, FOOD_SPOTS[i][0], FOOD_SPOTS[i][1], i);
    }
    return itemSvg(p.paths(), w, h);
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
    [[126, 102, 36, 15], [160, 98, 12, 7], [176, 91, 10, 6], [190, 82, 9, 6], [200, 72, 8, 5], [210, 62, 8, 5], [218, 51, 7, 5], [225, 40, 7, 5], [231, 29, 7, 5], [236, 16, 7, 8]]
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
    tree(22, 30); tree(46, 22); tree(150, 20); tree(212, 24); tree(250, 62); tree(166, 120); tree(88, 122);
    // 茂み
    const bush = (cx, cy) => { ob.ellipse(cx, cy, 6, 3, G.leaf); ob.ellipse(cx - 1, cy - 1, 4, 2, G.leafL); ob.set(cx - 2, cy - 2, G.leafLL); };
    bush(12, 110); bush(84, 12); bush(250, 100); bush(180, 30); bush(8, 72); bush(122, 12);
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

  global.HamuArt = { hamster, item, bowl, room, ICONS, POSE_LIST: Object.keys(POSES), Px };
})(window);
