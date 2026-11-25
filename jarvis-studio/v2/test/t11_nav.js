const fs = require('fs');
module.exports = {
  init: fs.readFileSync(__dirname + '/seed.js', 'utf8') + ';try{sessionStorage.setItem("jv.boot","1")}catch(e){};window.addEventListener("DOMContentLoaded",()=>window.__seed());',
  async run({ page, shot, check, mode }) {
    await page.goto('http://localhost:8790/'); await page.waitForTimeout(1200);
    const over = () => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    // open a mission from the list -> right room for its status
    await page.click('#missionList .mission >> nth=0'); await page.waitForTimeout(900);
    const h1 = await page.evaluate(() => location.hash); check(/#(brief|editor|review)/.test(h1), 'mission opens a working room (' + h1 + ')');
    for (const room of ['brief', 'editor', 'review', 'lib', 'hub']) {
      await page.click('#tabs button[data-room="' + room + '"]'); await page.waitForTimeout(700);
      check((await page.evaluate(() => location.hash)) === '#' + room, 'tab opens ' + room);
      check(!(await over()), 'no horizontal overflow in ' + room);
      await shot('nav-' + room);
    }
    // back button
    await page.goBack(); await page.waitForTimeout(700);
    check((await page.evaluate(() => location.hash)) === '#lib', 'browser Back returns to the previous room');
    // reload keeps the room
    for (const room of ['editor', 'review']) {
      await page.click('#tabs button[data-room="' + room + '"]'); await page.waitForTimeout(600);
      await page.reload(); await page.waitForTimeout(1500);
      check((await page.evaluate(() => location.hash)) === '#' + room && await page.$eval('#v-' + room, e => !e.hidden && getComputedStyle(e).display !== 'none').catch(() => false), 'reload stays in ' + room);
    }
  }
};
