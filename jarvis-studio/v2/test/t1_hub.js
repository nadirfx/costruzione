const fs=require('fs');
module.exports = {
  init: fs.readFileSync(__dirname+'/seed.js','utf8')+';window.addEventListener("DOMContentLoaded",()=>window.__seed());',
  async run({ page, shot, check, mode }) {
    await page.goto('http://localhost:8790/');
    await page.waitForTimeout(400); await shot('boot');
    await page.waitForSelector('#boot', { state: 'detached', timeout: 6000 });
    await page.waitForTimeout(1500);
    await shot('hub');
    const n = await page.$$eval('.mission', a => a.length); check(n === 3, 'mission list shows 3 missions (got ' + n + ')');
    const lbls = await page.$$eval('.nodeLbl', a => a.length); check(lbls === 3, '3D nodes labelled (got ' + lbls + ')');
    const canvasOk = await page.evaluate(() => { const c = document.getElementById('core'); return c.width > 10 && c.height > 10; }); check(canvasOk, 'core canvas sized');
    // drag the globe
    const box = await page.$eval('#core', c => { const r = c.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    await page.mouse.move(box.x, box.y); await page.mouse.down(); await page.mouse.move(box.x + 200, box.y + 40, { steps: 8 }); await page.mouse.up();
    await page.waitForTimeout(300); await shot('hub-drag');
    // open a mission from the list -> review
    await page.click('.mission >> nth=0'); await page.waitForTimeout(600);
    const room = await page.evaluate(() => location.hash); check(room === '#review', 'first mission opens review (got ' + room + ')');
    await shot('review');
    await page.click('#tabs button[data-room="lib"]'); await page.waitForTimeout(300); await shot('lib');
    check(await page.$$eval('.sfx', a => a.length) >= 10, 'sound library listed');
    await page.click('#tabs button[data-room="hub"]'); await page.waitForTimeout(300);
    // create mission B -> briefing
    await page.click('.door[data-fmt="B"]'); await page.waitForTimeout(700);
    check((await page.evaluate(() => location.hash)) === '#brief', 'door B opens briefing');
    const cnt = await page.evaluate(() => [...window.__mockStore.keys()].filter(k => /^projects\/[^/]+$/.test(k)).length); check(cnt === 4, 'new mission stored (got ' + cnt + ')');
  }
};
