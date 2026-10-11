/*
 * Core del gestionale: logica pura (nessun DOM, nessuno storage).
 *
 * Regole fondamentali:
 *  - Tutti gli importi sono interi in CENTESIMI (es. 12,50 € = 1250).
 *  - Tutte le date sono stringhe "YYYY-MM-DD" in calendario locale.
 *    Non si usano mai toISOString() o confronti di Date per le date di business,
 *    così non ci sono sfasamenti di un giorno dovuti al fuso orario.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Core = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /* ------------------------------------------------------------------ *
   * Costanti
   * ------------------------------------------------------------------ */
  const CATEGORIE_SPESA = [
    'Software e abbonamenti',
    'Crediti AI e API',
    'Hardware e attrezzatura',
    'Hosting e domini',
    'Stock e asset (musica, font, footage)',
    'Formazione',
    'Marketing e pubblicità',
    'Consulenze e commercialista',
    'Trasporti e vitto',
    'Altro',
  ];

  const METODI_PAGAMENTO = ['Bonifico', 'Contanti', 'Carta', 'PayPal', 'Assegno', 'Altro'];

  const STATI_PROGETTO = {
    preventivo: 'Preventivo',
    in_corso: 'In corso',
    consegnato: 'Consegnato',
    chiuso: 'Chiuso',
    annullato: 'Annullato',
  };

  const TIPI_DOCUMENTO = {
    contratto: 'Contratto',
    ricevuta: 'Ricevuta di pagamento',
    fattura: 'Fattura',
    brief: 'Brief / materiale cliente',
    altro: 'Altro',
  };

  const TIPI_ATTIVITA = {
    nota: 'Nota',
    chiamata: 'Chiamata',
    email: 'Email',
    riunione: 'Riunione',
    consegna: 'Consegna',
  };

  const MESI = [
    'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
    'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre',
  ];

  const MAX_FILE_BYTES = 25 * 1024 * 1024;

  /* ------------------------------------------------------------------ *
   * Date (calendario locale, stringhe YYYY-MM-DD)
   * ------------------------------------------------------------------ */
  const pad2 = (n) => String(n).padStart(2, '0');
  const pad3 = (n) => String(n).padStart(3, '0');
  const fmtYMD = (y, m, d) => `${String(y).padStart(4, '0')}-${pad2(m)}-${pad2(d)}`;

  function parseISO(s) {
    const [y, m, d] = s.split('-').map(Number);
    return { y, m, d };
  }

  function daysInMonth(y, m) {
    // m è 1-based: Date.UTC(y, m, 0) è l'ultimo giorno del mese m
    return new Date(Date.UTC(y, m, 0)).getUTCDate();
  }

  function isValidISODate(s) {
    if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    const { y, m, d } = parseISO(s);
    if (m < 1 || m > 12 || d < 1) return false;
    return d <= daysInMonth(y, m);
  }

  function todayISO(now = new Date()) {
    return fmtYMD(now.getFullYear(), now.getMonth() + 1, now.getDate());
  }

  function addDays(iso, n) {
    const { y, m, d } = parseISO(iso);
    const dt = new Date(Date.UTC(y, m - 1, d + n));
    return fmtYMD(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
  }

  // Giorni da a verso b (positivo se b è dopo a). Usa UTC: niente errori di ora legale.
  function daysBetween(a, b) {
    const A = parseISO(a);
    const B = parseISO(b);
    return Math.round((Date.UTC(B.y, B.m - 1, B.d) - Date.UTC(A.y, A.m - 1, A.d)) / 86400000);
  }

  const monthKeyOf = (y, m) => `${String(y).padStart(4, '0')}-${pad2(m)}`;
  const monthKey = (iso) => iso.slice(0, 7);

  function shiftMonth(key, n) {
    const y = Number(key.slice(0, 4));
    const m = Number(key.slice(5, 7));
    const t = y * 12 + (m - 1) + n;
    return monthKeyOf(Math.floor(t / 12), (t % 12) + 1);
  }

  function lastDayOf(monthK) {
    const y = Number(monthK.slice(0, 4));
    const m = Number(monthK.slice(5, 7));
    return fmtYMD(y, m, daysInMonth(y, m));
  }

  function monthsOfYear(year) {
    return Array.from({ length: 12 }, (_, i) => monthKeyOf(year, i + 1));
  }

  function monthLabel(monthK) {
    const y = Number(monthK.slice(0, 4));
    const m = Number(monthK.slice(5, 7));
    const txt = MESI[m - 1];
    return `${txt.charAt(0).toUpperCase()}${txt.slice(1)} ${y}`;
  }

  function monthShort(monthK) {
    const m = Number(monthK.slice(5, 7));
    return MESI[m - 1].slice(0, 3);
  }

  function inRange(iso, from, to) {
    return typeof iso === 'string' && iso >= from && iso <= to;
  }

  /*
   * Specifica di periodo:
   *  { type:'mese', year, month }            un mese
   *  { type:'trimestre', year, q }           trimestre 1..4
   *  { type:'ultimi', year, month, n }       n mesi che terminano a year/month
   *  { type:'anno', year }                   1 gennaio - 31 dicembre
   */
  function resolvePeriod(spec) {
    let months;
    let label;
    switch (spec.type) {
      case 'mese':
        months = [monthKeyOf(spec.year, spec.month)];
        label = monthLabel(months[0]);
        break;
      case 'trimestre': {
        const start = (spec.q - 1) * 3 + 1;
        months = [0, 1, 2].map((i) => monthKeyOf(spec.year, start + i));
        label = `${spec.q}° trimestre ${spec.year}`;
        break;
      }
      case 'ultimi': {
        const end = monthKeyOf(spec.year, spec.month);
        months = Array.from({ length: spec.n }, (_, i) => shiftMonth(end, i - (spec.n - 1)));
        label = `Ultimi ${spec.n} mesi (fino a ${monthLabel(end)})`;
        break;
      }
      case 'anno':
        months = monthsOfYear(spec.year);
        label = `Anno ${spec.year} (gennaio–dicembre)`;
        break;
      default:
        throw new Error(`Periodo non valido: ${spec.type}`);
    }
    return {
      label,
      months,
      from: `${months[0]}-01`,
      to: lastDayOf(months[months.length - 1]),
      // finestra precedente di uguale lunghezza, per i confronti
      previousMonths: months.map((m) => shiftMonth(m, -months.length)),
    };
  }

  /* ------------------------------------------------------------------ *
   * Denaro (centesimi interi)
   * ------------------------------------------------------------------ */
  // Accetta "1234,5", "1.234,56", "1234.56", "1,234.56", "€ 12", "-3,00".
  // Un punto seguito da esattamente 3 cifre e nient'altro è interpretato come migliaia (1.234 = 1234).
  function parseEuroToCents(input) {
    if (typeof input === 'number') return Number.isFinite(input) ? Math.round(input * 100) : null;
    if (typeof input !== 'string') return null;
    let s = input.replace(/€/g, '').replace(/\s/g, '');
    if (s === '') return null;
    let negative = false;
    if (s.startsWith('-')) {
      negative = true;
      s = s.slice(1);
    }
    const lc = s.lastIndexOf(',');
    const ld = s.lastIndexOf('.');
    if (lc !== -1 && ld !== -1) {
      s = lc > ld ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
    } else if (lc !== -1) {
      s = /^\d+,\d+$/.test(s) ? s.replace(',', '.') : (/^\d{1,3}(,\d{3})+$/.test(s) ? s.replace(/,/g, '') : null);
    } else if (ld !== -1) {
      if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    }
    if (s === null || !/^\d+(\.\d+)?$/.test(s)) return null;
    const [intPart, fracPart = ''] = s.split('.');
    let cents;
    if (fracPart.length <= 2) {
      cents = Number(intPart) * 100 + Number(fracPart.padEnd(2, '0'));
    } else {
      cents = Math.round(Number(s) * 100);
    }
    return negative ? -cents : cents;
  }

  const euroFormatter = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });
  const formatEuro = (cents) => euroFormatter.format((Number(cents) || 0) / 100);

  // Per campi di input e CSV: "1234,56" senza simbolo
  const centsToPlain = (cents) => ((Number(cents) || 0) / 100).toFixed(2).replace('.', ',');

  function formatPercent(v) {
    if (v === null || v === undefined || !Number.isFinite(v)) return 'n.d.';
    const sign = v > 0 ? '+' : '';
    return `${sign}${v.toLocaleString('it-IT', { maximumFractionDigits: 1 })}%`;
  }

  // Variazione percentuale. null se non calcolabile (precedente = 0 e attuale ≠ 0).
  function pctChange(curr, prev) {
    if (prev === 0) return curr === 0 ? 0 : null;
    return ((curr - prev) / Math.abs(prev)) * 100;
  }

  /* ------------------------------------------------------------------ *
   * Fatture
   * ------------------------------------------------------------------ */
  function invoiceTotals(inv) {
    const righe = Array.isArray(inv.righe) ? inv.righe : [];
    const imponibile = righe.reduce((s, r) => s + Math.round(Number(r.quantita) * Number(r.prezzoCents)), 0);
    const rate = Number(inv.ivaRate) || 0;
    const iva = Math.round((imponibile * rate) / 100);
    return { imponibile, iva, totale: imponibile + iva };
  }

  function paidOnInvoice(invoiceId, payments, excludePaymentId = null) {
    return payments.reduce(
      (s, p) => (p.invoiceId === invoiceId && p.id !== excludePaymentId ? s + p.amountCents : s),
      0
    );
  }

  /*
   * Stato di una fattura:
   *  bozza | annullata  -> stato dichiarato
   *  pagata | parziale | scaduta | emessa -> stato di pagamento (derivato)
   */
  function invoiceState(inv, payments, today) {
    const { totale } = invoiceTotals(inv);
    if (inv.stato === 'bozza') return { code: 'bozza', label: 'Bozza', overdue: false, paid: 0, residuo: totale, totale };
    if (inv.stato === 'annullata') return { code: 'annullata', label: 'Annullata', overdue: false, paid: 0, residuo: 0, totale };
    const paid = paidOnInvoice(inv.id, payments);
    const residuo = totale - paid;
    const overdue = residuo > 0 && inv.dueDate < today;
    let code;
    if (residuo <= 0) code = 'pagata';
    else if (overdue) code = 'scaduta';
    else if (paid > 0) code = 'parziale';
    else code = 'emessa';
    const labels = {
      pagata: 'Pagata',
      scaduta: 'Scaduta',
      parziale: 'Pagata in parte',
      emessa: 'Da pagare',
    };
    return { code, label: labels[code], overdue, paid, residuo, totale };
  }

  // Numero progressivo per anno: max esistente + 1 (le annullate non liberano numeri)
  function nextInvoiceNumber(year, invoices) {
    const re = new RegExp(`^${year}/(\\d+)$`);
    let max = 0;
    for (const inv of invoices) {
      const m = re.exec(inv.number || '');
      if (m) max = Math.max(max, parseInt(m[1], 10));
    }
    return `${year}/${pad3(max + 1)}`;
  }

  /* ------------------------------------------------------------------ *
   * Saldi e aggregazioni
   * ------------------------------------------------------------------ */
  // data: { clients, invoices, payments, expenses }
  function clientBalance(clientId, data) {
    const imponibile = data.invoices
      .filter((i) => i.clientId === clientId && i.stato === 'emessa')
      .reduce((s, i) => s + invoiceTotals(i).imponibile, 0);
    const totale = data.invoices
      .filter((i) => i.clientId === clientId && i.stato === 'emessa')
      .reduce((s, i) => s + invoiceTotals(i).totale, 0);
    const incassato = data.payments
      .filter((p) => p.clientId === clientId)
      .reduce((s, p) => s + p.amountCents, 0);
    return { imponibile, totale, incassato, saldo: totale - incassato };
  }

  // Ritorna { daIncassare, crediti } sommando il saldo di tutti i clienti
  function receivablesSummary(data) {
    let daIncassare = 0;
    let crediti = 0;
    for (const c of data.clients) {
      const { saldo } = clientBalance(c.id, data);
      if (saldo > 0) daIncassare += saldo;
      else if (saldo < 0) crediti += -saldo;
    }
    return { daIncassare, crediti };
  }

  function overdueInvoices(data, today) {
    return data.invoices
      .filter((i) => i.stato === 'emessa')
      .map((i) => ({ inv: i, st: invoiceState(i, data.payments, today) }))
      .filter((x) => x.st.overdue)
      .sort((a, b) => (a.inv.dueDate < b.inv.dueDate ? -1 : 1));
  }

  // Aggregazione mensile su una lista di mesi (chiavi YYYY-MM)
  function aggregate(data, months) {
    const byMonth = {};
    for (const m of months) {
      byMonth[m] = { fatturato: 0, iva: 0, fatture: 0, incassato: 0, spese: 0, utileCompetenza: 0, utileCassa: 0 };
    }
    for (const inv of data.invoices) {
      if (inv.stato !== 'emessa') continue;
      const m = monthKey(inv.issueDate);
      if (!byMonth[m]) continue;
      const t = invoiceTotals(inv);
      byMonth[m].fatturato += t.imponibile;
      byMonth[m].iva += t.iva;
      byMonth[m].fatture += 1;
    }
    for (const p of data.payments) {
      const m = monthKey(p.date);
      if (byMonth[m]) byMonth[m].incassato += p.amountCents;
    }
    for (const e of data.expenses) {
      const m = monthKey(e.date);
      if (byMonth[m]) byMonth[m].spese += e.amountCents;
    }
    const totals = { fatturato: 0, iva: 0, fatture: 0, incassato: 0, spese: 0, utileCompetenza: 0, utileCassa: 0 };
    for (const m of months) {
      const r = byMonth[m];
      r.utileCompetenza = r.fatturato - r.spese;
      r.utileCassa = r.incassato - r.spese;
      for (const k of Object.keys(totals)) totals[k] += r[k];
    }
    return { byMonth, totals };
  }

  function topClients(data, from, to, limit = 5) {
    const map = new Map();
    for (const inv of data.invoices) {
      if (inv.stato !== 'emessa' || !inRange(inv.issueDate, from, to)) continue;
      map.set(inv.clientId, (map.get(inv.clientId) || 0) + invoiceTotals(inv).imponibile);
    }
    return [...map.entries()]
      .map(([clientId, fatturato]) => ({ clientId, fatturato }))
      .sort((a, b) => b.fatturato - a.fatturato)
      .slice(0, limit);
  }

  /* ------------------------------------------------------------------ *
   * Validazione
   * Ogni validatore ritorna un array di messaggi (vuoto = ok).
   * ------------------------------------------------------------------ */
  function isValidPartitaIva(s) {
    if (!/^\d{11}$/.test(s || '')) return false;
    let sum = 0;
    for (let i = 0; i < 10; i++) {
      let d = Number(s[i]);
      if (i % 2 === 1) {
        d *= 2;
        if (d > 9) d -= 9;
      }
      sum += d;
    }
    return (10 - (sum % 10)) % 10 === Number(s[10]);
  }

  function isValidCodiceFiscale(s) {
    const v = (s || '').toUpperCase();
    return /^[A-Z]{6}\d{2}[ABCDEHLMPRST]\d{2}[A-Z]\d{3}[A-Z]$/.test(v) || /^\d{11}$/.test(v);
  }

  const isValidEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s || '');

  const isNonEmpty = (s) => typeof s === 'string' && s.trim().length > 0;

  function validateClient(c) {
    const err = [];
    if (!['privato', 'azienda'].includes(c.tipo)) err.push('Tipo cliente non valido.');
    if (c.tipo === 'privato') {
      if (!isNonEmpty(c.nome)) err.push('Il nome è obbligatorio.');
      if (!isNonEmpty(c.cognome)) err.push('Il cognome è obbligatorio.');
    } else {
      if (!isNonEmpty(c.ragioneSociale)) err.push('La ragione sociale è obbligatoria.');
      if (!isNonEmpty(c.partitaIva)) err.push('La partita IVA è obbligatoria per le aziende.');
    }
    if (isNonEmpty(c.partitaIva) && !isValidPartitaIva(c.partitaIva.trim())) err.push('Partita IVA non valida (11 cifre con codice di controllo).');
    if (isNonEmpty(c.codiceFiscale) && !isValidCodiceFiscale(c.codiceFiscale.trim())) err.push('Codice fiscale non valido.');
    if (isNonEmpty(c.email) && !isValidEmail(c.email.trim())) err.push('Email non valida.');
    return err;
  }

  function validateInvoice(inv, ctx) {
    const err = [];
    const { clients = [], invoices = [], payments = [] } = ctx || {};
    if (!clients.some((c) => c.id === inv.clientId)) err.push('Seleziona un cliente.');
    if (!isValidISODate(inv.issueDate)) err.push('Data di emissione non valida.');
    if (!isValidISODate(inv.dueDate)) err.push('Data di scadenza non valida.');
    if (isValidISODate(inv.issueDate) && isValidISODate(inv.dueDate) && inv.dueDate < inv.issueDate) {
      err.push('La scadenza non può essere prima dell’emissione.');
    }
    if (!/^\d{4}\/\d{3,}$/.test(inv.number || '')) err.push('Numero fattura non valido (formato AAAA/001).');
    else if (invoices.some((i) => i.number === inv.number && i.id !== inv.id)) err.push(`Il numero ${inv.number} è già usato.`);
    const righe = Array.isArray(inv.righe) ? inv.righe : [];
    if (righe.length === 0) err.push('Aggiungi almeno una riga.');
    righe.forEach((r, idx) => {
      const n = idx + 1;
      if (!isNonEmpty(r.descrizione)) err.push(`Riga ${n}: descrizione obbligatoria.`);
      if (!(Number(r.quantita) > 0) || !Number.isFinite(Number(r.quantita))) err.push(`Riga ${n}: quantità deve essere maggiore di zero.`);
      if (!Number.isInteger(r.prezzoCents) || r.prezzoCents < 0) err.push(`Riga ${n}: prezzo non valido.`);
    });
    const rate = Number(inv.ivaRate);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) err.push('Aliquota IVA non valida (0–100).');
    if (inv.id) {
      const paid = paidOnInvoice(inv.id, payments);
      const { totale } = invoiceTotals(inv);
      if (paid > totale) err.push(`Non puoi scendere sotto gli incassi già registrati (${formatEuro(paid)}).`);
    }
    return err;
  }

  function validatePayment(p, ctx) {
    const err = [];
    const { clients = [], invoices = [], payments = [] } = ctx || {};
    if (!clients.some((c) => c.id === p.clientId)) err.push('Seleziona un cliente.');
    if (!isValidISODate(p.date)) err.push('Data pagamento non valida.');
    if (!Number.isInteger(p.amountCents) || p.amountCents <= 0) err.push('Importo deve essere maggiore di zero.');
    if (p.invoiceId) {
      const inv = invoices.find((i) => i.id === p.invoiceId);
      if (!inv) err.push('Fattura collegata non trovata.');
      else {
        if (inv.clientId !== p.clientId) err.push('La fattura collegata appartiene a un altro cliente.');
        if (inv.stato !== 'emessa') err.push('Puoi registrare incassi solo su fatture emesse.');
        else {
          const residuo = invoiceTotals(inv).totale - paidOnInvoice(inv.id, payments, p.id);
          if (p.amountCents > residuo) err.push(`L’importo supera il residuo della fattura (${formatEuro(residuo)}).`);
        }
      }
    }
    return err;
  }

  function validateExpense(e) {
    const err = [];
    if (!isValidISODate(e.date)) err.push('Data non valida.');
    if (!isNonEmpty(e.descrizione)) err.push('Descrizione obbligatoria.');
    if (!Number.isInteger(e.amountCents) || e.amountCents <= 0) err.push('Importo deve essere maggiore di zero.');
    if (!CATEGORIE_SPESA.includes(e.categoria)) err.push('Categoria non valida.');
    return err;
  }

  function validateProject(p, ctx) {
    const err = [];
    const { clients = [] } = ctx || {};
    if (!clients.some((c) => c.id === p.clientId)) err.push('Seleziona un cliente.');
    if (!isNonEmpty(p.titolo)) err.push('Titolo obbligatorio.');
    if (!Object.prototype.hasOwnProperty.call(STATI_PROGETTO, p.stato)) err.push('Stato progetto non valido.');
    if (p.dataInizio && !isValidISODate(p.dataInizio)) err.push('Data inizio non valida.');
    if (p.dataConsegna && !isValidISODate(p.dataConsegna)) err.push('Data consegna non valida.');
    if (p.budgetCents !== undefined && (!Number.isInteger(p.budgetCents) || p.budgetCents < 0)) err.push('Budget non valido.');
    return err;
  }

  function validateActivity(a) {
    const err = [];
    if (!isValidISODate(a.date)) err.push('Data non valida.');
    if (!isNonEmpty(a.testo)) err.push('Scrivi il contenuto dell’attività.');
    if (!Object.prototype.hasOwnProperty.call(TIPI_ATTIVITA, a.tipo)) err.push('Tipo non valido.');
    return err;
  }

  function validateFile(file) {
    const err = [];
    if (!file) err.push('Seleziona un file.');
    else if (file.size > MAX_FILE_BYTES) err.push('Il file supera 25 MB.');
    return err;
  }

  /* ------------------------------------------------------------------ *
   * CSV (separatore ";" e virgola decimale, come vuole Excel in italiano)
   * ------------------------------------------------------------------ */
  function toCsv(columns, rows) {
    const q = (v) => {
      const s = v === null || v === undefined ? '' : String(v);
      return /[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [columns.map((c) => q(c.label)).join(';')];
    for (const r of rows) lines.push(columns.map((c) => q(c.get(r))).join(';'));
    return lines.join('\r\n');
  }

  /* ------------------------------------------------------------------ *
   * Varie
   * ------------------------------------------------------------------ */
  function uid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  // Dal giorno di ultimo backup: quanti giorni sono passati (null se mai fatto)
  function daysSince(isoDate, today) {
    if (!isValidISODate(isoDate)) return null;
    return daysBetween(isoDate, today);
  }

  return {
    CATEGORIE_SPESA, METODI_PAGAMENTO, STATI_PROGETTO, TIPI_DOCUMENTO, TIPI_ATTIVITA, MESI, MAX_FILE_BYTES,
    pad2, isValidISODate, daysInMonth, todayISO, addDays, daysBetween, monthKeyOf, monthKey, shiftMonth,
    lastDayOf, monthsOfYear, monthLabel, monthShort, inRange, resolvePeriod,
    parseEuroToCents, formatEuro, centsToPlain, formatPercent, pctChange,
    invoiceTotals, paidOnInvoice, invoiceState, nextInvoiceNumber,
    clientBalance, receivablesSummary, overdueInvoices, aggregate, topClients,
    isValidPartitaIva, isValidCodiceFiscale, isValidEmail,
    validateClient, validateInvoice, validatePayment, validateExpense, validateProject, validateActivity, validateFile,
    toCsv, uid, daysSince,
  };
});
