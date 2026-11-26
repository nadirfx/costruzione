const fs=require('fs');
module.exports = {
  init: fs.readFileSync(__dirname+'/seed.js','utf8')+';try{sessionStorage.setItem("jv.boot","1")}catch(e){};window.addEventListener("DOMContentLoaded",()=>window.__seed());',
  async run({ page, shot, check }) {
    await page.goto('http://localhost:8790/'); await page.waitForTimeout(1200);
    await page.click('.door[data-fmt="B"]'); await page.waitForTimeout(800);
    check((await page.evaluate(() => location.hash)) === '#brief', 'in briefing');
    await page.fill('#chatIn', 'Video su Google che cancella le recensioni, 40 secondi'); await page.click('#chatSend');
    await page.waitForTimeout(300); await shot('brief-stream');
    await page.waitForFunction(() => !document.getElementById('chatSend').disabled, null, { timeout: 8000 });
    await page.waitForTimeout(900);
    const title = await page.inputValue('#bTitle'); check(title === 'Google cancella le recensioni', 'Jarvis filled title (' + title + ')');
    const hook = await page.inputValue('#bHook'); check(hook.length > 5, 'hook filled');
    const lastAi = await page.$$eval('.msg.ai', a => a[a.length - 1].textContent); check(!/BRIEF:/.test(lastAi), 'BRIEF line hidden from chat');
    await page.setInputFiles('#matFile', [__dirname + '/files/voce.mp3', __dirname + '/files/clipA.mp4', __dirname + '/files/clipB.mp4', __dirname + '/files/burger.png']);
    await page.waitForFunction(() => document.querySelectorAll('.mat').length === 4 && ![...document.querySelectorAll('.mat .nm')].some(n => /carico/.test(n.textContent)), null, { timeout: 15000 });
    await page.waitForTimeout(1200); await shot('brief-mats');
    const saved = await page.evaluate(() => { const k = [...window.__mockStore.keys()].find(k => k.endsWith('/state/edit')); return k ? window.__mockStore.get(k).materials.map(m => m.kind + ':' + m.role) : null; });
    check(saved && saved.length === 4, 'materials saved to db (' + JSON.stringify(saved) + ')');
    await page.click('.mat >> nth=2 >> button[aria-label="Sposta su"]'); await page.waitForTimeout(900);
    const order = await page.$$eval('.mat .nm', a => a.map(x => x.textContent)); check(/clipB/.test(order[1]), 'reorder works (' + order.join(',') + ')');
    const ok = await page.$$eval('#briefCheck li.ok', a => a.length); check(ok >= 4, 'checklist mostly satisfied (' + ok + ')');
    await page.reload(); await page.waitForTimeout(1500);
    await page.click('#mTabs [data-room="brief"]'); await page.waitForTimeout(900);
    const n2 = await page.$$eval('.mat', a => a.length); check(n2 === 4, 'materials persist after reload (' + n2 + ')');
    const msgs = await page.$$eval('.msg', a => a.length); check(msgs >= 3, 'chat persists after reload (' + msgs + ')');
    await shot('brief-reload');
    await page.click('#toEditor'); await page.waitForTimeout(600);
    check((await page.evaluate(() => location.hash)) === '#editor', 'enter editor');
  }
};
