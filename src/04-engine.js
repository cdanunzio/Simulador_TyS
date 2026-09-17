/* =====================================================================
   MOTOR — estado, helpers, workflow, validaciones, recomendación,
   ejecución, costos y comparativas
   ===================================================================== */
const VERSION = 'v2.14';
const LS_KEY = 'tys-maqueta-erp-v2';
let S = null;

/* ---------- utilidades ---------- */
const _nf0 = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });
function fmtT(n) { return _nf0.format(Math.round(+n || 0)); }
function fmtN(n, d = 1) { return new Intl.NumberFormat('es-AR', { minimumFractionDigits: d, maximumFractionDigits: d }).format(+n || 0); }
function fmtUSD(n) { return 'USD ' + _nf0.format(Math.round(+n || 0)); }
function fmtPct(x) { return fmtN((+x || 0) * 100, 0) + ' %'; }
function fmtDT(s) { if (!s) return '—'; const d = new Date(s); return pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()); }
function fmtD(s) { if (!s) return '—'; const d = new Date(s.length === 10 ? s + 'T12:00:00' : s); return pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + '/' + d.getFullYear(); }
function fmtH(h) { return fmtN(h, 1) + ' h'; }
function hoursBetween(a, b) { return (new Date(b) - new Date(a)) / 36e5; }
function addHours(s, h) { return new Date(new Date(s).getTime() + h * 36e5).toISOString(); }
function nowIso() { return new Date().toISOString(); }
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function byId(list, id) { return (list || []).find(x => x.id === id) || null; }
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function sum(arr, f) { return (arr || []).reduce((s, x) => s + (f ? f(x) : x), 0); }
function overlap(a1, a2, b1, b2) { return a1 < b2 && b1 < a2; }
function toLocalInput(s) { if (!s) return ''; const d = new Date(s); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + 'T' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()); }
function fromLocalInput(v) { return v ? new Date(v).toISOString() : null; }
/* RNG determinista para simulaciones reproducibles */
let _rng = 12345;
function seedRng(n) { _rng = n >>> 0 || 1; }
function rnd() { _rng = (_rng * 1664525 + 1013904223) >>> 0; return _rng / 4294967296; }

/* ---------- estado y persistencia ---------- */
function md() { return S.md; }
function newState() {
  S = { version: VERSION, seedDay: isoDay(0), md: clone(MD_SEED), ops: clone(OPS_SEED), orders: [], seq: 1, tk: 1, mdLog: [],
    reservasArea: [], seqRA: 1,
    ctx: { entidad: 'TYS', bu: 'ALL', rol: 'COM', screen: 'inicio', orderId: null, mdTab: 'GEN', admTab: 'ENT', ordFilter: 'ALL', recTab: 'equipos', area: 'AR-LOG', areaTab: 'CAP' } };
  buildSeedOrders();
  buildSeedReservas();
  return S;
}
function save() { try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) { /* sin persistencia */ } }
function load() {
  try { const raw = localStorage.getItem(LS_KEY); if (!raw) return null; const s = JSON.parse(raw); if (!s || s.version !== VERSION) return null; return s; } catch (e) { return null; }
}
function resetState() { try { localStorage.removeItem(LS_KEY); } catch (e) { } newState(); save(); }

/* ---------- lookups ---------- */
function ent(id) { return byId(md().entidades, id); }
function bu(id) { return byId(md().bus, id); }
function srv(id) { return byId(md().servicios, id); }
function cli(id) { return byId(md().clientes, id); }
function prod(id) { return byId(md().productos, id); }
function instr(id) { return byId(md().instrumentos, id); }
function medio(id) { return byId(md().medios, id); }
/* servicios de las BU sin origen operativo: por solicitud (SOL) o con detalle del servicio cargado por Comercial (INT / EXT — Rental y Logística, S21) */
function esMedioSinOrigen(mid) { const m = medio(mid); return !!m && (m.origen === 'solicitud' || m.origen === 'detalle'); }
function sinOrigenOperativo(o) { return esMedioSinOrigen(o?.medio); }
function compName(id) { return byId(md().componentes, id)?.nombre || id; }
function rolName(id) { return byId(md().roles, id)?.nombre || id; }
/* la maqueta no usa nombres de personas: el responsable de cada registro es el rol (revisión 17/09) */
function userOf(rol) { return rolName(rol); }
function estadoName(id) { return byId(md().estados, id)?.nombre || id; }
function entName(id) { return ent(id)?.sigla || id; }
function buName(id) { return bu(id)?.nombre || id || '—'; }
function ambitoTxt(o) { return o.bu ? buName(o.bu) : 'Entidad ' + entName(o.entidad) + ' (sin BU específica)'; }
function buLabel(id, entidad) { return id ? buName(id) : 'Entidad ' + entName(entidad); }
function famName(id) { return byId(md().familias, id)?.nombre || id; }
function provName(id) { return byId(md().proveedores, id)?.nombre || id || '—'; }
function agName(id) { return byId(md().agencias, id)?.nombre || provName(id); }
function buque(id) { return byId(md().buques, id); }
function buqueDeLineup(lu) { return lu ? (byId(md().buques, lu.buqueId) || null) : null; }
function planta(id) { return byId(md().plantas, id); }
function areaMD(id) { return byId(md().areas || [], id); }
function areasCtx() { const E = S.ctx.entidad; return (md().areas || []).filter(a => (E === 'ALL' || a.entidad === E) && !deBaja(a)); }
function areaActiva() { const l = areasCtx(); if (!l.length) return null; return l.find(a => a.id === S.ctx.area) || l[0]; }
function depositoPadre(ubiId) { const u = byId(md().depositos, ubiId); return u ? byId(md().depositosPadre, u.deposito) : null; }
function recurso(id) {
  const m = md();
  if (esEquipoBuque(id)) return equipoBuqueVirtual(id.slice(4));
  return byId(m.muelles, id) || byId(m.equipos, id) || byId(m.depositos, id) || byId(m.balanzas, id) || byId(m.logistica, id) || byId(m.manos, id) || byId(m.funciones, id) || null;
}
function recursoTipo(id) {
  const m = md();
  if (esEquipoBuque(id)) return 'equipo';
  if (byId(m.muelles, id)) return 'muelle'; if (byId(m.equipos, id)) return 'equipo'; if (byId(m.depositos, id)) return 'deposito';
  if (byId(m.balanzas, id)) return 'balanza'; if (byId(m.logistica, id)) return 'logistica'; if (byId(m.manos, id)) return 'mano'; if (byId(m.funciones, id)) return 'funcion';
  return null;
}
function recNombre(id) { return recurso(id)?.nombre || id; }
/* ámbito del recurso: lo gestiona Operaciones, Depósito o los dos (revisión 17/09, S33) */
const AMBITOS = [{ id: 'operaciones', nombre: 'Operaciones', corto: 'OPS', cls: 'acc' }, { id: 'deposito', nombre: 'Depósito', corto: 'DEP', cls: 'info' }, { id: 'compartido', nombre: 'Compartido', corto: 'OPS + DEP', cls: 'warn' }];
function ambitoRecurso(rid) { const r = recurso(rid); if (!r) return 'operaciones'; if (r.ambito) return r.ambito; const t = recursoTipo(rid); return t === 'deposito' ? 'deposito' : t === 'balanza' || t === 'logistica' ? 'compartido' : 'operaciones'; }
function ambitoInfo(id) { return byId(AMBITOS, id) || AMBITOS[0]; }
function rolesDeAmbito(a) { return a === 'compartido' ? ['OPS', 'DEP'] : a === 'deposito' ? ['DEP'] : ['OPS']; }
/* Operaciones y Depósito trabajan la misma orden en simultáneo: cada uno gestiona los recursos de su ámbito y los compartidos (revisión 17/09, S35) */
function puedeGestionarRecurso(rid, rol) { rol = rol || S.ctx.rol; if (rol === 'OPS') return true; if (rol === 'DEP') return ambitoRecurso(rid) !== 'operaciones'; return false; }
function puedeEjecutar(o, rol) { rol = rol || S.ctx.rol; return o.estado === 'EJEC' && (rol === 'OPS' || (rol === 'DEP' && usaDeposito(o))); }
/* unidades de maquinaria (M-12a): la misma máquina con distintas características; el acceso del destino define cuál sirve (revisión 17/09, S34) */
function unidadesDe(maqId) { return (md().maquinariaUnidades || []).filter(u => u.maquinaria === maqId); }
function unidadMaq(id) { return (md().maquinariaUnidades || []).find(u => u.id === id) || null; }
function accesoDe(ubiId) { const u = ubiId ? recurso(ubiId) : null; return u?.acceso || null; }
function unidadApta(u, ubiId) {
  const acc = accesoDe(ubiId); if (!u) return { apta: false, motivo: 'unidad inexistente' };
  if (u.estado && u.estado !== 'Operativo') return { apta: false, motivo: u.estado.toLowerCase() + (u.mantHasta ? ' hasta ' + fmtD(u.mantHasta) : '') };
  if (!acc) return { apta: true, motivo: 'sin destino elegido: no se verifica el acceso' };
  if (u.anchoM > acc.anchoM) return { apta: false, motivo: 'no pasa por el acceso: ' + fmtN(u.anchoM, 1) + ' m de ancho contra ' + fmtN(acc.anchoM, 1) + ' m del ' + acc.tipo };
  if (u.altoM > acc.altoM) return { apta: false, motivo: 'no pasa por el acceso: ' + fmtN(u.altoM, 1) + ' m de alto contra ' + fmtN(acc.altoM, 1) + ' m del ' + acc.tipo };
  return { apta: true, motivo: 'entra por el ' + acc.tipo + ' (' + fmtN(acc.anchoM, 1) + ' × ' + fmtN(acc.altoM, 1) + ' m)' };
}
function unidadesAptas(maqId, ubiId) { return unidadesDe(maqId).filter(u => unidadApta(u, ubiId).apta); }
function unidadesElegidas(R, maqId) { return ((R.maqUnidades || {})[maqId] || []).filter(id => unidadMaq(id)); }
const PRESENTACIONES = { granel: 'Granel sólido', 'granel sólido': 'Granel sólido', tanque: 'Líquido a granel (tanque)', 'líquido a granel': 'Líquido a granel (tanque)', 'big bag': 'Embolsado (big bag)', bolsa: 'Embolsado (bolsa)', embolsado: 'Embolsado', 'a granel': 'Granel sólido' };
function presentacionProducto(prodId) {
  const pr = prod(prodId); if (!pr) return null; const fam = byId(md().familias, pr.familia);
  const bruto = (pr.presentacion || '').toString().toLowerCase();
  const est = estadoFisico(prodId);
  const label = PRESENTACIONES[bruto] || (bruto ? bruto.charAt(0).toUpperCase() + bruto.slice(1) : (est === 'liquido' ? 'Líquido a granel' : 'Granel sólido'));
  return { presentacion: label, bruto: pr.presentacion || '—', estado: est, familia: fam ? fam.nombre : '—', um: pr.um || 't', densidad: pr.densidad };
}
function presentacionTxt(prodId) { const p2 = presentacionProducto(prodId); return p2 ? p2.presentacion : '—'; }
/* alta y baja de unidades de maquinaria en la asignación (revisión 17/09): la cantidad sale de las unidades elegidas */
function toggleUnidadMaq(R, maq, uid, on) {
  R.maqUnidades = R.maqUnidades || {}; R.logistica = R.logistica || {};
  if (!uid) { if (!on) { delete R.logistica[maq]; if (R.maqPct) delete R.maqPct[maq]; } return R; }
  const lst = new Set(R.maqUnidades[maq] || []);
  if (on) lst.add(uid); else lst.delete(uid);
  R.maqUnidades[maq] = [...lst];
  if (R.maqUnidades[maq].length) { R.logistica[maq] = R.maqUnidades[maq].length; R.maqPct = R.maqPct || {}; if (R.maqPct[maq] == null) R.maqPct[maq] = 100; }
  else { delete R.maqUnidades[maq]; delete R.logistica[maq]; if (R.maqPct) delete R.maqPct[maq]; }
  return R;
}
/* presentación de la mercadería del operativo: la elige Comercial al crear la orden y la propone el producto (revisión 17/09) */
const PRESENTACION_OPCIONES = ['Granel sólido', 'Líquido a granel (tanque)', 'Embolsado (big bag 1 t)', 'Embolsado (bolsa 50 kg)', 'Contenedor'];
function presentacionesDe(prodId) { const base = presentacionTxt(prodId); const l = [...PRESENTACION_OPCIONES]; if (base && base !== '—' && !l.includes(base)) l.unshift(base); return l; }
function presentacionSugerida(prodId) { const base = presentacionTxt(prodId); if (!base || base === '—') return ''; const m = PRESENTACION_OPCIONES.find(x => x.toLowerCase().startsWith(base.toLowerCase().slice(0, 8))); return m || base; }
function presentacionOrden(o) { return (o && o.presentacion) || (o && o.producto ? presentacionTxt(o.producto) : '—'); }

/* clase del recurso de M-12: la flota (logística) se administra y se planifica separada de la maquinaria (revisión 16/09) */
function claseRecurso(id) { const r = recurso(id); if (!r) return null; if (recursoTipo(id) !== 'logistica') return recursoTipo(id); return r.clase || (r.capacidadT ? 'logistica' : 'maquinaria'); }
function esMaquinaria(id) { return claseRecurso(id) === 'maquinaria'; }
function logisticaDe(entidad, clase) { return md().logistica.filter(l => l.entidad === entidad && claseRecurso(l.id) === clase); }
/* turnos: duración y catálogo desde el régimen de turnos (M-33), no desde una constante */
function regimenTurnos() { const r = (md().regimenTurnos || []).filter(t => t.estado !== 'inactivo'); return r.length ? r : [{ id: 'T1', nombre: 'Turno 1', hora_desde: '00:00', hora_hasta: '06:00', duracion_h: md().parametros.horasTurno }]; }
function duracionTurno() { return regimenTurnos()[0].duracion_h || md().parametros.horasTurno; }
function turnoLabel(t) { return t.id + ' · ' + t.hora_desde + '–' + t.hora_hasta + ' (' + t.duracion_h + ' h)'; }
/* distribución de la planta: planta → depósito (M-10) → celda (M-10a) → box → mini box (revisión 16/09) */
const UBI_NIVELES = [{ id: 'celda', nombre: 'Celda / tanque / galpón / silo' }, { id: 'box', nombre: 'Box' }, { id: 'minibox', nombre: 'Mini box' }];
function ubiNivel(u) { return (typeof u === 'string' ? recurso(u) : u)?.nivel || 'celda'; }
function ubiPadre(id) { const u = recurso(id); return u && u.padreUbi ? recurso(u.padreUbi) : null; }
function ubiHijos(id) { return md().depositos.filter(x => x.padreUbi === id); }
function ubicacionesDe(depPadreId, entidad) { return md().depositos.filter(u => u.entidad === entidad && !u.padreUbi && (!depPadreId || u.deposito === depPadreId)); }
function rutaUbicacion(id) {
  const u = recurso(id); if (!u) return [];
  const cadena = []; let cur = u; while (cur) { cadena.unshift(cur); cur = cur.padreUbi ? recurso(cur.padreUbi) : null; }
  const dp = byId(md().depositosPadre, cadena[0]?.deposito); const pl = dp ? planta(dp.planta) : null;
  return [pl ? { id: pl.id, nombre: pl.nombre, nivel: 'planta' } : null, dp ? { id: dp.id, nombre: dp.nombre, nivel: 'deposito' } : null, ...cadena.map(x => ({ id: x.id, nombre: x.nombre, nivel: ubiNivel(x) }))].filter(Boolean);
}
function rutaUbicacionTxt(id) { const n = rutaUbicacion(id).map(x => x.nombre); return n.filter((x, i) => i === 0 || x !== n[i - 1]).join(' › '); }
/* habilitación de puerto: costo por operativo según el puerto del origen (revisión 16/09) */
function puertoDeOrden(o) {
  const g = origenInfo(o);
  if (g?.lu) return planta(g.lu.puerto) || null;
  const e = ent(o.entidad); return planta(e?.id === 'TT' ? 'PL-TT' : 'PU-SN') || null;
}
function habilitacionPuerto(o) { const pl = puertoDeOrden(o); if (!pl || !pl.costo_habilitacion_puerto) return null; return { id: 'HAB-' + pl.id, puerto: pl, costo: pl.costo_habilitacion_puerto, detalle: pl.detalle_habilitacion_puerto || '' }; }
/* personal externo: composición efectiva de las manos + puestos agregados o desafectados (revisión 16/09) */
function puestoMano(nombre) { return (md().puestosMano || []).find(x => x.nombre === nombre || x.id === nombre) || null; }
function composicionManos(recursos) {
  const out = {};
  for (const [id, n] of Object.entries(recursos.manos || {})) { const m = recurso(id); if (!m || !n) continue; for (const [rol, q] of Object.entries(m.roles || {})) out[rol] = (out[rol] || 0) + q * n; }
  for (const [rol, d] of Object.entries(recursos.puestos || {})) out[rol] = (out[rol] || 0) + d;
  return out;
}
function personasManos(recursos) { return Object.values(composicionManos(recursos)).reduce((a, b) => a + Math.max(0, b), 0); }
/* personal propio compartido: % de afectación cuando el mismo puesto se usa en operativos simultáneos (revisión 16/09) */
function afectacionPuesto(rid, o, cantidad) {
  const r = recurso(rid); if (!r) return { pct: 100, compartido: [] };
  const cant = cantidad != null ? cantidad : cantidadEnOrden(o, rid);
  const otras = reservasRecurso(rid, o.id).filter(rv => overlap(o.ventana.inicio, o.ventana.fin, rv.desde, rv.hasta));
  const demandaOtras = sum(otras, rv => rv.cantidad);
  const total = demandaOtras + cant; const dot = r.dotacion || r.cantidad || 1;
  const pct = total > dot ? Math.round((dot / total) * 100) : 100;
  return { pct, compartido: otras.map(rv => rv.o.id), demanda: total, dotacion: dot };
}

/* ---------- equipos de descarga / carga: tipo según el producto y origen muelle / buque (SUPUESTO S14) ---------- */
function estadoFisico(prodId) { const p = prod(prodId); const fam = p ? byId(md().familias, p.familia) : null; if (p?.tipo) return p.tipo === 'líquido' ? 'liquido' : 'solido'; /* M-07.tipo */ return p?.estadoFisico || fam?.estadoFisico || 'solido'; }
function tipoEquipoPara(o) { return estadoFisico(o?.producto) === 'liquido' ? 'Bombeo' : 'Grúa'; }
function tipoEquipoInfo(tipo) { return byId(md().tiposEquipo, tipo) || { id: tipo, nombre: tipo, singular: tipo, buque: 'Equipos del buque' }; }
function esEquipoBuque(rid) { return typeof rid === 'string' && rid.startsWith('EQB-'); }
function equipoBuqueVirtual(luId) {
  /* recurso virtual construido desde el lineup: no pertenece al inventario de la terminal */
  const lu = byId(S.ops.lineups, luId); const bq = buqueDeLineup(lu); const eb = bq ? bq.equipos_propios : lu?.equiposBuque; if (!lu || !eb) return null;
  const info = tipoEquipoInfo(eb.tipo);
  return { id: 'EQB-' + lu.id, nombre: info.buque + ' ' + lu.buque + ' (' + eb.cantidad + ' × ' + eb.capacidadTh + ' t/h)', tipo: eb.tipo, cantidad: eb.cantidad, capacidadUnit: eb.capacidadTh, capacidadTh: eb.cantidad * eb.capacidadTh,
    estado: 'Operativo', costoHora: 0, buque: true, tercero: true, lineup: lu.id, buqueId: bq?.id || null, agencia: lu.agencia, entidad: null, bu: null, familias: null };
}
function equiposBuqueDe(o) { return o?.origen?.tipo === 'lineup' ? equipoBuqueVirtual(o.origen.id) : null; }
function equiposMuelleDe(o) { return md().equipos.filter(e => e.entidad === o.entidad && e.tipo === tipoEquipoPara(o) && mdUsable(e)); }
function origenEquipos(R) { return R?.equipoOrigen || ((R?.equipos || []).some(esEquipoBuque) ? 'buque' : 'muelle'); }
function destinatarioNombre(d) {
  if (!d) return '—';
  if (d.tipo === 'cliente') return cli(d.id)?.nombre || d.id;
  if (d.tipo === 'bu') return buName(d.id) + ' (BU · ' + entName(bu(d.id)?.entidad) + ')';
  if (d.tipo === 'entidad') return ent(d.id)?.nombre || d.id;
  return d.id;
}
function ordersCtx() {
  const c = S.ctx;
  return S.orders.filter(o => (c.entidad === 'ALL' || o.entidad === c.entidad) && (c.bu === 'ALL' || o.bu === c.bu || (o.lineas || []).some(l => l.bu === c.bu)));
}
function orden(id) { return byId(S.orders, id); }

/* ---------- origen ---------- */
function origenInfo(o) {
  const g = o.origen; if (!g) return null;
  if (g.tipo === 'lineup') { const lu = byId(S.ops.lineups, g.id); const c = lu?.cargas?.[g.cargaIdx]; return lu ? { tipo: 'Lineup', id: lu.id, label: lu.buque + ' · ' + (c?.bl || ''), lu, carga: c, ventana: { inicio: lu.etb, fin: lu.etc } } : null; }
  if (g.tipo === 'cupo') { const cu = byId(S.ops.cupos, g.id); return cu ? { tipo: 'Cupo de camiones', id: cu.id, label: cu.id + ' · ' + cu.camiones + ' camiones · ' + cu.franja, cu } : null; }
  if (g.tipo === 'tren') { const tr = byId(S.ops.trenes, g.id); return tr ? { tipo: 'Operativo de tren', id: tr.id, label: tr.formacion + ' · ' + tr.vagones + ' vagones', tr } : null; }
  if (g.tipo === 'solicitud') { const so = byId(S.ops.solicitudes, g.id); return so ? { tipo: 'Solicitud ' + (so.tipo || '').toLowerCase(), id: so.id, label: so.id + ' · ' + so.detalle, so } : null; }
  return null;
}
function ordenesDeOrigen(tipo, id, cargaIdx) {
  /* las órdenes anuladas liberan el origen (SUPUESTO S18) */
  return S.orders.filter(o => o.estado !== 'ANULADA' && o.origen && o.origen.tipo === tipo && o.origen.id === id && (cargaIdx == null || o.origen.cargaIdx === cargaIdx));
}

/* ---------- habilitaciones ---------- */
function msEstado(prodId) {
  /* la habilitación por método seguro viene de la master data: MS asignado al producto o, si no, a su familia; requiere = producto (o familia) */
  const p = prod(prodId); if (!p) return { requiere: false, vigente: true, ms: null };
  const fam = byId(md().familias, p.familia);
  const requiere = p.requiereMS != null ? !!p.requiereMS : !!fam?.requiereMS;
  if (!requiere) return { requiere: false, vigente: true, ms: null, origen: null };
  let ms = md().metodosSeguros.find(m => (m.productos || []).includes(prodId)); let origen = 'producto';
  if (!ms) { ms = md().metodosSeguros.find(m => (m.familias || []).includes(p.familia)); origen = ms ? 'familia' : null; }
  const vigente = !!ms && ms.vigenciaHasta >= isoDay(0);
  return { requiere: true, ms, vigente, vence: ms?.vigenciaHasta, origen };
}
/* M-34: situación de un método seguro según vencimiento, días de aviso y acción al vencer (regla VA-M34 / AL-M34) */
function msSituacion(msId, fechaRef) {
  const ms = byId(md().metodosSeguros, msId); if (!ms) return { existe: false, vigente: false, bloquea: true, porVencer: false, txt: 'MS ' + msId + ' inexistente' };
  const ref = fechaRef ? dayOf(fechaRef) : isoDay(0); const vence = ms.vigenciaHasta;
  const vigente = vence >= ref && !['vencido', 'reemplazado'].includes(ms.estado || '');
  const diasRest = Math.round((new Date(vence + 'T12:00:00') - new Date(ref + 'T12:00:00')) / 864e5);
  const porVencer = vigente && diasRest <= (ms.dias_aviso ?? 30);
  const bloquea = !vigente && (ms.accion_al_vencer || 'bloquear el recurso') === 'bloquear el recurso';
  return { existe: true, ms, vigente, porVencer, bloquea, diasRest, txt: ms.id + (vigente ? (porVencer ? ' vence en ' + diasRest + ' días (' + fmtD(vence) + ')' : ' vigente hasta ' + fmtD(vence)) : ' vencido el ' + fmtD(vence) + (bloquea ? '' : ' (acción: alertar y registrar desvío)')) };
}
function condiciones(o) {
  const h = o.habilitaciones || {};
  const msE = msEstado(o.producto);
  const nacOk = !o.aplicaNacionalizacion || !!h.nacionalizada;
  const sit = msE.requiere && msE.ms ? msSituacion(msE.ms.id, o.ventana?.inicio) : null;
  const msOk = !msE.requiere || (sit ? !sit.bloquea : false); /* habilitación automática desde la master data; la acción al vencer decide si bloquea (M-34) */
  const motivos = []; const avisos = [];
  if (!nacOk) motivos.push('Mercadería no nacionalizada');
  if (msE.requiere && !msOk) motivos.push('Método seguro ' + (msE.ms ? 'vencido (' + msE.ms.id + ' hasta ' + fmtD(msE.vence) + ')' : 'no definido en la master data para el producto ni su familia'));
  if (sit && sit.vigente && sit.porVencer) avisos.push('Método seguro ' + sit.txt + ': recurso con observaciones (aviso M-34)');
  if (sit && !sit.vigente && !sit.bloquea) avisos.push('Método seguro ' + sit.txt);
  return { nac: { aplica: !!o.aplicaNacionalizacion, ok: nacOk }, ms: { aplica: msE.requiere, ok: msOk, vigente: msE.vigente, ms: msE.ms, origen: msE.origen, situacion: sit }, ok: nacOk && msOk, motivos, avisos };
}
function rolCierre(o) { return srv(o.servicio)?.cierre || 'DEP'; }
function usaDeposito(o) { return !!srv(o.servicio)?.usaDeposito; }
function relacionDe(dest, entidad) {
  if (!dest) return 'Externa';
  if (dest.tipo === 'cliente') return 'Externa';
  if (dest.tipo === 'bu') return bu(dest.id)?.entidad === entidad ? 'Interna' : 'Grupo';
  return 'Grupo';
}

/* ---------- historial y workflow ---------- */
function logEv(o, evento, detalle, opts = {}) {
  const rol = opts.rol || S.ctx.rol;
  o.historial.push({ ts: opts.ts || nowIso(), rol, usuario: opts.usuario || userOf(rol), evento, detalle: detalle || '' });
}
function transition(o, to, accion, opts = {}) {
  const from = o.estado; o.estado = to;
  logEv(o, accion, 'Estado: ' + estadoName(from) + ' → ' + estadoName(to), opts);
}
function accionPrincipal(o) {
  /* devuelve {rol, label, action} para la etapa actual */
  const c = condiciones(o);
  switch (o.estado) {
    case 'BORR': return { rol: 'COM', label: 'Crear y enviar a planificación', action: 'enviar-plan' };
    case 'PEND_PLAN': return { rol: 'PLAN', label: 'Confirmar planificación y enviar a operaciones', action: 'confirmar-plan' };
    case 'PLANIF': return { rol: 'OPS', label: 'Iniciar operativo', action: 'iniciar', bloqueado: !c.ok, motivos: c.motivos };
    case 'EJEC': return { rol: 'OPS', label: 'Finalizar operativo y enviar a cierre', action: 'finalizar' };
    case 'PEND_CIERRE': return { rol: rolCierre(o), label: 'Cerrar operativo', action: 'cerrar' };
    default: return null;
  }
}
/* ---------- devolver al paso anterior · anular (SUPUESTO S18) ---------- */
const ETAPA_ANTERIOR = { PEND_PLAN: 'BORR', PLANIF: 'PEND_PLAN', EJEC: 'PLANIF', PEND_CIERRE: 'EJEC' };
function rolResponsable(o) { return o.estado === 'PEND_CIERRE' ? rolCierre(o) : (byId(md().estados, o.estado)?.responsable || null); }
function puedeDevolver(o) {
  const a = ETAPA_ANTERIOR[o.estado]; if (!a) return { ok: false, motivo: o.estado === 'BORR' ? 'el borrador es el primer paso' : 'una orden ' + estadoName(o.estado).toLowerCase() + ' no se devuelve' };
  if (o.estado === 'EJEC' && o.ejecucion && (o.ejecucion.tickets.length || o.ejecucion.acumulado > 0)) return { ok: false, a, motivo: 'el operativo ya registró ' + o.ejecucion.tickets.length + ' tickets (' + fmtT(o.ejecucion.acumulado) + ' t): solo puede finalizarse o anularse' };
  return { ok: true, a, rol: rolResponsable(o) };
}
function devolver(o, motivo, opts = {}) {
  const p = puedeDevolver(o); if (!p.ok) return p;
  const de = o.estado; const rol = opts.rol || rolResponsable(o);
  if (de === 'PLANIF') { o.planDevuelto = o.plan; o.plan = null; o.planInicial = null; }
  if (de === 'EJEC') { o.ejecucionRevertida = o.ejecucion; o.ejecucion = null; }
  if (de === 'PEND_CIERRE' && o.ejecucion) { const ex = o.ejecucion; const fin = ex.fin; for (const r of ex.recursos) if (r.hasta === fin) r.hasta = null; ex.fin = null; ex.diferencia = null; }
  o.devolucion = { de, a: p.a, motivo: motivo || 'Sin motivo indicado', rol, por: opts.usuario || userOf(rol), ts: opts.ts || nowIso() };
  logEv(o, 'Orden devuelta a ' + estadoName(p.a), 'Motivo: ' + o.devolucion.motivo + (de === 'PLANIF' ? ' · la planificación v' + (o.planDevuelto?.version || 1) + ' queda como historial y se liberan las reservas' : de === 'EJEC' ? ' · el inicio se revierte (sin tickets registrados)' : de === 'PEND_CIERRE' ? ' · el operativo vuelve a estar en ejecución; los recursos cerrados al finalizar quedan activos' : ''), { rol, ...opts });
  transition(o, p.a, 'Devolver a ' + estadoName(p.a), { rol, ...opts });
  return { ok: true, a: p.a };
}
function anular(o, motivo, opts = {}) {
  if (['CERRADA', 'ANULADA'].includes(o.estado)) return { ok: false, motivo: 'la orden ya está ' + estadoName(o.estado).toLowerCase() };
  const rol = opts.rol || rolResponsable(o) || 'COM'; const desde = o.estado;
  o.anulacion = { desde, motivo: motivo || 'Sin motivo indicado', rol, por: opts.usuario || userOf(rol), ts: opts.ts || nowIso(), acumulado: o.ejecucion?.acumulado || 0 };
  if (o.ejecucion && !o.ejecucion.fin) { o.ejecucion.fin = o.ejecucion.reloj; for (const r of o.ejecucion.recursos) if (!r.hasta) r.hasta = o.ejecucion.fin; }
  logEv(o, 'Orden anulada', 'Desde ' + estadoName(desde) + ' · motivo: ' + o.anulacion.motivo + ' · se liberan las reservas; el historial se conserva' + (o.anulacion.acumulado ? ' · ' + fmtT(o.anulacion.acumulado) + ' t ya descargadas quedan registradas sin cierre de depósito' : ''), { rol, ...opts });
  transition(o, 'ANULADA', 'Anular orden', { rol, ...opts });
  if (o.origen?.tipo === 'lineup') recalcularNominacion(o.origen.id);
  for (const rv of reservasDeOrigen(o.origen).filter(x => x.orden === o.id || x.estado === 'Aplicada')) { rv.estado = 'A revalidar'; rv.orden = o.id; reservaLog(rv, 'A revalidar', 'la orden ' + o.id + ' se anuló: el área revalida si mantiene la capacidad reservada', { rol }); }
  return { ok: true };
}
function bandeja(rol) {
  const items = [];
  for (const o of ordersCtx()) {
    const c = condiciones(o);
    if (rol === 'COM') {
      if (o.estado === 'BORR') items.push({ o, motivo: o.devolucion && o.devolucion.a === 'BORR' ? 'Devuelta por ' + rolName(o.devolucion.rol) + ': ' + o.devolucion.motivo : 'Completar y crear la orden' });
      else if (['PEND_PLAN', 'PLANIF'].includes(o.estado) && !c.ok) items.push({ o, motivo: 'Regularizar: ' + c.motivos.join(' · ') });
      else if (cargosDe(o).some(x => x.estado === 'Pendiente de aprobación')) items.push({ o, motivo: 'Aprobar cargos adicionales al cliente' });
    } else if (rol === 'PLAN') {
      if (o.estado === 'PEND_PLAN') items.push({ o, motivo: o.devolucion && o.devolucion.a === 'PEND_PLAN' ? 'Devuelta por ' + rolName(o.devolucion.rol) + ': ' + o.devolucion.motivo : 'Asignar y confirmar recursos' });
    } else if (rol === 'OPS') {
      if (o.estado === 'PLANIF') items.push({ o, motivo: o.devolucion && o.devolucion.a === 'PLANIF' ? 'Devuelta por ' + rolName(o.devolucion.rol) + ': ' + o.devolucion.motivo : c.ok ? 'Iniciar operativo' : 'Pendiente de habilitación: ' + c.motivos.join(' · ') });
      else if (o.estado === 'EJEC') items.push({ o, motivo: o.devolucion && o.devolucion.a === 'EJEC' ? 'Devuelta por ' + rolName(o.devolucion.rol) + ': ' + o.devolucion.motivo : 'Registrar ejecución y finalizar' });
      else if (o.estado === 'PEND_CIERRE' && rolCierre(o) === 'OPS') items.push({ o, motivo: 'Cerrar operativo (servicio sin depósito)' });
    } else if (rol === 'DEP') {
      /* Operaciones y Depósito trabajan la orden en simultáneo mientras se descarga (revisión 17/09, S35) */
      if (o.estado === 'EJEC' && usaDeposito(o)) items.push({ o, motivo: 'Ingreso en curso: asignar o liberar recursos de depósito' });
      else if (o.estado === 'PEND_CIERRE' && rolCierre(o) === 'DEP') items.push({ o, motivo: 'Revisar y cerrar' });
    }
  }
  return items;
}
function arribosSinOrden() {
  const E = S.ctx.entidad; const hoy = isoDay(0); const out = [];
  for (const l of S.ops.lineups) if ((E === 'ALL' || l.terminal === E) && l.estado !== 'Zarpó') l.cargas.forEach((c, i) => {
    if (!c.bl || !(c.toneladas > 0)) return; /* bodega vacía: se completa con el tiempo */
    if (c.operador && !esOperadorPropio(c.operador)) return; /* la carga la opera otro */
    if (ordenesDeOrigen('lineup', l.id, i).length) return;
    out.push({ tipo: 'lineup', id: l.id, label: l.buque + ' · bodega ' + (c.bodega || i + 1) + ' · ' + c.bl, det: cli(c.cliente)?.nombre + ' · ' + prod(c.producto)?.nombre + ' · ' + fmtT(c.toneladas) + ' t' + (c.operador ? '' : ' · sin operador'), ts: l.etb });
  });
  for (const cu of S.ops.cupos) if ((E === 'ALL' || cu.terminal === E) && cu.estado !== 'Cumplido' && !ordenesDeOrigen('cupo', cu.id).length) out.push({ tipo: 'cupo', id: cu.id, label: cu.id + ' · cupo de camiones', det: cli(cu.cliente)?.nombre + ' · ' + prod(cu.producto)?.nombre + ' · ' + cu.camiones + ' camiones', ts: cu.fecha + 'T06:00:00' });
  for (const tr of S.ops.trenes) if ((E === 'ALL' || tr.terminal === E) && !ordenesDeOrigen('tren', tr.id).length) out.push({ tipo: 'tren', id: tr.id, label: tr.id + ' · ' + tr.formacion, det: cli(tr.cliente)?.nombre + ' · ' + prod(tr.producto)?.nombre + ' · ' + fmtT(tr.toneladas) + ' t', ts: tr.fecha + 'T08:00:00' });
  return out.sort((a, b) => a.ts.localeCompare(b.ts));
}
function contadores() {
  const rol = S.ctx.rol;
  if (rol === 'ARE') { const a = areaActiva(); const n = reservasARevalidar(a?.id).length; return { bandeja: n, ordenes: ordersCtx().length, deposito: 0, area: n }; }
  if (rol === 'LAR') return { bandeja: arribosSinOrden().length, ordenes: ordersCtx().length, deposito: 0 };
  if (rol === 'MD') return { bandeja: registrosEnValidacion().length, ordenes: ordersCtx().length, deposito: 0 };
  return { bandeja: bandeja(rol).length, ordenes: ordersCtx().length, deposito: ordersCtx().filter(o => (o.estado === 'EJEC' && usaDeposito(o)) || (o.estado === 'PEND_CIERRE' && rolCierre(o) === 'DEP')).length };
}

/* ---------- creación de órdenes ---------- */
function nextId() { const n = S.seq++; return 'OS-2026-' + String(n).padStart(4, '0'); }
function crearOrdenBase(spec) {
  const s = srv(spec.servicio);
  const ins = spec.instrumento ? instr(spec.instrumento) : null;
  const matriz = md().matrizEjecucion[spec.entidad] || {};
  const lineas = (s?.componentes || []).map(cId => ({
    componente: cId, bu: matriz[cId] || spec.bu, tarifa: ins?.tarifas?.[cId] ?? null,
    um: cId === 'DEP' ? (ins?.moneda || 'USD') + '/t/día' : cId === 'SRV' ? (ins?.moneda || 'USD') + '/h' : (ins?.moneda || 'USD') + '/t',
  }));
  const relacion = relacionDe(spec.destinatario, spec.entidad);
  const o = {
    id: spec.id || nextId(), creado: spec.creadoTs || nowIso(), entidad: spec.entidad, bu: spec.bu, medio: spec.medio, servicio: spec.servicio,
    destinatario: spec.destinatario, relacion, producto: spec.producto || null, instrumento: spec.instrumento || null, origen: spec.origen || null,
    toneladas: spec.toneladas || 0, ventana: spec.ventana, lineas, calidad: spec.calidad || calidadDeOrigen(spec.origen), presentacion: spec.presentacion || presentacionSugerida(spec.producto),
    contrato: ins ? { id: ins.id, tipo: ins.tipo, padre: ins.padre || null, moneda: ins.moneda, tarifas: Object.fromEntries((s?.componentes || []).filter(c => ins.tarifas[c] != null).map(c => [c, ins.tarifas[c]])), condiciones: clone(ins.condiciones || {}), vigenciaHasta: ins.vigenciaHasta, snapshot: spec.creadoTs || nowIso() } : null,
    aplicaNacionalizacion: !esMedioSinOrigen(spec.medio) && (s?.componentes || []).some(c => c === 'DES' || c === 'DEP') && spec.destinatario?.tipo === 'cliente',
    habilitaciones: Object.assign({ nacionalizada: false, nacRef: '', nacTs: null, nacPor: '', msConfirmado: false, msTs: null, msPor: '', msRef: '' }, spec.habilitaciones || {}),
    estado: 'BORR', recomendacion: null, plan: null, ejecucion: null, deposito: { ingresos: [], cierre: null }, historial: [], notas: spec.notas || '', detalle: spec.detalle ? clone(spec.detalle) : null,
  };
  logEv(o, 'Orden creada', 'Borrador creado por Comercial / Backoffice', { rol: 'COM', ts: o.creado });
  return o;
}

function calidadDeOrigen(g) {
  if (!g) return null;
  if (g.tipo === 'lineup') return byId(S.ops.lineups, g.id)?.cargas?.[g.cargaIdx]?.calidad || null;
  if (g.tipo === 'cupo') return byId(S.ops.cupos, g.id)?.calidad || null;
  if (g.tipo === 'tren') return byId(S.ops.trenes, g.id)?.calidad || null;
  return null;
}

/* ---------- reservas y disponibilidad ---------- */
function cantidadEnOrden(o, rid) {
  /* cantidad reservada/asignada del recurso rid en la orden o (plan o ejecución) */
  if (o.estado === 'EJEC' && o.ejecucion) {
    return sum(o.ejecucion.recursos.filter(r => r.rid === rid && !r.hasta), r => r.cantidad || 1);
  }
  const p = o.plan?.recursos; if (!p) return 0;
  if (p.muelle === rid || p.deposito === rid || p.balanza === rid) return 1;
  if ((p.equipos || []).includes(rid)) return esEquipoBuque(rid) ? (p.equiposBuqueN || 1) : 1;
  /* maquinaria: la afectación es la cantidad × el % de uso de esta orden; el remanente queda para otra (revisión 16/09) */
  const q = p.logistica?.[rid] || 0; const pct = esMaquinaria(rid) ? (p.maqPct?.[rid] ?? 100) / 100 : 1;
  return q * pct + (p.manos?.[rid] || 0) + (p.funciones?.[rid] || 0);
}
function ventanaReserva(o) {
  if (o.estado === 'EJEC' && o.ejecucion) return { inicio: o.ejecucion.inicio, fin: o.ejecucion.fin || (o.ventana.fin > o.ejecucion.reloj ? o.ventana.fin : o.ejecucion.reloj) };
  return o.ventana;
}
function reservasRecurso(rid, excludeId) {
  const res = [];
  for (const o of S.orders) {
    if (o.id === excludeId || !['PLANIF', 'EJEC'].includes(o.estado)) continue;
    const q = cantidadEnOrden(o, rid); if (q > 0) { const v = ventanaReserva(o); res.push({ o, cantidad: q, desde: v.inicio, hasta: v.fin }); }
  }
  return res;
}
function usoPico(rid, o) {
  /* máximo uso simultáneo del recurso por otras órdenes dentro de la ventana de o */
  const win = o.ventana;
  const rvs = reservasRecurso(rid, o.id).filter(rv => overlap(win.inicio, win.fin, rv.desde, rv.hasta));
  if (!rvs.length) return 0;
  const puntos = [win.inicio, ...rvs.map(rv => rv.desde)].filter(t => t >= win.inicio && t < win.fin);
  let pico = 0;
  for (const t of puntos) pico = Math.max(pico, sum(rvs.filter(rv => rv.desde <= t && t < rv.hasta), rv => rv.cantidad));
  return pico;
}
function mismoLineup(a, b) { return a.origen?.tipo === 'lineup' && b.origen?.tipo === 'lineup' && a.origen.id === b.origen.id; }
function chequearRecurso(rid, cantidad, o) {
  const errores = [], avisos = [];
  const r = recurso(rid); const tipo = recursoTipo(rid);
  if (!r) { errores.push('Recurso ' + rid + ' inexistente'); return { errores, avisos }; }
  const fam = prod(o.producto)?.familia;
  const c = condiciones(o);
  const win = o.ventana;
  if (r.estado === 'Fuera de servicio') errores.push(r.nombre + ': fuera de servicio');
  if (deBaja(r)) errores.push(r.nombre + ': dado de baja en la master data (' + fmtD(r._aud.baja_el) + ')'); else if (enValidacion(r)) errores.push(r.nombre + ': alta pendiente de validación por Máster data');
  /* M-34: método seguro del recurso (VA-M34): vencido con acción "bloquear" → sin disponibilidad; por vencer → observación */
  for (const msId of (r.metodo_seguro || [])) { const sit = msSituacion(msId, win.inicio); if (!sit.existe) continue; if (sit.bloquea) errores.push(r.nombre + ': método seguro ' + sit.txt + ' → sin disponibilidad'); else if (sit.porVencer || !sit.vigente) avisos.push(r.nombre + ': método seguro ' + sit.txt); }
  if (r.estado === 'En mantenimiento' && (!r.mantHasta || r.mantHasta >= dayOf(win.inicio))) errores.push(r.nombre + ': en mantenimiento' + (r.mantHasta ? ' hasta el ' + fmtD(r.mantHasta) : ''));
  if (r.entidad && r.entidad !== o.entidad) errores.push(r.nombre + ': pertenece a ' + entName(r.entidad) + '; un recurso de otra entidad se contrata como servicio entre empresas del grupo');
  if (tipo === 'equipo' && o.producto && r.tipo !== tipoEquipoPara(o)) errores.push(r.nombre + ': el producto es ' + (estadoFisico(o.producto) === 'liquido' ? 'líquido y corresponde un sistema de bombeo' : 'sólido y corresponden grúas'));
  else if (r.familias && fam && !r.familias.includes(fam)) errores.push(r.nombre + ': no compatible con ' + famName(fam));
  if (tipo === 'equipo' && r.soloCarga && !(srv(o.servicio)?.componentes || []).includes('CAR')) errores.push(r.nombre + ': solo aplica a servicios de carga');
  if (tipo === 'equipo' && r.buque) {
    /* equipos del buque: solo para las órdenes de ese lineup; sin superposición ni costo (SUPUESTO S14) */
    if (o.origen?.tipo !== 'lineup' || o.origen.id !== r.lineup) errores.push(r.nombre + ': corresponden al lineup ' + r.lineup + ', no al origen de esta orden');
    return { errores, avisos };
  }
  /* superposición: exclusivos (muelle, equipo) */
  if (tipo === 'muelle' || tipo === 'equipo') {
    for (const rv of reservasRecurso(rid, o.id)) {
      if (!overlap(win.inicio, win.fin, rv.desde, rv.hasta)) continue;
      if (tipo === 'muelle' && mismoLineup(o, rv.o)) continue; /* SUPUESTO A2: mismo buque comparte muelle */
      errores.push(r.nombre + ': reservado por ' + rv.o.id + ' (' + fmtDT(rv.desde) + ' → ' + fmtDT(rv.hasta) + ')');
    }
  }
  /* capacidad compartida: logística, manos, funciones */
  if (tipo === 'logistica') {
    const usados = usoPico(rid, o);
    if (usados + cantidad > r.cantidad) {
      if (esMaquinaria(rid)) avisos.push(r.nombre + ': ' + fmtN(usados, 1) + ' de ' + r.cantidad + ' ya afectadas en la ventana; ajustá el % de uso para compartir el remanente');
      else errores.push(r.nombre + ': capacidad insuficiente en la ventana (pico de ' + fmtN(usados, 1) + ' de ' + r.cantidad + ' ya asignados; se piden ' + cantidad + ')');
    }
  }
  /* personal propio: el mismo puesto puede estar en más de un operativo; el sistema reparte el % de afectación (revisión 16/09, S25) */
  if (tipo === 'funcion') {
    const af = afectacionPuesto(rid, o, cantidad);
    if (af.pct < 100) avisos.push(r.nombre + ': ' + af.demanda + ' personas pedidas sobre una dotación de ' + af.dotacion + ' en operativos simultáneos (' + af.compartido.join(', ') + ') → afectación del ' + af.pct + ' % en esta orden');
  }
  /* depósito: capacidad (órdenes que coinciden en el tiempo) y regla fiscal */
  if (tipo === 'deposito') {
    const comprometido = sum(reservasRecurso(rid, o.id).filter(rv => overlap(win.inicio, win.fin, rv.desde, rv.hasta)), rv => Math.max(0, rv.o.toneladas - (rv.o.ejecucion?.acumulado || 0)));
    const libre = r.capacidadT - r.ocupadoT - comprometido;
    if (o.toneladas > libre) errores.push(r.nombre + ': capacidad libre ' + fmtT(libre) + ' t (' + fmtT(o.toneladas) + ' t requeridas)');
    if (c.nac.aplica && !c.nac.ok && !r.fiscal) errores.push(r.nombre + ': la mercadería no está nacionalizada y el depósito no tiene habilitación fiscal');
    const dp = depositoPadre(rid); if (c.nac.aplica && !c.nac.ok && dp && dp.habilitacion_aduanera == null) errores.push(r.nombre + ': el depósito ' + dp.nombre + ' no tiene habilitación aduanera (M-10)');
    if (dp && dp.fecha_vencimiento_habilitaciones && dp.fecha_vencimiento_habilitaciones < dayOf(win.inicio)) errores.push(r.nombre + ': habilitaciones del depósito ' + dp.nombre + ' vencidas el ' + fmtD(dp.fecha_vencimiento_habilitaciones));
  }
  if (tipo === 'balanza') {
    if (c.nac.aplica && !c.nac.ok && !r.fiscal) errores.push(r.nombre + ': la mercadería no está nacionalizada y la balanza no es fiscal');
    if (c.nac.aplica && !c.nac.ok && r.fiscal && r.habilitacion_fiscal_vto && r.habilitacion_fiscal_vto < dayOf(win.inicio)) errores.push(r.nombre + ': habilitación fiscal vencida el ' + fmtD(r.habilitacion_fiscal_vto) + ' (M-26)');
    if (r.calibracionHasta && r.calibracionHasta < dayOf(win.fin)) avisos.push(r.nombre + ': calibración vence antes del fin de la ventana');
  }
  /* reservas de área (S24): lo reservado por un área para OTRO operativo se informa como aviso */
  for (const rv of reservasDeRecurso(rid, win, o.origen)) avisos.push(r.nombre + ': ' + fmtT(rv.cantidad) + ' reservado por ' + (areaMD(rv.area)?.nombre || rv.area) + ' para ' + origenLabel(rv.origen) + ' (' + fmtDT(rv.desde) + ' → ' + fmtDT(rv.hasta) + ')');
  if (tipo === 'muelle' && o.origen?.tipo === 'lineup') {
    const lu = byId(S.ops.lineups, o.origen.id);
    if (lu && lu.calado > r.calado) errores.push(r.nombre + ': calado insuficiente (' + r.calado + ' m) para el buque (' + lu.calado + ' m)');
    if (lu && lu.eslora > r.eslora) avisos.push(r.nombre + ': la eslora del buque (' + lu.eslora + ' m) supera el frente del muelle (' + r.eslora + ' m)');
  }
  return { errores, avisos };
}
function validarPlan(o, plan) {
  const errores = [], avisos = [];
  const s = srv(o.servicio); const comp = s?.componentes || []; const R = plan.recursos;
  const add = (res) => { errores.push(...res.errores); avisos.push(...res.avisos); };
  if (o.medio === 'BUQ') {
    if (!R.muelle) errores.push('Falta asignar el muelle'); else add(chequearRecurso(R.muelle, 1, o));
    const info = tipoEquipoInfo(tipoEquipoPara(o)); const org = origenEquipos(R);
    if (!(R.equipos || []).length) errores.push('Falta asignar ' + (org === 'buque' ? 'los ' + info.nombre.toLowerCase() + ' del buque' : 'al menos un equipo de descarga / carga del muelle (' + info.nombre.toLowerCase() + ')'));
    if (org === 'buque' && !equiposBuqueDe(o)) errores.push('Se eligieron equipos del buque pero el lineup no declara equipos propios: usá los del muelle o pedí a Logística de arribo que actualice el lineup');
    if (org === 'muelle' && (R.equipos || []).some(esEquipoBuque)) errores.push('El origen elegido es "del muelle" pero hay equipos del buque seleccionados');
    if (org === 'buque' && (R.equipos || []).some(e => !esEquipoBuque(e))) errores.push('El origen elegido es "del buque" pero hay equipos del muelle seleccionados');
  }
  for (const e of (R.equipos || [])) add(chequearRecurso(e, 1, o));
  if (s?.usaDeposito) { if (!R.deposito) errores.push('Falta asignar el depósito destino'); else add(chequearRecurso(R.deposito, 1, o)); }
  if (!sinOrigenOperativo(o)) { if (!R.balanza) errores.push('Falta asignar la balanza del circuito'); else add(chequearRecurso(R.balanza, 1, o)); }
  for (const [id, n] of Object.entries(R.logistica || {})) if (n > 0) add(chequearRecurso(id, n, o));
  for (const [id, n] of Object.entries(R.funciones || {})) if (n > 0) add(chequearRecurso(id, n, o));
  for (const [id, n] of Object.entries(R.manos || {})) if (n > 0) add(chequearRecurso(id, n, o));
  if ((comp.includes('DES') || comp.includes('CAR')) && o.medio === 'BUQ' && !sum(Object.values(R.manos || {}))) errores.push('Falta asignar personal externo (manos)');
  if (comp.includes('TRA') && !sinOrigenOperativo(o) && !(R.logistica?.['L-CAM'] || R.logistica?.['L-CAM-TT'])) avisos.push('El servicio incluye transporte y no hay camiones internos asignados');
  if (!sinOrigenOperativo(o) && o.medio !== 'BUQ' && !ritmoPlan(o, plan)) errores.push('Falta asignar equipos de descarga (tolva / pala) para camiones o vagones');
  const c = condiciones(o); if (!c.ok) avisos.push('La orden podrá planificarse pero no iniciar: ' + c.motivos.join(' · '));
  avisos.push(...(c.avisos || []));
  return { errores, avisos };
}
/* M-33: turno del régimen al que pertenece una fecha-hora */
function turnoDe(ts) {
  const h = new Date(ts).getHours(); const reg = md().regimenTurnos || [];
  const t = reg.find(x => { const a = +x.hora_desde.slice(0, 2), b = x.hora_hasta === '24:00' ? 24 : +x.hora_hasta.slice(0, 2); return a <= h && h < b; });
  return t ? t.id + ' ' + t.hora_desde.slice(0, 2) + '–' + t.hora_hasta.slice(0, 2) : '';
}

/* ---------- duración y costo ---------- */
function ritmoPlan(o, plan) {
  const p = md().parametros; const R = plan.recursos; let cap = 0;
  for (const id of (R.equipos || [])) { const r = recurso(id); if (!r) continue; cap += esEquipoBuque(id) ? (r.capacidadUnidad || r.capacidadTh) * Math.max(1, R.equiposBuqueN || r.cantidad || 1) : (r.capacidadTh || 0); }
  if (!cap) for (const [id, n] of Object.entries(R.logistica || {})) { const r = recurso(id); if (r?.capacidadTh) cap += r.capacidadTh * n * (esMaquinaria(id) ? (R.maqPct?.[id] ?? 100) / 100 : 1); }
  return cap * p.eficienciaEquipo;
}
function duracionPlan(o, plan) {
  const HT = duracionTurno(); const R = plan.recursos;
  const ritmo = ritmoPlan(o, plan);
  const horas = (!ritmo || !o.toneladas) ? hoursBetween(o.ventana.inicio, o.ventana.fin) : o.toneladas / ritmo;
  const calc = Math.max(1, Math.ceil(horas / HT));
  /* el Planificador puede fijar la cantidad de turnos; el sistema propone la calculada (revisión 16/09, S26) */
  const turnos = R && R.turnos ? Math.max(1, +R.turnos) : calc;
  return { horas, turnos, turnosCalc: calc, horasTurno: HT, horasTurnos: turnos * HT, ritmo: (!ritmo || !o.toneladas) ? 0 : ritmo, manual: !!(R && R.turnos && R.turnos !== calc) };
}
function costoItems(o, recursos, H, turnos) {
  const items = []; const p = md().parametros;
  const push = (rid, cant, monto, base) => { const r = recurso(rid); items.push({ rid, nombre: r?.nombre || rid, tipo: recursoTipo(rid), cantidad: cant, base, monto, bu: r?.bu || null }); };
  if (recursos.muelle) { const r = recurso(recursos.muelle); push(r.id, 1, r.costoHora * H, fmtUSD(r.costoHora) + '/h × ' + fmtN(H, 1) + ' h'); }
  for (const id of (recursos.equipos || [])) { const r = recurso(id); if (r) push(id, 1, r.costoHora * H, r.buque ? 'equipos del buque · sin costo para la terminal' : fmtUSD(r.costoHora) + '/h × ' + fmtN(H, 1) + ' h'); }
  for (const [id, n] of Object.entries(recursos.logistica || {})) {
    const r = recurso(id); if (!r || n <= 0) continue;
    const pct = esMaquinaria(id) ? (recursos.maqPct?.[id] ?? 100) : 100;
    push(id, n, r.costoHora * n * H * pct / 100, n + ' × ' + fmtUSD(r.costoHora) + '/h × ' + fmtN(H, 1) + ' h' + (pct !== 100 ? ' × ' + pct + ' % de uso' : ''));
  }
  for (const [id, n] of Object.entries(recursos.manos || {})) { const r = recurso(id); if (r && n > 0) push(id, n, r.costoTurno * n * turnos, n + ' × ' + fmtUSD(r.costoTurno) + '/turno × ' + turnos + ' turnos'); }
  /* puestos agregados o desafectados sobre la composición de las manos (revisión 16/09) */
  for (const [rol, dlt] of Object.entries(recursos.puestos || {})) {
    if (!dlt) continue; const pm = puestoMano(rol); if (!pm) continue;
    items.push({ rid: pm.id, nombre: (dlt > 0 ? 'Personal externo adicional · ' : 'Personal externo desafectado · ') + rol, tipo: 'mano', cantidad: dlt, base: (dlt > 0 ? '+' : '') + dlt + ' × ' + fmtUSD(pm.costoTurno) + '/turno × ' + turnos + ' turnos', monto: pm.costoTurno * dlt * turnos, bu: null });
  }
  for (const [id, n] of Object.entries(recursos.funciones || {})) {
    const r = recurso(id); if (!r || n <= 0) continue;
    const af = o.estado === 'BORR' || o.estado === 'PEND_PLAN' ? afectacionPuesto(id, o, n) : { pct: recursos.afectacion?.[id] ?? 100 };
    const pct = recursos.afectacion?.[id] ?? af.pct;
    push(id, n, r.costoTurno * n * turnos * pct / 100, n + ' × ' + fmtUSD(r.costoTurno) + '/turno × ' + turnos + ' turnos' + (pct !== 100 ? ' × ' + pct + ' % de afectación' : ''));
  }
  /* habilitación de puerto (revisión 16/09): costo por operativo según el puerto */
  if (recursos.habPuerto) { const hp = habilitacionPuerto(o); if (hp) items.push({ rid: hp.id, nombre: 'Habilitación de puerto · ' + hp.puerto.nombre, tipo: 'habilitacion', cantidad: 1, base: fmtUSD(hp.costo) + ' por operativo · ' + hp.detalle, monto: hp.costo, bu: null }); }
  if (recursos.deposito && o.toneladas) { const r = recurso(recursos.deposito); push(r.id, 1, r.costoTDia * o.toneladas * p.diasDepositoEstimados, fmtN(r.costoTDia, 2) + ' USD/t/día × ' + fmtT(o.toneladas) + ' t × ' + p.diasDepositoEstimados + ' día'); }
  /* kilómetros del detalle del servicio (Rental: traslado de maquinaria · Logística: km totales por camión) — S21 */
  const km = kmDetalle(o);
  if (km && km.kmCosto > 0) items.push({ rid: 'KM', nombre: km.nombre, tipo: 'km', cantidad: 1, base: km.base, monto: km.kmCosto, bu: o.bu || null });
  return items;
}
function costoPlan(o, plan) {
  const d = duracionPlan(o, plan);
  const items = costoItems(o, plan.recursos, d.horasTurnos, d.turnos);
  return { items, total: sum(items, i => i.monto), H: d.horasTurnos, turnos: d.turnos };
}
function cumplimiento(o, ritmoTh) {
  const rc = o.contrato?.condiciones?.ritmoComprometido; if (!rc || !ritmoTh) return 1;
  return Math.min(1, (ritmoTh * 24) / rc);
}
function resumenRecursos(recursos) {
  const parts = [];
  if (recursos.muelle) parts.push(recNombre(recursos.muelle).replace('Muelle ', 'M. '));
  for (const e of (recursos.equipos || [])) parts.push(esEquipoBuque(e) ? 'eq. del buque' : e);
  for (const [id, n] of Object.entries(recursos.logistica || {})) if (n) parts.push(n + '× ' + id.replace('L-', '').toLowerCase());
  for (const [id, n] of Object.entries(recursos.manos || {})) if (n) parts.push(n + ' mano' + (n > 1 ? 's' : ''));
  return parts.join(' · ');
}

/* ---------- recomendación (SUPUESTO S2) ---------- */
function combos2(arr) { const out = []; for (let i = 0; i < arr.length; i++) { out.push([arr[i]]); for (let j = i + 1; j < arr.length; j++) out.push([arr[i], arr[j]]); } return out; }
function recomendar(o) {
  const s = srv(o.servicio); const p = md().parametros; const fam = prod(o.producto)?.familia; const E = o.entidad; const comp = s?.componentes || [];
  if (sinOrigenOperativo(o) || !o.toneladas || !s) return null;
  const ok = (rid, n) => chequearRecurso(rid, n, o).errores.length === 0;
  const muelles = o.medio === 'BUQ' ? md().muelles.filter(m => m.entidad === E && ok(m.id, 1)) : [null];
  let equiposCand = [[]]; let origenEq = 'muelle';
  if (o.medio === 'BUQ') {
    /* SUPUESTO S14: solo equipos del tipo que corresponde al producto (grúas / bombeo); del muelle por defecto, del buque si no hay combinación factible con los propios */
    const eqs = equiposMuelleDe(o).filter(e => (e.familias || []).includes(fam) && (comp.includes('CAR') || !e.soloCarga) && ok(e.id, 1));
    equiposCand = combos2(eqs);
    const eqb = equiposBuqueDe(o);
    if (eqb && (p.origenEquiposPorDefecto === 'buque' || !equiposCand.length)) { equiposCand = [[eqb]]; origenEq = 'buque'; }
  }
  const depositos = s.usaDeposito ? md().depositos.filter(d => d.entidad === E && ok(d.id, 1)) : [null];
  const balanza = md().balanzas.find(b => b.entidad === E && ok(b.id, 1)) || null;
  const mano = md().manos.find(m => (m.familias || []).includes(fam) && (comp.includes('CAR') ? m.id === 'MANO-CARGA' : m.id !== 'MANO-CARGA')) || md().manos.find(m => m.familias.includes(fam)) || null;
  const camId = E === 'TT' ? 'L-CAM-TT' : 'L-CAM';
  const combos = [];
  for (const m of muelles) for (const eqSet of equiposCand) for (const dep of depositos) {
    const recursos = { muelle: m?.id || null, equipos: eqSet.map(e => e.id), equipoOrigen: o.medio === 'BUQ' ? origenEq : undefined, equiposBuqueN: origenEq === 'buque' ? (eqSet[0]?.cantidad || 1) : undefined, deposito: dep?.id || null, balanza: balanza?.id || null, funciones: {}, manos: {}, puestos: {}, logistica: {}, maqPct: {}, habPuerto: !!habilitacionPuerto(o) && o.medio === 'BUQ' };
    if (o.medio !== 'BUQ') delete recursos.equipoOrigen;
    const nEq = sum(eqSet, e => e.buque ? e.cantidad : 1);
    if (o.medio === 'BUQ') {
      if (mano) recursos.manos[mano.id] = tipoEquipoPara(o) === 'Bombeo' ? 1 : Math.max(1, nEq); /* una mano por grúa en operación */
      recursos.funciones['F-SUP'] = 1;
      const nGruas = sum(eqSet.filter(e => e.tipo === 'Grúa'), e => e.buque ? e.cantidad : 1);
      if (nGruas && !eqSet.some(e => e.buque)) recursos.funciones['F-GRU'] = nGruas; /* las grúas del buque las opera la tripulación */
      const tv = md().logistica.find(l => l.entidad === E && l.id.startsWith('L-TOLVA'));
      if (comp.includes('DES') && nGruas && tv) recursos.logistica[tv.id] = Math.max(1, Math.min(nGruas, tv.cantidad - usoPico(tv.id, o)));
    } else {
      recursos.funciones['F-SUP'] = 1; recursos.funciones['F-PAL'] = 1;
      recursos.logistica['L-TOLVA'] = 1; recursos.logistica['L-PALA'] = o.medio === 'FFCC' ? 2 : 1;
      if (mano && comp.includes('DES')) recursos.manos[mano.id] = 1;
    }
    if (recursos.balanza) recursos.funciones['F-BAL'] = 1;
    if (recursos.deposito) recursos.funciones['F-DEP'] = 2;
    const plan = { recursos };
    const ritmo = ritmoPlan(o, plan);
    if (comp.includes('TRA') && o.medio === 'BUQ') {
      const cam = recurso(camId); const cam3 = recurso(camId === 'L-CAM' ? 'L-CAM-3RO' : 'L-CAM-3RO-TT');
      if (cam && ritmo) {
        const n = Math.max(2, Math.ceil(ritmo * cam.cicloH / cam.capacidadT)); const disp = Math.max(0, cam.cantidad - usoPico(cam.id, o));
        recursos.logistica[camId] = Math.min(n, disp);
        if (n > disp && cam3) recursos.logistica[cam3.id] = n - disp; /* SUPUESTO S11: el faltante se cubre con transportista tercero */
      }
      recursos.funciones['F-PAL'] = 1;
    }
    const v = validarPlan(o, plan); if (v.errores.length) continue;
    const d = duracionPlan(o, plan); const c = costoPlan(o, plan);
    combos.push({ recursos, horas: d.horas, turnos: d.turnos, horasTurnos: d.horasTurnos, ritmo: d.ritmo, costo: c.total, cumplimiento: cumplimiento(o, d.ritmo) });
  }
  if (!combos.length) return { sinOpciones: true, generado: nowIso(), supuestos: supuestosRec(p), criterio: clone(p.pesos) };
  const maxC = Math.max(...combos.map(c => c.costo)), maxH = Math.max(...combos.map(c => c.horasTurnos));
  for (const c of combos) c.score = p.pesos.costo * (c.costo / maxC) + p.pesos.duracion * (c.horasTurnos / maxH) + p.pesos.cumplimiento * (1 - c.cumplimiento);
  combos.sort((a, b) => a.score - b.score);
  const best = combos[0];
  return { recursos: best.recursos, horas: best.horas, turnos: best.turnos, horasTurnos: best.horasTurnos, ritmo: best.ritmo, costo: best.costo, cumplimiento: best.cumplimiento, score: best.score,
    criterio: clone(p.pesos), supuestos: supuestosRec(p), generado: nowIso(), nCombos: combos.length,
    alternativas: combos.slice(1, 4).map(c => ({ resumen: resumenRecursos(c.recursos), horasTurnos: c.horasTurnos, costo: c.costo, ritmo: c.ritmo, cumplimiento: c.cumplimiento, score: c.score })) };
}
function supuestosRec(p) {
  return ['Pesos del puntaje: costo ' + fmtPct(p.pesos.costo) + ' · duración ' + fmtPct(p.pesos.duracion) + ' · cumplimiento contractual ' + fmtPct(p.pesos.cumplimiento) + ' (menor puntaje = mejor).',
    'Eficiencia operativa de equipos: ' + fmtPct(p.eficienciaEquipo) + ' sobre la capacidad nominal.', 'Turnos completos de ' + p.horasTurno + ' h; una mano por equipo y turno.',
    'Camiones internos = ritmo × ciclo (0,5 h) / 30 t por viaje.', 'Costos unitarios de referencia tomados del maestro de recursos.', 'Costo de depósito estimado sobre ' + p.diasDepositoEstimados + ' día de permanencia.',
    'Equipos de descarga / carga del tipo que corresponde al estado físico del producto (sólido → grúas · líquido → bombeo); ' + (p.origenEquiposPorDefecto === 'buque' ? 'del buque si el lineup los declara.' : 'del muelle por defecto; los del buque solo si no hay combinación factible con los propios.')];
}

/* ---------- planificación ---------- */
function confirmarPlan(o, recursos, motivoDesvio, opts = {}) {
  const plan = { recursos: congelarAfectacion(o, clone(recursos)) };
  const d = duracionPlan(o, plan); const c = costoPlan(o, plan);
  const rec = o.recomendacion;
  const difiere = !!rec && !rec.sinOpciones && JSON.stringify(normRec(rec.recursos)) !== JSON.stringify(normRec(recursos));
  o.plan = { recursos: plan.recursos, horas: d.horas, turnos: d.turnos, horasTurnos: d.horasTurnos, ritmo: d.ritmo, costo: c.total, items: c.items, cumplimiento: cumplimiento(o, d.ritmo),
    difiere, motivoDesvio: difiere ? (motivoDesvio || 'Sin motivo indicado') : null, confirmado: opts.ts || nowIso(), por: opts.usuario || userOf('PLAN'), version: (o.plan?.version || 0) + 1 };
  logEv(o, 'Planificación confirmada', resumenRecursos(recursos) + ' · ' + d.turnos + ' turnos · ' + fmtUSD(c.total) + (difiere ? ' · difiere de la recomendación (' + o.plan.motivoDesvio + ')' : ' · coincide con la recomendación'), { rol: 'PLAN', ...opts });
  aplicarReservas(o, { rol: 'PLAN', ...opts });
  transition(o, 'PLANIF', 'Confirmar planificación y enviar a operaciones', { rol: 'PLAN', ...opts });
}
function ajustarPlan(o, recursos, motivo, opts = {}) {
  /* Operaciones ajusta los recursos planificados antes de iniciar; el plan inicial se conserva para la comparativa */
  if (!o.planInicial) o.planInicial = clone(o.plan);
  const antes = resumenRecursos(o.plan.recursos);
  const plan = { recursos: congelarAfectacion(o, clone(recursos)) }; const d = duracionPlan(o, plan); const c = costoPlan(o, plan);
  o.plan = { recursos: plan.recursos, horas: d.horas, turnos: d.turnos, horasTurnos: d.horasTurnos, ritmo: d.ritmo, costo: c.total, items: c.items, cumplimiento: cumplimiento(o, d.ritmo),
    difiere: o.plan.difiere, motivoDesvio: o.plan.motivoDesvio, confirmado: o.plan.confirmado, por: o.plan.por, version: (o.plan.version || 1) + 1, ajustadoPor: opts.usuario || userOf('OPS'), ajustadoTs: opts.ts || nowIso(), motivoAjuste: motivo };
  aplicarReservas(o, { rol: 'OPS', ...opts });
  logEv(o, 'Recursos ajustados por Operaciones', antes + ' → ' + resumenRecursos(recursos) + ' · ' + d.turnos + ' turnos · ' + fmtUSD(c.total) + ' · motivo: ' + motivo + ' · el plan inicial (v' + o.planInicial.version + ') se conserva para la comparativa', { rol: 'OPS', ...opts });
}
/* el % de afectación del personal propio se calcula al confirmar y queda congelado en el plan (revisión 16/09, S25) */
function congelarAfectacion(o, recursos) {
  recursos.afectacion = {};
  for (const [id, n] of Object.entries(recursos.funciones || {})) if (n > 0) recursos.afectacion[id] = afectacionPuesto(id, o, n).pct;
  return recursos;
}
function normRec(r) {
  const clean = (obj) => Object.fromEntries(Object.entries(obj || {}).filter(([k, v]) => v > 0).sort());
  return { muelle: r.muelle || null, equipos: [...(r.equipos || [])].sort(), equipoOrigen: origenEquipos(r), deposito: r.deposito || null, balanza: r.balanza || null, funciones: clean(r.funciones), manos: clean(r.manos), logistica: clean(r.logistica) };
}

/* ---------- ejecución ---------- */
function iniciar(o, opts = {}) {
  const c = condiciones(o); if (!c.ok && !opts.force) return { ok: false, motivos: c.motivos };
  const now = opts.ts || nowIso();
  const inicio = opts.inicio || (o.ventana.inicio > now ? o.ventana.inicio : now);
  const R = o.plan.recursos; const recursos = [];
  const push = (rid, cantidad) => recursos.push({ rid, tipo: recursoTipo(rid), cantidad, desde: inicio, hasta: null, origen: 'plan' });
  if (R.muelle) push(R.muelle, 1); for (const e of (R.equipos || [])) push(e, 1); if (R.deposito) push(R.deposito, 1); if (R.balanza) push(R.balanza, 1);
  for (const [id, n] of Object.entries(R.logistica || {})) if (n) push(id, n);
  for (const [id, n] of Object.entries(R.manos || {})) if (n) push(id, n);
  for (const [id, n] of Object.entries(R.funciones || {})) if (n) push(id, n);
  o.ejecucion = { inicio, reloj: inicio, fin: null, tickets: [], acumulado: 0, recursos, demoras: [], diferencia: null };
  transition(o, 'EJEC', 'Iniciar operativo', { rol: 'OPS', ts: now });
  if (o.ventana.inicio > now && !opts.inicio) logEv(o, 'Aviso', 'Inicio simulado en el comienzo de la ventana operativa (' + fmtDT(inicio) + ')', { rol: 'OPS', ts: now });
  return { ok: true };
}
function activo(o, tipo) {
  /* último recurso activo del tipo (muelle, deposito, balanza…) en la ejecución; si no hay ejecución, el del plan */
  const ex = o.ejecucion;
  if (ex) { const act = ex.recursos.filter(r => (r.tipo || recursoTipo(r.rid)) === tipo && !r.hasta); if (act.length) return act[act.length - 1].rid; return null; }
  const R = o.plan?.recursos || {}; return tipo === 'deposito' ? R.deposito : tipo === 'balanza' ? R.balanza : tipo === 'muelle' ? R.muelle : null;
}
function ritmoActual(o) {
  const ex = o.ejecucion; if (!ex) return 0; const p = md().parametros; let cap = 0;
  for (const r of ex.recursos) { if (r.hasta) continue; const rr = recurso(r.rid); if (r.tipo === 'equipo') cap += (rr?.capacidadTh || 0) * (r.cantidad || 1); }
  if (!cap) for (const r of ex.recursos) { if (r.hasta) continue; const rr = recurso(r.rid); if (r.tipo === 'logistica' && rr?.capacidadTh) cap += rr.capacidadTh * (r.cantidad || 1); }
  return cap * p.eficienciaEquipo;
}
function enDemora(o, ts) { return o.ejecucion.demoras.some(d => ts >= d.inicio && ts < d.fin); }
function simular(o, horas, opts = {}) {
  const ex = o.ejecucion; if (!ex || o.estado !== 'EJEC') return 0;
  const ritmo = ritmoActual(o); if (!ritmo) return 0;
  const capCam = 30; const fin = addHours(ex.reloj, horas); let t = ex.reloj; let n = 0; let tons = 0;
  const bz = activo(o, 'balanza'), dep = activo(o, 'deposito');
  while (t < fin && ex.acumulado < o.toneladas && n < 2000) {
    t = addHours(t, capCam / ritmo);
    if (t > fin) break;
    if (enDemora(o, t)) continue;
    const neto = Math.min(Math.round((capCam + (rnd() - 0.5) * 3) * 100) / 100, Math.round((o.toneladas - ex.acumulado) * 100) / 100);
    const tara = Math.round((14 + rnd() * 1.5) * 100) / 100;
    ex.tickets.push({ id: 'TK-' + String(S.tk++).padStart(6, '0'), ts: t, camion: plate(), bruto: Math.round((neto + tara) * 100) / 100, tara, neto, balanza: bz, destino: dep });
    ex.acumulado = Math.round((ex.acumulado + neto) * 100) / 100; tons += neto; n++;
  }
  ex.reloj = ex.acumulado >= o.toneladas ? (t < fin ? t : fin) : fin;
  if (!opts.silent) logEv(o, 'Tickets de balanza', n + ' tickets · ' + fmtT(tons) + ' t · acumulado ' + fmtT(ex.acumulado) + ' t (' + fmtPct(ex.acumulado / o.toneladas) + ')', { rol: 'OPS', ts: opts.ts });
  return n;
}
function plate() { const L = 'ABCDEFGHJKLMNPRSTUVWXYZ'; const l = () => L[Math.floor(rnd() * L.length)]; const d = () => Math.floor(rnd() * 10); return 'A' + l() + ' ' + d() + d() + d() + ' ' + l() + l(); }
function ticketManual(o, data) {
  const ex = o.ejecucion; const neto = Math.round((data.bruto - data.tara) * 100) / 100;
  const ts = data.ts || ex.reloj;
  ex.tickets.push({ id: 'TK-' + String(S.tk++).padStart(6, '0'), ts, camion: data.camion || '—', bruto: data.bruto, tara: data.tara, neto, balanza: activo(o, 'balanza'), destino: activo(o, 'deposito'), manual: true });
  ex.acumulado = Math.round((ex.acumulado + neto) * 100) / 100; if (ts > ex.reloj) ex.reloj = ts;
  logEv(o, 'Ticket manual', data.camion + ' · neto ' + fmtN(neto, 2) + ' t', { rol: 'OPS' });
}
function agregarRecurso(o, data, opts = {}) {
  const ex = o.ejecucion; const r = recurso(data.rid);
  const rec = { rid: data.rid, tipo: recursoTipo(data.rid), cantidad: +data.cantidad || 1, desde: opts.desde || ex.reloj, hasta: null, origen: 'adicional', motivo: data.motivo, responsable: opts.usuario || userOf(opts.rol || 'OPS'), rol: opts.rol || 'OPS', ambito: ambitoRecurso(data.rid), atribuibleCliente: !!data.atribuible, respaldo: data.respaldo || '', aprobacion: null };
  ex.recursos.push(rec);
  logEv(o, 'Recurso agregado', (rec.cantidad > 1 ? rec.cantidad + '× ' : '') + (r?.nombre || data.rid) + ' · ' + ambitoInfo(rec.ambito).nombre + ' · motivo: ' + data.motivo + (rec.atribuibleCliente ? ' · gasto atribuible al cliente' : ''), { rol: opts.rol || 'OPS', ...opts });
  return rec;
}
function reemplazarRecurso(o, idx, nuevoRid, data, opts = {}) {
  const ex = o.ejecucion; const r = ex.recursos[idx]; if (!r || r.hasta) return null;
  r.hasta = ex.reloj; r.motivoLiberacion = 'Reemplazado por ' + recNombre(nuevoRid) + ' · ' + data.motivo;
  const nuevo = { rid: nuevoRid, tipo: recursoTipo(nuevoRid), cantidad: +data.cantidad || r.cantidad || 1, desde: ex.reloj, hasta: null, origen: 'reemplazo', motivo: data.motivo, responsable: userOf(opts.rol || 'OPS'), rol: opts.rol || 'OPS', ambito: ambitoRecurso(nuevoRid), atribuibleCliente: !!data.atribuible, respaldo: data.respaldo || '', aprobacion: null, reemplazaA: r.rid };
  ex.recursos.push(nuevo);
  logEv(o, 'Recurso reemplazado', recNombre(r.rid) + ' → ' + recNombre(nuevoRid) + (nuevo.cantidad > 1 ? ' ×' + nuevo.cantidad : '') + ' · motivo: ' + data.motivo + (nuevo.atribuibleCliente ? ' · gasto atribuible al cliente' : ''), { rol: opts.rol || 'OPS', ...opts });
  return nuevo;
}
function modificarCantidad(o, idx, nuevaCant, data, opts = {}) {
  const ex = o.ejecucion; const r = ex.recursos[idx]; if (!r || r.hasta) return null;
  const n = Math.max(0, +nuevaCant || 0); if (n === (r.cantidad || 1)) return null;
  r.hasta = ex.reloj; r.motivoLiberacion = 'Cantidad modificada ' + (r.cantidad || 1) + ' → ' + n + ' · ' + data.motivo;
  let nuevo = null;
  if (n > 0) { nuevo = { rid: r.rid, tipo: r.tipo, cantidad: n, desde: ex.reloj, hasta: null, origen: 'modificado', motivo: data.motivo, responsable: userOf(opts.rol || 'OPS'), rol: opts.rol || 'OPS', ambito: ambitoRecurso(r.rid), atribuibleCliente: !!data.atribuible && n > (r.cantidad || 1), respaldo: data.respaldo || '', aprobacion: null, cantidadAnterior: r.cantidad || 1 }; ex.recursos.push(nuevo); }
  logEv(o, 'Cantidad modificada', recNombre(r.rid) + ': ' + (r.cantidad || 1) + ' → ' + n + ' · motivo: ' + data.motivo + (nuevo?.atribuibleCliente ? ' · incremento atribuible al cliente' : ''), { rol: opts.rol || 'OPS', ...opts });
  return nuevo;
}
function liberarRecurso(o, idx, motivo, opts = {}) {
  const ex = o.ejecucion; const r = ex.recursos[idx]; if (!r || r.hasta) return;
  r.hasta = opts.hasta || ex.reloj; r.motivoLiberacion = motivo; r.liberadoPor = opts.rol || 'OPS';
  logEv(o, 'Recurso liberado', recNombre(r.rid) + ' · ' + ambitoInfo(ambitoRecurso(r.rid)).nombre + ' · motivo: ' + motivo, { rol: opts.rol || 'OPS', ...opts });
}
/* Operaciones registra la calidad efectiva de la mercadería (revisión 16/09, S28) */
function calidadesDe(prodId) { return (md().matrizCalidad || []).filter(x => x.producto === prodId); }
function registrarCalidad(o, calidad, motivo, opts = {}) {
  const antes = o.calidad || null; const val = (calidad || '').trim();
  if (!val) return { ok: false, motivo: 'indicá la calidad de la mercadería' };
  if (val === antes) return { ok: true, sinCambio: true };
  o.calidad = val; o.calidadRegistro = { por: opts.usuario || userOf(opts.rol || 'OPS'), rol: opts.rol || 'OPS', ts: opts.ts || nowIso(), motivo: motivo || '', anterior: antes };
  logEv(o, 'Calidad de la mercadería registrada', (antes ? 'de "' + antes + '" a ' : '') + '"' + val + '"' + (motivo ? ' · ' + motivo : '') + ' · queda en la orden para la comparativa por calidad y para el cierre', { rol: opts.rol || 'OPS', ...opts });
  return { ok: true, antes, calidad: val };
}
function registrarDemora(o, data, opts = {}) {
  const ex = o.ejecucion; const causa = byId(md().causasDemora, data.causa);
  const horas = Math.max(0, hoursBetween(data.inicio, data.fin));
  const d = { id: 'DM-' + (ex.demoras.length + 1), causa: data.causa, causaNombre: causa?.nombre || data.causa, inicio: data.inicio, fin: data.fin, horas, responsabilidad: data.responsabilidad, tercero: data.tercero || '', gasto: +data.gasto || 0, recuperable: !!data.recuperable, obs: data.obs || '', aprobacion: null, registradoPor: opts.usuario || userOf('OPS') };
  ex.demoras.push(d);
  if (d.fin > ex.reloj && o.estado === 'EJEC') ex.reloj = d.fin;
  logEv(o, 'Demora registrada', d.causaNombre + ' · ' + fmtH(horas) + ' · responsabilidad: ' + d.responsabilidad + (d.tercero ? ' (' + d.tercero + ')' : '') + (d.gasto ? ' · gasto ' + fmtUSD(d.gasto) + (d.recuperable ? ' recuperable' : '') : ''), { rol: 'OPS', ...opts });
  return d;
}
function finalizar(o, opts = {}) {
  const ex = o.ejecucion; ex.fin = opts.fin || ex.reloj;
  for (const r of ex.recursos) if (!r.hasta) r.hasta = ex.fin;
  ex.diferencia = Math.round((o.toneladas - ex.acumulado) * 100) / 100;
  const pct = o.toneladas ? ex.diferencia / o.toneladas : 0;
  logEv(o, 'Operativo finalizado', 'Acumulado ' + fmtT(ex.acumulado) + ' t de ' + fmtT(o.toneladas) + ' t' + (Math.abs(ex.diferencia) > 0.5 ? ' · diferencia ' + fmtN(ex.diferencia, 1) + ' t (' + fmtN(pct * 100, 2) + ' %)' : '') + ' · duración ' + fmtH(hoursBetween(ex.inicio, ex.fin)), { rol: 'OPS', ts: opts.ts });
  transition(o, 'PEND_CIERRE', 'Finalizar operativo y enviar a cierre', { rol: 'OPS', ts: opts.ts });
}
function tolerancia(id, def) { const t = byId(md().tolerancias || [], id); return t && t.estado === 'vigente' ? +t.tolerancia_por_defecto : def; }
function toleranciaMermaPct(o) { const t = o.contrato?.condiciones?.toleranciaMermaPct; return (t != null && t !== '') ? +t : tolerancia('TOL-MERMA-CIERRE', md().parametros.toleranciaMermaPct); }
/* La merma y el excedente ya no se cargan a mano: salen de lo que declara la balanza al finalizar el operativo (revisión 16/09, S27) */
function evaluarMerma(o) {
  const prev = o.toneladas || 0; const pesado = Math.round((o.ejecucion?.acumulado || 0) * 100) / 100;
  const dif = Math.round((prev - pesado) * 100) / 100;
  const merma = dif > 0 ? dif : 0, excedente = dif < 0 ? -dif : 0;
  const ajuste = excedente - merma; const pct = prev ? Math.abs(ajuste) / prev * 100 : 0; const tol = toleranciaMermaPct(o);
  const tickets = o.ejecucion?.tickets?.length || 0;
  return { previsto: prev, pesado, merma, excedente, ajuste, pct, tol, dentro: pct <= tol + 1e-9, diferencia: dif, tickets };
}
function cerrar(o, obs, opts = {}) {
  const rol = rolCierre(o);
  if (usaDeposito(o) && o.plan?.recursos?.deposito && o.ejecucion) {
    const d = recurso(o.plan.recursos.deposito); if (d && !o.deposito.ingresado) { d.ocupadoT = Math.round(d.ocupadoT + o.ejecucion.acumulado); o.deposito.ingresado = true; }
  }
  const ev = evaluarMerma(o);
  o.deposito.cierre = { ts: opts.ts || nowIso(), por: opts.usuario || userOf(rol), rol, obs: obs || '', merma: ev.merma, excedente: ev.excedente, pctAjuste: ev.pct, tolerancia: ev.tol, dentroTolerancia: ev.dentro, aprobacionComercial: opts.aprobacionComercial || null };
  o.cierreSnapshot = comparativas(o);
  logEv(o, 'Cierre del operativo', (obs ? obs + ' · ' : '') + (ev.merma ? 'merma ' + fmtN(ev.merma, 1) + ' t · ' : '') + (ev.excedente ? 'excedente ' + fmtN(ev.excedente, 1) + ' t · ' : '') + (ev.merma || ev.excedente ? fmtN(ev.pct, 2) + ' % sobre lo previsto (tolerancia ' + fmtN(ev.tol, 1) + ' %)' + (ev.dentro ? '' : ' · FUERA DE TOLERANCIA con aprobación de Comercial: ' + (opts.aprobacionComercial || '')) + ' · ' : '') + 'comparativas congeladas en el expediente', { rol, ...opts });
  transition(o, 'CERRADA', 'Cerrar operativo', { rol, ...opts });
}

/* ---------- costos reales, cargos, métricas ---------- */
function horasRecurso(o, r) { const ex = o.ejecucion; const fin = r.hasta || ex.fin || ex.reloj; return Math.max(0, hoursBetween(r.desde, fin)); }
function costoRecursoReal(o, r) {
  const rr = recurso(r.rid); if (!rr) return 0; const h = horasRecurso(o, r); const HT = md().parametros.horasTurno;
  if (r.tipo === 'mano' || r.tipo === 'funcion') return rr.costoTurno * (r.cantidad || 1) * Math.max(1, Math.ceil(h / HT));
  if (r.tipo === 'deposito') return rr.costoTDia * (o.ejecucion.acumulado || 0) * md().parametros.diasDepositoEstimados;
  if (r.tipo === 'balanza') return 0;
  return (rr.costoHora || 0) * (r.cantidad || 1) * h;
}
function costoReal(o) {
  const ex = o.ejecucion; if (!ex) return { items: [], total: 0 };
  const items = ex.recursos.map(r => ({ rid: r.rid, nombre: recNombre(r.rid), tipo: r.tipo, cantidad: r.cantidad, horas: horasRecurso(o, r), origen: r.origen, monto: costoRecursoReal(o, r), bu: recurso(r.rid)?.bu || null }));
  const km = kmDetalle(o); if (km && km.kmCosto > 0) items.push({ rid: 'KM', nombre: km.nombre, tipo: 'km', cantidad: 1, horas: 0, origen: 'plan', monto: km.kmCosto, bu: o.bu || null });
  return { items, total: sum(items, i => i.monto) };
}
function cargosDe(o) {
  const ex = o.ejecucion; if (!ex) return [];
  const out = [];
  ex.recursos.forEach((r, i) => { if (r.origen !== 'plan' && r.atribuibleCliente) { const monto = r.origen === 'modificado' && r.cantidadAnterior ? costoRecursoReal(o, r) * (1 - r.cantidadAnterior / r.cantidad) : costoRecursoReal(o, r); out.push({ ref: 'rec:' + i, tipo: r.origen === 'adicional' ? 'Recurso adicional' : r.origen === 'reemplazo' ? 'Recurso reemplazado' : 'Cantidad incrementada', concepto: (r.cantidad > 1 ? r.cantidad + '× ' : '') + recNombre(r.rid) + ' · ' + r.motivo, monto, respaldo: r.respaldo, estado: r.aprobacion || 'Pendiente de aprobación' }); } });
  ex.demoras.forEach((d, i) => { if (d.recuperable && d.gasto > 0) out.push({ ref: 'dem:' + i, tipo: 'Demora recuperable', concepto: d.causaNombre + ' · ' + fmtH(d.horas) + ' · ' + d.responsabilidad + (d.tercero ? ' (' + d.tercero + ')' : ''), monto: d.gasto, respaldo: d.obs, estado: d.aprobacion || 'Pendiente de aprobación' }); });
  return out;
}
function resolverCargo(o, ref, decision) {
  const [k, i] = ref.split(':'); const ex = o.ejecucion;
  const item = k === 'rec' ? ex.recursos[+i] : ex.demoras[+i]; if (!item) return;
  item.aprobacion = decision;
  logEv(o, 'Cargo adicional ' + decision.toLowerCase(), (k === 'rec' ? recNombre(item.rid) + ' · ' + item.motivo : item.causaNombre), { rol: 'COM' });
}
function metricasReal(o) {
  const ex = o.ejecucion; if (!ex) return null;
  const fin = ex.fin || ex.reloj; const horas = Math.max(0, hoursBetween(ex.inicio, fin));
  const horasDemora = sum(ex.demoras, d => d.horas);
  const HT = md().parametros.horasTurno;
  const equipos = ex.recursos.filter(r => r.tipo === 'equipo').map(r => r.rid);
  const manos = sum(ex.recursos.filter(r => r.tipo === 'mano'), r => r.cantidad || 1);
  const camiones = sum(ex.recursos.filter(r => r.rid.startsWith('L-CAM')), r => r.cantidad || 1);
  const costo = costoReal(o); const cargos = cargosDe(o);
  const ritmoBruto = horas ? ex.acumulado / horas : 0; const ritmoNeto = (horas - horasDemora) > 0 ? ex.acumulado / (horas - horasDemora) : 0;
  return { horas, turnos: Math.max(1, Math.ceil(horas / HT)), horasDemora, ritmoBruto, ritmoNeto, equipos, manos, camiones, costo: costo.total, items: costo.items, cargos: sum(cargos, c => c.monto), cargosLista: cargos, acumulado: ex.acumulado, cumplimiento: cumplimiento(o, ritmoNeto), fin };
}
function comparativas(o) {
  const rec = o.recomendacion && !o.recomendacion.sinOpciones ? o.recomendacion : null; const plan = o.planInicial || o.plan; const real = metricasReal(o);
  const num = (k, r, p, x, fmt, unit) => ({ k, rec: r, plan: p, real: x, fmt: fmt || (v => fmtN(v, 1)), unit });
  const lst = (k, r, p, x) => ({ k, rec: r, plan: p, real: x, text: true });
  const cnt = (R, tipo) => { if (!R) return null; if (tipo === 'manos') return sum(Object.values(R.manos || {})); if (tipo === 'cam') return (R.logistica?.['L-CAM'] || 0) + (R.logistica?.['L-CAM-TT'] || 0); return null; };
  return [
    num('Duración (h)', rec?.horasTurnos, plan?.horasTurnos, real?.horas, v => fmtN(v, 1)),
    num('Turnos de 6 h', rec?.turnos, plan?.turnos, real?.turnos, v => fmtN(v, 0)),
    num('Ritmo (t/h)', rec?.ritmo, plan?.ritmo, real?.ritmoNeto, v => fmtN(v, 0)),
    lst('Equipos', rec ? (rec.recursos.equipos || []).join(', ') : null, plan ? (plan.recursos.equipos || []).join(', ') : null, real ? [...new Set(real.equipos)].join(', ') : null),
    num('Manos por turno', cnt(rec?.recursos, 'manos'), cnt(plan?.recursos, 'manos'), real?.manos, v => fmtN(v, 0)),
    num('Camiones internos', cnt(rec?.recursos, 'cam'), cnt(plan?.recursos, 'cam'), real?.camiones, v => fmtN(v, 0)),
    num('Costo total (USD)', rec?.costo, plan?.costo, real?.costo, v => fmtT(v)),
    num('Cumplimiento ritmo contractual', rec?.cumplimiento, plan?.cumplimiento, real?.cumplimiento, v => fmtPct(v)),
    num('Demoras (h)', null, null, real?.horasDemora, v => fmtN(v, 1), 'soloReal'),
    num('Cargos adicionales (USD)', null, null, real?.cargos, v => fmtT(v), 'soloReal'),
    num('Merma (−) / excedente (+) (t)', null, null, o.deposito?.cierre ? (o.deposito.cierre.excedente || 0) - (o.deposito.cierre.merma || 0) : (real ? -(o.ejecucion.diferencia || 0) : null), v => fmtN(v, 1), 'soloReal'),
  ];
}
function ingresosDeposito(o) {
  /* ingresos a depósito derivados de tickets (SUPUESTO: cada ticket es un ingreso al destino) */
  const ex = o.ejecucion; if (!ex) return { toneladas: 0, tickets: 0, destino: null };
  return { toneladas: ex.acumulado, tickets: ex.tickets.length, destino: activo(o, 'deposito') || o.plan?.recursos?.deposito || null, ultimo: ex.tickets.length ? ex.tickets[ex.tickets.length - 1].ts : null };
}

/* ---------- recursos propios vs terceros: necesario (plan) vs aplicado (real) — SUPUESTO S11 ---------- */
function esTercero(rid) { const t = recursoTipo(rid); if (t === 'mano') return true; const r = recurso(rid); return !!(r && r.tercero); }
function horasEquivPlan(tipo, n, plan) { const HT = md().parametros.horasTurno; return (tipo === 'mano' || tipo === 'funcion') ? n * plan.turnos * HT : n * plan.horasTurnos; }
function recursosNecVsApl(o) {
  const plan = o.plan; if (!plan) return [];
  const HT = md().parametros.horasTurno; const rows = {};
  const add = (rid, n) => { const tipo = recursoTipo(rid); if (!rows[rid]) rows[rid] = { rid, nombre: recNombre(rid), tipo, clase: esTercero(rid) ? 'Tercero' : 'Propio', nec: 0, apl: 0, costoNec: 0, costoApl: 0, cantNec: 0, cantApl: 0 }; rows[rid].nec += horasEquivPlan(tipo, n, plan); rows[rid].cantNec += n; };
  const R = plan.recursos;
  if (R.muelle) add(R.muelle, 1); for (const e of (R.equipos || [])) add(e, 1); if (R.deposito) add(R.deposito, 1); if (R.balanza) add(R.balanza, 1);
  for (const [id, n] of Object.entries(R.logistica || {})) if (n) add(id, n);
  for (const [id, n] of Object.entries(R.manos || {})) if (n) add(id, n);
  for (const [id, n] of Object.entries(R.funciones || {})) if (n) add(id, n);
  for (const it of (plan.items || [])) if (rows[it.rid]) rows[it.rid].costoNec += it.monto;
  if (o.ejecucion) for (const r of o.ejecucion.recursos) {
    const tipo = r.tipo || recursoTipo(r.rid);
    if (!rows[r.rid]) rows[r.rid] = { rid: r.rid, nombre: recNombre(r.rid), tipo, clase: esTercero(r.rid) ? 'Tercero' : 'Propio', nec: 0, apl: 0, costoNec: 0, costoApl: 0, cantNec: 0, cantApl: 0 };
    const h = horasRecurso(o, r); const n = r.cantidad || 1;
    rows[r.rid].apl += (tipo === 'mano' || tipo === 'funcion') ? n * Math.max(1, Math.ceil(h / HT)) * HT : n * h;
    rows[r.rid].cantApl = Math.max(rows[r.rid].cantApl, n + (rows[r.rid].cantApl && r.origen === 'adicional' ? rows[r.rid].cantApl : 0));
    rows[r.rid].costoApl += costoRecursoReal(o, r);
  }
  return Object.values(rows).sort((a, b) => a.clase.localeCompare(b.clase) || a.nombre.localeCompare(b.nombre));
}
function resumenPropiosTerceros(o) {
  const out = { Propio: { nec: 0, apl: 0, costoNec: 0, costoApl: 0 }, Tercero: { nec: 0, apl: 0, costoNec: 0, costoApl: 0 } };
  for (const r of recursosNecVsApl(o)) { const t = out[r.clase]; t.nec += r.nec; t.apl += r.apl; t.costoNec += r.costoNec; t.costoApl += r.costoApl; }
  return out;
}
function dimensionDe(o, dim) {
  if (dim === 'muelle') return o.plan?.recursos?.muelle ? recNombre(o.plan.recursos.muelle) : (o.medio === 'BUQ' ? 'Sin muelle asignado' : 'Sin muelle (' + (medio(o.medio)?.nombre || o.medio) + ')');
  if (dim === 'mercaderia') return prod(o.producto)?.nombre || 'Sin producto';
  if (dim === 'calidad') return o.calidad || 'Sin calidad informada';
  if (dim === 'destino') return o.plan?.recursos?.deposito ? recNombre(o.plan.recursos.deposito) : 'Sin depósito';
  return '—';
}
function agregadoPropiosTerceros(dim, orders) {
  const g = {};
  for (const o of orders) {
    if (!o.plan) continue; const k = dimensionDe(o, dim); const r = resumenPropiosTerceros(o);
    if (!g[k]) g[k] = { k, n: 0, conReal: 0, t: 0, P: { nec: 0, apl: 0, costoNec: 0, costoApl: 0 }, T: { nec: 0, apl: 0, costoNec: 0, costoApl: 0 } };
    const x = g[k]; x.n++; if (o.ejecucion) x.conReal++; x.t += o.ejecucion?.acumulado || o.toneladas || 0;
    if (o.ejecucion) for (const c of ['nec', 'apl', 'costoNec', 'costoApl']) { x.P[c] += r.Propio[c]; x.T[c] += r.Tercero[c]; } /* necesario vs aplicado solo sobre órdenes con ejecución, para que la comparación sea homogénea */
  }
  return Object.values(g).sort((a, b) => b.t - a.t);
}

/* ---------- administración de arribos (Logística de arribo, SUPUESTO S10) ---------- */
function arriboLog(tipo, id, accion, detalle) {
  S.arriboLog = S.arriboLog || [];
  S.arriboLog.unshift({ ts: nowIso(), rol: S.ctx.rol, usuario: userOf(S.ctx.rol), tipo, id, accion, detalle: detalle || '' });
}
/* ---------- puertos, escalas, bodegas y nominación del lineup (revisión 17/09) ---------- */
function puertoMD(id) { return byId(md().puertos || [], id); }
function puertoNombre(id) { const p = puertoMD(id); return p ? p.nombre : (id || '—'); }
function puertoDeTerminal(ent) { return (md().puertos || []).find(p => p.terminal === ent)?.id || (ent === 'TT' ? 'PU-TT' : 'PU-SN'); }
function puertosPropios() { return (md().puertos || []).filter(p => p.propio); }
function operadorMD(id) { return byId(md().operadores || [], id); }
function operadorNombre(id) { return id ? (operadorMD(id)?.nombre || id) : 'Sin operador'; }
function esOperadorPropio(id) { const o = operadorMD(id); return !!(o && (o.propio || o.grupo)); }
/* secuencia de puertos del buque: un buque puede atracar en más de un puerto, cada uno con su ETA / ETB / ETC */
function escalasDe(lu) { return (lu.escalas && lu.escalas.length) ? lu.escalas : [{ n: 1, puerto: puertoDeTerminal(lu.terminal), eta: lu.eta, etb: lu.etb, etc: lu.etc, estado: lu.estado, propia: true }]; }
function escalaPropia(lu) { const es = escalasDe(lu); return es.find(e => e.propia) || es[0]; }
function puertosDeLineup(lu) { return escalasDe(lu).map(e => e.puerto); }
function cargasConBL(lu) { return (lu.cargas || []).filter(c => c.bl && c.toneladas > 0); }
function bodegasVacias(lu) { return (lu.cargas || []).filter(c => !(c.bl && c.toneladas > 0)).length; }
/* cantidades del buque vs nominadas: la nominación y su puerto salen de la orden de servicio */
function resumenLineup(lu) {
  const cs = lu.cargas || [];
  const ordenes = ordenesDeOrigen('lineup', lu.id).filter(o => o.estado !== 'ANULADA');
  const conBL = cargasConBL(lu);
  const porPuerto = {};
  for (const o of ordenes) { const pu = puertoDeOrdenNominada(o, lu); porPuerto[pu] = porPuerto[pu] || { t: 0, ordenes: [] }; porPuerto[pu].t += o.toneladas || 0; porPuerto[pu].ordenes.push(o); }
  return { total: sum(cs, c => c.toneladas || 0), bodegas: cs.length, vacias: bodegasVacias(lu), conBL: conBL.length,
    nominado: sum(ordenes, o => o.toneladas || 0), ordenes, porPuerto,
    propias: sum(cs.filter(c => esOperadorPropio(c.operador)), c => c.toneladas || 0),
    terceros: sum(cs.filter(c => c.operador && !esOperadorPropio(c.operador)), c => c.toneladas || 0),
    sinOperador: sum(cs.filter(c => (c.toneladas || 0) > 0 && !c.operador), c => c.toneladas || 0) };
}
/* el puerto de la nominación lo define la orden: se toma el de la entidad que presta el servicio */
function puertoDeOrdenNominada(o, lu) { const c = (lu.cargas || [])[o.origen?.cargaIdx]; return (c && c.puertoDescarga) || puertoDeTerminal(o.entidad || lu.terminal); }
/* evolución de las fechas declaradas: el dato de origen y todos los cambios en el orden en que se produjeron */
function fechasLogDe(lu) { return lu.fechasLog || []; }
function registrarCambioFecha(lu, campo, de, a, motivo, pu) {
  lu.fechasLog = lu.fechasLog || [];
  lu.fechasLog.push({ ts: nowIso(), rol: S.ctx.rol, puerto: pu || escalaPropia(lu).puerto, campo, de, a, motivo: motivo || '' });
}
function fechaOriginal(lu, campo) {
  const k = campo.toLowerCase(); const prim = (lu.fechasLog || []).find(f => f.campo === campo);
  return prim ? prim.de : (lu[k + '_original'] || lu[k]);
}

function nuevoLineup(d) {
  S.seqLU = S.seqLU || 39; const id = 'LU-2026-' + String(S.seqLU++).padStart(3, '0');
  /* M-08: el lineup referencia al buque; si no existe se da de alta (alta provisoria hasta homologar el IMO, ABM-5) */
  let bq = d.buqueId ? buque(d.buqueId) : null;
  if (!bq) { S.seqBQ = S.seqBQ || (md().buques.length + 1); bq = { id: 'BQ-' + String(S.seqBQ++).padStart(2, '0'), numero_imo: d.imo || '', nombre: d.buque, eslora_m: +d.eslora || 0, calado_m: +d.calado || 0, cantidad_bodegas: +d.bodegas || 5, plan_bodegas: '—', estado: d.imo ? 'activo' : 'alta provisoria (72 h)', equipos_propios: d.equiposBuque || null, _aud: { origen: 'alta provisoria', creado_por: userOf(S.ctx.rol), creado_el: nowIso() } }; md().buques.push(bq); }
  else if (d.equiposBuque !== undefined) bq.equipos_propios = d.equiposBuque || null;
  const lu = { id, buque: bq.nombre, buqueId: bq.id, bandera: d.bandera || '—', eslora: bq.eslora_m, calado: bq.calado_m, agencia: d.agencia || 'AG-01', terminal: d.terminal, eta: d.eta, etb: d.etb, etc: d.etc, estado: 'Anunciado', estadoM17: 'proyectado', tipo: d.tipo || undefined, cargas: d.cargas,
    puerto: d.terminal === 'TT' ? 'PL-TT' : 'PU-SN', operador: d.terminal === 'TT' ? 'TT' : 'TYS', cliente: d.cargas[0]?.cliente || null, producto: d.cargas[0]?.producto || null, shipper: cli(d.cargas[0]?.cliente)?.nombre || '',
    tipo_operacion: d.tipo === 'Carga' ? 'carga' : 'descarga', plano_de_carga: (bq.cantidad_bodegas || 5) + ' bodegas · ' + fmtT(sum(d.cargas, c => c.toneladas) / (bq.cantidad_bodegas || 5)) + ' t por bodega (declarado por la agencia)',
    toneladas_nominadas_total_buque: sum(d.cargas, c => c.toneladas), toneladas_para_tys: 0, alcance_geografico: 'solo San Nicolás',
    eta_original: d.eta, eta_: null, sitio_atraque: '', operativo_vinculado: '', orden_puerto: S.ops.lineups.filter(l => l.terminal === d.terminal).length + 1,
    buque_texto_fuente: (bq.nombre || '').toUpperCase(), cliente_texto_fuente: (cli(d.cargas[0]?.cliente)?.nombre || '').toUpperCase(), producto_texto_fuente: (prod(d.cargas[0]?.producto)?.nombre || '').toUpperCase(),
    fuente: 'manual', fecha_version: isoDay(0), homologado: !!d.imo, nominado_a_tys: false, observaciones: '' };
  /* una línea de carga por bodega del buque: pueden quedar vacías y completarse con el tiempo */
  const nBod = bq.cantidad_bodegas || d.cargas.length || 5;
  lu.cargas.forEach((c, i) => { c.bodega = i + 1; if (!c.puertoDescarga) c.puertoDescarga = puertoDeTerminal(d.terminal); if (c.operador === undefined) c.operador = d.terminal === 'TT' ? 'TT' : 'TYS'; });
  while (lu.cargas.length < nBod) lu.cargas.push({ bodega: lu.cargas.length + 1, bl: '', cliente: null, producto: null, calidad: '', toneladas: 0, puertoDescarga: null, operador: null });
  /* secuencia de puertos: la escala propia y las que siga el buque después */
  lu.escalas = (d.escalas && d.escalas.length ? d.escalas : [{ puerto: puertoDeTerminal(d.terminal), eta: d.eta, etb: d.etb, etc: d.etc }]).map((e, i) => ({ n: i + 1, puerto: e.puerto, eta: e.eta, etb: e.etb, etc: e.etc, estado: e.estado || 'Anunciado', propia: !!puertoMD(e.puerto)?.propio && (e.propia !== false) }));
  if (!lu.escalas.some(e => e.propia)) lu.escalas[0].propia = true;
  const prop = escalaPropia(lu); lu.eta = prop.eta; lu.etb = prop.etb; lu.etc = prop.etc;
  lu.eta_original = lu.eta; lu.etb_original = lu.etb; lu.etc_original = lu.etc; lu.fechasLog = [];
  lu.toneladas_nominadas_total_buque = sum(lu.cargas, c => c.toneladas || 0);
  S.ops.lineups.push(lu);
  const conBL = cargasConBL(lu);
  arriboLog('Lineup', id, 'Alta', lu.buque + ' · ' + lu.escalas.map(e => puertoNombre(e.puerto)).join(' → ') + ' · ' + lu.cargas.length + ' bodegas (' + conBL.length + ' con BL' + (bodegasVacias(lu) ? ', ' + bodegasVacias(lu) + ' vacías' : '') + ')' + (conBL.length ? ' · ' + fmtT(sum(conBL, c => c.toneladas)) + ' t' : '') + ' · ETB ' + fmtDT(lu.etb) + ' · ' + equiposBuqueTxt(lu)); return lu;
}
function equiposBuqueTxt(lu) { const bq = buqueDeLineup(lu); const eb = bq ? bq.equipos_propios : lu?.equiposBuque; return eb ? tipoEquipoInfo(eb.tipo).buque.toLowerCase() + ': ' + eb.cantidad + ' × ' + eb.capacidadTh + ' t/h' : 'sin equipos propios'; }
function editarLineup(lu, d, opts = {}) {
  const cambios = [];
  for (const k of ['eta', 'etb', 'etc', 'estado', 'calado', 'eslora']) if (d[k] !== undefined && d[k] !== '' && String(d[k]) !== String(lu[k])) {
    cambios.push(k.toUpperCase() + ': ' + (k.startsWith('et') ? fmtDT(lu[k]) + ' → ' + fmtDT(d[k]) : lu[k] + ' → ' + d[k]));
    if (k.startsWith('et')) registrarCambioFecha(lu, k.toUpperCase(), lu[k], d[k], opts.motivo || opts.detalle || '');
    lu[k] = (k === 'calado' || k === 'eslora') ? +d[k] : d[k];
  }
  /* escalas siguientes del buque (rotación de puertos) */
  if (d.escalas) {
    const antes = escalasDe(lu).map(e => puertoNombre(e.puerto) + ' ' + fmtDT(e.etb)).join(' → ');
    lu.escalas = d.escalas.map((e, i) => ({ n: i + 1, puerto: e.puerto, eta: e.eta, etb: e.etb, etc: e.etc, estado: e.estado || 'Anunciado', propia: !!e.propia }));
    if (!lu.escalas.some(e => e.propia)) lu.escalas[0].propia = true;
    const p2 = escalaPropia(lu); lu.eta = p2.eta; lu.etb = p2.etb; lu.etc = p2.etc;
    const desp = lu.escalas.map(e => puertoNombre(e.puerto) + ' ' + fmtDT(e.etb)).join(' → ');
    if (antes !== desp) cambios.push('Secuencia de puertos: ' + antes + ' → ' + desp);
  } else if (lu.escalas && lu.escalas.length) { const p2 = escalaPropia(lu); p2.eta = lu.eta; p2.etb = lu.etb; p2.etc = lu.etc; if (d.estado) p2.estado = d.estado; }
  const bq = buqueDeLineup(lu);
  if (d.equiposBuque !== undefined && JSON.stringify(d.equiposBuque) !== JSON.stringify((bq ? bq.equipos_propios : lu.equiposBuque) || null)) { const antes = equiposBuqueTxt(lu); if (bq) bq.equipos_propios = d.equiposBuque || null; else lu.equiposBuque = d.equiposBuque || null; cambios.push('Equipos del buque (M-08 ' + (bq?.id || '') + '): ' + antes + ' → ' + equiposBuqueTxt(lu)); }
  if (d.estado && d.estado !== lu.estadoM17) { const map = { Anunciado: 'proyectado', Confirmado: 'confirmado', 'En rada': 'en rada', 'En operación': 'operando', Zarpó: 'finalizado', Cancelado: 'cancelado' }; lu.estadoM17 = map[d.estado] || d.estado; }
  if (cambios.length) {
    arriboLog('Lineup', lu.id, opts.accion || 'Modificación', cambios.join(' · ') + (opts.detalle ? ' · ' + opts.detalle : ''));
    for (const o of ordenesDeOrigen('lineup', lu.id)) if (['BORR', 'PEND_PLAN', 'PLANIF'].includes(o.estado) && (d.etb || d.etc)) {
      const antes = ventanaTxt(o.ventana);
      o.ventana = opts.shiftH != null ? { inicio: addHours(o.ventana.inicio, opts.shiftH), fin: addHours(o.ventana.fin, opts.shiftH) } : { inicio: lu.etb, fin: lu.etc };
      logEv(o, 'Ventana actualizada desde el lineup', antes + ' → ' + ventanaTxt(o.ventana) + (opts.detalle ? ' · ' + opts.detalle : ''), { rol: opts.rol || 'LAR' });
      if (o.estado === 'PEND_PLAN' && o.recomendacion) o.recomendacion = recomendar(o); /* la ventana cambió: se regenera solo si aún no fue planificada */
    }
  }
  return cambios;
}
/* ---------- cambio de fecha de arribo desde la planificación (SUPUESTO S15) ---------- */
function conflictosRecurso(rid, o) {
  const win = o.ventana; const r = recurso(rid); const tipo = recursoTipo(rid); if (!r || r.buque || !(tipo === 'muelle' || tipo === 'equipo')) return [];
  return reservasRecurso(rid, o.id).filter(rv => overlap(win.inicio, win.fin, rv.desde, rv.hasta) && !(tipo === 'muelle' && mismoLineup(o, rv.o))).map(rv => ({ orden: rv.o.id, desde: rv.desde, hasta: rv.hasta }));
}
function arriboModificable(o) {
  if (!['BORR', 'PEND_PLAN', 'PLANIF'].includes(o.estado)) return { ok: false, motivo: 'la orden ya inició' };
  const g = o.origen; if (!g) return { ok: false, motivo: 'sin origen operativo' };
  if (g.tipo === 'lineup') { const lu = byId(S.ops.lineups, g.id); return ['Anunciado', 'Confirmado'].includes(lu?.estado) ? { ok: true, lu } : { ok: false, motivo: 'el buque está ' + (lu?.estado || '—').toLowerCase() + '; la fecha ya no puede moverse' }; }
  if (g.tipo === 'cupo') { const cu = byId(S.ops.cupos, g.id); return ['Solicitado', 'Confirmado', 'Vigente'].includes(cu?.estado) ? { ok: true, cu } : { ok: false, motivo: 'el cupo está ' + (cu?.estado || '—').toLowerCase() }; }
  if (g.tipo === 'tren') { const tr = byId(S.ops.trenes, g.id); return ['Previsto', 'Anunciado', 'Confirmado'].includes(tr?.estado) ? { ok: true, tr } : { ok: false, motivo: 'el operativo está ' + (tr?.estado || '—').toLowerCase() }; }
  return { ok: false, motivo: 'el origen no tiene fecha de arribo' };
}
function proponerArribo(o, rid) {
  const confl = conflictosRecurso(rid, o); if (!confl.length) return null;
  const hasta = confl.map(c => c.hasta).sort().pop();
  const HT = md().parametros.horasTurno; const t = new Date(hasta);
  const next = Math.ceil((t.getHours() + (t.getMinutes() > 0 ? 1 : 0)) / HT) * HT; t.setHours(next, 0, 0, 0); /* primer turno completo libre */
  const dur = hoursBetween(o.ventana.inicio, o.ventana.fin); const inicio = t.toISOString();
  return { inicio, fin: addHours(inicio, dur), conflictos: confl, rid };
}
function cambiarFechaArribo(o, nuevoInicio, motivo, opts = {}) {
  const antes = clone(o.ventana); const shiftH = hoursBetween(antes.inicio, nuevoInicio); const g = o.origen;
  const detalle = 'a pedido de Planificación por ' + o.id + (motivo ? ': ' + motivo : '');
  if (g?.tipo === 'lineup') { const lu = byId(S.ops.lineups, g.id); editarLineup(lu, { eta: addHours(lu.eta, shiftH), etb: addHours(lu.etb, shiftH), etc: addHours(lu.etc, shiftH) }, { shiftH, detalle, rol: 'PLAN', accion: 'Cambio de fecha de arribo' }); }
  else {
    o.ventana = { inicio: nuevoInicio, fin: addHours(antes.fin, shiftH) };
    if (g?.tipo === 'cupo') { const cu = byId(S.ops.cupos, g.id); const f0 = cu.fecha; cu.fecha = dayOf(nuevoInicio); arriboLog('Cupo', cu.id, 'Cambio de fecha de arribo', fmtD(f0) + ' → ' + fmtD(cu.fecha) + ' · ' + detalle); }
    if (g?.tipo === 'tren') { const tr = byId(S.ops.trenes, g.id); const f0 = tr.fecha; tr.fecha = dayOf(nuevoInicio); arriboLog('Operativo ferroviario', tr.id, 'Cambio de fecha de arribo', fmtD(f0) + ' → ' + fmtD(tr.fecha) + ' · ' + detalle); }
    if (o.estado === 'PEND_PLAN' && o.recomendacion) o.recomendacion = recomendar(o);
  }
  logEv(o, 'Fecha de arribo modificada', ventanaTxt(antes) + ' → ' + ventanaTxt(o.ventana) + (motivo ? ' · motivo: ' + motivo : ''), { rol: 'PLAN', ...opts });
  return { antes, despues: clone(o.ventana), shiftH };
}
function nuevoCupo(d) {
  S.seqCU = S.seqCU || 121; const id = 'CU-2026-' + String(S.seqCU++).padStart(3, '0');
  const cu = { id, fecha: d.fecha, franja: d.franja, terminal: d.terminal, cliente: d.cliente, producto: d.producto, calidad: d.calidad || '', camiones: +d.camiones || 0, toneladas: +d.toneladas || 0, transportista: d.transportista || 'PRV-03', estado: 'Solicitado',
    planta: d.terminal === 'TT' ? 'PL-TT' : 'PL-SN', contrato: d.contrato || null, turno: d.turno || 'todo el día', tipo_movimiento: d.tipo_movimiento || 'ingreso', porton: d.porton || 'P1', confirmacion_planta: 'pendiente', observaciones: d.observaciones || '' };
  S.ops.cupos.push(cu); arriboLog('Cupo', id, 'Alta', cli(cu.cliente)?.nombre + ' · ' + prod(cu.producto)?.nombre + ' · ' + cu.camiones + ' camiones · ' + fmtD(cu.fecha)); return cu;
}
function nuevoTren(d) {
  S.seqTR = S.seqTR || 11; const id = 'TR-2026-' + String(S.seqTR++).padStart(3, '0');
  const tr = { id, fecha: d.fecha, operador: d.operador || 'Nuevo Central Argentino', formacion: d.formacion, vagones: +d.vagones || 0, toneladas: +d.toneladas || 0, terminal: d.terminal, cliente: d.cliente, producto: d.producto, calidad: d.calidad || '', tipo: d.tipo || 'Arribo para descarga', estado: 'Previsto',
    planta: d.terminal === 'TT' ? 'PL-TT' : 'PL-SN', operador_ferroviario: (d.operador || '').includes('Belgrano') ? 'PRV-06' : 'PRV-05', contrato: d.contrato || null, tipo_movimiento: (d.tipo || '').includes('carga') && !(d.tipo || '').includes('descarga') ? 'egreso' : 'ingreso', playa_desvio: d.playa_desvio || '', ventana_desde: null, ventana_hasta: null, observaciones: '' };
  S.ops.trenes.push(tr); arriboLog('Operativo ferroviario', id, 'Alta', tr.formacion + ' · ' + tr.vagones + ' vagones · ' + fmtD(tr.fecha)); return tr;
}
function cambiarEstadoArribo(tipo, id, estado) {
  const list = tipo === 'lineup' ? S.ops.lineups : tipo === 'cupo' ? S.ops.cupos : S.ops.trenes; const x = byId(list, id); if (!x) return;
  arriboLog(tipo === 'lineup' ? 'Lineup' : tipo === 'cupo' ? 'Cupo' : 'Operativo ferroviario', id, 'Cambio de estado', x.estado + ' → ' + estado); x.estado = estado;
  if (tipo === 'lineup') { const map = { Anunciado: 'proyectado', Confirmado: 'confirmado', 'En rada': 'en rada', 'En operación': 'operando', Zarpó: 'finalizado', Cancelado: 'cancelado' }; x.estadoM17 = map[estado] || estado; }
}

/* ---------- solicitudes de habilitación de recursos a la BU dueña (SUPUESTO S13) ---------- */
function duenoRecurso(rid) {
  const r = recurso(rid); const tipo = recursoTipo(rid); if (!r) return null;
  if (r.buque) return { tipo: 'agencia', id: r.agencia, nombre: agName(r.agencia), detalle: 'equipos del buque · fuera del inventario de la terminal' };
  if (tipo === 'funcion' || tipo === 'mano') { const dep = byId(md().departamentos, 'PERS'); return { tipo: 'departamento', id: 'PERS', nombre: dep?.nombre || 'Personal', detalle: tipo === 'mano' ? 'vía proveedor ' + provName(r.proveedor) : 'dotación propia' }; }
  if (r.bu) return { tipo: 'bu', id: r.bu, nombre: buName(r.bu), detalle: entName(bu(r.bu)?.entidad) };
  return { tipo: 'entidad', id: r.entidad, nombre: entName(r.entidad), detalle: '' };
}
function solicitudesDe(o) { return (S.solicitudesRecurso || []).filter(x => x.orden === o.id); }
function solicitudPendiente(o, rid) { return solicitudesDe(o).find(x => x.rid === rid && x.estado === 'Pendiente'); }
function crearSolicitudRecurso(o, rid, cantidad, motivos) {
  S.solicitudesRecurso = S.solicitudesRecurso || []; S.seqSR = S.seqSR || 1;
  const d = duenoRecurso(rid); const id = 'SR-2026-' + String(S.seqSR++).padStart(3, '0');
  const sr = { id, orden: o.id, rid, tipo: recursoTipo(rid), cantidad: cantidad || 1, destinatario: d, motivos: motivos || [], estado: 'Pendiente', creado: nowIso(), por: userOf('PLAN'), rol: 'PLAN',
    operacion: { servicio: srv(o.servicio)?.nombre, destinatario: destinatarioNombre(o.destinatario), producto: prod(o.producto)?.nombre || '—', calidad: o.calidad || '', toneladas: o.toneladas, ventana: clone(o.ventana), origen: origenInfo(o)?.label || '', entidad: entName(o.entidad), ritmoComprometido: o.contrato?.condiciones?.ritmoComprometido || null } };
  S.solicitudesRecurso.unshift(sr);
  logEv(o, 'Solicitud de habilitación de recurso', id + ' → ' + d.nombre + ' · ' + recNombre(rid) + (sr.cantidad > 1 ? ' ×' + sr.cantidad : '') + ' · ' + (motivos || []).join(' · '), { rol: 'PLAN' });
  return sr;
}
function responderSolicitud(sr, decision, detalle) {
  const o = orden(sr.orden); const r = recurso(sr.rid); const tipo = sr.tipo; const cambios = [];
  if (decision === 'Habilitado' && r) {
    if (r.estado && r.estado !== 'Operativo') { cambios.push(r.nombre + ': ' + r.estado + ' → Operativo'); r.estado = 'Operativo'; r.mantHasta = null; }
    if (tipo === 'logistica') { const falta = Math.max(0, sr.cantidad - Math.max(0, r.cantidad - (o ? usoPico(sr.rid, o) : 0))); if (falta > 0) { r.cantidad += falta; cambios.push(r.nombre + ': +' + falta + ' unidades (total ' + r.cantidad + ')'); } }
    if (tipo === 'funcion') { const falta = Math.max(0, sr.cantidad - Math.max(0, r.dotacion - (o ? usoPico(sr.rid, o) : 0))); if (falta > 0) { r.dotacion += falta; cambios.push(r.nombre + ': dotación +' + falta + ' (total ' + r.dotacion + ')'); } }
    if (tipo === 'deposito' && o) { const libre = r.capacidadT - r.ocupadoT; if (o.toneladas > libre) { const lib = Math.min(r.ocupadoT, o.toneladas - libre); r.ocupadoT -= lib; cambios.push(r.nombre + ': se liberan ' + fmtT(lib) + ' t de espacio'); } }
  }
  sr.estado = decision; sr.respuesta = { ts: nowIso(), por: (sr.destinatario?.nombre || 'BU') + ' (simulado por ' + userOf(S.ctx.rol) + ')', detalle: detalle || '', cambios };
  if (o) logEv(o, 'Respuesta a solicitud ' + sr.id, decision + (detalle ? ' · ' + detalle : '') + (cambios.length ? ' · ' + cambios.join(' · ') : ''), { rol: S.ctx.rol, usuario: sr.respuesta.por });
  return cambios;
}

/* ---------- recursos que referencian un método seguro (M-34.aplica_a) ---------- */
function recursosConMS(msId) {
  const m = md(); const out = [];
  for (const list of [m.muelles, m.equipos, m.depositos, m.depositosPadre || [], m.balanzas, m.logistica, m.manos, m.funciones, m.transporte || [], m.puntosConexion || [], m.insumos || [], m.servicios]) for (const r of list) if ((r.metodo_seguro || []).includes(msId)) out.push(r);
  return out;
}

/* ---------- alertas ---------- */
function alertas() {
  const out = [];
  for (const o of ordersCtx()) {
    const c = condiciones(o);
    if (['PEND_PLAN', 'PLANIF'].includes(o.estado) && !c.ok) out.push({ tipo: 'warn', txt: o.id + ': ' + c.motivos.join(' · '), orden: o.id });
    if (o.estado === 'EJEC') { const m = metricasReal(o); const rc = o.contrato?.condiciones?.ritmoComprometido; if (rc && m.ritmoNeto * 24 < rc * 0.9 && m.horas > 2) out.push({ tipo: 'warn', txt: o.id + ': ritmo neto ' + fmtN(m.ritmoNeto * 24, 0) + ' t/día por debajo del comprometido (' + fmtT(rc) + ')', orden: o.id }); }
    if (cargosDe(o).some(x => x.estado === 'Pendiente de aprobación')) out.push({ tipo: 'info', txt: o.id + ': cargos adicionales pendientes de aprobación', orden: o.id });
  }
  const pendSR = (S.solicitudesRecurso || []).filter(x => x.estado === 'Pendiente'); if (pendSR.length) out.push({ tipo: 'info', txt: pendSR.length + ' solicitud' + (pendSR.length > 1 ? 'es' : '') + ' de habilitación de recursos pendiente' + (pendSR.length > 1 ? 's' : '') + ' de respuesta de la BU dueña (' + [...new Set(pendSR.map(x => x.destinatario?.nombre))].join(', ') + ')', screen: 'recursos' });
  for (const ms of md().metodosSeguros) { const sit = msSituacion(ms.id); const afecta = ms.recurso ? recursosConMS(ms.id).map(r => r.nombre).join(', ') : (ms.productos || []).map(p => prod(p)?.nombre).concat((ms.familias || []).map(famName)).join(', ');
    if (!sit.vigente) out.push({ tipo: sit.bloquea ? 'crit' : 'warn', txt: 'Método seguro ' + ms.id + ' vencido el ' + fmtD(ms.vigenciaHasta) + (afecta ? ' → ' + afecta : '') + (sit.bloquea ? ' sin disponibilidad' : ' (alertar y registrar desvío)'), screen: 'md', mdTab: 'SEG' });
    else if (sit.porVencer) out.push({ tipo: 'warn', txt: 'Método seguro ' + ms.id + ' vence en ' + sit.diasRest + ' días (' + fmtD(ms.vigenciaHasta) + ')' + (afecta ? ' → ' + afecta + ' con observaciones' : '') + ' · aviso a ' + (byId(md().departamentos, ms.responsable)?.nombre || 'Seguridad'), screen: 'md', mdTab: 'SEG' }); }
  for (const e of md().equipos) if (e.proximo_mantenimiento_h && e.horometro_actual >= e.proximo_mantenimiento_h - 40 && e.estado === 'Operativo' && (S.ctx.entidad === 'ALL' || e.entidad === S.ctx.entidad)) out.push({ tipo: 'info', txt: e.nombre + ': preventiva a ' + fmtN(e.proximo_mantenimiento_h - e.horometro_actual, 0) + ' h (horómetro ' + fmtN(e.horometro_actual, 0) + ' / ' + fmtN(e.proximo_mantenimiento_h, 0) + ') — VA-M12', screen: 'md', mdTab: 'PLAN' });
  for (const e of md().equipos) if (e.estado !== 'Operativo' && (S.ctx.entidad === 'ALL' || e.entidad === S.ctx.entidad)) out.push({ tipo: 'info', txt: e.nombre + ': ' + e.estado.toLowerCase() + (e.mantHasta ? ' hasta el ' + fmtD(e.mantHasta) : ''), screen: 'recursos' });
  return out;
}

/* =====================================================================
   ESCENARIO INICIAL — 11 órdenes que cubren los 9 casos
   ===================================================================== */
function buildSeedOrders() {
  seedRng(20260915);
  const L = (id) => byId(S.ops.lineups, id);
  const win = (lu, i, off) => ({ inicio: lu.etb, fin: lu.etc });
  const add = (o) => { S.orders.push(o); return o; };
  const COM = { rol: 'COM' }, PLAN = { rol: 'PLAN' }, OPS = { rol: 'OPS' }, DEP = { rol: 'DEP' };

  /* OS-0001 — cerrada, referencia del caso 1 */
  {
    const lu = L('LU-2026-028');
    const o = add(crearOrdenBase({ id: 'OS-2026-0001', entidad: 'TYS', bu: null, medio: 'BUQ', servicio: 'SRV-DTD', destinatario: { tipo: 'cliente', id: 'CLI-01' }, producto: 'UREA', instrumento: 'CTO-2026-014',
      origen: { tipo: 'lineup', id: lu.id, cargaIdx: 0 }, toneladas: 15000, ventana: { inicio: lu.etb, fin: lu.etc }, creadoTs: iso(-9, 10, 12),
      habilitaciones: { nacionalizada: true, nacRef: 'Despacho 26001IC04000871K', nacTs: iso(-9, 10, 30), nacPor: 'M. Ferreyra', msConfirmado: true, msTs: iso(-9, 10, 32), msPor: 'M. Ferreyra', msRef: 'PRO-SEG-014 rev. 3' } }));
    transition(o, 'PEND_PLAN', 'Crear y enviar a planificación', { rol: 'COM', ts: iso(-9, 10, 35) });
    o.recomendacion = recomendar(o); o.recomendacion.generado = iso(-8, 9, 0);
    confirmarPlan(o, o.recomendacion.recursos, null, { ts: iso(-8, 9, 20), usuario: 'J. Ledesma' });
    iniciar(o, { ts: iso(-6, 15, 0), inicio: iso(-6, 15, 0) });
    simular(o, 20, { silent: true }); logEv(o, 'Parte de turno', 'T4 y T1: ' + fmtT(o.ejecucion.acumulado) + ' t acumuladas', { rol: 'OPS', ts: iso(-5, 11, 0) });
    registrarDemora(o, { causa: 'CD-01', inicio: iso(-5, 11, 0), fin: iso(-5, 13, 0), responsabilidad: 'Fuerza mayor', tercero: '', gasto: 0, recuperable: false, obs: 'Lluvia intensa; bodegas cerradas' }, { ts: iso(-5, 13, 5) });
    simular(o, 40, { silent: true }); logEv(o, 'Parte de turno', 'Descarga completada: ' + fmtT(o.ejecucion.acumulado) + ' t', { rol: 'OPS', ts: o.ejecucion.reloj });
    finalizar(o, { ts: o.ejecucion.reloj });
    o.deposito.ingresado = true; /* la ocupación inicial de Celda 1 ya incluye este ingreso */
    cerrar(o, 'Sin observaciones. Merma dentro de tolerancia.', { ts: iso(-3, 12, 0), usuario: 'S. Villalba' });
  }

  /* OS-0006 — en ejecución (casos 6, 7 y 8) — urea MV Nordic Sun */
  let os6;
  {
    const lu = L('LU-2026-031');
    const o = add(crearOrdenBase({ id: 'OS-2026-0006', entidad: 'TYS', bu: null, medio: 'BUQ', servicio: 'SRV-DTD', destinatario: { tipo: 'cliente', id: 'CLI-01' }, producto: 'UREA', instrumento: 'CTO-2026-014',
      origen: { tipo: 'lineup', id: lu.id, cargaIdx: 0 }, toneladas: 18000, ventana: { inicio: lu.etb, fin: iso(2, 14) }, creadoTs: iso(-4, 9, 5),
      habilitaciones: { nacionalizada: true, nacRef: 'Despacho 26001IC04001102R', nacTs: iso(-4, 9, 20), nacPor: 'M. Ferreyra', msConfirmado: true, msTs: iso(-4, 9, 22), msPor: 'M. Ferreyra', msRef: 'PRO-SEG-014 rev. 3' } }));
    transition(o, 'PEND_PLAN', 'Crear y enviar a planificación', { rol: 'COM', ts: iso(-4, 9, 25) });
    o.recomendacion = recomendar(o); o.recomendacion.generado = iso(-3, 8, 40);
    confirmarPlan(o, { muelle: 'M1', equipos: ['G1'], deposito: 'D1', balanza: 'BZ1', funciones: { 'F-SUP': 1, 'F-GRU': 1, 'F-BAL': 1, 'F-DEP': 2, 'F-PAL': 1 }, manos: { 'MANO-GRANEL': 1 }, logistica: { 'L-CAM': 6, 'L-TOLVA': 1 } }, 'Reserva del equipo para otro operativo', { ts: iso(-3, 9, 0), usuario: 'J. Ledesma' });
    iniciar(o, { ts: iso(-1, 15, 0), inicio: iso(-1, 15, 0) });
    simular(o, 9, { silent: true }); logEv(o, 'Parte de turno', 'T3/T4: ' + fmtT(o.ejecucion.acumulado) + ' t acumuladas', { rol: 'OPS', ts: iso(0, 0, 5) });
    registrarDemora(o, { causa: 'CD-06', inicio: iso(0, 0, 0), fin: iso(0, 0, 30), responsabilidad: 'Propia', tercero: '', gasto: 0, recuperable: false, obs: 'Relevo de manos' }, { ts: iso(0, 0, 35) });
    simular(o, 9.5, { silent: true }); logEv(o, 'Tickets de balanza', 'Acumulado ' + fmtT(o.ejecucion.acumulado) + ' t (' + fmtPct(o.ejecucion.acumulado / o.toneladas) + ')', { rol: 'OPS', ts: o.ejecucion.reloj });
    os6 = o;
  }

  /* OS-0007 — planificada, misma escala (DAP, segunda carga de MV Nordic Sun) → A2 */
  {
    const lu = L('LU-2026-031');
    const o = add(crearOrdenBase({ id: 'OS-2026-0007', entidad: 'TYS', bu: null, medio: 'BUQ', servicio: 'SRV-DTD', destinatario: { tipo: 'cliente', id: 'CLI-02' }, producto: 'DAP', instrumento: 'CTO-2026-021',
      origen: { tipo: 'lineup', id: lu.id, cargaIdx: 1 }, toneladas: 9000, ventana: { inicio: iso(2, 14), fin: lu.etc }, creadoTs: iso(-4, 9, 40),
      habilitaciones: { nacionalizada: true, nacRef: 'Despacho 26001IC04001103S', nacTs: iso(-4, 10, 0), nacPor: 'M. Ferreyra', msConfirmado: true, msTs: iso(-4, 10, 2), msPor: 'M. Ferreyra', msRef: 'PRO-SEG-014 rev. 3' } }));
    transition(o, 'PEND_PLAN', 'Crear y enviar a planificación', { rol: 'COM', ts: iso(-4, 10, 5) });
    o.recomendacion = recomendar(o); o.recomendacion.generado = iso(-3, 9, 30);
    confirmarPlan(o, { muelle: 'M1', equipos: ['G1'], deposito: 'D1', balanza: 'BZ1', funciones: { 'F-SUP': 1, 'F-GRU': 1, 'F-BAL': 1, 'F-DEP': 2, 'F-PAL': 1 }, manos: { 'MANO-GRANEL': 1 }, logistica: { 'L-CAM': 6, 'L-TOLVA': 1 } }, 'Preferencia operativa del supervisor', { ts: iso(-3, 9, 45), usuario: 'J. Ledesma' });
  }

  /* OS-0002 — planificada, NO nacionalizada (caso 2) — DAP MV Río Carcarañá */
  {
    const lu = L('LU-2026-032');
    const o = add(crearOrdenBase({ id: 'OS-2026-0002', entidad: 'TYS', bu: null, medio: 'BUQ', servicio: 'SRV-DTD', destinatario: { tipo: 'cliente', id: 'CLI-02' }, producto: 'DAP', instrumento: 'CTO-2026-021',
      origen: { tipo: 'lineup', id: lu.id, cargaIdx: 0 }, toneladas: 12000, ventana: { inicio: lu.etb, fin: lu.etc }, creadoTs: iso(-2, 11, 0),
      habilitaciones: { nacionalizada: false, msConfirmado: true, msTs: iso(-2, 11, 10), msPor: 'M. Ferreyra', msRef: 'PRO-SEG-014 rev. 3' } }));
    logEv(o, 'Advertencia registrada', 'Mercadería no nacionalizada: se envía a planificación; el inicio quedará bloqueado hasta regularizar', { rol: 'COM', ts: iso(-2, 11, 12) });
    transition(o, 'PEND_PLAN', 'Crear y enviar a planificación', { rol: 'COM', ts: iso(-2, 11, 12) });
    o.recomendacion = recomendar(o); o.recomendacion.generado = iso(-1, 8, 50);
    confirmarPlan(o, o.recomendacion.recursos, null, { ts: iso(-1, 9, 10), usuario: 'J. Ledesma' });
  }

  /* OS-0003 — borrador, método seguro vencido (caso 3) — UAN MT Delta Queen */
  {
    const lu = L('LU-2026-034');
    add(crearOrdenBase({ id: 'OS-2026-0003', entidad: 'TYS', bu: null, medio: 'BUQ', servicio: 'SRV-DES', destinatario: { tipo: 'cliente', id: 'CLI-03' }, producto: 'UAN', instrumento: 'OC-2026-0877',
      origen: { tipo: 'lineup', id: lu.id, cargaIdx: 0 }, toneladas: 9000, ventana: { inicio: lu.etb, fin: lu.etc }, creadoTs: iso(0, 8, 15),
      habilitaciones: { nacionalizada: true, nacRef: 'Despacho 26001IC04001140M', nacTs: iso(0, 8, 20), nacPor: 'M. Ferreyra', msConfirmado: false } }));
  }

  /* OS-0004 — pendiente de planificación, recurso no disponible (caso 4) — big bags MV Baltic Trader */
  {
    const lu = L('LU-2026-033');
    const o = add(crearOrdenBase({ id: 'OS-2026-0004', entidad: 'TYS', bu: null, medio: 'BUQ', servicio: 'SRV-DES', destinatario: { tipo: 'cliente', id: 'CLI-02' }, producto: 'NPK-BB', instrumento: 'CTO-2026-021',
      origen: { tipo: 'lineup', id: lu.id, cargaIdx: 0 }, toneladas: 6000, ventana: { inicio: lu.etb, fin: lu.etc }, creadoTs: iso(-1, 16, 0),
      habilitaciones: { nacionalizada: true, nacRef: 'Despacho 26001IC04001121T', nacTs: iso(-1, 16, 10), nacPor: 'M. Ferreyra', msConfirmado: true, msTs: iso(-1, 16, 12), msPor: 'M. Ferreyra', msRef: 'PRO-SEG-009 rev. 2' } }));
    transition(o, 'PEND_PLAN', 'Crear y enviar a planificación', { rol: 'COM', ts: iso(-1, 16, 15) });
  }

  /* OS-0005 — pendiente de planificación, plan distinto de la recomendación (caso 5) — urea MV Ocean Harvest */
  {
    const lu = L('LU-2026-036');
    const o = add(crearOrdenBase({ id: 'OS-2026-0005', entidad: 'TYS', bu: null, medio: 'BUQ', servicio: 'SRV-DTD', destinatario: { tipo: 'cliente', id: 'CLI-01' }, producto: 'UREA', instrumento: 'CTO-2026-014',
      origen: { tipo: 'lineup', id: lu.id, cargaIdx: 0 }, toneladas: 20000, ventana: { inicio: lu.etb, fin: lu.etc }, creadoTs: iso(0, 9, 30),
      habilitaciones: { nacionalizada: true, nacRef: 'Despacho 26001IC04001155P', nacTs: iso(0, 9, 40), nacPor: 'M. Ferreyra', msConfirmado: true, msTs: iso(0, 9, 41), msPor: 'M. Ferreyra', msRef: 'PRO-SEG-014 rev. 3' } }));
    transition(o, 'PEND_PLAN', 'Crear y enviar a planificación', { rol: 'COM', ts: iso(0, 9, 45) });
  }

  /* OS-0008 — pendiente de cierre (Depósito) — cupo de camiones de maíz */
  {
    const cu = byId(S.ops.cupos, 'CU-2026-117');
    const o = add(crearOrdenBase({ id: 'OS-2026-0008', entidad: 'TYS', bu: null, medio: 'CAM', servicio: 'SRV-DES', destinatario: { tipo: 'cliente', id: 'CLI-04' }, producto: 'MAIZ', instrumento: 'CTO-2026-033',
      origen: { tipo: 'cupo', id: cu.id }, toneladas: 1200, ventana: { inicio: iso(-1, 6), fin: iso(-1, 18) }, creadoTs: iso(-3, 14, 0),
      habilitaciones: { nacionalizada: true, nacRef: 'Mercadería nacional (origen interno)', nacTs: iso(-3, 14, 5), nacPor: 'M. Ferreyra', msConfirmado: false } }));
    transition(o, 'PEND_PLAN', 'Crear y enviar a planificación', { rol: 'COM', ts: iso(-3, 14, 10) });
    o.recomendacion = recomendar(o); o.recomendacion.generado = iso(-2, 10, 0);
    confirmarPlan(o, o.recomendacion.recursos, null, { ts: iso(-2, 10, 15), usuario: 'J. Ledesma' });
    iniciar(o, { ts: iso(-1, 6, 10), inicio: iso(-1, 6, 10) });
    simular(o, 4, { silent: true });
    registrarDemora(o, { causa: 'CD-01', inicio: iso(-1, 10, 10), fin: iso(-1, 11, 40), responsabilidad: 'Fuerza mayor', tercero: '', gasto: 0, recuperable: false, obs: 'Lluvia; se suspende la descarga de camiones' }, { ts: iso(-1, 11, 45) });
    simular(o, 8, { silent: true }); logEv(o, 'Tickets de balanza', o.ejecucion.tickets.length + ' camiones pesados · ' + fmtT(o.ejecucion.acumulado) + ' t', { rol: 'OPS', ts: o.ejecucion.reloj });
    finalizar(o, { ts: o.ejecucion.reloj });
  }

  /* OS-0009 — servicio interno: Rental → Depósitos (caso 9a) */
  {
    const o = add(crearOrdenBase({ id: 'OS-2026-0009', entidad: 'TYS', bu: 'TYS-RENT', medio: 'INT', servicio: 'SRV-ALQM', destinatario: { tipo: 'bu', id: 'TYS-DEP' }, producto: null, instrumento: 'ACU-INT-TYS',
      origen: null, detalle: { tipo: 'rental', maquinarias: { 'L-PALA': 1 }, kmEntrega: 3, kmDevolucion: 3 }, toneladas: 0, ventana: { inicio: iso(1, 6), fin: iso(3, 18) }, creadoTs: iso(0, 8, 50), notas: 'Pala cargadora para reacomodo de Celda 2' }));
    transition(o, 'PEND_PLAN', 'Crear y enviar a planificación', { rol: 'COM', ts: iso(0, 8, 55) });
  }

  /* OS-0010 — servicio entre empresas del grupo: Logística TyS → Terminal Timbúes (caso 9b) */
  {
    const o = add(crearOrdenBase({ id: 'OS-2026-0010', entidad: 'TYS', bu: 'TYS-LOG', medio: 'INT', servicio: 'SRV-LOGI', destinatario: { tipo: 'entidad', id: 'TT' }, producto: 'UREA', instrumento: 'ICO-GRP-2026',
      origen: null, detalle: { tipo: 'logistica', camion: 'L-CAM', cantidad: 4, origen: 'PL-TT', destino: 'PL-SN', km: kmEntre('PL-TT', 'PL-SN') }, toneladas: 3000, ventana: { inicio: iso(2, 6), fin: iso(3, 18) }, creadoTs: iso(0, 9, 10), notas: 'Transporte de 3.000 t de urea desde Celda 3 Timbúes a Celda 1 TyS',
      habilitaciones: { nacionalizada: true, msConfirmado: true, msTs: iso(0, 9, 12), msPor: 'M. Ferreyra', msRef: 'PRO-SEG-014 rev. 3' } }));
    transition(o, 'PEND_PLAN', 'Crear y enviar a planificación', { rol: 'COM', ts: iso(0, 9, 15) });
    confirmarPlan(o, { muelle: null, equipos: [], deposito: null, balanza: null, funciones: { 'F-SUP': 1 }, manos: {}, logistica: { 'L-CAM': 4 } }, null, { ts: iso(0, 10, 0), usuario: 'J. Ledesma' });
  }

  /* OS-0011 — Terminal Timbúes: urea MV Costa Brava (contexto multiempresa) */
  {
    const lu = L('LU-2026-037');
    const o = add(crearOrdenBase({ id: 'OS-2026-0011', entidad: 'TT', bu: null, medio: 'BUQ', servicio: 'SRV-DTD', destinatario: { tipo: 'cliente', id: 'CLI-01' }, producto: 'UREA', instrumento: 'CTO-2026-014',
      origen: { tipo: 'lineup', id: lu.id, cargaIdx: 0 }, toneladas: 15000, ventana: { inicio: lu.etb, fin: lu.etc }, creadoTs: iso(0, 10, 20),
      habilitaciones: { nacionalizada: true, nacRef: 'Despacho 26002IC04000412Q', nacTs: iso(0, 10, 25), nacPor: 'M. Ferreyra', msConfirmado: true, msTs: iso(0, 10, 26), msPor: 'M. Ferreyra', msRef: 'PRO-SEG-014 rev. 3' } }));
    transition(o, 'PEND_PLAN', 'Crear y enviar a planificación', { rol: 'COM', ts: iso(0, 10, 30) });
  }

  S.orders.sort((a, b) => a.id.localeCompare(b.id));
  S.seq = 12;
}

/* =====================================================================
   MÁSTER DATA — permisos por rol, ABM genérico, validación y registro de cambios (SUPUESTO S17)
   ===================================================================== */
/* reservas de área del escenario inicial (revisión 16/09) y nominación del lineup desde los operativos */
function buildSeedReservas() {
  const R = (d) => { const res = crearReservaArea(d, { rol: 'ARE', usuario: userOf('ARE'), ts: d.ts }); if (res.ok) res.rv.creadoTs = d.ts || res.rv.creadoTs; return res.ok ? res.rv : null; };
  const lu = (id) => byId(S.ops.lineups, id);
  const l36 = lu('LU-2026-036'), l33 = lu('LU-2026-033'), l32 = lu('LU-2026-032'), l38 = lu('LU-2026-038');
  if (l36) { R({ area: 'AR-DEP', rid: 'D2', cantidad: 20000, origen: { tipo: 'lineup', id: l36.id }, desde: l36.etb, hasta: addHours(l36.etc, 48), motivo: 'Operativo comprometido con el cliente', ts: iso(-1, 9, 10) });
    R({ area: 'AR-LOG', rid: 'L-CAM', cantidad: 8, origen: { tipo: 'lineup', id: l36.id }, desde: l36.etb, hasta: l36.etc, motivo: 'Pico de demanda previsto', ts: iso(-1, 9, 20) }); }
  if (l33) R({ area: 'AR-RRHH', rid: 'MANO-EMB', cantidad: 2, origen: { tipo: 'lineup', id: l33.id }, desde: l33.etb, hasta: l33.etc, motivo: 'Operativo comprometido con el cliente', ts: iso(-2, 15, 0) });
  if (l32) R({ area: 'AR-BAL', rid: 'BZ2', cantidad: 1, origen: { tipo: 'lineup', id: l32.id }, desde: l32.etb, hasta: l32.etc, motivo: 'Mantenimiento programado del resto de la flota', ts: iso(-3, 11, 30) });
  if (l38) R({ area: 'AR-RENT', rid: 'L-PALA', cantidad: 2, origen: { tipo: 'lineup', id: l38.id }, desde: l38.etb, hasta: l38.etc, motivo: 'Capacidad comprometida con otra área', ts: iso(0, 8, 0) });
  const cu = S.ops.cupos.find(c => c.estado !== 'Cumplido');
  if (cu) R({ area: 'AR-BAL', rid: 'BZ1', cantidad: 1, origen: { tipo: 'cupo', id: cu.id }, desde: cu.fecha + 'T06:00:00.000Z', hasta: cu.fecha + 'T18:00:00.000Z', motivo: 'Pico de demanda previsto', ts: iso(-1, 17, 45) });
  /* las órdenes ya planificadas definen qué reservas quedaron aplicadas y cuáles a revalidar */
  for (const o of S.orders) if (['PLANIF', 'EJEC', 'PEND_CIERRE', 'CERRADA'].includes(o.estado)) aplicarReservas(o, { silencioso: true, rol: 'PLAN' });
  recalcularNominacion(null, { silencioso: true });
}
const NIVELES_PERMISO = [{ id: 'oculto', nombre: 'No lo visualiza', cls: '' }, { id: 'consulta', nombre: 'Solo consulta', cls: 'info' }, { id: 'abm', nombre: 'Puede ABM', cls: 'acc' }];
function nivelPermiso(id) { return byId(NIVELES_PERMISO, id) || NIVELES_PERMISO[1]; }
function permisoMD(m, rol) { rol = rol || S.ctx.rol; if (rol === 'MD') return 'abm'; if (MD_ABM[m]?.modelo) return 'consulta'; /* las listas del modelo las administra solo Máster data (S22) */ return (md().permisosMD?.[m] || {})[rol] || 'consulta'; }
function setPermisoMD(m, rol, nivel) {
  if (rol === 'MD') return { ok: false, motivo: 'Máster data siempre puede ABM' };
  if (!NIVELES_PERMISO.some(n => n.id === nivel)) return { ok: false, motivo: 'nivel inválido' };
  md().permisosMD[m] = md().permisosMD[m] || {}; const prev = permisoMD(m, rol); if (prev === nivel) return { ok: true, sinCambio: true };
  md().permisosMD[m][rol] = nivel;
  mdLog('Permiso', m, rolName(rol), nivelPermiso(prev).nombre + ' → ' + nivelPermiso(nivel).nombre);
  return { ok: true, prev };
}
function maestrosVisibles(rol) { return [...MODEL_FICHAS, ...MD_EXT.fichas].filter(f => permisoMD(f.codigo, rol) !== 'oculto'); }
function resumenPermisos(rol) { const out = { oculto: 0, consulta: 0, abm: 0 }; for (const f of [...MODEL_FICHAS, ...MD_EXT.fichas]) out[permisoMD(f.codigo, rol)]++; return out; }
/* registro de cambios de la master data: quién, cuándo, maestro, registro y qué cambió */
function mdLog(accion, maestro, registro, detalle, opts = {}) {
  S.mdLog = S.mdLog || []; const rol = opts.rol || S.ctx.rol;
  S.mdLog.unshift({ ts: nowIso(), rol, usuario: userOf(rol), accion, maestro, registro: String(registro ?? ''), detalle: detalle || '' });
  if (S.mdLog.length > 300) S.mdLog.length = 300;
}
/* dónde vive cada maestro en la maqueta: colección directa, colecciones por tipo, pantalla propia o derivado */
const MD_ABM = {
  'M-01': { coll: 'entidades' }, 'M-02': { coll: 'centrosCosto' }, 'M-03': { coll: 'cuentasObjeto' }, 'M-04': { coll: 'tiposComprobante' },
  'M-05': { tipos: [{ v: 'área', coll: 'departamentos' }, { v: 'puesto', coll: 'funciones' }] },
  'M-06': { tipos: [{ v: 'cliente', coll: 'clientes' }, { v: 'proveedor', coll: 'proveedores' }] },
  'M-07': { coll: 'productos' }, 'M-08': { coll: 'buques' }, 'M-09': { coll: 'plantas' }, 'M-10': { coll: 'depositosPadre' }, 'M-10a': { coll: 'depositos' }, 'M-11': { coll: 'transporte' },
  'M-12': { tipos: [{ v: 'equipo de descarga / carga', coll: 'equipos' }, { v: 'maquinaria auxiliar', coll: 'logistica' }] },
  'M-12a': { coll: 'maquinariaUnidades', nota: 'Unidades físicas de cada maquinaria: la misma máquina con distintas medidas y capacidades. El acceso de la ubicación de destino (M-10a) define cuál puede entrar.' },
  'M-13': { coll: 'manos' }, 'M-14': { coll: 'servicios' },
  'M-15': { derivado: 'Las tarifas se publican desde las tarifas por componente de cada instrumento (M-16): se administran ahí.' },
  'M-16': { coll: 'instrumentos', nota: 'Comercial también da de alta instrumentos y adendas desde la orden (S9).' },
  'M-17': { pantalla: 'arribos', txt: 'Los lineups se administran en Logística de arribo (S10).' },
  'M-18': { coll: 'monedas' },
  'M-19': { derivado: 'El calendario se genera desde el régimen de turnos (M-33).' },
  'M-20': { coll: 'tolerancias' }, 'M-21': { coll: 'agencias' }, 'M-22': { coll: 'despachantes' }, 'M-23': { coll: 'matrizCalidad' }, 'M-24': { coll: 'matrizCompatibilidad' },
  'M-25': { tipos: [{ v: 'muelle', coll: 'muelles' }, { v: 'punto de conexión', coll: 'puntosConexion' }] },
  'M-26': { coll: 'balanzas' }, 'M-27': { coll: 'choferes' }, 'M-28': { coll: 'personalPropio' }, 'M-29': { coll: 'causasDemora' }, 'M-30': { coll: 'insumos' },
  'M-31': { pantalla: 'arribos', txt: 'Los cupos de camiones se administran en Logística de arribo (S10).' },
  'M-32': { pantalla: 'arribos', txt: 'Los operativos ferroviarios se administran en Logística de arribo (S10).' },
  'M-33': { coll: 'regimenTurnos' }, 'M-34': { coll: 'metodosSeguros' }, 'M-35': { coll: 'bus' },
  'M-36': { pantalla: 'admin', admTab: 'MAT', txt: 'La matriz de ejecución y las relaciones se editan en Administración.' },
  'M-37': { pantalla: 'admin', admTab: 'WF', txt: 'Los workflows (rol de cierre por servicio) se editan en Administración.' },
  'M-39': { coll: 'areas', nota: 'Las áreas administran su propio sector desde el módulo Mi área; aquí se define qué recursos les pertenecen y quién las administra.' },
  'M-38': { derivado: 'Los roles de la maqueta son fijos; los permisos por maestro se administran en la pestaña Permisos por rol.' },
  /* listas del modelo (S22): ABM reservado a Máster data */
  'CV': { coll: 'convenciones', modelo: true }, 'RG': { coll: 'reglasModelo', modelo: true }, 'DF': { coll: 'definiciones', modelo: true }, 'DC': { coll: 'decisiones', modelo: true },
};
const MODELO_NOMBRES = { CV: 'Convenciones del modelo', RG: 'Reglas por maestro', DF: 'Definiciones previas', DC: 'Decisiones por maestro' };
function nombreMaestro(m) { return mdFichas().find(f => f.codigo === m)?.nombre || MODELO_NOMBRES[m] || m; }
function mdColecciones(m) { const a = MD_ABM[m]; if (!a) return []; if (a.coll) return [{ v: a.v || m, coll: a.coll }]; return a.tipos || []; }
function mdCollDe(m, id) { for (const t of mdColecciones(m)) { const r = byId(md()[t.coll], id); if (r) return { coll: t.coll, tipo: t.v, rec: r }; } return null; }
/* estado del registro según la auditoría común (hoja 3) */
function estadoRegistro(r) { return r?._aud?.estado_registro || md().auditoriaBase?.estado_registro || 'vigente'; }
function deBaja(r) { return !!r && r._aud?.estado_registro === 'dada de baja'; }
function enValidacion(r) { return !!r && r._aud?.estado_registro === 'en validación'; }
function mdUsable(r) { return !!r && !deBaja(r) && !enValidacion(r); }
function registrosEnValidacion() {
  const out = [];
  for (const [m, a] of Object.entries(MD_ABM)) for (const t of mdColecciones(m)) for (const r of (md()[t.coll] || [])) if (enValidacion(r)) out.push({ m, coll: t.coll, tipo: t.v, rec: r });
  return out.sort((a, b) => (b.rec._aud?.modificado_el || b.rec._aud?.creado_el || '').localeCompare(a.rec._aud?.modificado_el || a.rec._aud?.creado_el || ''));
}
/* campos del formulario genérico: se derivan de los registros existentes de la colección (tipo de dato, enumeraciones, referencias a otros maestros) */
const MD_REF = { maquinaria: 'logistica', planta: 'plantas', puerto: 'plantas', centro_costo: 'centrosCosto', cc: 'centrosCosto', proveedor: 'proveedores', transportista: 'proveedores', familia: 'familias', producto: 'productos', cliente: 'clientes', entidad: 'entidades', unidad_negocio: 'entidades', bu: 'bus', deposito: 'depositosPadre', area: 'departamentos', departamento: 'departamentos', responsable: 'departamentos', puesto: 'funciones', agencia: 'agencias', cuenta_objeto: 'cuentasObjeto', tipo_servicio: 'servicios', contrato: 'instrumentos', muelle: 'muelles', moneda: 'monedas', moneda_funcional: 'monedas', buqueId: 'buques', producto_a: 'productos', producto_b: 'productos' };
const MD_MULTIREF = { familias: 'familias', productos: 'productos', metodo_seguro: 'metodosSeguros', productos_aptos: 'productos', aptitud_por_producto: 'productos', servicios: 'servicios', bus: 'bus', busPrestadoras: 'bus', ambito: 'entidades', medios: 'medios', componentes: 'componentes', productos_admitidos: 'familias' };
const MD_ENUM_KEYS = new Set(['estado', 'tipo', 'propiedad', 'criticidad', 'presentacion', 'regimen_segregacion', 'regimen_regulatorio', 'unidad_base', 'clase_dia', 'categoria', 'imputable_a', 'accion_al_vencer', 'accion_al_exceder', 'rol', 'condicion_fiscal', 'condicion_pago', 'nivel', 'cierre', 'tipoM12', 'tipoM25', 'tipoM10a', 'estadoM10a', 'estadoM25', 'estadoM26', 'tipoM16', 'rubro', 'rubroM06', 'unidad_tarifa', 'convenio', 'tipo_movimiento', 'confirmacion_planta', 'tipo_operacion', 'habilitacion', 'alcance', 'metodo_recepcion', 'destinatario', 'estadoFisico', 'unidad', 'unidad_medida', 'aplica_a', 'responsabilidad', 'origen']);
const MD_SKIP = new Set(['id', 'codigo', 'n', '_aud', '_tipo', 'sup', 'calculado', 'esFlota', 'esMaquinaria', 'cierreSup', 'pendiente', 'buque', 'tercero', 'lineup', 'mantHasta', 'creadoDesde', 'creadoTs', 'creadoPor', 'snapshot', 'convertida', 'origenBU', 'padre', 'tarifas', 'condiciones', 'roles', 'equipos_propios', 'licencia', 'credencial_puerto', 'art_seguro', 'ocupadoT', 'uso', 'nota', 'interno', 'grupo', 'tarifa_mano', 'espacio_asignado', 'busM35']);
const MD_ALIAS = { capacidadT: 'capacidad_tn', capacidadTh: 'capacidad_tn_h', costoHora: 'costo_hora_referencia', costoTurno: 'costo_turno_referencia', calado: 'calado_admisible_m', vigenciaHasta: 'fecha_vencimiento', vigenciaDesde: 'fecha_vigencia_desde', requiereMS: 'requiere_metodo_seguro', fiscal: 'habilitada_fiscal', calibracionHasta: 'calibracion_vencimiento', dotacion: 'dotacion_total', cantidad: 'cantidad_disponible', restricciones: 'restricciones', nombre: 'nombre', sigla: 'sigla', localidad: 'localidad', procedimiento: 'documento', busPrestadoras: 'unidades_negocio', ambito: 'unidades_negocio_ambito', usaDeposito: 'usa_deposito', requiereProducto: 'requiere_producto', soloCarga: 'solo_carga', familias: 'familias_compatibles' };
function mdLabel(k) { const a = MD_ALIAS[k] || k; return a.replace(/M\d+a?$/, '').replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase(); }
function mdCampos(collName) {
  const coll = md()[collName] || []; const sample = coll.filter(r => !deBaja(r)).slice(0, 12); if (!sample.length && coll.length) sample.push(coll[0]);
  const keys = []; for (const r of sample) for (const k of Object.keys(r)) if (!keys.includes(k) && !MD_SKIP.has(k) && !k.startsWith('_')) keys.push(k);
  const campos = [{ k: 'id', a: 'codigo', t: 'text', req: true, key: true }];
  for (const k of keys) {
    const vals = sample.map(r => r[k]).filter(v => v !== undefined); const v0 = vals.find(v => v !== null && v !== '');
    if (MD_REF[k] && md()[MD_REF[k]]) { campos.push({ k, a: mdLabel(k), t: 'ref', ref: MD_REF[k], nullable: vals.some(v => v === null) }); continue; }
    if (MD_MULTIREF[k] && md()[MD_MULTIREF[k]] && (v0 === undefined || Array.isArray(v0) || v0 === null)) { campos.push({ k, a: mdLabel(k), t: 'multiref', ref: MD_MULTIREF[k] }); continue; }
    if (v0 === undefined) continue; /* siempre nulo: no se edita */
    if (typeof v0 === 'boolean') { campos.push({ k, a: mdLabel(k), t: 'bool' }); continue; }
    if (typeof v0 === 'number') { campos.push({ k, a: mdLabel(k), t: 'number' }); continue; }
    if (Array.isArray(v0)) { if (v0.every(x => typeof x === 'string' || typeof x === 'number')) campos.push({ k, a: mdLabel(k), t: 'list' }); continue; }
    if (typeof v0 === 'object') continue; /* estructuras anidadas: fuera del formulario genérico */
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(v0))) { campos.push({ k, a: mdLabel(k), t: 'date' }); continue; }
    const distintos = [...new Set(coll.map(r => r[k]).filter(v => typeof v === 'string' && v !== ''))];
    if (MD_ENUM_KEYS.has(k) && distintos.length >= 1 && distintos.length <= 12) { campos.push({ k, a: mdLabel(k), t: 'select', opts: distintos, req: k === 'estado' }); continue; }
    campos.push({ k, a: mdLabel(k), t: coll.some(r => typeof r[k] === 'string' && r[k].length > 90) ? 'textarea' : 'text', req: k === 'nombre' });
  }
  /* etiquetas repetidas (atributo de la maqueta y del modelo con el mismo nombre): se distingue la segunda con la clave */
  const vistos = new Set(); for (const c of campos) { if (vistos.has(c.a)) c.a = c.a + ' · ' + c.k; vistos.add(c.a); }
  return campos;
}
function mdLeer(campos, mv, opts = {}) {
  /* lee el formulario modal (ids md-<k>) y devuelve el registro; errores en .errores */
  const data = {}; const errores = [];
  for (const c of campos) {
    if (c.key && opts.edit) continue;
    const el = document.getElementById('md-' + c.k); if (!el) continue;
    let v;
    if (c.t === 'bool') v = el.checked;
    else if (c.t === 'number') { v = el.value === '' ? null : +el.value; if (v !== null && isNaN(v)) errores.push(c.a + ': número inválido'); }
    else if (c.t === 'multiref') v = [...el.selectedOptions].map(o => o.value).filter(Boolean);
    else if (c.t === 'list') v = el.value.split(/[,;·]/).map(x => x.trim()).filter(Boolean);
    else if (c.t === 'ref') v = el.value || null;
    else v = el.value.trim();
    if (c.req && (v === '' || v === null || v === undefined)) errores.push(c.a + ' es obligatorio');
    data[c.k] = v;
  }
  return { data, errores };
}
function guardarMD(m, collName, data, opts = {}) {
  const coll = md()[collName]; if (!coll) return { ok: false, motivo: 'colección inexistente' };
  const rol = opts.rol || S.ctx.rol; const nivel = permisoMD(m, rol); if (nivel !== 'abm') return { ok: false, motivo: rolName(rol) + ' no tiene permiso de ABM sobre ' + m };
  const ts = nowIso(); const usuario = userOf(rol); const publica = rol === 'MD';
  if (opts.edit) {
    const r = byId(coll, opts.edit); if (!r) return { ok: false, motivo: 'registro inexistente' };
    const cambios = []; for (const [k, v] of Object.entries(data)) { if (JSON.stringify(r[k]) !== JSON.stringify(v)) { cambios.push(mdLabel(k) + ': ' + fvTxt(r[k]) + ' → ' + fvTxt(v)); r[k] = v; } }
    if (!cambios.length) return { ok: true, sinCambio: true, rec: r };
    r._aud = Object.assign({}, md().auditoriaBase, r._aud || {}, { version: ((r._aud?.version) || md().auditoriaBase.version || 1) + 1, modificado_por: usuario, modificado_el: ts, origen: 'manual', estado_registro: publica ? 'vigente' : 'en validación' });
    if (publica) Object.assign(r._aud, { validado_por: usuario, validado_el: ts });
    mdLog('Modificación', m, r.id, cambios.join(' · ') + (publica ? '' : ' · queda en validación'), { rol });
    return { ok: true, rec: r, cambios, enValidacion: !publica };
  }
  if (!data.id) return { ok: false, motivo: 'el código es obligatorio' };
  if (byId(coll, data.id)) return { ok: false, motivo: 'ya existe un registro con el código ' + data.id };
  if (['convenciones', 'reglasModelo', 'decisiones'].includes(collName)) data.codigo = data.id; if (collName === 'definiciones') data.n = data.id;
  const r = Object.assign({}, data, { _aud: { estado_registro: publica ? 'vigente' : 'en validación', creado_por: usuario, creado_el: ts, version: 1, origen: 'manual', validado_por: publica ? usuario : null, validado_el: publica ? ts : null, autorizado_por: null } });
  coll.push(r);
  mdLog('Alta', m, r.id, (r.nombre ? r.nombre : '') + (publica ? ' · vigente' : ' · en validación (pendiente de Máster data)'), { rol });
  return { ok: true, rec: r, enValidacion: !publica };
}
function validarMD(m, id, decision, detalle, opts = {}) {
  const rol = opts.rol || S.ctx.rol; if (rol !== 'MD') return { ok: false, motivo: 'solo Máster data valida y publica' };
  const c = mdCollDe(m, id); if (!c) return { ok: false, motivo: 'registro inexistente' };
  const r = c.rec; const ts = nowIso(); r._aud = r._aud || {};
  if (decision === 'Validado') { Object.assign(r._aud, { estado_registro: 'vigente', validado_por: userOf(rol), validado_el: ts }); mdLog('Validación', m, r.id, 'Publicado como vigente' + (detalle ? ' · ' + detalle : ''), { rol }); }
  else { Object.assign(r._aud, { estado_registro: 'rechazada', validado_por: userOf(rol), validado_el: ts, baja_el: dayOf(ts), baja_motivo: detalle || 'rechazado en validación' }); mdLog('Rechazo', m, r.id, detalle || 'rechazado en validación', { rol }); }
  return { ok: true, rec: r };
}
function bajaMD(m, id, motivo, opts = {}) {
  const rol = opts.rol || S.ctx.rol; if (permisoMD(m, rol) !== 'abm') return { ok: false, motivo: rolName(rol) + ' no tiene permiso de ABM sobre ' + m };
  const c = mdCollDe(m, id); if (!c) return { ok: false, motivo: 'registro inexistente' };
  const r = c.rec; if (deBaja(r)) return { ok: false, motivo: 'ya está dado de baja' };
  const enUso = reservasRecurso(id, null).filter(rv => ['PLANIF', 'EJEC'].includes(rv.o.estado));
  if (enUso.length && !opts.forzar) return { ok: false, motivo: 'está reservado por ' + enUso.map(rv => rv.o.id).join(', ') + '; liberá o anulá esas órdenes antes de la baja' };
  r._aud = Object.assign({}, md().auditoriaBase, r._aud || {}, { estado_registro: 'dada de baja', version: ((r._aud?.version) || 1) + 1, baja_por: userOf(rol), baja_el: dayOf(nowIso()), baja_motivo: motivo || 'sin motivo indicado' });
  mdLog('Baja', m, r.id, (r.nombre || '') + ' · ' + (motivo || 'sin motivo indicado') + ' · baja lógica: el registro se conserva y deja de ofrecerse', { rol });
  return { ok: true, rec: r };
}
function fvTxt(v) { if (v === null || v === undefined || v === '') return '—'; if (Array.isArray(v)) return v.join(', ') || '—'; if (typeof v === 'object') return JSON.stringify(v); return String(v); }

/* =====================================================================
   NOMINACIÓN DEL LINEUP DESDE EL OPERATIVO (revisión 16/09)
   toneladas_para_tys, nominado_a_tys y operativo_vinculado (M-17) se alimentan
   de las órdenes de servicio creadas sobre las cargas de la escala.
   ===================================================================== */
function recalcularNominacion(luId, opts = {}) {
  const lus = luId ? [byId(S.ops.lineups, luId)].filter(Boolean) : S.ops.lineups;
  for (const lu of lus) {
    const os = ordenesDeOrigen('lineup', lu.id);
    const tn = sum(os, o => o.toneladas || 0);
    const antes = { n: !!lu.nominado_a_tys, t: lu.toneladas_para_tys || 0, ov: lu.operativo_vinculado || '' };
    lu.toneladas_para_tys = tn;
    lu.nominado_a_tys = os.length > 0;
    lu.operativo_vinculado = os.map(o => o.id).join(' · ');
    /* el puerto de descarga y el operador de la carga nominada salen de la orden de servicio (revisión 17/09) */
    for (const o2 of os) { const c = (lu.cargas || [])[o2.origen?.cargaIdx]; if (!c) continue; c.puertoDescarga = puertoDeTerminal(o2.entidad || lu.terminal); c.operador = o2.entidad || lu.terminal; }
    lu.toneladas_nominadas_total_buque = sum(lu.cargas || [], c => c.toneladas || 0);
    if (!opts.silencioso && (antes.n !== lu.nominado_a_tys || antes.t !== tn || antes.ov !== lu.operativo_vinculado)) {
      arriboLog('Lineup', lu.id, 'Nominación actualizada', (lu.nominado_a_tys ? 'nominado a TyS · ' + fmtT(tn) + ' t para TyS de ' + fmtT(lu.toneladas_nominadas_total_buque || tn) + ' t del buque · operativo ' + (lu.operativo_vinculado || '—') : 'sin órdenes: la escala deja de estar nominada a TyS') + ' (M-17: se alimenta de la creación del operativo)');
    }
  }
}

/* =====================================================================
   ÁREAS: CAPACIDAD PROPIA Y RESERVAS PARA OPERATIVOS FUTUROS (revisión 16/09, S23 · S24)
   Cada área (Logística, Rental, Depósitos, RRHH, Portería y balanza) administra los
   recursos de su sector, ve su capacidad total y reserva capacidad referenciando un
   lineup, un cupo o un operativo ferroviario. La planificación y la ejecución quedan
   informadas de esas reservas y el área revalida cuando se elige otra opción.
   ===================================================================== */
const TIPO_MAESTRO = { logistica: 'M-12', maquinaria: 'M-12', deposito: 'M-10a', balanza: 'M-26', muelle: 'M-25', equipo: 'M-12', funcion: 'M-05', mano: 'M-13' };
const TIPO_COLL = { logistica: 'logistica', maquinaria: 'logistica', deposito: 'depositos', balanza: 'balanzas', muelle: 'muelles', equipo: 'equipos', funcion: 'funciones', mano: 'manos' };
const TIPO_NOMBRE = { logistica: 'Logística (flota)', maquinaria: 'Maquinaria', deposito: 'Depósitos y ubicaciones', balanza: 'Balanzas', muelle: 'Muelles', equipo: 'Equipos de descarga / carga', funcion: 'Personal propio (puestos)', mano: 'Manos de proveedores' };
function recursosDeArea(a) {
  if (!a) return [];
  const m = md(); const out = [];
  for (const tipo of a.tipos || []) {
    for (const r of (m[TIPO_COLL[tipo]] || [])) {
      if (r.entidad && r.entidad !== a.entidad) continue;
      if ((a.bus || []).length && r.bu && !a.bus.includes(r.bu)) continue;
      if ((a.bus || []).length && !r.bu && (tipo === 'logistica' || tipo === 'maquinaria')) continue;
      /* la flota (logística) y la maquinaria comparten el maestro M-12 pero se administran por separado (revisión 16/09, S31) */
      if ((tipo === 'logistica' || tipo === 'maquinaria') && claseRecurso(r.id) !== tipo) continue;
      out.push({ r, tipo });
    }
  }
  return out;
}
function areaDeRecurso(rid) { return (md().areas || []).find(a => recursosDeArea(a).some(x => x.r.id === rid)) || null; }
function capacidadRecurso(r, tipo) {
  if (tipo === 'deposito') return { total: r.capacidadT || 0, um: 't' };
  if (tipo === 'funcion') return { total: r.dotacion || 0, um: 'personas' };
  if (tipo === 'mano') return { total: r.disponibles || r.cantidad || 4, um: 'manos' };
  if (tipo === 'balanza' || tipo === 'muelle') return { total: 1, um: 'unidad' };
  return { total: r.cantidad || 1, um: 'unidades' };
}
function usoPicoWin(rid, win, excludeId) {
  const rvs = reservasRecurso(rid, excludeId).filter(rv => overlap(win.inicio, win.fin, rv.desde, rv.hasta));
  if (!rvs.length) return 0;
  const puntos = [win.inicio, ...rvs.map(rv => rv.desde)].filter(t => t >= win.inicio && t < win.fin);
  let pico = 0;
  for (const t of puntos) pico = Math.max(pico, sum(rvs.filter(rv => rv.desde <= t && t < rv.hasta), rv => rv.cantidad));
  return pico;
}
function ventanaArea() { return { inicio: isoDay(0) + 'T00:00:00.000Z', fin: isoDay(14) + 'T00:00:00.000Z' }; }
function ocupacionRecurso(rid, tipo, win) {
  /* comprometido por órdenes planificadas o en ejecución dentro de la ventana, y reservado por el área */
  if (tipo === 'deposito') {
    const r = recurso(rid);
    const comp = sum(reservasRecurso(rid, null).filter(rv => overlap(win.inicio, win.fin, rv.desde, rv.hasta)), rv => Math.max(0, rv.o.toneladas - (rv.o.ejecucion?.acumulado || 0)));
    return { ordenes: comp + (r?.ocupadoT || 0), detalle: reservasRecurso(rid, null).filter(rv => overlap(win.inicio, win.fin, rv.desde, rv.hasta)) };
  }
  return { ordenes: usoPicoWin(rid, win, null), detalle: reservasRecurso(rid, null).filter(rv => overlap(win.inicio, win.fin, rv.desde, rv.hasta)) };
}
/* ---------- reservas de área ---------- */
const RESERVA_ESTADOS = ['Reservada', 'Aplicada', 'A revalidar', 'Liberada'];
function reservas() { S.reservasArea = S.reservasArea || []; return S.reservasArea; }
function reservasVigentes() { return reservas().filter(r => r.estado !== 'Liberada'); }
function reservasDeArea(areaId) { return reservas().filter(r => r.area === areaId); }
function mismoOrigen(a, b) { return !!a && !!b && a.tipo === b.tipo && a.id === b.id; }
function reservasDeOrigen(origen) { return origen ? reservasVigentes().filter(r => mismoOrigen(r.origen, origen)) : []; }
function reservasDeRecurso(rid, win, origenExcluido) {
  return reservasVigentes().filter(r => r.rid === rid && !mismoOrigen(r.origen, origenExcluido) && (!win || overlap(win.inicio, win.fin, r.desde, r.hasta)));
}
function origenLabel(g) {
  if (!g) return '—';
  if (g.tipo === 'lineup') { const lu = byId(S.ops.lineups, g.id); return lu ? lu.id + ' · ' + lu.buque : g.id; }
  if (g.tipo === 'cupo') { const c = byId(S.ops.cupos, g.id); return c ? c.id + ' · cupo de ' + c.camiones + ' camiones' : g.id; }
  if (g.tipo === 'tren') { const t = byId(S.ops.trenes, g.id); return t ? t.id + ' · ' + t.formacion : g.id; }
  return g.id;
}
function ventanaDeOrigen(g) {
  if (!g) return null;
  if (g.tipo === 'lineup') { const lu = byId(S.ops.lineups, g.id); return lu ? { inicio: lu.etb, fin: lu.etc } : null; }
  if (g.tipo === 'cupo') { const c = byId(S.ops.cupos, g.id); return c ? { inicio: c.fecha + 'T06:00:00.000Z', fin: c.fecha + 'T18:00:00.000Z' } : null; }
  if (g.tipo === 'tren') { const t = byId(S.ops.trenes, g.id); return t ? { inicio: t.fecha + 'T06:00:00.000Z', fin: t.fecha + 'T22:00:00.000Z' } : null; }
  return null;
}
function reservaLog(rv, accion, detalle, opts = {}) {
  rv.log = rv.log || [];
  rv.log.unshift({ ts: opts.ts || nowIso(), rol: opts.rol || S.ctx.rol, usuario: opts.usuario || userOf(opts.rol || S.ctx.rol), accion, detalle: detalle || '' });
}
function crearReservaArea(d, opts = {}) {
  const a = areaMD(d.area); if (!a) return { ok: false, motivo: 'área inexistente' };
  const r = recurso(d.rid); if (!r) return { ok: false, motivo: 'recurso inexistente' };
  if (!recursosDeArea(a).some(x => x.r.id === d.rid)) return { ok: false, motivo: recNombre(d.rid) + ' no pertenece al sector de ' + a.nombre };
  const cant = Math.max(1, +d.cantidad || 1);
  const win = { inicio: d.desde, fin: d.hasta };
  if (!win.inicio || !win.fin || win.fin <= win.inicio) return { ok: false, motivo: 'la ventana de la reserva es inválida (el fin debe ser posterior al inicio)' };
  S.seqRA = S.seqRA || 1; const id = 'RA-' + String(S.seqRA++).padStart(3, '0');
  const rv = { id, area: a.id, rid: d.rid, tipo: recursoTipo(d.rid), cantidad: cant, origen: d.origen ? clone(d.origen) : null, desde: win.inicio, hasta: win.fin, motivo: d.motivo || 'sin motivo indicado', estado: 'Reservada', orden: null, creadoPor: opts.usuario || userOf(opts.rol || S.ctx.rol), creadoTs: opts.ts || nowIso(), log: [] };
  reservaLog(rv, 'Alta', a.nombre + ' reserva ' + cant + ' × ' + recNombre(d.rid) + ' para ' + origenLabel(rv.origen) + ' · ' + ventanaTxtSimple(win) + ' · motivo: ' + rv.motivo, opts);
  reservas().push(rv);
  /* si la escala ya tiene órdenes, se evalúa de inmediato contra sus planes */
  for (const o of ordenesDeReserva(rv)) if (['PLANIF', 'EJEC', 'PEND_CIERRE', 'CERRADA'].includes(o.estado)) aplicarReservas(o, { silencioso: true });
  return { ok: true, rv };
}
function ventanaTxtSimple(v) { return fmtDT(v.inicio) + ' → ' + fmtDT(v.fin); }
function ordenesDeReserva(rv) { return rv.origen ? ordenesDeOrigen(rv.origen.tipo, rv.origen.id) : []; }
function liberarReservaArea(id, motivo, opts = {}) {
  const rv = byId(reservas(), id); if (!rv) return { ok: false, motivo: 'reserva inexistente' };
  if (rv.estado === 'Liberada') return { ok: false, motivo: 'ya está liberada' };
  rv.estado = 'Liberada'; rv.liberadaTs = opts.ts || nowIso();
  reservaLog(rv, 'Liberación', motivo || 'sin motivo indicado', opts);
  return { ok: true, rv };
}
function revalidarReservaArea(id, decision, detalle, opts = {}) {
  const rv = byId(reservas(), id); if (!rv) return { ok: false, motivo: 'reserva inexistente' };
  if (decision === 'liberar') { const res = liberarReservaArea(id, detalle || 'el área acepta el cambio de la planificación', opts); if (res.ok) reservaLog(rv, 'Revalidación', 'El área acepta la opción elegida y libera la capacidad', opts); return res; }
  rv.estado = 'Reservada'; rv.revalidadaTs = opts.ts || nowIso();
  reservaLog(rv, 'Revalidación', 'El área mantiene la reserva y pide revisar la planificación' + (detalle ? ' · ' + detalle : ''), opts);
  return { ok: true, rv, mantiene: true };
}
/* al confirmar o ajustar un plan: lo reservado por las áreas para ese origen se marca aplicado o a revalidar */
function aplicarReservas(o, opts = {}) {
  /* solo se evalúa contra órdenes que ya tienen un plan confirmado: una orden en borrador o pendiente de planificación todavía no eligió nada */
  if (!o.plan || ['BORR', 'ANULADA'].includes(o.estado)) return [];
  const rs = reservasDeOrigen(o.origen); if (!rs.length) return [];
  const cambios = [];
  for (const rv of rs) {
    const q = cantidadEnOrden(o, rv.rid);
    const antes = rv.estado;
    if (q >= rv.cantidad) { rv.estado = 'Aplicada'; rv.orden = o.id; if (antes !== 'Aplicada') { reservaLog(rv, 'Aplicada', o.id + ' toma ' + q + ' × ' + recNombre(rv.rid), opts); cambios.push({ rv, a: 'Aplicada', q }); } }
    else if (antes !== 'A revalidar' || q !== (rv.aplicadaCant || 0)) {
      rv.estado = 'A revalidar'; rv.orden = o.id; rv.aplicadaCant = q;
      reservaLog(rv, 'A revalidar', o.id + (q > 0 ? ' toma ' + q + ' de ' + rv.cantidad + ' × ' + recNombre(rv.rid) + ' (menos de lo reservado)' : ' se planificó con otra opción: no usa ' + recNombre(rv.rid)), opts);
      cambios.push({ rv, a: 'A revalidar', q });
    }
  }
  if (cambios.length && !opts.silencioso) {
    logEv(o, 'Reservas de área revisadas', cambios.map(c => areaMD(c.rv.area)?.nombre + ' · ' + recNombre(c.rv.rid) + ' ' + c.rv.cantidad + ' → ' + c.a.toLowerCase()).join(' · ') + ' (el área revalida lo que quedó sin usar)', { rol: opts.rol || S.ctx.rol, ...opts });
  }
  return cambios;
}
function reservasARevalidar(areaId) { return reservas().filter(r => r.estado === 'A revalidar' && (!areaId || r.area === areaId)); }
function reservasTxt(rs) { return rs.map(r => r.cantidad + ' × ' + recNombre(r.rid) + ' (' + (areaMD(r.area)?.nombre || r.area) + ')').join(' · '); }

/* =====================================================================
   MÓDULOS POR ROL / SECTOR (SUPUESTO S20) y edición de toneladas / fechas por Comercial (SUPUESTO S19)
   ===================================================================== */
const MODULO_DE_PANTALLA = { exp: 'ordenes', nueva: 'ordenes', programacion: 'arribos' };
function moduloDe(screen) { return MODULO_DE_PANTALLA[screen] || screen; }
/* tres dimensiones: rol (todos los módulos), entidad y BU (solo el menú de Operación — S22). El menú muestra la intersección con el contexto activo. */
function moduloHabilitadoRol(m, rol) { const def = byId(md().modulos, m); if (!def || def.fijo) return true; const v = (md().permisosModulos?.[rol] || {})[m]; return v === undefined ? true : !!v; }
function moduloHabilitadoEntidad(m, ent) { const def = byId(md().modulos, m); if (!def || def.fijo || def.grupo !== 'operacion' || !ent || ent === 'ALL') return true; const v = (md().permisosModulosEntidad?.[ent] || {})[m]; return v === undefined ? true : !!v; }
function moduloHabilitadoBU(m, b) { const def = byId(md().modulos, m); if (!def || def.fijo || def.grupo !== 'operacion' || !b || b === 'ALL') return true; const v = (md().permisosModulosBU?.[b] || {})[m]; return v === undefined ? true : !!v; }
function moduloHabilitado(screen, rol, ent, b) {
  rol = rol || S.ctx.rol; ent = ent === undefined ? S.ctx.entidad : ent; b = b === undefined ? S.ctx.bu : b;
  const m = moduloDe(screen); const def = byId(md().modulos, m); if (!def) return true; if (def.fijo) return true;
  return moduloHabilitadoRol(m, rol) && moduloHabilitadoEntidad(m, ent) && moduloHabilitadoBU(m, b);
}
function motivoModuloDeshabilitado(screen, rol, ent, b) {
  rol = rol || S.ctx.rol; ent = ent === undefined ? S.ctx.entidad : ent; b = b === undefined ? S.ctx.bu : b; const m = moduloDe(screen); const out = [];
  if (!moduloHabilitadoRol(m, rol)) out.push('el rol ' + rolName(rol)); if (!moduloHabilitadoEntidad(m, ent)) out.push('la entidad ' + entName(ent)); if (!moduloHabilitadoBU(m, b)) out.push('la BU ' + buName(b));
  return out.join(' y ');
}
function setModuloDim(dim, key, m, on) {
  const def = byId(md().modulos, m); if (!def) return { ok: false, motivo: 'módulo inexistente' }; if (def.fijo) return { ok: false, motivo: def.nombre + ' no se puede deshabilitar' };
  if (dim !== 'rol' && def.grupo !== 'operacion') return { ok: false, motivo: def.nombre + ' solo se administra por rol' };
  const coll = dim === 'rol' ? 'permisosModulos' : dim === 'entidad' ? 'permisosModulosEntidad' : 'permisosModulosBU';
  const getter = dim === 'rol' ? moduloHabilitadoRol : dim === 'entidad' ? moduloHabilitadoEntidad : moduloHabilitadoBU;
  md()[coll] = md()[coll] || {}; md()[coll][key] = md()[coll][key] || {};
  const prev = getter(m, key); if (prev === !!on) return { ok: true, sinCambio: true };
  md()[coll][key][m] = !!on;
  const quien = dim === 'rol' ? rolName(key) : dim === 'entidad' ? entName(key) : buName(key);
  mdLog('Módulo', dim === 'rol' ? 'M-38' : dim === 'entidad' ? 'M-01' : 'M-35', quien, def.nombre + ': ' + (on ? 'habilitado' : 'deshabilitado') + ' (' + dim + ')');
  return { ok: true };
}
function setModulo(rol, m, on) { return setModuloDim('rol', rol, m, on); }
function modulosDe(rol, ent, b) { return md().modulos.filter(m => moduloHabilitado(m.id, rol, ent === undefined ? 'ALL' : ent, b === undefined ? 'ALL' : b)); }
function modulosDeshabilitadosTxt(dim, key) { const list = md().modulos.filter(m => m.grupo === 'operacion' && !m.fijo && !(dim === 'entidad' ? moduloHabilitadoEntidad(m.id, key) : moduloHabilitadoBU(m.id, key))); return list.length ? list.map(m => m.nombre.split(' (')[0]).join(' · ') : 'todos'; }
/* Comercial define toneladas y ventana del servicio; editables hasta Pendiente de planificación (S19) */
function puedeEditarDatosServicio(o, rol) { rol = rol || S.ctx.rol; return rol === 'COM' && ['BORR', 'PEND_PLAN'].includes(o.estado); }
function editarDatosServicio(o, d, motivo, opts = {}) {
  if (!puedeEditarDatosServicio(o, opts.rol || S.ctx.rol)) return { ok: false, motivo: o.estado === 'PLANIF' || o.estado === 'EJEC' ? 'la orden ya está planificada: devolvela al Planificador para cambiar toneladas o fechas' : 'solo Comercial edita toneladas y fechas mientras la orden no está planificada' };
  const cambios = [];
  if (d.toneladas != null && +d.toneladas !== o.toneladas) { cambios.push('toneladas ' + fmtT(o.toneladas) + ' → ' + fmtT(+d.toneladas)); o.toneladas = +d.toneladas; }
  if (d.inicio && d.fin) { if (d.fin <= d.inicio) return { ok: false, motivo: 'el fin del servicio debe ser posterior al inicio' }; if (d.inicio !== o.ventana?.inicio || d.fin !== o.ventana?.fin) { cambios.push('ventana ' + ventanaTxt(o.ventana) + ' → ' + ventanaTxt({ inicio: d.inicio, fin: d.fin })); o.ventana = { inicio: d.inicio, fin: d.fin }; } }
  if (!cambios.length) return { ok: true, sinCambio: true };
  logEv(o, 'Toneladas y fechas del servicio modificadas', cambios.join(' · ') + (motivo ? ' · motivo: ' + motivo : ''), { rol: 'COM', ...opts });
  if (o.origen?.tipo === 'lineup') recalcularNominacion(o.origen.id);
  if (o.estado === 'PEND_PLAN' && !sinOrigenOperativo(o)) { o.recomendacion = recomendar(o); logEv(o, 'Recomendación regenerada', o.recomendacion?.sinOpciones ? 'sin combinación factible' : resumenRecursos(o.recomendacion.recursos), { rol: 'PLAN' }); }
  return { ok: true, cambios };
}
function ventanaOrigenDe(o) {
  const g = origenInfo(o); if (!g) return null;
  if (g.lu) return { inicio: g.lu.etb, fin: g.lu.etc, txt: 'ETB → ETC del lineup' };
  if (g.cu) { const [a, b] = g.cu.franja.replace('–', '-').split('-'); return { inicio: new Date(g.cu.fecha + 'T' + a.trim() + ':00').toISOString(), fin: new Date(g.cu.fecha + 'T' + b.trim() + ':00').toISOString(), txt: 'franja del cupo' }; }
  if (g.tr) return { inicio: new Date(g.tr.fecha + 'T06:00:00').toISOString(), fin: new Date(g.tr.fecha + 'T22:00:00').toISOString(), txt: 'día del operativo ferroviario' };
  if (g.so) return { inicio: g.so.desde, fin: g.so.hasta, txt: 'ventana solicitada' };
  return null;
}
function toneladasOrigenDe(o) { const g = origenInfo(o); if (!g) return null; if (g.carga) return g.carga.toneladas; if (g.cu) return g.cu.toneladas; if (g.tr) return g.tr.toneladas; return g.so?.toneladas || null; }

/* =====================================================================
   RENTAL Y LOGÍSTICA — detalle del servicio, lugares y kilómetros (SUPUESTO S21)
   ===================================================================== */
function lugares(entidadCtx) {
  const out = [];
  for (const pl of (md().plantas || [])) if (pl.lat != null) out.push({ id: pl.id, nombre: pl.nombre, tipo: pl.tipo, lat: pl.lat, lon: pl.lon, grupo: 'Plantas y puertos del grupo' });
  for (const c of md().clientes) if (c.lugar && mdUsable(c)) out.push({ id: 'CLI:' + c.id, nombre: c.lugar.nombre + ' · ' + c.nombre, tipo: 'cliente', localidad: c.lugar.localidad, lat: c.lugar.lat, lon: c.lugar.lon, cliente: c.id, grupo: 'Lugares de clientes' });
  return out;
}
function lugar(id) { return lugares().find(l => l.id === id) || null; }
function lugarNombre(id) { return lugar(id)?.nombre || id || '—'; }
function kmEntre(a, b) {
  const A = lugar(a), B = lugar(b); if (!A || !B) return null; if (A.id === B.id) return 0;
  const R = 6371, rad = x => x * Math.PI / 180; const dLat = rad(B.lat - A.lat), dLon = rad(B.lon - A.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(A.lat)) * Math.cos(rad(B.lat)) * Math.sin(dLon / 2) ** 2;
  const geo = 2 * R * Math.asin(Math.sqrt(h));
  return Math.round(geo * (md().parametros.factorRuta || 1.3));
}
function maquinariasRental(entidad) { return md().logistica.filter(l => l.bu && bu(l.bu)?.nombre === 'Rental' && (!entidad || l.entidad === entidad) && mdUsable(l)); }
function camionesDe(entidad) { return md().logistica.filter(l => l.esFlota && l.entidad === entidad && mdUsable(l)); }
/* viajes y km estimados del detalle logístico; costo de km para ambos detalles */
function kmDetalle(o) {
  const d = o?.detalle; if (!d) return null; const p = md().parametros;
  if (d.tipo === 'rental') { const km = (+d.kmEntrega || 0) + (+d.kmDevolucion || 0); return { tipo: 'rental', km, kmCosto: km * (p.costoKmTraslado || 0), nombre: 'Traslado de maquinaria (entrega + devolución)', base: km + ' km × ' + 'USD ' + fmtN(p.costoKmTraslado, 2) + '/km' }; }
  if (d.tipo === 'logistica') {
    const cam = recurso(d.camion); const cap = cam?.capacidadT || 30; const kmTramo = d.km != null ? +d.km : kmEntre(d.origen, d.destino);
    const viajes = o.toneladas ? Math.ceil(o.toneladas / cap) : 0; const kmTotal = kmTramo != null ? kmTramo * 2 * Math.max(1, viajes) : null;
    return { tipo: 'logistica', kmTramo, viajes, cap, kmTotal, kmCosto: (kmTotal || 0) * (p.costoKmCamion || 0), nombre: 'Kilómetros recorridos (' + (viajes || 1) + ' viajes ida y vuelta)', base: fmtT(kmTotal || 0) + ' km × ' + 'USD ' + fmtN(p.costoKmCamion, 2) + '/km' };
  }
  return null;
}
function detalleResumen(o) {
  const d = o?.detalle; if (!d) return '';
  if (d.tipo === 'rental') return Object.entries(d.maquinarias || {}).filter(([, n]) => n > 0).map(([id, n]) => n + ' × ' + recNombre(id)).join(', ') + ' · ' + fmtN(hoursBetween(o.ventana.inicio, o.ventana.fin) / 24, 1) + ' días · entrega ' + (d.kmEntrega || 0) + ' km · devolución ' + (d.kmDevolucion || 0) + ' km';
  if (d.tipo === 'logistica') { const k = kmDetalle(o); return (d.cantidad || 1) + ' × ' + recNombre(d.camion) + ' · ' + lugarNombre(d.origen) + ' → ' + lugarNombre(d.destino) + ' · ' + (k.kmTramo != null ? k.kmTramo + ' km' : 'km s/d') + (k.viajes ? ' · ' + k.viajes + ' viajes · ' + fmtT(k.kmTotal) + ' km totales' : ''); }
  return '';
}
/* recursos que el detalle pide al Planificador (se cargan como base de la asignación) */
function recursosDeDetalle(o) {
  const d = o?.detalle; const R = { muelle: null, equipos: [], deposito: null, balanza: null, funciones: {}, manos: {}, logistica: {} }; if (!d) return R;
  if (d.tipo === 'rental') for (const [id, n] of Object.entries(d.maquinarias || {})) if (n > 0) R.logistica[id] = +n;
  if (d.tipo === 'logistica' && d.camion) { R.logistica[d.camion] = +d.cantidad || 1; R.funciones['F-SUP'] = 1; }
  return R;
}
