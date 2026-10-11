/*
 * Fiscale e report: logica pura (testabile con node).
 *
 * ATTENZIONE: sono stime. Aliquote, coefficiente di redditività e soglie sono
 * configurabili in Impostazioni: verificale con il commercialista.
 *
 * Regole usate (regime forfettario, principio di cassa):
 *  - ricavi = compensi INCASSATI nell'anno (non le fatture emesse)
 *  - reddito lordo = ricavi × coefficiente di redditività (ATECO)
 *  - contributi = reddito lordo × aliquota INPS (deducibili)
 *  - imponibile = reddito lordo − contributi
 *  - imposta = imponibile × aliquota sostitutiva (5% nei primi 5 anni se spettante, poi 15%)
 */
(function (root, factory) {
  const C = typeof module === 'object' && module.exports ? require('./core.js') : root.Core;
  const api = factory(C);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Fiscale = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Core) {
  'use strict';

  const DEFAULT_FISCAL = {
    regimeForfettario: true,
    annoInizio: new Date().getFullYear(),
    coefficiente: 78,          // % di redditività: verifica il tuo codice ATECO
    aliquotaInps: 22,          // % contributi gestione separata (come da tua indicazione)
    aliquotaSostitutiva: 15,   // % imposta sostitutiva ordinaria
    aliquotaStartup: 5,        // % imposta agevolata (primi 5 anni, se spettante)
    anniStartup: 5,
    sogliaRicavi: 85000,       // euro: limite di ricavi/compensi del regime
  };

  // Imposta sostitutiva dell'anno: agevolata nei primi anniStartup anni dall'inizio
  function aliquotaImpostaPerAnno(anno, cfg) {
    const c = { ...DEFAULT_FISCAL, ...cfg };
    const idx = anno - Number(c.annoInizio);
    return idx >= 0 && idx < c.anniStartup ? c.aliquotaStartup : c.aliquotaSostitutiva;
  }

  // Stima per un anno solare. ricaviCents = compensi incassati nell'anno (centesimi)
  function taxEstimate({ anno, ricaviCents, cfg }) {
    const c = { ...DEFAULT_FISCAL, ...cfg };
    const ricavi = Math.max(0, Math.round(ricaviCents));
    const redditoLordo = Math.round((ricavi * c.coefficiente) / 100);
    const contributi = Math.round((redditoLordo * c.aliquotaInps) / 100);
    const imponibile = Math.max(0, redditoLordo - contributi);
    const aliquotaImposta = aliquotaImpostaPerAnno(anno, c);
    const imposta = Math.round((imponibile * aliquotaImposta) / 100);
    const totaleDaPagare = contributi + imposta;
    const sogliaCents = Math.round(c.sogliaRicavi * 100);
    return {
      anno,
      ricavi,
      coefficiente: c.coefficiente,
      redditoLordo,
      aliquotaInps: c.aliquotaInps,
      contributi,
      imponibile,
      aliquotaImposta,
      imposta,
      totaleDaPagare,
      nettoStimato: Math.max(0, ricavi - totaleDaPagare),
      effettivo: ricavi > 0 ? Math.round((totaleDaPagare / ricavi) * 1000) / 10 : 0,
      sogliaRaggiunta: ricavi >= sogliaCents,
      percentualeSoglia: Math.min(100, Math.round((ricavi / sogliaCents) * 1000) / 10),
      inStartup: aliquotaImposta === c.aliquotaStartup,
    };
  }

  // Proiezione lineare a fine anno, dai mesi già trascorsi
  function projectYear(ricaviYtdCents, mesiTrascorsi) {
    if (!mesiTrascorsi || mesiTrascorsi <= 0) return 0;
    return Math.round((ricaviYtdCents / mesiTrascorsi) * 12);
  }

  // Ricavi per tassazione: incassi nell'anno (principio di cassa)
  function ricaviIncassati(data, anno) {
    return data.payments
      .filter((p) => Number(p.date.slice(0, 4)) === anno)
      .reduce((s, p) => s + p.amountCents, 0);
  }

  /* ------------------------------ Settimane ------------------------------ */
  // Lunedì e domenica della settimana che contiene iso
  function weekRange(iso) {
    const { y, m, d } = { y: Number(iso.slice(0, 4)), m: Number(iso.slice(5, 7)), d: Number(iso.slice(8, 10)) };
    const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = domenica
    const offset = dow === 0 ? 6 : dow - 1;
    const from = Core.addDays(iso, -offset);
    return { from, to: Core.addDays(from, 6) };
  }

  const localDateOf = (ts) => (ts ? Core.todayISO(new Date(ts)) : '');

  function weekReport(data, anyDayIso, today) {
    const { from, to } = weekRange(anyDayIso);
    const inW = (d) => Core.inRange(d, from, to);
    const fatture = data.invoices.filter((i) => i.stato === 'emessa' && inW(i.issueDate));
    const fatturato = fatture.reduce((s, i) => s + Core.invoiceTotals(i).imponibile, 0);
    const incassi = data.payments.filter((p) => inW(p.date));
    const incassato = incassi.reduce((s, p) => s + p.amountCents, 0);
    const spese = data.expenses.filter((e) => inW(e.date)).reduce((s, e) => s + e.amountCents, 0);
    const nuoviClienti = data.clients.filter((c) => inW(localDateOf(c.createdAt)));
    const lavoriChiusi = data.projects
      .filter((p) => (p.stato === 'consegnato' || p.stato === 'chiuso') && inW(p.dataConsegna || ''))
      .map((p) => ({ ...p, durataGiorni: p.dataInizio ? Core.daysBetween(p.dataInizio, p.dataConsegna) : null }));
    const lavoriAperti = data.projects.filter((p) => p.stato === 'in_corso' || p.stato === 'preventivo');
    const attivita = data.activities.filter((a) => inW(a.date));
    const tasksFatti = (data.tasks || []).filter((t) => t.stato === 'fatto' && inW(localDateOf(t.completedAt)));
    const tasksAperti = (data.tasks || []).filter((t) => t.stato !== 'fatto');
    const scadenzeSettimana = tasksAperti.filter((t) => t.scadenza && inW(t.scadenza));
    const tasksScaduti = tasksAperti.filter((t) => t.scadenza && t.scadenza < today);
    return {
      from, to,
      fatturato, incassato, spese, utile: incassato - spese,
      fattureEmesse: fatture.length,
      nuoviClienti,
      lavoriChiusi,
      lavoriAperti,
      attivita,
      incassi,
      tasksFatti,
      tasksAperti,
      scadenzeSettimana,
      tasksScaduti,
    };
  }

  /* ------------------------------ Andamento annuo ------------------------------ */
  function yearTrend(data, year) {
    const months = Core.monthsOfYear(year);
    const agg = Core.aggregate(data, months);
    return months.map((m) => {
      const a = agg.byMonth[m];
      const closed = data.projects.filter((p) => (p.stato === 'consegnato' || p.stato === 'chiuso') && (p.dataConsegna || '').startsWith(m));
      const nuovi = data.clients.filter((c) => localDateOf(c.createdAt).startsWith(m));
      return {
        month: m,
        label: Core.monthLabel(m),
        short: Core.monthShort(m),
        fatturato: a.fatturato,
        incassato: a.incassato,
        spese: a.spese,
        lavoriChiusi: closed.length,
        lavoriChiusiElenco: closed,
        nuoviClienti: nuovi.length,
      };
    });
  }

  /* ------------------------------ Task ------------------------------ */
  function taskBucket(t, today) {
    if (t.stato === 'fatto') return 'fatto';
    if (!t.scadenza) return 'senza';
    if (t.scadenza < today) return 'scaduto';
    if (t.scadenza === today) return 'oggi';
    return 'prossimo';
  }

  const PRIORITA = { alta: 'Alta', media: 'Media', bassa: 'Bassa' };

  function validateTask(t) {
    const err = [];
    if (!t.titolo || !String(t.titolo).trim()) err.push('Scrivi il titolo del task.');
    if (t.scadenza && !Core.isValidISODate(t.scadenza)) err.push('Scadenza non valida.');
    if (!Object.prototype.hasOwnProperty.call(PRIORITA, t.priorita)) err.push('Priorità non valida.');
    return err;
  }

  return {
    DEFAULT_FISCAL, PRIORITA, aliquotaImpostaPerAnno, taxEstimate, projectYear, ricaviIncassati,
    weekRange, weekReport, yearTrend, taskBucket, validateTask,
  };
});
