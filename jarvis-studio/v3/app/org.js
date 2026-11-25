// The studio: departments, their agents and the production stages a mission moves through.
export const DEPTS = [
  { key: 'dir', name: 'Direzione', color: '#E9C46A', tier: 0, desc: 'Decide il taglio creativo, approva lo script, tiene i tempi.' },
  { key: 'wri', name: 'Scrittura', color: '#EDE3CF', tier: 1, desc: 'Scrive gancio, corpo, twist e CTA. Controlla che ogni frase sia vera.' },
  { key: 'mot', name: 'Motion', color: '#A99BFF', tier: 1, desc: 'Progetta scene 3D e 2D, tipografia cinetica e transizioni.' },
  { key: 'snd', name: 'Suono', color: '#5FD4C6', tier: 1, desc: 'Sound design legato agli eventi, sempre sotto la voce.' },
  { key: 'edt', name: 'Montaggio', color: '#7DB6FF', tier: 1, desc: 'Monta la timeline sulla voce, a ritmo, senza secondi fermi.' },
  { key: 'qa', name: 'Qualità', color: '#8EE29A', tier: 2, desc: 'Blocca la consegna se qualcosa non va: tecnica e stile.' },
];
export const AGENTS = [
  { key: 'direttore', dept: 'dir', name: 'Direttore creativo', role: 'Legge il brief e fissa la direzione: formato, tono, tre ganci possibili, cosa NON fare.', stage: 'brief', kind: 'llm' },
  { key: 'producer', dept: 'dir', name: 'Producer', role: 'Trasforma la direzione in un piano: passaggi, materiali mancanti, chi fa cosa.', stage: 'brief', kind: 'llm' },
  { key: 'sceneggiatore', dept: 'wri', name: 'Sceneggiatore', role: 'Scrive lo script parlato con i tempi: gancio in 3 secondi, corpo con domanda aperta, twist, CTA.', stage: 'script', kind: 'llm', writesScript: true },
  { key: 'factcheck', dept: 'wri', name: 'Verifica fatti', role: 'Elenca ogni affermazione dello script che va verificata e quelle rischiose da togliere.', stage: 'script', kind: 'llm' },
  { key: 'motion3d', dept: 'mot', name: 'Motion designer 3D', role: 'Divide lo script in scene: cosa si vede, movimento di camera, oggetto 3D protagonista.', stage: 'produzione', kind: 'llm' },
  { key: 'tipografia', dept: 'mot', name: 'Tipografia cinetica', role: 'Decide le parole chiave a schermo, colori e animazioni dei testi, nella safe zone.', stage: 'produzione', kind: 'llm' },
  { key: 'transizioni', dept: 'mot', name: 'Transizioni', role: 'Sceglie come si passa da una scena all\'altra, una diversa per ogni taglio.', stage: 'produzione', kind: 'llm' },
  { key: 'sound', dept: 'snd', name: 'Sound designer', role: 'Un suono per ogni evento visibile, lungo quanto il movimento. Niente whoosh acuti, niente musica.', stage: 'produzione', kind: 'llm' },
  { key: 'mix', dept: 'snd', name: 'Tecnico del mix', role: 'Controlla i volumi degli effetti nella timeline: voce sempre sopra, effetti almeno 6 dB sotto.', stage: 'produzione', kind: 'check' },
  { key: 'montatore', dept: 'edt', name: 'Montatore', role: 'Monta la timeline nell\'editor, in diretta, agganciando testi e suoni alla voce.', stage: 'montaggio', kind: 'editor' },
  { key: 'qa_tech', dept: 'qa', name: 'Controllo tecnico', role: 'Controlla la timeline: buchi, testi fuori safe zone, durata, CTA, densità degli effetti.', stage: 'qa', kind: 'check' },
  { key: 'qa_style', dept: 'qa', name: 'Controllo stile', role: 'Confronta script e montaggio con le regole del formato e i riferimenti.', stage: 'qa', kind: 'llm' },
];
export const STAGES = [
  { key: 'brief', name: 'Brief', dept: 'dir', room: 'brief' },
  { key: 'script', name: 'Script', dept: 'wri', room: 'script' },
  { key: 'produzione', name: 'Produzione', dept: 'mot', room: 'script' },
  { key: 'montaggio', name: 'Montaggio', dept: 'edt', room: 'editor' },
  { key: 'qa', name: 'Controllo', dept: 'qa', room: 'editor' },
  { key: 'revisione', name: 'Revisione', dept: 'dir', room: 'review' },
  { key: 'approvato', name: 'Approvato', dept: 'dir', room: 'review' },
];
export const SOUND_RULES = [
  'Ogni suono imita l\'oggetto e dura quanto il movimento: numeri che contano = conteggio; flash = otturatore; pezzi che si incastrano = ingranaggio; salita verso un colpo = riser che finisce esattamente sul colpo; movimenti di camera = swoosh d\'aria BASSO.',
  'Vietati whoosh acuti e lunghi, razzi, "tunnel" (suonano come aerei) e raffiche di suoni da un decimo di secondo (sembrano interferenze).',
  'Un solo colpo grande per sezione, con i bassi. Niente musica, niente tappeti lunghi.',
  'Effetti sempre almeno 6 dB sotto la voce.',
];
export const deptOf = (k) => DEPTS.find(d => d.key === k);
export const agentOf = (k) => AGENTS.find(a => a.key === k);
export const stageIdx = (k) => Math.max(0, STAGES.findIndex(s => s.key === k));
// stage of a mission: the stored one, otherwise derived from what exists
export function stageOf(p) {
  if (!p) return 'brief';
  if (p.status === 'approvato') return 'approvato';
  if (p.status === 'revisione') return 'revisione';
  if (p.stage && STAGES.some(s => s.key === p.stage)) return p.stage;
  if (p.hasEdit) return 'montaggio';
  if (p.hasScript) return 'script';
  return 'brief';
}
