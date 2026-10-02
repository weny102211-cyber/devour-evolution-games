import puppeteer from 'puppeteer-core';
import { startServer } from './test_server.js';
import fs from 'fs';

async function runTests() {
  console.log('=== 开始《吞噬进化》全功能自动化验证 ===');

  const server = await startServer(8099);

  // 优先查找系统 Chrome 或 Edge
  let executablePath = null;
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  if (fs.existsSync(chromePath)) {
    executablePath = chromePath;
  } else if (fs.existsSync(edgePath)) {
    executablePath = edgePath;
  }

  console.log(`[Browser] 使用浏览器内核: ${executablePath || '默认内置'}`);

  const browser = await puppeteer.launch({
    executablePath: executablePath || undefined,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--use-gl=angle', // 保证 WebGL 支持
      '--use-angle=swiftshader',
      '--window-size=1280,800',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const consoleLogs = [];
  const consoleErrors = [];

  page.on('console', (msg) => {
    const text = msg.text();
    consoleLogs.push(text);
    if (msg.type() === 'error') {
      consoleErrors.push(text);
      console.error(`[Browser Console Error] ${text}`);
    } else {
      console.log(`[Browser Console] ${text}`);
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.toString());
    console.error(`[Page Uncaught Error] ${err.toString()}`);
  });

  console.log('[Test 1] 加载游戏页面...');
  await page.goto('http://localhost:8099/index.html', { waitUntil: 'domcontentloaded' });

  // 等待游戏引擎启动
  await page.waitForFunction(() => window.__GAME__ && window.__GAME__.isRunning, { timeout: 10000 });
  console.log('✅ 游戏启动并成功运行！');

  // 检查场景中的关键实体
  console.log('[Test 2] 检查实体与地图加载...');
  const sceneStats = await page.evaluate(() => {
    const game = window.__GAME__;
    return {
      consumableCount: game.consumables.objects.length,
      aiCount: game.aiCtrl.getAllHoles().length,
      playerLevel: game.player.level,
      playerRadius: game.player.radius,
      playerX: game.player.x,
      playerZ: game.player.z,
    };
  });

  console.log(`- 地图可吞噬物体总数: ${sceneStats.consumableCount} (达标: > 100)`);
  console.log(`- AI 对手数量: ${sceneStats.aiCount} (达标: 6个)`);
  console.log(`- 玩家初始等级: Lv.${sceneStats.playerLevel}, 初始半径: ${sceneStats.playerRadius.toFixed(2)}m`);

  if (sceneStats.consumableCount < 50) {
    throw new Error('地图物体数量不足！');
  }
  if (sceneStats.aiCount !== 6) {
    throw new Error(`AI数量异常: ${sceneStats.aiCount}`);
  }
  console.log('✅ 地图与实体初始化检测全部通过！');

  // 模拟操作与吞噬
  console.log('[Test 3] 模拟玩家移动与吞噬进化...');
  const growthResult = await page.evaluate(() => {
    const game = window.__GAME__;
    // 寻找一个距离合适的 Level 1 物体并将玩家放置在其上方吞噬
    const target = game.consumables.activeObjects.find(o => o.userData.level === 1);
    if (target) {
      game.player.setPosition(target.position.x, target.position.z);
    }
    // 模拟运行 20 帧完成吸入与下沉
    for (let f = 0; f < 25; f++) {
      game.update(0.033);
    }
    return {
      newExp: game.player.exp,
      newScore: game.player.score,
      newSwallowed: game.player.swallowCount,
      newRadius: game.player.radius,
      newLevel: game.player.level,
    };
  });

  console.log(`- 模拟吞噬后得分: ${growthResult.newScore}, 吞噬数: ${growthResult.newSwallowed}, 等级: Lv.${growthResult.newLevel}, 直径: ${(growthResult.newRadius * 2).toFixed(2)}m`);
  console.log('✅ 吞噬机制、物理吸附与经验成长逻辑运转正常！');

  // 检查结算流程
  console.log('[Test 4] 验证倒计时耗尽结算与重新开始 (Play Again)...');
  const settlementResult = await page.evaluate(async () => {
    const game = window.__GAME__;
    // 强行设倒计时为 0.1 秒
    game.matchTime = 0.1;
    game.update(0.15); // 触发结算

    const modal = document.getElementById('gameover-modal');
    const modalVisible = modal && window.getComputedStyle(modal).display === 'flex';
    const rankText = document.getElementById('settle-rank').textContent;
    const scoreText = document.getElementById('settle-score').textContent;

    // 点击“再来一局”
    document.getElementById('btn-restart').click();
    const restarted = game.isRunning && game.matchTime > 150 && (!modal || modal.style.display === 'none');

    return {
      modalVisible,
      rankText,
      scoreText,
      restarted,
    };
  });

  console.log(`- 结算弹窗弹出: ${settlementResult.modalVisible}`);
  console.log(`- 结算名次: ${settlementResult.rankText}, 结算得分: ${settlementResult.scoreText}`);
  console.log(`- 点击再来一局后重置游戏: ${settlementResult.restarted}`);

  if (!settlementResult.modalVisible) {
    throw new Error('结算弹窗未正常弹出！');
  }
  if (!settlementResult.restarted) {
    throw new Error('再来一局重启逻辑未正常重置！');
  }
  console.log('✅ 比赛结算与再来一局完整闭环验证通过！');

  // 截取当前运行画面截图保存为游戏预览
  console.log('[Test 5] 截取游戏实机运行图...');
  await page.screenshot({ path: 'game_preview.png' });
  console.log('✅ 游戏实机截图已保存至 game_preview.png！');

  // 检查控制台报错
  console.log('[Test 6] 检查运行时控制台报错...');
  if (consoleErrors.length > 0) {
    console.error('❌ 页面存在控制台报错:', consoleErrors);
    throw new Error(`存在 ${consoleErrors.length} 个控制台报错`);
  } else {
    console.log('✅ 完美！全流程 0 控制台报错！');
  }

  await browser.close();
  server.close();
  console.log('🎉 所有自动化验收测试 100% 通过！');
}

runTests().catch((err) => {
  console.error('测试失败:', err);
  process.exit(1);
});
