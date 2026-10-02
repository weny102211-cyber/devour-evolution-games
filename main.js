import { GameManager } from './src/GameManager.js';

function bootGame() {
  try {
    const container = document.getElementById('canvas-container');
    console.log('[Main] container found:', !!container);
    const game = new GameManager(container);
    window.__GAME__ = game;
    console.log('《吞噬进化Games》游戏及模式选择主菜单装载完毕！');
  } catch (err) {
    console.error('[Main] Boot error:', err && err.message, err && err.stack);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootGame);
} else {
  bootGame();
}
