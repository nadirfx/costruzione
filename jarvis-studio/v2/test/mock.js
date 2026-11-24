// Test-only mock of the claude.ai runtime capabilities used by Jarvis Studio.
(() => {
  const store = new Map(); // path -> body
  const listeners = new Set();
  const blobs = {};
  window.__mockBlobs = blobs;
  window.__mockStore = store;
  window.__downloads = [];
  window.__sampleCalls = [];
  const clone = o => JSON.parse(JSON.stringify(o));
  const snapDoc = (path) => { const b = store.get(path); return { id: path.split('/').pop(), exists: !!b, data: () => b ? clone(b) : undefined, metadata: { fromCache: false, hasPendingWrites: false } }; };
  const notify = () => { for (const l of [...listeners]) setTimeout(l, 0); };
  function query(col, filters = [], order = null, lim = 1000) {
    const api = {
      where(f, op, v) { return query(col, [...filters, [f, op, v]], order, lim); },
      orderBy(f, d = 'asc') { return query(col, filters, [f, d], lim); },
      limit(n) { return query(col, filters, order, n); },
      _run() {
        let docs = [];
        for (const [p, b] of store) { const parts = p.split('/'); if (parts.slice(0, -1).join('/') === col) docs.push({ p, b }); }
        docs = docs.filter(({ b }) => filters.every(([f, op, v]) => op === '==' ? b[f] === v : op === '!=' ? b[f] !== v : true));
        if (order) docs.sort((a, b) => { const x = a.b[order[0]], y = b.b[order[0]]; return (x > y ? 1 : x < y ? -1 : 0) * (order[1] === 'desc' ? -1 : 1); });
        else docs.sort((a, b) => a.p < b.p ? -1 : 1);
        const out = docs.slice(0, lim).map(d => snapDoc(d.p));
        return { docs: out, size: out.length, empty: !out.length, docChanges: () => [], metadata: { fromCache: false, hasPendingWrites: false } };
      },
      async get() { return api._run(); },
      onSnapshot(next, err) { const l = () => next(api._run()); listeners.add(l); setTimeout(l, 30); return () => listeners.delete(l); },
    };
    return api;
  }
  const docRef = (path) => ({
    id: path.split('/').pop(), path,
    async get() { return snapDoc(path); },
    async set(d) { if (!d || typeof d !== 'object' || Array.isArray(d)) throw { code: 'invalid_argument' }; store.set(path, clone(d)); notify(); },
    async update(d) { if (!store.has(path)) throw { code: 'invalid_argument', message: 'missing' }; const b = store.get(path); for (const [k, v] of Object.entries(clone(d))) b[k] = v; notify(); },
    async delete() { store.delete(path); notify(); },
    onSnapshot(next) { const l = () => next(snapDoc(path)); listeners.add(l); setTimeout(l, 30); return () => listeners.delete(l); },
    collection(c) { return colRef(path + '/' + c); },
  });
  let n = 0;
  const colRef = (col) => Object.assign(query(col), { path: col, doc(id) { return docRef(col + '/' + (id || ('m' + (++n) + Math.random().toString(36).slice(2, 7)))); }, async add(d) { const r = this.doc(); await r.set(d); return r; } });
  const db = { doc: docRef, collection: colRef };
  const assets = {
    async upload(blob, o) { if (blob.size > 20 * 1024 * 1024) throw { code: 'too_large', message: 'too large' }; const id = Math.random().toString(16).slice(2).padEnd(32, '0').slice(0, 32); blobs[id] = URL.createObjectURL(blob); return { id, url: blobs[id], sizeBytes: blob.size, contentType: (o && o.type) || blob.type }; },
    async list() { return { assets: [], usage: { files: 0, bytes: 0, maxFiles: 1000, maxBytes: 1e9 } }; },
    async delete() { return { deleted: true }; },
  };
  const downloads = { async save({ filename, data }) { window.__downloads.push({ filename, size: data.size || data.length || data.byteLength }); return { status: 'saved' }; } };
  const user = { async id() { return 'u_test'; }, async isOwner() { return true; }, async canEdit() { return true; }, async can() { return true; }, async me() { return { id: 'u_test', name: 'Nadir' }; }, async profiles() { return {}; } };
  // sample: scripted answers. Edit plans come back as JSON lines built from the prompt's materials.
  async function sample(input, opts = {}) {
    const text0 = typeof input === 'string' ? input : input.map(t => t.content).join('\n');
    window.__sampleCalls.push(text0.slice(0, 400));
    let out;
    if (/OPERAZIONI|ONE JSON OBJECT PER LINE|una per riga/i.test(text0)) {
      const mats = [...text0.matchAll(/\[(m[^\]]+)\] (video|image|audio)/g)].map(m => ({ id: m[1], kind: m[2] }));
      const lines = []; let t = 0;
      lines.push(JSON.stringify({ op: 'say', text: 'Analizzo i materiali e preparo il primo montaggio.' }));
      for (const m of mats.filter(m => m.kind !== 'audio')) { lines.push(JSON.stringify({ op: 'add_clip', track: 'V1', mat: m.id, start: t, dur: 2.5, in: 0, trans: t ? 'window' : 'none' })); lines.push(JSON.stringify({ op: 'add_sfx', name: 'whoosh', at: t })); t += 2.5; }
      for (const m of mats.filter(m => m.kind === 'audio')) lines.push(JSON.stringify({ op: 'add_clip', track: 'A1', mat: m.id, start: 0, dur: Math.max(2, t), in: 0 }));
      lines.push(JSON.stringify({ op: 'add_text', text: 'Instagram chiude.', style: 'keyword', start: 0.2, dur: 2, color: 'red', y: 0.66 }));
      lines.push(JSON.stringify({ op: 'add_zoom', start: 0.5, dur: 0.6, scale: 1.15 }));
      lines.push(JSON.stringify({ op: 'say', text: 'Primo montaggio pronto: rivedi e dimmi cosa cambiare.' }));
      out = lines.join('\n');
    } else if (/BRIEF/.test(text0)) {
      out = 'Perfetto, ho capito: un video B da 40 secondi per follower, gancio sulla notizia shock. Chi parla, tu o una voce AI?\nBRIEF: {"title":"Google cancella le recensioni","goal":"follower","duration":"40 s","cta":"Commenta CLAUDE","hook":"Da domani Google cancella tutte le recensioni"}';
    } else out = 'Ok.';
    if (opts.signal && opts.signal.aborted) throw { code: 'cancelled' };
    let acc = '';
    const chunks = out.match(/[\s\S]{1,40}/g) || [out];
    for (const c of chunks) { await new Promise(r => setTimeout(r, 25)); if (opts.signal && opts.signal.aborted) throw { code: 'cancelled', text: acc }; acc += c; opts.onText && opts.onText({ text: acc, delta: c }); }
    return { text: acc, truncated: false, modelTierApplied: opts.modelTier || 'default' };
  }
  sample.json = async (i, o) => JSON.parse((await sample(i, o)).text);
  sample.limits = async () => ({ maxPromptBytes: 262144, tools: { maxCount: 20 } });
  const caps = { db, assets, downloads, user, sample, dictation: null, tts: null };
  window.claude = { use: async (name) => { await new Promise(r => setTimeout(r, 20)); return name in caps ? caps[name] : null; } };
})();
