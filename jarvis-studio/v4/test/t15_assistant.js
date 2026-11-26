const fs = require('fs');
module.exports = {
  init: fs.readFileSync(__dirname + '/seed.js', 'utf8') + ';try{sessionStorage.setItem("jv.boot","1")}catch(e){};window.addEventListener("DOMContentLoaded",()=>window.__seed());',
  async run({ page, shot, check }) {
    await page.goto('http://localhost:8790/'); await page.waitForTimeout(1500);
    for (const r of ['prod', 'machine', 'lib', 'studio']) { await page.click('#nav [data-room="' + r + '"]'); await page.waitForTimeout(300); check(await page.$eval('#jvOrb', e => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 30), 'Jarvis present in ' + r); }
    await page.click('.door[data-fmt="B"]'); await page.waitForTimeout(800);
    await page.click('#jvOrb'); await page.waitForTimeout(500);
    check(await page.$eval('#jvSheet', e => e.classList.contains('open')), 'assistant opens');
    check(/Brief/.test(await page.textContent('#jvCtx')), 'assistant knows the room');
    await page.fill('#jvIn', 'Cosa manca?'); await page.click('#jvSend');
    await page.waitForFunction(() => !document.getElementById('jvSend').disabled, null, { timeout: 10000 }); await page.waitForTimeout(300);
    const btns = await page.$$eval('#jvLog .act button', a => a.map(b => b.textContent));
    check(btns.some(b => /Sceneggiatore/.test(b)) && btns.some(b => /Apri Script/.test(b)), 'reply carries action buttons (' + btns.join(' | ') + ')');
    check(!/AZIONE:/.test(await page.textContent('#jvLog')), 'action lines hidden from the text');
    await shot('assistant-reply');
    await page.click('#jvLog .act button:has-text("Sceneggiatore")');
    await page.waitForFunction(() => /Sapevi che/.test(document.getElementById('scriptText').value), null, { timeout: 15000 });
    check((await page.evaluate(() => location.hash)) === '#script', 'action opened Script and ran the writer');
    await page.reload(); await page.waitForTimeout(1500); await page.click('#jvOrb'); await page.waitForTimeout(400);
    check((await page.$$eval('#jvLog .msg', a => a.length)) >= 2, 'conversation kept after reload');
    await page.evaluate(() => window.__failSample = 'rate_limited');
    await page.fill('#jvIn', 'ciao'); await page.click('#jvSend'); await page.waitForTimeout(800);
    check(/Troppe richieste/.test(await page.textContent('#jvLog')), 'assistant explains errors');
    await page.keyboard.press('Escape'); await page.waitForTimeout(500);
    check(!(await page.$eval('#jvSheet', e => e.classList.contains('open'))), 'Escape closes the assistant');
  }
};
