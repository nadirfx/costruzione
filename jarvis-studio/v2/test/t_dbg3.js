const fs=require('fs');
module.exports = { init: fs.readFileSync(__dirname+'/seed.js','utf8')+';window.__noBloom=true;window.addEventListener("DOMContentLoaded",()=>window.__seed());',
 async run({ page }) { await page.goto('http://localhost:8790/'); await page.waitForTimeout(3000);
  const n = await page.evaluate(() => window.__jvScene.children.map(c => c.type + ':' + c.children.length));
  console.log(n);
  for (let i = 0; i < n.length; i++) {
    await page.evaluate((i) => { window.__jvScene.children.forEach((c, j) => c.visible = j === i); }, i);
    await page.waitForTimeout(300);
    await page.screenshot({ path: __dirname + '/shots/dbg3_' + i + '.png', clip: { x: 340, y: 80, width: 200, height: 100 } });
  }
  await page.evaluate(() => { window.__jvScene.children.forEach(c => c.visible = false); }); await page.waitForTimeout(300);
  await page.screenshot({ path: __dirname + '/shots/dbg3_none.png', clip: { x: 340, y: 80, width: 200, height: 100 } });
 } };
