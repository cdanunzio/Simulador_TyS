/* =====================================================================
   MASTER DATA COMPLETA — la maqueta adopta el modelo v3.1 (M-01..M-34 + M-10a)
   y lo extiende con lo que trajo la estructura nueva del 15/09 (M-35..M-38).
   Este archivo completa MD_SEED / OPS_SEED con los atributos del modelo y siembra
   los maestros que la maqueta no tenía. Los valores son de demostración (SUPUESTO S16).
   ===================================================================== */

/* ---------- extensiones del modelo propias de la maqueta ---------- */
const MD_EXT = {
  fichas: [
    { codigo: 'M-35', nombre: 'Unidades de negocio (BU)', descripcion: 'Unidad de negocio de la estructura nueva (15/09): presupuesto, costos y facturación propios dentro de una entidad fiscal (M-01). Puede convertirse en entidad fiscal con fecha de vigencia conservando el historial.', dominio: '2.1 Organización y contabilidad', nivel: 1, clave: 'codigo', depende: 'M-01 · M-02', existeHoy: 'Parcial (estructura societaria y de gestión)', fuenteCarga: 'Definición 15/09 (estructura de empresas y BU): Rental, Logística, Maquinarias, Depósitos, Mantenimiento, Corporate y Administración en TyS; las de TT y demás entidades se configuran.', administra: 'Administración y Finanzas', autoriza: 'Administración y Finanzas', equivV22: '— (nuevo en la estructura 15/09)', transacciones: 'Orden de servicio · líneas de ejecución · imputación', nAtributos: 8, comentario: 'Agregado por la maqueta v2: en el modelo v3.1 "Unidad de negocio" (M-01) es la sociedad que factura; en la estructura nueva esa es la entidad fiscal y la BU es un nivel intermedio.', maqueta: true },
    { codigo: 'M-36', nombre: 'Matriz de ejecución y relaciones', descripcion: 'Qué BU ejecuta —e imputa— cada componente de los servicios a terceros por entidad (SUPUESTO S1) y cómo se imputa cada relación de la orden (interna · entre empresas del grupo · externa).', dominio: '2.7 Servicios, tarifas y contratos', nivel: 2, clave: 'entidad+componente', depende: 'M-01 · M-14 · M-35', existeHoy: 'No', fuenteCarga: 'Definición 15/09 (pendiente 1): qué BU ejecuta cada servicio de TyS y TT.', administra: 'Comercial · Administración', autoriza: 'Administración y Finanzas', equivV22: '—', transacciones: 'Alta de la orden (líneas de ejecución) · costos y cargos', nAtributos: 5, comentario: 'Agregado por la maqueta v2 (S1 / A1).', maqueta: true },
    { codigo: 'M-37', nombre: 'Workflows de la orden de servicio', descripcion: 'Estados de la orden, transiciones, rol responsable y validación de cada acción; rol de cierre configurable por servicio (SUPUESTO S6).', dominio: '2.9 Parámetros generales', nivel: 1, clave: 'de+a', depende: 'M-14 · M-38', existeHoy: 'No', fuenteCarga: 'Definición 15/09 (workflow de 4 etapas y 6 estados).', administra: 'Máster data / Administrador', autoriza: 'Operaciones · Comercial', equivV22: '—', transacciones: 'Todas las acciones de la orden', nAtributos: 6, comentario: 'Agregado por la maqueta v2.', maqueta: true },
    { codigo: 'M-38', nombre: 'Usuarios, roles y permisos', descripcion: 'Roles del circuito (Comercial / Backoffice, Planificador, Operaciones, Depósito, Logística de arribo), su etapa del workflow, bandeja y permisos. Los usuarios se referencian desde la auditoría de cada maestro.', dominio: '2.1 Organización y contabilidad', nivel: 1, clave: 'codigo', depende: 'M-05 · M-35', existeHoy: 'Parcial', fuenteCarga: 'Definición 15/09 (roles del workflow) + relevamiento de usuarios por área.', administra: 'Máster data / Administrador', autoriza: 'Gerencia', equivV22: '—', transacciones: 'Todas (autorización por rol)', nAtributos: 6, comentario: 'Agregado por la maqueta v2.', maqueta: true },
  ],
  /* atributos ★ Maqueta (origen: definiciones del 15/09) */
  atributos: [
    { m: 'M-08', n: 8, atributo: 'equipos_propios', star: true, tipo: 'Estructura (tipo · cantidad · t/h)', obligatorio: 'No', dominio: 'grúa · bomba', parametro: 'No', regla: 'Equipos de descarga / carga propios del buque (grúas o bombas, cantidad y capacidad por unidad). El Planificador puede elegirlos en lugar de los del muelle (S14). Vacío = gearless.', origen: 'Maqueta v2 (15/09)', caracter: 'propio', equivV22: '—', revision: 'Pendiente' },
    { m: 'M-07', n: 18, atributo: 'familia_maqueta', star: true, tipo: 'Ref. M-07a', obligatorio: 'Sí', dominio: 'FERT-SOL · FERT-LIQ · FERT-EMB · CEREAL', parametro: 'No', regla: 'Agrupador de la maqueta para asignar método seguro y estado físico por familia (definición 15/09: el MS viene de la familia de producto o del producto).', origen: 'Maqueta v2 (15/09)', caracter: 'propio', equivV22: 'MD-13 Familia de producto', revision: 'Pendiente' },
    { m: 'M-14', n: 12, atributo: 'nivel', star: true, tipo: 'Enumerado', obligatorio: 'Sí', dominio: 'entidad · bu', parametro: 'No', regla: 'Nivel del servicio (S8): impacta a la entidad en su conjunto o a una BU prestadora.', origen: 'Maqueta v2 (15/09)', caracter: 'propio', equivV22: '—', revision: 'Pendiente' },
    { m: 'M-14', n: 13, atributo: 'rol_cierre', star: true, tipo: 'Ref. M-38', obligatorio: 'Sí', dominio: 'DEP · OPS · COM', parametro: 'Sí', regla: 'Rol que cierra el operativo (S6 / A5): Depósito por defecto; Operaciones para servicios sin ingreso a depósito.', origen: 'Maqueta v2 (15/09)', caracter: 'propio', equivV22: '—', revision: 'Pendiente' },
    { m: 'M-14', n: 14, atributo: 'requiere_producto', star: true, tipo: 'Lógico', obligatorio: 'Sí', dominio: 'V / F', parametro: 'No', regla: 'Si el servicio exige producto en la selección secuencial (los servicios de Rental, Depósitos, Mantenimiento y Administración no).', origen: 'Maqueta v2 (15/09)', caracter: 'propio', equivV22: '—', revision: 'Pendiente' },
    { m: 'M-16', n: 21, atributo: 'productos_incluidos', star: true, tipo: 'Ref. M-07 (múltiple)', obligatorio: 'No', dominio: 'vacío = todos', parametro: 'No', regla: 'Productos cubiertos por el instrumento; si el producto de la orden no está incluido, Comercial carga una adenda (S9).', origen: 'Maqueta v2 (15/09)', caracter: 'propio', equivV22: '—', revision: 'Pendiente' },
    { m: 'M-16', n: 22, atributo: 'tarifas_por_componente', star: true, tipo: 'Estructura (componente → precio)', obligatorio: 'Sí', dominio: 'DES · TRA · DEP · CAR · SRV', parametro: 'Sí', regla: 'Tarifa por componente del servicio, congelada en la orden al crearla. Se publica también como registros de M-15.', origen: 'Maqueta v2 (15/09)', caracter: 'propio', equivV22: 'MD-10 Tarifa', revision: 'Pendiente' },
    { m: 'M-17', n: 30, atributo: 'cargas', star: true, tipo: 'Estructura (BL · cliente · producto · calidad · t)', obligatorio: 'Sí', dominio: '1..n cargas por escala', parametro: 'No', regla: 'Un lineup puede tener varias cargas (BL / cliente / producto); cada carga puede originar una o más órdenes (A2). La calidad se conserva en la orden.', origen: 'Maqueta v2 (15/09)', caracter: 'propio', equivV22: '—', revision: 'Pendiente' },
    { m: 'M-31', n: 16, atributo: 'transportista', star: true, tipo: 'Ref. M-06', obligatorio: 'No', dominio: 'proveedor de rubro transporte', parametro: 'No', regla: 'Transportista que trae los camiones del cupo.', origen: 'Maqueta v2 (15/09)', caracter: 'propio', equivV22: '—', revision: 'Pendiente' },
    { m: 'M-31', n: 17, atributo: 'calidad', star: true, tipo: 'Texto (60)', obligatorio: 'No', dominio: '—', parametro: 'No', regla: 'Calidad de la mercadería del cupo; pasa a la orden.', origen: 'Maqueta v2 (15/09)', caracter: 'propio', equivV22: '—', revision: 'Pendiente' },
    { m: 'M-32', n: 18, atributo: 'calidad', star: true, tipo: 'Texto (60)', obligatorio: 'No', dominio: '—', parametro: 'No', regla: 'Calidad de la mercadería del arribo; pasa a la orden.', origen: 'Maqueta v2 (15/09)', caracter: 'propio', equivV22: '—', revision: 'Pendiente' },
    { m: 'M-06', n: 11, atributo: 'rubro (valor agregado)', star: true, tipo: 'Enumerado (múltiple)', obligatorio: 'No', dominio: '+ ferrocarril · agencia marítima', parametro: 'No', regla: 'Se agregan los rubros "ferrocarril" (operador ferroviario, Definición Nº 17) y "agencia marítima" al enumerado del modelo.', origen: 'Maqueta v2 (15/09)', caracter: 'propio', equivV22: '—', revision: 'Pendiente' },
    { m: 'M-35', n: 1, atributo: 'codigo', star: false, tipo: 'Código (10)', obligatorio: 'Sí', dominio: '—', parametro: 'No', regla: '—', origen: 'Maqueta v2 (15/09)', caracter: 'propio', equivV22: '—', revision: 'Pendiente' },
    { m: 'M-35', n: 2, atributo: 'nombre', star: false, tipo: 'Texto (80)', obligatorio: 'Sí', dominio: '—', parametro: 'No', regla: '—', origen: 'Maqueta v2 (15/09)', caracter: 'propio', equivV22: '—', revision: 'Pendiente' },
    { m: 'M-35', n: 3, atributo: 'entidad', star: false, tipo: 'Ref. M-01', obligatorio: 'Sí', dominio: '—', parametro: 'No', regla: 'Entidad fiscal a la que pertenece la BU.', origen: 'Maqueta v2 (15/09)', caracter: 'propio', equivV22: '—', revision: 'Pendiente' },
    { m: 'M-35', n: 4, atributo: 'centro_costo', star: false, tipo: 'Ref. M-02', obligatorio: 'Sí', dominio: '—', parametro: 'No', regla: 'Centro de costo principal de la BU.', origen: 'Maqueta v2 (15/09)', caracter: 'propio', equivV22: '—', revision: 'Pendiente' },
    { m: 'M-35', n: 5, atributo: 'presupuesto_anual', star: false, tipo: 'Decimal (14,2)', obligatorio: 'No', dominio: '≥ 0 · USD', parametro: 'Sí', regla: 'Presupuesto propio de la BU.', origen: 'Maqueta v2 (15/09)', caracter: 'propio', equivV22: '—', revision: 'Pendiente' },
    { m: 'M-35', n: 6, atributo: 'servicios_que_presta', star: false, tipo: 'Ref. M-14 (múltiple)', obligatorio: 'No', dominio: '—', parametro: 'No', regla: 'Calculado desde M-14.unidades_negocio.', origen: 'Maqueta v2 (15/09)', caracter: 'calculado', equivV22: '—', revision: 'Pendiente' },
    { m: 'M-35', n: 7, atributo: 'convertida_en_entidad', star: false, tipo: 'Ref. M-01 + Fecha', obligatorio: 'No', dominio: '—', parametro: 'No', regla: 'Si la BU se convirtió en entidad fiscal: entidad destino y fecha de vigencia (A4). Las órdenes anteriores conservan entidad y BU originales.', origen: 'Maqueta v2 (15/09)', caracter: 'propio', equivV22: '—', revision: 'Pendiente' },
    { m: 'M-35', n: 8, atributo: 'estado', star: false, tipo: 'Enumerado', obligatorio: 'Sí', dominio: 'activa · convertida · inactiva', parametro: 'No', regla: '—', origen: 'Maqueta v2 (15/09)', caracter: 'propio', equivV22: '—', revision: 'Pendiente' },
    { m: 'M-36', n: 1, atributo: 'entidad', star: false, tipo: 'Ref. M-01', obligatorio: 'Sí', dominio: '—', parametro: 'No', regla: '—', origen: 'Maqueta v2 (15/09)', caracter: 'propio', equivV22: '—', revision: 'Pendiente' },
    { m: 'M-36', n: 2, atributo: 'componente', star: false, tipo: 'Enumerado', obligatorio: 'Sí', dominio: 'DES · TRA · DEP · CAR · SRV', parametro: 'No', regla: 'Componente del servicio (M-14.componentes).', origen: 'Maqueta v2 (15/09)', caracter: 'propio', equivV22: '—', revision: 'Pendiente' },
    { m: 'M-36', n: 3, atributo: 'bu_ejecutora', star: false, tipo: 'Ref. M-35', obligatorio: 'Sí', dominio: '—', parametro: 'Sí', regla: 'BU que ejecuta e imputa el componente (S1). Se aplica al crear la orden; las órdenes existentes conservan sus líneas.', origen: 'Maqueta v2 (15/09)', caracter: 'propio', equivV22: '—', revision: 'Pendiente' },
    { m: 'M-36', n: 4, atributo: 'relacion', star: false, tipo: 'Enumerado', obligatorio: 'Sí', dominio: 'Interna · Grupo · Externa', parametro: 'No', regla: 'Relación de la orden según el destinatario (BU de la misma entidad · otra entidad del grupo · cliente tercero).', origen: 'Maqueta v2 (15/09)', caracter: 'propio', equivV22: '—', revision: 'Pendiente' },
    { m: 'M-36', n: 5, atributo: 'imputacion', star: false, tipo: 'Texto (120)', obligatorio: 'Sí', dominio: '—', parametro: 'Sí', regla: 'Tratamiento de imputación / facturación de cada relación (transferencia interna · factura intercompany · factura al cliente).', origen: 'Maqueta v2 (15/09)', caracter: 'propio', equivV22: '—', revision: 'Pendiente' },
    { m: 'M-37', n: 1, atributo: 'estado', star: false, tipo: 'Código (12)', obligatorio: 'Sí', dominio: 'BORR · PEND_PLAN · PLANIF · EJEC · PEND_CIERRE · CERRADA', parametro: 'No', regla: 'Estados de la orden de servicio.', origen: 'Maqueta v2 (15/09)', caracter: 'propio', equivV22: '—', revision: 'Pendiente' },
    { m: 'M-37', n: 2, atributo: 'responsable', star: false, tipo: 'Ref. M-38', obligatorio: 'No', dominio: '—', parametro: 'No', regla: 'Rol responsable de la etapa (vacío = consulta).', origen: 'Maqueta v2 (15/09)', caracter: 'propio', equivV22: '—', revision: 'Pendiente' },
    { m: 'M-37', n: 3, atributo: 'transicion_de_a', star: false, tipo: 'Estructura', obligatorio: 'Sí', dominio: '—', parametro: 'No', regla: 'Transición admitida entre estados.', origen: 'Maqueta v2 (15/09)', caracter: 'propio', equivV22: '—', revision: 'Pendiente' },
    { m: 'M-37', n: 4, atributo: 'accion', star: false, tipo: 'Texto (80)', obligatorio: 'Sí', dominio: '—', parametro: 'No', regla: 'Acción que ejecuta la transición.', origen: 'Maqueta v2 (15/09)', caracter: 'propio', equivV22: '—', revision: 'Pendiente' },
    { m: 'M-37', n: 5, atributo: 'validacion', star: false, tipo: 'Texto (250)', obligatorio: 'Sí', dominio: '—', parametro: 'No', regla: 'Validaciones que deben cumplirse para la transición.', origen: 'Maqueta v2 (15/09)', caracter: 'propio', equivV22: '—', revision: 'Pendiente' },
    { m: 'M-37', n: 6, atributo: 'rol_cierre_por_servicio', star: false, tipo: 'Ref. M-14 → M-38', obligatorio: 'Sí', dominio: 'DEP · OPS · COM', parametro: 'Sí', regla: 'Rol de cierre configurable por servicio (S6).', origen: 'Maqueta v2 (15/09)', caracter: 'propio', equivV22: '—', revision: 'Pendiente' },
    { m: 'M-38', n: 1, atributo: 'codigo', star: false, tipo: 'Código (8)', obligatorio: 'Sí', dominio: 'COM · PLAN · OPS · DEP · LAR', parametro: 'No', regla: '—', origen: 'Maqueta v2 (15/09)', caracter: 'propio', equivV22: '—', revision: 'Pendiente' },
    { m: 'M-38', n: 2, atributo: 'nombre', star: false, tipo: 'Texto (60)', obligatorio: 'Sí', dominio: '—', parametro: 'No', regla: '—', origen: 'Maqueta v2 (15/09)', caracter: 'propio', equivV22: '—', revision: 'Pendiente' },
    { m: 'M-38', n: 3, atributo: 'etapa_workflow', star: false, tipo: 'Entero', obligatorio: 'No', dominio: '1..4 · vacío = sin etapa', parametro: 'No', regla: 'Etapa del workflow de la orden que trabaja el rol (Logística de arribo no tiene etapa, S10).', origen: 'Maqueta v2 (15/09)', caracter: 'propio', equivV22: '—', revision: 'Pendiente' },
    { m: 'M-38', n: 4, atributo: 'departamento', star: false, tipo: 'Ref. M-05', obligatorio: 'Sí', dominio: 'registro de tipo área', parametro: 'No', regla: '—', origen: 'Maqueta v2 (15/09)', caracter: 'propio', equivV22: '—', revision: 'Pendiente' },
    { m: 'M-38', n: 5, atributo: 'permisos', star: false, tipo: 'Texto (250)', obligatorio: 'Sí', dominio: '—', parametro: 'No', regla: 'Qué puede hacer el rol sobre la orden y los maestros.', origen: 'Maqueta v2 (15/09)', caracter: 'propio', equivV22: '—', revision: 'Pendiente' },
    { m: 'M-38', n: 6, atributo: 'usuario_demo', star: false, tipo: 'Texto (60)', obligatorio: 'No', dominio: '—', parametro: 'No', regla: 'Usuario de demostración que firma las acciones del rol en la maqueta.', origen: 'Maqueta v2 (15/09)', caracter: 'propio', equivV22: '—', revision: 'Pendiente' },
  ],
  /* mapeo de la estructura nueva (15/09) sobre el modelo v3.1 */
  cruce: [
    { estructura: 'Grupo de empresas', modelo: '— (atributo M-01.grupo_economico)', nota: 'El grupo consolida la información de las entidades; no es un maestro.' },
    { estructura: 'Entidad fiscal (TyS, Terminal Timbúes, Amarre…)', modelo: 'M-01 Unidad de negocio', nota: 'En el modelo v3.1 "Unidad de negocio" es la sociedad que factura y registra (CUIT). La maqueta la muestra como Entidad fiscal.' },
    { estructura: 'Unidad de negocio (Rental, Logística, Maquinarias, Depósitos, Mantenimiento, Corporate, Administración)', modelo: 'M-35 Unidades de negocio (BU) — nuevo', nota: 'Nivel intermedio con presupuesto, costos y facturación propios; referencia su centro de costo (M-02).' },
    { estructura: 'Departamento (funciones, usuarios, maestros de su ámbito)', modelo: 'M-05 Áreas (tipo área)', nota: 'Relación N:N con las BU (A3).' },
    { estructura: 'Funciones / puestos del personal propio', modelo: 'M-05 Áreas (tipo puesto) + M-28 Personal propio', nota: 'La dotación se planifica por puesto y cantidad, nunca por persona.' },
    { estructura: 'Catálogo de servicios (nivel entidad o BU)', modelo: 'M-14 Tipos de servicios', nota: 'Atributos ★ nivel, rol_cierre y requiere_producto agregados por la maqueta.' },
    { estructura: 'Instrumentos contractuales y adendas', modelo: 'M-16 Contratos (+ M-15 Tarifas)', nota: 'Las tarifas por componente del instrumento se publican como registros de M-15.' },
    { estructura: 'Lineup · cupos de camiones · operativos ferroviarios (Logística de arribo)', modelo: 'M-17 LineUp · M-31 Cupos de ingreso · M-32 Arribos ferroviarios', nota: 'Registros operativos administrados por Logística de arribo (S10); en el modelo se administran por tramos.' },
    { estructura: 'Depósitos (celda, tanque, galpón, silo) que asigna el Planificador', modelo: 'M-10a Celdas · boxes · tanques (detalle de M-10 Depósitos)', nota: 'La maqueta asigna la ubicación (M-10a); el depósito padre (M-10) aporta tipo fiscal y habilitaciones.' },
    { estructura: 'Grúas y sistemas de bombeo del muelle · palas, tolvas, cintas', modelo: 'M-12 Maquinaria', nota: 'Grúas móviles y bombas se asignan por unidad; palas, tolvas y cintas por cantidad (pool).' },
    { estructura: 'Equipos propios del buque', modelo: 'M-08 Buques (atributo ★ equipos_propios)', nota: 'Dato propio del buque (CV-9); el lineup referencia al buque.' },
    { estructura: 'Camiones internos y de transportista', modelo: 'M-11 Transporte (unidades) + pool de planificación', nota: 'La planificación usa cantidades; las unidades individuales viven en M-11.' },
    { estructura: 'Manos (personal externo)', modelo: 'M-13 Personal contratado', nota: 'Categoría con composición por roles; se planifica por cantidad de manos.' },
    { estructura: 'Método seguro por familia de producto o producto', modelo: 'M-34 Métodos seguros + M-07.metodo_seguro (+ familia_maqueta ★)', nota: 'La habilitación de la orden se deriva de la master data; vencido → bloquea el inicio.' },
    { estructura: 'Turnos de 6 h', modelo: 'M-33 Régimen de turnos', nota: 'La cantidad de turnos define la duración del operativo.' },
    { estructura: 'Tolerancia de merma / excedente, tolerancia de cierre', modelo: 'M-20 Tolerancias (+ M-16.merma_reconocida_pct)', nota: 'El instrumento puede fijar su propia tolerancia; si no, rige la general.' },
    { estructura: 'Estados y transiciones de la orden', modelo: 'M-37 Workflows — nuevo', nota: 'Rol de cierre configurable por servicio.' },
    { estructura: 'Roles del selector (Comercial, Planificador, Operaciones, Depósito, Logística de arribo)', modelo: 'M-38 Usuarios, roles y permisos — nuevo', nota: 'Las acciones de la orden se autorizan por rol.' },
    { estructura: 'Matriz de ejecución servicio × componente → BU · relaciones de imputación', modelo: 'M-36 Matriz de ejecución y relaciones — nuevo', nota: 'SUPUESTO S1 / A1.' },
  ],
};

/* ---------- completar MD_SEED con los atributos y maestros del modelo ---------- */
(function extendSeed() {
  const M = MD_SEED; const O = OPS_SEED;
  const cc = (bu) => (M.bus.find(b => b.id === bu) || {}).cc || null;

  /* M-01 Entidad fiscal (Unidad de negocio del modelo) */
  const cuits = { TYS: '30-70812345-6', TT: '30-71456789-0', AMA: '30-71698765-4' };
  for (const e of M.entidades) Object.assign(e, { cuit: cuits[e.id] || '—', grupo_economico: 'Grupo TyS', moneda_funcional: 'ARS', plan_cuentas: 'PC-' + e.id, estado: 'activa' });

  /* M-02 Centros de costo */
  M.centrosCosto = [
    ...M.bus.map(b => ({ id: b.cc, nombre: b.nombre, unidad_negocio: b.entidad, bu: b.id, tipo: ['TYS-MANT'].includes(b.id) ? 'mantenimiento' : ['TYS-CORP', 'TYS-ADM'].includes(b.id) ? 'administrativo' : 'operativo', estado: 'activo' })),
    { id: 'CC-180', nombre: 'Comercial / Backoffice', unidad_negocio: 'TYS', bu: null, tipo: 'comercial', estado: 'activo' },
    { id: 'CC-190', nombre: 'Planificación y Logística de arribo', unidad_negocio: 'TYS', bu: 'TYS-LOG', tipo: 'operativo', estado: 'activo' },
  ];

  /* M-03 Cuentas y objetos */
  M.cuentasObjeto = [
    { id: '4.1.01', nombre: 'Ingresos por descarga', centro_costo: 'CC-120', tipo: 'ingreso', estado: 'activo' },
    { id: '4.1.02', nombre: 'Ingresos por transporte', centro_costo: 'CC-120', tipo: 'ingreso', estado: 'activo' },
    { id: '4.1.03', nombre: 'Ingresos por almacenaje', centro_costo: 'CC-140', tipo: 'ingreso', estado: 'activo' },
    { id: '4.1.04', nombre: 'Ingresos por carga', centro_costo: 'CC-120', tipo: 'ingreso', estado: 'activo' },
    { id: '4.2.01', nombre: 'Ingresos intercompany y transferencias internas', centro_costo: 'CC-170', tipo: 'ingreso', estado: 'activo' },
    { id: '5.1.01', nombre: 'Costo de manos de estiba', centro_costo: 'CC-120', tipo: 'costo', estado: 'activo' },
    { id: '5.1.02', nombre: 'Costo de grúas y equipos', centro_costo: 'CC-130', tipo: 'costo', estado: 'activo' },
    { id: '5.1.03', nombre: 'Costo de flota y transporte', centro_costo: 'CC-120', tipo: 'costo', estado: 'activo' },
    { id: '5.1.04', nombre: 'Costo de personal propio', centro_costo: 'CC-170', tipo: 'costo', estado: 'activo' },
    { id: '5.2.01', nombre: 'Costo de depósito y muelle', centro_costo: 'CC-140', tipo: 'costo', estado: 'activo' },
    { id: '6.1.01', nombre: 'Gastos de mantenimiento', centro_costo: 'CC-150', tipo: 'gasto', estado: 'activo' },
    { id: 'OBJ-OS', nombre: 'Objeto operativo por orden de servicio (se abre automático con la orden)', centro_costo: null, tipo: 'objeto operativo', estado: 'activo', calculado: true },
  ];

  /* M-04 Tipos de comprobantes */
  M.tiposComprobante = [
    { id: 'FAC-A', nombre: 'Factura A (servicios al cliente)', unidad_negocio: 'TYS', centro_costo: 'CC-180', cuenta_objeto: '4.1.01', estado: 'activo' },
    { id: 'NC-A', nombre: 'Nota de crédito A', unidad_negocio: 'TYS', centro_costo: 'CC-180', cuenta_objeto: '4.1.01', estado: 'activo' },
    { id: 'FAC-IC', nombre: 'Factura intercompany', unidad_negocio: 'TYS', centro_costo: 'CC-170', cuenta_objeto: '4.2.01', estado: 'activo' },
    { id: 'TRF-INT', nombre: 'Transferencia interna a costo estándar', unidad_negocio: 'TYS', centro_costo: 'CC-170', cuenta_objeto: '4.2.01', estado: 'activo' },
    { id: 'TKB', nombre: 'Ticket de balanza', unidad_negocio: 'TYS', centro_costo: 'CC-120', cuenta_objeto: null, estado: 'activo' },
    { id: 'REM', nombre: 'Remito / carta de porte', unidad_negocio: 'TYS', centro_costo: 'CC-120', cuenta_objeto: null, estado: 'activo' },
  ];

  /* M-05 Áreas: departamentos (tipo área) y funciones (tipo puesto) */
  for (const d of M.departamentos) Object.assign(d, { tipo: 'área', unidad_negocio: d.entidad, estado: 'activo' });
  const puestoMS = { 'F-GRU': ['MS-OPER-GRUA'], 'F-BAL': ['MS-BALANZA'], 'F-PAL': ['MS-OPER-PALA'], 'F-SUP': [], 'F-DEP': ['MS-DEPOSITO'] };
  const puestoArea = { 'F-SUP': 'OPS', 'F-GRU': 'OPS', 'F-BAL': 'OPS', 'F-DEP': 'DEP', 'F-PAL': 'OPS' };
  for (const f of M.funciones) Object.assign(f, { tipo: 'puesto', unidad_negocio: 'TYS', area: puestoArea[f.id] || 'OPS', dotacion_minima_por_turno: f.id === 'F-SUP' ? 1 : 0, costo_horario_referencia: Math.round(f.costoTurno / 6 * 100) / 100, metodo_seguro: puestoMS[f.id] || [], estado: 'activo' });

  /* M-06 Clientes / Proveedores */
  const rubroCli = { 'Importador de fertilizantes': ['importador'], 'Trader': ['trader'], 'Fertilizantes líquidos': ['importador'], 'Acopio y exportación de granos': ['comprador'], 'Exportador de granos': ['comprador'] };
  for (const c of M.clientes) Object.assign(c, { razon_social: c.nombre, tipoM06: 'cliente', rubro: rubroCli[c.segmento] || ['otros'], condicion_fiscal: 'RI', correo: 'operaciones@' + c.nombre.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '') + '.com.ar', condicion_pago: '30 días fecha factura', limite_credito: 250000, estado: 'activo' });
  const rubroProv = { 'Personal de mano': ['estiba'], 'Transporte terrestre': ['transporte'], 'Agencia marítima': ['agencia marítima'], 'Ferrocarril': ['ferrocarril'] };
  M.proveedores.push({ id: 'PRV-05', nombre: 'Nuevo Central Argentino SA', rubro: 'Ferrocarril' }, { id: 'PRV-06', nombre: 'Belgrano Cargas y Logística SA', rubro: 'Ferrocarril' });
  const cuitProv = { 'PRV-01': '30-63456789-2', 'PRV-02': '30-70567890-1', 'PRV-03': '30-65432109-8', 'PRV-04': '30-68901234-5', 'PRV-05': '30-71234567-9', 'PRV-06': '30-71456780-3' };
  for (const p of M.proveedores) Object.assign(p, { razon_social: p.nombre, tipoM06: 'proveedor', rubroM06: rubroProv[p.rubro] || ['otros'], cuit: cuitProv[p.id] || '—', condicion_fiscal: 'RI', condicion_pago: p.rubro === 'Personal de mano' ? 'quincenal' : '30 días', estado: 'activo' });

  /* M-07 Productos (tipo define el equipo de descarga / carga: sólido → grúas · líquido → bombas) */
  const prodExt = {
    UREA: { tipo: 'sólido a granel', presentacion: 'granel', regimen_segregacion: true, unidad_conversion: '—', origen: 'Importado (Golfo Pérsico / Egipto)', color_caracteristico: 'Blanco perlado', tn_por_mano_turno: 600, merma_teorica_pct: 0.4, permanencia_estadistica_dias: 28 },
    DAP: { tipo: 'sólido a granel', presentacion: 'granel', regimen_segregacion: true, unidad_conversion: '—', origen: 'Importado (Marruecos / China)', color_caracteristico: 'Gris oscuro', tn_por_mano_turno: 600, merma_teorica_pct: 0.3, permanencia_estadistica_dias: 35 },
    UAN: { tipo: 'líquido', presentacion: 'tanque', regimen_segregacion: false, unidad_conversion: '1 m³ = 1,32 t', origen: 'Importado (Trinidad / Rusia)', color_caracteristico: 'Incoloro a ámbar', tn_por_mano_turno: null, merma_teorica_pct: 0.2, permanencia_estadistica_dias: 20 },
    'NPK-BB': { tipo: 'big bag', presentacion: 'big bag', regimen_segregacion: false, unidad_conversion: '1 big bag = 1,0 t', origen: 'Importado (Noruega)', color_caracteristico: 'Gris / rosado', tn_por_mano_turno: 400, merma_teorica_pct: 0.1, permanencia_estadistica_dias: 45 },
    SOJA: { tipo: 'sólido a granel', presentacion: 'granel', regimen_segregacion: true, unidad_conversion: '—', origen: 'Nacional', color_caracteristico: 'Amarillo', tn_por_mano_turno: 700, merma_teorica_pct: 0.3, permanencia_estadistica_dias: 12 },
    MAIZ: { tipo: 'sólido a granel', presentacion: 'granel', regimen_segregacion: true, unidad_conversion: '—', origen: 'Nacional', color_caracteristico: 'Amarillo anaranjado', tn_por_mano_turno: 700, merma_teorica_pct: 0.3, permanencia_estadistica_dias: 10 },
    TRIGO: { tipo: 'sólido a granel', presentacion: 'granel', regimen_segregacion: true, unidad_conversion: '—', origen: 'Nacional', color_caracteristico: 'Ámbar', tn_por_mano_turno: 700, merma_teorica_pct: 0.3, permanencia_estadistica_dias: 15 },
  };
  const famM07 = { 'FERT-SOL': 'fertilizante nitrogenado / fosforado', 'FERT-LIQ': 'fertilizante líquido', 'FERT-EMB': 'embolsado', CEREAL: 'cereal' };
  for (const p of M.productos) Object.assign(p, { familiaM07: p.id === 'UREA' ? 'fertilizante nitrogenado' : p.id === 'DAP' ? 'fertilizante fosforado' : famM07[p.familia], unidad_base: 'tonelada', regimen_regulatorio: 'ninguno', estado: 'activo' }, prodExt[p.id] || {});

  /* M-07a Familias (agrupador de la maqueta): nombre del estado físico */
  for (const f of M.familias) f.tipoEquipo = f.estadoFisico === 'liquido' ? 'Bombeo' : 'Grúa';

  /* M-21 Agencias marítimas / armadores (antes PRV-04 en proveedores) */
  M.agencias = [
    { id: 'AG-01', nombre: 'Agencia Marítima Delta SA', identificacion_fiscal: '30-68901234-5', rol: 'agencia', estado: 'activa' },
    { id: 'AG-02', nombre: 'Marsa Agencia Marítima SRL', identificacion_fiscal: '30-70345678-2', rol: 'agencia', estado: 'activa' },
    { id: 'AG-03', nombre: 'Naviera Austral Shipping', identificacion_fiscal: 'LR-4471209 (Liberia)', rol: 'armador', estado: 'activa' },
  ];

  /* M-22 Despachantes de aduana */
  M.despachantes = [
    { id: 'DA-01', nombre: 'Estudio Aduanero Rosales y Asoc.', cuit: '30-64567890-3', matricula: 'DA-12345', matricula_vencimiento: isoDay(320), estado: 'activo' },
    { id: 'DA-02', nombre: 'Despachos del Litoral SRL', cuit: '30-70123456-7', matricula: 'DA-22870', matricula_vencimiento: isoDay(95), estado: 'activo' },
  ];

  /* M-08 Buques (datos propios; equipos_propios ★ S14). El lineup referencia al buque. */
  const buques = {
    'MV Paraná Spirit': { imo: '9417213', bodegas: 5, eq: { tipo: 'Grúa', cantidad: 4, capacidadTh: 250 } },
    'MV Nordic Sun': { imo: '9563290', bodegas: 5, eq: null },
    'MV Río Carcarañá': { imo: '9236848', bodegas: 4, eq: { tipo: 'Grúa', cantidad: 3, capacidadTh: 220 } },
    'MV Baltic Trader': { imo: '9312476', bodegas: 4, eq: { tipo: 'Grúa', cantidad: 4, capacidadTh: 200 } },
    'MT Delta Queen': { imo: '9401835', bodegas: 6, eq: { tipo: 'Bombeo', cantidad: 2, capacidadTh: 300 } },
    'MV Ocean Harvest': { imo: '9698021', bodegas: 7, eq: null },
    'MV Pampa Star': { imo: '9745124', bodegas: 7, eq: null },
    'MV Costa Brava': { imo: '9350962', bodegas: 5, eq: { tipo: 'Grúa', cantidad: 4, capacidadTh: 250 } },
    'MV Southern Wind': { imo: '9509176', bodegas: 5, eq: { tipo: 'Grúa', cantidad: 4, capacidadTh: 240 } },
  };
  M.buques = []; let nb = 1;
  for (const lu of O.lineups) {
    const b = buques[lu.buque] || { imo: String(9000000 + nb * 137), bodegas: 5, eq: lu.equiposBuque || null };
    const id = 'BQ-' + String(nb++).padStart(2, '0');
    M.buques.push({ id, numero_imo: b.imo, nombre: lu.buque, eslora_m: lu.eslora, calado_m: lu.calado, cantidad_bodegas: b.bodegas, plan_bodegas: '—', estado: 'activo', equipos_propios: b.eq });
    lu.buqueId = id; delete lu.equiposBuque;
  }

  /* M-09 Plantas */
  M.plantas = [
    { id: 'PL-SN', nombre: 'Planta San Nicolás (TyS)', unidad_negocio: 'TYS', tipo: 'propia', provincia: 'Buenos Aires', localidad: 'San Nicolás de los Arroyos', codigo_postal: 'B2900', distancia_al_puerto_km: 1.5, habilitaciones: 'Municipal · bomberos · ambiental (OPDS)', fecha_habilitacion: '2025-03-01', fecha_vencimiento: isoDay(300), accion_al_vencer: 'alertar', centro_costo: 'CC-120', estado: 'activa', costo_flete_referencia_tn: 1.2, costo_almacenaje_tn_dia: null },
    { id: 'PU-SN', nombre: 'Puerto San Nicolás — muelles Norte y Sur', unidad_negocio: 'TYS', tipo: 'puerto', provincia: 'Buenos Aires', localidad: 'San Nicolás de los Arroyos', codigo_postal: 'B2900', distancia_al_puerto_km: 0, habilitaciones: 'Concesión portuaria (Consorcio)', fecha_habilitacion: '2020-01-01', fecha_vencimiento: '2035-12-31', accion_al_vencer: 'bloquear operativos nuevos', centro_costo: 'CC-120', estado: 'activa', costo_flete_referencia_tn: 0, costo_almacenaje_tn_dia: null },
    { id: 'PL-TT', nombre: 'Terminal Timbúes', unidad_negocio: 'TT', tipo: 'planta del grupo', provincia: 'Santa Fe', localidad: 'Timbúes', codigo_postal: 'S2204', distancia_al_puerto_km: 0, habilitaciones: 'Concesión portuaria · fiscal', fecha_habilitacion: '2021-06-01', fecha_vencimiento: isoDay(540), accion_al_vencer: 'alertar', centro_costo: 'CC-220', estado: 'activa', costo_flete_referencia_tn: 9.5, costo_almacenaje_tn_dia: null },
    { id: 'SAT-USINA', nombre: 'Satélite Usina', unidad_negocio: 'TYS', tipo: 'satélite propio', provincia: 'Buenos Aires', localidad: 'San Nicolás de los Arroyos', codigo_postal: 'B2900', distancia_al_puerto_km: 6, habilitaciones: 'Municipal', fecha_habilitacion: '2024-01-01', fecha_vencimiento: isoDay(120), accion_al_vencer: 'alertar', centro_costo: 'CC-140', estado: 'activa', costo_flete_referencia_tn: 2.1, costo_almacenaje_tn_dia: null },
    { id: 'SAT-COMIRSA', nombre: 'Satélite AFA / Comirsa (terceros)', unidad_negocio: 'TYS', tipo: 'satélite de terceros', provincia: 'Buenos Aires', localidad: 'Ramallo', codigo_postal: 'B2915', distancia_al_puerto_km: 12, habilitaciones: 'Provisorio aduanero (Comirsa)', fecha_habilitacion: '2026-02-01', fecha_vencimiento: isoDay(60), accion_al_vencer: 'bloquear operativos nuevos', centro_costo: 'CC-140', estado: 'activa', costo_flete_referencia_tn: 3.4, costo_almacenaje_tn_dia: 0.04 },
  ];

  /* coordenadas de demostración para el cálculo automático de km de los servicios logísticos (SUPUESTO S21) */
  const coords = { 'PL-SN': [-33.3383, -60.2203], 'PU-SN': [-33.3325, -60.2119], 'PL-TT': [-32.6742, -60.7965], 'SAT-USINA': [-33.3011, -60.2517], 'SAT-COMIRSA': [-33.4483, -60.0392] };
  for (const pl of M.plantas) if (coords[pl.id]) { pl.lat = coords[pl.id][0]; pl.lon = coords[pl.id][1]; }

  /* M-10 Depósitos (padre) y M-10a ubicaciones (= depositos de la maqueta) */
  M.depositosPadre = [
    { id: 'DEP-G1', nombre: 'Galpón 1', planta: 'PL-SN', tipo: 'fiscal', capacidad_total_tn: 45000, productos_aptos: ['UREA', 'DAP'], habilitacion: 'municipal · bomberos · ambiental', habilitacion_aduanera: { codigo: 'ADU-SN-0147', fecha: '2026-03-15' }, habilitaciones_regulatorias: '—', fecha_vencimiento_habilitaciones: isoDay(210), dias_alerta: 60, accion_al_vencer: 'bloquear ingreso al régimen', metodo_seguro: ['MS-DEPOSITO'], estado: 'activo' },
    { id: 'DEP-G2', nombre: 'Galpón 2', planta: 'PL-SN', tipo: 'nacional', capacidad_total_tn: 25000, productos_aptos: ['UREA', 'DAP', 'SOJA', 'MAIZ', 'TRIGO'], habilitacion: 'municipal · bomberos', habilitacion_aduanera: null, habilitaciones_regulatorias: '—', fecha_vencimiento_habilitaciones: isoDay(400), dias_alerta: 60, accion_al_vencer: 'alertar', metodo_seguro: ['MS-DEPOSITO'], estado: 'activo' },
    { id: 'DEP-PT', nombre: 'Parque de tanques', planta: 'PL-SN', tipo: 'fiscal', capacidad_total_tn: 14000, productos_aptos: ['UAN'], habilitacion: 'ambiental · bomberos (líquidos)', habilitacion_aduanera: { codigo: 'ADU-SN-0152', fecha: '2026-05-02' }, habilitaciones_regulatorias: '—', fecha_vencimiento_habilitaciones: isoDay(160), dias_alerta: 60, accion_al_vencer: 'bloquear ingreso al régimen', metodo_seguro: ['MS-DEPOSITO'], estado: 'activo' },
    { id: 'DEP-GE', nombre: 'Galpón embolsado', planta: 'PL-SN', tipo: 'nacional', capacidad_total_tn: 10000, productos_aptos: ['NPK-BB'], habilitacion: 'municipal · bomberos', habilitacion_aduanera: null, habilitaciones_regulatorias: '—', fecha_vencimiento_habilitaciones: isoDay(400), dias_alerta: 60, accion_al_vencer: 'alertar', metodo_seguro: ['MS-DEPOSITO', 'MS-EMB'], estado: 'activo' },
    { id: 'DEP-S3', nombre: 'Silo 3', planta: 'PL-SN', tipo: 'nacional', capacidad_total_tn: 25000, productos_aptos: ['SOJA', 'MAIZ', 'TRIGO'], habilitacion: 'municipal · SENASA', habilitacion_aduanera: null, habilitaciones_regulatorias: '—', fecha_vencimiento_habilitaciones: isoDay(250), dias_alerta: 60, accion_al_vencer: 'alertar', metodo_seguro: ['MS-DEPOSITO'], estado: 'activo' },
    { id: 'DEP-TT', nombre: 'Galpón Timbúes', planta: 'PL-TT', tipo: 'fiscal', capacidad_total_tn: 18000, productos_aptos: ['UREA', 'DAP', 'SOJA', 'MAIZ'], habilitacion: 'municipal · bomberos', habilitacion_aduanera: { codigo: 'ADU-TB-0031', fecha: '2026-01-20' }, habilitaciones_regulatorias: '—', fecha_vencimiento_habilitaciones: isoDay(330), dias_alerta: 60, accion_al_vencer: 'bloquear ingreso al régimen', metodo_seguro: ['MS-DEPOSITO'], estado: 'activo' },
  ];
  const ubiExt = { D1: { dep: 'DEP-G1', tipoM10a: 'celda', recep: 'cinta' }, D2: { dep: 'DEP-G2', tipoM10a: 'celda', recep: 'pala' }, D3: { dep: 'DEP-PT', tipoM10a: 'tanque', recep: 'cañería', cal: { codigo: 'CAL-T1-2026', fecha: '2026-04-10' } }, D4: { dep: 'DEP-GE', tipoM10a: 'box', recep: 'tolva' }, D5: { dep: 'DEP-S3', tipoM10a: 'celda', recep: 'fosa y noria' }, D6: { dep: 'DEP-TT', tipoM10a: 'celda', recep: 'cinta' } };
  for (const d of M.depositos) { const x = ubiExt[d.id] || {}; Object.assign(d, { deposito: x.dep || null, tipoM10a: x.tipoM10a || 'celda', metodo_recepcion: x.recep || 'pala', calibracion: x.cal || null, metodo_seguro: [], estadoM10a: 'activa' }); }

  /* M-11 Transporte (unidades). La planificación usa la cantidad del pool (logistica). */
  M.transporte = [
    { id: 'TR-01', tipo: 'camión tolva', caracteristica: 'volcadora · 3 ejes', patente: 'AD 412 KL / AE 220 RT', descripcion: 'Tolva 30 t propia', tara_certificada_tn: 14.6, capacidad_tn: 30, propiedad: 'propia', transportista: null, aptitud_por_producto: [], tara_vencimiento: isoDay(200), checklist_vigente: true, metodo_seguro: ['MS-TRANSP'], estado: 'habilitada' },
    { id: 'TR-02', tipo: 'camión tolva', caracteristica: 'volcadora · 3 ejes', patente: 'AD 415 KM / AE 221 RT', descripcion: 'Tolva 30 t propia', tara_certificada_tn: 14.4, capacidad_tn: 30, propiedad: 'propia', transportista: null, aptitud_por_producto: [], tara_vencimiento: isoDay(200), checklist_vigente: true, metodo_seguro: ['MS-TRANSP'], estado: 'habilitada' },
    { id: 'TR-03', tipo: 'camión batea', caracteristica: 'con lona · 4 ejes', patente: 'AC 908 JP / AD 118 QQ', descripcion: 'Batea 30 t propia', tara_certificada_tn: 15.1, capacidad_tn: 30, propiedad: 'propia', transportista: null, aptitud_por_producto: ['UREA', 'DAP', 'SOJA', 'MAIZ', 'TRIGO'], tara_vencimiento: isoDay(-5), checklist_vigente: true, metodo_seguro: ['MS-TRANSP'], estado: 'observada' },
    { id: 'TR-04', tipo: 'camión cisterna', caracteristica: 'acero inoxidable · 3 compartimentos', patente: 'AF 301 TX / AF 302 TX', descripcion: 'Cisterna 28 t propia', tara_certificada_tn: 13.9, capacidad_tn: 28, propiedad: 'propia', transportista: null, aptitud_por_producto: ['UAN'], tara_vencimiento: isoDay(150), checklist_vigente: true, metodo_seguro: ['MS-TRANSP'], estado: 'habilitada' },
    { id: 'TR-05', tipo: 'camión tolva', caracteristica: 'volcadora · 3 ejes', patente: 'AB 771 ZZ / AC 010 LM', descripcion: 'Tolva 30 t Transportes Litoral', tara_certificada_tn: 14.8, capacidad_tn: 30, propiedad: 'tercero', transportista: 'PRV-03', aptitud_por_producto: [], tara_vencimiento: isoDay(90), checklist_vigente: true, metodo_seguro: ['MS-TRANSP'], estado: 'habilitada' },
    { id: 'TR-06', tipo: 'camión tolva', caracteristica: 'volcadora · 3 ejes', patente: 'AB 774 ZA / AC 011 LM', descripcion: 'Tolva 30 t Transportes Litoral', tara_certificada_tn: 14.7, capacidad_tn: 30, propiedad: 'tercero', transportista: 'PRV-03', aptitud_por_producto: [], tara_vencimiento: isoDay(90), checklist_vigente: false, metodo_seguro: ['MS-TRANSP'], estado: 'habilitada' },
    { id: 'TR-07', tipo: 'plataforma', caracteristica: 'para big bags · 12 m', patente: 'AE 645 PP / AE 646 PP', descripcion: 'Plataforma Transportes Litoral', tara_certificada_tn: 12.2, capacidad_tn: 26, propiedad: 'tercero', transportista: 'PRV-03', aptitud_por_producto: ['NPK-BB'], tara_vencimiento: isoDay(300), checklist_vigente: true, metodo_seguro: ['MS-TRANSP'], estado: 'habilitada' },
    { id: 'TR-08', tipo: 'camión tolva', caracteristica: 'volcadora · 3 ejes', patente: 'AA 120 GH / AA 121 GH', descripcion: 'Tolva 30 t Transportes Litoral', tara_certificada_tn: 15.0, capacidad_tn: 30, propiedad: 'tercero', transportista: 'PRV-03', aptitud_por_producto: [], tara_vencimiento: isoDay(-20), checklist_vigente: false, metodo_seguro: ['MS-TRANSP'], estado: 'inhabilitada' },
  ];

  /* M-12 Maquinaria: grúas y bombas (equipos) + palas, tolvas y cintas (logistica) */
  const eqExt = { G1: { plan: 'Service cada 250 h', horo: 4120, prox: 4250, af: 'AF-2019-014' }, G2: { plan: 'Service cada 250 h', horo: 6875, prox: 7000, af: 'AF-2016-003' }, G3: { plan: 'Service cada 250 h', horo: 2990, prox: 3000, af: 'AF-2022-021' }, B1: { plan: 'Inspección cada 500 h', horo: 1210, prox: 1500, af: 'AF-2020-009' }, G4: { plan: 'Service cada 250 h', horo: 3540, prox: 3750, af: 'AF-2021-002' }, B2: { plan: 'Inspección cada 500 h', horo: 640, prox: 1000, af: 'AF-2023-011' } };
  for (const e of M.equipos) { const x = eqExt[e.id] || {}; Object.assign(e, { tipoM12: e.tipo === 'Bombeo' ? 'bomba' : 'grúa móvil', planta: e.entidad === 'TT' ? 'PL-TT' : 'PU-SN', plan_mantenimiento: x.plan || 'Service cada 250 h', centro_costo: cc(e.bu), activo_fijo_asociado: x.af || '—', horometro_actual: x.horo || 0, capacidad_operativa: e.capacidadTh + ' t/h', costo_hora_referencia: e.costoHora, proximo_mantenimiento_h: x.prox || null, metodo_seguro: [e.tipo === 'Bombeo' ? 'MS-BOMBEO' : 'MS-EQUIPOS'] }); }
  const logM12 = { 'L-PALA': 'pala', 'L-TOLVA': 'tolva', 'L-CINTA': 'cinta', 'L-TOLVA-TT': 'tolva', 'L-AUTOEL': 'autoelevador', 'L-MINI': 'minicargadora', 'L-RETRO': 'retroexcavadora', 'L-GENER': 'grupo electrógeno' };
  for (const l of M.logistica) { if (logM12[l.id]) Object.assign(l, { esMaquinaria: true, tipoM12: logM12[l.id], planta: l.entidad === 'TT' ? 'PL-TT' : 'PL-SN', plan_mantenimiento: 'Inspección mensual', centro_costo: cc(l.bu), horometro_actual: null, capacidad_operativa: (l.capacidadTh ? l.capacidadTh + ' t/h' : '—') + ' · ' + l.cantidad + ' unidades', costo_hora_referencia: l.costoHora, metodo_seguro: ['MS-EQUIPOS'], estado: 'Operativo' }); else Object.assign(l, { esFlota: true, metodo_seguro: ['MS-TRANSP'], estado: 'Operativo' }); }

  /* M-13 Personal contratado (manos) */
  for (const m of M.manos) Object.assign(m, { convenio: m.proveedor === 'PRV-01' ? 'CCT 62/75 SUPA (estiba)' : 'CCT 62/75 SUPA (estiba) · anexo líquidos', categoria: m.nombre, composicion_roles: Object.entries(m.roles).map(([r, q]) => q + ' ' + r.toLowerCase()).join(' · '), tarifa_mano: m.costoTurno, unidad_tarifa: 'por turno', moneda: 'USD', centro_costo: 'CC-120', metodo_seguro: ['MS-MANOS'], estado: 'activa', vigencia_desde_hasta: '2026-01-01 → 2026-12-31' });

  /* M-14 Tipos de servicios */
  const recSrv = { 'SRV-DTD': ['muelle', 'manos', 'maquinaria', 'flota', 'balanza', 'deposito'], 'SRV-DES': ['muelle', 'manos', 'maquinaria', 'balanza', 'deposito'], 'SRV-DCV': ['muelle', 'manos', 'maquinaria', 'balanza'], 'SRV-CAR': ['muelle', 'manos', 'maquinaria', 'balanza'], 'SRV-ALQM': ['maquinaria'], 'SRV-LOGI': ['flota'], 'SRV-ALQE': ['deposito'], 'SRV-MANT': [], 'SRV-ADM': [], 'SRV-MAQ': [] };
  const compM14 = { DES: 'descarga', TRA: 'transporte', DEP: 'almacenaje', CAR: 'carga', SRV: 'alquiler' };
  const origM14 = { BUQ: 'lineup', CAM: 'recepcion', FFCC: 'recepcion', SOL: 'solicitud', INT: 'detalle del servicio (interna)', EXT: 'detalle del servicio (externa)' };
  for (const s of M.servicios) Object.assign(s, { componentesM14: s.componentes.map(c => compM14[c]), origenM14: [...new Set(s.medios.map(m => origM14[m]))].join(' · ') || '—', recursos: recSrv[s.id] || [], controles: s.requiereProducto ? 'Instrumento vigente · nacionalización (bloquea inicio) · método seguro del producto (bloquea inicio) · validación de recursos' : 'Instrumento / acuerdo vigente · validación de recursos', etapas: s.medios.includes('SOL') ? 'Comercial → Planificador → Operaciones → cierre en ' + s.cierre : 'Comercial → Planificador → Operaciones → ' + (s.cierre === 'DEP' ? 'Depósito' : 'Operaciones (cierre)'), unidad_cuantificacion: s.componentes.includes('SRV') ? 'hora' : 'tonelada', unidades_negocio: s.nivel === 'entidad' ? s.ambito.map(e => 'Entidad ' + e) : s.busPrestadoras, metodo_seguro: s.componentes.includes('DES') || s.componentes.includes('CAR') ? ['MS-OPS-DESCARGA'] : [], estado: s.pendiente ? 'discontinuado' : 'activo' });

  /* M-16 Contratos (instrumentos) */
  const modal = { 'CTO-2026-014': 'DEPOSITO', 'CTO-2026-021': 'DEPOSITO', 'OC-2026-0877': 'DEPOSITO', 'CTO-2026-033': 'DEPOSITO', 'TAR-SPOT-2026': 'DIRECTO' };
  for (const i of M.instrumentos) Object.assign(i, { tipoM16: i.padre ? 'adenda' : 'contrato', ritmo_contractual_tn_turno: i.condiciones?.ritmoComprometido ? Math.round(i.condiciones.ritmoComprometido / 4) : null, tolerancia_entre_balanzas_pct: 4, perdida_de_identidad: (i.productos || []).some(p => ['SOJA', 'MAIZ', 'TRIGO'].includes(p)), documento: i.interno || i.grupo ? '—' : i.id + '.pdf', sla_aviso_dias_min_max: i.interno || i.grupo ? '—' : '15 – 30', volumen_comprometido_periodo_tn: i.id === 'CTO-2026-014' ? 120000 : i.id === 'CTO-2026-021' ? 60000 : i.id === 'CTO-2026-033' ? 90000 : null, tope_cupos_diario: i.id === 'CTO-2026-033' ? 45 : i.id === 'CTO-2026-014' ? 30 : null, modalidad_por_defecto: modal[i.id] || 'DEPOSITO', condicion_aduanera_prevista: i.cliente ? (['CTO-2026-033', 'TAR-SPOT-2026'].includes(i.id) ? 'nacional' : 'fiscal') : 'nacional', espacio_asignado: i.id === 'CTO-2026-014' ? ['D1'] : i.id === 'OC-2026-0877' ? ['D3'] : [] });

  /* M-15 Tarifas: una por instrumento × componente (publicadas desde M-16) */
  const srvComp = { DES: 'SRV-DES', TRA: 'SRV-LOGI', DEP: 'SRV-ALQE', CAR: 'SRV-CAR', SRV: 'SRV-ADM' };
  const umComp = { DES: 'por tonelada', TRA: 'por tonelada', DEP: 'por tonelada·día', CAR: 'por tonelada', SRV: 'por hora' };
  M.tarifas = []; let nt = 1;
  for (const i of M.instrumentos) for (const [c, v] of Object.entries(i.tarifas || {})) M.tarifas.push({ id: 'TAR-' + String(nt++).padStart(3, '0'), tipo_servicio: srvComp[c], componente: c, cliente: i.cliente, producto: i.productos || null, almacenaje: c === 'DEP' ? 'con almacenaje contratado' : 'indistinto', precio: v, unidad_tarifa: umComp[c], moneda: i.moneda, vigencia_desde: i.vigenciaDesde, vigencia_hasta: i.vigenciaHasta, estado: i.vigenciaHasta >= isoDay(0) ? (i.vigenciaDesde > isoDay(0) ? 'futura' : 'vigente') : 'vencida', equivalencia_unidad: c === 'TRA' ? '1 viaje = 30 t' : '—', contrato: i.id });

  /* M-18 Monedas y cotizaciones */
  for (const m of M.monedas) Object.assign(m, { fuente_cotizacion: m.id === 'ARS' ? 'BNA' : 'manual', fecha_cotizacion: isoDay(0), valor: m.id === 'USD' ? 1 : 1485.5, estado: 'activa' });

  /* M-33 Régimen de turnos (4 × 6 h) y M-19 Calendario y turnos */
  M.regimenTurnos = [
    { id: 'T1', nombre: 'Turno 1', orden: 1, hora_desde: '06:00', hora_hasta: '12:00', duracion_h: 6, planta: null, estado: 'activo' },
    { id: 'T2', nombre: 'Turno 2', orden: 2, hora_desde: '12:00', hora_hasta: '18:00', duracion_h: 6, planta: null, estado: 'activo' },
    { id: 'T3', nombre: 'Turno 3', orden: 3, hora_desde: '18:00', hora_hasta: '24:00', duracion_h: 6, planta: null, estado: 'activo' },
    { id: 'T4', nombre: 'Turno 4', orden: 4, hora_desde: '00:00', hora_hasta: '06:00', duracion_h: 6, planta: null, estado: 'activo' },
  ];
  M.turnos = { duracionH: 6, porDia: 4, nombres: M.regimenTurnos.map(t => t.id + ' ' + t.hora_desde.slice(0, 2) + '–' + t.hora_hasta.slice(0, 2)) };
  M.calendario = [];
  for (let d = -1; d <= 7; d++) { const dia = isoDay(d); const dow = new Date(dia + 'T12:00:00').getDay(); const feriado = d === 4; const clase = feriado ? 'feriado' : (dow === 0 || dow === 6) ? 'inhábil' : 'hábil';
    for (const t of M.regimenTurnos) M.calendario.push({ planta: 'PL-SN', fecha: dia, clase_dia: clase, turno_codigo: t.id, hora_desde: t.hora_desde, hora_hasta: t.hora_hasta, banda_horaria: t.id === 'T4' ? 'nocturna' : 'diurna', costo_habilitacion_inhabil: clase === 'hábil' ? 0 : 1800, estado: 'activo' }); }

  /* M-20 Tolerancias (parámetros con acción al exceder) */
  M.tolerancias = [
    { id: 'TOL-MERMA-CIERRE', nombre: 'Merma / excedente al cierre', parametro: 'Diferencia declarada sobre lo previsto', unidad: '%', tolerancia_por_defecto: M.parametros.toleranciaMermaPct, accion_al_exceder: 'requerir autorización', autoriza_excepcion: 'Comercial', estado: 'vigente', uso: 'Cierre del operativo (si el instrumento no fija la suya)' },
    { id: 'TOL-DIF-FIN', nombre: 'Diferencia al finalizar', parametro: 'Faltante entre previsto y acumulado al finalizar', unidad: '%', tolerancia_por_defecto: M.parametros.toleranciaCierrePct, accion_al_exceder: 'alertar y registrar desvío', autoriza_excepcion: 'Operaciones', estado: 'vigente', uso: 'Finalizar operativo' },
    { id: 'TOL-BALANZAS', nombre: 'Diferencia entre balanzas', parametro: 'Ticket fiscal de puerto vs. balanza TyS', unidad: '%', tolerancia_por_defecto: 4, accion_al_exceder: 'alertar y registrar desvío', autoriza_excepcion: 'Tráfico', estado: 'vigente', uso: 'Conciliación (fuera del alcance de la maqueta)' },
    { id: 'TOL-ETA', nombre: 'Variación de ETA', parametro: 'ETA nueva − ETA anterior', unidad: 'horas', tolerancia_por_defecto: 24, accion_al_exceder: 'alertar y registrar desvío', autoriza_excepcion: 'Logística de arribo', estado: 'vigente', uso: 'Logística de arribo (cambio de fechas)' },
    { id: 'TOL-CAMIONES-OP', nombre: 'Camiones por operativo', parametro: 'Camiones asignados vs. necesarios', unidad: 'camiones', tolerancia_por_defecto: 2, accion_al_exceder: 'alertar y registrar desvío', autoriza_excepcion: 'Logística', estado: 'vigente', uso: 'Planificación de logística' },
    { id: 'TOL-RITMO', nombre: 'Ritmo bajo el comprometido', parametro: 'Ritmo neto vs. ritmo contractual', unidad: '%', tolerancia_por_defecto: 10, accion_al_exceder: 'alertar y registrar desvío', autoriza_excepcion: 'Operaciones', estado: 'vigente', uso: 'Alertas de ejecución' },
    { id: 'TOL-ANTELACION', nombre: 'Antelación del aviso', parametro: 'ETA − fecha del aviso', unidad: 'días', tolerancia_por_defecto: 15, accion_al_exceder: 'alertar y registrar desvío', autoriza_excepcion: 'Comercial', estado: 'vigente', uso: 'Registro del aviso (fuera del alcance de la maqueta)' },
    { id: 'TOL-DOTACION', nombre: 'Dotación mínima por puesto', parametro: 'Cantidad planificada vs. mínimo del puesto', unidad: 'personas', tolerancia_por_defecto: 0, accion_al_exceder: 'requerir autorización', autoriza_excepcion: 'RRHH y Planta', estado: 'vigente', uso: 'Planificación de personal propio' },
  ];

  /* M-23 Matriz de calidad */
  M.matrizCalidad = [
    { id: 'MC-01', producto: 'UREA', parametro: 'humedad', calidad: 'estándar', rangos: '≤ 0,5 %' },
    { id: 'MC-02', producto: 'UREA', parametro: 'granulometría', calidad: 'granulada 46 % N', rangos: '2 – 4 mm ≥ 90 %' },
    { id: 'MC-03', producto: 'DAP', parametro: 'pureza/riqueza', calidad: 'grado estándar 18-46-0', rangos: 'N 18 % · P₂O₅ 46 %' },
    { id: 'MC-04', producto: 'UAN', parametro: 'pureza/riqueza', calidad: 'UAN 32 % N', rangos: 'N 31,5 – 32,5 % · densidad 1,32' },
    { id: 'MC-05', producto: 'NPK-BB', parametro: 'granulometría', calidad: 'NPK 15-15-15', rangos: '2 – 4 mm ≥ 90 % · bolsa íntegra' },
    { id: 'MC-06', producto: 'SOJA', parametro: 'humedad', calidad: 'cámara', rangos: '≤ 13,5 %' },
    { id: 'MC-07', producto: 'SOJA', parametro: 'cuerpos extraños', calidad: 'cámara', rangos: '≤ 1 %' },
    { id: 'MC-08', producto: 'MAIZ', parametro: 'humedad', calidad: 'grado 2', rangos: '≤ 14,5 %' },
    { id: 'MC-09', producto: 'TRIGO', parametro: 'otros', calidad: 'grado 2 · PH 78', rangos: 'peso hectolítrico ≥ 76 kg/hl' },
  ];

  /* M-24 Matriz de compatibilidad */
  M.matrizCompatibilidad = [
    { producto_a: 'UREA', producto_b: 'DAP', compatible: true, condiciones: 'En celdas distintas del mismo galpón; sin contacto directo' },
    { producto_a: 'UREA', producto_b: 'NPK-BB', compatible: true, condiciones: 'Big bags cerrados; sin mezcla de granel' },
    { producto_a: 'UREA', producto_b: 'UAN', compatible: false, condiciones: '' },
    { producto_a: 'UREA', producto_b: 'SOJA', compatible: false, condiciones: 'Fertilizante y grano no conviven en la misma ubicación' },
    { producto_a: 'DAP', producto_b: 'SOJA', compatible: false, condiciones: '' },
    { producto_a: 'SOJA', producto_b: 'MAIZ', compatible: false, condiciones: 'Pérdida de identidad; solo con celda vacía y limpieza' },
    { producto_a: 'MAIZ', producto_b: 'TRIGO', compatible: false, condiciones: 'Pérdida de identidad' },
    { producto_a: 'UAN', producto_b: 'NPK-BB', compatible: false, condiciones: '' },
  ];

  /* M-25 Muelles y puntos de conexión */
  for (const m of M.muelles) Object.assign(m, { tipoM25: 'muelle', planta: m.entidad === 'TT' ? 'PL-TT' : 'PU-SN', calado_admisible_m: m.calado, frente_de_amarre_maxima_m: m.eslora, capacidad_tn_h: null, productos_admitidos: m.familias, metodo_seguro: ['MS-MUELLE'], estadoM25: m.estado === 'Operativo' ? 'operativo' : 'fuera de servicio' });
  M.puntosConexion = [
    { id: 'PC-1', nombre: 'Punto de conexión líquidos — Muelle Sur', tipoM25: 'punto de conexión', planta: 'PU-SN', muelle: 'M2', calado_admisible_m: null, frente_de_amarre_maxima_m: null, capacidad_tn_h: 400, productos_admitidos: ['FERT-LIQ'], metodo_seguro: ['MS-MUELLE', 'MS-BOMBEO'], estadoM25: 'operativo' },
    { id: 'PC-2', nombre: 'Punto de conexión líquidos — Muelle Timbúes', tipoM25: 'punto de conexión', planta: 'PL-TT', muelle: 'M3', calado_admisible_m: null, frente_de_amarre_maxima_m: null, capacidad_tn_h: 350, productos_admitidos: ['FERT-LIQ'], metodo_seguro: ['MS-MUELLE', 'MS-BOMBEO'], estadoM25: 'operativo' },
  ];

  /* M-26 Balanzas */
  const bzExt = { BZ1: { prop: 'propia', alc: 'fiscal', tnh: 600, camh: 20, cert: 'INTI-2026-01187', emi: '2026-02-28', fvto: isoDay(180), prev: true, cola: 8 }, BZ2: { prop: 'propia', alc: 'de depósito', tnh: 450, camh: 15, cert: 'INTI-2025-09441', emi: '2025-12-15', fvto: null, prev: false, cola: 6 }, BZ3: { prop: 'propia', alc: 'fiscal', tnh: 600, camh: 20, cert: 'INTI-2026-03402', emi: '2026-05-31', fvto: isoDay(400), prev: true, cola: 8 } };
  for (const b of M.balanzas) { const x = bzExt[b.id] || {}; Object.assign(b, { planta: b.entidad === 'TT' ? 'PL-TT' : 'PL-SN', propiedad: x.prop || 'propia', alcance: x.alc || 'interna', capacidad_tn_h: x.tnh || 400, capacidad_camiones_h: x.camh || 12, disponibilidad_por_banda_horaria: 'T1 · T2 · T3 · T4', habilitada_fiscal: !!b.fiscal, habilitacion_fiscal_vto: b.fiscal ? x.fvto : null, certificacion: x.cert || '—', fecha_emision: x.emi || null, fecha_vencimiento: b.calibracionHasta, dias_aviso: 30, metodo_seguro: ['MS-BALANZA'], estadoM26: b.estado === 'Operativo' ? 'operativa' : 'en mantenimiento', prevalece_en_conciliacion: !!x.prev, cola_maxima_camiones: x.cola || 6 }); }

  /* M-27 Choferes */
  M.choferes = [
    { id: 'CH-01', cuil: '20-28456123-4', nombre: 'Rubén Acosta', licencia: { codigo: 'C1 · 28456123', vto: isoDay(400) }, credencial_puerto: { codigo: 'CP-2026-0451', vto: isoDay(200) }, art_seguro: { codigo: 'ART Prevención 771-22', vto: isoDay(120) }, estado: 'habilitado', transportista: null },
    { id: 'CH-02', cuil: '20-31209876-1', nombre: 'Javier Pereyra', licencia: { codigo: 'C1 · 31209876', vto: isoDay(300) }, credencial_puerto: { codigo: 'CP-2026-0452', vto: isoDay(200) }, art_seguro: { codigo: 'ART Prevención 771-22', vto: isoDay(120) }, estado: 'habilitado', transportista: null },
    { id: 'CH-03', cuil: '20-26987654-7', nombre: 'Néstor Ledesma', licencia: { codigo: 'C1 · 26987654', vto: isoDay(-12) }, credencial_puerto: { codigo: 'CP-2026-0453', vto: isoDay(200) }, art_seguro: { codigo: 'ART Prevención 771-22', vto: isoDay(120) }, estado: 'suspendido', transportista: null },
    { id: 'CH-04', cuil: '20-33456789-0', nombre: 'Ezequiel Romero', licencia: { codigo: 'C1 · 33456789', vto: isoDay(500) }, credencial_puerto: { codigo: 'CP-2026-0610', vto: isoDay(90) }, art_seguro: { codigo: 'ART Galeno 1102-5', vto: isoDay(60) }, estado: 'habilitado', transportista: 'PRV-03' },
    { id: 'CH-05', cuil: '20-30123456-2', nombre: 'Marcos Díaz', licencia: { codigo: 'C1 · 30123456', vto: isoDay(450) }, credencial_puerto: { codigo: 'CP-2026-0611', vto: isoDay(90) }, art_seguro: { codigo: 'ART Galeno 1102-5', vto: isoDay(60) }, estado: 'habilitado', transportista: 'PRV-03' },
    { id: 'CH-06', cuil: '20-35678901-5', nombre: 'Lucas Benítez', licencia: { codigo: 'C1 · 35678901', vto: isoDay(700) }, credencial_puerto: { codigo: 'CP-2026-0612', vto: isoDay(-3) }, art_seguro: { codigo: 'ART Galeno 1102-5', vto: isoDay(60) }, estado: 'inhabilitado', transportista: 'PRV-03' },
  ];

  /* M-28 Personal propio (la planificación pide puesto × cantidad; el legajo se asigna en la ejecución) */
  const pp = [['L-1001', 'R. Ocampo', 'F-SUP'], ['L-1002', 'D. Suárez', 'F-SUP'], ['L-1003', 'F. Molina', 'F-SUP'], ['L-1004', 'A. Torres', 'F-SUP'], ['L-1101', 'C. Vega', 'F-GRU'], ['L-1102', 'M. Ríos', 'F-GRU'], ['L-1103', 'P. Aguirre', 'F-GRU'], ['L-1104', 'J. Castro', 'F-GRU'], ['L-1105', 'E. Núñez', 'F-GRU'], ['L-1106', 'G. Paz', 'F-GRU'], ['L-1201', 'S. Ibarra', 'F-BAL'], ['L-1202', 'N. Godoy', 'F-BAL'], ['L-1203', 'L. Franco', 'F-BAL'], ['L-1204', 'V. Mansilla', 'F-BAL'], ['L-1301', 'S. Villalba', 'F-DEP'], ['L-1302', 'H. Quiroga', 'F-DEP'], ['L-1303', 'R. Cabral', 'F-DEP'], ['L-1304', 'T. Ojeda', 'F-DEP'], ['L-1305', 'W. Sosa', 'F-DEP'], ['L-1306', 'I. Roldán', 'F-DEP'], ['L-1307', 'B. Medina', 'F-DEP'], ['L-1308', 'K. Barrios', 'F-DEP'], ['L-1401', 'O. Duarte', 'F-PAL'], ['L-1402', 'U. Ferreira', 'F-PAL'], ['L-1403', 'X. Coronel', 'F-PAL'], ['L-1404', 'Y. Vera', 'F-PAL'], ['L-1405', 'Z. Ayala', 'F-PAL']];
  M.personalPropio = pp.map(([legajo, nombre, puesto], i) => ({ id: legajo, legajo, nombre, tipo: i % 9 === 8 ? 'eventual' : 'propio', puesto, planta: 'PL-SN', estado: 'activo', habilitaciones: puesto === 'F-GRU' ? 'Habilitación de operador de grúa → ' + isoDay(200 + i * 7) : puesto === 'F-PAL' ? 'Carnet de autoelevador / pala → ' + isoDay(150 + i * 5) : 'Credencial de planta → ' + isoDay(365) }));

  /* M-29 Causas de demora */
  const cdExt = { 'CD-01': ['clima', 'fuerza mayor', false], 'CD-02': ['logística', 'tercero', true], 'CD-03': ['otros', 'TyS', true], 'CD-04': ['documental / aduana', 'cliente', false], 'CD-05': ['otros', 'tercero', true], 'CD-06': ['otros', 'TyS', true], 'CD-07': ['buque', 'buque', false] };
  for (const c of M.causasDemora) { const x = cdExt[c.id] || ['otros', 'TyS', true]; Object.assign(c, { categoria: x[0], imputable_a: x[1], afecta_ritmo_contractual: x[2], estado: 'activa' }); }
  M.causasDemora.push(
    { id: 'CD-08', nombre: 'Congestión de balanza', responsabilidad: 'Propia', categoria: 'balanza', imputable_a: 'TyS', afecta_ritmo_contractual: true, estado: 'activa' },
    { id: 'CD-09', nombre: 'Recepción lenta en depósito', responsabilidad: 'Propia', categoria: 'depósito', imputable_a: 'TyS', afecta_ritmo_contractual: true, estado: 'activa' },
    { id: 'CD-10', nombre: 'Desvío logístico (GPS)', responsabilidad: 'Transportista', categoria: 'logística', imputable_a: 'tercero', afecta_ritmo_contractual: false, estado: 'activa' },
  );

  /* M-30 Insumos y repuestos */
  M.insumos = [
    { id: 'INS-001', nombre: 'Cable de acero 24 mm para grúa (rollo 100 m)', criticidad: 'crítico', stock_minimo: 1, unidad_medida: 'unidad', presentacion: 'rollo', stock_actual: 2, ubicacion: 'Pañol A-3', sku: 'CAB-24-100', stockeable: true, costo_unitario_referencia: 3200, planta: 'PL-SN', metodo_seguro: [], estado: 'activo' },
    { id: 'INS-002', nombre: 'Filtro hidráulico Liebherr LHM', criticidad: 'crítico', stock_minimo: 4, unidad_medida: 'unidad', presentacion: 'caja', stock_actual: 3, ubicacion: 'Pañol B-1', sku: 'FH-LHM-420', stockeable: true, costo_unitario_referencia: 410, planta: 'PL-SN', metodo_seguro: [], estado: 'activo' },
    { id: 'INS-003', nombre: 'Manguera de trasvase 6" (tramo 10 m)', criticidad: 'crítico', stock_minimo: 2, unidad_medida: 'unidad', presentacion: 'tramo', stock_actual: 4, ubicacion: 'Pañol líquidos', sku: 'MG-6-10', stockeable: true, costo_unitario_referencia: 1850, planta: 'PL-SN', metodo_seguro: ['MS-BOMBEO'], estado: 'activo' },
    { id: 'INS-004', nombre: 'Aceite hidráulico ISO 68', criticidad: 'normal', stock_minimo: 200, unidad_medida: 'litro', presentacion: 'tambor 200 l', stock_actual: 600, ubicacion: 'Depósito de lubricantes', sku: 'AC-H68', stockeable: true, costo_unitario_referencia: 6.4, planta: 'PL-SN', metodo_seguro: [], estado: 'activo' },
    { id: 'INS-005', nombre: 'Eslingas para big bags (juego)', criticidad: 'normal', stock_minimo: 6, unidad_medida: 'juego', presentacion: 'juego × 4', stock_actual: 10, ubicacion: 'Pañol A-1', sku: 'ESL-BB-4', stockeable: true, costo_unitario_referencia: 240, planta: 'PL-SN', metodo_seguro: ['MS-EMB'], estado: 'activo' },
  ];

  /* M-34 Métodos seguros: atributos del modelo + MS de recursos */
  const msBase = { 'MS-FERT-SOL': { tipo: 'procedimiento operativo', aplica_a: ['producto'], version: 'rev. 3' }, 'MS-FERT-LIQ': { tipo: 'procedimiento operativo', aplica_a: ['producto', 'depósito', 'personal'], version: 'rev. 1' }, 'MS-EMB': { tipo: 'instructivo de trabajo', aplica_a: ['producto'], version: 'rev. 2' } };
  for (const ms of M.metodosSeguros) { const x = msBase[ms.id] || {}; Object.assign(ms, { tipo: x.tipo || 'procedimiento operativo', documento: ms.procedimiento, version: x.version || 'rev. 1', aplica_a: x.aplica_a || ['producto'], responsable: 'SEG', fecha_vigencia_desde: '2026-01-01', dias_aviso: 30, accion_al_vencer: 'bloquear el recurso' }); }
  const msRec = (id, nombre, tipo, doc, aplica, dias, accion) => ({ id, nombre, procedimiento: doc, documento: doc, tipo, version: 'rev. 2', aplica_a: aplica, responsable: 'SEG', fecha_vigencia_desde: '2026-01-01', vigenciaHasta: isoDay(dias), dias_aviso: 30, accion_al_vencer: accion, familias: [], productos: [], criterios: 'Procedimiento vigente y personal capacitado', recurso: true });
  M.metodosSeguros.push(
    msRec('MS-EQUIPOS', 'Operación de grúas móviles y equipos de descarga', 'procedimiento operativo', 'PRO-SEG-031 rev. 2', ['maquinaria'], 240, 'bloquear el recurso'),
    msRec('MS-BOMBEO', 'Operación de sistemas de bombeo y conexión de mangueras', 'procedimiento operativo', 'PRO-SEG-033 rev. 1', ['maquinaria', 'muelle'], 180, 'bloquear el recurso'),
    msRec('MS-MUELLE', 'Amarre, atraque y trabajo en muelle', 'procedimiento operativo', 'PRO-SEG-012 rev. 4', ['muelle'], 300, 'bloquear el recurso'),
    msRec('MS-BALANZA', 'Pesaje y circulación en balanza', 'instructivo de trabajo', 'INS-SEG-007 rev. 2', ['balanza', 'personal'], 22, 'alertar y registrar desvío'),
    msRec('MS-DEPOSITO', 'Acopio, segregación y emergencias en depósito', 'plan de emergencia', 'PLE-SEG-002 rev. 3', ['depósito', 'ubicación', 'personal'], 400, 'bloquear el recurso'),
    msRec('MS-TRANSP', 'Circulación de unidades de transporte en planta', 'procedimiento operativo', 'PRO-SEG-019 rev. 2', ['transporte'], 150, 'bloquear el recurso'),
    msRec('MS-MANOS', 'Trabajo de manos de estiba en bodega y EPP', 'matriz de EPP', 'MAT-EPP-004 rev. 5', ['personal'], 260, 'bloquear el recurso'),
    msRec('MS-OPER-GRUA', 'Habilitación de operador de grúa móvil', 'habilitación de operador', 'HAB-OP-GRUA', ['personal'], 200, 'bloquear el recurso'),
    msRec('MS-OPER-PALA', 'Habilitación de operador de pala / autoelevador', 'habilitación de operador', 'HAB-OP-PALA', ['personal'], 150, 'bloquear el recurso'),
    msRec('MS-OPS-DESCARGA', 'Procedimiento general de descarga y carga de buques', 'procedimiento operativo', 'PRO-OPS-001 rev. 6', ['tipo de servicio'], 365, 'alertar y registrar desvío'),
  );

  /* M-17 LineUp: atributos del modelo */
  const estLU = { Anunciado: 'proyectado', Confirmado: 'confirmado', 'En rada': 'en rada', 'En operación': 'operando', Zarpó: 'finalizado', Cancelado: 'cancelado' };
  for (const lu of O.lineups) { Object.assign(lu, { puerto: lu.terminal === 'TT' ? 'PL-TT' : 'PU-SN', operador: lu.terminal === 'TT' ? 'TT' : 'TYS', shipper: lu.cargas[0] ? (M.clientes.find(c => c.id === lu.cargas[0].cliente)?.nombre || '') : '', agencia: 'AG-01', tipo_operacion: lu.tipo === 'Carga' ? 'carga' : 'descarga', toneladas_nominadas: lu.cargas.reduce((s, c) => s + c.toneladas, 0), toneladas_para_tys: lu.cargas.reduce((s, c) => s + c.toneladas, 0), alcance_geografico: 'solo San Nicolás', origen: lu.tipo === 'Carga' ? 'San Nicolás' : 'Exterior (según BL)', destino: lu.tipo === 'Carga' ? 'Exterior' : (lu.terminal === 'TT' ? 'Timbúes' : 'San Nicolás'), fuente: 'LineUp agencia', fecha_version: isoDay(-1), orden_puerto: 1, homologado: true, nominado_a_tys: true, observaciones: '' }); lu.estadoM17 = estLU[lu.estado] || lu.estado; }

  /* M-31 Cupos de ingreso: estados del modelo y tramo de portería */
  for (const cu of O.cupos) { if (cu.estado === 'Vigente') cu.estado = 'Confirmado'; Object.assign(cu, { planta: 'PL-SN', contrato: ({ 'CLI-04': 'CTO-2026-033', 'CLI-01': 'CTO-2026-014', 'CLI-05': 'TAR-SPOT-2026' })[cu.cliente] || null, turno: cu.franja.startsWith('06') ? 'T1 · T2' : 'todo el día', tipo_movimiento: 'ingreso', porton: 'P1', confirmacion_planta: cu.estado === 'Solicitado' ? 'pendiente' : 'confirmado', observaciones: '' }); }

  /* M-32 Arribos ferroviarios: estados del modelo y tramo operativo */
  for (const tr of O.trenes) { if (tr.estado === 'Anunciado') tr.estado = 'Previsto'; Object.assign(tr, { planta: 'PL-SN', operador_ferroviario: tr.operador.includes('Belgrano') ? 'PRV-06' : 'PRV-05', contrato: ({ 'CLI-04': 'CTO-2026-033', 'CLI-05': 'TAR-SPOT-2026' })[tr.cliente] || null, tipo_movimiento: tr.tipo === 'Arribo para carga' ? 'egreso' : 'ingreso', playa_desvio: tr.estado === 'Confirmado' ? 'Playa de vías Norte · desvío 2' : '', ventana_desde: tr.estado === 'Confirmado' ? tr.fecha + 'T06:00:00' : null, ventana_hasta: tr.estado === 'Confirmado' ? tr.fecha + 'T22:00:00' : null, observaciones: '' }); }

  /* M-35 BU: atributos */
  for (const b of M.bus) Object.assign(b, { centro_costo: b.cc, presupuesto_anual: b.presupuesto, estado: 'activa' });

  /* auditoría común (hoja 3): todos los registros de la carga base nacen "vigente · migración · v1" */
  M.auditoriaBase = { estado_registro: 'vigente', creado_por: 'Migración inicial', creado_el: isoDay(-30), validado_por: 'Máster data', autorizado_por: 'Dueño del dominio', version: 1, origen: 'migración' };

  /* listas del modelo administrables por Máster data (S22): convenciones, reglas, definiciones y decisiones pasan del Excel a la master data de la maqueta */
  M.convenciones = MODEL_CONVENCIONES.map(x => Object.assign({ id: x.codigo }, x));
  const vistosRG = {}; M.reglasModelo = MODEL_REGLAS.map((x, i) => { let id = x.codigo || ('RG-' + (i + 1)); if (vistosRG[id]) id = id + '-' + (++vistosRG[id]); else vistosRG[id] = 1; return Object.assign({ id }, x); });
  M.definiciones = MODEL_DEFINICIONES.map(x => Object.assign({ id: x.n.replace(/\s+/g, '-') }, x));
  M.decisiones = MODEL_DECISIONES.map(x => Object.assign({ id: x.codigo }, x));

  /* M-38 permisos por maestro y rol (SUPUESTO S17): niveles oculto · consulta · abm. Máster data siempre abm; el resto consulta salvo lo indicado.
     Valores de demostración: cada área administra los maestros de su ámbito y no visualiza los contables o comerciales que no le corresponden. */
  const ABM_POR_ROL = { COM: ['M-06', 'M-15', 'M-16', 'M-22', 'M-23'], PLAN: ['M-20', 'M-24'], OPS: ['M-12', 'M-29', 'M-30'], DEP: ['M-10', 'M-10a', 'M-23', 'M-24'], LAR: ['M-08', 'M-17', 'M-21', 'M-31', 'M-32'] };
  const OCULTO_POR_ROL = { COM: ['M-30'], PLAN: ['M-03', 'M-04'], OPS: ['M-03', 'M-04', 'M-15'], DEP: ['M-03', 'M-04', 'M-15'], LAR: ['M-02', 'M-03', 'M-04', 'M-15', 'M-30'] };
  const codigos = [...MODEL_FICHAS.map(f => f.codigo), ...MD_EXT.fichas.map(f => f.codigo)];
  M.permisosMD = {};
  for (const c of codigos) { M.permisosMD[c] = {}; for (const r of M.roles) M.permisosMD[c][r.id] = r.id === 'MD' ? 'abm' : (ABM_POR_ROL[r.id] || []).includes(c) ? 'abm' : (OCULTO_POR_ROL[r.id] || []).includes(c) ? 'oculto' : 'consulta'; }
})();
