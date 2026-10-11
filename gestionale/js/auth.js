/*
 * Accesso al gestionale: utente + password.
 *
 * La password NON è nel codice: è salvata come hash PBKDF2-SHA256 con sale casuale.
 * Questo è un blocco dell'applicazione, non una cassaforte: chi può leggere i file
 * del browser o modificare il codice può aggirarlo. Per cifrare davvero i dati
 * servirebbe usare la password come chiave di cifratura (non fatto qui).
 */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Auth = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const USERNAME = 'nadirfx';
  const CREDENTIAL = {
    salt: '33b80ad308c43a8b2e21aa3df3bf6976',
    iterations: 310000,
    hash: '9bc6f3eb4909404a44fe3376943da31fdb9a4ee1701607b965ef77341bc7705e',
  };
  const SESSION_KEY = 'gestionale.session';
  const REMEMBER_DAYS = 30;
  const MAX_FAILS = 5;
  const LOCK_MS = 30000;
  const FAILS_KEY = 'gestionale.fails';

  const subtle = () => (root.crypto && root.crypto.subtle) || null;

  const fromHex = (h) => new Uint8Array(h.match(/.{2}/g).map((b) => parseInt(b, 16)));
  const toHex = (buf) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');

  // Confronto a tempo costante (lunghezza uguale per costruzione: hex a 64 caratteri)
  function sameHex(a, b) {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
  }

  async function derive(password, saltHex, iterations) {
    const s = subtle();
    if (!s) throw new Error('CONTEXT');
    const key = await s.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await s.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(saltHex), iterations },
      key,
      256
    );
    return toHex(bits);
  }

  async function verifyCredentials(username, password) {
    const userOk = String(username || '').trim().toLowerCase() === USERNAME;
    const derived = await derive(String(password || ''), CREDENTIAL.salt, CREDENTIAL.iterations);
    const passOk = sameHex(derived, CREDENTIAL.hash);
    return userOk && passOk;
  }

  function storage(kind) {
    try { return kind === 'local' ? root.localStorage : root.sessionStorage; } catch (_) { return null; }
  }

  function readSession() {
    const now = Date.now();
    for (const kind of ['local', 'session']) {
      const st = storage(kind);
      if (!st) continue;
      try {
        const raw = st.getItem(SESSION_KEY);
        if (!raw) continue;
        const s = JSON.parse(raw);
        if (s && (!s.exp || s.exp > now)) return { ...s, kind };
        st.removeItem(SESSION_KEY);
      } catch (_) { /* memoria del browser non leggibile: si richiede il login */ }
    }
    return null;
  }

  function isLoggedIn() {
    return !!readSession();
  }

  function startSession(remember) {
    const data = { user: USERNAME, since: Date.now(), exp: remember ? Date.now() + REMEMBER_DAYS * 86400000 : 0 };
    const st = storage(remember ? 'local' : 'session');
    try {
      if (st) st.setItem(SESSION_KEY, JSON.stringify(data));
    } catch (_) { /* memoria piena o bloccata: la sessione dura solo questa pagina */ }
  }

  function endSession() {
    for (const kind of ['local', 'session']) {
      try { const st = storage(kind); if (st) st.removeItem(SESSION_KEY); } catch (_) { /* ignora */ }
    }
  }

  function failState() {
    try {
      return JSON.parse(root.sessionStorage.getItem(FAILS_KEY) || '{"n":0,"until":0}');
    } catch (_) {
      return { n: 0, until: 0 };
    }
  }

  function recordFail() {
    const st = failState();
    st.n += 1;
    if (st.n >= MAX_FAILS) {
      st.until = Date.now() + LOCK_MS;
      st.n = 0;
    }
    try { root.sessionStorage.setItem(FAILS_KEY, JSON.stringify(st)); } catch (_) { /* ignora */ }
    return st;
  }

  function clearFails() {
    try { root.sessionStorage.removeItem(FAILS_KEY); } catch (_) { /* ignora */ }
  }

  function lockedFor() {
    const st = failState();
    return Math.max(0, st.until - Date.now());
  }

  return {
    USERNAME, verifyCredentials, isLoggedIn, startSession, endSession, readSession,
    recordFail, clearFails, lockedFor, derive, sameHex, CREDENTIAL, subtle,
  };
});
