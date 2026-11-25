// One edit document per mission (materials + timeline), shared by Briefing and Editor.
// Path: projects/<id>/state/edit. Saves are debounced and serialized (one write at a time per doc).
import { S, emit, on, now, toast, writeErr , plain } from './state.js';

export const E = { pid: null, materials: [], clips: [], rev: 0, loaded: false };
let unsub = null, timer = null, writing = false, again = false, lastSaved = 0;

export function emptyEdit() { return { materials: [], clips: [], rev: 0 }; }
export function editPath(pid) { return 'projects/' + pid + '/state/edit'; }

export function openEdit(pid) {
  if (E.pid === pid && unsub) return;
  if (unsub) { unsub(); unsub = null; }
  Object.assign(E, { pid, materials: [], clips: [], rev: 0, loaded: false });
  emit('edit', { remote: true });
  if (!S.db || !pid) return;
  listen(pid);
}
// (re)attach the live listener without touching what is on screen: pending local edits keep winning
function listen(pid) {
  if (unsub) { try { unsub(); } catch (e) { } unsub = null; }
  unsub = S.db.doc(editPath(pid)).onSnapshot((snap) => {
    if (E.pid !== pid) return;
    const d = snap.exists ? plain(snap.data()) : null;
    if (E.loaded && (writing || timer)) return; // local edits pending win, always
    if (E.loaded && !d) return; // nothing saved remotely yet: keep what is on screen
    if (d && (d.rev || 0) <= lastSaved && E.loaded) return; // our own echo or older
    E.materials = (d && d.materials) || []; E.clips = (d && d.clips) || []; E.rev = (d && d.rev) || 0; E.loaded = true;
    lastSaved = E.rev;
    emit('edit', { remote: true });
  }, () => { if (!E.loaded) { E.loaded = true; emit('edit', { remote: true }); } setTimeout(() => { if (E.pid === pid && S.db) listen(pid); }, 4000); });
}
on('reconnect', () => { if (E.pid && S.db) listen(E.pid); });
export function closeEdit() { if (unsub) { unsub(); unsub = null; } }

export function touch(reason) { // mark changed and schedule a save
  emit('edit', { remote: false, reason });
  emit('saveState', 'pending');
  clearTimeout(timer); timer = setTimeout(flush, 700);
}

export async function flush() {
  clearTimeout(timer); timer = null;
  if (!S.db || !E.pid) return;
  if (writing) { again = true; return; }
  writing = true; emit('saveState', 'saving');
  const pid = E.pid; E.rev = Math.max(E.rev, lastSaved) + 1; const rev = E.rev;
  const body = { materials: E.materials.filter(m => !m.status || m.status === 'ok').map(({ prog, ...m }) => m), clips: E.clips, rev, savedAt: now() };
  try {
    if (JSON.stringify(body).length > 240000) throw { code: 'too_big' };
    await S.db.doc(editPath(pid)).set(body);
    lastSaved = rev; emit('saveState', 'saved');
    const p = S.projects.find(p => p.id === pid);
    if (p && !p.hasEdit && E.clips.length) S.db.doc('projects/' + pid).update({ hasEdit: true, updatedAt: now() }).catch(() => { });
  } catch (e) {
    emit('saveState', 'error');
    toast(e && e.code === 'too_big' ? 'Progetto troppo grande per un salvataggio: elimina clip o materiali inutili.' : writeErr(e));
  } finally {
    writing = false;
    if (again) { again = false; flush(); }
  }
}

export function matById(id) { return E.materials.find(m => m.id === id) || null; }
