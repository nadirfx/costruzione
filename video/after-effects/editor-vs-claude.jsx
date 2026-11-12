/*  EDITOR vs CLAUDE — script di costruzione per After Effects (ExtendScript)
    -----------------------------------------------------------------------
    Costruisce da zero la composizione 9:16 (1080x1920, 30 fps, 25,5 s) del video
    "Ho licenziato il mio video editor", con camera 3D sempre in movimento,
    motion blur, transizioni di movimento, grafici animati e sottotitoli.

    USO
    1. Installa i font della cartella ./fonts (doppio clic → Installa).
    2. After Effects → Preferenze → Script ed espressioni →
       "Consenti agli script di scrivere file e accedere alla rete".
    3. File → Script → Esegui file di script… → scegli questo file.
       Da riga di comando:
         Windows: "C:\Program Files\Adobe\Adobe After Effects <versione>\Support Files\AfterFX.exe" -r "<percorso>\editor-vs-claude.jsx"
         Mac:     osascript -e 'tell application "Adobe After Effects <versione>" to DoScriptFile "<percorso>/editor-vs-claude.jsx"'
    4. Lo script salva il progetto (editor-vs-claude.aep) accanto a sé e mette la
       composizione in coda di render. Render da riga di comando con aerender:
         aerender -project "<percorso>/editor-vs-claude.aep" -comp "EditorVsClaude_9x16" -output "<percorso>/out/editor-vs-claude-AE.mp4"

    NOTA: prima stesura scritta senza poterla eseguire in After Effects.
    Va lanciata, guardata e corretta (vedi PROMPT_CLAUDE_DESKTOP.md).
    Compatibile ExtendScript (ES3): niente let/const/arrow/template string.
*/
(function () {
    var DUR = 25.5, W = 1080, H = 1920, FPS = 30;
    var HERE = File($.fileName).parent;

    app.beginUndoGroup("Editor vs Claude");
    if (!app.project) { app.newProject(); }
    var proj = app.project;
    var comp = proj.items.addComp("EditorVsClaude_9x16", W, H, 1, DUR, FPS);
    comp.motionBlur = true;
    comp.shutterAngle = 180;
    comp.shutterPhase = -90;
    comp.bgColor = [0.03, 0.03, 0.07];

    /* ---------------- colori, font ---------------- */
    function hex(h) { return [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255]; }
    var C = {
        blue: hex(0x5B8CFF), red: hex(0xFF3B5C), orange: hex(0xFF8F5A), green: hex(0x35E08A),
        white: hex(0xF3F1FA), muted: hex(0x9A98B0), dark: hex(0x0B0A12), card: hex(0x16142A),
        bgTop: hex(0x08081A), bgMid: hex(0x141030), bgBot: hex(0x07070F), purple: hex(0x7A5CFF)
    };
    var F = {
        body: "BricolageGrotesque-Medium", bold: "BricolageGrotesque-Bold", heavy: "BricolageGrotesque-ExtraBold",
        num: "Unbounded-Black", numB: "Unbounded-Bold", mono: "SpaceGrotesk-Bold", monoM: "SpaceGrotesk-Medium"
    };

    /* ---------------- helper ---------------- */
    function TR(l) { return l.property("ADBE Transform Group"); }
    function P(l, m) { return TR(l).property(m); }
    function times(l, a, b) { l.inPoint = a; l.outPoint = b; }
    function easeAll(prop, inf) {
        for (var k = 1; k <= prop.numKeys; k++) {
            for (var d = 1; d <= 3; d++) {
                try {
                    var arr = [];
                    for (var j = 0; j < d; j++) { arr.push(new KeyframeEase(0, inf)); }
                    prop.setTemporalEaseAtKey(k, arr, arr);
                    break;
                } catch (e) { }
            }
        }
    }
    function kf(prop, pairs, inf) {
        for (var i = 0; i < pairs.length; i++) { prop.setValueAtTime(pairs[i][0], pairs[i][1]); }
        easeAll(prop, inf || 75);
    }
    function fx(l, match) { try { return l.property("ADBE Effect Parade").addProperty(match); } catch (e) { return null; } }
    function glow(l, radius, intensity) {
        var g = fx(l, "ADBE Glo2");
        if (g) { try { g.property("ADBE Glo2-0003").setValue(radius); g.property("ADBE Glo2-0004").setValue(intensity); } catch (e) { } }
        return g;
    }
    function blurProp(l) { var b = fx(l, "ADBE Gaussian Blur 2"); return b ? b.property("ADBE Gaussian Blur 2-0001") : null; }
    function nul(name, pos, a, b) {
        var n = comp.layers.addNull(DUR); n.name = name; n.threeDLayer = true;
        P(n, "ADBE Anchor Point").setValue([0, 0, 0]); P(n, "ADBE Position").setValue([pos[0], pos[1], 0]);
        times(n, a, b); return n;
    }
    function shape(name, a, b, parent) {
        var l = comp.layers.addShape(); l.name = name; l.threeDLayer = true;
        P(l, "ADBE Anchor Point").setValue([0, 0, 0]); P(l, "ADBE Position").setValue([0, 0, 0]);
        times(l, a, b); if (parent) { l.parent = parent; P(l, "ADBE Position").setValue([-parent.transform.position.value[0], -parent.transform.position.value[1], 0]); }
        return l;
    }
    function pivot(l, x, y) { // sposta il punto di rotazione/scala senza muovere il disegno
        var pos = P(l, "ADBE Position").value;
        P(l, "ADBE Anchor Point").setValue([x, y, 0]);
        P(l, "ADBE Position").setValue([pos[0] + x, pos[1] + y, pos[2] || 0]);
    }
    function grp(l, name) { var g = l.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group"); g.name = name || "g"; return g; }
    function contents(g) { return g.property("ADBE Vectors Group"); }
    function paint(c, fill, stroke, sw) {
        var st = null, fl = null;
        if (stroke) {
            st = c.addProperty("ADBE Vector Graphic - Stroke");
            st.property("ADBE Vector Stroke Color").setValue(stroke);
            st.property("ADBE Vector Stroke Width").setValue(sw || 6);
            st.property("ADBE Vector Stroke Line Cap").setValue(2);
            st.property("ADBE Vector Stroke Line Join").setValue(2);
        }
        if (fill) { fl = c.addProperty("ADBE Vector Graphic - Fill"); fl.property("ADBE Vector Fill Color").setValue(fill); }
        return { stroke: st, fill: fl };
    }
    function rect(l, cx, cy, w, h, r, fill, stroke, sw, name) {
        var g = grp(l, name); var c = contents(g);
        var p = c.addProperty("ADBE Vector Shape - Rect");
        p.property("ADBE Vector Rect Size").setValue([w, h]);
        p.property("ADBE Vector Rect Position").setValue([cx, cy]);
        p.property("ADBE Vector Rect Roundness").setValue(r);
        var pt = paint(c, fill, stroke, sw); pt.group = g; return pt;
    }
    function ellipse(l, cx, cy, d, fill, stroke, sw, name) {
        var g = grp(l, name); var c = contents(g);
        var p = c.addProperty("ADBE Vector Shape - Ellipse");
        p.property("ADBE Vector Ellipse Size").setValue([d, d]);
        p.property("ADBE Vector Ellipse Position").setValue([cx, cy]);
        var pt = paint(c, fill, stroke, sw); pt.group = g; return pt;
    }
    function path(l, verts, inT, outT, closed, fill, stroke, sw, name) {
        var g = grp(l, name); var c = contents(g);
        var p = c.addProperty("ADBE Vector Shape - Group");
        var s = new Shape(); s.vertices = verts; s.closed = closed;
        if (inT) { s.inTangents = inT; } if (outT) { s.outTangents = outT; }
        p.property("ADBE Vector Shape").setValue(s);
        var pt = paint(c, fill, stroke, sw); pt.group = g; pt.contents = c; return pt;
    }
    function text(str, size, font, color, x, y, a, b, parent, just) {
        var l = comp.layers.addText(str);
        var sp = l.property("ADBE Text Properties").property("ADBE Text Document");
        var d = sp.value;
        d.fontSize = size; try { d.font = font; } catch (e) { }
        d.applyFill = true; d.fillColor = color; d.applyStroke = false;
        d.justification = just || ParagraphJustification.CENTER_JUSTIFY;
        sp.setValue(d);
        l.threeDLayer = true; times(l, a, b);
        if (parent) { l.parent = parent; var pp = parent.transform.position.value; P(l, "ADBE Position").setValue([x - pp[0], y - pp[1], 0]); }
        else { P(l, "ADBE Position").setValue([x, y, 0]); }
        return l;
    }
    function srcExpr(l, expr) { l.property("ADBE Text Properties").property("ADBE Text Document").expression = expr; }
    // colore di linea che cambia con l'umore della scena: blu → rosso → arancio
    function moodKeys(prop) {
        kf(prop, [[0, C.blue], [1.2, C.blue], [1.45, C.red], [8.0, C.red], [8.6, C.orange]], 60);
    }
    function popIn(l, t, from) { // entrata con rimbalzo (molla)
        var s = P(l, "ADBE Scale");
        kf(s, [[t, [from || 0, from || 0, 100]], [t + 0.22, [112, 112, 100]], [t + 0.36, [96, 96, 100]], [t + 0.48, [100, 100, 100]]], 70);
    }
    function fadeOpacity(l, a, b, inD, outD) {
        var o = P(l, "ADBE Opacity");
        kf(o, [[a, 0], [a + (inD || 0.3), 100], [b - (outD || 0.25), 100], [b, 0]], 60);
    }
    function idle(l, amp, freq) { // movimento continuo: il video non deve mai essere fermo
        P(l, "ADBE Position").expression = "value + [Math.sin(time*" + (freq || 2.2) + "+index)*" + (amp || 8) + ", Math.cos(time*" + (freq || 2.2) * 0.8 + "+index)*" + (amp || 8) + ", 0]";
    }
    var BEAT_EXPR = "var b=0; if(time>10.6){var t=(time-10.6)%0.5; b=Math.exp(-t*9);} ";

    /* ---------------- sfondo (2D, non segue la camera) ---------------- */
    var bg = comp.layers.addSolid(C.bgMid, "BG", W, H, 1, DUR);
    var ramp = fx(bg, "ADBE Ramp");
    if (ramp) {
        ramp.property("ADBE Ramp-0001").setValue([540, 0]); ramp.property("ADBE Ramp-0002").setValue(C.bgTop);
        ramp.property("ADBE Ramp-0003").setValue([540, 1920]); ramp.property("ADBE Ramp-0004").setValue(C.bgBot);
    }
    // luci sfocate (bokeh) in 3D, lontane: parallasse lenta
    var bokehCols = [C.purple, C.blue, C.orange, C.purple];
    for (var i = 0; i < 16; i++) {
        var bk = shape("BOKEH " + (i + 1), 0, DUR);
        var bx = (i * 337) % 1180 - 50, by = (i * 619) % 2020 - 50, bs = 160 + (i * 53) % 200;
        rect(bk, bx, by, bs, bs, bs * 0.28, bokehCols[i % 4], null, 0, "q");
        P(bk, "ADBE Position").setValue([0, 0, 900 + (i % 3) * 300]);
        P(bk, "ADBE Opacity").setValue(i % 4 === 2 ? 22 : 38);
        var bb = blurProp(bk); if (bb) { bb.setValue(90); }
        P(bk, "ADBE Position").expression = "value + [Math.sin(time*0.25+" + i + ")*60, Math.cos(time*0.2+" + i + ")*70, 0]";
    }
    // alone colorato che cambia con l'umore
    var halo = shape("ALONE", 0, DUR);
    var hp = ellipse(halo, 540, 820, 1500, C.blue, null, 0, "alone");
    moodKeys(hp.fill.property("ADBE Vector Fill Color"));
    P(halo, "ADBE Opacity").setValue(28); var hb = blurProp(halo); if (hb) { hb.setValue(260); }
    P(halo, "ADBE Position").setValue([0, 0, 600]);

    /* ---------------- camera sempre in movimento ---------------- */
    var cam = comp.layers.addCamera("CAMERA", [W / 2, H / 2]);
    P(cam, "ADBE Position").expression =
        BEAT_EXPR +
        "var intro=Math.max(0,1-time/0.9); intro=intro*intro;" +
        "var push=linear(time,0,10.6,0,220)+ (time>10.6? ((time-10.6)%2.3)*40 : 0);" +
        "[value[0]+Math.sin(time*0.95)*48+Math.sin(time*2.3)*14, value[1]+Math.cos(time*0.8)*38+Math.sin(time*1.7)*12, value[2]+push+b*90+intro*600]";
    P(cam, "ADBE Anchor Point").expression = "[value[0]+Math.sin(time*0.95)*30, value[1]+Math.cos(time*0.8)*24, value[2]]";
    P(cam, "ADBE Rotate Z").expression = "Math.sin(time*0.62)*1.7 + Math.sin(time*1.9)*0.35 + Math.max(0,1-time/0.9)*4.5";

    /* ======================= SCENA A–D: la scrivania (0–10,6 s) ======================= */
    var DESK = nul("SCENA scrivania", [540, 931], 0, 10.75);
    // tuffo nel portatile 9,75–10,6 s
    kf(P(DESK, "ADBE Scale"), [[9.75, [100, 100, 100]], [10.6, [800, 800, 800]]], 90);
    kf(P(DESK, "ADBE Opacity"), [[10.4, 100], [10.75, 0]], 50);

    var desk = shape("scrivania", 0, 10.75, DESK);
    var dl = path(desk, [[70, 1040], [1010, 1040]], null, null, false, null, C.blue, 6, "bordo");
    moodKeys(dl.stroke.property("ADBE Vector Stroke Color")); glow(desk, 40, 1.4);
    // griglia prospettica sul piano
    var grid = shape("griglia", 0, 10.75, DESK);
    for (var gi = -8; gi <= 8; gi++) {
        path(grid, [[540 + gi * 25, 1060], [540 + gi * 120, 1330]], null, null, false, null, C.blue, 2, "v" + gi);
    }
    for (var gj = 0; gj < 6; gj++) {
        var gy = 1060 + Math.pow(gj / 6, 1.7) * 270;
        path(grid, [[80, gy], [1000, gy]], null, null, false, null, C.blue, 2, "h" + gj);
    }
    P(grid, "ADBE Opacity").setValue(18);

    // portatile
    var lap = shape("portatile", 0, 10.75, DESK);
    var lid = rect(lap, 540, 931, 270, 178, 16, C.dark, C.blue, 6, "schermo");
    moodKeys(lid.stroke.property("ADBE Vector Stroke Color"));
    var lb = path(lap, [[372, 1026], [708, 1026]], null, null, false, null, C.blue, 8, "base");
    moodKeys(lb.stroke.property("ADBE Vector Stroke Color")); glow(lap, 36, 1.3);

    // omino (testa + busto) con oscillazione continua
    var OM = shape("omino", 0, 8.6, DESK);
    var head = ellipse(OM, 540, 650, 160, C.dark, C.blue, 6, "testa");
    moodKeys(head.stroke.property("ADBE Vector Stroke Color"));
    var k = 82.8;
    var body = path(OM, [[390, 912], [540, 762], [690, 912]], [[0, 0], [-k, 0], [0, -k]], [[0, -k], [k, 0], [0, 0]], false, null, C.blue, 6, "busto");
    moodKeys(body.stroke.property("ADBE Vector Stroke Color")); glow(OM, 34, 1.3);
    pivot(OM, 540, 1040);
    P(OM, "ADBE Rotate Z").expression = "Math.sin(time*1.4)*1.7";
    P(OM, "ADBE Position").expression = "value + [Math.sin(time*0.9)*10, Math.sin(time*6)*3, 0]";
    kf(P(OM, "ADBE Opacity"), [[8.05, 100], [8.6, 0]], 60);

    // facce: concentrato (0–1,25), scioccato (1,25–2,4), triste (2,4–8,6)
    function face(name, a, b, kind) {
        var f = shape(name, a, b); f.parent = OM; P(f, "ADBE Position").setValue([0, 0, 0]); P(f, "ADBE Anchor Point").setValue([540, 1040, 0]);
        P(f, "ADBE Position").setValue([540, 1040, 0]);
        var col = kind === "work" ? C.blue : C.red;
        if (kind === "work") {
            path(f, [[510, 644], [528, 644]], null, null, false, null, col, 5, "oc1");
            path(f, [[552, 644], [570, 644]], null, null, false, null, col, 5, "oc2");
            path(f, [[528, 680], [552, 680]], null, null, false, null, col, 5, "bocca");
        } else if (kind === "shock") {
            ellipse(f, 519, 640, 24, null, col, 5, "oc1"); ellipse(f, 561, 640, 24, null, col, 5, "oc2"); ellipse(f, 540, 682, 22, null, col, 5, "bocca");
        } else {
            path(f, [[505, 634], [526, 625]], null, null, false, null, col, 5, "sop1");
            path(f, [[575, 634], [554, 625]], null, null, false, null, col, 5, "sop2");
            ellipse(f, 520, 648, 6, col, null, 0, "oc1"); ellipse(f, 560, 648, 6, col, null, 0, "oc2");
            path(f, [[518, 690], [540, 668], [562, 690]], [[0, 0], [-12, 0], [0, 0]], [[0, 0], [12, 0], [0, 0]], false, null, col, 5, "bocca");
        }
        glow(f, 16, 1); return f;
    }
    face("faccia concentrata", 0, 1.25, "work");
    face("faccia scioccata", 1.25, 2.4, "shock");
    face("faccia triste", 2.4, 8.6, "sad");
    // goccia di sudore (5,4–8 s)
    var sw = shape("sudore", 5.4, 8.0); sw.parent = OM; P(sw, "ADBE Position").setValue([0, 0, 0]);
    ellipse(sw, 618, 610, 18, hex(0x7FD2FF), null, 0, "goccia");
    P(sw, "ADBE Position").expression = "[value[0], value[1] + ((time*1.1)%1)*90, value[2]]";
    P(sw, "ADBE Opacity").expression = "100*(1-((time*1.1)%1))";

    // tasti che saltano fuori dal portatile mentre lavora (0–1,25 s)
    var keys = ["⌘", "Z", "C", "V", "X"];
    for (var ki = 0; ki < keys.length; ki++) {
        var kt = text(keys[ki], 26, F.mono, hex(0xDDE6FF), 440 + ki * 48, 840, 0, 1.3);
        P(kt, "ADBE Position").expression = "var q=((time*1.6)+" + (ki / 5) + ")%1; value + [0, -q*170, 0]";
        P(kt, "ADBE Opacity").expression = "var q=((time*1.6)+" + (ki / 5) + ")%1; Math.sin(q*Math.PI)*85";
    }

    // timeline di montaggio olografica (sta montando) 0–1,5 s
    var holo = shape("timeline olografica", 0, 1.5);
    rect(holo, 540, 345, 760, 240, 22, hex(0x12142C), hex(0x8296FF), 2, "pannello");
    var clipCols = [C.blue, C.purple, C.orange];
    var clips = [[[0, 180], [200, 140], [360, 260]], [[40, 240], [300, 180], [500, 180]], [[0, 700]]];
    for (var tr = 0; tr < 3; tr++) {
        for (var ci = 0; ci < clips[tr].length; ci++) {
            var cx0 = 190 + clips[tr][ci][0], cw = clips[tr][ci][1] - 8;
            rect(holo, cx0 + cw / 2, 320 + tr * 52, cw, 40, 8, clipCols[tr], null, 0, "clip" + tr + ci);
        }
    }
    P(holo, "ADBE Opacity").setValue(85); fadeOpacity(holo, 0, 1.5, 0.01, 0.3); idle(holo, 10, 2);
    P(holo, "ADBE Rotate X").expression = "Math.sin(time*1.3)*6"; P(holo, "ADBE Rotate Y").expression = "Math.sin(time*1.1)*5";
    var ph = shape("testina", 0, 1.5);
    path(ph, [[190, 285], [190, 455]], null, null, false, null, C.red, 3, "linea");
    P(ph, "ADBE Position").expression = "value + [((time*260)%700), 0, 0]";
    text("progetto_FINALE_v12_def.prproj", 24, F.monoM, C.muted, 190, 265, 0, 1.5, null, ParagraphJustification.LEFT_JUSTIFY);

    // icone Pr / Ae / Da che fluttuano
    function appIcon(lbl, x, y, col) {
        var s = shape("icona " + lbl, 0, 1.8);
        rect(s, x, y, 120, 120, 30, hex(0x1D1B30), col, 3, "card"); glow(s, 26, 1);
        var t = text(lbl, 42, F.mono, col, x, y + 15, 0, 1.8);
        idle(s, 10, 1.6); t.parent = s;
        fadeOpacity(s, 0, 1.8, 0.01, 0.5); return s;
    }
    appIcon("Pr", 160, 440, hex(0x9999FF)); appIcon("Ae", 925, 400, hex(0xB7A6FF)); appIcon("Da", 925, 610, hex(0xFF9D5C));

    // timbro LICENZIATO (1,22 s) con colpo
    var ST = nul("timbro", [540, 520], 1.22, 2.9);
    P(ST, "ADBE Rotate Z").setValue(-7);
    kf(P(ST, "ADBE Scale"), [[1.22, [260, 260, 100]], [1.4, [100, 100, 100]], [2.5, [100, 100, 100]], [2.9, [80, 80, 100]]], 85);
    kf(P(ST, "ADBE Opacity"), [[1.22, 0], [1.3, 100], [2.5, 100], [2.9, 0]], 50);
    var stB = shape("timbro bordo", 1.22, 2.9); stB.parent = ST; P(stB, "ADBE Position").setValue([-540, -520, 0]);
    rect(stB, 540, 520, 600, 144, 20, null, C.red, 11, "bordo"); glow(stB, 30, 1.5);
    var stT = text("LICENZIATO", 96, F.heavy, C.red, 540, 552, 1.22, 2.9, ST); glow(stT, 24, 1.2);

    // contatore 2.000 € / mese (2,45–5,1 s)
    var CNT = nul("contatore", [540, 300], 2.45, 5.1);
    kf(P(CNT, "ADBE Opacity"), [[2.45, 0], [2.8, 100], [4.85, 100], [5.1, 0]], 60); idle(CNT, 8, 2.6);
    text("il mio editor", 34, F.body, C.muted, 540, 212, 2.45, 5.1, CNT);
    var cn = text("€0", 150, F.num, C.white, 540, 352, 2.45, 5.1, CNT); glow(cn, 20, 0.8);
    srcExpr(cn, "var v=Math.round(linear(time,2.55,3.4,0,2000)); var s=''+v; if(v>=1000){s=s.substring(0,s.length-3)+'.'+s.substring(s.length-3);} '€'+s");
    text("/ mese", 40, F.bold, C.red, 540, 408, 2.45, 5.1, CNT);
    for (var ti = 0; ti < 4; ti++) {
        var tile = shape("500 € n." + (ti + 1), 3.9 + ti * 0.16, 5.1);
        var tx = 210 + ti * 220;
        rect(tile, tx, 500, 190, 96, 18, hex(0x280E18), C.red, 3, "card"); glow(tile, 16, 1);
        pivot(tile, tx, 500); popIn(tile, 3.9 + ti * 0.16);
        var tt = text("500 €", 36, F.heavy, C.white, tx + 15, 513, 3.9 + ti * 0.16, 5.1); tt.parent = tile;
        kf(P(tile, "ADBE Opacity"), [[4.85, 100], [5.1, 0]], 50);
    }

    // calendario 21 giorni · 4 video (5,0–8,15 s): le caselle si riempiono e rimbalzano
    text("21 GIORNI · 4 VIDEO", 36, F.mono, C.white, 540, 202, 5.0, 8.15);
    for (var di = 0; di < 21; di++) {
        var col0 = di % 7, row = Math.floor(di / 7), cxx = 540 - 287 + col0 * 84 + 37, cyy = 240 + row * 72 + 30;
        var tf = 5.15 + (-Math.log(1 - (di + 1) / 21.99) / Math.LN2 / 10) * 2.55;
        var cell = shape("giorno " + (di + 1), 5.0, 8.15);
        var cp = rect(cell, cxx, cyy, 74, 60, 12, hex(0x1A1828), hex(0x3A3850), 2, "casella");
        kf(cp.fill.property("ADBE Vector Fill Color"), [[tf - 0.01, hex(0x1A1828)], [tf, hex(0x5A1F30)]], 33);
        kf(cp.stroke.property("ADBE Vector Stroke Color"), [[tf - 0.01, hex(0x3A3850)], [tf, C.red]], 33);
        pivot(cell, cxx, cyy);
        kf(P(cell, "ADBE Scale"), [[tf, [100, 100, 100]], [tf + 0.08, [130, 130, 100]], [tf + 0.2, [95, 95, 100]], [tf + 0.32, [100, 100, 100]]], 70);
        fadeOpacity(cell, 5.0, 8.15, 0.35, 0.3);
        var nt = text(String(di + 1), 26, F.mono, C.white, cxx, cyy + 9, 5.0, 8.15); nt.parent = cell;
    }
    var rc = shape("render 1/4", 5.0, 8.15);
    rect(rc, 200, 600, 260, 110, 18, hex(0x16142A), hex(0x55536B), 2, "card");
    var bar = rect(rc, 95 + 105, 614, 210, 12, 6, C.red, null, 0, "barra");
    text("Render video 1/4", 26, F.bold, C.white, 200, 590, 5.0, 8.15);
    fadeOpacity(rc, 5.0, 8.15); idle(rc, 8, 1.3);
    P(rc, "ADBE Rotate Z").expression = "-3 + Math.sin(time*1.3)*1.2";

    // logo Claude (asterisco) sul portatile 8,45 s
    var AST = shape("asterisco portatile", 8.45, 10.75, DESK);
    var lens = [1, .78, .95, .7, 1, .82, .9, .74, .96, .8, .88, .76];
    for (var ai = 0; ai < 12; ai++) {
        var an = ai * Math.PI / 6, r0 = 46 * 0.14, r1 = 46 * lens[ai];
        path(AST, [[540 + Math.cos(an) * r0, 931 + Math.sin(an) * r0], [540 + Math.cos(an) * r1, 931 + Math.sin(an) * r1]], null, null, false, null, C.orange, 7, "raggio" + ai);
    }
    glow(AST, 30, 1.6); pivot(AST, 540, 931); popIn(AST, 8.45);
    P(AST, "ADBE Rotate Z").expression = "time*23";

    /* ======================= transizioni di scena ======================= */
    // Ogni scena è un null genitore: entrata/uscita con zoom, frustata o rotazione
    function sceneNull(name, a, b, tin, tout) {
        var n = nul(name, [540, 860], a, b);
        var pos = P(n, "ADBE Position"), sc = P(n, "ADBE Scale"), op = P(n, "ADBE Opacity"), rz = P(n, "ADBE Rotate Z");
        if (tin === "zoom") { kf(sc, [[a, [50, 50, 100]], [a + 0.32, [100, 100, 100]]], 85); kf(op, [[a, 0], [a + 0.25, 100]], 50); }
        if (tin === "whipL") { kf(pos, [[a, [540 + 1240, 860, 0]], [a + 0.32, [540, 860, 0]]], 90); }
        if (tin === "whipU") { kf(pos, [[a, [540, 860 + 1440, 0]], [a + 0.32, [540, 860, 0]]], 90); }
        if (tin === "spin") { kf(rz, [[a, 34], [a + 0.32, 0]], 85); kf(sc, [[a, [55, 55, 100]], [a + 0.32, [100, 100, 100]]], 85); kf(op, [[a, 0], [a + 0.25, 100]], 50); }
        if (tout === "zoom") { kf(sc, [[b - 0.24, [100, 100, 100]], [b, [280, 280, 100]]], 85); kf(op, [[b - 0.24, 100], [b, 0]], 50); }
        if (tout === "whipL") { kf(pos, [[b - 0.24, [540, 860, 0]], [b, [540 - 1240, 860, 0]]], 90); }
        if (tout === "whipU") { kf(pos, [[b - 0.24, [540, 860, 0]], [b, [540, 860 - 1440, 0]]], 90); }
        if (tout === "spin") { kf(rz, [[b - 0.24, 0], [b, -34]], 85); kf(sc, [[b - 0.24, [100, 100, 100]], [b, [190, 190, 100]]], 85); kf(op, [[b - 0.24, 100], [b, 0]], 50); }
        return n;
    }
    function child(l, n) { l.parent = n; var p = P(l, "ADBE Position").value; P(l, "ADBE Position").setValue([p[0] - 540, p[1] - 860, p[2] || 0]); return l; }
    function iconCard(n, a, b, x, y, col, kind) {
        var s = shape("icona " + kind, a, b);
        rect(s, x, y, 170, 170, 46, hex(0x1F1D2E), col, 4, "card"); glow(s, 40, 1.2);
        if (kind === "bolt") { path(s, [[x + 11, y - 48], [x - 26, y + 4], [x + 2, y + 4], [x - 11, y + 48], [x + 28, y - 6], [x, y - 6]], null, null, true, null, col, 10, "fulmine"); }
        if (kind === "pen") { path(s, [[x - 34, y + 34], [x - 26, y + 8], [x + 22, y - 40], [x + 40, y - 22], [x - 8, y + 26]], null, null, true, null, col, 9, "penna"); }
        if (kind === "save") { path(s, [[x - 37, y + 26], [x - 8, y - 4], [x + 8, y + 11], [x + 37, y - 22]], null, null, false, null, col, 9, "freccia"); }
        if (kind === "euro") { var et = text("€", 90, F.heavy, col, x, y + 32, a, b); et.parent = s; }
        child(s, n); pivot(s, x - 540, y - 860);
        kf(P(s, "ADBE Scale"), [[a, [0, 0, 100]], [a + 0.3, [110, 110, 100]], [a + 0.45, [100, 100, 100]]], 70);
        P(s, "ADBE Rotate Z").expression = "Math.sin(time*1.7)*4.5";
        P(s, "ADBE Position").expression = BEAT_EXPR + "value + [0, Math.sin(time*2.2)*10, -b*40]";
        return s;
    }
    function label(n, a, b, str, y) { var l = text(str, 30, F.mono, C.muted, 540, y || 520, a, b); child(l, n); fadeOpacity(l, a, b, 0.4, 0.01); return l; }
    function badge(n, a, b, str, y, col) {
        var s = shape("badge " + str, a, b);
        rect(s, 540, y, 460, 72, 36, col, null, 0, "pill"); glow(s, 30, 1.2);
        var t = text(str, 40, F.heavy, hex(0x0B0B12), 540, y + 14, a, b); t.parent = s;
        child(s, n); pivot(s, 0, y - 860); popIn(s, a); return s;
    }
    function hbar(n, a, b, y, w, col, t0) { // barra orizzontale che cresce con rimbalzo da sinistra
        var s = shape("barra " + y, a, b);
        rect(s, 330 + w / 2, y, w, 68, 34, col, null, 0, "barra"); glow(s, 26, 1);
        child(s, n); pivot(s, 330 - 540, y - 860);
        kf(P(s, "ADBE Scale"), [[t0, [0, 100, 100]], [t0 + 0.45, [106, 100, 100]], [t0 + 0.65, [97, 100, 100]], [t0 + 0.85, [100, 100, 100]]], 70);
        P(s, "ADBE Scale").expression = "value + [Math.sin(time*5)*1.2, 0, 0]";
        return s;
    }

    /* ---- E1 tempi (10,6–12,9) ---- */
    var E1 = sceneNull("SCENA tempi", 10.6, 12.9, "zoom", "whipL");
    iconCard(E1, 10.6, 12.9, 540, 380, C.green, "bolt"); label(E1, 10.6, 12.9, "TEMPI DI CONSEGNA");
    child(text("Editor", 46, F.heavy, C.red, 110, 716, 10.7, 12.9, null, ParagraphJustification.LEFT_JUSTIFY), E1);
    child(text("Claude", 46, F.heavy, C.green, 110, 886, 11.5, 12.9, null, ParagraphJustification.LEFT_JUSTIFY), E1);
    hbar(E1, 10.85, 12.9, 700, 620, C.red, 10.85); hbar(E1, 11.65, 12.9, 870, 68, C.green, 11.65);
    var g21 = child(text("21 giorni", 36, F.heavy, hex(0x1A0710), 920, 712, 11.3, 12.9, null, ParagraphJustification.RIGHT_JUSTIFY), E1);
    child(text("1 giorno", 36, F.heavy, C.green, 420, 882, 12.0, 12.9, null, ParagraphJustification.LEFT_JUSTIFY), E1);
    badge(E1, 12.15, 12.9, "21× più veloce", 1080, C.green);

    /* ---- E2 costi (12,9–15,1) ---- */
    var E2 = sceneNull("SCENA costi", 12.9, 15.1, "whipL", "whipU");
    iconCard(E2, 12.9, 15.1, 540, 380, C.orange, "euro"); label(E2, 12.9, 15.1, "COSTO AL MESE");
    function vbar(n, a, b, x, h, col, t0) {
        var s = shape("colonna " + x, a, b);
        rect(s, x, 1090 - h / 2, 170, h, 18, col, null, 0, "colonna"); glow(s, 30, 1);
        child(s, n); pivot(s, x - 540, 1090 - 860);
        kf(P(s, "ADBE Scale"), [[t0, [100, 0, 100]], [t0 + 0.45, [100, 106, 100]], [t0 + 0.65, [100, 97, 100]], [t0 + 0.85, [100, 100, 100]]], 70);
        P(s, "ADBE Scale").expression = "value + [0, Math.sin(time*4.5+" + x + ")*2, 0]";
    }
    vbar(E2, 13.15, 15.1, 380, 430, C.red, 13.15); vbar(E2, 13.95, 15.1, 700, 12, C.green, 13.95);
    var ev = child(text("2.000 €", 52, F.num, C.white, 380, 630, 13.2, 15.1), E2);
    srcExpr(ev, "var v=Math.round(Math.min(2000,linear(time,13.15,13.9,0,2000))); var s=''+v; if(v>=1000){s=s.substring(0,s.length-3)+'.'+s.substring(s.length-3);} s+' €'");
    child(text("circa", 30, F.body, C.muted, 700, 990, 13.95, 15.1), E2);
    child(text("20 €", 52, F.num, C.white, 700, 1050, 13.95, 15.1), E2);
    child(text("Editor", 40, F.heavy, C.red, 380, 1150, 13.15, 15.1), E2);
    child(text("Claude", 40, F.heavy, C.green, 700, 1150, 13.95, 15.1), E2);
    badge(E2, 14.35, 15.1, "−99% di costi", 1215, C.green);

    /* ---- E3 modifiche (15,1–17,4) ---- */
    var E3 = sceneNull("SCENA modifiche", 15.1, 17.4, "whipU", "zoom");
    iconCard(E3, 15.1, 17.4, 540, 380, C.orange, "pen"); label(E3, 15.1, 17.4, "MODIFICHE");
    function lane(n, y, col, nm, lab, t0, tEnd, frac) {
        var s = shape("percorso " + nm, t0 - 0.25, 17.4);
        var dash = path(s, [[130, y], [930, y]], null, null, false, null, hex(0x55536B), 8, "tratteggio");
        var prog = path(s, [[130, y], [930, y]], null, null, false, null, col, 8, "avanzamento");
        var trim = prog.contents.addProperty("ADBE Vector Filter - Trim");
        kf(trim.property("ADBE Vector Trim End"), [[t0, 0], [tEnd, frac]], 60);
        glow(s, 20, 1); child(s, n);
        child(text(nm, 40, F.heavy, col, 110, y - 50, t0 - 0.25, 17.4, null, ParagraphJustification.LEFT_JUSTIFY), n);
        var lt = child(text(lab, 38, F.heavy, col, 600, y - 40, t0 + 0.1, 17.4), n);
        child(text("richiesta", 26, F.monoM, C.muted, 130, y + 50, t0 - 0.25, 17.4, null, ParagraphJustification.LEFT_JUSTIFY), n);
        child(text("consegna", 26, F.monoM, C.muted, 930, y + 50, t0 - 0.25, 17.4, null, ParagraphJustification.RIGHT_JUSTIFY), n);
        return s;
    }
    lane(E3, 730, C.red, "Editor", "2–3 giorni…", 15.35, 17.3, 38);
    lane(E3, 930, C.green, "Claude", "subito", 15.75, 16.1, 100);
    var ok = shape("spunta", 16.1, 17.4);
    ellipse(ok, 930, 930, 72, C.green, null, 0, "cerchio");
    path(ok, [[916, 930], [927, 942], [946, 918]], null, null, false, null, hex(0x08140C), 8, "v");
    glow(ok, 30, 1.4); child(ok, E3); pivot(ok, 930 - 540, 930 - 860); popIn(ok, 16.1);

    /* ---- F risparmio (17,4–19,4) ---- */
    var FF = sceneNull("SCENA risparmio", 17.4, 19.4, "zoom", "spin");
    iconCard(FF, 17.4, 19.4, 540, 380, C.green, "save"); label(FF, 17.4, 19.4, "RISPARMIO");
    var sv = child(text("1.980 €", 130, F.num, C.green, 540, 695, 17.5, 19.4), FF); glow(sv, 30, 1);
    srcExpr(sv, "var v=Math.round(Math.min(1980,linear(time,17.6,18.4,0,1980))); var s=''+v; if(v>=1000){s=s.substring(0,s.length-3)+'.'+s.substring(s.length-3);} s+' €'");
    child(text("in meno ogni mese", 38, F.body, C.white, 540, 760, 17.8, 19.4), FF);
    var ch = shape("grafico 12 mesi", 17.85, 19.4);
    var pts = []; for (var m = 0; m < 12; m++) { pts.push([150 + m * (780 / 11), 1110 - (m + 1) / 12 * 260]); }
    var cl = path(ch, pts, null, null, false, null, C.green, 7, "linea");
    var ctrim = cl.contents.addProperty("ADBE Vector Filter - Trim");
    kf(ctrim.property("ADBE Vector Trim End"), [[17.9, 0], [18.75, 100]], 60);
    glow(ch, 24, 1.2); child(ch, FF);
    badge(FF, 18.7, 19.4, "in un anno: 23.760 €", 1215, C.green);

    /* ---- G "anche questo video" (19,4–21,8): livelli che si aprono in 3D ---- */
    var G = sceneNull("SCENA livelli", 19.4, 21.8, "spin", "zoom");
    for (var li = 0; li < 4; li++) {
        var ly = shape("livello " + (li + 1), 19.45, 21.8);
        rect(ly, 540, 860, 300, 534, 40, hex(0x0B0A12), C.orange, 5, "schermo");
        rect(ly, 540, 760, 220, 40, 12, [C.red, C.orange, C.green, C.purple][li], null, 0, "contenuto");
        glow(ly, 40, 1); child(ly, G);
        P(ly, "ADBE Rotate X").setValue(58); P(ly, "ADBE Rotate Z").setValue(45);
        kf(P(ly, "ADBE Position"), [[19.8, [0, 0, 0]], [20.6, [0, -60 + li * 0, -li * 150]]], 80);
        P(ly, "ADBE Position").expression = "value + [Math.sin(time*1.6+" + li + ")*12, Math.sin(time*2.4+" + li + ")*14, 0]";
    }
    var tag = shape("etichetta fatto con Claude", 20.55, 21.8);
    rect(tag, 540, 1180, 400, 80, 40, hex(0x141220), C.orange, 3, "pill");
    var tgt = text("fatto con Claude", 32, F.heavy, C.orange, 540, 1192, 20.55, 21.8); tgt.parent = tag;
    child(tag, G); pivot(tag, 0, 1180 - 860); popIn(tag, 20.55);

    /* ---- H invito a commentare (21,8–25,5) ---- */
    var HH = sceneNull("SCENA commenta", 21.8, DUR, "zoom", "none");
    child(text("Commenta", 64, F.bold, C.white, 540, 522, 21.85, DUR), HH);
    var cw = child(text("CLAUDE", 170, F.num, C.orange, 540, 705, 22.0, DUR), HH); glow(cw, 60, 1.3);
    var cr = fx(cw, "ADBE Ramp");
    if (cr) { cr.property("ADBE Ramp-0001").setValue([540, 560]); cr.property("ADBE Ramp-0002").setValue(hex(0xFFD2B8)); cr.property("ADBE Ramp-0003").setValue([540, 720]); cr.property("ADBE Ramp-0004").setValue(hex(0xC9562E)); }
    P(cw, "ADBE Scale").expression = BEAT_EXPR + "value*(1+b*0.04)";
    var box = shape("casella commento", 22.3, DUR);
    var bp = rect(box, 540, 860, 760, 116, 58, hex(0x100E1A), hex(0x55536B), 3, "box");
    kf(bp.stroke.property("ADBE Vector Stroke Color"), [[23.45, hex(0x55536B)], [23.75, C.green]], 50);
    child(box, HH); fadeOpacity(box, 22.3, DUR, 0.35, 0.01); idle(box, 7, 2.3);
    var typed = child(text("Aggiungi un commento…", 40, F.heavy, C.white, 210, 875, 22.3, 23.45, null, ParagraphJustification.LEFT_JUSTIFY), HH);
    srcExpr(typed, "var n=Math.floor(linear(time,22.65,23.25,0,6.99)); n<1?'Aggiungi un commento…':'CLAUDE'.substring(0,n)+(Math.sin(time*14)>0?'|':'')");
    var sent = child(text("Commento inviato", 42, F.heavy, C.green, 210, 875, 23.45, DUR, null, ParagraphJustification.LEFT_JUSTIFY), HH);
    fadeOpacity(sent, 23.45, DUR, 0.25, 0.01);
    var btn = shape("pulsante invio", 22.3, DUR);
    var bc = ellipse(btn, 860, 860, 80, hex(0x2A2838), null, 0, "cerchio");
    kf(bc.fill.property("ADBE Vector Fill Color"), [[23.2, hex(0x2A2838)], [23.3, C.orange], [23.45, C.orange], [23.6, C.green]], 50);
    child(btn, HH); pivot(btn, 860 - 540, 0);
    kf(P(btn, "ADBE Scale"), [[23.3, [100, 100, 100]], [23.4, [85, 85, 100]], [23.6, [118, 118, 100]], [23.75, [100, 100, 100]]], 70);

    /* ---------------- sottotitoli: piccolo + parola chiave grande ---------------- */
    var CAP = [
        [0.05, 2.4, "Ho licenziato il mio", "video editor.", C.red],
        [2.45, 3.85, "Lo pagavo", "2.000 € al mese.", C.red],
        [3.85, 5.0, "Cioè", "500 € a video.", C.red],
        [5.05, 6.3, "E per", "4 video", C.red],
        [6.3, 8.0, "ci metteva", "3 settimane.", C.red],
        [8.1, 9.6, "Adesso i video", "li faccio io,", C.white],
        [9.6, 10.55, "con", "Claude.", C.orange],
        [10.7, 12.9, "Video pronti in", "un giorno.", C.green],
        [13.0, 15.1, "Costa circa", "20 € al mese.", C.green],
        [15.2, 17.4, "Modifiche", "subito.", C.orange],
        [17.5, 19.4, "Risparmio", "1.980 € ogni mese.", C.green],
        [19.45, 20.6, "E questo", "video?", C.white],
        [20.6, 21.8, "L'ho fatto con", "Claude.", C.orange],
        [21.9, 23.6, "Se vuoi sapere", "come l'ho fatto,", C.white],
        [23.6, 25.5, "commenta e ti mando", "tutto il processo.", C.orange]
    ];
    function capLayer(str, size, font, col, y, a, b) {
        var l = comp.layers.addText(str);
        var sp = l.property("ADBE Text Properties").property("ADBE Text Document"); var d = sp.value;
        d.fontSize = size; try { d.font = font; } catch (e) { } d.applyFill = true; d.fillColor = col; d.applyStroke = false;
        d.justification = ParagraphJustification.CENTER_JUSTIFY; sp.setValue(d);
        times(l, a, b); P(l, "ADBE Position").setValue([540, y]);
        kf(P(l, "ADBE Opacity"), [[a, 0], [a + 0.3, 100], [b - 0.22, 100], [b, 0]], 70);
        kf(P(l, "ADBE Position"), [[a, [540, y + 26]], [a + 0.38, [540, y]], [b - 0.22, [540, y]], [b, [540, y - 14]]], 85);
        var bl = blurProp(l); if (bl) { kf(bl, [[a, 10], [a + 0.38, 0], [b - 0.22, 0], [b, 10]], 70); }
        P(l, "ADBE Position").expression = "value + [Math.sin(time*1.1)*6, Math.cos(time*0.9)*4]"; // parallasse leggera
        return l;
    }
    for (var c = 0; c < CAP.length; c++) {
        var cpp = CAP[c];
        capLayer(cpp[2], 56, F.body, C.white, 1400, cpp[0], cpp[1]);
        var big = capLayer(cpp[3], 96, F.heavy, cpp[4], 1500, Math.min(cpp[0] + 0.25, cpp[1] - 0.6), cpp[1]);
        if (cpp[4] !== C.white) { glow(big, 24, 0.9); }
    }

    /* ---------------- audio ---------------- */
    var af = new File(HERE.fsName + "/audio-editor-v3.wav");
    if (af.exists) { var ai2 = proj.importFile(new ImportOptions(af)); comp.layers.add(ai2); }

    /* ---------------- salva e metti in coda di render ---------------- */
    comp.openInViewer();
    try { proj.save(new File(HERE.fsName + "/editor-vs-claude.aep")); } catch (e) { }
    try {
        var outDir = new Folder(HERE.fsName + "/out"); if (!outDir.exists) { outDir.create(); }
        var rq = proj.renderQueue.items.add(comp);
        var om = rq.outputModule(1);
        var tpl = om.templates, chosen = null;
        for (var q = 0; q < tpl.length; q++) { if (tpl[q].indexOf("H.264") === 0) { chosen = tpl[q]; break; } }
        if (chosen) { om.applyTemplate(chosen); }
        om.file = new File(outDir.fsName + "/editor-vs-claude-AE.mp4");
    } catch (e) { }
    app.endUndoGroup();
})();
