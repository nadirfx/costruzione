// Jarvis Studio 3 — bootstrap, router, live data with automatic reconnection, mission frame.
import { S, $, el, toast, now, store, writeErr, emit, on, feed, plain } from './state.js';
import * as Brief from './brief.js';
import * as Editor from './editor.js';
import * as Review from './review.js';
import * as Lib from './lib.js';
import * as Jarvis from './jarvis.js';
import * as Exporter from './exporter.js';
import * as Studio from './studio.js';
import * as Board from './board.js';
import * as Script from './script.js';
import * as Machine from './machine.js';
import * as Agents from './agents.js';
import * as Assistant from './assistant.js';
import { STAGES, deptOf, stageOf, stageIdx } from './org.js';

const ROOMS = { studio: Studio, prod: Board, brief: Brief, script: Script, editor: Editor, review: Review, machine: Machine, lib: Lib };
const TITLES = { studio: 'Studio', prod: 'Produzione', brief: 'Missione', script: 'Missione', editor: 'Missione', review: 'Revisione', machine: 'Sala macchine', lib: 'Libreria' };
const MISSION_ROOMS = ['brief', 'script', 'editor', 'review'];
const NEEDS_MISSION = { brief: true, script: true, editor: true };
const ALIAS = { hub: 'studio', mission: null };

/* ---------- boot ---------- */
function boot() {
  const lines = ['Accendo lo studio…', 'Reparti: Direzione · Scrittura · Motion · Suono · Montaggio · Qualità', '12 agenti pronti. Benvenuto.'];
  const seen = (() => { try { return sessionStorage.getItem('jv.boot'); } catch (e) { return null; } })();
  const box = $('boot');
  if (seen || matchMedia('(prefers-reduced-motion: reduce)').matches) { box.remove(); return; }
  let i = 0; const log = $('bootLog'), bar = $('bootBar');
  const step = () => { if (!box.isConnected) return; if (i < lines.length) { log.textContent = lines[i]; bar.style.width = ((i + 1) / lines.length * 100) + '%'; i++; setTimeout(step, 420); } else setTimeout(close, 300); };
  const close = () => { try { sessionStorage.setItem('jv.boot', '1'); } catch (e) { } box.classList.add('gone'); setTimeout(() => box.remove(), 650); };
  $('bootSkip').addEventListener('click', close);
  step();
}

/* ---------- router ---------- */
export function go(room, opts = {}) {
  if (room === 'mission') room = store.get('mroom') || 'brief';
  if (room in ALIAS && ALIAS[room]) room = ALIAS[room];
  if (!(room in ROOMS)) room = 'studio';
  if (NEEDS_MISSION[room] && !curP()) { if (!opts.quiet) toast('Scegli o crea prima una missione.'); room = 'studio'; }
  const prev = S.room;
  if (prev && prev !== room && ROOMS[prev] && ROOMS[prev].leave) ROOMS[prev].leave();
  S.room = room;
  if (MISSION_ROOMS.includes(room)) store.set('mroom', room);
  document.querySelectorAll('.room').forEach(r => r.classList.toggle('on', r.id === 'v-' + room));
  const navRoom = MISSION_ROOMS.includes(room) && room !== 'review' ? 'mission' : room === 'review' ? 'mission' : room;
  document.querySelectorAll('#nav button').forEach(b => b.setAttribute('aria-current', b.dataset.room === navRoom ? 'page' : 'false'));
  document.querySelectorAll('#mTabs button').forEach(b => b.setAttribute('aria-current', b.dataset.room === room ? 'page' : 'false'));
  $('roomTitle').textContent = TITLES[room];
  document.body.classList.toggle('inMission', MISSION_ROOMS.includes(room) && !!curP());
  if (location.hash !== '#' + room && !opts.fromHash) { try { history[prev ? 'pushState' : 'replaceState'](null, '', '#' + room); } catch (e) { location.hash = room; } }
  if (ROOMS[room] && ROOMS[room].enter) ROOMS[room].enter(opts);
  if (room === 'editor') Jarvis.enterEditor();
  renderFrame();
  emit('room', room);
}
window.addEventListener('hashchange', () => { const r = location.hash.slice(1); if (r && r !== S.room) go(r, { fromHash: true }); });
window.addEventListener('popstate', () => { const r = location.hash.slice(1) || 'studio'; if (r !== S.room) go(r, { fromHash: true }); });
document.querySelectorAll('#nav button, #mTabs button').forEach(b => b.addEventListener('click', () => go(b.dataset.room)));
$('ctxMission').addEventListener('click', () => go('prod'));

export function curP() { return S.projects.find(p => p.id === S.cur) || null; }
export function setCur(id) { S.cur = id; store.set('cur', id || ''); emit('cur', id); renderFrame(); }

/* ---------- mission frame: context chip + department track ---------- */
function renderFrame() {
  const p = curP();
  $('ctxFmt').className = 'fmt ' + (p ? p.format : 'none'); $('ctxFmt').textContent = p ? p.format : '–';
  $('ctxTitle').textContent = p ? (p.title || 'Missione') : 'Nessuna missione';
  document.body.classList.toggle('inMission', MISSION_ROOMS.includes(S.room) && !!p);
  if (!p) return;
  const st = stageOf(p), si = stageIdx(st);
  for (const box of document.querySelectorAll('.stageTrack')) {
    box.replaceChildren(...STAGES.map((s, i) => { const d = deptOf(s.dept);
      return el('button', { type: 'button', class: 'stp' + (i < si ? ' done' : i === si ? ' now' : ''), style: '--c:' + d.color, title: 'Apri ' + s.name, onclick: () => go(s.room) },
        el('b', { text: s.name }), el('span', { text: i < si ? 'fatto' : i === si ? d.name + ' al lavoro' : d.name })); }));
  }
}
export async function setStage(pid, stage, force = false) {
  const p = S.projects.find(x => x.id === pid); if (!p || !S.db) return;
  if (stageIdx(stage) <= stageIdx(stageOf(p)) && !force) return; // only forward unless forced
  try { await S.db.doc('projects/' + pid).update({ stage, updatedAt: now() }); } catch (e) { toast(writeErr(e)); }
}

/* ---------- clock + system light ---------- */
function clock() { const d = new Date(); $('clockT').textContent = d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) + ' · ' + d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }); }
setInterval(clock, 15000); clock();
export function sys(state, txt) { const d = $('sysDot'); d.className = 'dot' + (state === 'off' ? ' off' : state === 'busy' ? ' busy' : ''); $('sysTxt').textContent = txt; }

/* ---------- missions ---------- */
export function openMission(id, room) {
  setCur(id);
  const p = curP(); if (!p) return;
  if (room) { go(room); return; }
  const st = stageOf(p); const target = STAGES.find(s => s.key === st);
  go(target ? target.room : 'brief');
}
export async function createMission(fmt) {
  if (!S.db) { toast('Dati non disponibili in questa vista.'); return; }
  if (!S.canWrite) { toast('Non hai i permessi per creare missioni.'); return; }
  const n = S.projects.filter(p => p.format === fmt).length + 1;
  try {
    const ref = await S.db.collection('projects').add({ title: `Missione ${fmt}-${String(n).padStart(2, '0')}`, format: fmt, status: 'brief', stage: 'brief', aspect: fmt === 'A' ? '16:9' : '9:16', goal: '', duration: '', cta: '', hook: '', brief: '', versions: [], createdAt: now(), updatedAt: now() });
    feed(`Nuova missione ${fmt} creata`);
    S.cur = ref.id; store.set('cur', ref.id);
    for (let i = 0; i < 40 && !curP(); i++) await new Promise(r => setTimeout(r, 50));
    renderFrame(); go('brief', { fresh: true });
  } catch (e) { toast(writeErr(e)); }
}

/* ---------- live data: subscribe, and reconnect by itself if the link drops ---------- */
let unsubProjects = null, retry = 0, retryT = 0, pendingRoom = null;
function subscribeProjects() {
  if (unsubProjects) { try { unsubProjects(); } catch (e) { } unsubProjects = null; }
  sys('busy', retry ? 'Mi ricollego' : 'Sincronizzo');
  const timer = setTimeout(() => sys('off', 'Rete lenta, riprovo'), 10000);
  let first = !S.projects.length;
  try {
    unsubProjects = S.db.collection('projects').orderBy('updatedAt', 'desc').onSnapshot((snap) => {
      clearTimeout(timer); retry = 0; if (!snap.metadata || !snap.metadata.fromCache) sys('ok', 'Online');
      S.projects = snap.docs.map(d => ({ id: d.id, ...plain(d.data()) }));
      if (first) {
        first = false; const saved = store.get('cur'); if (saved && S.projects.some(p => p.id === saved)) S.cur = saved;
        if (pendingRoom) { const r = pendingRoom; pendingRoom = null; if (curP()) setTimeout(() => go(r, { fromHash: true }), 0); else { try { history.replaceState(null, '', '#studio'); } catch (e) { } } }
      }
      emit('projects'); renderFrame();
      if (S.room && ROOMS[S.room] && ROOMS[S.room].refresh) ROOMS[S.room].refresh();
    }, (e) => { clearTimeout(timer); reconnect(e); });
  } catch (e) { clearTimeout(timer); reconnect(e); }
}
function reconnect() {
  sys('off', 'Connessione persa, mi ricollego');
  clearTimeout(retryT); retry = Math.min(retry + 1, 6);
  retryT = setTimeout(() => { if (S.db) { subscribeProjects(); emit('reconnect'); } }, Math.min(30000, 1000 * 2 ** retry));
}
window.addEventListener('online', () => { if (S.db) { retry = 0; subscribeProjects(); emit('reconnect'); } });
window.addEventListener('offline', () => sys('off', 'Offline: le modifiche aspettano la rete'));

async function initRuntime() {
  const c = window.claude;
  if (!c || !c.use) { sys('off', 'Offline'); emit('projects'); return; }
  const names = ['db', 'user', 'assets', 'downloads', 'sample', 'dictation', 'tts'];
  const got = await Promise.all(names.map(n => c.use(n).catch(() => null)));
  names.forEach((n, i) => S[n] = got[i]);
  emit('caps');
  if (!S.db) { sys('off', 'Dati non disponibili'); emit('projects'); return; }
  try { const w = S.user && await S.user.can('data.write'); if (w === false) S.canWrite = false; } catch (e) { }
  try { S.uid = S.user && await S.user.id(); } catch (e) { }
  subscribeProjects();
}

/* ---------- start ---------- */
boot();
const API = { go, curP, setCur, sys, openMission, createMission, setStage };
for (const m of [...Object.values(ROOMS), Jarvis, Exporter, Agents, Assistant]) if (m && m.init) m.init(API);
let startRoom = (location.hash || '#studio').slice(1); if (startRoom === 'hub') startRoom = 'studio';
pendingRoom = startRoom in ROOMS && NEEDS_MISSION[startRoom] ? startRoom : null;
go(startRoom in ROOMS && !NEEDS_MISSION[startRoom] ? startRoom : 'studio', { fromHash: true, quiet: true });
initRuntime();
window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.getElementById('boot')) document.getElementById('bootSkip').click(); });
