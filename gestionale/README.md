# Gestionale personale

Gestionale privato per la tua attività: clienti, progetti, fatture, incassi, spese,
task, report settimanale, andamento annuo e stima fiscale forfettaria.

## Come si avvia

Apri `index.html` dal browser, oppure dalla cartella `gestionale/`:

    npm start        # poi apri http://localhost:8080

Su telefono: apri lo stesso indirizzo dalla rete locale, oppure caricalo su un hosting privato.

## Dove stanno i dati

- Tutti i dati sono in **IndexedDB** del browser: non si cancellano chiudendo o riaprendo la pagina.
- Il browser può però svuotarli se cancelli la cronologia o i dati del sito.
- Dati e backup **non si sincronizzano** tra PC e telefono: sono due archivi separati.
- Per questo: **Esporta → Scarica backup** ogni settimana. Il banner in dashboard ti ricorda quando è passato troppo tempo.

## Regole di calcolo

- Importi in centesimi interi: niente errori di arrotondamento.
- **Fatturato** = imponibile delle fatture emesse, nel mese della data di emissione.
- **Incassato** = pagamenti, nel mese della data di pagamento.
- **Fiscale forfettario** = sui compensi **incassati** nell'anno (principio di cassa).
- Fatture emesse non si cancellano: si annullano, e il numero resta riservato.
- Un incasso collegato a una fattura non può superare il residuo.
- Un cliente con fatture o incassi non si elimina: si archivia.

## Test

    npm test

Test unitari di logica: importi, date, periodi, P.IVA, aggregazioni, fiscale, settimana.

## Accesso

- Utente e password sono richiesti all'apertura. La password non è in chiaro nel codice: è un hash PBKDF2-SHA256 con sale.
- "Resta connesso" tiene la sessione su questo dispositivo per 30 giorni. Senza, la sessione finisce chiudendo la scheda.
- Dopo 5 tentativi sbagliati il login si blocca per 30 secondi.
- **Limite onesto**: è un blocco dell'app, non una cifratura. Chi ha accesso ai file del browser o al codice può aggirarlo. Cifrare i dati con la password è possibile, ma va deciso esplicitamente.
- Il login usa la crittografia del browser, disponibile solo in contesto sicuro: `file://`, `localhost` oppure `https`. Da un indirizzo `http://` con IP della rete locale (es. dal telefono) il login non funziona: usa il file singolo oppure un hosting https.

## Dati che non si perdono

- Ogni salvataggio va subito nel database del browser (transazioni atomiche: o si salva tutto, o niente).
- Prima di ogni eliminazione e ogni 10 minuti mentre lavori, il gestionale salva una **copia di sicurezza** dei record (non dei documenti).
- Da **Esporta → Copie di sicurezza** puoi vedere le ultime copie (fino a 40) e ripristinarne una. Il ripristino salva prima lo stato attuale, quindi è annullabile.
- Il **backup JSON** (Esporta → Scarica backup) include anche i documenti: è la copia da tenere fuori dal browser.
- Il browser può comunque cancellare i dati se pulisci la cronologia o i dati del sito: per questo il backup settimanale resta importante.

## File singolo

`npm run build` crea `dist/gestionale-personale.html`: un unico file con tutto dentro. Si apre con un doppio clic, senza server né connessione.

## Risparmi e ETF

- **Risparmi**: movimenti del tuo conto personale (versamenti e prelievi), saldo di partenza, obiettivo con percentuale e andamento a 12 mesi. Non è collegato alla contabilità dell'attività.
- **ETF**: anagrafica degli ETF, operazioni di acquisto e vendita, costo medio ponderato (commissioni incluse), valore e plus/minusvalenze, utile realizzato dalle vendite.
- Il valore degli ETF usa il **prezzo che inserisci tu** (Modifica → aggiorna prezzo). Nessuna quotazione automatica.
- Una vendita non può superare le quote possedute alla data indicata.

## Fattura e stampa

- La stampa/PDF usa un'unica area di stampa. Prima di stampare il gestionale controlla che in Impostazioni ci siano nome, partita IVA e indirizzo: senza, la fattura non è valida e te lo segnala.
- Il backup JSON è in formato JSON puro: si può sempre riscaricare e ripristinare.
