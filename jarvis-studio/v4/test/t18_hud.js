const fs = require('fs');
module.exports = {
  init: fs.readFileSync(__dirname + '/seed.js', 'utf8') + ';try{sessionStorage.setItem("jv.boot","1")}catch(e){};window.addEventListener("DOMContentLoaded",()=>window.__seed());',
  async run({ page, shot, check }) {
    await page.goto('http://localhost:8790/'); await page.waitForTimeout(2200);
    check((await page.$$eval('#stKpis .kpi', a => a.length)) === 4, 'four KPI rings');
    check(await page.$eval('#stKpis .kpi .fg', c => c.style.strokeDashoffset !== ''), 'rings animated from data');
    check((await page.$$eval('#stPipe .pipe', a => a.length)) === 7, 'pipeline shows 7 stages');
    check((await page.$eval('#stPipe', b => [...b.querySelectorAll('.pipe b')].reduce((s, x) => s + +x.textContent, 0))) === 3, 'pipeline counts all missions');
    check((await page.$$eval('#stAgents .ag', a => a.length)) === 12, 'agent roster shows 12 agents');
    check((await page.$$eval('#stSpark path', a => a.length)) === 2, 'activity sparkline drawn');
    check((await page.$$eval('#coreLabels .nodeLbl', a => a.length)) === 6, 'six department beacons');
    check((await page.$eval('#stTicker', e => e.textContent.length)) > 5, 'status ticker running');
    // layout: no panel overflows the viewport horizontally, scene is the biggest block
    const lay = await page.evaluate(() => { const W = innerWidth; const r = (id) => document.getElementById(id).getBoundingClientRect(); const bad = [...document.querySelectorAll('#v-studio .panel,#sceneWrap')].filter(e => { const b = e.getBoundingClientRect(); return b.left < -1 || b.right > W + 1; }).length; return { bad, scene: r('sceneWrap').width * r('sceneWrap').height, sw: document.documentElement.scrollWidth, W }; });
    check(lay.bad === 0 && lay.sw <= lay.W + 1, 'nothing cut off horizontally');
    check(lay.scene > 120000, 'the 3D core gets real space (' + Math.round(lay.scene) + ' px²)');
    // beacons stay inside the scene
    const inside = await page.evaluate(() => { const s = document.getElementById('sceneWrap').getBoundingClientRect(); return [...document.querySelectorAll('.nodeLbl')].filter(l => l.style.display !== 'none').every(l => { const b = l.getBoundingClientRect(); return b.left >= s.left - 2 && b.right <= s.right + 2; }); });
    check(inside, 'department labels stay inside the core');
    // live activity lights up the department and the roster
    await page.evaluate(() => window.claude.use('db').then(db => db.collection('activity').doc('t18').set({ pid: 'mcdonalds-concept', agent: 'montatore', dept: 'edt', status: 'running', text: 'Montaggio in corso', at: new Date().toISOString(), by: 'session' })));
    await page.waitForTimeout(1500);
    check(await page.$eval('#stAgents', b => !!b.querySelector('.ag.on')), 'roster marks the working agent');
    check(await page.$eval('#coreLabels', b => [...b.querySelectorAll('.nodeLbl.work')].some(l => /Montaggio/i.test(l.textContent))), 'Montaggio beacon lights up');
    check((await page.textContent('#kpiWork')) === '1', 'KPI counts the working agent');
    await shot('hud');
    // open the McDonald's mission, import its render into the timeline
    await page.click('#missionList .mission[data-id="mcdonalds-concept"]'); await page.waitForTimeout(1200);
    await page.click('#mTabs [data-room="editor"]'); await page.waitForTimeout(1200);
    check(await page.$$eval('#libBody .verImp', a => a.length) >= 1, 'editor offers the review render');
    await page.click('#libBody .verImp button'); await page.waitForTimeout(1500);
    const n = await page.$$eval('.track[data-track="V1"] .clip', a => a.length);
    check(n === 1, 'render placed on V1 (' + n + ')');
    const saved = await page.evaluate(() => { const d = window.__mockStore.get('projects/mcdonalds-concept/state/edit'); return d && d.clips && d.clips.length; });
    check(saved === 1, 'import saved to the mission edit');
    await page.waitForTimeout(800); await shot('editor-import');
    check((await page.$$eval('#libBody .verImp', a => a.length)) === 0, 'imported render no longer offered twice');
  }
};
