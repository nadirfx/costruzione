// Libreria: suoni (con ascolto) e regole dei formati A/B/C.
import { S, $, el, toast } from './state.js';
import { SFX, RULES } from './data.js';
let audio = null;
export function init() {
  const box = $('sfxList');
  for (const s of SFX) box.append(el('div', { class: 'sfx' },
    el('button', { class: 'btn sm', type: 'button', 'aria-label': 'Ascolta ' + s.name, onclick: (e) => play(s, e.currentTarget) }, 'Play'),
    el('div', {}, el('div', { text: s.name }), el('div', { class: 'lbl', text: s.use })),
    el('span', { class: 'mono lbl', text: s.dur.toFixed(1) + ' s' })));
  const r = $('rules');
  for (const [k, f] of Object.entries(RULES)) { r.append(el('h3', {}, el('span', { class: 'fmt ' + k, text: k }), ' ', f.name)); r.append(el('ul', {}, f.rules.map(x => el('li', { text: x })))); }
}
function play(s, btn) {
  if (audio) { audio.pause(); audio = null; }
  if (!s.assetId) { toast('Suono non ancora caricato in questa installazione.'); return; }
  audio = new Audio(s.url || ('/_blob/' + s.assetId)); audio.play().catch(() => toast('Tocca di nuovo per ascoltare.'));
}
export function enter() { }
