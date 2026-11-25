// Jarvis, always present: a chat sheet that knows the room, the mission, the departments and the studio's skills.
// It answers and proposes actions as buttons (run an agent, open a room or a department).
import { S, $, el, toast, store, on, emit } from './state.js';
import { AGENTS, DEPTS, STAGES, agentOf, deptOf, stageOf } from './org.js';
import { SKILLS } from './skills.gen.js';
import * as Agents from './agents.js';

let api, turns = [], busy = false, ctl = null;
const ROOM_NAME = { studio: 'Studio', prod: 'Produzione', brief: 'Brief', script: 'Script', editor: 'Montaggio', review: 'Revisione', machine: 'Sala macchine', lib: 'Libreria' };
export function init(a) {
  api = a;
  try { turns = JSON.parse(store.get('jv.chat') || '[]').slice(-20); } catch (e) { turns = []; }
  $('jvOrb').addEventListener('click', () => toggle(true));
  $('jvClose').addEventListener('click', () => toggle(false));
  $('jvSend').addEventListener('click', send);
  $('jvIn').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('jvSheet').classList.contains('open')) toggle(false); });
  on('room', () => { if (isOpen()) ctx(); }); on('cur', () => { if (isOpen()) ctx(); });
  render();
}
const isOpen = () => $('jvSheet').classList.contains('open');
function toggle(open) {
  $('jvSheet').classList.toggle('open', open); $('jvSheet').setAttribute('aria-hidden', String(!open));
  if (open) { ctx(); setTimeout(() => $('jvIn').focus(), 200); }
}
function ctx() {
  const p = api.curP();
  $('jvCtx').textContent = 'Sei in ' + ROOM_NAME[S.room] + (p ? ' · missione "' + (p.title || '') + '", fase ' + STAGES.find(s => s.key === stageOf(p)).name : ' · nessuna missione scelta');
  const q = $('jvQuick'); q.replaceChildren();
  const chips = p ? ['Cosa manca a questa missione?', 'Chi deve lavorare adesso?', S.room === 'editor' ? 'Controlla la timeline' : 'Scrivi lo script', 'Dammi 3 ganci migliori'] : ['Come funziona lo studio?', 'Che video facciamo oggi?', 'Quali skill segue lo studio?'];
  for (const c of chips) q.append(el('button', { class: 'chip', type: 'button', onclick: () => { $('jvIn').value = c; send(); } }, c));
}
function save() { try { store.set('jv.chat', JSON.stringify(turns.slice(-20))); } catch (e) { } }
function render(streaming) {
  const log = $('jvLog'); log.replaceChildren();
  if (!turns.length && !streaming) log.append(el('div', { class: 'msg ai', text: 'Ciao Nadir. Sono qui in ogni stanza: chiedimi cosa manca a una missione, chi deve lavorare o fammi scrivere, controllare e montare. Ti propongo le azioni come pulsanti.' }));
  for (const t of turns) log.append(bubble(t.role, t.content));
  if (streaming != null) log.append(bubble('assistant', streaming || '…'));
  log.scrollTop = log.scrollHeight;
}
function bubble(role, text) {
  const acts = []; const body = String(text).replace(/^AZIONE:\s*(\{.*\})\s*$/gm, (m, j) => { try { acts.push(JSON.parse(j)); } catch (e) { } return ''; }).trim();
  const b = el('div', { class: 'msg ' + (role === 'user' ? 'me' : 'ai'), text: body });
  if (acts.length) b.append(el('div', { class: 'act' }, acts.map(actionBtn).filter(Boolean)));
  return b;
}
function actionBtn(a) {
  const p = api.curP();
  if (a.run) { const A = agentOf(a.run); if (!A) return null; return el('button', { class: 'btn sm pri', type: 'button', onclick: () => { if (!p) { toast('Scegli prima una missione.'); return; } toggle(false); if (A.writesScript || A.dept === 'wri') api.go('script'); Agents.run(A.key, p.id); } }, 'Fai lavorare: ' + A.name); }
  if (a.go && ROOM_NAME[a.go]) return el('button', { class: 'btn sm', type: 'button', onclick: () => { toggle(false); api.go(a.go); } }, 'Apri ' + ROOM_NAME[a.go]);
  if (a.open && deptOf(a.open)) return el('button', { class: 'btn sm', type: 'button', onclick: () => { toggle(false); Agents.openDrawer(a.open); } }, 'Apri reparto ' + deptOf(a.open).name);
  return null;
}
async function prompt() {
  const p = api.curP(); let script = '';
  if (p && S.db) { try { const d = await S.db.doc('projects/' + p.id + '/state/script').get(); script = d.exists ? (d.data().text || '') : ''; } catch (e) { } }
  const outs = p ? Object.entries(Agents.outputs[p.id] || {}).map(([k, o]) => `- ${agentOf(k) ? agentOf(k).name : k}: ${(o.output || '').slice(0, 300).replace(/\n/g, ' ')}`).join('\n') : '';
  const work = Object.keys(Agents.workMap()).map(k => agentOf(k) ? agentOf(k).name : k).join(', ');
  return `Sei Jarvis, il capo dello studio di produzione video di Nadir (nadirfx): Reels e TikTok italiani virali su cosa sa fare Claude, e spot per clienti.
Rispondi in italiano, breve e concreto (massimo 120 parole), come un produttore esperto. Niente markdown pesante.
REPARTI E AGENTI: ${DEPTS.map(d => d.name + ' (' + AGENTS.filter(a => a.dept === d.key).map(a => a.key + '=' + a.name).join(', ') + ')').join('; ')}.
FASI: ${STAGES.map(s => s.name).join(' → ')}.
SKILL DELLO STUDIO: ${SKILLS.map(s => s.name).join('; ')}. Regole chiave: gancio nel primo secondo, ogni scena con un'animazione diversa, nessun secondo fermo, testi nella safe zone, effetti sempre sotto la voce, niente whoosh acuti, solo affermazioni vere, CTA "Commenta CLAUDE".
DOVE SIAMO: stanza ${ROOM_NAME[S.room]}. Agenti al lavoro: ${work || 'nessuno'}.
${p ? `MISSIONE: "${p.title}" formato ${p.format}, fase ${stageOf(p)}, obiettivo ${p.goal || '-'}, durata ${p.duration || '-'}, gancio ${p.hook || '-'}, CTA ${p.cta || '-'}, versioni ${(p.versions || []).length}.\nSCRIPT: ${script ? script.slice(0, 1500) : '(non ancora scritto)'}\nLAVORI DEGLI AGENTI:\n${outs || '(nessuno)'}` : 'NESSUNA MISSIONE SCELTA.'}
AZIONI: quando serve proponi un'azione con una riga a parte, esattamente così (una per riga, massimo 2):
AZIONE: {"run":"<chiave agente>"}   oppure   AZIONE: {"go":"studio|prod|brief|script|editor|review|machine|lib"}   oppure   AZIONE: {"open":"dir|wri|mot|snd|edt|qa"}`;
}
async function send() {
  const text = $('jvIn').value.trim(); if (!text || busy) return;
  if (!S.sample) { toast('Jarvis risponde con il tuo account Claude: apri l\'app su claude.ai.'); return; }
  $('jvIn').value = ''; turns.push({ role: 'user', content: text.slice(0, 2000) }); render(''); busy = true; $('jvOrb').classList.add('busy'); $('jvSend').disabled = true;
  ctl = new AbortController();
  try {
    const input = [{ role: 'user', content: await prompt() }, { role: 'assistant', content: 'Ok, sono pronto.' }, ...turns.slice(-12)];
    const r = await S.sample(input, { cache: false, modelTier: 'quick', signal: ctl.signal, onText: ({ text }) => render(text) });
    turns.push({ role: 'assistant', content: (r && r.text) || '' });
  } catch (e) {
    const c = e && e.code; turns.push({ role: 'assistant', content: c === 'not_granted' ? 'Per rispondere devo poter usare Claude: consenti l\'accesso quando l\'app lo chiede.' : c === 'rate_limited' ? 'Troppe richieste in questo momento: riprova tra un minuto.' : 'Non sono riuscito a rispondere (' + (c || 'errore') + '). Riprova.' });
  } finally { busy = false; $('jvOrb').classList.remove('busy'); $('jvSend').disabled = false; save(); render(); }
}
