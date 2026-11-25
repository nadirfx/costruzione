const fs = require('fs');
module.exports = {
  init: fs.readFileSync(__dirname + '/seed.js', 'utf8') + ';try{sessionStorage.setItem("jv.boot","1")}catch(e){};window.addEventListener("DOMContentLoaded",()=>window.__seed());',
  async run({ page, shot, check }) {
    await page.goto('http://localhost:8790/'); await page.waitForTimeout(1000);
    await page.click('.door[data-fmt="B"]'); await page.waitForTimeout(700);
    // chat: rate limited
    await page.evaluate(() => window.__failSample = 'rate_limited');
    await page.fill('#chatIn', 'Video su Google'); await page.click('#chatSend'); await page.waitForTimeout(800);
    const chat = await page.textContent('#chatLog'); check(/richieste|riprova/i.test(chat), 'chat explains rate limit');
    check(!(await page.$eval('#chatSend', b => b.disabled)), 'chat usable again after an error');
    await page.evaluate(() => window.__failSample = null);
    await page.setInputFiles('#matFile', [__dirname + '/files/voce.mp3', __dirname + '/files/clipA.mp4']);
    await page.waitForFunction(() => document.querySelectorAll('.mat').length === 2 && ![...document.querySelectorAll('.mat .nm')].some(n => /carico/.test(n.textContent)), null, { timeout: 20000 });
    await page.click('#toEditor'); await page.waitForTimeout(900);
    // Jarvis build: not granted
    await page.evaluate(() => window.__failSample = 'not_granted'); await page.click('#aiBuild'); await page.waitForTimeout(1200);
    check(/consenti|accesso/i.test(await page.textContent('#aiLog')), 'Jarvis explains missing consent'); check(!(await page.$eval('#aiBuild', b => b.disabled)), 'Jarvis button usable again');
    await page.evaluate(() => window.__failSample = null);
    // a write that fails
    await page.evaluate(() => window.__failWrite = 'permission_denied');
    await page.click('#libBody .libItem >> nth=1 >> button'); await page.waitForTimeout(1600);
    check(/Non salvato/.test(await page.textContent('#saveState')), 'failed save shows "Non salvato"');
    const t = await page.textContent('#toast'); check(t.length > 5, 'failed save explains why (' + t.slice(0, 60) + ')');
    await page.evaluate(() => window.__failWrite = null);
    await page.click('#libBody .libItem >> nth=0 >> button'); await page.waitForTimeout(1600);
    check(/Salvato/.test(await page.textContent('#saveState')), 'saving recovers once writes work again');
    // live ops: one bad op does not stop the others
    const pid = await page.evaluate(() => [...window.__mockStore.keys()].find(k => k.endsWith('/state/edit')).split('/')[1]);
    const before = await page.$$eval('.clip', a => a.length);
    await page.evaluate((pid) => window.claude.use('db').then(db => db.doc('projects/' + pid + '/state/live').set({ message: 'Test', ops: [{ n: 1, op: 'add_clip', mat: 'non-esiste', track: 'V1', start: 0, dur: 1 }, { n: 2, op: 'boh' }, { n: 3, op: 'add_text', text: 'OK', start: 0, dur: 1 }] })), pid);
    await page.waitForTimeout(3500);
    check((await page.$$eval('.clip', a => a.length)) === before + 1, 'bad live ops skipped, good one applied');
    check(/saltata/.test(await page.textContent('#aiLog')), 'skipped ops are reported in the log');
    // live ops while the editor is closed
    await page.click('#tabs button[data-room="hub"]'); await page.waitForTimeout(800);
    await page.evaluate((pid) => window.claude.use('db').then(db => db.doc('projects/' + pid + '/state/live').update({ ops: [{ n: 4, op: 'add_zoom', start: 1, dur: .5, scale: 1.2 }] })), pid);
    await page.waitForTimeout(1200);
    check(/pronte|apri/i.test(await page.textContent('#feed')), 'hub feed says changes are waiting');
    await page.click('#tabs button[data-room="editor"]'); await page.waitForTimeout(3000);
    check((await page.$$eval('.clip', a => a.length)) === before + 2, 'waiting ops applied when the editor opens');
    await shot('errors');
  }
};
