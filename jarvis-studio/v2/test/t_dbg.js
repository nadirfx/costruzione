const fs=require('fs');
module.exports = { init: fs.readFileSync(__dirname+'/seed.js','utf8')+';window.addEventListener("DOMContentLoaded",()=>window.__seed());',
 async run({ page }) { await page.goto('http://localhost:8790/'); await page.waitForTimeout(3500);
  console.log(await page.$$eval('.nodeLbl', a => a.map(x => [x.textContent, x.style.display, x.style.left, x.style.top, x.style.opacity, getComputedStyle(x).backgroundColor])));
  const px = await page.evaluate(() => { const c = document.getElementById('core'); const g = c.getContext('webgl2') || c.getContext('webgl'); return null; });
  await page.screenshot({ path: __dirname + '/shots/dbg.png', clip: { x: 340, y: 80, width: 200, height: 100 } });
 } };
