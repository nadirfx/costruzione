module.exports = {
  init: 'try{sessionStorage.setItem("jv.boot","1")}catch(e){}; if (location.search.includes("nocl")) delete window.claude;',
  async run({ page, shot, check }) {
    await page.goto('http://localhost:8790/'); await page.waitForTimeout(2500);
    check(/Nessuna missione/.test(await page.textContent('#missionList')), 'empty hub explains what to do');
    for (const r of ['brief', 'editor']) { await page.click(`#mTabs [data-room="${r}"]`); await page.waitForTimeout(300); check((await page.evaluate(() => location.hash)) === '#studio', r + ' without mission redirects to hub'); }
    await page.click('#mTabs [data-room="review"]'); await page.waitForTimeout(400); check(/Nessun video/.test(await page.textContent('#revItems')), 'empty review explains');
    await shot('empty');
    await page.goto('http://localhost:8790/?nocl'); await page.waitForTimeout(2500);
    check(/Offline|non disponibili/i.test(await page.textContent('#sysTxt')), 'outside claude.ai shows offline (' + await page.textContent('#sysTxt') + ')');
    await page.click('.door[data-fmt="A"]'); await page.waitForTimeout(400);
    check((await page.evaluate(() => location.hash)) !== '#brief', 'cannot create mission without data');
    await shot('offline');
  }
};
