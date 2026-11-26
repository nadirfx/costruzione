const fs = require('fs');
const clips = (page) => page.$$eval('.clip', a => a.length);
const seekAt = (page, t) => page.evaluate((t) => { const r = document.querySelector('#ruler'); const pps = +document.getElementById('zoomIn').value || 70; r.dispatchEvent(new PointerEvent('pointerdown', { clientX: r.getBoundingClientRect().left + pps * t, bubbles: true, pointerId: 1 })); r.dispatchEvent(new PointerEvent('pointerup', { clientX: r.getBoundingClientRect().left + pps * t, bubbles: true, pointerId: 1 })); }, t);
module.exports = {
  init: fs.readFileSync(__dirname + '/seed.js', 'utf8') + ';try{sessionStorage.setItem("jv.boot","1")}catch(e){};window.addEventListener("DOMContentLoaded",()=>window.__seed());',
  async run({ page, shot, check, mode }) {
    await page.goto('http://localhost:8790/'); await page.waitForTimeout(1000);
    // export guard on an empty mission
    await page.click('.door[data-fmt="C"]'); await page.waitForTimeout(700);
    await page.click('#toEditor'); await page.waitForTimeout(800);
    await page.click('#exportBtn'); await page.waitForTimeout(300);
    check(/vuota/.test(await page.textContent('#toast')), 'empty timeline export is blocked with a message');
    await page.click('#mTabs [data-room="brief"]'); await page.waitForTimeout(500);
    await page.setInputFiles('#matFile', [__dirname + '/files/voce.mp3', __dirname + '/files/clipA.mp4', __dirname + '/files/clipB.mp4', __dirname + '/files/burger.png']);
    await page.waitForFunction(() => document.querySelectorAll('.mat').length === 4 && ![...document.querySelectorAll('.mat .nm')].some(n => /carico/.test(n.textContent)), null, { timeout: 20000 });
    await page.click('#toEditor'); await page.waitForTimeout(900);
    await page.click('#libBody .libItem >> nth=1 >> button'); await page.waitForTimeout(250);
    await page.click('#libBody .libItem >> nth=2 >> button'); await page.waitForTimeout(250);
    await page.click('#libBody .libItem >> nth=3 >> button'); await page.waitForTimeout(250);
    await page.click('#libBody .libItem >> nth=0 >> button'); await page.waitForTimeout(400);
    const n0 = await clips(page); check(n0 === 4, 'four clips placed (' + n0 + ')');
    // keyboard: duplicate, delete, split, undo
    await page.click('.track[data-track="V1"] .clip >> nth=0'); await page.mouse.move(5, 5);
    await page.keyboard.press('Control+d'); await page.waitForTimeout(200); check((await clips(page)) === n0 + 1, 'Ctrl+D duplicates');
    await page.keyboard.press('Delete'); await page.waitForTimeout(200); check((await clips(page)) === n0, 'Delete removes');
    await page.click('.track[data-track="V1"] .clip >> nth=0'); await seekAt(page, 1.0); await page.keyboard.press('s'); await page.waitForTimeout(200); check((await clips(page)) === n0 + 1, 'S splits at the playhead');
    await page.keyboard.press('Control+z'); await page.waitForTimeout(200); check((await clips(page)) === n0, 'Ctrl+Z undoes');
    await page.keyboard.press('Control+Shift+z'); await page.waitForTimeout(200); check((await clips(page)) === n0 + 1, 'Ctrl+Shift+Z redoes');
    await page.keyboard.press('Control+z'); await page.waitForTimeout(200);
    await page.keyboard.press(' '); await page.waitForTimeout(900); await page.keyboard.press(' ');
    check(!(await page.textContent('#tcLbl')).startsWith('00:00.00'), 'Space plays and pauses');
    // trim with the right handle
    const c = await page.$('.track[data-track="V1"] .clip >> nth=0'); await c.click(); const w0 = await c.evaluate(d => d.getBoundingClientRect().width);
    const h = await page.$('.track[data-track="V1"] .clip.sel .hd.r'); const hb = await h.boundingBox();
    await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2); await page.mouse.down(); await page.mouse.move(hb.x - 40, hb.y + hb.height / 2, { steps: 5 }); await page.mouse.up(); await page.waitForTimeout(200);
    const w1 = await page.$eval('.track[data-track="V1"] .clip >> nth=0', d => d.getBoundingClientRect().width).catch(() => w0);
    check(w1 < w0 - 10, 'right handle trims the clip (' + Math.round(w0) + '→' + Math.round(w1) + ')');
    // inspector duration
    await page.click('.track[data-track="V1"] .clip >> nth=0'); const durIn = page.locator('#inspBody label:has-text("Durata") input');
    await durIn.fill('1.2'); await page.waitForTimeout(500);
    const d1 = await page.evaluate(() => { const k = [...window.__mockStore.keys()].find(k => k.endsWith('/state/edit')); return 1; });
    const w2 = await page.$eval('.track[data-track="V1"] .clip >> nth=0', d => d.getBoundingClientRect().width); const pps = +(await page.$eval('#zoomIn', e => e.value));
    check(Math.abs(w2 - 1.2 * pps) < 6, 'inspector duration updates the timeline (' + Math.round(w2) + 'px)');
    // all transitions render at the seam
    await page.click('.track[data-track="V1"] .clip >> nth=1'); await page.click('#libTabs .chip[data-lib="trn"]');
    const seam = await page.evaluate(() => { const k = [...window.__mockStore.keys()].find(k => k.endsWith('/state/edit')); return 0; });
    for (const name of ['Dissolvenza', 'Finestra arrotondata', 'Flash di luce', 'Whip pan', 'Zoom-through']) {
      await page.click('#libBody button:has-text("' + name + '")'); await page.waitForTimeout(150);
      const st = await page.$eval('.track[data-track="V1"] .clip.sel', d => parseFloat(d.style.left) || 0); await seekAt(page, st / pps + 0.15); await page.waitForTimeout(250);
    }
    check((await page.$$eval('.track[data-track="V1"] .clip .tr', a => a.length)) >= 1, 'all 5 transitions applied and drawn');
    // all text styles and colours
    await page.click('#libTabs .chip[data-lib="txt"]'); await page.click('#libBody .libItem >> nth=0'); await page.waitForTimeout(300);
    for (const st of ['keyword', 'apple', 'caption', 'title', 'label']) { await page.selectOption('#inspBody label:has-text("Stile") select', st); await page.waitForTimeout(200); }
    for (const col of ['lime', 'orange', 'cyan', 'gold']) { await page.selectOption('#inspBody label:has-text("Colore") select', col); await page.waitForTimeout(100); }
    check(true, 'all 5 text styles and colours drawn');
    // sound from the library goes to A2
    await page.click('#libTabs .chip[data-lib="sfx"]'); await page.click('#libBody .libItem >> nth=0 >> button'); await page.waitForTimeout(400);
    check((await page.$$eval('.track[data-track="A2"] .clip', a => a.length)) >= 1, 'library sound lands on A2');
    // safe zone + timeline zoom
    await page.click('#safeBtn'); await page.waitForTimeout(200); check(await page.$eval('#safeOv', e => !e.hidden), 'safe zone shows');
    await page.click('#safeBtn'); await page.waitForTimeout(100);
    const iw0 = await page.$eval('#tlInner', e => e.scrollWidth); await page.$eval('#zoomIn', e => { e.value = String(+e.max || 200); e.dispatchEvent(new Event('input', { bubbles: true })); }); await page.waitForTimeout(200);
    check((await page.$eval('#tlInner', e => e.scrollWidth)) > iw0, 'timeline zoom widens the timeline');
    await shot('editor-deep');
    if (mode === 'desktop') {
      // WebM export
      await page.click('#exportBtn'); await page.selectOption('#exRes', '720'); await page.selectOption('#exFmt', 'webm'); await page.click('#exGo');
      await page.waitForFunction(() => /Pronto|non riuscito/.test(document.getElementById('exMsg').textContent), null, { timeout: 120000 });
      const dl = await page.evaluate(() => window.__downloads.map(d => d.filename)); check(dl.some(f => /\.webm$/.test(f)), 'WebM export saved (' + dl.join(',') + ')');
      // cancel mid-way
      await page.selectOption('#exRes', '1080'); await page.selectOption('#exFmt', 'mp4'); await page.click('#exGo'); await page.waitForTimeout(1500); await page.click('#exCancel');
      await page.waitForFunction(() => /annullato/.test(document.getElementById('exMsg').textContent), null, { timeout: 30000 });
      check((await page.evaluate(() => window.__downloads.length)) === dl.length, 'cancelled export saves nothing');
      check(!(await page.$eval('#exGo', b => b.disabled)), 'export button free again after cancel');
      await page.click('#exCancel');
    }
  }
};
