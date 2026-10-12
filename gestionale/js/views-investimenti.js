/*
 * Portafoglio ETF: pagina dedicata e visiva. Legge gli stessi dati di "ETF" e "Risparmi":
 * ogni modifica fatta lì si vede qui al refresh, nessun dato duplicato.
 * La pagina ETF e la dashboard restano invariate.
 */
(function (root) {
  'use strict';

  const { Core, UI, App, Risparmi } = root;
  const { esc, fmtDate } = UI;
  const V = App.views;

  const eur = (c) => Core.formatEuro(c);
  const pct = (p) => Core.formatPercent(p);
  const PALETTE = ['#5ee7ff', '#9b7bff', '#ff7ab6', '#3ddc97', '#ffc15e', '#6ea8ff', '#ff8a5c', '#c3f56b'];

  function donut(segments, centerLabel, centerValue) {
    const R = 15.915;
    let acc = 0;
    const arcs = segments.map((s, i) => {
      const dash = `${s.pct} ${100 - s.pct}`;
      const offset = -acc;
      acc += s.pct;
      return `<circle class="seg" r="${R}" cx="21" cy="21" pathLength="100" stroke="${PALETTE[i % PALETTE.length]}"
        stroke-dasharray="${dash}" stroke-dashoffset="${offset}" style="animation-delay:${i * 140}ms"><title>${esc(s.label)}: ${esc(String(s.pct).replace('.', ','))}%</title></circle>`;
    }).join('');
    return `<svg class="donut" viewBox="0 0 42 42" role="img" aria-label="Allocazione del portafoglio">
      <circle class="track" r="${R}" cx="21" cy="21"></circle>${arcs}
      <text x="21" y="20" text-anchor="middle" class="d-val">${esc(centerValue)}</text>
      <text x="21" y="26" text-anchor="middle" class="d-lbl">${esc(centerLabel)}</text></svg>`;
  }

  function gauge(p) {
    const clamped = Math.max(-100, Math.min(100, p));
    const len = 100;
    const fill = Math.min(100, Math.abs(clamped));
    const tone = p >= 0 ? 'good' : 'bad';
    return `<svg class="gauge ${tone}" viewBox="0 0 120 70" role="img" aria-label="Rendimento ${esc(pct(p))}">
      <path class="g-track" d="M10,60 A50,50 0 0 1 110,60" pathLength="${len}"></path>
      <path class="g-fill" d="M10,60 A50,50 0 0 1 110,60" pathLength="${len}" stroke-dasharray="${fill} ${len}"></path>
      <text x="60" y="52" text-anchor="middle" class="g-val">${esc(pct(p))}</text>
      <text x="60" y="66" text-anchor="middle" class="g-lbl">rendimento</text></svg>`;
  }

  function monthsWindow(n = 12) {
    const cur = App.today().slice(0, 7);
    return Array.from({ length: n }, (_, i) => Core.shiftMonth(cur, i - (n - 1)));
  }

  function emptyState() {
    return `
      <div class="inv-empty">
        <div class="inv-orb" aria-hidden="true"></div>
        <h1>Il tuo portafoglio ETF</h1>
        <p class="muted">Aggiungi il primo ETF e il primo acquisto: qui vedrai valore, costo medio, plus/minusvalenze e la crescita nel tempo.</p>
        <div class="head-actions"><a class="btn primary" href="#/etf">Vai alla gestione ETF</a></div>
      </div>`;
  }

  V.investimenti = () => {
    if (!App.state.etfs.length) return emptyState();
    const etfIds = App.state.etfs.map((e) => e.id);
    const pf = Risparmi.portfolio(App.state.etfs, App.state.investments);
    const t = pf.totali;
    const held = pf.rows.filter((r) => r.quantita > 0);
    const months = monthsWindow(12);
    const costSeries = Risparmi.holdingsCostSeries(App.state.investments, etfIds, months);
    const contrib = Risparmi.monthlyContributions(App.state.investments, months);
    const contribValues = months.map((m) => contrib[m]);
    const contribTot = contribValues.reduce((s, v) => s + v, 0);
    const contribMonths = contribValues.filter((v) => v > 0).length;
    const avgMonthly = contribMonths ? Math.round(contribTot / contribMonths) : 0;
    const firstOp = [...App.state.investments].sort((a, b) => (a.date < b.date ? -1 : 1))[0];
    const realizedAll = t.realizzato;
    const gaugeVal = t.plusPct;
    const segs = held
      .filter((r) => r.valoreCents > 0)
      .map((r) => ({ label: r.etf.nome, pct: r.quotaPct, valore: r.valoreCents }));

    const cards = pf.rows.map((r, i) => {
      const diff = r.prezzoCents && r.costoMedioCents ? r.prezzoCents - r.costoMedioCents : 0;
      const up = diff >= 0;
      const bar = Math.max(4, Math.min(100, r.quotaPct));
      return `<article class="inv-card" style="--i:${i}; --c:${PALETTE[i % PALETTE.length]}">
        <header><div><span class="inv-dot"></span><b>${esc(r.etf.nome)}</b></div>
          <span class="inv-tkr">${esc(r.etf.ticker || '')}</span></header>
        <div class="inv-val">${esc(eur(r.valoreCents))}</div>
        <div class="inv-row"><span>Quote</span><b>${esc(String(r.quantita).replace('.', ','))}</b></div>
        <div class="inv-row"><span>Costo medio</span><b>${r.quantita ? esc(eur(r.costoMedioCents)) : '—'}</b></div>
        <div class="inv-row"><span>Prezzo attuale</span><b>${r.prezzoCents ? esc(eur(r.prezzoCents)) : 'non inserito'}</b></div>
        ${r.quantita && r.prezzoCents ? `<div class="inv-pl ${up ? 'good' : 'bad'}"><span>${up ? '▲' : '▼'} ${esc(eur(Math.abs(Math.round(diff * r.quantita))))}</span> <small>${esc(pct(r.plusPct))}</small></div>` : ''}
        <div class="inv-bar" title="Quota nel portafoglio"><i style="width:${bar}%"></i></div>
        <div class="inv-foot">${esc(String(r.quotaPct).replace('.', ','))}% del portafoglio</div>
      </article>`;
    }).join('');

    const timeline = [...App.state.investments]
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 12)
      .map((o, i) => {
        const e = App.byId('etfs', o.etfId);
        const importo = Math.round(Number(o.quantita) * o.prezzoCents) + (o.commissioniCents || 0);
        return `<li style="--d:${i * 70}ms" class="${o.tipo}">
          <span class="tl-dot"></span>
          <div><b>${o.tipo === 'vendita' ? 'Vendita' : 'Acquisto'}</b> · ${esc(e ? e.nome : '—')}
            <div class="muted small-note">${esc(fmtDate(o.date))} · ${esc(String(o.quantita).replace('.', ','))} quote a ${esc(eur(o.prezzoCents))}</div></div>
          <b class="${o.tipo === 'vendita' ? 'neg' : ''}">${o.tipo === 'vendita' ? '−' : '+'}${esc(eur(importo))}</b></li>`;
      }).join('');

    const projDefaults = { mensile: 200, rendimento: 6, anni: 15 };
    const startCents = t.valore;

    return `
      <header class="inv-hero">
        <div class="inv-hero-bg" aria-hidden="true"><i></i><i></i><i></i></div>
        <div class="inv-hero-copy">
          <p class="eyebrow">Portafoglio ETF · ${esc(App.today().slice(0, 4))}</p>
          <h1 class="inv-title">Il tuo patrimonio investito</h1>
          <div class="inv-big" data-count-eur="${t.valore}">${esc(eur(t.valore))}</div>
          <p class="inv-sub">
            <span class="pill ${t.plus >= 0 ? 'good' : 'bad'}">${t.plus >= 0 ? '▲' : '▼'} ${esc(eur(Math.abs(t.plus)))} · ${esc(pct(t.plusPct))}</span>
            <span class="muted">rispetto al costo di ${esc(eur(t.costo))}</span>
          </p>
        </div>
        <div class="inv-hero-gauge">${gauge(gaugeVal)}</div>
      </header>

      <section class="inv-stats stagger">
        <article class="inv-stat"><span>Investito in totale</span><b data-count-eur="${t.investitoTotale}">${esc(eur(t.investitoTotale))}</b></article>
        <article class="inv-stat"><span>Realizzato dalle vendite</span><b class="${realizedAll >= 0 ? 'good' : 'bad'}">${esc(eur(realizedAll))}</b></article>
        <article class="inv-stat"><span>Versato ultimi 12 mesi</span><b>${esc(eur(contribTot))}</b><small>${contribMonths} mesi con acquisti</small></article>
        <article class="inv-stat"><span>Media mensile reale</span><b>${esc(eur(avgMonthly))}</b><small>solo mesi con acquisti</small></article>
        <article class="inv-stat"><span>ETF in portafoglio</span><b>${held.length}</b><small>${firstOp ? `dal ${esc(fmtDate(firstOp.date))}` : ''}</small></article>
      </section>

      <div class="inv-grid">
        <section class="card inv-panel">
          <div class="section-head"><h3>Allocazione</h3></div>
          <div class="donut-wrap">
            ${segs.length ? donut(segs, 'ETF', `${segs.length}`) : '<p class="muted">Nessuna quota in portafoglio.</p>'}
            <ul class="legend-list">${segs.map((s, i) => `<li><i style="background:${PALETTE[i % PALETTE.length]}"></i>${esc(s.label)}<b>${esc(String(s.pct).replace('.', ','))}%</b></li>`).join('')}</ul>
          </div>
        </section>
        <section class="card inv-panel wide">
          <div class="section-head"><h3>Capitale in mano nel tempo</h3><span class="muted small-note">costo delle quote ancora possedute, fine mese</span></div>
          ${App.lineSVG(months.map((m) => Core.monthShort(m)), costSeries, 'Costo delle quote in mano per mese')}
        </section>
      </div>

      <section class="card inv-panel">
        <div class="section-head"><h3>Versamenti mensili · ultimi 12 mesi</h3></div>
        ${App.barsSVG(months.map((m) => Core.monthShort(m)), [{ name: 'Versato', cls: 'inc', values: contribValues }], { ariaLabel: 'Versamenti mensili negli ultimi 12 mesi', height: 220, fmt: (v) => (v / 100 >= 1000 ? `${Math.round(v / 100000)}k` : String(Math.round(v / 100))) })}
      </section>

      <section class="inv-cards stagger">${cards || UI.empty('Nessuna posizione.')}</section>

      <section class="card inv-panel">
        <div class="section-head"><h3>Simulatore · quanto potrebbe diventare</h3>
          <span class="muted small-note">Simulazione a interesse composto. Non è una previsione: il rendimento lo scegli tu.</span></div>
        <form class="sim-form" data-input="proj" aria-label="Parametri simulazione">
          <label class="sim-field"><span>Versamento mensile <b data-out="mensile">${esc(eur(projDefaults.mensile * 100))}</b></span>
            <input type="range" min="0" max="2000" step="10" value="${projDefaults.mensile}" name="mensile"></label>
          <label class="sim-field"><span>Rendimento annuo ipotizzato <b data-out="rendimento">${esc(projDefaults.rendimento)}%</b></span>
            <input type="range" min="0" max="12" step="0.5" value="${projDefaults.rendimento}" name="rendimento"></label>
          <label class="sim-field"><span>Orizzonte <b data-out="anni">${projDefaults.anni} anni</b></span>
            <input type="range" min="1" max="40" step="1" value="${projDefaults.anni}" name="anni"></label>
          <input type="hidden" name="start" value="${startCents}">
        </form>
        <div id="sim-out">${simOutput(startCents, projDefaults.mensile * 100, projDefaults.rendimento, projDefaults.anni)}</div>
      </section>

      <section class="card inv-panel">
        <div class="section-head"><h3>Ultime operazioni</h3></div>
        ${timeline ? `<ol class="inv-timeline">${timeline}</ol>` : UI.empty('Nessuna operazione.')}
      </section>

      <p class="muted small-note inv-disc">Valori calcolati sui prezzi che inserisci tu. Questa pagina non è consulenza finanziaria.</p>`;
  };

  function simOutput(startCents, monthlyCents, rate, years) {
    const pts = Risparmi.projectGrowth({ startCents, monthlyCents, annualRatePct: rate, years });
    const last = pts[pts.length - 1];
    const labels = pts.map((p) => (p.anno % 5 === 0 || p.anno === years ? `${p.anno}a` : ''));
    return `
      <div class="sim-kpis">
        <article><span>Valore a ${years} anni</span><b data-count-eur="${last.valore}">${esc(eur(last.valore))}</b></article>
        <article><span>Versato</span><b>${esc(eur(last.versato))}</b></article>
        <article class="good"><span>Interessi stimati</span><b>${esc(eur(last.interessi))}</b></article>
      </div>
      ${App.lineSVG(labels, pts.map((p) => p.valore), `Crescita simulata in ${years} anni`)}`;
  }

  App.inputs.proj = (el) => {
    const form = el.closest('form') || el;
    const v = (n) => Number(form.elements[n].value);
    const mensile = v('mensile');
    const rendimento = v('rendimento');
    const anni = v('anni');
    const start = Number(form.elements.start.value) || 0;
    form.querySelector('[data-out="mensile"]').textContent = eur(mensile * 100);
    form.querySelector('[data-out="rendimento"]').textContent = `${String(rendimento).replace('.', ',')}%`;
    form.querySelector('[data-out="anni"]').textContent = `${anni} ${anni === 1 ? 'anno' : 'anni'}`;
    const out = document.getElementById('sim-out');
    if (out) out.innerHTML = simOutput(start, mensile * 100, rendimento, anni);
  };

  App.views.investimenti = V.investimenti;
})(typeof window !== 'undefined' ? window : globalThis);
