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
  version: 'FD v2.0', fecha: '16/09/2026',
  lineas: ['Autor: Cristian D\'Annunzio — Analista Funcional de Negocios', `Base: maqueta navegable "TyS · Maqueta ERP v2 — Orden de servicio" ${d.version}`, `Modelo de master data: ${M.META.version} (${M.META.fecha})`, 'Estado: base de referencia vigente — reemplaza al FD v1.1'],
  autor: 'Cristian D\'Annunzio', encabezado: 'TyS · Diseño Funcional — Orden de servicio multiempresa', pie: 'FD v2.0 · 16/09/2026 · derivado de la maqueta ' + d.version,
  descripcion: 'Diseño funcional del sistema core de TyS derivado de la maqueta v2.9.1',
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
const out = require('path').join(__dirname, 'TyS - Diseño Funcional v2.0.docx');
Packer.toBuffer(doc).then(buf => { fs.writeFileSync(out, buf); console.log('ok', out, Math.round(buf.length / 1024) + ' KB', 'párrafos/tablas:', body.length); });
