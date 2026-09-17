# Maqueta ERP v2.0 — Orden de servicio multiempresa — Especificación base

**Fecha:** 15/09/2026 · **Fuente:** definición aportada por Cristian D'Annunzio (Analista Funcional de Negocios) tras los cambios estructurales del proyecto. **Revisiones 15/09/2026 (tarde):** (1) el servicio pasa a seleccionarse inmediatamente después de la entidad y define el resto de la carga; un servicio puede impactar a una BU específica o a la entidad en su conjunto (sección 2 y Etapa 1). (2) Instrumento contractual sin cobertura: alta de instrumento nuevo o adenda desde la misma orden (Etapa 1). (3) "Programación de ingresos" pasa a **Logística de arribo**, que administra lineup, cupos de camiones y operativos ferroviarios (sección 3). (4) Comparativa de recursos propios y de terceros, necesario vs aplicado, por muelle, mercadería, calidad y destino (Etapa 4 y sección 3). (5) Cada etapa ve las órdenes que debe trabajar en la vista de workflow y todas las órdenes en la vista de operaciones (sección 3). (6) Logística de arribo solo administra la logística de arribo, no interviene en las operaciones y consulta las órdenes solo para visualizarlas. (7) Al guardar una etapa que pasa la orden al siguiente rol, la aplicación vuelve a "mi etapa". (8) Operaciones puede hacer ABM de todos los recursos de la planificación, con registro para la comparativa (Etapa 3). (9) Depósito registra merma o excedente manual, dentro de la tolerancia del contrato, para cerrar (Etapa 4). (10) La habilitación por método seguro proviene de la master data (familia de producto o producto), no de una confirmación manual (Etapa 1). (11) Cuando un recurso no está disponible en la planificación, un botón genera la solicitud de habilitación a la BU dueña con la información de la operación (Etapa 2). (12) Equipos de descarga / carga: solo grúas o sistemas de bombeo, según el estado físico del producto; se elige primero si son del muelle o del buque (los del buque quedan seleccionados por defecto); si un equipo del muelle está ocupado por otro operativo, se puede cambiar la fecha de arribo del servicio (Etapa 2). (13) La master data debe contener todo el modelo v3.1 del Excel *Circuito Detalle de Construcción Master Data* para ser utilizada (sección 7). (14) Se agrega el rol **Máster data**: hace el ABM de la master data y otorga o quita a cada rol el permiso sobre cada maestro en tres niveles —no lo visualiza, solo consulta, puede ABM— (sección 7). (15) Cada etapa puede **devolver la orden al paso anterior** o **anularla** completamente, con motivo y registro (sección 6). (16) Comercial indica las **toneladas del producto** a operar (no siempre el total de la carga del lineup; también las puede modificar) y la **fecha y hora de inicio y fin del servicio**, que es la ventana con la que se valida la disponibilidad de todos los recursos (Etapa 1). (17) **La descarga la realiza Operaciones, no Logística**: BU Operaciones como ejecutora del componente Descarga (sección 1 y 2). (18) Los **módulos** del sistema se habilitan o deshabilitan por rol / sector (sección 3 y 7). (19) **Rental y Logística**: la selección es Entidad → Servicio → BU prestadora → Medio Interna / Externa → Cliente (otras BU o nómina de clientes) → detalle del servicio —maquinarias, fechas y km de entrega / devolución para Rental; camión, origen / destino, fechas y km calculados automáticamente para Logística— (Etapa 1). **Revisión 16/09:** (20) el **menú de Operación** se habilita o deshabilita por **rol, por entidad y por unidad de negocio**; el menú izquierdo muestra la intersección con el contexto activo (sección 3 y 7). (21) **Máster data** puede hacer el **ABM de convenciones, reglas, definiciones y decisiones** del modelo (sección 7). **Revisión 16/09 (tarde):** (22) los atributos de **M-17 LineUp** y **M-21 Agencia marítima / Armador** se alinean a la planilla aportada (sección 7). (23) **La nominación se alimenta desde la creación del operativo**: `toneladas_para_tys`, `nominado_a_tys` y `operativo_vinculado` de M-17 se completan al crear la orden y se revierten al anularla (secciones 2 y 7). (24) Cada **área** (Logística, Rental, Depósitos, RRHH, Portería y balanza) tiene su **propio punto de menú** para ver y administrar su sector: capacidad total, ABM de sus recursos por workflow y **reservas para operativos futuros** referenciando un lineup, un cupo o un operativo ferroviario (secciones 3 y 10). (25) Esas reservas se **informan expresamente en la planificación y en la ejecución**, y el área **revalida** cuando se elige otra opción (sección 10). **Revisión 16/09 (noche) — planificación afinada:** (26) los **equipos** se muestran según el origen: del muelle solo las grúas de la terminal, del buque solo las del buque, unidad por unidad. (27) El **personal externo** se asigna por mano completa y admite agregar o desafectar puestos sueltos, de la mano asignada o de cualquier otra. (28) El **personal propio** puede estar en más de un operativo: el sistema calcula el **% de afectación** y prorratea el costo. (29) **Logística (flota) y maquinaria** quedan separadas; la maquinaria lleva **% de uso** y el remanente puede afectarse a otra orden. (30) Nuevo rubro **Habilitación de puerto**, con costo según el puerto. (31) La **cantidad de turnos** la fija el Planificador y el régimen sale de la tabla de turnos (M-33). (32) El **depósito destino** se elige recorriendo la distribución de la planta: planta → depósito → celda → box → mini box. (33) **Operaciones registra la calidad** de la mercadería. (34) En **Depósito se elimina la carga manual de merma y excedente**: se aplica lo que declara la balanza al finalizar el operativo. **Revisión 17/09:** (35) en la planificación el producto muestra su **presentación** (granel, líquido, embolsado) y la familia. (36) Cada **maquinaria se despliega en sus unidades**, con marca, modelo, capacidad y medidas: según el **acceso del destino** sirve una unidad y no otra. (37) **Operaciones y Depósito trabajan la misma orden en simultáneo** mientras se descarga, asignando y liberando recursos. (38) Cada recurso indica su **ámbito** —Operaciones, Depósito o compartido—, y el ámbito define quién lo gestiona. **Revisión 17/09 (2):** (39) se quitan de la interfaz los **nombres de usuario**: la trazabilidad queda por rol. (40) Se quitan las **leyendas SUPUESTO** de las pantallas; los supuestos se consultan en su propia pantalla. (41) La marca de la barra superior pasa a **Maqueta ERP** (el sistema es multiempresa). (42) **Lineup**: el buque se toma de la MD y completa todos sus datos; hay **una línea de carga por bodega**, pueden quedar vacías y la escala se puede registrar **sin ningún BL**. (43) De **ETA y ETB** se conserva el dato de origen y **toda su evolución**. (44) Se separan las **cantidades del buque** de las **nominadas**, con el **puerto de descarga** de cada carga —que sale de la orden de servicio— y el **operador** de las demás cargas, incluidas las que no tienen operador. (45) Filtros por **estado del buque** y por **puerto**; un buque puede atracar en **más de un puerto**, con ETA / ETB / ETC por escala. (46) **Comercial elige la presentación** de la mercadería. (47) **Camión propio** y **camión contratado** en lugar de camión interno, y la **maquinaria** se elige de una **lista desplegable con el detalle de cada unidad**.

> **Estado de este documento:** es la **nueva base de referencia** del proyecto. Reemplaza como fuente de verdad la estructura previa (FD v1.1, app web v1.1, Excel master data v3.1 y las notas de construcción del "circuito simple"). Esos documentos quedan como referencia de fondo y deben tomarse con cautela: cualquier elemento que no esté contemplado o contradiga esta especificación se considera superado hasta que se revalide.

La maqueta se organizará alrededor de una **orden de servicio** que recorre **Comercial → Planificación → Operaciones → Depósito**. Cada etapa tendrá su bandeja, sus acciones y sus validaciones, manteniendo la trazabilidad de todo el circuito.

---

## 1. Estructura de empresas y unidades de negocio

| Nivel | Función |
|---|---|
| Grupo de empresas | Consolida la información de las entidades. |
| Entidad fiscal | Representa cada empresa: Terminales y Servicio —TyS—, Terminal Timbúes —TT—, Amarre y futuras entidades. |
| Unidad de negocio —BU— | Pertenece a una entidad y tiene presupuesto, costos y facturación propios. |
| Departamento | Organiza funciones, usuarios y datos maestros de su ámbito. Su relación exacta con las BU queda por definir. |

Las BU actualmente definidas para TyS son: **Rental, Logística, Maquinarias, Depósitos, Mantenimiento, Corporate y Administración**, más **Operaciones** (revisión 15/09: la descarga la realiza Operaciones, no Logística; en la maqueta se agrega como BU ejecutora del componente Descarga —y de Carga, a confirmar— con su centro de costo; Logística conserva el transporte). Las BU de TT y las demás entidades deberán configurarse.

La administración permitirá:

- Crear entidades, BU y departamentos.
- Definir servicios, presupuestos y estructuras de costos por BU.
- Registrar servicios internos y externos.
- Convertir una BU en entidad fiscal conservando su historial. Como criterio propuesto, el cambio tendrá una **fecha de vigencia** y las operaciones anteriores conservarán su entidad original.

Conviene distinguir tres relaciones en las órdenes:

| Relación | Ejemplo |
|---|---|
| Interna | Una BU presta un servicio a otra BU de la misma entidad. |
| Entre empresas del grupo | TyS presta un servicio a TT. |
| Externa | Una entidad presta un servicio a un cliente tercero. |

La forma de imputar o facturar cada relación deberá ser configurable.

## 2. Catálogo de servicios

| Ámbito | Servicios iniciales | Destinatarios |
|---|---|---|
| TyS y TT | Descarga, transporte y depósito; descarga; descarga costado vapor; carga | Terceros |
| Rental | Alquiler de maquinaria (medio Interna / Externa; maquinarias, fechas, km de entrega y devolución) | Misma entidad o terceros |
| Logística | Servicios logísticos (medio Interna / Externa; camión, origen / destino, fechas y km automáticos) | Misma entidad o terceros |
| Depósitos | Alquiler de espacio | Misma entidad o terceros |
| Mantenimiento | Servicios, repuestos e insumos | Misma entidad o empresas del grupo |
| Administración y Corporate | Prestación de servicios | Misma entidad o empresas del grupo |
| Maquinarias | Alcance pendiente de definir | Pendiente |

**Presentación del producto (revisión 17/09, S35).** En la planificación —y en el resumen del expediente— el producto se muestra con su **presentación** (granel sólido, líquido a granel en tanque, embolsado en big bag o bolsa), su familia, su estado físico y su densidad. La presentación es la que define qué equipos (grúas o bombas), qué manos y qué depósitos son compatibles, así que tiene que estar a la vista donde se asignan los recursos.

**Ámbito de los recursos (revisión 17/09, S33).** Cada recurso lleva una marca de **ámbito**: *Operaciones* (muelle, grúas y bombas, tolvas, retroexcavadora, manos de descarga y carga, operador de grúa), *Depósito* (celdas, boxes y mini boxes, autoelevadores, minicargadoras, mano de estiba de big bags, auxiliar de depósito) o **compartido** entre ambos (balanzas, camiones, palas, cintas, grupo electrógeno, supervisor y balancero). El ámbito se ve en la planificación y en la ejecución, y define qué rol puede asignar, modificar o liberar cada recurso.

**Nivel del servicio (revisión 15/09).** Un servicio puede **no impactar a una BU específica sino a la entidad** en su conjunto. Cada servicio del catálogo lleva por lo tanto un nivel: *entidad* (sin BU prestadora; las BU intervienen como ejecutoras de sus componentes) o *BU* (con BU prestadora). La asignación inicial de cada servicio a un nivel es un supuesto de trabajo (S8) a validar: los servicios a terceros de TyS y TT como nivel entidad; los de Rental, Logística, Depósitos, Mantenimiento, Administración y Corporate como nivel BU.

**BU ejecutoras de los componentes (revisión 15/09, tarde).** En la matriz de ejecución, el componente **Descarga lo ejecuta Operaciones, no Logística** (definición de Cristian); la Carga se asigna también a Operaciones a confirmar; Transporte queda en Logística y Depósito en Depósitos. La matriz es editable en Administración.

**Lineup, cupos de camiones y operativos ferroviarios** serán los orígenes operativos para los servicios a terceros de TyS y TT; los administra **Logística de arribo** (revisión 15/09). Cada carga informa además su **calidad** (grado, especificación), que se conserva en la orden. El lineup declara también los **equipos propios del buque** (grúas o bombas: cantidad y capacidad), que el Planificador puede elegir en lugar de los del muelle (revisión 15/09, supuesto S14).

Para los demás servicios, la maqueta puede utilizar una **solicitud interna o externa** como origen, pendiente de definir sus circuitos específicos.

## 3. Pantallas principales

| Pantalla | Contenido |
|---|---|
| Inicio | Entidad, BU y rol activo; pendientes y alertas. |
| Logística de arribo | Administra el lineup, los cupos de camiones y los operativos ferroviarios (alta, modificación y estado), con registro de cambios. **Solo administra la logística de arribo: no interviene en las operaciones y consulta las órdenes únicamente para visualizarlas.** Los cuatro roles del workflow consultan los arribos. En la maqueta se modela como quinto rol, sin etapa en el workflow de la orden (supuesto S10). |
| Workflow (mi etapa) | Cada etapa ve solo las órdenes que tiene que trabajar; se muestra el pipeline de estados con la etapa del rol resaltada. **Una vez trabajada una orden y guardada para que pase al siguiente rol, la aplicación vuelve a mi etapa.** |
| Operaciones (todas las órdenes) | Todas las órdenes del contexto, en consulta para cualquier rol, con el expediente completo y su historial. |
| Recursos | Disponibilidad, reservas y asignaciones. |
| Depósito | Ingresos en curso, progreso y cierre. |
| Comparativas | Circuito recomendado, planificación inicial y ejecución real; recursos propios y de terceros (necesario vs aplicado) por muelle, mercadería, calidad y destino. |
| Datos maestros | Catálogos de cada departamento y configuración general del ERP, con el modelo v3.1 completo. **ABM de cada maestro según el permiso del rol** (Nuevo registro · Editar · Dar de baja), pestaña **Permisos por rol** (matriz maestro × rol, editable por Máster data) y **Registro de cambios** de la master data (quién, cuándo, maestro, registro y qué cambió). |
| Administración | Entidades, BU, usuarios, permisos y workflows. En **Menú por rol, entidad y BU** (revisión 16/09): simulador de qué menú ve cada rol en cada entidad y BU, y tres matrices —módulos por rol / sector, menú de Operación por entidad y menú de Operación por BU—; el menú y la navegación lo respetan de inmediato; Inicio no se puede deshabilitar; cada cambio queda en el registro de cambios de la master data. |
| Mi área (capacidad y reservas) | Punto de menú propio de cada área (revisión 16/09). Muestra la **capacidad total del sector** y, por recurso, lo comprometido por órdenes en los próximos 14 días, lo reservado y lo libre; el **ABM de los recursos del área** con el mismo formulario y el mismo workflow de la master data (el alta nace en validación y Máster data la publica; la baja es lógica); y las **reservas para operativos futuros** con su historial. Áreas iniciales: Logística, Rental, Depósitos, RRHH y Portería y balanza. |
| Workflow · Área | Bandeja del rol Responsable de área: reservas **a revalidar** (la planificación o la ejecución eligió otra opción) y las altas del área pendientes de publicar. |
| Workflow · Máster data | Vista del rol Máster data: registros **en validación** (altas y modificaciones de roles con permiso ABM, pendientes de publicar), con validar y publicar o rechazar, y los últimos cambios de la master data. Máster data no tiene etapa en el workflow de la orden y consulta las órdenes únicamente para visualizarlas. |

Para recorrer casos, la maqueta tendrá un **selector de rol** que permita ver cómo cambia la bandeja y qué puede hacer cada participante.

## 4. Expediente de la orden

Cada orden conservará un único expediente, con estas secciones:

- **Resumen:** entidad, ámbito (BU prestadora o entidad), cliente, producto y calidad, servicio, medio y estado.
- **Origen:** referencia al lineup, cupo u operativo ferroviario y sus datos asociados.
- **Contrato:** instrumento contractual (o adenda), tarifas y condiciones aplicadas.
- **Habilitaciones:** nacionalización y método seguro.
- **Planificación:** recursos, horarios y circuito previsto.
- **Ejecución:** tickets, toneladas, ritmo, recursos utilizados y demoras.
- **Depósito:** ingresos, destino y cierre.
- **Costos y cargos:** imputaciones y gastos adicionales atribuibles.
- **Comparativas e historial:** versiones, eventos, responsables y fechas; recursos propios y de terceros, necesario vs aplicado.

Las **condiciones contractuales aplicadas deben quedar guardadas en la orden** para que posteriores cambios en los datos maestros no alteren su historia.

## 5. Workflow de TyS y TT

### Etapa 1. Comercial / Backoffice

**Objetivo:** transformar un negocio en una orden de servicio.

La carga seguirá una selección secuencial (revisión 15/09: el servicio va después de la entidad y, según el servicio, viene todo el resto):

**Entidad → Servicio → BU prestadora (solo si el servicio es de nivel BU; si es de nivel entidad, el ámbito es la entidad) → Medio → Cliente → Producto → Instrumento contractual → Lineup, cupo u operativo ferroviario.**

Cada selección filtrará y habilitará las opciones siguientes. Si se modifica un dato previo, se revisarán las selecciones que dependan de él. El servicio determina qué pasos aplican: sus medios posibles, si requiere producto, qué destinatarios admite y qué origen operativo corresponde.

Al seleccionar el instrumento contractual, se incorporarán las tarifas y condiciones aplicables de descarga, transporte y depósito. Al seleccionar el origen operativo, se incorporará su información.

**Instrumento contractual sin cobertura (revisión 15/09).** Cuando para el destinatario no exista un instrumento vigente, o el servicio no esté contratado, o el producto no esté incluido, la pantalla mostrará por qué no aplica cada instrumento y permitirá **cargar desde la misma orden un instrumento nuevo o una adenda del existente**. La adenda hereda tarifas y condiciones del instrumento padre y agrega servicio, producto y/o nueva vigencia; queda registrada en el maestro de Comercial y seleccionada en la orden. Se asume (S9) que Comercial tiene atribución para hacerlo sin un circuito de aprobación adicional.

Una carga de lineup ya vinculada a otra orden puede seleccionarse igual: el sistema advierte, muestra las órdenes vinculadas y propone las toneladas por el remanente.

**Servicios de Rental y Logística (revisión 15/09, noche).** Para *Alquiler de maquinaria* (BU Rental) y *Servicios logísticos* (BU Logística) la selección es **Entidad → Servicio → BU prestadora → Medio → Cliente → (producto solo en Logística) → Instrumento → Detalle del servicio**. El **medio** se elige entre **Interna** y **Externa**: con Interna, en Cliente se muestran las **otras BU** de la entidad (y, como supuesto, las empresas del grupo); con Externa, la **nómina de clientes**. El detalle del servicio reemplaza al origen operativo (lineup, cupo, tren o solicitud):

| Servicio | Detalle que carga Comercial |
|---|---|
| Rental · Alquiler de maquinaria | Una o más **maquinarias** del inventario de Rental (pala cargadora, autoelevador, minicargadora, retroexcavadora, grupo electrógeno…) con cantidad; **fecha desde y hasta**; **km de entrega** y **km de devolución**. Se estima duración y costo (horas × costo horario + km × tarifa de traslado). |
| Logística · Servicios logísticos | **Camión** (propio o de transportista) y cantidad; **origen y destino** elegidos entre las plantas / puertos del grupo y los lugares de los clientes (planta o depósito del cliente, con coordenadas); **fechas**; **km del tramo calculados automáticamente** (distancia geodésica entre los lugares × factor de ruta 1,3); toneladas a transportar, con **viajes estimados** por la capacidad del camión y **km totales** ida y vuelta. Costo estimado = camiones × horas × costo horario + km totales × tarifa por km. |

Lo solicitado llega al Planificador ya cargado en la asignación de recursos (maquinarias o camiones con su cantidad) y se valida la disponibilidad en la ventana; Operaciones ejecuta y cierra. El expediente muestra el detalle en la sección Origen y los km en Costos (supuesto S21). Las solicitudes internas / externas siguen siendo el origen para los demás servicios de las BU (Depósitos, Mantenimiento, Administración).

**Toneladas y fechas del servicio (revisión 15/09, tarde).** Al generar la orden, Comercial indica en la sección **Datos del servicio** las **toneladas del producto a operar** —no siempre el total de la mercadería del lineup, del cupo o del tren es lo que genera la operación; el origen las propone (por el remanente si la carga ya tiene órdenes) y Comercial las edita— y la **fecha y hora de inicio y fin del servicio**, propuestas desde el origen (ETB → ETC del lineup, franja del cupo, día del operativo ferroviario, ventana de la solicitud) y editables. **Esa ventana es la que se usa para validar la disponibilidad de todos los recursos** en la planificación y para las reservas. Reglas adoptadas (supuesto S19): el fin debe ser posterior al inicio; superar las toneladas del origen o salirse de su ventana se advierte pero no se bloquea; Comercial puede modificar toneladas y fechas (ABM) mientras la orden está en Borrador o Pendiente de planificación desde Expediente › Resumen › **Editar toneladas y fechas**, con motivo, registro en el historial y recomendación regenerada; desde Planificada hay que devolver la orden al Planificador (o cambiar la fecha de arribo, S15).

Comercial también registrará si la mercadería está **nacionalizada**.

**Método seguro (revisión 15/09).** Si el operativo está habilitado o no por método seguro **proviene de la master data**: el método seguro se asigna a la **familia de producto o al producto** (con procedimiento y vigencia) y lo administra Seguridad; no hay confirmación manual en la orden. Producto o familia sin método seguro vigente → orden no habilitada para iniciar hasta que Seguridad lo renueve o asigne.

**Regla central:** ambas condiciones (nacionalización registrada por Comercial y método seguro habilitado desde la master data) generan advertencias y permiten enviar a planificación, pero **impiden iniciar el operativo** cuando no están cumplidas.

**Acción:** «Crear y enviar a planificación».

La orden sale de la bandeja de pendientes de Comercial y entra en la del Planificador. Se propone conservar su consulta desde el historial.

### Etapa 2. Planificador

**Objetivo:** definir cómo se realizará el servicio y reservar los recursos.

Recibe los datos de Comercial y asigna, según corresponda:

| Recurso | Selección |
|---|---|
| Muelle | Muelle de descarga. |
| Equipos de descarga / carga | **Solo grúas o sistemas de bombeo.** El tipo lo define el producto: si es líquido, la aplicación muestra solo las bombas; si es sólido (incluido embolsado), solo las grúas. En ambos casos se selecciona **primero si los equipos son del muelle o del buque**: si son del buque, quedan seleccionados por defecto (los declara Logística de arribo en el lineup); si son del muelle, se eligen entre los disponibles. Si un equipo del muelle no está disponible porque lo utiliza otro operativo, el Planificador puede **cambiar la fecha de arribo del servicio** desde el mismo lugar (revisión 15/09). |
| Balanza | Balanza aplicable al circuito. |
| Personal propio | Puestos y cantidad. Un puesto **puede estar afectado a más de un operativo**: cuando la demanda simultánea supera la dotación, el sistema calcula el **% de afectación** (dotación / demanda), lo muestra en cada puesto y prorratea el costo; el porcentaje se congela al confirmar el plan (revisión 16/09, S25). |
| Personal externo | **Manos completas** por categoría y, sobre esa composición, el ajuste **puesto por puesto**: se agregan o desafectan personas de cualquier puesto, esté o no en la mano asignada. El costo del ajuste sale del costo por persona y turno derivado de M-13 (revisión 16/09, S30). |
| Logística (flota) | Camiones propios y de transportista, por unidad completa. Bloque **separado de la maquinaria** (revisión 16/09, S31). |
| Maquinaria | Palas, autoelevadores, minicargadora, retroexcavadora, grupo electrógeno, tolvas y cintas, cada una con **% de uso** para la orden: el remanente queda disponible para otro operativo en la misma ventana y el costo se prorratea (revisión 16/09, S31). Cada maquinaria se **despliega en sus unidades** (M-12a: interno, marca, modelo, año, capacidad, ancho y alto) y solo se ofrecen las que **entran por el acceso del destino** elegido y están operativas; la cantidad sale de las unidades elegidas (revisión 17/09, S34). |
| Turnos | **Cantidad de turnos** que fija el Planificador (el sistema propone la calculada por el ritmo) y régimen —duración y catálogo T1…T4— tomado de la **tabla de turnos M-33** (revisión 16/09, S26). |
| Habilitación de puerto | Rubro nuevo: costo por operativo que fija cada puerto en la master data (M-09); el Planificador lo incluye o lo excluye (revisión 16/09, S32). |
| Depósito destino | Se elige recorriendo la **distribución de la planta**: planta → depósito → celda / tanque / galpón / silo → **box** → **mini box**; se puede parar en cualquier nivel y el destino es el último elegido, con su propia capacidad (revisión 16/09, S29). |

Las validaciones deberán considerar disponibilidad, superposición de reservas, capacidades, compatibilidad con el producto y reglas del circuito.

**Recurso no disponible (revisión 15/09).** Cuando en la planificación un recurso no esté disponible, existirá un botón que **genere la solicitud a la BU correspondiente** (dueña del recurso) con la **información de la operación** —orden, servicio, cliente, producto, ventana, toneladas y motivo— para que habilite el recurso. La BU responde (habilita o rechaza) y el Planificador revalida. El mapeo recurso → BU dueña y el circuito de respuesta son el supuesto S13.

**Equipos del muelle o del buque y cambio de fecha de arribo (revisión 15/09).** La sección de equipos se rige por el estado físico del producto en la master data (sólido → grúas; líquido → sistemas de bombeo). El Planificador indica primero el **origen de los equipos**: del muelle (inventario de la terminal) o del buque (equipos declarados en el lineup por Logística de arribo, seleccionados por defecto). Los equipos del buque no consumen equipos del muelle, no generan superposición, no tienen costo para la terminal y se computan como recurso de tercero en la comparativa (supuesto S14). **La selección es excluyente (revisión 16/09):** con origen *muelle* solo se ofrecen las grúas o bombas de la terminal y con origen *buque* solo las del buque, listadas **unidad por unidad** para elegir cuántas se usan; al cambiar de origen se limpia la selección anterior. Si un equipo del muelle está **ocupado por otro operativo**, junto al equipo aparece **Cambiar fecha de arribo**: el sistema propone el primer turno libre después de la reserva que genera el conflicto, mantiene la duración de la ventana, corre ETA/ETB/ETC del lineup (o la fecha del cupo / tren), actualiza las órdenes vinculadas que aún no iniciaron y registra el cambio en Logística de arribo con el Planificador como responsable y la orden como motivo (supuesto S15). La recomendación automática evalúa primero los equipos del muelle y solo propone los del buque si no hay combinación factible con los propios.

Además, el sistema generará y guardará una **combinación recomendada de recursos**. Para que "la mejor combinación" sea verificable, habrá que definir su criterio: costo, duración, cumplimiento contractual o una combinación ponderada.

Se conservarán por separado:

1. La recomendación automática y sus supuestos.
2. La planificación aceptada por el planificador.

**Acción:** «Confirmar planificación y enviar a operaciones».

### Etapa 3. Operaciones

**Objetivo:** ejecutar el servicio y registrar lo que realmente ocurrió.

Antes del inicio, el sistema verificará las habilitaciones. Una orden puede estar planificada y recibida por Operaciones, pero permanecer **pendiente de habilitación** para iniciar.

Antes del inicio, Operaciones puede **ajustar los recursos planificados** (todo lo de la planificación: muelle, equipos, depósito, balanza, personal propio, manos, logística) con las mismas validaciones del Planificador; el plan aceptado se conserva como plan inicial para la comparativa (revisión 15/09).

Durante la ejecución:

- **Operaciones registra la calidad de la mercadería** (revisión 16/09, S28): la calidad llega declarada en el origen y Operaciones carga la efectiva, eligiéndola de la matriz de calidad del producto (M-23) o escribiéndola, con motivo, responsable y hora; queda en la orden y alimenta la comparativa por calidad.
- Los tickets de balanza incorporarán fecha, hora y toneladas.
- Se actualizarán las toneladas acumuladas y el ritmo de descarga.
- Operaciones podrá hacer **ABM de los recursos** —personal, maquinarias, depósitos, balanzas, muelle, logística—: alta, modificación de cantidad, reemplazo y baja (revisión 15/09).
- Cada cambio registrará recurso, momento, responsable y motivo, y quedará disponible para la comparativa posterior.
- La planificación inicial se conservará para compararla con la ejecución.

Las demoras registrarán:

| Dato | Finalidad |
|---|---|
| Causa | Clasificar la demora usando datos maestros. |
| Inicio y fin | Medir duración e impacto. |
| Responsabilidad | Identificar si es propia o de terceros. |
| Tercero involucrado | Identificar a quién corresponde cuando aplique. |
| Gasto asociado | Cuantificar el impacto económico. |
| Recuperabilidad | Identificar gastos que podrían recuperarse. |

Al incorporar recursos adicionales, se podrá indicar si el **gasto es atribuible al cliente**, con su motivo y respaldo. Esa atribución quedará registrada; el circuito de aprobación y facturación deberá definirse.

**Operaciones y Depósito en simultáneo (revisión 17/09, S35).** Mientras se descarga el buque la mercadería ya entra a depósito, así que **las dos etapas trabajan la misma orden al mismo tiempo**: la orden en ejecución aparece en la bandeja de Depósito ("ingreso en curso") y ambos roles pueden **asignar, modificar y liberar recursos** —cada uno sobre los de su ámbito y sobre los compartidos—, con la traza del rol que hizo cada movimiento. Operaciones sigue siendo quien registra tickets, demoras y calidad y quien finaliza el operativo.

**Acción:** «Finalizar operativo y enviar a cierre de depósito».

### Etapa 4. Depósito

**Objetivo:** acompañar los ingresos y realizar el cierre final.

Depósito ve el progreso mientras Operaciones está ejecutando, sin esperar el traspaso formal, y además **gestiona los recursos del ingreso** desde la sección Depósito del expediente: el panel *Recursos del ingreso* lista los de su ámbito y los compartidos, con alta, modificación y baja (revisión 17/09, S35).

Una vez finalizada la ejecución, tendrá disponible el cierre del operativo y las comparativas:

| Comparación | Qué permite evaluar |
|---|---|
| Circuito recomendado vs. ejecución real | Diferencias de eficiencia, recursos, tiempo y costo. |
| Planificación inicial vs. ejecución real | Cambios durante el operativo y su impacto. |
| Recursos propios y de terceros: lo necesario vs. lo aplicado (revisión 15/09) | Cuánto recurso propio y de terceros exigía el plan y cuánto se aplicó realmente; la lógica se da por **muelle, mercadería, calidad y destino**. Clasificación inicial (S11): propios = muelle, equipos, camiones internos, palas y tolvas, personal propio, depósito y balanza; terceros = manos de proveedores y camiones de transportista. |

La pantalla de cierre mostrará toneladas, tiempos, recursos, demoras, costos y cargos adicionales, según la información disponible.

**Merma o excedente (revisión 16/09, S27).** La merma y el excedente **ya no se cargan a mano**: se aplican los que resultan de **lo que declara la balanza al finalizar el operativo** (previsto en la orden − pesado en balanza). La pantalla de cierre muestra previsto, pesado y la diferencia; si supera la **tolerancia del instrumento contractual** (o la tolerancia general M-20), el cierre sigue requiriendo la aprobación de Comercial (supuesto S12).

**Acción:** «Cerrar operativo».

Para servicios sin ingreso físico a depósito, como ciertos casos de carga o descarga costado vapor, queda por definir si Depósito conserva el cierre administrativo.

## 6. Estados y reglas de transición

| Estado | Responsable principal | Próximo paso |
|---|---|---|
| Borrador | Comercial | Completar y crear la orden. |
| Pendiente de planificación | Planificador | Asignar y confirmar recursos. |
| Planificada / pendiente de inicio | Operaciones | Verificar habilitaciones e iniciar. |
| En ejecución | Operaciones | Registrar y finalizar el operativo. |
| Pendiente de cierre | Depósito | Revisar y cerrar. |
| Cerrada | Consulta | Consultar resultados e historial. |
| Anulada (revisión 15/09) | Consulta | Solo consulta: conserva el historial y el motivo de la anulación. |

Las advertencias de nacionalización y método seguro se mostrarán como **condiciones de la orden**, además de su estado de workflow.

Toda transición dejará registro de **quién actuó, cuándo y qué información cambió**.

### Devolver al paso anterior y anular (revisión 15/09, tarde)

**Cada etapa puede devolver la orden al estado anterior o anularla completamente.** Las dos acciones las ejecuta el **rol responsable de la etapa** (en Pendiente de cierre, el rol de cierre del servicio), siempre con **motivo obligatorio** (lista de motivos + detalle) y registro en el historial; aparecen en el expediente junto a la acción principal de la etapa.

| Devolución | Rol | Efecto |
|---|---|---|
| Pendiente de planificación → Borrador | Planificador | Comercial la recibe en su bandeja como "Devuelta por Planificador: motivo"; puede editar el borrador y reenviarla. La recomendación se conserva. |
| Planificada → Pendiente de planificación | Operaciones | La planificación aceptada queda como **historial** (se muestra como "Planificación devuelta vN"), se **liberan las reservas** de recursos y el Planificador vuelve a asignar. |
| En ejecución → Planificada | Operaciones | Solo si **no hay tickets registrados**: se revierte el inicio y la orden vuelve a Planificada con su plan. Con tickets, el operativo solo puede finalizarse o anularse. |
| Pendiente de cierre → En ejecución | Rol de cierre (Depósito / Operaciones) | El operativo vuelve a estar activo: los recursos cerrados al finalizar quedan activos y Operaciones registra lo que falte. |

**Anular:** desde cualquier etapa salvo Cerrada (y Anulada). La orden pasa a **Anulada**, **libera las reservas** de recursos y el **origen** (la carga del lineup, el cupo o el tren vuelven a estar "sin orden" y disponibles para una orden nueva), conserva planificación, costos e historial en consulta y, si ya había toneladas descargadas, quedan registradas sin cierre de depósito. El expediente muestra el motivo, quién y cuándo; el pipeline del workflow incorpora el estado Anulada. Se asume que anular no requiere aprobación adicional (supuesto S18).

## 7. Datos maestros administrables

### Generales del ERP

- Entidades, BU, departamentos y centros de costo.
- Usuarios, roles y permisos.
- Clientes, proveedores y empresas del grupo.
- Productos, unidades de medida y monedas.
- Catálogo de servicios (con nivel entidad / BU, medios, componentes y rol de cierre).
- Presupuestos y estructuras de costos.
- Workflows, reglas de transición y validaciones.

### Por área

| Área | Datos maestros principales |
|---|---|
| Comercial | Instrumentos contractuales y adendas, tarifas, condiciones (ritmo comprometido, franquicia, tolerancia de merma / excedente), productos incluidos y relaciones entre clientes, productos y servicios. |
| Planificación | Muelles, equipos de descarga / carga del muelle (grúas y sistemas de bombeo, con tipo, capacidad y BU dueña), depósitos, balanzas, recursos logísticos (propios y de terceros), capacidades y compatibilidades. El estado físico (sólido / líquido) es un atributo de la familia de producto (o del producto) y define el tipo de equipo. |
| Personal | Funciones, turnos, personal propio, proveedores de personal y composición de manos. |
| Operaciones | Causas de demora, responsabilidades y motivos de modificación de recursos. |
| Depósito | Ubicaciones, capacidades y restricciones de almacenamiento. |
| Seguridad | Métodos seguros asignados a familias de producto o a productos (procedimiento, vigencia) y criterios de cumplimiento; de aquí se deriva la habilitación de cada orden. |

Lineup, cupos, operativos ferroviarios, tickets y órdenes serán **registros operativos** vinculados a esos datos maestros; los tres primeros los administra Logística de arribo.

### Modelo de master data adoptado (revisión 15/09, tarde)

**La master data debe contener todo el modelo v3.1 para ser utilizada.** La maqueta incorpora íntegro el Excel *TyS Circuito Detalle de Construcción Master Data v3.1* (15/09/2026): los **35 maestros** M-01..M-34 (+ M-10a) en 10 dominios, sus **374 atributos** (tipo de dato, obligatoriedad, dominio de valores, parámetro, regla, origen, carácter propio / contextual / calculado, equivalente v2.2), los 7 atributos de **auditoría** y el ciclo de vida de 6 estados, las 9 **convenciones** (CV-1..CV-9), el **orden de carga** en 4 niveles, las 18 **definiciones previas** y 18 **decisiones**, las 58 **reglas** por maestro (validaciones, automatizaciones, alertas, ABM, parámetros), el **mapeo de fuentes** de la carga inicial, el cruce v2.2 → modelo y el catálogo de **52 transacciones y 21 eventos**. Cada maestro tiene registros de demostración con los atributos del modelo, y una marca por atributo distingue los que ya usa el circuito de los definidos sin uso (insumo del fit-gap).

La estructura nueva se mapea sobre el modelo (supuesto S16): la **entidad fiscal** es M-01 *Unidad de negocio* (sociedad que factura); se agregan como maestros propios de la maqueta **M-35 Unidades de negocio (BU)**, **M-36 Matriz de ejecución y relaciones**, **M-37 Workflows** y **M-38 Usuarios, roles y permisos**, y atributos ★ Maqueta donde la estructura nueva lo exige (equipos propios del buque en M-08; nivel, rol de cierre y requiere producto en M-14; productos incluidos y tarifas por componente en M-16; cargas del lineup en M-17; transportista y calidad en M-31 / M-32). El motor de la maqueta usa los atributos del modelo donde ya existían circuitos: M-07.tipo (sólido / líquido) define grúas o bombas; M-08 aporta los equipos del buque; M-26.habilitada_fiscal y su vencimiento filtran las balanzas para mercadería no nacionalizada; M-10 aporta la habilitación aduanera y los vencimientos del depósito; M-33 parametriza los turnos de 6 h; M-34 aplica días de aviso y acción al vencer sobre productos y recursos (vencido con "bloquear el recurso" → sin disponibilidad; dentro del aviso → con observaciones); M-20 fija la tolerancia general de merma. El Excel de master data v2.0 se deriva de esta misma fuente.

### Alineación de M-17 y M-21 y nominación desde el operativo (revisión 16/09)

**M-17 LineUp** adopta la lista de atributos aportada, en este orden: `codigo · puerto · buque · operador · cliente · shipper · agencia · producto · tipo_operacion · plano_de_carga · toneladas_nominadas_total_buque · toneladas_para_tys · alcance_geografico · origen · destino · eta_original · eta · eta_ · etb · sitio_atraque · operativo_vinculado · fuente · fecha_version · estado · etc ★ · orden_puerto ★ · buque_texto_fuente ★ · cliente_texto_fuente ★ · producto_texto_fuente ★ · homologado ★ · nominado_a_tys ★ · observaciones ★` (más `cargas ★`, la estructura BL / cliente / producto / calidad / toneladas que usa la maqueta). Cambios respecto del modelo v3.1: `toneladas_nominadas` pasa a **`toneladas_nominadas_total_buque`** (el total del buque, que puede incluir carga para otras terminales) y se agregan **`plano_de_carga`**, **`eta_original`** (la ETA de la primera versión: cada cambio de fecha de arribo mueve eta / etb / etc y deja el original para medir el desvío) y **`eta_`**. *Pendiente:* el nombre de `eta_` llegó truncado en la planilla; queda definido en el modelo y sin uso en el circuito hasta confirmar si es `eta_confirmada`, `eta_actualizada` u otra.

**M-21 Agencia marítima / Armador** suma los datos de contacto: `agencia_domicilio`, `agencia_telefono`, `agencia_email1` y `agencia_email2`, destinatarios de los avisos de lineup y de los cambios de ETA / ETB / ETC.

**La nominación se alimenta desde la creación del operativo.** `toneladas_para_tys`, `nominado_a_tys` y `operativo_vinculado` dejan de cargarse a mano: al crear una orden sobre una carga de la escala se completan con las toneladas de las órdenes, la marca de nominación y los números de orden; al **anular** la orden se revierten. La escala sin órdenes figura como no nominada. Se ve en Logística de arribo (tarjeta de la escala), en el expediente (sección Origen) y en Datos maestros › M-17.

### Rol Máster data, ABM y permisos por maestro (revisión 15/09, tarde)

Se agrega el rol **Máster data** (MD), sin etapa en el workflow de la orden. Es quien **hace el ABM de la master data** y quien **otorga o quita a cada rol el permiso sobre cada maestro**, en tres niveles:

| Nivel | Qué implica |
|---|---|
| **No lo visualiza** | El maestro no aparece en Datos maestros ni en los enlaces del rol (vista por área, orden de carga, fuentes, transacciones); un enlace directo muestra el aviso de permiso. |
| **Solo consulta** | Ve ficha, atributos, registros, reglas, fuentes y transacciones; sin acciones de ABM. |
| **Puede ABM** | Alta, modificación y baja lógica del maestro. |

Reglas adoptadas (supuesto S17): Máster data siempre puede ABM en todos los maestros y es el único que edita la matriz de permisos (Datos maestros › Permisos por rol); cada cambio de permiso queda en el registro de cambios. Las **altas y modificaciones de un rol con permiso ABM nacen "en validación"** y el circuito no las usa (no se ofrecen en la planificación ni en los selectores) hasta que Máster data las **valida y publica** o las rechaza desde su Workflow; las de Máster data nacen vigentes. La **baja es lógica**: el registro queda "dado de baja", se conserva con su historial y deja de ofrecerse; si está reservado por una orden planificada o en ejecución, la baja se rechaza. El **formulario de ABM es genérico**: se arma con los atributos que la maqueta usa para cada maestro (tipo de dato, enumeraciones, referencias a otros maestros elegidas del maestro correspondiente, listas) y aplica la auditoría común de la hoja 3 (quién, cuándo, versión, origen "manual", validado por). Los maestros que la maqueta administra desde otras pantallas (lineups, cupos y trenes en Logística de arribo; matriz de ejecución y workflows en Administración) o que se derivan (tarifas, calendario) no tienen ABM directo en Datos maestros y la pantalla lo indica.

**Módulos por rol / sector (revisión 15/09, tarde) y por entidad y BU (revisión 16/09).** Además del permiso por maestro, cada **módulo** del sistema (Inicio, Logística de arribo, Workflow · mi etapa, Operaciones · órdenes —incluye Nueva orden y el expediente—, Recursos, Depósito, Comparativas, Datos maestros, Administración, Casos guiados, Supuestos) se **habilita o deshabilita por rol** desde Administración › **Menú por rol, entidad y BU**. Para el **menú de Operación** (los siete primeros) existen además dos matrices: **por entidad fiscal** y **por unidad de negocio**. El menú izquierdo muestra la **intersección** rol activo ∧ entidad activa ∧ BU activa; con "Grupo (consolidado)" o "Todas las BU" no se aplica la restricción de esa dimensión. La misma pantalla tiene un simulador: se elige rol, entidad y BU y se ve qué menú resulta y por qué queda oculto cada módulo. Un enlace directo a un módulo deshabilitado vuelve a Inicio con aviso; al cambiar el rol, la entidad o la BU, la pantalla actual vuelve a Inicio si el contexto nuevo no la tiene. Inicio es fijo; Configuración y Maqueta solo se administran por rol. Valores iniciales de demostración: Logística de arribo sin Workflow ni Depósito; Máster data sin Depósito; Amarre sin Depósito ni Comparativas; Rental, Corporate, Administración y Mantenimiento sin Logística de arribo ni Depósito (Corporate y Administración tampoco Recursos); Maquinarias sin Depósito. En la maqueta la edición no está restringida por rol; en el sistema real correspondería a Máster data o a Administración (supuestos S20 y S22).

**ABM del modelo por Máster data (revisión 16/09).** Las listas del modelo —**convenciones** (CV-1…), **reglas por maestro**, **definiciones previas** y **decisiones**— dejan de ser constantes del Excel y pasan a la master data de la maqueta: Máster data las administra con el mismo formulario genérico y la misma auditoría que los maestros (alta vigente, modificación versionada, baja lógica) y cada cambio queda en el registro de cambios; los demás roles las consultan. Las reglas nuevas aparecen también en la pestaña Reglas del maestro al que refieren. Orden de carga, mapeo de fuentes, transacciones y eventos siguen de solo consulta (supuesto S22).

Permisos iniciales de demostración (a validar con cada área): Comercial ABM en clientes / proveedores, tarifas, contratos, despachantes y matriz de calidad; Planificador en tolerancias y compatibilidad; Operaciones en equipos, causas de demora e insumos; Depósito en depósitos, ubicaciones, calidad y compatibilidad; Logística de arribo en buques, lineup, agencias, cupos y trenes; los maestros contables (M-03, M-04) quedan ocultos para los roles operativos y las tarifas (M-15) para Operaciones, Depósito y Logística de arribo.

## 8. Casos para recorrer en la maqueta

| Caso | Recorrido esperado |
|---|---|
| Operación completa sin incidencias | Crear → planificar → ejecutar con tickets → cerrar y comparar. |
| Mercadería no nacionalizada | Permite planificar; bloquea el inicio hasta regularizar la condición. |
| Método seguro pendiente | Muestra advertencia en Comercial; bloquea el inicio. |
| Recurso no disponible | Impide una asignación incompatible y permite elegir una alternativa. |
| Plan diferente de la recomendación | Guarda ambas propuestas y las compara al cierre. |
| Recurso adicional durante la ejecución | Registra el cambio, su costo y la posible atribución al cliente. |
| Demora causada por un tercero | Registra duración, responsabilidad y gasto recuperable. |
| Seguimiento de depósito | Muestra ingresos mientras el operativo sigue activo. |
| Servicio interno o entre empresas | Distingue entidad y BU prestadora de la destinataria. |
| Instrumento contractual sin cobertura (agregado 15/09) | Explica por qué ningún instrumento aplica y permite cargar uno nuevo o una adenda desde la orden. |
| Logística de arribo registra un arribo (agregado 15/09) | Solo ese rol administra lineup, cupos y operativos ferroviarios; Comercial lo toma como origen. |
| Recurso no disponible → solicitud a la BU dueña (agregado 15/09, dentro del caso 4) | El Planificador genera la solicitud con la información de la operación; la BU habilita; la validación se actualiza. |
| Equipos según el producto: muelle o buque, y cambio de fecha de arribo (agregado 15/09, caso 12) | Líquido → solo bombas; sólido → solo grúas. Origen del buque preseleccionado desde el lineup; ante un equipo del muelle ocupado por otro operativo, el Planificador cambia la fecha de arribo y el lineup se corre. |
| Master data completa según el modelo v3.1 (agregado 15/09, caso 13) | Cada maestro del Excel v3.1 está en la maqueta con su ficha, atributos, registros, reglas, fuentes y transacciones; el circuito usa esos atributos (MS con aviso y acción al vencer, habilitación fiscal de balanzas, tipo del producto). |
| Máster data: ABM de maestros y permisos por rol (agregado 15/09, caso 14) | El rol Máster data hace el ABM de cualquier maestro y define para cada rol si no lo visualiza, solo consulta o puede ABM; las altas de otros roles nacen en validación y Máster data las publica; la baja es lógica. |
| Devolver al paso anterior o anular la orden (agregado 15/09, caso 15) | Cada etapa devuelve la orden al paso anterior con motivo (el rol anterior la recibe en su bandeja) o la anula: libera recursos y origen y conserva el historial. |
| Toneladas y fechas del servicio definidas por Comercial (agregado 15/09, caso 16) | Comercial indica cuántas toneladas opera y el inicio y fin del servicio; esa ventana valida la disponibilidad; ABM hasta Pendiente de planificación. |
| Módulos por rol / sector y descarga a cargo de Operaciones (agregado 15/09, caso 17) | Cada pantalla se habilita o deshabilita por rol; la descarga se imputa a la BU Operaciones. |
| Rental y Logística: alta de servicios internos o externos (agregado 15/09, caso 18) | Medio Interna / Externa, cliente según el medio y detalle del servicio: maquinarias, fechas y km (Rental) o camión, origen / destino, fechas y km automáticos (Logística). |
| Áreas: capacidad propia, ABM del sector y nominación del lineup (agregado 16/09, caso 20) | Cada área ve y administra su capacidad; el ABM nace en validación; la nominación del lineup se alimenta de los operativos y se revierte al anular. |
| Reserva de un área para un operativo futuro y revalidación (agregado 16/09, caso 21) | La reserva referencia lineup, cupo u operativo ferroviario; la planificación y Operaciones quedan informadas y el área revalida cuando se elige otra opción. |
| Planificación afinada: equipos, turnos, personal, maquinaria y depósito (agregado 16/09, caso 22) | Grúas del muelle o del buque sin mezclarse; turnos desde M-33; manos ajustables puesto por puesto; personal propio con % de afectación; flota y maquinaria separadas con % de uso; habilitación de puerto; destino por la distribución de la planta. |
| Presentación, unidades de maquinaria y ámbito de los recursos (agregado 17/09, caso 24) | El producto muestra su presentación; cada maquinaria se despliega en unidades y solo se ofrecen las que entran por el acceso del destino; cada recurso marca su ámbito. |
| Operaciones y Depósito en simultáneo (agregado 17/09, caso 25) | La orden en ejecución está en la bandeja de Depósito; los dos roles asignan y liberan recursos según su ámbito, con traza por rol. |
| Calidad por Operaciones y cierre por balanza (agregado 16/09, caso 23) | Operaciones registra la calidad efectiva; el cierre toma la merma o el excedente de lo pesado en balanza. |
| Menú de Operación por entidad y por BU; Máster data edita convenciones y reglas (agregado 16/09, caso 19) | Matrices por rol, entidad y BU con simulador; el menú cambia con el contexto; ABM de convenciones, reglas, definiciones y decisiones por Máster data. |

Para demostrar el circuito, la maqueta podrá **simular tickets de balanza y disponibilidad de recursos**.

## 9. Definiciones pendientes para completar el alcance

Las decisiones que más influyen en el diseño son:

1. Qué BU ejecuta cada servicio de TyS y TT.
2. Qué significa "mejor combinación" y cómo se calcula.
3. Quién actualiza y valida la nacionalización y el método seguro.
4. Cómo se obtiene la disponibilidad de recursos.
5. Cómo se aprueban y facturan los gastos adicionales.
6. Cómo cierra un servicio que no utiliza depósito.
7. Qué recorrido tendrán los servicios de las otras BU.
8. Qué servicios son de nivel entidad y cuáles de nivel BU (revisión 15/09; asignación inicial como supuesto S8).
9. Atribuciones y circuito de aprobación para cargar instrumentos o adendas desde la orden (S9).
10. Logística de arribo: si es un rol propio o una función de otro sector, y su relación con Comercial y Planificación (S10).
11. Clasificación definitiva de recursos propios y de terceros y unidad de medida de la comparativa necesario vs aplicado (S11).
12. Tratamiento de la merma o excedente fuera de tolerancia contractual: quién aprueba y cómo se registra (S12).
13. Circuito de la solicitud de habilitación de recursos a la BU dueña: destinatario por tipo de recurso, plazos y respuesta (S13).
14. Equipos del buque: quién los declara y valida (Logística de arribo desde el lineup, según supuesto S14), cómo se tarifan al cliente y cómo se computan en la comparativa propios / terceros.
15. Cambio de fecha de arribo desde la planificación: atribuciones del Planificador, coordinación con Logística de arribo y la agencia marítima, y efecto sobre las demás órdenes de la misma escala (S15).
16. Validación de los registros de demostración de cada maestro con su área dueña (valores, claves naturales, vencimientos) y decisión sobre los atributos "definidos, sin uso aún" del modelo v3.1 (S16).
17. Rol Máster data: ubicación organizativa, matriz definitiva de permisos por maestro y rol, circuito de validación de las altas de otros roles (plazos, quién autoriza según el dueño del dominio) y alcance del ABM directo frente a los registros que se administran desde otras pantallas (S17).
18. Devolución y anulación de la orden: si además del rol responsable de la etapa pueden hacerlo Comercial o un supervisor, si la anulación requiere aprobación, efecto sobre cargos ya aprobados y sobre la facturación de toneladas descargadas antes de anular (S18).
19. Toneladas y fechas del servicio: si se admite superar las toneladas del origen, hasta qué etapa las modifica Comercial y quién aprueba el cambio una vez planificada; relación entre la ventana del servicio y la ventana del arribo (S19).
20. BU Operaciones: alcance (¿también la carga de buques?), recursos que le pertenecen (muelles, balanzas) frente a Logística y Maquinarias, y quién administra la habilitación de módulos por rol / sector (S20).
21. Rental y Logística: si las empresas del grupo entran en "Interna" o en un tercer medio; inventario definitivo de maquinarias de Rental y tarifas (por hora, por día, por km de traslado); fuente de las distancias (matriz de rutas, GPS o cálculo geodésico con factor) y tarifa por km de los servicios logísticos; si el origen / destino admite direcciones libres además de las plantas y lugares de clientes (S21).
22. Menú por entidad y BU: si la restricción por BU debe aplicarse también con "Todas las BU" (unión o intersección), quién administra las tres matrices y si los módulos de Configuración deben tener dimensión entidad; gobierno de las listas del modelo (quién aprueba una regla o convención nueva, versionado frente al Excel v3.1) (S22).

23. Áreas operativas: qué área es dueña de los **muelles y de los equipos de descarga / carga** (hoy sin asignar), inventario y capacidad definitiva de cada sector, quién autoriza el ABM de cada área y si el área activa debe derivarse del usuario (S23). Además, confirmar el nombre del atributo `eta_` de M-17, que llegó truncado.
24. Reservas de capacidad de un área: si deben **bloquear** la asignación en lugar de advertir, quién resuelve el conflicto entre el área y el Planificador, si la reserva caduca al vencer su ventana y si se admiten reservas sin operativo de referencia (S24).

25. Planificación de personal: si el reparto del % de afectación del personal propio debe poder fijarse a mano y si algún puesto debe seguir siendo exclusivo de un operativo; si el convenio admite manos incompletas y cómo se factura un puesto suelto al proveedor (S25, S30).
26. Turnos y maquinaria: si deben poder elegirse turnos salteados y si el régimen cambia por planta o por día hábil / inhábil; % mínimo de uso asignable a una maquinaria y si el remanente debe ofrecerse automáticamente a otras órdenes (S26, S31).
27. Distribución de la planta y puerto: distribución real de cada planta hasta mini box y si la capacidad del nivel superior se recalcula desde sus hijos; si la habilitación de puerto es fija por operativo o depende del buque / las toneladas y si se traslada al cliente (S29, S32).
28. Calidad y balanza: si la calidad que registra Operaciones exige respaldo de laboratorio y si su cambio debe avisar a Comercial por el impacto en la tarifa; tratamiento de las diferencias de balanza por humedad o doble pesaje y si se admite un ajuste posterior con autorización (S28, S27).

29. Ámbito de los recursos: validar con cada área el reparto Operaciones / Depósito / compartido, y definir si algún recurso compartido necesita acuerdo de los dos roles para liberarse (S33).
30. Unidades de maquinaria y accesos: relevar medidas y capacidades de cada unidad y los accesos reales de cada ubicación (ancho, alto y tipo), y definir si la cantidad disponible de una maquinaria debe calcularse siempre desde sus unidades operativas (S34).
31. Trabajo simultáneo: si Depósito debe poder registrar tickets de ingreso propios, cómo se resuelve un conflicto cuando los dos roles tocan el mismo recurso compartido y si la finalización del operativo requiere conformidad de Depósito (S35).

**Primer alcance funcional:** una orden completa de TyS/TT, con los cuatro roles del workflow (más Logística de arribo y Máster data como roles de soporte), bloqueos de inicio, planificación recomendada, ejecución con incidencias, devolución o anulación en cada etapa y cierre comparativo. La estructura multiempresa y los catálogos permitirán extender después los circuitos a las demás BU.

---

## 10. Áreas, capacidad propia y reservas para operativos futuros (revisión 16/09)

### 10.1 Áreas y su sector

Las **áreas** administran la capacidad que les pertenece. Las definidas hoy son **Logística, Rental, Depósitos, RRHH y Portería-Balanza**; se incorporan como maestro **M-39 Áreas operativas y capacidad** (★ maqueta) con entidad, departamento, BU y los **tipos de recurso** que administra cada una:

| Área | Recursos que administra | Maestro del ABM |
|---|---|---|
| Logística | Camiones internos y de transportista, tolvas y cintas (BU Logística y Maquinarias) | M-12 |
| Rental | Maquinarias de alquiler (palas, autoelevadores, minicargadora, retroexcavadora, grupo electrógeno) | M-12 |
| Depósitos | Celdas, tanques, galpones y silos | M-10a |
| RRHH | Puestos de personal propio y manos de proveedores | M-05 · M-13 |
| Portería y balanza | Balanzas | M-26 |

Cada área ve, por recurso: **capacidad total**, **comprometido** (pico de uso por órdenes planificadas o en ejecución en los próximos 14 días), **reservado por el área** y **libre**. Muelles y equipos de descarga / carga **todavía no tienen área dueña asignada**: es una definición pendiente (supuesto S23).

El **ABM del sector pasa por el workflow de la master data**: las altas y modificaciones del área nacen *en validación* y Máster data las publica o las rechaza; la baja es lógica y se rechaza si el recurso está reservado por una orden planificada o en ejecución. Se agrega el rol **Responsable de área** (ARE) con permiso de ABM sobre los maestros de su sector; en la maqueta el área activa se elige en el módulo y en el sistema real vendría del usuario (M-38).

### 10.2 Reservas para operativos futuros

El área puede **reservar capacidad para un operativo futuro** referenciando un **lineup, un cupo de camiones o un operativo ferroviario**, con recurso, cantidad, ventana (propuesta desde el origen) y motivo. Estados de la reserva:

| Estado | Qué significa |
|---|---|
| **Reservada** | Vigente: la capacidad está comprometida para ese operativo. |
| **Aplicada** | La planificación (o el ajuste de Operaciones) tomó lo reservado. |
| **A revalidar** | La planificación o la ejecución eligió otra opción, tomó menos de lo reservado o la orden se anuló: vuelve a la bandeja del área. |
| **Liberada** | El área liberó la capacidad. |

### 10.3 Cómo se informa y cómo se revalida

En la **planificación** y en el **ajuste de recursos de Operaciones** de toda orden de ese origen aparece el aviso **"Capacidad reservada por las áreas para este operativo"**, con cada recurso, la cantidad, el área, el motivo y si la asignación actual lo toma, más el botón **Usar lo reservado por las áreas**. Al confirmar el plan o el ajuste, cada reserva queda *Aplicada* o pasa a *A revalidar*, y el cambio se registra en el historial de la orden y en el de la reserva. El área revalida desde su bandeja: **liberar** la capacidad o **mantener la reserva** y pedir que se revise el plan (vuelve a *Reservada* y el Planificador la ve otra vez). Una reserva de **otro** operativo aparece como **aviso** en la validación del recurso (no bloquea). Supuesto S24; queda por definir si debería bloquear, quién resuelve el conflicto entre un área y el Planificador y si la reserva caduca al vencer su ventana.

---

## 11. Logística de arribo: el lineup en detalle (revisión 17/09)

| Tema | Definición |
|---|---|
| Alta desde el maestro de buques | La escala referencia un buque de **M-08**. Al elegirlo se completan bandera, eslora, calado, equipos propios y **cantidad de bodegas**. Un buque que no existe se da de alta provisoriamente hasta homologar el IMO. |
| Una línea por bodega | El lineup abre tantas líneas de carga como bodegas declara el buque. Pueden quedar **vacías** y la escala se guarda **sin ningún BL**: la información de la agencia llega por partes y se completa con el tiempo. |
| Puerto de descarga y operador | Cada línea indica **dónde se descarga** esa carga y **quién la opera**: nosotros, otro operador portuario o ninguno. La carga **sin operador** se marca como oportunidad comercial. |
| Cantidades declaradas vs nominadas | La tarjeta separa **lo declarado por el buque**, **lo nominado a nosotros** —que sale de las órdenes de servicio, con el puerto de cada una—, **lo que opera un tercero** y **lo que está sin operador**. Un mismo cliente y producto puede nominarse a puertos distintos. |
| Secuencia de puertos | Un buque puede atracar en **más de un puerto**: el lineup guarda la rotación y cada escala tiene su **ETA, ETB y ETC**. La escala de nuestra terminal manda la ventana de las órdenes. |
| Evolución de las fechas | De ETA, ETB y ETC se conserva el **dato de origen** y **todos los cambios**, en el orden en que se produjeron, con motivo y rol. |
| Filtros | Por **estado del buque** (anunciado, confirmado, en rada, en operación, zarpó, cancelado) y por **puerto** de la rotación. |

**Pendientes de esta sección.** De dónde llega el detalle de las cargas de terceros (manifiesto de la agencia o carga manual) y con qué frecuencia se actualiza; si los puertos de terceros se toman de un maestro común (M-09 ampliado) o de una interfaz con la agencia; si la carga sin operador dispara una acción comercial formal (alerta, tarea o oportunidad en el CRM).

---

## 12. Presentación, flota y maquinaria (revisión 17/09)

- **Presentación de la mercadería.** Comercial la elige al crear la orden —granel sólido, líquido a granel, embolsado en big bag o en bolsa, contenedor—. La propone el producto (M-07) y queda guardada en la orden, de modo que la ve todo el circuito. Pendiente: si una orden puede tener más de una presentación y si la presentación condiciona la tarifa.
- **Flota.** *Camión interno* pasa a **camión propio** y *camión de transportista* a **camión contratado**.
- **Maquinaria.** Se elige desde una **lista desplegable con el detalle de cada unidad** (interno, marca, modelo, año, capacidad y medidas); las unidades que no entran por el acceso del destino aparecen deshabilitadas. Cada unidad elegida se muestra con su **% de uso** y se puede quitar.
- **Trazabilidad por rol.** La maqueta no usa nombres de personas: cada acción queda registrada con el rol que la hizo. En el sistema real la traza será del usuario autenticado, que pertenece a un rol y a un área.

---

## Anexo A — Definiciones adicionales propuestas para la lista de pendientes (análisis funcional, 15/09/2026 — a validar con el grupo)

Surgen de leer la especificación con ojo de diseño; no son decisiones tomadas.

| # | Definición | Por qué importa | Opciones visibles |
|---|---|---|---|
| A1 | **Estructura de la orden para servicios combinados** ("descarga, transporte y depósito") | Determina cómo se imputa a las BU ejecutoras (Logística, Depósitos, Maquinarias) un servicio que el cliente contrata como uno solo. | (a) Orden única con líneas de servicio por BU; (b) orden madre comercial + sub-órdenes internas por BU ejecutora; (c) una orden independiente por servicio. |
| A2 | **Cardinalidad origen operativo ↔ orden** | Un lineup de buque puede tener varios clientes/productos/BL; una misma carga puede requerir más de una orden. | (a) 1 origen → N órdenes; (b) 1 orden → N orígenes; (c) N:N vía "operativo". Adoptado provisoriamente: una carga admite N órdenes con advertencia y toneladas por remanente. |
| A3 | **Relación Departamento ↔ BU** | Define permisos, ámbito de maestros y a quién le llega cada bandeja. | (a) Departamento pertenece a una BU; (b) Departamento a nivel entidad y BU como dimensión económica independiente (N:N); (c) híbrido por tipo de departamento. |
| A4 | **Entidad efectiva por fecha** al convertir una BU en entidad | Contratos, tarifas y numeración de órdenes deben "mudarse" desde la vigencia sin tocar la historia. | Guardar en cada orden la entidad/BU vigente al crearla (mismo criterio que las condiciones contractuales congeladas). |
| A5 | **Rol de cierre configurable por servicio** | Resuelve el pendiente 6 (cierre sin depósito) sin excepciones en el código. | Atributo del workflow del servicio: quién cierra (Depósito / Operaciones / Backoffice). |

## Anexo B — Documentos previos afectados

| Documento previo | Situación tras el reinicio |
|---|---|
| FD v1.1 (Word) y `claude/fd-v1.1-revision-grupal-15-09-2026.md` | Superado; conserva definiciones puntuales aún válidas (manos por rol, turnos de 6 h, atributo Método seguro) que deben revalidarse en la nueva estructura. |
| App web "TyS - Sistema de gestión operativa FD" v1.1 | Superada; se reconstruye como maqueta v2.0 alrededor de la orden de servicio. |
| Excel master data v3.1 y `claude/modelo-master-data-y-operativos-spec.md` | Referencia para el inventario de maestros; debe reorganizarse por ámbito (grupo / entidad / BU / departamento) y por área según la sección 7. |
| AS-IS v3.3, Arquitectura Funcional del ERP, portafolio de servicios y roadmap | Siguen vigentes como contexto de negocio y marco del programa. |
