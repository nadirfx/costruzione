// Export: renders every frame offline with the same compositor as the preview, mixes audio offline,
// encodes with WebCodecs (H.264/AAC in MP4, VP9/Opus in WebM) and hands the file to the viewer.
import { S, $, el, toast, now, feed, blobUrl, writeErr } from './state.js';
import { E, flush } from './proj.js';
import { drawFrame, timelineEnd, srcTime, visualAt } from './render.js';
import * as M from './media.js';
import { ASPECTS } from './data.js';

let api, abort = false, working = false;
export function init(a) {
  api = a;
  $('exportBtn').addEventListener('click', open);
  $('exGo').addEventListener('click', go);
  $('exCancel').addEventListener('click', () => { if (working) { abort = true; $('exMsg').textContent = 'Annullo…'; } else $('exportDlg').close(); });
  $('exportDlg').addEventListener('cancel', (e) => { if (working) e.preventDefault(); });
}
function open() {
  if (!E.clips.length) { toast('La timeline è vuota: monta qualcosa prima di esportare.'); return; }
  $('exMsg').textContent = support() ? '' : 'Questo browser non sa codificare video: usa Chrome, Edge o Safari aggiornati.';
  $('exProgWrap').hidden = true; $('exGo').disabled = !support(); $('exCancel').textContent = 'Chiudi';
  $('exAfter').querySelector('[value="both"]').disabled = !S.assets;
  $('exportDlg').showModal();
}
const support = () => typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined';
function dims(aspect, res) { const [w, h] = ASPECTS[aspect] || ASPECTS['9:16']; const s = res / Math.min(w, h); return [Math.round(w * s / 2) * 2, Math.round(h * s / 2) * 2]; }
async function pickVideo(fmt, W, H, fps) {
  const bitrate = Math.round(W * H * fps * 0.12);
  const cands = fmt === 'mp4'
    ? [['avc', 'avc1.640034'], ['avc', 'avc1.4d0034'], ['avc', 'avc1.42003e'], ['vp9', 'vp09.00.50.08']]
    : [['V_VP9', 'vp09.00.50.08'], ['V_VP8', 'vp8']];
  for (const [mux, codec] of cands) {
    const cfg = { codec, width: W, height: H, bitrate, framerate: fps, latencyMode: 'quality', ...(codec.startsWith('avc') ? { avc: { format: 'avc' } } : {}) };
    try { const r = await VideoEncoder.isConfigSupported(cfg); if (r.supported) return { mux, cfg: r.config || cfg }; } catch (e) { }
  }
  return null;
}
async function pickAudio(fmt) {
  if (typeof AudioEncoder === 'undefined') return null;
  const cands = fmt === 'mp4' ? [['aac', 'mp4a.40.2'], ['opus', 'opus']] : [['A_OPUS', 'opus']];
  for (const [mux, codec] of cands) { const cfg = { codec, sampleRate: 48000, numberOfChannels: 2, bitrate: 192000 }; try { const r = await AudioEncoder.isConfigSupported(cfg); if (r.supported) return { mux, cfg }; } catch (e) { } }
  return null;
}
const decoded = new Map();
async function decodeAudio(key, ac) {
  if (decoded.has(key)) return decoded.get(key);
  const e = M.get(key); if (!e) return null;
  try { const buf = await (await fetch(e.src)).arrayBuffer(); const ab = await ac.decodeAudioData(buf); decoded.set(key, ab); return ab; } catch (err) { decoded.set(key, null); return null; }
}
async function mixAudio(dur) {
  const sr = 48000; const len = Math.max(1, Math.ceil(dur * sr));
  const oc = new OfflineAudioContext(2, len, sr);
  const comp = oc.createDynamicsCompressor(); comp.threshold.value = -6; comp.knee.value = 6; comp.ratio.value = 12; comp.attack.value = 0.003; comp.release.value = 0.15; comp.connect(oc.destination);
  for (const c of E.clips) {
    if (!c.mat || (c.kind !== 'audio' && c.kind !== 'video') || c.track === 'V2') continue;
    const ab = await decodeAudio(c.mat, oc); if (!ab) continue;
    const src = oc.createBufferSource(); src.buffer = ab; src.playbackRate.value = c.speed || 1;
    const g = oc.createGain(); g.gain.value = Math.max(0, c.vol ?? 1); src.connect(g).connect(comp);
    const off = Math.max(0, c.in || 0); if (off >= ab.duration) continue;
    src.start(Math.max(0, c.start), off, Math.min(c.dur * (c.speed || 1), ab.duration - off));
  }
  const out = await oc.startRendering();
  // true-peak safety: never above -1 dBFS
  let pk = 0; for (let ch = 0; ch < 2; ch++) { const d = out.getChannelData(ch); for (let i = 0; i < d.length; i++) { const v = Math.abs(d[i]); if (v > pk) pk = v; } }
  const lim = Math.pow(10, -1 / 20); if (pk > lim) { const k = lim / pk; for (let ch = 0; ch < 2; ch++) { const d = out.getChannelData(ch); for (let i = 0; i < d.length; i++) d[i] *= k; } }
  return out;
}
function setProg(k, msg) { $('exProg').style.width = Math.round(k * 100) + '%'; if (msg) $('exMsg').textContent = msg; }
async function go() {
  const p = api.curP(); if (!p || working) return;
  const fmt = $('exFmt').value, res = +$('exRes').value, fps = +$('exFps').value, after = $('exAfter').value;
  const [W, H] = dims(p.aspect || '9:16', res); const dur = timelineEnd(E.clips); const N = Math.ceil(dur * fps);
  const vsel = await pickVideo(fmt, W, H, fps);
  if (!vsel) { $('exMsg').textContent = 'Questo browser non supporta questa combinazione: prova WebM o una risoluzione più bassa.'; return; }
  const asel = await pickAudio(fmt);
  working = true; abort = false; $('exGo').disabled = true; $('exCancel').textContent = 'Annulla'; $('exProgWrap').hidden = false; setProg(0, 'Preparo i materiali…');
  api.sys('busy', 'Export'); await flush();
  let out = null;
  try {
    // media ready
    for (const c of E.clips) if (c.mat && c.kind !== 'audio') await M.whenReady((M.get(c.mat) || {}).el);
    M.pauseAll();
    setProg(0.02, 'Mixo l\'audio…'); const audio = asel ? await mixAudio(dur) : null;
    const Mux = fmt === 'mp4' ? window.Mp4Muxer : window.WebMMuxer; if (!Mux) throw new Error('muxer');
    const target = new Mux.ArrayBufferTarget();
    const muxer = new Mux.Muxer({ target, video: { codec: vsel.mux, width: W, height: H, frameRate: fps }, ...(audio ? { audio: { codec: asel.mux, numberOfChannels: 2, sampleRate: 48000 } } : {}), ...(fmt === 'mp4' ? { fastStart: 'in-memory' } : {}) });
    let encErr = null;
    const venc = new VideoEncoder({ output: (ch, meta) => muxer.addVideoChunk(ch, meta), error: (e) => encErr = e }); venc.configure(vsel.cfg);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d', { alpha: false });
    for (let i = 0; i < N; i++) {
      if (abort) throw new Error('abort'); if (encErr) throw encErr;
      const t = i / fps;
      // seek every media element visible at t (base track, the clip it transitions from, overlays)
      const need = new Map();
      for (const c of E.clips) if (c.kind === 'video' && t >= c.start - 0.5 && t < c.start + c.dur) need.set(c.mat, srcTime(c, Math.max(c.start, Math.min(t, c.start + c.dur - 0.01))));
      await Promise.all([...need].map(([k, st]) => { const e = M.get(k); return e ? M.seekTo(e.el, st) : null; }));
      drawFrame(g, W, H, t, E.clips, M.media);
      const fr = new VideoFrame(cv, { timestamp: Math.round(i * 1e6 / fps), duration: Math.round(1e6 / fps) });
      venc.encode(fr, { keyFrame: i % (fps * 2) === 0 }); fr.close();
      while (venc.encodeQueueSize > 6) await new Promise(r => setTimeout(r, 4));
      if (i % 5 === 0) { setProg(0.05 + 0.85 * (i / N), `Frame ${i + 1} di ${N} · ${W}×${H}`); await new Promise(r => setTimeout(r, 0)); }
    }
    await venc.flush(); venc.close();
    if (audio) {
      setProg(0.92, 'Codifico l\'audio…'); let aErr = null;
      const aenc = new AudioEncoder({ output: (ch, meta) => muxer.addAudioChunk(ch, meta), error: (e) => aErr = e }); aenc.configure(asel.cfg);
      const L = audio.getChannelData(0), R = audio.getChannelData(1); const block = 4800;
      for (let o = 0; o < audio.length; o += block) {
        const n = Math.min(block, audio.length - o); const data = new Float32Array(n * 2); data.set(L.subarray(o, o + n), 0); data.set(R.subarray(o, o + n), n);
        const ad = new AudioData({ format: 'f32-planar', sampleRate: 48000, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round(o / 48000 * 1e6), data });
        aenc.encode(ad); ad.close(); if (aErr) throw aErr;
      }
      await aenc.flush(); aenc.close();
    }
    muxer.finalize();
    out = new Blob([target.buffer], { type: fmt === 'mp4' ? 'video/mp4' : 'video/webm' });
  } catch (e) {
    working = false; $('exGo').disabled = false; $('exCancel').textContent = 'Chiudi'; api.sys('ok', 'Online');
    setProg(0, e && e.message === 'abort' ? 'Export annullato.' : 'Export non riuscito: ' + ((e && e.message) || 'errore') + '. Prova una risoluzione più bassa o WebM.'); return;
  }
  const name = (p.title || 'video').normalize('NFKD').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase() + '-' + res + 'p.' + fmt;
  setProg(1, `Pronto: ${(out.size / 1048576).toFixed(1)} MB${vsel.mux === 'vp9' && fmt === 'mp4' ? ' (codec VP9: questo browser non codifica H.264)' : ''}`);
  feed('Export pronto: ' + name);
  if (S.downloads) { try { const r = await S.downloads.save({ filename: name, data: out }); if (r.status === 'saved') toast('Salvato: ' + name); } catch (e) { toast(e.code === 'declined' ? 'Salvataggio annullato.' : e.code === 'too_large' ? 'File troppo grande per questa destinazione.' : 'Salvataggio non riuscito.'); } }
  else toast('Salvataggio non disponibile in questa vista.');
  if (after === 'both') await toReview(p, out, name, W, H, dur);
  working = false; $('exGo').disabled = false; $('exCancel').textContent = 'Chiudi'; api.sys('ok', 'Online');
}
async function toReview(p, blob, name, W, H, dur) {
  if (!S.assets) return;
  if (blob.size > 20 * 1024 * 1024) { toast('Troppo grande per la revisione nell\'app (max 20 MB): esporta in 720p per mandarlo in revisione.', 6000); return; }
  try {
    const r = await S.assets.upload(blob, { type: blob.type });
    const vs = (p.versions || []).slice(); const v = vs.reduce((m, x) => Math.max(m, x.v || 0), 0) + 1;
    vs.push({ v, assetId: r.id, label: W + '×' + H, date: new Date().toLocaleDateString('it-IT'), durationSec: +dur.toFixed(2), filename: name.replace(/\.\w+$/, '') });
    await S.db.doc('projects/' + p.id).update({ versions: vs, status: 'revisione', updatedAt: now() });
    toast('Versione v' + v + ' in revisione.'); feed('v' + v + ' di ' + p.title + ' in revisione');
  } catch (e) { toast(e && e.code === 'too_large' ? 'File troppo grande per la revisione.' : writeErr(e)); }
}
