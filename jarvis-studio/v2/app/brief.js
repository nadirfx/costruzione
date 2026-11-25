// Briefing: chat with Jarvis (fills the mission card), materials in sequence, format checklist.
import { S, $, el, toast, now, writeErr, feed, uid, emit, on, STATUS, FORMAT , plain } from './state.js';
import { E, openEdit, touch, flush } from './proj.js';
import { FORMAT_CHECK, RULES } from './data.js';
import { audioToContainer } from './audioconv.js';

let api, turns = [], chatFor = null, busy = null, saveT = null;
const MAX = 20 * 1024 * 1024;
const ROLES = { voce: 'Voce', facecam: 'Facecam', broll: 'B-roll', foto: 'Foto', logo: 'Logo', musica: 'Musica', sfx: 'Effetto' };

export function init(a) {
  api = a;
  $('chatSend').addEventListener('click', send);
  $('chatIn').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });
  for (const [id, key] of [['bTitle', 'title'], ['bGoal', 'goal'], ['bDur', 'duration'], ['bCta', 'cta'], ['bHook', 'hook'], ['bAspect', 'aspect']])
    $(id).addEventListener('input', () => { clearTimeout(saveT); saveT = setTimeout(() => saveFields({ [key]: $(id).value.trim() }), 600); renderCheck(); });
  $('matFile').addEventListener('change', (e) => { addFiles([...e.target.files]); e.target.value = ''; });
  const drop = $('matDrop');
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('over'); addFiles([...e.dataTransfer.files]); });
  $('toEditor').addEventListener('click', async () => { await flush(); api.go('editor'); });
  on('edit', () => { if (S.room === 'brief') { renderMats(); renderCheck(); } });
  on('caps', setupMic);
}
function p() { return api.curP(); }
export function enter(opts = {}) {
  const pr = p(); if (!pr) return;
  openEdit(pr.id);
  $('briefFmt').replaceChildren(el('span', { class: 'fmt ' + pr.format, text: pr.format }), ' ', el('span', { class: 'lbl', text: FORMAT[pr.format] || '' }));
  $('briefStatus').className = 'st ' + pr.status; $('briefStatus').textContent = STATUS[pr.status] || pr.status;
  const set = (id, v) => { if (document.activeElement !== $(id)) $(id).value = v || ''; };
  set('bTitle', pr.title); set('bGoal', pr.goal); set('bDur', pr.duration); set('bCta', pr.cta); set('bHook', pr.hook); $('bAspect').value = pr.aspect || '9:16';
  if (chatFor !== pr.id) loadChat(pr);
  $('matFile').disabled = !S.assets; $('matDrop').textContent = S.assets ? 'Trascina qui voce, video, foto e loghi nell\'ordine in cui vanno nel video (fino a 20 MB a file; i video più grandi li alleggerisco io)' : 'Il caricamento dei file è disponibile solo a chi può modificare Jarvis.';
  renderMats(); renderCheck();
}
export function refresh() { if (S.room === 'brief') enter(); }
export function leave() { clearTimeout(saveT); }

async function saveFields(patch) {
  const pr = p(); if (!pr || !S.db || !S.canWrite) return;
  try { await S.db.doc('projects/' + pr.id).update({ ...patch, updatedAt: now() }); } catch (e) { toast(writeErr(e)); }
}

/* ---------- chat ---------- */
function greeting(pr) {
  const g = { A: 'Missione A, luxury motion. Dimmi il brand, il prodotto e la sensazione che deve lasciare (es. "Apple, essenziale, potente"). Se hai foto o video del prodotto caricali a destra.',
    B: 'Missione B, faceless premium. Raccontami la notizia o l\'idea, il gancio dei primi secondi e chi parla (la tua voce o una voce AI). Carica la voce a destra appena ce l\'hai.',
    C: 'Missione C, creator. Dimmi di cosa parli e per chi. Carica la facecam e gli eventuali B-roll a destra, nell\'ordine giusto.' };
  return 'Ciao, sono Jarvis. ' + (g[pr.format] || g.B);
}
async function loadChat(pr) {
  chatFor = pr.id; turns = []; renderChat();
  if (!S.db) return;
  try { const d = await S.db.doc('projects/' + pr.id + '/state/chat').get(); if (chatFor !== pr.id) return; turns = (d.exists && plain(d.data()).turns) || []; } catch (e) { }
  renderChat();
}
function renderChat(streamText) {
  const log = $('chatLog'); log.replaceChildren();
  const pr = p(); if (!pr) return;
  log.append(el('div', { class: 'msg ai', text: greeting(pr) }));
  for (const t of turns) log.append(el('div', { class: 'msg ' + (t.role === 'user' ? 'me' : 'ai'), text: stripBrief(t.content) }));
  if (streamText !== undefined) log.append(el('div', { class: 'msg ai', text: stripBrief(streamText) || 'Sto pensando…' }));
  log.scrollTop = log.scrollHeight;
}
const stripBrief = (t) => (t || '').replace(/\n?BRIEF:\s*\{[\s\S]*$/, '').trim();
function rulesFor(pr) {
  const r = RULES[pr.format] || RULES.B;
  return `Sei Jarvis, il direttore creativo di uno studio video italiano. Stai facendo il briefing di una missione formato ${pr.format} (${r.name}).
Regole del formato: ${r.rules.join('; ')}.
Parla in italiano, frasi brevi e concrete, una o due domande alla volta, proponi idee forti (ganci, struttura, CTA).
Scheda attuale: titolo="${pr.title || ''}", obiettivo="${pr.goal || ''}", durata="${pr.duration || ''}", CTA="${pr.cta || ''}", gancio="${pr.hook || ''}", formato video="${pr.aspect || '9:16'}".
Materiali caricati: ${E.materials.map((m, i) => `${i + 1}. ${m.name} (${ROLES[m.role] || m.kind}${m.dur ? ', ' + m.dur.toFixed(1) + ' s' : ''})`).join('; ') || 'nessuno'}.
Alla fine di OGNI risposta aggiungi una riga che inizia con "BRIEF:" seguita da un oggetto JSON con i campi che hai capito o migliorato tra title, goal, duration, cta, hook (solo stringhe; ometti quelli non noti).`;
}
async function send() {
  const text = $('chatIn').value.trim(); const pr = p();
  if (!text || !pr || busy) return;
  if (!S.sample) { toast('Jarvis non può rispondere in questa vista: apri l\'app su claude.ai.'); return; }
  $('chatIn').value = ''; turns.push({ role: 'user', content: text.slice(0, 4000) }); renderChat('');
  busy = new AbortController(); $('chatSend').disabled = true;
  try {
    const input = [{ role: 'user', content: rulesFor(pr) }, ...turns.slice(-16)];
    const { text: out } = await S.sample(input, { cache: false, signal: busy.signal, onText: ({ text }) => renderChat(text) });
    turns.push({ role: 'assistant', content: out });
    const m = out.match(/BRIEF:\s*(\{[\s\S]*\})/);
    if (m) { try { const b = JSON.parse(m[1]); const patch = {}; for (const k of ['title', 'goal', 'duration', 'cta', 'hook']) if (typeof b[k] === 'string' && b[k].trim()) patch[k] = b[k].trim().slice(0, 200); if (Object.keys(patch).length) { await saveFields(patch); feed('Brief aggiornato da Jarvis'); } } catch (e) { } }
  } catch (e) {
    if (e && e.code !== 'cancelled') { turns.push({ role: 'assistant', content: (e.text ? e.text + '\n' : '') + chatErr(e.code) }); }
  } finally {
    busy = null; $('chatSend').disabled = false; renderChat();
    if (S.db && S.canWrite) S.db.doc('projects/' + pr.id + '/state/chat').set({ turns: turns.slice(-40), updatedAt: now() }).catch(() => { });
  }
}
function chatErr(c) { return c === 'not_granted' ? '(Per parlare con me devi consentire a Jarvis di usare Claude.)' : c === 'rate_limited' ? '(Troppe richieste: riprova tra poco.)' : '(Non sono riuscito a rispondere, riprova.)'; }

/* ---------- dictation ---------- */
function setupMic() {
  const d = S.dictation; if (!d) return;
  for (const [btnId, inId] of [['micBtn', 'chatIn'], ['aiMic', 'aiIn']]) {
    const b = $(btnId); b.hidden = false;
    b.addEventListener('click', () => {
      if (d.active()) { d.stop().catch(() => { }); return; }
      d.start().catch((e) => { if (e.code === 'not_granted' || e.code === 'unavailable') { $('micBtn').hidden = $('aiMic').hidden = true; } else if (e.code !== 'stopped' && e.code !== 'dismissed') toast('Microfono non disponibile ora.'); });
      d.__target = inId;
    });
  }
  d.onFinal(({ text }) => { const t = $(d.__target || 'chatIn'); t.value = (t.value ? t.value : '') + (t.value ? text : text.trimStart()); });
  d.onState(({ state }) => { for (const id of ['micBtn', 'aiMic']) $(id).textContent = state === 'idle' ? 'Mic' : 'Stop'; });
}

/* ---------- materials ---------- */
function kindOf(f) { return f.type.startsWith('video/') ? 'video' : f.type.startsWith('image/') ? 'image' : f.type.startsWith('audio/') ? 'audio' : null; }
async function probe(file, kind) {
  const url = URL.createObjectURL(file);
  try {
    if (kind === 'image') { const img = await new Promise((r, j) => { const i = new Image(); i.onload = () => r(i); i.onerror = j; i.src = url; }); return { w: img.naturalWidth, h: img.naturalHeight, dur: 0, thumb: thumbOf(img, img.naturalWidth, img.naturalHeight) }; }
    const m = document.createElement(kind === 'video' ? 'video' : 'audio'); m.muted = true; m.preload = 'auto'; m.src = url;
    await new Promise((r, j) => { m.onloadedmetadata = r; m.onerror = () => j(new Error('decode')); setTimeout(() => j(new Error('timeout')), 15000); });
    const info = { dur: isFinite(m.duration) ? m.duration : 0, w: m.videoWidth || 0, h: m.videoHeight || 0, thumb: null };
    if (kind === 'video') { m.currentTime = Math.min(0.5, info.dur / 2); await new Promise(r => { m.onseeked = r; setTimeout(r, 3000); }); info.thumb = thumbOf(m, info.w, info.h); }
    return info;
  } finally { setTimeout(() => URL.revokeObjectURL(url), 1000); }
}
function thumbOf(src, w, h) { try { const c = document.createElement('canvas'); const s = 96 / Math.max(w, h || 1); c.width = Math.max(1, Math.round(w * s)); c.height = Math.max(1, Math.round(h * s)); c.getContext('2d').drawImage(src, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', 0.6); } catch (e) { return null; } }
// Videos over 20 MB: re-record a light 720p copy in the browser (real time), sized to fit.
async function proxyOf(file, info, onProg) {
  if (typeof MediaRecorder === 'undefined') throw new Error('norec');
  const url = URL.createObjectURL(file); const v = document.createElement('video'); v.src = url; v.playsInline = true; v.muted = false; v.volume = 0.0001;
  await new Promise((r, j) => { v.onloadedmetadata = r; v.onerror = j; });
  const sc = Math.min(1, 720 / Math.min(v.videoWidth, v.videoHeight)); const c = document.createElement('canvas'); c.width = Math.round(v.videoWidth * sc / 2) * 2; c.height = Math.round(v.videoHeight * sc / 2) * 2;
  const g = c.getContext('2d'); const stream = c.captureStream(30);
  try { const as = v.captureStream ? v.captureStream().getAudioTracks() : []; as.forEach(t => stream.addTrack(t)); } catch (e) { }
  const bps = Math.max(600000, Math.min(4000000, (18 * 1024 * 1024 * 8) / Math.max(1, v.duration) - 128000));
  const type = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find(t => MediaRecorder.isTypeSupported(t));
  const rec = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: bps, audioBitsPerSecond: 96000 }); const chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise(r => rec.onstop = r);
  let raf; const draw = () => { g.drawImage(v, 0, 0, c.width, c.height); onProg && onProg(v.currentTime / (v.duration || 1)); if (!v.ended) raf = requestAnimationFrame(draw); };
  rec.start(1000); await v.play(); draw();
  await new Promise(r => v.onended = r); cancelAnimationFrame(raf); rec.stop(); await done; URL.revokeObjectURL(url);
  return new Blob(chunks, { type: 'video/webm' });
}
async function addFiles(files) {
  const pr = p(); if (!pr) return;
  if (!S.assets) { toast('Caricamento non disponibile in questa vista.'); return; }
  for (const f of files) {
    const kind = kindOf(f);
    if (!kind) { toast(f.name + ': formato non supportato (usa MP4, WebM, JPG, PNG, WebP, MP3, WAV).'); continue; }
    const m = { id: uid('m'), name: f.name.slice(0, 120), kind, role: kind === 'audio' ? 'voce' : kind === 'image' ? 'foto' : (pr.format === 'C' && !E.materials.some(x => x.role === 'facecam') ? 'facecam' : 'broll'), status: 'upload', size: f.size, order: E.materials.length };
    E.materials.push(m); renderMats();
    try {
      const info = await probe(f, kind); Object.assign(m, info);
      let blob = f, note = '';
      if (f.size > MAX) {
        if (kind !== 'video') throw { code: 'too_large' };
        m.status = 'proxy'; renderMats(); toast('File grande: creo una copia leggera in tempo reale (' + Math.round(info.dur) + ' s)…', 5000);
        blob = await proxyOf(f, info, (k) => { m.prog = k; renderMatRow(m); });
        if (blob.size > MAX) throw { code: 'too_large' };
        note = 'copia leggera'; m.proxy = true;
      }
      if (kind === 'audio') { m.status = 'proxy'; renderMats(); const conv = await audioToContainer(f, (k) => { m.prog = k; renderMatRow(m); }); blob = conv.blob; if (!m.dur) m.dur = conv.dur; if (blob.size > MAX) throw { code: 'too_large' }; }
      m.status = 'upload'; renderMats();
      const ty = blob.type === 'video/webm' || blob.type === 'video/mp4' ? blob.type : kind === 'video' ? (/webm/.test(f.type) ? 'video/webm' : 'video/mp4') : blob.type;
      const r = await S.assets.upload(blob, { type: ty });
      m.assetId = r.id; m.status = 'ok'; m.note = note; delete m.prog;
      feed('Materiale caricato: ' + m.name); touch('materials');
    } catch (e) {
      const c = e && e.code;
      E.materials = E.materials.filter(x => x !== m);
      toast(m.name + ': ' + (c === 'too_large' ? 'troppo grande anche dopo la compressione. Mettilo su Drive: il render finale lo faccio io.' : c === 'unsupported_type' ? 'tipo di file non accettato.' : c === 'quota_or_state' ? 'spazio esaurito.' : 'caricamento non riuscito.'), 5000);
      touch('materials');
    }
    renderMats(); renderCheck();
  }
}
function renderMatRow(m) { const row = document.querySelector(`[data-mat="${m.id}"] .nm`); if (row && m.prog != null) row.textContent = m.name + (m.kind === 'audio' ? ' · preparo l\'audio ' : ' · copia leggera ') + Math.round(m.prog * 100) + '%'; }
function renderMats() {
  const box = $('matList'); box.replaceChildren();
  if (!E.materials.length) { box.append(el('div', { class: 'empty', text: 'Nessun materiale. L\'ordine qui è la sequenza che Jarvis userà per montare.' })); return; }
  E.materials.forEach((m, i) => {
    const th = m.thumb ? el('img', { class: 'th', src: m.thumb, alt: '' }) : el('div', { class: 'th', text: m.kind === 'audio' ? 'AUDIO' : m.kind.toUpperCase() });
    const role = el('select', { 'aria-label': 'Ruolo di ' + m.name, onchange: (e) => { m.role = e.target.value; touch('materials'); renderCheck(); } }, Object.entries(ROLES).map(([k, v]) => { const o = el('option', { value: k, text: v }); if (k === m.role) o.selected = true; return o; }));
    role.style.width = 'auto';
    box.append(el('div', { class: 'mat', 'data-mat': m.id },
      el('span', { class: 'ord', text: String(i + 1) }), th,
      el('div', { style: { minWidth: 0 } }, el('div', { class: 'nm', text: m.name + (m.status === 'upload' ? ' · carico…' : m.status === 'proxy' ? (m.kind === 'audio' ? ' · preparo l\'audio…' : ' · copia leggera…') : '') }),
        el('div', { class: 'row' }, role, el('span', { class: 'lbl', text: (m.dur ? m.dur.toFixed(1) + ' s' : '') + (m.note ? ' · ' + m.note : '') }))),
      el('div', { class: 'row', style: { flexWrap: 'nowrap', gap: '4px' } },
        el('button', { class: 'btn sm', type: 'button', 'aria-label': 'Sposta su', disabled: i === 0 || m.status !== 'ok', onclick: () => move(i, -1) }, '↑'),
        el('button', { class: 'btn sm', type: 'button', 'aria-label': 'Sposta giù', disabled: i === E.materials.length - 1 || m.status !== 'ok', onclick: () => move(i, 1) }, '↓'),
        el('button', { class: 'btn sm danger', type: 'button', 'aria-label': 'Rimuovi ' + m.name, disabled: m.status !== 'ok', onclick: () => removeMat(m) }, '×'))));
  });
}
function move(i, d) { const a = E.materials; const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; a.forEach((m, k) => m.order = k); touch('materials'); renderMats(); }
function removeMat(m) {
  if (E.clips.some(c => c.mat === m.id)) { toast('Questo materiale è usato nella timeline: toglilo prima dalle clip.'); return; }
  E.materials = E.materials.filter(x => x !== m); touch('materials'); renderMats(); renderCheck();
}
function renderCheck() {
  const pr = p(); const box = $('briefCheck'); box.replaceChildren(); if (!pr) return;
  const v = (id) => $(id).value.trim();
  const has = (roles) => E.materials.some(m => roles.includes(m.role) && m.status === 'ok');
  const checks = {
    A: [v('bTitle') && v('bGoal'), /brand|marchio|prodotto/i.test(turns.map(t => t.content).join(' ') + v('bGoal') + v('bTitle')), !!v('bDur'), has(['broll', 'foto', 'logo', 'facecam']), !!v('bCta')],
    B: [v('bTitle') && v('bGoal'), !!v('bHook'), !!v('bDur'), has(['voce']), !!v('bCta')],
    C: [v('bTitle') && v('bGoal'), has(['facecam']), !!v('bDur'), has(['broll', 'foto']), !!v('bCta')],
  }[pr.format] || [];
  (FORMAT_CHECK[pr.format] || []).forEach((t, i) => box.append(el('li', { class: checks[i] ? 'ok' : '', text: t })));
}
