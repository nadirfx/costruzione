const fs=require('fs');
module.exports = { init: fs.readFileSync(__dirname+'/seed.js','utf8')+';try{sessionStorage.setItem("jv.boot","1")}catch(e){};window.addEventListener("DOMContentLoaded",()=>window.__seed());',
 async run({ page, check }) { await page.goto('http://localhost:8790/'); await page.waitForTimeout(1000);
  await page.click('.door[data-fmt="B"]'); await page.waitForTimeout(700);
  await page.setInputFiles('#matFile', [__dirname + '/files/voce.mp3', __dirname + '/files/clipA.mp4']);
  await page.waitForFunction(() => document.querySelectorAll('.mat').length === 2 && ![...document.querySelectorAll('.mat .nm')].some(n => /carico|prepar/.test(n.textContent)), null, { timeout: 15000 });
  await page.click('#toEditor'); await page.waitForTimeout(900); await page.click('#aiBuild');
  const seen = []; for (let i = 0; i < 40; i++) { seen.push(await page.evaluate(() => document.getElementById('aiCursor').style.opacity + '/' + getComputedStyle(document.getElementById('aiCursor')).opacity + '/' + document.querySelectorAll('#aiLog .l').length)); await page.waitForTimeout(150); }
  console.log(seen.join(' '));
 } };
