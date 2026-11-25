const fs = require('fs');
module.exports = {
  init: fs.readFileSync(__dirname + '/seed.js', 'utf8') + ';try{sessionStorage.setItem("jv.boot","1")}catch(e){};window.addEventListener("DOMContentLoaded",()=>window.__seed());',
  async run({ page, shot, check }) {
    await page.goto('http://localhost:8790/#review'); await page.waitForTimeout(2000);
    await page.click('#nav [data-room="mission"]').catch(() => {}); await page.waitForTimeout(300);
    await page.goto('http://localhost:8790/'); await page.waitForTimeout(1500);
    await page.click('#missionList .mission >> nth=1'); await page.waitForTimeout(1500);
    check((await page.evaluate(() => location.hash)) === '#review', 'mission in review opens Revisione');
    await page.waitForFunction(() => document.getElementById('revVideo').readyState >= 2, null, { timeout: 15000 }).catch(() => {});
    const src = await page.$eval('#revVideo', v => ({ src: v.src, poster: v.poster, rs: v.readyState }));
    check(src.src.startsWith('blob:'), 'review video plays from memory (Safari-proof)');
    check(/_blob\//.test(src.poster), 'review video has a cover');
    check(src.rs >= 2, 'review video loaded (' + src.rs + ')');
    check(await page.$('#revActs button:has-text("Schermo intero")') !== null, 'fullscreen button present');
    // delete the version: first tap arms, second deletes
    const b = page.locator('#revActs button:has-text("Elimina v1")');
    await b.click(); check(/Conferma/.test(await page.locator('#revActs .armed').textContent()), 'first tap asks for confirmation');
    await page.waitForTimeout(4300);
    check(await page.locator('#revActs .armed').count() === 0, 'confirmation expires by itself');
    await b.click(); await page.locator('#revActs .armed').click(); await page.waitForTimeout(1200);
    const p = await page.evaluate(() => window.__mockStore.get('projects/instagram-chiude-luca'));
    check(p.versions.length === 0 && p.status === 'lavorazione', 'version deleted and mission back in work (' + p.status + ')');
    // delete a whole mission from the production board
    await page.click('#nav [data-room="prod"]'); await page.waitForTimeout(900);
    const before = await page.$$eval('#board .mission', a => a.length);
    await page.click('#board .col[data-stage="approvato"] .mission .cardDel'); await page.waitForTimeout(200);
    check(await page.$('#board .cardDel.armed') !== null, 'board delete asks for confirmation');
    await page.click('#board .cardDel.armed'); await page.waitForTimeout(1500);
    check((await page.$$eval('#board .mission', a => a.length)) === before - 1, 'mission removed from the board');
    check(!(await page.evaluate(() => [...window.__mockStore.keys()].some(k => k.startsWith('projects/whatsapp')))), 'mission and its documents deleted from the database');
    await shot('deleted');
  }
};
