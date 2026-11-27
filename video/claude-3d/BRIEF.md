# HYPERFRAMES --- Brief esecutivo definitivo

@nadirdesign.ai \| 1080×1920 \| 30 fps \| 19,5 s \| 585 frame

## Mandato

Agisci come direttore creativo, motion designer senior e sviluppatore
Three.js. Implementa, testa e renderizza un MP4, non limitarti a
proporre idee. Usa Three.js r160, HTML/CSS e GSAP, con timeline
deterministica frame/30. Costruisci tutti gli oggetti proceduralmente:
niente immagini statiche spacciate per 3D. Il video di riferimento
eventualmente allegato è un benchmark di fluidità, composizione e sound
design: analizzalo prima di lavorare, senza copiarlo. Nessuna immagine
esterna necessaria.

## Priorità assoluta: HOOK WOW

Dal frame 0 mostra chat, tastiera attiva e titolo «Scrivi. Claude crea
video.» (Inter 900, 68 px). Il prompt è già parzialmente scritto. Digita
i caratteri residui con tasti illuminati, suggerimenti dinamici, micro
spring e cursore. Nessun logo introduttivo. A 1,0 s invio, 1,1--1,5 s
indicatore di elaborazione, 1,5--1,8 s espansione della bolla MP4 a
fullscreen con prospettiva, parallasse e impatto a tre layer. A 1,8 s il
motore è già leggibile e in movimento; anticipa l'apertura della
carcassa a 2,3 s per dare una ricompensa immediata. Non sacrificare la
leggibilità per la velocità. Usa motion blur controllato, easing
continuo e inerzia; niente scatti, tagli netti, dissolvenze o zoom
casuali. Ogni 1--1,5 s evoluzione significativa. Il terzo risultato deve
superare i primi due.

## Fatti consentiti

HyperFrames: skill gratuita e open source per Claude Code, circa 90.000
stelle GitHub (dato fornito dall'autore, non verificato
indipendentemente; ometterlo nel video). Prompt in linguaggio naturale →
codice HTML/CSS, GSAP, Three.js → render MP4 di esplicativi, titoli,
motion graphics, grafici e scene 3D. Non inventare funzioni o
statistiche. Le attese compresse sono una rappresentazione narrativa:
mostra «Demo accelerata» nella chat, non promettere rendering
istantaneo.

## Brand e layout

Sfondo #0A0A0C, arancio #D97757 e #F0A27F, crema #F3EEE6, lime #C8F25A
solo conferme. Inter 900 titoli, 500--600 testi; Space Grotesk 500
etichette; monospace comandi. Safe zone testi/interfacce Y168--1330,
margini laterali 80 px. Chat originale, non copia ufficiale: x60 y310
w960 h1010 r42; header h90; messaggi y400--860; input x90 y870 w900
h110; suggerimenti y995--1040; tastiera y1050--1300. Prompt 34 px;
titoli risultati 76 px x80 y220; etichette 30 px; didascalie 48 px
y1190--1300. UI #151518, bordi bianchi 9%. Oggetti 3D possono estendersi
oltre safe zone, testo no.

## Prompt e titoli

1.  «Mostra come funziona un motore a combustione.» --- Dentro il
    MOTORE.
2.  «Visualizza il campo magnetico di un motore elettrico.» --- La forza
    INVISIBILE.
3.  «Mostra come un buco nero deforma lo spazio.» --- Lo spazio si
    PIEGA.

## Timeline vincolante

  -----------------------------------------------------------------------
  Tempo (s)                           Evento / camera / suono
  ----------------------------------- -----------------------------------
  0--1,0                              Chat e digitazione residua; push-in
                                      3%; tasti reali

  1,0--1,1                            Invio, bolla sale 90 px, clic

  1,1--1,5                            Claude sta animando...; pulse
                                      digitale

  1,5--1,8                            Bolla si espande a fullscreen;
                                      impatto sincronizzato a 1,8

  1,8--2,5                            Motore in orbita; apertura carcassa
                                      inizia a 2,3; rumore meccanico

  2,5--3,5                            Sezione rivela pistone e biella;
                                      dolly-in; clack

  3,5--4,0                            Macro camera combustione;
                                      accensione a 4,0

  4,0--4,5                            Pistone scende, albero ruota;
                                      impatto meccanico

  4,5--5,2                            Ricomposizione e dolly-out; snap

  5,2--5,6                            Rientro nella bolla, conferma 01

  5,6--6,4                            Prompt 02: digita suffisso,
                                      prefisso già presente; push-in

  6,4--6,5                            Invio

  6,5--6,8                            Elaborazione

  6,8--7,0                            Espansione prospettica, impatto a
                                      7,0

  7,0--7,5                            Motore elettrico, orbita

  7,5--8,5                            Carcassa si apre, bobine rivelate

  8,5--9,0                            Campo emerge, impulso elettrico

  9,0--9,5                            Campo rotante, rotore accelera

  9,5--10,2                           Vista assiale, compressione
                                      circolare

  10,2--10,6                          Rientro nella chat, conferma 02

  10,6--11,4                          Prompt 03: digita suffisso,
                                      prefisso già presente

  11,4--11,5                          Invio

  11,5--11,8                          Elaborazione

  11,8--12,0                          Portale circolare, quasi silenzio

  12,0--12,5                          Buco nero fullscreen; impatto a
                                      12,2

  12,5--13,5                          Orbita, disco luminoso, griglia
                                      emerge

  13,5--14,0                          Griglia si incurva, AHA a 14,0

  14,0--15,0                          Particelle e distorsione ottica,
                                      seconda rivelazione a 15,0

  15,0--16,2                          Sorvolo esterno, dolly-out

  16,2--16,5                          Rientro nella terza miniatura

  16,5--19,5                          CTA sempre leggibile, galleria
                                      scorre, commento VIDEO e guida
  -----------------------------------------------------------------------

## Rendering comune

FOV36, near0.1 far100, antialias, pixelRatio1, ACES Filmic exposure1.15,
sRGB, bloom strength0.45 radius0.35 threshold0.85, seed42. Environment
map procedurale con pannelli luminosi, ombre morbide. Camera lookAt
centro del soggetto; interpolazione sine.inOut, espansioni power3.inOut,
incastri back.out(1.15). Shared element: stessa superficie video tra
bolla e fullscreen, radius24→0, nessuna dissolvenza. Precarica asset;
nessun salto di frame.

## Scena 01 --- motore

Cilindro r0.78 h1.65 96 segmenti #777C85 metalness .85 roughness .30;
pistone r.74 h.46 tre anelli #C5CAD0 .95/.20; biella lunghezza1.2
estrusa smussata #9299A3 .90/.28; manovella r.34 #777C85 .95/.24;
carcassa #454950 .80/.38, apertura 1.4 unità. Cinematica
biella-manovella coerente. Combustione illustrativa con emissione
#F0A27F e particelle, non fiamme fotorealistiche. Key (-3,5,4)
intensità4 crema; rim (3,2,-3) 5 arancio; fill (0,-2,4) .8. Camera XYZ:
1.8:(4,2,7); 2.5:(3,1.5,6.5); 3.0:(2,1,6); 3.5:(1,.5,5.5);
4.0:(0,1.2,4.8); 4.5:(2,-.5,5.5); 5.2:(4,2,7). AHA 4.0: impulso causa
discesa pistone e rotazione albero.

## Scena 02 --- magnetismo

Statore anello estruso r esterno1.55 interno1.02 #626770 .90/.30; rotore
r.85 lunghezza1.8 #A8ADB5 .95/.20; 12 gruppi bobine con 8 avvolgimenti
TubeGeometry #C57548 .95/.23; carcassa #41454C .85/.32. 24 curve
luminose spessore .012, particelle lungo le curve; rappresentazione
didattica, non simulazione numerica. Key (-4,4,5) 3.5; rim (4,1,-3) 6;
fill (0,-2,3) 1. Camera: 7:(4,2,6); 7.5:(3,2,5.8); 8:(3,1,5);
8.5:(2,1,4.8); 9:(1,.5,5); 9.5:(0,0,5); 10.2:(0,0,4.5). AHA 9.0: bobine
si illuminano e campo rotante emerge; rotore segue. Niente fulmini
casuali.

## Scena 03 --- buco nero

Sfera nera r.85 128×96; disco ShaderMaterial r interno1.2 esterno3.4,
palette #F3EEE6/#F0A27F/#D97757/#51271E; 6000 particelle, 350 stelle,
griglia 12×12 con 100×100 segmenti. Deformazione illustrativa
y=-strength/sqrt(x*x+z*z+0.8), distorsione ottica radiale locale, bloom
.65, fill (0,4,5) .4. Camera: 12:(0,2.5,10); 12.5:(0,2,8); 13:(2,2,7.5);
13.5:(3,4,7); 14:(2,3,6); 14.5:(3,1.5,5.5); 15:(0,1,6); 15.5:(4,.8,3);
16.2:(0,3,10). AHA 14.0: griglia si incurva mentre camera cambia
inclinazione; 15.0 seconda rivelazione ottica. Non attraversare
orizzonte eventi; visualizzazione illustrativa, non relatività numerica.

## Sound design

Senza voce, senza musica nel file. Musica aggiunta dall'autore su
Instagram: tensione elettronica minimale tipo Tension Mode, con licenza
adeguata. SFX legati a eventi visibili, niente whoosh acuti o raffiche.
Tasti 35--55 ms -22 dBFS, intervalli sonori almeno70 ms; invio90 ms -17;
pulse180 ms -23; impatti 01/02/03 rispettivamente 320/380/550 ms, picchi
-8/-7/-6 dBFS, attacco+corpo+coda; pistone120 ms -13; accensione220 ms
-10; rotore1.2 s -19; camera180--300 ms -21; texture gravitazionale1.5 s
-22; conferma180 ms -16. Quasi silenzio 11.8--12.1. Effetti spaziali
cinematografici, non suoni reali del vuoto. Master max -1 dBTP; -16 LUFS
indicativo, lascia spazio alla musica. Asset audio con licenze adeguate.

## CTA

16.5--19.5: «Commenta VIDEO» (Inter900 86px y850, VIDEO arancio), «Ti
mando il link e la guida» (44px y960), HyperFrames · Gratuito e open
source sopra galleria. Galleria x60 y330 w960, miniature280×410 gap24,
pan60px/3s. Campo commento820×100 y1060; scheda guida820×110 y1180; lime
solo conferma. Non simulare una consegna effettivamente verificata.

## Controllo qualità (15 punti)

1.  Frame 0 comprensibile senza audio.
2.  Primo fullscreen a 1.8 s e apertura già a 2.3 s.
3.  585 frame esatti a 30 fps.
4.  1080×1920 senza bande.
5.  Safe zone rispettata.
6.  Prompt italiani max 9 parole.
7.  Evoluzione significativa ogni 1--1.5 s.
8.  Crescendo reale dei tre esempi.
9.  Transizioni continue e fluide.
10. Materiali premium, niente clipping/compenetrazioni.
11. SFX sincronizzati al frame.
12. Nessuna musica o voce incorporata.
13. Nessun fatto inventato; demo accelerata dichiarata.
14. CTA leggibile per 3 s.
15. Visione integrale su schermo verticale, anche senza audio.

## Consegna

Implementa componenti ChatInterface, ProceduralKeyboard, EngineScene,
MagneticFieldScene, BlackHoleScene, SharedElementTransition,
SoundDesign, CTA. Genera preview a 0, 1.8, 2.5, 4, 9, 14, 17.5 s;
controlla anche un render in movimento dei primi 3 s. Correggi ogni
problema prima del render finale. Consegna sorgenti, asset audio e MP4.
Non dichiarare completato senza verifica. Se un effetto non è
supportato, implementa alternativa procedurale equivalente e
documentala. I parametri sono specifiche creative, non risultati di un
render già testato.
