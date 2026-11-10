// Uso: node render.cjs <outDir> [fps] [workers] [soloTempi...]
// Renderizza scene.html fotogramma per fotogramma in JPEG.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const outDir = path.resolve(process.argv[2] || 'frames');
  const tl = JSON.parse(fs.readFileSync(path.join(__dirname, 'timeline.json'), 'utf8'));
  const fps = Number(process.argv[3] || tl.fps);
  const workers = Number(process.argv[4] || 4);
  const only = process.argv.slice(5).map(Number);
  fs.mkdirSync(outDir, { recursive: true });

  const total = Math.round(tl.duration * fps);
  const jobs = only.length ? only.map(s => ({ t: s, name: `t_${s.toFixed(2)}.jpg` }))
    : Array.from({ length: total }, (_, i) => ({ t: i / fps, name: `${String(i).padStart(5, '0')}.jpg` }));

  const browser = await chromium.launch();
  const url = 'file://' + path.join(__dirname, 'scene.html');
  let next = 0, done = 0;
  const t0 = Date.now();
  await Promise.all(Array.from({ length: workers }, async () => {
    const page = await browser.newPage();
    await page.addInitScript(tl => { window.TL = tl; }, tl);
    await page.goto(url);
    await page.evaluate(() => window.ready);
    while (next < jobs.length) {
      const j = jobs[next++];
      const data = await page.evaluate(t => { window.render(t); return document.getElementById('c').toDataURL('image/jpeg', 0.95); }, j.t);
      fs.writeFileSync(path.join(outDir, j.name), Buffer.from(data.split(',')[1], 'base64'));
      if (++done % 60 === 0) console.log(`${done}/${jobs.length}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
    await page.close();
  }));
  await browser.close();
  console.log(`fatto: ${jobs.length} fotogrammi in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
})();
