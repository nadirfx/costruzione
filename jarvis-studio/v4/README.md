# Jarvis Studio 4 — centro di comando

Artifact: https://claude.ai/artifact/Ma63czakJB3PiddquNqfX5 (stesso link di prima, versione 9).

## Cosa cambia rispetto a Jarvis 3
- **Tutto schermo.** Niente barra laterale: le stanze sono in alto, lo Studio usa l'intero schermo.
  Pulsante **Schermo intero** (compare solo dove il browser lo permette).
- **Look HUD** blu notte e ciano, pannelli con angoli luminosi, font tecnico (Chakra Petch).
- **Nucleo 3D**: globo olografico (griglia + punti + atmosfera + anello di scansione), tre orbite con tacche,
  sei reparti come fari sull'orbita. Quando un agente lavora, il suo reparto si accende e manda un arco di luce nel nucleo.
  Trascina per ruotare, tocca un reparto per aprirlo.
- **Pannelli con dati veri** (niente numeri finti):
  - Stato studio: 4 anelli (in produzione, da revisionare, approvate, agenti al lavoro);
  - Catena di produzione: barre per le 7 fasi;
  - Missioni: elenco con copertina, il video parte al passaggio del mouse;
  - Agenti: i 12 agenti con stato LAVORA/PRONTO + grafico attività delle ultime 12 ore;
  - Attività in diretta e barra di stato in basso.
- **Montaggio**: i render fatti dalla sessione Claude (versioni in revisione) compaiono in *Materiali* con **Importa**:
  il video va su V1 e si può tagliare e vestire.
- Produzione: il tasto Elimina sulle card non si sovrappone più a "Sposta".

## Collaudo
20 scenari (429 controlli, tutti verdi), desktop + telefono (Chromium + simulazione Safari: dati congelati, niente AudioEncoder, video via blob).
Nuovo test `t18_hud.js`: anelli, catena, agenti, grafico, fari, layout senza tagli, reparto che si accende, import del render in timeline.

Limite onesto: qui non c'è un vero Safari. La simulazione copre i bug Safari trovati finora; per la prova finale va aperto su iPhone/Mac.
