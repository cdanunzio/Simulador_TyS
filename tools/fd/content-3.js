/* FD v2.0 — capítulos 10 a 16 y anexos */
module.exports = function (d, M, L) {
  const { h1, h2, h3, p, note, ul, ol, table, kvTable, spacer, flat } = L;
  const join = (a, sep = ' · ') => (a || []).join(sep);
  const out = [];
  const modN = id => (d.modulos.find(m => m.id === id) || {}).nombre || id;
  const rolN = id => (d.roles.find(r => r.id === id) || {}).nombre || id;
  const buN = id => (d.bus.find(b => b.id === id) || {}).nombre || id;
  const entN = id => (d.entidades.find(e => e.id === id) || {}).nombre || id;

  /* ───────── 10. Módulos y pantallas ───────── */
  out.push(h1('10. Módulos, pantallas y navegación'));
  out.push(h2('10.1 Módulos'));
  out.push(p('El menú izquierdo se organiza en tres grupos: **Operación** (los módulos del circuito), **Configuración** (Datos maestros y Administración) y **Maqueta** (Casos guiados y Supuestos, que no forman parte del sistema real). Inicio es fijo y no se puede deshabilitar.'));
  out.push(table(['Código', 'Módulo', 'Grupo', 'Contenido'], d.modulos.map(m => [m.id, m.nombre + (m.fijo ? ' (fijo)' : ''), m.grupo, ({
    inicio: 'Contexto activo, pendientes de la etapa, alertas de habilitación y accesos directos (solo a módulos habilitados).',
    arribos: 'Lineup, cupos de camiones y operativos ferroviarios con alta, modificación, estado y registro de cambios; tarjetas por escala.',
    bandeja: 'Órdenes que el rol activo debe trabajar, pipeline de estados con la etapa resaltada y motivo de devolución; variante Máster data con registros en validación.',
    ordenes: 'Todas las órdenes del contexto, Nueva orden (wizard secuencial) y el expediente de nueve secciones.',
    recursos: 'Disponibilidad, reservas y asignaciones por recurso en línea de tiempo.',
    deposito: 'Ingresos en curso, progreso por depósito y cierre.',
    comparativas: 'Recomendado vs plan vs real; propios vs terceros necesario vs aplicado.',
    md: 'Modelo v3.1 completo: maestros por dominio y por área, ABM según permiso, permisos por rol, registro de cambios, auditoría, convenciones, orden de carga, definiciones, reglas, fuentes, cruce y transacciones / eventos.',
    admin: 'Entidades, BU, departamentos, usuarios, matriz de ejecución y relaciones, parámetros, workflows y Menú por rol, entidad y BU.',
    casos: 'Diecinueve recorridos guiados que abren el contexto y la pantalla del caso.',
    supuestos: 'Lista S1–S22 y A1–A5 con dónde se ve cada supuesto.',
  })[m.id] || '']), [0.12, 0.22, 0.12, 0.54], { size: 17 }));
  out.push(spacer());
  out.push(h2('10.2 Habilitación por rol, entidad y BU'));
  out.push(p('Cada módulo se **habilita o deshabilita por rol** desde Administración › **Menú por rol, entidad y BU**. Para el menú de Operación existen además dos matrices: **por entidad fiscal** y **por unidad de negocio**. El menú muestra la **intersección** rol activo ∧ entidad activa ∧ BU activa; con "Grupo (consolidado)" o "Todas las BU" no se aplica la restricción de esa dimensión. Configuración y Maqueta solo se administran por rol. La misma pantalla tiene un **simulador**: se elige rol, entidad y BU y se ve qué menú resulta y por qué queda oculto cada módulo. En la maqueta la edición no está restringida por rol; en el sistema real corresponde a Máster data o a Administración (S20, S22).'));
  out.push(h3('Comportamiento de la navegación'));
  out.push(ul([
    'Un enlace directo a un módulo deshabilitado vuelve a Inicio con aviso.',
    'Al cambiar el rol, la entidad o la BU, la pantalla actual vuelve a Inicio si el contexto nuevo no la tiene.',
    'Los accesos directos de Inicio y los enlaces internos (por ejemplo, a Depósito desde el expediente) solo se muestran si el módulo está habilitado.',
    'Cada cambio de las matrices queda en el registro de cambios de la master data.',
  ]));
  out.push(h3('Valores iniciales de demostración'));
  const offRows = [];
  for (const [rol, mods] of Object.entries(d.permisosModulos)) offRows.push(['Rol', rolN(rol), join(Object.keys(mods).filter(k => mods[k] === false).map(modN), ', ')]);
  for (const [e, mods] of Object.entries(d.permisosModulosEntidad)) offRows.push(['Entidad', entN(e), join(Object.keys(mods).filter(k => mods[k] === false).map(modN), ', ')]);
  for (const [b, mods] of Object.entries(d.permisosModulosBU)) offRows.push(['BU', buN(b) + ' (' + b + ')', join(Object.keys(mods).filter(k => mods[k] === false).map(modN), ', ')]);
  out.push(table(['Dimensión', 'Rol / entidad / BU', 'Módulos deshabilitados'], offRows, [0.14, 0.34, 0.52], { size: 17 }));
  out.push(spacer());
  out.push(p('Todo lo que no figura en la tabla está habilitado. La matriz completa (módulo × rol, módulo × entidad y módulo × BU) está en el Anexo B.'));
  out.push(h2('10.3 Pantallas principales'));
  out.push(table(['Pantalla', 'Contenido y reglas'], [
    ['Inicio', 'Entidad, BU y rol activos; pendientes y alertas; registros en validación para Máster data.'],
    ['Logística de arribo', 'Tarjetas por escala (buque, ETA / ETB / ETC, muelle, cargas con toneladas, órdenes vinculadas, equipos del buque), tablas de cupos y trenes, registro de cambios. Solo administra la logística de arribo.'],
    ['Workflow · mi etapa', 'Bandeja del rol con las órdenes de su etapa y las devueltas; pipeline con la etapa resaltada. Al guardar una etapa que pasa la orden al siguiente rol, la aplicación vuelve aquí.'],
    ['Operaciones · órdenes', 'Todas las órdenes del contexto en consulta, con filtros; Nueva orden; expediente completo con historial.'],
    ['Nueva orden (wizard)', 'Selección secuencial con validaciones en línea, explicación de por qué no aplica un instrumento, alta de instrumento / adenda, detalle de Rental / Logística, datos del servicio y habilitaciones.'],
    ['Expediente', 'Nueve secciones (5.2); acción principal de la etapa, devolver y anular; "Solo consulta" para Logística de arribo y Máster data.'],
    ['Planificador', 'Recomendación, formulario de recursos con disponibilidad y observaciones, equipos del muelle / buque, recursos no disponibles con solicitud a la BU dueña y cambio de fecha de arribo, resumen de costos.'],
    ['Recursos', 'Línea de tiempo de reservas por recurso y ventana.'],
    ['Depósito', 'Ingresos en curso, progreso, merma / excedente y cierre.'],
    ['Comparativas', 'Tablas recomendado / plan / real y propios / terceros por muelle, mercadería, calidad y destino.'],
    ['Datos maestros', 'Navegador por dominio y área; ficha, atributos, registros, reglas, fuentes y transacciones de cada maestro; barra de ABM según permiso; permisos por rol; registro de cambios.'],
    ['Administración', 'Pestañas: entidades y BU, departamentos, usuarios, matriz de ejecución y relaciones, parámetros, workflows, Menú por rol, entidad y BU (con simulador).'],
  ], [0.22, 0.78], { size: 17 }));
  out.push(spacer());
  out.push(h2('10.4 Diseño responsive'));
  out.push(p('La interfaz se adapta a tres cortes: **escritorio** (> 1180 px, menú lateral fijo), **tablet** (≤ 1180 px, tablas con ancho natural y desplazamiento horizontal) y **móvil** (≤ 860 px: menú en cajón lateral con botón hamburguesa, selectores de contexto dentro del cajón, formularios modales como hoja inferior, tarjetas apiladas en Logística de arribo y grillas de dos columnas). Los requisitos de uso en planta —muelle, balanza y depósito desde tablet o teléfono— se cubren con esta adaptación.'));

  /* ───────── 11. Costos y comparativas ───────── */
  out.push(h1('11. Costos, cargos y comparativas'));
  out.push(h2('11.1 Ítems de costo'));
  out.push(p('Cada orden calcula tres vistas de costo con la misma estructura de ítems: **recomendado** (combinación automática), **plan** (planificación aceptada, congelada como plan inicial) y **real** (recursos aplicados, tickets y demoras).'));
  out.push(table(['Ítem', 'Base de cálculo', 'Clasificación'], [
    ['Muelle', 'Turnos × costo por turno del muelle.', 'Propio'],
    ['Equipos de descarga / carga (grúas o bombas)', 'Horas efectivas × costo horario; los equipos del buque no tienen costo para la terminal.', 'Propio (muelle) · Tercero (buque)'],
    ['Depósito', 'Toneladas × tarifa diaria × días estimados / reales.', 'Propio'],
    ['Balanza', 'Turnos × costo por turno.', 'Propio'],
    ['Personal propio', 'Puestos × turnos × costo por turno.', 'Propio'],
    ['Manos de proveedores', 'Manos × turnos × costo por mano.', 'Tercero'],
    ['Camiones internos, palas y tolvas', 'Unidades × horas × costo horario.', 'Propio'],
    ['Camiones de transportista', 'Unidades × horas × costo horario.', 'Tercero'],
    ['Km de traslado (Rental) / Km de camión (Logística)', 'Km × tarifa por km (parámetros 8.1).', 'Según el recurso'],
    ['Demoras con gasto', 'Gasto declarado en la demora; recuperable o no.', 'Según responsabilidad'],
  ], [0.3, 0.5, 0.2], { size: 17 }));
  out.push(spacer());
  out.push(h2('11.2 Imputación'));
  out.push(p('Cada línea de la orden se imputa a la **BU ejecutora** del componente según la matriz de ejecución y a su centro de costo (M-35); la relación prestador / destinatario define la forma de imputar o facturar (transferencia interna, factura intercompany, factura a cliente). Las tarifas por componente provienen del instrumento contractual congelado en la orden.'));
  out.push(h2('11.3 Cargos adicionales'));
  out.push(p('Al incorporar un recurso o registrar una demora, Operaciones indica si el **gasto es atribuible al cliente**, con motivo y respaldo. La atribución queda registrada en Costos y cargos; el circuito de aprobación y facturación es una definición pendiente (5).'));
  out.push(h2('11.4 Comparativas'));
  out.push(p('Disponibles en el expediente y en el módulo Comparativas para toda orden desde Planificada; al cierre se completan con el real. Las dimensiones de análisis son muelle, mercadería, calidad y destino; la unidad de medida de la comparativa propios / terceros (horas-recurso, turnos, costo) es la definición pendiente 11.'));

  /* ───────── 12. Eventos e integraciones ───────── */
  out.push(h1('12. Transacciones, eventos e integraciones'));
  out.push(p(`El modelo v3.1 cataloga **${M.TX.length} transacciones** (TX) agrupadas por etapa del circuito, cada una con los maestros que toca y el **evento** que dispara, y **${M.EV.length} eventos** (EV) que alimentan el bus de eventos integradores del modelo TO-BE (registración contable automática, capa analítica y modelos de IA). En el sistema se consultan en Datos maestros › Transacciones y eventos; cada maestro muestra las transacciones que lo usan.`));
  out.push(h2('12.1 Eventos'));
  out.push(table(['Código', 'Etapa', 'Evento', 'Qué dispara'], M.EV.map(e => [e.codigo, e.etapa, e.nombre, e.dispara]), [0.1, 0.08, 0.32, 0.5], { size: 16 }));
  out.push(spacer());
  out.push(h2('12.2 Eventos propios del circuito de la orden'));
  out.push(p('Además del catálogo del modelo, el circuito de la orden produce eventos que deben quedar disponibles para la integración: orden creada / enviada a planificación, planificación confirmada (plan inicial congelado), solicitud de habilitación a BU dueña emitida / respondida, fecha de arribo modificada, operativo iniciado, ticket registrado, recurso agregado / modificado / dado de baja, demora registrada, operativo finalizado, cierre con merma / excedente, orden devuelta, orden anulada, instrumento / adenda creado, nacionalización registrada, registro de master data creado / validado / rechazado / dado de baja, permiso o módulo modificado. Cada uno lleva orden, usuario, rol, fecha y hora y los datos que cambiaron (historial del expediente y registro de cambios).'));
  out.push(h2('12.3 Transacciones'));
  out.push(table(['Código', 'Etapa', 'Transacción', 'Maestros', 'Evento'], M.TX.map(t => [t.codigo, t.etapa, t.transaccion, t.maestros, t.evento]), [0.08, 0.17, 0.35, 0.16, 0.24], { size: 15 }));
  out.push(spacer());
  out.push(h2('12.4 Integraciones previstas'));
  out.push(table(['Integración', 'Alcance en esta versión', 'Pendiente'], [
    ['Balanzas físicas', 'Los tickets se registran manualmente o se simulan.', 'Captura automática de peso, ticket fiscal.'],
    ['Sistema contable / ERP financiero', 'Imputación por BU, centro de costo y relación calculada en la orden.', 'Asiento automático por evento; factura intercompany y a cliente.'],
    ['Agencia marítima / lineup externo', 'Lineup administrado por Logística de arribo.', 'Carga desde los archivos de agencia y PSN (mapeo de fuentes del modelo).'],
    ['Aduana', 'Nacionalización registrada por Comercial con referencia.', 'Validación del despacho.'],
    ['Distancias', 'Cálculo geodésico × factor de ruta con coordenadas de los lugares.', 'Matriz de rutas o GPS (S21).'],
  ], [0.24, 0.4, 0.36], { size: 17 }));
  out.push(spacer());

  /* ───────── 13. Escenario de demostración ───────── */
  out.push(h1('13. Escenario de demostración'));
  out.push(p('El sistema se entrega con un escenario relativo al día de apertura (las fechas se calculan como desplazamientos, por eso la demostración no envejece) que cubre todos los estados y casos. **Reiniciar demo** vuelve al escenario inicial.'));
  out.push(h2('13.1 Órdenes'));
  out.push(table(['Orden', 'Estado', 'Servicio', 'Medio', 'Destinatario', 'Producto', 't', 'Relación', 'Entidad / BU'], d.ordenesSeed.map(o => [o.id, o.estado, o.servicio, o.medio, o.destinatario, o.producto || '—', o.toneladas ? String(o.toneladas) : '—', o.relacion, o.entidad + (o.bu && o.bu !== '—' ? ' / ' + o.bu : '')]), [0.11, 0.13, 0.15, 0.08, 0.15, 0.13, 0.06, 0.08, 0.11], { size: 15 }));
  out.push(spacer());
  out.push(h2('13.2 Recursos'));
  out.push(table(['Tipo', 'Recursos'], [
    ['Muelles', join(d.recursos.muelles, ' · ')],
    ['Equipos de descarga / carga', join(d.recursos.equipos, ' · ')],
    ['Depósitos', join(d.recursos.depositos, ' · ')],
    ['Balanzas', join(d.recursos.balanzas, ' · ')],
    ['Maquinarias de Rental', join(d.maquinarias.map(m => `${m.nombre} (${m.cantidad} u., ${m.costoHora} USD/h)`), ' · ')],
    ['Camiones', join(d.camiones.map(c => `${c.nombre} (${c.cantidad} u., ${c.capacidadT} t${c.tercero ? ', tercero' : ''})`), ' · ')],
  ], [0.22, 0.78], { size: 17 }));
  out.push(spacer());

  /* ───────── 14. Casos de aceptación ───────── */
  out.push(h1('14. Casos de aceptación (recorridos guiados)'));
  out.push(p('Los diecinueve casos guiados de la maqueta son la base del plan de pruebas de aceptación (UAT): cada uno indica el rol con el que se inicia, los pasos y el resultado esperado. Los recorridos están automatizados sobre la maqueta (más de 250 comprobaciones) y deben reproducirse sobre el sistema real.'));
  for (const c of d.casos) {
    out.push(h3(`Caso ${c.n} — ${c.titulo}`));
    out.push(kvTable([['Rol inicial', c.rol], ['Resultado esperado', c.esperado]], 0.22));
    out.push(spacer(60));
    out.push(...ol(c.pasos));
  }

  /* ───────── 15. Supuestos ───────── */
  out.push(h1('15. Supuestos de diseño (S1–S22, A1–A5)'));
  out.push(p('Decisiones tomadas para poder construir la maqueta sin esperar cada definición. Cada supuesto indica el pendiente que origina, el supuesto adoptado, qué impacta y dónde se ve en el sistema. **Deben confirmarse o corregirse con el grupo**; un cambio de supuesto se traduce en un cambio de configuración o de regla identificable.'));
  out.push(table(['Id', 'Origen', 'Tema', 'Supuesto adoptado', 'Impacto', 'Dónde se ve'], d.supuestos.map(s => [s.id, s.origen, s.tema, s.supuesto, s.impacto, s.donde]), [0.05, 0.09, 0.14, 0.4, 0.14, 0.18], { size: 15 }));
  out.push(spacer());

  /* ───────── 16. Definiciones pendientes ───────── */
  out.push(h1('16. Definiciones pendientes para completar el alcance'));
  out.push(p('Las decisiones que más influyen en el diseño, en el orden en que se fueron identificando. Las 1–7 provienen de la definición original; las 8–22 se agregaron en las revisiones del 15 y 16 de septiembre y tienen un supuesto de trabajo asociado.'));
  out.push(...ol([
    'Qué BU ejecuta cada servicio de TyS y TT (S1; Descarga y Carga → Operaciones desde la revisión 15/09, S20).',
    'Qué significa "mejor combinación" y cómo se calcula (S2).',
    'Quién actualiza y valida la nacionalización y el método seguro (S3).',
    'Cómo se obtiene la disponibilidad de recursos (S4).',
    'Cómo se aprueban y facturan los gastos adicionales (S5).',
    'Cómo cierra un servicio que no utiliza depósito (S6, A5).',
    'Qué recorrido tendrán los servicios de las otras BU (S7).',
    'Qué servicios son de nivel entidad y cuáles de nivel BU (S8).',
    'Atribuciones y circuito de aprobación para cargar instrumentos o adendas desde la orden (S9).',
    'Logística de arribo: si es un rol propio o una función de otro sector, y su relación con Comercial y Planificación (S10).',
    'Clasificación definitiva de recursos propios y de terceros y unidad de medida de la comparativa necesario vs aplicado (S11).',
    'Tratamiento de la merma o excedente fuera de tolerancia contractual: quién aprueba y cómo se registra (S12).',
    'Circuito de la solicitud de habilitación de recursos a la BU dueña: destinatario por tipo de recurso, plazos y respuesta (S13).',
    'Equipos del buque: quién los declara y valida, cómo se tarifan al cliente y cómo se computan en la comparativa propios / terceros (S14).',
    'Cambio de fecha de arribo desde la planificación: atribuciones del Planificador, coordinación con Logística de arribo y la agencia marítima, y efecto sobre las demás órdenes de la misma escala (S15).',
    'Validación de los registros de demostración de cada maestro con su área dueña y decisión sobre los atributos "definidos, sin uso aún" del modelo v3.1 (S16).',
    'Rol Máster data: ubicación organizativa, matriz definitiva de permisos por maestro y rol, circuito de validación de las altas de otros roles y alcance del ABM directo frente a los registros que se administran desde otras pantallas (S17).',
    'Devolución y anulación: si además del rol responsable pueden hacerlo Comercial o un supervisor, si la anulación requiere aprobación, efecto sobre cargos ya aprobados y sobre la facturación de toneladas descargadas antes de anular (S18).',
    'Toneladas y fechas del servicio: si se admite superar las toneladas del origen, hasta qué etapa las modifica Comercial y quién aprueba el cambio una vez planificada; relación entre la ventana del servicio y la del arribo (S19).',
    'BU Operaciones: alcance (¿también la carga de buques?), recursos que le pertenecen frente a Logística y Maquinarias, y quién administra la habilitación de módulos (S20).',
    'Rental y Logística: si las empresas del grupo entran en "Interna" o en un tercer medio; inventario definitivo de maquinarias y tarifas; fuente de las distancias y tarifa por km; si el origen / destino admite direcciones libres (S21).',
    'Menú por entidad y BU: si la restricción por BU se aplica también con "Todas las BU" (unión o intersección), quién administra las tres matrices, si Configuración debe tener dimensión entidad; gobierno de las listas del modelo (quién aprueba una regla o convención nueva, versionado frente al Excel v3.1) (S22).',
  ]));
  out.push(spacer());
  out.push(h2('16.1 Definiciones adicionales propuestas (A1–A5)'));
  out.push(table(['#', 'Definición', 'Por qué importa', 'Opciones visibles / criterio adoptado'], [
    ['A1', 'Estructura de la orden para servicios combinados', 'Determina cómo se imputa a las BU ejecutoras un servicio que el cliente contrata como uno solo.', '(a) Orden única con líneas de servicio por BU —adoptado en la maqueta—; (b) orden madre + sub-órdenes internas; (c) una orden por servicio.'],
    ['A2', 'Cardinalidad origen operativo ↔ orden', 'Un lineup puede tener varios clientes / productos / BL; una carga puede requerir más de una orden.', 'Adoptado: una carga admite N órdenes con advertencia y toneladas por remanente.'],
    ['A3', 'Relación Departamento ↔ BU', 'Define permisos, ámbito de maestros y a quién le llega cada bandeja.', '(a) Departamento pertenece a una BU; (b) departamento a nivel entidad y BU como dimensión económica (N:N) —adoptado—; (c) híbrido.'],
    ['A4', 'Entidad efectiva por fecha al convertir una BU en entidad', 'Contratos, tarifas y numeración deben "mudarse" desde la vigencia sin tocar la historia.', 'Adoptado: cada orden guarda la entidad / BU vigente al crearla.'],
    ['A5', 'Rol de cierre configurable por servicio', 'Resuelve el cierre sin depósito sin excepciones en el código.', 'Adoptado: atributo del servicio (Depósito / Operaciones / Backoffice).'],
  ], [0.05, 0.22, 0.33, 0.4], { size: 16 }));
  out.push(spacer());
  out.push(h2('16.2 Primer alcance funcional recomendado'));
  out.push(p('Una orden completa de TyS / TT con los cuatro roles del workflow (más Logística de arribo y Máster data como soporte), bloqueos de inicio, planificación recomendada, ejecución con incidencias, devolución o anulación en cada etapa y cierre comparativo; los servicios de Rental y Logística con su detalle; la master data completa con permisos y validación. La estructura multiempresa y los catálogos permiten extender después los circuitos a Depósitos, Mantenimiento, Administración y Corporate.'));

  /* ───────── Anexos ───────── */
  out.push(h1('Anexo A — Matriz de permisos por maestro y rol'));
  out.push(p('Valores iniciales de demostración. Niveles: **—** no lo visualiza · **C** solo consulta · **ABM** puede ABM. Columnas en el orden de los roles: ' + d.roles.map(r => `${r.id} = ${r.nombre}`).join('; ') + '.'));
  const abbr = n => n === 'oculto' ? '—' : n === 'consulta' ? 'C' : 'ABM';
  out.push(table(['Maestro', ...d.roles.map(r => r.id)], d.permisosMD.map(m => [`${m.codigo} ${m.nombre}`, ...m.niveles.map(abbr)]), [0.4, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1], { size: 16, zebra: true }));
  out.push(spacer());

  out.push(h1('Anexo B — Módulos por rol, entidad y BU'));
  const oper = d.modulos.filter(m => m.grupo === 'operacion'); const all = d.modulos;
  const onOff = (dim, key, m) => { const t = dim[key] || {}; return t[m.id] === false ? '—' : '✓'; };
  out.push(h2('B.1 Por rol (todos los módulos)'));
  out.push(table(['Módulo', ...d.roles.map(r => r.id)], all.map(m => [m.nombre, ...d.roles.map(r => onOff(d.permisosModulos, r.id, m))]), [0.4, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1], { size: 16, zebra: true }));
  out.push(spacer());
  out.push(h2('B.2 Menú de Operación por entidad'));
  out.push(table(['Módulo', ...d.entidades.map(e => e.sigla)], oper.map(m => [m.nombre, ...d.entidades.map(e => onOff(d.permisosModulosEntidad, e.id, m))]), [0.46, 0.18, 0.18, 0.18], { size: 16, zebra: true }));
  out.push(spacer());
  out.push(h2('B.3 Menú de Operación por unidad de negocio'));
  const shortMod = n => n.replace(' (incluye Nueva orden y expediente)', '').replace('Operaciones · órdenes', 'Órdenes').replace('Logística de arribo', 'Log. de arribo').replace('Workflow · mi etapa', 'Workflow');
  out.push(table(['BU', ...oper.map(m => shortMod(m.nombre))], d.bus.map(b => [`${b.nombre} (${b.id})`, ...oper.map(m => onOff(d.permisosModulosBU, b.id, m))]), [0.3, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1], { size: 15, zebra: true }));
  out.push(spacer());

  out.push(h1('Anexo C — Catálogo de maestros'));
  out.push(p(`${d.fichas.length} maestros: ${d.counts.fichas} del modelo v3.1 y ${d.counts.ext} propios de la maqueta (★). "Existe hoy" indica si el maestro tiene hoy una fuente en la operación; "ABM" indica cómo se administra en el sistema.`));
  out.push(table(['Código', 'Maestro', 'Dominio', 'Niv.', 'Depende de', 'Existe hoy', 'Administra', 'ABM', 'Atr.', 'Reg.'], d.fichas.map(f => [f.codigo + (f.maqueta ? ' ★' : ''), f.nombre, f.dominio.replace(/^2\.\d+ /, ''), String(f.nivel), f.depende, f.existeHoy, f.administra, f.abm, String(f.nAtributos), String(f.nRegs)]), [0.07, 0.16, 0.13, 0.06, 0.1, 0.1, 0.14, 0.12, 0.06, 0.06], { size: 14, zebra: true }));
  out.push(spacer());

  out.push(h1('Anexo D — Glosario'));
  out.push(table(['Término', 'Significado'], [
    ['Adenda', 'Extensión de un instrumento contractual que hereda sus tarifas y condiciones y agrega servicio, producto y/o vigencia.'],
    ['ABM', 'Alta, baja y modificación. En la master data la baja es lógica.'],
    ['BU', 'Unidad de negocio: pertenece a una entidad fiscal y tiene presupuesto, costos y facturación propios.'],
    ['Contexto activo', 'Entidad, BU y rol seleccionados en la barra superior; filtran órdenes, bandejas, recursos y menú.'],
    ['Cupo', 'Franja horaria asignada a una cantidad de camiones de un cliente y producto; origen operativo del medio Camión.'],
    ['Detalle del servicio', 'Datos propios de Rental (maquinarias, fechas, km) o Logística (camión, origen / destino, fechas, km) que reemplazan al origen operativo.'],
    ['En validación', 'Estado de un registro de master data creado o modificado por un rol distinto de Máster data; el circuito no lo usa hasta que Máster data lo publica.'],
    ['Entidad fiscal', 'Empresa del grupo que factura y registra (TyS, TT, Amarre…).'],
    ['ETA / ETB / ETC', 'Fecha estimada de arribo / atraque / finalización de la escala del buque.'],
    ['Expediente', 'Vista única de la orden con sus nueve secciones e historial.'],
    ['Habilitación', 'Condición para iniciar el operativo: nacionalización y método seguro.'],
    ['Instrumento contractual', 'Contrato, acuerdo o adenda vigente que fija tarifas y condiciones (ritmo, franquicia, tolerancia) para un cliente, servicio y producto.'],
    ['Lineup', 'Programa de escalas de buques con sus cargas; origen operativo del medio Buque.'],
    ['Mano', 'Cuadrilla de personal de un proveedor, por categoría y cantidad.'],
    ['Máster data (rol)', 'Rol dueño de la master data: ABM, permisos por maestro y validación de altas.'],
    ['Merma / excedente', 'Diferencia entre lo previsto y lo recibido al cierre; debe estar dentro de la tolerancia contractual.'],
    ['Método seguro', 'Procedimiento de seguridad con vigencia asignado a productos, familias y recursos (M-34); su vencimiento bloquea o advierte.'],
    ['Módulo', 'Entrada del menú (Inicio, Logística de arribo, Workflow, Órdenes, Recursos, Depósito, Comparativas, Datos maestros, Administración) habilitable por rol, entidad y BU.'],
    ['Nacionalización', 'Condición aduanera de la mercadería registrada por Comercial con referencia de despacho.'],
    ['Operativo ferroviario', 'Arribo de una formación con carga de un cliente y producto; origen operativo del medio Ferrocarril.'],
    ['Orden de servicio', 'Objeto central: servicio contratado a una entidad o BU para un destinatario sobre un origen o detalle; recorre el circuito con un expediente único.'],
    ['Origen operativo', 'Registro que da lugar a la orden: carga del lineup, cupo, operativo ferroviario o solicitud.'],
    ['Plan inicial', 'Planificación aceptada y congelada al confirmar; base de la comparativa plan vs real.'],
    ['Recomendación', 'Combinación de recursos calculada automáticamente con puntaje ponderado de costo, duración y cumplimiento.'],
    ['Rol de cierre', 'Rol que ejecuta "Cerrar operativo" según el servicio (Depósito, Operaciones o Backoffice).'],
    ['Ticket de balanza', 'Registro de una pesada: fecha, hora, toneladas y balanza; alimenta el acumulado y el ritmo.'],
    ['Ventana del servicio', 'Fecha y hora de inicio y fin definidas por Comercial; valida la disponibilidad de todos los recursos.'],
  ], [0.22, 0.78], { size: 17 }));
  out.push(spacer());

  out.push(h1('Anexo E — Documentos previos afectados'));
  out.push(table(['Documento previo', 'Situación tras esta versión'], [
    ['FD v1.1 (Word) y revisión grupal del 15/09/2026', 'Superado por este FD v2.0; conserva definiciones puntuales revalidadas (manos por categoría, turnos de 6 h, atributo Método seguro, administración del lineup por tramos que pasa a Logística de arribo).'],
    ['App web "TyS - Sistema de gestión operativa FD" v1.1', 'Superada; reconstruida como maqueta v2 alrededor de la orden de servicio.'],
    ['Excel master data v3.1 y especificación del modelo', 'Fuente del modelo incorporado en la maqueta; el Excel v2.0 de master data se deriva de la maqueta (pendiente de generar).'],
    ['Especificación base y nota de construcción de la maqueta', 'Vigentes; este FD las consolida en un documento único.'],
    ['AS-IS v3.3, Arquitectura Funcional del ERP, portafolio de servicios y roadmap', 'Siguen vigentes como contexto de negocio y marco del programa.'],
  ], [0.36, 0.64], { size: 17 }));
  out.push(spacer());

  return flat(out);
};
