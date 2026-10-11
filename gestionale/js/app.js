/*
 * App: stato in memoria, router a hash, delegazione eventi, avvio.
 * I dati vengono caricati interi all'avvio (sono pochi record); i file binari restano in IndexedDB.
 */
(function (root) {
  'use strict';

  const { Core, DB, UI, Fiscale } = root;
  const { $, esc, toast } = UI;

  const DEFAULT_SETTINGS = {
    tipoAttivita: 'privato',
    ragioneSociale: '',
    nome: '',
    cognome: '',
    partitaIva: '',
    codiceFiscale: '',
    indirizzo: '',
    cap: '',
    citta: '',
    provincia: '',
    email: '',
    telefono: '',
    iban: '',
    regimeFiscale: '',
    ivaDefault: 22,
    giorniScadenza: 30,
    lastBackupAt: null,
    // Parametri fiscali (stime): verificali con il commercialista
    fiscal: { ...Fiscale.DEFAULT_FISCAL },
  };

  const RECORD_STORES = ['clients', 'projects', 'invoices', 'payments', 'expenses', 'activities', 'tasks'];

  const App = {
    state: { clients: [], projects: [], invoices: [], payments: [], expenses: [], activities: [], tasks: [], files: [], settings: {} },
    ui: { dash: null, clientSearch: '', clientTab: 'panoramica', invSearch: '', invYear: null, invStato: '', payYear: null, payMonth: '', payClient: '', expYear: null, expCat: '' },
    views: {},
    actions: {},
    forms: {},
    changes: {},
    inputs: {},
    today: () => Core.todayISO(),
    settings: () => ({ ...DEFAULT_SETTINGS, ...App.state.settings }),

    // Dati nella forma attesa dal core
    data() {
      return App.state;
    },

    byId(store, id) {
      return (App.state[store] || []).find((r) => r.id === id) || null;
    },

    async save(store, rec) {
      if (!RECORD_STORES.includes(store)) throw new Error(`Store non valido: ${store}`);
      const now = new Date().toISOString();
      const row = { ...rec, id: rec.id || Core.uid() };
      row.createdAt = row.createdAt || now;
      row.updatedAt = now;
      await DB.put(store, row);
      const list = App.state[store];
      const i = list.findIndex((r) => r.id === row.id);
      if (i >= 0) list[i] = row;
      else list.push(row);
      return row;
    },

    async remove(store, id) {
      await DB.remove(store, id);
      App.state[store] = App.state[store].filter((r) => r.id !== id);
    },

    async saveSettings(patch) {
      App.state.settings = { ...App.state.settings, ...patch };
      await DB.saveSettings(App.state.settings);
    },

    // Documenti: metadati + blob
    async addFile(meta, blob) {
      const row = { ...meta, id: meta.id || Core.uid(), createdAt: new Date().toISOString() };
      row.name = blob.name || meta.name || 'documento';
      row.mime = blob.type || meta.mime || 'application/octet-stream';
      row.size = blob.size;
      await DB.saveFile(row, blob);
      App.state.files.push(row);
      return row;
    },

    // Rimuove un record e i documenti collegati a lui (es. ricevuta di un pagamento)
    async removeWithFiles(store, id) {
      const linked = App.state.files.filter((f) => f.relatedId === id);
      for (const f of linked) {
        await DB.removeFile(f.id);
      }
      App.state.files = App.state.files.filter((f) => !linked.includes(f));
      await App.remove(store, id);
    },

    async removeFile(id) {
      await DB.removeFile(id);
      App.state.files = App.state.files.filter((f) => f.id !== id);
    },

    /* ------------------------------ Router ------------------------------ */
    routes: [
      { re: /^(dashboard)?$/, view: 'dashboard', nav: 'dashboard' },
      { re: /^clienti$/, view: 'clientiList', nav: 'clienti' },
      { re: /^clienti\/([^/]+)$/, view: 'clienteDetail', nav: 'clienti' },
      { re: /^fatture$/, view: 'fattureList', nav: 'fatture' },
      { re: /^fatture\/nuova$/, view: 'fatturaForm', nav: 'fatture' },
      { re: /^fatture\/([^/]+)\/modifica$/, view: 'fatturaForm', nav: 'fatture' },
      { re: /^fatture\/([^/]+)$/, view: 'fatturaDetail', nav: 'fatture' },
      { re: /^incassi$/, view: 'incassi', nav: 'incassi' },
      { re: /^spese$/, view: 'spese', nav: 'spese' },
      { re: /^andamento$/, view: 'andamento', nav: 'andamento' },
      { re: /^task$/, view: 'tasks', nav: 'task' },
      { re: /^settimana$/, view: 'settimana', nav: 'settimana' },
      { re: /^fiscale$/, view: 'fiscale', nav: 'fiscale' },
      { re: /^esporta$/, view: 'esporta', nav: 'esporta' },
      { re: /^impostazioni$/, view: 'impostazioni', nav: 'impostazioni' },
    ],

    resolveRoute() {
      const hash = (root.location.hash || '').replace(/^#\/?/, '');
      const path = hash.replace(/\/+$/, '');
      for (const r of App.routes) {
        const m = r.re.exec(path);
        if (m) return { ...r, params: m.slice(1).map((p) => decodeURIComponent(p)) };
      }
      return { view: 'notFound', nav: null, params: [] };
    },

    render() {
      const main = $('#view');
      const route = App.resolveRoute();
      document.querySelectorAll('[data-nav]').forEach((a) => {
        a.classList.toggle('active', a.dataset.nav === route.nav);
        if (a.dataset.nav === route.nav) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      });
      const fn = App.views[route.view];
      if (!fn) {
        main.innerHTML = UI.empty('Pagina non trovata.');
        return;
      }
      try {
        // Stessa pagina (es. dopo un salvataggio): mantiene la posizione. Pagina nuova: in cima.
        const sameRoute = main.dataset.route === location.hash;
        const y = root.scrollY;
        main.innerHTML = fn(...route.params);
        main.dataset.route = location.hash;
        root.scrollTo(0, sameRoute ? y : 0);
        countUp(main);
        // Form fattura: calcola subito i totali (nuova fattura o modifica)
        const invForm = main.querySelector('form[data-input="invoice-totals"]');
        if (invForm) App.inputs['invoice-totals'](invForm);
      } catch (e) {
        console.error(e);
        main.innerHTML = `<div class="alert danger"><strong>Errore nella pagina.</strong><pre>${esc(e.message)}</pre></div>`;
      }
    },

    refresh() {
      App.render();
      App.renderBackupBanner();
    },

    // Avviso di backup: mai fatto o più vecchio di 14 giorni, con dati presenti
    renderBackupBanner() {
      const host = $('#backup-banner');
      if (!host) return;
      const s = App.settings();
      const hasData = App.state.clients.length + App.state.invoices.length + App.state.payments.length + App.state.expenses.length > 0;
      const days = Core.daysSince(s.lastBackupAt ? s.lastBackupAt.slice(0, 10) : null, App.today());
      if (hasData && (days === null || days >= 14)) {
        host.hidden = false;
        const quando = days === null ? 'Non hai mai esportato un backup' : `Ultimo backup ${days} giorni fa`;
        host.innerHTML = `${quando}. I dati vivono solo in questo browser: <a href="#/esporta">esporta un backup</a>.`;
      } else {
        host.hidden = true;
        host.innerHTML = '';
      }
    },
  };

  root.App = App;

  // Numeri che salgono fino al valore finale (data-count = intero, data-count-eur = centesimi)
  const reduceMotion = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function countUp(scope) {
    if (reduceMotion || !root.requestAnimationFrame) return;
    scope.querySelectorAll('[data-count], [data-count-eur]').forEach((el) => {
      const isEur = el.hasAttribute('data-count-eur');
      const target = Number(isEur ? el.dataset.countEur : el.dataset.count) || 0;
      const start = performance.now();
      const dur = 900;
      const step = (now) => {
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        const v = Math.round(target * eased);
        el.textContent = isEur ? Core.formatEuro(v) : String(v);
        if (p < 1) root.requestAnimationFrame(step);
      };
      el.textContent = isEur ? Core.formatEuro(0) : '0';
      root.requestAnimationFrame(step);
    });
  }

  /* ------------------------------ Delegazione eventi ------------------------------ */
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const fn = App.actions[el.dataset.action];
    if (!fn) return;
    if (el.tagName === 'A' && el.getAttribute('href') === '#') e.preventDefault();
    Promise.resolve(fn(el, e)).catch(reportError);
  });

  document.addEventListener('submit', (e) => {
    const form = e.target.closest('form[data-form]');
    if (!form) return;
    e.preventDefault();
    const fn = App.forms[form.dataset.form];
    if (!fn) return;
    Promise.resolve(fn(form, e)).catch(reportError);
  });

  document.addEventListener('change', (e) => {
    const el = e.target.closest('[data-change]');
    if (!el) return;
    const fn = App.changes[el.dataset.change];
    if (fn) Promise.resolve(fn(el, e)).catch(reportError);
  });

  document.addEventListener('input', (e) => {
    const el = e.target.closest('[data-input]');
    if (!el) return;
    const fn = App.inputs[el.dataset.input];
    if (fn) fn(el, e);
  });

  // Formato automatico per i campi importo: alla perdita di focus scrive 1.234,56
  document.addEventListener('blur', (e) => {
    const el = e.target;
    if (el && el.dataset && el.dataset.type === 'money' && el.value.trim() !== '') {
      const c = Core.parseEuroToCents(el.value);
      if (c !== null) el.value = Core.centsToPlain(c);
    }
  }, true);

  function reportError(err) {
    console.error(err);
    toast(err && err.message ? err.message : 'Operazione non riuscita', 'err');
  }
  App.reportError = reportError;

  /* ------------------------------ Avvio ------------------------------ */
  async function boot() {
    const main = $('#view');
    try {
      await DB.open();
      DB.requestPersistence();
      App.state = { ...App.state, ...(await DB.loadAll()) };
    } catch (err) {
      console.error(err);
      main.innerHTML = `<div class="alert danger"><strong>Impossibile aprire l’archivio dati.</strong><p>${esc(err.message)}</p></div>`;
      return;
    }
    const stored = App.state.settings || {};
    App.state.settings = { ...DEFAULT_SETTINGS, ...stored, fiscal: { ...DEFAULT_SETTINGS.fiscal, ...(stored.fiscal || {}) } };
    root.addEventListener('hashchange', () => App.refresh());
    if (!root.location.hash) root.location.hash = '#/dashboard';
    App.refresh();
  }

  if (root.document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(typeof window !== 'undefined' ? window : globalThis);
