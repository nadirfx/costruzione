/*
 * Persistenza in IndexedDB (tutto in locale, nel tuo browser).
 *
 * Stores:
 *   clients, projects, invoices, payments, expenses, activities  -> record JSON
 *   files      -> metadati dei documenti (nome, tipo, cliente, ...)
 *   blobs      -> contenuto binario dei documenti (tenuto separato: non viene caricato in memoria)
 *   meta       -> impostazioni (record con id "settings")
 *
 * Ogni scrittura è una transazione: o va tutta, o non va.
 */
(function (root) {
  'use strict';

  const DB_NAME = 'gestionale-personale';
  // v2: aggiunto lo store "tasks". onupgradeneeded crea solo gli store mancanti: i dati esistenti restano.
  const DB_VERSION = 2;
  const RECORD_STORES = ['clients', 'projects', 'invoices', 'payments', 'expenses', 'activities', 'tasks', 'files', 'meta'];
  const ALL_STORES = [...RECORD_STORES, 'blobs'];
  const BACKUP_FORMAT = 'gestionale-backup';
  const BACKUP_VERSION = 1;

  let dbPromise = null;

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!root.indexedDB) {
        reject(new Error('Questo browser non supporta IndexedDB: i dati non possono essere salvati.'));
        return;
      }
      const req = root.indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        for (const s of ALL_STORES) {
          if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => {
        const db = req.result;
        // Se un'altra scheda aggiorna il database, chiudiamo e riapriamo alla prossima operazione
        db.onversionchange = () => {
          db.close();
          dbPromise = null;
        };
        resolve(db);
      };
      req.onerror = () => reject(req.error || new Error('Apertura database fallita'));
      req.onblocked = () => reject(new Error('Il database è aperto in un’altra scheda: chiudila e ricarica la pagina.'));
    });
    // In caso di errore, al prossimo tentativo si riprova l'apertura
    dbPromise.catch(() => { dbPromise = null; });
    return dbPromise;
  }

  // Esegue `work(tx, box)` dentro una transazione; box.value è il risultato a commit avvenuto.
  function run(storeNames, mode, work) {
    return open().then(
      (db) =>
        new Promise((resolve, reject) => {
          const tx = db.transaction(storeNames, mode);
          const box = { value: undefined };
          tx.oncomplete = () => resolve(box.value);
          tx.onerror = () => reject(tx.error || new Error('Errore di scrittura nel database'));
          tx.onabort = () => reject(tx.error || new Error('Operazione annullata'));
          try {
            work(tx, box);
          } catch (e) {
            try { tx.abort(); } catch (_) { /* già chiusa */ }
            reject(e);
          }
        })
    );
  }

  function getAllFrom(tx, store, box, key) {
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => { box.value = box.value || {}; box.value[key || store] = req.result; };
  }

  // Carica tutti i record (senza i blob)
  function loadAll() {
    return run(RECORD_STORES, 'readonly', (tx, box) => {
      box.value = {};
      for (const s of RECORD_STORES) getAllFrom(tx, s, box);
    }).then((out) => {
      const result = {};
      for (const s of RECORD_STORES) result[s] = out[s] || [];
      // il record delle impostazioni è un singolo oggetto
      const settingsRec = result.meta.find((r) => r.id === 'settings');
      result.settings = settingsRec ? stripId(settingsRec) : {};
      delete result.meta;
      return result;
    });
  }

  function stripId(rec) {
    const { id, ...rest } = rec;
    return rest;
  }

  function put(store, rec) {
    return run([store], 'readwrite', (tx) => {
      tx.objectStore(store).put(rec);
    }).then(() => rec);
  }

  function remove(store, id) {
    return run([store], 'readwrite', (tx) => {
      tx.objectStore(store).delete(id);
    });
  }

  function saveSettings(settings) {
    return put('meta', { id: 'settings', ...settings }).then(() => settings);
  }

  // Salva metadati e blob del documento in un'unica transazione
  function saveFile(meta, blob) {
    return run(['files', 'blobs'], 'readwrite', (tx) => {
      tx.objectStore('files').put(meta);
      tx.objectStore('blobs').put({ id: meta.id, blob });
    }).then(() => meta);
  }

  function removeFile(id) {
    return run(['files', 'blobs'], 'readwrite', (tx) => {
      tx.objectStore('files').delete(id);
      tx.objectStore('blobs').delete(id);
    });
  }

  function getBlob(id) {
    return run(['blobs'], 'readonly', (tx, box) => {
      const req = tx.objectStore('blobs').get(id);
      req.onsuccess = () => { box.value = req.result ? req.result.blob : null; };
    });
  }

  /* ------------------------------ Backup ------------------------------ */

  function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = () => reject(fr.error);
      fr.readAsDataURL(blob);
    });
  }

  function dataURLToBlob(dataUrl, type) {
    const comma = dataUrl.indexOf(',');
    if (comma < 0) throw new Error('Dati di un documento non leggibili');
    const bin = atob(dataUrl.slice(comma + 1));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: type || 'application/octet-stream' });
  }

  // Esporta tutto (incluso il contenuto dei documenti) in un unico oggetto JSON
  async function exportAll() {
    const data = await loadAll();
    const blobs = await run(['blobs'], 'readonly', (tx, box) => {
      const req = tx.objectStore('blobs').getAll();
      req.onsuccess = () => { box.value = req.result || []; };
    });
    const files = [];
    for (const b of blobs) {
      const meta = data.files.find((f) => f.id === b.id);
      if (!meta) continue;
      files.push({ ...meta, dataUrl: await blobToDataURL(b.blob) });
    }
    return {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      counts: {
        clienti: data.clients.length,
        progetti: data.projects.length,
        fatture: data.invoices.length,
        pagamenti: data.payments.length,
        spese: data.expenses.length,
        attivita: data.activities.length,
        task: data.tasks.length,
        documenti: files.length,
      },
      data: {
        settings: data.settings,
        clients: data.clients,
        projects: data.projects,
        invoices: data.invoices,
        payments: data.payments,
        expenses: data.expenses,
        activities: data.activities,
        tasks: data.tasks,
        files,
      },
    };
  }

  // Valida la struttura minima di un backup prima di toccare il database
  function validateBackup(obj) {
    if (!obj || obj.format !== BACKUP_FORMAT) throw new Error('Il file non è un backup di questo gestionale.');
    if (obj.version !== BACKUP_VERSION) throw new Error(`Versione di backup non supportata: ${obj.version}`);
    const d = obj.data;
    if (!d || typeof d !== 'object') throw new Error('Backup senza dati.');
    for (const k of ['clients', 'projects', 'invoices', 'payments', 'expenses', 'activities', 'files']) {
      if (!Array.isArray(d[k])) throw new Error(`Sezione mancante nel backup: ${k}`);
      for (const r of d[k]) {
        if (!r || typeof r.id !== 'string' || !r.id) throw new Error(`Record senza id in "${k}".`);
      }
    }
    for (const f of d.files) {
      if (typeof f.dataUrl !== 'string') throw new Error(`Documento senza contenuto: ${f.name || f.id}`);
    }
    return d;
  }

  // Sostituisce interamente i dati con quelli del backup (operazione atomica)
  async function importAll(obj) {
    const d = validateBackup(obj);
    const blobs = d.files.map((f) => ({ id: f.id, blob: dataURLToBlob(f.dataUrl, f.mime) }));
    const metas = d.files.map(({ dataUrl, ...rest }) => rest);
    await run(ALL_STORES, 'readwrite', (tx) => {
      for (const s of ALL_STORES) tx.objectStore(s).clear();
      for (const c of d.clients) tx.objectStore('clients').put(c);
      for (const p of d.projects) tx.objectStore('projects').put(p);
      for (const i of d.invoices) tx.objectStore('invoices').put(i);
      for (const p of d.payments) tx.objectStore('payments').put(p);
      for (const e of d.expenses) tx.objectStore('expenses').put(e);
      for (const a of d.activities) tx.objectStore('activities').put(a);
      for (const t of d.tasks || []) tx.objectStore('tasks').put(t);
      for (const m of metas) tx.objectStore('files').put(m);
      for (const b of blobs) tx.objectStore('blobs').put(b);
      tx.objectStore('meta').put({ id: 'settings', ...(d.settings || {}) });
    });
    return d;
  }

  async function requestPersistence() {
    try {
      if (root.navigator && root.navigator.storage && root.navigator.storage.persist) {
        return await root.navigator.storage.persist();
      }
    } catch (_) { /* non critico */ }
    return false;
  }

  async function storageEstimate() {
    try {
      if (root.navigator && root.navigator.storage && root.navigator.storage.estimate) {
        const e = await root.navigator.storage.estimate();
        return { usage: e.usage || 0, quota: e.quota || 0 };
      }
    } catch (_) { /* non critico */ }
    return null;
  }

  root.DB = {
    open, loadAll, put, remove, saveSettings, saveFile, removeFile, getBlob,
    exportAll, importAll, validateBackup, requestPersistence, storageEstimate,
    BACKUP_FORMAT, BACKUP_VERSION,
  };
})(typeof window !== 'undefined' ? window : globalThis);
