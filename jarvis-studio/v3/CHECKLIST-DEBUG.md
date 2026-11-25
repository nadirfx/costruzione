# Jarvis Studio 3: checklist di debug

Questa checklist va eseguita **prima di ogni pubblicazione**.
- **Come si esegue:** ogni voce ha un test automatico in `test/` (Playwright, con un finto claude.ai) oppure un controllo manuale segnato con (M).
- **Dove:** computer (1440×900) e telefono (390×844).
- **Quando si pubblica:** solo con tutte le voci verdi e zero errori in console.

## 0. Regole che valgono ovunque
- [ ] Zero errori in console e zero errori di pagina, in ogni stanza.
- [ ] Nessuno scroll orizzontale della pagina, su computer e telefono.
- [ ] **Dati letti dal database:** congelati come fa Safari (il finto claude.ai li congela); l'app lavora sempre su una copia.
- [ ] Ogni salvataggio fallito mostra un messaggio chiaro (permesso negato, spazio finito, rete).
- [ ] Ricaricando la pagina in qualsiasi stanza si torna nello stesso punto, con gli stessi dati.
- [ ] Il pulsante Indietro del browser funziona tra le stanze.

## 1. Avvio e Studio
- [ ] L'animazione d'avvio compare una volta per sessione e si chiude da sola.
- [ ] Lo studio 3D si disegna con i 6 reparti etichettati e risponde al trascinamento; la rotazione si ferma sotto il puntatore.
- [ ] Tocco su un reparto: si apre il pannello con i suoi agenti e le skill che segue.
- [ ] Un reparto si accende quando un suo agente lavora, anche se lavora una sessione Claude (`activity` con `status: running`).
- [ ] I numeri in alto (in produzione, da revisionare, approvate, agenti al lavoro) sono corretti.
- [ ] Rullino missioni con anteprima video dell'ultima versione.
- [ ] **Studio vuoto:** spiega cosa fare.
- [ ] **Porte A, B, C:** creano la missione con il formato e il rapporto giusti e aprono il Briefing.
- [ ] La lista missioni è ordinata per ultima modifica.
- [ ] **Clic su una missione:** apre la stanza giusta (Brief, Editor o Revisione, secondo lo stato).
- [ ] **Feed attività:** si aggiorna dopo note, approvazioni ed export.
- [ ] Le statistiche contano bene le missioni per stato.

## 2. Briefing
- [ ] **Chat con Jarvis:**
  - risponde in diretta;
  - la riga "BRIEF:" non si vede in chat ma compila i campi;
  - la chat resta dopo una ricarica.
- [ ] **Errori della chat:** consenso negato, troppe richieste e interruzione mostrano un messaggio e non bloccano la pagina.
- [ ] **Caricamento materiali:** video, immagine e audio MP3 o WAV.
  - L'audio viene convertito in MP4 (o WebM) e caricato.
  - **Senza codificatore audio (vecchio Safari):** la conversione in tempo reale produce un file con l'etichetta giusta (MP4 se il browser registra in MP4).
  - **Video sopra i 20 MB:** si crea la copia leggera in un formato che il browser sa registrare (WebM, oppure MP4 su Safari), con l'audio anche dove `captureStream` sui video non esiste (Safari).
  - **File senza tipo (Safari):** il tipo si riconosce dall'estensione.
  - **File non supportato o troppo grande:** messaggio chiaro, nessuna riga rimasta "in caricamento".
- [ ] Ruoli e ordine dei materiali si salvano.
- [ ] La checklist del formato si spunta in base ai materiali.
- [ ] "Vai all'editor" apre l'editor con i materiali in libreria.


## 2b. Produzione
- [ ] 7 colonne (Brief → Approvato); ogni missione nella sua fase (anche se la fase non è salvata, viene dedotta).
- [ ] Le card hanno l'anteprima video; le frecce spostano di fase e aggiornano lo stato (Revisione/Approvato).
- [ ] "Formato A/B/C" crea una missione e apre il Brief.

## 2c. Script e agenti
- [ ] Lo script si salva da solo; dopo una ricarica è ancora lì.
- [ ] "Sceneggiatore, scrivi" scrive in diretta; se lo script è vuoto lo riempie, altrimenti la nuova versione resta nel tavolo con "Usa questo script".
- [ ] Ogni agente salva il suo lavoro, scrive nel registro attività (in corso → fatto/errore) e fa avanzare la fase.
- [ ] Controllo tecnico e Tecnico del mix danno controlli misurati sulla timeline.
- [ ] Errori (troppe richieste, consenso negato) spiegati, nessun blocco.

## 2d. Sala macchine
- [ ] Senza sessione: spiega cosa comparirà.
- [ ] Con `state/machine`: registro, codice colorato con riga evidenziata, anteprima video o immagine, stato e avanzamento; i nuovi passaggi compaiono in diretta.

## 2e. Jarvis sempre presente
- [ ] Il pulsante c'è in ogni stanza, anche su telefono, senza coprire i pulsanti della pagina.
- [ ] Sa stanza e missione; le righe AZIONE diventano pulsanti funzionanti.
- [ ] La conversazione resta dopo una ricarica; Esc chiude.

## 2f. Connessione
- [ ] Se la connessione cade: stato "Connessione persa, mi ricollego", poi si ricollega da solo; appena torna la rete si risincronizza.

## 3. Editor
- [ ] La libreria mostra materiali, testi, transizioni e suoni; il pulsante + aggiunge alla traccia giusta.
- [ ] **Clip:** trascina (sposta), maniglie (accorcia e allunga), aggancio, sovrapposizioni su V2 in corsie separate.
- [ ] **Comandi:** Dividi, Elimina, Duplica, Annulla e Ripeti (anche da tastiera: Spazio, S, Canc, Ctrl+Z, Ctrl+Shift+Z, Ctrl+D, frecce).
- [ ] **Ispettore:** modificare testo, inizio, durata, volume, stile, colore e transizione aggiorna subito anteprima e timeline.
- [ ] **Anteprima:**
  - ogni transizione (dissolvenza, finestra, flash, whip, zoom) e ogni stile di testo si disegna senza errori;
  - immagini con Ken Burns;
  - zoom su V2.
- [ ] Play e pausa; la riproduzione si ferma alla fine; misuratore di livello attivo.
- [ ] La safe zone si accende e si spegne.
- [ ] Lo zoom della timeline funziona.
- [ ] Il salvataggio automatico avviene; la timeline resta dopo una ricarica.

## 4. Jarvis in diretta
- [ ] **"Jarvis, monta tu":**
  - il cursore si vede;
  - le clip entrano una alla volta;
  - il registro si scrive;
  - un Annulla toglie tutto il montaggio.
- [ ] **Comandi scritti:** funzionano.
- [ ] **Stop:** interrompe e lascia quello già montato.
- [ ] **Righe non valide o materiale inesistente:** l'operazione viene saltata con un messaggio, senza crash.
- [ ] **Mosse da una sessione Claude (`state/live`):**
  - si applicano con l'animazione;
  - `applied` si salva;
  - dopo una ricarica non si ripetono;
  - se l'editor è chiuso, il feed avvisa e le mosse si applicano all'apertura;
  - funzionano anche con i dati congelati.

## 5. Export
- [ ] Una timeline vuota viene bloccata con un messaggio.
- [ ] **MP4 720p e 1080p e WebM:** il file si salva con il nome giusto e la durata giusta.
- [ ] Il 4K funziona su computer.
- [ ] **Audio:**
  - mixato, con picco ≤ −1 dB;
  - **se il browser non codifica l'audio:** avviso PRIMA dell'export, e il messaggio finale dice che il file è muto.
- [ ] Annulla a metà export: nessun file, interfaccia di nuovo libera.
- [ ] **"Salva e manda in revisione":** crea la versione n+1 e porta lo stato a "Da revisionare"; sopra i 20 MB mostra un messaggio chiaro.

## 6. Revisione
- [ ] Lista dei progetti con versioni; cambio versione; il player carica il video.
- [ ] **Note:** al secondo esatto, segnalino sulla barra, segnate come fatte, persistenti.
- [ ] Approva e Richiedi modifiche cambiano lo stato.
- [ ] Esporta scarica il file.
- [ ] **Revisione vuota:** spiega cosa fare.

## 7. Libreria
- [ ] Tutti i 13 suoni si ascoltano.
- [ ] Le regole A, B e C si leggono anche su telefono.

## 8. Safari (M, sul Mac di Nadir)
- [ ] L'app si apre (file unico).
- [ ] Il nucleo 3D e l'anteprima girano fluidi.
- [ ] Un MP3 caricato diventa materiale.
- [ ] Le mosse live da una sessione si applicano.
- [ ] L'export a 1080p esce con l'audio.

## Prima di pubblicare
1. `bash build.sh` (crea il file unico).
2. Tutti i 16 scenari su `dist` in modalità `both`: `for t in test/t*.js; do APP_DIR=dist node test/run.js $t both; done`.
3. Zero errori. Poi pubblica e controlla con una lettura dell'app pubblicata.
