const fs=require('fs');
module.exports = {
  init: fs.readFileSync(__dirname+'/seed.js','utf8')+';try{sessionStorage.setItem("jv.boot","1")}catch(e){};window.addEventListener("DOMContentLoaded",()=>window.__seed());',
  async run({ page, shot, check }) {
    await page.goto('http://localhost:8790/#review'); await page.waitForTimeout(1500);
    await page.click('#mTabs [data-room="review"]'); await page.waitForTimeout(1200);
    const items = await page.$$eval('#revItems .mission', a => a.length); check(items === 2, 'two projects with versions listed (' + items + ')');
    await page.waitForFunction(() => document.getElementById('revVideo').readyState >= 1, null, { timeout: 10000 });
    await page.evaluate(() => { const v = document.getElementById('revVideo'); v.currentTime = 3.2; });
    await page.waitForTimeout(500);
    await page.fill('#noteIn', 'Il titolo entra troppo tardi'); await page.click('#noteAdd'); await page.waitForTimeout(700);
    check((await page.$$eval('#noteList .note', a => a.length)) === 1, 'note added');
    const tcx = await page.$eval('#noteList .note .chip', b => b.textContent); check(tcx === '00:03', 'note at 00:03 (' + tcx + ')');
    check((await page.$$eval('#revScrub i', a => a.length)) === 1, 'note marker on scrub bar');
    await page.click('#noteList .note button:has-text("Da fare")'); await page.waitForTimeout(400);
    check((await page.$$eval('#noteList .note.done', a => a.length)) === 1, 'note marked done');
    await page.click('#revActs button:has-text("Approva")'); await page.waitForTimeout(600);
    check(await page.$eval('#revSt .st', e => e.classList.contains('approvato')), 'status approved');
    await page.click('#revActs button:has-text("Esporta")'); await page.waitForTimeout(1500);
    const dl = await page.evaluate(() => window.__downloads.map(d => d.filename)); check(dl.length === 1 && /\.mp4$/.test(dl[0]), 'export download (' + dl.join(',') + ')');
    await shot('review');
    await page.click('#nav [data-room="lib"]'); await page.waitForTimeout(400);
    await page.click('#sfxList .sfx >> nth=0 >> button'); await page.waitForTimeout(500);
    await shot('lib');
    await page.click('#nav [data-room="studio"]'); await page.waitForTimeout(1200);
    const feedTxt = await page.textContent('#feed'); check(/Approvato|Nota/.test(feedTxt), 'hub feed shows recent activity');
    await shot('hub-after');
  }
};
