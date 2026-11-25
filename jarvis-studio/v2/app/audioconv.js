// The artifact store accepts video/mp4 and video/webm but not audio/* — wrap audio files into an audio-only MP4 (AAC)
// or WebM (Opus) container in the browser before uploading. Falls back to real-time MediaRecorder when WebCodecs is missing.
export async function audioToContainer(file, onProg) {
  const buf = await file.arrayBuffer();
  const ac = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(2, 48000, 48000);
  const ab = await ac.decodeAudioData(buf.slice(0));
  // resample to 48 kHz stereo
  const len = Math.ceil(ab.duration * 48000);
  const oc = new OfflineAudioContext(2, Math.max(1, len), 48000); const src = oc.createBufferSource(); src.buffer = ab; src.connect(oc.destination); src.start(0);
  const out = await oc.startRendering();
  if (typeof AudioEncoder !== 'undefined') {
    for (const [codec, kind] of [['mp4a.40.2', 'mp4'], ['opus', 'mp4'], ['opus', 'webm']]) {
      const cfg = { codec, sampleRate: 48000, numberOfChannels: 2, bitrate: 160000 };
      let ok = false; try { ok = (await AudioEncoder.isConfigSupported(cfg)).supported; } catch (e) { }
      if (!ok) continue;
      const Mux = kind === 'mp4' ? window.Mp4Muxer : window.WebMMuxer; if (!Mux) continue;
      const target = new Mux.ArrayBufferTarget();
      const muxer = new Mux.Muxer({ target, audio: { codec: kind === 'mp4' ? (codec === 'opus' ? 'opus' : 'aac') : 'A_OPUS', numberOfChannels: 2, sampleRate: 48000 }, ...(kind === 'mp4' ? { fastStart: 'in-memory' } : {}) });
      let err = null; const enc = new AudioEncoder({ output: (c, m) => muxer.addAudioChunk(c, m), error: (e) => err = e }); enc.configure(cfg);
      const L = out.getChannelData(0), R = out.getChannelData(1), B = 4800;
      for (let o = 0; o < out.length; o += B) {
        const n = Math.min(B, out.length - o); const d = new Float32Array(n * 2); d.set(L.subarray(o, o + n), 0); d.set(R.subarray(o, o + n), n);
        const a = new AudioData({ format: 'f32-planar', sampleRate: 48000, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round(o / 48000 * 1e6), data: d });
        enc.encode(a); a.close(); if (err) throw err; if (onProg && o % (B * 50) === 0) onProg(o / out.length);
      }
      await enc.flush(); enc.close(); muxer.finalize();
      return { blob: new Blob([target.buffer], { type: kind === 'mp4' ? 'video/mp4' : 'video/webm' }), dur: ab.duration };
    }
  }
  // fallback: record in real time
  const ctx = new AudioContext(); const dest = ctx.createMediaStreamDestination(); const s = ctx.createBufferSource(); s.buffer = ab; s.connect(dest);
  const mt = ['audio/webm;codecs=opus', 'audio/mp4;codecs=mp4a.40.2', 'audio/mp4'].find(t => MediaRecorder.isTypeSupported(t)) || '';
  const rec = new MediaRecorder(dest.stream, mt ? { mimeType: mt } : {}); const chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data); const done = new Promise(r => rec.onstop = r);
  rec.start(500); s.start(); await new Promise(r => s.onended = r); rec.stop(); await done; ctx.close();
  return { blob: new Blob(chunks, { type: /mp4/.test(rec.mimeType || mt) ? 'video/mp4' : 'video/webm' }), dur: ab.duration };
}
