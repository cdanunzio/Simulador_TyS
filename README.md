# TyS · Maqueta ERP v2 — Orden de servicio (código fuente)

Maqueta navegable del circuito de la orden de servicio de TyS (Comercial → Planificador → Operaciones → Depósito), con Logística de arribo, Máster data, permisos por maestro y por módulo, y el modelo de master data v3.1 completo. Archivo único HTML + CSS + JS sin dependencias (solo la tipografía IBM Plex desde Google Fonts, con fallback). Versión actual: **v2.14** (`const VERSION` en `src/04-engine.js`).

## Cómo se arma

```bash
npm run build          # = bash build.sh → dist/artifact.html, dist/Maqueta ERP v2.14 - Orden de servicio.html y public/index.html
npm run test:setup     # una vez: instala Playwright + Chromium para las pruebas
npm test               # = node test/walk.js → recorrido automatizado de los 29 casos (≈322 comprobaciones)
npm start              # sirve public/ en http://localhost:3000 para probar el build
```

No hay dependencias de producción: `package.json` solo define los scripts. `public/index.html` es la salida que publica Vercel; `dist/` y `public/` no se versionan (se regeneran en cada build).

`build.sh` hace `node --check` de cada archivo y concatena `src/` en orden. No hay bundler ni dependencias de build: cualquier editor sirve. Para probar sin compilar se puede editar el archivo único de `dist/` directamente (todo el código está dentro del `<script>` final), pero los cambios deben pasarse a `src/` para que el próximo build no los pierda.

## Estructura de `src/` (se concatenan en este orden)

| Archivo | Contenido | Cuándo tocarlo |
|---|---|---|
| `01-head.html` | `<title>`, tipografías y todo el CSS (temas claro / oscuro con variables `--accent`, `--ok`, `--warn`, `--crit`…; responsive con tres cortes: escritorio > 1180 px, tablet ≤ 1180 px, móvil ≤ 860 px con menú en cajón lateral). | Estilos, colores, layout responsive. |
| `02-body.html` | Shell: barra superior (entidad / BU / rol), menú lateral `#nav`, `#main`, `#toasts`, `#modal-root`. | Casi nunca. |
| `03-data.js` | `MD_SEED` (datos maestros base: entidades, BU, departamentos, **áreas operativas**, roles, servicios, clientes, productos, instrumentos, recursos, estados, transiciones, matriz de ejecución, módulos y permisos por módulo (rol, entidad y BU), parámetros, motivos), `OPS_SEED` (lineups, cupos, trenes, solicitudes), `SUPUESTOS` (S1–S39, A1–A5) y `CASOS` (1–29). | Cambiar datos de demostración, agregar un supuesto o un caso guiado, ajustar la matriz de ejecución o los módulos por rol. |
| `03b-model.js` | Modelo de master data v3.1 extraído del Excel con `tools/extract_model.py` (`MODEL_FICHAS`, `MODEL_ATRIBUTOS`, reglas, TX/EV…). **No editar a mano**: regenerar con `python3 tools/extract_model.py "tools/<Excel v3.1>.xlsx" src/03b-model.js`. | Cuando cambie el Excel del modelo. |
| `03c-seed-ext.js` | `MD_EXT` (maestros M-35..M-38 y atributos ★ Maqueta) y `extendSeed()`: completa los registros con los atributos del modelo, siembra los maestros que no existían y arma `permisosMD` (matriz maestro × rol). | Agregar registros a un maestro, cambiar permisos iniciales por maestro. |
| `04-engine.js` | Motor: estado y persistencia (`localStorage`, clave `tys-maqueta-erp-v2`; un cambio de `VERSION` reinicia el estado), lookups, habilitaciones (nacionalización, método seguro M-34), workflow (`accionPrincipal`, `transition`, `devolver`, `anular`), bandejas, creación de órdenes, reservas y validaciones (`chequearRecurso`, `validarPlan`), recomendación (`recomendar`), ejecución (tickets, demoras, ABM de recursos), costos y comparativas, Logística de arribo, cambio de fecha de arribo, escenario inicial (`buildSeedOrders`), permisos y ABM genérico de master data (`permisoMD`, `mdCampos`, `guardarMD`, `validarMD`, `bajaMD`, `mdLog`), módulos por rol / entidad / BU (`moduloHabilitado`, `setModuloDim`), edición de toneladas / fechas (`editarDatosServicio`), nominación del lineup desde el operativo (`recalcularNominacion`) y áreas con capacidad y reservas (`recursosDeArea`, `crearReservaArea`, `aplicarReservas`, `revalidarReservaArea`). | Reglas de negocio. |
| `05-views-a.js` | Helpers de UI (`table`, `kv`, `btn`, `field`, `chip`…), Inicio, Logística de arribo, Workflow · mi etapa, Operaciones · órdenes, Expediente (9 secciones), registros en validación y registro de cambios. | Pantallas del circuito. |
| `05-views-b.js` | Planificador (`plannerForm`, `equiposBlock`, `noDisponiblesCard`), wizard de Nueva orden (`W`, `wInit`, `wSpec`, `viewNueva`, detalle de Rental / Logística `wDetalleCard`), Recursos, Depósito, Comparativas, Administración, Casos guiados, Supuestos. | Alta de orden, planificación, administración. |
| `05-views-c.js` | Datos maestros: `mdMap()` (atributo del modelo → cómo se ve cada registro, por maestro), navegador por dominio, pestañas del modelo, permisos por rol, barra de ABM. | Cómo se muestra cada maestro; nuevas columnas. |
| `06-app.js` | Router (`render`, `go`, `openOrden`), menú, toasts y modales, acciones (`onClick` con `data-action`), cambios (`onChange` con `data-w`, `data-pf`, `data-perm`, `data-mod`…), formularios modales (recursos, demoras, tickets, lineup, cupo, tren, instrumento, devolver / anular, ABM genérico `formMD`, toneladas y fechas `formDatosServicio`), `init()`. | Nuevas acciones o formularios. |

Convenciones: las acciones se declaran en el HTML con `data-action="..."` y se resuelven en el `switch` de `onClick`; los inputs enlazados usan `data-w` (wizard), `data-pf` (planificador), `data-cz` (cierre), `data-perm` (permisos por maestro), `data-mod` (módulos por rol), `data-det` (detalle de Rental / Logística). Las fechas del escenario son relativas al día de apertura (`iso(díaOffset, h, m)`, `isoDay(n)`), por eso la demo no envejece. Todo lo marcado con `sup('Sxx')` remite a un supuesto de `SUPUESTOS`.

## Otras carpetas

- `dist/` y `public/` — salidas del build, no versionadas (la página publicada en claude.ai usa `dist/artifact.html`; Vercel sirve `public/index.html`; el archivo único de `dist/` es el que se comparte por mail).
- `package.json`, `vercel.json`, `.github/workflows/ci.yml` — scripts, configuración del despliegue y pruebas automáticas en cada push.
- `test/walk.js` — recorrido automatizado (Playwright / Chromium) con ~305 comprobaciones, incluidas las de diseño móvil; `test/shots-*.js` generan capturas (`shots-mobile.js`: teléfono y tablet); los únicos errores de consola esperados son los de Google Fonts sin red.
- `tools/extract_model.py` — extractor del Excel del modelo v3.1 (openpyxl).
- `tools/fd/` — generador del **Diseño Funcional (Word, v2.1)** a partir de la maqueta: `node tools/fd/extract.js` (vuelca la configuración de la maqueta compilada a `data.json` con Playwright) y `node tools/fd/build-fd.js` (arma el `.docx` con la librería `docx`; `npm i -g docx` si no está). `data.json` y el `.docx` no se versionan.
- `docs/spec.md`, `docs/nota-construccion.md` y `docs/fd-nota.md` — especificación funcional, nota de construcción y nota del FD v2.0 (mismas versiones que en el proyecto de Claude).

## Publicar en GitHub

El repositorio ya está inicializado (rama `main`, commit inicial con todo el código). Para subirlo:

```bash
# 1) creá un repositorio vacío en GitHub (sin README ni .gitignore), por ejemplo m23/tys-maqueta-erp
# 2) desde esta carpeta:
git remote add origin https://github.com/<organización-o-usuario>/tys-maqueta-erp.git
git push -u origin main
```

Con GitHub CLI es un solo paso: `gh repo create tys-maqueta-erp --private --source=. --push`.

Cada push a `main` (y cada pull request) dispara el workflow `.github/workflows/ci.yml`: build, instalación de Chromium y recorrido automatizado de los casos; el archivo único queda descargable como artefacto del workflow. Conviene dejar el repositorio **privado**: la maqueta contiene datos de demostración del negocio.

## Desplegar en Vercel

La configuración ya está en `vercel.json` (sin framework, `bash build.sh` como build y `public/` como salida), así que no hay nada que ajustar en el panel.

1. En [vercel.com](https://vercel.com) → **Add New… → Project → Import Git Repository** y elegí el repositorio recién subido (autorizá la app de Vercel en GitHub si es la primera vez).
2. Vercel detecta `vercel.json`: Framework Preset *Other*, Build Command `bash build.sh`, Output Directory `public`, Install Command `echo 'sin dependencias'`. Dejá todo como está y **Deploy**.
3. En un minuto queda publicada en `https://<proyecto>.vercel.app`. A partir de ahí, **cada push a `main` redeploya producción** y cada pull request genera una URL de vista previa propia.

Sin GitHub también funciona: `npm i -g vercel && vercel --prod` desde esta carpeta (la primera vez pide iniciar sesión y confirmar el proyecto).

Notas de despliegue:

- Es un sitio estático de un solo archivo: no hay backend ni variables de entorno. El estado de la demo vive en el `localStorage` de cada navegador; el botón **Reiniciar demo** vuelve al escenario inicial y un cambio de `VERSION` en `src/04-engine.js` lo reinicia para todos los visitantes al desplegar.
- La URL pública queda accesible para cualquiera que la conozca. Si hace falta restringirla, en Vercel: **Settings → Deployment Protection** (Vercel Authentication o Password Protection, según el plan).
- La tipografía IBM Plex se carga desde Google Fonts; si el navegador no tiene salida a internet cae al tipo del sistema sin afectar la funcionalidad.
- La página publicada en claude.ai (artefacto) se genera del mismo `src/` con `dist/artifact.html`; ambas salidas son la misma versión.

## Flujo de una corrección

1. Editar en `src/` (datos en `03-data.js` / `03c-seed-ext.js`, reglas en `04-engine.js`, pantallas en `05-*.js`, acciones en `06-app.js`).
2. `npm run build` → abrir `public/index.html` (o `npm start`) en el navegador; si el estado guardado molesta: botón **Reiniciar demo** o subir `VERSION`.
3. `npm test` para verificar que los 19 casos siguen pasando.
4. `git commit` y `git push`: el CI de GitHub vuelve a correr las pruebas y Vercel redeploya producción.
