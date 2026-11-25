// The studio's agents. LLM agents write through `sample` (streamed live), check agents measure the timeline,
// the editor agent drives the live edit. Every run is logged in `activity` and saved in projects/<id>/agents/<key>.
import { S, $, el, toast, now, writeErr, emit, on, feed, plain } from './state.js';
import { AGENTS, DEPTS, SOUND_RULES, agentOf, deptOf, stageOf } from './org.js';
import { SKILLS } from './skills.gen.js';
import { RULES } from './data.js';

let api; const running = {}; // agentKey -> {pid, text}
export const outputs = {}; // pid -> {agentKey: {output, items, at, by}}
let unAct = null, unOut = null, outFor = null; export let activity = [];

export function init(a) {
  api = a;
  on('caps', subscribeActivity); on('reconnect', () => { subscribeActivity(); outFor = null; subscribeOutputs(); });
  on('cur', subscribeOutputs); on('projects', subscribeOutputs);
  $('drwClose').addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });
}
function subscribeActivity() {
  if (!S.db) return; if (unAct) { try { unAct(); } catch (e) { } }
  try {
    unAct = S.db.collection('activity').orderBy('at', 'desc').limit(40).onSnapshot((s) => { activity = s.docs.map(d => ({ id: d.id, ...plain(d.data()) })); emit('activity', activity); }, () => setTimeout(subscribeActivity, 4000));
  } catch (e) { setTimeout(subscribeActivity, 4000); }
}
function subscribeOutputs() {
  const p = api && api.curP(); if (!S.db || !p || outFor === p.id) return;
  outFor = p.id; if (unOut) { try { unOut(); } catch (e) { } }
  try {
    unOut = S.db.collection('projects/' + p.id + '/agents').onSnapshot((s) => { const m = {}; for (const d of s.docs) m[d.id] = plain(d.data()); outputs[p.id] = m; emit('agentOutputs', p.id); }, () => { outFor = null; setTimeout(subscribeOutputs, 4000); });
  } catch (e) { outFor = null; }
}
// which agents are working right now: local runs + runs logged by a Claude session in the last 10 minutes
export function workMap() {
  const m = {}; for (const k in running) m[k] = 1;
  const fresh = Date.now() - 10 * 60 * 1000;
  for (const a of activity) if (a.status === 'running' && Date.parse(a.at || '') > fresh && a.agent) m[a.agent] = 1;
  return m;
}
export const isRunning = (k) => !!running[k];

/* ---------- prompts ---------- */
function skill(key) { const s = SKILLS.find(x => x.key === key); return s ? s.text : ''; }
async function scriptOf(pid) { try { const d = await S.db.doc('projects/' + pid + '/state/script').get(); return d.exists ? (plain(d.data()).text || '') : ''; } catch (e) { return ''; } }
async function editOf(pid) { try { const d = await S.db.doc('projects/' + pid + '/state/edit').get(); return d.exists ? plain(d.data()) : { materials: [], clips: [] }; } catch (e) { return { materials: [], clips: [] }; } }
function fmtSkill(p) { return skill(p.format === 'A' ? 'formato-a' : p.format === 'C' ? 'formato-c' : 'formato-b'); }
function briefOf(p) { return `Titolo: ${p.title || ''}\nFormato: ${p.format} (${(RULES[p.format] || RULES.B).name}), ${p.aspect || '9:16'}\nObiettivo: ${p.goal || '-'}\nDurata: ${p.duration || '-'}\nGancio proposto: ${p.hook || '-'}\nCTA: ${p.cta || '-'}\nNote: ${p.brief || '-'}`; }
function prev(pid, k) { const o = outputs[pid] && outputs[pid][k]; return o && o.output ? o.output.slice(0, 2500) : ''; }
async function promptFor(A, p) {
  const sc = await scriptOf(p.id); const base = `AGENTE: ${A.name} (${deptOf(A.dept).name}) dello studio Jarvis.\nIl tuo compito: ${A.role}\nScrivi in italiano, frasi corte, niente introduzioni né saluti, niente markdown pesante (solo elenchi con "-" e titoletti in MAIUSCOLO).\n\nBRIEF DELLA MISSIONE\n${briefOf(p)}\n\nREGOLE DEL FORMATO (skill dello studio)\n${fmtSkill(p)}\n`;
  const errori = '\nERRORI DA NON RIPETERE\n' + skill('errori') + '\n';
  switch (A.key) {
    case 'direttore': return base + errori + '\nCOMPITO: scrivi la DIREZIONE CREATIVA: 1) la promessa del video in una frase; 2) tre ganci alternativi (max 12 parole, il primo secondo deve funzionare senza audio); 3) tono e ritmo; 4) cosa NON fare in questo video. Max 180 parole.';
    case 'producer': return base + '\nDIREZIONE CREATIVA\n' + (prev(p.id, 'direttore') || '(non ancora scritta)') + '\n\nCOMPITO: scrivi il PIANO DI PRODUZIONE: passaggi in ordine con il reparto responsabile, materiali che mancano (voce, clip, foto, logo), rischi. Max 160 parole.';
    case 'sceneggiatore': return base + errori + '\nPUBBLICAZIONE (skill)\n' + skill('manychat') + '\n\nDIREZIONE CREATIVA\n' + (prev(p.id, 'direttore') || '(usa il brief)') + '\n\nSCRIPT ATTUALE\n' + (sc || '(vuoto)') + '\n\nCOMPITO: scrivi lo SCRIPT PARLATO pronto da registrare, con i tempi tra parentesi quadre. Struttura: [0-3 s] GANCIO, poi CORPO con una domanda aperta e un nuovo gancio a metà, TWIST, CTA finale con la parola da commentare. Solo affermazioni vere: se un dato non è certo, non usarlo. Rispondi SOLO con lo script.';
    case 'factcheck': return base + '\nSCRIPT\n' + (sc || '(vuoto: non c\'è niente da verificare)') + '\n\nCOMPITO: elenca ogni affermazione dello script che va verificata prima di pubblicare. Per ognuna: "- frase → cosa controllare → rischio (basso/medio/alto)". Segna con ALTO numeri, nomi, prezzi, notizie. Non puoi navigare: non dire mai che un fatto è vero, di\' cosa va controllato e dove. Chiudi con VERDETTO: pronto / da sistemare.';
    case 'motion3d': return base + '\nSKILL STANDARD VIDEO\n' + skill('standard') + '\n\nSCRIPT\n' + (sc || '(vuoto)') + '\n\nCOMPITO: dividi lo script in SCENE. Per ognuna: tempo, cosa si vede (oggetto protagonista), movimento di camera, animazione (diversa per ogni scena), chiaro/scuro. Formato: "- [0-3 s] …". Max 220 parole.';
    case 'tipografia': return base + '\nSCRIPT\n' + (sc || '(vuoto)') + '\n\nCOMPITO: per ogni frase importante indica la PAROLA CHIAVE a schermo, il colore (lime, arancio, rosso, bianco), lo stile (parola chiave, Apple, sottotitolo, titolo, etichetta) e l\'entrata. Tutto dentro la safe zone (168-1330 px su 1920). Max 160 parole.';
    case 'transizioni': return base + '\nSCENE\n' + (prev(p.id, 'motion3d') || '(non ancora divise: usa lo script)') + '\n\nSCRIPT\n' + (sc || '') + '\n\nCOMPITO: per ogni taglio tra scene scegli la transizione (finestra arrotondata, flash, whip, zoom-through, dissolvenza, match cut) e il motivo. Mai la stessa due volte di fila. Max 140 parole.';
    case 'sound': return base + '\nREGOLE DEL SUONO (skill dello studio)\n' + SOUND_RULES.join('\n') + '\n' + skill('suono') + '\n\nSCENE\n' + (prev(p.id, 'motion3d') || '') + '\n\nSCRIPT\n' + (sc || '') + '\n\nCOMPITO: scrivi il PIANO SONORO: "- [tempo] evento visibile → suono (tipo, durata) → volume rispetto alla voce". Ogni suono deve imitare l\'oggetto e durare quanto il movimento. Nessuna musica. Max 200 parole.';
    case 'qa_style': { const ed = await editOf(p.id); const tl = (ed.clips || []).slice().sort((a, b) => a.start - b.start).slice(0, 60).map(c => `${c.track} ${c.start.toFixed(1)}-${(c.start + c.dur).toFixed(1)}s ${c.kind}${c.text ? ' "' + c.text.slice(0, 40) + '"' : ''}${c.trans && c.trans !== 'none' ? ' trans:' + c.trans : ''}`).join('\n');
      return base + '\nCONTROLLO QUALITÀ UNIVERSALE (skill)\n' + skill('qa') + errori + '\nSCRIPT\n' + (sc || '(vuoto)') + '\n\nTIMELINE\n' + (tl || '(vuota)') + '\n\nCOMPITO: confronta script e timeline con le regole. Elenca i problemi in ordine di gravità con "- ✕" (blocca), "- !" (da sistemare), "- ✓" (ok). Chiudi con VERDETTO: consegnabile / non consegnabile.'; }
    default: return base;
  }
}

/* ---------- deterministic checks ---------- */
const SAFE_TOP = 168 / 1920, SAFE_BOT = 1330 / 1920;
function checkTech(p, ed) {
  const out = []; const C = ed.clips || []; const add = (lvl, text) => out.push({ lvl, text });
  if (!C.length) { add('bad', 'La timeline è vuota: niente da controllare.'); return out; }
  const voice = C.filter(c => c.track === 'A1'); const vEnd = voice.reduce((m, c) => Math.max(m, c.start + c.dur), 0);
  const end = C.reduce((m, c) => Math.max(m, c.start + c.dur), 0);
  voice.length ? add('ok', `Voce presente (${vEnd.toFixed(1)} s).`) : add('bad', 'Manca la voce sulla traccia A1.');
  const v1 = C.filter(c => c.track === 'V1').sort((a, b) => a.start - b.start); let gaps = []; let t = 0;
  for (const c of v1) { if (c.start - t > 0.1) gaps.push([t, c.start]); t = Math.max(t, c.start + c.dur); }
  if (vEnd && t < vEnd - 0.1) gaps.push([t, vEnd]);
  if (!v1.length) add('warn', 'Nessun video o immagine su V1: lo sfondo resta nero (va bene solo se le scene sono testi o 3D).');
  else gaps.length ? add('warn', 'Buchi su V1: ' + gaps.slice(0, 4).map(g => g[0].toFixed(1) + '–' + g[1].toFixed(1) + ' s').join(', ') + (gaps.length > 4 ? '…' : '')) : add('ok', 'V1 continuo, nessun buco.');
  const txt = C.filter(c => c.kind === 'text'); const out_ = txt.filter(c => (c.y ?? 0.62) < SAFE_TOP + 0.02 || (c.y ?? 0.62) > SAFE_BOT);
  out_.length ? add('bad', `${out_.length} testi fuori dalla safe zone (${out_.slice(0, 3).map(c => '"' + (c.text || '').slice(0, 18) + '"').join(', ')}).`) : add('ok', `Testi dentro la safe zone (${txt.length}).`);
  const want = parseFloat(String(p.duration || '').replace(',', '.')); if (want > 0) { const d = Math.abs(end - want) / want; d > 0.2 ? add('warn', `Durata ${end.toFixed(1)} s contro ${want} s del brief.`) : add('ok', `Durata ${end.toFixed(1)} s in linea con il brief.`); }
  const cta = (p.cta || 'Commenta').split(/\s+/).pop().replace(/[^\wÀ-ú]/g, '').toLowerCase();
  txt.some(c => (c.text || '').toLowerCase().includes(cta) || /commenta/i.test(c.text || '')) ? add('ok', 'CTA a schermo presente.') : add('warn', 'Nessun testo con la CTA a schermo.');
  const sfx = C.filter(c => c.track === 'A2'); let dense = 0;
  for (let s = 0; s < end; s += 0.5) { const n = sfx.filter(c => c.start >= s && c.start < s + 1).length; if (n > 4) { dense = s; break; } }
  dense ? add('warn', `Troppi effetti intorno a ${dense.toFixed(1)} s: rischio "interferenze".`) : add('ok', `Effetti distribuiti (${sfx.length}).`);
  if (vEnd && sfx.some(c => c.start > vEnd + 1.5)) add('warn', 'Ci sono effetti oltre la fine della voce.');
  (p.versions || []).length ? add('ok', `${p.versions.length} versioni esportate.`) : add('warn', 'Nessuna versione esportata in revisione.');
  return out;
}
function checkMix(p, ed) {
  const out = []; const C = ed.clips || []; const add = (lvl, text) => out.push({ lvl, text });
  const voice = C.filter(c => c.track === 'A1'), sfx = C.filter(c => c.track === 'A2');
  if (!voice.length && !sfx.length) { add('bad', 'Nessun audio nella timeline.'); return out; }
  voice.some(c => (c.vol ?? 1) < 0.9) ? add('warn', 'La voce è sotto il 90%: riportala a 1.0, è lei che comanda.') : voice.length && add('ok', 'Voce a volume pieno.');
  const loud = sfx.filter(c => (c.vol ?? 0.8) > 0.85); loud.length ? add('bad', `${loud.length} effetti sopra 0.85: abbassali sotto 0.7 per restare 6 dB sotto la voce.`) : sfx.length && add('ok', 'Effetti a volume corretto (≤ 0.85).');
  const over = sfx.filter(s => voice.some(v => s.start < v.start + v.dur && s.start + s.dur > v.start)); over.length && add('ok', `${over.length} effetti cadono sulla voce: l'export li tiene sotto con il limiter.`);
  const long = sfx.filter(c => c.dur > 2.2); long.length ? add('warn', `${long.length} effetti più lunghi di 2.2 s: controlla che non siano tappeti o whoosh lunghi.`) : sfx.length && add('ok', 'Nessun effetto lungo.');
  return out;
}

/* ---------- run ---------- */
export async function run(key, pid, { onText } = {}) {
  const A = agentOf(key); const p = S.projects.find(x => x.id === pid);
  if (!A || !p) return null;
  if (!S.db) { toast('Dati non disponibili in questa vista.'); return null; }
  if (running[key]) { toast(A.name + ' sta già lavorando.'); return null; }
  if (A.kind === 'editor') { api.setCur(pid); api.go('editor'); setTimeout(() => { const b = $('aiBuild'); if (b && !b.disabled) b.click(); }, 400); return null; }
  if (A.kind === 'llm' && !S.sample) { toast('Gli agenti scrivono con il tuo account Claude: apri Jarvis su claude.ai.'); return null; }
  running[key] = { pid, text: '' }; emit('agents');
  const actRef = S.db.collection('activity').doc();
  const act = { pid, ptitle: p.title || '', agent: key, dept: A.dept, status: 'running', text: A.name + ' al lavoro su ' + (p.title || 'missione'), at: now(), by: 'app' };
  actRef.set(act).catch(() => { });
  let output = '', items = null, ok = true;
  try {
    if (A.kind === 'check') {
      const ed = await editOf(pid); items = key === 'mix' ? checkMix(p, ed) : checkTech(p, ed);
      output = items.map(i => (i.lvl === 'ok' ? '✓ ' : i.lvl === 'warn' ? '! ' : '✕ ') + i.text).join('\n');
      onText && onText(output);
    } else {
      const prompt = await promptFor(A, p);
      const r = await S.sample(prompt, { cache: false, modelTier: 'default', onText: ({ text }) => { running[key].text = text; onText && onText(text); emit('agentText', { key, text }); } });
      output = (r && r.text) || running[key].text || '';
    }
    const rec = { output, at: now(), by: 'app', agent: key, ...(items ? { items } : {}) };
    await S.db.doc('projects/' + pid + '/agents/' + key).set(rec);
    outputs[pid] = { ...(outputs[pid] || {}), [key]: rec }; emit('agentOutputs', pid);
    if (A.writesScript && output.trim()) {
      const cur = await scriptOf(pid);
      if (!cur.trim()) { await S.db.doc('projects/' + pid + '/state/script').set({ text: output.trim(), by: key, at: now() }); emit('scriptExternal', pid); }
    }
    const upd = { updatedAt: now() }; if (A.writesScript) upd.hasScript = true;
    await S.db.doc('projects/' + pid).update(upd).catch(() => { });
    await api.setStage(pid, A.stage);
    const bad = items && items.some(i => i.lvl === 'bad');
    actRef.update({ status: 'done', text: A.name + (items ? (bad ? ': problemi da sistemare' : ': tutto in ordine') : ' ha finito') + ' · ' + (p.title || ''), at: now() }).catch(() => { });
    feed(A.name + ' ha finito: ' + (p.title || ''));
  } catch (e) {
    ok = false; const c = e && e.code;
    const msg = c === 'not_granted' ? 'serve il consenso a usare Claude' : c === 'rate_limited' ? 'troppe richieste, riprova tra poco' : c === 'cancelled' ? 'interrotto' : (e && e.code ? writeErr(e) : 'errore');
    actRef.update({ status: 'error', text: A.name + ': ' + msg, at: now() }).catch(() => { });
    toast(A.name + ': ' + msg + '.');
  } finally { delete running[key]; emit('agents'); }
  return ok ? output : null;
}

/* ---------- UI: agent card (used by the drawer and the script table) ---------- */
const liveCards = new Set();
function repaint(onlyKey) { for (const f of [...liveCards]) { if (!f.box.isConnected) { liveCards.delete(f); continue; } if (!onlyKey || f.key === onlyKey) f(); } }
on('agents', () => repaint()); on('agentOutputs', () => repaint()); on('agentText', (d) => repaint(d && d.key));
export function card(key, pidFn) {
  const A = agentOf(key), D = deptOf(A.dept);
  const out = el('div', { class: 'out' }); const meta = el('div', { class: 'meta' }); const res = el('div', { class: 'res' });
  const btn = el('button', { class: 'btn sm', type: 'button' }, A.kind === 'editor' ? 'Monta' : A.kind === 'check' ? 'Controlla' : 'Al lavoro');
  const box = el('article', { class: 'agent', style: '--c:' + D.color, 'data-agent': key },
    el('header', {}, el('span', { class: 'av', text: A.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() }), el('div', {}, el('b', { text: A.name }), el('span', { text: D.name })), btn),
    el('p', { class: 'role', text: A.role }), res, out, meta);
  const paint = () => {
    const pid = pidFn(); const r = running[key]; const o = pid && outputs[pid] && outputs[pid][key];
    box.classList.toggle('run', !!r && r.pid === pid);
    btn.disabled = !pid || !!r; btn.textContent = r ? 'Lavora…' : (A.kind === 'editor' ? 'Monta' : A.kind === 'check' ? 'Controlla' : o ? 'Rifai' : 'Al lavoro');
    if (r && r.pid === pid) { res.replaceChildren(); out.textContent = r.text || '…'; out.scrollTop = out.scrollHeight; meta.textContent = 'Sta scrivendo in diretta'; return; }
    if (o && o.items) { res.replaceChildren(...o.items.map(i => el('div', { class: i.lvl }, el('i', { text: i.lvl === 'ok' ? '✓' : i.lvl === 'warn' ? '!' : '✕' }), el('span', { text: i.text })))); out.textContent = ''; }
    else { res.replaceChildren(); out.textContent = o ? o.output : ''; }
    meta.textContent = o ? 'Ultimo lavoro ' + new Date(o.at).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) + (o.by === 'session' ? ' · dalla sessione Claude' : '') : (pid ? 'Non ha ancora lavorato su questa missione.' : 'Scegli una missione per farlo lavorare.');
  };
  btn.addEventListener('click', () => { const pid = pidFn(); if (!pid) { toast('Scegli prima una missione.'); return; } run(key, pid, { onText: () => paint() }).then(paint); paint(); });
  paint.key = key; paint.box = box; liveCards.add(paint);
  paint(); return box;
}

/* ---------- drawer: a department and its agents ---------- */
let drwDept = null;
export function openDrawer(deptKey) {
  const D = deptOf(deptKey); if (!D) return; drwDept = deptKey;
  const p = api.curP();
  $('drwDept').replaceChildren(el('i', { style: '--c:' + D.color }), 'Reparto'); $('drwDept').style.setProperty('--c', D.color);
  $('drwTitle').textContent = D.name; $('drwDesc').textContent = D.desc;
  const body = $('drwBody'); body.replaceChildren();
  body.append(el('div', { class: 'lbl', text: p ? 'Missione: ' + (p.title || '') : 'Nessuna missione scelta: apri una missione dallo Studio o dalla Produzione.' }));
  for (const A of AGENTS.filter(a => a.dept === deptKey)) body.append(card(A.key, () => api.curP() && api.curP().id));
  const sk = SKILLS.filter(s => s.dept === deptKey);
  if (sk.length) { body.append(el('div', { class: 'lbl', text: 'Skill che questo reparto segue' })); for (const s of sk) body.append(el('details', { class: 'skill' }, el('summary', { text: s.name }), el('pre', { text: s.text }))); }
  $('drwFoot').textContent = 'Le regole vengono dalla Libreria: video/FORMATI-ABC.md e video/STANDARD-VIDEO.md';
  $('drawer').classList.add('open'); $('drawer').setAttribute('aria-hidden', 'false');
  emit('drawer', deptKey);
}
export function closeDrawer() { if (!$('drawer').classList.contains('open')) return; $('drawer').classList.remove('open'); $('drawer').setAttribute('aria-hidden', 'true'); drwDept = null; emit('drawer', null); }
