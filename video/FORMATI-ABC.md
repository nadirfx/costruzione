# Jarvis: i 3 formati video (A · B · C)

Ogni video parte da una **scheda brief**. Poi segue il flusso comune e passa la checklist del suo formato. Alla fine passa il **controllo qualità universale**, e solo allora si consegna.

---

## 0. Scheda brief (da compilare per ogni video)

| Campo | Esempio |
|---|---|
| Formato | A / B / C |
| Obiettivo | vendere, follower, lead, brand awareness |
| Piattaforma e formato | Reels/TikTok 9:16 · YouTube 16:9 · feed 1:1 |
| Durata | 15 s / 30 s / 45 s |
| Materiale | voce, facecam, foto, clip Gemini, logo/brand kit, musica |
| Riferimenti | link o file da `riferimenti/A`, `riferimenti/B`, `riferimenti/C` |
| CTA | "Commenta CLAUDE", link in bio, "Ordina ora" |
| Vincoli | parole vietate, colori brand, temi da evitare |

## 1. Flusso comune

1. **Script:** gancio (0–1 s), tensione, svolta, valore, CTA. Logica a prova di bambino e numeri veri.
2. **Voce:** trascrizione parola per parola; taglio dei tempi morti; pause volute solo se riempite di movimento.
3. **Storyboard:** un fotogramma per scena, approvato prima del render completo.
4. **Costruzione:** ogni scena con un'animazione diversa, legata alla frase.
5. **Render**, poi **controllo qualità**, poi consegna: MP4 + link + voce + effetti separati + sorgenti.

---

## Formato A: luxury motion (stile Apple, Netflix, brand premium)

**Quando:** spot di brand, lanci prodotto, clienti di fascia alta.

### Linguaggio
- [ ] Un'idea per inquadratura, tanto spazio vuoto, griglia rigorosa.
- [ ] Massimo 2 font e palette del brand (codici HEX dal brand kit).
- [ ] Testo cinetico elegante: parole che entrano sfocate e vanno a fuoco, gradiente solo sulla parola chiave, tracking curato.
- [ ] Transizioni "di classe": finestre arrotondate, match cut, carrellate continue, messa a fuoco progressiva. Niente effetti cartoon o rimbalzi esagerati.
- [ ] Curve di movimento morbide (expo/power4); velocità coerente tra un taglio e l'altro.
- [ ] Prodotto sempre reale: asset del brand, foto vere, clip generate (Gemini/Veo) o riprese. Mai loghi inventati.

### Ritmo e audio
- [ ] Inquadrature da 1.5–3 s; durata 15–30 s.
- [ ] Packshot finale: prodotto + logo per almeno 1.5 s.
- [ ] Audio guidato dalla musica (licenziata o del brand) + effetti di rifinitura sincronizzati. Mix a −14 LUFS.

### Controlli specifici
- [ ] Linee guida del brand: spazio di rispetto del logo, colori, tono di voce.
- [ ] Legale: claim veri, licenze di foto, musica e font. Concept non ufficiale dichiarato se il brand non è cliente.
- [ ] Versioni consegnate: 9:16 + 16:9 + 1:1.

---

## Formato B: faceless premium (i nostri video "Instagram chiude", "WhatsApp a pagamento")

**Quando:** contenuti virali per la pagina, dimostrazioni di cosa sa fare Claude.

### Linguaggio
- [ ] Gancio nel primo secondo (notizia shock, domanda, numero).
- [ ] Stile dei riferimenti: un oggetto protagonista, scritta gigante sfumata dietro, testo in basso con parola chiave evidenziata (rosso, lime, arancio).
- [ ] **Ogni scena ha un'animazione diversa**, sempre legata alla frase; mai lo stesso effetto per tutto il video.
- [ ] Alternanza tra scene chiare e scure per il contrasto.
- [ ] Notizia finta: "NON È UNA NOTIZIA REALE" per almeno 1 s. Mai temi di banche, salute, tasse o governo.

### Ritmo e audio
- [ ] Nessun secondo con movimento < 1.0 (`motion.py`); le pause volute vanno riempite di tensione.
- [ ] Silenzi della voce ≤ 0.5 s, tranne le pause drammatiche scelte (max 1.5 s).
- [ ] Sound design cinematografico: braam e sub drop sugli impatti, tappeto di tensione senza note, ribaltamento del suono sulla svolta.
- [ ] Effetti sempre ≥ 6 dB sotto la voce, anche ai bordi delle parole. Niente musica (la aggiunge l'utente).
- [ ] CTA con parola chiave da commentare (DM automatico).

---

## Formato C: creator con la faccia (stile dei video di riferimento SnapInsta)

**Quando:** video parlati con facecam, educativi o di opinione.

### Montaggio
- [ ] Jump cut: via silenzi, respiri lunghi, errori e ripetizioni.
- [ ] Zoom a scatto sulle parole chiave, alternando 100% e 115–125%; mai due zoom uguali di fila.
- [ ] Sottotitoli parola per parola, parola chiave colorata, nella safe zone.
- [ ] B-roll, registrazioni schermo e grafiche ogni 3–5 s, quando si parla di qualcosa che si può mostrare.
- [ ] Flash di luce sui tagli importanti; 24 fps per un look cinematografico.
- [ ] Open loop ("tra poco ti mostro…") e CTA a metà video.

### Audio
- [ ] Voce pulita: denoise leggero, compressore, de-esser, −14 LUFS.
- [ ] Whoosh solo sulle transizioni grandi; boom profondo sugli impatti chiave; silenzio prima del colpo.
- [ ] Effetti mai sopra la voce.

### Immagine
- [ ] Color grading coerente, pelle naturale, contrasto da cinema.
- [ ] Inquadratura: occhi a ~1/3 dall'alto, niente teste tagliate dai sottotitoli.

---

## Controllo qualità universale (sempre, prima di consegnare)

### Contenuto
- [ ] Il gancio funziona senza audio.
- [ ] Lo script ha senso dall'inizio alla fine.
- [ ] Numeri e affermazioni sono veri.

### Visivo
- [ ] Testi e UI dentro la safe zone (168–1330 px su 1920).
- [ ] Niente sovrapposizioni o elementi tagliati ai bordi; testo leggibile.
- [ ] Tagli puliti, senza immagini doppie.

### Movimento
- [ ] Nessun secondo fermo.
- [ ] Ogni animazione ha un motivo.

### Audio
- [ ] Voce chiara, niente suoni a caso (es. il whoosh "aereo"), effetti sotto la voce.
- [ ] Loudness corretta.

### Tecnico
- [ ] Risoluzione, fps, durata e codec (H.264, yuv420p) corretti; peso del file ok.

### Consegna
- [ ] MP4 in allegato + link raw GitHub + voce + effetti + sorgenti.
- [ ] Tutto pushato.

## Errori da non ripetere mai (dal feedback dell'utente)
- Stessa animazione per tutto il video (il "muro del feed").
- Copiare lo stile di un video precedente senza innovare.
- Suoni senza senso o sopra la voce (il whoosh "aereo" dopo "Italia").
- Pausa con lo schermo fermo ("dice Respira e sta fermo").
- Script senza logica ("sembra un video da agenzia").
- Cartoon o 2.5D spacciati per motion design di lusso: per il formato A servono clip reali o generate.

## Libreria (cresce nel tempo)
```
libreria/
  riferimenti/A  B  C     ← video di riferimento + scheda di analisi (ritmo, tagli/s, transizioni, testo, suoni)
  sfx/                    ← effetti divisi per tipo: whoosh, hit, sub, riser, click, pop, shimmer, sizzle…
  font/  brand-kit/       ← font con licenza e kit dei clienti
  template/A  B  C        ← codice delle scene riutilizzabili (motore three.js/canvas)
```
Ogni video approvato diventa un nuovo riferimento del suo formato.
