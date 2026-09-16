/* FD v2.0 — capítulos 7 a 9 */
module.exports = function (d, M, L) {
  const { h1, h2, h3, p, note, ul, table, kvTable, spacer, flat } = L;
  const join = (a, sep = ' · ') => (a || []).join(sep);
  const fmtT = n => new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(Math.round(+n || 0));
  const out = [];

  /* ───────── 7. Estados y transiciones ───────── */
  out.push(h1('7. Estados, transiciones, devolución y anulación'));
  out.push(h2('7.1 Estados de la orden'));
  const rolN = id => (d.roles.find(r => r.id === id) || {}).nombre || 'Consulta';
  out.push(table(['Código', 'Estado', 'Responsable principal', 'Próximo paso'], d.estados.map(e => [e.id, e.nombre, e.responsable ? rolN(e.responsable) : 'Consulta', e.proximo]), [0.14, 0.26, 0.24, 0.36]));
  out.push(spacer());
  out.push(p('Las advertencias de nacionalización y método seguro se muestran como **condiciones de la orden**, además de su estado. Toda transición deja registro de **quién actuó, cuándo y qué información cambió** (historial del expediente).'));
  out.push(h2('7.2 Transiciones'));
  out.push(table(['De', 'A', 'Acción', 'Rol', 'Validación / efecto'], d.transiciones.map(t => [t.de === '*' ? 'Cualquier etapa salvo Cerrada y Anulada' : t.deN, t.aN, t.accion, t.rolN, t.validacion]), [0.15, 0.15, 0.22, 0.13, 0.35], { size: 16 }));
  out.push(spacer());
  out.push(h2('7.3 Devolver al paso anterior'));
  out.push(p('**Cada etapa puede devolver la orden al estado anterior.** Lo ejecuta el rol responsable de la etapa (en Pendiente de cierre, el rol de cierre del servicio), con **motivo obligatorio** (lista + detalle) y registro en el historial. El rol anterior recibe la orden en su bandeja con la leyenda "Devuelta por <rol>: motivo".'));
  out.push(table(['Devolución', 'Rol', 'Efecto'], [
    ['Pendiente de planificación → Borrador', 'Planificador', 'Comercial la recibe en su bandeja; puede editar el borrador y reenviarla. La recomendación se conserva.'],
    ['Planificada → Pendiente de planificación', 'Operaciones', 'La planificación aceptada queda como historial ("Planificación devuelta vN"), se **liberan las reservas** y el Planificador vuelve a asignar.'],
    ['En ejecución → Planificada', 'Operaciones', 'Solo si **no hay tickets registrados**: se revierte el inicio y la orden vuelve a Planificada con su plan. Con tickets, el operativo solo puede finalizarse o anularse.'],
    ['Pendiente de cierre → En ejecución', 'Rol de cierre (Depósito / Operaciones)', 'El operativo vuelve a estar activo: los recursos cerrados al finalizar quedan activos y Operaciones registra lo que falte.'],
  ], [0.3, 0.2, 0.5]));
  out.push(spacer());
  out.push(p('Motivos de devolución (M-37, editables): ' + join(d.motivos.devolucion, '; ') + '.'));
  out.push(h2('7.4 Anular'));
  out.push(p('Desde cualquier etapa salvo Cerrada y Anulada, el rol responsable puede **anular** la orden con motivo obligatorio. La orden pasa a **Anulada**, **libera las reservas** de recursos y el **origen** (la carga del lineup, el cupo o el tren vuelven a estar "sin orden" y disponibles para una orden nueva), conserva planificación, costos e historial en consulta y, si ya había toneladas descargadas, quedan registradas sin cierre de depósito. El expediente muestra el motivo, quién y cuándo; el pipeline del workflow incorpora el estado Anulada. Se asume que anular no requiere aprobación adicional (S18).'));
  out.push(p('Motivos de anulación: ' + join(d.motivos.anulacion, '; ') + '.'));
  out.push(h2('7.5 Otras listas de motivos'));
  out.push(table(['Lista', 'Uso', 'Valores iniciales'], [
    ['Modificación de recursos', 'ABM de recursos por Operaciones durante la ejecución.', join(d.motivos.modificacion, '; ')],
    ['Desvío respecto de la recomendación', 'Cuando el Planificador acepta un plan distinto del recomendado.', join(d.motivos.desvio, '; ')],
    ['Responsabilidades de demora', 'Clasificación de la demora.', join(d.motivos.responsabilidades, '; ')],
  ], [0.22, 0.3, 0.48], { size: 17 }));
  out.push(spacer());

  /* ───────── 8. Reglas y parámetros ───────── */
  out.push(h1('8. Reglas de negocio y parámetros'));
  out.push(h2('8.1 Parámetros generales'));
  const P = d.parametros;
  out.push(table(['Parámetro', 'Valor inicial', 'Dónde se usa'], [
    ['Pesos de la recomendación (costo · duración · cumplimiento)', `${P.pesos.costo} · ${P.pesos.duracion} · ${P.pesos.cumplimiento}`, 'Puntaje ponderado de la mejor combinación (S2).'],
    ['Eficiencia de equipo sobre capacidad nominal', `${Math.round(P.eficienciaEquipo * 100)} %`, 'Ritmo efectivo y cantidad de turnos.'],
    ['Horas por turno', `${P.horasTurno} h (régimen M-33: T1 06–12 · T2 12–18 · T3 18–24 · T4 00–06)`, 'Planificación por turnos completos; costos horarios.'],
    ['Días de depósito estimados', String(P.diasDepositoEstimados), 'Costo estimado del componente Depósito.'],
    ['Tolerancia de cierre', `${P.toleranciaCierrePct} %`, 'Diferencia entre previsto y acumulado al finalizar.'],
    ['Tolerancia general de merma / excedente', `${P.toleranciaMermaPct} %`, 'Cierre de depósito cuando el instrumento no fija la suya (M-20).'],
    ['Origen de equipos por defecto', P.origenEquiposPorDefecto, 'Sección de equipos del Planificador cuando el lineup no declara equipos del buque.'],
    ['Factor de ruta', String(P.factorRuta), 'Km del tramo logístico = distancia geodésica × factor.'],
    ['Tarifa de traslado de maquinaria', `${P.costoKmTraslado} USD/km`, 'Km de entrega y devolución de Rental.'],
    ['Tarifa por km de camión', `${P.costoKmCamion} USD/km`, 'Km totales de Servicios logísticos.'],
  ], [0.36, 0.26, 0.38], { size: 17 }));
  out.push(spacer());
  out.push(h2('8.2 Tolerancias (M-20)'));
  out.push(table(['Código', 'Tolerancia', 'Parámetro', 'Valor', 'Acción al superarla', 'Uso'], d.tolerancias.map(t => [t.id, t.nombre, t.parametro, `${t.valor} ${t.unidad}`, t.accion, t.uso]), [0.15, 0.18, 0.2, 0.08, 0.17, 0.22], { size: 16 }));
  out.push(spacer());
  out.push(h2('8.3 Causas de demora (M-29)'));
  out.push(table(['Código', 'Causa', 'Responsabilidad', 'Imputable a'], d.causasDemora.map(c => [c.id, c.nombre, c.responsabilidad, c.imputable]), [0.12, 0.44, 0.22, 0.22], { size: 17 }));
  out.push(spacer());
  out.push(h2('8.4 Métodos seguros (M-34)'));
  out.push(p('El método seguro es un atributo de la master data que se asigna a productos, familias de producto y recursos (depósitos, equipos, muelles, balanzas, manos, tipos de servicio). Cada método tiene procedimiento, vigencia, **días de aviso** y **acción al vencer**. El motor lo aplica en dos lugares: la **habilitación de la orden** (producto o familia) y la **disponibilidad de cada recurso** en la planificación. Vencido con acción "bloquear el recurso" → sin disponibilidad / orden no habilitada; dentro del aviso → disponible con observaciones.'));
  out.push(table(['Código', 'Método seguro', 'Aplica a', 'Vigencia', 'Aviso (días)', 'Acción al vencer'], d.metodosSeguros.map(m => [m.id, m.nombre, m.aplica, m.vigencia, String(m.aviso), m.accion]), [0.13, 0.3, 0.22, 0.11, 0.09, 0.15], { size: 16 }));
  out.push(spacer());
  out.push(h2('8.5 Reglas del circuito'));
  out.push(table(['Ámbito', 'Regla'], [
    ['Habilitaciones', 'Nacionalización y método seguro advierten en Comercial, permiten planificar y bloquean el inicio. Mercadería no nacionalizada → solo depósitos y balanzas con habilitación fiscal vigente.'],
    ['Origen compartido', 'Una carga, cupo o tren admite N órdenes; se advierte y se proponen las toneladas por el remanente (A2). Al anular una orden, el origen vuelve a estar disponible.'],
    ['Ventana del servicio', 'Definida por Comercial; valida disponibilidad, superposición y reservas de todos los recursos. Fin posterior al inicio (bloquea); fuera del arribo o toneladas mayores que el origen (advierte).'],
    ['Equipos', 'Tipo por estado físico del producto (sólido → grúas; líquido → bombas). Origen muelle o buque, **excluyente**: con un origen no se ofrecen los equipos del otro. Los del buque se eligen unidad por unidad, no consumen inventario ni tienen costo para la terminal.'],
    ['Personal propio', 'Un puesto puede estar en varios operativos simultáneos: la superposición no bloquea; el sistema reparte el % de afectación y prorratea el costo (S25).'],
    ['Maquinaria', 'Se afecta con un % de uso por orden; el remanente queda disponible para otro operativo de la misma ventana (S31).'],
    ['Turnos', 'La duración y el catálogo salen de M-33; la cantidad la propone el sistema por el ritmo y la puede fijar el Planificador (S26).'],
    ['Disponibilidad', 'Un recurso reservado por otro operativo en la ventana no se puede asignar: se ofrece la solicitud a la BU dueña (S13) y, para equipos del muelle, el cambio de fecha de arribo (S15).'],
    ['Plan inicial', 'Al confirmar la planificación se congela el plan aceptado; los ajustes de Operaciones se registran como cambios y no lo alteran.'],
    ['Devolución desde ejecución', 'Solo sin tickets registrados.'],
    ['Cierre', 'La merma o el excedente salen de lo pesado en balanza, no de una carga manual (S27); fuera de tolerancia requiere autorización de Comercial (S12). El rol de cierre lo define el servicio (A5).'],
    ['Baja de master data', 'Lógica; se rechaza si el registro está reservado por una orden planificada o en ejecución.'],
    ['Módulos', 'Inicio no se puede deshabilitar; un enlace a un módulo deshabilitado vuelve a Inicio con aviso; al cambiar el contexto, la pantalla actual vuelve a Inicio si el contexto nuevo no la tiene.'],
  ], [0.2, 0.8], { size: 17 }));
  out.push(spacer());

  /* ───────── 9. Master data ───────── */
  out.push(h1('9. Master data'));
  out.push(h2('9.1 Modelo adoptado'));
  out.push(p(`**La master data debe contener todo el modelo v3.1 para ser utilizada.** El sistema incorpora íntegro el Excel *${M.META.archivo}* (${M.META.fecha}): **${d.counts.fichas} maestros** M-01..M-34 (+ M-10a) en ${d.counts.dominios} dominios, sus **${d.counts.atributos} atributos** (tipo de dato, obligatoriedad, dominio de valores, parámetro, regla, origen, carácter propio / contextual / calculado, equivalente v2.2), los 7 atributos de **auditoría** y el ciclo de vida de 6 estados, las ${d.counts.conv} **convenciones**, el **orden de carga** en 4 niveles, las ${d.counts.def} **definiciones previas** y ${d.counts.dec} **decisiones**, las ${d.counts.reglas} **reglas** por maestro, el mapeo de ${d.counts.mapeo} fuentes de la carga inicial, el cruce v2.2 → modelo (${d.counts.cruce} entradas) y el catálogo de **${d.counts.tx} transacciones y ${d.counts.ev} eventos**.`));
  out.push(p(`La estructura multiempresa se mapea sobre el modelo (S16): la **entidad fiscal** es M-01; se agregan cuatro maestros propios —**M-35 Unidades de negocio (BU)**, **M-36 Matriz de ejecución y relaciones**, **M-37 Workflows** y **M-38 Usuarios, roles y permisos**— y ${d.counts.atrExt} atributos ★ donde la estructura nueva lo exige (equipos propios del buque en M-08; nivel, rol de cierre y requiere producto en M-14; productos incluidos y tarifas por componente en M-16; cargas del lineup en M-17; transportista y calidad en M-31 / M-32). En total, **${d.counts.fichas + d.counts.ext} maestros** y ${d.counts.registros} registros de demostración.`));
  out.push(h2('9.2 Dominios'));
  out.push(table(['Dominio', 'Maestros'], d.dominios.map(dm => [dm, d.fichas.filter(f => f.dominio === dm).map(f => `${f.codigo} ${f.nombre}`).join(' · ')]), [0.3, 0.7], { size: 17 }));
  out.push(spacer());
  out.push(p('El catálogo completo de maestros (código, nombre, nivel de dependencia, existencia actual, área que administra y autoriza, tipo de ABM, cantidad de atributos y registros) está en el Anexo C.'));
  out.push(h2('9.3 Atributos que usa el motor'));
  out.push(p('El circuito no se limita a mostrar el modelo: usa sus atributos donde ya existían reglas. Una marca por atributo distingue los que el circuito utiliza de los definidos sin uso aún (insumo del fit/gap).'));
  out.push(table(['Maestro · atributo', 'Uso en el circuito'], [
    ['M-07 Productos · tipo (sólido / líquido)', 'Define si el Planificador ve grúas o sistemas de bombeo.'],
    ['M-08 Buques · equipos propios (★)', 'Equipos del buque preseleccionados en la planificación.'],
    ['M-10 Depósitos · habilitación aduanera y vencimientos', 'Filtro de depósitos para mercadería no nacionalizada.'],
    ['M-14 Tipos de servicios · nivel, rol de cierre, requiere producto (★)', 'Selección secuencial y cierre.'],
    ['M-16 Contratos · productos incluidos, tarifas por componente, tolerancia (★)', 'Cobertura del instrumento, costos y cierre.'],
    ['M-17 LineUp · cargas por cliente / producto (★)', 'Origen de la orden; remanente y toneladas propuestas.'],
    ['M-20 Tolerancias', 'Merma / excedente y diferencia al finalizar.'],
    ['M-26 Balanzas · habilitada_fiscal y vencimiento', 'Filtro de balanzas para mercadería no nacionalizada.'],
    ['M-29 Causas de demora', 'Clasificación y responsabilidad de las demoras.'],
    ['M-33 Régimen de turnos', `Turnos de ${d.parametros.horasTurno} h en planificación y costos.`],
    ['M-34 Métodos seguros · días de aviso y acción al vencer', 'Habilitación de la orden y disponibilidad de recursos.'],
    ['M-35 BU · centro de costo', 'Imputación de las líneas de la orden.'],
    ['M-36 Matriz de ejecución y relaciones', 'BU ejecutora por componente y forma de imputar la relación.'],
    ['M-38 Usuarios, roles y permisos', 'Permisos por maestro y módulos por rol / entidad / BU.'],
  ], [0.42, 0.58], { size: 17 }));
  out.push(spacer());
  out.push(h2('9.4 Auditoría y ciclo de vida de los registros'));
  out.push(p('Todos los maestros comparten los atributos de auditoría de la hoja 3 del modelo y un ciclo de vida de seis estados manejado por el motor de workflow, no por el usuario. Nada se borra: la baja es lógica y solo procede sin movimientos.'));
  out.push(table(['Atributo', 'Tipo', 'Oblig.', 'Dominio', 'Regla'], d.auditoria.map(a => [a.atributo, a.tipo, a.obligatorio, a.dominio, a.regla]), [0.19, 0.14, 0.11, 0.22, 0.34], { size: 16 }));
  out.push(spacer());
  out.push(table(['Estado', 'Qué pasa', 'Regla'], d.ciclo.map(c => [c.estado, c.quePasa, c.regla]), [0.16, 0.42, 0.42], { size: 17 }));
  out.push(spacer());
  out.push(h2('9.5 Permisos por maestro y rol'));
  out.push(p('El rol Máster data otorga o quita a cada rol el permiso sobre cada maestro en tres niveles. La matriz se edita en Datos maestros › Permisos por rol y cada cambio queda en el registro de cambios (S17). Máster data siempre puede ABM en todos los maestros.'));
  out.push(table(['Nivel', 'Qué implica'], [
    ['**No lo visualiza**', 'El maestro no aparece en Datos maestros ni en los enlaces del rol (vista por área, orden de carga, fuentes, transacciones); un enlace directo muestra el aviso de permiso.'],
    ['**Solo consulta**', 'Ve ficha, atributos, registros, reglas, fuentes y transacciones; sin acciones de ABM.'],
    ['**Puede ABM**', 'Alta, modificación y baja lógica del maestro desde el formulario genérico.'],
  ], [0.2, 0.8]));
  out.push(spacer());
  out.push(p('Permisos iniciales de demostración (a validar con cada área): Comercial ABM en clientes / proveedores, tarifas, contratos, despachantes y matriz de calidad; Planificador en tolerancias y compatibilidad; Operaciones en equipos, causas de demora e insumos; Depósito en depósitos, ubicaciones, calidad y compatibilidad; Logística de arribo en buques, lineup, agencias, cupos y trenes; los maestros contables (M-03, M-04) quedan ocultos para los roles operativos y las tarifas (M-15) para Operaciones, Depósito y Logística de arribo. Matriz completa en el Anexo A.'));
  out.push(h2('9.6 ABM genérico, validación y baja lógica'));
  out.push(ul([
    '**Formulario genérico.** Se arma con los atributos que el sistema usa para cada maestro: tipo de dato, enumeraciones, referencias a otros maestros (elegidas del maestro correspondiente, simples o múltiples), listas, fechas, números, booleanos y textos largos. Aplica la auditoría común (quién, cuándo, versión, origen "manual", validado por).',
    '**Altas y modificaciones "en validación".** Las que hace un rol con permiso ABM nacen en estado "en validación" y el circuito no las usa (no se ofrecen en la planificación ni en los selectores) hasta que Máster data las **valida y publica** o las **rechaza** desde su Workflow. Las de Máster data nacen vigentes.',
    '**Baja lógica.** El registro queda "dado de baja", conserva su historial y deja de ofrecerse; si está reservado por una orden planificada o en ejecución, la baja se rechaza.',
    '**Registro de cambios.** Cada alta, modificación, baja, validación, rechazo, cambio de permiso o de módulo queda con usuario, rol, fecha y hora, maestro, registro y qué cambió; se consulta en Datos maestros › Registro de cambios y en el Workflow de Máster data.',
    '**Maestros sin ABM directo.** Los que se administran desde otras pantallas (lineups, cupos y trenes en Logística de arribo; matriz de ejecución y workflows en Administración) o se derivan (tarifas, calendario) no tienen ABM en Datos maestros y la pantalla lo indica.',
  ]));
  out.push(h2('9.7 Listas del modelo administrables'));
  out.push(p(`Las **convenciones** (${M.CONVENCIONES.map(c => c.codigo).join(', ')}), las **reglas por maestro**, las **definiciones previas** y las **decisiones** dejan de ser constantes del Excel y pasan a la master data: Máster data las administra con el mismo formulario genérico y la misma auditoría que los maestros (alta vigente, modificación versionada, baja lógica); los demás roles las consultan. Las reglas nuevas aparecen también en la pestaña Reglas del maestro al que refieren. Orden de carga, mapeo de fuentes, transacciones y eventos siguen de solo consulta (revisión 16/09, S22).`));
  out.push(table(['Convención', 'Nombre', 'Qué exige'], M.CONVENCIONES.map(c => [c.codigo, c.nombre, c.exige]), [0.13, 0.24, 0.63], { size: 17 }));
  out.push(spacer());
  out.push(h2('9.8 Orden de carga inicial'));
  out.push(p('El modelo fija cuatro niveles de dependencia para la carga inicial; el nivel 0 no tiene dependencias y cada nivel referencia solo a los anteriores. La estrategia de saneamiento debe respetar este orden sin congelar el avance del proyecto.'));
  out.push(table(['Nivel', 'Maestros', 'Qué se hace', 'Esfuerzo'], d.ordenCarga.map(o => [String(o.nivel), o.maestros, o.queSeHace, o.esfuerzo]), [0.07, 0.4, 0.38, 0.15], { size: 16 }));
  out.push(spacer());
  out.push(h2('9.9 Definiciones previas y decisiones del modelo'));
  out.push(p('El modelo v3.1 trae 18 definiciones previas (qué debe definir cada área antes de que un maestro pase a vigente) y 18 decisiones de diseño con opciones y recomendación. Se reproducen aquí porque Máster data las administra en el sistema y porque condicionan la carga inicial.'));
  out.push(table(['Nº', 'Definición', 'Responsable', 'Bloquea', 'Qué definir'], M.DEFINICIONES.map(x => [x.n, x.definicion, x.responsable, x.bloquea, x.queDefinir]), [0.07, 0.19, 0.13, 0.14, 0.47], { size: 15 }));
  out.push(spacer());
  out.push(table(['Código', 'Maestro', 'Decisión', 'Opciones', 'Recomendación', 'Estado'], M.DECISIONES.map(x => [x.codigo, x.maestro, x.decision, x.opciones, x.recomendacion, x.estado]), [0.07, 0.13, 0.18, 0.27, 0.27, 0.08], { size: 15 }));
  out.push(spacer());

  return flat(out);
};
