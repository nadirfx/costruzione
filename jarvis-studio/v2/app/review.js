// Revisione: player, note al secondo con marcatori sulla barra, versioni, approva / richiedi modifiche, export.
import { S, $, el, toast, tc, now, writeErr, feed, blobUrl, STATUS } from './state.js';
let api, unNotes = null, notes = [], selVer = null, notesFor = null;
const video = () => $('revVideo');

export function init(a) {
  api = a;
  video().addEventListener('timeupdate', () => { $('noteTc').textContent = 'a ' + tc(video().currentTime); const d = video().duration; $('revProg').style.width = (d ? video().currentTime / d * 100 : 0) + '%'; });
  video().addEventListener('loadedmetadata', renderMarks);
  $('revScrub').addEventListener('click', (e) => { const r = e.currentTarget.getBoundingClientRect(); const d = video().duration; if (d) video().currentTime = (e.clientX - r.left) / r.width * d; });
  $('noteAdd').addEventListener('click', addNote);
}
function cur() { return api.curP(); }
function list() { return S.projects.filter(p => (p.versions || []).length); }
export function enter() {
  if (!cur() || !(cur().versions || []).length) { const first = list().find(p => p.status === 'revisione') || list()[0]; if (first) api.setCur(first.id); }
  subscribe(); render();
}
export function refresh() { if (S.room === 'review') { subscribe(); render(); } }
export function leave() { video().pause(); }
function subscribe() {
  const p = cur(); if (!p || !S.db) return;
  if (notesFor === p.id) return; notesFor = p.id; selVer = null;
  if (unNotes) unNotes(); notes = [];
  unNotes = S.db.collection('projects/' + p.id + '/notes').onSnapshot((s) => { notes = s.docs.map(d => ({ id: d.id, ...d.data() })); renderNotes(); renderMarks(); }, () => { });
}
function versions(p) { return (p.versions || []).slice().sort((a, b) => a.v - b.v); }
function curVer(p) { const vs = versions(p); return vs.find(v => v.v === selVer) || vs[vs.length - 1] || null; }
function render() {
  const items = $('revItems'); items.replaceChildren();
  const L = list();
  if (!L.length) items.append(el('div', { class: 'empty', text: 'Nessun video da revisionare. Quando un export è pronto compare qui.' }));
  for (const p of L) items.append(el('button', { class: 'mission', type: 'button', 'aria-current': String(p.id === S.cur), onclick: () => { api.setCur(p.id); subscribe(); render(); } },
    el('span', { class: 'fmt ' + p.format, text: p.format }), el('span', { class: 't', text: p.title || '' }), el('span', { class: 'm' }, el('span', { class: 'st ' + p.status, text: STATUS[p.status] || '' }))));
  const p = cur(); const v = p && curVer(p);
  $('revTitle').textContent = p ? (p.title || 'Revisione') : 'Revisione';
  $('revSt').replaceChildren(p ? el('span', { class: 'st ' + p.status, text: STATUS[p.status] || '' }) : '');
  const vs = $('revVers'); vs.replaceChildren();
  if (p) for (const x of versions(p)) vs.append(el('button', { class: 'chip', type: 'button', 'aria-pressed': String(v && x.v === v.v), onclick: () => { selVer = x.v; render(); } }, 'v' + x.v + (x.label ? ' · ' + x.label : '')));
  const src = v && v.assetId ? blobUrl(v.assetId) : '';
  if (video().getAttribute('src') !== src) { if (src) video().src = src; else video().removeAttribute('src'); }
  const acts = $('revActs'); acts.replaceChildren();
  if (p && v) {
    acts.append(el('button', { class: 'btn pri sm', type: 'button', onclick: () => exportVer(p, v) }, 'Esporta'));
    if (S.canWrite && p.status !== 'approvato') acts.append(el('button', { class: 'btn ok sm', type: 'button', onclick: () => setStatus(p, 'approvato', 'Approvato. Pronto da esportare.') }, 'Approva'));
    if (S.canWrite && p.status !== 'lavorazione') acts.append(el('button', { class: 'btn warn sm', type: 'button', onclick: () => setStatus(p, 'lavorazione', 'Modifiche richieste: Jarvis legge le tue note.') }, 'Richiedi modifiche'));
    acts.append(el('button', { class: 'btn sm', type: 'button', onclick: () => api.go('editor') }, 'Apri in editor'));
    if (v.master && /^https:\/\//.test(v.master)) acts.append(el('a', { class: 'btn sm', href: v.master, target: '_blank', rel: 'noopener' }, 'Master HD'));
  }
  $('noteAdd').disabled = !(p && v && S.canWrite);
  renderNotes(); renderMarks();
}
function renderMarks() {
  const bar = $('revScrub'); bar.querySelectorAll('i').forEach(i => i.remove());
  const p = cur(); const v = p && curVer(p); const d = video().duration; if (!d || !v) return;
  for (const n of notes) if (!n.done && (n.v == null || n.v === v.v)) bar.append(el('i', { style: { left: Math.min(100, (n.t || 0) / d * 100) + '%' }, title: n.text }));
}
function renderNotes() {
  const box = $('noteList'); box.replaceChildren();
  const p = cur(); const v = p && curVer(p);
  const mine = notes.filter(n => !v || n.v == null || n.v === v.v).sort((a, b) => (a.t || 0) - (b.t || 0));
  if (!mine.length) { box.append(el('div', { class: 'empty', text: v ? 'Nessuna nota su questa versione.' : 'Le note compariranno qui.' })); return; }
  for (const n of mine) box.append(el('div', { class: 'note' + (n.done ? ' done' : '') },
    el('button', { class: 'chip', type: 'button', title: 'Vai a questo punto', onclick: () => { video().currentTime = n.t || 0; video().pause(); } }, tc(n.t)),
    el('div', { class: 'tx', text: n.text || '' }),
    S.canWrite ? el('button', { class: 'chip', type: 'button', 'aria-pressed': String(!!n.done), onclick: () => toggleNote(n) }, n.done ? 'Fatto' : 'Da fare') : null));
}
async function addNote() {
  const p = cur(); const v = p && curVer(p); const text = $('noteIn').value.trim(); if (!p || !v || !text) return;
  const b = $('noteAdd'); b.disabled = true;
  try { await S.db.collection('projects/' + p.id + '/notes').add({ t: Math.round(video().currentTime * 10) / 10, text: text.slice(0, 2000), v: v.v, done: false, createdAt: now() }); $('noteIn').value = ''; toast('Nota salvata'); feed('Nota a ' + tc(video().currentTime) + ' su ' + p.title); if (p.status === 'approvato') await setStatus(p, 'revisione'); }
  catch (e) { toast(writeErr(e)); } finally { b.disabled = false; }
}
async function toggleNote(n) { try { await S.db.doc('projects/' + cur().id + '/notes/' + n.id).update({ done: !n.done }); } catch (e) { toast(writeErr(e)); } }
async function setStatus(p, st, msg) { try { await S.db.doc('projects/' + p.id).update({ status: st, updatedAt: now() }); if (msg) toast(msg); feed(STATUS[st] + ' · ' + p.title); } catch (e) { toast(writeErr(e)); } }
async function exportVer(p, v) {
  if (!S.downloads) { toast('Export non disponibile in questa vista: apri Jarvis da browser o computer.'); return; }
  try {
    const r = await fetch(blobUrl(v.assetId)); if (!r.ok) throw { code: 'fetch' };
    const blob = await r.blob(); const base = v.filename || ((p.title || 'video').normalize('NFKD').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase() + '-v' + v.v);
    const res = await S.downloads.save({ filename: base + '.mp4', data: blob }); if (res.status === 'saved') toast('Salvato: ' + base + '.mp4');
  } catch (e) { const c = e && e.code; toast(c === 'declined' ? 'Export annullato.' : c === 'rate_limited' ? 'Un salvataggio è già in corso.' : c === 'fetch' ? 'Non riesco a leggere il video: usa Master HD.' : 'Export non riuscito.'); }
}
