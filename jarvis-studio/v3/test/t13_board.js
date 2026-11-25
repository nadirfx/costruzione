const fs = require('fs');
module.exports = {
  init: fs.readFileSync(__dirname + '/seed.js', 'utf8') + ';try{sessionStorage.setItem("jv.boot","1")}catch(e){};window.addEventListener("DOMContentLoaded",()=>window.__seed());',
  async run({ page, shot, check }) {
    await page.goto('http://localhost:8790/#prod'); await page.waitForTimeout(1800);
    check((await page.$$eval('#board .col', a => a.length)) === 7, 'seven production stages');
    check((await page.$$eval('#board .col[data-stage="revisione"] .mission', a => a.length)) === 2, 'two missions in Revisione');
    check((await page.$$eval('#board .col[data-stage="approvato"] .mission', a => a.length)) === 1, 'one mission approved');
    check((await page.$$eval('#board .mission video', a => a.length)) === 2, 'cards carry a video preview of the last version');
    await shot('board');
    // move the approved one back to Revisione
    await page.click('#board .col[data-stage="approvato"] .mission .mvBtns button >> nth=0'); await page.waitForTimeout(900);
    check((await page.$$eval('#board .col[data-stage="revisione"] .mission', a => a.length)) === 3, 'card moved one stage back');
    const st = await page.evaluate(() => window.__mockStore.get('projects/whatsapp').status); check(st === 'revisione', 'status follows the stage (' + st + ')');
    // new mission from the board
    await page.click('.newFmt[data-fmt="C"]'); await page.waitForTimeout(900);
    check((await page.evaluate(() => location.hash)) === '#brief', 'new mission from Produzione opens its brief');
    await page.click('#nav [data-room="prod"]'); await page.waitForTimeout(700);
    check((await page.$$eval('#board .col[data-stage="brief"] .mission', a => a.length)) === 1, 'new mission sits in Brief');
    await page.click('#board .col[data-stage="revisione"] .mission >> nth=0'); await page.waitForTimeout(800);
    check((await page.evaluate(() => location.hash)) === '#review', 'opening a card in Revisione lands in Revisione');
  }
};
