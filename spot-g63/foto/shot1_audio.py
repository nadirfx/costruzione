"""Audio della scena 1 (foto viva): interruttore industriale, luce che sfarfalla, bassi, tappeto.
Uso: python3 shot1_audio.py out.wav   (genera 30 s; poi si taglia a 5 s con ffmpeg)"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "spot"))
import audio as A  # noqa: E402

A.add(A.clank(2.0, 180, 1.0, seed=101), 0.35, 1.0)      # interruttore pesante
A.add(A.zap(0.3, 0.7), 0.35, 0.8)
A.add(A.zap(0.12, 0.35), 0.50)
A.add(A.zap(0.12, 0.45), 0.56)
A.add(A.boom(3.5, 95, 30, 1.0), 0.36, 1.1)
A.add(A.drone(4.8, 41.2, 0.35), 0.4)
A.add(A.clank(1.2, 520, 0.18, seed=7), 2.6, 1.0, 0.6)    # metallo lontano
A.add(A.riser(1.6, 200, 4000, 0.25), 3.4)
A.write(sys.argv[1])
