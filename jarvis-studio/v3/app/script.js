// Script room: the spoken script (shared doc projects/<id>/state/script) and the table of departments
// that work on it: Direzione, Scrittura, Motion, Suono.
import { S, $, el, toast, now, writeErr, on, plain } from './state.js';
import * as Agents from './agents.js';

let api, unsub = null, subFor = null, timer = null, dirty = false, writing = false;
const TABLE = ['direttore', 'sceneggiatore', 'factcheck', 'motion3d', 'tipografia', 'transizioni', 'sound', 'producer'];
export function init(a) {
  api = a;
  $('scriptText').addEventListener('input', () => { dirty = true; $('scriptState').textContent = 'Modifiche…'; words(); clearTimeout(timer); timer = setTimeout(save, 800); });
  $('runWriter').addEventListener('click', () => runAgent('sceneggiatore'));
  $('runFact').addEventListener('click', () => runAgent('factcheck'));
  on('scriptExternal', (pid) => { const p = api.curP(); if (p && p.id === pid) load(true); });
  on('cur', () => { if (S.room === 'script') { subscribe(); renderTable(); } });
  on('reconnect', () => { subFor = null; if (S.room === 'script') subscribe(); });
}
const pid = () => { const p = api.curP(); return p && p.id; };
export function enter() { subscribe(); renderTable(); }
export function leave() { if (dirty) save(); }
export function refresh() { }
function words() { const n = ($('scriptText').value.match(/\S+/g) || []).length; $('scriptWords').textContent = n ? `${n} parole · circa ${Math.round(n / 2.6)} s di voce` : ''; }
function subscribe() {
  const p = pid(); if (!S.db || !p || subFor === p) return; subFor = p; if (unsub) { try { unsub(); } catch (e) { } }
  $('scriptText').value = ''; dirty = false;
  try { unsub = S.db.doc('projects/' + p + '/state/script').onSnapshot((snap) => { if (dirty || writing) return; const d = snap.exists ? plain(snap.data()) : null; $('scriptText').value = (d && d.text) || ''; $('scriptState').textContent = d && d.by && d.by !== 'user' ? 'Scritto da ' + (d.by === 'sceneggiatore' ? 'lo Sceneggiatore' : d.by) : 'Salvato'; words(); }, () => { subFor = null; }); } catch (e) { subFor = null; }
}
async function load(force) { if (force) dirty = false; subFor = null; subscribe(); }
async function save() {
  const p = pid(); if (!S.db || !p || !dirty) return; if (writing) { clearTimeout(timer); timer = setTimeout(save, 400); return; }
  writing = true; $('scriptState').textContent = 'Salvo…'; const text = $('scriptText').value.slice(0, 20000);
  try { await S.db.doc('projects/' + p + '/state/script').set({ text, by: 'user', at: now() }); dirty = false; $('scriptState').textContent = 'Salvato';
    const pr = api.curP(); if (pr && !pr.hasScript && text.trim()) S.db.doc('projects/' + p).update({ hasScript: true, updatedAt: now() }).catch(() => { }); if (text.trim()) api.setStage(p, 'script'); }
  catch (e) { $('scriptState').textContent = 'Non salvato'; toast(writeErr(e)); }
  finally { writing = false; }
}
async function runAgent(k) {
  const p = pid(); if (!p) { toast('Scegli prima una missione.'); return; }
  if (dirty) await save();
  const out = await Agents.run(k, p);
  if (k === 'sceneggiatore' && out && $('scriptText').value.trim() && $('scriptText').value.trim() !== out.trim()) toast('Nuova versione dello Sceneggiatore nel tavolo a destra: tocca "Usa questo script" per sostituirla.', 5000);
}
function renderTable() {
  const t = $('table'); t.replaceChildren(el('div', { class: 'row', style: 'justify-content:space-between' }, el('span', { class: 'h', text: 'Tavolo dei reparti' }), el('span', { class: 'lbl', text: 'Lavorano sullo script' })));
  for (const k of TABLE) {
    const c = Agents.card(k, pid);
    if (k === 'sceneggiatore') c.append(el('button', { class: 'btn sm', type: 'button', onclick: async () => { const o = (Agents.outputs[pid()] || {}).sceneggiatore; if (!o || !o.output) { toast('Lo Sceneggiatore non ha ancora scritto niente.'); return; } $('scriptText').value = o.output.trim(); dirty = true; words(); await save(); toast('Script sostituito.'); } }, 'Usa questo script'));
    t.append(c);
  }
}
