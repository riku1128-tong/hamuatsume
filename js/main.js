/* はむあつめ — 起動 */
(function () {
  'use strict';
  const game = new window.HamuGame.Game();
  const loaded = game.load();
  const ui = new window.HamuUI.UI(game);
  game.start();
  ui.render();
  if (!loaded || !game.state.seenIntro) ui.intro();
  // デバッグ用に公開
  window.hamu = { game, ui };
})();
