const fs=require('fs');
module.exports = {
  init: fs.readFileSync(__dirname+'/seed.js','utf8')+';try{sessionStorage.setItem("jv.boot","1")}catch(e){};window.addEventListener("DOMContentLoaded",()=>window.__seed());',
  async run({ page, shot, check, mode }) {
    await page.goto('http://localhost:8790/'); await page.waitForTimeout(2500);
    await shot('studio');
    for (const r of ['prod','machine','lib']) { await page.click('#nav [data-room="'+r+'"]'); await page.waitForTimeout(900); await shot(r); }
    await page.click('#nav [data-room="studio"]'); await page.waitForTimeout(600);
    await page.click('.nodeLbl >> nth=1', { force: true }); await page.waitForTimeout(900); await shot('drawer');
    await page.click('#drwClose'); await page.waitForTimeout(400);
    await page.click('.mission >> nth=0'); await page.waitForTimeout(1200); await shot('mission-open');
    await page.click('[data-room="script"]'); await page.waitForTimeout(900); await shot('script');
    await page.click('[data-room="editor"]'); await page.waitForTimeout(1200); await shot('editor');
    await page.click('#jvOrb'); await page.waitForTimeout(600); await shot('assistant');
    check(true,'smoke');
  }
};
