// Jarvis Studio — bootstrap, router, data subscription, Hub.
import { S, $, el, toast, tc, now, store, writeErr, emit, on, feed, STATUS, FORMAT , plain } from './state.js';
import * as Brief from './brief.js';
import * as Editor from './editor.js';
import * as Review from './review.js';
import * as Lib from './lib.js';
import * as Jarvis from './jarvis.js';
import * as Exporter from './exporter.js';

const ROOMS = { hub: null, brief: Brief, editor: Editor, review: Review, lib: Lib };
const NEEDS_MISSION = { brief: true, editor: true };
let core = null, coreLoading = false;

/* ---------- boot ---------- */
function boot() {
  const lines = ['> JARVIS STUDIO v2.0', '> collegamento al nucleo dati…', '> moduli: hub · briefing · editor · revisione · libreria', '> motore di render pronto', '> benvenuto.'];
  const seen = sessionStorage && (() => { try { return sessionStorage.getItem('jv.boot'); } catch (e) { return null; } })();
  const box = $('boot');
  if (seen || matchMedia('(prefers-reduced-motion: reduce)').matches) { box.remove(); return; }
  let i = 0; const log = $('bootLog'), bar = $('bootBar');
  const step = () => { if (!box.isConnected) return; if (i < lines.length) { log.textContent += lines[i] + '\n'; bar.style.width = ((i + 1) / lines.length * 100) + '%'; i++; setTimeout(step, 260); } else { setTimeout(close, 300); } };
  const close = () => { try { sessionStorage.setItem('jv.boot', '1'); } catch (e) { } box.classList.add('gone'); setTimeout(() => box.remove(), 600); };
  $('bootSkip').addEventListener('click', close);
  step();
}

/* ---------- router ---------- */
export function go(room, opts = {}) {
  if (!(room in ROOMS)) room = 'hub';
  if (NEEDS_MISSION[room] && !curP()) { toast('Scegli o crea prima una missione.'); room = 'hub'; }
  const prev = S.room;
  if (prev && prev !== room && ROOMS[prev] && ROOMS[prev].leave) ROOMS[prev].leave();
  S.room = room;
  document.querySelectorAll('.room').forEach(r => r.classList.toggle('on', r.id === 'v-' + room));
  document.querySelectorAll('#tabs button').forEach(b => b.setAttribute('aria-current', b.dataset.room === room ? 'page' : 'false'));
  if (location.hash !== '#' + room && !opts.fromHash) { try { history[prev ? 'pushState' : 'replaceState'](null, '', '#' + room); } catch (e) { location.hash = room; } }
  if (room === 'hub') { ensureCore(); core && core.start(); } else if (core) core.stop();
  if (ROOMS[room] && ROOMS[room].enter) ROOMS[room].enter(opts);
  if (room === 'editor') Jarvis.enterEditor();
}
window.addEventListener('hashchange', () => { const r = location.hash.slice(1); if (r && r !== S.room) go(r, { fromHash: true }); });
window.addEventListener('popstate', () => { const r = location.hash.slice(1) || 'hub'; if (r !== S.room) go(r, { fromHash: true }); });
document.querySelectorAll('#tabs button').forEach(b => b.addEventListener('click', () => go(b.dataset.room)));

export function curP() { return S.projects.find(p => p.id === S.cur) || null; }
export function setCur(id) { S.cur = id; store.set('cur', id || ''); emit('cur', id); renderMissions(); }

/* ---------- clock + system light ---------- */
function clock() { const d = new Date(); $('clockT').textContent = d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) + ' · ' + d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }).toUpperCase(); }
setInterval(clock, 15000); clock();
export function sys(state, txt) { const d = $('sysDot'); d.className = 'dot' + (state === 'off' ? ' off' : state === 'busy' ? ' busy' : ''); $('sysTxt').textContent = txt; }

/* ---------- hub ---------- */
function renderMissions() {
  const list = $('missionList'); list.replaceChildren();
  $('missionCount').textContent = S.projects.length + ' missioni';
  if (!S.db) { list.append(el('div', { class: 'empty', text: 'Dati non disponibili in questa vista. Apri Jarvis su claude.ai.' })); return; }
  if (!S.projects.length) { list.append(el('div', { class: 'empty', text: 'Nessuna missione. Scegli un formato qui sotto per crearne una.' })); return; }
  for (const p of S.projects) {
    const n = (p.versions || []).length;
    list.append(el('button', { class: 'mission', type: 'button', 'aria-current': String(p.id === S.cur), onclick: () => openMission(p.id) },
      el('span', { class: 'fmt ' + p.format, text: p.format }),
      el('span', { class: 't', text: p.title || 'Missione senza titolo' }),
      el('span', { class: 'm' }, el('span', { class: 'st ' + p.status, text: STATUS[p.status] || p.status }), n ? (n + (n === 1 ? ' versione' : ' versioni')) : 'nessun video')));
  }
}
function renderStats() {
  const s = $('hubStats'); s.replaceChildren();
  const c = (k) => S.projects.filter(p => p.status === k).length;
  [['revisione', 'Da revisionare'], ['lavorazione', 'In lavorazione'], ['approvato', 'Approvate'], ['brief', 'In briefing']].forEach(([k, l]) => s.append(el('div', { class: 'stat' }, el('span', { class: 'lbl', text: l }), el('b', { text: String(c(k)) }))));
}
const feedItems = [];
on('feed', (f) => { feedItems.unshift(f); feedItems.length = Math.min(feedItems.length, 30); renderFeed(); });
function renderFeed() {
  const f = $('feed'); f.replaceChildren();
  const items = feedItems.length ? feedItems : S.projects.slice(0, 8).map(p => ({ text: (STATUS[p.status] || '') + ' · ' + (p.title || ''), at: Date.parse(p.updatedAt || '') || 0 }));
  if (!items.length) { f.append(el('div', { class: 'empty', text: 'Qui vedi cosa fa Jarvis, in tempo reale.' })); return; }
  for (const it of items) f.append(el('div', { class: 'ev' }, el('span', { class: 'mono', text: it.at ? new Date(it.at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) + '  ' : '' }), el('b', { text: it.text })));
}
export function openMission(id) {
  setCur(id); core && core.highlight(id);
  const p = curP(); if (!p) return;
  if (p.status === 'revisione' || p.status === 'approvato') go('review'); else if ((p.versions || []).length || p.hasEdit) go('editor'); else go('brief');
}
async function createMission(fmt) {
  if (!S.db) { toast('Dati non disponibili in questa vista.'); return; }
  if (!S.canWrite) { toast('Non hai i permessi per creare missioni.'); return; }
  const n = S.projects.filter(p => p.format === fmt).length + 1;
  try {
    const ref = await S.db.collection('projects').add({ title: `Missione ${fmt}-${String(n).padStart(2, '0')}`, format: fmt, status: 'brief', aspect: fmt === 'A' ? '16:9' : '9:16', goal: '', duration: '', cta: '', hook: '', brief: '', versions: [], createdAt: now(), updatedAt: now() });
    feed(`Nuova missione ${fmt} creata`);
    S.cur = ref.id; store.set('cur', ref.id);
    // the list snapshot may land after this; wait for it briefly so the briefing room has the doc
    for (let i = 0; i < 40 && !curP(); i++) await new Promise(r => setTimeout(r, 50));
    go('brief', { fresh: true });
  } catch (e) { toast(writeErr(e)); }
}
document.querySelectorAll('.door').forEach(d => d.addEventListener('click', () => createMission(d.dataset.fmt)));

async function ensureCore() {
  if (core || coreLoading) return; coreLoading = true;
  try { const m = await import('./core3d.js'); core = m.createCore($('core'), $('coreLabels'), { onPick: openMission }); if (core) { core.setMissions(S.projects); if (S.room === 'hub') core.start(); } else $('coreHint').textContent = 'Grafica 3D non disponibile su questo dispositivo'; }
  catch (e) { console.warn('core3d', e); $('coreHint').textContent = 'Grafica 3D non disponibile su questo dispositivo'; }
  coreLoading = false;
}
on('projects', () => { renderMissions(); renderStats(); renderFeed(); core && core.setMissions(S.projects); });
document.addEventListener('visibilitychange', () => { if (!core) return; if (document.hidden) core.stop(); else if (S.room === 'hub') core.start(); });

/* ---------- runtime ---------- */
async function initRuntime() {
  const c = window.claude;
  if (!c || !c.use) { sys('off', 'Offline'); renderMissions(); return; }
  const names = ['db', 'user', 'assets', 'downloads', 'sample', 'dictation', 'tts'];
  const got = await Promise.all(names.map(n => c.use(n).catch(() => null)));
  names.forEach((n, i) => S[n] = got[i]);
  emit('caps');
  if (!S.db) { sys('off', 'Dati non disponibili'); renderMissions(); return; }
  try { const w = S.user && await S.user.can('data.write'); if (w === false) S.canWrite = false; } catch (e) { }
  try { S.uid = S.user && await S.user.id(); } catch (e) { }
  sys('busy', 'Sincronizzo');
  const timer = setTimeout(() => sys('off', 'Dati non raggiungibili'), 10000);
  let first = true;
  S.db.collection('projects').orderBy('updatedAt', 'desc').onSnapshot((snap) => {
    if (!snap.metadata.fromCache) { clearTimeout(timer); sys('ok', 'Online'); }
    S.projects = snap.docs.map(d => ({ id: d.id, ...plain(d.data()) }));
    if (first) { first = false; const saved = store.get('cur'); if (saved && S.projects.some(p => p.id === saved)) S.cur = saved;
      if (pendingRoom) { const r = pendingRoom; pendingRoom = null; if (curP()) setTimeout(() => go(r, { fromHash: true }), 0); else { try { history.replaceState(null, '', '#hub'); } catch (e) { } } } }
    emit('projects');
    if (first === false && S.room && ROOMS[S.room] && ROOMS[S.room].refresh) ROOMS[S.room].refresh();
  }, (e) => { clearTimeout(timer); sys('off', 'Dati non disponibili'); });
}

/* ---------- start ---------- */
boot();
for (const m of [...Object.values(ROOMS), Jarvis, Exporter]) if (m && m.init) m.init({ go, curP, setCur, sys });
const startRoom = (location.hash || '#hub').slice(1);
var pendingRoom = startRoom in ROOMS && NEEDS_MISSION[startRoom] ? startRoom : null;
go(startRoom in ROOMS && !NEEDS_MISSION[startRoom] ? startRoom : 'hub', { fromHash: true, quiet: !!pendingRoom });
initRuntime();
window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.getElementById('boot')) document.getElementById('bootSkip').click(); });
