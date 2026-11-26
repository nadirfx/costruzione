// Reliable playback of stored videos in every browser.
// Safari plays a stored file only if the server answers range requests the way it wants; to never depend on that,
// the whole file is fetched once and played from memory (blob URL). Cached per asset, released when no longer needed.
import { blobUrl, el, toast } from './state.js';

const cache = new Map(); // assetId -> Promise<string url>
export function playableUrl(assetId) {
  if (!assetId) return Promise.reject(new Error('no asset'));
  if (!cache.has(assetId)) {
    const p = (async () => {
      const direct = blobUrl(assetId);
      try {
        const r = await fetch(direct); if (!r.ok) throw new Error('http ' + r.status);
        const b = await r.blob(); const type = /^video\//.test(b.type) ? b.type : 'video/mp4';
        return URL.createObjectURL(b.type === type ? b : new Blob([b], { type }));
      } catch (e) { return direct; } // fall back to the stored URL as is
    })();
    cache.set(assetId, p); p.catch(() => cache.delete(assetId));
  }
  return cache.get(assetId);
}
export function forget(assetId) { const p = cache.get(assetId); cache.delete(assetId); if (p) p.then(u => { if (u && u.startsWith('blob:')) URL.revokeObjectURL(u); }).catch(() => { }); }
export const posterUrl = (v) => (v && v.posterId ? blobUrl(v.posterId) : '');

// Attach a version to a <video>: poster at once, file loaded in memory, a clear message if it cannot play.
export async function attach(video, v, { box, autoplay } = {}) {
  const want = v && v.assetId ? v.assetId : '';
  video.dataset.asset = want;
  const msg = box && box.querySelector('.vmsg'); if (msg) msg.remove();
  video.poster = posterUrl(v) || '';
  if (!want) { video.removeAttribute('src'); video.load(); return; }
  if (box) box.classList.add('loading');
  const url = await playableUrl(want);
  if (video.dataset.asset !== want) return; // the user moved on meanwhile
  if (video.src !== url) { video.src = url; video.load(); }
  const done = () => box && box.classList.remove('loading');
  video.addEventListener('loadeddata', done, { once: true });
  video.addEventListener('error', () => {
    done(); if (!box || video.dataset.asset !== want) return;
    const m = el('div', { class: 'vmsg' }, el('b', { text: 'Questo video non si apre in questo browser.' }), el('span', { text: 'Riprova, oppure scarica il file con Esporta.' }),
      el('button', { class: 'btn sm', type: 'button', onclick: () => { forget(want); attach(video, v, { box, autoplay: true }); } }, 'Riprova'));
    box.append(m);
  }, { once: true });
  if (autoplay) video.play().catch(() => { });
}
export function fullscreen(video) {
  const f = video.requestFullscreen || video.webkitRequestFullscreen || video.webkitEnterFullscreen;
  if (!f) { toast('Schermo intero non disponibile qui.'); return; }
  try { const r = f.call(video); if (r && r.catch) r.catch(() => toast('Schermo intero non disponibile qui.')); } catch (e) { toast('Schermo intero non disponibile qui.'); }
}
