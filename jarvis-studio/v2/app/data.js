// Static knowledge: sound library (asset ids filled at install), format rules, text styles, transitions.
export const SFX = [
  { key: 'whoosh', name: 'Whoosh pulito', use: 'Tagli e transizioni grandi', dur: 0.55, assetId: null },
  { key: 'hit', name: 'Colpo cinematico', use: 'Parola chiave, impatto', dur: 2.0, assetId: null },
  { key: 'sub', name: 'Sub drop', use: 'Notizia shock, "cancellato"', dur: 1.4, assetId: null },
  { key: 'braam', name: 'Braam da trailer', use: 'Gancio, rivelazione', dur: 2.6, assetId: null },
  { key: 'riser', name: 'Riser', use: 'Tensione che sale prima della svolta', dur: 2.0, assetId: null },
  { key: 'revswell', name: 'Swell al contrario', use: 'Risucchio nella pausa', dur: 1.6, assetId: null },
  { key: 'pop', name: 'Pop morbido', use: 'Elemento che appare', dur: 0.4, assetId: null },
  { key: 'click', name: 'Click', use: 'UI, digitazione, toggle', dur: 0.2, assetId: null },
  { key: 'shimmer', name: 'Shimmer', use: 'Svolta positiva, luce', dur: 2.5, assetId: null },
  { key: 'flash', name: 'Flash brillante', use: 'Flash di luce sul taglio', dur: 0.8, assetId: null },
  { key: 'suck', name: 'Risucchio', use: 'Prima di un colpo', dur: 2.0, assetId: null },
  { key: 'sizzle', name: 'Sfrigolio', use: 'Cibo caldo', dur: 1.6, assetId: null },
  { key: 'crunch', name: 'Crunch', use: 'Croccante, morso', dur: 0.45, assetId: null },
];
export const RULES = {
  A: { name: 'Luxury motion', rules: [
    'Un\'idea per inquadratura, tanto spazio vuoto, griglia rigorosa',
    'Massimo 2 font, palette del brand',
    'Testo cinetico elegante: sfocato → a fuoco, gradiente solo sulla parola chiave',
    'Transizioni di classe: finestre arrotondate, carrellate continue',
    'Prodotto sempre reale (asset del brand o clip generate), mai loghi inventati',
    'Inquadrature da 1.5–3 s, packshot finale con logo ≥ 1.5 s',
    'Versioni 9:16 + 16:9 + 1:1'] },
  B: { name: 'Faceless premium', rules: [
    'Gancio nel primo secondo',
    'Un oggetto protagonista, scritta gigante sfumata dietro, parola chiave evidenziata',
    'Ogni scena con un\'animazione diversa e legata alla frase',
    'Nessun secondo fermo; pause solo se piene di tensione',
    'Sound design da film, sempre ≥ 6 dB sotto la voce, niente musica',
    'Notizia finta: "NON È UNA NOTIZIA REALE" ≥ 1 s',
    'CTA con parola da commentare'] },
  C: { name: 'Creator', rules: [
    'Jump cut: via silenzi, respiri lunghi, errori',
    'Zoom a scatto sulle parole chiave (100% ↔ 115–125%)',
    'Sottotitoli parola per parola, parola chiave colorata',
    'B-roll o grafica ogni 3–5 s',
    'Whoosh solo sui tagli grandi, boom sugli impatti',
    'Voce pulita a −14 LUFS, effetti mai sopra la voce',
    'Open loop e CTA a metà video'] },
};
export const TEXT_STYLES = [
  { key: 'keyword', name: 'Parola chiave', desc: 'Riga piccola + parola grande evidenziata' },
  { key: 'apple', name: 'Apple', desc: 'Entra sfocata e va a fuoco, gradiente' },
  { key: 'caption', name: 'Sottotitolo', desc: 'Parola per parola in basso (formato C)' },
  { key: 'title', name: 'Titolo', desc: 'Grande, centrato, d\'impatto' },
  { key: 'label', name: 'Etichetta', desc: 'Pillola piccola (es. disclaimer)' },
];
export const TRANSITIONS = [
  { key: 'none', name: 'Taglio netto' }, { key: 'fade', name: 'Dissolvenza' }, { key: 'window', name: 'Finestra arrotondata' },
  { key: 'flash', name: 'Flash di luce' }, { key: 'whip', name: 'Whip pan' }, { key: 'zoom', name: 'Zoom-through' },
];
export const COLORS = { red: '#E5323F', lime: '#C8F25A', orange: '#D97757', white: '#FFFFFF', ink: '#141414', cyan: '#43E5FF', gold: '#E9C46A' };
export const ASPECTS = { '9:16': [1080, 1920], '16:9': [1920, 1080], '1:1': [1080, 1080] };
export const FORMAT_CHECK = {
  A: ['Titolo e obiettivo', 'Brand / prodotto', 'Durata 15–30 s', 'Materiali del prodotto caricati', 'CTA o packshot finale'],
  B: ['Titolo e obiettivo', 'Gancio del primo secondo', 'Durata', 'Voce caricata', 'CTA con parola da commentare'],
  C: ['Titolo e obiettivo', 'Facecam caricata', 'Durata', 'B-roll o grafiche', 'CTA'],
};
