// Jarvis Studio test runner: node run.js <scenario.js> [desktop|phone|both]
// Serves ../app wrapped in the same skeleton the Artifact tool adds, injects the mock runtime,
// maps CDN imports to local copies, records every console error / page error / failed request.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const APP = path.join(__dirname, '..', 'app');
const NM = '/tmp/claude-0/-home-user-costruzione/f8f5e66a-bca6-52b8-a8d5-01ec917fceb6/scratchpad/t3d/node_modules/three';
const SKEL_HEAD = '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>';
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.wav': 'audio/wav' };
const server = http.createServer((req, res) => {
  let u = decodeURIComponent(req.url.split('?')[0]);
  if (u === '/' || u === '/index.html') { res.writeHead(200, { 'content-type': 'text/html' }); res.end(SKEL_HEAD + fs.readFileSync(path.join(APP, 'index.html'), 'utf8') + '</body></html>'); return; }
  if (u.startsWith('/_blob/')) { const f = path.join(__dirname, 'blobs', u.slice(7)); if (fs.existsSync(f)) { const b = fs.readFileSync(f); res.writeHead(200, { 'content-type': 'video/mp4', 'content-length': b.length, 'accept-ranges': 'bytes' }); res.end(b); } else { res.writeHead(404); res.end(); } return; }
  const f = path.join(APP, u); if (!f.startsWith(APP) || !fs.existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); res.end(fs.readFileSync(f));
});
(async () => {
  const scen = require(path.resolve(process.argv[2]));
  const modes = (process.argv[3] || 'desktop') === 'both' ? ['desktop', 'phone'] : [process.argv[3] || 'desktop'];
  await new Promise(r => server.listen(8790, r));
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  let failures = 0;
  for (const mode of modes) {
    const ctx = await browser.newContext(mode === 'phone' ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    await ctx.addInitScript({ path: path.join(__dirname, 'mock.js') });
    if (scen.init) await ctx.addInitScript(scen.init);
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    page.on('requestfailed', r => { const f=(r.failure()||{}).errorText||''; if (!r.url().startsWith('blob:') && !(r.url().includes('/_blob/') && f.includes('ERR_ABORTED'))) errors.push('requestfailed: ' + r.url() + ' ' + (r.failure() || {}).errorText); });
    await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**', route => { const rel = route.request().url().split('three@0.160.0/')[1]; const f = path.join(NM, rel); route.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(f) }); });
    await page.route('https://cdn.jsdelivr.net/npm/mp4-muxer@5.1.3/**', r => r.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(path.join(__dirname, 'vendor/mp4-muxer.js')) }));
    await page.route('https://cdn.jsdelivr.net/npm/webm-muxer@5.0.3/**', r => r.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(path.join(__dirname, 'vendor/webm-muxer.js')) }));
    await page.route('https://fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    const shot = async (name) => { await page.screenshot({ path: path.join(__dirname, 'shots', `${mode}-${name}.png`) }); };
    const check = (cond, msg) => { if (!cond) { failures++; console.log('  ✗ ' + msg); } else console.log('  ✓ ' + msg); };
    console.log(`== ${mode}`);
    try { await scen.run({ page, shot, check, mode }); }
    catch (e) { failures++; console.log('  ✗ scenario threw: ' + (e && e.stack || e)); await shot('crash').catch(() => {}); }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1).catch(() => false);
    if (overflow) { failures++; console.log('  ✗ horizontal page overflow'); }
    if (errors.length) { failures += errors.length; console.log('  ✗ errors:\n    ' + errors.slice(0, 20).join('\n    ')); } else console.log('  ✓ no console/page errors');
    await ctx.close();
  }
  await browser.close(); server.close();
  console.log(failures ? `FAILED (${failures})` : 'ALL PASSED');
  process.exit(failures ? 1 : 0);
})();
