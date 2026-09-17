const { chromium } = require('playwright'); const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, '../dist/Maqueta ERP v2.14 - Orden de servicio.html');
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1380, height: 900 } });
  await page.goto(FILE); await page.waitForSelector('#main .page-h');
  const setRol = async (rol) => { await page.selectOption('#ctx-rol', rol); await page.waitForTimeout(50); };
  const wsel = async (k, v) => { await page.selectOption('#w-' + k, v); await page.waitForTimeout(60); };
  await setRol('COM'); await page.evaluate(() => go('nueva')); await page.waitForTimeout(50);
  await wsel('entidad', 'TYS'); await wsel('servicio', 'SRV-DTD'); await wsel('medio', 'BUQ'); await wsel('dest', 'cliente:CLI-02'); await wsel('producto', 'DAP'); await wsel('origen', 'lineup:LU-2026-038:0');
  await page.fill('input[data-w="toneladas"]', '8000'); await page.dispatchEvent('input[data-w="toneladas"]', 'change'); await page.waitForTimeout(60);
  await page.evaluate(() => window.scrollTo(0, 420)); await page.screenshot({ path: 'test/shot-v27-datos-servicio.png' });
  await page.evaluate(() => openOrden('OS-2026-0005', 'resumen')); await page.waitForTimeout(60); await page.screenshot({ path: 'test/shot-v27-resumen.png' });
  await page.click('[data-action="datos-servicio"]'); await page.waitForTimeout(60); await page.screenshot({ path: 'test/shot-v27-editar-modal.png' }); await page.keyboard.press('Escape');
  await page.evaluate(() => { S.ctx.screen = 'admin'; S.ctx.admTab = 'USR'; render(); }); await page.waitForTimeout(60); await page.evaluate(() => window.scrollTo(0, 500)); await page.screenshot({ path: 'test/shot-v27-modulos.png' });
  await page.evaluate(() => { S.ctx.admTab = 'MAT'; render(); }); await page.waitForTimeout(60); await page.screenshot({ path: 'test/shot-v27-matriz.png' });
  await browser.close();
})();
