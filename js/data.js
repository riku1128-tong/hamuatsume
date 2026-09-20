/* はむあつめ — データ定義（ハムスター・グッズ・えさ） */
(function (global) {
  'use strict';

  // ---- えさ -------------------------------------------------------------
  // attract: 来訪しやすさ  gift: おみやげ倍率  rare: レアはむ来訪倍率
  // duration: 満タンから空になるまでの目安 tick 数（1 tick = 1分）
  const FOODS = [
    { id: 'seed',    name: 'ひまわりの種',       desc: 'いつでも無料。ふつうのえさ。',            cost: { seed: 0 },    attract: 1.0, gift: 1.0, rare: 1.0, duration: 240 },
    { id: 'mix',     name: 'ミックスフード',     desc: '穀物と種のバランス食。少し人気。',        cost: { seed: 40 },   attract: 1.3, gift: 1.2, rare: 1.0, duration: 300 },
    { id: 'pellet',  name: '高級ペレット',       desc: '栄養たっぷり。みんな長居する。',          cost: { seed: 120 },  attract: 1.6, gift: 1.4, rare: 1.2, duration: 360 },
    { id: 'worm',    name: 'ミルワーム',         desc: 'ごちそう。レアはむも気になる味。',        cost: { seed: 250 },  attract: 2.0, gift: 1.6, rare: 1.8, duration: 300 },
    { id: 'cheese',  name: 'チーズ',             desc: 'とっておき。おみやげがはずむ。',          cost: { gold: 15 },   attract: 2.4, gift: 2.0, rare: 2.5, duration: 300 },
    { id: 'goldseed',name: '金のひまわりの種',   desc: '伝説の種。レアはむが集まる。',            cost: { gold: 40 },   attract: 3.0, gift: 2.4, rare: 4.0, duration: 360 },
  ];

  // ---- グッズ -----------------------------------------------------------
  // pose: そのグッズで遊ぶときのハムスターのポーズ
  // anchor: ハムスターを置く位置（グッズの 44×36 グリッド座標。ハムスターの足元中央がここに来る）
  // capacity: 同時に来られる数（2 のときは anchor2 も指定）  flip: 左右ランダム
  const ITEMS = [
    { id: 'wheel',    name: '回し車',           desc: 'カラカラ回して走る定番。',              cost: { seed: 150 }, pose: 'side',  size: 'm', anchor: { x: 22, y: 30 },  flip: true },
    { id: 'house',    name: '木の巣箱',         desc: '暗くて落ち着く。お昼寝に。',            cost: { seed: 200 }, pose: 'sleep', size: 'm', anchor: { x: 22, y: 35 } },
    { id: 'tunnel',   name: 'トンネル',         desc: 'くぐるのが好きな子が来る。',            cost: { seed: 180 }, pose: 'back',  size: 'l', anchor: { x: 7, y: 35 } },
    { id: 'sand',     name: '砂場',             desc: '砂浴びでさっぱり。',                    cost: { seed: 120 }, pose: 'front', size: 'm', anchor: { x: 22, y: 31 } },
    { id: 'box',      name: 'ダンボールハウス', desc: '安いけど意外と人気。',                  cost: { seed: 80 },  pose: 'back',  size: 's', anchor: { x: 17, y: 36 } },
    { id: 'chew',     name: 'かじり木',         desc: 'カリカリ歯をととのえる。',              cost: { seed: 100 }, pose: 'eat',   size: 's', anchor: { x: 13, y: 36 } },
    { id: 'bed',      name: 'ふわふわベッド',   desc: 'もぐって寝る子が多い。',                cost: { seed: 220 }, pose: 'sleep', size: 'm', anchor: { x: 22, y: 29 } },
    { id: 'hammock',  name: 'ハンモック',       desc: 'ゆらゆら。ごろんと寝転ぶ。',            cost: { seed: 300 }, pose: 'belly', size: 'm', anchor: { x: 22, y: 26 } },
    { id: 'cabbage',  name: 'キャベツ畑',       desc: 'かじり放題のプランター。',              cost: { seed: 260 }, pose: 'eat',   size: 'm', anchor: { x: 22, y: 36 } },
    { id: 'seesaw',   name: 'シーソー',         desc: '二匹で遊ぶこともある。',                cost: { seed: 340 }, pose: 'front', size: 'l', anchor: { x: 9, y: 27 }, capacity: 2, anchor2: { x: 35, y: 20 } },
    { id: 'sunflower',name: 'ひまわりの鉢',     desc: '大きなひまわり。仙人が気になるらしい。',cost: { seed: 600 }, pose: 'eat',   size: 'l', anchor: { x: 9, y: 36 } },
    { id: 'treasure', name: 'お宝箱',           desc: 'なにが入っているのだろう。',            cost: { seed: 800 }, pose: 'back',  size: 's', anchor: { x: 22, y: 36 } },
    { id: 'onsen',    name: 'ひのき温泉',       desc: 'ぽかぽか。極楽。',                      cost: { gold: 25 },  pose: 'sleep', size: 'm', anchor: { x: 22, y: 23 } },
    { id: 'ice',      name: 'こおりのベッド',   desc: 'ひんやり。夏でも雪が好きな子に。',      cost: { gold: 20 },  pose: 'belly', size: 'm', anchor: { x: 22, y: 28 } },
    { id: 'castle',   name: 'はむのおしろ',     desc: '王子が住むと噂のおしろ。',              cost: { gold: 45 },  pose: 'front', size: 'l', anchor: { x: 22, y: 36 } },
    { id: 'dojo',     name: '忍者どうじょう',   desc: '夜になると何かの気配が…',              cost: { gold: 30 },  pose: 'side',  size: 'm', anchor: { x: 22, y: 36 }, flip: true },
  ];

  // ---- ハムスター -------------------------------------------------------
  // group: 図鑑タブ  colors: 描画色  likes: 好きなグッズ(重み)  food: 好きなえさ
  // rarity: 1-3 (来訪しにくさ)  requires: レアはむが来るのに必要なグッズ
  const C = {
    goldenNormal:  { body: '#e0a565', belly: '#fff5e6' },
    kinkuma:       { body: '#f0c98a', belly: '#fff8ea' },
    goldenBlack:   { body: '#3b3230', belly: '#6b5a52', ear: '#8a7570' },
    goldenLong:    { body: '#c98a5a', belly: '#f5e2c8' },
    dalmatian:     { body: '#f5f0e6', belly: '#ffffff', stripe: '#3b3230', spots: '#3b3230' },
    goldenSilver:  { body: '#b9b3ad', belly: '#f4f1ee', ear: '#d9d3cd' },
    goldenTri:     { body: '#e0a565', belly: '#ffffff', spots: '#3b3230' },
    goldenCream:   { body: '#f3dcb0', belly: '#fffaf0' },
    djunNormal:    { body: '#9a8f82', belly: '#f7f3ec', stripe: '#4a423c' },
    pudding:       { body: '#e8c27a', belly: '#fff8ea', stripe: '#c49a4c' },
    sapphire:      { body: '#a9adb8', belly: '#f7f7f7', stripe: '#6b7280', ear: '#d8d5dc' },
    pearl:         { body: '#f4f1ec', belly: '#ffffff', stripe: '#d9d3ca' },
    snow:          { body: '#ffffff', belly: '#ffffff', ear: '#f3d9d9' },
    bluepudding:   { body: '#d9cfb0', belly: '#fffaf0', stripe: '#8f8a78' },
    roboNormal:    { body: '#c9a26a', belly: '#fff8ea', brow: '#ffffff' },
    roboWhite:     { body: '#e6d6b4', belly: '#ffffff', brow: '#ffffff', face: '#ffffff' },
    roboPied:      { body: '#d8c39a', belly: '#ffffff', brow: '#ffffff', spots: '#ffffff' },
    roboPlatinum:  { body: '#e9e4d8', belly: '#ffffff', brow: '#ffffff', ear: '#e0d7ca' },
    campNormal:    { body: '#a0866a', belly: '#f7f3ec', stripe: '#5c4a3a' },
    campBlack:     { body: '#2f2a28', belly: '#5a4f4a', ear: '#8a7570' },
    campBlue:      { body: '#8f97a8', belly: '#eef0f4', stripe: '#5a6372' },
    campAlbino:    { body: '#ffffff', belly: '#ffffff', eye: '#d64545', ear: '#f6c9b3' },
    campArgente:   { body: '#e4b98a', belly: '#fff3e0', stripe: '#c48a52', eye: '#c2453f' },
    campMottled:   { body: '#f2ebe0', belly: '#ffffff', stripe: '#8a6f55', spots: '#8a6f55' },
    chinNormal:    { body: '#8a7460', belly: '#f3ede4', stripe: '#4a3a2e', tail: true },
    chinSpot:      { body: '#f0e8dc', belly: '#ffffff', stripe: '#8a7460', spots: '#8a7460', tail: true },
    european:      { body: '#b8783e', belly: '#2a2220', ear: '#e8a37a' },
    brandt:        { body: '#a88b6a', belly: '#e9dccb' },
    grey:          { body: '#9c9a94', belly: '#eeeae2', ear: '#c9c4bb' },
  };

  const HAMSTERS = [
    // ゴールデン（シリアン）
    { id: 'golden',        name: 'ゴールデン',                 group: 'golden', colors: C.goldenNormal,  rarity: 1, personality: 'のんびり',   likes: { wheel: 3, house: 2, sand: 1.5 }, food: 'seed' },
    { id: 'kinkuma',       name: 'キンクマ',                   group: 'golden', colors: C.kinkuma,       rarity: 1, personality: 'おっとり',   likes: { bed: 3, house: 2, hammock: 2 },  food: 'mix' },
    { id: 'golden_black',  name: 'ブラックゴールデン',         group: 'golden', colors: C.goldenBlack,   rarity: 2, personality: 'クール',     likes: { tunnel: 3, box: 2, treasure: 2 }, food: 'pellet' },
    { id: 'golden_long',   name: '長毛ゴールデン',             group: 'golden', colors: C.goldenLong,    rarity: 2, personality: 'マイペース', likes: { hammock: 3, bed: 2 },            food: 'mix' },
    { id: 'golden_dalm',   name: 'ダルメシアンゴールデン',     group: 'golden', colors: C.dalmatian,     rarity: 2, personality: 'あわてんぼう', likes: { wheel: 3, seesaw: 2 },         food: 'pellet' },
    { id: 'golden_silver', name: 'シルバーグレーゴールデン',   group: 'golden', colors: C.goldenSilver,  rarity: 2, personality: '大人しい',   likes: { sand: 3, house: 2 },             food: 'seed' },
    { id: 'golden_tri',    name: '三毛ゴールデン',             group: 'golden', colors: C.goldenTri,     rarity: 3, personality: 'きまぐれ',   likes: { seesaw: 3, cabbage: 2, sand: 2 }, food: 'worm' },
    { id: 'golden_cream',  name: 'クリームゴールデン',         group: 'golden', colors: C.goldenCream,   rarity: 1, personality: 'あまえんぼう', likes: { cabbage: 3, chew: 2 },         food: 'mix' },
    // ジャンガリアン
    { id: 'djun',          name: 'ジャンガリアン',             group: 'djun',   colors: C.djunNormal,    rarity: 1, personality: 'げんき',     likes: { wheel: 3, tunnel: 2, chew: 1.5 }, food: 'seed' },
    { id: 'djun_pudding',  name: 'プディングジャンガリアン',   group: 'djun',   colors: C.pudding,       rarity: 1, personality: 'くいしんぼう', likes: { cabbage: 3, chew: 2, sand: 1.5 }, food: 'mix' },
    { id: 'djun_sapphire', name: 'サファイアジャンガリアン',   group: 'djun',   colors: C.sapphire,      rarity: 2, personality: 'おだやか',   likes: { house: 3, bed: 2, ice: 2 },      food: 'pellet' },
    { id: 'djun_pearl',    name: 'パールジャンガリアン',       group: 'djun',   colors: C.pearl,         rarity: 2, personality: 'しずか',     likes: { bed: 3, hammock: 2 },            food: 'pellet' },
    { id: 'djun_snow',     name: 'スノーホワイトジャンガリアン', group: 'djun', colors: C.snow,          rarity: 3, personality: 'はずかしがり', likes: { ice: 3, house: 2, box: 2 },    food: 'cheese' },
    { id: 'djun_bluepud',  name: 'ブループディングジャンガリアン', group: 'djun', colors: C.bluepudding, rarity: 2, personality: 'ひょうきん', likes: { seesaw: 3, wheel: 2 },          food: 'mix' },
    // ロボロフスキー
    { id: 'robo',          name: 'ロボロフスキー',             group: 'robo',   colors: C.roboNormal,    rarity: 1, personality: 'すばしっこい', likes: { wheel: 3, tunnel: 3, box: 1.5 }, food: 'seed' },
    { id: 'robo_white',    name: 'ホワイトフェイスロボ',       group: 'robo',   colors: C.roboWhite,     rarity: 2, personality: 'こわがり',   likes: { tunnel: 3, box: 3 },             food: 'mix' },
    { id: 'robo_pied',     name: 'パイドロボ',                 group: 'robo',   colors: C.roboPied,      rarity: 2, personality: 'おちゃめ',   likes: { sand: 3, wheel: 2 },             food: 'pellet' },
    { id: 'robo_platinum', name: 'プラチナロボ',               group: 'robo',   colors: C.roboPlatinum,  rarity: 3, personality: 'きどりや',   likes: { castle: 3, hammock: 2, ice: 2 }, food: 'cheese' },
    // キャンベル
    { id: 'camp',          name: 'キャンベル',                 group: 'camp',   colors: C.campNormal,    rarity: 1, personality: 'がんこ',     likes: { chew: 3, box: 2, tunnel: 1.5 },  food: 'seed' },
    { id: 'camp_black',    name: 'ブラックキャンベル',         group: 'camp',   colors: C.campBlack,     rarity: 2, personality: 'つよき',     likes: { treasure: 3, tunnel: 2 },        food: 'worm' },
    { id: 'camp_blue',     name: 'ブルーキャンベル',           group: 'camp',   colors: C.campBlue,      rarity: 2, personality: 'おっとり',   likes: { bed: 3, sand: 2 },               food: 'pellet' },
    { id: 'camp_albino',   name: 'アルビノキャンベル',         group: 'camp',   colors: C.campAlbino,    rarity: 3, personality: 'ふしぎちゃん', likes: { ice: 3, house: 2 },            food: 'cheese' },
    { id: 'camp_argente',  name: 'アルジェンテキャンベル',     group: 'camp',   colors: C.campArgente,   rarity: 2, personality: 'ほがらか',   likes: { cabbage: 3, seesaw: 2 },         food: 'mix' },
    { id: 'camp_mottled',  name: 'モトルドキャンベル',         group: 'camp',   colors: C.campMottled,   rarity: 2, personality: 'あきっぽい', likes: { wheel: 2, sand: 2, chew: 2 },    food: 'pellet' },
    // チャイニーズ・野生種
    { id: 'chinese',       name: 'チャイニーズ',               group: 'other',  colors: C.chinNormal,    rarity: 2, personality: 'しんちょう', likes: { tunnel: 3, chew: 2 },            food: 'pellet' },
    { id: 'chinese_spot',  name: 'スポットチャイニーズ',       group: 'other',  colors: C.chinSpot,      rarity: 3, personality: 'ものしずか', likes: { box: 3, tunnel: 2 },             food: 'worm' },
    { id: 'european',      name: 'クロハラハムスター',         group: 'other',  colors: C.european,      rarity: 3, personality: 'ボス',       likes: { cabbage: 3, treasure: 2 },       food: 'worm' },
    { id: 'brandt',        name: 'ブラントハムスター',         group: 'other',  colors: C.brandt,        rarity: 3, personality: 'たびびと',   likes: { sunflower: 3, sand: 2 },         food: 'pellet' },
    { id: 'grey',          name: 'ハイイロハムスター',         group: 'other',  colors: C.grey,          rarity: 2, personality: 'ひかえめ',   likes: { box: 3, bed: 2 },                food: 'seed' },
    // レアはむ（必要グッズあり）
    { id: 'rare_sennin',   name: 'ひまわり仙人',   group: 'rare', colors: { body: '#f2c14e', belly: '#fff8ea' },                 rarity: 3, personality: 'なぞ',       likes: { sunflower: 4 }, requires: 'sunflower', food: 'goldseed', accessory: 'beard', story: 'ひまわりの種を千年食べ続けたと伝わる仙人。' },
    { id: 'rare_snowman',  name: 'ゆきだるはむ',   group: 'rare', colors: { body: '#ffffff', belly: '#ffffff', ear: '#bfe3f2' }, rarity: 3, personality: 'ひんやり',   likes: { ice: 4 },       requires: 'ice',       food: 'cheese',   accessory: 'bucket', story: 'とけない雪でできているらしい。' },
    { id: 'rare_prince',   name: 'はむ王子',       group: 'rare', colors: { body: '#e0a565', belly: '#fff5e6' },                 rarity: 3, personality: 'きひん',     likes: { castle: 4 },    requires: 'castle',    food: 'cheese',   accessory: 'crown', story: 'どこかの国の王子。おしろがないと来ない。' },
    { id: 'rare_ninja',    name: 'ねずみ小僧',     group: 'rare', colors: { body: '#6b6b6b', belly: '#9a9a9a', stripe: '#2b2320' }, rarity: 3, personality: 'かくれんぼ', likes: { dojo: 4, treasure: 2 }, requires: 'dojo', food: 'worm', accessory: 'headband', story: 'お宝を狙って夜な夜な現れる。' },
    { id: 'rare_onsen',    name: 'おんせんはむ',   group: 'rare', colors: { body: '#f0b7a4', belly: '#fff2ea' },                 rarity: 3, personality: 'ごくらく',   likes: { onsen: 4 },     requires: 'onsen',     food: 'pellet',   accessory: 'towel', story: '頭にタオル。湯上がりの顔。' },
    { id: 'rare_tenshi',   name: 'てんしはむ',     group: 'rare', colors: { body: '#fdf6e9', belly: '#ffffff', ear: '#f8d7e3' }, rarity: 3, personality: 'やさしい',   likes: { hammock: 3, bed: 3 }, requires: 'hammock', food: 'goldseed', accessory: 'halo', story: 'ハンモックで昼寝をしていると現れるという。' },
  ];

  const GROUPS = [
    { id: 'all',    name: 'すべて' },
    { id: 'golden', name: 'ゴールデン' },
    { id: 'djun',   name: 'ジャンガリアン' },
    { id: 'robo',   name: 'ロボロフスキー' },
    { id: 'camp',   name: 'キャンベル' },
    { id: 'other',  name: 'そのほか' },
    { id: 'rare',   name: 'レアはむ' },
  ];

  // おへやのスロット（画面座標は 1280x640 基準）。グッズは 220x180（44x36 グリッド × 5px）で下寄せに置く
  const SLOTS = [
    { id: 's1', x: 60,  y: 150, w: 220, h: 180 },
    { id: 's2', x: 330, y: 215, w: 220, h: 180 },
    { id: 's3', x: 640, y: 150, w: 220, h: 180 },
    { id: 's4', x: 960, y: 150, w: 220, h: 180 },
    { id: 's5', x: 100, y: 400, w: 220, h: 180 },
    { id: 's6', x: 960, y: 400, w: 220, h: 180 },
  ];
  // えさ皿（最大 2 か所）。anchor は皿の 24x14 グリッド座標（ハムスターの足元中央）
  const BOWLS = [
    { id: 'b1', x: 470, y: 470, w: 120, h: 70, anchor: { x: 1, y: 14 } },
    { id: 'b2', x: 690, y: 470, w: 120, h: 70, anchor: { x: 23, y: 14 }, flip: true },
  ];

  const byId = (list) => Object.fromEntries(list.map((x) => [x.id, x]));

  global.HamuData = {
    FOODS, ITEMS, HAMSTERS, GROUPS, SLOTS, BOWLS,
    foodById: byId(FOODS), itemById: byId(ITEMS), hamsterById: byId(HAMSTERS),
  };
})(window);
