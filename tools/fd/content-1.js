/* FD v2.0 — capítulos 1 a 6 */
module.exports = function (d, M, L) {
  const { h1, h1n, h2, h3, p, note, ul, ol, table, kvTable, spacer, flat } = L;
  const join = (a, sep = ' · ') => (a || []).join(sep);
  const fmtT = n => new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(Math.round(+n || 0));
  const out = [];

  /* ───────── 1. Introducción ───────── */
  out.push(h1n('1. Introducción'));
  out.push(h2('1.1 Propósito del documento'));
  out.push(p('Este Diseño Funcional (FD) describe **qué debe hacer el nuevo sistema core de TyS** para administrar la **orden de servicio** de una terminal portuaria y logística multiempresa: desde que Comercial transforma un negocio en una orden, pasando por la planificación de recursos, la ejecución en muelle y balanza, hasta el cierre de depósito y las comparativas de costos. Es la referencia funcional para el equipo de proyecto, las áreas usuarias y los proveedores que evaluarán el fit/gap del ERP.'));
  out.push(p(`La versión 2.0 se deriva **íntegramente de la maqueta navegable ${d.version}** ("TyS · Maqueta ERP v2 — Orden de servicio"), que el grupo recorrió y ajustó en las revisiones del 15 y 16 de septiembre de 2026. Todo lo que aquí se describe está implementado y se puede verificar en la maqueta; los **casos guiados** del capítulo 15 son el recorrido de aceptación de cada comportamiento.`));
  out.push(h2('1.2 Alcance'));
  out.push(p('El alcance funcional de esta versión comprende:'));
  out.push(ul([
    'La **estructura multiempresa**: grupo, entidades fiscales, unidades de negocio (BU) y departamentos, con relaciones interna, entre empresas del grupo y externa.',
    'El **catálogo de servicios** con nivel entidad / BU, medios, componentes, BU ejecutoras (matriz de ejecución) y rol de cierre.',
    'El **circuito completo de la orden de servicio** en cuatro etapas (Comercial / Backoffice → Planificador → Operaciones → Depósito) más dos roles de soporte (Logística de arribo y Máster data).',
    'Los **estados, transiciones, devoluciones y anulaciones** con motivo y registro.',
    'La **planificación con recomendación automática**, validaciones de disponibilidad, equipos del muelle o del buque, solicitud de habilitación a la BU dueña y cambio de fecha de arribo.',
    'La **ejecución** con tickets de balanza, ABM de recursos, demoras y cargos atribuibles.',
    'El **cierre** con merma / excedente dentro de tolerancia y las **comparativas** recomendado vs plan vs real y propios vs terceros.',
    'Los **servicios de Rental y Logística** (interna / externa) con su detalle propio.',
    'La **master data** completa según el modelo v3.1 (39 maestros), su ciclo de vida, permisos por maestro y rol, ABM genérico y registro de cambios.',
    'La **habilitación de módulos** por rol, entidad y BU.',
  ]));
  out.push(p('Quedan fuera de esta versión, y se enumeran en el capítulo 17 como definiciones pendientes: la facturación y aprobación de cargos adicionales, los circuitos específicos de Depósitos, Mantenimiento, Administración y Corporate, la integración con balanzas físicas y con el sistema contable, y la ubicación organizativa definitiva de Logística de arribo y Máster data.'));
  out.push(h2('1.3 Fuentes y documentos relacionados'));
  out.push(table(['Fuente', 'Versión', 'Uso en este documento'], [
    ['Maqueta navegable "TyS · Maqueta ERP v2 — Orden de servicio"', d.version, 'Fuente de verdad: pantallas, reglas, datos de demostración y casos guiados. Publicada en claude.ai y en Vercel; código en el repositorio Git.'],
    ['Especificación base de la maqueta (`maqueta-v2-orden-de-servicio-spec.md`)', '15–16/09/2026', 'Definiciones aportadas por el Analista Funcional y revisiones 1–21.'],
    ['Nota de construcción de la maqueta (`maqueta-v2-nota-construccion.md`)', 'v2.9.1', 'Supuestos de construcción y decisiones de diseño.'],
    [`Excel "${M.META.archivo}"`, `${M.META.version} · ${M.META.fecha}`, 'Modelo de master data: fichas, atributos, reglas, convenciones, orden de carga, transacciones y eventos (capítulo 9).'],
    ['FD v1.1 y revisión grupal del 15/09/2026', 'v1.1', 'Documento superado; conserva definiciones puntuales revalidadas en esta versión (manos por categoría, turnos de 6 h, método seguro como atributo).'],
    ['AS-IS v3.3 TyS San Nicolás · Arquitectura Funcional del ERP · Portafolio de servicios y roadmap', '—', 'Contexto de negocio y marco del programa; no se modifican.'],
  ], [0.4, 0.14, 0.46], { size: 17 }));
  out.push(spacer());
  out.push(h2('1.4 Cómo leer este documento'));
  out.push(p('Los capítulos 2 a 5 describen la estructura (organización, roles, servicios y la orden). Los capítulos 6 a 8 describen el comportamiento (proceso, estados y reglas). Los capítulos 9 a 13 describen la configuración (master data, módulos, costos e integraciones). Los capítulos 14 a 17 contienen el escenario de demostración, los casos de aceptación, los supuestos y las definiciones pendientes. Los anexos reproducen las matrices completas extraídas de la maqueta.'));
  out.push(p('Las referencias **S1…S22** y **A1…A5** remiten a los supuestos del capítulo 16: decisiones de diseño tomadas para poder construir la maqueta y que el grupo debe confirmar o corregir. Las referencias **M-xx** remiten a los maestros del modelo de master data (Anexo C). Los textos marcados con "(revisión dd/mm)" indican la sesión en la que el grupo definió ese comportamiento.'));
  out.push(note('Estado del documento: **base de referencia vigente** del proyecto. Reemplaza al FD v1.1 y a la app web v1.1 como fuente de verdad funcional. Cualquier elemento de los documentos previos que no esté contemplado aquí, o que lo contradiga, se considera superado hasta que se revalide.'));

  /* ───────── 2. Estructura organizativa ───────── */
  out.push(h1('2. Estructura organizativa'));
  out.push(h2('2.1 Niveles'));
  out.push(table(['Nivel', 'Función', 'Modelado'], [
    ['Grupo de empresas', 'Consolida la información de las entidades. Contexto "Grupo (consolidado)" en el selector de entidad.', 'Sin maestro propio; agrupa M-01.'],
    ['Entidad fiscal', 'Cada empresa que factura y registra: Terminales y Servicio (TyS), Terminal Timbúes (TT), Amarre y futuras entidades.', 'M-01 Unidad de negocio (sociedad que factura), según supuesto S16.'],
    ['Unidad de negocio (BU)', 'Pertenece a una entidad; tiene presupuesto, costos, centro de costo y facturación propios. Puede prestar servicios (nivel BU) o ejecutar componentes de servicios de la entidad.', 'M-35 Unidades de negocio (maestro propio de la maqueta).'],
    ['Departamento', 'Organiza funciones, usuarios y datos maestros de su ámbito; se vincula a una o más BU. Su relación exacta con las BU queda por definir (A3).', 'M-05 Áreas.'],
  ], [0.18, 0.5, 0.32]));
  out.push(spacer());
  out.push(h2('2.2 Entidades fiscales'));
  out.push(table(['Código', 'Entidad', 'Sigla', 'Tipo', 'Localidad', 'Menú de Operación deshabilitado'], d.entidades.map(e => [e.id, e.nombre, e.sigla, e.tipo, e.localidad, e.modOff]), [0.1, 0.24, 0.08, 0.24, 0.14, 0.2]));
  out.push(spacer());
  out.push(p('La columna "Menú de Operación deshabilitado" muestra la configuración inicial de la matriz por entidad (capítulo 10): "todos" significa que la entidad ve el menú completo.'));
  out.push(h2('2.3 Unidades de negocio'));
  out.push(p('Las BU definidas para TyS son Rental, Logística, Maquinarias, Depósitos, Mantenimiento, Corporate y Administración, más **Operaciones** (revisión 15/09: la descarga la realiza Operaciones, no Logística). Para TT se replican Operaciones, Logística y Depósitos. Las BU de las demás entidades deberán configurarse.'));
  out.push(table(['Código', 'BU', 'Entidad', 'Centro de costo', 'Menú de Operación deshabilitado', 'Nota'], d.bus.map(b => [b.id, b.nombre, b.entidad, b.cc, b.modOff, (b.sup ? 'Supuesto. ' : '') + (b.nota || '')]), [0.11, 0.15, 0.09, 0.12, 0.25, 0.28], { size: 17 }));
  out.push(spacer());
  out.push(h2('2.4 Departamentos'));
  out.push(table(['Código', 'Departamento', 'Entidad', 'BU vinculadas'], d.departamentos.map(x => [x.id, x.nombre, x.entidad, join(x.bus, ', ')]), [0.1, 0.3, 0.1, 0.5]));
  out.push(spacer());
  out.push(h2('2.5 Relaciones entre prestador y destinatario'));
  out.push(p('Cada orden clasifica la relación entre quien presta el servicio y quien lo recibe. La forma de imputar o facturar cada relación es **configurable** (Administración › Matriz de ejecución y relaciones, M-36); los valores iniciales son supuestos.'));
  out.push(table(['Relación', 'Descripción', 'Imputación inicial'], d.relaciones.map(r => [r.nombre, r.descripcion, r.imputacion + (r.sup ? ' (supuesto)' : '')]), [0.2, 0.45, 0.35]));
  out.push(spacer());
  out.push(h2('2.6 Administración de la estructura'));
  out.push(p('La administración permite crear entidades, BU y departamentos; definir servicios, presupuestos y estructuras de costos por BU; registrar servicios internos y externos; y **convertir una BU en entidad fiscal** conservando su historial. Criterio adoptado (A4): la conversión tiene una **fecha de vigencia** y cada orden guarda la entidad / BU vigente al crearla, del mismo modo en que congela las condiciones contractuales aplicadas. Las operaciones anteriores conservan su entidad original.'));

  /* ───────── 3. Roles y usuarios ───────── */
  out.push(h1('3. Roles y contexto de trabajo'));
  out.push(h2('3.1 Contexto activo'));
  out.push(p('Toda la aplicación trabaja con un **contexto activo** formado por tres selectores en la barra superior: **entidad** (una entidad fiscal o "Grupo (consolidado)"), **unidad de negocio** ("Todas las BU" o una BU de la entidad) y **rol**. El contexto filtra las órdenes, las bandejas, los recursos y el menú visible (capítulo 10). En la maqueta el selector de rol permite recorrer los casos como cada participante; en el sistema real el rol proviene del usuario autenticado (M-38).'));
  out.push(h2('3.2 Roles'));
  out.push(p('El circuito define **cuatro roles de etapa** y **tres roles de soporte** que no tienen etapa en el workflow de la orden y la consultan únicamente para visualizarla.'));
  out.push(table(['Rol', 'Nombre', 'Etapa del workflow', 'Estados que trabaja'], d.roles.map(r => [r.id, r.nombre, r.etapa ? `Etapa ${r.etapa}` : 'Soporte (sin etapa)', r.etapas.length ? join(r.etapas, ' · ') : 'Consulta las órdenes']), [0.1, 0.3, 0.2, 0.4]));
  out.push(note('La trazabilidad es **por rol**: cada acción queda registrada con el rol que la hizo, sin nombres de personas (S39). En el sistema real el usuario autenticado pertenece a un rol y a un área, y su identidad completará la traza.'));
  out.push(spacer());
  out.push(ul([
    '**Comercial / Backoffice (COM)** — crea la orden, registra la nacionalización, carga instrumentos o adendas, define toneladas y ventana del servicio; recibe devoluciones del Planificador.',
    '**Planificador (PLAN)** — asigna y confirma recursos, genera la solicitud a la BU dueña ante un recurso no disponible, puede cambiar la fecha de arribo.',
    '**Operaciones (OPS)** — verifica habilitaciones, ajusta el plan antes del inicio, inicia, registra tickets, demoras y ABM de recursos, finaliza; es la BU ejecutora de Descarga y Carga.',
    '**Depósito (DEP)** — sigue los ingresos, registra merma / excedente y cierra el operativo cuando el servicio usa depósito (rol de cierre configurable por servicio, A5).',
    '**Logística de arribo (LAR)** — administra el lineup, los cupos de camiones y los operativos ferroviarios; no interviene en las operaciones (supuesto S10).',
    '**Máster data (MD)** — hace el ABM de la master data, otorga o quita permisos por maestro a cada rol y valida las altas de los demás roles (supuesto S17).',
    '**Responsable de área (ARE)** — administra la capacidad de su sector (Logística, Rental, Depósitos, RRHH, Portería y balanza): ve la capacidad total y la comprometida, hace el ABM de sus recursos por el workflow de la master data y reserva capacidad para operativos futuros (supuestos S23 y S24, capítulo 10 bis).',
  ]));
  out.push(h2('3.3 Resumen de permisos sobre la master data'));
  out.push(p(`Cada rol tiene, para cada uno de los ${d.permisosMD.length} maestros, un nivel de permiso: no lo visualiza, solo consulta o puede ABM (capítulo 9.5). La matriz completa está en el Anexo A; el resumen inicial de demostración es:`));
  out.push(table(['Rol', 'No lo visualiza', 'Solo consulta', 'Puede ABM'], d.roles.map(r => [r.nombre, String(r.perm.oculto), String(r.perm.consulta), String(r.perm.abm)]), [0.4, 0.2, 0.2, 0.2]));
  out.push(spacer());
  out.push(p('Los módulos deshabilitados por rol se detallan en el capítulo 10 y en el Anexo B.'));

  /* ───────── 4. Catálogo de servicios ───────── */
  out.push(h1('4. Catálogo de servicios'));
  out.push(h2('4.1 Atributos de un servicio'));
  out.push(p('El servicio es la segunda selección de la orden (después de la entidad) y **define el resto de la carga**: qué medios admite, si requiere producto, qué destinatarios acepta, qué origen operativo corresponde y quién cierra. Cada servicio del catálogo (M-14 Tipos de servicios, con atributos ★ de la maqueta) lleva:'));
  out.push(table(['Atributo', 'Valores', 'Efecto'], [
    ['Nivel', 'entidad · BU', 'Nivel entidad: sin BU prestadora, el ámbito es la entidad y las BU intervienen como ejecutoras de sus componentes. Nivel BU: con BU prestadora elegida en la orden (supuesto S8).'],
    ['Ámbito', 'Entidades donde se ofrece', 'Filtra el catálogo según la entidad activa.'],
    ['Destinatario', 'terceros · misma entidad · grupo · mixto', 'Determina qué clientes se ofrecen y la relación (interna / grupo / externa).'],
    ['Medios', 'Buque · Camión · Ferrocarril · Solicitud · Interna · Externa', 'Cada medio tiene un origen operativo (4.2); Interna / Externa reemplazan el origen por el detalle del servicio (4.4).'],
    ['Requiere producto', 'Sí / No', 'Si es No, la orden omite el paso Producto (Rental, alquiler de espacio, prestaciones).'],
    ['Componentes', 'Descarga · Transporte · Depósito · Carga · Prestación', 'Cada componente lo ejecuta la BU que indica la matriz de ejecución (4.3) y genera su línea de costo.'],
    ['Usa depósito', 'Sí / No', 'Habilita la sección Depósito y el seguimiento de ingresos.'],
    ['Rol de cierre', 'Depósito · Operaciones · Backoffice', 'Quién ejecuta "Cerrar operativo" y las devoluciones desde Pendiente de cierre (A5).'],
    ['Detalle', '— · rental · logistica', 'Formulario de detalle específico en lugar del origen operativo.'],
  ], [0.16, 0.3, 0.54]));
  out.push(spacer());
  out.push(h2('4.2 Servicios iniciales'));
  out.push(table(['Código', 'Servicio', 'Nivel', 'Ámbito', 'Destinatario', 'Medios', 'Componentes', 'Cierre'], d.servicios.map(s => [s.id, s.nombre + (s.pendiente ? ' (alcance pendiente)' : ''), s.nivel, join(s.ambito, ', '), s.destinatario, join(s.medios, ', '), join(s.componentes, ', '), s.cierre || '—']), [0.08, 0.19, 0.07, 0.08, 0.13, 0.14, 0.17, 0.14], { size: 16 }));
  out.push(spacer());
  out.push(p('Notas por servicio:'));
  out.push(ul(d.servicios.filter(s => s.nota).map(s => `**${s.nombre}** — ${s.nota}`)));
  out.push(p('BU que intervienen en cada servicio (prestadora o ejecutoras):'));
  out.push(table(['Servicio', 'BU'], d.servicios.map(s => [s.nombre, join(s.bus, ', ') || '—']), [0.35, 0.65], { size: 17 }));
  out.push(spacer());
  out.push(h2('4.3 Medios y orígenes operativos'));
  out.push(p('Cada medio determina de dónde toma la orden su **origen operativo**: el registro que aporta cliente, producto, toneladas, fechas y calidad. Lineup, cupos y operativos ferroviarios los administra **Logística de arribo**; las solicitudes internas / externas son el origen de los servicios de las demás BU (Depósitos, Mantenimiento, Administración); Interna / Externa no tienen origen operativo y se completan con el detalle del servicio.'));
  out.push(table(['Medio', 'Origen operativo', 'Qué aporta a la orden'], d.medios.map(m => [m.nombre, m.origenNombre || 'Detalle del servicio', ({ BUQ: 'Escala del buque: ETA / ETB / ETC, muelle previsto, cargas por cliente, producto, BL, toneladas y calidad, equipos propios del buque (grúas o bombas).', CAM: 'Franja horaria, cantidad de camiones, cliente, producto, toneladas y calidad.', FER: 'Día del operativo, formación, cliente, producto, toneladas y calidad.', SOL: 'Solicitante, descripción, ventana y condiciones de la solicitud.', INT: 'Cliente = otra BU de la entidad (y, como supuesto, empresas del grupo); detalle de Rental o Logística.', EXT: 'Cliente = nómina de clientes; detalle de Rental o Logística.' })[m.id] || '']), [0.14, 0.22, 0.64]));
  out.push(spacer());
  out.push(h3('Nominación del lineup desde el operativo'));
  out.push(p('La escala del lineup (M-17) distingue las **toneladas nominadas totales del buque** —que pueden incluir carga para otras terminales del río— de las **toneladas para TyS**. Estas últimas, junto con la marca `nominado_a_tys` y el `operativo_vinculado`, **se alimentan de la creación de la orden** (revisión 16/09): al crear una orden sobre una carga de la escala se completan con las toneladas de las órdenes y sus números; al anularla se revierten, y una escala sin órdenes figura como no nominada. Se ve en la tarjeta de la escala en Logística de arribo, en la sección Origen del expediente y en Datos maestros › M-17.'));
  out.push(table(['Escala', 'Buque', 'Alcance', 't nominadas del buque', 't para TyS', 'Nominada', 'Operativo vinculado'], d.lineupNominacion.map(l => [l.id, l.buque, l.alcance, fmtT(l.totalBuque), fmtT(l.paraTys), l.nominado ? 'Sí' : 'No', l.operativo]), [0.14, 0.2, 0.17, 0.13, 0.11, 0.08, 0.17], { size: 16 }));
  out.push(spacer());
  out.push(h2('4.4 Matriz de ejecución'));
  out.push(p('La matriz **Servicio × Componente → BU ejecutora** es configurable en Administración (M-36). Define a qué BU se imputa cada línea de la orden. Valores iniciales (revisión 15/09): **Descarga y Carga → Operaciones**, Transporte → Logística, Depósito → Depósitos; las grúas las provee Maquinarias como recurso interno (S1, S20).'));
  out.push(table(['Entidad', 'Descarga', 'Transporte', 'Depósito', 'Carga', 'Prestación'], d.matriz.map(r => [r.entidad, r.Descarga, r.Transporte, r.Depósito, r.Carga, r.Prestación]), [0.25, 0.15, 0.15, 0.15, 0.15, 0.15]));
  out.push(spacer());
  out.push(h2('4.5 Servicios de Rental y Logística'));
  out.push(p('Para **Alquiler de maquinaria** (BU Rental) y **Servicios logísticos** (BU Logística) la selección es Entidad → Servicio → BU prestadora → **Medio Interna / Externa** → Cliente → (producto solo en Logística) → Instrumento → **Detalle del servicio**. Con Interna, en Cliente se muestran las otras BU de la entidad; con Externa, la nómina de clientes. El detalle reemplaza al origen operativo y llega al Planificador ya cargado como recursos a validar.'));
  out.push(table(['Servicio', 'Detalle que carga Comercial', 'Cálculo automático'], [
    ['Rental · Alquiler de maquinaria', `Una o más maquinarias del inventario de Rental (${join(d.maquinarias.map(m => m.nombre), ', ')}) con cantidad; fecha desde y hasta; km de entrega y km de devolución.`, `Duración en horas × costo horario de cada maquinaria + (km entrega + km devolución) × tarifa de traslado (${d.parametros.costoKmTraslado} USD/km).`],
    ['Logística · Servicios logísticos', `Camión (${join(d.camiones.map(c => c.nombre), ' o ')}) y cantidad; origen y destino entre plantas / puertos del grupo y lugares de los clientes; fechas; toneladas a transportar.`, `Km del tramo = distancia geodésica entre los lugares × factor de ruta ${d.parametros.factorRuta}; viajes estimados = toneladas / capacidad del camión; km totales ida y vuelta; costo = camiones × horas × costo horario + km totales × tarifa por km (${d.parametros.costoKmCamion} USD/km).`],
  ], [0.2, 0.42, 0.38]));
  out.push(spacer());
  out.push(p('El expediente muestra el detalle en la sección Origen y los km como ítem de costo (supuesto S21). Lugares disponibles como origen / destino en la demostración:'));
  out.push(table(['Código', 'Lugar', 'Tipo', 'Grupo'], d.lugares.map(l => [l.id, l.nombre, l.tipo, l.grupo]), [0.12, 0.44, 0.14, 0.3], { size: 17 }));
  out.push(spacer());

  /* ───────── 5. La orden de servicio ───────── */
  out.push(h1('5. La orden de servicio'));
  out.push(h2('5.1 Concepto'));
  out.push(p('La **orden de servicio** es el objeto central del sistema: representa un servicio contratado a una entidad o BU para un destinatario, sobre un origen operativo o un detalle, y recorre el circuito Comercial → Planificador → Operaciones → Depósito conservando un **único expediente** con toda su historia. Se numera por entidad y año (OS-2026-0001…). Una carga de lineup, un cupo o un tren pueden tener **más de una orden** (A2): el sistema advierte, muestra las órdenes vinculadas y propone las toneladas por el remanente.'));
  out.push(h2('5.2 Expediente'));
  out.push(table(['Sección', 'Contenido'], [
    ['Resumen', 'Entidad, ámbito (BU prestadora o entidad), relación, cliente, producto y calidad, servicio, medio, estado, toneladas y ventana del servicio (con "Editar toneladas y fechas" para Comercial), banderas de condiciones (nacionalización, método seguro), acciones de la etapa, devolver y anular.'],
    ['Origen', 'Referencia al lineup, cupo, operativo ferroviario o solicitud y sus datos; para Rental / Logística, el detalle del servicio (maquinarias o camiones, fechas, lugares, km).'],
    ['Contrato', 'Instrumento contractual o adenda, tarifas por componente y condiciones aplicadas (ritmo comprometido, franquicia, tolerancia), congeladas en la orden.'],
    ['Habilitaciones', 'Nacionalización (registrada por Comercial con referencia de despacho y responsable) y método seguro (derivado de la master data: producto o familia, procedimiento, vigencia).'],
    ['Planificación', 'Recomendación automática, plan aceptado con versión, recursos reservados, horarios, turnos y circuito previsto; ante devolución, el historial de planes.'],
    ['Ejecución', 'Inicio, tickets de balanza, toneladas acumuladas, ritmo, recursos aplicados con sus altas / bajas / reemplazos, demoras y cargos.'],
    ['Depósito', 'Ingresos por depósito, destino, merma / excedente y cierre.'],
    ['Costos y cargos', 'Imputación por BU ejecutora y componente, ítems de costo (recursos, km, manos), gastos adicionales atribuibles al cliente.'],
    ['Comparativas e historial', 'Recomendado vs plan vs real; propios vs terceros necesario vs aplicado; versiones, eventos, responsables y fechas.'],
  ], [0.22, 0.78]));
  out.push(spacer());
  out.push(note('Las **condiciones contractuales aplicadas quedan guardadas en la orden** para que cambios posteriores en los datos maestros no alteren su historia. El mismo criterio se aplica a la entidad / BU vigente al crearla (A4).'));
  out.push(h2('5.3 Datos del servicio: toneladas y ventana'));
  out.push(p('Al generar la orden, Comercial indica en **Datos del servicio** las **toneladas del producto a operar** —no siempre el total del lineup, del cupo o del tren genera la operación; el origen las propone (por el remanente si la carga ya tiene órdenes) y Comercial las edita— y la **fecha y hora de inicio y fin del servicio**, propuestas desde el origen (ETB → ETC del lineup, franja del cupo, día del operativo, ventana de la solicitud) y editables. **Esa ventana valida la disponibilidad de todos los recursos** en la planificación y define las reservas (revisión 15/09, supuesto S19).'));
  out.push(ul([
    'El fin debe ser posterior al inicio (bloquea).',
    'Superar las toneladas del origen o salirse de su ventana **advierte pero no bloquea**.',
    'Comercial puede modificar toneladas y fechas mientras la orden está en Borrador o Pendiente de planificación (Expediente › Resumen › **Editar toneladas y fechas**), con motivo, registro en el historial y recomendación regenerada.',
    'Desde Planificada, la modificación exige devolver la orden al Planificador o cambiar la fecha de arribo (S15).',
  ]));
  out.push(h2('5.4 Condiciones de la orden'));
  out.push(p('Además del estado de workflow, la orden exhibe dos **condiciones** que generan advertencias en Comercial, permiten planificar, pero **impiden iniciar el operativo** mientras no se cumplan:'));
  out.push(table(['Condición', 'Quién la resuelve', 'Cómo'], [
    ['Mercadería nacionalizada', 'Comercial / Backoffice', 'Registra la nacionalización en Habilitaciones con referencia de despacho y responsable (S3). Mercadería no nacionalizada restringe además depósitos y balanzas a los habilitados fiscalmente (M-10, M-26).'],
    ['Método seguro habilitado', 'Seguridad, desde la master data', 'No hay confirmación manual: el método seguro (M-34) está asignado al producto o a su familia con procedimiento y vigencia. Vencido con acción "bloquear el recurso" → no habilitado; dentro de los días de aviso → habilitado con observación.'],
  ], [0.22, 0.22, 0.56]));
  out.push(spacer());

  /* ───────── 6. Proceso end-to-end ───────── */
  out.push(h1('6. Proceso de punta a punta'));
  out.push(p('El circuito se organiza en cuatro etapas con responsable, objetivo, acciones y validaciones propias, más las funciones de los dos roles de soporte. Cada etapa ve las órdenes que debe trabajar en **Workflow · mi etapa** y todas las órdenes del contexto en **Operaciones · órdenes**; al guardar una etapa que pasa la orden al siguiente rol, la aplicación vuelve a "mi etapa".'));

  out.push(h2('6.1 Etapa 1 — Comercial / Backoffice'));
  out.push(p('**Objetivo:** transformar un negocio en una orden de servicio.'));
  out.push(h3('Selección secuencial'));
  out.push(p('La carga sigue una selección secuencial en la que cada elección filtra y habilita las siguientes; si se modifica un dato previo, se revisan las selecciones que dependen de él:'));
  out.push(p('**Entidad → Servicio → BU prestadora** (solo si el servicio es de nivel BU) **→ Medio → Cliente → Producto** (si el servicio lo requiere) **→ Instrumento contractual → Origen operativo o Detalle del servicio → Datos del servicio → Habilitaciones.**'));
  out.push(p('Al seleccionar el instrumento se incorporan las tarifas y condiciones de descarga, transporte y depósito; al seleccionar el origen, su información (cliente, producto, toneladas, fechas, calidad, equipos del buque).'));
  out.push(h3('Instrumento contractual sin cobertura'));
  out.push(p('Cuando para el destinatario no existe un instrumento vigente, el servicio no está contratado o el producto no está incluido, la pantalla muestra **por qué no aplica cada instrumento** y permite cargar desde la misma orden un **instrumento nuevo** o una **adenda** del existente. La adenda hereda tarifas y condiciones del instrumento padre y agrega servicio, producto y/o nueva vigencia; queda registrada en el maestro de Comercial (M-16) y seleccionada en la orden. Se asume que Comercial tiene atribución para hacerlo sin aprobación adicional (S9).'));
  out.push(h3('Rental y Logística'));
  out.push(p('Para los servicios con medio Interna / Externa, el paso de origen se reemplaza por el **detalle del servicio** descrito en 4.5. El wizard valida que haya al menos una maquinaria o un camión, fechas coherentes, km no negativos y, en Logística, origen y destino distintos.'));
  out.push(h3('Validaciones de la etapa'));
  out.push(ul([
    'Selección secuencial completa según el servicio.',
    'Toneladas mayores que cero; fin posterior al inicio; advertencias por exceso sobre el origen o ventana fuera del arribo.',
    'Habilitaciones registradas (pueden estar pendientes: advierten, no bloquean el envío).',
    'Carga del lineup ya vinculada a otra orden: advertencia, órdenes vinculadas y toneladas por remanente.',
  ]));
  out.push(p('**Acción principal:** «Crear y enviar a planificación». La orden sale de la bandeja de Comercial y entra en la del Planificador; Comercial la sigue consultando desde Operaciones · órdenes.'));

  out.push(note('**Presentación de la mercadería (revisión 17/09).** Al elegir el producto, Comercial confirma la **presentación** con la que se opera —granel sólido, líquido a granel, embolsado en big bag o en bolsa, contenedor—. La propone el producto (M-07) y queda guardada en la orden: la planificación, la ejecución y el depósito trabajan con la presentación real del operativo (S36).'));
  out.push(spacer());

  out.push(h2('6.2 Etapa 2 — Planificador'));
  out.push(p('**Objetivo:** definir cómo se realizará el servicio y reservar los recursos dentro de la ventana del servicio.'));
  out.push(table(['Recurso', 'Selección y regla'], [
    ['Muelle', 'Muelle de descarga / carga de la entidad (M-25). Se valida superposición con otras reservas en la ventana.'],
    ['Equipos de descarga / carga', 'Solo **grúas o sistemas de bombeo** (M-11). El tipo lo define el estado físico del producto en la master data (M-07.tipo): líquido → bombas; sólido, incluido embolsado → grúas. Se elige primero si son **del muelle** (inventario de la terminal) o **del buque** (declarados en el lineup por Logística de arribo, seleccionados por defecto). **La selección es excluyente:** con un origen no se ofrecen los equipos del otro, y los del buque se listan unidad por unidad para elegir cuántos se usan. Los del buque no consumen equipos del muelle, no generan superposición, no tienen costo para la terminal y se computan como recurso de tercero (S14).'],
    ['Depósito destino', 'Se elige recorriendo la **distribución de la planta**: planta (M-09) → depósito (M-10) → celda / tanque / galpón / silo (M-10a) → **box** → **mini box**; se puede parar en cualquier nivel y el destino es el último elegido, con su propia capacidad. Mercadería no nacionalizada → solo depósitos fiscales habilitados; se controla capacidad disponible y compatibilidad con el producto (S29).'],
    ['Balanza', 'Balanza del circuito (M-26); no nacionalizada → solo balanzas con habilitación fiscal vigente.'],
    ['Personal propio', 'Puestos y cantidad (M-05). Un puesto **puede estar afectado a más de un operativo**: cuando la demanda simultánea supera la dotación, el sistema calcula el **% de afectación** (dotación / demanda total), lo muestra en cada puesto y prorratea su costo; el porcentaje se congela al confirmar el plan (S25).'],
    ['Personal externo (manos)', '**Manos completas** por categoría (M-13) y, sobre esa composición, el ajuste **puesto por puesto**: se agregan o desafectan personas de cualquier puesto, esté o no en la mano asignada, al costo por persona y turno derivado de la mano (S30).'],
    ['Logística (flota)', 'Camiones propios y de transportista, por unidad completa; bloque separado de la maquinaria. Para Rental / Logística, las maquinarias o camiones del detalle vienen precargados (S31).'],
    ['Maquinaria', 'Palas, autoelevadores, minicargadora, retroexcavadora, grupo electrógeno, tolvas y cintas, cada una con **% de uso** para la orden: el remanente queda disponible para otro operativo de la misma ventana y el costo se prorratea (S31). Cada maquinaria se **despliega en sus unidades** (M-12a: interno, marca, modelo, año, capacidad, ancho y alto) y solo se ofrecen las que **entran por el acceso del destino** y están operativas; la cantidad sale de las unidades elegidas (S34).'],
    ['Habilitación de puerto', 'Rubro con el costo por operativo que fija cada puerto en la master data (M-09); el Planificador lo incluye o lo excluye (S32).'],
    ['Turnos', `**Cantidad de turnos** que fija el Planificador —el sistema propone la calculada por el ritmo, con eficiencia ${Math.round(d.parametros.eficienciaEquipo * 100)} % sobre la capacidad nominal— y régimen tomado de la **tabla de turnos M-33**: duración y catálogo T1…T4, ocupados en secuencia desde el inicio de la ventana (S26).`],
  ], [0.22, 0.78]));
  out.push(spacer());
  out.push(h3('Presentación del producto y ámbito de los recursos'));
  out.push(p('El formulario encabeza con el **producto y su presentación** —granel sólido, líquido a granel en tanque, embolsado en big bag o bolsa—, su familia, su estado físico y su densidad, porque la presentación define qué equipos, manos y depósitos son compatibles (S35). Cada recurso, además, lleva una marca de **ámbito**: Operaciones, Depósito o compartido entre los dos; el ámbito se arrastra a la ejecución y define qué rol puede asignarlo, modificarlo o liberarlo (S33).'));
  out.push(h3('Validaciones'));
  out.push(p('Disponibilidad en la ventana, superposición de reservas, capacidad, compatibilidad con el producto, habilitación fiscal, vigencia del método seguro de cada recurso (M-34) y reglas del circuito. Un recurso vencido con acción "bloquear el recurso" no se ofrece; dentro del aviso se ofrece con observaciones.'));
  out.push(h3('Recurso no disponible → solicitud a la BU dueña'));
  out.push(p('Cuando un recurso no está disponible, un botón **genera la solicitud a la BU dueña** con la información de la operación (orden, servicio, cliente, producto, ventana, toneladas y motivo). La BU responde —habilita o rechaza— y el Planificador revalida. El mapeo recurso → BU dueña y el circuito de respuesta son el supuesto S13.'));
  out.push(h3('Cambio de fecha de arribo'));
  out.push(p('Si un equipo del muelle está **ocupado por otro operativo**, junto al equipo aparece **Cambiar fecha de arribo**: el sistema propone el primer turno libre después de la reserva en conflicto, mantiene la duración de la ventana, corre ETA / ETB / ETC del lineup (o la fecha del cupo / tren), actualiza las órdenes vinculadas que aún no iniciaron y registra el cambio en Logística de arribo con el Planificador como responsable y la orden como motivo (S15).'));
  out.push(h3('Recomendación automática'));
  out.push(p(`El sistema genera y guarda una **combinación recomendada** con puntaje ponderado: costo ${Math.round(d.parametros.pesos.costo * 100)} % · duración ${Math.round(d.parametros.pesos.duracion * 100)} % · cumplimiento del ritmo contractual ${Math.round(d.parametros.pesos.cumplimiento * 100)} % (pesos configurables, S2). Evalúa primero los equipos del muelle y solo propone los del buque si no hay combinación factible con los propios. Se conservan por separado la recomendación con sus supuestos y la planificación aceptada por el Planificador, para la comparativa posterior.`));
  out.push(p('**Acción principal:** «Confirmar planificación y enviar a operaciones». **Devolver:** a Borrador, con motivo; Comercial la recibe como "Devuelta por Planificador".'));

  out.push(h2('6.3 Etapa 3 — Operaciones'));
  out.push(p('**Objetivo:** ejecutar el servicio y registrar lo que realmente ocurrió.'));
  out.push(h3('Antes del inicio'));
  out.push(p('El sistema verifica las habilitaciones: una orden puede estar planificada y recibida por Operaciones pero permanecer **pendiente de habilitación** para iniciar (nacionalización o método seguro). Operaciones puede **ajustar los recursos planificados** (muelle, equipos, depósito, balanza, personal, manos, logística) con las mismas validaciones del Planificador; el plan aceptado se conserva como **plan inicial** para la comparativa.'));
  out.push(h3('Durante la ejecución'));
  out.push(ul([
    '**Operaciones registra la calidad de la mercadería** (S28): llega declarada en el origen y Operaciones carga la efectiva, eligiéndola de la matriz de calidad del producto (M-23) o escribiéndola, con motivo, responsable y hora; queda en la orden y alimenta la comparativa por calidad.',
    'Los **tickets de balanza** registran fecha, hora, toneladas y balanza; actualizan las toneladas acumuladas y el ritmo (t/h y t/turno) frente al ritmo contractual.',
    'Operaciones hace **ABM de los recursos** —personal, maquinarias, depósitos, balanzas, muelle, logística—: alta, modificación de cantidad, reemplazo y baja; cada cambio registra recurso, momento, responsable y motivo (lista de motivos de modificación) y queda disponible para la comparativa.',
    'Las **demoras** registran causa (M-29), inicio y fin, responsabilidad (propia, tercero, fuerza mayor), tercero involucrado, gasto asociado y si es recuperable.',
    'Al incorporar recursos adicionales se puede indicar si el **gasto es atribuible al cliente**, con motivo y respaldo; la atribución queda registrada y su aprobación y facturación quedan por definir (pendiente 5).',
    `Al finalizar, un faltante entre lo previsto y lo acumulado mayor que la tolerancia (${d.tolerancias.find(t => t.id === 'TOL-DIF-FIN')?.valor} %) alerta y registra el desvío.`,
  ]));
  out.push(h3('Operaciones y Depósito en simultáneo'));
  out.push(p('Mientras se descarga el buque la mercadería ya entra a depósito, así que **las dos etapas trabajan la misma orden al mismo tiempo** (S35): la orden en ejecución aparece en la bandeja de Depósito como "ingreso en curso" y ambos roles pueden asignar, modificar y liberar recursos —cada uno sobre los de su ámbito y sobre los compartidos—, con la traza del rol que hizo cada movimiento. Operaciones sigue siendo quien registra tickets, demoras y calidad y quien finaliza el operativo.'));
  out.push(p('**Acción principal:** «Finalizar operativo y enviar a cierre» (a Depósito o al rol de cierre del servicio). **Devolver:** de Planificada a Pendiente de planificación (libera reservas, plan a historial) o de En ejecución a Planificada solo si no hay tickets.'));

  out.push(h2('6.4 Etapa 4 — Depósito (rol de cierre)'));
  out.push(p('**Objetivo:** acompañar los ingresos y realizar el cierre final. Depósito ve el progreso mientras Operaciones ejecuta, sin esperar el traspaso formal, y **gestiona los recursos del ingreso** —los de su ámbito y los compartidos— desde el panel *Recursos del ingreso* de la sección Depósito (S35).'));
  out.push(table(['Comparación', 'Qué permite evaluar'], [
    ['Circuito recomendado vs ejecución real', 'Diferencias de eficiencia, recursos, tiempo y costo respecto de la mejor combinación calculada.'],
    ['Planificación inicial vs ejecución real', 'Cambios durante el operativo (ABM de recursos, demoras) y su impacto.'],
    ['Recursos propios y de terceros: necesario vs aplicado', 'Cuánto recurso propio y de terceros exigía el plan y cuánto se aplicó, por muelle, mercadería, calidad y destino. Propios: muelle, equipos, camiones internos, palas y tolvas, personal propio, depósito y balanza; terceros: manos de proveedores, camiones de transportista y equipos del buque (S11).'],
  ], [0.3, 0.7]));
  out.push(spacer());
  out.push(p(`**Merma o excedente (S27).** No se cargan a mano: se aplican los que resultan de **lo que declara la balanza al finalizar el operativo** (toneladas previstas en la orden − toneladas pesadas). La pantalla de cierre muestra previsto, pesado y la diferencia. Si supera la tolerancia del instrumento contractual —o la tolerancia general ${d.parametros.toleranciaMermaPct} % si el instrumento no fija la suya (M-20)—, el cierre requiere autorización de Comercial (S12).`));
  out.push(p('**Acción principal:** «Cerrar operativo». Para servicios sin ingreso físico a depósito (carga, descarga costado vapor) cierra el rol configurado en el servicio (Operaciones), según A5. **Devolver:** a En ejecución, para que Operaciones registre lo que falte.'));

  out.push(h2('6.5 Rol de soporte — Logística de arribo'));
  out.push(p('Administra los tres orígenes operativos de los servicios a terceros: **lineup** (escalas de buques con ETA / ETB / ETC, muelle previsto, cargas por cliente / producto / BL con toneladas y calidad, equipos propios del buque), **cupos de camiones** (franja, cantidad, cliente, producto, toneladas) y **operativos ferroviarios** (día, formación, cliente, producto, toneladas), con alta, modificación, estado y **registro de cambios** (quién, cuándo, qué, motivo). Los cambios de fecha de arribo hechos por el Planificador aparecen aquí con la orden como motivo. Logística de arribo no interviene en las operaciones y consulta las órdenes solo para visualizarlas; los demás roles consultan los arribos (S10). La pantalla muestra las escalas como tarjetas legibles en escritorio y móvil.'));

  out.push(h3('6.5.1 El lineup: buque, bodegas, puertos y nominación (revisión 17/09)'));
  out.push(ul([
    '**El buque manda los datos.** La escala referencia un buque de **M-08**: al elegirlo se completan bandera, eslora, calado, equipos propios y **cantidad de bodegas**. Si el buque no existe se da de alta provisoriamente hasta homologar el IMO.',
    '**Una línea de carga por bodega.** El lineup abre tantas líneas como bodegas declara el buque. Pueden quedar **vacías** y la escala se registra **sin ningún BL**: el detalle llega de la agencia y se completa con el tiempo.',
    '**Puerto de descarga y operador por carga.** Cada línea indica en qué puerto se descarga y **quién opera esa carga**: nosotros, otro operador portuario o **ninguno**. Las cargas sin operador se muestran como **oportunidad comercial**.',
    '**Cantidades separadas.** La tarjeta distingue lo **declarado por el buque**, lo **nominado a nosotros** —que sale de las órdenes de servicio, con el puerto de cada una—, lo que **opera un tercero** y lo que está **sin operador**. Una misma combinación de cliente y producto puede nominarse a puertos distintos.',
    '**Secuencia de puertos.** Un buque puede atracar en más de un puerto: la escala guarda la rotación y **cada puerto tiene su propia ETA, ETB y ETC**. La escala de nuestra terminal es la que manda la ventana de las órdenes vinculadas.',
    '**Evolución de las fechas.** De ETA, ETB y ETC se conserva el **dato de origen** y **todos los cambios** en el orden en que se produjeron, con motivo y rol; el valor vigente queda al final.',
    '**Filtros.** La pantalla filtra por **estado del buque** (anunciado, confirmado, en rada, en operación, zarpó, cancelado) y por **puerto** de la rotación.',
  ]));
  out.push(note('Supuestos S37 y S38. Queda por definir de dónde llega el detalle de las cargas de terceros (manifiesto de la agencia o carga manual) y si los puertos de terceros se toman de un maestro común (M-09 ampliado) o de una interfaz con la agencia.'));
  out.push(spacer());

  out.push(h2('6.6 Rol de soporte — Responsable de área'));
  out.push(p('Cada área administra la capacidad de su propio sector desde el módulo **Mi área**: ve su capacidad total y la comprometida, hace el ABM de sus recursos —con el mismo formulario y el mismo workflow que la master data: el alta nace en validación y Máster data la publica— y **reserva capacidad para operativos futuros** referenciando un lineup, un cupo o un operativo ferroviario. Esas reservas se informan expresamente al Planificador y a Operaciones, y el área las revalida cuando la planificación elige otra opción. El detalle está en el capítulo 10 bis.'));
  out.push(h2('6.7 Rol de soporte — Máster data'));
  out.push(p('Es el dueño funcional de la master data: hace el ABM de todos los maestros y de las listas del modelo (convenciones, reglas, definiciones, decisiones), administra la matriz de permisos maestro × rol, **valida y publica o rechaza** desde su Workflow las altas y modificaciones que otros roles con permiso ABM dejaron "en validación", y consulta el registro de cambios completo. El detalle está en el capítulo 9.'));

  return flat(out);
};
