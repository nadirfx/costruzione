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
