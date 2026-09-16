#!/usr/bin/env python3
"""Extrae el modelo de master data v3.1 (Excel) a src/03b-model.js.
Contenido: fichas de entidades, atributos, auditoría y ciclo de vida, convenciones,
orden de carga, definiciones previas y decisiones, reglas por maestro, mapeo de fuentes,
cruce v2.2 → modelo, transacciones y eventos. Se agregan las extensiones de la maqueta v2
(M-35..M-38 y atributos ★ Maqueta) en 03-data.js, no acá.
"""
import json, sys, openpyxl

SRC = sys.argv[1]
OUT = sys.argv[2]
wb = openpyxl.load_workbook(SRC, data_only=True)

def s(v):
    if v is None: return ''
    return str(v).strip()

def rows(name, min_row=2):
    ws = wb[name]
    for row in ws.iter_rows(min_row=min_row, values_only=True):
        if not any(v not in (None, '') for v in row): continue
        yield [s(v) for v in row]

# 1 Fichas
fichas = []
for r in rows('1-Fichas de entidades'):
    if not r[0].startswith('M-'): continue
    fichas.append({ 'codigo': r[0], 'nombre': r[1], 'descripcion': r[2], 'dominio': r[3], 'nivel': int(r[4]) if r[4].isdigit() else r[4],
        'clave': r[5], 'depende': r[6], 'existeHoy': r[7], 'fuenteCarga': r[8], 'administra': r[9], 'autoriza': r[10], 'equivV22': r[11],
        'transacciones': r[12], 'nAtributos': int(r[13]) if r[13].isdigit() else r[13], 'comentario': r[15] })

# 2 Atributos
atributos = []
for r in rows('2-Atributos'):
    if not r[0].startswith('M-'): continue
    nombre = r[3]; star = nombre.endswith('★')
    atributos.append({ 'm': r[0], 'n': int(r[2]) if r[2].isdigit() else r[2], 'atributo': nombre.replace(' ★', '').replace('★', '').strip(), 'star': star,
        'tipo': r[4], 'obligatorio': r[5], 'dominio': r[6], 'parametro': r[7], 'regla': r[8], 'origen': r[9], 'caracter': r[10], 'equivV22': r[11], 'revision': r[12] })

# 3 Auditoría y ciclo de vida
auditoria = []; ciclo = []
sec = 'aud'
for r in rows('3-Auditoría y ciclo de vida', 1):
    if r[0] == 'Atributo': continue
    if r[0].startswith('Ciclo de vida'): sec = 'ciclo'; continue
    if r[0] == 'Estado' and sec == 'ciclo': continue
    if sec == 'aud': auditoria.append({ 'atributo': r[0], 'tipo': r[1], 'obligatorio': r[2], 'dominio': r[3], 'regla': r[4] })
    else: ciclo.append({ 'estado': r[0], 'quePasa': r[1], 'regla': r[2] })

# 4 Convenciones
convenciones = [{ 'codigo': r[0], 'nombre': r[1], 'exige': r[2] } for r in rows('4-Convenciones') if r[0].startswith('CV-')]

# 5 Orden de carga
orden = [{ 'nivel': int(r[0]), 'maestros': r[1], 'queSeHace': r[2], 'esfuerzo': r[3] } for r in rows('5-Orden de carga') if r[0].isdigit()]

# 6 Definiciones previas + decisiones
definiciones = []; decisiones = []
for r in rows('6-Definiciones previas'):
    if r[0].startswith('Nº'): definiciones.append({ 'n': r[0], 'definicion': r[1], 'responsable': r[2], 'bloquea': r[3], 'queDefinir': r[4] })
    elif r[0].startswith('D-'): decisiones.append({ 'codigo': r[0], 'maestro': r[1], 'decision': r[2], 'opciones': r[3], 'recomendacion': r[4], 'impacto': r[5], 'estado': r[6] })

# 7 Reglas
reglas = []
for r in rows('7-Reglas por maestro'):
    if r[0] == 'Maestro': continue
    reglas.append({ 'maestro': r[0], 'tipo': r[1], 'codigo': r[2], 'nombre': r[3], 'controla': r[4], 'cuando': r[5], 'consecuencia': r[6], 'parametro': r[7], 'tx': r[8] })

# 8 Mapeo de fuentes
mapeo = []
for r in rows('8-Mapeo de fuentes'):
    if r[0] == 'Maestro': continue
    mapeo.append({ 'maestro': r[0], 'atributo': r[1], 'fuente1': r[2], 'campo1': r[3], 'fuente2': r[4], 'campo2': r[5], 'regla': r[6] })

# 0 Cruce
cruce = []
for r in rows('0-Cruce v2.2 → Modelo'):
    if r[0].startswith('MD-') or (r[0] == '—' and r[3].startswith('M-')):
        cruce.append({ 'v22': r[0], 'nombreV22': r[1], 'nivelV22': r[2], 'modelo': r[3], 'nombreModelo': r[4], 'quePaso': r[5] })

# TX y EV
tx = []; ev = []
sec = 'tx'
for r in rows('TX y EV', 1):
    if r[0] == 'Eventos': sec = 'ev'; continue
    if r[0] in ('Código', 'EV') or r[0].startswith('Catálogo'): continue
    if sec == 'tx' and r[0].startswith('TX-'): tx.append({ 'codigo': r[0], 'etapa': r[1], 'transaccion': r[2], 'maestros': r[3], 'evento': r[4] })
    elif sec == 'ev' and r[0].startswith('EV'): ev.append({ 'codigo': r[0], 'etapa': r[1], 'nombre': r[2], 'dispara': r[3] })

# el dominio 2.8 aparece con dos nombres en el Excel (v3.0 y v3.1): se unifica
for f in fichas:
    if f['dominio'] == '2.8 Planificación portuaria': f['dominio'] = '2.8 Planificación portuaria y de arribos'
dominios = []
for f in fichas:
    if f['dominio'] not in dominios: dominios.append(f['dominio'])
dominios.sort(key=lambda d: [int(x) for x in d.split(' ')[0].split('.')])

def js(name, obj):
    return 'const ' + name + ' = ' + json.dumps(obj, ensure_ascii=False, indent=None, separators=(',', ':')) + ';\n'

out = '/* =====================================================================\n'
out += '   MODELO DE MASTER DATA v3.1 (15/09/2026) — extraído del Excel\n'
out += '   "TyS Circuito Detalle de Construccion Master Data v3.1.xlsx" con tools/extract_model.py.\n'
out += '   No editar a mano: regenerar desde el Excel. Las extensiones de la maqueta (M-35..M-38,\n'
out += '   atributos ★ Maqueta) se agregan en 03-data.js (MD_EXT).\n'
out += '   ===================================================================== */\n'
out += js('MODEL_FICHAS', fichas)
out += js('MODEL_ATRIBUTOS', atributos)
out += js('MODEL_AUDITORIA', auditoria)
out += js('MODEL_CICLO', ciclo)
out += js('MODEL_CONVENCIONES', convenciones)
out += js('MODEL_ORDEN_CARGA', orden)
out += js('MODEL_DEFINICIONES', definiciones)
out += js('MODEL_DECISIONES', decisiones)
out += js('MODEL_REGLAS', reglas)
out += js('MODEL_MAPEO', mapeo)
out += js('MODEL_CRUCE', cruce)
out += js('MODEL_TX', tx)
out += js('MODEL_EV', ev)
out += js('MODEL_DOMINIOS', dominios)
out += "const MODEL_META = { version: 'v3.1', fecha: '15/09/2026', archivo: 'TyS Circuito Detalle de Construccion Master Data v3.1.xlsx' };\n"
open(OUT, 'w', encoding='utf-8').write(out)
print('fichas', len(fichas), 'atributos', len(atributos), 'aud', len(auditoria), 'ciclo', len(ciclo), 'conv', len(convenciones), 'orden', len(orden), 'def', len(definiciones), 'dec', len(decisiones), 'reglas', len(reglas), 'mapeo', len(mapeo), 'cruce', len(cruce), 'tx', len(tx), 'ev', len(ev), 'dominios', len(dominios))
