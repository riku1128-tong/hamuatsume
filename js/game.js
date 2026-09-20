/* はむあつめ — ゲーム状態・来訪シミュレーション・セーブ */
(function (global) {
  'use strict';
  const D = global.HamuData;
  const SAVE_KEY = 'hamuatsume.save.v1';
  const TICK_MS = 60 * 1000;          // 1 tick = 1分（実時間）
  const MAX_OFFLINE_TICKS = 24 * 60;  // 留守中の進行は最大24時間ぶん
  const RARITY_WEIGHT = { 1: 1.0, 2: 0.45, 3: 0.16 };
  const RARITY_GIFT = { 1: 1.0, 2: 1.5, 3: 2.5 };

  const rnd = (a, b) => a + Math.random() * (b - a);
  const irnd = (a, b) => Math.floor(rnd(a, b + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function newState() {
    return {
      v: 1,
      seeds: 200, gold: 0,
      inventory: { chew: 1 },
      slots: { s1: null, s2: 'box', s3: null, s4: null, s5: null, s6: null },
      food: { id: 'seed', amount: 100 },
      visitors: [],
      album: {},
      log: [],
      tick: 0,
      lastTick: Date.now(),
      speed: 1,
      createdAt: Date.now(),
      seenIntro: false,
    };
  }

  class Game {
    constructor() {
      this.state = null;
      this.listeners = [];
      this.timer = null;
    }
    on(fn) { this.listeners.push(fn); }
    emit(ev, payload) { this.listeners.forEach((fn) => fn(ev, payload, this.state)); }

    // ---- セーブ ----
    load() {
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (raw) {
          const s = JSON.parse(raw);
          this.state = Object.assign(newState(), s);
          // 定義から消えたグッズ・はむを掃除
          for (const k of Object.keys(this.state.slots)) if (this.state.slots[k] && !D.itemById[this.state.slots[k]]) this.state.slots[k] = null;
          this.state.visitors = this.state.visitors.filter((v) => D.hamsterById[v.hamId]);
          return true;
        }
      } catch (e) { console.warn('save load failed', e); }
      this.state = newState();
      return false;
    }
    save() {
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.state)); } catch (e) { console.warn('save failed', e); }
    }
    reset() { this.state = newState(); this.save(); this.emit('reset'); }
    exportSave() { return btoa(unescape(encodeURIComponent(JSON.stringify(this.state)))); }
    importSave(text) {
      const s = JSON.parse(decodeURIComponent(escape(atob(text.trim()))));
      if (!s || typeof s.seeds !== 'number') throw new Error('bad save');
      this.state = Object.assign(newState(), s);
      this.save(); this.emit('reset');
    }

    // ---- 起動・ループ ----
    start() {
      const s = this.state;
      const tickMs = TICK_MS / (s.speed || 1);
      const elapsed = Math.floor((Date.now() - s.lastTick) / tickMs);
      if (elapsed > 0) {
        const n = Math.min(elapsed, MAX_OFFLINE_TICKS);
        const summary = { arrivals: 0, leaves: 0, seeds: 0, gold: 0, newHams: [] };
        for (let i = 0; i < n; i++) this.tick(summary);
        s.lastTick = Date.now();
        this.save();
        if (summary.arrivals || summary.leaves) this.emit('offline', summary);
      }
      this.timer = setInterval(() => this.pump(), 1000);
      this.emit('change');
    }
    pump() {
      const s = this.state;
      const tickMs = TICK_MS / (s.speed || 1);
      let changed = false;
      while (Date.now() - s.lastTick >= tickMs) {
        s.lastTick += tickMs;
        this.tick(null);
        changed = true;
      }
      if (changed) { this.save(); this.emit('change'); }
    }
    setSpeed(x) { this.state.speed = x; this.state.lastTick = Date.now(); this.save(); this.emit('change'); }

    // ---- 1 tick の処理 ----
    tick(summary) {
      const s = this.state;
      s.tick++;
      const food = D.foodById[s.food.id] || D.foodById.seed;
      // えさが減る
      if (s.food.amount > 0) {
        const eaters = s.visitors.length;
        s.food.amount = Math.max(0, s.food.amount - (100 / food.duration) - 0.15 * eaters);
      }
      // 帰る
      const staying = [];
      for (const v of s.visitors) {
        if (s.tick >= v.leaveAt || (s.food.amount <= 0 && Math.random() < 0.35)) this.leave(v, food, summary);
        else staying.push(v);
      }
      s.visitors = staying;
      // 来る（えさがある時だけ）
      if (s.food.amount <= 0) return;
      const seats = this.freeSeats();
      for (const seat of seats) {
        const p = 0.07 * food.attract * (seat.item ? 1 : 0.6);
        if (Math.random() < p) {
          const ham = this.chooseHamster(seat.item, food);
          if (ham) this.arrive(ham, seat, summary);
        }
      }
    }
    freeSeats() {
      const s = this.state;
      const seats = [];
      const taken = (slot, seat) => s.visitors.some((v) => v.slot === slot && v.seat === seat);
      for (const slot of D.SLOTS) {
        const itemId = s.slots[slot.id];
        if (!itemId) continue;
        const item = D.itemById[itemId];
        const cap = item.capacity || 1;
        for (let i = 0; i < cap; i++) if (!taken(slot.id, i)) seats.push({ slot: slot.id, seat: i, item });
      }
      if (!taken('bowl', 0)) seats.push({ slot: 'bowl', seat: 0, item: null });
      return seats;
    }
    chooseHamster(item, food) {
      const s = this.state;
      const here = new Set(s.visitors.map((v) => v.hamId));
      const cands = [];
      for (const h of D.HAMSTERS) {
        if (here.has(h.id)) continue;
        if (h.requires && (!item || item.id !== h.requires)) continue;
        let w;
        if (item) { w = h.likes[item.id] || 0.25; } else { w = h.requires ? 0 : 0.6; }
        if (w <= 0) continue;
        w *= RARITY_WEIGHT[h.rarity];
        if (h.rarity === 3) w *= food.rare;
        if (h.food === food.id) w *= 2.2;
        cands.push([h, w]);
      }
      const total = cands.reduce((a, c) => a + c[1], 0);
      if (total <= 0) return null;
      let r = Math.random() * total;
      for (const [h, w] of cands) { r -= w; if (r <= 0) return h; }
      return cands[cands.length - 1][0];
    }
    arrive(ham, seat, summary) {
      const s = this.state;
      const item = seat.item;
      let pose = item ? item.pose : 'eat';
      const flip = item && item.flip ? Math.random() < 0.5 : (Math.random() < 0.3);
      const v = { hamId: ham.id, slot: seat.slot, seat: seat.seat, pose, flip, arrivedAt: s.tick, leaveAt: s.tick + irnd(8, 30) };
      s.visitors.push(v);
      const a = s.album[ham.id] || (s.album[ham.id] = { visits: 0, firstAt: Date.now(), lastAt: 0, seeds: 0, gold: 0, nick: '' });
      const isNew = a.visits === 0;
      a.visits++; a.lastAt = Date.now();
      this.pushLog({ type: 'arrive', hamId: ham.id, isNew });
      if (summary) { summary.arrivals++; if (isNew) summary.newHams.push(ham.id); }
      else this.emit('arrive', { ham, isNew, v });
    }
    leave(v, food, summary) {
      const s = this.state;
      const ham = D.hamsterById[v.hamId];
      const stay = Math.max(1, s.tick - v.arrivedAt);
      let seeds = Math.round(rnd(6, 16) * food.gift * RARITY_GIFT[ham.rarity] * (0.6 + Math.min(stay, 30) / 30));
      let gold = 0;
      const gp = ham.rarity === 3 ? 0.35 : ham.rarity === 2 ? 0.08 : 0.03;
      if (Math.random() < gp * food.gift) gold = ham.rarity === 3 ? irnd(1, 3) : 1;
      s.seeds += seeds; s.gold += gold;
      const a = s.album[ham.id]; if (a) { a.seeds += seeds; a.gold += gold; }
      this.pushLog({ type: 'leave', hamId: ham.id, seeds, gold });
      if (summary) { summary.leaves++; summary.seeds += seeds; summary.gold += gold; }
      else this.emit('leave', { ham, seeds, gold });
    }
    pushLog(entry) {
      entry.at = Date.now();
      this.state.log.unshift(entry);
      if (this.state.log.length > 40) this.state.log.length = 40;
    }

    // ---- プレイヤー操作 ----
    canAfford(cost) { return (this.state.seeds >= (cost.seed || 0)) && (this.state.gold >= (cost.gold || 0)); }
    pay(cost) { this.state.seeds -= cost.seed || 0; this.state.gold -= cost.gold || 0; }
    buyItem(itemId) {
      const item = D.itemById[itemId];
      if (!item || !this.canAfford(item.cost)) return false;
      this.pay(item.cost);
      this.state.inventory[itemId] = (this.state.inventory[itemId] || 0) + 1;
      this.save(); this.emit('change');
      return true;
    }
    placeItem(slotId, itemId) {
      const s = this.state;
      if (itemId && !(s.inventory[itemId] > 0)) return false;
      this.removeItem(slotId, true);
      if (itemId) { s.slots[slotId] = itemId; s.inventory[itemId]--; }
      this.save(); this.emit('change');
      return true;
    }
    removeItem(slotId, silent) {
      const s = this.state;
      const cur = s.slots[slotId];
      if (cur) {
        s.inventory[cur] = (s.inventory[cur] || 0) + 1;
        s.slots[slotId] = null;
        // そこにいたはむは帰る（おみやげなし）
        s.visitors = s.visitors.filter((v) => v.slot !== slotId);
      }
      if (!silent) { this.save(); this.emit('change'); }
    }
    setFood(foodId) {
      const f = D.foodById[foodId];
      if (!f || !this.canAfford(f.cost)) return false;
      this.pay(f.cost);
      this.state.food = { id: foodId, amount: 100 };
      this.save(); this.emit('change');
      return true;
    }
    setNick(hamId, nick) {
      const a = this.state.album[hamId]; if (!a) return;
      a.nick = (nick || '').slice(0, 12);
      this.save(); this.emit('change');
    }
    markIntro() { this.state.seenIntro = true; this.save(); }

    // ---- 参照 ----
    discoveredCount() { return Object.values(this.state.album).filter((a) => a.visits > 0).length; }
    friendship(hamId) {
      const a = this.state.album[hamId]; if (!a) return 0;
      const v = a.visits;
      return v >= 50 ? 5 : v >= 25 ? 4 : v >= 10 ? 3 : v >= 4 ? 2 : 1;
    }
    foodTimeLeft() {
      const s = this.state; const f = D.foodById[s.food.id];
      if (!f || s.food.amount <= 0) return 0;
      const perTick = (100 / f.duration) + 0.15 * s.visitors.length;
      return Math.ceil(s.food.amount / perTick) * (TICK_MS / (s.speed || 1));
    }
  }

  global.HamuGame = { Game, TICK_MS };
})(window);
