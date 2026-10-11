'use strict';
// Crea dist/gestionale-personale.html: un unico file con CSS e JS incorporati.
// Si apre con un doppio clic, senza server né connessione.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const css = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
html = html.replace('<link rel="stylesheet" href="css/style.css">', () => `<style>\n${css}\n</style>`);

html = html.replace(/<script src="(js\/[^"]+)"><\/script>/g, (_, rel) => {
  const code = fs.readFileSync(path.join(root, rel), 'utf8');
  if (code.includes('</script')) throw new Error(`${rel} contiene "</script": non incorporabile`);
  return `<script>\n/* ${rel} */\n${code}\n</script>`;
});

const out = path.join(root, 'dist', 'gestionale-personale.html');
fs.writeFileSync(out, html, 'utf8');
console.log(`Creato ${path.relative(root, out)} (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB)`);
