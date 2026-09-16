const { chromium } = require('playwright'); const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, '../dist/TyS - Maqueta ERP v2.0 - Orden de servicio.html');
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1380, height: 900 } });
  await page.goto(FILE); await page.waitForSelector('#main .page-h');
  await page.selectOption('#ctx-rol', 'PLAN'); await page.evaluate(() => openOrden('OS-2026-0004', 'planificacion')); await page.waitForTimeout(80);
  await page.check('input[data-pf="equipo"][value="G1"]'); await page.waitForTimeout(80);
  const el = await page.$('#s-planificacion h3'); await el.scrollIntoViewIfNeeded();
  const box = await page.$('#s-planificacion .card.tight'); await box.screenshot({ path: 'test/shot-equipos-solido.png' });
  await page.click('[data-action="arribo-fecha"][data-rid="G1"]'); await page.waitForTimeout(80);
  await page.screenshot({ path: 'test/shot-arribo-modal.png' });
  await page.click(".mf [data-action=\"modal-cancel\"]"); await page.waitForTimeout(50);
  // liquid: send OS-0003 and view as PLAN with buque
  await page.evaluate(() => { const o = orden('OS-2026-0003'); transition(o, 'PEND_PLAN', 'Crear y enviar a planificación', { rol: 'COM' }); save(); });
  await page.evaluate(() => openOrden('OS-2026-0003', 'planificacion')); await page.waitForTimeout(80);
  await page.selectOption('#pf-eqorg', 'buque'); await page.waitForTimeout(80);
  const box2 = await page.$('#s-planificacion .card.tight'); await box2.screenshot({ path: 'test/shot-equipos-liquido.png' });
  await browser.close();
})();
