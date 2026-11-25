// Jarvis live editing. Claude (in the page via `sample`, or a Claude session writing to projects/<id>/state/live)
// streams one JSON operation per line; each operation is applied to the timeline as it arrives, animated.
import { S, $, el, toast, tc, on, feed, emit, now , plain } from './state.js';
import { E, touch, matById } from './proj.js';
import { ed } from './editor.js';
import { SFX, RULES, TEXT_STYLES, TRANSITIONS } from './data.js';
import { timelineEnd } from './render.js';

let api, ctl = null, queue = [], running = false, liveUnsub = null, liveFor = null, applied = 0, startedUndo = false;
const STEP_MS = 420;

export function init(a) {
  api = a;
  $('aiBuild').addEventListener('click', () => run('build'));
  $('aiSend').addEventListener('click', () => { const t = $('aiIn').value.trim(); if (t) { $('aiIn').value = ''; run('command', t); } });
  $('aiIn').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); $('aiSend').click(); } });
  $('aiStop').addEventListener('click', stop);
  on('cur', () => subscribeLive());
  on('projects', () => subscribeLive());
}
export function enterEditor() { subscribeLive(); if (!$('aiLog').children.length) log('say', 'Pronto. Premi “Jarvis, monta tu” o dammi un comando: lo vedi montare qui in diretta.'); }

function log(kind, text, strong) {
  const box = $('aiLog'); const row = el('div', { class: 'l ' + kind }, strong ? el('b', { text: strong + ' ' }) : null, text);
  box.append(row); while (box.children.length > 120) box.firstChild.remove(); box.scrollTop = box.scrollHeight;
}
function busy(on_) { $('aiDot').className = 'dot' + (on_ ? ' busy' : ''); $('aiStop').hidden = !on_; $('aiBuild').disabled = on_ || !ed.canEdit(); $('aiSend').disabled = on_; api.sys(on_ ? 'busy' : 'ok', on_ ? 'Jarvis monta' : 'Online'); }

/* ---------- prompt ---------- */
function prompt(mode, command) {
  const p = api.curP(); const r = RULES[p.format] || RULES.B;
  const mats = E.materials.filter(m => m.status === 'ok' || !m.status).map((m, i) => `[${m.id}] ${m.kind} · ruolo ${m.role || '-'} · ${m.dur ? m.dur.toFixed(2) + ' s' : 'immagine'} · ordine ${i + 1} · "${m.name}"`).join('\n') || '(nessuno)';
  const tl = E.clips.slice().sort((a, b) => a.start - b.start).map(c => `{id:"${c.id}", track:"${c.track}", ${c.kind === 'text' ? 'text:"' + (c.text || '').slice(0, 40) + '"' : 'what:"' + ed.labelOf(c).slice(0, 40) + '"'}, start:${c.start}, dur:${c.dur}${c.trans && c.trans !== 'none' ? ', trans:"' + c.trans + '"' : ''}}`).join('\n') || '(vuota)';
  return `Sei Jarvis, montatore video professionista. Monti la missione "${p.title}" formato ${p.format} (${r.name}), video ${p.aspect || '9:16'}.
REGOLE DEL FORMATO: ${r.rules.join('; ')}.
BRIEF: obiettivo="${p.goal || ''}", durata="${p.duration || ''}", gancio="${p.hook || ''}", CTA="${p.cta || ''}".
MATERIALI (usa SOLO questi id, nell'ordine dato quando ha senso):
${mats}
TIMELINE ATTUALE:
${tl}
SUONI disponibili (name): ${SFX.filter(s => s.assetId).map(s => s.key + ' (' + s.use + ')').join(', ') || 'nessuno'}.
STILI DI TESTO: ${TEXT_STYLES.map(s => s.key).join(', ')}. TRANSIZIONI: ${TRANSITIONS.map(t => t.key).join(', ')}. COLORI: red, lime, orange, white, gold, cyan.
TRACCE: V1 video/immagini principali (in sequenza, senza buchi), V2 testi/immagini sovrapposte/zoom, A1 voce/audio, A2 effetti sonori.
${mode === 'build' ? 'COMPITO: crea il primo montaggio completo da zero (se la timeline non è vuota, prima {"op":"clear"}). La voce (A1) parte a 0 e guida la durata; copri tutta la voce con V1 senza buchi; un testo sulle frasi chiave; uno zoom sugli impatti; un effetto sonoro sui tagli importanti, mai troppi.' : 'COMANDO DELL\'UTENTE: ' + command}
RISPONDI SOLO con OPERAZIONI, UNA PER RIGA, ognuna un oggetto JSON su una sola riga, nessun altro testo, nessun markdown. Operazioni possibili:
{"op":"say","text":"frase breve su cosa stai facendo"}
{"op":"clear"}
{"op":"add_clip","track":"V1|V2|A1|A2","mat":"<id materiale>","start":secondi,"dur":secondi,"in":secondi_nel_file,"trans":"none|fade|window|flash|whip|zoom","zoom":1.0,"kenburns":true}
{"op":"add_text","text":"...","sub":"riga piccola opzionale","style":"keyword|apple|caption|title|label","color":"red","start":s,"dur":s,"y":0.66}
{"op":"add_zoom","start":s,"dur":0.6,"scale":1.15}
{"op":"add_sfx","name":"whoosh","at":s,"vol":0.8}
{"op":"set","id":"<id clip>","start":s,"dur":s,"trans":"...","text":"...","vol":0.8}
{"op":"delete","id":"<id clip>"}
Inizia con un "say" e chiudi con un "say" che riassume. Tempi in secondi con al massimo 2 decimali.`;
}

/* ---------- run ---------- */
async function run(mode, command) {
  const p = api.curP(); if (!p || running) return;
  if (!ed.canEdit()) { toast('Non hai i permessi per modificare questa missione.'); return; }
  if (!S.sample) { toast('Jarvis non può montare in questa vista: apri l\'app su claude.ai.'); return; }
  if (!E.materials.some(m => m.status === 'ok' || !m.status) && mode === 'build') { toast('Carica prima i materiali nel Briefing.'); return; }
  ed.stop(); ctl = new AbortController(); busy(true); startedUndo = false; queue = [];
  log('op', mode === 'build' ? 'Analizzo brief e materiali…' : command, mode === 'build' ? 'JARVIS' : 'TU');
  feed(mode === 'build' ? 'Jarvis sta montando ' + p.title : 'Comando a Jarvis: ' + command.slice(0, 40));
  let pending = '', got = 0;
  const eat = (delta) => { const lines = (pending + delta).split('\n'); pending = lines.pop(); for (const l of lines) { const op = parse(l); if (op) { got++; enqueue(op); } } };
  try {
    await S.sample(prompt(mode, command), { cache: false, signal: ctl.signal, modelTier: mode === 'build' ? 'default' : 'quick', onText: ({ delta }) => eat(delta) });
    const op = parse(pending); if (op) { got++; enqueue(op); }
    if (!got) log('say', 'Non ho ricevuto operazioni valide: riprova con un comando più semplice.');
  } catch (e) {
    if (e && e.code !== 'cancelled') log('say', e.code === 'not_granted' ? 'Per montare devo poter usare Claude: consenti l\'accesso quando richiesto.' : e.code === 'rate_limited' ? 'Troppe richieste ora: riprova tra poco.' : 'Interrotto: ' + (e.code || 'errore') + '. Quello già montato resta (puoi annullare).');
  }
  await drain();
  busy(false); ctl = null;
}
function stop() { if (ctl) ctl.abort(); queue = []; }
function parse(line) { const s = (line || '').trim().replace(/^```\w*|```$/g, '').replace(/,$/, ''); if (!s.startsWith('{')) return null; try { const o = JSON.parse(s); return o && typeof o.op === 'string' ? o : null; } catch (e) { return null; } }
function enqueue(op) { queue.push(op); if (!running) pump(); }
let drainRes = null;
function drain() { return running || queue.length ? new Promise(r => drainRes = r) : Promise.resolve(); }
async function pump() {
  running = true;
  while (queue.length) { const op = queue.shift(); try { await apply(op); } catch (e) { log('l', 'Operazione saltata: ' + (e.message || e)); } }
  running = false; touch('jarvis'); hideCursor(); if (drainRes) { const r = drainRes; drainRes = null; r(); }
}

/* ---------- apply with animation ---------- */
const num = (v, d = 0) => { const n = Number(v); return isFinite(n) ? n : d; };
const wait = (ms) => new Promise(r => setTimeout(r, ms));
async function apply(op) {
  if (!startedUndo && op.op !== 'say') { ed.pushUndo(); startedUndo = true; }
  switch (op.op) {
    case 'say': log('say', String(op.text || '').slice(0, 300)); await wait(250); return;
    case 'clear': E.clips = []; ed.select(null); ed.renderTL(); ed.draw(); log('op', 'Svuoto la timeline', 'PULISCO'); await wait(STEP_MS); return;
    case 'add_clip': {
      const m = matById(String(op.mat)); if (!m) throw new Error('materiale ' + op.mat + ' non trovato');
      let track = String(op.track || ''); if (!ed.fits(track, m.kind)) track = m.kind === 'audio' ? 'A1' : 'V1';
      const start = Math.max(0, num(op.start)); const inn = Math.max(0, num(op.in));
      let dur = Math.max(0.2, num(op.dur, m.dur || 3)); if (m.kind !== 'image' && m.dur) dur = Math.min(dur, Math.max(0.2, m.dur - inn));
      const c = ed.mkClip({ track, kind: m.kind, mat: m.id, start, dur, in: inn, trans: TRANSITIONS.some(t => t.key === op.trans) ? op.trans : 'none', zoom: Math.min(2, Math.max(1, num(op.zoom, 1))), kenburns: !!op.kenburns });
      await fly(libPoint(m.id), c); E.clips.push(c); show(c, `${m.name} su ${track} a ${tc(start)}`, 'AGGIUNGO'); return;
    }
    case 'add_text': {
      const style = TEXT_STYLES.some(s => s.key === op.style) ? op.style : 'keyword';
      const c = ed.mkClip({ track: 'V2', kind: 'text', text: String(op.text || '').slice(0, 200), sub: op.sub ? String(op.sub).slice(0, 120) : undefined, style, color: String(op.color || (style === 'keyword' ? 'red' : 'white')), start: num(op.start), dur: Math.max(0.3, num(op.dur, 2)), y: Math.min(0.95, Math.max(0.05, num(op.y, style === 'caption' ? 0.72 : style === 'label' ? 0.14 : 0.62))) });
      await fly(null, c); E.clips.push(c); show(c, `“${c.text}” a ${tc(c.start)}`, 'TESTO'); return;
    }
    case 'add_zoom': { const c = ed.mkClip({ track: 'V2', kind: 'zoom', start: num(op.start), dur: Math.max(0.2, num(op.dur, 0.6)), zoom: Math.min(1.6, Math.max(1.02, num(op.scale, 1.15))) }); await fly(null, c); E.clips.push(c); show(c, `${Math.round(c.zoom * 100)}% a ${tc(c.start)}`, 'ZOOM'); return; }
    case 'add_sfx': {
      const s = SFX.find(x => x.key === String(op.name)); if (!s || !s.assetId) throw new Error('suono ' + op.name + ' non disponibile');
      const c = ed.mkClip({ track: 'A2', kind: 'audio', mat: 'sfx:' + s.key, start: num(op.at ?? op.start), dur: s.dur, vol: Math.min(1.2, Math.max(0, num(op.vol, 0.8))) });
      await fly(null, c); E.clips.push(c); show(c, `${s.name} a ${tc(c.start)}`, 'SUONO'); return;
    }
    case 'set': {
      const c = ed.clipById(String(op.id)); if (!c) throw new Error('clip ' + op.id + ' non trovata');
      if (op.start != null) c.start = Math.max(0, num(op.start, c.start)); if (op.dur != null) c.dur = Math.max(0.1, num(op.dur, c.dur));
      if (op.trans && TRANSITIONS.some(t => t.key === op.trans)) c.trans = op.trans; if (op.text != null && c.kind === 'text') c.text = String(op.text).slice(0, 200); if (op.vol != null) c.vol = Math.min(1.5, Math.max(0, num(op.vol, 1)));
      await fly(null, c); show(c, ed.labelOf(c), 'MODIFICO'); return;
    }
    case 'delete': { const c = ed.clipById(String(op.id)); if (!c) throw new Error('clip ' + op.id + ' non trovata'); await fly(null, c); E.clips = E.clips.filter(x => x !== c); ed.select(null); ed.renderTL(); ed.draw(); log('op', ed.labelOf(c), 'ELIMINO'); await wait(STEP_MS / 2); return; }
    default: throw new Error('operazione sconosciuta ' + op.op);
  }
}
function show(c, text, verb) { ed.renderTL(); ed.select(c.id); ed.born(c.id); ed.seek(c.start + Math.min(0.4, c.dur / 2)); log('op', text, verb); return wait(STEP_MS); }

/* ---------- cursor ---------- */
function libPoint(matId) { const items = [...document.querySelectorAll('#libBody .libItem')]; const i = E.materials.filter(m => !m.status || m.status === 'ok').findIndex(m => m.id === matId); const it = items[i]; if (!it) return null; const r = it.getBoundingClientRect(); return r.width ? { x: r.left + 20, y: r.top + r.height / 2 } : null; }
async function fly(from, c) {
  const cur = $('aiCursor'); if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  ed.reveal(c.start); await wait(30);
  const tr = ed.trackRect(c.track); if (!tr || !tr.width) return;
  const x = ed.timeX(c.start) + Math.min(30, c.dur * 10), y = tr.top + tr.height / 2 - 11;
  cur.style.opacity = '1';
  if (from) { cur.style.transition = 'none'; cur.style.left = from.x + 'px'; cur.style.top = from.y + 'px'; void cur.offsetWidth; cur.style.transition = ''; await wait(60); }
  cur.style.left = x + 'px'; cur.style.top = y + 'px'; await wait(460);
}
function hideCursor() { $('aiCursor').style.opacity = '0'; }

/* ---------- operations sent by a Claude session (projects/<id>/state/live) ---------- */
function subscribeLive() {
  const p = api.curP(); if (!S.db || !p) return; if (liveFor === p.id) return;
  if (liveUnsub) liveUnsub(); liveFor = p.id; applied = null;
  liveUnsub = S.db.doc('projects/' + p.id + '/state/live').onSnapshot((snap) => {
    const d = snap.exists ? plain(snap.data()) : null; if (!d) { applied = applied ?? 0; return; }
    if (d.message && d.message !== subscribeLive.lastMsg) { subscribeLive.lastMsg = d.message; feed('Jarvis (sessione): ' + String(d.message).slice(0, 80)); if (S.room === 'editor') log('say', String(d.message).slice(0, 300)); }
    const ops = Array.isArray(d.ops) ? d.ops : [];
    if (applied === null) applied = Number(d.applied || 0); // first read: anything already applied is skipped
    const fresh = ops.filter(o => Number(o.n) > applied).sort((a, b) => a.n - b.n);
    if (!fresh.length) return;
    if (S.room !== 'editor' || !E.loaded || E.pid !== p.id) { feed('Jarvis ha ' + fresh.length + ' modifiche pronte: apri l\'editor per vederle'); return; }
    applied = Math.max(...fresh.map(o => Number(o.n)));
    startedUndo = false; busy(true); log('op', 'Applico ' + fresh.length + ' modifiche dalla sessione', 'JARVIS');
    for (const o of fresh) enqueue(o);
    drain().then(() => { busy(false); if (ed.canEdit()) S.db.doc('projects/' + p.id + '/state/live').update({ applied, appliedAt: now() }).catch(() => { }); });
  }, () => { });
}
export function retryLive() { liveFor = null; subscribeLive(); }
