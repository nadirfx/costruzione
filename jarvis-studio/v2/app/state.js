// Shared state, runtime capabilities and small helpers.
export const S = {
  db: null, user: null, assets: null, downloads: null, sample: null, dictation: null, tts: null,
  projects: [], cur: null, room: 'hub', canWrite: true, uid: null,
};
export const STATUS = { brief: 'Brief', lavorazione: 'In lavorazione', revisione: 'Da revisionare', approvato: 'Approvato' };
export const FORMAT = { A: 'Luxury motion', B: 'Faceless premium', C: 'Creator' };
export const $ = (id) => document.getElementById(id);
export function el(tag, props = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) { if (c == null || c === false) continue; e.append(c instanceof Node ? c : document.createTextNode(String(c))); }
  return e;
}
export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const tc = (s, frac = false) => { s = Math.max(0, s || 0); const m = Math.floor(s / 60), x = s - m * 60; return String(m).padStart(2, '0') + ':' + (frac ? x.toFixed(2).padStart(5, '0') : String(Math.floor(x)).padStart(2, '0')); };
export function toast(msg, ms = 2800) { const t = el('div', { text: msg }); $('toast').append(t); setTimeout(() => t.remove(), ms); }
export const uid = (p = 'c') => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
export const now = () => new Date().toISOString();
export const blobUrl = (id) => (window.__mockBlobs && window.__mockBlobs[id]) || ('/_blob/' + id);
export const store = {
  get(k) { try { return localStorage.getItem('jarvis.' + k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem('jarvis.' + k, v); } catch (e) { } },
};
export function writeErr(e) {
  const c = e && e.code;
  if (c === 'invalid_argument') return 'Non hai i permessi per salvare qui.';
  if (c === 'quota_exceeded') return 'Spazio dati esaurito: elimina vecchie missioni.';
  return 'Non salvato, riprova tra poco.';
}
export const bus = new EventTarget();
export const emit = (name, detail) => bus.dispatchEvent(new CustomEvent(name, { detail }));
export const on = (name, fn) => bus.addEventListener(name, (e) => fn(e.detail));
export function feed(text, kind = '') { emit('feed', { text, kind, at: Date.now() }); }
