import sys, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
k = Kokoro("kokoro-v1.0.onnx", "voices-v1.0.bin")
lines = ["Germany's world-famous Atelier Hof,", "have created the fastest G-Class in history.",
 "It pushes out one thousand and sixty-three horsepower.", "Sprints from zero to one hundred kilometers per hour,",
 "in just three point three seconds.", "And reaches a top speed of three hundred and forty kilometers per hour."]
voice, speed, lang = sys.argv[1], float(sys.argv[2]), sys.argv[3]
out=[]
for i,l in enumerate(lines):
    a, sr = k.create(l, voice=voice, speed=speed, lang=lang)
    out.append(a); out.append(np.zeros(int(sr*(0.35 if i in (0,3) else 0.65))))
sf.write(f"raw_{voice}.wav", np.concatenate(out), sr)
print(voice, round(sum(len(x) for x in out)/sr,1))
