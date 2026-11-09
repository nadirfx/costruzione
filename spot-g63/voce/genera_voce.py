import sys, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
k = Kokoro("kokoro-v1.0.onnx", "voices-v1.0.bin")
print([v for v in k.get_voices() if v.startswith('i')])
lines = ["Il famoso atelier tedesco Hof,", "ha creato la G-Class più veloce della storia.",
 "Sprigiona millesessantatré cavalli.", "Scatta da zero a cento chilometri orari,", "in soli tre virgola tre secondi.",
 "E raggiunge una velocità massima di trecentoquaranta chilometri orari."]
voice, speed = sys.argv[1], float(sys.argv[2])
out=[]; sr=24000
for i,l in enumerate(lines):
    a, sr = k.create(l, voice=voice, speed=speed, lang="it")
    out.append(a); out.append(np.zeros(int(sr*(0.35 if i in (0,3) else 0.6))))
sf.write(f"raw_{voice}_{speed}.wav", np.concatenate(out), sr)
print("ok", sum(len(x) for x in out)/sr)
