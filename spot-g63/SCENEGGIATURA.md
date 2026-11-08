# G 63 — "PROJECT NERO" · Spot cinematico 30"

Formato master: **4K 3840×2160, 16:9, 24 fps**, look anamorfico (bande nere 2.39:1 opzionali).
Versione social: ritaglio **9:16** (1080×1920) dal master, soggetto sempre al centro.

Ispirato *nel ritmo* allo spot Atelier HOF (officina buia → mani artigiane → HUD dei numeri → auto in movimento),
ma con idea, nome e immagini nostri. È uno **spot dimostrativo (spec)**: non è una pubblicità ufficiale
Mercedes-Benz. Se lo pubblichi per un cliente o a fini commerciali, niente loghi Mercedes/AMG senza permesso.

## Idea: "Nato nel buio"
Il G 63 non esce da una fabbrica: emerge dal buio, un pezzo alla volta. Palette: **nero, acciaio, un solo
accento ciano** (lo stesso dell'HUD già pronto). Luce: un solo fascio dall'alto, fumo, pioggia sottile.

## Struttura e inquadrature

| # | Tempo | Inquadratura | Suono |
|---|---|---|---|
| 1 | **0,0–1,0** GANCIO | Nero totale. *CLANK* metallico. Si accende in macro l'anello LED rotondo di un faro, riempie lo schermo. | Silenzio → colpo secco + avviamento V8 |
| 2 | **1,0–3,0** GANCIO | Carrellata indietro veloce dal faro al frontale del G 63 nero opaco, pioggia sottile nel fascio di luce, vapore dal cofano. Taglio netto sul colpo di bassi. | Bassi, ringhio V8 |
| 3 | 3,0–6,0 | Macro: mani in guanti neri stringono i bulloni del coperchio motore in carbonio. Scintilla di luce sulla chiave. | Cricchetto, tic metallici a tempo |
| 4 | 6,0–9,0 | Officina buia: verniciatore in maschera spruzza nero opaco sulla fiancata, nebbia di vernice nel fascio. | Soffio dello spruzzo, drone |
| 5 | 9,0–12,0 | Ruota forgiata nera montata sul mozzo, pinza freno illuminata, la ruota gira lenta. | Avvitatore, risonanza |
| 6 | 12,0–20,0 | **HUD numeri** (già pronto: `hud/g63-hud-4k.mp4`, 8"): 585 CV · 0–100 in 4,3 s · 850 Nm → lampo → "G 63 PROJECT NERO". | Bip HUD, salita di tensione, impatto sul lampo |
| 7 | 20,0–24,0 | L'auto esce dal fumo verso la camera, fari accesi, quattro figure scure ai lati. | Silenzio di 0,5" → accelerata |
| 8 | 24,0–27,0 | Tunnel con luci a soffitto che sfrecciano, ripresa bassa laterale, asfalto bagnato riflette tutto. | Ruggito, eco del tunnel |
| 9 | 27,0–30,0 | Finale: posteriore 3/4 fermo nel buio, luci posteriori rosse nella nebbia. Titolo. | Motore che si spegne, un ultimo colpo di bassi |

**Regola del gancio (0–3")**: niente loghi, niente testo, solo luce + suono forte nel primo secondo.
Chi scorre deve fermarsi sul faro che si accende.

## Testi a schermo (sottotitoli sobri, bianco, centrati in basso)
- 3,0" — *Nato nel buio.*
- 6,5" — *Assemblato a mano.*
- 9,5" — *Un pezzo alla volta.*
- 27,5" — *G 63 · PROJECT NERO*

## Voce narrante (opzionale, VoiceStudio sul Mac, gratis)
Voce maschile bassa, calma, pause lunghe:
> "Alcune auto escono da una fabbrica. … Questa, esce dal buio."

## Prompt per l'IA (in inglese, rendono meglio)

Stile comune da aggiungere a ogni prompt:
`cinematic commercial, anamorphic lens, shallow depth of field, single hard top light, volumetric haze,
matte black and steel palette with subtle cyan accent, high contrast, film grain, 4K, photorealistic`

1. `extreme macro of a round LED headlight ring igniting in total darkness, droplets of rain on the glass, black luxury off-road SUV, sudden light bloom`
2. `fast dolly-out from the headlight to the front of a matte black boxy luxury off-road SUV in a dark workshop, thin rain falling through a single spotlight beam, steam rising from the hood`
3. `macro of hands in black nitrile gloves tightening bolts on a carbon fiber V8 engine cover with a chrome ratchet, glints of light, dark workshop`
4. `painter in respirator mask spray-painting the side of a boxy SUV matte black, paint mist glowing in a hard light beam, dark atelier`
5. `forged black wheel being mounted on a hub, lit brake caliper, the wheel slowly spinning, dark workshop, low angle`
7. `matte black boxy luxury SUV driving slowly out of thick smoke toward the camera, headlights on, four silhouetted figures standing on the sides, dark hangar`
8. `low side tracking shot of a matte black boxy SUV speeding through a tunnel, ceiling lights streaking, wet asphalt reflections, motion blur`
9. `rear three-quarter view of a matte black boxy luxury SUV standing still in fog, red taillights glowing, dark empty hangar, cinematic end frame`

Per la coerenza dell'auto: genera **prima un'immagine di riferimento** dell'auto (inquadratura 2) e usala come
immagine di partenza per tutti i video (image-to-video).

## Come produrlo

| Strada | Costo | Qualità | Chi fa cosa |
|---|---|---|---|
| **A. Video IA** (Kling / Veo / Seedance via MuAPI in Open Generative AI) | A pagamento: crediti per ogni clip da 5–10" (verifica i prezzi sul sito prima) | Come lo spot di riferimento | Tu generi le 8 clip con i prompt sopra, io monto tutto (tagli a tempo, HUD, testi, color grading, audio, export 4K) |
| **B. Gratis sul Mac** | 0 € | Più semplice: immagini ferme animate con movimenti di camera, luci e fumo | Generi le 8 immagini con Z-Image Turbo (locale), io le animo e monto tutto |

Già fatto, gratis: **`hud/g63-hud-4k.mp4`** (inquadratura 6, 8", 4K 30 fps) e il suo sorgente `hud/hud.html`
(modificabile: numeri, colori, nome).

> Dati tecnici HUD (585 CV, 4,3 s, 850 Nm) = valori indicativi del G 63 di serie: verificali sulla scheda
> ufficiale prima di pubblicare.
