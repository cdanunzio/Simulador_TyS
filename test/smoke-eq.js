const { chromium } = require('playwright'); const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, '../dist/Maqueta ERP v2.14 - Orden de servicio.html');
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1380, height: 900 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !m.text().includes('fonts')) errors.push(m.text()); });
  await page.goto(FILE); await page.waitForSelector('#main .page-h');
  const info = await page.evaluate(() => S.orders.map(o => ({ id: o.id, est: o.estado, rec: o.recomendacion ? (o.recomendacion.sinOpciones ? 'SIN' : resumenRecursos(o.recomendacion.recursos) + ' org=' + o.recomendacion.recursos.equipoOrigen) : '-', plan: o.plan ? resumenRecursos(o.plan.recursos) : '-' })));
  console.log(JSON.stringify(info, null, 1));
  const r3 = await page.evaluate(() => { const o = orden('OS-2026-0003'); const r = recomendar(o); return { rec: r.sinOpciones ? 'SIN' : resumenRecursos(r.recursos), org: r.recursos?.equipoOrigen, eqb: equiposBuqueDe(o)?.nombre, tipo: tipoEquipoPara(o), muelle: equiposMuelleDe(o).map(e => e.id) }; });
  console.log('OS-0003', JSON.stringify(r3));
  const r4 = await page.evaluate(() => { const o = orden('OS-2026-0004'); const r = recomendar(o); return { rec: r.sinOpciones ? 'SIN' : resumenRecursos(r.recursos), n: r.nCombos, org: r.recursos?.equipoOrigen, confG1: conflictosRecurso('G1', o), prop: proponerArribo(o, 'G1'), am: arriboModificable(o) }; });
  console.log('OS-0004', JSON.stringify(r4));
  const r5 = await page.evaluate(() => { const o = orden('OS-2026-0005'); const r = recomendar(o); return { rec: r.sinOpciones ? 'SIN' : resumenRecursos(r.recursos), n: r.nCombos, org: r.recursos?.equipoOrigen, eqb: equiposBuqueDe(o) }; });
  console.log('OS-0005', JSON.stringify(r5));
  const r11 = await page.evaluate(() => { const o = orden('OS-2026-0011'); const r = recomendar(o); return { rec: r.sinOpciones ? 'SIN' : resumenRecursos(r.recursos), n: r.nCombos, org: r.recursos?.equipoOrigen }; });
  console.log('OS-0011', JSON.stringify(r11));
  // ship gear validation: OS-0004 with buque
  const v = await page.evaluate(() => { const o = orden('OS-2026-0004'); const eqb = equiposBuqueDe(o); const R = { muelle: 'M1', equipos: [eqb.id], equipoOrigen: 'buque', deposito: 'D4', balanza: 'BZ1', funciones: { 'F-SUP': 1, 'F-BAL': 1, 'F-DEP': 2 }, manos: { 'MANO-EMB': 2 }, logistica: { 'L-TOLVA': 2 } }; const val = validarPlan(o, { recursos: R }); const d = duracionPlan(o, { recursos: R }); const c = costoPlan(o, { recursos: R }); return { err: val.errores, ritmo: d.ritmo, costo: c.total, items: c.items.filter(i => i.rid === eqb.id) }; });
  console.log('buque plan', JSON.stringify(v));
  console.log('errors', errors);
  await browser.close();
})();
