const fs=require('fs');
module.exports = {
  init: fs.readFileSync(__dirname+'/seed.js','utf8')+';try{sessionStorage.setItem("jv.boot","1")}catch(e){};window.addEventListener("DOMContentLoaded",()=>window.__seed());',
  async run({ page, shot, check }) {
    await page.goto('http://localhost:8790/'); await page.waitForTimeout(1000);
    await page.click('.door[data-fmt="B"]'); await page.waitForTimeout(700);
    await page.setInputFiles('#matFile', [__dirname + '/files/voce.mp3', __dirname + '/files/clipA.mp4', __dirname + '/files/clipB.mp4', __dirname + '/files/burger.png']);
    await page.waitForFunction(() => document.querySelectorAll('.mat').length === 4 && ![...document.querySelectorAll('.mat .nm')].some(n => /carico/.test(n.textContent)), null, { timeout: 15000 });
    await page.click('#toEditor'); await page.waitForTimeout(900);
    await page.click('#aiBuild');
    const curOn0 = await page.waitForFunction(() => +getComputedStyle(document.getElementById('aiCursor')).opacity > 0.5, null, { timeout: 8000 }).then(() => true).catch(() => false);
    await shot('jarvis-live');
    check(curOn0, 'Jarvis cursor visible while editing');
    await page.waitForFunction(() => document.getElementById('aiStop').hidden, null, { timeout: 30000 });
    await page.waitForTimeout(400);
    const tracks = await page.evaluate(() => [...document.querySelectorAll('.clip')].map(d => d.parentElement.dataset.track));
    check(tracks.filter(t => t === 'V1').length === 3, 'Jarvis placed 3 visuals on V1 (' + tracks.join(',') + ')');
    check(tracks.includes('A1') && tracks.includes('V2'), 'voice and text/zoom placed'); check(tracks.filter(t => t === 'A2').length === 3, 'sound effects placed on A2');
    const logN = await page.$$eval('#aiLog .l', a => a.length); check(logN >= 6, 'live log written (' + logN + ')');
    await shot('jarvis-done');
    // one undo reverts the whole build
    await page.click('#undoBtn'); await page.waitForTimeout(300);
    check((await page.$$eval('.clip', a => a.length)) === 0, 'one undo reverts Jarvis build');
    await page.click('#redoBtn'); await page.waitForTimeout(300);
    // command
    await page.fill('#aiIn', 'aggiungi uno zoom'); await page.click('#aiSend');
    await page.waitForFunction(() => document.getElementById('aiStop').hidden && !document.getElementById('aiSend').disabled, null, { timeout: 30000 });
    // live ops from a Claude session
    const pid = await page.evaluate(() => [...window.__mockStore.keys()].find(k => k.endsWith('/state/edit')).split('/')[1]);
    const before = await page.$$eval('.clip', a => a.length);
    await page.evaluate((pid) => window.claude.use('db').then(db => db.doc('projects/' + pid + '/state/live').set({ message: 'Aggiungo il titolo finale', ops: [{ n: 1, op: 'add_text', text: 'Commenta CLAUDE', style: 'title', start: 1, dur: 2, color: 'orange' }, { n: 2, op: 'add_zoom', start: 2, dur: 0.5, scale: 1.2 }] })), pid);
    await page.waitForTimeout(3500);
    const after = await page.$$eval('.clip', a => a.length); check(after === before + 2, 'session ops applied live (' + before + '→' + after + ')');
    const ap = await page.evaluate((pid) => window.__mockStore.get('projects/' + pid + '/state/live').applied, pid); check(ap === 2, 'applied marker saved (' + ap + ')');
    await page.reload(); await page.waitForTimeout(1200); await page.click('#mTabs [data-room="editor"]'); await page.waitForTimeout(2500);
    { const nn = await page.$$eval('.clip', a => a.length); const sv = await page.evaluate((pid) => (window.__mockStore.get('projects/' + pid + '/state/edit') || {}).clips.length, pid); check(nn === after, 'session ops not re-applied after reload (' + after + ' → ' + nn + ', saved ' + sv + ')'); }
  }
};
