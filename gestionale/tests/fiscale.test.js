'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../js/core.js');
const F = require('../js/fiscale.js');

test('imposta agevolata 5% nei primi 5 anni, poi 15%', () => {
  const cfg = { annoInizio: 2026 };
  assert.equal(F.aliquotaImpostaPerAnno(2026, cfg), 5);
  assert.equal(F.aliquotaImpostaPerAnno(2030, cfg), 5);
  assert.equal(F.aliquotaImpostaPerAnno(2031, cfg), 15);
  assert.equal(F.aliquotaImpostaPerAnno(2025, cfg), 15, 'prima dell’inizio: ordinaria');
});

test('stima: ricavi 30.000 €, coefficiente 78%, INPS 22%, imposta 5%', () => {
  const t = F.taxEstimate({ anno: 2026, ricaviCents: 3000000, cfg: { annoInizio: 2026, coefficiente: 78, aliquotaInps: 22 } });
  assert.equal(t.redditoLordo, 2340000); // 23.400 €
  assert.equal(t.contributi, 514800);    // 5.148 €
  assert.equal(t.imponibile, 1825200);   // 18.252 €
  assert.equal(t.imposta, 91260);        // 912,60 €
  assert.equal(t.totaleDaPagare, 514800 + 91260);
  assert.equal(t.nettoStimato, 3000000 - 606060);
  assert.equal(t.inStartup, true);
});

test('stima: ricavi zero non produce NaN né valori negativi', () => {
  const t = F.taxEstimate({ anno: 2026, ricaviCents: 0, cfg: { annoInizio: 2026 } });
  assert.equal(t.totaleDaPagare, 0);
  assert.equal(t.effettivo, 0);
  assert.equal(t.percentualeSoglia, 0);
  assert.ok(Number.isFinite(t.nettoStimato));
});

test('soglia 85.000 €: segnalazione e percentuale limitata a 100', () => {
  const sotto = F.taxEstimate({ anno: 2026, ricaviCents: 8000000, cfg: { annoInizio: 2026 } });
  assert.equal(sotto.sogliaRaggiunta, false);
  const sopra = F.taxEstimate({ anno: 2026, ricaviCents: 9000000, cfg: { annoInizio: 2026 } });
  assert.equal(sopra.sogliaRaggiunta, true);
  assert.equal(sopra.percentualeSoglia, 100);
});

test('ricavi fiscali = incassi dell’anno, non fatturato (principio di cassa)', () => {
  const data = {
    payments: [
      { date: '2026-03-01', amountCents: 100000 },
      { date: '2026-12-31', amountCents: 50000 },
      { date: '2027-01-01', amountCents: 99999 },
    ],
  };
  assert.equal(F.ricaviIncassati(data, 2026), 150000);
});

test('proiezione annua lineare', () => {
  assert.equal(F.projectYear(600000, 6), 1200000);
  assert.equal(F.projectYear(600000, 0), 0);
});

test('settimana: lunedì-domenica, anche per domenica e lunedì', () => {
  assert.deepEqual(F.weekRange('2026-10-11'), { from: '2026-10-05', to: '2026-10-11' }); // domenica
  assert.deepEqual(F.weekRange('2026-10-05'), { from: '2026-10-05', to: '2026-10-11' }); // lunedì
  assert.deepEqual(F.weekRange('2026-10-04'), { from: '2026-09-28', to: '2026-10-04' });
});

test('report settimanale: conta solo i dati nella settimana', () => {
  const data = {
    clients: [
      { id: 'c1', createdAt: new Date(2026, 9, 7, 10).toISOString() },
      { id: 'c2', createdAt: new Date(2026, 8, 30, 10).toISOString() },
    ],
    invoices: [
      { id: 'i1', stato: 'emessa', issueDate: '2026-10-07', ivaRate: 22, righe: [{ quantita: 1, prezzoCents: 100000 }] },
      { id: 'i2', stato: 'bozza', issueDate: '2026-10-08', ivaRate: 22, righe: [{ quantita: 1, prezzoCents: 999 }] },
    ],
    payments: [{ date: '2026-10-09', amountCents: 40000 }, { date: '2026-10-12', amountCents: 1 }],
    expenses: [{ date: '2026-10-06', amountCents: 5000 }],
    projects: [
      { id: 'p1', stato: 'consegnato', dataInizio: '2026-09-20', dataConsegna: '2026-10-08' },
      { id: 'p2', stato: 'in_corso', dataInizio: '2026-10-01', dataConsegna: '' },
    ],
    activities: [{ date: '2026-10-10' }],
    tasks: [
      { id: 't1', stato: 'fatto', completedAt: new Date(2026, 9, 9, 12).toISOString(), titolo: 'x' },
      { id: 't2', stato: 'aperto', scadenza: '2026-10-03', titolo: 'y' },
    ],
  };
  const r = F.weekReport(data, '2026-10-11', '2026-10-11');
  assert.equal(r.fatturato, 100000);
  assert.equal(r.fattureEmesse, 1);
  assert.equal(r.incassato, 40000);
  assert.equal(r.spese, 5000);
  assert.equal(r.utile, 35000);
  assert.equal(r.nuoviClienti.length, 1);
  assert.equal(r.lavoriChiusi.length, 1);
  assert.equal(r.lavoriChiusi[0].durataGiorni, 18);
  assert.equal(r.lavoriAperti.length, 1);
  assert.equal(r.attivita.length, 1);
  assert.equal(r.tasksFatti.length, 1);
  assert.equal(r.tasksScaduti.length, 1);
});

test('andamento annuo: lavori chiusi e nuovi clienti per mese', () => {
  const data = {
    clients: [{ id: 'c1', createdAt: new Date(2026, 4, 3, 12).toISOString() }],
    invoices: [], payments: [], expenses: [], activities: [],
    projects: [{ id: 'p', stato: 'chiuso', dataInizio: '2026-04-01', dataConsegna: '2026-05-20' }],
  };
  const t = F.yearTrend(data, 2026);
  assert.equal(t.length, 12);
  assert.equal(t[4].nuoviClienti, 1);
  assert.equal(t[4].lavoriChiusi, 1);
  assert.equal(t[3].lavoriChiusi, 0);
});

test('task: bucket e validazione', () => {
  assert.equal(F.taskBucket({ stato: 'fatto' }, '2026-10-11'), 'fatto');
  assert.equal(F.taskBucket({ stato: 'aperto' }, '2026-10-11'), 'senza');
  assert.equal(F.taskBucket({ stato: 'aperto', scadenza: '2026-10-10' }, '2026-10-11'), 'scaduto');
  assert.equal(F.taskBucket({ stato: 'aperto', scadenza: '2026-10-11' }, '2026-10-11'), 'oggi');
  assert.equal(F.taskBucket({ stato: 'aperto', scadenza: '2026-10-12' }, '2026-10-11'), 'prossimo');
  assert.ok(F.validateTask({ titolo: '', priorita: 'alta' }).length > 0);
  assert.deepEqual(F.validateTask({ titolo: 'Fattura', priorita: 'alta', scadenza: '2026-10-12' }), []);
});
