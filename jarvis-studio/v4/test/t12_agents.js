const fs = require('fs');
const store = (page, fn, arg) => page.evaluate(fn, arg);
module.exports = {
  init: fs.readFileSync(__dirname + '/seed.js', 'utf8') + ';try{sessionStorage.setItem("jv.boot","1")}catch(e){};window.addEventListener("DOMContentLoaded",()=>window.__seed());',
  async run({ page, shot, check, mode }) {
    await page.goto('http://localhost:8790/'); await page.waitForTimeout(1500);
    await page.click('.door[data-fmt="B"]'); await page.waitForTimeout(800);
    const pid = await store(page, () => [...window.__mockStore.keys()].filter(k => /^projects\/[^/]+$/.test(k)).map(k => [k, window.__mockStore.get(k)]).find(([k, v]) => /Missione B/.test(v.title))[0].split('/')[1]);
    await page.click('#mTabs [data-room="script"]'); await page.waitForTimeout(600);
    check((await page.evaluate(() => location.hash)) === '#script', 'script room opens');
    await page.click('#runWriter');
    await page.waitForFunction(() => /Sapevi che/.test(document.getElementById('scriptText').value), null, { timeout: 15000 });
    await page.waitForTimeout(800); await shot('agents-writer');
    const sc = await store(page, (pid) => (window.__mockStore.get('projects/' + pid + '/state/script') || {}).text || '', pid);
    check(/Sapevi che/.test(sc), 'Sceneggiatore wrote the script doc');
    const pr = await store(page, (pid) => window.__mockStore.get('projects/' + pid), pid);
    check(pr.hasScript === true && pr.stage === 'script', 'mission moved to Script stage (' + pr.stage + ')');
    const out = await store(page, (pid) => window.__mockStore.get('projects/' + pid + '/agents/sceneggiatore'), pid);
    check(out && out.output && out.by === 'app', 'agent output saved');
    const acts = await store(page, () => [...window.__mockStore.keys()].filter(k => k.startsWith('activity/')).map(k => window.__mockStore.get(k)));
    check(acts.length >= 1 && acts.every(a => a.status === 'done'), 'activity logged and closed (' + acts.map(a => a.status).join(',') + ')');
    check(await page.$eval('.stageTrack .stp.now b', e => e.textContent) === 'Script', 'stage track shows Script');
    // fact check from the table
    await page.click('#table [data-agent="factcheck"] header .btn'); await page.waitForTimeout(1500);
    check(/Verifica fatti: lavoro fatto/.test(await page.textContent('#table [data-agent="factcheck"] .out')), 'Verifica fatti output shown in its card');
    // user edits the script: saved as user
    await page.fill('#scriptText', 'Script scritto da me.'); await page.waitForTimeout(1300);
    check((await store(page, (pid) => window.__mockStore.get('projects/' + pid + '/state/script').by, pid)) === 'user', 'manual script edit saved');
    // "Usa questo script" restores the writer's version
    await page.click('#table [data-agent="sceneggiatore"] button:has-text("Usa questo script")'); await page.waitForTimeout(1200);
    check(/Sapevi che/.test(await page.inputValue('#scriptText')), 'writer version restored on request');
    // timeline checks: build an edit, then Controllo tecnico + mix from the Qualità / Suono departments
    await page.click('#mTabs [data-room="brief"]'); await page.waitForTimeout(500);
    await page.setInputFiles('#matFile', [__dirname + '/files/voce.mp3', __dirname + '/files/clipA.mp4']);
    await page.waitForFunction(() => document.querySelectorAll('.mat').length === 2 && ![...document.querySelectorAll('.mat .nm')].some(n => /carico/.test(n.textContent)), null, { timeout: 20000 });
    await page.click('#toEditor'); await page.waitForTimeout(800);
    await page.click('#aiBuild'); await page.waitForFunction(() => document.getElementById('aiStop').hidden, null, { timeout: 30000 }); await page.waitForTimeout(1500);
    await page.click('#nav [data-room="studio"]'); await page.waitForTimeout(900);
    await page.click('.nodeLbl:has-text("Qualità")', { force: true }); await page.waitForTimeout(700);
    check(await page.$eval('#drawer', e => e.classList.contains('open')), 'department drawer opens from the 3D studio');
    await page.click('#drwBody [data-agent="qa_tech"] header .btn'); await page.waitForTimeout(1500);
    const items = await page.$$eval('#drwBody [data-agent="qa_tech"] .res > div', a => a.map(x => x.className + ':' + x.textContent));
    check(items.length >= 5, 'Controllo tecnico lists measured checks (' + items.length + ')');
    check(items.some(i => /Voce presente/.test(i)), 'voice detected on A1');
    await shot('agents-qa');
    await page.click('#drwClose'); await page.waitForTimeout(400);
    await page.click('.nodeLbl:has-text("Suono")', { force: true }); await page.waitForTimeout(600);
    await page.click('#drwBody [data-agent="mix"] header .btn'); await page.waitForTimeout(1200);
    check((await page.$$eval('#drwBody [data-agent="mix"] .res > div', a => a.length)) >= 2, 'Tecnico del mix reports');
    await page.click('#drwClose'); await page.waitForTimeout(300);
    // a Claude session working: the department lights up and the KPI counts it
    await store(page, (pid) => window.claude.use('db').then(db => db.collection('activity').doc('sess1').set({ pid, agent: 'sound', dept: 'snd', status: 'running', text: 'Sound designer al lavoro (sessione)', at: new Date().toISOString(), by: 'session' })), pid);
    await page.waitForTimeout(1200);
    check(/al lavoro/.test(await page.textContent('.nodeLbl:has-text("Suono")')), 'session work lights up the department');
    check((await page.textContent('#kpiWork')) === '1', 'KPI counts agents at work');
    check(/sessione Claude/.test(await page.textContent('#feed')), 'activity feed shows the session');
    await shot('agents-session');
  }
};
