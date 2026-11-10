# Script 2 in puro motion design – "Il cursore protagonista"

## Concetto
Niente personaggio 3D: il protagonista è **il cursore rosa che lampeggia**.
È UN solo oggetto che si trasforma per tutto il video (cursore → barra → countdown → linea → frase completata).
Nessun taglio netto = nessun "punto di uscita" mentale dove lo spettatore pensa "ok, finito, scrollo".

## Le 10 regole psicologiche applicate al movimento

| # | Principio | Come lo applico in motion |
|---|---|---|
| 1 | **Il movimento cattura prima del colore** (gli occhi reagiscono a ciò che si muove) | Mai un frame completamente fermo: c'è sempre almeno il cursore che lampeggia o un leggero "respiro" (scala 100→102%) |
| 2 | **Una cosa alla volta** (attenzione selettiva) | Si muove un solo elemento per volta; il resto si attenua (opacità 30% + leggero blur). L'occhio non deve mai cercare |
| 3 | **Il nuovo appare dove l'occhio già è** | Ogni nuovo elemento nasce dal punto in cui è finito il precedente (stesso centro dell'inquadratura) |
| 4 | **Trasformazione continua** (nessun punto di uscita) | Match cut e morphing: ogni forma DIVENTA la successiva, niente dissolvenze al nero |
| 5 | **Anticipazione** (il cervello vuole verificare la sua previsione) | Prima di ogni movimento grande, un piccolo movimento opposto (indietro 5–10 px, 3–4 frame) |
| 6 | **Easing = emozione** | Entrate in *expo ease-out* (energia, velocità); uscite in *ease-in*; **lineare solo per la tensione** (barra bloccata, drone); overshoot/rimbalzo solo sulle ricompense |
| 7 | **Ricompensa variabile** (come la slot machine) | Cambi ogni 1,2–2,5 s ma con durate diverse: un ritmo prevedibile annoia |
| 8 | **Effetto gradiente dell'obiettivo** (più sei vicino alla fine, più vuoi arrivarci) | Barra di progresso sempre visibile che avanza; si blocca al 99% → frustrazione controllata |
| 9 | **Contrasto / Von Restorff** | Tutto bianco o grigio; solo la parola chiave in rosa, ciano o oro. Punch-in (zoom 100→115% in 4 frame) sulle parole chiave |
| 10 | **Micro-ricompense vs grande ricompensa** | Ogni frase finita ha un piccolo payoff (glow + 3–4 particelle). La grande esplosione di luce è riservata a "…di dire" |

## Scene (motion)

| Tempo | Voce | Motion | Principio |
|---|---|---|---|
| 0,0–0,5 | "C'è una frase…" | Nero. La frase entra **tutta insieme** con slide-up di 30 px + fade (expo out, 8 frame). Testo grande, bianco. | 1, 3 |
| 0,5–2,0 | "…che non ti finirò di…" | Il cursore rosa lampeggia alla fine. Al taglio della voce: **glitch di 2 frame** (split RGB + spostamento 6 px), poi immobilità totale tranne il cursore | 1, 5 |
| 2,0–3,0 | "Ti dà fastidio, vero?" | La frase si rimpicciolisce e sale in alto (resta lì fino al 21 s, opacità 40%). Il cursore NO: si stacca, cade al centro con un piccolo rimbalzo | 3, 4 |
| 3,0–7,0 | "Il tuo cervello **odia** le cose lasciate a metà." | Il cursore si **allunga in orizzontale** e diventa una barra di caricamento che si riempie veloce fino al 99%… poi si blocca. Tremolio leggero (jitter 1–2 px) + numero "99%" che lampeggia | 4, 8 |
| 7,0–9,5 | "Per questo guardi le serie fino alle tre di notte." | La barra si piega e diventa il bordo di uno schermo TV stilizzato; dentro, countdown "Prossimo episodio 5…4…3" (numeri in punch-in) | 4, 7 |
| 9,5–12,0 | "Per questo resti sui video **fino alla fine**." | Lo schermo TV si stringe in verticale e diventa un telefono; in basso la barra di avanzamento del video al 97% | 4, 8 |
| 12,0–15,0 | "Si chiama **effetto Zeigarnik**." | La barra del telefono scatta in avanti e "spara" il titolo in oro: le lettere arrivano una dopo l'altra (stagger 1 frame) con overshoot | 9, 10 (micro) |
| 15,0–17,5 | "E lo sto usando **adesso**." | **Zoom out veloce**: tutte le forme viste finora si ricompongono in una timeline e si scopre che la frase in alto era rimasta lì tutto il tempo. La frase torna al 100% di opacità | 2, 9 |
| 17,5–18,0 | // (pausa) | Tutto fermo. Solo il cursore lampeggia. 0,5 s | 1 |
| 18,0–21,0 | "Quella frase dell'inizio? / Te la finisco solo se resti." | La frase scende lentamente al centro (lineare = tensione). La barra riappare sotto, ancora al 99% | 6, 8 |
| 21,0–23,0 | "…di **dire**." | Il cursore scrive "dire" → barra al 100% con **flash bianco** di 2 frame, onda d'urto circolare, particelle. Unica grande esplosione del video | 10 |
| 23,0–25,0 | "Vuoi le altre tecniche? Commenta **LOOP**." | Il cursore diventa il cursore di un box commento: scrive L-O-O-P (un tasto per frame di beat), spunta verde con rimbalzo | 4, 10 |
| 25,0–26,0 | — | Il box si stringe in un punto → nero → il cursore rimane da solo e lampeggia esattamente nella posizione del frame 1 | **loop** |

## Sound design legato al movimento
- Ogni movimento ha un suono, **sincronizzato al frame**: slide = whoosh corto, punch-in = "thump", lettere = tick, glitch = scratch digitale.
- Drone basso continuo dal 2 s al 21 s (non si risolve mai) → accordo di risoluzione sul "dire".
- La barra al 99% ha un "ronzio elettrico" che sale leggermente di tono.

## Specifiche tecniche
- 1080×1920, 30 fps; testo centrale nel terzo superiore-centrale (lontano da UI di Instagram/TikTok in basso e a destra).
- Font: sans geometrico pesante per le parole chiave, regolare per il resto.
- Palette: nero #0A0A0F, bianco #F2F2F2, rosa #FF2E88, ciano #22D3EE, oro #F5B841.
- Glow: 2 livelli (interno stretto + esterno largo al 30%).
