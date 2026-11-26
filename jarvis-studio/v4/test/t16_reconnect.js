const fs = require('fs');
module.exports = {
  init: fs.readFileSync(__dirname + '/seed.js', 'utf8') + ';try{sessionStorage.setItem("jv.boot","1")}catch(e){};window.addEventListener("DOMContentLoaded",()=>window.__seed());',
  async run({ page, shot, check }) {
    await page.goto('http://localhost:8790/'); await page.waitForTimeout(1500);
    await page.click('#missionList .mission >> nth=1'); await page.waitForTimeout(800);
    await page.click('#mTabs [data-room="editor"]'); await page.waitForTimeout(900);
    const before = await page.evaluate(() => window.__listenerCount());
    await page.evaluate(() => window.__dropConnection()); await page.waitForTimeout(300);
    check(/persa|ricollego/i.test(await page.textContent('#sysTxt')), 'shows the connection is lost (' + await page.textContent('#sysTxt') + ')');
    await page.waitForFunction(() => /Online/.test(document.getElementById('sysTxt').textContent), null, { timeout: 12000 }).catch(() => {});
    check(/Online/.test(await page.textContent('#sysTxt')), 'reconnects by itself');
    await page.waitForTimeout(4500);
    const after = await page.evaluate(() => window.__listenerCount());
    const paths = await page.evaluate(() => window.__listenerPaths().join(',')); check(['projects', 'activity', 'state/edit', 'state/live', '/agents'].every(x => paths.includes(x)), 'live listeners re-attached (' + before + ' → ' + after + ')');
    // changes made elsewhere still arrive: a session renames the mission, sends a live edit and an activity
    await page.evaluate(() => window.claude.use('db').then(async db => { await db.doc('projects/instagram-chiude-luca').update({ title: 'Instagram chiude · rinominato', updatedAt: new Date().toISOString() }); await db.doc('projects/instagram-chiude-luca/state/live').set({ message: 'Dopo la riconnessione', ops: [{ n: 1, op: 'add_text', text: 'Riconnesso', start: 0, dur: 1 }] }); }));
    await page.waitForTimeout(3500);
    check(/rinominato/.test(await page.textContent('#ctxTitle')), 'project changes arrive after reconnecting');
    check((await page.$$eval('.clip', a => a.length)) >= 1, 'live edit ops arrive after reconnecting');
    await shot('reconnected');
  }
};
