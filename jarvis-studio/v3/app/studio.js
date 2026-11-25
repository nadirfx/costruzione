// Studio: the 3D studio of departments, live activity, the reel of missions in production.
import { S, $, el, on } from './state.js';
import { DEPTS, AGENTS, deptOf, agentOf, stageOf } from './org.js';
import { missionCard } from './cards.js';
import * as Agents from './agents.js';

let api, core = null, loading = false;
const local = []; // feed events produced in this browser
export function init(a) {
  api = a;
  document.querySelectorAll('.door').forEach(d => d.addEventListener('click', () => api.createMission(d.dataset.fmt)));
  $('toBoard').addEventListener('click', () => api.go('prod'));
  on('projects', render); on('activity', () => { renderFeed(); paintWork(); }); on('agents', paintWork);
  on('feed', (f) => { local.unshift(f); local.length = Math.min(local.length, 30); renderFeed(); });
  on('drawer', (k) => core && core.select(k));
  document.addEventListener('visibilitychange', () => { if (!core) return; if (document.hidden) core.stop(); else if (S.room === 'studio') core.start(); });
}
export function enter() { ensureCore(); core && core.start(); render(); }
export function leave() { core && core.stop(); }
export function refresh() { render(); }

function deptInfo(k) {
  const work = Agents.workMap(); const ags = AGENTS.filter(a => a.dept === k); const busy = ags.filter(a => work[a.key]);
  return busy.length ? busy.map(a => a.name).join(', ') + ' al lavoro' : ags.length + (ags.length === 1 ? ' agente' : ' agenti') + ' · pronti';
}
function paintWork() {
  const work = Agents.workMap(); const active = S.projects.filter(p => !['approvato'].includes(stageOf(p))).length;
  core && core.setWork(work, active ? 0.35 : 0);
  const n = Object.keys(work).length; const k = $('kpiWork'); if (k) k.textContent = String(n);
}
async function ensureCore() {
  if (core || loading) return; loading = true;
  try { const m = await import('./studio3d.js'); core = m.createStudio($('core'), $('coreLabels'), { onPick: (k) => Agents.openDrawer(k), deptInfo }); if (core) { paintWork(); if (S.room === 'studio') core.start(); } else $('coreHint').textContent = 'Grafica 3D non disponibile su questo dispositivo'; }
  catch (e) { console.warn('studio3d', e); $('coreHint').textContent = 'Grafica 3D non disponibile su questo dispositivo'; }
  loading = false;
}
function render() {
  const P = S.projects; const c = (f) => P.filter(f).length;
  const k = $('stKpis'); k.replaceChildren(
    kpi(String(c(p => !['revisione', 'approvato'].includes(stageOf(p)))), 'In produzione'),
    kpi(String(c(p => stageOf(p) === 'revisione')), 'Da revisionare'),
    kpi(String(c(p => stageOf(p) === 'approvato')), 'Approvate'),
    kpi(String(Object.keys(Agents.workMap()).length), 'Agenti al lavoro', 'kpiWork'));
  $('stLine').textContent = `12 agenti in 6 reparti, ${P.length} ${P.length === 1 ? 'missione' : 'missioni'} nello studio. Ogni agente segue le skill dello studio: formati, standard video, suono, controllo qualità.`;
  const list = $('missionList'); list.replaceChildren();
  if (!S.db) list.append(el('div', { class: 'empty', text: 'Dati non disponibili in questa vista. Apri Jarvis su claude.ai.' }));
  else if (!P.length) list.append(el('div', { class: 'empty', text: 'Nessuna missione. Scegli un formato a destra per iniziare la prima produzione.' }));
  for (const p of P) list.append(missionCard(p, { onOpen: (id) => api.openMission(id) }));
  renderFeed(); paintWork();
}
function kpi(v, l, id) { return el('div', { class: 'kpi' }, el('b', { text: v, id }), el('span', { text: l })); }
function ago(t) { const s = (Date.now() - t) / 1000; if (s < 60) return 'adesso'; if (s < 3600) return Math.round(s / 60) + ' min fa'; if (s < 86400) return Math.round(s / 3600) + ' h fa'; return new Date(t).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }); }
function renderFeed() {
  const f = $('feed'); f.replaceChildren();
  const items = [
    ...Agents.activity.map(a => ({ at: Date.parse(a.at || '') || 0, text: a.text || '', dept: a.dept, agent: a.agent, run: a.status === 'running', by: a.by })),
    ...local.map(l => ({ at: l.at, text: l.text, dept: 'dir', local: true })),
  ].sort((a, b) => b.at - a.at).slice(0, 30);
  if (!items.length) { f.append(el('div', { class: 'empty', text: 'Qui vedi cosa fanno i reparti, in tempo reale.' })); return; }
  for (const it of items) {
    const d = deptOf(it.dept) || deptOf('dir'); const A = it.agent && agentOf(it.agent);
    f.append(el('div', { class: 'ev' + (it.run ? ' run' : ''), style: '--c:' + d.color },
      el('span', { class: 'w', text: A ? A.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : d.name.slice(0, 2) }),
      el('b', { text: it.text }), el('span', { text: ago(it.at) + (it.by === 'session' ? ' · sessione Claude' : '') + ' · ' + d.name })));
  }
}
