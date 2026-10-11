/*
 * Dashboard: KPI del periodo scelto, confronto con il periodo precedente,
 * grafico mensile dell'anno, tabelle per mese e trimestre, scadenze, top clienti.
 */
(function (root) {
  'use strict';

  const { Core, UI, App, Fiscale } = root;
  const { esc, fmtDate } = UI;
  const V = App.views;

  const PERIODS = [
    ['mese', 'Mese'],
    ['trimestre', 'Trimestre'],
    ['ultimi3', 'Ultimi 3 mesi'],
    ['ultimi6', 'Ultimi 6 mesi'],
    ['anno', 'Anno (gen–dic)'],
  ];

  function defaultDash() {
    const t = new Date();
    return { year: t.getFullYear(), month: t.getMonth() + 1, q: Math.floor(t.getMonth() / 3) + 1, period: 'mese' };
  }

  function dash() {
    if (!App.ui.dash) App.ui.dash = defaultDash();
    return App.ui.dash;
  }

  function periodSpec(d) {
    switch (d.period) {
      case 'trimestre': return { type: 'trimestre', year: d.year, q: d.q };
      case 'ultimi3': return { type: 'ultimi', year: d.year, month: d.month, n: 3 };
      case 'ultimi6': return { type: 'ultimi', year: d.year, month: d.month, n: 6 };
      case 'anno': return { type: 'anno', year: d.year };
      default: return { type: 'mese', year: d.year, month: d.month };
    }
  }

  // Anni selezionabili: dal primo dato registrato (o anno corrente) fino all'anno prossimo
  function yearOptions() {
    const s = App.state;
    const years = [
      ...s.invoices.map((i) => Number(i.issueDate.slice(0, 4))),
      ...s.payments.map((p) => Number(p.date.slice(0, 4))),
      ...s.expenses.map((e) => Number(e.date.slice(0, 4))),
      new Date().getFullYear(),
    ].filter((y) => Number.isFinite(y));
    const min = Math.min(...years);
    const max = Math.max(...years) + 1;
    const out = [];
    for (let y = min; y <= max; y++) out.push(y);
    return out;
  }

  // Formato compatto per gli assi del grafico (es. 12,5k)
  const compact = (cents) => {
    const eur = (Number(cents) || 0) / 100;
    if (Math.abs(eur) >= 1000) return `${(eur / 1000).toLocaleString('it-IT', { maximumFractionDigits: 1 })}k`;
    return eur.toLocaleString('it-IT', { maximumFractionDigits: 0 });
  };

  function delta(curr, prev, { invert = false } = {}) {
    const pct = Core.pctChange(curr, prev);
    if (pct === null) return `<span class="delta muted">nessun dato nel periodo precedente</span>`;
    if (pct === 0) return `<span class="delta muted">invariato rispetto al precedente</span>`;
    const good = invert ? pct < 0 : pct > 0;
    return `<span class="delta ${good ? 'good' : 'bad'}">${pct > 0 ? '▲' : '▼'} ${esc(Core.formatPercent(pct))} vs periodo precedente</span>`;
  }

  function kpi(label, value, extra = '', tone = '') {
    return `<article class="kpi ${tone}"><span class="kpi-label">${esc(label)}</span><strong class="kpi-value">${esc(value)}</strong>${extra}</article>`;
  }

  function barChart(year, selectedMonths, byMonth) {
    const W = 760;
    const H = 300;
    const left = 52;
    const top = 16;
    const bottom = 34;
    const plotH = H - top - bottom;
    const months = Core.monthsOfYear(year);
    const max = Math.max(1, ...months.map((m) => Math.max(byMonth[m].fatturato, byMonth[m].incassato)));
    const slot = (W - left - 8) / 12;
    const barW = slot * 0.34;
    let svg = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Fatturato e incassi per mese nel ${year}">`;
    for (let i = 0; i <= 4; i++) {
      const v = (max * i) / 4;
      const y = top + plotH - (plotH * i) / 4;
      svg += `<line class="grid" x1="${left}" x2="${W - 8}" y1="${y}" y2="${y}"></line>`;
      svg += `<text class="axis" x="${left - 8}" y="${y + 4}" text-anchor="end">${esc(compact(v))}</text>`;
    }
    months.forEach((m, i) => {
      const x = left + i * slot + slot * 0.13;
      const a = byMonth[m];
      const hF = (plotH * a.fatturato) / max;
      const hI = (plotH * a.incassato) / max;
      const sel = selectedMonths.includes(m) ? ' sel' : '';
      svg += `<rect class="bar-fat${sel}" x="${x}" y="${top + plotH - hF}" width="${barW}" height="${hF}"><title>${esc(Core.monthLabel(m))} · fatturato ${esc(Core.formatEuro(a.fatturato))}</title></rect>`;
      svg += `<rect class="bar-inc${sel}" x="${x + barW + 3}" y="${top + plotH - hI}" width="${barW}" height="${hI}"><title>${esc(Core.monthLabel(m))} · incassato ${esc(Core.formatEuro(a.incassato))}</title></rect>`;
      svg += `<text class="axis" x="${x + barW}" y="${H - 12}" text-anchor="middle">${esc(Core.monthShort(m))}</text>`;
    });
    svg += '</svg>';
    return `${svg}<div class="legend"><span><i class="sw fat"></i>Fatturato (netto IVA)</span><span><i class="sw inc"></i>Incassato</span><span class="muted">Mesi evidenziati: periodo selezionato</span></div>`;
  }

  function controls(d) {
    const years = yearOptions();
    const months = [...Array(12)].map((_, i) => [i + 1, Core.MESI[i][0].toUpperCase() + Core.MESI[i].slice(1)]);
    return `
      <form class="toolbar dash-controls" aria-label="Filtri dashboard">
        <label class="field"><span class="lbl">Periodo</span>
          <select name="period" data-change="dash">${PERIODS.map(([v, l]) => `<option value="${v}"${v === d.period ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>
        </label>
        <label class="field"><span class="lbl">Anno</span>
          <select name="year" data-change="dash">${years.map((y) => `<option value="${y}"${y === d.year ? ' selected' : ''}>${y}</option>`).join('')}</select>
        </label>
        ${d.period === 'trimestre' ? `<label class="field"><span class="lbl">Trimestre</span>
          <select name="q" data-change="dash">${[1, 2, 3, 4].map((q) => `<option value="${q}"${q === d.q ? ' selected' : ''}>${q}° trimestre</option>`).join('')}</select></label>` : ''}
        ${d.period !== 'anno' ? `<label class="field"><span class="lbl">${d.period === 'mese' ? 'Mese' : 'Fino a (incluso)'}</span>
          <select name="month" data-change="dash">${months.map(([v, l]) => `<option value="${v}"${v === d.month ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></label>` : ''}
      </form>`;
  }

  function monthTable(year, byMonth, selected) {
    const months = Core.monthsOfYear(year);
    const rows = months.map((m) => {
      const a = byMonth[m];
      const hi = selected.includes(m) ? ' class="sel-row"' : '';
      return `<tr${hi}>
        <td>${esc(Core.monthLabel(m))}</td>
        <td class="num">${a.fatture}</td>
        <td class="num">${esc(Core.formatEuro(a.fatturato))}</td>
        <td class="num">${esc(Core.formatEuro(a.iva))}</td>
        <td class="num">${esc(Core.formatEuro(a.incassato))}</td>
        <td class="num">${esc(Core.formatEuro(a.spese))}</td>
        <td class="num ${a.utileCompetenza < 0 ? 'neg' : ''}">${esc(Core.formatEuro(a.utileCompetenza))}</td>
        <td class="num ${a.utileCassa < 0 ? 'neg' : ''}">${esc(Core.formatEuro(a.utileCassa))}</td>
      </tr>`;
    });
    const t = Core.aggregate(App.data(), months).totals;
    return `<div class="table-wrap"><table class="table">
      <thead><tr><th>Mese</th><th class="num">Fatture</th><th class="num">Fatturato</th><th class="num">IVA</th><th class="num">Incassato</th><th class="num">Spese</th><th class="num">Utile competenza</th><th class="num">Utile cassa</th></tr></thead>
      <tbody>${rows.join('')}</tbody>
      <tfoot><tr><th>Totale anno</th><td class="num">${t.fatture}</td><td class="num">${esc(Core.formatEuro(t.fatturato))}</td><td class="num">${esc(Core.formatEuro(t.iva))}</td><td class="num">${esc(Core.formatEuro(t.incassato))}</td><td class="num">${esc(Core.formatEuro(t.spese))}</td><td class="num">${esc(Core.formatEuro(t.utileCompetenza))}</td><td class="num">${esc(Core.formatEuro(t.utileCassa))}</td></tr></tfoot>
    </table></div>`;
  }

  function quarterTable(year) {
    const rows = [1, 2, 3, 4].map((q) => {
      const months = Core.resolvePeriod({ type: 'trimestre', year, q }).months;
      const t = Core.aggregate(App.data(), months).totals;
      return `<tr>
        <td>${q}° trimestre</td>
        <td class="num">${esc(Core.formatEuro(t.fatturato))}</td>
        <td class="num">${esc(Core.formatEuro(t.incassato))}</td>
        <td class="num">${esc(Core.formatEuro(t.spese))}</td>
        <td class="num ${t.utileCompetenza < 0 ? 'neg' : ''}">${esc(Core.formatEuro(t.utileCompetenza))}</td>
      </tr>`;
    });
    return `<div class="table-wrap"><table class="table"><thead><tr><th>Trimestre</th><th class="num">Fatturato</th><th class="num">Incassato</th><th class="num">Spese</th><th class="num">Utile competenza</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
  }

  function scadenze(today) {
    const overdue = Core.overdueInvoices(App.data(), today).slice(0, 6);
    const soon = App.data().invoices
      .filter((i) => i.stato === 'emessa')
      .map((i) => ({ inv: i, st: Core.invoiceState(i, App.state.payments, today) }))
      .filter((x) => !x.st.overdue && x.st.residuo > 0 && x.inv.dueDate >= today && x.inv.dueDate <= Core.addDays(today, 14))
      .sort((a, b) => (a.inv.dueDate < b.inv.dueDate ? -1 : 1))
      .slice(0, 6);
    const line = ({ inv, st }) => {
      const c = App.byId('clients', inv.clientId);
      return `<li><a href="#/fatture/${esc(inv.id)}">${esc(inv.number)}</a> · ${esc(c ? clientName(c) : '—')} · scade ${esc(fmtDate(inv.dueDate))}<span class="right">${esc(Core.formatEuro(st.residuo))}</span></li>`;
    };
    return `
      <section class="card">
        <h3>Scadenze</h3>
        ${overdue.length ? `<p class="label-danger">Scadute</p><ul class="plain-list">${overdue.map(line).join('')}</ul>` : '<p class="muted">Nessuna fattura scaduta.</p>'}
        ${soon.length ? `<p class="label-info">Nei prossimi 14 giorni</p><ul class="plain-list">${soon.map(line).join('')}</ul>` : ''}
      </section>`;
  }

  function fiscalYear(year) {
    const cfg = App.settings().fiscal || {};
    const ricavi = Fiscale.ricaviIncassati(App.data(), year);
    return Fiscale.taxEstimate({ anno: year, ricaviCents: ricavi, cfg });
  }

  // Task aperti: prima quelli in ritardo, poi quelli di oggi e i prossimi
  function taskCard(today) {
    const open = App.state.tasks.filter((t) => t.stato !== 'fatto');
    const order = { scaduto: 0, oggi: 1, prossimo: 2, senza: 3 };
    const list = open
      .map((t) => ({ t, b: Fiscale.taskBucket(t, today) }))
      .sort((a, b) => (order[a.b] - order[b.b]) || ((a.t.scadenza || '9999') < (b.t.scadenza || '9999') ? -1 : 1))
      .slice(0, 7);
    const late = open.filter((t) => t.scadenza && t.scadenza < today).length;
    const rows = list.map(({ t, b }) => `<li class="task ${b}">
        <button type="button" class="check-btn" data-action="task-toggle" data-id="${esc(t.id)}" aria-label="Segna fatto"></button>
        <div class="task-body"><b>${esc(t.titolo)}</b><div class="muted small-note">${t.scadenza ? esc(fmtDate(t.scadenza)) : 'senza scadenza'}</div></div>
        <span class="badge ${b === 'scaduto' ? 'danger' : b === 'oggi' ? 'info' : 'muted'}">${b === 'scaduto' ? 'in ritardo' : b === 'oggi' ? 'oggi' : Fiscale.PRIORITA[t.priorita] || ''}</span>
      </li>`).join('');
    return `
      <section class="card">
        <div class="section-head"><h3>Da fare ${late ? `<span class="count">${late} in ritardo</span>` : ''}</h3>
          <a class="btn small" href="#/task">Tutti i task</a></div>
        ${rows ? `<ul class="task-list">${rows}</ul>` : UI.empty('Nessun task aperto. Ottimo.')}
      </section>`;
  }

  function clientName(c) {
    return c.tipo === 'azienda' ? c.ragioneSociale : `${c.nome || ''} ${c.cognome || ''}`.trim();
  }

  function topClientsCard(from, to) {
    const top = Core.topClients(App.data(), from, to, 5);
    if (!top.length) return `<section class="card"><h3>Top clienti</h3><p class="muted">Nessuna fattura emessa nel periodo.</p></section>`;
    const max = top[0].fatturato || 1;
    return `<section class="card"><h3>Top clienti nel periodo</h3><ul class="bars-list">${top.map((t) => {
      const c = App.byId('clients', t.clientId);
      const pct = Math.round((t.fatturato / max) * 100);
      return `<li><div class="bars-row"><span>${esc(c ? clientName(c) : '—')}</span><b>${esc(Core.formatEuro(t.fatturato))}</b></div><div class="meter"><i style="width:${pct}%"></i></div></li>`;
    }).join('')}</ul></section>`;
  }

  V.dashboard = () => {
    const d = dash();
    const today = App.today();
    const spec = periodSpec(d);
    const period = Core.resolvePeriod(spec);
    const cur = Core.aggregate(App.data(), period.months).totals;
    const prev = Core.aggregate(App.data(), period.previousMonths).totals;
    const yearAgg = Core.aggregate(App.data(), Core.monthsOfYear(d.year));
    const rec = Core.receivablesSummary(App.data());
    const overdue = Core.overdueInvoices(App.data(), today);
    const overdueSum = overdue.reduce((s, x) => s + x.st.residuo, 0);
    const emesse = cur.fatture;

    const kpis = [
      kpi('Fatturato (netto IVA)', Core.formatEuro(cur.fatturato), delta(cur.fatturato, prev.fatturato), 'accent'),
      kpi('Incassato', Core.formatEuro(cur.incassato), delta(cur.incassato, prev.incassato)),
      kpi('Spese', Core.formatEuro(cur.spese), delta(cur.spese, prev.spese, { invert: true })),
      kpi('Utile (competenza)', Core.formatEuro(cur.utileCompetenza), `<span class="delta muted">fatturato − spese</span>`, cur.utileCompetenza < 0 ? 'bad' : ''),
      kpi('Utile (cassa)', Core.formatEuro(cur.utileCassa), `<span class="delta muted">incassato − spese</span>`, cur.utileCassa < 0 ? 'bad' : ''),
      kpi('IVA su fatturato', Core.formatEuro(cur.iva), `<span class="delta muted">${emesse} fatture emesse nel periodo</span>`),
    ].join('');

    const global = [
      kpi('Da incassare', Core.formatEuro(rec.daIncassare), `<span class="delta muted">saldo positivo di tutti i clienti</span>`, rec.daIncassare > 0 ? 'warn' : ''),
      kpi('Acconti / crediti', Core.formatEuro(rec.crediti), `<span class="delta muted">incassato in più del dovuto</span>`),
      kpi('Fatture scadute', `${overdue.length}`, `<span class="delta ${overdue.length ? 'bad' : 'muted'}">${esc(Core.formatEuro(overdueSum))} da incassare</span>`, overdue.length ? 'bad' : ''),
      kpi('Patrimonio personale', Core.formatEuro(App.patrimonio().totale), `<span class="delta muted">conto ${esc(Core.formatEuro(App.patrimonio().conto))} · ETF ${esc(Core.formatEuro(App.patrimonio().etf))}</span>`, 'accent'),
      kpi(`Da versare ${d.year} (stima)`, Core.formatEuro(fiscalYear(d.year).totaleDaPagare), `<span class="delta muted">contributi + imposta sugli incassi</span>`),
    ].join('');

    const backup = App.settings().lastBackupAt ? `ultimo backup ${esc(fmtDate(App.settings().lastBackupAt.slice(0, 10)))}` : 'nessun backup ancora';

    return `
      <header class="page-head">
        <div>
          <p class="eyebrow">Oggi ${esc(fmtDate(today))}</p>
          <h1>Dashboard</h1>
          <p class="muted">${esc(period.label)}</p>
        </div>
        <div class="head-actions">
          <a class="btn primary" href="#/fatture/nuova">+ Nuova fattura</a>
          <a class="btn" href="#/incassi">Registra incasso</a>
        </div>
      </header>
      ${controls(d)}
      <section class="kpi-grid" aria-label="Indicatori del periodo">${kpis}</section>
      <section class="kpi-grid small" aria-label="Situazione crediti">${global}</section>
      <p class="muted small-note">${backup} · Importi in euro. Fatturato = imponibile delle fatture emesse nel mese della data di emissione. Incassato = pagamenti registrati nel mese della data di pagamento.</p>

      <section class="card">
        <h3>Andamento ${d.year}</h3>
        ${barChart(d.year, period.months, yearAgg.byMonth)}
      </section>

      <div class="two-col">
        <section class="card">
          <h3>Trimestri ${d.year}</h3>
          ${quarterTable(d.year)}
        </section>
        ${topClientsCard(period.from, period.to)}
      </div>

      <section class="card">
        <h3>Dettaglio mese per mese · ${d.year}</h3>
        ${monthTable(d.year, yearAgg.byMonth, period.months)}
      </section>

      ${taskCard(today)}

      <div class="two-col">${scadenze(today)}
        <section class="card">
          <h3>Confronto</h3>
          <p>Il periodo <b>${esc(period.label)}</b> confrontato con quello precedente di uguale durata.</p>
          <ul class="plain-list">
            <li>Fatturato precedente: <b>${esc(Core.formatEuro(prev.fatturato))}</b></li>
            <li>Incassato precedente: <b>${esc(Core.formatEuro(prev.incassato))}</b></li>
            <li>Spese precedenti: <b>${esc(Core.formatEuro(prev.spese))}</b></li>
          </ul>
        </section>
      </div>`;
  };

  App.changes.dash = (el) => {
    const d = dash();
    const v = el.value;
    if (el.name === 'period') d.period = v;
    else if (el.name === 'year') d.year = Number(v);
    else if (el.name === 'month') d.month = Number(v);
    else if (el.name === 'q') d.q = Number(v);
    App.refresh();
  };

  // Esposto per i test e per l'eventuale uso da altre viste
  App.dashboardInternals = { periodSpec, defaultDash, yearOptions, compact, clientName };
})(typeof window !== 'undefined' ? window : globalThis);
