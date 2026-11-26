// Static knowledge: sound library (asset ids filled at install), format rules, text styles, transitions.
export const SFX = [
  { key: 'whoosh', name: 'Whoosh pulito', use: 'Tagli e transizioni grandi', dur: 0.6, assetId: '760380d5f5d36dc687aca27670fa058d' },
  { key: 'hit', name: 'Colpo cinematico', use: 'Parola chiave, impatto', dur: 1.85, assetId: 'f0d082a542612de009fd78baf3593393' },
  { key: 'sub', name: 'Sub drop', use: 'Notizia shock, "cancellato"', dur: 1.44, assetId: 'b1920f5a1448923fb42082a66ce90f70' },
  { key: 'braam', name: 'Braam da trailer', use: 'Gancio, rivelazione', dur: 2.64, assetId: '0c2245998b684fa1571c7f9e69edbd63' },
  { key: 'riser', name: 'Riser', use: 'Tensione che sale prima della svolta', dur: 2.32, assetId: '5e56062fc2c16e56e79795e307fc0828' },
  { key: 'revswell', name: 'Swell al contrario', use: 'Risucchio nella pausa', dur: 1.65, assetId: '50f320526da7be9655cbc13d25fdc565' },
  { key: 'pop', name: 'Pop morbido', use: 'Elemento che appare', dur: 0.44, assetId: '43beaf77851fc61e730e70f5667aceea' },
  { key: 'click', name: 'Click', use: 'UI, digitazione, toggle', dur: 0.26, assetId: '86f6aaf77f930fbd23b5c6899a1e5b17' },
  { key: 'shimmer', name: 'Shimmer', use: 'Svolta positiva, luce', dur: 1.78, assetId: '9bb0b998a87e51b8c4413d3943ca42c3' },
  { key: 'flash', name: 'Flash brillante', use: 'Flash di luce sul taglio', dur: 2.48, assetId: '3f89dd5cf90fc2a70802d9cbc145175f' },
  { key: 'suck', name: 'Risucchio', use: 'Prima di un colpo', dur: 2.32, assetId: '6720e766ad69752568cca85e37c4eeba' },
  { key: 'sizzle', name: 'Sfrigolio', use: 'Cibo caldo', dur: 1.65, assetId: '169c919f6bd3ef7dfadcf3833439b064' },
  { key: 'crunch', name: 'Crunch', use: 'Croccante, morso', dur: 0.5, assetId: '4b5d5933434f74d5809a344d690fd975' },
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
