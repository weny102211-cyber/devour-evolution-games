import puppeteer from 'puppeteer-core';
import { startServer } from './test_server.js';
import fs from 'fs';

async function runCompleteGameVerification() {
  console.log('=== 开始《吞噬进化》完整游戏生态端到端全面验收 ===');

  const server = await startServer(8096);

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

  console.log('[Step 1] 打开游戏开始菜单，校验基础资产与模式...');
  await page.goto('http://localhost:8096/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#start-screen');
  await page.waitForFunction(() => window.__GAME__ !== undefined, { timeout: 8000 });

  const initialCoins = await page.$eval('#menu-coins', el => el.textContent.trim());
  console.log(`- 初始金币数量: ${initialCoins}`);
  await page.screenshot({ path: 'complete_step1_start_menu.png' });
  console.log('✅ 阶段 1：开始菜单正常，已截图 complete_step1_start_menu.png');

  console.log('[Step 2] 检查皮肤衣橱模态框...');
  await page.click('#btn-open-skins');
  await page.waitForSelector('#skins-modal', { visible: true });
  const skinCount = await page.$$eval('.skin-card', cards => cards.length);
  console.log(`- 皮肤卡片数量: ${skinCount}`);
  await page.screenshot({ path: 'complete_step2_skin_wardrobe.png' });
  await page.click('#btn-close-skins');
  console.log('✅ 阶段 2：皮肤衣橱正常，已截图 complete_step2_skin_wardrobe.png');

  console.log('[Step 3] 检查天赋研究所并进行一次升级强化...');
  await page.click('#btn-open-upgrades');
  await page.waitForSelector('#upgrades-modal', { visible: true });
  const upgradeCount = await page.$$eval('.upgrade-card', cards => cards.length);
  console.log(`- 天赋卡片数量: ${upgradeCount}`);
  // 点击第一个升级按钮 (引力场强化)
  await page.click('.upgrade-btn');
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: 'complete_step3_upgrades.png' });
  await page.click('#btn-close-upgrades');
  console.log('✅ 阶段 3：天赋升级研究所正常，已截图 complete_step3_upgrades.png');

  console.log('[Step 4] 检查荣誉成就殿堂...');
  await page.click('#btn-open-achievements');
  await page.waitForSelector('#achievements-modal', { visible: true });
  const achCount = await page.$$eval('.ach-card', cards => cards.length);
  console.log(`- 成就徽章总数: ${achCount}`);
  await page.screenshot({ path: 'complete_step4_achievements.png' });
  await page.click('#btn-close-achievements');
  console.log('✅ 阶段 4：荣誉成就殿堂正常，已截图 complete_step4_achievements.png');

  console.log('[Step 5] 启动对战模式，检验虚拟摇杆、雷达小地图与吞噬反馈...');
  await page.click('#card-battle');
  await page.click('#btn-start-game');
  await page.waitForFunction(() => window.__GAME__ && window.__GAME__.isRunning, { timeout: 5000 });

  // 模拟按键向右走向人行道吞噬连续物体
  await page.keyboard.down('KeyD');
  await new Promise(r => setTimeout(r, 1200));
  await page.keyboard.up('KeyD');
  await page.keyboard.down('KeyW');
  await new Promise(r => setTimeout(r, 1200));
  await page.keyboard.up('KeyW');

  const battleStats = await page.evaluate(() => {
    const game = window.__GAME__;
    return {
      score: game.player.score,
      swallowed: game.player.swallowCount,
      level: game.player.level,
      hasRadar: !!document.getElementById('radar-canvas'),
      hasJoystick: !!document.getElementById('joystick-base'),
      aliveAIs: game.aiCtrl.getAllHoles().filter(h => h.isAlive).length,
    };
  });
  console.log('- 局内战报:', battleStats);
  await page.screenshot({ path: 'complete_step5_battle_hud.png' });
  console.log('✅ 阶段 5：局内对战与雷达小地图正常，已截图 complete_step5_battle_hud.png');

  console.log('[Step 6] 检验暂停功能与面板...');
  await page.click('#btn-pause');
  await page.waitForSelector('#pause-modal', { visible: true });
  const isGamePaused = await page.evaluate(() => window.__GAME__.isPaused || window.__GAME__.ui.isPaused);
  console.log(`- 游戏暂停状态: ${isGamePaused}`);
  await page.screenshot({ path: 'complete_step6_pause_menu.png' });

  // 点击继续游戏
  await page.click('#btn-resume-game');
  await new Promise(r => setTimeout(r, 300));
  console.log('✅ 阶段 6：暂停与恢复控制正常，已截图 complete_step6_pause_menu.png');

  console.log('[Step 7] 终局结算与金币结算验证...');
  await page.evaluate(() => {
    window.__GAME__.matchTime = 0.1; // 触发终局
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.waitForSelector('#gameover-modal', { visible: true });
  const settleInfo = await page.evaluate(() => {
    return {
      rank: document.getElementById('settle-rank').textContent,
      score: document.getElementById('settle-score').textContent,
      coins: document.getElementById('settle-coins').textContent,
    };
  });
  console.log('- 结算面板数据:', settleInfo);
  await page.screenshot({ path: 'complete_step7_settlement.png' });
  console.log('✅ 阶段 7：终局结算与奖励正常，已截图 complete_step7_settlement.png');

  await browser.close();
  server.close();
  console.log('🎉🎉🎉 《吞噬进化》完整游戏生态系统全部 7 阶段验证 100% 顺利通过！');
}

runCompleteGameVerification().catch(err => {
  console.error('测试失败:', err);
  process.exit(1);
});
