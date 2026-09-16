const { chromium } = require('playwright'); const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, '../dist/TyS - Maqueta ERP v2.0 - Orden de servicio.html');
(async () => {
  const browser = await chromium.launch();
  for (const [w, h, n] of [[1380, 900, 'd'], [1266, 800, 'z'], [390, 844, 'm']]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } }); await page.goto(FILE); await page.waitForSelector('#main .page-h');
    await page.selectOption('#ctx-rol', 'LAR'); await page.waitForTimeout(60); await page.evaluate(() => go('arribos')); await page.waitForTimeout(80);
    await page.screenshot({ path: 'test/shot-arribos-' + n + '.png' }); await page.evaluate(() => window.scrollTo(0, 1500)); await page.waitForTimeout(50); await page.screenshot({ path: 'test/shot-arribos-' + n + '2.png' });
    console.log(n, 'scrollWidth', await page.evaluate(() => document.documentElement.scrollWidth)); await page.close();
  }
  await browser.close();
})();
