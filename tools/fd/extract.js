const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const FILE = 'file://' + path.resolve(__dirname, '../../dist/TyS - Maqueta ERP v2.0 - Orden de servicio.html');
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage(); await page.goto(FILE); await page.waitForSelector('#main .page-h');
  const data = await page.evaluate(() => {
    const m = md(); const MAP = mdMap();
    const fichas = mdFichas().map(f => ({ codigo: f.codigo, nombre: f.nombre, dominio: f.dominio, nivel: f.nivel, clave: f.clave, depende: f.depende, existeHoy: f.existeHoy, administra: f.administra, autoriza: f.autoriza, maqueta: !!f.maqueta, nAtributos: mdAtributos(f.codigo).length, nRegs: (MAP[f.codigo]?.coll() || []).length, abm: MD_ABM[f.codigo] ? (MD_ABM[f.codigo].coll || MD_ABM[f.codigo].tipos ? 'ABM directo' : MD_ABM[f.codigo].pantalla ? 'Pantalla ' + MD_ABM[f.codigo].pantalla : 'Derivado') : '—', descripcion: f.descripcion }));
    const roles = m.roles.map(r => ({ id: r.id, nombre: r.nombre, usuario: r.usuario, etapa: r.etapa, nota: r.nota || '', etapas: m.estados.filter(e => e.responsable === r.id).map(e => e.nombre), perm: resumenPermisos(r.id), modulos: m.modulos.filter(x => !moduloHabilitadoRol(x.id, r.id)).map(x => x.nombre.split(' (')[0]) }));
    const permisosMD = fichas.map(f => ({ codigo: f.codigo, nombre: f.nombre, niveles: m.roles.map(r => permisoMD(f.codigo, r.id)) }));
    return {
      version: VERSION, modelMeta: MODEL_META, counts: { fichas: MODEL_FICHAS.length, ext: MD_EXT.fichas.length, atributos: MODEL_ATRIBUTOS.length, atrExt: MD_EXT.atributos.length, reglas: MODEL_REGLAS.length, tx: MODEL_TX.length, ev: MODEL_EV.length, conv: MODEL_CONVENCIONES.length, def: MODEL_DEFINICIONES.length, dec: MODEL_DECISIONES.length, mapeo: MODEL_MAPEO.length, cruce: MODEL_CRUCE.length, dominios: MODEL_DOMINIOS.length, registros: fichas.reduce((s, f) => s + f.nRegs, 0), ordenes: S.orders.length },
      entidades: m.entidades.map(e => ({ id: e.id, nombre: e.nombre, sigla: e.sigla, tipo: e.tipo, localidad: e.localidad, modOff: modulosDeshabilitadosTxt('entidad', e.id) })),
      bus: m.bus.map(b => ({ id: b.id, nombre: b.nombre, entidad: entName(b.entidad), cc: b.cc, sup: !!b.sup, nota: b.nota || '', modOff: modulosDeshabilitadosTxt('bu', b.id) })),
      departamentos: m.departamentos.map(d => ({ id: d.id, nombre: d.nombre, entidad: entName(d.entidad), bus: d.bus.map(buName) })),
      relaciones: m.relaciones, roles, permisosMD, niveles: NIVELES_PERMISO,
      servicios: m.servicios.map(s => ({ id: s.id, nombre: s.nombre, nivel: s.nivel, requiereProducto: s.requiereProducto !== false, ambito: s.ambito.map(entName), destinatario: s.destinatario, medios: s.medios.map(x => medio(x)?.nombre || x), componentes: s.componentes.map(compName), usaDeposito: !!s.usaDeposito, cierre: rolName(s.cierre), bus: (s.busPrestadoras || []).map(buName), detalle: s.detalle || '', pendiente: !!s.pendiente, nota: s.nota || '' })),
      componentes: m.componentes, medios: m.medios, matriz: Object.entries(m.matrizEjecucion).map(([e, row]) => ({ entidad: ent(e)?.nombre || e, ...Object.fromEntries(Object.entries(row).map(([c, b]) => [compName(c), b ? buName(b) : '—'])) })),
      estados: m.estados, transiciones: m.transiciones.map(t => ({ ...t, deN: estadoName(t.de), aN: estadoName(t.a), rolN: t.rol === 'cierre' ? 'Rol de cierre del servicio' : t.rol === '*' ? '—' : rolName(t.rol) })),
      modulos: m.modulos, permisosModulos: m.permisosModulos, permisosModulosEntidad: m.permisosModulosEntidad, permisosModulosBU: m.permisosModulosBU,
      parametros: m.parametros, motivos: { modificacion: m.motivosModificacion, desvio: m.motivosDesvioPlan, devolucion: m.motivosDevolucion, anulacion: m.motivosAnulacion, responsabilidades: m.responsabilidades },
      causasDemora: m.causasDemora.map(c => ({ id: c.id, nombre: c.nombre, responsabilidad: c.responsabilidad, imputable: c.imputable_a })),
      tolerancias: (m.tolerancias || []).map(t => ({ id: t.id, nombre: t.nombre, parametro: t.parametro, valor: t.tolerancia_por_defecto, unidad: t.unidad, accion: t.accion_al_exceder, uso: t.uso })),
      fichas, dominios: MODEL_DOMINIOS, ordenCarga: MODEL_ORDEN_CARGA, auditoria: MODEL_AUDITORIA, ciclo: MODEL_CICLO,
      supuestos: SUPUESTOS, casos: CASOS.map(c => ({ n: c.n, titulo: c.titulo, esperado: c.esperado, rol: rolName(c.rol), pasos: c.pasos })),
      seccionesExpediente: SECS.map(s => s[1]), secs: SECS,
      lugares: lugares().map(l => ({ id: l.id, nombre: l.nombre, tipo: l.tipo, grupo: l.grupo })), maquinarias: maquinariasRental('TYS').map(x => ({ id: x.id, nombre: x.nombre, cantidad: x.cantidad, costoHora: x.costoHora })), camiones: camionesDe('TYS').map(x => ({ id: x.id, nombre: x.nombre, cantidad: x.cantidad, capacidadT: x.capacidadT, tercero: !!x.tercero })),
      recursos: { muelles: m.muelles.map(x => x.nombre + ' (' + x.id + ')'), equipos: m.equipos.map(x => x.nombre + ' (' + x.id + ', ' + x.tipo + ', ' + x.capacidadTh + ' t/h)'), depositos: m.depositos.map(x => x.nombre + ' (' + x.id + ', ' + fmtT(x.capacidadT) + ' t' + (x.fiscal ? ', fiscal' : '') + ')'), balanzas: m.balanzas.map(x => x.nombre + ' (' + x.id + ')'), logistica: m.logistica.map(x => x.nombre + ' (' + x.id + ' × ' + x.cantidad + ')'), manos: m.manos.map(x => x.nombre + ' (' + x.id + ')'), funciones: m.funciones.map(x => x.nombre + ' (' + x.id + ', dotación ' + x.dotacion + ')') },
      ordenesSeed: S.orders.map(o => ({ id: o.id, estado: estadoName(o.estado), servicio: srv(o.servicio)?.nombre, medio: medio(o.medio)?.nombre, destinatario: destinatarioNombre(o.destinatario), producto: prod(o.producto)?.nombre || '—', toneladas: o.toneladas, relacion: o.relacion, entidad: entName(o.entidad), bu: o.bu ? buName(o.bu) : '—' })),
      areas: (m.areas || []).map(a => ({ id: a.id, nombre: a.nombre, entidad: a.entidad, departamento: (m.departamentos.find(d => d.id === a.departamento) || {}).nombre || a.departamento, bus: (a.bus || []).map(buName), tipos: (a.tipos || []).map(t => TIPO_NOMBRE[t] || t), maestros: (a.tipos || []).map(t => TIPO_MAESTRO[t]), responsable: a.responsable_usuario, recursos: recursosDeArea(a).map(x => ({ id: x.r.id, nombre: x.r.nombre, tipo: x.tipo, capacidad: capacidadRecurso(x.r, x.tipo).total, um: capacidadRecurso(x.r, x.tipo).um })) })),
      reservas: reservas().map(r => ({ id: r.id, area: (m.areas.find(a => a.id === r.area) || {}).nombre || r.area, recurso: recNombre(r.rid), cantidad: r.cantidad, origen: origenLabel(r.origen), tipoOrigen: r.origen ? r.origen.tipo : '—', desde: r.desde, hasta: r.hasta, motivo: r.motivo, estado: r.estado, orden: r.orden })),
      estadosReserva: RESERVA_ESTADOS,
      lineupNominacion: S.ops.lineups.map(l => ({ id: l.id, buque: l.buque, totalBuque: l.toneladas_nominadas_total_buque, paraTys: l.toneladas_para_tys, nominado: !!l.nominado_a_tys, operativo: l.operativo_vinculado || '—', alcance: l.alcance_geografico })),
      atributosM17: mdAtributos('M-17').map(a => ({ n: a.n, atributo: a.atributo, star: !!a.star, tipo: a.tipo, obligatorio: a.obligatorio, regla: a.regla })),
      atributosM21: mdAtributos('M-21').map(a => ({ n: a.n, atributo: a.atributo, star: !!a.star, tipo: a.tipo, obligatorio: a.obligatorio, regla: a.regla })),
      motivosReserva: m.motivosReservaArea, motivosLiberacion: m.motivosLiberacionReserva,
      metodosSeguros: m.metodosSeguros.map(x => ({ id: x.id, nombre: x.nombre, aplica: [...(x.familias || []).map(famName), ...(x.productos || []).map(p => prod(p)?.nombre || p)].join(', '), vigencia: x.vigenciaHasta, accion: x.accion_al_vencer, aviso: x.dias_aviso })),
    };
  });
  fs.writeFileSync(path.join(__dirname, 'data.json'), JSON.stringify(data, null, 1));
  console.log('ok', Object.keys(data).length, 'claves · fichas', data.fichas.length, '· supuestos', data.supuestos.length, '· casos', data.casos.length);
  await browser.close();
})();
