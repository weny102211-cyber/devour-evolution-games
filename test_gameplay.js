import puppeteer from 'puppeteer-core';
import { startServer } from './test_server.js';
import fs from 'fs';

async function runGameplayVerification() {
  console.log('=== 开始《吞噬进化》深度玩法演练与阶段截图 ===');

  const server = await startServer(8098);

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
    }
  });

  await page.goto('http://localhost:8098/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#start-screen');
  await page.waitForFunction(() => window.__GAME__ !== undefined, { timeout: 8000 });
  await page.click('#btn-start-game');
  await page.waitForFunction(() => window.__GAME__ && window.__GAME__.isRunning, { timeout: 8000 });

  console.log('1. 阶段一：初始开局状态');
  await page.screenshot({ path: 'gameplay_step1_start.png' });

  console.log('2. 阶段二：模拟真实移动并吞噬人行道上的易拉罐、快递盒与路障');
  // 模拟按键向右走向人行道 (7.5, 14)
  await page.keyboard.down('KeyD');
  await new Promise(r => setTimeout(r, 1200));
  await page.keyboard.up('KeyD');

  // 再向前向上移动吞噬连续物体
  await page.keyboard.down('KeyW');
  await new Promise(r => setTimeout(r, 1500));
  await page.keyboard.up('KeyW');

  const statsPhase2 = await page.evaluate(() => {
    const game = window.__GAME__;
    return {
      score: game.player.score,
      swallowed: game.player.swallowCount,
      level: game.player.level,
      diameter: (game.player.radius * 2).toFixed(2),
    };
  });
  console.log(`- 阶段二战报：得分 ${statsPhase2.score}, 吞噬 ${statsPhase2.swallowed} 个物体, 等级 Lv.${statsPhase2.level}, 直径 ${statsPhase2.diameter}m`);
  await page.screenshot({ path: 'gameplay_step2_growth.png' });

  console.log('3. 阶段三：成长为大型黑洞吞噬车辆');
  // 给予额外经验成长并靠近停车场车辆
  await page.evaluate(() => {
    const game = window.__GAME__;
    game.player.addExp(2500); // 晋升为载具收割者
    game.player.setPosition(25, 46); // 停车场轿车位置
    for (let i = 0; i < 40; i++) {
      game.update(0.033);
    }
  });

  const statsPhase3 = await page.evaluate(() => {
    const game = window.__GAME__;
    return {
      score: game.player.score,
      swallowed: game.player.swallowCount,
      level: game.player.level,
      levelName: game.ui.levelNameEl.textContent,
      diameter: (game.player.radius * 2).toFixed(2),
    };
  });
  console.log(`- 阶段三战报：已进化为 [${statsPhase3.levelName}], 等级 Lv.${statsPhase3.level}, 直径 ${statsPhase3.diameter}m, 总得分 ${statsPhase3.score}`);
  await page.screenshot({ path: 'gameplay_step3_giant.png' });

  console.log('4. 阶段四：AI 黑洞猎杀对决');
  await page.evaluate(() => {
    const game = window.__GAME__;
    // 将一个较小的 AI 黑洞移至玩家黑洞中心触发猎杀
    const victim = game.aiCtrl.aiList[0].hole;
    victim.invulnerableTimer = 0;
    victim.setPosition(game.player.x, game.player.z);
    game.update(0.05);
  });

  const kills = await page.evaluate(() => window.__GAME__.player.killCount);
  console.log(`- 阶段四战报：击破对手数 = ${kills}`);

  console.log('5. 阶段五：倒计时结束进入终局结算');
  await page.evaluate(() => {
    const game = window.__GAME__;
    game.matchTime = 0.05;
    game.update(0.1);
  });
  await new Promise(r => setTimeout(r, 600));

  await page.screenshot({ path: 'gameplay_step4_settlement.png' });

  // 点击再来一局
  await page.evaluate(() => {
    document.getElementById('btn-restart').click();
  });
  await new Promise(r => setTimeout(r, 500));

  const restartedStatus = await page.evaluate(() => {
    const game = window.__GAME__;
    return {
      isRunning: game.isRunning,
      matchTime: game.matchTime,
      playerLevel: game.player.level,
    };
  });
  console.log(`- 再来一局重置检验：isRunning=${restartedStatus.isRunning}, matchTime=${restartedStatus.matchTime.toFixed(0)}s, playerLevel=${restartedStatus.playerLevel}`);

  await browser.close();
  server.close();
  console.log('🎉 深度全真演练检验圆满完成！');
}

runGameplayVerification().catch(err => {
  console.error('演练失败:', err);
  process.exit(1);
});
