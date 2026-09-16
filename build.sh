#!/bin/bash
# Ensambla la maqueta a partir de src/ en tres salidas:
#  - dist/artifact.html : sin doctype/html/head/body (la publicación en claude.ai agrega el esqueleto)
#  - dist/TyS - Maqueta ERP v2.0 - Orden de servicio.html : documento completo, archivo único para compartir
#  - public/index.html : mismo documento completo, carpeta que publica Vercel (outputDirectory)
set -e
cd "$(dirname "$0")"
mkdir -p dist public
SRC=src
JS="$(cat $SRC/03-data.js; echo; cat $SRC/03b-model.js; echo; cat $SRC/03c-seed-ext.js; echo; cat $SRC/04-engine.js; echo; cat $SRC/05-views-a.js; echo; cat $SRC/05-views-b.js; echo; cat $SRC/05-views-c.js; echo; cat $SRC/06-app.js)"
for f in 03-data 03b-model 03c-seed-ext 04-engine 05-views-a 05-views-b 05-views-c 06-app; do node --check $SRC/$f.js || exit 1; done
{
  cat $SRC/01-head.html
  cat $SRC/02-body.html
  echo '<script>'
  echo "$JS"
  echo '</script>'
} > dist/artifact.html
{
  echo '<!doctype html>'
  echo '<html lang="es">'
  echo '<head>'
  echo '<meta charset="utf-8">'
  echo '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
  cat $SRC/01-head.html
  echo '</head>'
  echo '<body>'
  cat $SRC/02-body.html
  echo '<script>'
  echo "$JS"
  echo '</script>'
  echo '</body>'
  echo '</html>'
} > "dist/TyS - Maqueta ERP v2.0 - Orden de servicio.html"
cp "dist/TyS - Maqueta ERP v2.0 - Orden de servicio.html" public/index.html
wc -c dist/*.html public/index.html
