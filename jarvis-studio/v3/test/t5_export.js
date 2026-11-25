const fs=require('fs');
module.exports = {
  init: fs.readFileSync(__dirname+'/seed.js','utf8')+';try{sessionStorage.setItem("jv.boot","1")}catch(e){};window.addEventListener("DOMContentLoaded",()=>window.__seed());',
  async run({ page, shot, check }) {
    const sup = await (await page.goto('http://localhost:8790/'), page.evaluate(async () => ({ ve: typeof VideoEncoder, ae: typeof AudioEncoder, avc: typeof VideoEncoder !== 'undefined' ? (await VideoEncoder.isConfigSupported({ codec: 'avc1.640034', width: 720, height: 1280 })).supported : null, vp9: typeof VideoEncoder !== 'undefined' ? (await VideoEncoder.isConfigSupported({ codec: 'vp09.00.50.08', width: 720, height: 1280 })).supported : null, aac: typeof AudioEncoder !== 'undefined' ? (await AudioEncoder.isConfigSupported({ codec: 'mp4a.40.2', sampleRate: 48000, numberOfChannels: 2 })).supported : null })));
    console.log('  codec support in test browser:', JSON.stringify(sup));
    await page.waitForTimeout(800);
    await page.click('.door[data-fmt="B"]'); await page.waitForTimeout(700);
    await page.setInputFiles('#matFile', [__dirname + '/files/voce.mp3', __dirname + '/files/clipA.mp4', __dirname + '/files/clipB.mp4']);
    await page.waitForFunction(() => document.querySelectorAll('.mat').length === 3 && ![...document.querySelectorAll('.mat .nm')].some(n => /carico|prepar/.test(n.textContent)), null, { timeout: 15000 });
    await page.click('#toEditor'); await page.waitForTimeout(900);
    await page.click('#aiBuild'); await page.waitForFunction(() => document.getElementById('aiStop').hidden, null, { timeout: 30000 }); await page.waitForTimeout(500);
    for (const [fmt, res] of [['webm', '720'], ['mp4', '720']]) {
      await page.click('#exportBtn'); await page.waitForTimeout(300);
      await page.selectOption('#exFmt', fmt); await page.selectOption('#exRes', res); await page.selectOption('#exFps', '30'); await page.selectOption('#exAfter', 'both');
      await page.click('#exGo');
      await page.waitForFunction(() => /Pronto|non riuscito|non supporta/.test(document.getElementById('exMsg').textContent), null, { timeout: 240000 });
      const msg = await page.textContent('#exMsg'); console.log('  ' + fmt + ': ' + msg);
      await shot('export-' + fmt);
      check(/Pronto/.test(msg), fmt + ' export finished');
      if (/Pronto/.test(msg)) {
        const b64 = await page.evaluate(async () => { const b = window.__lastDownload; const a = new Uint8Array(await b.arrayBuffer()); let s = ''; for (let i = 0; i < a.length; i += 0x8000) s += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000)); return btoa(s); });
        fs.writeFileSync(__dirname + '/shots/export.' + fmt, Buffer.from(b64, 'base64'));
        const v = await page.evaluate(() => window.__mockStore.get([...window.__mockStore.keys()].find(k => /^projects\/[^/]+$/.test(k) && /Missione B/.test(window.__mockStore.get(k).title))).versions.length);
        check(v >= 1, 'version sent to review (' + v + ')');
      }
      await page.click('#exCancel'); await page.waitForTimeout(300);
    }
  }
};
