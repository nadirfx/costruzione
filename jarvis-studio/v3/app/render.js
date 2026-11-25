// Frame compositor shared by the live preview and the export, so the preview is exactly what gets exported.
// drawFrame(ctx, W, H, t, clips, media) — media.video(mat)/media.image(mat) return ready sources or null.
import { COLORS } from './data.js';
export const TD = 0.45; // transition length (s)
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const eo = k => 1 - Math.pow(1 - k, 3), e4o = k => 1 - Math.pow(1 - k, 4), eio = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
export const visualAt = (clips, track, t) => clips.filter(c => c.track === track && t >= c.start && t < c.start + c.dur).sort((a, b) => a.start - b.start);
export const end = (c) => c.start + c.dur;
export const timelineEnd = (clips) => clips.reduce((m, c) => Math.max(m, c.start + c.dur), 0);
const col = (k) => COLORS[k] || k || COLORS.white;

function srcOf(c, media) { if (c.kind === 'video') return media.video(c.mat); if (c.kind === 'image') return media.image(c.mat); return null; }
function srcSize(s) { return s ? [s.videoWidth || s.naturalWidth || s.width || 0, s.videoHeight || s.naturalHeight || s.height || 0] : [0, 0]; }

// zoom multiplier from V2 zoom-effect clips (punch in fast, hold, ease out)
function zoomAt(clips, t) {
  let z = 1;
  for (const c of clips) if (c.kind === 'zoom' && t >= c.start && t < c.start + c.dur) {
    const k = (t - c.start), out = c.start + c.dur - t; const s = c.zoom || 1.15;
    const a = e4o(clamp(k / 0.12)) * (out < 0.18 ? eio(clamp(out / 0.18)) : 1);
    z *= 1 + (s - 1) * a;
  }
  return z;
}
function drawMedia(ctx, W, H, c, media, t, extraScale = 1) {
  const s = srcOf(c, media); const [sw, sh] = srcSize(s);
  if (!s || !sw || !sh) { ctx.fillStyle = '#0a1a20'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#2b6575'; ctx.font = `600 ${Math.round(H * 0.022)}px Inter, sans-serif`; ctx.textAlign = 'center'; ctx.fillText('caricamento…', W / 2, H / 2); return; }
  const fit = c.fit || 'cover';
  const base = fit === 'contain' ? Math.min(W / sw, H / sh) : Math.max(W / sw, H / sh);
  const k = clamp((t - c.start) / Math.max(0.01, c.dur));
  const kb = c.kenburns ? 1 + 0.08 * eio(k) : 1;
  const sc = base * (c.zoom || 1) * kb * extraScale;
  const dw = sw * sc, dh = sh * sc;
  const ox = (c.x || 0) * W, oy = (c.y0 || 0) * H;
  if (fit === 'contain') { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); }
  ctx.drawImage(s, (W - dw) / 2 + ox, (H - dh) / 2 + oy, dw, dh);
}
function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }

function drawBase(ctx, W, H, t, clips, media) {
  const z = zoomAt(clips, t);
  const act = visualAt(clips, 'V1', t);
  const cur = act[act.length - 1];
  if (!cur) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); return; }
  const into = t - cur.start; const tr = cur.trans || 'none';
  const prev = clips.filter(c => c.track === 'V1' && c !== cur && Math.abs(end(c) - cur.start) < 0.06).sort((a, b) => end(b) - end(a))[0];
  if (tr === 'none' || !prev || into >= TD) { drawMedia(ctx, W, H, cur, media, t, z); if (tr === 'flash' && into < TD) flash(ctx, W, H, into / TD); return; }
  const k = into / TD, tp = Math.min(t, end(prev) - 0.01);
  if (tr === 'fade') { drawMedia(ctx, W, H, prev, media, tp, z); ctx.globalAlpha = eio(k); drawMedia(ctx, W, H, cur, media, t, z); ctx.globalAlpha = 1; }
  else if (tr === 'window') {
    ctx.save(); const s = 1 - 0.12 * eio(k); ctx.translate(W / 2, H / 2); ctx.scale(s, s); ctx.translate(-W / 2, -H / 2); drawMedia(ctx, W, H, prev, media, tp, z); ctx.restore();
    ctx.fillStyle = `rgba(0,0,0,${0.45 * k})`; ctx.fillRect(0, 0, W, H);
    const m = 1 - e4o(k), r = Math.min(W, H) * 0.06 * m; const rect = [W * 0.09 * m, H * 0.2 * m, W - W * 0.18 * m, H - H * 0.4 * m];
    ctx.save(); roundRect(ctx, ...rect, r); ctx.clip(); const s2 = 1.1 - 0.1 * e4o(k); ctx.translate(W / 2, H / 2); ctx.scale(s2, s2); ctx.translate(-W / 2, -H / 2); drawMedia(ctx, W, H, cur, media, t, z); ctx.restore();
  }
  else if (tr === 'flash') { (k < 0.5 ? drawMedia(ctx, W, H, prev, media, tp, z) : drawMedia(ctx, W, H, cur, media, t, z)); flash(ctx, W, H, k); }
  else if (tr === 'whip') {
    const e = eio(k); ctx.save(); ctx.filter = `blur(${Math.round(Math.sin(k * Math.PI) * W * 0.012)}px)`;
    ctx.translate(-e * W, 0); drawMedia(ctx, W, H, prev, media, tp, z); ctx.translate(W, 0); drawMedia(ctx, W, H, cur, media, t, z); ctx.restore();
  }
  else if (tr === 'zoom') {
    ctx.save(); ctx.globalAlpha = 1 - eio(k); const s = 1 + 0.6 * eio(k); ctx.translate(W / 2, H / 2); ctx.scale(s, s); ctx.translate(-W / 2, -H / 2); drawMedia(ctx, W, H, prev, media, tp, z); ctx.restore();
    ctx.save(); ctx.globalAlpha = eio(k); const s2 = 0.75 + 0.25 * e4o(k); ctx.translate(W / 2, H / 2); ctx.scale(s2, s2); ctx.translate(-W / 2, -H / 2); drawMedia(ctx, W, H, cur, media, t, z); ctx.restore();
  }
  else drawMedia(ctx, W, H, cur, media, t, z);
}
function flash(ctx, W, H, k) { const a = Math.sin(clamp(k) * Math.PI); if (a <= 0) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, Math.max(W, H) * 0.6); g.addColorStop(0, `rgba(255,255,255,${0.9 * a})`); g.addColorStop(0.4, `rgba(255,240,225,${0.35 * a})`); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); }

/* ---------- text styles ---------- */
function inOut(c, t) { const a = clamp((t - c.start) / 0.28), b = clamp((c.start + c.dur - t) / 0.18); return [e4o(a), b]; }
function fitFont(ctx, txt, weight, size, maxW, family = 'Inter, sans-serif') { let s = size; ctx.font = `${weight} ${s}px ${family}`; while (ctx.measureText(txt).width > maxW && s > 8) { s *= 0.94; ctx.font = `${weight} ${s}px ${family}`; } return s; }
function drawText(ctx, W, H, c, t) {
  const [a, b] = inOut(c, t); if (a <= 0 || b <= 0) return;
  const U = Math.min(W, H) / 1080; const y = (c.y ?? 0.66) * H; const maxW = W * 0.86; const style = c.style || 'keyword'; const C = col(c.color || (style === 'keyword' ? 'red' : 'white'));
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (style === 'keyword') {
    if (c.sub) { const s = fitFont(ctx, c.sub, 500, 46 * U, maxW); ctx.globalAlpha = a * b; ctx.fillStyle = c.subColor ? col(c.subColor) : '#ffffff'; ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 14 * U; ctx.fillText(c.sub, W / 2, y - 96 * U + (1 - a) * 30 * U); ctx.shadowBlur = 0; }
    const size = fitFont(ctx, c.text || '', 900, 112 * U, maxW); const pop = 1 + 0.1 * (1 - a);
    ctx.globalAlpha = Math.min(1, a * 1.6) * b; ctx.translate(W / 2, y + (1 - a) * 50 * U - (1 - b) * 40 * U); ctx.scale(pop, pop);
    const w = ctx.measureText(c.text || '').width;
    if ((c.color || '') === 'lime') { ctx.fillStyle = COLORS.lime; const hk = e4o(clamp((t - c.start - 0.05) / 0.3)); roundRect(ctx, -w / 2 - 14 * U, -size * 0.52, (w + 28 * U) * hk, size * 1.04, 10 * U); ctx.fill(); ctx.fillStyle = COLORS.ink; }
    else { ctx.fillStyle = C; ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 18 * U; }
    ctx.fillText(c.text || '', 0, size * 0.04);
  } else if (style === 'apple') {
    const size = fitFont(ctx, c.text || '', 700, 120 * U, maxW); ctx.globalAlpha = Math.min(1, a * 2) * b; ctx.filter = `blur(${Math.round((1 - a) * 14 * U)}px)`;
    const w = ctx.measureText(c.text || '').width; const g = ctx.createLinearGradient(W / 2 - w / 2, 0, W / 2 + w / 2, 0); g.addColorStop(0, C); g.addColorStop(1, '#ffb36b');
    ctx.fillStyle = c.color === 'white' ? '#fff' : g; ctx.fillText(c.text || '', W / 2, y + (1 - a) * 36 * U);
  } else if (style === 'caption') {
    const words = (c.text || '').split(/\s+/).filter(Boolean); const n = words.length || 1; const span = Math.max(0.2, c.dur - 0.25);
    const size = 64 * U; ctx.font = `800 ${size}px Inter, sans-serif`; const sp = size * 0.28;
    const ws = words.map(w => ctx.measureText(w.replace(/\*/g, '')).width); let tot = ws.reduce((x, y) => x + y, 0) + sp * (n - 1); const sc = tot > maxW ? maxW / tot : 1;
    ctx.translate(W / 2, y); ctx.scale(sc, sc); let x = -tot / 2; ctx.textAlign = 'left'; ctx.globalAlpha = b;
    words.forEach((w, i) => { const tw = c.start + (i / n) * span; const k = clamp((t - tw) / 0.12); if (k > 0) { const key = /^\*.*\*$/.test(w); ctx.globalAlpha = k * b; ctx.fillStyle = key ? col(c.color || 'lime') : '#ffffff'; ctx.lineWidth = 8 * U; ctx.strokeStyle = 'rgba(0,0,0,.65)'; ctx.lineJoin = 'round'; const s = w.replace(/\*/g, ''); ctx.strokeText(s, x, (1 - e4o(k)) * 18 * U); ctx.fillText(s, x, (1 - e4o(k)) * 18 * U); } x += ws[i] + sp; });
  } else if (style === 'title') {
    const size = fitFont(ctx, c.text || '', 900, 150 * U, maxW); const s = 0.8 + 0.2 * e4o(a); ctx.globalAlpha = a * b; ctx.translate(W / 2, y); ctx.scale(s, s);
    ctx.fillStyle = C; ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 30 * U; ctx.fillText(c.text || '', 0, 0);
  } else if (style === 'label') {
    const size = 30 * U; ctx.font = `800 ${size}px Inter, sans-serif`; const w = ctx.measureText(c.text || '').width + 70 * U; ctx.globalAlpha = a * b;
    ctx.fillStyle = 'rgba(20,20,20,.92)'; roundRect(ctx, W / 2 - w / 2, y - 40 * U, w, 80 * U, 40 * U); ctx.fill();
    ctx.fillStyle = COLORS.lime; ctx.beginPath(); ctx.arc(W / 2 - w / 2 + 34 * U, y, 9 * U, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillText(c.text || '', W / 2 + 14 * U, y + 2 * U);
  }
  ctx.restore();
}
function drawOverlayImage(ctx, W, H, c, media, t) {
  const s = media.image(c.mat) || media.video(c.mat); const [sw, sh] = srcSize(s); if (!s || !sw) return;
  const [a, b] = inOut(c, t); const sc = (c.scale || 0.5) * W / sw * (0.9 + 0.1 * a);
  ctx.save(); ctx.globalAlpha = a * b; const dw = sw * sc, dh = sh * sc; const cx = W / 2 + (c.x || 0) * W, cy = (c.y ?? 0.5) * H + (1 - a) * 30;
  ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 30; ctx.drawImage(s, cx - dw / 2, cy - dh / 2, dw, dh); ctx.restore();
}
export function drawFrame(ctx, W, H, t, clips, media) {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none'; ctx.globalCompositeOperation = 'source-over';
  drawBase(ctx, W, H, t, clips, media);
  for (const c of visualAt(clips, 'V2', t)) { if (c.kind === 'text') drawText(ctx, W, H, c, t); else if (c.kind === 'image' || c.kind === 'video') drawOverlayImage(ctx, W, H, c, media, t); }
  ctx.restore();
}
// which source time a media clip needs at timeline time t
export const srcTime = (c, t) => (c.in || 0) + (t - c.start) * (c.speed || 1);
