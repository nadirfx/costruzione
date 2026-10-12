/*
 * Risparmi (conto personale) e investimenti ETF: logica pura, testabile con node.
 *
 * Regole:
 *  - Tutti gli importi in centesimi interi; le quantità di ETF possono essere frazionarie (fino a 6 decimali).
 *  - Costo medio ponderato: un acquisto aumenta il costo, una vendita toglie costo medio × quantità venduta.
 *  - Il valore di mercato usa il prezzo che inserisci tu: non ci sono quotazioni online.
 */
(function (root, factory) {
  const C = typeof module === 'object' && module.exports ? require('./core.js') : root.Core;
  const api = factory(C);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Risparmi = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Core) {
  'use strict';

  const TIPI_MOVIMENTO = { versamento: 'Versamento', prelievo: 'Prelievo' };
  const TIPI_OPERAZIONE = { acquisto: 'Acquisto', vendita: 'Vendita' };
  const round6 = (x) => Math.round(x * 1e6) / 1e6;

  /* ------------------------------ Conto personale ------------------------------ */
  // movements: [{ date, tipo: 'versamento'|'prelievo', amountCents }]
  function savingsBalance(movements, saldoIniziale = 0, upToIso = null) {
    return movements.reduce((s, m) => {
      if (upToIso && m.date > upToIso) return s;
      return s + (m.tipo === 'prelievo' ? -m.amountCents : m.amountCents);
    }, Number(saldoIniziale) || 0);
  }

  // Flusso netto (versamenti − prelievi) per mese, per una lista di mesi YYYY-MM
  function savingsByMonth(movements, months) {
    const out = {};
    for (const m of months) out[m] = { versamenti: 0, prelievi: 0, netto: 0 };
    for (const mv of movements) {
      const key = Core.monthKey(mv.date);
      if (!out[key]) continue;
      if (mv.tipo === 'prelievo') out[key].prelievi += mv.amountCents;
      else out[key].versamenti += mv.amountCents;
    }
    for (const m of months) out[m].netto = out[m].versamenti - out[m].prelievi;
    return out;
  }

  function goalProgress(balanceCents, targetCents) {
    if (!targetCents || targetCents <= 0) return { pct: 0, mancano: 0, raggiunto: false };
    const pct = Math.max(0, Math.min(100, Math.round((balanceCents / targetCents) * 1000) / 10));
    const mancano = Math.max(0, targetCents - balanceCents);
    return { pct, mancano, raggiunto: balanceCents >= targetCents };
  }

  /* ------------------------------ ETF ------------------------------ */
  // ops: [{ date, tipo, quantita, prezzoCents, commissioniCents }] di UN ETF
  // Restituisce quantità, costo residuo, costo medio, utile realizzato dalle vendite.
  function etfPosition(ops) {
    const sorted = [...ops].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    let quantita = 0;
    let costo = 0; // centesimi
    let realizzato = 0;
    let investitoTotale = 0; // somma di tutti gli acquisti (costo lordo, non ridotto dalle vendite)
    for (const o of sorted) {
      const q = Number(o.quantita) || 0;
      const comm = Number(o.commissioniCents) || 0;
      if (o.tipo === 'acquisto') {
        const spesa = Math.round(q * o.prezzoCents) + comm;
        quantita = round6(quantita + q);
        costo += spesa;
        investitoTotale += spesa;
      } else {
        const costoMedio = quantita > 0 ? costo / quantita : 0;
        const ricavo = Math.round(q * o.prezzoCents) - comm;
        const costoVenduto = Math.round(costoMedio * q);
        realizzato += ricavo - costoVenduto;
        costo -= costoVenduto;
        quantita = round6(quantita - q);
        if (quantita <= 0) {
          quantita = 0;
          costo = 0;
        }
      }
    }
    return {
      quantita,
      costoCents: Math.round(costo),
      costoMedioCents: quantita > 0 ? Math.round(costo / quantita) : 0,
      realizzatoCents: Math.round(realizzato),
      investitoTotaleCents: Math.round(investitoTotale),
    };
  }

  // etfs: [{ id, nome, prezzoAttualeCents }], investments: [{ etfId, date, tipo, quantita, prezzoCents, commissioniCents }]
  function portfolio(etfs, investments) {
    const rows = etfs.map((e) => {
      const ops = investments.filter((o) => o.etfId === e.id);
      const pos = etfPosition(ops);
      const prezzo = Number(e.prezzoAttualeCents) || 0;
      const valoreCents = Math.round(pos.quantita * prezzo);
      const plCents = pos.quantita > 0 ? valoreCents - pos.costoCents : 0;
      return {
        etf: e,
        ...pos,
        prezzoCents: prezzo,
        valoreCents,
        plusCents: plCents,
        plusPct: pos.costoCents > 0 && pos.quantita > 0 ? Math.round((plCents / pos.costoCents) * 1000) / 10 : 0,
        operazioni: ops.length,
      };
    });
    const totali = rows.reduce(
      (t, r) => ({
        valore: t.valore + r.valoreCents,
        costo: t.costo + (r.quantita > 0 ? r.costoCents : 0),
        realizzato: t.realizzato + r.realizzatoCents,
        investitoTotale: t.investitoTotale + r.investitoTotaleCents,
      }),
      { valore: 0, costo: 0, realizzato: 0, investitoTotale: 0 }
    );
    totali.plus = totali.valore - totali.costo;
    totali.plusPct = totali.costo > 0 ? Math.round((totali.plus / totali.costo) * 1000) / 10 : 0;
    // quota di ciascun ETF sul valore totale
    rows.forEach((r) => {
      r.quotaPct = totali.valore > 0 ? Math.round((r.valoreCents / totali.valore) * 1000) / 10 : 0;
    });
    return { rows, totali };
  }

  /* ------------------------------ Validazione ------------------------------ */
  function validateMovement(m) {
    const err = [];
    if (!Core.isValidISODate(m.date)) err.push('Data non valida.');
    if (!Object.prototype.hasOwnProperty.call(TIPI_MOVIMENTO, m.tipo)) err.push('Tipo movimento non valido.');
    if (!Number.isInteger(m.amountCents) || m.amountCents <= 0) err.push('Importo deve essere maggiore di zero.');
    return err;
  }

  function validateEtf(e) {
    const err = [];
    if (!e.nome || !String(e.nome).trim()) err.push('Nome dell’ETF obbligatorio (es. VWCE).');
    if (e.isin && !/^[A-Z]{2}[A-Z0-9]{9}\d$/.test(String(e.isin).toUpperCase())) err.push('ISIN non valido (12 caratteri, es. IE00BK5BQT80).');
    if (e.prezzoAttualeCents !== undefined && e.prezzoAttualeCents !== null && (!Number.isInteger(e.prezzoAttualeCents) || e.prezzoAttualeCents < 0)) err.push('Prezzo attuale non valido.');
    return err;
  }

  // Controlla anche che la vendita non superi la quantità posseduta a quella data
  function validateInvestment(op, all = [], excludeId = null) {
    const err = [];
    if (!Core.isValidISODate(op.date)) err.push('Data non valida.');
    if (!Object.prototype.hasOwnProperty.call(TIPI_OPERAZIONE, op.tipo)) err.push('Tipo operazione non valido.');
    if (!(Number(op.quantita) > 0) || !Number.isFinite(Number(op.quantita))) err.push('Quantità deve essere maggiore di zero.');
    if (!Number.isInteger(op.prezzoCents) || op.prezzoCents <= 0) err.push('Prezzo unitario deve essere maggiore di zero.');
    if (!Number.isInteger(op.commissioniCents || 0) || (op.commissioniCents || 0) < 0) err.push('Commissioni non valide.');
    if (op.tipo === 'vendita' && op.etfId && Core.isValidISODate(op.date)) {
      const prima = all.filter((o) => o.etfId === op.etfId && o.id !== excludeId && o.date <= op.date);
      const posseduta = etfPosition(prima).quantita;
      if (Number(op.quantita) > posseduta + 1e-9) err.push(`Non puoi vendere più di quanto possiedi a quella data (${posseduta}).`);
    }
    return err;
  }

  /* ------------------------------ Portafoglio nel tempo ------------------------------ */
  // Costo delle quote in mano alla fine di ogni mese (somma dei costi residui di tutti gli ETF)
  function holdingsCostSeries(investments, etfIds, months) {
    return months.map((m) => {
      const end = Core.lastDayOf(m);
      let costo = 0;
      for (const id of etfIds) {
        const ops = investments.filter((o) => o.etfId === id && o.date <= end);
        costo += etfPosition(ops).costoCents;
      }
      return costo;
    });
  }

  // Quanto hai investito (acquisti netti di commissioni) per mese
  function monthlyContributions(investments, months) {
    const out = {};
    for (const m of months) out[m] = 0;
    for (const o of investments) {
      const k = Core.monthKey(o.date);
      if (out[k] === undefined || o.tipo !== 'acquisto') continue;
      out[k] += Math.round(Number(o.quantita) * o.prezzoCents) + (o.commissioniCents || 0);
    }
    return out;
  }

  // Simulazione a interesse composto mensile. NON è una previsione: il rendimento lo scegli tu.
  // Ritorna un punto per anno: { anno, valore, versato, interessi }
  function projectGrowth({ startCents = 0, monthlyCents = 0, annualRatePct = 0, years = 10 }) {
    const i = annualRatePct / 100 / 12;
    const out = [];
    for (let y = 0; y <= years; y++) {
      const n = y * 12;
      const growth = i === 0 ? 1 : Math.pow(1 + i, n);
      const fvStart = startCents * growth;
      const fvMonthly = i === 0 ? monthlyCents * n : monthlyCents * ((growth - 1) / i);
      const valore = Math.round(fvStart + fvMonthly);
      const versato = Math.round(startCents + monthlyCents * n);
      out.push({ anno: y, valore, versato, interessi: valore - versato });
    }
    return out;
  }

  return {
    TIPI_MOVIMENTO, TIPI_OPERAZIONE, holdingsCostSeries, monthlyContributions, projectGrowth,
    savingsBalance, savingsByMonth, goalProgress,
    etfPosition, portfolio,
    validateMovement, validateEtf, validateInvestment,
  };
});
