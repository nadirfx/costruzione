// Sala macchine: what a Claude session is doing right now on a mission, from projects/<id>/state/machine:
// { status, progress 0..1, steps:[{at, text, dept?, agent?}], code:{file, text, hot:[line numbers]}, preview:{assetId, kind, caption} }
import { S, $, el, on, blobUrl, plain } from './state.js';
import { deptOf, agentOf } from './org.js';
import { attach } from './player.js';

let api, unsub = null, subFor = null, seen = 0, lastPreview = '';
export function init(a) {
  api = a;
  $('mxMission').addEventListener('change', (e) => { api.setCur(e.target.value); subscribe(true); });
  on('projects', () => S.room === 'machine' && fillSelect());
  on('reconnect', () => { if (S.room === 'machine') subscribe(true); });
}
export function enter() { fillSelect(); subscribe(); }
export function leave() { const v = $('mxPreview').querySelector('video'); v && v.pause(); }
function fillSelect() {
  const s = $('mxMission'); const cur = api.curP(); s.replaceChildren(...S.projects.map(p => el('option', { value: p.id, text: (p.format ? p.format + ' · ' : '') + (p.title || 'Missione') })));
  if (!S.projects.length) s.append(el('option', { value: '', text: 'Nessuna missione' }));
  if (cur) s.value = cur.id;
}
function subscribe(force) {
  const p = api.curP(); if (!S.db || !p) { paint(null); return; } if (!force && subFor === p.id) return;
  subFor = p.id; seen = 0; lastPreview = ''; if (unsub) { try { unsub(); } catch (e) { } }
  try { unsub = S.db.doc('projects/' + p.id + '/state/machine').onSnapshot((snap) => paint(snap.exists ? plain(snap.data()) : null), () => { subFor = null; setTimeout(() => S.room === 'machine' && subscribe(), 4000); }); }
  catch (e) { subFor = null; }
}
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function hl(line) {
  // tiny highlighter for JS/HTML/Python: whole-line comments, strings, keywords, numbers (tokenised, never re-scanning markup)
  if (/^\s*(\/\/|#|\/\*|\*)/.test(line)) return '<span class="c">' + esc(line) + '</span>';
  const KW = /\b(const|let|var|function|return|if|else|for|while|import|from|export|async|await|new|class|def|in|of|true|false|null|None|True|False)\b|\b\d+(?:\.\d+)?\b/g;
  const code = (t) => { let o = '', last = 0; t.replace(KW, (m, kw, off) => { o += esc(t.slice(last, off)) + '<span class="' + (kw ? 'k' : 'n') + '">' + esc(m) + '</span>'; last = off + m.length; return m; }); return o + esc(t.slice(last)); };
  let out = '', last = 0; const STR = /(['"`])(?:\\.|(?!\1).)*\1/g; let m;
  while ((m = STR.exec(line))) { out += code(line.slice(last, m.index)) + '<span class="s2">' + esc(m[0]) + '</span>'; last = m.index + m[0].length; }
  return out + code(line.slice(last));
}
function paint(d) {
  const p = api.curP();
  const st = !d ? 'In attesa' : d.status === 'running' ? 'Al lavoro' : d.status === 'done' ? 'Finito' : d.status === 'error' ? 'Errore' : 'In attesa';
  const sEl = $('mxStatus'); sEl.textContent = st; sEl.className = 'st ' + (d && d.status === 'running' ? 'lavorazione' : d && d.status === 'done' ? 'approvato' : d && d.status === 'error' ? 'revisione' : '');
  $('mxProg').style.width = Math.round(Math.max(0, Math.min(1, (d && d.progress) || 0)) * 100) + '%';
  const log = $('mxLog'); const steps = (d && d.steps) || [];
  if (!steps.length) { log.replaceChildren(el('div', { class: 'empty', text: p ? 'Quando una sessione Claude lavora su "' + (p.title || 'questa missione') + '", qui compare ogni passaggio, in diretta.' : 'Scegli una missione da seguire.' })); seen = 0; }
  else {
    if (seen > steps.length || !log.querySelector('.s')) { log.replaceChildren(); seen = 0; }
    for (let i = seen; i < steps.length; i++) {
      const s = steps[i]; const dp = s.dept && deptOf(s.dept); const ag = s.agent && agentOf(s.agent);
      const t = s.at ? new Date(s.at) : null;
      log.append(el('div', { class: 's' + (seen ? ' new' : ''), style: dp ? '--c:' + dp.color : '' }, el('time', { text: t && !isNaN(t) ? t.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '' }), el('div', {}, (ag || dp) ? el('b', { text: (ag ? ag.name : dp.name) }) : null, s.text || '')));
    }
    seen = steps.length; log.scrollTop = log.scrollHeight;
  }
  $('mxCount').textContent = steps.length ? steps.length + (steps.length === 1 ? ' passaggio' : ' passaggi') : '';
  const code = (d && d.code) || null; const pre = $('mxCode');
  $('mxFile').textContent = code && code.file ? code.file : '';
  if (!code || !code.text) pre.replaceChildren(el('span', { class: 'ln', text: '// il codice delle scene compare qui mentre lo scrivo' }));
  else {
    const hot = new Set(code.hot || []); const lines = String(code.text).split('\n').slice(0, 1500);
    pre.innerHTML = lines.map((l, i) => '<span class="ln' + (hot.has(i + 1) ? ' hot' : '') + '">' + hl(l) + '</span>').join('');
    const first = pre.querySelector('.hot'); if (first) first.scrollIntoView({ block: 'center' });
  }
  const pv = (d && d.preview) || null; const box = $('mxPreview'); const key = pv ? (pv.assetId || '') + (pv.kind || '') : '';
  $('mxCap').textContent = pv && pv.caption ? pv.caption : '';
  if (key !== lastPreview) {
    lastPreview = key;
    if (!pv || !pv.assetId) box.replaceChildren(el('div', { class: 'empty', text: 'Nessuna anteprima ancora' }));
    else if (pv.kind === 'image') box.replaceChildren(el('img', { src: blobUrl(pv.assetId), alt: pv.caption || 'Anteprima' }));
    else { const v = el('video', { controls: true, playsinline: true, muted: true, loop: true, preload: 'auto' }); v.muted = true; box.replaceChildren(v); box.classList.add('vstage'); attach(v, { assetId: pv.assetId, posterId: pv.posterId }, { box, autoplay: true }); }
  }
}
