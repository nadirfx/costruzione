# Standard dei video (da rispettare sempre)

Riferimento base: `LweCraMDrRxrBzrd0HgQ_g.mp4` e le immagini nella cartella principale. Il primo video fatto su questo standard e approvato è `video/instagram-chiude-riferimenti/`.

## Linguaggio visivo
- **Un solo oggetto protagonista al centro**, con tanto spazio vuoto. Mai scene piene di roba.
- **Fondo carta chiaro** con griglia leggera, alternato a 2–3 scene scure di contrasto: grafico rosso, omino blu luminoso, UI AI viola.
- **Oggetti 3D puliti:** tasselli neri opachi con il glifo a colori, schede bianche, ombra morbida. Niente bloom esagerato.
- **Scritta gigante sfumata dietro l'oggetto**, legata alla frase (2027, ITALIA, CLAUDE…).
- **Testo in basso al centro:**
  - una riga piccola (500) e una parola chiave grande (900);
  - colori della parola chiave: rosso per le cattive notizie, evidenziatore lime per i ribaltamenti, arancio Claude per Claude e i CTA;
  - ogni parola entra sul suo tempo parlato.
- **Micro-interazioni UI vere:** toggle, barra prompt, contatori, commenti, DM, like.

## Animazioni
- **Ogni scena ha un'animazione diversa**, mai la stessa per tutto il video, e non si copiano le animazioni tra video.
- Ogni movimento ha un significato legato alla frase (calendario su "2027", cartello su "chiude", flip-book su "in un secondo"…).
- **Mai un secondo fermo:** motion.py ≥ 1.0 per ogni secondo; il riferimento sta sopra 1.2.
- **Tagli puliti:** i sotto-fotogrammi del motion blur non attraversano mai un taglio.

## Controlli prima della consegna
- Safe zone 168–1330 px per testi e oggetti; niente tagliato ai bordi, niente sovrapposizioni.
- Contact sheet completo più i fotogrammi dei tagli a piena risoluzione.
- Effetti sonori: solo s01–s10 dell'utente, ognuno legato a un evento visivo, sempre ≥ 6 dB sotto la voce (anche ai bordi delle parole). Niente musica.
- Notizie finte: "NON È UNA NOTIZIA REALE" per almeno 1 s. Mai temi di banche, salute, tasse o governo.
- Consegna: MP4 in allegato più il link raw GitHub, con voce, effetti e sorgenti nella cartella.

## Sound design: regole fisse (dal feedback su Game Studios e dal riferimento "sound design showcase")
- **Ogni suono imita l'oggetto e dura quanto il movimento:**
  - numeri che contano → conteggio punteggio, per tutta la durata del conteggio;
  - flash → otturatore;
  - pezzi che si incastrano → ingranaggio metallico;
  - salita verso una rivelazione → riser che finisce esattamente sul colpo;
  - movimenti di camera → swoosh d'aria BASSO, con energia sotto i 1000 Hz.
- **Vietati** i whoosh acuti e lunghi, i razzi e i "tunnel": suonano come aerei. Vietati anche i suoni di un decimo di secondo messi a raffica: sembrano interferenze.
- **Salite:** il riser si usa solo se porta a un colpo; negli altri suoni la salita prima del colpo si taglia.
- **Corpo:** un solo colpo grande per sezione, con i bassi. Niente tappeti di fondo lunghi.
- **Volume:** gli effetti restano almeno 6 dB sotto la voce (controllo su finestre di 100 ms).

## Template script formato B (obbligatorio, dal video Game Studios)
Prima di scrivere uno script si parte SEMPRE da qui, mai a memoria:
1. **Gancio 0–3 s:** "Sapevi che c'è una skill di Claude che [promessa folle e concreta]…?" La promessa si capisce senza audio. Mai numeri o prezzi da soli come gancio.
2. **Nome e dove si trova:** "Si chiama X. È gratis, ed è su GitHub."
3. **Come funziona, a passi brevi:** come si installa/apre e cosa fa, un verbo per frase (ogni frase = un'animazione diversa).
4. **Anello aperto:** "Ma la parte assurda?" e pausa riempita di movimento.
5. **Twist:** la cosa più spettacolare e vera, mostrata.
6. **Prova sociale o urgenza vera:** stelle, risultati.
7. **CTA:** "Commenta CLAUDE, e ti mando il link e la guida."
Ritmo: un evento visivo e sonoro almeno ogni 1–2 s, niente secondi fermi. Tutto verificato sulla pagina ufficiale.
