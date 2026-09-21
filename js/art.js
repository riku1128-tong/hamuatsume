/* はむあつめ — ドット絵描画（ハムスター 6ポーズ × 2フレーム × カラー、グッズ、おへや背景）
   すべてピクセルグリッド → インライン SVG <path>（shape-rendering: crispEdges）で描く。画像ファイルは使わない。
   1 グリッド = PX(2.5) 画面px。ハムスター 48×48、グッズ 88×72、えさ皿 48×28、背景 512×256 で密度をそろえる。

   カメラは「斜め上から見下ろす 3/4 俯瞰」（背景の牧場と同じ）。ハムスターは正面立ち絵ではなく、
   背中が見える丸い塊として描き、顔は塊の下半分・耳は上・手足は塊のふちに少しだけ出す。
   文字絵ではなく楕円の組み合わせ + 部品ごとの自動輪郭で描く（ねこあつめの「ベクター絵を低解像度にした」質感）。 */
(function (global) {
  'use strict';

  const PX = 2.5;                        // 1 グリッドの画面px
  const ANCHOR_PX = 5;                   // data.js の anchor（グッズ 44×36 / 皿 24×14 の座標）1 マスぶんの画面px
  const HAM_W = 48, ITEM_W = 88, ITEM_H = 72, BOWL_W = 48, BOWL_H = 28;

  // =====================================================================
  // ピクセルキャンバス（k = 座標倍率。グッズ・背景は 44×36 / 256×128 の座標のまま k=2 で細かく描く）
  // =====================================================================
  class Px {
    constructor(w, h, k) { this.w = w; this.h = h; this.k = k || 1; this.g = new Array(w * h).fill(null); }
    get(x, y) { return (x < 0 || y < 0 || x >= this.w || y >= this.h) ? null : this.g[y * this.w + x]; }
    put(x, y, c) { if (c && x >= 0 && y >= 0 && x < this.w && y < this.h) this.g[y * this.w + x] = c; }
    del(x, y) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.g[y * this.w + x] = null; }
    set(x, y, c) { this.rect(x, y, 1, 1, c); }
    rect(x, y, w, h, c) {
      const k = this.k, x0 = Math.round(x * k), y0 = Math.round(y * k), x1 = Math.max(x0 + 1, Math.round((x + w) * k)), y1 = Math.max(y0 + 1, Math.round((y + h) * k));
      for (let j = y0; j < y1; j++) for (let i = x0; i < x1; i++) this.put(i, j, c);
    }
    clear(x, y, w, h) {
      const k = this.k, x0 = Math.round(x * k), y0 = Math.round(y * k), x1 = Math.round((x + w) * k), y1 = Math.round((y + h) * k);
      for (let j = y0; j < y1; j++) for (let i = x0; i < x1; i++) this.del(i, j);
    }
    ellipse(cx, cy, rx, ry, c) {
      const k = this.k; cx *= k; cy *= k; rx *= k; ry *= k;
      for (let j = Math.floor(cy - ry - 1); j <= Math.ceil(cy + ry + 1); j++) {
        for (let i = Math.floor(cx - rx - 1); i <= Math.ceil(cx + rx + 1); i++) {
          const dx = (i + 0.5 - cx) / (rx + 0.5), dy = (j + 0.5 - cy) / (ry + 0.5);
          if (dx * dx + dy * dy <= 1) this.put(i, j, c);
        }
      }
    }
    line(x0, y0, x1, y1, c, t) {
      const k = this.k; t = Math.max(1, Math.round((t || 1) * k));
      x0 = Math.round(x0 * k); y0 = Math.round(y0 * k); x1 = Math.round(x1 * k); y1 = Math.round(y1 * k);
      let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, err = dx + dy;
      for (;;) {
        if (t <= 1) this.put(x0, y0, c); else for (let j = 0; j < t; j++) for (let i = 0; i < t; i++) this.put(x0 - Math.floor(t / 2) + i, y0 - Math.floor(t / 2) + j, c);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
      }
    }
    // 台形: cx 中心列, top 上端行, 上辺の半幅 hw0 → 下辺の半幅 hw1, 高さ h（h 行）。三角形は hw0=0
    trap(cx, top, hw0, hw1, h, c) {
      const k = this.k, H = Math.round(h * k), T = Math.round(top * k), CX = cx * k;
      for (let j = 0; j < H; j++) { const w = (hw0 + (hw1 - hw0) * j / Math.max(1, H - 1)) * k; for (let i = Math.round(CX - w); i <= Math.round(CX + w) - 1; i++) this.put(i, T + j, c); }
    }
    tri(cx, top, halfW, h, c) { this.trap(cx, top, 0, halfW, h, c); }
    // 塗られた領域のまわり（4近傍）を輪郭色で囲む（常に 1 ピクセル幅）
    outline(c) {
      const add = [];
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
        if (this.get(x, y)) continue;
        if (this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1)) add.push(x, y);
      }
      for (let i = 0; i < add.length; i += 2) this.put(add[i], add[i + 1], c);
    }
    // 部品を別キャンバスに描いて輪郭を付けてから重ねる（部品どうしの境界にも線が入る）
    part(fn, lineColor) { const t = new Px(this.w, this.h, this.k); fn(t); t.outline(lineColor); this.blit(t, 0, 0); }
    blit(src, x0, y0, scale) {
      const s = scale || 1;
      for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
        const c = src.get(x, y); if (!c) continue;
        for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) this.put(x0 + x * s + i, y0 + y * s + j, c);
      }
    }
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

  // 文字列スプライト → Px（アクセサリー・アイコン用）。pal: 文字 → 色
  function sprite(rows, pal) {
    const p = new Px(rows[0].length, rows.length);
    rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const c = pal[r[x]]; if (c) p.put(x, y, c); } });
    return p;
  }

  // =====================================================================
  // ハムスター（48×48、右向き基準、各ポーズ 2 フレーム）
  //   3/4 俯瞰の「饅頭」: 背中（上半分）＋顔（下半分）が一体の楕円。耳は上、ほっぺは左右に張り出し、
  //   手は塊の下ふち、足は塊の左右下から少し。目は縦 1×3、鼻を頂点にした小さな ω、ヒゲはほっぺの外。
  // =====================================================================
  const DEF = { body: '#e0a565', belly: '#fff5e6', ear: '#f3c1b0', stripe: 'none', brow: 'none', eye: '#2b2320', nose: '#e08a8a', line: '#4a3324', spots: 'none', face: 'none' };
  const SIL = { body: '#cdc3b5', belly: '#cdc3b5', ear: '#cdc3b5', stripe: 'none', brow: 'none', eye: '#b5a994', nose: '#b5a994', line: '#b5a994', spots: 'none', face: 'none' };
  const SEED = '#6b4a2a';

  // 正面向きの顔。(cx, cy) = 鼻の位置、hw = ヒゲの起点（ほっぺの外縁）までの半幅
  function faceFront(p, c, cx, cy, hw, blink, sides) {
    const L = c.line;
    if (c.brow) { p.ellipse(cx - 7, cy - 5, 3, 2, c.brow); p.ellipse(cx + 6, cy - 5, 3, 2, c.brow); }
    p.ellipse(cx - 0.5, cy + 2, 6, 3, c.belly);                                                       // マズル
    if (blink) { p.rect(cx - 8, cy - 5, 3, 1, c.eye); p.rect(cx + 5, cy - 5, 3, 1, c.eye); }
    else { p.rect(cx - 7, cy - 6, 1, 3, c.eye); p.rect(cx + 6, cy - 6, 1, 3, c.eye); }
    p.rect(cx - 1, cy, 2, 1, c.nose);                                                                 // 鼻（ω の頂点）
    p.put(cx - 3, cy, L); p.put(cx + 2, cy, L); p.put(cx - 2, cy + 1, L); p.put(cx + 1, cy + 1, L);   // ω
    (sides || [-1, 1]).forEach((s) => {                                                               // ヒゲ 2 本ずつ
      const x0 = s < 0 ? cx - hw - 4 : cx + hw + 1;
      p.rect(x0, cy - 1, 4, 1, L); p.rect(x0, cy + 2, 4, 1, L);
    });
  }
  const ear = (p, c, x, y, r) => p.part((t) => { t.ellipse(x, y, r, r, c.body); t.ellipse(x, y + 0.5, r - 2, r - 2.5, c.ear); }, c.line);
  const pad = (p, c, x, y, rx, ry, col) => p.part((t) => t.ellipse(x, y, rx, ry, col || c.belly), c.line);
  function zzz(p, c, x, y) {
    const z = (x0, y0, s) => { p.rect(x0, y0, s, 1, c.line); p.line(x0 + s - 1, y0 + 1, x0, y0 + s - 2, c.line); p.rect(x0, y0 + s - 1, s, 1, c.line); };
    z(x, y, 5); z(x + 6, y - 6, 3);
  }
  // 正面向きの塊（front / eat / back で共用）
  function blobFront(p, c, withFace, f, eat) {
    // 足（塊の左右下から少し）
    pad(p, c, 12, 44, 3.5, 1.5); pad(p, c, 36, 44, 3.5, 1.5);
    // 塊: 背中〜顔、ほっぺで下ぶくれ
    p.part((t) => { t.ellipse(24, 28, 18, 14, c.body); t.ellipse(7, 32, 5, 4.5, c.body); t.ellipse(41, 32, 5, 4.5, c.body); }, c.line);
    // 模様
    if (c.face && withFace) p.ellipse(24, 32, 12, 8, c.face);
    if (c.stripe) p.rect(23, 14, 2, withFace ? 11 : 27, c.stripe);
    if (c.spots) { p.ellipse(31, 19, 5, 3.5, c.spots); p.ellipse(13, 24, 3.5, 3, c.spots); }
    // 耳（頭の上、背中側にかぶさる）
    ear(p, c, 13, 17, 4); ear(p, c, 35, 17, 4);
    if (!withFace) return;
    faceFront(p, c, 24, 35, 22, f === 1 && !eat);
    if (eat) {
      const dy = f ? 1 : 0;
      p.part((t) => { t.ellipse(19, 38 + dy, 3, 2, c.body); t.ellipse(29, 38 + dy, 3, 2, c.body); }, c.line);   // 手
      p.part((t) => t.ellipse(24, 37 + dy, 2, 3, SEED), c.line);                                                  // たね
    } else {
      pad(p, c, 20, 42, 2.5, 1.5); pad(p, c, 28, 42, 2.5, 1.5);                                                 // 手（あごの下）
    }
  }
  const DRAW = {
    front(p, c, f) { blobFront(p, c, true, f, false); },
    eat(p, c, f) { blobFront(p, c, true, f, true); },
    back(p, c, f, tail) {
      blobFront(p, c, false, f, false);
      if (f) { /* 片耳ぴく: 上に描き足す */ ear(p, c, 35, 16, 4); }
      if (tail) p.part((t) => t.line(24, 41, 32, 46, c.body, 2), c.line); else pad(p, c, 24, 42, 2, 1.5);
    },
    // あるく（右向き）。f=1 で足を入れ替え
    side(p, c, f, tail) {
      if (tail) p.part((t) => t.line(5, 33, 1, 40, c.body, 2), c.line); else pad(p, c, 4, 35, 2, 1.5);
      const fx = f ? [11, 18, 27, 34] : [8, 20, 24, 36];
      fx.forEach((x) => pad(p, c, x, 43, 3, 1.5));                                                         // 足
      p.part((t) => { t.ellipse(21, 31, 19, 11, c.body); t.ellipse(35, 29, 10, 9.5, c.body); t.ellipse(41, 34, 4, 3, c.body); }, c.line);   // 体 + 頭 + ほっぺ
      if (c.face) p.ellipse(39, 32, 6, 5, c.face);
      if (c.stripe) p.line(5, 27, 33, 21, c.stripe, 2);
      if (c.spots) { p.ellipse(13, 31, 4, 3, c.spots); p.ellipse(28, 23, 3, 3, c.spots); }
      ear(p, c, 33, 19, 4);
      p.ellipse(41, 35, 4, 2.5, c.belly);                                                                   // マズル
      if (c.brow) p.ellipse(38, 26, 3, 2, c.brow);
      p.rect(38, 27, 1, 3, c.eye);
      p.rect(44, 33, 2, 1, c.nose);
      p.put(43, 35, c.line); p.put(42, 36, c.line);                                                         // 口
      p.rect(45, 32, 3, 1, c.line); p.rect(45, 36, 3, 1, c.line);                                           // ヒゲ
    },
    // ねる（丸まって左向き）。f=1 で zzz が浮く
    sleep(p, c, f, tail) {
      zzz(p, c, 34, f ? 12 : 14);
      if (tail) p.part((t) => t.line(41, 40, 47, 35, c.body, 2), c.line); else pad(p, c, 43, 39, 2, 1.5);
      p.part((t) => { t.ellipse(26, 33, 19, 12, c.body); t.ellipse(11, 35, 9, 8, c.body); t.ellipse(5, 38, 4, 3, c.body); }, c.line);
      if (c.stripe) p.line(14, 25, 42, 30, c.stripe, 2);
      if (c.spots) p.ellipse(33, 30, 4, 3, c.spots);
      ear(p, c, 8, 27, 3.5);
      p.ellipse(6, 39, 4, 2.5, c.belly);
      if (c.brow) p.ellipse(12, 32, 3, 2, c.brow);
      p.rect(11, 34, 3, 1, c.eye);                                                                          // 閉じた目
      p.rect(2, 37, 2, 1, c.nose);
    },
    // ごろん（あおむけ・上から）。f=1 で手足がばたばた
    belly(p, c, f, tail) {
      const d = f ? 1 : 0;
      if (tail) p.part((t) => t.line(43, 30, 47, 25, c.body, 2), c.line); else pad(p, c, 44, 30, 2, 1.5);
      pad(p, c, 18, 19 - d, 3, 2); pad(p, c, 31, 18 + d, 3, 2); pad(p, c, 18, 42 + d, 3, 2); pad(p, c, 31, 43 - d, 3, 2);   // 手足
      p.part((t) => { t.ellipse(26, 30, 18, 11, c.body); t.ellipse(9, 30, 8.5, 8, c.body); }, c.line);      // 体 + 頭
      p.ellipse(27, 30, 12, 7, c.belly);                                                                    // おなか
      if (c.spots) p.ellipse(38, 26, 3.5, 3, c.spots);
      if (c.face) p.ellipse(9, 31, 6, 6, c.face);
      ear(p, c, 5, 22, 3.5); ear(p, c, 5, 38, 3.5);
      if (c.brow) { p.ellipse(8, 26, 2, 2.5, c.brow); p.ellipse(8, 34, 2, 2.5, c.brow); }
      p.rect(9, 25, 3, 1, c.eye); p.rect(9, 34, 3, 1, c.eye);                                               // 目（横向きに見上げ）
      p.ellipse(4, 30, 2.5, 4, c.belly);
      p.rect(2, 29, 1, 2, c.nose);
      p.put(3, 27, c.line); p.put(3, 32, c.line);                                                           // 口
      p.rect(6, 19, 1, 3, c.line); p.rect(6, 38, 1, 3, c.line);                                             // ヒゲ
    },
  };
  const POSES = {
    front: { anim: 'blink', dur: '3.4s' },
    back:  { anim: 'blink', dur: '2.8s' },
    eat:   { anim: 'alt', dur: '.5s' },
    side:  { anim: 'alt', dur: '.5s' },
    sleep: { anim: 'alt', dur: '1.6s' },
    belly: { anim: 'alt', dur: '.9s' },
  };

  // アクセサリーの置き場所（48 グリッド）: head=頭のてっぺん, brow=おでこ, chin=あご
  const HEAD = {
    front: { head: [24, 15], brow: [24, 27], chin: [24, 40] },
    eat:   { head: [24, 15], brow: [24, 27], chin: [24, 40] },
    back:  { head: [24, 15], brow: [24, 24], chin: null },
    side:  { head: [34, 20], brow: [39, 25], chin: [42, 39] },
    sleep: { head: [11, 27], brow: [12, 32], chin: [7, 43] },
    belly: { head: [9, 22],  brow: [11, 30], chin: [4, 36] },
  };
  const ACC_PAL = { y: '#f2c14e', Y: '#d9a012', r: '#c9302c', W: '#ffffff', b: '#7fb0c9', L: '#4a3324' };
  // parts: at=置き場所, rows=スプライト（2 倍に拡大して置く）, dy=上下ずらし（head/brow は下端基準、chin は上端基準）
  const ACC = {
    crown:    [{ at: 'head', rows: ['y.y.y', 'yyyyy', 'YyyyY'] }],
    halo:     [{ at: 'head', dy: -2, rows: ['.yyyyy.', 'y.....y', '.yyyyy.'] }],
    headband: [{ at: 'brow', rows: ['rrrrrrrrrrr', '..........r', '.........r.'] }],
    towel:    [{ at: 'head', rows: ['.WWWWWWW.', 'WWbWWWbWW'] }],
    bucket:   [{ at: 'head', rows: ['.rrrrr.', 'rrrrrrr', 'rrrrrrr'] }],
    beard:    [{ at: 'head', rows: ['..y..', '.yyy.', 'yyyyy'] }, { at: 'chin', rows: ['WWWWWWW', '.WWWWW.', '..WWW..', '...W...'] }],
  };

  function resolveColors(opts) {
    const c = Object.assign({}, DEF, opts.silhouette ? SIL : (opts.colors || {}));
    ['stripe', 'brow', 'spots', 'face'].forEach((k) => { if (c[k] === 'none' || opts.silhouette) c[k] = null; });
    return c;
  }

  /**
   * ハムスターのSVG文字列を返す
   * @param {object} opts { colors, pose, flip, size, silhouette, accessory, tail, className, anim }
   *   anim: true でポーズごとの 2 フレームアニメ（CSS で切り替え）
   */
  function hamster(opts) {
    const pose = DRAW[opts.pose] ? opts.pose : 'front';
    const c = resolveColors(opts);
    const frames = (opts.anim ? [0, 1] : [0]).map((f) => {
      const px = new Px(HAM_W, HAM_W);
      DRAW[pose](px, c, f, !!opts.tail);
      if (opts.accessory && ACC[opts.accessory] && !opts.silhouette) {
        ACC[opts.accessory].forEach((part) => {
          const at = HEAD[pose][part.at]; if (!at) return;
          const sp = sprite(part.rows, ACC_PAL);
          const x0 = at[0] - sp.w;
          const y0 = part.at === 'chin' ? at[1] + (part.dy || 0) : at[1] - sp.h * 2 + 1 + (part.dy || 0);
          px.blit(sp, x0, y0, 2);
        });
      }
      return px.paths();
    });
    const size = opts.size || 100;
    const flip = opts.flip ? ` transform="translate(${HAM_W} 0) scale(-1 1)"` : '';
    const P = POSES[pose];
    const cls = `${opts.className || 'hamu'}${opts.anim ? ` anim anim-${P.anim}` : ''}`;
    const inner = opts.anim ? `<g class="f1">${frames[0]}</g><g class="f2">${frames[1]}</g>` : frames[0];
    return `<svg viewBox="0 0 ${HAM_W} ${HAM_W}" width="${size}" height="${size}" class="${cls}" shape-rendering="crispEdges" style="overflow:visible${opts.anim ? `;--dur:${P.dur}` : ''}"><g${flip}>${inner}</g></svg>`;
  }

  // =====================================================================
  // グッズ（座標は 44×36、k=2 で 88×72 に描く）・えさ皿（24×14 → 48×28）
  //   3/4 俯瞰: 屋根・天面・水面が見える。前面は少し低め。
  // =====================================================================
  const K = {
    L: '#3d2a1e', wood: '#d9b483', woodD: '#a5804f', woodDD: '#7a5433', tan: '#c98a5a', rim: '#d9a35a',
    blue: '#7fb0c9', blueL: '#bfe3f2', blueLL: '#e9f3f7', green: '#8fbf62', greenD: '#5f8a3a', greenL: '#b6d788',
    yellow: '#f2c14e', yellowD: '#d9a012', red: '#c9302c', pink: '#f6c9d4', pinkD: '#dfa0b2', pinkL: '#fbe3ea',
    sand: '#f2e2c4', sandD: '#d9bf8c', hole: '#2b2320', seed: '#6b4a2a', white: '#ffffff', grey: '#b8b8b8',
    terra: '#e8825a', terraD: '#b34f2b', terraL: '#f6a785', orange: '#e0803f', card: '#d9b483', cardD: '#c9a06a', cardL: '#e8cfa5',
    roof: '#d98b6a', roofD: '#a65b3d', roofL: '#e8a684', wall: '#f0c58f', cream: '#f3e3c4', dark: '#4a3b2f', darkL: '#6b5a4a', paper: '#e9dcc3', chest: '#c9764f',
  };
  const ITEM_DRAW = {
    wheel(p) {
      p.ellipse(22, 33, 13, 2.5, K.blue);                                                       // 台座（俯瞰で楕円）
      p.line(22, 17, 13, 33, K.blue, 2); p.line(22, 17, 31, 33, K.blue, 2);
      p.ellipse(22, 17, 15, 15, K.blue); p.ellipse(22, 17, 12.5, 12.5, K.blueLL);
      p.rect(22, 5, 0.5, 25, K.blueL); p.rect(10, 17, 25, 0.5, K.blueL); p.line(13, 8, 31, 26, K.blueL, 0.5); p.line(31, 8, 13, 26, K.blueL, 0.5);
      p.ellipse(22, 17, 1.5, 1.5, K.blue);
    },
    house(p) {
      p.trap(22, 3, 10, 21, 12, K.roof); p.rect(6, 15, 32, 19, K.wall);                          // 屋根は上面が見える台形
      p.trap(22, 3, 9, 15, 6, K.roofL); p.rect(1, 14.5, 42, 1, K.roofD);
      p.rect(8, 20, 4, 0.5, K.woodD); p.rect(8, 24, 3, 0.5, K.woodD); p.rect(33, 20, 4, 0.5, K.woodD);
      p.rect(11, 23, 22, 11, K.hole); p.ellipse(22, 23, 10.5, 5.5, K.hole);
    },
    tunnel(p) {
      p.ellipse(22, 25, 21, 16, K.green);
      p.ellipse(22, 21, 17, 8, K.greenL); p.ellipse(22, 24, 17, 8.5, K.green);                    // 天面ハイライト（上側だけ残す）
      p.clear(0, 27, 44, 9);
      p.rect(13, 12, 0.5, 15, K.greenD); p.rect(22, 9.5, 0.5, 17.5, K.greenD); p.rect(31, 12, 0.5, 15, K.greenD);
      p.ellipse(2, 20, 3, 7, K.hole); p.ellipse(41, 20, 3, 7, K.hole);
    },
    sand(p) {
      p.rect(2, 10, 40, 22, K.woodD); p.rect(2, 10, 40, 19, K.wood); p.rect(5, 13, 34, 13, K.sand);   // 枠の天面が広く見える
      p.rect(10, 17, 3, 1, K.sandD); p.rect(28, 18, 3, 1, K.sandD); p.rect(19, 22, 3, 1, K.sandD); p.rect(33, 24, 2, 1, K.sandD); p.rect(8, 24, 2, 1, K.sandD);
    },
    box(p) {
      p.rect(6, 8, 32, 10, K.cardL); p.rect(6, 18, 32, 16, K.card);                                // 天面 + 前面
      p.rect(6, 8, 32, 0.5, K.cardD); p.rect(22, 8, 0.5, 10, K.cardD); p.rect(6, 17.5, 32, 1, K.cardD);
      p.rect(12, 22, 8, 12, K.hole); p.ellipse(16, 22, 4, 3.5, K.hole);
    },
    chew(p) {
      p.line(8, 30, 34, 13, K.woodD, 6); p.line(8, 30, 34, 13, K.wood, 3);
      p.rect(16, 24, 2, 0.5, K.woodD); p.rect(22, 20, 2, 0.5, K.woodD); p.rect(28, 16, 2, 0.5, K.woodD);
      p.line(34, 13, 39, 7, K.greenD, 1); p.ellipse(39, 6, 4, 3, K.green); p.rect(37, 6, 5, 0.5, K.greenD);
    },
    bed(p) {
      p.ellipse(22, 25, 20, 8, K.pinkD); p.ellipse(22, 21, 20, 10, K.pink); p.ellipse(22, 20, 14, 6, K.pinkL);
    },
    hammock(p) {
      p.ellipse(22, 18, 17, 9, K.green); p.clear(0, 0, 44, 18); p.rect(8, 19, 28, 0.5, K.greenL);
      p.line(5, 10, 11, 18, K.woodD); p.line(39, 10, 33, 18, K.woodD);
      p.rect(4, 8, 3, 26, K.woodD); p.rect(37, 8, 3, 26, K.woodD); p.rect(3, 6, 5, 3, K.wood); p.rect(36, 6, 5, 3, K.wood);
    },
    cabbage(p) {
      p.rect(4, 18, 36, 4, K.rim); p.rect(5, 22, 34, 12, K.tan); p.rect(6, 19, 32, 3, K.seed);    // 土の天面
      p.ellipse(14, 15, 8, 6.5, K.greenD); p.ellipse(14, 15, 6, 4.5, K.green); p.ellipse(14, 14, 3, 2, K.greenL);
      p.ellipse(29, 13, 8, 7, K.greenD); p.ellipse(29, 13, 6, 5, K.green); p.ellipse(29, 12, 3, 2, K.greenL);
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
      p.rect(4, 12, 36, 22, K.wood); p.rect(13, 12, 0.5, 22, K.woodD); p.rect(22, 12, 0.5, 22, K.woodD); p.rect(31, 12, 0.5, 22, K.woodD);
      p.ellipse(22, 14, 18, 7, K.blue); p.ellipse(22, 14, 15.5, 5.5, K.blueL);                     // 水面が大きく見える
      [[12, 6], [12, 5], [13, 4], [13, 3], [22, 5], [22, 4], [23, 3], [23, 2], [32, 6], [32, 5], [33, 4], [33, 3]].forEach(([x, y]) => p.set(x, y, K.blueL));
    },
    ice(p) {
      p.rect(9, 8, 26, 8, K.blueLL); p.rect(9, 16, 26, 18, K.blueL); p.rect(6, 20, 32, 14, K.blueL);   // 天面が明るい
      p.rect(9, 15.5, 26, 1, K.blue); p.rect(12, 20, 1, 8, K.white); p.rect(31, 20, 1, 8, K.white);
      p.set(4, 7, K.blue); p.set(40, 7, K.blue);
    },
    castle(p) {
      p.rect(6, 16, 32, 18, K.cream); p.rect(3, 7, 9, 27, K.cream); p.rect(32, 7, 9, 27, K.cream);
      p.tri(7, 1, 5, 6, K.orange); p.tri(36, 1, 5, 6, K.orange);
      p.rect(13, 13, 4, 3, K.cream); p.rect(20, 13, 4, 3, K.cream); p.rect(27, 13, 4, 3, K.cream);
      p.rect(6, 13, 3, 3, K.woodDD); p.rect(35, 13, 3, 3, K.woodDD);
      p.rect(18, 24, 8, 10, K.hole); p.ellipse(22, 24, 4, 4, K.hole); p.rect(36, 0, 0.5, 1, K.woodDD); p.rect(36.5, 0, 3, 1, K.red);
    },
    dojo(p) {
      p.trap(22, 3, 12, 22, 10, K.dark); p.trap(22, 3, 11, 16, 5, K.darkL); p.rect(6, 13, 32, 21, K.paper);
      p.rect(6, 21, 32, 0.5, K.dark); p.rect(13, 13, 0.5, 21, K.dark); p.rect(22, 13, 0.5, 21, K.dark); p.rect(31, 13, 0.5, 21, K.dark);
      p.rect(18, 24, 8, 10, K.hole); p.ellipse(34, 17, 1.5, 1.5, K.red);
    },
    bowl(p) {
      p.ellipse(12, 9, 11, 4, K.terra); p.clear(0, 0, 24, 6);
      p.ellipse(12, 6, 11, 4, K.terraD); p.ellipse(12, 6, 9, 3, K.terraL);                          // 上から見た口が大きめ
    },
  };
  const FOOD_SPOTS = [[5, 6], [8, 5], [11, 6], [14, 5], [17, 6], [10, 7], [13, 7], [7, 7], [16, 7], [9, 5], [12, 5], [15, 6]];
  const FOOD_DRAW = {
    seed(p, x, y) { p.ellipse(x + 1, y + 0.5, 1, 0.5, K.seed); },
    goldseed(p, x, y) { p.ellipse(x + 1, y + 0.5, 1, 0.5, K.yellow); },
    pellet(p, x, y) { p.rect(x, y, 2, 1, '#9a7a4a'); },
    mix(p, x, y, i) { p.ellipse(x + 1, y + 0.5, 1, 0.6, [K.seed, '#e0b060', K.green, K.rim][i % 4]); },
    worm(p, x, y) { p.rect(x, y, 3, 1, '#e8c27a'); p.rect(x + 1, y - 0.5, 1, 0.5, '#e8c27a'); },
    cheese(p, x, y) { p.rect(x, y - 1, 3, 2, K.yellow); p.set(x + 1, y, K.yellowD); },
  };

  const itemCache = {};
  function itemPx(id) {
    const isBowl = id === 'bowl';
    const p = new Px(isBowl ? BOWL_W : ITEM_W, isBowl ? BOWL_H : ITEM_H, 2);
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
  // おへや背景（座標は 256×128、k=2 で 512×256 に描く = 1280×640 の 1/2.5）
  // =====================================================================
  const G = { grass: '#8cb864', grassD: '#6f9a47', grassL: '#a3cc78', dirt: '#dcb98a', dirtD: '#c49a63', trunk: '#8a5a2a', leaf: '#5f8a3a', leafL: '#7fa65a', leafLL: '#9ccf6e', rock: '#b8b8b8', rockD: '#8a8a8a', flowerY: '#f2c14e', flowerP: '#f28cb0', flowerW: '#ffffff' };
  let roomCache = null;
  function room() {
    if (roomCache) return roomCache;
    const W = 256, H = 128, k = 2;
    // 地面（土の小道）
    const ground = new Px(W * k, H * k, k);
    [[126, 102, 40, 15], [164, 98, 12, 7], [178, 91, 10, 6], [190, 82, 9, 6], [200, 72, 8, 5], [210, 62, 8, 5], [218, 51, 7, 5], [225, 40, 7, 5], [231, 29, 7, 5], [236, 16, 7, 8]]
      .forEach(([x, y, rx, ry]) => ground.ellipse(x, y, rx, ry, G.dirt));
    ground.outline(G.dirtD);
    [[112, 100], [130, 108], [140, 96], [120, 94], [166, 97], [207, 71]].forEach(([x, y]) => ground.set(x, y, G.dirtD));

    const ob = new Px(W * k, H * k, k);
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
    // 木（俯瞰なので樹冠が大きく、幹は短い）
    const tree = (cx, base) => {
      ob.rect(cx - 1, base - 6, 3, 6, G.trunk); ob.ellipse(cx, base - 13, 10, 9, G.leaf);
      ob.ellipse(cx - 2, base - 15, 7, 6, G.leafL); ob.ellipse(cx - 3, base - 17, 3, 2, G.leafLL);
    };
    tree(22, 30); tree(46, 22); tree(150, 20); tree(212, 24); tree(250, 62); tree(176, 122);
    // 茂み
    const bush = (cx, cy) => { ob.ellipse(cx, cy, 6, 3.5, G.leaf); ob.ellipse(cx - 1, cy - 1, 4, 2, G.leafL); ob.set(cx - 2, cy - 2, G.leafLL); };
    bush(12, 110); bush(84, 12); bush(250, 100); bush(180, 30); bush(8, 72); bush(122, 12); bush(76, 116);
    // 岩
    const rock = (cx, cy) => { ob.ellipse(cx, cy, 2, 1.2, G.rock); ob.set(cx - 1, cy + 1, G.rockD); ob.set(cx, cy + 1, G.rockD); };
    rock(100, 22); rock(190, 112); rock(6, 60);
    ob.outline(K.L);
    // 花（輪郭なし）
    const flower = (x, y, c) => { ob.set(x, y, c); ob.set(x - 1, y + 1, G.grassD); ob.set(x + 1, y + 1, G.grassD); ob.set(x, y + 1, G.grassD); };
    [[62, 16, G.flowerY], [140, 8, G.flowerP], [172, 14, G.flowerW], [104, 30, G.flowerY], [9, 48, G.flowerP], [7, 78, G.flowerY], [11, 96, G.flowerW],
     [116, 62, G.flowerY], [80, 100, G.flowerP], [92, 112, G.flowerY], [160, 112, G.flowerW], [178, 96, G.flowerY], [184, 50, G.flowerP], [186, 72, G.flowerY],
     [236, 92, G.flowerP], [200, 18, G.flowerY], [128, 36, G.flowerW], [70, 110, G.flowerY]].forEach(([x, y, c]) => flower(x, y, c));

    const t = (v) => v * k;
    roomCache = `<svg class="bg" viewBox="0 0 ${W * k} ${H * k}" width="1280" height="640" shape-rendering="crispEdges" preserveAspectRatio="none">
<defs><pattern id="hm-tuft" width="${t(16)}" height="${t(16)}" patternUnits="userSpaceOnUse"><rect x="${t(3)}" y="${t(4)}" width="${t(1)}" height="${t(1)}" fill="${G.grassD}"/><rect x="${t(4)}" y="${t(3)}" width="${t(1)}" height="${t(1)}" fill="${G.grassD}"/><rect x="${t(11)}" y="${t(10)}" width="${t(1)}" height="${t(1)}" fill="${G.grassD}"/><rect x="${t(12)}" y="${t(9)}" width="${t(1)}" height="${t(1)}" fill="${G.grassD}"/><rect x="${t(8)}" y="${t(13)}" width="${t(2)}" height="${t(1)}" fill="${G.grassL}"/><rect x="${t(14)}" y="${t(2)}" width="${t(1)}" height="${t(1)}" fill="${G.grassL}"/></pattern></defs>
<rect width="${W * k}" height="${H * k}" fill="${G.grass}"/><rect width="${W * k}" height="${H * k}" fill="url(#hm-tuft)"/>${ground.paths()}${ob.paths()}</svg>`;
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

  global.HamuArt = { hamster, item, bowl, room, ICONS, POSE_LIST: Object.keys(DRAW), Px, PX, ANCHOR_PX, HAM_W, ITEM_W, ITEM_H, BOWL_W, BOWL_H };
})(window);
