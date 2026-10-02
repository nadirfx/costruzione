# Spot "KUCH" – Snowboard Night Session
## Reverse engineering completo + ricetta per ricostruirlo su Higgsfield

> Video analizzato: 19,8 s · 1024×576 (16:9) · 24 fps · 23 tagli rilevati (≈ 1 taglio ogni 0,85 s).
> Frame di riferimento: `frames/contact-sheet.jpg` (1 frame ogni 0,5 s), `frames/transizioni.jpg`, `frames/finale-titolo.jpg`.

---

## 1. Lettura da marketer: perché funziona

| Leva | Cosa fa lo spot | Perché converte |
|---|---|---|
| **Hook (0–0,6 s)** | Silhouette immobile, testa bassa, fari da stadio, montagne blu. Nessun testo. | Il contrasto "calma prima della tempesta" ferma lo scroll: lo spettatore aspetta che succeda qualcosa. |
| **Product hero immediato (0,6–1,6 s)** | Primo piano: casco nero opaco, maschera specchiata, giacca bianca con logo sul petto. | Il prodotto (la giacca) è riconoscibile entro 1 secondo: regola d'oro dei 3 secondi rispettata. |
| **Pattern interrupt (1,6–2,6 s)** | Il faro esplode in camera (flare bianco che brucia il frame). | Transizione "luce" = reset dell'attenzione e passaggio dal ritmo lento all'azione. |
| **Escalation (2,6–16 s)** | Carving, spruzzi di neve, salti, drone, macro di neve, close-up della maschera. Tagli sempre più veloci (a 15,2–15,5 s tre tagli in 0,3 s). | Curva energetica crescente sincronizzata con la musica; la giacca bianca resta il punto più luminoso di ogni inquadratura = l'occhio va sempre sul prodotto. |
| **Ritorno circolare (16,7–19,8 s)** | Si torna all'inquadratura d'apertura + titolo 3D cromato "KUCH" + fade to black. | Struttura ad anello = sensazione di "film" premium; il brand chiude la storia. |
| **Colore** | Palette bicromatica: blu notte / ciano freddo + bianco neve. Neri profondi. | Coerenza totale = percezione premium, look "campagna Arc'teryx / Nike ACG". |

**Cosa migliorerei per la performance (A/B test):**
1. **Nessuna CTA**: aggiungere end-card 1,5 s con offerta / URL / "Shop the drop".
2. **Titolo**: "KUCH" cromato ha poco contrasto sul cielo blu e il sottotitolo è illeggibile → aggiungere glow/ombra o metterlo sul nero finale.
3. **Formato**: lo spot è 16:9 → per Meta/TikTok servono un 9:16 (reframe) e un bumper da 6 s.
4. **Marchio di terzi**: nello spot compare il logo Arc'teryx. Per un tuo prodotto usa **il tuo logo** (e Higgsfield fa IP-check sui loghi di brand famosi: rischio di blocco o rigenerazione).
5. **Artefatti AI tipici da controllare**: dita dei guanti, attacchi della tavola, logo che "deforma" tra frame, tavola che cambia lunghezza.

---

## 2. Shot list ricostruita (timecode reali dai tagli)

Legenda camera: **WS** campo largo · **MS** mezzo · **CU** primo piano · **ECU** dettaglio · **LA** low angle.

| # | Tempo | Inquadratura | Azione / camera | Modello consigliato |
|---|---|---|---|---|
| 1 | 0,0–0,6 | WS, LA leggero | Rider fermo sulla pista, testa china. Fari dietro. Micro push-in. | Nano Banana Pro → Seedance 2.0 |
| 2 | 0,6–1,6 | MS/CU frontale | Ritratto casco + maschera specchiata che riflette le luci, bokeh di fari, neve che cade. Logo visibile. | Nano Banana Pro → Cinema Studio 4.0 |
| 3 | 1,6–2,6 | CU | Un faro/torcia punta in camera e brucia il frame (flare bianco) = transizione. | Seedance 2.0 (start+end frame) |
| 4 | 2,6–5,1 | WS → CU tracking | Salto dal kicker in campo largo, poi carving in primo piano con muro di neve polverosa; finale in look B/N ad alto contrasto (flash). | Kling 3.0 (multi-shot) |
| 5 | 5,1–6,0 | WS senza rider | Onda di neve che attraversa la pista (plate "pulito") – respiro visivo. | Seedance 2.5 t2v |
| 6 | 6,0–7,2 | MS LA, camera bassa sulla neve | Rider fa carving verso camera, spray che copre l'obiettivo. | Kling 3.0 pro |
| 7 | 7,2–8,1 | WS LA | Salto con grab, silhouette contro il faro + montagne. | Seedance 2.0 / Kling 3.0 |
| 8 | 8,1–9,3 | Drone, extreme WS | Rider minuscolo che scende in diagonale lasciando scia di neve. | Seedance 2.5 t2v |
| 9 | 9,3–9,7 | Whip-pan blur | Transizione a strisce di motion blur (grigio-verde). | In montaggio o Seedance |
| 10 | 9,7–10,4 | MS laterale, B/N sovraesposto | Carving con lens flare ad anelli, neve che "esplode" in controluce. | Cinema Studio 4.0 |
| 11 | 10,4–11,0 | WS | Onda di neve (riprende shot 5). | riuso plate |
| 12 | 11,0–12,4 | WS → MS | Salto dal kicker sotto i fari, frontside spin. | Kling 3.0 |
| 13 | 12,4–13,3 | ECU | Maschera specchiata in macro, riflessi dei fari. | Nano Banana Pro → Cinema Studio 4.0 |
| 14 | 13,3–14,9 | LA, luna/faro dietro | Salto in silhouette, poi carving MS e push-in sul casco. | Seedance 2.0 |
| 15 | 14,9–15,5 | LA da dietro | Mano che tocca la neve in curva (tre micro-tagli = speed ramp). | Cinema Studio 4.0 (speedramp: impact) |
| 16 | 15,5–15,8 | LA da sotto | Silhouette della tavola contro il faro (overhead). | Kling 3.0 |
| 17 | 15,8–16,7 | WS + macro neve | Pista, poi spruzzo di neve in macro, poi ultimo salto con grab. | Seedance 2.5 |
| 18 | 16,7–19,8 | WS (= shot 1) | Rider fermo, testa bassa. Titolo 3D cromato "KUCH" + sottotitolo; fade to black. | Nano Banana Pro (titolo) + Seedance 2.0 (start/end frame) |

---

## 3. Il "Look Bible" (da incollare in OGNI prompt)

La coerenza dello spot nasce da un blocco di stile identico ripetuto in ogni generazione. Tienilo fisso:

```
STYLE BLOCK:
night snowboard commercial, cinematic, shot on ARRI Alexa 35, anamorphic lens,
deep navy-blue night sky, alpine peaks in silhouette, stadium floodlights on tall poles
with starburst glare, cold cyan-blue color grade, crushed blacks, bright white snow,
fine falling snow particles, subtle film grain, high contrast, premium outdoor brand campaign
(Arc'teryx / Nike ACG aesthetic), 16:9
```

```
CHARACTER BLOCK (sempre identico):
male snowboarder, matte black helmet, mirrored chrome goggles reflecting lights,
black balaclava, white technical hardshell jacket with small dark chest logo [YOUR LOGO],
black snow pants, black gloves, black snowboard
```

Negative (dove supportato o in coda al prompt): `no text, no watermark, no extra fingers, no deformed board, no logo distortion, no daylight, no warm tones`.

---

## 4. Pipeline Higgsfield passo per passo

### FASE 0 – Asset bloccati (il 70% della qualità si decide qui)

**0.1 Character sheet** – modello `Nano Banana Pro` (4K) oppure `Soul Cast` per l'identità cinematica.
```
Character reference sheet, [CHARACTER BLOCK], four views: front, 3/4, side, back,
plus close-up of goggles and chest logo, neutral grey studio background,
even lighting, photorealistic, 4k
```
→ Salva il risultato come **Reference Element** (manage_reference_elements) così Seedance/Kling mantengono la stessa persona in tutti gli shot.

**0.2 Prodotto** – se la giacca è reale: foto still-life fronte/retro → `Nano Banana Pro` con l'immagine come `image_references`:
```
Use the jacket from the reference image exactly (same cut, seams, logo position).
[CHARACTER BLOCK] wearing it. [STYLE BLOCK]
```

**0.3 Location** – `Soul Location` o `Nano Banana Pro` (21:9 per avere margine di reframe):
```
Empty ski slope at night, groomed corduroy snow, a snowboard kicker jump in the middle ground,
row of stadium floodlights on poles, jagged alpine ridge under deep blue night sky, stars,
light snowfall. [STYLE BLOCK]
```

### FASE 1 – Keyframe (still) per ogni shot con Nano Banana Pro

Carica sempre 3 reference: **character sheet + location + prodotto**. Genera 2–4 varianti per shot, scegli la migliore. Esempi:

**Shot 1 / 18 – Hero stance**
```
Wide low-angle shot, [CHARACTER BLOCK] standing still on the slope, head bowed looking down
at the snow, snowboard strapped on, floodlights glowing behind him on the left,
mountain ridge on the right, empty negative space top-center for a title. [STYLE BLOCK]
```

**Shot 2 – Ritratto prodotto**
```
Medium close-up portrait, centered, [CHARACTER BLOCK] facing camera, chest logo sharp and readable,
goggles reflecting green and white floodlights, heavy bokeh of lights behind, snowflakes
in the foreground out of focus, 85mm, f/1.4. [STYLE BLOCK]
```

**Shot 4 / 6 – Carving con spray**
```
Low-angle tracking shot at snow level, [CHARACTER BLOCK] carving hard toward camera,
body leaning, gloved hand almost touching the snow, massive spray of powder exploding
toward the lens, backlit by floodlights so every snow crystal glows. [STYLE BLOCK]
```

**Shot 7 / 14 – Salto in silhouette**
```
Low-angle wide shot from below the kicker, [CHARACTER BLOCK] mid-air doing an indy grab,
silhouetted against a bright floodlight and the night sky, snow dust trailing off the board,
alpine peaks below. [STYLE BLOCK]
```

**Shot 8 – Drone**
```
Extreme wide aerial drone shot, tiny snowboarder carving diagonally across a vast floodlit
slope leaving a long white spray trail, curved tracks in the snow, mountains and valley
lights in the distance. [STYLE BLOCK]
```

**Shot 10 – B/N sovraesposto**
```
Side-on medium shot, [CHARACTER BLOCK] carving, monochrome black and white, blown-out backlight,
circular lens flare rings, snow spray turning into a glowing white cloud, high contrast. [STYLE BLOCK]
```

**Shot 13 – Macro maschera**
```
Extreme close-up of mirrored chrome ski goggles on a matte black helmet, reflections of
floodlights and the snowy slope in the lens, snowflakes on the strap, shallow depth of field. [STYLE BLOCK]
```

**Shot 16 – Tavola dal basso**
```
Worm's-eye view looking straight up, snowboarder flying overhead, underside of a black snowboard
silhouetted against a blinding floodlight, starburst glare, snow particles. [STYLE BLOCK]
```

**Titolo finale** (Nano Banana Pro gestisce bene il testo; in alternativa GPT Image 2):
```
Same frame as reference image, add a large 3D chrome extruded title "KUCH" centered on the
rider's chest, brushed silver metal with blue reflections from the night sky, subtle glow,
small spaced uppercase subtitle "[TAGLINE]" below. Keep everything else identical.
```
→ ottieni il frame **senza** titolo (start) e **con** titolo (end) per animarne la comparsa.

### FASE 2 – Animazione (image-to-video)

Regola d'oro dei prompt video: **1 azione + 1 movimento di camera + 1 dettaglio fisico** per clip. Durata 4–5 s (poi tagli a 0,5–1,5 s in montaggio: genera sempre più lungo di quanto ti serve).

| Uso | Modello | Perché |
|---|---|---|
| Identità coerente con reference | **Seedance 2.0** (std, 1080p) o **Seedance 2.5** `omni_reference` | Accetta più image reference + start/end frame; mantiene volto/giacca. |
| Azione sportiva, fisica della neve, multi-shot | **Kling 3.0** (pro) | Migliore su salti, peso del corpo, particelle. |
| Camera "da film", speed ramp, lenti, luci | **Cinema Studio 4.0** | Controlli camera/lente/pacing/luce + `speedramp` (slowmo, impact). |
| Plate senza personaggio (onda di neve, drone) | **Seedance 2.5** t2v | Veloce ed economico, nessuna identità da mantenere. |
| Transizione flare / comparsa titolo | **Seedance 2.0** con `start_image` + `end_image` | Interpola esattamente tra due frame. |

Prompt video di esempio:

```
SHOT 1 (start image = keyframe 1):
Slow push-in toward the rider. He stays still, head bowed, only his breath vapor moving.
Snow falls gently through the floodlight beams. Camera steady, cinematic.
```
```
SHOT 3 (start = ritratto, end = frame bianco bruciato):
A bright flashlight swings into the lens and blooms until the whole frame burns to white.
```
```
SHOT 4/6:
Low tracking camera skimming the snow, rider carves hard toward camera, powder spray
explodes and covers the lens for a moment, slow motion 50%, crystals glowing in backlight.
```
```
SHOT 7:
Rider launches off the kicker, indy grab at peak, camera static low angle,
the board passes in front of the floodlight creating a starburst, snow dust trailing.
```
```
SHOT 8 (drone):
Aerial drone slowly tilting down and tracking, tiny rider carving across the slope,
long spray trail forming behind him.
```
```
SHOT 18 (start = senza titolo, end = con titolo):
Rider stays still, chrome title "KUCH" slowly materializes with a metallic light sweep,
then the image fades to black.
```

Impostazioni: `generate_audio: false` sulle clip d'azione (la musica la metti tu in montaggio); `true` solo se vuoi lo "swoosh" nativo della neve da usare come SFX.

### FASE 3 – Finishing
1. **Upscale**: `Bytedance Video Upscale` preset `aigc` → 2K/4K, oppure `Topaz` 2160p. Se c'è sfarfallio: `Video Deflicker`.
2. **Montaggio** (Premiere/DaVinci/CapCut):
   - Taglia sul beat: prima 2,6 s lenti (3 tagli), poi media 0,8 s, picco finale con micro-tagli da 2–4 frame.
   - Flash frame bianchi da 2 frame tra i salti; whip-pan blur (shot 9) tra due direzioni opposte.
   - Speed ramp 100% → 30% sul momento del picco del salto.
   - Grading unificato: LUT fredda, neri a 5–8 IRE, grana 35 mm leggera su tutto (nasconde le differenze tra modelli).
3. **Audio**: Higgsfield qui genera voce (Seed Audio) ma non musica stand-alone → usa traccia licenziata (Artlist/Epidemic) stile cinematic trap/drum & bass con drop a ~2,6 s. SFX: vento, raschiata lamine, impatto atterraggio, "whoosh" sulle transizioni. Opzionale VO con `generate_audio` (seed_audio): una frase sola sul finale.

### FASE 4 – Scala la campagna
- `reframe` → versione **9:16** per Reels/TikTok (tieni il rider al centro; per questo i keyframe in 21:9/16:9 con margine).
- **Ad Multiplier** → stesso spot con altro rider / altro colore giacca / altra location (es. giorno, bosco).
- **Genjutsu `hf_mult_replace_object`** → sostituisci la giacca nello spot finito con un'altra referenza prodotto (colorway diversi senza rigenerare tutto).
- **Virality Predictor** → testa hook alternativi prima di spendere in ads.
- Cutdown: **6 s bumper** (shot 2 + 7 + 18), **15 s** (togli shot 5, 8, 11), **20 s** master.

---

## 5. Budget e tempi indicativi

| Fase | Generazioni | Note |
|---|---|---|
| Asset (character/location/prodotto) | 10–20 immagini | Nano Banana Pro 2K–4K |
| Keyframe | 18 shot × 3 varianti ≈ 55 immagini | |
| Video | 18 shot × 2–3 tentativi ≈ 45 clip da 5 s | La voce più costosa: usa `draft` 480p di Seedance 2.5 e finalizza a 1080p solo i take buoni |
| Upscale + finishing | 1 master + 2 cutdown | |

Tempo realistico per un creator esperto: **1–2 giorni** (mezza giornata asset/keyframe, mezza giornata video, mezza giornata montaggio/audio).

---

## 6. Checklist qualità prima della pubblicazione
- [ ] Logo identico in tutti gli shot (zoom al 200% sui CU).
- [ ] Mani/guanti e attacchi della tavola senza deformazioni.
- [ ] Stessa giacca (cuciture, cappuccio, colore) in ogni clip.
- [ ] Direzione di movimento coerente tra tagli consecutivi (regola dei 180°).
- [ ] Prodotto visibile entro 1 s; brand entro gli ultimi 3 s; CTA presente.
- [ ] Sottotitoli/testi leggibili su smartphone.
- [ ] Nessun marchio di terzi (solo il tuo logo).
