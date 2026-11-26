// Libreria: the studio's skills (rules every agent reads), the agents directory, sounds and format rules.
import { S, $, el, toast } from './state.js';
import { SFX, RULES } from './data.js';
import { SKILLS } from './skills.gen.js';
import { AGENTS, DEPTS, deptOf } from './org.js';
import * as Agents from './agents.js';
let audio = null, api;
export function init(a) {
  api = a;
  const sk = $('skillList');
  for (const s of SKILLS) { const d = deptOf(s.dept); sk.append(el('details', { class: 'skill' }, el('summary', {}, el('span', { class: 'dpt', style: '--c:' + d.color }, el('i')), s.name), el('pre', { text: s.text }))); }
  const ad = $('agentDir');
  for (const D of DEPTS) {
    ad.append(el('button', { class: 'btn sm', type: 'button', style: 'justify-self:start', onclick: () => Agents.openDrawer(D.key) }, el('span', { class: 'dpt', style: '--c:' + D.color }, el('i'), D.name)));
    for (const A of AGENTS.filter(x => x.dept === D.key)) ad.append(el('div', { class: 'agent', style: '--c:' + D.color }, el('header', {}, el('span', { class: 'av', text: A.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() }), el('div', {}, el('b', { text: A.name }), el('span', { text: A.kind === 'check' ? 'Controlli misurati sulla timeline' : A.kind === 'editor' ? 'Monta nell\'editor' : 'Scrive con Claude' }))), el('p', { class: 'role', text: A.role })));
  }
  const box = $('sfxList');
  box.append(el('div', { class: 'lbl', text: 'Suoni dell\'editor', style: 'margin-bottom:4px' }));
  for (const s of SFX) box.append(el('div', { class: 'sfx' },
    el('button', { class: 'btn sm', type: 'button', 'aria-label': 'Ascolta ' + s.name, onclick: () => play(s) }, 'Play'),
    el('div', {}, el('div', { text: s.name }), el('div', { class: 'lbl', text: s.use, style: 'letter-spacing:.04em;text-transform:none' })),
    el('span', { class: 'mono lbl', text: s.dur.toFixed(1) + ' s' })));
  const r = $('rules');
  for (const [k, f] of Object.entries(RULES)) { r.append(el('h3', {}, el('span', { class: 'fmt ' + k, text: k }), ' ', f.name)); r.append(el('ul', {}, f.rules.map(x => el('li', { text: x })))); }
}
function play(s) {
  if (audio) { audio.pause(); audio = null; }
  if (!s.assetId) { toast('Suono non ancora caricato in questa installazione.'); return; }
  audio = new Audio(s.url || ('/_blob/' + s.assetId)); audio.play().catch(() => toast('Tocca di nuovo per ascoltare.'));
}
export function enter() { }
export function leave() { if (audio) { audio.pause(); audio = null; } }
