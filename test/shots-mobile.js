const { chromium } = require('playwright'); const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, '../dist/Maqueta ERP v2.14 - Orden de servicio.html');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(FILE); await page.waitForSelector('#main .page-h');
  const shot = async (n) => { await page.waitForTimeout(80); await page.screenshot({ path: 'test/shot-m-' + n + '.png' }); const sw = await page.evaluate(() => document.documentElement.scrollWidth); console.log(n, 'scrollWidth', sw); };
  const setRol = async (rol) => { await page.selectOption('#ctx-rol', rol); await page.waitForTimeout(50); };
  await shot('inicio');
  await page.click('.navtg'); await page.waitForTimeout(300); await shot('menu');
  await page.click('#nav [data-screen="bandeja"]'); await shot('bandeja');
  check = await page.evaluate(() => document.body.classList.contains('nav-open')); console.log('drawer cerrado tras navegar:', !check);
  await setRol('OPS'); await page.evaluate(() => openOrden('OS-2026-0007', 'resumen')); await shot('expediente');
  await setRol('PLAN'); await page.evaluate(() => openOrden('OS-2026-0004', 'planificacion')); await shot('planificacion');
  await setRol('COM'); await page.evaluate(() => go('nueva')); await page.selectOption('#w-entidad', 'TYS'); await page.waitForTimeout(60); await page.selectOption('#w-servicio', 'SRV-DTD'); await page.waitForTimeout(60); await page.selectOption('#w-medio', 'BUQ'); await page.waitForTimeout(60); await page.selectOption('#w-dest', 'cliente:CLI-02'); await page.waitForTimeout(60); await page.selectOption('#w-producto', 'DAP'); await page.waitForTimeout(60); await page.selectOption('#w-origen', 'lineup:LU-2026-038:0'); await shot('nueva');
  await setRol('OPS'); await page.evaluate(() => openOrden('OS-2026-0006', 'ejecucion')); await page.click('[data-action="recurso-form"]'); await shot('modal'); await page.keyboard.press('Escape');
  await page.evaluate(() => { S.ctx.screen = 'md'; S.ctx.mdTab = 'MAESTROS'; S.ctx.mdM = 'M-07'; S.ctx.mdSub = 'REG'; render(); }); await shot('md');
  await page.evaluate(() => go('recursos')); await shot('recursos');
  await page.evaluate(() => { S.ctx.screen = 'admin'; S.ctx.admTab = 'USR'; render(); }); await shot('admin');
  await page.evaluate(() => go('casos')); await shot('casos');
  /* tablet */
  const t = await browser.newContext({ viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2 }); const tp = await t.newPage(); await tp.goto(FILE); await tp.waitForSelector('#main .page-h');
  await tp.screenshot({ path: 'test/shot-t-inicio.png' }); await tp.evaluate(() => openOrden('OS-2026-0006', 'ejecucion')); await tp.waitForTimeout(80); await tp.screenshot({ path: 'test/shot-t-exp.png' });
  const t2 = await browser.newContext({ viewport: { width: 1024, height: 768 } }); const tp2 = await t2.newPage(); await tp2.goto(FILE); await tp2.waitForSelector('#main .page-h'); await tp2.evaluate(() => go('bandeja')); await tp2.waitForTimeout(80); await tp2.screenshot({ path: 'test/shot-t2-bandeja.png' });
  console.log('errores JS:', errors);
  await browser.close();
})();
