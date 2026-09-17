/* Genera "TyS - Diseño Funcional v2.0.docx" a partir de data.json (extraído de la maqueta) y del modelo v3.1 */
const fs = require('fs');
const L = require('./lib.js');
const d = require('./data.json');
const { Packer, Paragraph, TextRun, TableOfContents, h1n, h2, p, note, table, kvTable, spacer, pb, flat, cover, buildDoc, C, AlignmentType } = L;

/* modelo v3.1 (constantes del build de la maqueta) */
const M = {};
{ const src = fs.readFileSync(require('path').join(__dirname, '../../src/03b-model.js'), 'utf8'); const m = {}; eval(src.replace(/^const MODEL_/gm, 'm.')); Object.assign(M, m); }

const meta = {
  org: 'TyS · Terminales y Servicio — Proyecto de reemplazo del sistema core',
  titulo: 'Diseño Funcional',
  subtitulo: 'Orden de servicio multiempresa: Comercial → Planificador → Operaciones → Depósito, Logística de arribo y Máster data',
  version: 'FD v2.5', fecha: '17/09/2026',
  lineas: ['Autor: Cristian D\'Annunzio — Analista Funcional de Negocios', `Base: maqueta navegable "TyS · Maqueta ERP v2 — Orden de servicio" ${d.version}`, `Modelo de master data: ${M.META.version} (${M.META.fecha})`, 'Estado: base de referencia vigente — reemplaza al FD v1.1'],
  autor: 'Cristian D\'Annunzio', encabezado: 'TyS · Diseño Funcional — Orden de servicio multiempresa', pie: 'FD v2.5 · 17/09/2026 · derivado de la maqueta ' + d.version,
  descripcion: 'Diseño funcional del sistema core de TyS derivado de la maqueta ' + d.version + '',
};

/* portada */
const secCover = { plain: true, children: cover(meta) };

/* control de versiones + índice */
const secFront = flat(
  h1n('Control de versiones'),
  table(['Versión', 'Fecha', 'Autor', 'Cambios'], [
    ['FD v1.0', '2026', 'C. D\'Annunzio', 'Diseño funcional inicial del workflow de recepción, transporte y depósito (etapas A–D), 35 maestros.'],
    ['FD v1.1', '15/09/2026', 'C. D\'Annunzio', 'Revisión grupal: arribo por buque / camión / ferrocarril, programa centralizado por tramos, condición aduanera, planificación centralizada, manos y dotación por cantidad, turnos de 6 h, planificado vs realizado, método seguro (M-34).'],
    ['FD v2.0', '16/09/2026', 'C. D\'Annunzio', `Reescritura completa alrededor de la orden de servicio multiempresa, derivada de la maqueta ${d.version}: estructura grupo / entidad / BU, catálogo de servicios con nivel y matriz de ejecución (descarga a cargo de Operaciones), selección secuencial, instrumento sin cobertura, toneladas y ventana del servicio, equipos del muelle o del buque, solicitud a la BU dueña, cambio de fecha de arribo, ABM de recursos en ejecución, merma / excedente, comparativas propios / terceros, devolver y anular, Rental y Logística interna / externa, Logística de arribo, rol Máster data con permisos por maestro, ABM genérico, validación y listas del modelo editables, módulos por rol / entidad / BU, diseño responsive, 19 casos de aceptación, supuestos S1–S22 y A1–A5.`],
    ['FD v2.1', '16/09/2026', "C. D'Annunzio", 'Revisión del 16/09 (tarde): atributos de M-17 LineUp y M-21 Agencia alineados a la planilla de la agencia (plano de carga, ETA original, textos de fuente, datos de contacto); la nominación de la escala (toneladas para TyS, nominado a TyS y operativo vinculado) se alimenta de la creación del operativo y se revierte al anularlo; nuevo capítulo 11 con el módulo Mi área —maestro M-39, capacidad propia de cada sector, ABM por el workflow de la master data y rol Responsable de área— y las reservas de capacidad para operativos futuros, informadas en la planificación y en la ejecución con revalidación del área; casos de aceptación 20 y 21; supuestos S23 y S24; definiciones pendientes 23 y 24.'],
    ['FD v2.2', '16/09/2026', "C. D'Annunzio", 'Revisión del 16/09 (noche), planificación afinada: equipos del muelle o del buque excluyentes y elegibles unidad por unidad; personal externo por mano completa con ajuste puesto por puesto; personal propio compartido entre operativos con % de afectación automático; logística (flota) separada de maquinaria, con % de uso y remanente disponible para otra orden; rubro nuevo Habilitación de puerto con costo por puerto; cantidad de turnos fijada por el Planificador y régimen desde la tabla M-33; destino en depósito por la distribución de la planta (planta → depósito → celda → box → mini box). Operaciones registra la calidad de la mercadería; en el cierre la merma y el excedente salen de lo que declara la balanza. Casos de aceptación 22 y 23; supuestos S25–S32; definiciones pendientes 25 a 28.'],
    ['FD v2.3', '17/09/2026', "C. D'Annunzio", 'Revisión del 17/09: el producto se muestra con su presentación (granel sólido, líquido a granel, embolsado) en la planificación y en el resumen; nuevo maestro M-12a Unidades de maquinaria —cada máquina desplegada en sus unidades con marca, modelo, capacidad y medidas— y atributo de acceso en cada ubicación de M-10a, de modo que según el acceso del destino sirve una unidad y no otra; cada recurso lleva un ámbito (Operaciones, Depósito o compartido) que define quién lo gestiona; Operaciones y Depósito trabajan la misma orden en simultáneo mientras se descarga, asignando y liberando recursos con traza por rol. Casos de aceptación 24 y 25; supuestos S33–S35; definiciones pendientes 29 a 31.'],
    ['FD v2.4', '17/09/2026', "C. D'Annunzio", 'Sin efecto: aplicaba la identidad de marca de una sola empresa. Se retiró porque el sistema es multiempresa; la marca de cada entidad se resolverá como atributo de la entidad en la master data.'],
    ['FD v2.5', '17/09/2026', "C. D'Annunzio", 'Revisión del 17/09 (2). Logística de arribo: el lineup toma el buque de M-08 y abre una línea de carga por bodega —pueden quedar vacías y la escala se registra sin ningún BL—; cada carga indica puerto de descarga y operador, con las cargas sin operador marcadas como oportunidad comercial; se separan las cantidades declaradas por el buque de las nominadas a nosotros, con el puerto que sale de la orden; un buque puede atracar en varios puertos, cada escala con su ETA / ETB / ETC; de cada fecha se conserva el dato de origen y toda su evolución; filtros por estado de buque y por puerto. Comercial elige la presentación de la mercadería. Planificación: camión propio y camión contratado, y maquinaria elegida desde una lista desplegable con el detalle de cada unidad. La interfaz deja de mostrar nombres de usuario (traza por rol) y leyendas SUPUESTO. Casos de aceptación 26 a 29; supuestos S36–S39.'],
  ], [0.1, 0.12, 0.14, 0.64], { size: 17 }),
  spacer(),
  kvTable([
    ['Fuente de verdad', `Maqueta navegable ${d.version} (claude.ai / Vercel) y su código fuente en Git. Este documento la describe; ante una diferencia, prevalece el comportamiento acordado en la revisión y la maqueta se corrige.`],
    ['Destinatarios', 'Equipo de proyecto, referentes de Comercial, Planificación, Operaciones, Depósitos, Logística de arribo, Seguridad, Administración y Finanzas; proveedores del ERP para el fit/gap.'],
    ['Convenciones', 'S1…S22 y A1…A5: supuestos (capítulo 15). M-xx: maestros (Anexo C). "(revisión dd/mm)": sesión en que se definió el comportamiento. ★: elemento propio de la maqueta, no presente en el Excel v3.1.'],
    ['Próximos entregables', 'Excel de master data v2.0 derivado de la maqueta; plan de pruebas UAT a partir del capítulo 14; matriz de fit/gap por módulo.'],
  ], 0.22),
  pb(),
  new Paragraph({ children: [new TextRun({ text: 'Índice', size: 34, bold: true, color: C.accent })], spacing: { before: 360, after: 200 } }),
  new TableOfContents('Índice', { hyperlink: true, headingStyleRange: '1-2' }),
  note('El índice se actualiza al abrir el documento en Word (aceptar "Actualizar campos") o con F9 sobre el índice.'),
);

/* cuerpo */
const body = flat(
  require('./content-1.js')(d, M, L),
  require('./content-2.js')(d, M, L),
  require('./content-3.js')(d, M, L),
);

const doc = buildDoc([secCover, secFront, body], meta);
const out = require('path').join(__dirname, 'TyS - Diseño Funcional v2.5.docx');
Packer.toBuffer(doc).then(buf => { fs.writeFileSync(out, buf); console.log('ok', out, Math.round(buf.length / 1024) + ' KB', 'párrafos/tablas:', body.length); });
