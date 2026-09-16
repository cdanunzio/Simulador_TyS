/* Recorrido automatizado de los 9 casos sobre la maqueta (Chromium headless) */
const { chromium } = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, '../dist/TyS - Maqueta ERP v2.0 - Orden de servicio.html');
const errors = []; const log = (...a) => console.log(...a);
const hoursBetween = (a, b) => (new Date(b) - new Date(a)) / 36e5;
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1380, height: 900 } });
  /* los errores de carga de recursos externos (tipografía de Google Fonts sin red) no son fallas de la maqueta */
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto(FILE);
  await page.waitForSelector('#main .page-h');
  const text = async (sel) => (await page.textContent(sel)) || '';
  const setRol = async (rol) => { await page.selectOption('#ctx-rol', rol); await page.waitForTimeout(50); };
  const open = async (id, sec) => { await page.evaluate(([id, sec]) => openOrden(id, sec), [id, sec]); await page.waitForTimeout(50); };
  const st = async (id) => page.evaluate(id => orden(id).estado, id);
  const check = (cond, msg) => { log((cond ? 'OK  ' : 'FAIL') + ' ' + msg); if (!cond) errors.push('check: ' + msg); };

  /* pantalla inicial */
  check((await text('#main h1')).includes('Inicio'), 'Inicio renderiza');
  const nOrders = await page.evaluate(() => S.orders.length); check(nOrders === 11, '11 órdenes en el escenario (' + nOrders + ')');
  await page.screenshot({ path: 'test/shot-inicio.png' });

  /* Caso 2: no nacionalizada → bloqueo de inicio → regularizar → iniciar */
  await setRol('OPS'); await open('OS-2026-0002');
  let btnDisabled = await page.$eval('.exp-h .acts button.pri', b => b.disabled); check(btnDisabled, 'C2: botón Iniciar deshabilitado por no nacionalizada');
  let r = await page.evaluate(() => iniciar(orden('OS-2026-0002'))); check(!r.ok && r.motivos.join().includes('nacionalizada'), 'C2: iniciar() bloquea con motivo');
  await setRol('COM'); await open('OS-2026-0002', 'habilitaciones');
  await page.click('[data-action="nac-form"]'); await page.fill('#m-ref', 'Despacho 26001IC04001999Z'); await page.click('[data-action="modal-ok"]'); await page.waitForTimeout(50);
  check((await page.evaluate(() => condiciones(orden('OS-2026-0002')).ok)), 'C2: condición regularizada');
  await setRol('OPS'); await open('OS-2026-0002');
  await page.click('.exp-h .acts button.pri'); await page.waitForTimeout(50);
  check((await st('OS-2026-0002')) === 'EJEC', 'C2: orden iniciada tras regularizar');

  /* Caso 3: MS vencido → enviar con advertencia → planificar → bloqueado → renovar MS → confirmar → iniciar */
  await setRol('COM'); await open('OS-2026-0003');
  check(!(await page.evaluate(() => condiciones(orden('OS-2026-0003')).ms.ok)) && (await text('#main')).includes('No habilitado'), 'C3: habilitación MS no otorgada (vencido en master data)');
  await page.click('.exp-h .acts button.pri'); await page.waitForTimeout(50); check((await st('OS-2026-0003')) === 'PEND_PLAN', 'C3: enviada a planificación con advertencia');
  await setRol('PLAN'); await open('OS-2026-0003', 'planificacion');
  check((await page.$('.alert.ok')) !== null, 'C3: recomendación válida para UAN (bombeo, tanque)');
  /* Caso 12a: producto líquido → solo sistemas de bombeo; origen muelle / buque */
  const eqIds = await page.$$eval('input[data-pf="equipo"]', els => els.map(e => e.value)); check(eqIds.length === 1 && eqIds[0] === 'B1', 'C12a: producto líquido → solo bombas del muelle (' + eqIds.join(',') + ')');
  check((await text('#main')).includes('Sistemas de bombeo') && (await page.$('#pf-eqorg')) !== null, 'C12a: título por tipo de equipo y selector de origen');
  await page.selectOption('#pf-eqorg', 'buque'); await page.waitForTimeout(80);
  let R3 = await page.evaluate(() => PF['OS-2026-0003']); check(R3.equipoOrigen === 'buque' && R3.equipos.length === 1 && R3.equipos[0] === 'EQB-LU-2026-034', 'C12a: del buque → bombas del MT Delta Queen seleccionadas por defecto');
  check((await text('#main')).includes('Bombas del buque MT Delta Queen') && (await page.$('input[data-pf="equipo"]')) === null, 'C12a: se muestran las bombas del buque en lugar del inventario del muelle');
  let e3 = await page.evaluate(() => validarPlan(orden('OS-2026-0003'), { recursos: PF['OS-2026-0003'] }).errores); check(e3.length === 0, 'C12a: plan con equipos del buque valida (' + e3.join(' | ') + ')');
  const c3 = await page.evaluate(() => costoPlan(orden('OS-2026-0003'), { recursos: PF['OS-2026-0003'] }).items.find(i => i.rid.startsWith('EQB-'))); check(c3 && c3.monto === 0, 'C12a: equipos del buque sin costo para la terminal');
  await page.selectOption('#pf-eqorg', 'muelle'); await page.waitForTimeout(80);
  R3 = await page.evaluate(() => PF['OS-2026-0003']); check(R3.equipoOrigen === 'muelle' && R3.equipos.length === 1 && R3.equipos[0] === 'B1', 'C12a: de vuelta al muelle → B1 (recomendado) restaurado');
  await page.click('[data-action="principal"][data-act="confirmar-plan"]'); await page.waitForTimeout(80);
  check((await st('OS-2026-0003')) === 'PLANIF', 'C3: planificada');
  await setRol('OPS'); await open('OS-2026-0003');
  r = await page.evaluate(() => iniciar(orden('OS-2026-0003'))); check(!r.ok, 'C3: inicio bloqueado por MS vencido');
  await page.evaluate(() => { S.ctx.screen = 'md'; S.ctx.mdTab = 'SEG'; render(); }); await page.click('[data-action="ms-renovar"][data-id="MS-FERT-LIQ"]'); await page.waitForTimeout(50);
  check((await page.evaluate(() => condiciones(orden('OS-2026-0003')).ok)), 'C3: MS renovado en master data → habilitación automática');
  await setRol('OPS'); r = await page.evaluate(() => { const o = orden('OS-2026-0003'); return iniciar(o); }); check(r.ok, 'C3: ahora puede iniciar');

  /* Caso 4: recurso no disponible */
  await setRol('PLAN'); await open('OS-2026-0004', 'planificacion');
  await page.check('input[data-pf="equipo"][value="G1"]'); await page.waitForTimeout(80);
  let errs = await page.evaluate(() => validarPlan(orden('OS-2026-0004'), { recursos: PF['OS-2026-0004'] }).errores);
  check(errs.some(e => e.includes('G1') || e.includes('LHM 420')) && errs.some(e => e.includes('OS-2026-0006')), 'C4: G1 reservada por OS-2026-0006 → error');
  check(await page.$eval('[data-action="principal"][data-act="confirmar-plan"]', b => b.disabled), 'C4: confirmar deshabilitado con errores');
  check((await page.$('[data-action="arribo-fecha"][data-rid="G1"]')) !== null && (await text('#main')).includes('ocupado por otro operativo'), 'C12b: equipo ocupado → botón Cambiar fecha de arribo');
  check((await page.$$eval('input[data-pf="equipo"]', els => els.map(e => e.value))).every(v => v.startsWith('G')), 'C12b: producto sólido → solo grúas');
  await page.selectOption('#pf-eqorg', 'buque'); await page.waitForTimeout(80);
  errs = await page.evaluate(() => validarPlan(orden('OS-2026-0004'), { recursos: PF['OS-2026-0004'] }).errores); check(errs.length === 0 && (await page.evaluate(() => PF['OS-2026-0004'].equipos[0])) === 'EQB-LU-2026-033', 'C12b: alternativa grúas del buque MV Baltic Trader valida sin errores (' + errs.join(' | ') + ')');
  await page.selectOption('#pf-eqorg', 'muelle'); await page.waitForTimeout(80);
  check((await page.evaluate(() => PF['OS-2026-0004'].equipos.join())) === 'G2', 'C12b: vuelta al muelle restaura G2 recomendada');
  await page.uncheck('input[data-pf="equipo"][value="G1"]'); await page.check('input[data-pf="equipo"][value="G3"]'); await page.waitForTimeout(80);
  errs = await page.evaluate(() => validarPlan(orden('OS-2026-0004'), { recursos: PF['OS-2026-0004'] }).errores); check(errs.some(e => e.includes('mantenimiento')), 'C4: G3 en mantenimiento → error');
  check((await page.$('[data-action="sr-crear"][data-rid="G3"]')) !== null, 'C4: botón Solicitar habilitación a Maquinarias para G3');
  await page.click('[data-action="sr-crear"][data-rid="G3"]'); await page.waitForTimeout(80);
  const sr1 = await page.evaluate(() => S.solicitudesRecurso[0]); check(sr1 && sr1.rid === 'G3' && sr1.destinatario.id === 'TYS-MAQ' && sr1.operacion.toneladas === 6000 && sr1.estado === 'Pendiente', 'C4: solicitud SR creada hacia Maquinarias con la información de la operación');
  check((await text('#main')).includes(sr1.id + ' · Pendiente'), 'C4: la solicitud se ve pendiente en la planificación');
  await page.evaluate(() => go('recursos')); await page.waitForTimeout(60); await page.click('[data-action="sr-responder"][data-id="' + sr1.id + '"][data-dec="Habilitado"]'); await page.fill('#m-det', 'Mantenimiento adelantado'); await page.click('[data-action="modal-ok"]'); await page.waitForTimeout(80);
  check((await page.evaluate(() => byId(md().equipos, 'G3').estado)) === 'Operativo', 'C4: la BU habilita → G3 operativo');
  await open('OS-2026-0004', 'planificacion'); errs = await page.evaluate(() => validarPlan(orden('OS-2026-0004'), { recursos: PF['OS-2026-0004'] }).errores); check(!errs.some(e => e.includes('G3')), 'C4: revalidación sin error de G3');
  check((await page.evaluate(() => orden('OS-2026-0004').historial.some(h => h.evento.startsWith('Respuesta a solicitud')))), 'C4: respuesta registrada en el historial de la orden');
  await page.uncheck('input[data-pf="equipo"][value="G3"]'); await page.waitForTimeout(80);
  errs = await page.evaluate(() => validarPlan(orden('OS-2026-0004'), { recursos: PF['OS-2026-0004'] }).errores); check(errs.length === 0, 'C4: con G2 + Muelle Sur valida sin errores (' + errs.join(' | ') + ')');
  await page.click('[data-action="principal"][data-act="confirmar-plan"]'); await page.waitForTimeout(80); check((await st('OS-2026-0004')) === 'PLANIF', 'C4: planificada');

  /* Caso 5: plan diferente de la recomendación */
  await open('OS-2026-0005', 'planificacion');
  const rec5 = await page.evaluate(() => orden('OS-2026-0005').recomendacion.recursos.equipos); check(rec5.length === 2, 'C5: recomendación con dos grúas (' + rec5.join('+') + ')');
  for (const g of rec5) if (g !== 'G1') await page.uncheck('input[data-pf="equipo"][value="' + g + '"]');
  if (!rec5.includes('G1')) await page.check('input[data-pf="equipo"][value="G1"]');
  await page.waitForTimeout(80);
  await page.click('[data-action="principal"][data-act="confirmar-plan"]'); await page.waitForTimeout(80);
  check((await page.$('#m-motivo')) !== null, 'C5: pide motivo del desvío');
  await page.selectOption('#m-motivo', 'Menor costo total'); await page.click('[data-action="modal-ok"]'); await page.waitForTimeout(80);
  const p5 = await page.evaluate(() => orden('OS-2026-0005').plan); check(p5.difiere && p5.motivoDesvio.startsWith('Menor costo'), 'C5: plan guardado como distinto de la recomendación');
  await page.screenshot({ path: 'test/shot-caso5.png', fullPage: false });

  /* Caso 6 y 7: recurso adicional atribuible + demora por tercero en OS-0006 */
  await setRol('OPS'); await open('OS-2026-0006', 'ejecucion');
  await page.click('[data-action="recurso-form"]'); await page.selectOption('#m-rid', 'G2'); await page.selectOption('#m-motivo', 'Aumento de ritmo requerido por el cliente'); await page.check('#m-atrib'); await page.fill('#m-resp', 'Mail del cliente 14/09'); await page.click('[data-action="modal-ok"]'); await page.waitForTimeout(80);
  let cargos = await page.evaluate(() => cargosDe(orden('OS-2026-0006'))); check(cargos.some(c => c.tipo === 'Recurso adicional' && c.estado === 'Pendiente de aprobación'), 'C6: cargo por recurso adicional pendiente de aprobación');
  const ritmoAntes = await page.evaluate(() => ritmoActual(orden('OS-2026-0006'))); check(ritmoAntes > 500, 'C6: ritmo sube con G2 (' + ritmoAntes.toFixed(0) + ' t/h)');
  await page.click('[data-action="demora-form"]'); await page.selectOption('#m-causa', 'CD-02'); await page.fill('#m-terc', 'Transportes Litoral SA'); await page.fill('#m-gasto', '1800'); await page.check('#m-recup'); await page.fill('#m-obs', 'Sin camiones del transportista entre 08:30 y 10:00'); await page.click('[data-action="modal-ok"]'); await page.waitForTimeout(80);
  const dem = await page.evaluate(() => orden('OS-2026-0006').ejecucion.demoras.slice(-1)[0]); check(dem.responsabilidad === 'Transportista' && dem.recuperable && dem.gasto === 1800, 'C7: demora por tercero con gasto recuperable');
  cargos = await page.evaluate(() => cargosDe(orden('OS-2026-0006'))); check(cargos.some(c => c.tipo === 'Demora recuperable'), 'C7: cargo recuperable listado');
  await page.click('[data-action="simular"][data-h="6"]'); await page.waitForTimeout(80);
  const acc = await page.evaluate(() => orden('OS-2026-0006').ejecucion.acumulado); check(acc > 6300, 'C6: simulación de turno agrega toneladas (' + acc.toFixed(0) + ' t)');
  await page.screenshot({ path: 'test/shot-ejecucion.png', fullPage: false });

  /* OPS ajusta el plan antes del inicio (OS-0007 planificada) */
  await setRol('OPS'); await open('OS-2026-0007', 'planificacion');
  await page.click('[data-action="ops-ajustar"]'); await page.waitForTimeout(80);
  await page.fill('input[data-pf="log:L-CAM-3RO"]', '2'); await page.dispatchEvent('input[data-pf="log:L-CAM-3RO"]', 'change'); await page.waitForTimeout(80);
  await page.click('[data-action="ajustar-plan"]'); await page.waitForTimeout(60); await page.click('[data-action="modal-ok"]'); await page.waitForTimeout(80);
  const o7 = await page.evaluate(() => orden('OS-2026-0007')); check(o7.plan.version === 2 && o7.planInicial && o7.planInicial.version === 1 && o7.plan.recursos.logistica['L-CAM-3RO'] === 2, 'AJUSTE: plan v2 con plan inicial conservado');
  check((await page.evaluate(() => comparativas(orden('OS-2026-0007')).find(r => r.k === 'Camiones internos').plan)) === 6, 'AJUSTE: comparativa usa el plan inicial');

  /* ABM de recursos en ejecución (OPS): reemplazar depósito, modificar camiones */
  await setRol('OPS'); await open('OS-2026-0006', 'ejecucion');
  let idxDep = await page.evaluate(() => orden('OS-2026-0006').ejecucion.recursos.findIndex(r => r.tipo === 'deposito' && !r.hasta));
  await page.click('[data-action="reemplazar-form"][data-idx="' + idxDep + '"]'); await page.selectOption('#m-rid', 'D2'); await page.click('[data-action="modal-ok"]'); await page.waitForTimeout(80);
  check((await page.evaluate(() => activo(orden('OS-2026-0006'), 'deposito'))) === 'D2', 'ABM: depósito destino reemplazado D1 → D2');
  check((await page.evaluate(() => orden('OS-2026-0006').historial.slice(-1)[0].evento)) === 'Recurso reemplazado', 'ABM: reemplazo registrado en historial');
  let idxCam = await page.evaluate(() => orden('OS-2026-0006').ejecucion.recursos.findIndex(r => r.rid === 'L-CAM' && !r.hasta));
  await page.click('[data-action="modificar-form"][data-idx="' + idxCam + '"]'); await page.fill('#m-cant', '8'); await page.click('[data-action="modal-ok"]'); await page.waitForTimeout(80);
  check((await page.evaluate(() => orden('OS-2026-0006').ejecucion.recursos.filter(r => r.rid === 'L-CAM' && !r.hasta).map(r => r.cantidad)[0])) === 8, 'ABM: camiones internos 6 → 8');
  const nva = await page.evaluate(() => recursosNecVsApl(orden('OS-2026-0006')).find(r => r.rid === 'D2')); check(nva && nva.nec === 0 && nva.apl >= 0, 'ABM: D2 aparece en necesario vs aplicado (nec 0)');
  await page.evaluate(() => simular(orden('OS-2026-0006'), 1)); check((await page.evaluate(() => orden('OS-2026-0006').ejecucion.tickets.slice(-1)[0].destino)) === 'D2', 'ABM: los tickets nuevos van al depósito activo');

  /* Caso 8: Depósito ve ingresos en curso y cierra OS-0008 */
  await setRol('DEP'); await page.evaluate(() => go('deposito')); await page.waitForTimeout(50);
  check((await text('#main')).includes('OS-2026-0006'), 'C8: Depósito ve OS-2026-0006 en ingresos en curso');
  await open('OS-2026-0008', 'deposito');
  await page.fill('#cz-merma', '100'); await page.dispatchEvent('#cz-merma', 'change'); await page.waitForTimeout(80);
  check(await page.$eval('[data-action="principal"][data-act="cerrar"]', b => b.disabled), 'C8: merma 100 t (8,3 %) fuera de tolerancia → cierre bloqueado');
  await page.fill('#cz-merma', '6'); await page.dispatchEvent('#cz-merma', 'change'); await page.waitForTimeout(80);
  check(!(await page.$eval('[data-action="principal"][data-act="cerrar"]', b => b.disabled)), 'C8: merma 6 t (0,5 %) dentro de tolerancia 1 % → habilitado');
  await page.fill('#cierre-obs', 'Cierre de prueba'); await page.dispatchEvent('#cierre-obs', 'change'); await page.waitForTimeout(50); await page.click('[data-action="principal"][data-act="cerrar"]'); await page.waitForTimeout(80);
  check((await st('OS-2026-0008')) === 'CERRADA', 'C8: OS-2026-0008 cerrada por Depósito');
  check((await page.evaluate(() => orden('OS-2026-0008').deposito.cierre.merma)) === 6, 'C8: merma registrada en el cierre');
  check((await text('#main h1')).includes('Workflow'), 'C8: tras cerrar vuelve a Workflow · mi etapa');
  const d2 = await page.evaluate(() => recurso(orden('OS-2026-0008').plan.recursos.deposito).ocupadoT); check(d2 > 0, 'C8: ocupación del depósito actualizada (' + d2 + ' t)');

  /* Caso 9: relaciones */
  const rel = await page.evaluate(() => [orden('OS-2026-0009').relacion, orden('OS-2026-0010').relacion, orden('OS-2026-0001').relacion]); check(rel.join() === 'Interna,Grupo,Externa', 'C9: relaciones Interna / Grupo / Externa (' + rel.join(', ') + ')');
  await setRol('PLAN'); await open('OS-2026-0009', 'planificacion'); await page.fill('input[data-pf="log:L-PALA"]', '1'); await page.dispatchEvent('input[data-pf="log:L-PALA"]', 'change'); await page.waitForTimeout(80);
  await page.click('[data-action="principal"][data-act="confirmar-plan"]'); await page.waitForTimeout(80); check((await st('OS-2026-0009')) === 'PLANIF', 'C9a: servicio interno planificado');

  /* Caso 1: alta completa vía wizard */
  await setRol('COM'); await page.evaluate(() => go('nueva')); await page.waitForTimeout(50);
  const wsel = async (k, v) => { await page.selectOption('#w-' + k, v); await page.waitForTimeout(60); };
  await wsel('entidad', 'TYS'); await wsel('servicio', 'SRV-DTD'); check((await page.$eval('#w-bu', e => e.value + ':' + e.disabled)) === 'ENT:true', 'C1: servicio de nivel entidad → BU deshabilitada en Entidad'); await wsel('medio', 'BUQ'); await wsel('dest', 'cliente:CLI-02'); await wsel('producto', 'DAP'); check((await page.$eval('#w-instrumento', e => e.value)) === 'CTO-2026-021', 'C1: instrumento único autocompletado');
  const origOpts = await page.$$eval('#w-origen option', os => os.map(o => ({ v: o.value, t: o.textContent, d: o.disabled })));
  check(origOpts.some(o => o.v.startsWith('lineup:LU-2026-038')), 'C1: lineup MV Southern Wind disponible como origen');
  check(origOpts.some(o => o.v.startsWith('lineup:LU-2026-032') && !o.d && o.t.includes('ya vinculada a OS-2026-0002')), 'C1: carga ya vinculada aparece seleccionable con aviso');
  await wsel('origen', 'lineup:LU-2026-038:0');
  await page.check('input[data-w="nacionalizada"]'); await page.waitForTimeout(60); await page.fill('input[data-w="nacRef"]', 'Despacho 26001IC04002001A'); await page.dispatchEvent('input[data-w="nacRef"]', 'change'); await page.waitForTimeout(60);
  await page.click('[data-action="w-enviar"]'); await page.waitForTimeout(100);
  check((await text('#main h1')).includes('Workflow'), 'C1: tras enviar vuelve a Workflow · mi etapa');
  const nuevo = await page.evaluate(() => S.orders[S.orders.length - 1]); check(nuevo.id === 'OS-2026-0012' && nuevo.estado === 'PEND_PLAN' && nuevo.toneladas === 14000 && nuevo.bu === null, 'C1: OS-2026-0012 creada y enviada (' + nuevo.id + ' ' + nuevo.estado + ' ' + nuevo.toneladas + ' t)');
  await setRol('PLAN'); await open(nuevo.id, 'planificacion'); await page.click('[data-action="principal"][data-act="confirmar-plan"]'); await page.waitForTimeout(100);
  check((await st(nuevo.id)) === 'PLANIF', 'C1: planificada con la recomendación');
  await setRol('OPS'); await open(nuevo.id); await page.click('.exp-h .acts button.pri'); await page.waitForTimeout(80); check((await st(nuevo.id)) === 'EJEC', 'C1: iniciada');
  for (let i = 0; i < 12; i++) { await page.evaluate(id => simular(orden(id), 6), nuevo.id); }
  const fin = await page.evaluate(id => orden(id).ejecucion.acumulado, nuevo.id); check(fin >= 13999, 'C1: descarga completa (' + fin + ' t)');
  await page.evaluate(id => { finalizar(orden(id)); render(); }, nuevo.id); check((await st(nuevo.id)) === 'PEND_CIERRE', 'C1: finalizada');
  await setRol('DEP'); await open(nuevo.id, 'deposito'); await page.click('[data-action="principal"][data-act="cerrar"]'); await page.waitForTimeout(80); check((await st(nuevo.id)) === 'CERRADA', 'C1: cerrada por Depósito');
  const cmp = await page.evaluate(id => comparativas(orden(id)).map(r => r.k + '=' + [r.rec, r.plan, r.real].map(v => v == null ? '-' : (typeof v === 'number' ? Math.round(v) : v)).join('/')), nuevo.id); log('C1 comparativas:', cmp.join(' · '));
  await page.screenshot({ path: 'test/shot-cierre.png', fullPage: false });

  /* Caso 10: instrumento sin cobertura → adenda */
  await setRol('COM'); await page.evaluate(() => go('nueva')); await page.waitForTimeout(50);
  await wsel('entidad', 'TYS'); await wsel('servicio', 'SRV-CAR'); await wsel('medio', 'BUQ'); await wsel('dest', 'cliente:CLI-05'); await wsel('producto', 'SOJA');
  check((await page.$$eval('#w-instrumento option', os => os.length)) === 1, 'C10: sin instrumento vigente para Granos del Sur');
  check((await text('#main')).includes('vencido el'), 'C10: explica el motivo (vencido)');
  await page.click('[data-action="w-inst-adenda"][data-id="TAR-SPOT-2026"]'); await page.waitForTimeout(60);
  await page.click('[data-action="modal-ok"]'); await page.waitForTimeout(80);
  const instSel = await page.$eval('#w-instrumento', e => e.value); check(instSel === 'TAR-SPOT-2026-AD1', 'C10: adenda creada y seleccionada (' + instSel + ')');
  const ad = await page.evaluate(() => instr('TAR-SPOT-2026-AD1')); check(ad && ad.padre === 'TAR-SPOT-2026' && ad.servicios.includes('SRV-CAR') && ad.productos.includes('SOJA'), 'C10: adenda hereda padre, servicio y producto');
  await wsel('origen', 'lineup:LU-2026-035:0'); check((await page.evaluate(() => W.toneladas)) === 30000, 'C10: lineup MV Pampa Star seleccionable (30.000 t)');
  await page.click('[data-action="w-enviar"]'); await page.waitForTimeout(100);
  const o13 = await page.evaluate(() => S.orders[S.orders.length - 1]); check(o13.contrato && o13.contrato.id === 'TAR-SPOT-2026-AD1' && o13.contrato.padre === 'TAR-SPOT-2026', 'C10: orden creada con la adenda como contrato (' + o13.id + ')');
  /* variante: producto no incluido */
  await page.evaluate(() => go('nueva')); await page.waitForTimeout(50);
  await wsel('entidad', 'TYS'); await wsel('servicio', 'SRV-DTD'); await wsel('medio', 'BUQ'); await wsel('dest', 'cliente:CLI-01'); await wsel('producto', 'SOJA');
  check((await text('#main')).includes('producto no incluido'), 'C10b: explica producto no incluido');
  await page.click('[data-action="w-inst-nuevo"]'); await page.waitForTimeout(60); await page.click('[data-action="modal-ok"]'); await page.waitForTimeout(80);
  check((await page.$eval('#w-instrumento', e => e.value)).startsWith('CTO-2026-1'), 'C10b: nuevo instrumento creado y seleccionado');
  await page.evaluate(() => { W = null; });

  /* LAR: solo consulta */
  await setRol('LAR'); await page.waitForTimeout(50);
  check((await page.$('#nav [data-screen="bandeja"]')) === null && (await page.$('#nav [data-screen="deposito"]')) === null, 'LAR: sin Workflow ni Depósito en el menú');
  await open('OS-2026-0006'); check((await text('.exp-h')).includes('Solo consulta') && (await page.$('[data-action="recurso-form"]')) === null, 'LAR: expediente en solo consulta');

  /* Caso 11: Logística de arribo administra; otros consultan */
  await setRol('COM'); await page.evaluate(() => go('arribos')); await page.waitForTimeout(50);
  check((await page.$('[data-action="lu-nuevo"]')) === null, 'C11: Comercial no ve el alta de lineup (consulta)');
  await setRol('LAR'); await page.evaluate(() => go('arribos')); await page.waitForTimeout(50);
  await page.click('[data-action="lu-nuevo"]'); await page.fill('#m-buque', 'MV Prueba Uno'); await page.fill('#modal-root .m-bl', 'BL-9001'); await page.selectOption('#m-eqb-tipo', 'Grúa'); await page.fill('#m-eqb-n', '3'); await page.click('[data-action="modal-ok"]'); await page.waitForTimeout(80);
  const luN = await page.evaluate(() => S.ops.lineups[S.ops.lineups.length - 1]); check(luN.buque === 'MV Prueba Uno' && luN.cargas.length === 1 && luN.cargas[0].bl === 'BL-9001', 'C11: lineup nuevo registrado (' + luN.id + ')');
  const bqN = await page.evaluate(id => buqueDeLineup(byId(S.ops.lineups, id)), luN.id); check(bqN && bqN.equipos_propios && bqN.equipos_propios.tipo === 'Grúa' && bqN.equipos_propios.cantidad === 3 && bqN.estado.startsWith('alta provisoria'), 'C12: LAR declara los equipos del buque en el maestro M-08 (alta provisoria sin IMO: ' + (bqN && bqN.id) + ')');
  /* Caso 13: master data completa (modelo v3.1) */
  await page.evaluate(() => { S.ctx.screen = 'md'; S.ctx.mdTab = 'MAESTROS'; S.ctx.mdM = 'M-34'; S.ctx.mdSub = 'REG'; render(); }); await page.waitForTimeout(40);
  const nVis = await page.evaluate(() => maestrosVisibles('LAR').length); check((await text('#main')).includes('M-34') && (await text('#main')).includes('accion_al_vencer') && (await page.$$('.mdnav button')).length === nVis && nVis === 34 && (await page.evaluate(() => maestrosVisibles('MD').length)) === 39, 'C13: navegador con los maestros visibles para el rol (LAR ' + nVis + ' de 39) y registros de M-34 con atributos del modelo');
  const nAttr = await page.evaluate(() => MODEL_ATRIBUTOS.length); check(nAttr === 374 && (await page.evaluate(() => MODEL_FICHAS.length)) === 35 && (await page.evaluate(() => MODEL_REGLAS.length)) === 58 && (await page.evaluate(() => MODEL_TX.length)) === 52, 'C13: modelo v3.1 completo (35 fichas · 374 atributos · 58 reglas · 52 TX)');
  await page.click('[data-action="mdsub"][data-sub="ATR"]'); await page.waitForTimeout(40); check((await text('#main')).includes('En la maqueta') && (await page.$$('#main table.t tbody tr')).length >= 12, 'C13: pestaña Atributos de M-34 con marca "En la maqueta"');
  await page.click('[data-action="mdgo"][data-m="M-07"]'); await page.waitForTimeout(40); check((await text('#main')).includes('Productos') && (await text('#main')).includes('tn_por_mano_turno'), 'C13: M-07 Productos con los atributos del modelo');
  const sitBZ = await page.evaluate(() => msSituacion('MS-BALANZA')); check(sitBZ.vigente && sitBZ.porVencer, 'C13: MS-BALANZA por vencer → balanzas con observaciones (aviso, no bloqueo)');
  const avBZ = await page.evaluate(() => chequearRecurso('BZ1', 1, orden('OS-2026-0005'))); check(avBZ.errores.length === 0 && avBZ.avisos.some(a => a.includes('MS-BALANZA')), 'C13: aviso de método seguro por vencer en la balanza');
  await page.evaluate(() => { S.ctx.mdM = 'M-34'; S.ctx.mdSub = 'REG'; render(); }); await page.click('[data-action="ms-renovar"][data-id="MS-BALANZA"]'); await page.waitForTimeout(40);
  check((await page.evaluate(() => msSituacion('MS-BALANZA').porVencer)) === false, 'C13: renovación del MS quita la observación');
  const fiscalChk = await page.evaluate(() => { const o = clone(orden('OS-2026-0002')); o.habilitaciones.nacionalizada = false; const b = byId(md().balanzas, 'BZ1'); const bak = b.habilitacion_fiscal_vto; b.habilitacion_fiscal_vto = isoDay(-1); const r = chequearRecurso('BZ1', 1, o); b.habilitacion_fiscal_vto = bak; return r.errores; }); check(fiscalChk.some(e => e.includes('habilitación fiscal vencida')), 'C13: balanza fiscal con habilitación vencida no se ofrece para mercadería no nacionalizada (M-26)');
  await page.evaluate(() => go('arribos')); await page.waitForTimeout(40);
  check((await page.evaluate(() => S.arriboLog.length)) >= 1 && (await text('#main')).includes('Registro de cambios'), 'C11: registro de cambios con quién/cuándo');
  await page.click('[data-action="cu-nuevo"]'); await page.click('[data-action="modal-ok"]'); await page.waitForTimeout(80);
  check((await page.evaluate(() => S.ops.cupos.length)) === 5, 'C11: cupo nuevo registrado');
  await page.click('[data-action="lu-editar"][data-id="' + luN.id + '"]'); await page.selectOption('#m-est', 'Confirmado'); await page.click('[data-action="modal-ok"]'); await page.waitForTimeout(80);
  check((await page.evaluate(id => byId(S.ops.lineups, id).estado, luN.id)) === 'Confirmado', 'C11: edición de lineup registrada');
  check((await page.evaluate(() => contadores().bandeja)) > 0, 'C11: workflow de LAR muestra arribos sin orden');
  /* Caso 12c: equipo ocupado → cambiar fecha de arribo del servicio (o13 · MV Pampa Star, sin equipos propios) */
  await setRol('PLAN'); await open(o13.id, 'planificacion');
  check(await page.$eval('#pf-eqorg option[value="buque"]', op => op.disabled), 'C12c: buque sin equipos propios → opción "Del buque" deshabilitada');
  if (!(await page.isChecked('input[data-pf="equipo"][value="G1"]'))) await page.check('input[data-pf="equipo"][value="G1"]'); await page.waitForTimeout(80);
  const conf13 = await page.evaluate(id => conflictosRecurso('G1', orden(id)), o13.id); check(conf13.length === 1 && conf13[0].orden === 'OS-2026-0005', 'C12c: G1 ocupada por OS-2026-0005 en la ventana de ' + o13.id);
  const prop13 = await page.evaluate(id => proponerArribo(orden(id), 'G1'), o13.id); const v13antes = await page.evaluate(id => orden(id).ventana, o13.id); const lu35antes = await page.evaluate(() => ({ eta: byId(S.ops.lineups, 'LU-2026-035').eta, etb: byId(S.ops.lineups, 'LU-2026-035').etb }));
  await page.click('[data-action="arribo-fecha"][data-rid="G1"]'); await page.waitForTimeout(60);
  check((await page.$('#m-ini')) !== null && (await text('#modal-root')).includes('OS-2026-0005'), 'C12c: modal de cambio de fecha con el conflicto y la propuesta');
  await page.click('[data-action="modal-ok"]'); await page.waitForTimeout(100);
  const o13b = await page.evaluate(id => orden(id), o13.id); const lu35 = await page.evaluate(() => byId(S.ops.lineups, 'LU-2026-035'));
  check(o13b.ventana.inicio === prop13.inicio && hoursBetween(o13b.ventana.inicio, o13b.ventana.fin) === hoursBetween(v13antes.inicio, v13antes.fin), 'C12c: ventana movida a la propuesta manteniendo la duración (' + o13b.ventana.inicio + ')');
  check(lu35.etb === prop13.inicio && hoursBetween(lu35antes.eta, lu35.eta) === hoursBetween(v13antes.inicio, prop13.inicio), 'C12c: ETA/ETB/ETC del lineup MV Pampa Star corridos igual');
  const al = await page.evaluate(() => S.arriboLog[0]); check(al.accion === 'Cambio de fecha de arribo' && al.rol === 'PLAN' && al.detalle.includes(o13.id), 'C12c: registro de Logística de arribo con el Planificador como responsable y la orden como motivo');
  check(o13b.historial.some(h => h.evento === 'Fecha de arribo modificada'), 'C12c: historial de la orden registra el cambio');
  const e13 = await page.evaluate(id => chequearRecurso('G1', 1, orden(id)).errores, o13.id); check(e13.length === 0, 'C12c: G1 disponible en la nueva ventana (' + e13.join(' | ') + ')');
  check((await page.evaluate(id => arriboModificable(orden('OS-2026-0006')).ok, o13.id)) === false, 'C12c: un buque en operación no admite cambio de fecha');

  /* comparativa propios / terceros */
  await setRol('DEP'); await page.evaluate(() => go('comparativas')); await page.waitForTimeout(50);
  check((await text('#main')).includes('Recursos propios y de terceros'), 'CMP: card propios/terceros presente');
  for (const dm of ['mercaderia', 'calidad', 'destino']) { await page.click('[data-action="cmpdim"][data-dim="' + dm + '"]'); await page.waitForTimeout(40); }
  check((await text('#main')).includes('Sin depósito') || (await text('#main')).includes('Celda'), 'CMP: agregado por destino renderiza');
  const pt = await page.evaluate(() => resumenPropiosTerceros(orden('OS-2026-0001'))); check(pt.Propio.nec > 0 && pt.Tercero.nec > 0 && pt.Tercero.apl > 0, 'CMP: OS-0001 tiene propios y terceros necesario/aplicado');
  await open('OS-2026-0001', 'historial'); check((await text('#main')).includes('necesario vs aplicado'), 'CMP: bloque en el expediente');

  /* Caso 14: rol Máster data · ABM genérico · permisos por rol · validación (S17) */
  await setRol('MD'); await page.waitForTimeout(50);
  check((await page.$('#nav [data-screen="deposito"]')) === null && (await page.$('#nav [data-screen="bandeja"]')) !== null, 'C14: Máster data sin Depósito en el menú, con Workflow (registros en validación)');
  await open('OS-2026-0006'); check((await text('.exp-h')).includes('Solo consulta') && (await page.$('[data-action="recurso-form"]')) === null && (await page.$('[data-action="anular"]')) === null, 'C14: expediente en solo consulta para Máster data (sin devolver / anular)');
  await page.evaluate(() => go('casos')); await page.click('[data-action="caso"][data-n="14"]'); await page.waitForTimeout(60);
  check((await page.evaluate(() => S.ctx.screen + ':' + S.ctx.rol + ':' + S.ctx.mdM)) === 'md:MD:M-29' && (await page.$('[data-action="md-nuevo"][data-m="M-29"]')) !== null, 'C14: caso 14 abre M-29 como Máster data con "Nuevo registro"');
  await page.click('[data-action="md-nuevo"][data-m="M-29"]'); await page.waitForTimeout(60);
  check((await page.$('#md-id')) !== null && (await page.$('#md-nombre')) !== null && (await page.$('#md-imputable_a')) !== null, 'C14: formulario genérico armado con los atributos del maestro (codigo, nombre, imputable_a…)');
  await page.fill('#md-id', 'CD-99'); await page.fill('#md-nombre', 'Corte de energía en planta'); await page.click('[data-action="modal-ok"]'); await page.waitForTimeout(80);
  const cd99 = await page.evaluate(() => byId(md().causasDemora, 'CD-99')); check(cd99 && cd99._aud.estado_registro === 'vigente' && cd99._aud.origen === 'manual' && cd99._aud.creado_por === 'L. Benítez', 'C14: alta de Máster data nace vigente con auditoría (manual · L. Benítez)');
  check((await page.evaluate(() => S.mdLog[0].accion + ':' + S.mdLog[0].maestro + ':' + S.mdLog[0].registro)) === 'Alta:M-29:CD-99', 'C14: registro de cambios con quién, cuándo, maestro y registro');
  await page.click('[data-action="md-editar"][data-m="M-29"][data-id="CD-99"]'); await page.waitForTimeout(60); await page.fill('#md-nombre', 'Corte de energía en planta (EPE)'); await page.click('[data-action="modal-ok"]'); await page.waitForTimeout(80);
  check((await page.evaluate(() => { const c = byId(md().causasDemora, 'CD-99'); return c.nombre + ':' + c._aud.version; })) === 'Corte de energía en planta (EPE):2' && (await page.evaluate(() => S.mdLog[0].accion)) === 'Modificación', 'C14: modificación versiona el registro (v2) y queda en el registro de cambios');
  /* permisos */
  await page.click('[data-action="mdtab"][data-tab="PERM"]'); await page.waitForTimeout(60);
  check((await page.$$('select.perm')).length === 39 * 5, 'C14: matriz de permisos 39 maestros × 5 roles editable por Máster data');
  await page.selectOption('[data-perm="M-29:PLAN"]', 'abm'); await page.waitForTimeout(60); await page.selectOption('[data-perm="M-18:PLAN"]', 'oculto'); await page.waitForTimeout(60);
  check((await page.evaluate(() => permisoMD('M-29', 'PLAN') + ':' + permisoMD('M-18', 'PLAN') + ':' + permisoMD('M-18', 'MD'))) === 'abm:oculto:abm' && (await page.evaluate(() => S.mdLog[0].accion)) === 'Permiso', 'C14: permisos otorgados / quitados y registrados (Máster data siempre ABM)');
  await setRol('PLAN'); await page.evaluate(() => { S.ctx.mdTab = 'MAESTROS'; S.ctx.mdM = 'M-01'; render(); }); await page.waitForTimeout(50);
  check((await page.$$('.mdnav button')).length === 36 && (await page.$('.mdnav button[data-m="M-18"]')) === null, 'C14: el Planificador deja de ver M-18 (36 visibles: M-03, M-04 y M-18 ocultos)');
  await page.evaluate(() => { S.ctx.mdM = 'M-18'; render(); }); await page.waitForTimeout(40); check((await text('#main')).includes('no visualiza este maestro'), 'C14: enlace directo a un maestro oculto → aviso de permiso');
  await page.evaluate(() => { S.ctx.mdM = 'M-29'; render(); }); await page.waitForTimeout(40); check((await page.$('[data-action="md-nuevo"]')) !== null && (await text('#main')).includes('Puede ABM'), 'C14: el Planificador ahora puede ABM en M-29');
  await page.evaluate(() => { S.ctx.mdM = 'M-07'; render(); }); await page.waitForTimeout(40); check((await page.$('[data-action="md-nuevo"]')) === null && (await text('#main')).includes('Solo consulta'), 'C14: el Planificador consulta M-07 sin ABM');
  /* alta de un rol con permiso ABM → en validación */
  await setRol('OPS'); await page.evaluate(() => { S.ctx.mdM = 'M-29'; S.ctx.mdSub = 'REG'; render(); }); await page.waitForTimeout(40);
  await page.click('[data-action="md-nuevo"][data-m="M-29"]'); await page.fill('#md-id', 'CD-98'); await page.fill('#md-nombre', 'Espera de muestreo de calidad'); await page.click('[data-action="modal-ok"]'); await page.waitForTimeout(80);
  const cd98 = await page.evaluate(() => byId(md().causasDemora, 'CD-98')); check(cd98 && cd98._aud.estado_registro === 'en validación' && cd98._aud.creado_por === 'R. Ocampo', 'C14: alta de Operaciones nace "en validación"');
  await open('OS-2026-0006', 'ejecucion'); await page.click('[data-action="demora-form"]'); await page.waitForTimeout(40);
  check((await page.$('#m-causa option[value="CD-98"]')) === null && (await page.$('#m-causa option[value="CD-99"]')) !== null, 'C14: el circuito no usa el registro en validación (sí el vigente CD-99)');
  await page.click('[data-action="modal-cancel"] >> nth=-1').catch(() => null); await page.keyboard.press('Escape'); await page.waitForTimeout(30);
  await setRol('MD'); await page.evaluate(() => go('bandeja')); await page.waitForTimeout(50);
  check((await text('#main')).includes('CD-98') && (await page.evaluate(() => contadores().bandeja)) === 1, 'C14: Workflow de Máster data lista el registro en validación (contador 1)');
  await page.click('[data-action="md-validar"][data-m="M-29"][data-id="CD-98"]'); await page.fill('#m-det', 'Verificado con Operaciones'); await page.click('[data-action="modal-ok"]'); await page.waitForTimeout(80);
  check((await page.evaluate(() => byId(md().causasDemora, 'CD-98')._aud.estado_registro + ':' + byId(md().causasDemora, 'CD-98')._aud.validado_por)) === 'vigente:L. Benítez' && (await page.evaluate(() => contadores().bandeja)) === 0, 'C14: Máster data valida y publica → vigente');
  /* baja lógica de un recurso */
  await page.evaluate(() => { S.ctx.screen = 'md'; S.ctx.mdTab = 'MAESTROS'; S.ctx.mdM = 'M-26'; S.ctx.mdSub = 'REG'; render(); }); await page.waitForTimeout(40);
  await page.click('[data-action="md-nuevo"][data-m="M-26"]'); await page.fill('#md-id', 'BZ9'); await page.fill('#md-nombre', 'Balanza 9 (prueba)'); await page.selectOption('#md-entidad', 'TYS').catch(() => null); await page.fill('#md-capacidadT', '80'); await page.click('[data-action="modal-ok"]'); await page.waitForTimeout(80);
  check((await page.evaluate(() => byId(md().balanzas, 'BZ9')?._aud.estado_registro)) === 'vigente', 'C14: alta de balanza BZ9 por Máster data');
  await setRol('PLAN'); await open(o13.id, 'planificacion'); check((await page.$('#pf-bz option[value="BZ9"]')) !== null, 'C14: la balanza nueva se ofrece en la planificación');
  await setRol('MD'); await page.evaluate(() => { S.ctx.screen = 'md'; S.ctx.mdTab = 'MAESTROS'; S.ctx.mdM = 'M-26'; render(); }); await page.waitForTimeout(40);
  const bzRes = await page.evaluate(() => bajaMD('M-26', 'BZ1', 'prueba')); check(!bzRes.ok && bzRes.motivo.includes('reservad'), 'C14: no se da de baja un recurso reservado por órdenes planificadas / en ejecución');
  await page.click('[data-action="md-baja"][data-m="M-26"][data-id="BZ9"]'); await page.fill('#m-mot', 'Equipo devuelto al proveedor'); await page.click('[data-action="modal-ok"]'); await page.waitForTimeout(80);
  check((await page.evaluate(() => deBaja(byId(md().balanzas, 'BZ9')))) && (await page.evaluate(() => S.mdLog[0].accion)) === 'Baja', 'C14: baja lógica registrada (el registro se conserva)');
  await setRol('PLAN'); await open(o13.id, 'planificacion'); check((await page.$('#pf-bz option[value="BZ9"]')) === null && (await page.evaluate(id => chequearRecurso('BZ9', 1, orden(id)).errores.some(e => e.includes('dado de baja')), o13.id)), 'C14: el recurso dado de baja deja de ofrecerse y la validación lo rechaza');
  await page.screenshot({ path: 'test/shot-md-permisos.png', fullPage: false });

  /* Caso 15: devolver al paso anterior · anular (S18) */
  await setRol('OPS'); await open('OS-2026-0007');
  check((await page.$('[data-action="devolver"]')) !== null && (await page.$('[data-action="anular"]')) !== null && (await text('.exp-h .acts')).includes('Devolver a Pendiente de planificación'), 'C15: Operaciones ve Devolver y Anular junto a Iniciar');
  await setRol('COM'); await open('OS-2026-0007'); check((await page.$('[data-action="devolver"]')) === null, 'C15: otro rol no ve las acciones de la etapa');
  await setRol('OPS'); await open('OS-2026-0007');
  await page.click('[data-action="devolver"]'); await page.waitForTimeout(40); await page.selectOption('#m-motivo', 'Recursos planificados no disponibles'); await page.fill('#m-det', 'G1 sale a mantenimiento'); await page.click('[data-action="modal-ok"]'); await page.waitForTimeout(100);
  const o7d = await page.evaluate(() => orden('OS-2026-0007')); check(o7d.estado === 'PEND_PLAN' && o7d.plan === null && o7d.planDevuelto && o7d.planDevuelto.version === 2 && o7d.devolucion.rol === 'OPS' && o7d.devolucion.motivo.startsWith('Recursos planificados'), 'C15: OS-0007 devuelta a Pendiente de planificación; plan v2 conservado como historial');
  check(!(await page.evaluate(() => reservasRecurso('G1', null).some(rv => rv.o.id === 'OS-2026-0007'))), 'C15: las reservas de la orden devuelta se liberan');
  check((await text('#main h1')).includes('Workflow'), 'C15: tras devolver vuelve a Workflow · mi etapa');
  await setRol('PLAN'); await page.evaluate(() => go('bandeja')); await page.waitForTimeout(50); check((await text('#main')).includes('Devuelta por Operaciones'), 'C15: el Planificador la recibe en su bandeja con el motivo');
  await open('OS-2026-0007'); check((await text('#main')).includes('Devuelta a Pendiente de planificación') && (await text('#main')).includes('G1 sale a mantenimiento'), 'C15: el expediente muestra el aviso de devolución');
  await open('OS-2026-0011'); await page.click('[data-action="devolver"]'); await page.waitForTimeout(40); await page.click('[data-action="modal-ok"]'); await page.waitForTimeout(80);
  check((await st('OS-2026-0011')) === 'BORR', 'C15: el Planificador devuelve OS-0011 a Borrador');
  await setRol('COM'); await open('OS-2026-0011'); check((await page.$('[data-action="editar-borrador"]')) !== null && (await text('#main')).includes('Devuelta a Borrador'), 'C15: Comercial puede editar el borrador devuelto');
  await setRol('OPS'); await open('OS-2026-0006'); check(await page.$eval('[data-action="devolver"]', b => b.disabled) && !(await page.evaluate(() => puedeDevolver(orden('OS-2026-0006')).ok)), 'C15: una ejecución con tickets no se revierte (solo finalizar o anular)');
  /* anular desde Planificada (OS-0005 planificada en C5) */
  const lu5 = await page.evaluate(() => orden('OS-2026-0005').origen); const eqs5 = await page.evaluate(() => orden('OS-2026-0005').plan.recursos.equipos);
  await open('OS-2026-0005'); await page.click('[data-action="anular"]'); await page.waitForTimeout(40); await page.selectOption('#m-motivo', 'Cancelación del arribo o del servicio por el cliente'); await page.fill('#m-det', 'Aviso de la agencia 15/09'); await page.click('[data-action="modal-ok"]'); await page.waitForTimeout(100);
  const o5 = await page.evaluate(() => orden('OS-2026-0005')); check(o5.estado === 'ANULADA' && o5.anulacion.desde === 'PLANIF' && o5.anulacion.motivo.includes('Aviso de la agencia') && o5.plan && o5.historial.slice(-1)[0].evento === 'Anular orden', 'C15: OS-0005 anulada desde Planificada con motivo; plan e historial conservados');
  check(!(await page.evaluate(g => reservasRecurso(g, null).some(rv => rv.o.id === 'OS-2026-0005'), eqs5[0])), 'C15: la anulación libera las reservas (' + eqs5[0] + ')');
  check((await page.evaluate(g => ordenesDeOrigen('lineup', g.id, g.cargaIdx).length, lu5)) === 0 && (await page.evaluate(g => arribosSinOrden().some(a => a.id === g.id), lu5)), 'C15: la carga del lineup vuelve a estar sin orden');
  await open('OS-2026-0005'); check((await text('#main')).includes('Orden anulada') && (await page.$('[data-action="principal"]')) === null && (await text('.exp-h .acts')).includes('solo consulta'), 'C15: expediente anulado en solo consulta con el motivo');
  await page.evaluate(() => go('bandeja')); await page.waitForTimeout(40); check((await page.$$('.pipe .kpi')).length === 7 && (await text('.pipe')).includes('Anulada'), 'C15: pipeline con 7 estados incluye Anulada');
  /* devolver desde Pendiente de cierre (Depósito) */
  await page.evaluate(() => { finalizar(orden('OS-2026-0006')); render(); }); check((await st('OS-2026-0006')) === 'PEND_CIERRE', 'C15: OS-0006 finalizada para probar la devolución del cierre');
  await setRol('DEP'); await open('OS-2026-0006', 'deposito'); check((await text('.exp-h .acts')).includes('Devolver a En ejecución'), 'C15: Depósito ve Devolver a En ejecución');
  await page.click('[data-action="devolver"]'); await page.waitForTimeout(40); await page.fill('#m-det', 'Falta el último ticket'); await page.click('[data-action="modal-ok"]'); await page.waitForTimeout(100);
  const o6 = await page.evaluate(() => orden('OS-2026-0006')); check(o6.estado === 'EJEC' && o6.ejecucion.fin === null && o6.ejecucion.recursos.some(r => !r.hasta) && o6.devolucion.rol === 'DEP', 'C15: el operativo vuelve a ejecución con recursos activos');
  await setRol('OPS'); await page.evaluate(() => go('bandeja')); await page.waitForTimeout(40); check((await text('#main')).includes('Devuelta por Depósito'), 'C15: Operaciones la recibe en su bandeja con el motivo');
  await open('OS-2026-0006', 'ejecucion'); await page.screenshot({ path: 'test/shot-devolver.png', fullPage: false });
  check((await page.evaluate(() => anular(orden('OS-2026-0001')).ok)) === false, 'C15: una orden cerrada no se anula');

  /* Caso 16: toneladas y fechas del servicio definidas por Comercial (S19) */
  await setRol('COM'); await page.evaluate(() => go('nueva')); await page.waitForTimeout(50);
  await wsel('entidad', 'TYS'); await wsel('servicio', 'SRV-DTD'); await wsel('medio', 'BUQ'); await wsel('dest', 'cliente:CLI-02'); await wsel('producto', 'DAP'); await wsel('origen', 'lineup:LU-2026-038:0');
  check((await page.$('input[data-w="toneladas"]')) !== null && (await page.$('input[data-w="ventanaInicio"]')) !== null && (await page.$('input[data-w="ventanaFin"]')) !== null, 'C16: el alta muestra toneladas a operar e inicio / fin del servicio editables');
  const tonProp = await page.evaluate(() => W.toneladas); check(tonProp > 0 && tonProp <= 14000, 'C16: toneladas propuestas por el remanente del BL (' + tonProp + ' t)');
  await page.fill('input[data-w="toneladas"]', '8000'); await page.dispatchEvent('input[data-w="toneladas"]', 'change'); await page.waitForTimeout(60);
  const lu38 = await page.evaluate(() => byId(S.ops.lineups, 'LU-2026-038')); const iniNuevo = await page.evaluate(() => toLocalInput(addHours(byId(S.ops.lineups, 'LU-2026-038').etb, 24)));
  await page.fill('input[data-w="ventanaInicio"]', iniNuevo); await page.dispatchEvent('input[data-w="ventanaInicio"]', 'change'); await page.waitForTimeout(60);
  const W16 = await page.evaluate(() => W); check(W16.toneladas === '8000' || +W16.toneladas === 8000, 'C16: toneladas editadas a 8.000');
  check(Math.round(hoursBetween(lu38.etb, W16.ventana.inicio)) === 24 && W16.ventana.fin === lu38.etc, 'C16: inicio del servicio corrido 24 h respecto del ETB; fin conservado');
  await page.fill('input[data-w="ventanaFin"]', await page.evaluate(() => toLocalInput(byId(S.ops.lineups, 'LU-2026-038').etb))); await page.dispatchEvent('input[data-w="ventanaFin"]', 'change'); await page.waitForTimeout(60);
  check((await text('#main')).includes('el fin debe ser posterior al inicio'), 'C16: aviso cuando el fin es anterior al inicio');
  await page.click('[data-action="w-enviar"]'); await page.waitForTimeout(80); check((await page.evaluate(() => S.ctx.screen)) === 'nueva', 'C16: no se envía con fin anterior al inicio');
  await page.fill('input[data-w="ventanaFin"]', await page.evaluate(() => toLocalInput(byId(S.ops.lineups, 'LU-2026-038').etc))); await page.dispatchEvent('input[data-w="ventanaFin"]', 'change'); await page.waitForTimeout(60);
  await page.check('input[data-w="nacionalizada"]'); await page.waitForTimeout(60); await page.fill('input[data-w="nacRef"]', 'Despacho 26001IC04002777B'); await page.dispatchEvent('input[data-w="nacRef"]', 'change'); await page.waitForTimeout(60);
  await page.click('[data-action="w-enviar"]'); await page.waitForTimeout(100);
  const o16 = await page.evaluate(() => S.orders[S.orders.length - 1]); check(o16.estado === 'PEND_PLAN' && o16.toneladas === 8000 && Math.round(hoursBetween(lu38.etb, o16.ventana.inicio)) === 24, 'C16: orden creada con 8.000 t y la ventana definida por Comercial (' + o16.id + ')');
  check((await page.evaluate(id => ventanaReserva(orden(id)).inicio, o16.id)) === o16.ventana.inicio, 'C16: la ventana de la orden es la que valida disponibilidad y reservas');
  const ing16 = await page.evaluate(id => orden(id).lineas.find(l => l.componente === 'DES'), o16.id); check(ing16 && ing16.bu === 'TYS-OPS', 'C17: la línea Descarga se imputa a la BU Operaciones (no Logística)');
  await open(o16.id); check((await page.$('[data-action="datos-servicio"]')) !== null, 'C16: Comercial ve "Editar toneladas y fechas" en Pendiente de planificación');
  await page.click('[data-action="datos-servicio"]'); await page.fill('#m-t', '9000'); await page.fill('#m-mot', 'El cliente amplía a 9.000 t'); await page.click('[data-action="modal-ok"]'); await page.waitForTimeout(100);
  const o16b = await page.evaluate(id => orden(id), o16.id); check(o16b.toneladas === 9000 && o16b.historial.some(h => h.evento.startsWith('Toneladas y fechas')) && o16b.historial.slice(-1)[0].evento === 'Recomendación regenerada', 'C16: ABM de toneladas registrado y recomendación regenerada');
  await setRol('PLAN'); await open(o16.id, 'planificacion'); await page.click('[data-action="principal"][data-act="confirmar-plan"]'); await page.waitForTimeout(100); check((await st(o16.id)) === 'PLANIF', 'C16: planificada con la ventana de Comercial');
  await setRol('COM'); await open(o16.id); check((await page.$('[data-action="datos-servicio"]')) === null && (await page.evaluate(id => editarDatosServicio(orden(id), { toneladas: 100 }).ok, o16.id)) === false, 'C16: planificada → toneladas y fechas ya no se editan (hay que devolver)');

  /* Caso 17: módulos habilitados por rol / sector (S20) */
  await page.evaluate(() => { S.ctx.screen = 'admin'; S.ctx.admTab = 'MOD'; render(); }); await page.waitForTimeout(50);
  check((await page.$$('input[data-moddim^="rol:"]')).length === 11 * 6 && await page.$eval('input[data-moddim="rol:COM:inicio"]', e => e.disabled && e.checked), 'C17: matriz módulos (11) × roles (6) con Inicio fijo');
  await page.uncheck('input[data-moddim="rol:PLAN:comparativas"]'); await page.waitForTimeout(60);
  check((await page.evaluate(() => moduloHabilitado('comparativas', 'PLAN'))) === false && (await page.evaluate(() => S.mdLog[0].accion)) === 'Módulo', 'C17: Comparativas deshabilitada para el Planificador y registrada');
  await setRol('PLAN'); check((await page.$('#nav [data-screen="comparativas"]')) === null && (await page.$('#nav [data-screen="recursos"]')) !== null, 'C17: el menú del Planificador ya no muestra Comparativas');
  await page.evaluate(() => go('comparativas')); await page.waitForTimeout(40); await page.click('#nav [data-screen="inicio"]'); await page.waitForTimeout(30);
  await page.evaluate(() => { S.ctx.screen = 'inicio'; render(); }); await page.click('[data-action="go"][data-screen="ordenes"]'); await page.waitForTimeout(40);
  check((await page.evaluate(() => S.ctx.screen)) === 'ordenes', 'C17: los módulos habilitados siguen navegables');
  await page.evaluate(() => { document.getElementById('main').innerHTML = '<button data-action="go" data-screen="comparativas" id="tmp-go">x</button>'; }); await page.click('#tmp-go'); await page.waitForTimeout(40);
  check((await page.evaluate(() => S.ctx.screen)) === 'inicio', 'C17: un enlace directo a un módulo deshabilitado vuelve a Inicio');
  await page.evaluate(() => { S.ctx.screen = 'comparativas'; }); await setRol('PLAN'); check((await page.evaluate(() => S.ctx.screen)) === 'inicio', 'C17: al cambiar a un rol sin el módulo, la pantalla actual vuelve a Inicio');
  await page.evaluate(() => setModulo('PLAN', 'comparativas', true));
  check((await page.evaluate(() => md().matrizEjecucion.TYS.DES + ':' + md().matrizEjecucion.TYS.TRA)) === 'TYS-OPS:TYS-LOG' && (await page.evaluate(() => !!bu('TYS-OPS'))), 'C17: matriz de ejecución: Descarga → Operaciones, Transporte → Logística');
  await page.evaluate(() => go('casos')); await page.click('[data-action="caso"][data-n="17"]'); await page.waitForTimeout(60); check((await page.evaluate(() => S.ctx.screen + ':' + S.ctx.admTab + ':' + S.ctx.rol)) === 'admin:MOD:MD', 'C17: el caso 17 abre Administración › Menú por rol, entidad y BU');

  /* Caso 18: Rental y Logística — medio interna / externa, cliente según el medio, detalle del servicio (S21) */
  const o9 = await page.evaluate(() => orden('OS-2026-0009')); check(o9.medio === 'INT' && o9.detalle && o9.detalle.tipo === 'rental' && o9.detalle.maquinarias['L-PALA'] === 1 && !o9.origen, 'C18: OS-0009 (Rental → Depósitos) nace como servicio interno con detalle de maquinaria');
  const o10 = await page.evaluate(() => orden('OS-2026-0010')); check(o10.medio === 'INT' && o10.detalle.tipo === 'logistica' && o10.detalle.origen === 'PL-TT' && o10.detalle.destino === 'PL-SN' && o10.detalle.km > 60 && o10.detalle.km < 120, 'C18: OS-0010 (Logística → TT) con km calculados automáticamente Timbúes → San Nicolás (' + o10.detalle.km + ' km)');
  check((await page.evaluate(() => kmEntre('PL-SN', 'CLI:CLI-02'))) > 50 && (await page.evaluate(() => kmEntre('PL-SN', 'PU-SN'))) <= 2, 'C18: kmEntre geodésica × factor de ruta (SN → Pergamino > 50 km; planta → puerto ≤ 2 km)');
  await setRol('COM'); await page.evaluate(() => go('nueva')); await page.waitForTimeout(50);
  await wsel('entidad', 'TYS'); await wsel('servicio', 'SRV-ALQM');
  check((await page.$eval('#w-bu', e => e.value)) === 'TYS-RENT', 'C18: BU prestadora Rental autocompletada');
  const medios18 = await page.$$eval('#w-medio option', os => os.map(o => o.value).filter(Boolean)); check(medios18.join() === 'INT,EXT', 'C18: el medio es Interna / Externa (' + medios18.join(',') + ')');
  await wsel('medio', 'INT'); let dests = await page.$$eval('#w-dest option', os => os.map(o => o.value).filter(Boolean)); check(dests.some(v => v === 'bu:TYS-DEP') && dests.every(v => !v.startsWith('cliente:')) && dests.every(v => v !== 'bu:TYS-RENT'), 'C18: Interna → las otras BU (sin la prestadora) y empresas del grupo, sin clientes');
  await wsel('medio', 'EXT'); dests = await page.$$eval('#w-dest option', os => os.map(o => o.value).filter(Boolean)); check(dests.length === 5 && dests.every(v => v.startsWith('cliente:')), 'C18: Externa → nómina de clientes');
  await wsel('medio', 'INT'); await wsel('dest', 'bu:TYS-DEP'); await page.waitForTimeout(60);
  check((await page.evaluate(() => W.producto + ':' + W.instrumento + ':' + W.origen)) === 'NA:ACU-INT-TYS:detalle::' && (await page.$('#w-origen')) === null && (await page.$$('input[data-det^="maq:"]')).length === 5, 'C18: producto NA, acuerdo interno, sin paso de origen: detalle con 5 maquinarias de Rental');
  await page.check('input[data-det="maq:L-PALA"]'); await page.waitForTimeout(60); await page.fill('input[data-det="maqn:L-PALA"]', '2'); await page.dispatchEvent('input[data-det="maqn:L-PALA"]', 'change'); await page.waitForTimeout(60);
  await page.check('input[data-det="maq:L-AUTOEL"]'); await page.waitForTimeout(60);
  await page.fill('input[data-det="kmEntrega"]', '12'); await page.dispatchEvent('input[data-det="kmEntrega"]', 'change'); await page.waitForTimeout(60); await page.fill('input[data-det="kmDevolucion"]', '12'); await page.dispatchEvent('input[data-det="kmDevolucion"]', 'change'); await page.waitForTimeout(60);
  check((await text('#main')).includes('Costo estimado') && (await page.evaluate(() => W.det.maquinarias['L-PALA'] + ':' + W.det.maquinarias['L-AUTOEL'] + ':' + W.det.kmEntrega)) === '2:1:12', 'C18: 2 palas + 1 autoelevador, 12 km de entrega, costo estimado');
  await page.click('[data-action="w-enviar"]'); await page.waitForTimeout(100);
  const oR = await page.evaluate(() => S.orders[S.orders.length - 1]); check(oR.servicio === 'SRV-ALQM' && oR.medio === 'INT' && oR.relacion === 'Interna' && oR.detalle.maquinarias['L-PALA'] === 2 && oR.detalle.kmDevolucion === 12 && oR.estado === 'PEND_PLAN', 'C18: orden de Rental creada con el detalle (' + oR.id + ')');
  await setRol('PLAN'); await open(oR.id, 'planificacion');
  check((await page.$eval('input[data-pf="log:L-PALA"]', e => e.value)) === '2' && (await page.$eval('input[data-pf="log:L-AUTOEL"]', e => e.value)) === '1' && (await text('#main')).includes('Solicitado por Comercial'), 'C18: el Planificador recibe lo solicitado cargado en la asignación');
  await page.click('[data-action="principal"][data-act="confirmar-plan"]'); await page.waitForTimeout(100); check((await st(oR.id)) === 'PLANIF', 'C18: Rental planificada');
  check((await page.evaluate(id => costoPlan(orden(id), { recursos: orden(id).plan.recursos }).items.some(i => i.rid === 'KM' && i.monto === 24 * md().parametros.costoKmTraslado), oR.id)), 'C18: el costo incluye el traslado (24 km × USD/km)');
  await open(oR.id, 'origen'); check((await text('#main')).includes('Maquinarias solicitadas') && (await text('#main')).includes('Km de devolución'), 'C18: el expediente › Origen muestra el detalle de Rental');
  /* logística externa */
  await setRol('COM'); await page.evaluate(() => go('nueva')); await page.waitForTimeout(50);
  await wsel('entidad', 'TYS'); await wsel('servicio', 'SRV-LOGI'); await wsel('medio', 'EXT'); await wsel('dest', 'cliente:CLI-02'); await wsel('producto', 'UREA'); await page.waitForTimeout(60);
  check((await page.evaluate(() => W.instrumento + ':' + W.origen + ':' + W.det.tipo + ':' + W.det.destino)) === 'CTO-2026-021:detalle:::logistica:CLI:CLI-02', 'C18: Logística externa → instrumento del cliente y destino propuesto en el lugar del cliente');
  check((await page.$('select[data-det="camion"]')) !== null && (await page.$('select[data-det="origen"]')) !== null && (await text('#main')).includes('Km del tramo'), 'C18: detalle logístico con camión, origen / destino y km automáticos');
  await page.fill('input[data-w="toneladas"]', '900'); await page.dispatchEvent('input[data-w="toneladas"]', 'change'); await page.waitForTimeout(60);
  await page.selectOption('select[data-det="camion"]', 'L-CAM-3RO'); await page.waitForTimeout(60); await page.fill('input[data-det="cantidad"]', '3'); await page.dispatchEvent('input[data-det="cantidad"]', 'change'); await page.waitForTimeout(60);
  const kmSNPerg = await page.evaluate(() => kmEntre('PL-SN', 'CLI:CLI-02')); check((await text('#main')).includes(kmSNPerg + ' km') && (await text('#main')).includes('30 viajes'), 'C18: km del tramo automáticos (' + kmSNPerg + ' km) y 30 viajes estimados (900 t / 30 t)');
  await page.selectOption('select[data-det="destino"]', 'PL-SN'); await page.waitForTimeout(60); check((await text('#main')).includes('Origen y destino deben ser distintos'), 'C18: origen = destino → aviso');
  await page.click('[data-action="w-enviar"]'); await page.waitForTimeout(80); check((await page.evaluate(() => S.ctx.screen)) === 'nueva', 'C18: no se envía con origen = destino');
  await page.selectOption('select[data-det="destino"]', 'CLI:CLI-02'); await page.waitForTimeout(60); await page.click('[data-action="w-enviar"]'); await page.waitForTimeout(100);
  const oL = await page.evaluate(() => S.orders[S.orders.length - 1]); check(oL.servicio === 'SRV-LOGI' && oL.medio === 'EXT' && oL.relacion === 'Externa' && oL.detalle.camion === 'L-CAM-3RO' && oL.detalle.cantidad === 3 && oL.detalle.km === kmSNPerg && oL.toneladas === 900, 'C18: orden logística externa creada con km automáticos (' + oL.id + ')');
  const kL = await page.evaluate(id => kmDetalle(orden(id)), oL.id); check(kL.viajes === 30 && kL.kmTotal === kmSNPerg * 2 * 30, 'C18: km totales ida y vuelta × viajes (' + kL.kmTotal + ' km)');
  await setRol('PLAN'); await open(oL.id, 'planificacion'); check((await page.$eval('input[data-pf="log:L-CAM-3RO"]', e => e.value)) === '3', 'C18: 3 camiones de transportista precargados en la asignación');
  await page.click('[data-action="principal"][data-act="confirmar-plan"]'); await page.waitForTimeout(100); check((await st(oL.id)) === 'PLANIF', 'C18: Logística planificada');
  check((await page.evaluate(id => costoPlan(orden(id), { recursos: orden(id).plan.recursos }).items.find(i => i.rid === 'KM')?.monto, oL.id)) === kmSNPerg * 60 * 1.9, 'C18: costo de km en el plan (km totales × USD/km por camión)');
  await page.screenshot({ path: 'test/shot-v28-logistica.png', fullPage: false });

  /* Caso 19: menú de Operación por entidad y por BU · ABM del modelo por Máster data (S22) */
  await setRol('MD'); await page.evaluate(() => { S.ctx.entidad = 'TYS'; S.ctx.bu = 'ALL'; S.ctx.screen = 'admin'; S.ctx.admTab = 'MOD'; render(); }); await page.waitForTimeout(50);
  const nEnt = await page.evaluate(() => md().entidades.length), nBU = await page.evaluate(() => md().bus.length);
  check((await page.$$('input[data-moddim^="entidad:"]')).length === 7 * nEnt && (await page.$$('input[data-moddim^="bu:"]')).length === 7 * nBU && (await page.$('#adm-sim-rol')) !== null, 'C19: matrices del menú de Operación por entidad (' + nEnt + ') y por BU (' + nBU + ') y simulador por rol');
  check(!(await page.evaluate(() => moduloHabilitadoBU('arribos', 'TYS-RENT'))) && !(await page.evaluate(() => moduloHabilitadoEntidad('deposito', 'AMA'))) && (await page.evaluate(() => moduloHabilitado('arribos', 'COM', 'TYS', 'ALL'))), 'C19: valores iniciales (Rental sin Logística de arribo; Amarre sin Depósito; con "Todas las BU" no se aplica)');
  await page.uncheck('input[data-moddim="entidad:TT:recursos"]'); await page.waitForTimeout(60);
  check(!(await page.evaluate(() => moduloHabilitadoEntidad('recursos', 'TT'))) && (await page.evaluate(() => S.mdLog[0].accion + ':' + S.mdLog[0].maestro)) === 'Módulo:M-01', 'C19: Recursos deshabilitado para Terminal Timbúes y registrado');
  await page.selectOption('#adm-sim-ent', 'TT'); await page.waitForTimeout(60); check((await text('#main')).includes('Recursos · la entidad TT'), 'C19: el simulador explica por qué Recursos queda oculto para TT');
  await page.selectOption('#ctx-entidad', 'TT'); await page.waitForTimeout(80); check((await page.$('#nav [data-screen="recursos"]')) === null && (await page.$('#nav [data-screen="ordenes"]')) !== null, 'C19: con Entidad = TT el menú no muestra Recursos');
  await page.evaluate(() => go('recursos')); await page.waitForTimeout(40); await page.evaluate(() => { S.ctx.screen = 'recursos'; }); await page.selectOption('#ctx-entidad', 'TT'); await page.waitForTimeout(60); check((await page.evaluate(() => S.ctx.screen)) === 'inicio', 'C19: al cambiar el contexto a una entidad sin el módulo, la pantalla vuelve a Inicio');
  await page.selectOption('#ctx-entidad', 'TYS'); await page.waitForTimeout(60); await page.selectOption('#ctx-bu', 'TYS-RENT'); await page.waitForTimeout(80);
  check((await page.$('#nav [data-screen="arribos"]')) === null && (await page.$('#nav [data-screen="deposito"]')) === null && (await page.$('#nav [data-screen="recursos"]')) !== null, 'C19: con BU = Rental el menú no muestra Logística de arribo ni Depósito');
  await page.selectOption('#ctx-bu', 'ALL'); await page.waitForTimeout(60); check((await page.$('#nav [data-screen="arribos"]')) !== null, 'C19: con Todas las BU vuelve a mostrarse');
  await page.evaluate(() => setModuloDim('entidad', 'TT', 'recursos', true));
  check((await page.evaluate(() => setModuloDim('entidad', 'TYS', 'md', false).ok)) === false, 'C19: los módulos de Configuración solo se administran por rol');
  /* ABM del modelo por Máster data */
  await page.evaluate(() => { S.ctx.screen = 'md'; S.ctx.mdTab = 'CONV'; render(); }); await page.waitForTimeout(50);
  check((await page.$('[data-action="md-nuevo"][data-m="CV"]')) !== null && (await page.$$('[data-action="md-editar"][data-m="CV"]')).length === 9, 'C19: Máster data ve Nuevo / Editar / Dar de baja en Convenciones');
  await page.click('[data-action="md-nuevo"][data-m="CV"]'); await page.waitForTimeout(60); await page.fill('#md-id', 'CV-10'); await page.fill('#md-nombre', 'Coordenadas en lugares'); await page.fill('#md-exige', 'Toda planta o lugar de cliente lleva latitud y longitud para el cálculo de km'); await page.click('[data-action="modal-ok"]'); await page.waitForTimeout(80);
  const cv10 = await page.evaluate(() => byId(md().convenciones, 'CV-10')); check(cv10 && cv10.codigo === 'CV-10' && cv10._aud.estado_registro === 'vigente' && (await text('#main')).includes('Coordenadas en lugares'), 'C19: convención CV-10 creada vigente y visible');
  await page.evaluate(() => { S.ctx.mdTab = 'REGLAS'; render(); }); await page.waitForTimeout(50); const nRG = await page.evaluate(() => md().reglasModelo.length);
  await page.click('[data-action="md-nuevo"][data-m="RG"]'); await page.waitForTimeout(60); await page.fill('#md-id', 'VA-M29-2'); await page.fill('#md-maestro', 'M-29'); await page.selectOption('#md-tipo', 'Validación'); await page.fill('#md-nombre', 'Causa vigente'); await page.fill('#md-controla', 'Solo se registran demoras con causas vigentes'); await page.click('[data-action="modal-ok"]'); await page.waitForTimeout(80);
  check((await page.evaluate(() => md().reglasModelo.length)) === nRG + 1 && (await page.evaluate(() => mdReglas('M-29').some(r => r.id === 'VA-M29-2'))), 'C19: regla nueva para M-29 visible también en la pestaña Reglas del maestro');
  const rg0 = await page.evaluate(() => md().reglasModelo[0].id);
  await page.click('[data-action="md-baja"][data-m="RG"][data-id="' + rg0 + '"]'); await page.fill('#m-mot', 'Reemplazada'); await page.click('[data-action="modal-ok"]'); await page.waitForTimeout(80);
  check((await page.evaluate(id => deBaja(byId(md().reglasModelo, id)), rg0)) && (await page.evaluate(() => S.mdLog[0].accion)) === 'Baja', 'C19: baja lógica de una regla registrada');
  await setRol('PLAN'); await page.evaluate(() => { S.ctx.mdTab = 'CONV'; render(); }); await page.waitForTimeout(50); check((await page.$('[data-action="md-nuevo"]')) === null && (await text('#main')).includes('Solo consulta'), 'C19: otro rol consulta las convenciones sin ABM');
  await page.evaluate(() => go('casos')); await page.click('[data-action="caso"][data-n="19"]'); await page.waitForTimeout(60); check((await page.evaluate(() => S.ctx.screen + ':' + S.ctx.admTab + ':' + S.ctx.rol)) === 'admin:MOD:MD', 'C19: el caso 19 abre Administración › Menú por rol, entidad y BU');

  /* otras pantallas renderizan */
  for (const sc of ['arribos', 'bandeja', 'ordenes', 'recursos', 'comparativas', 'md', 'admin', 'casos', 'supuestos']) { await page.evaluate(s => go(s), sc); await page.waitForTimeout(30); check((await page.$('#main .page-h h1')) !== null, 'pantalla ' + sc + ' renderiza'); }
  for (const t of ['muelles', 'equipos', 'depositos', 'balanzas', 'logistica', 'funciones', 'manos']) { await page.evaluate(t => { S.ctx.screen = 'recursos'; S.ctx.recTab = t; render(); }, t); }
  for (const t of ['GEN', 'COM', 'PLAN', 'PERS', 'OPS', 'DEP', 'SEG', 'PERM', 'LOG', 'AREA', 'AUD', 'CONV', 'ORDEN', 'DEF', 'REGLAS', 'FUENTES', 'CRUCE', 'TXEV']) { await page.evaluate(t => { S.ctx.screen = 'md'; S.ctx.mdTab = t; render(); }, t); check((await page.$('#main .page-h h1')) !== null, 'md tab ' + t + ' renderiza'); }
  for (const t of ['ENT', 'DEP', 'USR', 'MOD', 'WF', 'REL', 'MAT', 'PAR']) { await page.evaluate(t => { S.ctx.screen = 'admin'; S.ctx.admTab = t; render(); }, t); }
  /* convertir BU */
  await page.evaluate(() => { S.ctx.screen = 'admin'; S.ctx.admTab = 'ENT'; render(); }); await page.selectOption('#adm-bu', 'TYS-RENT'); await page.fill('#adm-nombre', 'Rental SA'); await page.click('[data-action="convertir-bu"]'); await page.waitForTimeout(60);
  check(await page.evaluate(() => !!ent('E-RENT') && bu('TYS-RENT').convertida), 'A4: BU convertida en entidad con vigencia');
  /* persistencia y reinicio */
  await page.reload(); await page.waitForSelector('#main .page-h');
  check((await page.evaluate(() => S.orders.length)) === 16, 'persistencia: 16 órdenes tras recargar');
  await page.evaluate(() => { resetState(); render(); }); check((await page.evaluate(() => S.orders.length)) === 11, 'reinicio: vuelve a 11 órdenes');
  /* móvil */
  await page.setViewportSize({ width: 400, height: 800 }); await page.evaluate(() => go('inicio')); await page.waitForTimeout(50);
  const sw = await page.evaluate(() => document.documentElement.scrollWidth); check(sw <= 400, 'móvil: sin scroll horizontal (' + sw + ')');
  check(await page.$eval('.navtg', e => getComputedStyle(e).display !== 'none') && await page.$eval('#nav', e => getComputedStyle(e).transform !== 'none'), 'móvil: menú en cajón lateral cerrado con botón hamburguesa');
  await page.click('.navtg'); await page.waitForTimeout(250); check(await page.evaluate(() => document.body.classList.contains('nav-open')) && (await page.$('#ctx-entidad-m')) !== null, 'móvil: el cajón se abre y contiene los selectores de entidad y BU');
  await page.click('#nav [data-screen="md"]'); await page.waitForTimeout(250); check(!(await page.evaluate(() => document.body.classList.contains('nav-open'))) && (await page.evaluate(() => S.ctx.screen)) === 'md', 'móvil: navegar cierra el cajón');
  check(await page.$eval('.md-sel', e => getComputedStyle(e).display !== 'none') && await page.$eval('.mdnav', e => getComputedStyle(e).display === 'none'), 'móvil: Datos maestros usa un selector en lugar de la lista lateral');
  await page.selectOption('.md-sel select', 'M-26'); await page.waitForTimeout(60); check((await page.evaluate(() => S.ctx.mdM)) === 'M-26', 'móvil: el selector cambia de maestro');
  for (const sc of ['bandeja', 'ordenes', 'recursos', 'admin', 'casos']) { await page.evaluate(s => go(s), sc); await page.waitForTimeout(40); const w = await page.evaluate(() => document.documentElement.scrollWidth); check(w <= 400, 'móvil: ' + sc + ' sin scroll horizontal (' + w + ')'); }
  await page.selectOption('#ctx-rol', 'OPS'); await page.waitForTimeout(60); await page.evaluate(() => openOrden('OS-2026-0006', 'ejecucion')); await page.waitForTimeout(60); check((await page.evaluate(() => document.documentElement.scrollWidth)) <= 400 && await page.$eval('.exp-nav', e => getComputedStyle(e).overflowX === 'auto'), 'móvil: expediente sin scroll horizontal y navegación de secciones desplazable');
  await page.click('[data-action="recurso-form"]'); await page.waitForTimeout(60); check(await page.$eval('.modal', e => e.getBoundingClientRect().width >= 398), 'móvil: los modales ocupan todo el ancho'); await page.keyboard.press('Escape');
  await page.screenshot({ path: 'test/shot-movil.png' });

  log('\nErrores:', errors.length); errors.forEach(e => log(' - ' + e));
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})();
