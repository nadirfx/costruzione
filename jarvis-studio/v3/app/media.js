// Media elements per material (video/image/audio) and per sound effect ("sfx:<key>"), shared by preview and export.
import { blobUrl } from './state.js';
import { SFX } from './data.js';
import { E } from './proj.js';

const els = new Map(); // key -> {el, kind, src}
function srcFor(key) {
  if (key.startsWith('sfx:')) { const s = SFX.find(x => x.key === key.slice(4)); return s && s.assetId ? { url: blobUrl(s.assetId), kind: 'audio' } : null; }
  const m = E.materials.find(x => x.id === key); return m && m.assetId ? { url: blobUrl(m.assetId), kind: m.kind } : null;
}
export function get(key) {
  if (!key) return null;
  let e = els.get(key);
  const s = srcFor(key); if (!s) return null;
  if (e && e.src === s.url) return e;
  if (e) dispose(key);
  let el;
  if (s.kind === 'image') { el = new Image(); el.decoding = 'async'; el.src = s.url; }
  else { el = document.createElement(s.kind === 'video' ? 'video' : 'audio'); el.preload = 'auto'; el.playsInline = true; el.src = s.url; if (s.kind === 'video') { el.muted = false; } }
  e = { el, kind: s.kind, src: s.url }; els.set(key, e);
  return e;
}
export function dispose(key) { const e = els.get(key); if (!e) return; if (e.el.pause) { e.el.pause(); e.el.removeAttribute('src'); e.el.load && e.el.load(); } els.delete(key); }
export function pauseAll() { for (const e of els.values()) if (e.el.pause && !e.el.paused) e.el.pause(); }
export function all() { return els; }
export const media = {
  video(key) { const e = get(key); return e && e.kind === 'video' && e.el.readyState >= 2 ? e.el : null; },
  image(key) { const e = get(key); return e && e.kind === 'image' && e.el.complete && e.el.naturalWidth ? e.el : null; },
};
// promise that resolves once a video element shows the requested time (used by export and paused scrubbing)
export function seekTo(el, t) {
  return new Promise((res) => {
    if (!el || el.readyState < 1) { res(); return; }
    const want = Math.max(0, Math.min(t, (el.duration || t) - 0.02));
    if (Math.abs(el.currentTime - want) < 0.004 && el.readyState >= 2) { res(); return; }
    let done = false; const fin = () => { if (done) return; done = true; el.removeEventListener('seeked', fin); res(); };
    el.addEventListener('seeked', fin); el.currentTime = want; setTimeout(fin, 2500);
  });
}
export function whenReady(el) {
  return new Promise((res) => {
    if (!el) return res();
    if (el instanceof HTMLImageElement) { if (el.complete) return res(); el.onload = el.onerror = () => res(); return; }
    if (el.readyState >= 2) return res();
    const f = () => { el.removeEventListener('loadeddata', f); res(); }; el.addEventListener('loadeddata', f); el.addEventListener('error', () => res(), { once: true }); setTimeout(res, 8000);
  });
}
