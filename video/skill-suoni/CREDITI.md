# 3 strumenti per i suoni di Claude — crediti e note

- Voce: ElevenLabs, MarcoTrox. CTA: "Commenta SOUND" (su ManyChat serve la parola chiave SOUND).
- Effetti: generati con **earshot** (github.com/Leonxlnx/earshot, MIT). Nella scena "tre passi sulla ghiaia" si sentono e si vedono i passi veri generati da earshot.
- Verificato: earshot (gratis, skill per Claude Code, 922 suoni in catalogo, funziona offline, "ascolta" i suoni che costruisce e ne valuta la fedeltà); Openverse (motore di WordPress per media con licenza libera, anche audio).
- **Real SFX verificato (27/11/2026):** skill per Claude Code di Clipwing (github.com/Clipwing/skills, cartella skills/real-sfx, 213 stelle). Trova i momenti nel video (tagli, colpi, digitazione, clic), sceglie registrazioni vere dalla tua libreria di suoni e le mette sul fotogramma esatto, mantenendo musica e voce. Restituisce un nuovo MP4 e una traccia SFX separata. Non include una libreria di suoni (tranne 78 suoni di interfaccia CC0): usa la tua, per esempio presa da Freesound, Mixkit, Pixabay.
- File: skill-suoni-1080.mp4 (master, crf 14, AAC 320k); skill-suoni-4k.mp4 (2160×3840, ingrandito con lanczos + nitidezza leggera, non un render 4K nativo).
- Motion check: 0 secondi fermi su 40. Effetti sempre ≥ 6,9 dB sotto la voce (≥ 10,6 dB nei tratti normali).
