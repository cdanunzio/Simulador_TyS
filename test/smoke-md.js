const { chromium } = require('playwright'); const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, '../dist/Maqueta ERP v2.14 - Orden de servicio.html');
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1380, height: 900 } });
  const errors = []; page.on('pageerror', e => errors.push('pageerror: ' + e.message)); page.on('console', m => { if (m.type() === 'error' && !m.text().includes('ERR_TUNNEL')) errors.push(m.text()); });
  await page.goto(FILE); await page.waitForSelector('#main .page-h', { timeout: 15000 }).catch(e => errors.push('no render: ' + e.message));
  console.log('errors after load:', errors);
  const info = await page.evaluate(() => ({ n: S.orders.length, ver: VERSION, buques: md().buques.length, lu0: S.ops.lineups[3], eqb3: equiposBuqueDe(orden('OS-2026-0003'))?.nombre, eqb4: equiposBuqueDe(orden('OS-2026-0004'))?.nombre, cond3: condiciones(orden('OS-2026-0003')), rec4: recomendar(orden('OS-2026-0004')).recursos, alertas: alertas().map(a => a.txt) }));
  console.log(JSON.stringify(info, null, 1));
  // md screen for each maestro & sub tab
  const fichas = await page.evaluate(() => mdFichas().map(f => f.codigo));
  for (const m of fichas) { for (const sub of ['REG', 'ATR', 'REGL', 'FUE', 'TX']) { await page.evaluate(([m, sub]) => { S.ctx.screen = 'md'; S.ctx.mdTab = 'MAESTROS'; S.ctx.mdM = m; S.ctx.mdSub = sub; render(); }, [m, sub]); } }
  for (const t of ['AREA', 'AUD', 'CONV', 'ORDEN', 'DEF', 'REGLAS', 'FUENTES', 'CRUCE', 'TXEV']) await page.evaluate(t => { S.ctx.screen = 'md'; S.ctx.mdTab = t; render(); }, t);
  console.log('errors after md:', errors);
  const counts = await page.evaluate(() => mdFichas().map(f => f.codigo + ':' + (mdMap()[f.codigo]?.coll() || []).length).join(' '));
  console.log(counts);
  await page.evaluate(() => { S.ctx.screen = 'md'; S.ctx.mdTab = 'MAESTROS'; S.ctx.mdM = 'M-34'; S.ctx.mdSub = 'REG'; render(); });
  await page.screenshot({ path: 'test/shot-md-m34.png', fullPage: false });
  await page.evaluate(() => { S.ctx.mdM = 'M-07'; S.ctx.mdSub = 'ATR'; render(); });
  await page.screenshot({ path: 'test/shot-md-m07-atr.png', fullPage: false });
  await browser.close();
})();
