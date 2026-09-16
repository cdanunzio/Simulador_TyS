/* helpers docx-js para el Diseño Funcional */
const docx = require('docx');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, ShadingType, AlignmentType, BorderStyle, PageBreak, TableOfContents, Header, Footer, PageNumber, LevelFormat, PositionalTab, PositionalTabAlignment, PositionalTabLeader, VerticalAlign } = docx;

const FONT = 'Calibri';
const C = { ink: '1A2330', ink2: '48566A', ink3: '78869A', accent: '145C6B', accentSoft: 'D9EAEE', line: 'CFD7DE', brand: 'D9831A', brandSoft: 'FBEBD3', soft: 'F1F3F5', warnSoft: 'FAEBCF', okSoft: 'DCEFE2' };
const PAGE_W = 11906, MARG = 1134; const CONTENT_W = PAGE_W - 2 * MARG; // A4, márgenes 2 cm

function esc(s) { return String(s ?? ''); }
/* texto con **negrita** simple */
function runs(text, opts = {}) {
  const parts = esc(text).split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map(p => p.startsWith('**') && p.endsWith('**') ? new TextRun({ text: p.slice(2, -2), bold: true, ...opts }) : new TextRun({ text: p, ...opts }));
}
function h1(t) { return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)], pageBreakBefore: true }); }
function h1n(t) { return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] }); }
function h2(t) { return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] }); }
function h3(t) { return new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(t)] }); }
function p(t, opts = {}) { return new Paragraph({ children: runs(t, opts.run), spacing: { after: 120 }, ...opts.para }); }
function note(t) { return new Paragraph({ children: runs(t, { color: C.ink2, size: 19 }), spacing: { after: 120 }, indent: { left: 360 }, border: { left: { style: BorderStyle.SINGLE, size: 12, color: C.brand, space: 8 } } }); }
function ul(items) { return items.map(t => new Paragraph({ children: runs(t), numbering: { reference: 'bul', level: 0 }, spacing: { after: 60 } })); }
let OL_INST = 0;
function ol(items) { const inst = ++OL_INST; return items.map(t => new Paragraph({ children: runs(t), numbering: { reference: 'num', level: 0, instance: inst }, spacing: { after: 60 } })); }
function pb() { return new Paragraph({ children: [new PageBreak()] }); }
function cell(text, w, opts = {}) {
  const paras = Array.isArray(text) ? text : [text];
  return new TableCell({ width: { size: w, type: WidthType.DXA }, verticalAlign: VerticalAlign.TOP, shading: opts.fill ? { type: ShadingType.CLEAR, fill: opts.fill, color: 'auto' } : undefined, margins: { top: 60, bottom: 60, left: 90, right: 90 },
    children: paras.map(t => new Paragraph({ children: runs(t, { size: opts.size || 18, bold: opts.bold, color: opts.color }), spacing: { after: 0 }, alignment: opts.align })) });
}
/* tabla con encabezado sombreado; widths en fracciones que suman 1 */
function table(cols, rows, widths, opts = {}) {
  /* si las fracciones no coinciden con la cantidad de columnas, se reparte el resto en partes iguales */
  if (!widths || widths.length !== cols.length) { const w0 = (widths || []).slice(0, cols.length); const usado = w0.reduce((a, b) => a + b, 0); const resto = Math.max(0.05, 1 - usado); const faltan = cols.length - w0.length; widths = faltan > 0 ? [...w0, ...Array(faltan).fill(resto / faltan)] : w0.map(x => x / usado); }
  const ws = widths.map(f => Math.round(CONTENT_W * f)); const diff = CONTENT_W - ws.reduce((a, b) => a + b, 0); ws[ws.length - 1] += diff;
  const head = new TableRow({ tableHeader: true, children: cols.map((c, i) => cell(c, ws[i], { fill: C.accentSoft, bold: true, size: 17, color: C.accent })) });
  const body = rows.map((r, ri) => new TableRow({ children: r.map((v, i) => cell(v, ws[i], { fill: opts.zebra && ri % 2 ? C.soft : undefined, size: opts.size || 18, bold: opts.boldFirst && i === 0 })) }));
  return new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: ws, rows: [head, ...body], borders: allBorders() });
}
function allBorders() { const b = { style: BorderStyle.SINGLE, size: 4, color: C.line }; return { top: b, bottom: b, left: b, right: b, insideHorizontal: b, insideVertical: b }; }
function kvTable(pairs, wk = 0.28) { const ws = [Math.round(CONTENT_W * wk), 0]; ws[1] = CONTENT_W - ws[0]; return new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: ws, borders: allBorders(), rows: pairs.map(([k, v]) => new TableRow({ children: [cell(k, ws[0], { fill: C.soft, bold: true, size: 18 }), cell(v, ws[1], { size: 18 })] })) }); }
function spacer(n = 120) { return new Paragraph({ children: [new TextRun('')], spacing: { after: n } }); }

function buildDoc(sections, meta) {
  return new Document({
    creator: meta.autor, title: meta.titulo, description: meta.descripcion,
    styles: {
      default: { document: { run: { font: FONT, size: 21, color: C.ink } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 34, bold: true, color: C.accent, font: FONT }, paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 26, bold: true, color: C.ink, font: FONT }, paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 1 } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 22, bold: true, color: C.ink2, font: FONT }, paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } },
      ],
    },
    numbering: { config: [
      { reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] },
      { reference: 'num', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] },
    ] },
    features: { updateFields: true },
    sections: sections.map(s => {
      const plain = !Array.isArray(s) && s.plain; const children = Array.isArray(s) ? s : s.children;
      const sec = { properties: { page: { size: { width: PAGE_W, height: 16838 }, margin: { top: 1418, bottom: 1247, left: MARG, right: MARG } } }, children };
      if (!plain) {
        sec.headers = { default: new Header({ children: [new Paragraph({ children: [new TextRun({ text: meta.encabezado, size: 16, color: C.ink3 }), new TextRun({ children: [new PositionalTab({ alignment: PositionalTabAlignment.RIGHT, relativeTo: docx.PositionalTabRelativeTo.MARGIN, leader: PositionalTabLeader.NONE }), meta.version], size: 16, color: C.ink3 })], border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.line, space: 4 } } })] }) };
        sec.footers = { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: meta.pie + ' · página ', size: 16, color: C.ink3 }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: C.ink3 }), new TextRun({ text: ' de ', size: 16, color: C.ink3 }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: C.ink3 })] })] }) };
      } else {
        sec.headers = { default: new Header({ children: [new Paragraph({ children: [] })] }) };
        sec.footers = { default: new Footer({ children: [new Paragraph({ children: [] })] }) };
      }
      return sec;
    }),
  });
}
/* aplana arrays anidados de párrafos / tablas */
function flat(...xs) { return xs.flat(Infinity).filter(Boolean); }
/* portada */
function cover(meta) {
  const big = (t, size, color, after = 120, bold = false) => new Paragraph({ children: [new TextRun({ text: t, size, color, bold })], spacing: { after } });
  return [
    spacer(2400),
    new Paragraph({ children: [new TextRun({ text: meta.org, size: 24, color: C.brand, bold: true })], spacing: { after: 240 }, border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: C.brand, space: 6 } } }),
    spacer(480),
    big(meta.titulo, 56, C.accent, 200, true),
    big(meta.subtitulo, 30, C.ink2, 120),
    big(meta.version + ' · ' + meta.fecha, 24, C.ink3, 1200),
    ...meta.lineas.map(l => big(l, 20, C.ink2, 60)),
  ];
}
module.exports = { docx, Packer, Paragraph, TextRun, TableOfContents, AlignmentType, HeadingLevel, BorderStyle, C, CONTENT_W, runs, h1, h1n, h2, h3, p, note, ul, ol, pb, table, kvTable, spacer, buildDoc, flat, cover };
