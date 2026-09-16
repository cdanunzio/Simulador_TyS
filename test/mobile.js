const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 400, height: 800 } });
 await p.goto('file://' + path.resolve('dist/TyS - Maqueta ERP v2.0 - Orden de servicio.html')); await p.waitForSelector('#main .page-h');
 const wide = await p.evaluate(() => [...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > 402).slice(0, 12).map(e => e.tagName + '.' + e.className + ' right=' + Math.round(e.getBoundingClientRect().right) + ' w=' + Math.round(e.getBoundingClientRect().width)));
 console.log(wide.join('\n')); await b.close(); })();
