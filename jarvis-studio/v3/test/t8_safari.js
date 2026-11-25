// Safari simulation: no WebCodecs audio encoder, no HTMLMediaElement.captureStream, recorder limited to MP4 when available.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const SAFARI = `delete window.AudioEncoder; delete window.AudioDecoder; try{Object.defineProperty(HTMLMediaElement.prototype,'captureStream',{value:undefined,configurable:true})}catch(e){}
 if(window.MediaRecorder){const i=MediaRecorder.isTypeSupported.bind(MediaRecorder);MediaRecorder.isTypeSupported=t=>/mp4/.test(t)&&i(t);}`;
const magic = (id) => { const b = fs.readFileSync(path.join(__dirname, 'blobs', id)); const ty = fs.readFileSync(path.join(__dirname, 'blobs', id + '.type'), 'utf8'); const kind = b.slice(4, 8).toString() === 'ftyp' ? 'video/mp4' : b.readUInt32BE(0) === 0x1A45DFA3 ? 'video/webm' : '?'; return { ty, kind, size: b.length }; };
const streams = (id) => { try { return execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type', '-of', 'csv=p=0', path.join(__dirname, 'blobs', id)]).toString().trim().split('\n'); } catch (e) { return ['probe-failed']; } };
module.exports = {
  init: fs.readFileSync(__dirname + '/seed.js', 'utf8') + ';' + SAFARI + ';try{sessionStorage.setItem("jv.boot","1")}catch(e){};window.addEventListener("DOMContentLoaded",()=>window.__seed());',
  async run({ page, shot, check, mode }) {
    await page.goto('http://localhost:8790/'); await page.waitForTimeout(1000);
    check(await page.evaluate(() => typeof AudioEncoder === 'undefined'), 'simulation: no AudioEncoder');
    await page.click('.door[data-fmt="B"]'); await page.waitForTimeout(700);
    await page.setInputFiles('#matFile', [__dirname + '/files/voce.mp3', __dirname + '/files/clipA.mp4']);
    await page.waitForFunction(() => document.querySelectorAll('.mat').length === 2 && ![...document.querySelectorAll('.mat .nm')].some(n => /carico|converto|leggera/i.test(n.textContent)), null, { timeout: 40000 });
    const mats = await page.evaluate(() => { const k = [...window.__mockStore.keys()].find(k => k.endsWith('/state/edit')); return window.__mockStore.get(k) ? window.__mockStore.get(k).materials : []; });
    await page.waitForTimeout(1200);
    const mats2 = await page.evaluate(() => { const k = [...window.__mockStore.keys()].find(k => k.endsWith('/state/edit')); return window.__mockStore.get(k).materials; });
    const voice = mats2.find(m => m.kind === 'audio'); check(!!(voice && voice.assetId), 'mp3 converted and uploaded without AudioEncoder');
    if (voice) { const m = magic(voice.assetId); check(m.ty === m.kind, 'audio container label matches content (' + m.ty + ' / ' + m.kind + ')'); check(streams(voice.assetId).includes('audio'), 'converted voice has an audio stream'); }
    // big video -> light copy, with audio, labelled correctly
    if (mode === 'desktop') {
      await page.setInputFiles('#matFile', [__dirname + '/files/big.mp4']);
      await page.waitForFunction(() => { const k = [...window.__mockStore.keys()].find(k => k.endsWith('/state/edit')); const d = window.__mockStore.get(k); return d && d.materials.length === 3; }, null, { timeout: 60000 });
      const big = await page.evaluate(() => { const k = [...window.__mockStore.keys()].find(k => k.endsWith('/state/edit')); return window.__mockStore.get(k).materials.find(m => m.name === 'big.mp4'); });
      check(!!(big && big.proxy), 'over-20MB video replaced by a light copy');
      if (big) { const m = magic(big.assetId); check(m.ty === m.kind, 'proxy label matches content (' + m.ty + ' / ' + m.kind + ')'); check(m.size < 20 * 1024 * 1024, 'proxy under 20 MB (' + (m.size / 1048576).toFixed(1) + ' MB)'); const st = streams(big.assetId); check(st.includes('video') && st.includes('audio'), 'proxy keeps video AND audio (' + st.join(',') + ')'); }
    }
    await page.click('#toEditor'); await page.waitForTimeout(900);
    await page.click('#libBody .libItem >> nth=0 >> button'); await page.waitForTimeout(300);
    await page.click('#libBody .libItem >> nth=1 >> button'); await page.waitForTimeout(500);
    await page.click('#exportBtn'); await page.waitForTimeout(300);
    const msg = await page.textContent('#exMsg'); check(/MUTO/.test(msg), 'export warns before a silent export (' + msg.slice(0, 50) + ')');
    await page.selectOption('#exRes', '720'); await page.click('#exGo');
    await page.waitForFunction(() => /Pronto|non riuscito/.test(document.getElementById('exMsg').textContent), null, { timeout: 120000 });
    const fin = await page.textContent('#exMsg'); check(/Pronto/.test(fin) && /SENZA AUDIO/.test(fin), 'export finishes and says it has no audio (' + fin.slice(0, 70) + ')');
    await shot('safari-export');
    await page.click('#exCancel');
  }
};
