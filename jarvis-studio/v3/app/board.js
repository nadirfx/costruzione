// Produzione: the production line, one column per stage; cards carry a live preview and move stage by stage.
import { S, $, el, toast, now, writeErr, feed, on } from './state.js';
import { STAGES, stageOf, stageIdx, deptOf } from './org.js';
import { missionCard } from './cards.js';

let api;
export function init(a) {
  api = a;
  document.querySelectorAll('.newFmt').forEach(b => b.addEventListener('click', () => api.createMission(b.dataset.fmt)));
  on('projects', () => S.room === 'prod' && render());
}
export function enter() { render(); }
export function refresh() { render(); }
async function move(p, dir) {
  if (!S.db || !S.canWrite) { toast('Non hai i permessi per spostare le missioni.'); return; }
  const i = stageIdx(stageOf(p)) + dir; if (i < 0 || i >= STAGES.length) return;
  const st = STAGES[i].key; const upd = { stage: st, updatedAt: now() };
  if (st === 'revisione' || st === 'approvato') upd.status = st; else if (p.status === 'revisione' || p.status === 'approvato') upd.status = 'lavorazione';
  else if (st !== 'brief') upd.status = 'lavorazione';
  try { await S.db.doc('projects/' + p.id).update(upd); feed((p.title || 'Missione') + ' → ' + STAGES[i].name); } catch (e) { toast(writeErr(e)); }
}
function render() {
  const b = $('board'); b.replaceChildren();
  for (const [i, s] of STAGES.entries()) {
    const d = deptOf(s.dept); const items = S.projects.filter(p => stageOf(p) === s.key);
    const list = el('div', { class: 'list' });
    if (!items.length) list.append(el('div', { class: 'empty', text: 'Nessuna missione' }));
    for (const p of items) list.append(missionCard(p, { onOpen: (id) => api.openMission(id), extra: el('div', { class: 'mvBtns' }, el('span', { class: 'mvLbl', text: 'Sposta' }),
      el('button', { type: 'button', disabled: i === 0, 'aria-label': 'Sposta a ' + (STAGES[i - 1] || {}).name, onclick: (e) => { e.stopPropagation(); move(p, -1); } }, '‹'),
      el('button', { type: 'button', disabled: i === STAGES.length - 1, 'aria-label': 'Sposta a ' + (STAGES[i + 1] || {}).name, onclick: (e) => { e.stopPropagation(); move(p, 1); } }, '›')) }));
    b.append(el('section', { class: 'col', 'data-stage': s.key, style: '--c:' + d.color },
      el('header', {}, el('div', {}, el('b', { text: s.name }), el('div', { class: 'dpt', style: '--c:' + d.color }, el('i'), d.name)), el('span', { class: 'cnt', text: String(items.length) })), list));
  }
}
