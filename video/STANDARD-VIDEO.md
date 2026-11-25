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

## Sound design: regole fisse (dal feedback su Game Studios)
- **Solo suoni corti e secchi:** clic, pop, colpi di basso, glitch, toni d'interfaccia. Ognuno su un evento che si vede.
- **Vietati** whoosh d'aria lunghi, razzi, riser, swell al contrario e "tunnel": suonano come aerei che passano.
- **La salita prima del colpo si taglia sempre** (al massimo 0,06 s prima del picco): il suono parte sull'evento, non prima.
- **Code di massimo 1 secondo.** Un solo colpo grande per sezione.
- **Niente tappeti di fondo lunghi:** diventano ronzio.
