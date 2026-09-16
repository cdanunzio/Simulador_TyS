# FD v2.0 — Diseño Funcional derivado de la maqueta v2.9.1 (16/09/2026)

**Entregable:** `TyS - Diseño Funcional v2.0.docx` (Word, A4, 57 páginas; índice automático que se completa al abrir en Word con "Actualizar campos" o F9). Autor: Cristian D'Annunzio. Reemplaza al FD v1.1 como fuente de verdad funcional; la maqueta v2.9.1 sigue siendo la fuente de verdad del comportamiento y el FD la describe.

**Cómo se genera (reproducible desde el repositorio de la maqueta, carpeta `tools/fd/`):**

1. `bash build.sh` (maqueta compilada en `dist/`).
2. `node tools/fd/extract.js` → `tools/fd/data.json`: abre la maqueta con Playwright y vuelca 39 claves (entidades, BU, departamentos, relaciones, roles con permisos, permisos por maestro, servicios, medios, matriz, estados, transiciones, módulos y sus tres matrices, parámetros, motivos, causas de demora, tolerancias, fichas de los 39 maestros, orden de carga, auditoría, ciclo, supuestos, casos, lugares, maquinarias, camiones, recursos, órdenes del escenario, métodos seguros).
3. `node tools/fd/build-fd.js` → `.docx` con la librería `docx` (helpers en `lib.js`; contenido en `content-1/2/3.js`; el modelo v3.1 —convenciones, definiciones, decisiones, TX y EV— se lee de `src/03b-model.js`).

Toda tabla del documento sale de los datos de la maqueta; el texto explicativo consolida la especificación base (`maqueta-v2-orden-de-servicio-spec.md`, revisiones 1–21) y la nota de construcción. Cuando la maqueta cambie, se regenera el FD y solo hay que retocar la prosa afectada.

## Estructura del documento

| Bloque | Capítulos |
|---|---|
| Portada, control de versiones (v1.0 → v1.1 → v2.0), índice | — |
| Estructura | 1 Introducción (propósito, alcance, fuentes, cómo leer) · 2 Estructura organizativa (niveles, 3 entidades, 12 BU con CC y menú deshabilitado, 10 departamentos, relaciones interna / grupo / externa, conversión BU → entidad) · 3 Roles y contexto (6 roles, resumen de permisos MD) · 4 Catálogo de servicios (atributos, 10 servicios, 6 medios y orígenes, matriz de ejecución, Rental y Logística, 10 lugares) · 5 La orden de servicio (concepto, expediente de 9 secciones, toneladas y ventana, condiciones) |
| Comportamiento | 6 Proceso de punta a punta (Etapas 1–4 con objetivo, reglas, validaciones y acción; Logística de arribo; Máster data) · 7 Estados, transiciones, devolver y anular (7 estados, 10 transiciones, 4 devoluciones, listas de motivos) · 8 Reglas y parámetros (10 parámetros, 8 tolerancias, 10 causas de demora, 13 métodos seguros, reglas del circuito) |
| Configuración | 9 Master data (modelo v3.1, 10 dominios, atributos que usa el motor, auditoría y ciclo de vida, permisos por maestro, ABM genérico / validación / baja lógica, listas del modelo administrables, orden de carga, 18 definiciones y 18 decisiones) · 10 Módulos, pantallas y navegación (11 módulos, habilitación por rol / entidad / BU con valores iniciales, pantallas, responsive) · 11 Costos, cargos y comparativas · 12 Transacciones, eventos e integraciones (21 EV, 52 TX, eventos propios del circuito, integraciones previstas) |
| Verificación | 13 Escenario de demostración (11 órdenes, recursos) · 14 Casos de aceptación (19 casos con rol, pasos y resultado esperado = base del UAT) · 15 Supuestos S1–S22 y A1–A5 (tabla completa) · 16 Definiciones pendientes (22) + A1–A5 + primer alcance |
| Anexos | A matriz de permisos 39 maestros × 6 roles · B módulos por rol / entidad / BU · C catálogo de 39 maestros · D glosario · E documentos previos afectados |

## Pendientes acordados

- Excel de master data v2.0 derivado de `03b-model.js` + `03c-seed-ext.js` (misma fuente que el FD).
- Validar con el grupo los supuestos S1–S22 / A1–A5; cada cambio se traduce en configuración o regla de la maqueta y se regenera el FD.
