/* はむあつめ — 画面描画 */
(function (global) {
  'use strict';
  const D = global.HamuData;
  const A = global.HamuArt;

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const fmtDate = (ms) => { const d = new Date(ms); return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`; };
  const fmtTime = (ms) => { const d = new Date(ms); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  const fmtDur = (ms) => { const m = Math.round(ms / 60000); return m >= 60 ? `${Math.floor(m / 60)}時間${m % 60}分` : `${m}分`; };
  const costHtml = (cost) => {
    const parts = [];
    if (cost.seed) parts.push(`<span class="price">${A.ICONS.seed}${cost.seed.toLocaleString()}</span>`);
    if (cost.gold) parts.push(`<span class="price">${A.ICONS.gold}${cost.gold}</span>`);
    if (!parts.length) parts.push('<span class="price owned">むりょう</span>');
    return parts.join(' ');
  };
  const hamName = (state, h) => (state.album[h.id] && state.album[h.id].nick) || h.name;

  const NAV = [
    { id: 'room', name: 'おへや', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11 L12 4 L21 11"/><path d="M5 10 V20 H19 V10"/><rect x="10" y="14" width="4" height="6"/></svg>' },
    { id: 'zukan', name: 'はむ図鑑', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4 H11 V20 H4 Z"/><path d="M13 4 H20 V20 H13 Z"/><path d="M6 8 H9 M6 11 H9 M15 8 H18 M15 11 H18"/></svg>' },
    { id: 'shop', name: 'ショップ', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8 H20 L18 20 H6 Z"/><path d="M9 8 V6 A3 3 0 0 1 15 6 V8"/></svg>' },
    { id: 'food', name: 'えさ', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12 Q4 19 12 19 Q20 19 20 12 Z"/><ellipse cx="12" cy="12" rx="8" ry="2.5"/><path d="M9 10 L11 7 M13 7 L15 10"/></svg>' },
    { id: 'settings', name: 'せってい', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2 V5 M12 19 V22 M2 12 H5 M19 12 H22 M4.9 4.9 L7 7 M17 17 L19.1 19.1 M4.9 19.1 L7 17 M17 7 L19.1 4.9"/></svg>' },
  ];

  class UI {
    constructor(game) {
      this.game = game;
      this.screen = 'room';
      this.zukanTab = 'all';
      this.$screen = document.getElementById('screen');
      this.$nav = document.getElementById('nav');
      this.$wallet = document.getElementById('wallet');
      this.$logo = document.getElementById('logo');
      this.$toasts = document.getElementById('toasts');
      this.$modal = document.getElementById('modal-root');
      this.$logo.innerHTML = A.hamster({ colors: D.hamsterById.golden.colors, pose: 'front', size: 34 }) + '<span>はむあつめ</span>';
      this.renderNav();
      window.addEventListener('resize', () => this.fitStage());
      game.on((ev, payload) => this.onGameEvent(ev, payload));
    }

    onGameEvent(ev, p) {
      const s = this.game.state;
      if (ev === 'arrive') {
        const name = hamName(s, p.ham);
        this.toast(`${p.isNew ? '<b>はじめまして！</b> ' : ''}${esc(name)} が あそびにきました`, p.ham, p.v.pose);
      } else if (ev === 'leave') {
        const g = [`${A.ICONS.seed} ${p.seeds}`, p.gold ? `${A.ICONS.gold} ${p.gold}` : ''].filter(Boolean).join(' ');
        this.toast(`${esc(hamName(s, p.ham))} が かえりました。おみやげ ${g}`, p.ham, 'back', true);
      } else if (ev === 'offline') {
        const news = p.newHams.length ? `／はじめての子 ${p.newHams.length}匹` : '';
        this.toast(`るすのあいだに ${p.arrivals}匹 あそびにきました${news}。おみやげ ${A.ICONS.seed} ${p.seeds}${p.gold ? ` ${A.ICONS.gold} ${p.gold}` : ''}`, null, null, true, 7000);
      } else if (ev === 'reset') {
        this.screen = 'room';
      }
      this.render();
    }

    // ---- 共通 ----
    renderNav() {
      this.$nav.innerHTML = NAV.map((n) => `<button class="navbtn ${n.id === this.screen ? 'active' : ''}" data-nav="${n.id}">${n.icon}<span>${n.name}</span></button>`).join('');
      this.$nav.querySelectorAll('[data-nav]').forEach((b) => b.addEventListener('click', () => { this.screen = b.dataset.nav; this.render(); }));
    }
    renderWallet() {
      const s = this.game.state;
      this.$wallet.innerHTML = `<div class="coin">${A.ICONS.seed}${s.seeds.toLocaleString()}<small>ひまわりの種</small></div><div class="coin">${A.ICONS.gold}${s.gold}<small>金の種</small></div>`;
    }
    render() {
      this.renderWallet();
      this.renderNav();
      const fn = { room: this.renderRoom, zukan: this.renderZukan, shop: this.renderShop, food: this.renderFood, settings: this.renderSettings }[this.screen] || this.renderRoom;
      fn.call(this);
    }
    toast(html, ham, pose, info, ms) {
      const art = ham ? A.hamster({ colors: ham.colors, pose: pose || 'front', size: 40, accessory: ham.accessory, tail: ham.colors.tail }) : '';
      const t = el(`<div class="toast ${info ? 'info' : ''}">${art}<div>${html}</div></div>`);
      this.$toasts.appendChild(t);
      setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .4s'; setTimeout(() => t.remove(), 400); }, ms || 4200);
    }
    modal(html, opts) {
      this.closeModal();
      const bg = el(`<div class="modal-bg"><div class="modal" role="dialog" aria-modal="true"><button class="close" aria-label="とじる"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#7a4a1e" stroke-width="2.5" stroke-linecap="round"><path d="M6 6 L18 18 M18 6 L6 18"/></svg></button>${html}</div></div>`);
      bg.addEventListener('click', (e) => { if (e.target === bg) this.closeModal(); });
      bg.querySelector('.close').addEventListener('click', () => this.closeModal());
      this.$modal.appendChild(bg);
      if (opts && opts.setup) opts.setup(bg.querySelector('.modal'));
      return bg.querySelector('.modal');
    }
    closeModal() { this.$modal.innerHTML = ''; }
    confirm(text, okLabel, onOk, danger) {
      this.modal(`<h2>かくにん</h2><p style="margin:0">${text}</p><div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn" data-x>やめる</button><button class="btn ${danger ? 'danger' : 'primary'}" data-ok>${okLabel}</button></div>`, {
        setup: (m) => { m.querySelector('[data-x]').onclick = () => this.closeModal(); m.querySelector('[data-ok]').onclick = () => { this.closeModal(); onOk(); }; },
      });
    }

    // ---- おへや ----
    renderRoom() {
      const s = this.game.state;
      const food = D.foodById[s.food.id];
      const slotsHtml = D.SLOTS.map((sl) => {
        const itemId = s.slots[sl.id];
        const style = `left:${sl.x}px;top:${sl.y}px;width:${sl.w}px;height:${sl.h}px`;
        if (!itemId) {
          return `<div class="slot" style="${style}"><button class="slot-empty" style="width:${sl.w - 20}px;height:${sl.h - 60}px" data-slot="${sl.id}"><svg viewBox="0 0 24 24" width="28" height="28"><path d="M12 5 L12 19 M5 12 L19 12" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/></svg>グッズをおく</button></div>`;
        }
        const item = D.itemById[itemId];
        return `<div class="slot" style="${style}"><div class="slot-item" data-slot="${sl.id}" title="${esc(item.name)}">${A.item(itemId, sl.w, sl.h)}<div class="item-label">${esc(item.name)}</div></div></div>`;
      }).join('');
      const b = D.BOWL;
      const bowlHtml = `<div class="bowl-slot" style="left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px" data-bowl>${A.bowl(s.food.id, s.food.amount, b.w, b.h)}</div>`;
      const visitorsHtml = s.visitors.map((v) => {
        const h = D.hamsterById[v.hamId];
        let sl, anchor;
        if (v.slot === 'bowl') { sl = b; anchor = { x: 0.5, y: 0.5, s: 0.5 }; }
        else { sl = D.SLOTS.find((x) => x.id === v.slot); const item = D.itemById[s.slots[v.slot]]; if (!sl || !item) return ''; anchor = (v.seat === 1 && item.anchor2) || item.anchor; }
        const size = Math.round(sl.h * anchor.s);
        const x = sl.x + sl.w * anchor.x, y = sl.y + sl.h * anchor.y + size / 2;
        const isNew = s.album[h.id] && s.album[h.id].visits === 1;
        return `<div class="visitor ${isNew ? 'new' : ''}" style="left:${x}px;top:${y}px" data-ham="${h.id}">${A.hamster({ colors: h.colors, pose: v.pose, flip: v.flip, size, accessory: h.accessory, tail: h.colors.tail, className: 'hamu bob' })}<div class="name">${esc(hamName(s, h))}</div></div>`;
      }).join('');
      const left = this.game.foodTimeLeft();
      const hud = `<div class="hud"><div class="row"><span>えさ：${esc(food.name)}</span><span>のこり ${Math.round(s.food.amount)}%</span></div><div class="gauge"><div style="width:${Math.round(s.food.amount)}%"></div></div><div class="small">${s.food.amount > 0 ? `なくなるまで あと ${fmtDur(left)}` : 'えさがありません。えさタブで補充してね'}</div><button class="btn sm" data-goto="food">えさをえらぶ</button></div>`;
      this.$screen.innerHTML = `<div class="room-wrap" id="roomwrap"><div class="stage-inner"><div class="stage" id="stage">${A.room()}${slotsHtml}${bowlHtml}${visitorsHtml}${hud}<button class="btn stage-btn" data-log>おみやげ帳</button></div></div></div>
        <div class="page">${hud.replace('class="hud"', 'class="hud hud-mobile"')}<div class="muted">グッズをタップすると入れ替え、はむをタップすると詳細が見られます。えさがあるあいだ、時間がたつとハムスターが遊びに来ます（ブラウザを閉じていてもOK）。</div></div>`;
      this.fitStage();
      this.$screen.querySelectorAll('[data-slot]').forEach((e) => e.addEventListener('click', () => this.openPicker(e.dataset.slot)));
      this.$screen.querySelectorAll('[data-ham]').forEach((e) => e.addEventListener('click', (ev) => { ev.stopPropagation(); this.openDetail(e.dataset.ham); }));
      this.$screen.querySelectorAll('[data-goto]').forEach((e) => e.addEventListener('click', () => { this.screen = e.dataset.goto; this.render(); }));
      const bowl = this.$screen.querySelector('[data-bowl]'); if (bowl) bowl.addEventListener('click', () => { this.screen = 'food'; this.render(); });
      this.$screen.querySelector('[data-log]').addEventListener('click', () => this.openLog());
    }
    fitStage() {
      const wrap = document.getElementById('roomwrap'), stage = document.getElementById('stage');
      if (!wrap || !stage) return;
      const scale = Math.max(0.55, Math.min(1, wrap.clientWidth / 1280));
      stage.style.transform = `scale(${scale})`;
      const inner = stage.parentElement;
      inner.style.width = `${Math.round(1280 * scale)}px`;
      inner.style.height = `${Math.round(640 * scale)}px`;
    }
    openPicker(slotId) {
      const s = this.game.state;
      const cur = s.slots[slotId];
      const inv = Object.entries(s.inventory).filter(([, n]) => n > 0);
      const picks = inv.map(([id, n]) => { const it = D.itemById[id]; return it ? `<button class="pick" data-pick="${id}">${A.item(id, 90, 72)}<span>${esc(it.name)}</span><span class="cnt">もちもの ×${n}</span></button>` : ''; }).join('');
      const html = `<h2>グッズをおく</h2>${cur ? `<div class="muted">いま置いてあるもの：${esc(D.itemById[cur].name)}</div>` : ''}${picks ? `<div class="picker">${picks}</div>` : '<div class="muted">もちものがありません。ショップで買ってみよう。</div>'}<div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap">${cur ? '<button class="btn" data-remove>かたづける</button>' : ''}<button class="btn primary" data-shop>ショップへ</button></div>`;
      this.modal(html, { setup: (m) => {
        m.querySelectorAll('[data-pick]').forEach((b) => b.onclick = () => { this.game.placeItem(slotId, b.dataset.pick); this.closeModal(); });
        const r = m.querySelector('[data-remove]'); if (r) r.onclick = () => { this.game.removeItem(slotId); this.closeModal(); };
        m.querySelector('[data-shop]').onclick = () => { this.closeModal(); this.screen = 'shop'; this.render(); };
      } });
    }
    openLog() {
      const s = this.game.state;
      const rows = s.log.map((e) => {
        const h = D.hamsterById[e.hamId]; if (!h) return '';
        const art = A.hamster({ colors: h.colors, pose: e.type === 'leave' ? 'back' : 'front', size: 28, accessory: h.accessory, tail: h.colors.tail });
        const txt = e.type === 'arrive' ? `${esc(hamName(s, h))} が あそびにきた${e.isNew ? '（はじめまして！）' : ''}` : `${esc(hamName(s, h))} が かえった：${A.ICONS.seed}${e.seeds}${e.gold ? ` ${A.ICONS.gold}${e.gold}` : ''}`;
        return `<div class="entry">${art}<span>${txt}</span><time>${fmtTime(e.at)}</time></div>`;
      }).join('');
      this.modal(`<h2>おみやげ帳</h2><div class="log">${rows || '<div class="muted">まだ記録がありません。</div>'}</div>`);
    }

    // ---- 詳細 ----
    openDetail(hamId) {
      const s = this.game.state;
      const h = D.hamsterById[hamId]; if (!h) return;
      const a = s.album[hamId];
      const known = a && a.visits > 0;
      const visiting = s.visitors.find((v) => v.hamId === hamId);
      const pose = visiting ? visiting.pose : (known ? A.POSE_LIST[(a.visits + hamId.length) % A.POSE_LIST.length] : 'front');
      const group = D.GROUPS.find((g) => g.id === h.group);
      const stars = [1, 2, 3].map((i) => A.ICONS.star(i <= h.rarity)).join('');
      const likes = Object.entries(h.likes).sort((x, y) => y[1] - x[1]).map(([id]) => D.itemById[id]).filter(Boolean);
      const food = D.foodById[h.food];
      const portrait = A.hamster({ colors: h.colors, pose, size: 130, silhouette: !known, accessory: h.accessory, tail: h.colors.tail });
      const lv = this.game.friendship(hamId);
      let body;
      if (known) {
        body = `<div class="stats"><div class="stat"><span class="k">せいかく</span><span class="v">${esc(h.personality)}</span></div><div class="stat"><span class="k">なかよし度</span><span class="v">Lv.${lv}</span></div><div class="stat"><span class="k">きた回数</span><span class="v">${a.visits} 回</span></div><div class="stat"><span class="k">はじめて来た日</span><span class="v">${fmtDate(a.firstAt)}</span></div></div>
          <div><div class="section-label">すきなもの</div><div class="chips">${likes.map((it, i) => `<span class="chip ${i ? 'green' : ''}">${esc(it.name)}</span>`).join('')}<span class="chip blue">${esc(food.name)}</span></div></div>
          <div><div class="section-label">もらったおみやげ（合計）</div><div class="chips"><span class="chip">${A.ICONS.seed} ${a.seeds.toLocaleString()}</span>${a.gold ? `<span class="chip">${A.ICONS.gold} ${a.gold}</span>` : ''}</div></div>
          ${h.story ? `<div class="story">${esc(h.story)}</div>` : ''}
          <div><div class="section-label">なまえをつける（12文字まで）</div><div class="nickrow"><input type="text" maxlength="12" value="${esc(a.nick || '')}" placeholder="${esc(h.name)}" data-nick><button class="btn" data-savenick>ほぞん</button></div></div>`;
      } else {
        const hint = h.requires ? `「${esc(D.itemById[h.requires].name)}」を置くと来るかも…` : `${likes.length ? `「${esc(likes[0].name)}」が好きらしい。` : ''}${food ? `えさは「${esc(food.name)}」が好み。` : ''}`;
        body = `<div class="story">まだ会っていません。<br>${hint}</div>`;
      }
      const html = `<div class="chips"><span class="muted">No.${String(D.HAMSTERS.indexOf(h) + 1).padStart(2, '0')}</span><span class="pill ${h.group === 'rare' ? 'rare' : ''}">${esc(group.name)}</span>${visiting ? '<span class="pill" style="background:#e0803f">いまいる</span>' : ''}</div>
        <div class="detail-top"><div class="portrait">${portrait}</div><div class="info"><div class="nick">${known ? esc(hamName(s, h)) : '？？？'}</div><div class="species">${known ? esc(h.name) : '？？？'}</div><div class="stars"><span class="muted" style="margin-right:4px">レア度</span>${stars}</div></div></div>${body}`;
      this.modal(html, { setup: (m) => {
        const b = m.querySelector('[data-savenick]');
        if (b) b.onclick = () => { this.game.setNick(hamId, m.querySelector('[data-nick]').value); this.toast('なまえを ほぞんしました', h, 'front', true, 2000); this.closeModal(); };
      } });
    }

    // ---- 図鑑 ----
    renderZukan() {
      const s = this.game.state;
      const total = D.HAMSTERS.length, found = this.game.discoveredCount();
      const tabs = D.GROUPS.map((g) => `<button class="btn tab ${g.id === this.zukanTab ? 'active' : ''}" data-tab="${g.id}">${g.name}</button>`).join('');
      const list = D.HAMSTERS.filter((h) => this.zukanTab === 'all' || h.group === this.zukanTab);
      const cards = list.map((h) => {
        const a = s.album[h.id]; const known = a && a.visits > 0;
        const no = String(D.HAMSTERS.indexOf(h) + 1).padStart(2, '0');
        const pose = known ? A.POSE_LIST[(a.visits + h.id.length) % A.POSE_LIST.length] : 'front';
        const art = A.hamster({ colors: h.colors, pose, flip: h.id.length % 2 === 1, size: 88, silhouette: !known, accessory: h.accessory, tail: h.colors.tail });
        const group = D.GROUPS.find((g) => g.id === h.group);
        return `<button class="card ${known ? '' : 'unknown'} ${h.group === 'rare' ? 'rare' : ''}" data-ham="${h.id}"><span class="no">No.${no}</span>${h.group === 'rare' ? '<span class="rare-badge">レア</span>' : ''}<div class="art">${art}${known ? '' : '<div class="q">?</div>'}</div><div class="nm">${known ? esc(hamName(s, h)) : '？？？'}</div><div class="kind">${esc(group.name)}</div><div class="vis">${known ? `きた回数 ${a.visits}` : 'まだ会っていない'}</div></button>`;
      }).join('');
      this.$screen.innerHTML = `<div class="page"><div class="page-head"><div class="page-title">はむ図鑑</div><div class="progress"><span class="muted">あつめた はむ</span><span class="num">${found} <small>/ ${total}</small></span><div class="gauge"><div style="width:${Math.round(found / total * 100)}%"></div></div></div></div><div class="tabs">${tabs}</div><div class="grid">${cards}</div></div>`;
      this.$screen.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { this.zukanTab = b.dataset.tab; this.render(); }));
      this.$screen.querySelectorAll('[data-ham]').forEach((b) => b.addEventListener('click', () => this.openDetail(b.dataset.ham)));
    }

    // ---- ショップ ----
    renderShop() {
      const s = this.game.state;
      const rows = D.ITEMS.map((it) => {
        const owned = s.inventory[it.id] || 0;
        const placed = Object.values(s.slots).filter((x) => x === it.id).length;
        const can = this.game.canAfford(it.cost);
        const fans = D.HAMSTERS.filter((h) => h.likes[it.id] >= 3).length;
        return `<div class="rowcard"><div class="thumb">${A.item(it.id, 88, 70)}</div><div class="body"><div class="ttl">${esc(it.name)}</div><div class="desc">${esc(it.desc)}</div><div class="meta">${costHtml(it.cost)}${owned || placed ? `<span class="owned">もちもの ${owned}／おへや ${placed}</span>` : ''}<span class="muted">すきな子 ${fans}匹</span></div></div><div class="act"><button class="btn primary sm" data-buy="${it.id}" ${can ? '' : 'disabled'}>かう</button></div></div>`;
      }).join('');
      this.$screen.innerHTML = `<div class="page"><div class="page-head"><div class="page-title">ショップ</div><span class="muted">買ったグッズは「おへや」の空きスロットに置けます</span></div><div class="list">${rows}</div></div>`;
      this.$screen.querySelectorAll('[data-buy]').forEach((b) => b.addEventListener('click', () => {
        const it = D.itemById[b.dataset.buy];
        if (this.game.buyItem(it.id)) this.toast(`${esc(it.name)} を かいました`, null, null, true, 2000);
      }));
    }

    // ---- えさ ----
    renderFood() {
      const s = this.game.state;
      const rows = D.FOODS.map((f) => {
        const active = s.food.id === f.id;
        const can = this.game.canAfford(f.cost);
        const fans = D.HAMSTERS.filter((h) => h.food === f.id).length;
        return `<div class="rowcard ${active ? 'active' : ''}"><div class="thumb">${A.bowl(f.id, 100, 88, 70)}</div><div class="body"><div class="ttl">${esc(f.name)}${active ? ' <span class="pill">いま入っている</span>' : ''}</div><div class="desc">${esc(f.desc)}</div><div class="meta">${costHtml(f.cost)}<span class="muted">来やすさ ×${f.attract}／おみやげ ×${f.gift}／すきな子 ${fans}匹</span></div></div><div class="act"><button class="btn primary sm" data-food="${f.id}" ${can ? '' : 'disabled'}>${active ? 'おかわり' : 'いれる'}</button></div></div>`;
      }).join('');
      const cur = D.foodById[s.food.id];
      this.$screen.innerHTML = `<div class="page"><div class="page-head"><div class="page-title">えさ</div><span class="muted">えさ皿：${esc(cur.name)}　のこり ${Math.round(s.food.amount)}%（${s.food.amount > 0 ? 'あと ' + fmtDur(this.game.foodTimeLeft()) : 'からっぽ'}）</span></div><div class="list">${rows}</div></div>`;
      this.$screen.querySelectorAll('[data-food]').forEach((b) => b.addEventListener('click', () => {
        const f = D.foodById[b.dataset.food];
        if (this.game.setFood(f.id)) this.toast(`えさ皿に ${esc(f.name)} を いれました`, null, null, true, 2000);
      }));
    }

    // ---- せってい ----
    renderSettings() {
      const s = this.game.state;
      const speeds = [1, 10, 60].map((x) => `<button class="btn sm tab ${s.speed === x ? 'active' : ''}" data-speed="${x}">×${x}</button>`).join('');
      const poses = D.HAMSTERS.slice(0, 6).map((h, i) => A.hamster({ colors: h.colors, pose: A.POSE_LIST[i], size: 64, flip: i % 2 === 1, accessory: h.accessory })).join('');
      this.$screen.innerHTML = `<div class="page"><div class="page-title">せってい</div>
        <div class="settings-row"><span class="ttl">時間の速さ</span>${speeds}<span class="desc">ふつうは ×1（1分ごとに来訪チェック）。動作確認用に速くできます。</span></div>
        <div class="settings-row"><span class="ttl">セーブデータ</span><button class="btn sm" data-export>書き出す</button><button class="btn sm" data-import>読み込む</button><span class="desc">別のブラウザや端末に引っ越すときに使います。</span><textarea class="save" data-savetext placeholder="ここに書き出したデータが出ます／読み込むデータを貼ります"></textarea></div>
        <div class="settings-row"><span class="ttl">はじめから</span><button class="btn sm danger" data-reset>データを消す</button><span class="desc">図鑑・グッズ・種がすべて消えます。</span></div>
        <div class="settings-row"><span class="ttl">おまけ</span><div class="poses">${poses}</div><span class="desc">はむあつめ v0.1 ／ ハムスター ${D.HAMSTERS.length}種・グッズ ${D.ITEMS.length}種・えさ ${D.FOODS.length}種</span></div></div>`;
      this.$screen.querySelectorAll('[data-speed]').forEach((b) => b.addEventListener('click', () => this.game.setSpeed(Number(b.dataset.speed))));
      const ta = this.$screen.querySelector('[data-savetext]');
      this.$screen.querySelector('[data-export]').addEventListener('click', () => { ta.value = this.game.exportSave(); ta.select(); this.toast('セーブデータを書き出しました', null, null, true, 2000); });
      this.$screen.querySelector('[data-import]').addEventListener('click', () => {
        if (!ta.value.trim()) { this.toast('読み込むデータを貼ってください', null, null, true, 2000); return; }
        this.confirm('いまのデータを上書きして読み込みます。よろしいですか？', '読み込む', () => {
          try { this.game.importSave(ta.value); this.toast('読み込みました', null, null, true, 2000); } catch (e) { this.toast('読み込めませんでした（データが壊れています）', null, null, true, 3000); }
        });
      });
      this.$screen.querySelector('[data-reset]').addEventListener('click', () => this.confirm('本当にすべてのデータを消しますか？', '消す', () => { this.game.reset(); this.toast('はじめからスタート！', null, null, true, 2000); }, true));
    }

    // ---- はじめての案内 ----
    intro() {
      const html = `<h2>はむあつめへ ようこそ！</h2><div style="display:flex;justify-content:center">${A.hamster({ colors: D.hamsterById.djun_pudding.colors, pose: 'front', size: 110 })}</div>
        <div class="story">おへやに <b>えさ</b> と <b>グッズ</b> を置いておくと、時間がたつにつれてハムスターが遊びに来ます。<br>帰るときに <b>ひまわりの種</b> を置いていくので、それで新しいグッズを買って、<b>はむ図鑑</b> を埋めていきましょう。<br><br>最初のえさ皿にはひまわりの種が入っています。まずは「かじり木」をおへやの空きスロットに置いてみよう！</div>
        <button class="btn primary" data-ok>はじめる</button>`;
      this.modal(html, { setup: (m) => { m.querySelector('[data-ok]').onclick = () => { this.game.markIntro(); this.closeModal(); }; } });
    }
  }

  global.HamuUI = { UI };
})(window);
