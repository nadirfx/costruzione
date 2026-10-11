'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../js/core.js');

const inv = (over = {}) => ({
  id: 'i1', number: '2026/001', clientId: 'c1', issueDate: '2026-10-05', dueDate: '2026-11-04',
  stato: 'emessa', ivaRate: 22, righe: [{ descrizione: 'Spot', quantita: 1, prezzoCents: 100000 }],
  ...over,
});

test('parseEuroToCents: formati italiani e inglesi', () => {
  assert.equal(C.parseEuroToCents('1234,56'), 123456);
  assert.equal(C.parseEuroToCents('1.234,56'), 123456);
  assert.equal(C.parseEuroToCents('1234.56'), 123456);
  assert.equal(C.parseEuroToCents('1,234.56'), 123456);
  assert.equal(C.parseEuroToCents('1.234'), 123400, 'punto + 3 cifre = migliaia');
  assert.equal(C.parseEuroToCents('12.5'), 1250);
  assert.equal(C.parseEuroToCents('12'), 1200);
  assert.equal(C.parseEuroToCents('12,5'), 1250);
  assert.equal(C.parseEuroToCents('€ 0,10'), 10);
  assert.equal(C.parseEuroToCents('-3,00'), -300);
  assert.equal(C.parseEuroToCents('0,1005'), 10, 'oltre 2 decimali arrotondati');
});

test('parseEuroToCents: input non validi restituiscono null', () => {
  for (const bad of ['', '   ', 'abc', '12,34,56', '1..2', null, undefined, NaN]) {
    assert.equal(C.parseEuroToCents(bad), null, `atteso null per ${String(bad)}`);
  }
});

test('nessun errore di virgola mobile nelle somme', () => {
  // 0.1 + 0.2 in float è 0.30000000000000004: qui deve essere esatto
  const righe = [
    { descrizione: 'a', quantita: 1, prezzoCents: C.parseEuroToCents('0,10') },
    { descrizione: 'b', quantita: 1, prezzoCents: C.parseEuroToCents('0,20') },
  ];
  assert.equal(C.invoiceTotals({ righe, ivaRate: 0 }).imponibile, 30);
});

test('formatEuro in italiano', () => {
  assert.equal(C.formatEuro(12345678).replace(/ /g, ' '), '123.456,78 €');
  assert.equal(C.centsToPlain(5), '0,05');
});

test('invoiceTotals: IVA arrotondata al centesimo', () => {
  const t = C.invoiceTotals(inv({ righe: [{ descrizione: 'x', quantita: 1, prezzoCents: 1001 }] }));
  // imponibile 1001, IVA 22% = 220.22 -> 220
  assert.deepEqual(t, { imponibile: 1001, iva: 220, totale: 1221 });
});

test('invoiceTotals: quantità decimale e più righe', () => {
  const t = C.invoiceTotals(inv({
    ivaRate: 22,
    righe: [
      { descrizione: 'ore', quantita: 2.5, prezzoCents: 4000 },
      { descrizione: 'extra', quantita: 1, prezzoCents: 1500 },
    ],
  }));
  assert.equal(t.imponibile, 11500);
  assert.equal(t.iva, 2530);
  assert.equal(t.totale, 14030);
});

test('invoiceTotals: aliquota 0 (es. regime forfettario)', () => {
  const t = C.invoiceTotals(inv({ ivaRate: 0 }));
  assert.deepEqual(t, { imponibile: 100000, iva: 0, totale: 100000 });
});

test('periodi: mese, trimestre, ultimi N, anno solare gen-dic', () => {
  const m = C.resolvePeriod({ type: 'mese', year: 2026, month: 10 });
  assert.deepEqual(m.months, ['2026-10']);
  assert.equal(m.from, '2026-10-01');
  assert.equal(m.to, '2026-10-31');

  const q4 = C.resolvePeriod({ type: 'trimestre', year: 2026, q: 4 });
  assert.deepEqual(q4.months, ['2026-10', '2026-11', '2026-12']);
  assert.equal(q4.to, '2026-12-31');

  const u3 = C.resolvePeriod({ type: 'ultimi', year: 2026, month: 10, n: 3 });
  assert.deepEqual(u3.months, ['2026-08', '2026-09', '2026-10']);
  assert.deepEqual(u3.previousMonths, ['2026-05', '2026-06', '2026-07']);

  const u6 = C.resolvePeriod({ type: 'ultimi', year: 2026, month: 2, n: 6 });
  assert.deepEqual(u6.months, ['2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02']);

  const anno = C.resolvePeriod({ type: 'anno', year: 2026 });
  assert.equal(anno.months.length, 12);
  assert.equal(anno.months[0], '2026-01');
  assert.equal(anno.months[11], '2026-12');
  assert.equal(anno.from, '2026-01-01');
  assert.equal(anno.to, '2026-12-31');
});

test('date: febbraio bisestile e non bisestile', () => {
  assert.equal(C.resolvePeriod({ type: 'mese', year: 2024, month: 2 }).to, '2024-02-29');
  assert.equal(C.resolvePeriod({ type: 'mese', year: 2026, month: 2 }).to, '2026-02-28');
  assert.equal(C.isValidISODate('2026-02-29'), false);
  assert.equal(C.isValidISODate('2024-02-29'), true);
  assert.equal(C.isValidISODate('2026-13-01'), false);
  assert.equal(C.isValidISODate('2026-1-01'), false);
});

test('date: aritmetica senza sfasamenti (cambio ora legale)', () => {
  assert.equal(C.addDays('2026-03-28', 1), '2026-03-29');
  assert.equal(C.addDays('2026-10-31', 1), '2026-11-01');
  assert.equal(C.addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(C.daysBetween('2026-03-28', '2026-03-29'), 1);
  assert.equal(C.daysBetween('2026-10-01', '2026-10-11'), 10);
  assert.equal(C.daysBetween('2026-10-11', '2026-10-01'), -10);
});

test('todayISO usa il calendario locale', () => {
  assert.equal(C.todayISO(new Date(2026, 9, 11, 23, 59)), '2026-10-11');
  assert.equal(C.todayISO(new Date(2026, 0, 1, 0, 0)), '2026-01-01');
});

test('monthLabel e shiftMonth', () => {
  assert.equal(C.monthLabel('2026-10'), 'Ottobre 2026');
  assert.equal(C.shiftMonth('2026-01', -1), '2025-12');
  assert.equal(C.shiftMonth('2026-12', 1), '2027-01');
});

test('stato fattura: derivato dagli incassi e dalla scadenza', () => {
  const today = '2026-10-11';
  const f = inv();
  const payments = [];
  assert.equal(C.invoiceState(f, payments, today).code, 'emessa');
  assert.equal(C.invoiceState(inv({ dueDate: '2026-10-10' }), payments, today).code, 'scaduta');
  assert.equal(C.invoiceState(inv({ stato: 'bozza' }), payments, today).code, 'bozza');
  assert.equal(C.invoiceState(inv({ stato: 'annullata' }), payments, today).code, 'annullata');
  const parz = [{ id: 'p', invoiceId: 'i1', amountCents: 50000 }];
  assert.equal(C.invoiceState(f, parz, today).code, 'parziale');
  const pagata = [{ id: 'p', invoiceId: 'i1', amountCents: 122000 }];
  assert.equal(C.invoiceState(f, pagata, today).code, 'pagata');
  assert.equal(C.invoiceState(f, pagata, today).residuo, 0);
});

test('bozze e annullate non entrano in fatturato né saldi', () => {
  const data = {
    clients: [{ id: 'c1' }],
    invoices: [inv({ stato: 'bozza' }), inv({ id: 'i2', number: '2026/002', stato: 'annullata' })],
    payments: [],
    expenses: [],
  };
  const a = C.aggregate(data, ['2026-10']);
  assert.equal(a.totals.fatturato, 0);
  assert.equal(C.clientBalance('c1', data).saldo, 0);
});

test('aggregate: fatturato per mese, incassi per data di pagamento, spese per data', () => {
  const data = {
    clients: [{ id: 'c1' }],
    invoices: [
      inv({ id: 'a', issueDate: '2026-10-05' }),
      inv({ id: 'b', number: '2026/002', issueDate: '2026-09-30' }),
      inv({ id: 'c', number: '2026/003', issueDate: '2025-12-31' }),
    ],
    payments: [
      { id: 'p1', clientId: 'c1', invoiceId: 'a', date: '2026-11-01', amountCents: 50000 },
      { id: 'p2', clientId: 'c1', invoiceId: null, date: '2026-10-31', amountCents: 10000 },
    ],
    expenses: [
      { id: 'e1', date: '2026-10-02', amountCents: 3000 },
      { id: 'e2', date: '2026-12-31', amountCents: 9999 },
    ],
  };
  const oct = C.aggregate(data, ['2026-10']);
  assert.equal(oct.totals.fatturato, 100000, 'solo la fattura di ottobre (imponibile)');
  assert.equal(oct.totals.iva, 22000);
  assert.equal(oct.totals.incassato, 10000, 'pagamento del 31 ottobre, non quello del 1 novembre');
  assert.equal(oct.totals.spese, 3000);
  assert.equal(oct.totals.utileCompetenza, 97000);
  assert.equal(oct.totals.utileCassa, 7000);

  const year = C.aggregate(data, C.monthsOfYear(2026));
  assert.equal(year.totals.fatturato, 100000 + 100000, 'ottobre + settembre, la fattura 2025 esclusa');
  assert.equal(year.totals.spese, 3000 + 9999);
  assert.equal(year.totals.incassato, 60000);
});

test('clientBalance e receivablesSummary: saldo netto, acconti come crediti', () => {
  const data = {
    clients: [{ id: 'c1' }, { id: 'c2' }],
    invoices: [inv({ id: 'a', clientId: 'c1' }), inv({ id: 'b', clientId: 'c2', number: '2026/002' })],
    payments: [
      { id: 'p1', clientId: 'c1', amountCents: 30000 },
      { id: 'p2', clientId: 'c2', amountCents: 200000 },
    ],
    expenses: [],
  };
  assert.equal(C.clientBalance('c1', data).saldo, 122000 - 30000);
  assert.equal(C.clientBalance('c2', data).saldo, -(200000 - 122000));
  const r = C.receivablesSummary(data);
  assert.equal(r.daIncassare, 92000);
  assert.equal(r.crediti, 78000);
});

test('numerazione fatture: progressiva per anno, le annullate non liberano numeri', () => {
  assert.equal(C.nextInvoiceNumber(2026, []), '2026/001');
  const list = [inv({ number: '2026/001' }), inv({ id: 'x', number: '2026/009', stato: 'annullata' }), inv({ id: 'y', number: '2025/050' })];
  assert.equal(C.nextInvoiceNumber(2026, list), '2026/010');
  assert.equal(C.nextInvoiceNumber(2027, list), '2027/001');
});

test('validateInvoice: unicità numero, scadenza, pagamenti già incassati', () => {
  const ctx = {
    clients: [{ id: 'c1' }],
    invoices: [inv({ id: 'a', number: '2026/001' })],
    payments: [{ id: 'p', invoiceId: 'a', amountCents: 100000 }],
  };
  const nuova = inv({ id: 'b', number: '2026/001' });
  assert.ok(C.validateInvoice(nuova, ctx).some((m) => m.includes('già usato')));
  assert.ok(C.validateInvoice(inv({ dueDate: '2026-10-01' }), { clients: [{ id: 'c1' }] }).some((m) => m.includes('scadenza')));
  assert.deepEqual(C.validateInvoice(inv(), { clients: [{ id: 'c1' }] }), []);
  // abbassare il totale sotto l'incassato è bloccato
  const abbassata = inv({ id: 'a', righe: [{ descrizione: 'x', quantita: 1, prezzoCents: 50000 }] });
  assert.ok(C.validateInvoice(abbassata, ctx).some((m) => m.includes('incassi')));
  assert.ok(C.validateInvoice(inv({ righe: [] }), { clients: [{ id: 'c1' }] }).some((m) => m.includes('almeno una riga')));
});

test('validatePayment: non supera il residuo, stesso cliente, solo fatture emesse', () => {
  const ctx = {
    clients: [{ id: 'c1' }, { id: 'c2' }],
    invoices: [inv({ id: 'a' }), inv({ id: 'b', number: '2026/002', stato: 'bozza' })],
    payments: [{ id: 'p0', invoiceId: 'a', amountCents: 100000 }],
  };
  const base = { clientId: 'c1', date: '2026-10-10', id: 'pn' };
  assert.deepEqual(C.validatePayment({ ...base, amountCents: 22000, invoiceId: 'a' }, ctx), []);
  assert.ok(C.validatePayment({ ...base, amountCents: 22001, invoiceId: 'a' }, ctx).some((m) => m.includes('residuo')));
  assert.ok(C.validatePayment({ ...base, amountCents: 100, invoiceId: 'b' }, ctx).some((m) => m.includes('solo su fatture emesse')));
  assert.ok(C.validatePayment({ ...base, clientId: 'c2', amountCents: 100, invoiceId: 'a' }, ctx).some((m) => m.includes('altro cliente')));
  assert.ok(C.validatePayment({ ...base, amountCents: 0 }, ctx).length > 0);
  // modifica di un pagamento: il suo importo precedente non conta nel residuo
  assert.deepEqual(C.validatePayment({ ...base, id: 'p0', amountCents: 122000, invoiceId: 'a' }, ctx), []);
});

test('partita IVA: codice di controllo', () => {
  assert.equal(C.isValidPartitaIva('12345678903'), true);
  assert.equal(C.isValidPartitaIva('12345678904'), false);
  assert.equal(C.isValidPartitaIva('1234567890'), false);
  assert.equal(C.isValidPartitaIva('1234567890a'), false);
});

test('codice fiscale e email', () => {
  assert.equal(C.isValidCodiceFiscale('RSSMRA80A01H501U'), true);
  assert.equal(C.isValidCodiceFiscale('rssmra80a01h501u'), true, 'case-insensitive');
  assert.equal(C.isValidCodiceFiscale('RSSMRA80A01H501'), false);
  assert.equal(C.isValidEmail('a@b.it'), true);
  assert.equal(C.isValidEmail('a@b'), false);
});

test('validateClient: privati e aziende', () => {
  assert.ok(C.validateClient({ tipo: 'privato', nome: '', cognome: 'Rossi' }).length > 0);
  assert.deepEqual(C.validateClient({ tipo: 'privato', nome: 'Mario', cognome: 'Rossi' }), []);
  assert.ok(C.validateClient({ tipo: 'azienda', ragioneSociale: 'Acme' }).some((m) => m.includes('partita IVA')));
  assert.ok(C.validateClient({ tipo: 'azienda', ragioneSociale: 'Acme', partitaIva: '12345678904' }).some((m) => m.includes('Partita IVA non valida')));
  assert.deepEqual(C.validateClient({ tipo: 'azienda', ragioneSociale: 'Acme', partitaIva: '12345678903' }), []);
});

test('validateExpense e validateFile', () => {
  assert.deepEqual(C.validateExpense({ date: '2026-10-01', descrizione: 'Abb.', amountCents: 2200, categoria: 'Altro' }), []);
  assert.ok(C.validateExpense({ date: '2026-10-01', descrizione: 'Abb.', amountCents: 2200, categoria: 'Boh' }).length > 0);
  assert.ok(C.validateFile(null).length > 0);
  assert.ok(C.validateFile({ size: C.MAX_FILE_BYTES + 1 }).length > 0);
  assert.deepEqual(C.validateFile({ size: 10 }), []);
});

test('topClients: ordinamento e finestra temporale', () => {
  const data = {
    clients: [{ id: 'c1' }, { id: 'c2' }],
    invoices: [
      inv({ id: 'a', clientId: 'c1', issueDate: '2026-10-01', righe: [{ descrizione: 'x', quantita: 1, prezzoCents: 5000 }] }),
      inv({ id: 'b', clientId: 'c2', issueDate: '2026-10-02', number: '2026/002', righe: [{ descrizione: 'x', quantita: 1, prezzoCents: 9000 }] }),
      inv({ id: 'c', clientId: 'c1', issueDate: '2025-10-02', number: '2025/001', righe: [{ descrizione: 'x', quantita: 1, prezzoCents: 99999 }] }),
    ],
    payments: [],
    expenses: [],
  };
  const top = C.topClients(data, '2026-10-01', '2026-10-31');
  assert.deepEqual(top.map((t) => t.clientId), ['c2', 'c1']);
  assert.equal(top[0].fatturato, 9000);
});

test('overdueInvoices: solo scadute non pagate, più vecchie prima', () => {
  const data = {
    clients: [{ id: 'c1' }],
    invoices: [
      inv({ id: 'a', dueDate: '2026-09-30' }),
      inv({ id: 'b', number: '2026/002', dueDate: '2026-08-01' }),
      inv({ id: 'c', number: '2026/003', dueDate: '2026-08-01', stato: 'bozza' }),
    ],
    payments: [],
    expenses: [],
  };
  const od = C.overdueInvoices(data, '2026-10-11');
  assert.deepEqual(od.map((x) => x.inv.id), ['b', 'a']);
});

test('toCsv: separatore ; e escape di virgolette/punto e virgola', () => {
  const csv = C.toCsv(
    [{ label: 'Nome', get: (r) => r.n }, { label: 'Importo', get: (r) => C.centsToPlain(r.v) }],
    [{ n: 'Acme; "srl"', v: 1234 }]
  );
  assert.equal(csv, 'Nome;Importo\r\n"Acme; ""srl""";12,34');
});

test('daysSince: backup mai fatto o datato', () => {
  assert.equal(C.daysSince(null, '2026-10-11'), null);
  assert.equal(C.daysSince('2026-10-01', '2026-10-11'), 10);
});
