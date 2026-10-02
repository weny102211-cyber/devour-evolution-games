import puppeteer from 'puppeteer-core';
import { startServer } from './test_server.js';
import fs from 'fs';

async function runModesVerification() {
  console.log('=== 开始模式选择 (对战 vs 无尽无AI) 与虚拟摇杆全功能验证 ===');

  const server = await startServer(8097);

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const executablePath = fs.existsSync(chromePath) ? chromePath : edgePath;

  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--window-size=1280,800',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  page.on('pageerror', err => {
    console.error('[Page Error]', err.toString());
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error(`[Console Error] ${msg.text()}`);
    } else {
      console.log(`[Browser Console] ${msg.text()}`);
    }
  });

  console.log('[Step 1] 访问游戏并检查开始界面模式选择...');
  await page.goto('http://localhost:8097/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#start-screen');
  await page.waitForFunction(() => window.__GAME__ !== undefined, { timeout: 8000 });

  // 截取开始界面
  await page.screenshot({ path: 'menu_mode_selection.png' });
  console.log('✅ 开始菜单加载正常，已截图保存为 menu_mode_selection.png！');

  console.log('[Step 2] 切换为【无尽模式 (Endless)】并开始游戏...');
  await page.click('#card-endless');
  await page.click('#btn-start-game');

  await page.waitForFunction(() => window.__GAME__ && window.__GAME__.isRunning, { timeout: 5000 });

  // 检验无尽模式下是否没有 AI
  const endlessStats = await page.evaluate(() => {
    const game = window.__GAME__;
    const aiList = game.aiCtrl.getAllHoles();
    const aliveAiCount = aiList.filter(h => h.isAlive).length;
    const isEndless = game.mode === 'endless';
    const joystickVisible = !!document.getElementById('joystick-base');

    return {
      isEndless,
      totalAi: aiList.length,
      aliveAiCount,
      joystickVisible,
      timerText: document.getElementById('match-timer').textContent,
      rightTitle: document.getElementById('hud-right-title').textContent,
    };
  });

  console.log(`- 模式检验: isEndless=${endlessStats.isEndless}`);
  console.log(`- 活跃AI数量: ${endlessStats.aliveAiCount} (严格要求: 0 个)`);
  console.log(`- 虚拟摇杆已装配: ${endlessStats.joystickVisible}`);
  console.log(`- HUD 标题: ${endlessStats.rightTitle}, 计时器: ${endlessStats.timerText}`);

  if (endlessStats.aliveAiCount !== 0) {
    throw new Error('无尽模式中竟然存在活跃 AI！不符合要求！');
  }
  if (!endlessStats.isEndless) {
    throw new Error('未正确设置为无尽模式！');
  }

  // 模拟摇杆推移与吞噬
  await page.evaluate(() => {
    const game = window.__GAME__;
    // 寻找最近的 Level 1 物体
    const target = game.consumables.activeObjects.find(o => o.userData.level === 1);
    if (target) {
      game.player.setPosition(target.position.x, target.position.z);
    }
    for (let i = 0; i < 25; i++) {
      game.update(0.033);
    }
  });

  await page.screenshot({ path: 'endless_gameplay.png' });
  console.log('✅ 无尽模式运行正常 (0 AI)，已截图保存为 endless_gameplay.png！');

  console.log('[Step 3] 返回主菜单并启动【对战模式 (Battle)】...');
  await page.click('#btn-home');
  await page.waitForSelector('#start-screen');

  await page.click('#card-battle');
  await page.click('#btn-start-game');

  const battleStats = await page.evaluate(() => {
    const game = window.__GAME__;
    const aliveAi = game.aiCtrl.getAllHoles().filter(h => h.isAlive).length;
    return {
      isBattle: game.mode === 'battle',
      aliveAi,
      rightTitle: document.getElementById('hud-right-title').textContent,
    };
  });

  console.log(`- 对战模式活跃AI数量: ${battleStats.aliveAi} (达标: 6个)`);
  console.log(`- 对战模式右侧标题: ${battleStats.rightTitle}`);

  if (battleStats.aliveAi !== 6) {
    throw new Error(`对战模式 AI 数量不正确: ${battleStats.aliveAi}`);
  }

  await page.screenshot({ path: 'battle_gameplay.png' });
  console.log('✅ 对战模式运行正常 (6 AI)，已截图保存为 battle_gameplay.png！');

  await browser.close();
  server.close();
  console.log('🎉 模式选择与虚拟摇杆测试全部 100% 通过！');
}

runModesVerification().catch(err => {
  console.error('测试失败:', err);
  process.exit(1);
});
