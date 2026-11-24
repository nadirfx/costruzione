const fs=require('fs');
module.exports = { init: fs.readFileSync(__dirname+'/seed.js','utf8')+';window.__noBloom=true;window.addEventListener("DOMContentLoaded",()=>window.__seed());',
 async run({ page }) { await page.goto('http://localhost:8790/'); await page.waitForTimeout(3500); await page.screenshot({ path: __dirname + '/shots/dbg2.png', clip: { x: 340, y: 80, width: 200, height: 100 } }); } };
