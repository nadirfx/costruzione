const fs = require('fs');
module.exports = {
  init: fs.readFileSync(__dirname + '/seed.js', 'utf8') + ';try{sessionStorage.setItem("jv.boot","1")}catch(e){};window.addEventListener("DOMContentLoaded",()=>window.__seed());',
  async run({ page, shot, check }) {
    await page.goto('http://localhost:8790/'); await page.waitForTimeout(1500);
    await page.click('#missionList .mission >> nth=1'); await page.waitForTimeout(700);
    await page.click('#nav [data-room="machine"]'); await page.waitForTimeout(700);
    check(/Quando una sessione Claude lavora/.test(await page.textContent('#mxLog')), 'empty machine room explains itself');
    const pid = 'instagram-chiude-luca';
    await page.evaluate((pid) => window.claude.use('db').then(db => db.doc('projects/' + pid + '/state/machine').set({ status: 'running', progress: 0.4, steps: [{ at: new Date().toISOString(), dept: 'edt', text: 'Trascrivo la voce parola per parola' }, { at: new Date().toISOString(), agent: 'motion3d', text: 'Scena 1: edificio 3D che sale' }], code: { file: 'gs.html', text: 'const K = {gratis: 1.1};\n// scena 1\nfunction building(T) {\n  return "ok";\n}', hot: [3] }, preview: { assetId: '354ebf0e7031adfdf4b92961779860e8', kind: 'video', caption: 'Render di prova' } })), pid);
    await page.waitForTimeout(1200);
    check((await page.$$eval('#mxLog .s', a => a.length)) === 2, 'log shows the session steps');
    check((await page.$$eval('#mxCode .ln', a => a.length)) === 5 && (await page.$$eval('#mxCode .ln.hot', a => a.length)) === 1, 'code shown with the line being written highlighted');
    check((await page.$$eval('#mxCode .k', a => a.length)) >= 2, 'code is highlighted');
    check((await page.$$eval('#mxPreview video', a => a.length)) === 1, 'preview video shown');
    check(/Al lavoro/.test(await page.textContent('#mxStatus')), 'status running');
    await page.evaluate((pid) => window.claude.use('db').then(db => db.doc('projects/' + pid + '/state/machine').update({ progress: 1, status: 'done', steps: [{ at: new Date().toISOString(), dept: 'edt', text: 'Trascrivo la voce parola per parola' }, { at: new Date().toISOString(), agent: 'motion3d', text: 'Scena 1: edificio 3D che sale' }, { at: new Date().toISOString(), dept: 'qa', text: 'Controllo movimento: nessun secondo fermo' }] })), pid);
    await page.waitForTimeout(1000);
    check((await page.$$eval('#mxLog .s', a => a.length)) === 3, 'new step appended live');
    check(/Finito/.test(await page.textContent('#mxStatus')), 'status done');
    await shot('machine-live');
  }
};
