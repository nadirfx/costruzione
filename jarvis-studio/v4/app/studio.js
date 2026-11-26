// Studio: the 3D studio of departments, live activity, the reel of missions in production.
import { S, $, el, on } from './state.js';
import { DEPTS, AGENTS, STAGES, deptOf, agentOf, stageOf } from './org.js';
import { missionCard } from './cards.js';
import * as Agents from './agents.js';

let api, core = null, loading = false;
const local = []; // feed events produced in this browser
export function init(a) {
  api = a;
  document.querySelectorAll('.door').forEach(d => d.addEventListener('click', () => api.createMission(d.dataset.fmt)));
  $('toBoard').addEventListener('click', () => api.go('prod'));
  on('projects', render); on('activity', () => { renderFeed(); paintWork(); spark(); }); on('agents', paintWork);
  on('feed', (f) => { local.unshift(f); local.length = Math.min(local.length, 30); renderFeed(); });
  on('drawer', (k) => core && core.select(k));
  setupFullscreen();
  setInterval(() => { if (S.room === 'studio' && !document.hidden) { ticker(); spark(); } }, 4000);
  document.addEventListener('visibilitychange', () => { if (!core) return; if (document.hidden) core.stop(); else if (S.room === 'studio') core.start(); });
}
export function enter() { ensureCore(); core && core.start(); render(); }
export function leave() { core && core.stop(); }
export function refresh() { render(); }

function deptInfo(k) {
  const work = Agents.workMap(); const ags = AGENTS.filter(a => a.dept === k); const busy = ags.filter(a => work[a.key]);
  return { busy: busy.length > 0, text: busy.length ? busy.map(a => a.name).join(', ') + ' al lavoro' : ags.length + (ags.length === 1 ? ' agente' : ' agenti') + ' · pronti' };
}
function paintWork() {
  const work = Agents.workMap(); const active = S.projects.filter(p => !['approvato'].includes(stageOf(p))).length;
  core && core.setWork(work, active ? 0.35 : 0);
  const n = Object.keys(work).length; const k = $('kpiWork'); if (k) k.textContent = String(n);
  renderAgents(work); setRing('kpiWorkRing', n / AGENTS.length);
}
function renderAgents(work) {
  const box = $('stAgents'); if (!box) return; box.replaceChildren();
  for (const a of AGENTS) { const d = deptOf(a.dept); const on = !!work[a.key];
    box.append(el('div', { class: 'ag' + (on ? ' on' : ''), style: '--c:' + d.color, title: a.role }, el('i'), el('span', { text: a.name }), el('em', { text: on ? 'LAVORA' : 'PRONTO' }))); }
  $('stAgTot').textContent = Object.keys(work).length + ' / ' + AGENTS.length + ' attivi';
}
const CIRC = 2 * Math.PI * 21;
function ring(v, l, id, frac, c) {
  const k = el('div', { class: 'kpi', style: c ? '--c:' + c : null });
  k.innerHTML = '<div class="rg"><svg viewBox="0 0 52 52" aria-hidden="true"><circle class="bg" cx="26" cy="26" r="21"/><circle class="fg" cx="26" cy="26" r="21" stroke-dasharray="' + CIRC.toFixed(1) + '" stroke-dashoffset="' + CIRC.toFixed(1) + '"' + (id ? ' id="' + id + 'Ring"' : '') + '/></svg><b></b></div><span></span>';
  const b = k.querySelector('b'); b.textContent = v; if (id) b.id = id; k.querySelector('span').textContent = l;
  requestAnimationFrame(() => { const fg = k.querySelector('.fg'); fg.style.strokeDashoffset = String(CIRC * (1 - Math.max(0, Math.min(1, frac)))); });
  return k;
}
function setRing(id, frac) { const r = $(id); if (r) r.style.strokeDashoffset = String(CIRC * (1 - Math.max(0, Math.min(1, frac)))); }
function renderPipe() {
  const P = S.projects; const box = $('stPipe'); box.replaceChildren(); const max = Math.max(1, ...STAGES.map(s => P.filter(p => stageOf(p) === s.key).length));
  for (const st of STAGES) { const n = P.filter(p => stageOf(p) === st.key).length; const d = deptOf(st.dept);
    const bar = el('div', { class: 'bar' }, el('i', { style: 'width:0%' }));
    box.append(el('div', { class: 'pipe', style: '--c:' + d.color }, el('span', { text: st.name }), bar, el('b', { text: String(n) })));
    requestAnimationFrame(() => { bar.firstChild.style.width = (n / max * 100) + '%'; }); }
  $('stPipeTot').textContent = P.length + (P.length === 1 ? ' missione' : ' missioni');
}
function spark() {
  const svg = $('stSpark'); if (!svg) return; const H = 12, now = Date.now(), b = new Array(H).fill(0);
  for (const a of Agents.activity) { const t = Date.parse(a.at || ''); if (!t) continue; const i = H - 1 - Math.floor((now - t) / 3600000); if (i >= 0 && i < H) b[i]++; }
  const mx = Math.max(1, ...b), pts = b.map((v, i) => [i / (H - 1) * 240, 38 - v / mx * 32]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  svg.innerHTML = '<defs><linearGradient id="spk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3FD0FF" stop-opacity=".45"/><stop offset="1" stop-color="#3FD0FF" stop-opacity="0"/></linearGradient></defs>' +
    b.map((v, i) => '<rect x="' + (i * 20 + 4) + '" y="' + (38 - v / mx * 32).toFixed(1) + '" width="12" height="' + (v / mx * 32).toFixed(1) + '"/>').join('') +
    '<path class="a" d="' + line + ' L240 40 L0 40 Z"/><path class="l" d="' + line + '"/>';
}
let tick = 0;
function ticker() {
  const t = $('stTicker'); if (!t) return; const P = S.projects; const work = Agents.workMap();
  const lines = [
    'SYS OK · ' + P.length + ' MISSIONI · ' + Object.keys(work).length + ' AGENTI ATTIVI',
    ...P.slice(0, 6).map(p => (p.format || '?') + ' · ' + (p.title || 'Missione').toUpperCase() + ' · ' + (STAGES.find(s => s.key === stageOf(p)) || STAGES[0]).name.toUpperCase()),
  ];
  t.textContent = '▸ ' + lines[tick++ % lines.length];
  const c = $('stClock'); if (c) c.textContent = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
function setupFullscreen() {
  const b = $('fsBtn'); if (!b) return; const d = document, de = d.documentElement;
  const can = !!(d.fullscreenEnabled || d.webkitFullscreenEnabled) && !!(de.requestFullscreen || de.webkitRequestFullscreen);
  b.hidden = !can; if (!can) return;
  const cur = () => d.fullscreenElement || d.webkitFullscreenElement;
  const sync = () => { b.textContent = cur() ? 'Esci da schermo intero' : 'Schermo intero'; };
  b.addEventListener('click', () => { try { if (cur()) (d.exitFullscreen || d.webkitExitFullscreen).call(d); else { const r = (de.requestFullscreen || de.webkitRequestFullscreen).call(de); if (r && r.catch) r.catch(() => { }); } } catch (e) { } });
  d.addEventListener('fullscreenchange', sync); d.addEventListener('webkitfullscreenchange', sync);
}
async function ensureCore() {
  if (core || loading) return; loading = true;
  try { const m = await import('./studio3d.js'); core = m.createStudio($('core'), $('coreLabels'), { onPick: (k) => Agents.openDrawer(k), deptInfo }); if (core) { paintWork(); if (S.room === 'studio') core.start(); } else $('coreHint').textContent = 'Grafica 3D non disponibile su questo dispositivo'; }
  catch (e) { console.warn('studio3d', e); $('coreHint').textContent = 'Grafica 3D non disponibile su questo dispositivo'; }
  loading = false;
}
function render() {
  const P = S.projects; const c = (f) => P.filter(f).length; const tot = Math.max(1, P.length);
  const prod = c(p => !['revisione', 'approvato'].includes(stageOf(p))), rev = c(p => stageOf(p) === 'revisione'), ok = c(p => stageOf(p) === 'approvato');
  const nw = Object.keys(Agents.workMap()).length;
  $('stKpis').replaceChildren(
    ring(String(prod), 'In produzione', null, prod / tot, '#3FD0FF'),
    ring(String(rev), 'Da revisionare', null, rev / tot, '#F2B54A'),
    ring(String(ok), 'Approvate', null, ok / tot, '#5BD38A'),
    ring(String(nw), 'Agenti al lavoro', 'kpiWork', nw / AGENTS.length, '#A99BFF'));
  $('stLine').textContent = `12 agenti in 6 reparti, ${P.length} ${P.length === 1 ? 'missione' : 'missioni'} nello studio. Ogni agente segue le skill dello studio.`;
  const list = $('missionList'); list.replaceChildren();
  if (!S.db) list.append(el('div', { class: 'empty', text: 'Dati non disponibili in questa vista. Apri Jarvis su claude.ai.' }));
  else if (!P.length) list.append(el('div', { class: 'empty', text: 'Nessuna missione. Scegli un formato a destra per iniziare la prima produzione.' }));
  for (const p of P) list.append(missionCard(p, { onOpen: (id) => api.openMission(id) }));
  renderPipe(); renderFeed(); paintWork(); spark(); ticker();
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
