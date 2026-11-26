// Destructive actions with an in-page confirmation (the viewer never shows confirm() dialogs):
// first tap arms the button for 4 seconds, second tap does it.
import { S, el, toast, writeErr, feed } from './state.js';
import { forget } from './player.js';

export function confirmBtn(label, armedLabel, action, cls = 'btn danger sm') {
  let armed = false, t = 0;
  const b = el('button', { class: cls, type: 'button' }, label);
  b.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!armed) { armed = true; b.textContent = armedLabel; b.classList.add('armed'); clearTimeout(t); t = setTimeout(() => { armed = false; b.textContent = label; b.classList.remove('armed'); }, 4000); return; }
    clearTimeout(t); b.disabled = true; b.textContent = 'Elimino…';
    try { await action(); } finally { if (b.isConnected) { b.disabled = false; armed = false; b.textContent = label; b.classList.remove('armed'); } }
  });
  return b;
}

// Removes a mission and everything stored under it (documents and uploaded files).
export async function deleteMission(p) {
  if (!S.db || !S.canWrite) { toast('Non hai i permessi per eliminare.'); return; }
  try {
    const base = 'projects/' + p.id;
    const files = new Set();
    for (const v of p.versions || []) { if (v.assetId) files.add(v.assetId); if (v.posterId) files.add(v.posterId); }
    try { const ed = await S.db.doc(base + '/state/edit').get(); if (ed.exists) for (const m of (ed.data().materials || [])) if (m.assetId) files.add(m.assetId); } catch (e) { }
    for (const col of ['notes', 'agents']) { try { const s = await S.db.collection(base + '/' + col).get(); for (const d of s.docs) await S.db.doc(base + '/' + col + '/' + d.id).delete().catch(() => { }); } catch (e) { } }
    for (const d of ['edit', 'live', 'script', 'machine', 'chat']) await S.db.doc(base + '/state/' + d).delete().catch(() => { });
    await S.db.doc(base).delete();
    if (S.assets) for (const id of files) { forget(id); S.assets.delete(id).catch(() => { }); }
    toast('Missione eliminata.'); feed('Missione eliminata · ' + (p.title || ''));
  } catch (e) { toast(writeErr(e)); throw e; }
}
