/*
 * Schermata di accesso: blocca l'app finché utente e password non sono corretti.
 * I dati restano nel database anche quando l'app è bloccata: il blocco non tocca nulla.
 */
(function (root) {
  'use strict';

  const { Auth, UI, App } = root;
  const $ = UI.$;

  function setMsg(text, kind = '') {
    const m = $('#login-msg');
    if (!m) return;
    m.textContent = text;
    m.className = `login-msg ${kind}`;
  }

  App.lock = () => {
    App.locked = true;
    document.body.classList.add('locked');
    const screen = $('#login');
    if (screen) screen.hidden = false;
    const wait = Auth.lockedFor();
    if (wait > 0) startCountdown(wait);
    else setMsg('');
    const u = $('#login-user');
    if (u && !u.value) u.value = Auth.USERNAME;
    const p = $('#login-pass');
    if (p) { p.value = ''; setTimeout(() => p.focus(), 60); }
  };

  App.unlock = () => {
    App.locked = false;
    document.body.classList.remove('locked');
    const screen = $('#login');
    if (screen) screen.hidden = true;
    setMsg('');
    App.refresh();
  };

  let timer = null;
  function startCountdown(ms) {
    const btn = $('#login-submit');
    const end = Date.now() + ms;
    if (btn) {
      btn.dataset.hold = '1';
      btn.disabled = true;
    }
    clearInterval(timer);
    timer = setInterval(() => {
      const left = Math.ceil((end - Date.now()) / 1000);
      if (left <= 0) {
        clearInterval(timer);
        if (btn) {
          delete btn.dataset.hold;
          btn.disabled = false;
        }
        setMsg('');
        Auth.clearFails();
        return;
      }
      setMsg(`Troppi tentativi. Riprova tra ${left} secondi.`, 'err');
    }, 250);
  }

  App.forms.login = (form) =>
    UI.guard(form, async () => {
      const user = form.elements.username.value;
      const pass = form.elements.password.value;
      const remember = form.elements.remember.checked;
      if (Auth.lockedFor() > 0) return startCountdown(Auth.lockedFor());
      setMsg('Verifica in corso…');
      let ok;
      try {
        ok = await Auth.verifyCredentials(user, pass);
      } catch (err) {
        if (err.message === 'CONTEXT') {
          setMsg('Per accedere serve una pagina sicura: apri il file dal computer o da un indirizzo https.', 'err');
          return;
        }
        throw err;
      }
      if (!ok) {
        const st = Auth.recordFail();
        form.elements.password.value = '';
        form.classList.remove('shake');
        void form.offsetWidth;
        form.classList.add('shake');
        if (Auth.lockedFor() > 0) return startCountdown(Auth.lockedFor());
        const left = 5 - (st.n % 5);
        setMsg(`Utente o password non corretti. Tentativi rimasti: ${left}.`, 'err');
        return;
      }
      Auth.clearFails();
      Auth.startSession(remember);
      setMsg('');
      App.unlock();
      UI.toast('Bentornato');
    });

  App.actions.logout = async () => {
    const ok = await UI.confirmDialog({
      title: 'Uscire dal gestionale?',
      message: 'I dati restano salvati su questo dispositivo. Per riaccedere serviranno utente e password.',
      confirmText: 'Esci',
    });
    if (!ok) return;
    Auth.endSession();
    App.lock();
  };
})(typeof window !== 'undefined' ? window : globalThis);
