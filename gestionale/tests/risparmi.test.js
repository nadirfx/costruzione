'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('../js/risparmi.js');

test('conto: saldo = saldo iniziale + versamenti − prelievi, con data limite', () => {
  const mv = [
    { date: '2026-01-10', tipo: 'versamento', amountCents: 100000 },
    { date: '2026-03-01', tipo: 'prelievo', amountCents: 25000 },
    { date: '2026-10-05', tipo: 'versamento', amountCents: 5000 },
  ];
  assert.equal(R.savingsBalance(mv, 50000), 50000 + 100000 - 25000 + 5000);
  assert.equal(R.savingsBalance(mv, 0, '2026-02-28'), 100000);
});

test('conto: netto mensile e obiettivo', () => {
  const mv = [
    { date: '2026-10-01', tipo: 'versamento', amountCents: 80000 },
    { date: '2026-10-20', tipo: 'prelievo', amountCents: 30000 },
    { date: '2025-10-20', tipo: 'versamento', amountCents: 999 },
  ];
  const m = R.savingsByMonth(mv, ['2026-09', '2026-10']);
  assert.equal(m['2026-10'].netto, 50000);
  assert.equal(m['2026-09'].netto, 0);
  const g = R.goalProgress(250000, 1000000);
  assert.equal(g.pct, 25);
  assert.equal(g.mancano, 750000);
  assert.equal(g.raggiunto, false);
  assert.equal(R.goalProgress(1000000, 1000000).raggiunto, true);
  assert.equal(R.goalProgress(5, 0).pct, 0);
});

test('ETF: costo medio ponderato su più acquisti, commissioni incluse', () => {
  const ops = [
    { date: '2026-01-05', tipo: 'acquisto', quantita: 10, prezzoCents: 10000, commissioniCents: 200 },
    { date: '2026-02-05', tipo: 'acquisto', quantita: 10, prezzoCents: 12000, commissioniCents: 0 },
  ];
  const p = R.etfPosition(ops);
  assert.equal(p.quantita, 20);
  assert.equal(p.costoCents, 100200 + 120000);
  assert.equal(p.costoMedioCents, Math.round(220200 / 20));
  assert.equal(p.investitoTotaleCents, 220200);
});

test('ETF: vendita parziale riduce il costo proporzionalmente e registra l’utile realizzato', () => {
  const ops = [
    { date: '2026-01-05', tipo: 'acquisto', quantita: 10, prezzoCents: 10000, commissioniCents: 0 },
    { date: '2026-06-05', tipo: 'vendita', quantita: 4, prezzoCents: 13000, commissioniCents: 0 },
  ];
  const p = R.etfPosition(ops);
  assert.equal(p.quantita, 6);
  assert.equal(p.costoCents, 60000);           // 6 × 100 €
  assert.equal(p.realizzatoCents, 52000 - 40000); // ricavo 520 − costo 400 = 120 €
});

test('ETF: vendita totale azzera posizione e costo, quantità frazionarie esatte', () => {
  const ops = [
    { date: '2026-01-05', tipo: 'acquisto', quantita: 0.1, prezzoCents: 10000, commissioniCents: 0 },
    { date: '2026-01-06', tipo: 'acquisto', quantita: 0.2, prezzoCents: 10000, commissioniCents: 0 },
    { date: '2026-02-01', tipo: 'vendita', quantita: 0.3, prezzoCents: 11000, commissioniCents: 0 },
  ];
  const p = R.etfPosition(ops);
  assert.equal(p.quantita, 0);
  assert.equal(p.costoCents, 0);
  assert.equal(p.realizzatoCents, 3300 - 3000); // 0,3 × 110 € − 0,3 × 100 € = 3 €
});

test('portafoglio: valore a prezzo inserito, plus/minusvalenza e quote', () => {
  const etfs = [
    { id: 'a', nome: 'VWCE', prezzoAttualeCents: 13000 },
    { id: 'b', nome: 'SWDA', prezzoAttualeCents: 8000 },
  ];
  const inv = [
    { id: '1', etfId: 'a', date: '2026-01-01', tipo: 'acquisto', quantita: 10, prezzoCents: 10000, commissioniCents: 0 },
    { id: '2', etfId: 'b', date: '2026-01-01', tipo: 'acquisto', quantita: 10, prezzoCents: 10000, commissioniCents: 0 },
  ];
  const pf = R.portfolio(etfs, inv);
  assert.equal(pf.totali.valore, 130000 + 80000);
  assert.equal(pf.totali.costo, 200000);
  assert.equal(pf.totali.plus, 10000);
  assert.equal(pf.totali.plusPct, 5);
  assert.equal(pf.rows[0].quotaPct, 61.9);
});

test('portafoglio: ETF senza operazioni non genera valore né NaN', () => {
  const pf = R.portfolio([{ id: 'x', nome: 'Nuovo', prezzoAttualeCents: 5000 }], []);
  assert.equal(pf.totali.valore, 0);
  assert.equal(pf.rows[0].plusPct, 0);
  assert.ok(Number.isFinite(pf.totali.plusPct));
});

test('validazione: vendita oltre la quantità posseduta è bloccata', () => {
  const all = [{ id: '1', etfId: 'a', date: '2026-01-01', tipo: 'acquisto', quantita: 5, prezzoCents: 1000, commissioniCents: 0 }];
  const ok = { etfId: 'a', date: '2026-02-01', tipo: 'vendita', quantita: 5, prezzoCents: 1100, commissioniCents: 0 };
  assert.deepEqual(R.validateInvestment(ok, all), []);
  const troppo = { ...ok, quantita: 5.5 };
  assert.ok(R.validateInvestment(troppo, all).some((m) => m.includes('più di quanto possiedi')));
  // vendita prima dell'acquisto: nulla da vendere
  assert.ok(R.validateInvestment({ ...ok, date: '2025-12-01' }, all).length > 0);
});

test('validazione: conto ed ETF', () => {
  assert.ok(R.validateMovement({ date: '2026-10-01', tipo: 'versamento', amountCents: 0 }).length > 0);
  assert.deepEqual(R.validateMovement({ date: '2026-10-01', tipo: 'prelievo', amountCents: 100 }), []);
  assert.ok(R.validateEtf({ nome: '' }).length > 0);
  assert.ok(R.validateEtf({ nome: 'VWCE', isin: 'nonvalido' }).length > 0);
  assert.deepEqual(R.validateEtf({ nome: 'VWCE', isin: 'IE00BK5BQT80', prezzoAttualeCents: 11234 }), []);
});

test('serie costo in mano: cresce con gli acquisti e scende con le vendite', () => {
  const inv = [
    { id: '1', etfId: 'a', date: '2026-01-05', tipo: 'acquisto', quantita: 10, prezzoCents: 10000, commissioniCents: 0 },
    { id: '2', etfId: 'a', date: '2026-03-05', tipo: 'acquisto', quantita: 10, prezzoCents: 12000, commissioniCents: 0 },
    { id: '3', etfId: 'a', date: '2026-06-05', tipo: 'vendita', quantita: 10, prezzoCents: 13000, commissioniCents: 0 },
  ];
  const s = R.holdingsCostSeries(inv, ['a'], ['2026-01', '2026-02', '2026-03', '2026-06']);
  assert.deepEqual(s, [100000, 100000, 220000, 110000]);
});

test('contributi mensili: solo acquisti, commissioni incluse', () => {
  const inv = [
    { date: '2026-02-03', tipo: 'acquisto', quantita: 2, prezzoCents: 5000, commissioniCents: 100 },
    { date: '2026-02-20', tipo: 'vendita', quantita: 1, prezzoCents: 9000, commissioniCents: 0 },
  ];
  assert.equal(R.monthlyContributions(inv, ['2026-02'])['2026-02'], 10100);
});

test('simulazione: senza rendimento = versato; con rendimento cresce e resta coerente', () => {
  const zero = R.projectGrowth({ startCents: 100000, monthlyCents: 10000, annualRatePct: 0, years: 2 });
  assert.equal(zero[2].valore, 100000 + 10000 * 24);
  assert.equal(zero[2].interessi, 0);
  const g = R.projectGrowth({ startCents: 0, monthlyCents: 10000, annualRatePct: 6, years: 10 });
  assert.equal(g[0].valore, 0);
  assert.ok(g[10].valore > g[10].versato, 'con rendimento positivo gli interessi sono positivi');
  assert.equal(g[10].valore - g[10].versato, g[10].interessi);
  // 10 anni con 100 €/mese al 6%: circa 16.390 €
  assert.ok(Math.abs(g[10].valore / 100 - 16387) < 60, 'valore atteso ~16.390 €, ottenuto ' + g[10].valore / 100);
});
