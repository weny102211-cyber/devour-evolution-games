import puppeteer from 'puppeteer-core';

async function testMobile() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-webgl', '--ignore-gpu-blocklist']
  });

  const page = await browser.newPage();
  // Simulate iPhone 14 viewport (390 x 844, DPR 3, touch enabled)
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
  });

  page.on('console', msg => console.log(`[Mobile Console] ${msg.text()}`));
  page.on('pageerror', err => console.error(`[Mobile Error]`, err));

  console.log('Testing mobile page load at http://localhost:8089/ ...');
  await page.goto('http://localhost:8089/', { waitUntil: 'networkidle2' });

  await page.screenshot({ path: 'mobile_start_screen.png' });

  // Check start button visibility on mobile
  const startBtn = await page.$('#btn-start-game');
  const btnBox = await startBtn.boundingBox();
  console.log('Mobile Start Button Bounding Box:', btnBox);

  // Click start button
  console.log('Tapping Start button on mobile...');
  await page.tap('#btn-start-game');
  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({ path: 'mobile_game_started.png' });

  // Check joystick position and visibility
  const joyState = await page.evaluate(() => {
    const zone = document.getElementById('joystick-zone');
    const base = document.getElementById('joystick-base');
    const knob = document.getElementById('joystick-knob');
    const baseRect = base.getBoundingClientRect();
    const knobRect = knob.getBoundingClientRect();
    return {
      windowSize: { w: window.innerWidth, h: window.innerHeight },
      baseRect: { top: baseRect.top, left: baseRect.left, bottom: baseRect.bottom, right: baseRect.right, width: baseRect.width, height: baseRect.height },
      knobRect: { top: knobRect.top, left: knobRect.left, bottom: knobRect.bottom, right: knobRect.right },
      isOffscreen: baseRect.bottom > window.innerHeight || baseRect.top < 0,
      hudOverflow: document.getElementById('hud') ? document.getElementById('hud').scrollWidth > window.innerWidth : false,
      topBarWidth: document.querySelector('.top-bar') ? document.querySelector('.top-bar').scrollWidth : null
    };
  });
  console.log('Mobile Joystick and HUD Layout Evaluation:', JSON.stringify(joyState, null, 2));

  // Simulate touch drag on mobile
  console.log('Simulating mobile touch drag on joystick...');
  const startTouchX = joyState.baseRect.left + joyState.baseRect.width / 2;
  const startTouchY = joyState.baseRect.top + joyState.baseRect.height / 2;

  await page.touchscreen.touchStart(startTouchX, startTouchY);
  await page.touchscreen.touchMove(startTouchX + 40, startTouchY - 40);
  await new Promise(r => setTimeout(r, 1000));
  await page.touchscreen.touchEnd();

  const posAfterTouch = await page.evaluate(() => {
    const g = window.__GAME__;
    return g && g.player ? { x: g.player.x, z: g.player.z } : null;
  });
  console.log('Player Position after mobile touch drag:', posAfterTouch);

  await page.screenshot({ path: 'mobile_touch_drag.png' });
  await browser.close();
}

testMobile().catch(console.error);
