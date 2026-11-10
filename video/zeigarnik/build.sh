#!/usr/bin/env bash
# Costruisce il video completo: fotogrammi → audio → MP4 (1080x1920, 30 fps, -14 LUFS)
# Uso: ./build.sh [cartella_lavoro] [file_uscita.mp4] [voce.wav opzionale]
set -euo pipefail
cd "$(dirname "$0")"
WORK="${1:-/tmp/zeigarnik_build}"
OUT="${2:-out/zeigarnik_v1.mp4}"
VOICE="${3:-}"
mkdir -p "$WORK" "$(dirname "$OUT")"
rm -rf "$WORK/frames"

node render.cjs "$WORK/frames" 30 4
python3 sfx.py "$WORK/sfx.wav"

if [[ -n "$VOICE" ]]; then
  # con la voce: effetti abbassati sotto la voce (ducking) e mix
  ffmpeg -v error -y -i "$WORK/sfx.wav" -i "$VOICE" -filter_complex \
    "[1:a]aformat=channel_layouts=stereo,asplit[v][sc];[0:a]volume=0.7[s];[s][sc]sidechaincompress=threshold=0.05:ratio=6:attack=10:release=250[sd];[sd][v]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1:LRA=11" \
    -ar 48000 "$WORK/mix.wav"
else
  ffmpeg -v error -y -i "$WORK/sfx.wav" -af "loudnorm=I=-14:TP=-1:LRA=11" -ar 48000 "$WORK/mix.wav"
fi

ffmpeg -v error -y -framerate 30 -i "$WORK/frames/%05d.jpg" -i "$WORK/mix.wav" \
  -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -profile:v high \
  -c:a aac -b:a 192k -shortest -movflags +faststart "$OUT"
echo "pronto: $OUT"
