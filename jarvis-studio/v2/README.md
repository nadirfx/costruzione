# Jarvis Studio v2

App privata su claude.ai: https://claude.ai/artifact/Ma63czakJB3PiddquNqfX5

## Le stanze
1. **Hub:** nucleo 3D con le missioni in orbita (trascina per ruotare, tocca un punto per aprirlo), Mission monitor, Stato Jarvis e le tre porte **A · B · C** per creare una missione.
2. **Briefing:**
   - chat con Jarvis, scritta o a voce, che compila da sola la scheda (titolo, obiettivo, durata, gancio, CTA);
   - caricamento dei materiali nell'ordine giusto, con ruoli (voce, facecam, B-roll, foto, logo…);
   - checklist del formato.
3. **Editor:**
   - **Tracce:** V2 (testi, immagini sovrapposte, zoom), V1 (video principale), A1 (voce), A2 (effetti).
   - **Anteprima:** identica all'export.
   - **Strumenti:** transizioni (finestra, flash, whip, zoom-through, dissolvenza), stili di testo (parola chiave, Apple, sottotitolo, titolo, etichetta), zoom a scatto, Ken Burns, libreria di 13 suoni, safe zone, misuratore di livello, annulla/ripeti.
   - **"Jarvis, monta tu":** Jarvis monta in diretta. Vedi il cursore, le clip che entrano e il registro; un solo "Annulla" annulla tutto il suo montaggio.
   - **Comandi:** scritti o a voce ("metti uno zoom su ogni parola chiave").
4. **Export:** 720p, 1080p o 4K; MP4 (H.264) o WebM (VP9); 24, 30 o 60 fps; audio mixato con limiter (picco ≤ −1 dB). Il file si salva sul dispositivo, e volendo va direttamente in revisione come nuova versione.
5. **Revisione:** note al secondo esatto con segnalini sulla barra, versioni, Approva, Richiedi modifiche, Esporta.
6. **Libreria:** suoni ascoltabili e regole dei formati A/B/C.

## Scorciatoie (editor)
| Tasto | Azione |
|---|---|
| Spazio | Play / pausa |
| S | Dividi |
| Canc | Elimina |
| Ctrl+Z / Ctrl+Shift+Z | Annulla / ripeti |
| Ctrl+D | Duplica |
| ← → | Un fotogramma (Shift: un secondo) |

## Limiti della piattaforma (non aggirabili)
- **File caricati:** massimo 20 MB a file.
  - I video più grandi vengono alleggeriti in automatico nel browser (in tempo reale).
  - L'audio (MP3/WAV/M4A) viene convertito in automatico in MP4 audio, perché l'archivio non accetta file audio puri.
- **Export:** 4K solo su un computer. "Qualsiasi formato" vuol dire MP4 o WebM: niente MOV o ProRes.
- **Chat e montaggio di Jarvis:** usano il tuo account Claude; alla prima volta l'app chiede il consenso.

## Mosse live da una sessione Claude
Una sessione Claude può montare nell'app scrivendo nel documento `projects/<id>/state/live`:
```json
{ "message": "Aggiungo il titolo finale", "ops": [ {"n": 1, "op": "add_text", "text": "Commenta CLAUDE", "style": "title", "start": 30, "dur": 2, "color": "orange"} ] }
```
- **`n`:** cresce sempre.
- **Quando vengono eseguite:** l'app esegue le mosse con `n` maggiore di `applied` appena l'editor è aperto, con l'animazione, poi aggiorna `applied`.
- **Operazioni:** `add_clip`, `add_text`, `add_zoom`, `add_sfx`, `set`, `delete`, `clear`, `say`.

## Sviluppo e test
- **Codice:** `app/`.
- **Banco di prova:** `test/`, con un finto claude.ai (`mock.js`) e Playwright (`run.js`).
- **Esecuzione:** `node run.js t3_editor.js both`. Ogni test clicca tutto e fa gli screenshot su computer e telefono; fallisce a qualsiasi errore in console.
