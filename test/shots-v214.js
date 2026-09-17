const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, '../dist/Maqueta ERP v2.14 - Orden de servicio.html');
const { chromium } = require('playwright');
const OUT = '/tmp/claude-0/-home-claude/d8638c97-0544-5da4-8a3d-81d9aecfc7a4/scratchpad/';
(async () => {
  const b = await chromium.launch();
  const shot = async (name, steps, opts) => {
    const p = await b.newPage(Object.assign({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 2 }, opts || {}));
    await p.goto(FILE); await p.waitForSelector('#main'); await p.waitForTimeout(300);
    if (steps) await steps(p); await p.waitForTimeout(300);
    await p.screenshot({ path: OUT + name + '.png' }); await p.close();
  };
  await shot('v214-arribos', async p => { await p.evaluate(() => { S.ctx.rol = 'LAR'; go('arribos'); }); await p.waitForTimeout(250); });
  await shot('v214-lu-form', async p => { await p.evaluate(() => { S.ctx.rol = 'LAR'; go('arribos'); }); await p.waitForTimeout(200); await p.click('[data-action="lu-nuevo"]'); await p.waitForTimeout(200); await p.selectOption('#lf-buque', { index: 3 }); await p.waitForTimeout(300); });
  await shot('v214-plan', async p => { await p.evaluate(() => { S.ctx.rol = 'PLAN'; const o = S.orders.find(x => x.estado === 'PEND_PLAN'); openOrden(o.id, 'planificacion'); }); await p.waitForTimeout(300); await p.evaluate(() => { const el = [...document.querySelectorAll('#main h3')].find(h => /Maquinaria/.test(h.textContent)); if (el) el.scrollIntoView(); }); });
  await shot('v214-nueva', async p => { await p.evaluate(() => { S.ctx.rol = 'COM'; W = null; go('nueva'); }); await p.waitForTimeout(150);
    await p.selectOption('#w-entidad', 'TYS'); await p.waitForTimeout(80); await p.selectOption('#w-servicio', 'SRV-DTD'); await p.waitForTimeout(80);
    await p.selectOption('#w-medio', 'BUQ'); await p.waitForTimeout(80); await p.selectOption('#w-dest', 'cliente:CLI-01'); await p.waitForTimeout(80); await p.selectOption('#w-producto', 'UREA'); await p.waitForTimeout(150); });
  await b.close(); console.log('listo');
})();
