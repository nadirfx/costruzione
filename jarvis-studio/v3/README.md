# Jarvis Studio 3

App privata su claude.ai: https://claude.ai/artifact/Ma63czakJB3PiddquNqfX5

Uno studio di produzione video con **12 agenti in 6 reparti**. Ogni agente legge le **skill dello studio**, cioè le regole che abbiamo costruito video dopo video (`video/FORMATI-ABC.md`, `video/STANDARD-VIDEO.md`).

## Le stanze
| Stanza | Cosa fai |
|---|---|
| **Studio** | Lo studio in 3D: Direzione in cima, Scrittura, Motion, Suono e Montaggio in mezzo, Qualità alla base. Ogni reparto si accende quando i suoi agenti lavorano, anche quando lavora una sessione Claude. Tocchi un reparto e vedi i suoi agenti, li fai lavorare, leggi le skill che seguono. A destra: nuova produzione (A, B, C) e attività in diretta. Sotto: rullino delle missioni con anteprima video. |
| **Produzione** | La catena: Brief → Script → Produzione → Montaggio → Controllo → Revisione → Approvato. Card con anteprima video al passaggio del mouse; frecce per spostare di fase. |
| **Missione** | Quattro sezioni collegate, con la barra dei reparti sopra: **Brief** (chat, scheda, materiali), **Script** (testo condiviso e tavolo dei reparti), **Montaggio** (editor con Jarvis che monta in diretta, export fino a 4K), **Revisione** (note al secondo, versioni, approva). |
| **Sala macchine** | Quando una sessione Claude costruisce un video, qui si vedono registro, codice con la riga in scrittura evidenziata e anteprime. |
| **Libreria** | Skill dello studio, elenco agenti, suoni, regole dei formati. |
| **Jarvis** (pulsante arancione) | Sempre presente. Sa in che stanza sei e su quale missione, risponde e propone azioni come pulsanti (fai lavorare un agente, apri una stanza o un reparto). |

## Gli agenti
| Reparto | Agenti | Come lavorano |
|---|---|---|
| Direzione | Direttore creativo, Producer | Scrivono con Claude: direzione creativa con 3 ganci, piano di produzione |
| Scrittura | Sceneggiatore, Verifica fatti | Script parlato con i tempi (va nello Script della missione); elenco delle affermazioni da verificare |
| Motion | Motion designer 3D, Tipografia cinetica, Transizioni | Scene, parole a schermo, transizioni diverse a ogni taglio |
| Suono | Sound designer, Tecnico del mix | Piano sonoro con le regole fisse; controllo **misurato** dei volumi nella timeline |
| Montaggio | Montatore | Apre l'editor e monta in diretta |
| Qualità | Controllo tecnico, Controllo stile | Controlli **misurati** (buchi, safe zone, durata, CTA, densità effetti, voce); confronto con le regole del formato |

Ogni lavoro resta salvato nella missione (`projects/<id>/agents/<agente>`) e nel registro attività (`activity`).

## Una sessione Claude che lavora "dentro" Jarvis
- **Attività:** un documento in `activity` con `{pid, agent, dept, status: "running"|"done", text, at, by: "session"}` accende il reparto nello Studio.
- **Sala macchine:** `projects/<id>/state/machine` con `{status, progress, steps:[{at, text, dept|agent}], code:{file, text, hot:[righe]}, preview:{assetId, kind, caption}}`.
- **Mosse di montaggio in diretta:** `projects/<id>/state/live` (come prima).

## Affidabilità
- Si ricollega da solo se la connessione cade (con tentativi via via più distanziati) e appena torna la rete.
- I dati letti dal database vengono sempre copiati prima di essere modificati (Safari li blocca).
- Collaudo: vedi `CHECKLIST-DEBUG.md` e la cartella `test/`.
