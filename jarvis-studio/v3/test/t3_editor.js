const fs=require('fs');
module.exports = {
  init: fs.readFileSync(__dirname+'/seed.js','utf8')+';try{sessionStorage.setItem("jv.boot","1")}catch(e){};window.addEventListener("DOMContentLoaded",()=>window.__seed());',
  async run({ page, shot, check, mode }) {
    await page.goto('http://localhost:8790/'); await page.waitForTimeout(1000);
    await page.click('.door[data-fmt="B"]'); await page.waitForTimeout(700);
    await page.setInputFiles('#matFile', [__dirname + '/files/voce.mp3', __dirname + '/files/clipA.mp4', __dirname + '/files/clipB.mp4', __dirname + '/files/burger.png']);
    await page.waitForFunction(() => document.querySelectorAll('.mat').length === 4 && ![...document.querySelectorAll('.mat .nm')].some(n => /carico/.test(n.textContent)), null, { timeout: 15000 });
    await page.click('#toEditor'); await page.waitForTimeout(900);
    check((await page.evaluate(() => location.hash)) === '#editor', 'editor open');
    const libN = await page.$$eval('#libBody .libItem', a => a.length); check(libN === 4, 'library shows 4 materials (' + libN + ')');
    // add clipA at 0 and clipB right after via + buttons
    await page.click('#libBody .libItem >> nth=1 >> button'); await page.waitForTimeout(300);
    await page.click('#stepF'); for (let i = 0; i < 4; i++) await page.keyboard.press('Shift+ArrowRight');
    await page.click('#libBody .libItem >> nth=2 >> button'); await page.waitForTimeout(300);
    await page.click('#libBody .libItem >> nth=0 >> button'); await page.waitForTimeout(300);
    let clips = await page.evaluate(() => [...document.querySelectorAll('.clip')].map(d => d.parentElement.dataset.track));
    check(clips.filter(t => t === 'V1').length === 2 && clips.includes('A1'), 'clips on V1 and A1 (' + clips.join(',') + ')');
    // text
    await page.click('#libTabs .chip[data-lib="txt"]'); await page.click('#libBody .libItem >> nth=0'); await page.waitForTimeout(300);
    await page.fill('#inspBody textarea', 'Instagram chiude.'); await page.waitForTimeout(500);
    // transitions on selected V1 clip
    await page.click('.track[data-track="V1"] .clip >> nth=1'); await page.click('#libTabs .chip[data-lib="trn"]'); await page.click('#libBody button:has-text("Finestra arrotondata")'); await page.waitForTimeout(300);
    const tr = await page.$$eval('.track[data-track="V1"] .clip .tr', a => a.length); check(tr === 1, 'transition marker on clip');
    // seek into transition and check canvas has non-black pixels
    await page.evaluate(() => document.querySelector('#ruler').dispatchEvent(new PointerEvent('pointerdown', { clientX: document.querySelector('#ruler').getBoundingClientRect().left + 70 * 4.2, bubbles: true, pointerId: 1 })));
    await page.waitForTimeout(1200);
    const lit = await page.evaluate(() => { const c = document.getElementById('preview'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 400) if (d[i] + d[i + 1] + d[i + 2] > 60) n++; return n; });
    check(lit > 50, 'preview renders video frames (' + lit + ')');
    await shot('editor');
    // split + undo
    const before = await page.$$eval('.clip', a => a.length);
    await page.click('.track[data-track="V1"] .clip >> nth=0'); await page.evaluate(() => document.querySelector('#ruler').dispatchEvent(new PointerEvent('pointerdown', { clientX: document.querySelector('#ruler').getBoundingClientRect().left + 70 * 1.5, bubbles: true, pointerId: 1 })));
    await page.click('#splitBtn'); await page.waitForTimeout(200);
    const after = await page.$$eval('.clip', a => a.length); check(after === before + 1, 'split adds a clip');
    await page.click('#undoBtn'); await page.waitForTimeout(200);
    check((await page.$$eval('.clip', a => a.length)) === before, 'undo restores');
    await page.click('#redoBtn'); await page.waitForTimeout(200);
    check((await page.$$eval('.clip', a => a.length)) === before + 1, 'redo re-applies');
    // drag a clip
    await page.$eval('.track[data-track="V2"] .clip', d => d.scrollIntoView({ block: 'center' })); await page.waitForTimeout(200);
    const c0 = await page.$eval('.track[data-track="V2"] .clip', d => { const r = d.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, l: d.style.left }; });
    await page.mouse.move(c0.x, c0.y); await page.mouse.down(); await page.mouse.move(c0.x + 90, c0.y, { steps: 6 }); await page.mouse.up(); await page.waitForTimeout(200);
    const l2 = await page.$eval('.track[data-track="V2"] .clip', d => d.style.left); check(l2 !== c0.l, 'drag moves clip (' + c0.l + '→' + l2 + ')');
    // play 1.5s
    await page.click('#playBtn'); await page.waitForTimeout(1500); await page.click('#playBtn');
    const tcv = await page.textContent('#tcLbl'); check(!tcv.startsWith('00:00.00'), 'playback advances (' + tcv + ')');
    await page.waitForTimeout(1200);
    const saved = await page.evaluate(() => { const k = [...window.__mockStore.keys()].find(k => k.endsWith('/state/edit')); return window.__mockStore.get(k).clips.length; });
    check(saved >= 5, 'clips saved (' + saved + ')');
    await page.reload(); await page.waitForTimeout(1200); await page.click('#mTabs [data-room="editor"]'); await page.waitForTimeout(900);
    check((await page.$$eval('.clip', a => a.length)) === saved, 'timeline persists after reload');
    await shot('editor-reload');
  }
};
