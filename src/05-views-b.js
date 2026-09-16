/* =====================================================================
   VISTAS (B) — formulario del Planificador, alta de orden (Comercial),
   Recursos, Depósito, Comparativas, Datos maestros, Administración,
   Casos guiados y Supuestos
   ===================================================================== */

/* ---------- Planificador ---------- */
const PF = {};
function pfInit(o, mode) {
  if (mode === 'ajuste') { const k = o.id + ':aj'; if (!PF[k]) PF[k] = clone(o.plan.recursos); return PF[k]; }
  if (PF[o.id]) return PF[o.id];
  if (!sinOrigenOperativo(o) && !o.recomendacion) { o.recomendacion = recomendar(o); save(); }
  const base = o.recomendacion && !o.recomendacion.sinOpciones ? clone(o.recomendacion.recursos) : o.detalle ? recursosDeDetalle(o) : { muelle: null, equipos: [], deposito: null, balanza: null, funciones: { 'F-SUP': 1 }, manos: {}, logistica: {} };
  if (o.medio === 'BUQ') base.equipoOrigen = origenEquipos(base);
  PF[o.id] = base; return base;
}
/* marca de ámbito: Operaciones, Depósito o compartido entre ambos (revisión 17/09, S33) */
function ambChip(rid) { const a = ambitoInfo(ambitoRecurso(rid)); return chip(a.corto, a.cls, 'Recurso de ' + a.nombre + (a.id === 'compartido' ? ': lo gestionan Operaciones y Depósito' : '')); }
function ambLeyenda() { return '<p class="help" style="margin:0 0 8px">Ámbito de cada recurso: ' + AMBITOS.map(a => chip(a.corto, a.cls) + ' <span class="muted">' + esc(a.nombre) + '</span>').join(' · ') + '. Los compartidos los pueden asignar o liberar tanto Operaciones como Depósito mientras el operativo está en curso ' + sup('S33') + '.</p>'; }

/* Destino en depósito siguiendo la distribución de la planta: planta › depósito › celda › box › mini box (revisión 16/09, S29) */
function depositoCascada(o, R) {
  const E = o.entidad; const ruta = R.deposito ? rutaUbicacion(R.deposito) : []; const nav = S.ctx.depNav || {};
  const dpDe = u => byId(md().depositosPadre, u.deposito);
  const plantasDep = [...new Set(md().depositos.filter(u => u.entidad === E && !u.padreUbi && dpDe(u)).map(u => dpDe(u).planta))];
  const plSel = ruta.find(x => x.nivel === 'planta')?.id || (plantasDep.includes(nav.planta) ? nav.planta : '') || plantasDep[0] || '';
  const depsPl = md().depositosPadre.filter(d => d.planta === plSel);
  const depSel = ruta.find(x => x.nivel === 'deposito')?.id || (depsPl.some(d => d.id === nav.deposito) ? nav.deposito : '');
  const celdas = md().depositos.filter(u => u.entidad === E && !u.padreUbi && (!depSel || u.deposito === depSel) && mdUsable(u));
  const celdaSel = ruta.find(x => x.nivel === 'celda')?.id || '';
  const boxes = celdaSel ? ubiHijos(celdaSel).filter(mdUsable) : [];
  const boxSel = ruta.find(x => x.nivel === 'box')?.id || '';
  const minis = boxSel ? ubiHijos(boxSel).filter(mdUsable) : [];
  const miniSel = ruta.find(x => x.nivel === 'minibox')?.id || '';
  const optUbi = (list, cur, vacio) => [{ v: '', t: vacio }, ...list.map(u => { const ch = chequearRecurso(u.id, 1, o); const libre = u.capacidadT - u.ocupadoT; return { v: u.id, t: u.nombre + ' · ' + fmtT(libre) + ' t libres' + (u.fiscal ? ' · fiscal' : '') + (ch.errores.length ? ' ⚠' : '') }; })];
  const destino = R.deposito ? recurso(R.deposito) : null;
  const chk = R.deposito ? chequearRecurso(R.deposito, 1, o) : { errores: [], avisos: [] };
  return '<h3 style="margin:6px 0">Destino en depósito <span class="tag">distribución de la planta</span> ' + sup('S29') + '</h3>' +
    '<p class="help" style="margin:0 0 8px">El destino se elige recorriendo la distribución: <b>planta › depósito › celda / tanque / galpón / silo › box › mini box</b>. Se puede parar en cualquier nivel: el destino es el último seleccionado.</p>' +
    '<div class="form-grid" style="margin-bottom:6px">' +
    field('Planta', sel('pf-dep-pl', plantasDep.map(pl => ({ v: pl, t: planta(pl)?.nombre || pl })), plSel, 'data-depsel="planta"')) +
    field('Depósito (M-10)', sel('pf-dep-dp', [{ v: '', t: '— todos los depósitos —' }, ...depsPl.map(dp => ({ v: dp.id, t: dp.nombre + ' · ' + esc(dp.tipo) + ' · ' + fmtT(dp.capacidad_total_tn) + ' t' }))], depSel, 'data-depsel="deposito"')) +
    field('Celda / tanque / galpón / silo', sel('pf-dep-ce', optUbi(celdas, celdaSel, '— sin asignar —'), celdaSel, 'data-depsel="celda"')) +
    (boxes.length ? field('Box', sel('pf-dep-bx', optUbi(boxes, boxSel, '— toda la ' + esc(recNombre(celdaSel)) + ' —'), boxSel, 'data-depsel="box"')) : '') +
    (minis.length ? field('Mini box', sel('pf-dep-mb', optUbi(minis, miniSel, '— todo el ' + esc(recNombre(boxSel)) + ' —'), miniSel, 'data-depsel="minibox"')) : '') +
    '</div>' +
    (destino ? '<p class="small" style="margin:0 0 10px">Destino: <b>' + esc(rutaUbicacionTxt(destino.id)) + '</b> · ' + fmtT(destino.capacidadT - destino.ocupadoT) + ' t libres' + (chk.errores.length ? ' · <span class="crit">' + esc(chk.errores[0]) + '</span>' : '') + '</p>' : '<p class="small crit" style="margin:0 0 10px">Falta elegir el destino en depósito.</p>');
}
/* Turnos: cantidad y régimen desde la tabla de turnos M-33 (revisión 16/09, S26) */
function turnosBlock(o, R, d) {
  const reg = regimenTurnos(); const HT = duracionTurno();
  const ini = new Date(o.ventana.inicio); const h0 = ini.getHours();
  const idx0 = Math.max(0, reg.findIndex(t => { const a = +t.hora_desde.slice(0, 2), b = +t.hora_hasta.slice(0, 2) || 24; return h0 >= a && h0 < b; }));
  const ocupados = []; for (let i = 0; i < d.turnos; i++) ocupados.push(reg[(idx0 + i) % reg.length]);
  const cuenta = {}; for (const t of ocupados) cuenta[t.id] = (cuenta[t.id] || 0) + 1;
  return '<h3 style="margin:6px 0">Turnos <span class="tag">régimen M-33 · ' + HT + ' h</span> ' + sup('S26') + '</h3>' +
    '<div class="form-grid" style="margin-bottom:6px">' +
    field('Cantidad de turnos', '<input type="number" min="1" max="60" data-pf="turnos" value="' + d.turnos + '">') +
    field('Duración del turno (M-33)', '<input value="' + HT + ' h" disabled>') +
    field('Horas del operativo', '<input value="' + fmtN(d.turnos * HT, 0) + ' h" disabled>') +
    (d.manual ? field('Cálculo del sistema', '<input value="' + d.turnosCalc + ' turnos por ritmo" disabled>') : '') + '</div>' +
    '<div class="btn-row" style="margin-bottom:4px">' + reg.map(t => chip(turnoLabel(t) + (cuenta[t.id] ? ' × ' + cuenta[t.id] : ''), cuenta[t.id] ? 'acc' : '')).join('') + '</div>' +
    '<p class="help" style="margin-bottom:12px">Los turnos salen de la tabla de turnos (M-33) y se ocupan en secuencia desde el inicio de la ventana. El sistema propone <b>' + d.turnosCalc + '</b> por el ritmo de los equipos; el Planificador puede fijar otra cantidad' + (d.manual ? ' (fijada manualmente en <b>' + d.turnos + '</b>)' : '') + '.</p>';
}
/* Personal externo: manos completas y ajuste de la composición, puesto por puesto (revisión 16/09, S30) */
function manosBlock(o, R, fam) {
  const manos = md().manos.filter(m => mdUsable(m) && (!fam || (m.familias || []).includes(fam)));
  const otras = md().manos.filter(m => mdUsable(m) && !manos.includes(m));
  const comp = composicionManos(R); const base = composicionManos({ manos: R.manos });
  const puestos = md().puestosMano || [];
  const roles = [...new Set([...Object.keys(base), ...Object.keys(R.puestos || {}), ...puestos.map(p2 => p2.nombre)])];
  const filas = roles.map(rol => {
    const b = base[rol] || 0; const aj = (R.puestos || {})[rol] || 0; const tot = b + aj; const pm = puestoMano(rol);
    return [esc(rol) + (pm ? ' <span class="xs muted">' + fmtUSD(pm.costoTurno) + '/turno</span>' : ''), String(b),
      '<input type="number" step="1" data-pf="puesto:' + esc(rol) + '" value="' + aj + '" style="width:64px">',
      (tot < 0 ? '<b class="crit">' + tot + '</b>' : '<b>' + tot + '</b>')];
  });
  return '<div><h3 style="margin:6px 0">Personal externo (manos)</h3>' +
    '<div class="stack" style="gap:6px">' + manos.map(m => '<div class="small"><input type="number" min="0" step="1" data-pf="mano:' + m.id + '" value="' + (R.manos?.[m.id] || 0) + '" style="width:64px"> <b>' + esc(m.nombre) + '</b> <span class="xs muted">mano completa</span><br><span class="xs muted">' + Object.entries(m.roles).map(([r2, q]) => q + ' ' + r2.toLowerCase()).join(', ') + ' · ' + fmtUSD(m.costoTurno) + '/turno · ' + esc(provName(m.proveedor)) + '</span></div>').join('') +
    (otras.length ? '<details class="small"><summary class="muted">Otras manos del catálogo (' + otras.length + ')</summary><div class="stack" style="gap:6px;margin-top:6px">' + otras.map(m => '<div class="small"><input type="number" min="0" step="1" data-pf="mano:' + m.id + '" value="' + (R.manos?.[m.id] || 0) + '" style="width:64px"> ' + esc(m.nombre) + ' <span class="xs muted">' + fmtUSD(m.costoTurno) + '/turno</span></div>').join('') + '</div></details>' : '') + '</div>' +
    '<h4 class="up" style="margin:10px 0 4px">Composición efectiva · agregar o desafectar puestos ' + sup('S30') + '</h4>' +
    table([{ h: 'Puesto', f: r => r[0] }, { h: 'Por las manos', cls: 'num', f: r => r[1] }, { h: 'Ajuste', cls: 'num', f: r => r[2] }, { h: 'Total', cls: 'num', f: r => r[3] }], filas, { cls: 'compact' }) +
    '<p class="help">El ajuste suma o resta personas sobre la composición de las manos asignadas, y admite puestos que ninguna mano incluye: <b>' + personasManos(R) + ' personas por turno</b> en total. Un ajuste negativo desafecta el puesto y descuenta su costo.</p></div>';
}
/* Personal propio: el mismo puesto puede estar en más de un operativo; el sistema calcula el % de afectación (revisión 16/09, S25) */
function personalPropioBlock(o, R) {
  return '<div><h3 style="margin:6px 0">Personal propio (por puesto)</h3><div class="stack" style="gap:6px">' +
    md().funciones.filter(mdUsable).map(f => {
      const n = R.funciones?.[f.id] || 0; const af = n > 0 ? afectacionPuesto(f.id, o, n) : null;
      return '<div class="small"><input type="number" min="0" step="1" data-pf="func:' + f.id + '" value="' + n + '" style="width:64px"> ' + esc(f.nombre) + ' <span class="xs muted">dotación ' + f.dotacion + ' · ' + fmtUSD(f.costoTurno) + '/turno</span>' +
        (af && af.pct < 100 ? '<br><span class="xs">' + chip(af.pct + ' % de afectación', 'warn') + ' <span class="muted">compartido con ' + af.compartido.join(', ') + '</span></span>' : af ? '<br><span class="xs">' + chip('100 % de afectación', 'ok') + '</span>' : '');
    }).join('') + '</div>' +
    '<p class="help">Un puesto puede estar afectado a más de un operativo a la vez: cuando la demanda simultánea supera la dotación, el sistema reparte el <b>% de afectación</b> y prorratea el costo. El porcentaje se congela al confirmar la planificación.</p></div>';
}
/* Logística (flota) y maquinaria, separadas; la maquinaria lleva % de uso (revisión 16/09, S31) */
function flotaBlock(o, R, E) {
  const list = logisticaDe(E, 'logistica').filter(mdUsable);
  return '<div><h3 style="margin:6px 0">Logística (flota)</h3><div class="stack" style="gap:6px">' +
    list.map(l => '<div class="small"><input type="number" min="0" step="1" data-pf="log:' + l.id + '" value="' + (R.logistica?.[l.id] || 0) + '" style="width:64px"> ' + esc(l.nombre) + ' ' + ambChip(l.id) + ' <span class="xs muted">' + l.cantidad + ' disp. · ' + fmtUSD(l.costoHora) + '/h' + (l.capacidadT ? ' · ' + l.capacidadT + ' t' : '') + (l.tercero ? ' · tercero' : '') + '</span></div>').join('') +
    '</div><p class="help">Camiones propios y de transportista: la flota se planifica por unidad completa.</p></div>';
}
function maquinariaBlock(o, R, E) {
  const list = logisticaDe(E, 'maquinaria').filter(mdUsable); const dest = R.deposito || null;
  return '<div><h3 style="margin:6px 0">Maquinaria <span class="tag">% de uso · unidades</span> ' + sup('S31') + '</h3>' +
    (dest ? '<p class="help" style="margin:0 0 6px">Acceso del destino <b>' + esc(recNombre(dest)) + '</b>: ' + (accesoDe(dest) ? fmtN(accesoDe(dest).anchoM, 1) + ' × ' + fmtN(accesoDe(dest).altoM, 1) + ' m (' + esc(accesoDe(dest).tipo) + ')' : 'sin restricción declarada') + '. Solo las unidades que entran se pueden asignar ' + sup('S34') + '.</p>' : '') +
    '<div class="stack" style="gap:8px">' +
    list.map(l => {
      const n = R.logistica?.[l.id] || 0; const pct = R.maqPct?.[l.id] ?? 100;
      const usados = usoPico(l.id, o); const libre = Math.max(0, l.cantidad - usados - n * pct / 100);
      const unidades = unidadesDe(l.id); const elegidas = unidadesElegidas(R, l.id);
      const aptas = unidades.filter(u => unidadApta(u, dest).apta).length;
      const detalle = unidades.length ? '<details' + (elegidas.length ? ' open' : '') + ' class="small" style="margin-top:4px"><summary class="muted">' + unidades.length + ' unidad' + (unidades.length > 1 ? 'es' : '') + ' en inventario · <b>' + aptas + '</b> apta' + (aptas === 1 ? '' : 's') + (dest ? ' para ' + esc(recNombre(dest)) : '') + (elegidas.length ? ' · ' + elegidas.length + ' elegida' + (elegidas.length > 1 ? 's' : '') : '') + '</summary><div class="stack" style="gap:4px;margin:6px 0 0 4px">' +
        unidades.map(u => { const ap = unidadApta(u, dest); const on = elegidas.includes(u.id);
          return '<label class="field chk small" style="align-items:flex-start"><input type="checkbox" data-pf="maqu:' + l.id + ':' + u.id + '"' + (on ? ' checked' : '') + (ap.apta ? '' : ' disabled') + '><span><b>' + esc(u.interno) + '</b> <span class="tag">' + esc(u.id) + '</span> ' + esc(u.marca) + ' ' + esc(u.modelo) + ' ' + u.anio + ' · ' + esc(u.capacidad) + ' · ' + fmtN(u.anchoM, 1) + ' × ' + fmtN(u.altoM, 1) + ' m<br><span class="xs ' + (ap.apta ? 'muted' : 'crit') + '">' + (ap.apta ? '✔ ' : '⚠ ') + esc(ap.motivo) + ' · ' + esc(u.ubicacion_habitual) + '</span></span></label>';
        }).join('') + '</div></details>' : '';
      return '<div class="small"><input type="number" min="0" step="1" data-pf="log:' + l.id + '" value="' + n + '" style="width:60px"' + (elegidas.length ? ' disabled title="la cantidad sale de las unidades elegidas"' : '') + '> ' + esc(l.nombre) + ' ' + ambChip(l.id) +
        (n > 0 ? ' <input type="number" min="1" max="100" step="5" data-pf="maqpct:' + l.id + '" value="' + pct + '" style="width:64px" title="% de uso en esta orden"> <span class="xs muted">% de uso</span>' : '') +
        '<br><span class="xs muted">' + l.cantidad + ' en inventario · ' + fmtUSD(l.costoHora) + '/h' + (l.capacidadTh ? ' · ' + l.capacidadTh + ' t/h' : '') + ' · ' + esc(buName(l.bu)) + '</span>' +
        (n > 0 && pct < 100 ? '<br><span class="xs">' + chip('remanente ' + (100 - pct) + ' % disponible para otra orden', 'info') + '</span>' : '') +
        (n > 0 && libre > 0 ? '<br><span class="xs muted">libre en la ventana: ' + fmtN(libre, 1) + '</span>' : '') + detalle + '</div>';
    }).join('') +
    '</div><p class="help">La maquinaria se afecta con un <b>% de uso</b> para esta orden; el remanente queda para otro operativo. Desplegá cada máquina para <b>elegir la unidad</b>: la misma máquina tiene distintas medidas y capacidades, y el acceso del destino define cuál sirve.</p></div>';
}
/* Habilitación de puerto: rubro con costo según el puerto (revisión 16/09, S32) */
function habPuertoBlock(o, R) {
  const hp = habilitacionPuerto(o);
  if (!hp) return '<h3 style="margin:6px 0">Habilitación de puerto ' + sup('S32') + '</h3>' + alertBox('info', '<div>El origen no opera sobre un puerto con habilitación arancelada (planta propia): sin costo.</div>') + '<div style="margin-bottom:12px"></div>';
  return '<h3 style="margin:6px 0">Habilitación de puerto ' + sup('S32') + '</h3>' +
    '<label class="field chk" style="margin-bottom:4px"><input type="checkbox" data-pf="habPuerto"' + (R.habPuerto ? ' checked' : '') + '><span>Incluir la <b>habilitación de ' + esc(hp.puerto.nombre) + '</b> · <b>' + fmtUSD(hp.costo) + '</b> por operativo</span></label>' +
    '<p class="help" style="margin-bottom:12px">' + esc(hp.detalle) + '. El costo lo fija el puerto en la master data (M-09) y se imputa como un rubro más del operativo.</p>';
}
/* Equipos de descarga / carga (SUPUESTO S14): tipo según el producto; origen muelle o buque; cambio de fecha de arribo ante un equipo ocupado (S15) */
function equiposBlock(o, R, ajuste) {
  const tipo = tipoEquipoPara(o); const info = tipoEquipoInfo(tipo); const ef = estadoFisico(o.producto);
  const eqb = equiposBuqueDe(o); const org = origenEquipos(R); const lu = origenInfo(o)?.lu; R.equipos = R.equipos || [];
  const opts = [{ v: 'muelle', t: 'Del muelle · ' + info.nombre.toLowerCase() + ' de la terminal' }, { v: 'buque', t: eqb ? 'Del buque · ' + eqb.nombre : 'Del buque · el lineup no declara equipos propios', dis: !eqb }];
  let list;
  if (org === 'buque') {
    if (eqb) {
      const total = eqb.cantidad || 1; const nSel = Math.min(total, Math.max(1, R.equiposBuqueN || total)); const cu = eqb.capacidadUnidad || Math.round((eqb.capacidadTh || 0) / total);
      R.equiposBuqueN = nSel; if (!R.equipos.includes(eqb.id)) R.equipos = [eqb.id];
      list = '<div class="form-grid">' + Array.from({ length: total }, (_, i) => {
        const on = i < nSel;
        return '<div class="eq' + (on ? ' sel' : '') + '"><label><input type="checkbox" data-pf="eqbn" value="' + (i + 1) + '"' + (on ? ' checked' : '') + '><span><b>' + esc(tipoEquipoInfo(eqb.tipo).singular) + ' ' + (i + 1) + ' del buque</b><br><span class="xs muted">' + cu + ' t/h · sin costo para la terminal · la opera la tripulación</span></span></label></div>';
      }).join('') + '</div>' +
        '<p class="help" style="margin-top:6px">' + esc(eqb.nombre) + ': <b>' + nSel + ' de ' + total + '</b> en uso · capacidad ' + fmtT(cu * nSel) + ' t/h. Los equipos del buque no consumen inventario de la terminal, no generan superposición y se computan como recurso de tercero; los declara Logística de arribo en ' + esc(lu?.id || '') + '. Con este origen <b>no se ofrecen las grúas del muelle</b>.</p>';
    } else list = alertBox('crit', 'El lineup ' + esc(lu?.id || '') + ' no declara equipos propios del buque. Pedí a Logística de arribo que lo actualice o usá los equipos del muelle.');
  } else {
    const eqs = equiposMuelleDe(o); const am = arriboModificable(o);
    list = eqs.length ? '<div class="form-grid">' + eqs.map(e => {
      const ch = chequearRecurso(e.id, 1, o); const confl = conflictosRecurso(e.id, o); const sel_ = R.equipos.includes(e.id);
      const estadoTxt = e.capacidadTh + ' t/h · ' + esc(e.estado) + (e.mantHasta && e.estado !== 'Operativo' ? ' hasta ' + fmtD(e.mantHasta) : '') + ' · ' + fmtUSD(e.costoHora) + '/h' + (ch.errores.length ? ' · <b>no disponible</b>' : '');
      const conflTxt = confl.length ? '<br><span class="xs crit">ocupado por otro operativo: ' + confl.map(c => osLink(c.orden) + ' hasta ' + fmtDT(c.hasta)).join(' · ') + '</span>' : '';
      const acts = confl.length && sel_ && !ajuste ? '<div class="acts">' + (am.ok && S.ctx.rol === 'PLAN' ? btn('Cambiar fecha de arribo', 'arribo-fecha', { id: o.id, rid: e.id }, 'sm') + '<span class="xs muted">propone el primer turno libre después de la reserva ' + sup('S15') + '</span>' : '<span class="xs muted">' + (am.ok ? 'el cambio de fecha lo hace el Planificador' : 'fecha de arribo no modificable: ' + esc(am.motivo)) + '</span>') + '</div>' : '';
      return '<div class="eq' + (ch.errores.length ? ' off' : sel_ ? ' sel' : '') + '"><label><input type="checkbox" data-pf="equipo" value="' + e.id + '"' + (sel_ ? ' checked' : '') + '><span><b>' + esc(e.id) + '</b> ' + esc(e.nombre) + '<br><span class="xs ' + (ch.errores.length ? 'crit' : 'muted') + '">' + estadoTxt + '</span>' + conflTxt + '</span></label>' + acts + '</div>';
    }).join('') + '</div>' : alertBox('warn', 'La entidad no tiene ' + info.nombre.toLowerCase() + ' en su inventario de equipos del muelle.');
  }
  return '<h3 style="margin:6px 0">Equipos de descarga / carga · ' + esc(info.nombre) + ' <span class="tag">producto ' + (ef === 'liquido' ? 'líquido' : 'sólido') + '</span> ' + sup('S14') + '</h3>' +
    '<p class="help" style="margin:0 0 8px">El tipo de equipo lo define el producto en la master data (' + esc(famName(prod(o.producto)?.familia)) + ' → ' + esc(info.nombre.toLowerCase()) + '). Primero indicá si se usan los equipos del muelle o los del buque; luego elegí los disponibles. Con un origen, el otro no se ofrece.</p>' +
    '<div class="form-grid" style="margin-bottom:8px">' + field('Origen de los equipos', sel('pf-eqorg', opts, org, 'data-pf="equipoOrigen"'), '', 'style="grid-column:1/-1;max-width:560px"') + '</div>' + list + '<div style="margin-bottom:12px"></div>';
}
function plannerForm(o, mode) {
  const ajuste = mode === 'ajuste';
  const R = pfInit(o, mode); const E = o.entidad; const fam = prod(o.producto)?.familia; const s = srv(o.servicio);
  const v = validarPlan(o, { recursos: R }); const d = duracionPlan(o, { recursos: R }); const c = costoPlan(o, { recursos: R });
  const rec = o.recomendacion; const difiere = rec && !rec.sinOpciones && JSON.stringify(normRec(rec.recursos)) !== JSON.stringify(normRec(R));
  const num = (id, val, hint) => '<input type="number" min="0" step="1" data-pf="' + id + '" value="' + (val || 0) + '" style="width:70px">' + (hint ? ' <span class="xs muted">' + hint + '</span>' : '');
  const opt = (list, cur, extraT) => [{ v: '', t: '— sin asignar —' }, ...list.map(x => { const ch = chequearRecurso(x.id, 1, o); return { v: x.id, t: x.nombre + (extraT ? ' · ' + extraT(x) : '') + (ch.errores.length ? ' ⚠' : ''), dis: false }; })];
  const pres = presentacionProducto(o.producto);
  let form = (pres ? alertBox('info', '<div><b>Producto:</b> ' + esc(prod(o.producto)?.nombre || '—') + ' · <b>' + esc(pres.presentacion) + '</b> ' + chip(pres.estado === 'liquido' ? 'líquido' : 'sólido', pres.estado === 'liquido' ? 'info' : '') + ' · familia ' + esc(pres.familia) + (pres.densidad ? ' · densidad ' + fmtN(pres.densidad, 2) : '') + ' · ' + fmtT(o.toneladas) + ' ' + esc(pres.um) + ' · calidad ' + esc(o.calidad || 'sin declarar') + '. La presentación define el tipo de equipo, las manos y el depósito compatibles.</div>') : '') + ambLeyenda() + reservasOrigenCard(o, R);
  if (!sinOrigenOperativo(o)) {
    form += (!sinOrigenOperativo(o) ? recCard(o) : '') +
      '<div class="form-grid" style="margin-bottom:12px">' +
      (o.medio === 'BUQ' ? field('Muelle', sel('pf-muelle', opt(md().muelles.filter(m => m.entidad === E && mdUsable(m)), R.muelle, m => 'calado ' + m.calado + ' m'), R.muelle || '', 'data-pf="muelle"')) : '') +
      field('Balanza', sel('pf-bz', opt(md().balanzas.filter(x => x.entidad === E && mdUsable(x)), R.balanza, x => (x.fiscal ? 'fiscal' : 'no fiscal')), R.balanza || '', 'data-pf="balanza"')) + '</div>' +
      (s.usaDeposito ? depositoCascada(o, R) : '');
    if (o.medio === 'BUQ') form += equiposBlock(o, R, ajuste);
    form += turnosBlock(o, R, d) + habPuertoBlock(o, R) +
      '<div class="grid g2" style="margin-bottom:12px">' + manosBlock(o, R, fam) + personalPropioBlock(o, R) + '</div>' +
      '<div class="grid g2">' + flotaBlock(o, R, E) + maquinariaBlock(o, R, E) + '</div>';
  } else {
    form += (o.detalle ? alertBox('info', '<div><b>Solicitado por Comercial ' + sup('S21') + ':</b> ' + esc(detalleResumen(o)) + ' · ' + ventanaTxt(o.ventana) + '. Lo pedido ya está cargado en la asignación; validá la disponibilidad en la ventana y ajustá si hace falta.</div>') : alertBox('info', '<div>' + sup('S7') + ' Servicio por solicitud: sin recomendación automática. El Planificador reserva los recursos de la BU prestadora para la ventana solicitada.</div>')) +
      '<div class="grid g2" style="margin-top:12px"><div><h3 style="margin:6px 0">Recursos de la BU prestadora <span class="xs muted">flota y maquinaria</span></h3><div class="stack" style="gap:6px">' + md().logistica.filter(l => l.entidad === E && (l.bu === o.bu || o.servicio === 'SRV-LOGI')).map(l => '<div class="small">' + num('log:' + l.id, R.logistica?.[l.id], '') + ' ' + esc(l.nombre) + ' <span class="tag">' + (claseRecurso(l.id) === 'maquinaria' ? 'maquinaria' : 'flota') + '</span>' + (claseRecurso(l.id) === 'maquinaria' && (R.logistica?.[l.id] || 0) > 0 ? ' <input type="number" min="1" max="100" step="5" data-pf="maqpct:' + l.id + '" value="' + (R.maqPct?.[l.id] ?? 100) + '" style="width:64px" title="% de uso"> <span class="xs muted">%</span>' : '') + ' <span class="xs muted">' + l.cantidad + ' disp. · ' + fmtUSD(l.costoHora) + '/h · ' + esc(buName(l.bu)) + '</span></div>').join('') + (o.bu === 'TYS-RENT' ? md().equipos.filter(e => e.entidad === E).map(e => '<label class="field chk small"><input type="checkbox" data-pf="equipo" value="' + e.id + '"' + ((R.equipos || []).includes(e.id) ? ' checked' : '') + '><span>' + esc(e.nombre) + ' <span class="xs muted">' + esc(e.estado) + '</span></span></label>').join('') : '') + '</div></div>' +
      '<div><h3 style="margin:6px 0">Personal propio</h3><div class="stack" style="gap:6px">' + md().funciones.map(f => '<div class="small">' + num('func:' + f.id, R.funciones?.[f.id], '') + ' ' + esc(f.nombre) + '</div>').join('') + '</div></div></div>';
  }
  const est = !sinOrigenOperativo(o) ? '<div class="grid g4" style="gap:8px">' + [['Duración', fmtN(d.horasTurnos, 0) + ' h', d.turnos + ' turnos'], ['Ritmo', fmtN(d.ritmo, 0) + ' t/h', fmtT(d.ritmo * 24) + ' t/día' + (o.contrato?.condiciones?.ritmoComprometido ? ' · comprometido ' + fmtT(o.contrato.condiciones.ritmoComprometido) : '')], ['Costo estimado', fmtUSD(c.total), (rec && !rec.sinOpciones ? 'recomendado ' + fmtUSD(rec.costo) : '')], ['Cumplimiento', fmtPct(cumplimiento(o, d.ritmo)), '']].map(([l, v2, dd]) => '<div class="kpi tight"><span class="v" style="font-size:18px">' + v2 + '</span><span class="l">' + l + '</span><span class="d">' + esc(dd) + '</span></div>').join('') + '</div>'
    : '<p class="small muted">Ventana ' + ventanaTxt(o.ventana) + ' · ' + fmtN(d.horasTurnos, 0) + ' h · costo estimado ' + fmtUSD(c.total) + '</p>';
  const val = (v.errores.length ? alertBox('crit', '<div><b>' + v.errores.length + ' error' + (v.errores.length > 1 ? 'es' : '') + ' de validación</b><ul>' + v.errores.map(e => '<li>' + esc(e) + '</li>').join('') + '</ul></div>') : alertBox('ok', 'Validación sin errores: disponibilidad, superposición, capacidad, compatibilidad y reglas del circuito.')) +
    (v.avisos.length ? alertBox('warn', '<div><b>Avisos</b><ul>' + v.avisos.map(e => '<li>' + esc(e) + '</li>').join('') + '</ul></div>') : '') + noDisponiblesCard(o, R);
  if (ajuste) return '<div class="card tight" style="border-color:var(--warn)"><div class="card-h"><h3>Ajuste de recursos por Operaciones (antes del inicio)</h3><div class="btn-row">' + btn('Volver al plan aceptado', 'ops-ajuste-reset', { id: o.id }, 'sm') + btn('Cancelar', 'ops-ajuste-cancel', { id: o.id }, 'sm ghost') + '</div></div>' + alertBox('info', 'Operaciones puede dar de alta, modificar o quitar cualquier recurso de la planificación antes de iniciar. El plan aceptado por el Planificador (v' + (o.plan.version || 1) + ') se conserva como plan inicial para la comparativa; el ajuste queda registrado con motivo y responsable.') + form.replace(recCard(o), '') +
    '<div class="stack" style="margin-top:12px;gap:8px">' + est + val + '<div class="btn-row">' + btn('Guardar ajuste de recursos', 'ajustar-plan', { id: o.id }, 'pri', v.errores.length ? 'disabled' : '') + '</div></div></div>';
  return '<div class="card tight" style="border-color:var(--accent-line)"><div class="card-h"><h3>Asignación de recursos</h3><div class="btn-row">' + (rec && !rec.sinOpciones ? btn('Usar recomendación', 'pf-usar-rec', { id: o.id }, 'sm') : '') + (!sinOrigenOperativo(o) ? btn('Regenerar recomendación', 'pf-regen', { id: o.id }, 'sm ghost') : '') + '</div></div>' + form +
    '<div class="stack" style="margin-top:12px;gap:8px">' + est + val + (difiere ? alertBox('info', 'El plan <b>difiere de la recomendación</b>: al confirmar se pedirá el motivo y ambas propuestas se conservarán para compararlas al cierre.') : '') +
    '<div class="btn-row">' + btn('Confirmar planificación y enviar a operaciones', 'principal', { id: o.id, act: 'confirmar-plan' }, 'pri', v.errores.length ? 'disabled' : '') + '</div></div></div>';
}

/* ---------- Alta de orden (Comercial) ---------- */
let W = null;
function wInit(o) {
  W = o ? { edit: o.id, entidad: o.entidad, servicio: o.servicio, bu: o.bu || 'ENT', medio: o.medio, dest: o.destinatario ? o.destinatario.tipo + ':' + o.destinatario.id : '', producto: o.producto || (srv(o.servicio)?.requiereProducto === false ? 'NA' : ''), instrumento: o.instrumento || '', origen: o.origen ? o.origen.tipo + ':' + o.origen.id + ':' + (o.origen.cargaIdx ?? '') : (o.detalle ? 'detalle::' : ''), toneladas: o.toneladas, ventana: clone(o.ventana), nacionalizada: !!o.habilitaciones.nacionalizada, nacRef: o.habilitaciones.nacRef || '', msConfirmado: !!o.habilitaciones.msConfirmado, notas: o.notas || '', det: o.detalle ? clone(o.detalle) : wDetDefault(srv(o.servicio)?.detalle, o.entidad) }
    : { edit: null, entidad: S.ctx.entidad === 'ALL' ? 'TYS' : S.ctx.entidad, servicio: '', bu: '', medio: '', dest: '', producto: '', instrumento: '', origen: '', toneladas: 0, ventana: null, nacionalizada: false, nacRef: '', msConfirmado: false, notas: '', det: null };
}
/* detalle del servicio de Rental / Logística (S21): valores iniciales */
function wDetDefault(tipo, entidad) {
  if (tipo === 'rental') return { tipo, maquinarias: {}, kmEntrega: 0, kmDevolucion: 0 };
  if (tipo === 'logistica') { const cams = camionesDe(entidad); return { tipo, camion: cams[0]?.id || '', cantidad: 1, origen: entidad === 'TT' ? 'PL-TT' : 'PL-SN', destino: '' }; }
  return null;
}
/* Orden secuencial: el servicio va después de la entidad y define el resto */
const W_ORDER = ['entidad', 'servicio', 'bu', 'medio', 'dest', 'producto', 'instrumento', 'origen'];
function wReset(from) { const i = W_ORDER.indexOf(from); for (const k of W_ORDER.slice(i + 1)) W[k] = ''; W.toneladas = 0; W.ventana = null; W.msConfirmado = false; if (['entidad', 'servicio', 'bu', 'medio'].includes(from)) W.det = wDetDefault(srv(W.servicio)?.detalle, W.entidad); wAutoFill(); }
function wAutoFill() {
  /* completa los pasos que quedan determinados por el servicio; se detiene en el primero que requiere elección */
  const s = srv(W.servicio); if (!s) return;
  if (!W.bu) { if (s.nivel === 'entidad') W.bu = 'ENT'; else { const bs = wBus(s); if (bs.length === 1) W.bu = bs[0].id; else return; } }
  if (!W.medio) { if (s.medios.length === 1) W.medio = s.medios[0]; else return; }
  if (!W.dest) return;
  if (!W.producto) { if (s.requiereProducto === false) W.producto = 'NA'; else return; }
  if (!W.instrumento) { const ins = wInstrumentos(); if (ins.length === 1) W.instrumento = ins[0].id; else return; }
  if (s.detalle) { /* Rental / Logística: el detalle del servicio reemplaza al origen operativo (S21) */
    if (!W.origen) W.origen = 'detalle::'; if (!W.det || W.det.tipo !== s.detalle) W.det = wDetDefault(s.detalle, W.entidad);
    if (!W.ventana) W.ventana = { inicio: iso(1, 6), fin: iso(s.detalle === 'rental' ? 3 : 2, 18) };
    const d = wDest(); if (s.detalle === 'logistica' && !W.det.destino && d?.tipo === 'cliente' && cli(d.id)?.lugar) W.det.destino = 'CLI:' + d.id; if (s.detalle === 'logistica' && !W.det.destino && d?.tipo === 'entidad') W.det.destino = d.id === 'TT' ? 'PL-TT' : 'PL-SN';
  }
}
function wServicios() { return md().servicios.filter(s => !s.pendiente && s.ambito.includes(W.entidad) && mdUsable(s)); }
function wBus(s) { return md().bus.filter(b => b.entidad === W.entidad && s.busPrestadoras.includes(b.id)); }
function wDestOptions(s) {
  const out = [];
  if (s.detalle) { /* Rental / Logística: Interna → otras BU (y empresas del grupo); Externa → nómina de clientes (S21) */
    if (W.medio === 'INT') { for (const b of md().bus.filter(b => b.entidad === W.entidad && b.id !== W.bu && !b.convertida)) out.push({ v: 'bu:' + b.id, t: b.nombre + ' (BU · interna)' }); for (const e of md().entidades.filter(e => e.id !== W.entidad)) out.push({ v: 'entidad:' + e.id, t: e.nombre + ' (empresa del grupo)' }); }
    else if (W.medio === 'EXT') for (const c of md().clientes.filter(mdUsable)) out.push({ v: 'cliente:' + c.id, t: c.nombre + ' (cliente)' });
    return out;
  }
  if (['terceros', 'entidad-o-terceros'].includes(s.destinatario)) for (const c of md().clientes.filter(mdUsable)) out.push({ v: 'cliente:' + c.id, t: c.nombre + ' (cliente)' });
  if (['entidad-o-terceros', 'entidad-o-grupo'].includes(s.destinatario)) { for (const b of md().bus.filter(b => b.entidad === W.entidad && b.id !== W.bu)) out.push({ v: 'bu:' + b.id, t: b.nombre + ' (BU · interna)' }); for (const e of md().entidades.filter(e => e.id !== W.entidad)) out.push({ v: 'entidad:' + e.id, t: e.nombre + ' (empresa del grupo)' }); }
  return out;
}
function wDest() { if (!W.dest) return null; const [tipo, id] = W.dest.split(':'); return { tipo, id }; }
function wInstDelDest() {
  const d = wDest(); if (!d) return [];
  return md().instrumentos.filter(i => d.tipo === 'cliente' ? i.cliente === d.id : d.tipo === 'bu' ? i.interno : i.grupo);
}
function wInstMotivos(i) {
  const hoy = isoDay(0); const P = W.producto && W.producto !== 'NA' ? W.producto : null; const m = [];
  if (i.vigenciaHasta < hoy) m.push('vencido el ' + fmtD(i.vigenciaHasta));
  if (i.vigenciaDesde > hoy) m.push('vigente desde ' + fmtD(i.vigenciaDesde));
  if (!i.servicios.includes(W.servicio)) m.push('servicio no contratado');
  if (P && i.productos && !i.productos.includes(P)) m.push('producto no incluido');
  return m;
}
function wInstrumentos() { return wInstDelDest().filter(i => wInstMotivos(i).length === 0); }
function wOrigenes() {
  const d = wDest(); const m = medio(W.medio); if (!m) return [];
  const E = W.entidad; const out = []; const P = W.producto === 'NA' ? '' : W.producto;
  if (m.origen === 'lineup') for (const lu of S.ops.lineups.filter(l => l.terminal === E && l.estado !== 'Zarpó')) lu.cargas.forEach((c, i) => { if (d?.tipo === 'cliente' && c.cliente !== d.id) return; if (P && c.producto !== P) return; const os = ordenesDeOrigen('lineup', lu.id, i).filter(o => o.id !== W.edit); out.push({ v: 'lineup:' + lu.id + ':' + i, t: lu.buque + ' · ' + c.bl + ' · ' + fmtT(c.toneladas) + ' t · ETB ' + fmtDT(lu.etb) + (os.length ? ' · ya vinculada a ' + os.map(o => o.id).join(', ') : '') }); });
  if (m.origen === 'cupo') for (const cu of S.ops.cupos.filter(c => c.terminal === E && c.estado !== 'Cumplido')) { if (d?.tipo === 'cliente' && cu.cliente !== d.id) continue; if (P && cu.producto !== P) continue; const os = ordenesDeOrigen('cupo', cu.id).filter(o => o.id !== W.edit); out.push({ v: 'cupo:' + cu.id + ':', t: cu.id + ' · ' + fmtD(cu.fecha) + ' ' + cu.franja + ' · ' + cu.camiones + ' camiones · ' + fmtT(cu.toneladas) + ' t' + (os.length ? ' · ya vinculado a ' + os.map(o => o.id).join(', ') : '') }); }
  if (m.origen === 'tren') for (const tr of S.ops.trenes.filter(t => t.terminal === E)) { if (d?.tipo === 'cliente' && tr.cliente !== d.id) continue; if (P && tr.producto !== P) continue; const os = ordenesDeOrigen('tren', tr.id).filter(o => o.id !== W.edit); out.push({ v: 'tren:' + tr.id + ':', t: tr.id + ' · ' + fmtD(tr.fecha) + ' · ' + tr.formacion + ' · ' + fmtT(tr.toneladas) + ' t' + (os.length ? ' · ya vinculado a ' + os.map(o => o.id).join(', ') : '') }); }
  if (m.origen === 'solicitud') for (const so of S.ops.solicitudes) { if (d && !(so.solicitante.tipo === d.tipo && so.solicitante.id === d.id)) continue; const os = ordenesDeOrigen('solicitud', so.id).filter(o => o.id !== W.edit); out.push({ v: 'solicitud:' + so.id + ':', t: so.id + ' · ' + so.detalle + (os.length ? ' · ya vinculada a ' + os.map(o => o.id).join(', ') : '') }); }
  return out;
}
function wOrigenVinculadas() {
  if (!W.origen) return []; const [tipo, id, idx] = W.origen.split(':');
  return ordenesDeOrigen(tipo, id, idx === '' ? undefined : +idx).filter(o => o.id !== W.edit);
}
function wApplyOrigen() {
  if (!W.origen) return; const [tipo, id, idx] = W.origen.split(':');
  const vinc = wOrigenVinculadas();
  if (tipo === 'lineup') { const lu = byId(S.ops.lineups, id); const c = lu.cargas[+idx]; const rem = c.toneladas - sum(vinc, o => o.toneladas); W.toneladas = vinc.length && rem > 0 ? rem : c.toneladas; W.ventana = { inicio: lu.etb, fin: lu.etc }; }
  if (tipo === 'cupo') { const cu = byId(S.ops.cupos, id); const [a, b] = cu.franja.replace('–', '-').split('-'); W.toneladas = cu.toneladas; W.ventana = { inicio: new Date(cu.fecha + 'T' + a.trim() + ':00').toISOString(), fin: new Date(cu.fecha + 'T' + b.trim() + ':00').toISOString() }; }
  if (tipo === 'tren') { const tr = byId(S.ops.trenes, id); W.toneladas = tr.toneladas; W.ventana = { inicio: new Date(tr.fecha + 'T06:00:00').toISOString(), fin: new Date(tr.fecha + 'T22:00:00').toISOString() }; }
  if (tipo === 'solicitud') { const so = byId(S.ops.solicitudes, id); W.toneladas = so.toneladas || 0; W.ventana = { inicio: so.desde, fin: so.hasta }; }
}
function wSpec() {
  const d = wDest(); const [tipo, id, idx] = (W.origen || '::').split(':');
  return { id: W.edit || undefined, entidad: W.entidad, bu: W.bu === 'ENT' ? null : W.bu, medio: W.medio, servicio: W.servicio, destinatario: d, producto: W.producto && W.producto !== 'NA' ? W.producto : null, instrumento: W.instrumento || null,
    origen: tipo && tipo !== 'detalle' ? { tipo, id, cargaIdx: idx === '' ? undefined : +idx } : null, detalle: srv(W.servicio)?.detalle && W.det ? Object.assign({}, W.det, W.det.tipo === 'logistica' ? { km: kmEntre(W.det.origen, W.det.destino) } : {}) : null, toneladas: +W.toneladas || 0, ventana: W.ventana, notas: W.notas,
    habilitaciones: { nacionalizada: W.nacionalizada, nacRef: W.nacRef, nacTs: W.nacionalizada ? nowIso() : null, nacPor: W.nacionalizada ? userOf('COM') : '', msConfirmado: W.msConfirmado, msTs: W.msConfirmado ? nowIso() : null, msPor: W.msConfirmado ? userOf('COM') : '', msRef: W.msConfirmado ? (msEstado(W.producto === 'NA' ? null : W.producto).ms?.procedimiento || '') : '' } };
}
function wInstBlock(insts) {
  if (!W.producto || !W.dest) return '';
  const todos = wInstDelDest(); const d = wDest();
  const nuevoBtn = btn('Nuevo instrumento contractual', 'w-inst-nuevo', {}, insts.length ? 'sm' : 'sm pri');
  if (insts.length) return '<div class="btn-row" style="margin-top:12px"><span class="small muted">' + insts.length + ' instrumento' + (insts.length > 1 ? 's' : '') + ' vigente' + (insts.length > 1 ? 's' : '') + ' para este destinatario, servicio y producto.</span>' + nuevoBtn + (todos.length ? btn('Adenda a un instrumento existente', 'w-inst-adenda', { id: insts[0].id }, 'sm ghost') : '') + '</div>';
  const rows = todos.map(i => ({ i, m: wInstMotivos(i) }));
  return '<div class="card" style="margin-top:12px;border-color:var(--warn)"><div class="card-h"><h3>Ningún instrumento contractual cubre esta operación ' + sup('S9') + '</h3></div>' +
    (rows.length ? '<p class="small muted" style="margin-bottom:8px">Instrumentos de ' + esc(destinatarioNombre(d)) + ' y por qué no aplican:</p>' + table([{ h: 'Instrumento', f: r => '<b class="mono">' + esc(r.i.id) + '</b><br><span class="xs muted">' + esc(r.i.tipo) + (r.i.padre ? ' de ' + esc(r.i.padre) : '') + '</span>' }, { h: 'Vigencia', f: r => fmtD(r.i.vigenciaDesde) + ' → ' + fmtD(r.i.vigenciaHasta) }, { h: 'Servicios', f: r => r.i.servicios.map(x => srv(x)?.nombre).join(', ') }, { h: 'Productos', f: r => r.i.productos ? r.i.productos.map(p => prod(p)?.nombre).join(', ') : 'Todos' }, { h: 'No aplica porque', f: r => r.m.map(x => chip(x, 'crit')).join(' ') }, { h: '', f: r => btn('Adenda', 'w-inst-adenda', { id: r.i.id }, 'sm pri') }], rows, { cls: 'compact' })
      : '<p class="small muted">' + esc(destinatarioNombre(d)) + ' no tiene instrumentos contractuales registrados.</p>') +
    '<div class="btn-row" style="margin-top:10px">' + nuevoBtn + '<span class="small muted">La adenda hereda tarifas y condiciones del instrumento padre y agrega servicio, producto y/o nueva vigencia. El instrumento creado queda seleccionado en la orden y registrado en el maestro de Comercial.</span></div></div>';
}
function recursosSeleccionados(R) {
  const out = [];
  if (R.muelle) out.push({ rid: R.muelle, n: 1 }); for (const e of (R.equipos || [])) out.push({ rid: e, n: 1 }); if (R.deposito) out.push({ rid: R.deposito, n: 1 }); if (R.balanza) out.push({ rid: R.balanza, n: 1 });
  for (const [id, n] of Object.entries(R.logistica || {})) if (n > 0) out.push({ rid: id, n }); for (const [id, n] of Object.entries(R.manos || {})) if (n > 0) out.push({ rid: id, n }); for (const [id, n] of Object.entries(R.funciones || {})) if (n > 0) out.push({ rid: id, n });
  return out;
}
function noDisponiblesCard(o, R) {
  const rows = recursosSeleccionados(R).map(x => ({ ...x, ch: chequearRecurso(x.rid, x.n, o), d: duenoRecurso(x.rid) })).filter(x => x.ch.errores.length);
  const srs = solicitudesDe(o);
  if (!rows.length && !srs.length) return '';
  const estadoChip = (sr) => chip(sr.id + ' · ' + sr.estado, sr.estado === 'Habilitado' ? 'ok' : sr.estado === 'Rechazado' ? 'crit' : 'warn', sr.respuesta ? sr.respuesta.detalle + ' ' + (sr.respuesta.cambios || []).join(' · ') : 'Pendiente de respuesta de ' + (sr.destinatario?.nombre || ''));
  return '<div class="card tight" style="border-color:var(--warn)"><div class="card-h"><h3>Recursos no disponibles · solicitud de habilitación a la BU dueña ' + sup('S13') + '</h3></div>' +
    (rows.length ? table([{ h: 'Recurso', f: x => '<b>' + esc(recNombre(x.rid)) + '</b>' + (x.n > 1 ? ' <span class="tag">×' + x.n + '</span>' : '') }, { h: 'Motivo', f: x => x.ch.errores.map(e => '<span class="small">' + esc(e.replace(recNombre(x.rid) + ': ', '')) + '</span>').join('<br>') }, { h: 'BU / área dueña', f: x => x.d ? '<b>' + esc(x.d.nombre) + '</b>' + (x.d.detalle ? '<br><span class="xs muted">' + esc(x.d.detalle) + '</span>' : '') : '—' }, { h: 'Acción', f: x => { const sr = srs.find(s => s.rid === x.rid && s.estado !== 'Rechazado'); const confl = conflictosRecurso(x.rid, o); const soloConflicto = confl.length && x.ch.errores.every(e => e.includes('reservado por')); const am = arriboModificable(o);
      if (sr) return estadoChip(sr);
      if (S.ctx.rol !== 'PLAN') return '<span class="dim">—</span>';
      const fecha = confl.length ? (am.ok ? btn('Cambiar fecha de arribo', 'arribo-fecha', { id: o.id, rid: x.rid }, 'sm' + (soloConflicto ? ' pri' : '')) : '<span class="xs muted">fecha no modificable: ' + esc(am.motivo) + '</span>') : '';
      return '<div class="btn-row" style="gap:4px">' + fecha + (soloConflicto ? '<span class="xs muted">o elegí otro recurso</span>' : btn('Solicitar habilitación a ' + (x.d?.nombre || 'la BU'), 'sr-crear', { id: o.id, rid: x.rid, n: x.n }, 'sm' + (confl.length ? '' : ' pri'))) + '</div>'; } }], rows, { cls: 'compact' }) : '') +
    (srs.length ? '<p class="small muted" style="margin:8px 0 4px"><b>Solicitudes de esta orden:</b> ' + srs.map(sr => estadoChip(sr) + ' <span class="xs">' + esc(recNombre(sr.rid)) + ' → ' + esc(sr.destinatario?.nombre || '') + ' · ' + fmtDT(sr.creado) + '</span>').join(' &nbsp; ') + '</p>' : '') +
    '<p class="help" style="margin-top:6px">La solicitud lleva la información de la operación (orden, servicio, cliente, producto, ventana, toneladas, motivo) para que la BU dueña habilite el recurso. La BU responde desde Recursos › Solicitudes de habilitación; al habilitar, la validación se actualiza aquí. Si el recurso está ocupado por otro operativo, la alternativa es cambiar la fecha de arribo del servicio ' + sup('S15') + '.</p></div>';
}
function viewNueva() {
  if (!W) wInit(null);
  if (S.ctx.rol !== 'COM') return pageH('Nueva orden de servicio') + alertBox('warn', 'La creación de órdenes corresponde a <b>Comercial / Backoffice</b>. Cambiá el rol activo en la barra superior.');
  const srvs = wServicios(); const s = srv(W.servicio);
  const dests = s ? wDestOptions(s) : []; const insts = wInstrumentos(); const origs = wOrigenes();
  const step = W_ORDER.findIndex(k => !W[k]); const cur = step < 0 ? 8 : step;
  const labels = ['Entidad', 'Servicio', 'Ámbito / BU', 'Medio', 'Cliente / destinatario', 'Producto', 'Instrumento contractual', s?.detalle ? 'Detalle del servicio' : 'Origen operativo', 'Habilitaciones'];
  const steps = '<div class="steps">' + labels.map((l, i) => '<span class="' + (i < cur ? 'done' : i === cur ? 'cur' : '') + '">' + l + '</span>').join('') + '</div>';
  const fsel = (key, label, options, placeholder, disabled) => field(label, sel('w-' + key, [{ v: '', t: placeholder || '— seleccionar —' }, ...options], W[key], 'data-w="' + key + '"' + (disabled ? ' disabled' : '')));
  const buField = !s ? fsel('bu', 'Ámbito / BU prestadora', [], null, true)
    : s.nivel === 'entidad' ? field('Ámbito / BU prestadora ' + sup('S8'), sel('w-bu', [{ v: 'ENT', t: 'Entidad ' + entName(W.entidad) + ' — el servicio no impacta a una BU específica' }], 'ENT', 'data-w="bu" disabled'))
      : fsel('bu', 'BU prestadora ' + sup('S8'), wBus(s).map(b => ({ v: b.id, t: b.nombre + (b.sup ? ' (supuesto)' : '') })), null, false);
  let html = pageH(W.edit ? 'Editar borrador ' + esc(W.edit) : 'Nueva orden de servicio', 'Selección secuencial: <b>Entidad → Servicio</b> y, según el servicio, el resto de los datos. Cada elección filtra y habilita la siguiente; al modificar un dato previo se revisan las selecciones dependientes.') + steps +
    '<div class="card"><div class="form-grid">' +
    fsel('entidad', 'Entidad', md().entidades.map(e => ({ v: e.id, t: e.nombre }))) +
    fsel('servicio', 'Servicio', srvs.map(x => ({ v: x.id, t: x.nombre + (x.nivel === 'entidad' ? ' · entidad' : ' · ' + wBus(x).map(b => b.nombre).join('/')) })), null, !W.entidad) +
    buField +
    fsel('medio', s?.detalle ? 'Medio (interna / externa) ' + sup('S21') : 'Medio', (s ? s.medios : []).map(m => ({ v: m, t: medio(m)?.nombre })), null, !W.bu) +
    fsel('dest', s?.detalle ? (W.medio === 'INT' ? 'Cliente (BU interna / empresa del grupo)' : W.medio === 'EXT' ? 'Cliente (nómina de clientes)' : 'Cliente') : 'Cliente / destinatario', dests, null, !W.medio) +
    fsel('producto', 'Producto', [...(s && s.requiereProducto === false ? [{ v: 'NA', t: 'No aplica' }] : []), ...md().productos.filter(mdUsable).map(p => ({ v: p.id, t: p.nombre + (p.requiereMS ? (msEstado(p.id).vigente ? '' : ' ⚠ MS no vigente') : '') }))], null, !W.dest) +
    fsel('instrumento', 'Instrumento contractual', insts.map(i => ({ v: i.id, t: i.id + ' · ' + i.tipo + (i.sup ? ' (supuesto)' : '') })), W.producto && !insts.length ? 'sin instrumento vigente para el destinatario y servicio' : null, !W.producto) +
    (s?.detalle ? '' : fsel('origen', (medio(W.medio)?.origenNombre || 'Origen operativo'), origs, W.instrumento && !origs.length ? 'sin registros para cliente y producto' : null, !W.instrumento)) +
    '</div>' + (s ? '<p class="help" style="margin-top:10px">' + esc(s.nombre) + ': ' + (s.nivel === 'entidad' ? 'servicio de nivel entidad; las BU intervienen como ejecutoras de sus componentes (' + s.componentes.map(compName).join(' + ') + ').' : 'servicio de nivel BU, prestado por ' + wBus(s).map(b => b.nombre).join(' / ') + '.') + ' Medios: ' + s.medios.map(m => medio(m)?.nombre).join(', ') + '. Cierre en ' + rolName(s.cierre) + '.</p>' : '') + '</div>' + wInstBlock(insts);
  if (W.origen) {
    const ins = instr(W.instrumento); const sv = s; const dd = wDest(); const vinc = wOrigenVinculadas();
    const msE = msEstado(W.producto === 'NA' ? null : W.producto);
    const aplicaNac = !esMedioSinOrigen(W.medio) && (sv?.componentes || []).some(c => c === 'DES' || c === 'DEP') && dd?.tipo === 'cliente';
    const specTmp = wSpec(); const oTmp = { origen: specTmp.origen }; const vo = ventanaOrigenDe(oTmp); const tOrig = toneladasOrigenDe(oTmp); const rem = tOrig != null ? tOrig - sum(vinc, o => o.toneladas) : null;
    const tonWarn = tOrig != null && +W.toneladas > tOrig ? ' ' + chip('supera las ' + fmtT(tOrig) + ' t del origen', 'warn', 'Se admite con advertencia (S19)') : (rem != null && vinc.length && +W.toneladas > rem ? ' ' + chip('supera el remanente de ' + fmtT(rem) + ' t', 'warn') : '');
    const venWarn = W.ventana && W.ventana.fin <= W.ventana.inicio ? ' ' + chip('el fin debe ser posterior al inicio', 'crit') : (vo && W.ventana && (W.ventana.inicio < vo.inicio || W.ventana.fin > vo.fin) ? ' ' + chip('fuera de la ventana del origen', 'warn', 'Se admite: el origen es una referencia') : '');
    const datosCard = '<div class="card"><div class="card-h"><h2>Datos del servicio ' + sup('S19') + '</h2><span class="small muted">toneladas y fechas las define Comercial; el origen y el contrato las proponen</span></div>' +
      (vinc.length ? alertBox('warn', '<div><b>Origen ya vinculado a ' + vinc.map(o => osLink(o.id) + ' (' + fmtT(o.toneladas) + ' t · ' + estadoName(o.estado) + ')').join(', ') + '.</b> ' + sup('A2') + ' Esta orden se registra como una orden adicional sobre la misma carga; verificá las toneladas (se proponen por el remanente).</div>') : '') +
      kv([['Origen', esc(origs.find(x => x.v === W.origen)?.t || '')], ['Calidad', esc(calidadDeOrigen(specTmp.origen) || 'No informada')],
        ['Toneladas a operar', '<input type="number" min="0" step="10" data-w="toneladas" value="' + (W.toneladas || 0) + '" style="width:120px"> t' + tonWarn + (tOrig != null ? '<br><span class="xs muted">origen: ' + fmtT(tOrig) + ' t' + (vinc.length ? ' · remanente ' + fmtT(Math.max(0, rem)) + ' t' : '') + ' — no siempre se opera el total</span>' : esMedioSinOrigen(W.medio) ? ' <span class="xs muted">(opcional)</span>' : '')],
        ['Inicio del servicio', '<input type="datetime-local" data-w="ventanaInicio" value="' + (W.ventana ? toLocalInput(W.ventana.inicio) : '') + '">' + (vo ? '<br><span class="xs muted">' + esc(vo.txt) + ': ' + fmtDT(vo.inicio) + '</span>' : '')],
        ['Fin del servicio', '<input type="datetime-local" data-w="ventanaFin" value="' + (W.ventana ? toLocalInput(W.ventana.fin) : '') + '">' + venWarn + (vo ? '<br><span class="xs muted">' + esc(vo.txt) + ': ' + fmtDT(vo.fin) + ' · con estas fechas se valida la disponibilidad de todos los recursos</span>' : '')],
        ['Relación', chip(relacionDe(dd, W.entidad), 'acc') + ' <span class="xs muted">' + esc(byId(md().relaciones, relacionDe(dd, W.entidad))?.imputacion) + '</span>'],
        ['Tarifas aplicables', ins ? Object.entries(ins.tarifas).filter(([k]) => (sv?.componentes || []).includes(k)).map(([k, v]) => compName(k) + ' ' + fmtN(v, 2) + ' ' + ins.moneda + (k === 'DEP' ? '/t/día' : k === 'SRV' ? '/h' : '/t')).join(' · ') || '<span class="dim">sin tarifas para los componentes</span>' : '—'],
        ['Condiciones', ins?.condiciones?.ritmoComprometido ? 'Ritmo comprometido ' + fmtT(ins.condiciones.ritmoComprometido) + ' t/día · franquicia ' + ins.condiciones.franquiciaDias + ' días' : esc(ins?.condiciones?.base || '—')]]) +
      '<div style="margin-top:10px">' + field('Notas', '<textarea data-w="notas">' + esc(W.notas) + '</textarea>') + '</div></div>';
    html += '<div class="grid g2" style="margin-top:14px">' + (s.detalle ? wDetalleCard(s) : datosCard) +
      '<div class="card"><div class="card-h"><h2>Habilitaciones ' + sup('S3') + '</h2></div>' +
      (aplicaNac ? '<label class="field chk"><input type="checkbox" data-w="nacionalizada"' + (W.nacionalizada ? ' checked' : '') + '><span>La mercadería está <b>nacionalizada</b></span></label>' + (W.nacionalizada ? field('Referencia (despacho de importación)', '<input data-w="nacRef" value="' + esc(W.nacRef) + '" placeholder="Despacho 26001IC04…">') : alertBox('warn', 'No nacionalizada: se podrá planificar solo con depósitos y balanzas habilitados para fiscal; el inicio del operativo quedará bloqueado hasta regularizar.')) : '<p class="muted small">La nacionalización no aplica a este servicio / destinatario.</p>') +
      '<div class="divider" style="margin:10px 0"></div>' +
      (msE.requiere ? kv([['Método seguro (master data)', msE.ms ? '<span class="mono">' + esc(msE.ms.id) + '</span> · ' + esc(msE.ms.procedimiento) + ' <span class="xs muted">asignado ' + (msE.origen === 'producto' ? 'al producto' : 'a la familia') + '</span>' : '<span class="crit">sin método seguro definido para el producto ni su familia</span>'], ['Vigencia', msE.ms ? (msE.vigente ? chip('Vigente hasta ' + fmtD(msE.vence), 'ok') : chip('Vencido el ' + fmtD(msE.vence), 'crit')) : '—'], ['Habilitación', msE.vigente ? chip('Habilitado automáticamente', 'ok') : chip('No habilitado', 'crit')]]) +
        (msE.vigente ? '<p class="help" style="margin-top:6px">La habilitación proviene de la master data; no requiere confirmación manual.</p>' : alertBox('crit', '<div><b>Método seguro vencido o no definido:</b> la orden podrá enviarse a planificación, pero no iniciar hasta que Seguridad renueve o asigne el método seguro en Datos maestros.</div>')) : '<p class="muted small">El producto no requiere método seguro (definido en la familia / producto de la master data).</p>') +
      '</div></div>' +
      '<div class="btn-row" style="margin-top:14px">' + btn('Guardar borrador', 'w-guardar', {}, '') + btn('Crear y enviar a planificación', 'w-enviar', {}, 'pri') + btn('Cancelar', 'w-cancelar', {}, 'ghost') + '<span class="small muted">Las advertencias no impiden enviar a planificación; sí impiden iniciar el operativo.</span></div>';
  } else {
    html += '<div class="btn-row" style="margin-top:14px">' + btn('Cancelar', 'w-cancelar', {}, 'ghost') + '</div>';
  }
  return html;
}

/* ---------- Detalle del servicio: Rental y Logística (SUPUESTO S21) ---------- */
function wDetalleCard(s) {
  const d = W.det || (W.det = wDetDefault(s.detalle, W.entidad)); const p = md().parametros;
  const fechas = '<div class="form-grid">' + field('Fecha desde', '<input type="datetime-local" data-w="ventanaInicio" value="' + (W.ventana ? toLocalInput(W.ventana.inicio) : '') + '">') + field('Fecha hasta', '<input type="datetime-local" data-w="ventanaFin" value="' + (W.ventana ? toLocalInput(W.ventana.fin) : '') + '">') + '</div>' +
    (W.ventana && W.ventana.fin <= W.ventana.inicio ? alertBox('crit', 'La fecha hasta debe ser posterior a la fecha desde.') : '<p class="xs muted" style="margin-top:4px">Con estas fechas se valida la disponibilidad de las maquinarias / camiones y se reservan.</p>');
  const horas = W.ventana ? Math.max(0, hoursBetween(W.ventana.inicio, W.ventana.fin)) : 0;
  if (s.detalle === 'rental') {
    const maqs = maquinariasRental(W.entidad); const sel0 = Object.entries(d.maquinarias || {}).filter(([, n]) => n > 0);
    const costoMaq = sum(sel0, ([id, n]) => (recurso(id)?.costoHora || 0) * n * horas); const km = (+d.kmEntrega || 0) + (+d.kmDevolucion || 0);
    return '<div class="card"><div class="card-h"><h2>Detalle del servicio · Alquiler de maquinaria ' + sup('S21') + '</h2><span class="small muted">una o más maquinarias del inventario de Rental</span></div>' +
      '<h3 style="margin:6px 0">Maquinarias</h3><div class="stack" style="gap:6px;margin-bottom:10px">' + maqs.map(m => { const n = d.maquinarias?.[m.id] || 0; return '<div class="small" style="display:flex;align-items:center;gap:8px"><label class="field chk" style="margin:0"><input type="checkbox" data-det="maq:' + m.id + '"' + (n > 0 ? ' checked' : '') + '><span><b>' + esc(m.nombre) + '</b></span></label>' + (n > 0 ? '<input type="number" min="1" max="' + m.cantidad + '" data-det="maqn:' + m.id + '" value="' + n + '" style="width:64px">' : '') + '<span class="xs muted">' + m.cantidad + ' disp. · ' + fmtUSD(m.costoHora) + '/h</span></div>'; }).join('') + '</div>' +
      fechas +
      '<div class="form-grid" style="margin-top:8px">' + field('Km de entrega', '<input type="number" min="0" step="1" data-det="kmEntrega" value="' + (d.kmEntrega || 0) + '">') + field('Km de devolución', '<input type="number" min="0" step="1" data-det="kmDevolucion" value="' + (d.kmDevolucion || 0) + '">') + '</div>' +
      '<div class="grid g3" style="gap:8px;margin-top:10px">' + [['Duración', fmtN(horas / 24, 1) + ' días', fmtN(horas, 0) + ' h'], ['Maquinarias', sel0.length ? sel0.map(([id, n]) => n + ' × ' + recNombre(id)).join(', ') : '—', sel0.length ? '' : 'elegí al menos una'], ['Costo estimado', fmtUSD(costoMaq + km * (p.costoKmTraslado || 0)), 'maquinarias ' + fmtUSD(costoMaq) + ' · traslado ' + km + ' km × ' + 'USD ' + fmtN(p.costoKmTraslado, 2) + '/km']].map(([l, v, x]) => '<div class="kpi tight"><span class="v" style="font-size:15px">' + v + '</span><span class="l">' + l + '</span><span class="d">' + esc(x) + '</span></div>').join('') + '</div>' +
      '<div style="margin-top:10px">' + field('Notas', '<textarea data-w="notas">' + esc(W.notas) + '</textarea>') + '</div></div>';
  }
  /* logística */
  const cams = camionesDe(W.entidad); const lug = lugares(); const grp = (label, list) => '<optgroup label="' + esc(label) + '">' + list.map(l => '<option value="' + esc(l.id) + '"' + '>' + esc(l.nombre) + '</option>').join('') + '</optgroup>';
  const selLugar = (k, val) => '<select data-det="' + k + '"><option value="">— elegir —</option>' + grp('Plantas y puertos del grupo', lug.filter(l => l.grupo === 'Plantas y puertos del grupo')) + grp('Lugares de clientes', lug.filter(l => l.grupo === 'Lugares de clientes')) + '</select>';
  const km = kmEntre(d.origen, d.destino); const cam = recurso(d.camion); const cap = cam?.capacidadT || 30; const t = +W.toneladas || 0; const viajes = t ? Math.ceil(t / cap) : 0; const kmTotal = km != null ? km * 2 * Math.max(1, viajes) : null;
  const costoCam = cam ? cam.costoHora * (+d.cantidad || 1) * horas : 0;
  const fix = (html, val) => html.replace('<option value="' + esc(val) + '"', '<option value="' + esc(val) + '" selected');
  return '<div class="card"><div class="card-h"><h2>Detalle del servicio · Servicios logísticos ' + sup('S21') + '</h2><span class="small muted">camión, origen / destino, fechas y km automáticos</span></div>' +
    '<div class="form-grid">' + field('Camión', sel('det-camion', cams.map(c => ({ v: c.id, t: c.nombre + ' · ' + c.cantidad + ' disp. · ' + fmtUSD(c.costoHora) + '/h' + (c.tercero ? ' · tercero' : '') })), d.camion, 'data-det="camion"')) + field('Cantidad de camiones', '<input type="number" min="1" max="' + (cam?.cantidad || 99) + '" data-det="cantidad" value="' + (d.cantidad || 1) + '">') +
    field('Origen', fix(selLugar('origen', d.origen), d.origen)) + field('Destino', fix(selLugar('destino', d.destino), d.destino)) +
    field('Toneladas a transportar', '<input type="number" min="0" step="10" data-w="toneladas" value="' + (W.toneladas || 0) + '">') + field('Km del tramo (automático)', '<input value="' + (km != null ? km + ' km' : '—') + '" disabled title="Distancia geodésica entre los lugares × factor de ruta ' + (p.factorRuta || 1.3) + '">') + '</div>' +
    (d.origen && d.destino && d.origen === d.destino ? alertBox('crit', 'Origen y destino deben ser distintos.') : '') +
    fechas +
    '<div class="grid g3" style="gap:8px;margin-top:10px">' + [['Viajes estimados', viajes || '—', t ? fmtT(t) + ' t / ' + cap + ' t por camión' : 'indicá las toneladas'], ['Km totales', kmTotal != null ? fmtT(kmTotal) + ' km' : '—', km != null ? km + ' km × 2 × ' + Math.max(1, viajes) + ' viajes' : 'elegí origen y destino'], ['Costo estimado', fmtUSD(costoCam + (kmTotal || 0) * (p.costoKmCamion || 0)), 'camiones ' + fmtUSD(costoCam) + ' · km ' + fmtUSD((kmTotal || 0) * (p.costoKmCamion || 0))]].map(([l, v, x]) => '<div class="kpi tight"><span class="v" style="font-size:15px">' + v + '</span><span class="l">' + l + '</span><span class="d">' + esc(x) + '</span></div>').join('') + '</div>' +
    '<div style="margin-top:10px">' + field('Notas', '<textarea data-w="notas">' + esc(W.notas) + '</textarea>') + '</div></div>';
}
function wDetalleErrores() {
  const s = srv(W.servicio); const d = W.det; const e = []; if (!s?.detalle) return e; if (!d) return ['Completá el detalle del servicio'];
  if (s.detalle === 'rental') { if (!Object.values(d.maquinarias || {}).some(n => n > 0)) e.push('Elegí al menos una maquinaria'); if (+d.kmEntrega < 0 || +d.kmDevolucion < 0) e.push('Los km no pueden ser negativos'); }
  if (s.detalle === 'logistica') { if (!d.camion) e.push('Elegí el camión'); if (!(+d.cantidad >= 1)) e.push('Indicá la cantidad de camiones'); if (!d.origen || !d.destino) e.push('Indicá origen y destino'); else if (d.origen === d.destino) e.push('Origen y destino deben ser distintos'); if (!(+W.toneladas > 0)) e.push('Indicá las toneladas a transportar'); }
  return e;
}

/* ---------- Recursos ---------- */
function viewRecursos() {
  const E = S.ctx.entidad; const tab = S.ctx.recTab || 'equipos';
  const tabs = [['muelles', 'Muelles'], ['equipos', 'Equipos'], ['depositos', 'Depósitos'], ['balanzas', 'Balanzas'], ['logistica', 'Logística'], ['funciones', 'Personal propio'], ['manos', 'Manos']];
  const inE = x => E === 'ALL' || !x.entidad || x.entidad === E;
  const days = Array.from({ length: 8 }, (_, i) => isoDay(i));
  const tl = (list) => '<div class="tl"><div class="h">Recurso</div>' + days.map((d, i) => '<div class="h ' + (i === 0 ? 'today' : '') + '">' + fmtD(d).slice(0, 5) + (i === 0 ? ' · hoy' : '') + '</div>').join('') +
    list.map(r => '<div class="r">' + esc(r.nombre) + '<small>' + esc(r.id) + (r.cantidad ? ' · ' + r.cantidad + ' unidades' : r.dotacion ? ' · dotación ' + r.dotacion : r.capacidadTh ? ' · ' + r.capacidadTh + ' t/h' : '') + (r.estado && r.estado !== 'Operativo' ? ' · ' + esc(r.estado) : '') + '</small></div>' +
      days.map(d => { const d0 = d + 'T00:00:00', d1 = d + 'T23:59:59'; const a = new Date(d0).toISOString(), b = new Date(d1).toISOString();
        const rvs = reservasRecurso(r.id, null).filter(rv => overlap(a, b, rv.desde, rv.hasta));
        const mant = r.estado === 'En mantenimiento' && (!r.mantHasta || r.mantHasta >= d);
        return '<div class="c">' + (mant ? '<span class="b mant">mantenimiento</span>' : '') + rvs.map(rv => '<a href="#" class="b ' + rv.o.estado + '" data-action="open" data-id="' + rv.o.id + '" title="' + esc(rv.o.id + ' · ' + srv(rv.o.servicio)?.nombre + ' · ' + ventanaTxt({ inicio: rv.desde, fin: rv.hasta })) + '">' + rv.o.id.slice(-4) + (rv.cantidad > 1 ? ' ×' + rv.cantidad : '') + '</a>').join('') + '</div>'; }).join('')).join('') + '</div>';
  let body = '';
  if (tab === 'depositos') {
    body = table([{ h: 'Ubicación', f: d => '<b>' + esc(d.nombre) + '</b> <span class="xs muted">' + esc(d.tipo) + ' · ' + esc(entName(d.entidad)) + '</span>' + (d.fiscal ? ' ' + chip('Fiscal', 'info') : '') }, { h: 'Compatibilidad', f: d => ((d.familias || []).map(famName).join(', ') || '<span class="dim">sin restricción declarada</span>') + (d.restricciones ? '<br><span class="xs muted">' + esc(d.restricciones) + '</span>' : '') }, { h: 'Ocupación', f: d => { const comp = sum(reservasRecurso(d.id, null), rv => Math.max(0, rv.o.toneladas - (rv.o.ejecucion?.acumulado || 0))); return '<div class="meter">' + bar((d.ocupadoT + comp) / d.capacidadT, (d.ocupadoT + comp) / d.capacidadT > 0.9 ? 'warn' : '') + '<span class="num xs">' + fmtT(d.ocupadoT) + ' ocupado + ' + fmtT(comp) + ' comprometido / ' + fmtT(d.capacidadT) + ' t</span></div>'; } }, { h: 'Órdenes vinculadas', f: d => reservasRecurso(d.id, null).map(rv => osLink(rv.o.id)).join(' ') || '<span class="dim">—</span>' }], md().depositos.filter(inE));
  } else if (tab === 'balanzas') {
    body = table([{ h: 'Balanza', f: b => '<b>' + esc(b.nombre) + '</b> <span class="xs muted">' + esc(entName(b.entidad)) + '</span>' }, { h: 'Fiscal', f: b => b.fiscal ? chip('Sí', 'info') : chip('No', '') }, { h: 'Capacidad', cls: 'num', f: b => b.capacidadT + ' t' }, { h: 'Calibración hasta', f: b => fmtD(b.calibracionHasta) }, { h: 'Estado', f: b => chip(b.estado, b.estado === 'Operativo' ? 'ok' : 'warn') }, { h: 'Órdenes que la usan', f: b => reservasRecurso(b.id, null).map(rv => osLink(rv.o.id)).join(' ') || '<span class="dim">—</span>' }], md().balanzas.filter(inE));
  } else if (tab === 'manos') {
    body = table([{ h: 'Composición', f: m => '<b>' + esc(m.nombre) + '</b>' }, { h: 'Roles', f: m => Object.entries(m.roles || {}).map(([r, q]) => q + ' ' + r.toLowerCase()).join(', ') }, { h: 'Personas', cls: 'num', f: m => sum(Object.values(m.roles)) }, { h: 'Costo / turno', cls: 'num', f: m => fmtUSD(m.costoTurno) }, { h: 'Proveedor', f: m => esc(provName(m.proveedor)) }, { h: 'Productos', f: m => m.familias.map(famName).join(', ') }, { h: 'Reservas', f: m => reservasRecurso(m.id, null).map(rv => osLink(rv.o.id) + ' ×' + rv.cantidad).join(' ') || '<span class="dim">—</span>' }], md().manos) + '<p class="help" style="margin-top:8px">El personal externo se planifica por recurso (composición y cantidad por turno), no por nombre; la disponibilidad la garantiza el proveedor.</p>';
  } else {
    const list = md()[tab].filter(inE);
    body = '<div class="tlw">' + tl(list) + '</div>' + (tab === 'equipos' ? '<div class="btn-row" style="margin-top:10px"><span class="small muted">Simular disponibilidad ' + sup('S4') + ':</span>' + list.map(e => btn(e.estado === 'Operativo' ? 'Poner ' + e.id + ' en mantenimiento' : 'Reactivar ' + e.id, 'toggle-equipo', { id: e.id }, 'sm')).join('') + '</div>' : '');
  }
  const srs = (S.solicitudesRecurso || []).filter(x => E === 'ALL' || orden(x.orden)?.entidad === E);
  const srCard = '<div class="card" style="margin-bottom:14px"><div class="card-h"><h2>Solicitudes de habilitación de recursos ' + sup('S13') + '</h2><span class="small muted">' + srs.filter(x => x.estado === 'Pendiente').length + ' pendientes · la BU dueña responde aquí (simulado en la maqueta)</span></div>' +
    table([{ h: 'Solicitud', f: x => '<span class="mono">' + esc(x.id) + '</span><br><span class="xs muted">' + fmtDT(x.creado) + ' · ' + esc(x.por) + '</span>' }, { h: 'Orden · operación', f: x => osLink(x.orden) + '<br><span class="xs muted">' + esc(x.operacion.servicio) + ' · ' + esc(x.operacion.destinatario) + ' · ' + esc(x.operacion.producto) + (x.operacion.calidad ? ' (' + esc(x.operacion.calidad) + ')' : '') + ' · ' + fmtT(x.operacion.toneladas) + ' t · ' + ventanaTxt(x.operacion.ventana) + (x.operacion.origen ? ' · ' + esc(x.operacion.origen) : '') + '</span>' }, { h: 'Recurso', f: x => '<b>' + esc(recNombre(x.rid)) + '</b>' + (x.cantidad > 1 ? ' <span class="tag">×' + x.cantidad + '</span>' : '') + '<br><span class="xs muted">' + x.motivos.map(esc).join(' · ') + '</span>' }, { h: 'BU / área dueña', f: x => '<b>' + esc(x.destinatario?.nombre || '') + '</b>' + (x.destinatario?.detalle ? '<br><span class="xs muted">' + esc(x.destinatario.detalle) + '</span>' : '') }, { h: 'Estado', f: x => chip(x.estado, x.estado === 'Habilitado' ? 'ok' : x.estado === 'Rechazado' ? 'crit' : 'warn') + (x.respuesta ? '<br><span class="xs muted">' + fmtDT(x.respuesta.ts) + ' · ' + esc(x.respuesta.por) + (x.respuesta.detalle ? ' · ' + esc(x.respuesta.detalle) : '') + (x.respuesta.cambios?.length ? '<br>' + x.respuesta.cambios.map(esc).join(' · ') : '') + '</span>' : '') }, { h: '', f: x => x.estado === 'Pendiente' ? btn('Habilitar', 'sr-responder', { id: x.id, dec: 'Habilitado' }, 'sm pri') + ' ' + btn('Rechazar', 'sr-responder', { id: x.id, dec: 'Rechazado' }, 'sm') : '' }], srs, { cls: 'compact', empty: 'Sin solicitudes de habilitación' }) + '</div>';
  return pageH('Recursos', 'Disponibilidad, reservas y asignaciones de los próximos 8 días. Las reservas provienen de órdenes planificadas y en ejecución; el estado del recurso, de su maestro ' + sup('S4') + '.') + srCard +
    '<div class="tabs">' + tabs.map(([id, n]) => '<button class="' + (tab === id ? 'on' : '') + '" data-action="rectab" data-tab="' + id + '">' + n + '</button>').join('') + '</div>' + body +
    '<p class="help" style="margin-top:8px">Colores: <span class="b EJEC" style="display:inline-block;padding:0 6px;border-radius:3px;background:var(--accent-soft);color:var(--accent)">en ejecución</span> <span style="display:inline-block;padding:0 6px;border-radius:3px;background:var(--violet-soft);color:var(--violet)">planificada</span> <span style="display:inline-block;padding:0 6px;border-radius:3px;background:var(--warn-soft);color:var(--warn)">mantenimiento</span></p>';
}

/* ---------- Depósito ---------- */
function viewDeposito() {
  const os = ordersCtx(); const E = S.ctx.entidad;
  const enCurso = os.filter(o => o.estado === 'EJEC' && usaDeposito(o));
  const pend = os.filter(o => o.estado === 'PEND_CIERRE');
  return pageH('Depósito', 'Ingresos en curso, progreso y cierre. Depósito ve el avance mientras Operaciones ejecuta, sin esperar el traspaso formal.') +
    '<div class="stack">' +
    '<div class="card"><div class="card-h"><h2>Ingresos en curso</h2><span class="small muted">' + enCurso.length + ' operativos</span></div>' +
    table([{ h: 'Orden', f: o => osLink(o.id) }, { h: 'Cliente · producto', f: o => esc(destinatarioNombre(o.destinatario)) + '<br><span class="xs muted">' + esc(prod(o.producto)?.nombre) + '</span>' }, { h: 'Destino', f: o => esc(recNombre(o.plan?.recursos?.deposito)) }, { h: 'Progreso', f: o => '<div class="meter">' + bar(o.ejecucion.acumulado / o.toneladas) + '<span class="num">' + fmtT(o.ejecucion.acumulado) + ' / ' + fmtT(o.toneladas) + ' t</span></div>' }, { h: 'Ritmo neto', cls: 'num', f: o => fmtN(metricasReal(o).ritmoNeto, 0) + ' t/h' }, { h: 'Tickets', cls: 'num', f: o => o.ejecucion.tickets.length }, { h: 'Último ingreso', f: o => '<span class="mono">' + fmtDT(ingresosDeposito(o).ultimo) + '</span>' }], enCurso, { rowAttr: o => 'class="click" data-action="open" data-id="' + o.id + '"', empty: 'No hay operativos con ingreso a depósito en ejecución' }) + '</div>' +
    '<div class="card"><div class="card-h"><h2>Pendientes de cierre</h2></div>' +
    table([{ h: 'Orden', f: o => osLink(o.id) }, { h: 'Servicio', f: o => esc(srv(o.servicio)?.nombre) }, { h: 'Cliente · producto', f: o => esc(destinatarioNombre(o.destinatario)) + '<br><span class="xs muted">' + esc(prod(o.producto)?.nombre || '') + '</span>' }, { h: 'Toneladas', cls: 'num', f: o => fmtT(o.ejecucion.acumulado) }, { h: 'Finalizado', f: o => '<span class="mono">' + fmtDT(o.ejecucion.fin) + '</span>' }, { h: 'Cierra', f: o => chip(rolName(rolCierre(o)), rolCierre(o) === 'DEP' ? 'acc' : 'info') }, { h: '', f: o => btn('Revisar y cerrar', 'open', { id: o.id, sec: 'deposito' }, 'sm pri') }], pend, { empty: 'Sin operativos pendientes de cierre' }) + '</div>' +
    '<div class="card"><div class="card-h"><h2>Ocupación de ubicaciones</h2></div>' + table([{ h: 'Ubicación', f: d => '<b>' + esc(d.nombre) + '</b> <span class="xs muted">' + esc(d.tipo) + ' · ' + esc(entName(d.entidad)) + '</span>' + (d.fiscal ? ' ' + chip('Fiscal', 'info') : '') }, { h: 'Ocupación', f: d => { const comp = sum(reservasRecurso(d.id, null), rv => Math.max(0, rv.o.toneladas - (rv.o.ejecucion?.acumulado || 0))); return '<div class="meter">' + bar((d.ocupadoT + comp) / d.capacidadT, (d.ocupadoT + comp) / d.capacidadT > 0.9 ? 'warn' : '') + '<span class="num xs">' + fmtT(d.ocupadoT) + ' + ' + fmtT(comp) + ' comprometido / ' + fmtT(d.capacidadT) + ' t</span></div>'; } }, { h: 'Restricciones', f: d => '<span class="xs muted">' + esc(d.restricciones || '—') + '</span>' }], md().depositos.filter(d => E === 'ALL' || d.entidad === E), { cls: 'compact' }) + '</div></div>';
}

/* ---------- Comparativas ---------- */
function viewComparativas() {
  const os = ordersCtx().filter(o => o.plan).sort((a, b) => b.id.localeCompare(a.id));
  const sel0 = S.ctx.cmpId && byId(os, S.ctx.cmpId) ? S.ctx.cmpId : os[0]?.id;
  const o = sel0 ? orden(sel0) : null;
  const dim = S.ctx.cmpDim || 'muelle'; const dims = [['muelle', 'Muelle'], ['mercaderia', 'Mercadería'], ['calidad', 'Calidad'], ['destino', 'Destino']];
  const agg = agregadoPropiosTerceros(dim, os);
  const dlt = (a, b, money) => { const x = b - a; if (Math.abs(x) < 0.01) return '<span class="dim">0</span>'; return '<span style="color:var(--' + (x > 0 ? 'crit' : 'ok') + ')">' + (x > 0 ? '+' : '') + (money ? fmtT(x) : fmtN(x, 0)) + '</span>'; };
  const cardPT = '<div class="card" style="margin-bottom:14px"><div class="card-h"><h2>Recursos propios y de terceros · necesario vs aplicado ' + sup('S11') + '</h2><div class="btn-row">' + dims.map(([id, n]) => btn(n, 'cmpdim', { dim: id }, 'sm' + (dim === id ? ' pri' : ''))).join('') + '</div></div>' +
    '<p class="small muted" style="margin-bottom:8px">Agregado por <b>' + esc(dims.find(x => x[0] === dim)[1].toLowerCase()) + '</b> sobre las órdenes del contexto. Necesario vs aplicado se calcula solo sobre las órdenes con ejecución (planificadas sin ejecutar se cuentan pero no suman), para que la comparación sea homogénea. Horas·recurso = cantidad × horas (manos y personal: turnos × 6 h).</p>' +
    '<div class="tw"><table class="t compact"><thead><tr><th>' + esc(dims.find(x => x[0] === dim)[1]) + '</th><th class="num">Órdenes</th><th class="num">t</th><th class="num">Propios nec. (h·rec)</th><th class="num">Propios apl.</th><th class="num">Δ</th><th class="num">Terceros nec. (h·rec)</th><th class="num">Terceros apl.</th><th class="num">Δ</th><th class="num">Costo propios nec / apl</th><th class="num">Costo terceros nec / apl</th></tr></thead><tbody>' +
    (agg.length ? agg.map(g => '<tr><td><b>' + esc(g.k) + '</b></td><td class="num">' + g.n + (g.conReal < g.n ? ' <span class="xs dim">(' + g.conReal + ' con ejecución)</span>' : '') + '</td><td class="num">' + fmtT(g.t) + '</td><td class="num">' + fmtN(g.P.nec, 0) + '</td><td class="num">' + fmtN(g.P.apl, 0) + '</td><td class="num">' + dlt(g.P.nec, g.P.apl) + '</td><td class="num">' + fmtN(g.T.nec, 0) + '</td><td class="num">' + fmtN(g.T.apl, 0) + '</td><td class="num">' + dlt(g.T.nec, g.T.apl) + '</td><td class="num">' + fmtT(g.P.costoNec) + ' / ' + fmtT(g.P.costoApl) + '</td><td class="num">' + fmtT(g.T.costoNec) + ' / ' + fmtT(g.T.costoApl) + '</td></tr>').join('') : '<tr><td class="empty" colspan="11">Sin órdenes planificadas</td></tr>') + '</tbody></table></div>' +
    '<p class="help" style="margin-top:8px">Propios: muelle, grúas y equipos, camiones internos, palas y tolvas, personal propio, depósito y balanza. Terceros: manos de proveedores de personal y camiones de transportista. El detalle por recurso está en cada expediente (Comparativas e historial).</p></div>';
  return pageH('Comparativas', 'Circuito recomendado, planificación inicial y ejecución real de cada orden; recursos propios y de terceros, necesario vs aplicado, por muelle, mercadería, calidad y destino.') + cardPT +
    '<div class="card"><div class="card-h"><h2>Resumen de desvíos</h2></div>' +
    table([{ h: 'Orden', f: x => osLink(x.id) }, { h: 'Estado', f: x => pill(x.estado) }, { h: 'Servicio · producto', f: x => esc(srv(x.servicio)?.nombre) + '<br><span class="xs muted">' + esc(prod(x.producto)?.nombre || '') + '</span>' }, { h: 'Plan vs rec.', f: x => x.recomendacion && !x.recomendacion.sinOpciones ? (x.plan.difiere ? chip('Difiere · ' + x.plan.motivoDesvio, 'warn') : chip('Coincide', 'ok')) : '<span class="dim">sin recomendación</span>' }, { h: 'Costo rec.', cls: 'num', f: x => x.recomendacion && !x.recomendacion.sinOpciones ? fmtT(x.recomendacion.costo) : '—' }, { h: 'Costo plan', cls: 'num', f: x => fmtT(x.plan.costo) }, { h: 'Costo real', cls: 'num', f: x => x.ejecucion ? fmtT(metricasReal(x).costo) : '—' }, { h: 'Δ real − plan', cls: 'num', f: x => { if (!x.ejecucion) return '—'; const d = metricasReal(x).costo - x.plan.costo; return '<span class="' + (d > 0 ? 'crit' : 'ok') + '" style="color:var(--' + (d > 0 ? 'crit' : 'ok') + ')">' + (d > 0 ? '+' : '') + fmtT(d) + '</span>'; } }, { h: 'Duración plan / real', cls: 'num', f: x => fmtN(x.plan.horasTurnos, 0) + ' h / ' + (x.ejecucion ? fmtN(metricasReal(x).horas, 1) + ' h' : '—') }], os, { rowAttr: x => 'class="click ' + (x.id === sel0 ? 'sel' : '') + '" data-action="cmp" data-id="' + x.id + '"', empty: 'Sin órdenes planificadas en el contexto' }) + '</div>' +
    (o ? '<div style="margin-top:14px">' + secHistorial(o).replace('Comparativas e historial', 'Detalle · ' + o.id) + '</div>' : '');
}

/* ---------- Datos maestros: ver 05-views-c.js (navegador del modelo v3.1) ---------- */

/* ---------- Administración ---------- */
function viewAdmin() {
  const tab = S.ctx.admTab || 'ENT'; const m = md();
  const tabs = [['ENT', 'Entidades y BU'], ['DEP', 'Departamentos'], ['USR', 'Usuarios y permisos'], ['MOD', 'Menú por rol, entidad y BU'], ['WF', 'Workflows'], ['REL', 'Relaciones e imputación'], ['MAT', 'Matriz de ejecución'], ['PAR', 'Parámetros']];
  let body = '';
  if (tab === 'ENT') body = '<div class="stack"><div class="card"><div class="card-h"><h2>Entidades fiscales</h2></div>' + table([{ h: 'Entidad', f: e => '<b>' + esc(e.nombre) + '</b> (' + esc(e.sigla) + ')' }, { h: 'Tipo', k: 'tipo' }, { h: 'Vigencia desde', f: e => fmtD(e.vigenciaDesde) }, { h: 'Origen', f: e => e.origenBU ? chip('Convertida desde la BU ' + buName(e.origenBU), 'warn') + ' ' + sup('A4') : '<span class="dim">Entidad original</span>' }, { h: 'BU', f: e => m.bus.filter(b => b.entidad === e.id).map(b => esc(b.nombre)).join(', ') || '<span class="dim">a configurar</span>' }], m.entidades, { cls: 'compact' }) + '</div>' +
    '<div class="card"><div class="card-h"><h2>Unidades de negocio</h2></div>' + table([{ h: 'BU', f: b => '<b>' + esc(b.nombre) + '</b> <span class="xs muted">' + esc(b.id) + '</span>' + (b.sup ? ' ' + sup('S1') : '') }, { h: 'Entidad', f: b => esc(entName(b.entidad)) }, { h: 'Centro de costo', f: b => '<span class="mono">' + esc(b.cc) + '</span>' }, { h: 'Presupuesto', cls: 'num', f: b => fmtUSD(b.presupuesto) }, { h: 'Órdenes (prestadora)', cls: 'num', f: b => S.orders.filter(o => o.bu === b.id).length }, { h: 'Situación', f: b => b.convertida ? chip('Convertida en entidad ' + entName(b.convertida.entidad) + ' desde ' + fmtD(b.convertida.vigencia), 'warn') : chip('Activa', 'ok') }], m.bus, { cls: 'compact' }) + '</div>' +
    '<div class="card"><div class="card-h"><h2>Convertir una BU en entidad fiscal ' + sup('A4') + '</h2></div><p class="small muted" style="margin-bottom:10px">El cambio tiene fecha de vigencia. Las órdenes anteriores conservan su entidad y BU originales; solo las órdenes nuevas creadas desde la vigencia se imputan a la nueva entidad.</p>' +
      '<div class="form-grid">' + field('BU a convertir', sel('adm-bu', [{ v: '', t: '— seleccionar —' }, ...m.bus.filter(b => !b.convertida).map(b => ({ v: b.id, t: b.nombre + ' (' + entName(b.entidad) + ')' }))], '')) + field('Fecha de vigencia', '<input type="date" id="adm-vig" value="' + isoDay(30) + '">') + field('Nombre de la nueva entidad', '<input id="adm-nombre" placeholder="p. ej. Rental SA">') + '</div><div class="btn-row" style="margin-top:10px">' + btn('Convertir conservando el historial', 'convertir-bu', {}, 'pri') + '</div></div></div>';
  if (tab === 'DEP') body = '<div class="card"><div class="card-h"><h2>Departamentos y su relación con las BU ' + sup('A3') + '</h2></div><p class="small muted" style="margin-bottom:10px">El departamento organiza funciones, usuarios y datos maestros de su ámbito a nivel entidad; la BU imputa presupuesto, costos y facturación. Relación N:N configurable.</p>' +
    '<div class="tw"><table class="t compact"><thead><tr><th>Departamento</th><th>Entidad</th>' + m.bus.map(b => '<th class="center">' + esc(b.nombre) + '<br><span class="xs dim">' + esc(entName(b.entidad)) + '</span></th>').join('') + '</tr></thead><tbody>' + m.departamentos.map(d => '<tr><td><b>' + esc(d.nombre) + '</b>' + (d.sup ? ' ' + sup('S1') : '') + '</td><td>' + esc(entName(d.entidad)) + '</td>' + m.bus.map(b => '<td class="center">' + (d.bus.includes(b.id) ? '<span style="color:var(--accent);font-weight:700">●</span>' : '<span class="dim">·</span>') + '</td>').join('') + '</tr>').join('') + '</tbody></table></div></div>';
  if (tab === 'USR') body = '<div class="card"><div class="card-h"><h2>Usuarios, roles y permisos</h2></div>' + table([{ h: 'Rol', f: r => '<b>' + esc(r.nombre) + '</b>' }, { h: 'Usuario (demo)', k: 'usuario' }, { h: 'Puede', f: r => ({ COM: 'Crear órdenes, registrar habilitaciones, cargar instrumentos o adendas, aprobar cargos al cliente, devolver / anular en su etapa, consultar todo.', PLAN: 'Asignar y confirmar recursos, regenerar recomendación, cambiar fecha de arribo, devolver / anular en su etapa, consultar todo.', OPS: 'Iniciar, registrar tickets, recursos y demoras, finalizar; cerrar servicios sin depósito; devolver / anular en su etapa.', DEP: 'Seguir ingresos, cerrar operativos con depósito, devolver / anular en su etapa, consultar todo.', LAR: 'Dar de alta y modificar lineup, cupos de camiones y operativos ferroviarios; consultar órdenes.', MD: 'ABM de todos los maestros, validar y publicar altas de otros roles, otorgar o quitar permisos por maestro (no lo visualiza · solo consulta · puede ABM).' })[r.id] + (r.id === 'LAR' ? ' ' + sup('S10') : r.id === 'MD' ? ' ' + sup('S17') : '') }, { h: 'Permisos sobre la master data', f: r => { const p = resumenPermisos(r.id); return chip('ABM ' + p.abm, 'acc') + ' ' + chip('consulta ' + p.consulta, 'info') + ' ' + chip('oculto ' + p.oculto, '') + ' ' + btn('Editar', 'go', { screen: 'md', mdtab: 'PERM' }, 'sm ghost'); } }, { h: 'Etapa · bandeja', f: r => r.etapa ? 'Etapa ' + r.etapa + ' · ' + esc(m.estados.filter(e => e.responsable === r.id).map(e => e.nombre).join(', ')) : '<span class="muted">Sin etapa en el workflow · ' + (r.id === 'MD' ? 'registros en validación' : 'arribos sin orden') + '</span>' }], m.roles, { cls: 'compact' }) + '<p class="help" style="margin-top:8px">La maqueta usa el selector de rol de la barra superior en lugar de autenticación. La visibilidad y el ABM de cada maestro dependen del permiso que Máster data otorga a cada rol (Datos maestros › Permisos por rol); las acciones de Administración se muestran sin restricción para recorrer los casos. Qué módulos del menú ve cada rol en cada entidad y BU se administra en la pestaña <b>Menú por rol, entidad y BU</b> ' + btn('Abrir', 'admtab', { tab: 'MOD' }, 'sm ghost') + '</p></div>';
  if (tab === 'MOD') body = adminModulos();
  if (tab === 'WF') body = '<div class="stack"><div class="card"><div class="card-h"><h2>Estados</h2></div>' + table([{ h: 'Estado', f: e => pill(e.id) }, { h: 'Responsable principal', f: e => esc(e.responsable ? rolName(e.responsable) : 'Consulta') }, { h: 'Próximo paso', k: 'proximo' }, { h: 'Órdenes hoy', cls: 'num', f: e => S.orders.filter(o => o.estado === e.id).length }], m.estados, { cls: 'compact' }) + '</div>' +
    '<div class="card"><div class="card-h"><h2>Transiciones y validaciones</h2></div>' + table([{ h: 'De → a', f: t => pill(t.de) + ' → ' + pill(t.a) }, { h: 'Acción', f: t => '<b>' + esc(t.accion) + '</b>' }, { h: 'Rol', f: t => esc(t.rol === 'cierre' ? 'Rol de cierre del servicio' : rolName(t.rol)) }, { h: 'Validación', f: t => '<span class="small muted">' + esc(t.validacion) + '</span>' }], m.transiciones, { cls: 'compact' }) + '<p class="help" style="margin-top:8px">Toda transición registra quién actuó, cuándo y qué información cambió (ver historial de cada orden). Nacionalización y método seguro son condiciones de la orden, independientes del estado.</p></div>' +
    '<div class="card"><div class="card-h"><h2>Rol de cierre por servicio ' + sup('S6') + '</h2></div>' + table([{ h: 'Servicio', f: s => '<b>' + esc(s.nombre) + '</b>' }, { h: 'Ingreso a depósito', f: s => s.usaDeposito ? chip('Sí', 'acc') : chip('No', '') }, { h: 'Cierra', f: s => sel('wf-cierre-' + s.id, [{ v: 'DEP', t: 'Depósito' }, { v: 'OPS', t: 'Operaciones' }, { v: 'COM', t: 'Comercial / Backoffice' }], s.cierre, 'data-cierre="' + s.id + '" style="padding:3px 6px;border:1px solid var(--line);border-radius:4px;background:var(--surface)"') }], m.servicios.filter(s => !s.pendiente), { cls: 'compact' }) + '</div></div>';
  if (tab === 'REL') body = '<div class="card"><div class="card-h"><h2>Relaciones de las órdenes y tratamiento de imputación</h2></div>' + table([{ h: 'Relación', f: r => '<b>' + esc(r.nombre) + '</b>' + (r.sup ? ' ' + sup('A1') : '') }, { h: 'Descripción', k: 'descripcion' }, { h: 'Imputación / facturación (configurable)', f: r => esc(r.imputacion) }, { h: 'Órdenes', cls: 'num', f: r => S.orders.filter(o => o.relacion === r.id).length }], m.relaciones, { cls: 'compact' }) + '<p class="help" style="margin-top:8px">Ejemplos en la maqueta: ' + osLink('OS-2026-0009') + ' (Interna: Rental → Depósitos) · ' + osLink('OS-2026-0010') + ' (Grupo: TyS → Terminal Timbúes) · el resto son Externas.</p></div>';
  if (tab === 'MAT') body = '<div class="card"><div class="card-h"><h2>Matriz Servicio × Componente → BU ejecutora ' + sup('S1') + '</h2></div><p class="small muted" style="margin-bottom:10px">Define qué BU ejecuta —e imputa— cada componente de los servicios a terceros de TyS y TT. Se aplica al crear la orden (líneas de ejecución); las órdenes existentes conservan sus líneas.</p>' +
    '<div class="tw"><table class="t compact"><thead><tr><th>Entidad</th>' + m.componentes.filter(c => c.id !== 'SRV').map(c => '<th>' + esc(c.nombre) + '</th>').join('') + '</tr></thead><tbody>' + Object.entries(m.matrizEjecucion).map(([E, row]) => '<tr><td><b>' + esc(ent(E)?.nombre) + '</b></td>' + m.componentes.filter(c => c.id !== 'SRV').map(c => '<td>' + sel('mat-' + E + '-' + c.id, m.bus.filter(b => b.entidad === E).map(b => ({ v: b.id, t: b.nombre })), row[c.id], 'data-mat="' + E + ':' + c.id + '" style="padding:3px 6px;border:1px solid var(--line);border-radius:4px;background:var(--surface)"') + '</td>').join('') + '</tr>').join('') + '</tbody></table></div></div>';
  if (tab === 'PAR') body = '<div class="card"><div class="card-h"><h2>Parámetros del motor de recomendación ' + sup('S2') + '</h2></div><div class="form-grid">' + field('Peso costo', '<input type="number" step="0.05" min="0" max="1" data-par="pesos.costo" value="' + m.parametros.pesos.costo + '">') + field('Peso duración', '<input type="number" step="0.05" min="0" max="1" data-par="pesos.duracion" value="' + m.parametros.pesos.duracion + '">') + field('Peso cumplimiento contractual', '<input type="number" step="0.05" min="0" max="1" data-par="pesos.cumplimiento" value="' + m.parametros.pesos.cumplimiento + '">') + field('Eficiencia de equipos (0–1)', '<input type="number" step="0.05" min="0.1" max="1" data-par="eficienciaEquipo" value="' + m.parametros.eficienciaEquipo + '">') + field('Días de depósito estimados', '<input type="number" step="1" min="0" data-par="diasDepositoEstimados" value="' + m.parametros.diasDepositoEstimados + '">') + '</div><p class="help" style="margin-top:10px">Los cambios aplican a las próximas recomendaciones (el Planificador puede regenerarla en cada orden pendiente). Las recomendaciones ya guardadas conservan sus supuestos.</p></div>';
  return pageH('Administración', 'Entidades, BU, departamentos, usuarios, permisos, módulos por rol y workflows. Las acciones de esta pantalla no están restringidas por rol en la maqueta.') +
    '<div class="tabs">' + tabs.map(([id, n]) => '<button class="' + (tab === id ? 'on' : '') + '" data-action="admtab" data-tab="' + id + '">' + n + '</button>').join('') + '</div>' + body;
}

/* ---------- Menú (módulos) por rol, entidad y BU (S20 · S22) ---------- */
function adminModulos() {
  const m = md(); const ops = m.modulos.filter(x => x.grupo === 'operacion'); const sim = S.ctx.sim || { rol: S.ctx.rol, ent: S.ctx.entidad, bu: S.ctx.bu };
  const chk = (dim, key, mo) => { const on = dim === 'rol' ? moduloHabilitadoRol(mo.id, key) : dim === 'entidad' ? moduloHabilitadoEntidad(mo.id, key) : moduloHabilitadoBU(mo.id, key); return '<input type="checkbox" data-moddim="' + dim + ':' + key + ':' + mo.id + '"' + (on ? ' checked' : '') + (mo.fijo ? ' disabled' : '') + ' title="' + esc(mo.nombre + ' · ' + (dim === 'rol' ? rolName(key) : dim === 'entidad' ? entName(key) : buName(key))) + '">'; };
  const matriz = (dim, cols, rows, colH) => '<div class="tw"><table class="t compact mat"><thead><tr><th>Módulo</th>' + cols.map(c => '<th class="center">' + colH(c) + '</th>').join('') + '</tr></thead><tbody>' + rows.map(mo => '<tr><td><b>' + esc(mo.nombre.split(' (')[0]) + '</b>' + (mo.fijo ? ' <span class="xs muted">siempre habilitado</span>' : '') + '</td>' + cols.map(c => '<td class="center">' + chk(dim, c.id, mo) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
  const visibles = modulosDe(sim.rol, sim.ent, sim.bu); const ocultos = m.modulos.filter(x => !visibles.includes(x));
  const simCard = '<div class="card"><div class="card-h"><h2>Qué menú ve cada rol en cada entidad y BU</h2><span class="small muted">elegí el rol y el contexto: el menú de la izquierda es la intersección de las tres matrices</span></div>' +
    '<div class="form-grid">' + field('Rol', sel('adm-sim-rol', m.roles.map(r => ({ v: r.id, t: r.nombre })), sim.rol, 'data-sim="rol"')) + field('Entidad', sel('adm-sim-ent', [{ v: 'ALL', t: 'Grupo (consolidado)' }, ...m.entidades.map(e => ({ v: e.id, t: e.nombre }))], sim.ent, 'data-sim="ent"')) + field('Unidad de negocio', sel('adm-sim-bu', [{ v: 'ALL', t: 'Todas las BU' }, ...m.bus.filter(b => sim.ent === 'ALL' || b.entidad === sim.ent).map(b => ({ v: b.id, t: b.nombre + ' (' + entName(b.entidad) + ')' }))], sim.bu, 'data-sim="bu"')) + '</div>' +
    '<div class="grid g2" style="margin-top:10px"><div><h3 style="margin-bottom:6px">Menú visible (' + visibles.length + ')</h3><div class="btn-row">' + visibles.map(x => chip(x.nombre.split(' (')[0], 'acc')).join('') + '</div></div><div><h3 style="margin-bottom:6px">Oculto (' + ocultos.length + ')</h3><div class="btn-row">' + (ocultos.length ? ocultos.map(x => chip(x.nombre.split(' (')[0] + ' · ' + motivoModuloDeshabilitado(x.id, sim.rol, sim.ent, sim.bu), 'crit')).join('') : '<span class="muted small">nada oculto para esta combinación</span>') + '</div></div></div>' +
    (sim.rol === S.ctx.rol && sim.ent === S.ctx.entidad && sim.bu === S.ctx.bu ? '<p class="help" style="margin-top:8px">Es el contexto activo: el menú de la izquierda ya muestra este resultado.</p>' : '<p class="help" style="margin-top:8px">Para verlo aplicado, cambiá rol, entidad y BU en la barra superior.</p>') + '</div>';
  return '<div class="stack">' + simCard +
    '<div class="card"><div class="card-h"><h2>Por rol / sector ' + sup('S20') + '</h2><span class="small muted">todos los módulos · Inicio no se puede deshabilitar</span></div>' + matriz('rol', m.roles, m.modulos, r => esc(r.nombre) + '<br><span class="xs dim">' + esc(r.usuario) + '</span>') + '</div>' +
    '<div class="card"><div class="card-h"><h2>Menú de Operación por entidad ' + sup('S22') + '</h2><span class="small muted">qué módulos de Operación tiene cada entidad fiscal · con "Grupo (consolidado)" no se aplica</span></div>' + matriz('entidad', m.entidades, ops, e => esc(e.nombre) + '<br><span class="xs dim">' + esc(e.sigla) + '</span>') + '</div>' +
    '<div class="card"><div class="card-h"><h2>Menú de Operación por unidad de negocio ' + sup('S22') + '</h2><span class="small muted">qué módulos de Operación tiene cada BU · con "Todas las BU" no se aplica</span></div>' + matriz('bu', m.bus, ops, b => esc(b.nombre) + '<br><span class="xs dim">' + esc(entName(b.entidad)) + '</span>') +
    '<p class="help" style="margin-top:8px">Cada cambio queda en Datos maestros › Registro de cambios (acción "Módulo"). Los módulos de Configuración y Maqueta se administran solo por rol. En el sistema real la administración correspondería a Máster data o a Administración (a definir).</p></div></div>';
}

/* ---------- Casos guiados y supuestos ---------- */
function viewCasos() {
  return pageH('Casos para recorrer en la maqueta', CASOS.length + ' recorridos que cubren el alcance funcional: una orden completa de TyS/TT con los cuatro roles del workflow, bloqueos de inicio, planificación recomendada, ejecución con incidencias, cierre comparativo, logística de arribo, master data completa con permisos por rol, y devolución o anulación de la orden en cada etapa.') +
    '<div class="stack">' + CASOS.map(c => '<div class="card caso"><div class="n">' + c.n + '</div><div><h2>' + esc(c.titulo) + '</h2><p class="small muted" style="margin-top:2px"><b>Recorrido esperado:</b> ' + esc(c.esperado) + '</p><ol>' + c.pasos.map(p => '<li>' + esc(p) + '</li>').join('') + '</ol></div><div>' + btn('Ir al caso', 'caso', { n: c.n }, 'pri sm') + '</div></div>').join('') + '</div>';
}
function viewSupuestos() {
  return pageH('Supuestos de trabajo', 'Definiciones pendientes resueltas provisoriamente para que el circuito sea recorrible de punta a punta. Cada supuesto está marcado en la maqueta con la etiqueta <span class="sup">SUPUESTO</span> y debe validarse con el grupo.') +
    table([{ h: '#', f: s => '<span class="sup">' + esc(s.id) + '</span>' }, { h: 'Origen', f: s => '<span class="small muted">' + esc(s.origen) + '</span>' }, { h: 'Definición pendiente', f: s => '<b>' + esc(s.tema) + '</b>' }, { h: 'Supuesto adoptado', f: s => esc(s.supuesto) }, { h: 'Impacto', f: s => '<span class="small muted">' + esc(s.impacto) + '</span>' }, { h: 'Dónde se ve', f: s => '<span class="small">' + esc(s.donde) + '</span>' }], SUPUESTOS) +
    '<div class="card" style="margin-top:14px"><div class="card-h"><h2>Fuera del alcance de la maqueta</h2></div><p class="small muted">Facturación y cobranzas (los cargos aprobados se emiten como evento), administración del lineup / cupos / trenes (consulta únicamente), integración con balanzas y portería en línea, circuitos específicos de los servicios de Rental, Depósitos, Mantenimiento, Administración y Corporate, y el alcance de Maquinarias.</p></div>';
}

/* =====================================================================
   MI ÁREA — capacidad propia, ABM del sector y reservas para operativos futuros
   (revisión 16/09, SUPUESTOS S23 · S24)
   ===================================================================== */
function estadoResChip(e) { return chip(e, e === 'Aplicada' ? 'ok' : e === 'A revalidar' ? 'warn' : e === 'Liberada' ? '' : 'info'); }
function areaSelector(a) {
  const list = areasCtx();
  return '<label class="field"><span>Área activa</span>' + sel('area-sel', list.map(x => ({ v: x.id, t: x.nombre + ' · ' + entName(x.entidad) })), a.id, 'data-areasel="1"') + '</label>';
}
function viewArea() {
  const list = areasCtx();
  if (!list.length) return pageH('Mi área', 'Capacidad del sector y reservas para operativos futuros') + alertBox('warn', '<div>No hay áreas definidas para ' + esc(S.ctx.entidad === 'ALL' ? 'el grupo' : ent(S.ctx.entidad)?.nombre) + '. Las áreas se administran en Datos maestros › <b>M-39 Áreas operativas y capacidad</b>. ' + sup('S23') + '</div>');
  const a = areaActiva(); const tab = S.ctx.areaTab || 'CAP';
  const recs = recursosDeArea(a); const win = ventanaArea();
  const rvs = reservasDeArea(a.id); const vig = rvs.filter(r => r.estado !== 'Liberada'); const rev = rvs.filter(r => r.estado === 'A revalidar');
  const puedeABM = S.ctx.rol === 'ARE' || S.ctx.rol === 'MD';
  const capTxt = recs.length ? [...new Set(recs.map(x => x.tipo))].map(t => { const rs = recs.filter(x => x.tipo === t); const tot = sum(rs, x => capacidadRecurso(x.r, t).total); return fmtT(tot) + ' ' + capacidadRecurso(rs[0].r, t).um; }).join(' · ') : '—';
  const head = pageH('Mi área · ' + esc(a.nombre), 'Capacidad total del sector, ABM de sus recursos (por workflow de master data) y reservas para operativos futuros ' + sup('S23'),
    (puedeABM ? btn('Nueva reserva para un operativo', 'ra-nueva', {}, 'pri') : '')) +
    '<div class="form-grid" style="margin-bottom:10px">' + areaSelector(a) + field('Responsable', '<input value="' + esc(a.responsable_usuario || '—') + '" disabled>') + field('Departamento · BU', '<input value="' + esc((byId(md().departamentos, a.departamento)?.nombre || '—') + ((a.bus || []).length ? ' · ' + a.bus.map(buName).join(', ') : '')) + '" disabled>') + '</div>' +
    '<div class="grid g4" style="margin-bottom:12px">' + [['Recursos del sector', recs.length, [...new Set(recs.map(x => TIPO_NOMBRE[x.tipo]))].join(' · ')], ['Capacidad total', capTxt, ''], ['Reservas vigentes', vig.length, 'para operativos futuros'], ['A revalidar', rev.length, rev.length ? 'la planificación eligió otra opción' : 'sin pendientes']]
      .map(([l, v, d2]) => '<div class="kpi tight"><span class="v" style="font-size:20px">' + (typeof v === 'number' ? v : esc(v)) + '</span><span class="l">' + esc(l) + '</span><span class="d">' + esc(d2) + '</span></div>').join('') + '</div>' +
    (rev.length ? alertBox('warn', '<div><b>' + rev.length + ' reserva' + (rev.length > 1 ? 's' : '') + ' a revalidar:</b> la planificación o la ejecución eligió otra opción. Revalidá si liberás la capacidad o si pedís revisar el plan. ' + sup('S24') + '</div>') : '') +
    '<div class="tabs">' + [['CAP', 'Capacidad y ABM del sector (' + recs.length + ')'], ['RES', 'Reservas (' + vig.length + ')'], ['LOG', 'Historial de reservas']].map(([k, t]) => '<button class="' + (tab === k ? 'on' : '') + '" data-action="area-tab" data-t="' + k + '">' + t + '</button>').join('') + '</div>';
  if (tab === 'CAP') return head + areaCapacidad(a, recs, win, puedeABM);
  if (tab === 'RES') return head + areaReservas(a, rvs, puedeABM);
  return head + areaHistorial(rvs);
}
function areaCapacidad(a, recs, win, puedeABM) {
  const tipos = [...new Set(recs.map(x => x.tipo))];
  const bloques = tipos.map(t => {
    const m = TIPO_MAESTRO[t]; const coll = TIPO_COLL[t]; const nivel = permisoMD(m);
    const rows = recs.filter(x => x.tipo === t).map(x => {
      const cap = capacidadRecurso(x.r, t); const oc = ocupacionRecurso(x.r.id, t, win);
      const resv = sum(reservasVigentes().filter(r => r.rid === x.r.id), r => r.cantidad);
      const libre = Math.max(0, cap.total - oc.ordenes);
      return { x, cap, oc, resv, libre };
    });
    const cols = [
      { h: 'Recurso', f: r => '<b>' + esc(r.x.r.nombre) + '</b> <span class="tag">' + esc(r.x.r.id) + '</span>' + (r.x.r.bu ? '<br><span class="xs muted">' + esc(buName(r.x.r.bu)) + '</span>' : '') },
      { h: 'Capacidad total', cls: 'num', f: r => '<b>' + fmtT(r.cap.total) + '</b> <span class="xs muted">' + esc(r.cap.um) + '</span>' },
      { h: 'Comprometido (14 días)', cls: 'num', f: r => (r.oc.ordenes ? fmtT(r.oc.ordenes) : '<span class="dim">0</span>') + (r.oc.detalle.length ? '<br><span class="xs muted">' + r.oc.detalle.slice(0, 3).map(d => esc(d.o.id)).join(' · ') + '</span>' : '') },
      { h: 'Reservado por el área', cls: 'num', f: r => r.resv ? '<b class="warn-t">' + fmtT(r.resv) + '</b><br><span class="xs muted">' + reservasVigentes().filter(z => z.rid === r.x.r.id).map(z => origenLabel(z.origen).split(' · ')[0]).join(' · ') + '</span>' : '<span class="dim">—</span>' },
      { h: 'Libre', cls: 'num', f: r => fmtT(r.libre) },
      { h: 'Estado del registro', f: r => estadoChipMD(estadoRegistro(r.x.r)) + (r.x.r.estado ? ' <span class="xs muted">' + esc(r.x.r.estado) + '</span>' : '') },
    ];
    if (puedeABM && nivel === 'abm') cols.push({ h: '', f: r => deBaja(r.x.r) ? '' : '<div class="btn-row" style="gap:3px">' + btn('Editar', 'md-editar', { m, id: r.x.r.id }, 'sm') + btn('Baja', 'md-baja', { m, id: r.x.r.id }, 'sm danger') + btn('Reservar', 'ra-nueva', { rid: r.x.r.id }, 'sm') + '</div>' });
    return '<div class="card"><div class="card-h"><h3>' + esc(TIPO_NOMBRE[t]) + ' <span class="tag">' + esc(m) + '</span></h3>' +
      (puedeABM && nivel === 'abm' ? '<div class="btn-row">' + btn('Nuevo recurso', 'md-nuevo', { m, coll }, 'sm pri') + '</div>' : '<span class="small muted">' + esc(nivelPermiso(nivel).nombre) + ' para ' + esc(rolName(S.ctx.rol)) + '</span>') + '</div>' +
      table(cols, rows, { cls: 'compact', rowAttr: r => deBaja(r.x.r) ? 'style="opacity:.55"' : '' }) + '</div>';
  }).join('');
  return bloques + '<p class="help">El ABM del sector usa el mismo formulario y el mismo <b>workflow de la master data</b>: las altas y modificaciones del área nacen <b>en validación</b> y Máster data las publica; la baja es lógica y se rechaza si el recurso está reservado por una orden planificada o en ejecución. "Comprometido" es el pico de uso por órdenes planificadas o en ejecución en los próximos 14 días. ' + sup('S23') + '</p>';
}
function areaReservas(a, rvs, puedeABM) {
  const vig = rvs.filter(r => r.estado !== 'Liberada'); const lib = rvs.filter(r => r.estado === 'Liberada');
  const cols = [
    { h: 'Reserva', f: r => '<b class="mono">' + esc(r.id) + '</b><br><span class="xs muted">' + fmtDT(r.creadoTs) + ' · ' + esc(r.creadoPor) + '</span>' },
    { h: 'Operativo de referencia', f: r => esc(origenLabel(r.origen)) + '<br><span class="xs muted">' + esc(({ lineup: 'Lineup (M-17)', cupo: 'Cupo de camiones (M-31)', tren: 'Operativo ferroviario (M-32)' })[r.origen?.tipo] || '—') + '</span>' },
    { h: 'Recurso', f: r => esc(recNombre(r.rid)) + ' <span class="tag">' + esc(r.rid) + '</span>' },
    { h: 'Cantidad', cls: 'num', f: r => '<b>' + fmtT(r.cantidad) + '</b>' },
    { h: 'Ventana', f: r => '<span class="small nowrap">' + fmtDT(r.desde) + '<br>→ ' + fmtDT(r.hasta) + '</span>' },
    { h: 'Motivo', f: r => '<span class="small">' + esc(r.motivo) + '</span>' },
    { h: 'Estado', f: r => estadoResChip(r.estado) + (r.orden ? '<br>' + osLink(r.orden) : '') + (r.estado === 'A revalidar' ? '<br><span class="xs muted">' + esc((r.log || [])[0]?.detalle || '') + '</span>' : '') },
  ];
  if (puedeABM) cols.push({ h: '', f: r => r.estado === 'Liberada' ? '' : '<div class="btn-row" style="gap:3px">' + (r.estado === 'A revalidar' ? btn('Revalidar', 'ra-revalidar', { id: r.id }, 'sm pri') : '') + btn('Liberar', 'ra-liberar', { id: r.id }, 'sm danger') + '</div>' });
  return '<div class="card"><div class="card-h"><h3>Reservas vigentes</h3>' + (puedeABM ? '<div class="btn-row">' + btn('Nueva reserva', 'ra-nueva', {}, 'sm pri') + '</div>' : '') + '</div>' +
    table(cols, vig, { cls: 'compact', empty: 'El área todavía no reservó capacidad para operativos futuros.' }) +
    '<p class="help">La reserva referencia un <b>lineup, un cupo o un operativo ferroviario</b> y se informa expresamente en la planificación y en la ejecución de las órdenes de ese origen. Si el Planificador u Operaciones eligen otra opción, la reserva pasa a <b>A revalidar</b> y vuelve a esta bandeja. ' + sup('S24') + '</p></div>' +
    (lib.length ? '<div class="card"><div class="card-h"><h3>Liberadas</h3><span class="small muted">' + lib.length + '</span></div>' + table(cols.slice(0, 7), lib, { cls: 'compact' }) + '</div>' : '');
}
function areaHistorial(rvs) {
  const rows = [];
  for (const r of rvs) for (const l of (r.log || [])) rows.push({ r, l });
  rows.sort((a, b) => b.l.ts.localeCompare(a.l.ts));
  return '<div class="card"><div class="card-h"><h3>Historial de las reservas del área</h3><span class="small muted">' + rows.length + ' movimientos</span></div>' +
    table([{ h: 'Cuándo', f: x => '<span class="nowrap">' + fmtDT(x.l.ts) + '</span>' }, { h: 'Reserva', f: x => '<span class="mono">' + esc(x.r.id) + '</span>' }, { h: 'Acción', f: x => chip(x.l.accion, x.l.accion === 'Aplicada' ? 'ok' : x.l.accion === 'A revalidar' ? 'warn' : 'info') }, { h: 'Detalle', f: x => '<span class="small">' + esc(x.l.detalle) + '</span>' }, { h: 'Quién', f: x => esc(x.l.usuario) + '<br><span class="xs muted">' + esc(rolName(x.l.rol)) + '</span>' }], rows, { cls: 'compact', empty: 'Sin movimientos.' }) + '</div>';
}
/* banner de reservas de área para la planificación y el ajuste de Operaciones (S24) */
function reservasOrigenCard(o, R) {
  const rs = reservasDeOrigen(o.origen); if (!rs.length) return '';
  const filas = rs.map(r => { const q = R ? cantidadEnOrdenR(R, r.rid) : cantidadEnOrden(o, r.rid); const ok = q >= r.cantidad;
    return '<li>' + (ok ? '✔ ' : '⚠ ') + '<b>' + esc(recNombre(r.rid)) + '</b> · ' + fmtT(r.cantidad) + ' reservada' + (r.cantidad > 1 ? 's' : '') + ' por <b>' + esc(areaMD(r.area)?.nombre || r.area) + '</b> para ' + esc(origenLabel(r.origen)) + ' (' + esc(r.motivo) + ') — ' + (ok ? 'la asignación actual la toma' : q > 0 ? 'la asignación actual toma ' + fmtT(q) + ': el área deberá revalidar' : 'la asignación actual <b>no la usa</b>: al guardar, el área deberá revalidar') + '</li>'; }).join('');
  const faltan = rs.some(r => (R ? cantidadEnOrdenR(R, r.rid) : cantidadEnOrden(o, r.rid)) < r.cantidad);
  return alertBox(faltan ? 'warn' : 'info', '<div><b>Capacidad reservada por las áreas para este operativo</b> ' + sup('S24') + '<ul style="margin:6px 0 0 16px">' + filas + '</ul>' +
    (R && faltan ? '<div class="btn-row" style="margin-top:8px">' + btn('Usar lo reservado por las áreas', 'pf-usar-reservas', { id: o.id }, 'sm') + '</div>' : '') + '</div>');
}
/* cantidad de un recurso dentro de una asignación en edición (no confirmada) */
function cantidadEnOrdenR(R, rid) {
  if (!R) return 0;
  if (R.muelle === rid || R.deposito === rid || R.balanza === rid) return 1;
  if ((R.equipos || []).includes(rid)) return 1;
  return (R.logistica?.[rid] || 0) + (R.manos?.[rid] || 0) + (R.funciones?.[rid] || 0);
}
function aplicarReservasAAsignacion(o, R) {
  const rs = reservasDeOrigen(o.origen); const tocados = [];
  for (const r of rs) {
    const t = recursoTipo(r.rid);
    if (t === 'deposito') { if (R.deposito !== r.rid) { R.deposito = r.rid; tocados.push(recNombre(r.rid)); } }
    else if (t === 'balanza') { if (R.balanza !== r.rid) { R.balanza = r.rid; tocados.push(recNombre(r.rid)); } }
    else if (t === 'muelle') { if (R.muelle !== r.rid) { R.muelle = r.rid; tocados.push(recNombre(r.rid)); } }
    else if (t === 'equipo') { R.equipos = R.equipos || []; if (!R.equipos.includes(r.rid)) { R.equipos.push(r.rid); tocados.push(recNombre(r.rid)); } }
    else if (t === 'logistica') { R.logistica = R.logistica || {}; if ((R.logistica[r.rid] || 0) < r.cantidad) { R.logistica[r.rid] = r.cantidad; tocados.push(r.cantidad + ' × ' + recNombre(r.rid)); } }
    else if (t === 'mano') { R.manos = R.manos || {}; if ((R.manos[r.rid] || 0) < r.cantidad) { R.manos[r.rid] = r.cantidad; tocados.push(r.cantidad + ' × ' + recNombre(r.rid)); } }
    else if (t === 'funcion') { R.funciones = R.funciones || {}; if ((R.funciones[r.rid] || 0) < r.cantidad) { R.funciones[r.rid] = r.cantidad; tocados.push(r.cantidad + ' × ' + recNombre(r.rid)); } }
  }
  return tocados;
}
