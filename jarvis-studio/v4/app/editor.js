// Sala editor: multitrack timeline (V2 overlays/text/zoom · V1 main video · A1 voice · A2 sound effects),
// canvas preview that matches export, inspector, library, undo/redo, keyboard shortcuts.
import { S, $, el, toast, tc, uid, clamp, on, emit, feed, FORMAT } from './state.js';
import { E, openEdit, touch, flush, matById } from './proj.js';
import { drawFrame, timelineEnd, srcTime } from './render.js';
import * as M from './media.js';
import { posterUrl } from './player.js';
import { SFX, TEXT_STYLES, TRANSITIONS, ASPECTS, COLORS } from './data.js';

let api, pps = 70, T = 0, playing = false, playStart = 0, playT0 = 0, raf = 0, sel = null, libTab = 'mat';
const undo = [], redo = []; let lastUndoKey = '', lastUndoAt = 0;
const TRACKS = ['V2', 'V1', 'A1', 'A2'];
const FPS = 30;
let ctx = null, PW = 540, PH = 960, audioCtx = null, analyser = null, meterBuf = null;

export const ed = {}; // API used by Jarvis (filled below)

export function init(a) {
  api = a;
  ctx = $('preview').getContext('2d');
  $('playBtn').addEventListener('click', togglePlay);
  $('stepB').addEventListener('click', () => seek(T - 1 / FPS));
  $('stepF').addEventListener('click', () => seek(T + 1 / FPS));
  $('undoBtn').addEventListener('click', doUndo); $('redoBtn').addEventListener('click', doRedo);
  $('splitBtn').addEventListener('click', split); $('delBtn').addEventListener('click', del); $('dupBtn').addEventListener('click', dup);
  $('zoomIn').addEventListener('input', (e) => { const keep = T; pps = +e.target.value; renderTL(); scrollTo(keep); });
  $('safeBtn').addEventListener('click', (e) => { const on_ = e.currentTarget.getAttribute('aria-pressed') !== 'true'; e.currentTarget.setAttribute('aria-pressed', String(on_)); $('safeOv').hidden = !on_; layoutStage(); });
  document.querySelectorAll('#libTabs .chip').forEach(b => b.addEventListener('click', () => { libTab = b.dataset.lib; document.querySelectorAll('#libTabs .chip').forEach(x => x.setAttribute('aria-pressed', String(x === b))); renderLib(); }));
  $('ruler').addEventListener('pointerdown', rulerDown);
  for (const tr of document.querySelectorAll('.track')) {
    tr.addEventListener('pointerdown', (e) => { if (e.target === tr) { select(null); seek(xToT(e)); } });
    tr.addEventListener('dragover', (e) => { if (e.dataTransfer.types.includes('text/jv-mat')) e.preventDefault(); });
    tr.addEventListener('drop', (e) => { const id = e.dataTransfer.getData('text/jv-mat'); if (!id) return; e.preventDefault(); addMaterial(id, xToT(e), tr.dataset.track); });
  }
  window.addEventListener('keydown', keys);
  window.addEventListener('resize', () => { if (S.room === 'editor') layoutStage(); });
  on('edit', (d) => { if (S.room !== 'editor') return; if (d && d.remote) { M.pauseAll(); renderAll(); } });
  on('saveState', (s) => { $('saveState').textContent = s === 'saved' ? 'Salvato' : s === 'saving' ? 'Salvo…' : s === 'error' ? 'Non salvato' : 'Modifiche…'; });
}
const P = () => api.curP();
export function enter() {
  const p = P(); if (!p) return;
  openEdit(p.id);
  $('edFmt').className = 'fmt ' + p.format; $('edFmt').textContent = p.format; $('edTitle').textContent = p.title || 'Missione';
  const [w, h] = ASPECTS[p.aspect || '9:16'] || ASPECTS['9:16']; const s = 960 / Math.max(w, h); PW = Math.round(w * s); PH = Math.round(h * s);
  $('preview').width = PW; $('preview').height = PH;
  const ro = canEdit(); for (const id of ['aiBuild', 'splitBtn', 'delBtn', 'dupBtn', 'undoBtn', 'redoBtn']) $(id).disabled = !ro;
  renderAll(); layoutStage(); loop();
}
export function refresh() { if (S.room === 'editor') { const p = P(); if (p) $('edTitle').textContent = p.title || 'Missione'; } }
export function leave() { if (playing) togglePlay(); cancelAnimationFrame(raf); raf = 0; M.pauseAll(); flush(); }
const canEdit = () => S.canWrite && !!S.db;

/* ---------- geometry ---------- */
const tToX = (t) => t * pps;
function xToT(e) { const r = $('ruler').getBoundingClientRect(); return Math.max(0, (e.clientX - r.left) / pps); }
function layoutStage() {
  const box = $('stageBox').getBoundingClientRect(); const cv = $('preview');
  const s = Math.min(box.width / PW, box.height / PH); cv.style.width = Math.floor(PW * s) + 'px'; cv.style.height = Math.floor(PH * s) + 'px';
  const ov = $('safeOv'); if (!ov.hidden) { const r = cv.getBoundingClientRect(); const b = box; const top = r.top - b.top + r.height * (168 / 1920), bot = r.top - b.top + r.height * (1330 / 1920); Object.assign(ov.style, { left: (r.left - b.left + r.width * 0.05) + 'px', width: (r.width * 0.9) + 'px', top: top + 'px', height: (bot - top) + 'px' }); }
}
function scrollTo(t) { const sc = $('tlScroll'); const x = tToX(t) + 58; if (x < sc.scrollLeft + 40 || x > sc.scrollLeft + sc.clientWidth - 40) sc.scrollLeft = Math.max(0, x - sc.clientWidth / 3); }

/* ---------- undo ---------- */
function pushUndo(key = '') {
  const nowMs = Date.now(); if (key && key === lastUndoKey && nowMs - lastUndoAt < 900) { lastUndoAt = nowMs; return; }
  lastUndoKey = key; lastUndoAt = nowMs; undo.push(JSON.stringify(E.clips)); if (undo.length > 80) undo.shift(); redo.length = 0;
}
function doUndo() { if (!undo.length || !canEdit()) return; redo.push(JSON.stringify(E.clips)); E.clips = JSON.parse(undo.pop()); afterChange('undo'); }
function doRedo() { if (!redo.length || !canEdit()) return; undo.push(JSON.stringify(E.clips)); E.clips = JSON.parse(redo.pop()); afterChange('redo'); }
function afterChange(reason) { if (sel && !E.clips.some(c => c.id === sel)) sel = null; renderTL(); renderInspector(); touch(reason); draw(); updTc(); }

/* ---------- clips ---------- */
const clipById = (id) => E.clips.find(c => c.id === id);
function labelOf(c) {
  if (c.kind === 'text') return '“' + (c.text || '') + '”';
  if (c.kind === 'zoom') return 'Zoom ' + Math.round((c.zoom || 1.15) * 100) + '%';
  if (c.mat && c.mat.startsWith('sfx:')) { const s = SFX.find(x => x.key === c.mat.slice(4)); return '♪ ' + (s ? s.name : c.mat.slice(4)); }
  const m = matById(c.mat); return m ? m.name : 'materiale mancante';
}
function trackFor(kind) { return kind === 'audio' ? 'A1' : 'V1'; }
function fits(track, kind) { if (kind === 'text' || kind === 'zoom') return track === 'V2'; if (kind === 'audio') return track === 'A1' || track === 'A2'; return track === 'V1' || track === 'V2'; }
// A render made by the Claude session (a review version) becomes a material and lands on V1, so it can be cut and dressed here.
function importVersion(v) {
  if (!canEdit()) return;
  const m = { id: uid('m'), name: 'Render v' + v.v, kind: 'video', role: 'broll', status: 'ok', assetId: v.assetId, dur: +v.durationSec || 0, w: 1080, h: 1920, thumb: null, posterId: v.posterId || null, order: E.materials.length, fromVersion: v.v };
  E.materials.push(m); touch('materials');
  const end = E.clips.filter(c => c.track === 'V1').reduce((a, c) => Math.max(a, c.start + c.dur), 0);
  addMaterial(m.id, end); renderLib(); toast('Render v' + v.v + ' in timeline su V1');
}
function addMaterial(id, t, track) {
  if (!canEdit()) return; const m = matById(id); if (!m) return;
  const tr = track && fits(track, m.kind) ? track : trackFor(m.kind);
  pushUndo(); const c = mkClip({ track: tr, kind: m.kind, mat: m.id, start: t, dur: m.kind === 'image' ? 3 : Math.max(0.5, m.dur || 3), in: 0 });
  E.clips.push(c); select(c.id); afterChange('add'); return c;
}
function mkClip(o) { const c = { id: uid('c'), vol: 1, ...o }; c.start = Math.max(0, +(+c.start || 0).toFixed(3)); c.dur = Math.max(0.1, +(+c.dur || 1).toFixed(3)); return c; }
function select(id) { sel = id; document.querySelectorAll('.clip').forEach(x => x.classList.toggle('sel', x.dataset.id === id)); renderInspector(); }
function split() {
  const c = clipById(sel) || E.clips.find(c => c.track === 'V1' && T > c.start && T < c.start + c.dur); if (!c || !canEdit()) { toast('Metti il cursore dentro una clip per dividerla.'); return; }
  if (T <= c.start + 0.05 || T >= c.start + c.dur - 0.05) { toast('Sposta il cursore dentro la clip.'); return; }
  pushUndo(); const k = T - c.start; const b = { ...c, id: uid('c'), start: +T.toFixed(3), dur: +(c.dur - k).toFixed(3), in: +((c.in || 0) + k * (c.speed || 1)).toFixed(3), trans: 'none' }; c.dur = +k.toFixed(3);
  E.clips.push(b); select(b.id); afterChange('split');
}
function del() { const c = clipById(sel); if (!c || !canEdit()) return; pushUndo(); E.clips = E.clips.filter(x => x !== c); sel = null; afterChange('delete'); }
function dup() { const c = clipById(sel); if (!c || !canEdit()) return; pushUndo(); const d = { ...c, id: uid('c'), start: +(c.start + c.dur).toFixed(3) }; E.clips.push(d); select(d.id); afterChange('dup'); }

/* ---------- timeline render + drag/trim ---------- */
function renderAll() { renderTL(); renderLib(); renderInspector(); draw(); }
function renderTL() {
  const end = Math.max(20, timelineEnd(E.clips) + 8); const W = Math.ceil(end * pps);
  $('tlInner').style.width = (W + 58 + 20) + 'px';
  const ru = $('ruler'); ru.replaceChildren(); ru.style.width = W + 'px';
  const step = pps > 120 ? 0.5 : pps > 50 ? 1 : 2; const lab = pps > 120 ? 1 : pps > 50 ? 5 : 10;
  for (let t = 0; t <= end; t = +(t + step).toFixed(3)) { const major = Math.abs(t / lab - Math.round(t / lab)) < 1e-6; ru.append(el('span', { class: 'tk', style: { left: tToX(t) + 'px', height: major ? '100%' : '40%' }, text: major ? tc(t) : '' })); }
  // overlapping clips on one track are packed into lanes so nothing hides behind anything else
  const lane = new Map(), lanesOf = {};
  for (const tr of TRACKS) { const ends = []; for (const c of E.clips.filter(c => c.track === tr).sort((a, b) => a.start - b.start)) { let i = ends.findIndex(e => e <= c.start + 1e-3); if (i < 0) { i = ends.length; ends.push(0); } ends[i] = c.start + c.dur; lane.set(c.id, i); } lanesOf[tr] = Math.max(1, ends.length); }
  for (const trEl of document.querySelectorAll('.track')) { trEl.querySelectorAll('.clip').forEach(x => x.remove()); trEl.style.width = W + 'px'; const n = lanesOf[trEl.dataset.track] || 1; trEl.style.height = (n > 1 ? 8 + n * 22 : 40) + 'px'; }
  for (const c of E.clips) {
    const trEl = document.querySelector(`.track[data-track="${c.track}"]`); if (!trEl) continue;
    const n = lanesOf[c.track] || 1, li = lane.get(c.id) || 0;
    const d = el('div', { class: 'clip ' + c.track + (c.id === sel ? ' sel' : ''), 'data-id': c.id, title: labelOf(c), style: { left: tToX(c.start) + 'px', width: Math.max(6, c.dur * pps) + 'px', ...(n > 1 ? { top: (4 + li * 22) + 'px', bottom: 'auto', height: '20px', lineHeight: '14px' } : {}) } },
      c.trans && c.trans !== 'none' ? el('span', { class: 'tr', title: 'Transizione: ' + c.trans }) : null, labelOf(c),
      el('span', { class: 'hd l' }), el('span', { class: 'hd r' }));
    d.addEventListener('pointerdown', (e) => clipDown(e, c, d));
    trEl.append(d);
  }
  placeHead();
}
function placeHead() { $('playhead').style.left = (58 + tToX(T)) + 'px'; }
function snapPoints(except) { const pts = [0, T]; for (const c of E.clips) if (c.id !== except) pts.push(c.start, c.start + c.dur); return pts; }
function snap(v, pts) { const th = 8 / pps; let best = v, bd = th; for (const p of pts) { const d = Math.abs(p - v); if (d < bd) { bd = d; best = p; } } return best; }
function clipDown(e, c, d) {
  e.stopPropagation(); select(c.id); if (!canEdit()) return;
  const mode = e.target.classList.contains('l') ? 'l' : e.target.classList.contains('r') ? 'r' : 'move';
  const x0 = e.clientX, y0 = e.clientY, s0 = c.start, d0 = c.dur, in0 = c.in || 0; const pts = snapPoints(c.id); let moved = false, newTrack = c.track;
  const srcMax = (() => { const m = matById(c.mat); return m && m.kind !== 'image' && m.dur ? m.dur : Infinity; })();
  d.setPointerCapture(e.pointerId);
  const mv = (ev) => {
    const dt = (ev.clientX - x0) / pps; if (!moved && Math.abs(ev.clientX - x0) + Math.abs(ev.clientY - y0) < 3) return;
    if (!moved) { moved = true; pushUndo(); }
    if (mode === 'move') {
      let ns = Math.max(0, s0 + dt); const se = snap(ns + c.dur, pts) - c.dur; const ss = snap(ns, pts); ns = Math.abs(ss - ns) <= Math.abs(se - ns) ? ss : se; c.start = Math.max(0, +ns.toFixed(3));
      const over = document.elementsFromPoint(ev.clientX, ev.clientY).find(x => x.classList && x.classList.contains('track'));
      if (over && over.dataset.track !== newTrack && fits(over.dataset.track, c.kind)) { newTrack = over.dataset.track; over.append(d); d.className = 'clip ' + newTrack + ' sel'; }
    } else if (mode === 'r') { let ne = snap(s0 + d0 + dt, pts); c.dur = clamp(+(ne - c.start).toFixed(3), 0.1, (srcMax - in0) / (c.speed || 1)); }
    else { let ns = snap(s0 + dt, pts); ns = clamp(ns, Math.max(0, s0 - in0 / (c.speed || 1)), s0 + d0 - 0.1); c.in = +(in0 + (ns - s0) * (c.speed || 1)).toFixed(3); c.dur = +(s0 + d0 - ns).toFixed(3); c.start = +ns.toFixed(3); }
    d.style.left = tToX(c.start) + 'px'; d.style.width = Math.max(6, c.dur * pps) + 'px'; draw();
  };
  const up = () => { d.removeEventListener('pointermove', mv); d.removeEventListener('pointerup', up); d.removeEventListener('pointercancel', up); if (moved) { c.track = newTrack; afterChange('drag'); } };
  d.addEventListener('pointermove', mv); d.addEventListener('pointerup', up); d.addEventListener('pointercancel', up);
}
function rulerDown(e) { seek(xToT(e)); const ru = $('ruler'); ru.setPointerCapture(e.pointerId); const mv = (ev) => seek(xToT(ev)); const up = () => { ru.removeEventListener('pointermove', mv); ru.removeEventListener('pointerup', up); }; ru.addEventListener('pointermove', mv); ru.addEventListener('pointerup', up); }

/* ---------- library ---------- */
function renderLib() {
  const box = $('libBody'); box.replaceChildren();
  if (libTab === 'mat') {
    const mats = E.materials.filter(m => !m.status || m.status === 'ok');
    const vers = ((P() || {}).versions || []).filter(v => v.assetId && !E.materials.some(m => m.assetId === v.assetId)).sort((a, b) => b.v - a.v);
    if (!mats.length && !vers.length) box.append(el('div', { class: 'empty' }, 'Nessun materiale. ', el('button', { class: 'btn sm', type: 'button', onclick: () => api.go('brief') }, 'Caricali nel Briefing')));
    for (const v of vers) box.append(el('div', { class: 'libItem verImp' },
      el('div', { class: 'th', text: 'v' + v.v }),
      el('div', { style: { minWidth: 0 } }, el('div', { class: 'nm', text: 'Render v' + v.v + (v.label ? ' · ' + v.label : '') }), el('div', { class: 'lbl', text: (v.durationSec ? Math.round(v.durationSec) + ' s · ' : '') + 'dalla revisione' })),
      el('button', { class: 'btn sm pri', type: 'button', 'aria-label': 'Importa il render v' + v.v + ' nella timeline', disabled: !canEdit(), onclick: () => importVersion(v) }, 'Importa')));
    for (const m of mats) {
      const it = el('div', { class: 'libItem', draggable: 'true', title: 'Trascina sulla timeline o premi +' },
        m.thumb || m.posterId ? el('img', { class: 'th', src: m.thumb || posterUrl(m), alt: '' }) : el('div', { class: 'th', text: m.kind === 'audio' ? 'AUDIO' : m.kind.toUpperCase() }),
        el('div', { style: { minWidth: 0 } }, el('div', { class: 'nm', text: m.name }), el('div', { class: 'lbl', text: (m.dur ? m.dur.toFixed(1) + ' s · ' : '') + (m.role || m.kind) })),
        el('button', { class: 'btn sm', type: 'button', 'aria-label': 'Aggiungi ' + m.name + ' al cursore', disabled: !canEdit(), onclick: () => addMaterial(m.id, T) }, '+'));
      it.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/jv-mat', m.id); e.dataTransfer.effectAllowed = 'copy'; });
      box.append(it);
    }
  } else if (libTab === 'txt') {
    const fmt = (P() || {}).format;
    for (const s of TEXT_STYLES) box.append(el('button', { class: 'libItem', type: 'button', disabled: !canEdit(), onclick: () => addText({ style: s.key, text: s.key === 'caption' ? 'Scrivi qui il *sottotitolo*' : s.key === 'label' ? 'NON È UNA NOTIZIA REALE' : 'Parola', sub: s.key === 'keyword' ? '' : undefined, color: s.key === 'keyword' ? 'red' : 'white', y: s.key === 'label' ? 0.14 : s.key === 'caption' ? 0.72 : 0.62 }) },
      el('div', { class: 'th', text: 'Aa' }), el('div', { style: { minWidth: 0, textAlign: 'left' } }, el('div', { class: 'nm', text: s.name }), el('div', { class: 'lbl', text: s.desc })), el('span', { class: 'btn sm' }, '+')));
    box.append(el('button', { class: 'btn sm', type: 'button', disabled: !canEdit(), onclick: () => addZoom(T, 0.7, fmt === 'C' ? 1.2 : 1.12) }, '+ Zoom a scatto al cursore'));
  } else if (libTab === 'trn') {
    const c = clipById(sel);
    box.append(el('div', { class: 'lbl', text: c && c.track === 'V1' ? 'Si applica all\'inizio della clip selezionata' : 'Seleziona una clip sulla traccia V1' }));
    for (const t of TRANSITIONS) box.append(el('button', { class: 'btn sm', type: 'button', disabled: !(c && c.track === 'V1') || !canEdit(), onclick: () => { pushUndo(); c.trans = t.key; afterChange('trans'); } }, t.name));
    box.append(el('button', { class: 'btn sm warn', type: 'button', disabled: !canEdit(), onclick: () => { pushUndo(); E.clips.filter(x => x.track === 'V1' && x.start > 0.05).forEach(x => x.trans = 'window'); afterChange('trans-all'); toast('Finestra applicata a tutti i tagli'); } }, 'Finestra su tutti i tagli'));
  } else if (libTab === 'sfx') {
    for (const s of SFX) box.append(el('div', { class: 'libItem' }, el('div', { class: 'th', text: '♪' }), el('div', { style: { minWidth: 0 } }, el('div', { class: 'nm', text: s.name }), el('div', { class: 'lbl', text: s.use })),
      el('button', { class: 'btn sm', type: 'button', disabled: !s.assetId || !canEdit(), 'aria-label': 'Aggiungi ' + s.name, onclick: () => addSfx(s.key, T) }, '+')));
  }
}
function addText(o, at = T) { if (!canEdit()) return; pushUndo(); const c = mkClip({ track: 'V2', kind: 'text', start: at, dur: o.dur || 2, ...o }); E.clips.push(c); select(c.id); afterChange('text'); return c; }
function addZoom(at, dur, z) { if (!canEdit()) return; pushUndo(); const c = mkClip({ track: 'V2', kind: 'zoom', start: at, dur, zoom: z }); E.clips.push(c); select(c.id); afterChange('zoom'); return c; }
function addSfx(key, at, vol = 0.8) { if (!canEdit()) return; const s = SFX.find(x => x.key === key); if (!s) return; pushUndo(); const c = mkClip({ track: 'A2', kind: 'audio', mat: 'sfx:' + key, start: at, dur: s.dur, vol }); E.clips.push(c); select(c.id); afterChange('sfx'); return c; }

/* ---------- inspector ---------- */
function field(label, input) { return el('label', {}, el('span', { text: label }), input); }
function num(c, key, min, max, step, fmt = (v) => v) { const i = el('input', { type: 'number', min, max, step, value: String(+(c[key] ?? (key === 'vol' ? 1 : key === 'zoom' ? 1 : 0)).toFixed(3)) }); i.addEventListener('input', () => { const v = parseFloat(i.value); if (!isFinite(v)) return; pushUndo('f:' + c.id + key); c[key] = clamp(v, min, max); afterChangeSoft(); }); return i; }
function sel_(c, key, opts, def) { const s = el('select', {}, opts.map(([k, v]) => { const o = el('option', { value: k, text: v }); if (String(c[key] ?? def) === k) o.selected = true; return o; })); s.addEventListener('change', () => { pushUndo(); c[key] = key === 'speed' ? +s.value : s.value; afterChange('insp'); }); return s; }
function txt(c, key, multi) { const i = el(multi ? 'textarea' : 'input', { rows: multi ? 2 : undefined }); i.value = c[key] || ''; i.addEventListener('input', () => { pushUndo('f:' + c.id + key); c[key] = i.value.slice(0, 300); afterChangeSoft(); }); return i; }
let softT = 0; function afterChangeSoft() { draw(); clearTimeout(softT); softT = setTimeout(() => { renderTL(); touch('insp'); }, 350); }
function renderInspector() {
  const box = $('inspBody'); box.replaceChildren(); const c = clipById(sel);
  if (!c) { box.append(el('div', { class: 'empty', text: 'Seleziona una clip nella timeline.' })); return; }
  const ro = !canEdit();
  box.append(el('div', { class: 'row' }, el('span', { class: 'chip', text: c.track }), el('b', { text: labelOf(c) })));
  box.append(field('Inizio (s)', num(c, 'start', 0, 3600, 0.05)), field('Durata (s)', num(c, 'dur', 0.1, 3600, 0.05)));
  if (c.kind === 'text') {
    box.append(field('Testo', txt(c, 'text', true)));
    if ((c.style || 'keyword') === 'keyword') box.append(field('Riga piccola', txt(c, 'sub')));
    box.append(field('Stile', sel_(c, 'style', TEXT_STYLES.map(s => [s.key, s.name]), 'keyword')), field('Colore', sel_(c, 'color', Object.keys(COLORS).map(k => [k, k]), 'red')), field('Posizione verticale (0–1)', num(c, 'y', 0.05, 0.95, 0.01)));
    if (c.style === 'caption') box.append(el('div', { class: 'lbl', text: 'Metti *asterischi* attorno alla parola chiave' }));
  } else if (c.kind === 'zoom') box.append(field('Zoom (1.0–1.6)', num(c, 'zoom', 1, 1.6, 0.01)));
  else {
    if (c.track === 'V1') box.append(field('Transizione in entrata', sel_(c, 'trans', TRANSITIONS.map(t => [t.key, t.name]), 'none')), field('Zoom base', num(c, 'zoom', 1, 2, 0.01)), field('Adattamento', sel_(c, 'fit', [['cover', 'Riempi'], ['contain', 'Intero']], 'cover')));
    if (c.track === 'V2') box.append(field('Scala (0.1–1)', num(c, 'scale', 0.1, 1, 0.01)), field('Posizione verticale (0–1)', num(c, 'y', 0.05, 0.95, 0.01)));
    if (c.kind === 'video' || c.kind === 'audio') box.append(field('Volume (0–1.5)', num(c, 'vol', 0, 1.5, 0.05)), field('Inizio nel file (s)', num(c, 'in', 0, 3600, 0.05)));
    if (c.kind === 'video') box.append(field('Velocità', sel_(c, 'speed', [['0.5', '0.5×'], ['1', '1×'], ['1.5', '1.5×'], ['2', '2×']], '1')));
    if (c.kind !== 'audio') { const kb = el('input', { type: 'checkbox' }); kb.checked = !!c.kenburns; kb.style.width = 'auto'; kb.addEventListener('change', () => { pushUndo(); c.kenburns = kb.checked; afterChange('kb'); }); box.append(el('label', { class: 'row' }, kb, el('span', { text: 'Carrellata lenta (Ken Burns)' }))); }
  }
  box.append(el('div', { class: 'row' }, el('button', { class: 'btn sm', type: 'button', onclick: split, disabled: ro }, 'Dividi'), el('button', { class: 'btn sm', type: 'button', onclick: dup, disabled: ro }, 'Duplica'), el('button', { class: 'btn sm danger', type: 'button', onclick: del, disabled: ro }, 'Elimina')));
  if (ro) box.querySelectorAll('input,select,textarea').forEach(x => x.disabled = true);
}

/* ---------- playback ---------- */
function ensureAudio() {
  if (audioCtx) return; try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); analyser = audioCtx.createAnalyser(); analyser.fftSize = 1024; analyser.connect(audioCtx.destination); meterBuf = new Float32Array(analyser.fftSize); } catch (e) { audioCtx = null; }
}
const routed = new WeakSet();
function route(elx) { if (!audioCtx || routed.has(elx) || elx instanceof HTMLImageElement) return; try { audioCtx.createMediaElementSource(elx).connect(analyser); routed.add(elx); } catch (e) { routed.add(elx); } }
function togglePlay() {
  playing = !playing; $('playBtn').textContent = playing ? 'Pausa' : 'Play';
  if (playing) { ensureAudio(); audioCtx && audioCtx.resume && audioCtx.resume().catch(() => { }); const end = timelineEnd(E.clips); if (T >= end - 0.05) T = 0; playStart = performance.now(); playT0 = T; }
  else M.pauseAll();
  syncMedia(true);
}
export function seek(t) { T = clamp(t, 0, Math.max(0, timelineEnd(E.clips) + 5)); if (playing) { playStart = performance.now(); playT0 = T; } placeHead(); syncMedia(true); draw(); updTc(); }
function updTc() { $('tcLbl').textContent = tc(T, true) + ' / ' + tc(timelineEnd(E.clips), true); }
function syncMedia(force) {
  const want = new Map(); // key -> {clip,t}
  for (const c of E.clips) { if (!c.mat || c.kind === 'image' || c.kind === 'text' || c.kind === 'zoom') continue; if (T >= c.start && T < c.start + c.dur) want.set(c.mat, c); }
  for (const c of E.clips) if (c.mat && (c.kind === 'image' || c.kind === 'video')) M.get(c.mat);
  for (const [key, e] of M.all()) {
    const c = want.get(key); const elx = e.el; if (!elx.pause) continue;
    if (!c) { if (!elx.paused) elx.pause(); continue; }
    if (audioCtx) route(elx);
    const st = srcTime(c, T); elx.playbackRate = c.speed || 1;
    elx.volume = clamp((c.vol ?? 1) * (c.track === 'V2' ? 0 : 1), 0, 1);
    if (playing) { if (elx.paused) { if (Math.abs(elx.currentTime - st) > 0.05) elx.currentTime = st; elx.play().catch(() => { }); } else if (Math.abs(elx.currentTime - st) > 0.25) elx.currentTime = st; }
    else if (force || Math.abs(elx.currentTime - st) > 0.04) { if (!elx.paused) elx.pause(); if (elx.readyState >= 1) elx.currentTime = st; }
  }
}
function draw() { if (!ctx) return; drawFrame(ctx, PW, PH, T, E.clips, M.media); }
function loop() {
  cancelAnimationFrame(raf);
  const tick = (now) => {
    if (S.room !== 'editor') return;
    if (playing) { T = playT0 + (now - playStart) / 1000; const end = timelineEnd(E.clips); if (T >= end) { T = end; togglePlay(); } placeHead(); syncMedia(false); updTc(); if (T > 0) scrollTo(T); }
    if (!document.body.classList.contains('exporting')) draw();
    if (analyser && playing) { analyser.getFloatTimeDomainData(meterBuf); let s = 0; for (const v of meterBuf) s += v * v; const db = 20 * Math.log10(Math.sqrt(s / meterBuf.length) + 1e-7); $('meter').textContent = 'Livello ' + (db < -60 ? '—' : db.toFixed(0) + ' dB'); }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick); updTc();
}
function keys(e) {
  if (S.room !== 'editor') return; const tag = (e.target.tagName || '').toLowerCase(); if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
  const k = e.key.toLowerCase();
  if (k === ' ') { e.preventDefault(); togglePlay(); }
  else if (k === 's' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); split(); }
  else if (k === 'delete' || k === 'backspace') { e.preventDefault(); del(); }
  else if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); e.shiftKey ? doRedo() : doUndo(); }
  else if ((e.ctrlKey || e.metaKey) && k === 'd') { e.preventDefault(); dup(); }
  else if (k === 'arrowleft') { e.preventDefault(); seek(T - (e.shiftKey ? 1 : 1 / FPS)); }
  else if (k === 'arrowright') { e.preventDefault(); seek(T + (e.shiftKey ? 1 : 1 / FPS)); }
  else if (k === 'home') seek(0);
}

/* ---------- API for Jarvis (live editing) ---------- */
Object.assign(ed, {
  get T() { return T; }, canEdit, pushUndo, select, seek, draw, renderTL, afterChange, renderLib,
  clipById, labelOf, mkClip, fits,
  clipRect(id) { const d = document.querySelector(`.clip[data-id="${id}"]`); return d ? d.getBoundingClientRect() : null; },
  trackRect(track) { const d = document.querySelector(`.track[data-track="${track}"]`); return d ? d.getBoundingClientRect() : null; },
  timeX(t) { const r = $('ruler').getBoundingClientRect(); return r.left + tToX(t); },
  reveal(t) { scrollTo(t); },
  born(id) { const d = document.querySelector(`.clip[data-id="${id}"]`); if (d) { d.classList.remove('born'); void d.offsetWidth; d.classList.add('born'); } },
  stop() { if (playing) togglePlay(); },
  get playing() { return playing; },
});
