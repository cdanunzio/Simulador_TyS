const { chromium } = require('playwright'); const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, '../dist/TyS - Maqueta ERP v2.0 - Orden de servicio.html');
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1380, height: 1400 } });
  await page.goto(FILE); await page.waitForSelector('#main .page-h');
  await page.evaluate(() => { S.ctx.screen = 'md'; S.ctx.mdTab = 'MAESTROS'; S.ctx.mdM = 'M-26'; S.ctx.mdSub = 'REG'; render(); });
  const box = await page.$('.mdb'); await box.screenshot({ path: 'test/shot-md-m26.png' });
  await page.evaluate(() => { S.ctx.mdTab = 'CRUCE'; render(); }); await page.screenshot({ path: 'test/shot-md-cruce.png' });
  await page.setViewportSize({ width: 400, height: 900 }); await page.evaluate(() => { S.ctx.mdTab = 'MAESTROS'; S.ctx.mdM = 'M-08'; render(); });
  const sw = await page.evaluate(() => document.documentElement.scrollWidth); console.log('scrollWidth movil', sw);
  await page.screenshot({ path: 'test/shot-md-movil.png' });
  await browser.close();
})();
