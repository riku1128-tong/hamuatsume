/* はむあつめ — SVG 描画（ハムスター 6ポーズ × カラー、グッズ） */
(function (global) {
  'use strict';

  const DEF = { body: '#e0a565', belly: '#fff5e6', ear: '#f3c1b0', stripe: 'none', brow: 'none', eye: '#2b2320', nose: '#d98b8b', line: '#4a3b2f', spots: 'none', face: 'none' };
  const SIL = { body: '#cdc3b5', belly: '#cdc3b5', ear: '#cdc3b5', stripe: 'none', brow: 'none', eye: '#cdc3b5', nose: '#cdc3b5', line: '#b5a994', spots: 'none', face: 'none' };

  const st = (c, w) => `stroke="${c.line}" stroke-width="${w || 2.2}"`;

  // ---- 各ポーズ（viewBox 0 0 100 100、右向き基準） ----
  const POSES = {
    front(c) {
      return `
<circle cx="27" cy="31" r="10" fill="${c.body}" ${st(c)}/><circle cx="73" cy="31" r="10" fill="${c.body}" ${st(c)}/>
<circle cx="27" cy="31" r="4.5" fill="${c.ear}"/><circle cx="73" cy="31" r="4.5" fill="${c.ear}"/>
<path d="M50 22 C22 22 12 50 14 70 C16 92 84 92 86 70 C88 50 78 22 50 22 Z" fill="${c.body}" ${st(c)}/>
<path d="M45 24 Q50 21 55 24 L53 46 L47 46 Z" fill="${c.stripe}"/>
<ellipse cx="50" cy="75" rx="22" ry="14" fill="${c.belly}"/>
<circle cx="24" cy="60" r="7" fill="${c.spots}"/><circle cx="72" cy="78" r="6" fill="${c.spots}"/>
<ellipse cx="50" cy="50" rx="19" ry="12" fill="${c.face}"/>
<circle cx="37" cy="47" r="5.5" fill="${c.brow}"/><circle cx="63" cy="47" r="5.5" fill="${c.brow}"/>
<circle cx="38" cy="50" r="3" fill="${c.eye}"/><circle cx="62" cy="50" r="3" fill="${c.eye}"/>
<ellipse cx="50" cy="58" rx="2.6" ry="2" fill="${c.nose}"/>
<path d="M46 61 Q48 64 50 61 Q52 64 54 61" ${st(c, 1.6)} fill="none"/>
<path d="M30 58 L22 56 M30 61 L22 63 M70 58 L78 56 M70 61 L78 63" ${st(c, 1.2)}/>
<ellipse cx="40" cy="84" rx="7" ry="4" fill="${c.body}" ${st(c, 2)}/><ellipse cx="60" cy="84" rx="7" ry="4" fill="${c.body}" ${st(c, 2)}/>
<ellipse cx="27" cy="89" rx="8" ry="4" fill="${c.belly}" ${st(c, 2)}/><ellipse cx="73" cy="89" rx="8" ry="4" fill="${c.belly}" ${st(c, 2)}/>`;
    },
    side(c, tail) {
      return `
${tail ? `<path d="M18 66 Q6 70 4 80" ${st(c, 3)} fill="none"/>` : ''}
<circle cx="66" cy="32" r="9" fill="${c.body}" ${st(c)}/><circle cx="66" cy="32" r="4" fill="${c.ear}"/>
<path d="M18 62 C14 40 34 30 56 32 C76 34 90 44 88 62 C86 80 70 88 50 88 C30 88 20 80 18 62 Z" fill="${c.body}" ${st(c)}/>
<path d="M26 44 Q50 32 70 38" stroke="${c.stripe}" stroke-width="5" fill="none" stroke-linecap="round"/>
<ellipse cx="46" cy="77" rx="22" ry="7" fill="${c.belly}"/>
<circle cx="36" cy="52" r="7" fill="${c.spots}"/>
<ellipse cx="78" cy="52" rx="10" ry="9" fill="${c.face}"/>
<circle cx="72" cy="47" r="5.5" fill="${c.brow}"/>
<circle cx="73" cy="50" r="3" fill="${c.eye}"/>
<circle cx="88" cy="58" r="2.6" fill="${c.nose}"/>
<path d="M84 62 L78 66 M86 66 L80 70" ${st(c, 1.2)}/>
${tail ? '' : `<circle cx="17" cy="67" r="3.5" fill="${c.belly}" ${st(c, 2)}/>`}
<ellipse cx="34" cy="88" rx="8" ry="4" fill="${c.belly}" ${st(c, 2)}/><ellipse cx="64" cy="88" rx="8" ry="4" fill="${c.belly}" ${st(c, 2)}/>`;
    },
    back(c, tail) {
      return `
<circle cx="29" cy="30" r="10" fill="${c.body}" ${st(c)}/><circle cx="71" cy="30" r="10" fill="${c.body}" ${st(c)}/>
<path d="M50 22 C20 22 12 50 14 70 C16 92 84 92 86 70 C88 50 80 22 50 22 Z" fill="${c.body}" ${st(c)}/>
<path d="M46 25 Q50 22 54 25 L56 80 Q50 84 44 80 Z" fill="${c.stripe}"/>
<circle cx="30" cy="55" r="7" fill="${c.spots}"/><circle cx="68" cy="72" r="6" fill="${c.spots}"/>
${tail ? `<path d="M50 88 Q54 98 62 98" ${st(c, 3)} fill="none"/>` : `<circle cx="50" cy="90" r="4" fill="${c.belly}" ${st(c, 2)}/>`}
<ellipse cx="29" cy="90" rx="8" ry="4" fill="${c.belly}" ${st(c, 2)}/><ellipse cx="71" cy="90" rx="8" ry="4" fill="${c.belly}" ${st(c, 2)}/>`;
    },
    sleep(c) {
      return `
<circle cx="30" cy="42" r="9" fill="${c.body}" ${st(c)}/><circle cx="30" cy="42" r="4" fill="${c.ear}"/>
<circle cx="50" cy="60" r="34" fill="${c.body}" ${st(c)}/>
<path d="M26 38 Q50 22 76 40" stroke="${c.stripe}" stroke-width="5" fill="none" stroke-linecap="round"/>
<ellipse cx="60" cy="74" rx="18" ry="10" fill="${c.belly}"/>
<circle cx="66" cy="44" r="7" fill="${c.spots}"/>
<circle cx="38" cy="58" r="5.5" fill="${c.brow}"/>
<path d="M34 60 Q39 64 44 60" ${st(c, 2)} fill="none"/>
<circle cx="21" cy="70" r="2.6" fill="${c.nose}"/>
<circle cx="82" cy="80" r="3.5" fill="${c.belly}" ${st(c, 2)}/>
<text x="80" y="30" font-size="14" font-weight="700" fill="${c.line}" font-family="sans-serif">z</text><text x="88" y="18" font-size="10" font-weight="700" fill="${c.line}" font-family="sans-serif">z</text>`;
    },
    eat(c) {
      return `
<circle cx="31" cy="23" r="9" fill="${c.body}" ${st(c)}/><circle cx="69" cy="23" r="9" fill="${c.body}" ${st(c)}/>
<circle cx="31" cy="23" r="4" fill="${c.ear}"/><circle cx="69" cy="23" r="4" fill="${c.ear}"/>
<path d="M50 16 C30 16 26 32 26 42 C18 48 16 78 26 88 C34 96 66 96 74 88 C84 78 82 48 74 42 C74 32 70 16 50 16 Z" fill="${c.body}" ${st(c)}/>
<path d="M47 18 Q50 15 53 18 L55 86 Q50 89 45 86 Z" fill="${c.stripe}"/>
<circle cx="32" cy="64" r="6" fill="${c.spots}"/><circle cx="68" cy="76" r="6" fill="${c.spots}"/>
<circle cx="35" cy="34" r="5.5" fill="${c.brow}"/><circle cx="65" cy="34" r="5.5" fill="${c.brow}"/>
<circle cx="34" cy="37" r="3" fill="${c.eye}"/><circle cx="66" cy="37" r="3" fill="${c.eye}"/>
<ellipse cx="50" cy="20" rx="3" ry="2.2" fill="${c.nose}"/>
<ellipse cx="50" cy="50" rx="5" ry="10" fill="#6b4a2a" ${st(c, 1.6)}/>
<circle cx="43" cy="52" r="5" fill="${c.body}" ${st(c, 2)}/><circle cx="57" cy="52" r="5" fill="${c.body}" ${st(c, 2)}/>
<ellipse cx="36" cy="92" rx="7" ry="4" fill="${c.belly}" ${st(c, 2)}/><ellipse cx="64" cy="92" rx="7" ry="4" fill="${c.belly}" ${st(c, 2)}/>`;
    },
    belly(c) {
      return `
<circle cx="18" cy="42" r="9" fill="${c.body}" ${st(c)}/><circle cx="18" cy="42" r="4" fill="${c.ear}"/>
<circle cx="18" cy="70" r="9" fill="${c.body}" ${st(c)}/><circle cx="18" cy="70" r="4" fill="${c.ear}"/>
<path d="M14 56 C14 36 40 30 60 34 C80 38 92 48 90 60 C88 74 76 84 58 84 C40 84 14 78 14 56 Z" fill="${c.body}" ${st(c)}/>
<ellipse cx="60" cy="58" rx="24" ry="16" fill="${c.belly}"/>
<circle cx="31" cy="50" r="5.5" fill="${c.brow}"/><circle cx="31" cy="64" r="5.5" fill="${c.brow}"/>
<circle cx="30" cy="51" r="3" fill="${c.eye}"/><circle cx="30" cy="63" r="3" fill="${c.eye}"/>
<circle cx="21" cy="57" r="2.4" fill="${c.nose}"/>
<ellipse cx="46" cy="44" rx="6" ry="4" fill="${c.body}" ${st(c, 2)}/><ellipse cx="46" cy="72" rx="6" ry="4" fill="${c.body}" ${st(c, 2)}/>
<ellipse cx="78" cy="44" rx="8" ry="4" fill="${c.belly}" ${st(c, 2)}/><ellipse cx="78" cy="74" rx="8" ry="4" fill="${c.belly}" ${st(c, 2)}/>
<circle cx="91" cy="60" r="3.5" fill="${c.belly}" ${st(c, 2)}/>`;
    },
  };

  // ---- アクセサリー（レアはむ） ----
  // 頭の位置はポーズで違うので、ポーズごとに置く座標を持つ
  const HEAD = {
    front: { x: 50, y: 24 }, side: { x: 66, y: 30 }, back: { x: 50, y: 22 },
    sleep: { x: 34, y: 38 }, eat: { x: 50, y: 18 }, belly: { x: 18, y: 56 },
  };
  const ACC = {
    crown(h, c) { return `<path d="M${h.x - 12} ${h.y + 2} L${h.x - 12} ${h.y - 10} L${h.x - 6} ${h.y - 4} L${h.x} ${h.y - 12} L${h.x + 6} ${h.y - 4} L${h.x + 12} ${h.y - 10} L${h.x + 12} ${h.y + 2} Z" fill="#f2c14e" ${st(c, 1.8)}/>`; },
    halo(h, c) { return `<ellipse cx="${h.x}" cy="${h.y - 12}" rx="13" ry="4" fill="none" stroke="#f2c14e" stroke-width="3"/>`; },
    headband(h, c) { return `<path d="M${h.x - 16} ${h.y + 4} L${h.x + 16} ${h.y + 4}" stroke="#c9302c" stroke-width="5" stroke-linecap="round"/><path d="M${h.x + 14} ${h.y + 4} L${h.x + 24} ${h.y - 2} M${h.x + 14} ${h.y + 4} L${h.x + 24} ${h.y + 8}" stroke="#c9302c" stroke-width="3" stroke-linecap="round"/>`; },
    towel(h, c) { return `<path d="M${h.x - 14} ${h.y + 2} Q${h.x} ${h.y - 14} ${h.x + 14} ${h.y + 2} Z" fill="#ffffff" ${st(c, 1.8)}/><path d="M${h.x - 10} ${h.y - 1} L${h.x + 10} ${h.y - 1}" stroke="#7fb0c9" stroke-width="2"/>`; },
    bucket(h, c) { return `<path d="M${h.x - 10} ${h.y - 12} L${h.x + 10} ${h.y - 12} L${h.x + 8} ${h.y + 2} L${h.x - 8} ${h.y + 2} Z" fill="#c9302c" ${st(c, 1.8)}/>`; },
    beard(h, c) { return `<path d="M${h.x - 8} ${h.y + 38} Q${h.x} ${h.y + 60} ${h.x + 8} ${h.y + 38} Z" fill="#ffffff" ${st(c, 1.6)}/><path d="M${h.x - 12} ${h.y - 2} L${h.x + 12} ${h.y - 2} L${h.x} ${h.y - 18} Z" fill="#f2c14e" ${st(c, 1.8)}/>`; },
  };

  /**
   * ハムスターのSVG文字列を返す
   * @param {object} opts { colors, pose, flip, size, silhouette, accessory, tail, className }
   */
  function hamster(opts) {
    const pose = POSES[opts.pose] ? opts.pose : 'front';
    const c = Object.assign({}, DEF, opts.silhouette ? SIL : (opts.colors || {}));
    if (opts.silhouette) { c.stripe = 'none'; c.brow = 'none'; c.spots = 'none'; c.face = 'none'; }
    const size = opts.size || 100;
    const flip = opts.flip ? 'transform="translate(100 0) scale(-1 1)"' : '';
    let acc = '';
    if (opts.accessory && ACC[opts.accessory] && !opts.silhouette) acc = ACC[opts.accessory](HEAD[pose], c);
    return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" class="${opts.className || 'hamu'}" style="overflow:visible" stroke-linejoin="round" stroke-linecap="round"><g ${flip}>${POSES[pose](c, !!opts.tail)}${acc}</g></svg>`;
  }

  // ---- グッズ ----
  // すべて viewBox 0 0 200 160
  const ITEM_ART = {
    wheel: `<ellipse cx="100" cy="150" rx="70" ry="8" fill="#d8c39a" opacity=".6"/><path d="M50 150 L100 90 L150 150" stroke="#8fb7c9" stroke-width="10" fill="none" stroke-linecap="round"/><circle cx="100" cy="82" r="66" fill="#e9f3f7" stroke="#7fb0c9" stroke-width="10"/><g stroke="#a9cfe0" stroke-width="5"><line x1="100" y1="16" x2="100" y2="148"/><line x1="34" y1="82" x2="166" y2="82"/><line x1="53" y1="35" x2="147" y2="129"/><line x1="147" y1="35" x2="53" y2="129"/></g><circle cx="100" cy="82" r="12" fill="#7fb0c9"/>`,
    house: `<ellipse cx="100" cy="150" rx="86" ry="9" fill="#d8c39a" opacity=".6"/><path d="M18 82 L100 18 L182 82 Z" fill="#d98b6a" stroke="#a65b3d" stroke-width="6" stroke-linejoin="round"/><rect x="32" y="80" width="136" height="70" fill="#f0c58f" stroke="#a65b3d" stroke-width="6"/><ellipse cx="100" cy="120" rx="26" ry="28" fill="#4a3324"/><rect x="42" y="92" width="18" height="4" fill="#d9a35a"/><rect x="42" y="104" width="28" height="4" fill="#d9a35a"/>`,
    tunnel: `<ellipse cx="100" cy="150" rx="95" ry="8" fill="#d8c39a" opacity=".6"/><path d="M14 140 L14 96 A86 56 0 0 1 186 96 L186 140" fill="#b6d788" stroke="#6f9a47" stroke-width="7" stroke-linejoin="round"/><ellipse cx="14" cy="120" rx="14" ry="22" fill="#3f5a2a" stroke="#6f9a47" stroke-width="5"/><ellipse cx="186" cy="120" rx="14" ry="22" fill="#3f5a2a" stroke="#6f9a47" stroke-width="5"/><g stroke="#8fbf62" stroke-width="4" fill="none"><path d="M54 140 A66 56 0 0 1 62 62"/><path d="M100 140 L100 46"/><path d="M146 140 A66 56 0 0 0 138 62"/></g>`,
    sand: `<path d="M10 70 Q10 44 36 44 L164 44 Q190 44 190 70 L190 120 Q190 136 174 136 L26 136 Q10 136 10 120 Z" fill="#f2e2c4" stroke="#c9a06a" stroke-width="6"/><ellipse cx="100" cy="90" rx="74" ry="24" fill="#e8d3a6"/><g fill="#d9bf8c"><circle cx="56" cy="92" r="4"/><circle cx="140" cy="84" r="4"/><circle cx="112" cy="102" r="3"/></g>`,
    box: `<ellipse cx="100" cy="150" rx="80" ry="8" fill="#d8c39a" opacity=".6"/><path d="M30 60 L100 40 L170 60 L170 140 L30 140 Z" fill="#d9b483" stroke="#a5804f" stroke-width="6" stroke-linejoin="round"/><path d="M30 60 L100 80 L170 60 M100 80 L100 140" stroke="#a5804f" stroke-width="5" fill="none"/><ellipse cx="65" cy="112" rx="18" ry="20" fill="#4a3324"/>`,
    chew: `<ellipse cx="100" cy="150" rx="70" ry="8" fill="#d8c39a" opacity=".6"/><path d="M40 120 L150 60" stroke="#a5804f" stroke-width="22" stroke-linecap="round"/><path d="M40 120 L150 60" stroke="#d9b483" stroke-width="14" stroke-linecap="round"/><path d="M70 104 L80 98 M100 88 L110 82 M128 72 L138 66" stroke="#a5804f" stroke-width="3"/><path d="M150 60 L170 40" stroke="#7fa65a" stroke-width="8" stroke-linecap="round"/><ellipse cx="172" cy="34" rx="12" ry="7" fill="#9ccf6e" stroke="#6f9a47" stroke-width="3" transform="rotate(-30 172 34)"/>`,
    bed: `<ellipse cx="100" cy="146" rx="90" ry="10" fill="#d8c39a" opacity=".6"/><path d="M20 120 Q20 60 100 60 Q180 60 180 120 Q180 140 160 140 L40 140 Q20 140 20 120 Z" fill="#f6c9d4" stroke="#c98a9a" stroke-width="6"/><ellipse cx="100" cy="100" rx="60" ry="26" fill="#fbe3ea"/>`,
    hammock: `<path d="M20 30 L50 90 M180 30 L150 90" stroke="#a5804f" stroke-width="6" stroke-linecap="round"/><circle cx="20" cy="30" r="8" fill="#d9b483" stroke="#a5804f" stroke-width="4"/><circle cx="180" cy="30" r="8" fill="#d9b483" stroke="#a5804f" stroke-width="4"/><path d="M50 90 Q100 140 150 90 L150 100 Q100 150 50 100 Z" fill="#9ccf6e" stroke="#6f9a47" stroke-width="5"/><path d="M60 98 Q100 136 140 98" stroke="#b6d788" stroke-width="4" fill="none"/>`,
    cabbage: `<path d="M30 90 L170 90 L160 150 L40 150 Z" fill="#c98a5a" stroke="#8a5a2a" stroke-width="6" stroke-linejoin="round"/><rect x="24" y="80" width="152" height="16" rx="6" fill="#d9a35a" stroke="#8a5a2a" stroke-width="5"/><g stroke="#4f8a2f" stroke-width="4"><circle cx="70" cy="66" r="24" fill="#9ccf6e"/><circle cx="130" cy="62" r="26" fill="#9ccf6e"/><path d="M60 58 Q70 48 82 58 M118 54 Q130 42 144 56" fill="none"/></g>`,
    seesaw: `<ellipse cx="100" cy="150" rx="90" ry="8" fill="#d8c39a" opacity=".6"/><path d="M80 140 L100 100 L120 140 Z" fill="#d9b483" stroke="#a5804f" stroke-width="6" stroke-linejoin="round"/><path d="M20 112 L180 88" stroke="#e0803f" stroke-width="12" stroke-linecap="round"/><circle cx="100" cy="100" r="8" fill="#7a4a1e"/>`,
    sunflower: `<path d="M100 150 L100 70" stroke="#4f8a2f" stroke-width="8"/><path d="M100 120 Q70 110 66 90 Q92 96 100 120 Z" fill="#7fa65a" stroke="#4f8a2f" stroke-width="3"/><path d="M100 100 Q130 92 136 70 Q108 76 100 100 Z" fill="#7fa65a" stroke="#4f8a2f" stroke-width="3"/><g fill="#f2c14e" stroke="#d9a012" stroke-width="2">${[0,45,90,135,180,225,270,315].map(a=>`<ellipse cx="100" cy="24" rx="8" ry="20" transform="rotate(${a} 100 52)"/>`).join('')}</g><circle cx="100" cy="52" r="18" fill="#6b4a2a" stroke="#4a3324" stroke-width="3"/><path d="M60 150 Q60 130 80 130 L120 130 Q140 130 140 150 Z" fill="#c98a5a" stroke="#8a5a2a" stroke-width="5"/>`,
    treasure: `<ellipse cx="100" cy="150" rx="80" ry="8" fill="#d8c39a" opacity=".6"/><rect x="30" y="80" width="140" height="66" rx="6" fill="#a65b3d" stroke="#5a2f1a" stroke-width="6"/><path d="M30 80 Q30 46 100 46 Q170 46 170 80 Z" fill="#c9764f" stroke="#5a2f1a" stroke-width="6"/><rect x="88" y="74" width="24" height="24" rx="4" fill="#f2c14e" stroke="#5a2f1a" stroke-width="4"/><path d="M40 80 L160 80" stroke="#f2c14e" stroke-width="4"/>`,
    onsen: `<ellipse cx="100" cy="150" rx="90" ry="8" fill="#d8c39a" opacity=".6"/><path d="M24 70 L176 70 L168 140 L32 140 Z" fill="#d9b483" stroke="#a5804f" stroke-width="6" stroke-linejoin="round"/><ellipse cx="100" cy="70" rx="76" ry="16" fill="#bfe3f2" stroke="#a5804f" stroke-width="6"/><g stroke="#ffffff" stroke-width="4" fill="none" opacity=".9"><path d="M70 50 Q64 40 70 30 Q76 20 70 10"/><path d="M100 46 Q94 36 100 26 Q106 16 100 6"/><path d="M130 50 Q124 40 130 30 Q136 20 130 10"/></g>`,
    ice: `<ellipse cx="100" cy="146" rx="90" ry="10" fill="#d8c39a" opacity=".6"/><path d="M24 120 L40 70 L160 70 L176 120 Q176 140 156 140 L44 140 Q24 140 24 120 Z" fill="#dff3fb" stroke="#7fb0c9" stroke-width="6" stroke-linejoin="round"/><path d="M60 80 L70 110 M100 78 L100 110 M140 80 L130 110" stroke="#bfe3f2" stroke-width="5" stroke-linecap="round"/><path d="M30 60 L44 44 M170 60 L156 44" stroke="#bfe3f2" stroke-width="4" stroke-linecap="round"/>`,
    castle: `<ellipse cx="100" cy="152" rx="92" ry="8" fill="#d8c39a" opacity=".6"/><rect x="30" y="70" width="140" height="80" fill="#f3e3c4" stroke="#a5804f" stroke-width="6"/><rect x="20" y="30" width="34" height="120" fill="#f3e3c4" stroke="#a5804f" stroke-width="6"/><rect x="146" y="30" width="34" height="120" fill="#f3e3c4" stroke="#a5804f" stroke-width="6"/><path d="M20 30 L37 10 L54 30 Z M146 30 L163 10 L180 30 Z" fill="#e0803f" stroke="#a5804f" stroke-width="5" stroke-linejoin="round"/><path d="M60 70 L60 56 L74 56 L74 70 M88 70 L88 56 L112 56 L112 70 M126 70 L126 56 L140 56 L140 70" fill="#f3e3c4" stroke="#a5804f" stroke-width="5"/><path d="M84 150 L84 112 Q100 96 116 112 L116 150" fill="#4a3324"/><path d="M100 10 L100 -6 L118 0 L100 6" fill="#c9302c"/>`,
    dojo: `<ellipse cx="100" cy="152" rx="92" ry="8" fill="#d8c39a" opacity=".6"/><path d="M10 60 L100 14 L190 60 Z" fill="#4a3b2f" stroke="#2b2320" stroke-width="6" stroke-linejoin="round"/><rect x="32" y="58" width="136" height="92" fill="#e9dcc3" stroke="#4a3b2f" stroke-width="6"/><path d="M32 100 L168 100 M100 58 L100 150 M66 58 L66 150 M134 58 L134 150" stroke="#4a3b2f" stroke-width="4"/><rect x="82" y="108" width="36" height="42" fill="#2b2320"/><circle cx="150" cy="80" r="10" fill="#c9302c"/>`,
    bowl: `<ellipse cx="100" cy="146" rx="84" ry="10" fill="#d8c39a" opacity=".6"/><path d="M18 74 Q18 130 100 130 Q182 130 182 74 Z" fill="#e8825a" stroke="#b34f2b" stroke-width="6"/><ellipse cx="100" cy="74" rx="80" ry="22" fill="#f6a785" stroke="#b34f2b" stroke-width="6"/>`,
  };
  const FOOD_ART = {
    seed: `<g fill="#6b4a2a" stroke="#3d2914" stroke-width="1">${[[70,72,-30],[100,68,10],[128,74,40],[86,82,70],[116,84,-60]].map(([x,y,r])=>`<ellipse cx="${x}" cy="${y}" rx="5" ry="10" transform="rotate(${r} ${x} ${y})"/>`).join('')}</g>`,
    mix: `<g stroke="#3d2914" stroke-width="1"><ellipse cx="70" cy="72" rx="5" ry="10" fill="#6b4a2a" transform="rotate(-30 70 72)"/><circle cx="100" cy="70" r="7" fill="#e0b060"/><circle cx="126" cy="76" r="6" fill="#9ccf6e"/><ellipse cx="88" cy="84" rx="8" ry="5" fill="#d9a35a"/><circle cx="114" cy="86" r="5" fill="#c98a5a"/></g>`,
    pellet: `<g fill="#9a7a4a" stroke="#5a3a1a" stroke-width="1">${[[70,74],[92,68],[114,72],[132,80],[84,86],[108,88]].map(([x,y])=>`<rect x="${x-7}" y="${y-5}" width="14" height="10" rx="4"/>`).join('')}</g>`,
    worm: `<g fill="#e8c27a" stroke="#a5804f" stroke-width="1.5"><path d="M64 78 Q80 62 96 78 Q112 94 128 78" fill="none" stroke-width="7"/><path d="M76 90 Q92 74 108 90 Q124 106 140 90" fill="none" stroke-width="7"/></g>`,
    cheese: `<path d="M60 90 L140 66 L140 96 L60 96 Z" fill="#f2c14e" stroke="#c9a012" stroke-width="3" stroke-linejoin="round"/><circle cx="90" cy="86" r="4" fill="#d9a012"/><circle cx="118" cy="80" r="3" fill="#d9a012"/>`,
    goldseed: `<g fill="#f2c14e" stroke="#b8860b" stroke-width="1">${[[70,72,-30],[100,68,10],[128,74,40],[86,82,70],[116,84,-60]].map(([x,y,r])=>`<ellipse cx="${x}" cy="${y}" rx="5" ry="10" transform="rotate(${r} ${x} ${y})"/>`).join('')}</g>`,
  };

  function item(id, w, h, extra) {
    return `<svg viewBox="0 0 200 160" width="${w}" height="${h}" class="item-art" style="overflow:visible">${ITEM_ART[id] || ''}${extra || ''}</svg>`;
  }
  function bowl(foodId, amount, w, h) {
    const food = amount > 0 ? (FOOD_ART[foodId] || FOOD_ART.seed) : '';
    const scale = amount > 0 ? 0.5 + 0.5 * Math.min(1, amount / 100) : 0;
    const foodG = amount > 0 ? `<g transform="translate(100 78) scale(${scale.toFixed(2)}) translate(-100 -78)">${food}</g>` : '';
    return `<svg viewBox="0 0 200 160" width="${w}" height="${h}" class="item-art" style="overflow:visible">${ITEM_ART.bowl}${foodG}</svg>`;
  }
  const ICONS = {
    seed: `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 2 C16 6 17 12 12 22 C7 12 8 6 12 2Z" fill="#6b4a2a" stroke="#3d2914" stroke-width="1.2"/><path d="M12 5 L12 19" stroke="#c9a47a" stroke-width="1"/></svg>`,
    gold: `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 2 C16 6 17 12 12 22 C7 12 8 6 12 2Z" fill="#f2c14e" stroke="#b8860b" stroke-width="1.2"/></svg>`,
    star: (on) => `<svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 3 L14.5 9 L21 9.5 L16 13.5 L17.5 20 L12 16.5 L6.5 20 L8 13.5 L3 9.5 L9.5 9 Z" fill="${on ? '#f2c14e' : '#e6d6b4'}"/></svg>`,
  };

  global.HamuArt = { hamster, item, bowl, ICONS, POSE_LIST: Object.keys(POSES) };
})(window);
