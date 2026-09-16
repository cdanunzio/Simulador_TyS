/* =====================================================================
   APLICACIÓN — router, navegación, eventos, acciones, modales, inicio
   ===================================================================== */
const NAV = [
  { grp: 'Operación' },
  { id: 'inicio', n: 'Inicio' }, { id: 'arribos', n: 'Logística de arribo' }, { id: 'bandeja', n: 'Workflow · mi etapa', cnt: 'bandeja' }, { id: 'ordenes', n: 'Operaciones · órdenes', cnt: 'ordenes', alias: ['exp', 'nueva'] },
  { id: 'recursos', n: 'Recursos' }, { id: 'deposito', n: 'Depósito', cnt: 'deposito' }, { id: 'comparativas', n: 'Comparativas' },
  { grp: 'Configuración' }, { id: 'md', n: 'Datos maestros' }, { id: 'admin', n: 'Administración' },
  { grp: 'Maqueta' }, { id: 'casos', n: 'Casos guiados' }, { id: 'supuestos', n: 'Supuestos' },
];
function renderNav() {
  const c = contadores(); const sc = S.ctx.screen;
  /* módulos habilitados por rol / sector (S20): el menú solo muestra los habilitados */
  document.getElementById('nav').innerHTML = '<div class="nav-ctx"><label><span>Entidad</span><select id="ctx-entidad-m"></select></label><label><span>Unidad de negocio</span><select id="ctx-bu-m"></select></label></div>' + NAV.filter(it => it.grp || moduloHabilitado(it.id)).map(it => it.grp ? '<div class="grp">' + it.grp + '</div>' :
    '<button class="' + (sc === it.id || (it.alias || []).includes(sc) ? 'on' : '') + '" data-action="go" data-screen="' + it.id + '"><span>' + it.n + '</span>' + (it.cnt && c[it.cnt] ? '<span class="cnt">' + c[it.cnt] + '</span>' : '') + '</button>').join('') +
    /* pie del cajón móvil: acciones de la barra superior que en pantallas chicas no entran arriba */
    '<div class="nav-foot"><button class="btn sm ghost" data-action="reset">Reiniciar demo</button><span class="xs muted" style="padding:6px 4px">' + esc(ctxTxt()) + ' · ' + VERSION + '</span></div>';
}
/* si la pantalla actual deja de estar habilitada para el rol / entidad / BU activos, vuelve a Inicio con aviso (S20 · S22) */
function ajustarPantallaAlContexto() { if (!moduloHabilitado(S.ctx.screen)) { toast('El módulo ' + (byId(md().modulos, moduloDe(S.ctx.screen))?.nombre || S.ctx.screen).split(' (')[0] + ' no está habilitado para ' + motivoModuloDeshabilitado(S.ctx.screen), 'warn'); S.ctx.screen = 'inicio'; } }
/* menú móvil: cajón lateral */
function navOpen(on) { const open = on === undefined ? !document.body.classList.contains('nav-open') : !!on; document.body.classList.toggle('nav-open', open); const tg = document.querySelector('.navtg'); if (tg) { tg.setAttribute('aria-expanded', String(open)); tg.setAttribute('aria-label', open ? 'Cerrar el menú' : 'Abrir el menú'); } }
function renderCtx() {
  const c = S.ctx;
  const fill = (id, opts, val) => { for (const el of [document.getElementById(id), document.getElementById(id + '-m')]) if (el) el.innerHTML = opts.map(o => '<option value="' + esc(o.v) + '"' + (o.v === val ? ' selected' : '') + '>' + esc(o.t) + '</option>').join(''); };
  fill('ctx-entidad', [{ v: 'ALL', t: 'Grupo (consolidado)' }, ...md().entidades.map(e => ({ v: e.id, t: e.nombre }))], c.entidad);
  fill('ctx-bu', [{ v: 'ALL', t: 'Todas las BU' }, ...md().bus.filter(b => c.entidad === 'ALL' || b.entidad === c.entidad).map(b => ({ v: b.id, t: b.nombre + (c.entidad === 'ALL' ? ' (' + entName(b.entidad) + ')' : '') }))], c.bu);
  fill('ctx-rol', md().roles.map(r => ({ v: r.id, t: r.nombre + ' · ' + r.usuario })), c.rol);
}
function render(opts = {}) {
  const y = window.scrollY;
  navOpen(false);
  renderNav(); renderCtx();
  const sc = S.ctx.screen; let html = '';
  switch (sc) {
    case 'inicio': html = viewInicio(); break;
    case 'arribos': case 'programacion': S.ctx.screen = 'arribos'; html = viewArribos(); break;
    case 'bandeja': html = viewBandeja(); break;
    case 'ordenes': html = viewOrdenes(); break;
    case 'exp': html = viewExpediente(orden(S.ctx.orderId)); break;
    case 'nueva': html = viewNueva(); break;
    case 'recursos': html = viewRecursos(); break;
    case 'deposito': html = viewDeposito(); break;
    case 'comparativas': html = viewComparativas(); break;
    case 'md': html = viewMD(); break;
    case 'admin': html = viewAdmin(); break;
    case 'casos': html = viewCasos(); break;
    case 'supuestos': html = viewSupuestos(); break;
    default: S.ctx.screen = 'inicio'; html = viewInicio();
  }
  document.getElementById('main').innerHTML = html;
  save();
  if (opts.sec && opts.sec !== 'resumen') { const el = document.getElementById('s-' + opts.sec); if (el) { setTimeout(() => el.scrollIntoView({ block: 'start' }), 0); return; } }
  if (opts.keep) window.scrollTo(0, y); else window.scrollTo(0, 0);
}
function go(screen, extra = {}) {
  S.ctx.screen = screen; Object.assign(S.ctx, extra);
  if (screen === 'nueva' && !extra.keepW) { W = null; }
  render({ sec: extra.sec });
}
function openOrden(id, sec) { if (!moduloHabilitado('exp')) { toast('El módulo Operaciones · órdenes no está habilitado para ' + motivoModuloDeshabilitado('exp'), 'warn'); go('inicio'); return; } S.ctx.orderId = id; S.ctx.sec = sec || 'resumen'; S.ctx.screen = 'exp'; render({ sec: sec }); }

/* ---------- toasts y modales ---------- */
function toast(msg, type = '') {
  const t = document.createElement('div'); t.className = 'toast ' + type; t.textContent = msg;
  const box = document.getElementById('toasts'); box.appendChild(t); while (box.children.length > 4) box.firstChild.remove(); setTimeout(() => t.remove(), 4200);
}
let _modalOk = null;
function modal({ title, body, ok = 'Aceptar', cancel = 'Cancelar', onOk, okCls = 'pri' }) {
  _modalOk = onOk;
  document.getElementById('modal-root').innerHTML = '<div class="overlay" data-action="modal-cancel"><div class="modal" role="dialog" aria-modal="true" data-stop="1"><div class="mh"><h2>' + title + '</h2><button class="x" data-action="modal-cancel" aria-label="Cerrar">×</button></div><div class="mb">' + body + '</div><div class="mf">' + (cancel ? '<button class="btn" data-action="modal-cancel">' + cancel + '</button>' : '') + '<button class="btn ' + okCls + '" data-action="modal-ok">' + ok + '</button></div></div></div>';
  const f = document.querySelector('#modal-root input,#modal-root select,#modal-root textarea'); if (f) f.focus();
}
function closeModal() { document.getElementById('modal-root').innerHTML = ''; _modalOk = null; }
function mv(id) { const el = document.getElementById(id); if (!el) return null; return el.type === 'checkbox' ? el.checked : el.value; }

/* ---------- acciones sobre la orden ---------- */
function requiereRol(rol) { if (S.ctx.rol !== rol) { toast('Esta acción corresponde a ' + rolName(rol) + '. Cambiá el rol activo en la barra superior.', 'warn'); return false; } return true; }
function accionPrincipalRun(o, act) {
  const c = condiciones(o);
  if (act === 'enviar-plan') {
    if (!requiereRol('COM')) return;
    if (!c.ok) logEv(o, 'Advertencia registrada', c.motivos.join(' · ') + ': se envía a planificación; el inicio quedará bloqueado hasta regularizar');
    transition(o, 'PEND_PLAN', 'Crear y enviar a planificación');
    toast(o.id + ' enviada a planificación' + (c.ok ? '' : ' con advertencias') + ' · pasa al Planificador', c.ok ? 'ok' : 'warn'); go('bandeja');
  } else if (act === 'confirmar-plan') {
    if (!requiereRol('PLAN')) return;
    const R = pfInit(o); const v = validarPlan(o, { recursos: R });
    if (v.errores.length) { toast('La planificación tiene errores de validación', 'crit'); return; }
    const rec = o.recomendacion; const difiere = rec && !rec.sinOpciones && JSON.stringify(normRec(rec.recursos)) !== JSON.stringify(normRec(R));
    const doConfirm = (motivo) => { confirmarPlan(o, R, motivo); delete PF[o.id]; toast(o.id + ' planificada · pasa a Operaciones', 'ok'); go('bandeja'); };
    if (difiere) modal({ title: 'El plan difiere de la recomendación', body: alertBox('info', 'Se guardarán por separado la recomendación automática (con sus supuestos) y la planificación aceptada. Indicá el motivo del desvío.') + field('Motivo', sel('m-motivo', md().motivosDesvioPlan.map(x => ({ v: x, t: x })), md().motivosDesvioPlan[0])) + field('Detalle (opcional)', '<input id="m-det" placeholder="p. ej. G2 queda reservada para MV Río Carcarañá">'), ok: 'Confirmar planificación', onOk: () => { doConfirm(mv('m-motivo') + (mv('m-det') ? ' — ' + mv('m-det') : '')); } });
    else doConfirm(null);
  } else if (act === 'iniciar') {
    if (!requiereRol('OPS')) return;
    const r = iniciar(o); if (!r.ok) { toast('No se puede iniciar: ' + r.motivos.join(' · '), 'crit'); return; }
    toast(o.id + ' iniciada · reloj simulado ' + fmtDT(o.ejecucion.inicio), 'ok'); render({ keep: true });
  } else if (act === 'finalizar') {
    if (!requiereRol('OPS')) return;
    const falta = o.toneladas - o.ejecucion.acumulado;
    const fin = () => { finalizar(o); toast(o.id + ' finalizada · pasa a cierre en ' + rolName(rolCierre(o)), 'ok'); go('bandeja'); };
    if (o.toneladas && falta > o.toneladas * (md().parametros.toleranciaCierrePct / 100)) modal({ title: 'Finalizar con diferencia', body: alertBox('warn', '<div>El acumulado es <b>' + fmtT(o.ejecucion.acumulado) + ' t</b> de ' + fmtT(o.toneladas) + ' t previstas (faltan ' + fmtT(falta) + ' t). Se registrará la diferencia en el expediente.</div>'), ok: 'Finalizar de todos modos', okCls: 'danger', onOk: fin });
    else fin();
  } else if (act === 'cerrar') {
    const rc = rolCierre(o); if (!requiereRol(rc)) return;
    const merma = +mv('cz-merma') || 0, exc = +mv('cz-exc') || 0; const ev = evaluarMerma(o, merma, exc);
    if (merma && exc) { toast('Registrá merma o excedente, no ambos', 'crit'); return; }
    if (!ev.dentro && !mv('cz-aprob')) { toast('Fuera de la tolerancia contractual (' + fmtN(ev.tol, 1) + ' %): requiere aprobación de Comercial', 'crit'); return; }
    if (!ev.dentro && !mv('cz-aprob-ref')) { toast('Indicá la referencia de la aprobación de Comercial', 'crit'); return; }
    cerrar(o, mv('cierre-obs') || '', { merma, excedente: exc, aprobacionComercial: !ev.dentro ? mv('cz-aprob-ref') : null }); S.ctx.cz = null;
    toast(o.id + ' cerrada' + (merma ? ' · merma ' + fmtN(merma, 1) + ' t' : exc ? ' · excedente ' + fmtN(exc, 1) + ' t' : '') + ' · comparativas congeladas', 'ok'); go('bandeja');
  }
}

/* ---------- formularios modales de ejecución ---------- */
function formRecurso(o) {
  const E = o.entidad; const grp = (label, list, f) => '<optgroup label="' + label + '">' + list.map(x => '<option value="' + x.id + '">' + esc(f(x)) + '</option>').join('') + '</optgroup>';
  const eqb = equiposBuqueDe(o); const eqInfo = tipoEquipoInfo(tipoEquipoPara(o));
  const body = field('Recurso', '<select id="m-rid">' + grp(eqInfo.nombre + ' del muelle (según el producto)', equiposMuelleDe(o), e => e.id + ' · ' + e.nombre + ' · ' + e.capacidadTh + ' t/h · ' + e.estado) + (eqb ? grp('Equipos del buque', [eqb], e => e.nombre + ' · sin costo para la terminal') : '') + grp('Logística (propia y de terceros)', md().logistica.filter(l => l.entidad === E && mdUsable(l)), l => l.nombre + ' · ' + fmtUSD(l.costoHora) + '/h') + grp('Personal externo', md().manos.filter(mdUsable), m => m.nombre + ' · ' + fmtUSD(m.costoTurno) + '/turno') + grp('Personal propio', md().funciones.filter(mdUsable), f => f.nombre + ' · ' + fmtUSD(f.costoTurno) + '/turno') + grp('Depósitos (reemplaza al destino activo)', md().depositos.filter(d => d.entidad === E && mdUsable(d)), d => d.nombre + ' · ' + fmtT(d.capacidadT - d.ocupadoT) + ' t libres' + (d.fiscal ? ' · fiscal' : '')) + grp('Balanzas (reemplaza a la activa)', md().balanzas.filter(b => b.entidad === E && mdUsable(b)), b => b.nombre) + grp('Muelles (reemplaza al activo)', md().muelles.filter(m => m.entidad === E && mdUsable(m)), m => m.nombre) + '</select>') +
    '<div class="form-grid">' + field('Cantidad', '<input type="number" id="m-cant" value="1" min="1">') + field('Motivo', sel('m-motivo', md().motivosModificacion.map(x => ({ v: x, t: x })), md().motivosModificacion[0])) + '</div>' +
    '<label class="field chk"><input type="checkbox" id="m-atrib"><span>El gasto es <b>atribuible al cliente</b> (queda pendiente de aprobación por Comercial) ' + sup('S5') + '</span></label>' +
    field('Respaldo (referencia, mail, acta)', '<input id="m-resp" placeholder="p. ej. mail del cliente 14/09 solicitando mayor ritmo">') +
    '<p class="help">Se registra recurso, momento (reloj simulado ' + fmtDT(o.ejecucion.reloj) + '), responsable (' + esc(userOf('OPS')) + ') y motivo; la disponibilidad se verifica para el próximo turno (' + md().parametros.horasTurno + ' h). Los cambios se comparan con la planificación inicial al cierre.</p>';
  modal({ title: 'Agregar recurso al operativo', body, ok: 'Agregar', onOk: () => {
    const rid = mv('m-rid'); const n = +mv('m-cant') || 1; const ch = chequearRecurso(rid, n, { ...o, toneladas: Math.max(0, (o.toneladas || 0) - (o.ejecucion.acumulado || 0)), ventana: { inicio: o.ejecucion.reloj, fin: addHours(o.ejecucion.reloj, md().parametros.horasTurno) } });
    if (ch.errores.length) { toast(ch.errores[0], 'crit'); return false; }
    const tipo = recursoTipo(rid);
    if (['deposito', 'balanza', 'muelle'].includes(tipo)) {
      const idxAct = o.ejecucion.recursos.findIndex(r => (r.tipo || recursoTipo(r.rid)) === tipo && !r.hasta);
      if (idxAct >= 0) { if (o.ejecucion.recursos[idxAct].rid === rid) { toast(recNombre(rid) + ' ya es el ' + tipo + ' activo', 'warn'); return false; } reemplazarRecurso(o, idxAct, rid, { motivo: mv('m-motivo'), atribuible: mv('m-atrib'), respaldo: mv('m-resp'), cantidad: 1 }); toast(tipo + ' reemplazado por ' + recNombre(rid), 'ok'); return; }
    }
    const rec = agregarRecurso(o, { rid, cantidad: n, motivo: mv('m-motivo'), atribuible: mv('m-atrib'), respaldo: mv('m-resp') });
    toast(recNombre(rid) + ' agregado' + (rec.atribuibleCliente ? ' · cargo pendiente de aprobación' : ''), 'ok');
  } });
}
function formModificar(o, idx) {
  const r = o.ejecucion.recursos[idx]; const rr = recurso(r.rid);
  modal({ title: 'Modificar cantidad · ' + esc(recNombre(r.rid)), body: '<div class="form-grid">' + field('Cantidad actual', '<input value="' + (r.cantidad || 1) + '" disabled>') + field('Nueva cantidad', '<input type="number" id="m-cant" min="0" value="' + (r.cantidad || 1) + '">') + field('Motivo', sel('m-motivo', md().motivosModificacion.map(x => ({ v: x, t: x })), md().motivosModificacion[0])) + '</div>' + '<label class="field chk"><input type="checkbox" id="m-atrib"><span>El incremento es <b>atribuible al cliente</b></span></label>' + field('Respaldo', '<input id="m-resp" placeholder="referencia, mail, acta">') + '<p class="help">Se cierra el registro actual y se abre uno nuevo desde el reloj simulado (' + fmtDT(o.ejecucion.reloj) + '); ambos quedan en el historial y en la comparativa necesario vs aplicado.' + (rr?.cantidad ? ' Disponibles en el maestro: ' + rr.cantidad + '.' : '') + '</p>', ok: 'Modificar', onOk: () => {
    const n = +mv('m-cant'); if (isNaN(n) || n < 0) { toast('Cantidad inválida', 'crit'); return false; }
    if (n === (r.cantidad || 1)) { toast('La cantidad no cambió', 'warn'); return false; }
    if (n > 0) { const ch = chequearRecurso(r.rid, Math.max(0, n - (r.cantidad || 1)), { ...o, ventana: { inicio: o.ejecucion.reloj, fin: addHours(o.ejecucion.reloj, md().parametros.horasTurno) } }); if (ch.errores.length && n > (r.cantidad || 1)) { toast(ch.errores[0], 'crit'); return false; } }
    modificarCantidad(o, idx, n, { motivo: mv('m-motivo'), atribuible: mv('m-atrib'), respaldo: mv('m-resp') });
    toast(recNombre(r.rid) + ': ' + (r.cantidad || 1) + ' → ' + n, 'ok');
  } });
}
function formReemplazar(o, idx) {
  const r = o.ejecucion.recursos[idx]; const tipo = r.tipo || recursoTipo(r.rid); const E = o.entidad;
  const list = tipo === 'muelle' ? md().muelles.filter(x => x.entidad === E) : tipo === 'equipo' ? [...equiposMuelleDe(o), ...(equiposBuqueDe(o) ? [equiposBuqueDe(o)] : [])] : tipo === 'deposito' ? md().depositos.filter(x => x.entidad === E) : tipo === 'balanza' ? md().balanzas.filter(x => x.entidad === E) : tipo === 'logistica' ? md().logistica.filter(x => x.entidad === E) : tipo === 'mano' ? md().manos : md().funciones;
  const opts = list.filter(x => x.id !== r.rid && mdUsable(x)).map(x => ({ v: x.id, t: x.nombre + (x.estado && x.estado !== 'Operativo' ? ' · ' + x.estado : '') }));
  modal({ title: 'Reemplazar · ' + esc(recNombre(r.rid)), body: '<div class="form-grid">' + field('Recurso actual', '<input value="' + esc(recNombre(r.rid)) + (r.cantidad > 1 ? ' ×' + r.cantidad : '') + '" disabled>') + field('Nuevo recurso (' + tipo + ')', sel('m-rid', opts, opts[0]?.v || '')) + (['logistica', 'mano', 'funcion'].includes(tipo) ? field('Cantidad', '<input type="number" id="m-cant" min="1" value="' + (r.cantidad || 1) + '">') : '') + field('Motivo', sel('m-motivo', md().motivosModificacion.map(x => ({ v: x, t: x })), 'Avería / reemplazo de equipo')) + '</div>' + '<label class="field chk"><input type="checkbox" id="m-atrib"><span>El gasto del reemplazo es <b>atribuible al cliente</b></span></label>' + field('Respaldo', '<input id="m-resp" placeholder="referencia, mail, acta">') + '<p class="help">El recurso actual se da de baja desde el reloj simulado (' + fmtDT(o.ejecucion.reloj) + ') y el nuevo queda activo; se verifica su disponibilidad para el próximo turno.</p>', ok: 'Reemplazar', onOk: () => {
    const rid = mv('m-rid'); if (!rid) { toast('No hay otro recurso de este tipo', 'crit'); return false; }
    const n = +mv('m-cant') || r.cantidad || 1;
    const ch = chequearRecurso(rid, n, { ...o, toneladas: Math.max(0, (o.toneladas || 0) - (o.ejecucion.acumulado || 0)), ventana: { inicio: o.ejecucion.reloj, fin: addHours(o.ejecucion.reloj, md().parametros.horasTurno) } }); if (ch.errores.length) { toast(ch.errores[0], 'crit'); return false; }
    reemplazarRecurso(o, idx, rid, { motivo: mv('m-motivo'), atribuible: mv('m-atrib'), respaldo: mv('m-resp'), cantidad: n });
    toast(recNombre(r.rid) + ' → ' + recNombre(rid), 'ok');
  } });
}
function formLiberar(o, idx) {
  const r = o.ejecucion.recursos[idx];
  modal({ title: 'Liberar ' + esc(recNombre(r.rid)), body: field('Motivo', sel('m-motivo', md().motivosModificacion.map(x => ({ v: x, t: x })), 'Fin de la necesidad operativa')) + '<p class="help">Queda registrado recurso, momento (' + fmtDT(o.ejecucion.reloj) + '), responsable y motivo.</p>', ok: 'Liberar', onOk: () => { liberarRecurso(o, idx, mv('m-motivo')); toast(recNombre(r.rid) + ' liberado', 'ok'); } });
}
function formDemora(o) {
  const ex = o.ejecucion; const causas = md().causasDemora.filter(mdUsable);
  const body = '<div class="form-grid">' + field('Causa', sel('m-causa', causas.map(c => ({ v: c.id, t: c.nombre })), causas[1].id, 'onchange="document.getElementById(\'m-resp\').value=(' + JSON.stringify(Object.fromEntries(causas.map(c => [c.id, c.responsabilidad]))).replace(/"/g, '&quot;') + ')[this.value]"')) + field('Responsabilidad', sel('m-resp', md().responsabilidades.map(x => ({ v: x, t: x })), causas[1].responsabilidad)) +
    field('Inicio', '<input type="datetime-local" id="m-ini" value="' + toLocalInput(addHours(ex.reloj, -1.5)) + '">') + field('Fin', '<input type="datetime-local" id="m-fin" value="' + toLocalInput(ex.reloj) + '">') +
    field('Tercero involucrado', '<input id="m-terc" list="m-terc-list" placeholder="proveedor, transportista, cliente…"><datalist id="m-terc-list">' + md().proveedores.map(p => '<option value="' + esc(p.nombre) + '">').join('') + md().clientes.map(p => '<option value="' + esc(p.nombre) + '">').join('') + '</datalist>') + field('Gasto asociado (USD)', '<input type="number" id="m-gasto" value="0" min="0" step="50">') + '</div>' +
    '<label class="field chk"><input type="checkbox" id="m-recup"><span>Gasto <b>recuperable</b> (se registra como cargo pendiente de aprobación)</span></label>' + field('Observaciones', '<textarea id="m-obs"></textarea>');
  modal({ title: 'Registrar demora', body, ok: 'Registrar', onOk: () => {
    const ini = fromLocalInput(mv('m-ini')), fin = fromLocalInput(mv('m-fin'));
    if (!ini || !fin || fin <= ini) { toast('El fin debe ser posterior al inicio', 'crit'); return false; }
    const d = registrarDemora(o, { causa: mv('m-causa'), responsabilidad: mv('m-resp'), inicio: ini, fin, tercero: mv('m-terc'), gasto: mv('m-gasto'), recuperable: mv('m-recup'), obs: mv('m-obs') });
    toast('Demora registrada: ' + d.causaNombre + ' · ' + fmtH(d.horas), 'ok');
  } });
}
function formTicket(o) {
  modal({ title: 'Registrar ticket de balanza', body: '<div class="form-grid">' + field('Camión (patente)', '<input id="m-cam" value="' + plate() + '">') + field('Bruto (t)', '<input type="number" id="m-bruto" value="44.5" step="0.01">') + field('Tara (t)', '<input type="number" id="m-tara" value="14.6" step="0.01">') + '</div><p class="help">Balanza ' + esc(recNombre(o.plan?.recursos?.balanza)) + ' · fecha y hora del reloj simulado ' + fmtDT(o.ejecucion.reloj) + '</p>', ok: 'Registrar', onOk: () => { const b = +mv('m-bruto'), t = +mv('m-tara'); if (!(b > t)) { toast('El bruto debe superar la tara', 'crit'); return false; } ticketManual(o, { camion: mv('m-cam'), bruto: b, tara: t }); toast('Ticket registrado · neto ' + fmtN(b - t, 2) + ' t', 'ok'); } });
}
function formNacionalizacion(o) {
  modal({ title: 'Registrar nacionalización', body: '<div class="form-grid">' + field('Referencia del despacho de importación', '<input id="m-ref" placeholder="Despacho 26001IC04…">') + field('Despachante de aduana (M-22)', sel('m-desp', [{ v: '', t: '— sin indicar —' }, ...md().despachantes.map(x => ({ v: x.id, t: x.nombre + ' · ' + x.matricula }))], '')) + '</div><p class="help">' + sup('S3') + ' Registra Comercial / Backoffice (' + esc(userOf('COM')) + '); queda fecha, responsable, referencia y despachante en el expediente.</p>', ok: 'Registrar', onOk: () => { const ref = mv('m-ref'); if (!ref) { toast('Indicá la referencia', 'crit'); return false; } Object.assign(o.habilitaciones, { nacionalizada: true, nacRef: ref, nacTs: nowIso(), nacPor: userOf('COM'), nacDespachante: mv('m-desp') || null }); logEv(o, 'Nacionalización registrada', 'Referencia ' + ref + (mv('m-desp') ? ' · despachante ' + (byId(md().despachantes, mv('m-desp'))?.nombre || '') : '')); toast('Nacionalización registrada' + (o.estado === 'PLANIF' && condiciones(o).ok ? ' · la orden ya puede iniciarse' : ''), 'ok'); } });
}

/* ---------- instrumento contractual nuevo o adenda (SUPUESTO S9) ---------- */
function formInstrumento(mode, padreId) {
  const padre = mode === 'adenda' ? instr(padreId) : null; const d = wDest(); const s = srv(W.servicio);
  const hoy = isoDay(0); const dt = new Date(); dt.setFullYear(dt.getFullYear() + 1); const unAnio = dayOf(dt.toISOString());
  const hastaDef = padre && padre.vigenciaHasta > hoy ? padre.vigenciaHasta : unAnio;
  const srvOpts = md().servicios.filter(x => !x.pendiente && x.ambito.includes(W.entidad));
  const srvSel = new Set([W.servicio, ...(padre?.servicios || [])]);
  const prodSel = new Set([...(W.producto && W.producto !== 'NA' ? [W.producto] : []), ...(padre?.productos || [])]);
  const tarDef = { DES: 6.5, TRA: 3.0, DEP: 0.08, CAR: 4.5, SRV: 60 }; const tar = Object.assign({}, tarDef, padre?.tarifas || {});
  const um = { DES: 'USD/t', TRA: 'USD/t', DEP: 'USD/t/día', CAR: 'USD/t', SRV: 'USD/h' };
  const body = (padre ? alertBox('info', '<div><b>Adenda a ' + esc(padre.id) + '</b> (' + esc(padre.tipo) + ', vigente hasta ' + fmtD(padre.vigenciaHasta) + '). Hereda tarifas y condiciones; podés ampliar servicios, productos y vigencia.</div>') : alertBox('info', '<div><b>Nuevo instrumento</b> para ' + esc(destinatarioNombre(d)) + '. Quedará registrado en el maestro de Comercial y seleccionado en esta orden.</div>')) +
    '<div class="form-grid">' + (padre ? field('Tipo', '<input id="m-tipo" value="Adenda" disabled>') : field('Tipo', sel('m-tipo', ['Contrato marco', 'Orden de compra', 'Tarifa spot'].map(x => ({ v: x, t: x })), 'Contrato marco'))) +
    field('Vigencia desde', '<input type="date" id="m-desde" value="' + hoy + '">') + field('Vigencia hasta', '<input type="date" id="m-hasta" value="' + hastaDef + '">') + field('Moneda', '<input id="m-mon" value="USD" disabled>') + '</div>' +
    '<div class="grid g2"><div><h3 style="margin:6px 0">Servicios contratados</h3><div class="stack" style="gap:4px">' + srvOpts.map(x => '<label class="field chk small"><input type="checkbox" class="m-srv" value="' + x.id + '"' + (srvSel.has(x.id) ? ' checked' : '') + '><span>' + esc(x.nombre) + '</span></label>').join('') + '</div></div>' +
    '<div><h3 style="margin:6px 0">Productos incluidos</h3><label class="field chk small"><input type="checkbox" id="m-prod-todos"' + (padre && !padre.productos ? ' checked' : '') + '><span><b>Todos los productos</b></span></label><div class="stack" style="gap:4px;margin-top:4px">' + md().productos.map(p => '<label class="field chk small"><input type="checkbox" class="m-prod" value="' + p.id + '"' + (prodSel.has(p.id) ? ' checked' : '') + '><span>' + esc(p.nombre) + '</span></label>').join('') + '</div></div></div>' +
    '<h3 style="margin:6px 0">Tarifas por componente</h3><div class="form-grid">' + ['DES', 'TRA', 'DEP', 'CAR', 'SRV'].map(c => field(compName(c) + ' (' + um[c] + ')' + ((s?.componentes || []).includes(c) ? ' *' : ''), '<input type="number" step="0.01" min="0" id="m-tar-' + c + '" value="' + tar[c] + '">')).join('') + '</div>' +
    '<h3 style="margin:6px 0">Condiciones</h3><div class="form-grid">' + field('Ritmo comprometido (t/día)', '<input type="number" step="100" min="0" id="m-ritmo" value="' + (padre?.condiciones?.ritmoComprometido ?? 5000) + '">') + field('Franquicia de depósito (días)', '<input type="number" step="1" min="0" id="m-franq" value="' + (padre?.condiciones?.franquiciaDias ?? 20) + '">') + field('Tolerancia merma / excedente (%)', '<input type="number" step="0.1" min="0" id="m-tol" value="' + (padre?.condiciones?.toleranciaMermaPct ?? md().parametros.toleranciaMermaPct) + '">') + field('Demoras a cargo del cliente', '<input id="m-dem" value="' + esc(padre?.condiciones?.demoraCliente || 'A cargo del cliente si la causa es documentación o falta de camiones') + '">') + '</div>' +
    '<p class="help">* componentes del servicio de esta orden. ' + sup('S9') + ' Se asume que Comercial tiene atribución para cargar el instrumento sin un circuito de aprobación adicional.</p>';
  modal({ title: padre ? 'Adenda a ' + esc(padre.id) : 'Nuevo instrumento contractual', body, ok: padre ? 'Registrar adenda' : 'Registrar instrumento', onOk: () => {
    const desde = mv('m-desde'), hasta = mv('m-hasta'); if (!desde || !hasta || hasta < desde) { toast('Revisá las fechas de vigencia', 'crit'); return false; }
    if (hasta < hoy) { toast('La vigencia hasta debe ser futura para cubrir esta orden', 'crit'); return false; }
    const servicios = [...document.querySelectorAll('.m-srv:checked')].map(x => x.value); if (!servicios.includes(W.servicio)) { toast('El instrumento debe incluir el servicio de esta orden', 'crit'); return false; }
    const todos = mv('m-prod-todos'); const productos = todos ? null : [...document.querySelectorAll('.m-prod:checked')].map(x => x.value);
    if (productos && W.producto && W.producto !== 'NA' && !productos.includes(W.producto)) { toast('El instrumento debe incluir el producto de esta orden', 'crit'); return false; }
    const tarifas = {}; for (const c of ['DES', 'TRA', 'DEP', 'CAR', 'SRV']) { const v = +mv('m-tar-' + c); if (v > 0) tarifas[c] = v; }
    for (const c of (s?.componentes || [])) if (!tarifas[c]) { toast('Falta la tarifa de ' + compName(c), 'crit'); return false; }
    S.seqInst = S.seqInst || 101;
    const id = padre ? padre.id + '-AD' + (md().instrumentos.filter(i => i.padre === padre.id).length + 1) : 'CTO-2026-' + String(S.seqInst++).padStart(3, '0');
    const nuevo = { id, cliente: d.tipo === 'cliente' ? d.id : null, interno: d.tipo === 'bu', grupo: d.tipo === 'entidad', tipo: padre ? 'Adenda' : mv('m-tipo'), padre: padre?.id || null, vigenciaDesde: desde, vigenciaHasta: hasta, servicios, productos, moneda: 'USD', tarifas,
      condiciones: { ritmoComprometido: +mv('m-ritmo') || null, franquiciaDias: +mv('m-franq') || 0, toleranciaMermaPct: +mv('m-tol') || 0, demoraCliente: mv('m-dem') }, creadoDesde: 'Nueva orden', creadoTs: nowIso(), creadoPor: userOf('COM') };
    md().instrumentos.push(nuevo); W.instrumento = id; wAutoFill();
    toast((padre ? 'Adenda ' : 'Instrumento ') + id + ' registrado y seleccionado en la orden', 'ok');
  } });
}

/* ---------- Logística de arribo: alta y edición (SUPUESTO S10) ---------- */
function formLineup(lu) {
  const E = S.ctx.entidad === 'ALL' ? 'TYS' : S.ctx.entidad; const edit = !!lu;
  const cargaRow = (c, i) => '<div class="form-grid" style="grid-template-columns:1fr 1.4fr 1.2fr 1fr .7fr;gap:6px;align-items:end"><label class="field"><span>BL</span><input class="m-bl" value="' + esc(c?.bl || 'BL-') + '"></label><label class="field"><span>Cliente</span>' + sel('m-cli-' + i, md().clientes.map(x => ({ v: x.id, t: x.nombre })), c?.cliente || 'CLI-01', 'class="m-cli"') + '</label><label class="field"><span>Producto</span>' + sel('m-prod-' + i, md().productos.map(x => ({ v: x.id, t: x.nombre })), c?.producto || 'UREA', 'class="m-prod"') + '</label><label class="field"><span>Calidad</span><input class="m-cal" value="' + esc(c?.calidad || '') + '" placeholder="p. ej. Granulada 46 % N"></label><label class="field"><span>t</span><input type="number" class="m-t" value="' + (c?.toneladas || 10000) + '"></label></div>';
  const body = edit ? alertBox('info', '<div>Edición de <b>' + esc(lu.id) + ' · ' + esc(lu.buque) + '</b>. Un cambio de ETB/ETC actualiza la ventana de las órdenes vinculadas que aún no iniciaron.</div>') : '';
  const bq = edit ? buqueDeLineup(lu) : null;
  const datos = '<div class="form-grid">' + (edit ? field('Buque (M-08)', '<input value="' + esc(lu.buque) + (bq ? ' · ' + bq.id + ' · IMO ' + (bq.numero_imo || 's/d') : '') + '" disabled>') : field('Buque (M-08)', sel('m-bq', [{ v: 'NEW', t: '— nuevo buque (alta provisoria hasta homologar el IMO) —' }, ...md().buques.map(b => ({ v: b.id, t: b.nombre + ' · IMO ' + (b.numero_imo || 's/d') + ' · ' + b.eslora_m + ' m' }))], 'NEW')) + field('Nombre del buque nuevo', '<input id="m-buque" placeholder="MV …">') + field('Nº IMO (7 dígitos, opcional)', '<input id="m-imo" placeholder="9xxxxxx">') + field('Bandera', '<input id="m-band" value="Panamá">') + field('Terminal', sel('m-term', md().entidades.filter(e => e.id !== 'AMA').map(e => ({ v: e.id, t: e.nombre })), E)) + field('Tipo de escala', sel('m-tipo', [{ v: '', t: 'Descarga' }, { v: 'Carga', t: 'Carga' }], ''))) +
    field('Eslora (m)', '<input type="number" id="m-eslora" value="' + (lu?.eslora || 190) + '">') + field('Calado (m)', '<input type="number" step="0.1" id="m-calado" value="' + (lu?.calado || 9.5) + '">') + (edit ? '' : field('Bodegas', '<input type="number" id="m-bodegas" value="5">')) +
    field('ETA', '<input type="datetime-local" id="m-eta" value="' + toLocalInput(lu?.eta || iso(7, 6)) + '">') + field('ETB (atraque)', '<input type="datetime-local" id="m-etb" value="' + toLocalInput(lu?.etb || iso(7, 14)) + '">') + field('ETC (zarpada)', '<input type="datetime-local" id="m-etc" value="' + toLocalInput(lu?.etc || iso(10, 14)) + '">') +
    (edit ? field('Estado', sel('m-est', ['Anunciado', 'Confirmado', 'En rada', 'En operación', 'Zarpó', 'Cancelado'].map(v => ({ v, t: v })), lu.estado)) : '') + '</div>' +
    '<h3 style="margin:8px 0 4px">Equipos propios del buque (M-08) ' + sup('S14') + '</h3><div class="form-grid">' + field('Tipo', sel('m-eqb-tipo', [{ v: '', t: 'Sin equipos propios (gearless)' }, ...md().tiposEquipo.map(t => ({ v: t.id, t: t.buque }))], bq?.equipos_propios?.tipo || '')) + field('Cantidad', '<input type="number" id="m-eqb-n" min="1" value="' + (bq?.equipos_propios?.cantidad || 4) + '">') + field('Capacidad por unidad (t/h)', '<input type="number" id="m-eqb-cap" min="1" value="' + (bq?.equipos_propios?.capacidadTh || 250) + '">') + '</div><p class="help">Dato propio del buque: queda en el maestro M-08 y lo heredan todas sus escalas. El Planificador elige si la descarga / carga se hace con equipos del muelle o con los del buque.' + (!edit ? ' Si elegís un buque existente, sus equipos se actualizan con lo que indiques acá.' : '') + '</p>' +
    (edit ? '' : '<h3 style="margin:8px 0 4px">Cargas</h3><div id="m-cargas" class="stack" style="gap:6px">' + cargaRow(null, 0) + '</div><p class="help">La maqueta admite hasta dos cargas por escala: completá la segunda si corresponde.</p><div id="m-carga2">' + cargaRow({ bl: '', toneladas: 0 }, 1) + '</div>');
  modal({ title: edit ? 'Editar lineup ' + esc(lu.id) : 'Nuevo lineup', body: body + datos, ok: edit ? 'Guardar cambios' : 'Registrar lineup', onOk: () => {
    const eta = fromLocalInput(mv('m-eta')), etb = fromLocalInput(mv('m-etb')), etc = fromLocalInput(mv('m-etc'));
    if (!eta || !etb || !etc || etc <= etb) { toast('Revisá ETA, ETB y ETC (la zarpada debe ser posterior al atraque)', 'crit'); return false; }
    const equiposBuque = mv('m-eqb-tipo') ? { tipo: mv('m-eqb-tipo'), cantidad: Math.max(1, +mv('m-eqb-n') || 1), capacidadTh: Math.max(1, +mv('m-eqb-cap') || 1) } : null;
    if (edit) { const cambios = editarLineup(lu, { eta, etb, etc, estado: mv('m-est'), calado: mv('m-calado'), eslora: mv('m-eslora'), equiposBuque }); toast(cambios.length ? lu.id + ' actualizado: ' + cambios.join(' · ') : 'Sin cambios', cambios.length ? 'ok' : 'warn'); return; }
    const bqSel = mv('m-bq'); if (bqSel === 'NEW' && !mv('m-buque')) { toast('Indicá el nombre del buque nuevo o elegí uno del maestro', 'crit'); return false; }
    if (mv('m-imo') && !/^\d{7}$/.test(mv('m-imo'))) { toast('El número IMO tiene 7 dígitos', 'crit'); return false; }
    const cargas = [...document.querySelectorAll('#modal-root .m-bl')].map((el, i) => { const row = el.closest('.form-grid'); return { bl: el.value, cliente: row.querySelector('.m-cli').value, producto: row.querySelector('.m-prod').value, calidad: row.querySelector('.m-cal').value, toneladas: +row.querySelector('.m-t').value || 0 }; }).filter(c => c.bl && c.bl !== 'BL-' && c.toneladas > 0);
    if (!cargas.length) { toast('Cargá al menos una carga con BL y toneladas', 'crit'); return false; }
    const lu2 = nuevoLineup({ buqueId: bqSel !== 'NEW' ? bqSel : null, buque: mv('m-buque'), imo: mv('m-imo'), bodegas: mv('m-bodegas'), bandera: mv('m-band'), terminal: mv('m-term'), tipo: mv('m-tipo') || undefined, eslora: mv('m-eslora'), calado: mv('m-calado'), eta, etb, etc, equiposBuque, cargas });
    toast(lu2.id + ' · ' + lu2.buque + ' registrado', 'ok');
  } });
}
/* ---------- cambio de fecha de arribo desde la planificación (SUPUESTO S15) ---------- */
function formArribo(o, rid) {
  const am = arriboModificable(o); if (!am.ok) { toast('No se puede cambiar la fecha de arribo: ' + am.motivo, 'warn'); return; }
  const prop = proponerArribo(o, rid); const r = recurso(rid); const g = origenInfo(o);
  const confl = prop ? prop.conflictos : conflictosRecurso(rid, o);
  const dur = hoursBetween(o.ventana.inicio, o.ventana.fin);
  const body = alertBox('warn', '<div><b>' + esc(r?.nombre || rid) + '</b> está ocupado por otro operativo en la ventana actual (' + ventanaTxt(o.ventana) + '): ' + confl.map(c => '<b>' + esc(c.orden) + '</b> hasta ' + fmtDT(c.hasta)).join(' · ') + '.</div>') +
    '<div class="form-grid">' + field('Nuevo arribo (inicio de la ventana)', '<input type="datetime-local" id="m-ini" value="' + toLocalInput(prop ? prop.inicio : o.ventana.inicio) + '">') + field('Duración de la ventana', '<input value="' + fmtN(dur, 0) + ' h (se mantiene)" disabled>') + '</div>' +
    (prop ? '<p class="small" style="margin:6px 0">Propuesta del sistema: <b>' + ventanaTxt(prop) + '</b> — primer turno completo libre después de la reserva que genera el conflicto.</p>' : '') +
    field('Motivo', '<input id="m-mot" value="' + esc((r?.nombre || rid) + ' ocupado por ' + confl.map(c => c.orden).join(', ') + ' hasta ' + fmtDT(confl.map(c => c.hasta).sort().pop())) + '">') +
    alertBox('info', '<div>' + (g?.tipo === 'Lineup' ? 'Se corren <b>ETA, ETB y ETC</b> del lineup <b>' + esc(g.id) + ' · ' + esc(g.lu.buque) + '</b> y la ventana de las órdenes de esa escala que aún no iniciaron. ' : 'Se actualiza la fecha del ' + esc(g?.tipo || 'origen') + ' <b>' + esc(g?.id || '') + '</b>. ') + 'El cambio queda en el registro de Logística de arribo con el Planificador como responsable y esta orden como motivo; la recomendación se regenera para la nueva ventana. ' + sup('S15') + '</div>');
  modal({ title: 'Cambiar fecha de arribo · ' + esc(o.id), body, ok: 'Cambiar fecha de arribo', onOk: () => {
    const ini = fromLocalInput(mv('m-ini')); if (!ini) { toast('Indicá la nueva fecha de arribo', 'crit'); return false; }
    if (ini === o.ventana.inicio) { toast('La fecha es la misma que la actual', 'warn'); return false; }
    const res = cambiarFechaArribo(o, ini, mv('m-mot'));
    const R = PF[o.id]; if (R && o.recomendacion && !o.recomendacion.sinOpciones && !R.equipos?.length) PF[o.id] = clone(o.recomendacion.recursos);
    const ch = R ? chequearRecurso(rid, 1, o) : { errores: [] };
    toast('Arribo de ' + o.id + ' movido ' + fmtN(res.shiftH, 0) + ' h · nueva ventana ' + ventanaTxt(o.ventana) + (ch.errores.length ? ' · ' + recNombre(rid) + ' sigue con observaciones' : ' · ' + recNombre(rid) + ' disponible'), ch.errores.length ? 'warn' : 'ok');
  } });
}
function formCupo() {
  const E = S.ctx.entidad === 'ALL' ? 'TYS' : S.ctx.entidad;
  modal({ title: 'Nuevo cupo de camiones', body: '<div class="form-grid">' + field('Terminal', sel('m-term', md().entidades.filter(e => e.id !== 'AMA').map(e => ({ v: e.id, t: e.nombre })), E)) + field('Fecha', '<input type="date" id="m-fecha" value="' + isoDay(2) + '">') + field('Franja', '<input id="m-franja" value="06:00–18:00">') + field('Cliente', sel('m-cli', md().clientes.map(x => ({ v: x.id, t: x.nombre })), 'CLI-04')) + field('Producto', sel('m-prod', md().productos.map(x => ({ v: x.id, t: x.nombre })), 'MAIZ')) + field('Calidad', '<input id="m-cal" placeholder="p. ej. Grado 2">') + field('Camiones', '<input type="number" id="m-cam" value="30">') + field('Toneladas estimadas', '<input type="number" id="m-t" value="900">') + field('Transportista', sel('m-transp', md().proveedores.filter(p => p.rubro === 'Transporte terrestre').map(p => ({ v: p.id, t: p.nombre })), 'PRV-03')) + '</div>', ok: 'Registrar cupo', onOk: () => {
    if (!mv('m-fecha')) { toast('Indicá la fecha', 'crit'); return false; }
    const cu = nuevoCupo({ terminal: mv('m-term'), fecha: mv('m-fecha'), franja: mv('m-franja'), cliente: mv('m-cli'), producto: mv('m-prod'), calidad: mv('m-cal'), camiones: mv('m-cam'), toneladas: mv('m-t'), transportista: mv('m-transp') });
    toast(cu.id + ' registrado (' + cu.camiones + ' camiones · ' + fmtD(cu.fecha) + ')', 'ok');
  } });
}
function formTren() {
  const E = S.ctx.entidad === 'ALL' ? 'TYS' : S.ctx.entidad;
  modal({ title: 'Nuevo operativo ferroviario', body: '<div class="form-grid">' + field('Terminal', sel('m-term', md().entidades.filter(e => e.id !== 'AMA').map(e => ({ v: e.id, t: e.nombre })), E)) + field('Fecha', '<input type="date" id="m-fecha" value="' + isoDay(5) + '">') + field('Operador', '<input id="m-oper" value="Nuevo Central Argentino">') + field('Formación', '<input id="m-form" value="NCA-">') + field('Vagones', '<input type="number" id="m-vag" value="30">') + field('Toneladas', '<input type="number" id="m-t" value="1500">') + field('Cliente', sel('m-cli', md().clientes.map(x => ({ v: x.id, t: x.nombre })), 'CLI-05')) + field('Producto', sel('m-prod', md().productos.map(x => ({ v: x.id, t: x.nombre })), 'SOJA')) + field('Calidad', '<input id="m-cal" placeholder="p. ej. Cámara">') + field('Tipo', sel('m-tipo', ['Arribo para descarga', 'Arribo para carga'].map(v => ({ v, t: v })), 'Arribo para descarga')) + '</div>', ok: 'Registrar operativo', onOk: () => {
    if (!mv('m-fecha') || !mv('m-form')) { toast('Indicá fecha y formación', 'crit'); return false; }
    const tr = nuevoTren({ terminal: mv('m-term'), fecha: mv('m-fecha'), operador: mv('m-oper'), formacion: mv('m-form'), vagones: mv('m-vag'), toneladas: mv('m-t'), cliente: mv('m-cli'), producto: mv('m-prod'), calidad: mv('m-cal'), tipo: mv('m-tipo') });
    toast(tr.id + ' registrado (' + tr.formacion + ' · ' + fmtD(tr.fecha) + ')', 'ok');
  } });
}

/* ---------- devolver al paso anterior · anular (SUPUESTO S18) ---------- */
function formDevolver(o) {
  const rr = rolResponsable(o); if (!rr || !requiereRol(rr)) return;
  const p = puedeDevolver(o); if (!p.ok) { toast('No se puede devolver: ' + p.motivo, 'warn'); return; }
  const efecto = o.estado === 'PLANIF' ? 'La planificación v' + (o.plan?.version || 1) + ' queda como historial, se liberan las reservas de recursos y el Planificador vuelve a asignar.' : o.estado === 'EJEC' ? 'Se revierte el inicio (no hay tickets registrados); la orden vuelve a Planificada con su plan.' : o.estado === 'PEND_CIERRE' ? 'El operativo vuelve a estar en ejecución: los recursos cerrados al finalizar quedan activos y Operaciones puede registrar lo que falte.' : 'La orden vuelve a Borrador; Comercial la edita y la reenvía. La recomendación se conserva.';
  modal({ title: 'Devolver ' + esc(o.id) + ' a ' + esc(estadoName(p.a)), body: alertBox('warn', '<div><b>' + esc(estadoName(o.estado)) + ' → ' + esc(estadoName(p.a)) + '.</b> ' + esc(efecto) + ' El rol responsable (' + esc(rolName(byId(md().estados, p.a)?.responsable || 'COM')) + ') la recibe en su bandeja con el motivo. ' + sup('S18') + '</div>') +
    '<div class="form-grid" style="grid-template-columns:1fr">' + field('Motivo', sel('m-motivo', md().motivosDevolucion.map(x => ({ v: x, t: x })), md().motivosDevolucion[0])) + field('Detalle', '<input id="m-det" placeholder="qué hay que corregir o revisar">') + '</div>', ok: 'Devolver a ' + esc(estadoName(p.a)), onOk: () => {
    const det = mv('m-det'); if (mv('m-motivo') === 'Otro' && !det) { toast('Indicá el detalle del motivo', 'crit'); return false; }
    const r = devolver(o, mv('m-motivo') + (det ? ' — ' + det : '')); if (!r.ok) { toast(r.motivo, 'crit'); return false; }
    delete PF[o.id]; delete PF[o.id + ':aj']; S.ctx.ajusteId = null; S.ctx.cz = null;
    toast(o.id + ' devuelta a ' + estadoName(r.a) + ' · pasa a ' + rolName(byId(md().estados, r.a)?.responsable || 'COM'), 'ok'); go('bandeja');
  } });
}
function formAnular(o) {
  if (['CERRADA', 'ANULADA'].includes(o.estado)) { toast('La orden ya está ' + estadoName(o.estado).toLowerCase(), 'warn'); return; }
  const rr = rolResponsable(o); if (!rr || !requiereRol(rr)) return;
  const acc = o.ejecucion?.acumulado || 0; const rvs = ['PLANIF', 'EJEC'].includes(o.estado) && o.plan ? resumenRecursos(o.plan.recursos) : '';
  modal({ title: 'Anular ' + esc(o.id), body: alertBox('crit', '<div><b>La orden pasa a Anulada y no vuelve al workflow.</b> Se liberan las reservas de recursos' + (rvs ? ' (' + esc(rvs) + ')' : '') + ' y el origen (' + esc(origenInfo(o)?.label || 'sin origen') + ') vuelve a estar disponible para una orden nueva. El historial, la planificación y los costos se conservan en consulta.' + (acc ? ' <b>' + fmtT(acc) + ' t</b> ya descargadas quedan registradas sin cierre de depósito.' : '') + ' ' + sup('S18') + '</div>') +
    '<div class="form-grid" style="grid-template-columns:1fr">' + field('Motivo', sel('m-motivo', md().motivosAnulacion.map(x => ({ v: x, t: x })), md().motivosAnulacion[0])) + field('Detalle', '<input id="m-det" placeholder="referencia (mail, aviso de la agencia, orden que la reemplaza)">') + '</div>', ok: 'Anular orden', okCls: 'danger', onOk: () => {
    const det = mv('m-det'); if (mv('m-motivo') === 'Otro' && !det) { toast('Indicá el detalle del motivo', 'crit'); return false; }
    const r = anular(o, mv('m-motivo') + (det ? ' — ' + det : '')); if (!r.ok) { toast(r.motivo, 'crit'); return false; }
    delete PF[o.id]; delete PF[o.id + ':aj']; S.ctx.ajusteId = null; S.ctx.cz = null;
    toast(o.id + ' anulada · reservas y origen liberados', 'ok'); go('bandeja');
  } });
}

/* ---------- ABM genérico de la master data (SUPUESTO S17) ---------- */
function formMD(m, collName, rec) {
  if (permisoMD(m) !== 'abm') { toast(rolName(S.ctx.rol) + ' no tiene permiso de ABM sobre ' + m, 'warn'); return; }
  const campos = mdCampos(collName); const edit = !!rec; const f = { nombre: nombreMaestro(m) }; const tipo = mdColecciones(m).find(t => t.coll === collName);
  const optsRef = (ref, nullable) => [...(nullable || !edit ? [{ v: '', t: '— sin asignar —' }] : []), ...(md()[ref] || []).filter(x => !deBaja(x)).map(x => ({ v: x.id, t: x.id + (x.nombre ? ' · ' + x.nombre : '') }))];
  const ctrl = (c) => {
    const v = edit ? rec[c.k] : undefined; const id = 'md-' + c.k;
    if (c.key) return '<input id="' + id + '" value="' + esc(v ?? '') + '"' + (edit ? ' disabled' : ' placeholder="código único"') + '>';
    if (c.t === 'bool') return '<input type="checkbox" id="' + id + '"' + (v ? ' checked' : '') + ' style="width:auto;justify-self:start">';
    if (c.t === 'number') return '<input type="number" step="any" id="' + id + '" value="' + (v ?? '') + '">';
    if (c.t === 'date') return '<input type="date" id="' + id + '" value="' + esc(v || '') + '">';
    if (c.t === 'select') return sel(id, [...(c.req ? [] : [{ v: '', t: '—' }]), ...c.opts.map(x => ({ v: x, t: x }))], v ?? (c.req ? c.opts[0] : ''));
    if (c.t === 'ref') return sel(id, optsRef(c.ref, c.nullable), v ?? '');
    if (c.t === 'multiref') return '<select id="' + id + '" multiple>' + (md()[c.ref] || []).map(x => '<option value="' + esc(x.id) + '"' + ((v || []).includes(x.id) ? ' selected' : '') + '>' + esc(x.id + (x.nombre ? ' · ' + x.nombre : '')) + '</option>').join('') + '</select>';
    if (c.t === 'list') return '<input id="' + id + '" value="' + esc((v || []).join(', ')) + '" placeholder="valores separados por coma">';
    if (c.t === 'textarea') return '<textarea id="' + id + '" rows="3">' + esc(v ?? '') + '</textarea>';
    return '<input id="' + id + '" value="' + esc(v ?? '') + '">';
  };
  const body = alertBox('info', '<div><b>' + esc(m + ' ' + (f?.nombre || '')) + (tipo && mdColecciones(m).length > 1 ? ' · ' + esc(tipo.v) : '') + '</b> — ' + (edit ? 'modificación del registro <b class="mono">' + esc(rec.id) + '</b> (v' + ((rec._aud?.version) || 1) + ' → v' + (((rec._aud?.version) || 1) + 1) + ')' : 'alta de un registro nuevo') + '. El formulario se arma con los atributos que la maqueta usa para este maestro; las referencias a otros maestros se eligen del maestro correspondiente. ' + (S.ctx.rol === 'MD' ? 'Como Máster data, el registro queda <b>vigente</b> al guardar.' : 'Como ' + esc(rolName(S.ctx.rol)) + ', el registro queda <b>en validación</b> hasta que Máster data lo publique; mientras tanto el circuito no lo usa.') + ' ' + sup('S17') + '</div>') +
    '<div class="md-form">' + campos.map(c => field(esc(c.a) + (c.req ? ' *' : ''), ctrl(c), c.t === 'bool' ? 'chk' : c.t === 'textarea' ? 'span3' : '')).join('') + '</div>' +
    '<p class="help" style="margin-top:8px">Auditoría (hoja 3): se registran quién, cuándo, versión y origen "manual"; el cambio queda en el registro de cambios de la master data.</p>';
  modal({ title: (edit ? 'Editar ' : 'Nuevo registro · ') + esc(m + ' ' + (f?.nombre || '')), body, ok: edit ? 'Guardar cambios' : 'Crear registro', onOk: () => {
    const { data, errores } = mdLeer(campos, mv, { edit }); if (errores.length) { toast(errores[0], 'crit'); return false; }
    if (!edit && data.id && !/^[A-Za-z0-9._-]+$/.test(data.id)) { toast('El código admite letras, números, punto, guion y guion bajo', 'crit'); return false; }
    if (!edit && (data.entidad === undefined) && campos.some(c => c.k === 'entidad')) data.entidad = S.ctx.entidad === 'ALL' ? 'TYS' : S.ctx.entidad;
    const r = guardarMD(m, collName, data, { edit: edit ? rec.id : null }); if (!r.ok) { toast(r.motivo, 'crit'); return false; }
    if (r.sinCambio) { toast('Sin cambios', 'warn'); return; }
    toast((edit ? r.rec.id + ' modificado' : r.rec.id + ' creado') + (r.enValidacion ? ' · en validación (pendiente de Máster data)' : ' · vigente'), r.enValidacion ? 'warn' : 'ok');
  } });
}

/* ---------- toneladas y fechas del servicio (SUPUESTO S19) ---------- */
function formDatosServicio(o) {
  if (!requiereRol('COM')) return;
  if (!puedeEditarDatosServicio(o)) { toast('La orden ya está planificada: devolvela al Planificador para cambiar toneladas o fechas', 'warn'); return; }
  const vo = ventanaOrigenDe(o); const tOrig = toneladasOrigenDe(o);
  const body = alertBox('info', '<div>Toneladas y fechas las define <b>Comercial</b>; el origen las propone' + (vo ? ' (' + esc(vo.txt) + ': ' + ventanaTxt(vo) + (tOrig != null ? ' · ' + fmtT(tOrig) + ' t' : '') + ')' : '') + '. Con la ventana se valida la disponibilidad de todos los recursos' + (o.estado === 'PEND_PLAN' ? ' y se regenera la recomendación' : '') + '. ' + sup('S19') + '</div>') +
    '<div class="form-grid">' + field('Toneladas a operar', '<input type="number" id="m-t" min="0" step="10" value="' + (o.toneladas || 0) + '">') + field('Inicio del servicio', '<input type="datetime-local" id="m-ini" value="' + toLocalInput(o.ventana?.inicio) + '">') + field('Fin del servicio', '<input type="datetime-local" id="m-fin" value="' + toLocalInput(o.ventana?.fin) + '">') + '</div>' +
    field('Motivo', '<input id="m-mot" placeholder="p. ej. el cliente opera 8.000 t de las 14.000 del BL · reprogramación con la agencia">');
  modal({ title: 'Editar toneladas y fechas · ' + esc(o.id), body, ok: 'Guardar', onOk: () => {
    const ini = fromLocalInput(mv('m-ini')), fin = fromLocalInput(mv('m-fin')); const t = +mv('m-t');
    if (!ini || !fin) { toast('Indicá inicio y fin del servicio', 'crit'); return false; }
    if (o.producto && !(t > 0)) { toast('Indicá las toneladas a operar', 'crit'); return false; }
    const r = editarDatosServicio(o, { toneladas: t, inicio: ini, fin }, mv('m-mot')); if (!r.ok) { toast(r.motivo, 'crit'); return false; }
    if (r.sinCambio) { toast('Sin cambios', 'warn'); return; }
    delete PF[o.id]; toast(o.id + ': ' + r.cambios.join(' · '), 'ok');
  } });
}

/* ---------- alta / edición de orden ---------- */
function wGuardar(enviar) {
  wAutoFill(); const faltan = W_ORDER.filter(k => !W[k]);
  if (faltan.length) { toast('Completá la selección secuencial: falta ' + faltan[0], 'warn'); return; }
  const spec = wSpec();
  if (!spec.ventana || !spec.ventana.inicio || !spec.ventana.fin) { toast('Indicá la fecha y hora de inicio y fin del servicio', 'crit'); return; }
  if (spec.ventana.fin <= spec.ventana.inicio) { toast('El fin del servicio debe ser posterior al inicio', 'crit'); return; }
  if (spec.producto && !(spec.toneladas > 0)) { toast('Indicá las toneladas a operar', 'crit'); return; }
  const detErr = wDetalleErrores(); if (detErr.length) { toast(detErr[0], 'crit'); return; }
  let o;
  if (W.edit) { const prev = orden(W.edit); o = crearOrdenBase({ ...spec, id: prev.id, creadoTs: prev.creado }); o.historial = prev.historial; logEv(o, 'Borrador actualizado', 'Selección revisada por Comercial'); S.orders[S.orders.indexOf(prev)] = o; }
  else { o = crearOrdenBase(spec); S.orders.push(o); }
  const c = condiciones(o);
  if (enviar) { if (!c.ok) logEv(o, 'Advertencia registrada', c.motivos.join(' · ') + ': se envía a planificación; el inicio quedará bloqueado hasta regularizar'); transition(o, 'PEND_PLAN', 'Crear y enviar a planificación'); }
  W = null; toast(o.id + (enviar ? ' creada y enviada a planificación · pasa al Planificador' : ' guardada como borrador') + (c.ok ? '' : ' · con advertencias'), c.ok ? 'ok' : 'warn');
  go('bandeja');
}

/* ---------- eventos ---------- */
function onClick(e) {
  const el = e.target.closest('[data-action]'); if (!el) return;
  if (el.tagName === 'A') e.preventDefault();
  const a = el.dataset.action; const d = el.dataset;
  if (a === 'nav-toggle') { navOpen(); return; }
  if (a === 'nav-close') { navOpen(false); return; }
  if (a === 'modal-cancel') { if (e.target.closest('[data-stop]') && !e.target.closest('button')) return; closeModal(); return; }
  if (a === 'modal-ok') { const r = _modalOk ? _modalOk() : true; if (r !== false) { closeModal(); render({ keep: true }); } return; }
  const o = d.id ? orden(d.id) : null;
  switch (a) {
    case 'go': { const extra = {}; if (d.mdtab) extra.mdTab = d.mdtab; if (d.admtab) extra.admTab = d.admtab; if (!moduloHabilitado(d.screen)) { toast('El módulo ' + (byId(md().modulos, moduloDe(d.screen))?.nombre || d.screen).split(' (')[0] + ' no está habilitado para ' + motivoModuloDeshabilitado(d.screen), 'warn'); go('inicio'); break; } if (d.screen === 'nueva' && S.ctx.rol !== 'COM') { go('ordenes'); break; } go(d.screen, extra); break; }
    case 'open': openOrden(d.id, d.sec); break;
    case 'sec': { S.ctx.sec = d.sec; document.querySelectorAll('.exp-nav button').forEach(b => b.classList.toggle('on', b.dataset.sec === d.sec)); const s = document.getElementById('s-' + d.sec); if (s) s.scrollIntoView({ block: 'start', behavior: 'smooth' }); save(); break; }
    case 'reset': modal({ title: 'Reiniciar la demo', body: '<p>Se vuelve al escenario inicial: 11 órdenes, datos maestros y recursos originales. Se pierden los cambios realizados en esta sesión.</p>', ok: 'Reiniciar', okCls: 'danger', onOk: () => { resetState(); Object.keys(PF).forEach(k => delete PF[k]); W = null; toast('Escenario inicial restaurado', 'ok'); } }); break;
    case 'principal': if (o) accionPrincipalRun(o, d.act); break;
    case 'devolver': if (o) formDevolver(o); break;
    case 'datos-servicio': if (o) formDatosServicio(o); break;
    case 'anular': if (o) formAnular(o); break;
    case 'md-nuevo': formMD(d.m, d.coll, null); break;
    case 'md-editar': { const c = mdCollDe(d.m, d.id); if (c) formMD(d.m, c.coll, c.rec); break; }
    case 'md-baja': { const c = mdCollDe(d.m, d.id); if (!c) break; if (permisoMD(d.m) !== 'abm') { toast(rolName(S.ctx.rol) + ' no tiene permiso de ABM sobre ' + d.m, 'warn'); break; }
      modal({ title: 'Dar de baja · ' + esc(d.id) + (c.rec.nombre ? ' · ' + esc(c.rec.nombre) : ''), body: alertBox('warn', '<div><b>Baja lógica.</b> El registro queda "dado de baja", se conserva con su historial y deja de ofrecerse en la planificación y en los selectores. Si está reservado por una orden planificada o en ejecución, la baja se rechaza. ' + sup('S17') + '</div>') + field('Motivo', '<input id="m-mot" placeholder="p. ej. equipo vendido · proveedor discontinuado">'), ok: 'Dar de baja', okCls: 'danger', onOk: () => { const r = bajaMD(d.m, d.id, mv('m-mot')); if (!r.ok) { toast('No se puede dar de baja: ' + r.motivo, 'crit'); return false; } toast(d.id + ' dado de baja (lógica)', 'ok'); } }); break; }
    case 'md-validar': case 'md-rechazar': { if (!requiereRol('MD')) break; const c = mdCollDe(d.m, d.id); if (!c) break; const dec = a === 'md-validar' ? 'Validado' : 'Rechazado';
      modal({ title: (dec === 'Validado' ? 'Validar y publicar · ' : 'Rechazar · ') + esc(d.id), body: alertBox('info', '<div>' + esc(d.m) + ' · <b>' + esc(d.id) + (c.rec.nombre ? ' · ' + c.rec.nombre : '') + '</b> — ' + (c.rec._aud?.version > 1 ? 'modificación' : 'alta') + ' de ' + esc(c.rec._aud?.modificado_por || c.rec._aud?.creado_por || '') + ' el ' + fmtDT(c.rec._aud?.modificado_el || c.rec._aud?.creado_el) + '. ' + (dec === 'Validado' ? 'Pasa a <b>vigente</b> y el circuito comienza a usarlo.' : 'Queda <b>rechazado</b>: se conserva pero no se usa.') + '</div>') + field('Detalle', '<input id="m-det" placeholder="' + (dec === 'Validado' ? 'p. ej. verificado con el área' : 'p. ej. duplica un registro existente') + '">'), ok: dec === 'Validado' ? 'Validar y publicar' : 'Rechazar', okCls: dec === 'Validado' ? 'pri' : 'danger', onOk: () => { const r = validarMD(d.m, d.id, dec, mv('m-det')); if (!r.ok) { toast(r.motivo, 'crit'); return false; } toast(d.id + ' ' + dec.toLowerCase(), 'ok'); } }); break; }
    case 'editar-borrador': if (o) { wInit(o); go('nueva', { keepW: true }); } break;
    case 'nac-form': if (o) formNacionalizacion(o); break;
    case 'ms-confirmar': if (o) { const e2 = msEstado(o.producto); if (!e2.vigente) { toast('No hay un método seguro vigente para el producto', 'crit'); break; } Object.assign(o.habilitaciones, { msConfirmado: true, msTs: nowIso(), msPor: userOf('COM'), msRef: e2.ms.procedimiento }); logEv(o, 'Método seguro confirmado', e2.ms.id + ' · ' + e2.ms.procedimiento + ' · vigente hasta ' + fmtD(e2.ms.vigenciaHasta), { rol: 'COM' }); toast('Cumplimiento del método seguro confirmado', 'ok'); render({ keep: true }); } break;
    case 'ops-ajustar': if (o && requiereRol('OPS')) { S.ctx.ajusteId = o.id; delete PF[o.id + ':aj']; render({ keep: true }); } break;
    case 'ops-ajuste-cancel': S.ctx.ajusteId = null; if (o) delete PF[o.id + ':aj']; render({ keep: true }); break;
    case 'ops-ajuste-reset': if (o) { PF[o.id + ':aj'] = clone(o.plan.recursos); render({ keep: true }); } break;
    case 'ajustar-plan': if (o && requiereRol('OPS')) { const R = pfInit(o, 'ajuste'); const v = validarPlan(o, { recursos: R }); if (v.errores.length) { toast('El ajuste tiene errores de validación', 'crit'); break; }
      if (JSON.stringify(normRec(R)) === JSON.stringify(normRec(o.plan.recursos))) { toast('No hay cambios respecto del plan', 'warn'); break; }
      modal({ title: 'Guardar ajuste de recursos', body: alertBox('info', 'El plan aceptado se conserva como plan inicial; el ajuste queda registrado con motivo y responsable y se compara al cierre.') + field('Motivo del ajuste', sel('m-motivo', md().motivosModificacion.map(x => ({ v: x, t: x })), 'Recurso planificado no disponible')) + field('Detalle (opcional)', '<input id="m-det">'), ok: 'Guardar ajuste', onOk: () => { ajustarPlan(o, R, mv('m-motivo') + (mv('m-det') ? ' — ' + mv('m-det') : '')); S.ctx.ajusteId = null; delete PF[o.id + ':aj']; toast('Recursos ajustados · plan v' + o.plan.version, 'ok'); } }); } break;
    case 'sr-crear': if (o && requiereRol('PLAN')) { const ch = chequearRecurso(d.rid, +d.n || 1, o); if (solicitudPendiente(o, d.rid)) { toast('Ya hay una solicitud pendiente para ' + recNombre(d.rid), 'warn'); break; } const sr = crearSolicitudRecurso(o, d.rid, +d.n || 1, ch.errores.map(e => e.replace(recNombre(d.rid) + ': ', ''))); toast(sr.id + ' enviada a ' + sr.destinatario.nombre + ' con la información de la operación', 'ok'); render({ keep: true }); } break;
    case 'sr-responder': { const sr = (S.solicitudesRecurso || []).find(x => x.id === d.id); if (!sr) break; const dec = d.dec;
      modal({ title: (dec === 'Habilitado' ? 'Habilitar ' : 'Rechazar ') + esc(recNombre(sr.rid)) + ' · ' + esc(sr.id), body: alertBox('info', '<div><b>Operación:</b> ' + esc(sr.operacion.servicio) + ' · ' + esc(sr.operacion.destinatario) + ' · ' + esc(sr.operacion.producto) + ' · ' + fmtT(sr.operacion.toneladas) + ' t · ' + ventanaTxt(sr.operacion.ventana) + '<br><b>Motivo:</b> ' + sr.motivos.map(esc).join(' · ') + '<br><b>Responde:</b> ' + esc(sr.destinatario?.nombre || '') + ' (simulado por ' + esc(userOf(S.ctx.rol)) + ') ' + sup('S13') + '</div>') + field('Detalle de la respuesta', '<input id="m-det" placeholder="' + (dec === 'Habilitado' ? 'p. ej. mantenimiento adelantado; equipo operativo desde el turno T2' : 'p. ej. sin disponibilidad en la ventana; proponer alternativa') + '">'), ok: dec === 'Habilitado' ? 'Habilitar recurso' : 'Rechazar', okCls: dec === 'Habilitado' ? 'pri' : 'danger', onOk: () => { const cambios = responderSolicitud(sr, dec, mv('m-det')); toast(sr.id + ' ' + dec.toLowerCase() + (cambios.length ? ' · ' + cambios.join(' · ') : ''), dec === 'Habilitado' ? 'ok' : 'warn'); } }); break; }
    case 'pf-usar-rec': if (o?.recomendacion && !o.recomendacion.sinOpciones) { PF[o.id] = clone(o.recomendacion.recursos); render({ keep: true }); } break;
    case 'pf-regen': if (o) { o.recomendacion = recomendar(o); PF[o.id] = o.recomendacion && !o.recomendacion.sinOpciones ? clone(o.recomendacion.recursos) : pfInit(o); logEv(o, 'Recomendación regenerada', o.recomendacion?.sinOpciones ? 'sin combinación factible' : resumenRecursos(o.recomendacion.recursos), { rol: 'PLAN' }); toast('Recomendación regenerada', 'ok'); render({ keep: true }); } break;
    case 'simular': if (o && requiereRol('OPS')) { const n = simular(o, +d.h); toast(n ? n + ' tickets simulados · acumulado ' + fmtT(o.ejecucion.acumulado) + ' t' : (o.ejecucion.acumulado >= o.toneladas ? 'La descarga ya está completa' : 'Sin equipos activos: no hay ritmo de descarga'), n ? 'ok' : 'warn'); render({ keep: true }); } break;
    case 'ticket-form': if (o && requiereRol('OPS')) formTicket(o); break;
    case 'recurso-form': if (o && requiereRol('OPS')) formRecurso(o); break;
    case 'liberar-form': if (o && requiereRol('OPS')) formLiberar(o, +d.idx); break;
    case 'modificar-form': if (o && requiereRol('OPS')) formModificar(o, +d.idx); break;
    case 'reemplazar-form': if (o && requiereRol('OPS')) formReemplazar(o, +d.idx); break;
    case 'demora-form': if (o && requiereRol('OPS')) formDemora(o); break;
    case 'cargo': if (o && requiereRol('COM')) { resolverCargo(o, d.ref, d.dec); toast('Cargo ' + d.dec.toLowerCase(), 'ok'); render({ keep: true }); } break;
    case 'w-guardar': wGuardar(false); break;
    case 'w-enviar': wGuardar(true); break;
    case 'w-cancelar': W = null; go('bandeja'); break;
    case 'arribo-fecha': if (o && requiereRol('PLAN')) formArribo(o, d.rid); break;
    case 'lu-nuevo': if (requiereRol('LAR')) formLineup(null); break;
    case 'lu-editar': if (requiereRol('LAR')) formLineup(byId(S.ops.lineups, d.id)); break;
    case 'cu-nuevo': if (requiereRol('LAR')) formCupo(); break;
    case 'tr-nuevo': if (requiereRol('LAR')) formTren(); break;
    case 'cmpdim': S.ctx.cmpDim = d.dim; render({ keep: true }); break;
    case 'w-inst-nuevo': if (W && requiereRol('COM')) formInstrumento('nuevo'); break;
    case 'w-inst-adenda': if (W && requiereRol('COM')) formInstrumento('adenda', d.id); break;
    case 'rectab': S.ctx.recTab = d.tab; render({ keep: true }); break;
    case 'mdtab': S.ctx.mdTab = d.tab; render({ keep: true }); break;
    case 'mdgo': { const tabDe = { CV: 'CONV', RG: 'REGLAS', DF: 'DEF', DC: 'DEF' }; S.ctx.screen = 'md'; if (tabDe[d.m]) { S.ctx.mdTab = tabDe[d.m]; } else { S.ctx.mdTab = 'MAESTROS'; S.ctx.mdM = d.m; } render({ keep: S.ctx.screen === 'md' }); break; }
    case 'mdsub': S.ctx.mdSub = d.sub; render({ keep: true }); break;
    case 'admtab': S.ctx.admTab = d.tab; render({ keep: true }); break;
    case 'cmp': S.ctx.cmpId = d.id; render({ keep: true }); break;
    case 'toggle-equipo': { const eq = byId(md().equipos, d.id); if (eq.estado === 'Operativo') { eq.estado = 'En mantenimiento'; eq.mantHasta = isoDay(7); } else { eq.estado = 'Operativo'; eq.mantHasta = null; } toast(eq.id + ' ' + eq.estado.toLowerCase() + (eq.mantHasta ? ' hasta ' + fmtD(eq.mantHasta) : ''), 'ok'); render({ keep: true }); break; }
    case 'ms-renovar': { const ms = byId(md().metodosSeguros, d.id); const dt = new Date(); dt.setFullYear(dt.getFullYear() + 1); ms.vigenciaHasta = dayOf(dt.toISOString()); const rev = ms.procedimiento.match(/rev\. (\d+)/); ms.procedimiento = rev ? ms.procedimiento.replace(/rev\. \d+/, 'rev. ' + (+rev[1] + 1)) : ms.procedimiento; toast(ms.id + ' renovado hasta ' + fmtD(ms.vigenciaHasta) + ' (' + ms.procedimiento + ')', 'ok'); render({ keep: true }); break; }
    case 'convertir-bu': { const b = bu(mv('adm-bu')); const vig = mv('adm-vig'); const nombre = mv('adm-nombre'); if (!b || !vig || !nombre) { toast('Completá BU, fecha de vigencia y nombre', 'warn'); break; } const nid = 'E-' + b.id.split('-').pop(); if (ent(nid)) { toast('Ya existe una entidad para esa BU', 'warn'); break; } md().entidades.push({ id: nid, nombre, sigla: nombre.split(' ')[0], tipo: 'Entidad fiscal (ex BU ' + b.nombre + ')', localidad: ent(b.entidad)?.localidad || '', vigenciaDesde: vig, origenBU: b.id }); b.convertida = { entidad: nid, vigencia: vig }; md().matrizEjecucion[nid] = { DES: null, TRA: null, DEP: null, CAR: null, SRV: null }; toast(b.nombre + ' será entidad fiscal desde ' + fmtD(vig) + '; ' + S.orders.filter(o => o.bu === b.id).length + ' órdenes anteriores conservan ' + entName(b.entidad) + ' / ' + b.nombre, 'ok'); render({ keep: true }); break; }
    case 'caso': { const c = CASOS[+d.n - 1]; if (!c) break; S.ctx.rol = c.rol; S.ctx.entidad = 'TYS'; S.ctx.bu = 'ALL'; if (c.orden) { if (c.screen === 'exp') openOrden(c.orden, c.sec || (c.n === 6 || c.n === 7 ? 'ejecucion' : c.n === 4 || c.n === 5 || c.n === 12 ? 'planificacion' : c.n === 2 ? 'habilitaciones' : 'resumen')); } else { if (c.screen === 'nueva') W = null; if (c.screen === 'md') { S.ctx.mdTab = 'MAESTROS'; S.ctx.mdM = c.mdM || 'M-34'; S.ctx.mdSub = 'REG'; } if (c.admTab) S.ctx.admTab = c.admTab; go(c.screen); } toast('Caso ' + c.n + ' · rol activo: ' + rolName(c.rol), 'ok'); break; }
  }
}
function onChange(e) {
  const el = e.target; const d = el.dataset;
  if (el.id === 'ctx-entidad' || el.id === 'ctx-entidad-m') { S.ctx.entidad = el.value; if (S.ctx.bu !== 'ALL' && bu(S.ctx.bu)?.entidad !== el.value && el.value !== 'ALL') S.ctx.bu = 'ALL'; if (S.ctx.screen === 'nueva') W = null; ajustarPantallaAlContexto(); render(); return; }
  if (el.id === 'ctx-bu' || el.id === 'ctx-bu-m') { S.ctx.bu = el.value; ajustarPantallaAlContexto(); render(); return; }
  if (el.id === 'ctx-rol') { S.ctx.rol = el.value; ajustarPantallaAlContexto(); if (S.ctx.screen === 'nueva' && el.value !== 'COM') S.ctx.screen = 'ordenes'; render({ keep: true }); return; }
  if (d.mod !== undefined) { const [rol, m] = d.mod.split(':'); const r = setModulo(rol, m, el.checked); toast(r.ok ? (byId(md().modulos, m)?.nombre || m) + ' ' + (el.checked ? 'habilitado' : 'deshabilitado') + ' para ' + rolName(rol) : r.motivo, r.ok ? 'ok' : 'warn'); render({ keep: true }); return; }
  if (d.moddim !== undefined) { const [dim, key, m] = d.moddim.split(':'); const r = setModuloDim(dim, key, m, el.checked); const quien = dim === 'rol' ? rolName(key) : dim === 'entidad' ? entName(key) : buName(key); toast(r.ok ? (byId(md().modulos, m)?.nombre || m).split(' (')[0] + ' ' + (el.checked ? 'habilitado' : 'deshabilitado') + ' para ' + quien : r.motivo, r.ok ? 'ok' : 'warn'); if (!moduloHabilitado(S.ctx.screen)) S.ctx.screen = 'inicio'; render({ keep: true }); return; }
  if (d.sim !== undefined) { S.ctx.sim = S.ctx.sim || { rol: S.ctx.rol, ent: S.ctx.entidad, bu: S.ctx.bu }; S.ctx.sim[d.sim] = el.value; if (d.sim === 'ent' && S.ctx.sim.bu !== 'ALL' && bu(S.ctx.sim.bu)?.entidad !== el.value && el.value !== 'ALL') S.ctx.sim.bu = 'ALL'; render({ keep: true }); return; }
  if (d.mdsel !== undefined) { S.ctx.mdM = el.value; S.ctx.mdSub = S.ctx.mdSub || 'REG'; render(); return; }
  if (d.perm !== undefined) { if (S.ctx.rol !== 'MD') { toast('Solo Máster data modifica los permisos', 'warn'); render({ keep: true }); return; } const [m, rol] = d.perm.split(':'); const r = setPermisoMD(m, rol, el.value); toast(r.ok ? m + ' · ' + rolName(rol) + ': ' + nivelPermiso(el.value).nombre : r.motivo, r.ok ? 'ok' : 'crit'); render({ keep: true }); return; }
  if (d.bind === 'ordFilter') { S.ctx.ordFilter = el.value; render({ keep: true }); return; }
  if (d.pf !== undefined) {
    const o = orden(S.ctx.orderId); if (!o) return; const R = pfInit(o, S.ctx.ajusteId === o.id ? 'ajuste' : undefined);
    if (d.pf === 'equipo') { R.equipos = R.equipos || []; if (el.checked) { if (!R.equipos.includes(el.value)) R.equipos.push(el.value); } else R.equipos = R.equipos.filter(x => x !== el.value); }
    else if (d.pf === 'equipoOrigen') {
      R.equipoOrigen = el.value; const eqb = equiposBuqueDe(o); const rec = o.recomendacion && !o.recomendacion.sinOpciones ? o.recomendacion.recursos : null;
      if (el.value === 'buque') { R.equipos = eqb ? [eqb.id] : []; if (R.funciones) delete R.funciones['F-GRU']; }
      else { R.equipos = (R.equipos || []).filter(x => !esEquipoBuque(x)); if (!R.equipos.length && rec && origenEquipos(rec) === 'muelle') R.equipos = [...rec.equipos]; R.funciones = R.funciones || {}; if (tipoEquipoPara(o) === 'Grúa' && !R.funciones['F-GRU']) R.funciones['F-GRU'] = Math.max(1, R.equipos.length); }
    }
    else if (['muelle', 'deposito', 'balanza'].includes(d.pf)) R[d.pf] = el.value || null;
    else { const [k, id] = d.pf.split(':'); const map = { mano: 'manos', func: 'funciones', log: 'logistica' }[k]; R[map] = R[map] || {}; R[map][id] = Math.max(0, +el.value || 0); }
    render({ keep: true }); return;
  }
  if (d.det !== undefined) { /* detalle del servicio de Rental / Logística (S21) */
    if (!W || !W.det) return; const [k, id] = d.det.split(':');
    if (k === 'maq') { W.det.maquinarias = W.det.maquinarias || {}; if (el.checked) W.det.maquinarias[id] = Math.max(1, W.det.maquinarias[id] || 1); else delete W.det.maquinarias[id]; }
    else if (k === 'maqn') { W.det.maquinarias[id] = Math.max(1, +el.value || 1); }
    else if (k === 'cantidad') W.det.cantidad = Math.max(1, +el.value || 1);
    else if (k === 'kmEntrega' || k === 'kmDevolucion') W.det[k] = Math.max(0, +el.value || 0);
    else W.det[k] = el.value;
    render({ keep: true }); return;
  }
  if (d.w !== undefined) {
    if (!W) wInit(null);
    const val = el.type === 'checkbox' ? el.checked : el.value;
    if (d.w === 'ventanaInicio' || d.w === 'ventanaFin') { const iso2 = fromLocalInput(val); if (iso2) { W.ventana = W.ventana || { inicio: iso2, fin: iso2 }; W.ventana[d.w === 'ventanaInicio' ? 'inicio' : 'fin'] = iso2; } render({ keep: true }); return; }
    W[d.w] = val;
    if (W_ORDER.includes(d.w)) { wReset(d.w); if (d.w === 'origen') wApplyOrigen(); }
    if (d.w === 'servicio' || d.w === 'bu' || d.w === 'dest' || d.w === 'producto') wAutoFill();
    render({ keep: true }); return;
  }
  if (d.cz !== undefined) { const o = orden(S.ctx.orderId); if (!o) return; const cz = (S.ctx.cz && S.ctx.cz.id === o.id) ? S.ctx.cz : { id: o.id, merma: +mv('cz-merma') || 0, excedente: +mv('cz-exc') || 0, aprob: false, aprobRef: '', obs: '' }; cz.merma = +mv('cz-merma') || 0; cz.excedente = +mv('cz-exc') || 0; cz.aprob = !!mv('cz-aprob'); cz.aprobRef = mv('cz-aprob-ref') || ''; cz.obs = mv('cierre-obs') || ''; S.ctx.cz = cz; render({ keep: true }); return; }
  if (d.arrestado) { if (S.ctx.rol !== 'LAR') { toast('Solo Logística de arribo modifica el estado de los arribos', 'warn'); render({ keep: true }); return; } const [tipo, id] = d.arrestado.split(':'); cambiarEstadoArribo(tipo, id, el.value); toast(id + ' → ' + el.value, 'ok'); render({ keep: true }); return; }
  if (d.cierre) { const s = srv(d.cierre); s.cierre = el.value; s.cierreSup = true; toast(s.nombre + ' cierra en ' + rolName(el.value), 'ok'); render({ keep: true }); return; }
  if (d.mat) { const [E, c] = d.mat.split(':'); md().matrizEjecucion[E][c] = el.value; toast('Matriz actualizada: ' + compName(c) + ' → ' + buName(el.value), 'ok'); save(); return; }
  if (d.par) { const v = +el.value; const p = md().parametros; if (d.par.startsWith('pesos.')) p.pesos[d.par.split('.')[1]] = v; else p[d.par] = v; save(); toast('Parámetro actualizado', 'ok'); return; }
}
function onInput(e) {
  const el = e.target;
  if (el.dataset.bind === 'ordQ') { S.ctx.ordQ = el.value; render({ keep: true }); const q = document.getElementById('ord-q'); if (q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); } }
}

/* ---------- inicio ---------- */
function init() {
  const s = load();
  if (s) { S = s; if (S.ctx.screen === 'exp' && !orden(S.ctx.orderId)) S.ctx.screen = 'inicio'; if (S.ctx.screen === 'nueva') S.ctx.screen = 'bandeja'; if (S.ctx.screen === 'programacion') S.ctx.screen = 'arribos'; if (!moduloHabilitado(S.ctx.screen)) S.ctx.screen = 'inicio'; }
  else { newState(); save(); }
  document.addEventListener('click', onClick);
  document.addEventListener('change', onChange);
  document.addEventListener('input', onInput);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); navOpen(false); } });
  render();
}
init();
