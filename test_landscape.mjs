import puppeteer from 'puppeteer-core';

async function testLandscape() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-webgl', '--ignore-gpu-blocklist']
  });

  const page = await browser.newPage();
  // Landscape iPhone 14 (844 x 390)
  await page.setViewport({
    width: 844,
    height: 390,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
  });

  await page.goto('http://localhost:8089/', { waitUntil: 'networkidle2' });

  await page.screenshot({ path: 'landscape_start_screen.png' });

  const startBtnBox = await page.$eval('#btn-start-game', el => {
    const rect = el.getBoundingClientRect();
    return {
      top: rect.top,
      bottom: rect.bottom,
      isOffscreen: rect.bottom > window.innerHeight
    };
  });
  console.log('Landscape Start Button:', JSON.stringify(startBtnBox, null, 2));

  await page.tap('#btn-start-game');
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'landscape_gameplay.png' });

  await browser.close();
}

testLandscape().catch(console.error);
