const { chromium } = require('playwright'); const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, '../dist/TyS - Maqueta ERP v2.0 - Orden de servicio.html');
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1380, height: 900 } });
  await page.goto(FILE); await page.waitForSelector('#main .page-h');
  await page.selectOption('#ctx-rol', 'MD'); await page.waitForTimeout(50);
  await page.evaluate(() => { S.ctx.screen = 'admin'; S.ctx.admTab = 'MOD'; render(); }); await page.waitForTimeout(60);
  await page.selectOption('#adm-sim-bu', 'TYS-RENT'); await page.waitForTimeout(60); await page.screenshot({ path: 'test/shot-v29-menu-sim.png' });
  await page.evaluate(() => window.scrollTo(0, 900)); await page.screenshot({ path: 'test/shot-v29-menu-matrices.png' });
  await page.selectOption('#ctx-bu', 'TYS-RENT'); await page.waitForTimeout(80); await page.evaluate(() => go('inicio')); await page.waitForTimeout(60); await page.screenshot({ path: 'test/shot-v29-menu-rental.png' });
  await page.selectOption('#ctx-bu', 'ALL'); await page.evaluate(() => { S.ctx.screen = 'md'; S.ctx.mdTab = 'REGLAS'; render(); }); await page.waitForTimeout(60); await page.screenshot({ path: 'test/shot-v29-reglas.png' });
  await page.click('[data-action="md-nuevo"][data-m="RG"]'); await page.waitForTimeout(60); await page.screenshot({ path: 'test/shot-v29-regla-form.png' });
  await browser.close();
})();
