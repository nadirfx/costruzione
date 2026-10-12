/*
 * Risparmi (conto personale con obiettivo) e Investimenti ETF.
 * Dati personali: restano nel database locale, come il resto del gestionale.
 * I prezzi degli ETF li inserisci tu: nessuna quotazione online.
 */
(function (root) {
  'use strict';

  const { Core, UI, App, Risparmi } = root;
  const { esc, fmtDate } = UI;
  const V = App.views;

  const eur = (c) => Core.formatEuro(c);
  const pctTxt = (p) => Core.formatPercent(p);
  const toneOf = (v) => (v < 0 ? 'bad' : v > 0 ? 'good' : '');

  /* ============================== CONTO PERSONALE ============================== */
  const contoOf = () => ({ saldoIniziale: 0, obiettivoNome: '', obiettivoCents: 0, ...((App.settings().conto) || {}) });

  const MOV_FIELDS = [
    { name: 'date', label: 'Data', type: 'date', required: true },
    { name: 'tipo', label: 'Tipo', type: 'select', options: Object.entries(Risparmi.TIPI_MOVIMENTO), empty: false, required: true },
    { name: 'amount', label: 'Importo (€)', type: 'money', required: true },
    { name: 'nota', label: 'Nota', full: true, placeholder: 'es. stipendio, risparmio mensile, spesa straordinaria…' },
  ];

  const CONTO_FIELDS = [
    { name: 'saldoIniziale', label: 'Saldo di partenza (€)', type: 'money', hint: 'Il saldo che avevi prima di iniziare a registrare i movimenti' },
    { name: 'obiettivoNome', label: 'Obiettivo (nome)', placeholder: 'es. Fondo emergenza, casa, viaggio' },
    { name: 'obiettivoCents', label: 'Obiettivo (importo €)', type: 'money' },
  ];

  function movementsSorted() {
    return [...App.state.savings].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }

  V.risparmi = () => {
    const conto = contoOf();
    const movs = App.state.savings;
    const today = App.today();
    const saldo = Risparmi.savingsBalance(movs, conto.saldoIniziale, null);
    const tot = (tipo) => movs.filter((m) => m.tipo === tipo).reduce((s, m) => s + m.amountCents, 0);
    const versamenti = tot('versamento');
    const prelievi = tot('prelievo');
    const goal = Risparmi.goalProgress(saldo, conto.obiettivoCents);

    // ultimi 12 mesi che finiscono a oggi
    const cur = today.slice(0, 7);
    const months = Array.from({ length: 12 }, (_, i) => Core.shiftMonth(cur, i - 11));
    const byM = Risparmi.savingsByMonth(movs, months);
    // saldo a fine di ogni mese: partenza + tutti i movimenti fino a quella data
    const balanceSeries = months.map((m) => Risparmi.savingsBalance(movs, conto.saldoIniziale, Core.lastDayOf(m)));
    const labels = months.map((m) => Core.monthShort(m));

    const rows = movementsSorted().map((m) => `<tr>
      <td>${esc(fmtDate(m.date))}</td>
      <td>${tagBadge(m.tipo === 'prelievo' ? 'warn' : 'ok', Risparmi.TIPI_MOVIMENTO[m.tipo])}</td>
      <td>${esc(m.nota || '—')}</td>
      <td class="num"><b class="${m.tipo === 'prelievo' ? 'neg' : ''}">${m.tipo === 'prelievo' ? '−' : '+'}${esc(eur(m.amountCents))}</b></td>
      <td class="num row-actions"><button type="button" class="btn small ghost danger" data-action="mov-delete" data-id="${esc(m.id)}">Elimina</button></td>
    </tr>`);

    return `
      <header class="page-head">
        <div><p class="eyebrow">Conto principale · personale</p><h1>Risparmi</h1>
          <p class="muted">Il saldo del tuo conto personale e i tuoi obiettivi. Non è collegato alla contabilità dell’attività.</p></div>
        <div class="head-actions">
          <button type="button" class="btn" data-action="conto-edit">Impostazioni conto</button>
          <button type="button" class="btn primary" data-action="mov-new">+ Movimento</button>
        </div>
      </header>
      <section class="kpi-grid">
        <article class="kpi accent"><span class="kpi-label">Saldo attuale</span><strong class="kpi-value">${esc(eur(saldo))}</strong><span class="delta muted">partenza ${esc(eur(conto.saldoIniziale))}</span></article>
        <article class="kpi"><span class="kpi-label">Versamenti totali</span><strong class="kpi-value">${esc(eur(versamenti))}</strong></article>
        <article class="kpi"><span class="kpi-label">Prelievi totali</span><strong class="kpi-value">${esc(eur(prelievi))}</strong></article>
        <article class="kpi ${goal.raggiunto ? 'accent' : ''}"><span class="kpi-label">${conto.obiettivoCents ? esc(conto.obiettivoNome || 'Obiettivo') : 'Obiettivo'}</span>
          <strong class="kpi-value">${conto.obiettivoCents ? `${goal.pct}%` : '—'}</strong>
          ${conto.obiettivoCents ? `<div class="meter"><i style="width:${goal.pct}%"></i></div><span class="delta muted">${goal.raggiunto ? 'obiettivo raggiunto' : `mancano ${esc(eur(goal.mancano))} su ${esc(eur(conto.obiettivoCents))}`}</span>` : '<span class="delta muted">imposta un obiettivo in “Impostazioni conto”</span>'}
        </article>
      </section>
      <div class="two-col">
        <section class="card">
          <h3>Saldo a fine mese · ultimi 12 mesi</h3>
          ${App.lineSVG(labels, balanceSeries.map((v) => Math.max(0, v)), 'Saldo del conto a fine mese')}
        </section>
        <section class="card">
          <h3>Versamenti e prelievi · ultimi 12 mesi</h3>
          ${App.barsSVG(labels, [
            { name: 'Versamenti', cls: 'inc', values: months.map((m) => byM[m].versamenti) },
            { name: 'Prelievi', cls: 'fat', values: months.map((m) => byM[m].prelievi) },
          ], { ariaLabel: 'Versamenti e prelievi per mese', height: 220, fmt: (v) => (v / 100 >= 1000 ? `${Math.round(v / 100000)}k` : String(Math.round(v / 100))) })}
          <div class="legend"><span><i class="sw inc"></i>Versamenti</span><span><i class="sw fat"></i>Prelievi</span></div>
        </section>
      </div>
      <section class="card">
        <div class="section-head"><h3>Movimenti (${movs.length})</h3></div>
        ${movs.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Data</th><th>Tipo</th><th>Nota</th><th class="num">Importo</th><th></th></tr></thead><tbody>${rows.join('')}</tbody></table></div>` : UI.empty('Nessun movimento. Aggiungi un versamento per iniziare.')}
      </section>`;
  };

  App.actions['mov-new'] = () => {
    UI.modal({
      title: 'Nuovo movimento',
      body: `<form data-form="movimento" novalidate>
        ${UI.fieldsHTML(MOV_FIELDS, { date: App.today(), tipo: 'versamento' })}
        <div class="form-actions"><button type="button" class="btn ghost" data-modal-close>Annulla</button><button type="submit" class="btn primary">Salva</button></div>
      </form>`,
    });
  };

  App.forms.movimento = (form) =>
    UI.guard(form, async () => {
      const { values, errors } = UI.readFields(form, MOV_FIELDS);
      const rec = { date: values.date, tipo: values.tipo, amountCents: values.amount === null ? 0 : values.amount, nota: values.nota || '' };
      const all = [...errors, ...Risparmi.validateMovement(rec)];
      if (all.length) return UI.showErrors(form, all);
      await App.save('savings', rec);
      UI.closeModalOf(form);
      UI.toast('Movimento registrato');
      App.refresh();
    });

  App.actions['mov-delete'] = async (el) => {
    const m = App.byId('savings', el.dataset.id);
    if (!m) return;
    const ok = await UI.confirmDialog({ title: 'Eliminare il movimento?', message: `${Risparmi.TIPI_MOVIMENTO[m.tipo]} di ${eur(m.amountCents)} del ${fmtDate(m.date)}.`, confirmText: 'Elimina', danger: true });
    if (!ok) return;
    await App.remove('savings', m.id);
    UI.toast('Movimento eliminato');
    App.refresh();
  };

  App.actions['conto-edit'] = () => {
    const c = contoOf();
    UI.modal({
      title: 'Impostazioni conto',
      body: `<form data-form="conto" novalidate>
        ${UI.fieldsHTML(CONTO_FIELDS, { saldoIniziale: c.saldoIniziale, obiettivoNome: c.obiettivoNome, obiettivoCents: c.obiettivoCents })}
        <div class="form-actions"><button type="button" class="btn ghost" data-modal-close>Annulla</button><button type="submit" class="btn primary">Salva</button></div>
      </form>`,
    });
  };

  App.forms.conto = (form) =>
    UI.guard(form, async () => {
      const { values, errors } = UI.readFields(form, CONTO_FIELDS);
      if (values.saldoIniziale === null) values.saldoIniziale = 0;
      if (values.obiettivoCents === null) values.obiettivoCents = 0;
      if (values.obiettivoCents < 0) errors.push('L’obiettivo non può essere negativo.');
      if (errors.length) return UI.showErrors(form, errors);
      await App.saveSettings({ conto: { saldoIniziale: values.saldoIniziale, obiettivoNome: values.obiettivoNome || '', obiettivoCents: values.obiettivoCents } });
      UI.closeModalOf(form);
      UI.toast('Conto aggiornato');
      App.refresh();
    });

  /* ============================== ETF ============================== */
  const ETF_FIELDS = [
    { name: 'nome', label: 'Nome ETF', required: true, placeholder: 'es. Vanguard FTSE All-World' },
    { name: 'ticker', label: 'Ticker', placeholder: 'es. VWCE' },
    { name: 'isin', label: 'ISIN', placeholder: 'es. IE00BK5BQT80', hint: '12 caratteri, facoltativo' },
    { name: 'prezzo', label: 'Prezzo attuale per quota (€)', type: 'money', hint: 'Lo aggiorni tu dal broker: nessuna quotazione automatica' },
    { name: 'note', label: 'Note', type: 'textarea', full: true },
  ];

  const PRICE_FIELDS = [
    { name: 'prezzo', label: 'Prezzo attuale per quota (€)', type: 'money', required: true },
    { name: 'dataPrezzo', label: 'Data del prezzo', type: 'date', required: true },
  ];

  function etfChoices(selected) {
    return App.state.etfs.map((e) => [e.id, e.nome + (e.ticker ? ` (${e.ticker})` : '')]);
  }

  const OP_FIELDS = [
    { name: 'etfId', label: 'ETF', type: 'select', options: [], required: true },
    { name: 'tipo', label: 'Operazione', type: 'select', options: Object.entries(Risparmi.TIPI_OPERAZIONE), empty: false, required: true },
    { name: 'date', label: 'Data', type: 'date', required: true },
    { name: 'quantita', label: 'Quote', type: 'number', step: 'any', required: true, hint: 'Anche frazionarie: es. 0,4325' },
    { name: 'prezzo', label: 'Prezzo per quota (€)', type: 'money', required: true },
    { name: 'commissioni', label: 'Commissioni (€)', type: 'money', hint: 'Facoltative' },
    { name: 'note', label: 'Note', full: true },
  ];

  V.etf = () => {
    const pf = Risparmi.portfolio(App.state.etfs, App.state.investments);
    const t = pf.totali;
    const rows = pf.rows.map((r) => `<tr>
      <td><b>${esc(r.etf.nome)}</b><div class="muted small-note">${esc([r.etf.ticker, r.etf.isin].filter(Boolean).join(' · ') || '—')}</div></td>
      <td class="num">${r.quantita ? esc(String(r.quantita).replace('.', ',')) : '0'}</td>
      <td class="num">${r.quantita ? esc(eur(r.costoMedioCents)) : '—'}</td>
      <td class="num">${r.prezzoCents ? esc(eur(r.prezzoCents)) : '<span class="muted">non inserito</span>'}
        <div><button type="button" class="link-btn" data-action="etf-price" data-id="${esc(r.etf.id)}">aggiorna prezzo</button></div></td>
      <td class="num"><b>${esc(eur(r.valoreCents))}</b></td>
      <td class="num"><span class="${toneOf(r.plusCents)}">${esc(eur(r.plusCents))}</span><div class="small-note ${toneOf(r.plusCents)}">${esc(pctTxt(r.plusPct))}</div></td>
      <td class="num">${esc(String(r.quotaPct).replace('.', ','))}%</td>
      <td class="num row-actions"><button type="button" class="btn small ghost" data-action="etf-edit" data-id="${esc(r.etf.id)}">Modifica</button></td>
    </tr>`);
    const ops = [...App.state.investments].sort((a, b) => (a.date < b.date ? 1 : -1));
    const etfName = (id) => {
      const e = App.byId('etfs', id);
      return e ? e.nome : '—';
    };
    const opRows = ops.map((o) => {
      const tot = Math.round(Number(o.quantita) * o.prezzoCents) + (o.commissioniCents || 0) * (o.tipo === 'acquisto' ? 1 : -1);
      return `<tr>
        <td>${esc(fmtDate(o.date))}</td>
        <td>${esc(etfName(o.etfId))}</td>
        <td>${tagBadge(o.tipo === 'vendita' ? 'warn' : 'ok', Risparmi.TIPI_OPERAZIONE[o.tipo])}</td>
        <td class="num">${esc(String(o.quantita).replace('.', ','))}</td>
        <td class="num">${esc(eur(o.prezzoCents))}</td>
        <td class="num">${esc(eur(o.commissioniCents || 0))}</td>
        <td class="num"><b>${esc(eur(Math.abs(tot)))}</b></td>
        <td class="num row-actions"><button type="button" class="btn small ghost danger" data-action="op-delete" data-id="${esc(o.id)}">Elimina</button></td>
      </tr>`;
    });
    const alloc = pf.rows.filter((r) => r.valoreCents > 0).map((r) => `<li>
        <div class="bars-row"><span>${esc(r.etf.nome)}</span><b>${esc(String(r.quotaPct).replace('.', ','))}%</b></div>
        <div class="meter"><i style="width:${r.quotaPct}%"></i></div></li>`).join('');
    return `
      <header class="page-head">
        <div><p class="eyebrow">Investimenti</p><h1>ETF</h1>
          <p class="muted">Costo medio, valore e plus/minusvalenze. Il valore usa i prezzi che inserisci tu.</p></div>
        <div class="head-actions">
          <a class="btn" href="#/investimenti">Vista portafoglio ✦</a>
          <button type="button" class="btn" data-action="etf-new">+ ETF</button>
          <button type="button" class="btn primary" data-action="op-new">+ Operazione</button>
        </div>
      </header>
      <section class="kpi-grid">
        <article class="kpi accent"><span class="kpi-label">Valore portafoglio</span><strong class="kpi-value">${esc(eur(t.valore))}</strong></article>
        <article class="kpi"><span class="kpi-label">Costo delle quote in mano</span><strong class="kpi-value">${esc(eur(t.costo))}</strong><span class="delta muted">investito in totale ${esc(eur(t.investitoTotale))}</span></article>
        <article class="kpi ${toneOf(t.plus)}"><span class="kpi-label">Plus / minusvalenza</span><strong class="kpi-value">${esc(eur(t.plus))}</strong><span class="delta ${toneOf(t.plus)}">${esc(pctTxt(t.plusPct))}</span></article>
        <article class="kpi ${toneOf(t.realizzato)}"><span class="kpi-label">Realizzato dalle vendite</span><strong class="kpi-value">${esc(eur(t.realizzato))}</strong></article>
      </section>
      <div class="two-col">
        <section class="card"><h3>Allocazione</h3>${alloc ? `<ul class="bars-list">${alloc}</ul>` : '<p class="muted">Aggiungi un’operazione per vedere la ripartizione.</p>'}</section>
        <section class="card"><h3>Come leggere i numeri</h3>
          <ul class="plain-list small-note">
            <li><b>Costo medio</b>: prezzo medio di carico, commissioni incluse.</li>
            <li><b>Plus/minusvalenza</b>: valore attuale − costo delle quote in mano (non ancora incassato).</li>
            <li><b>Realizzato</b>: utile o perdita già incassati con le vendite.</li>
            <li>Questo gestionale non è un consulente finanziario: sono solo conti sui dati che inserisci.</li>
          </ul></section>
      </div>
      <section class="card">
        <div class="section-head"><h3>Posizioni</h3></div>
        ${App.state.etfs.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>ETF</th><th class="num">Quote</th><th class="num">Costo medio</th><th class="num">Prezzo attuale</th><th class="num">Valore</th><th class="num">P/L</th><th class="num">Quota</th><th></th></tr></thead><tbody>${rows.join('')}</tbody></table></div>` : UI.empty('Nessun ETF. Aggiungine uno con “+ ETF”.')}
      </section>
      <section class="card">
        <div class="section-head"><h3>Operazioni (${App.state.investments.length})</h3></div>
        ${opRows.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Data</th><th>ETF</th><th>Tipo</th><th class="num">Quote</th><th class="num">Prezzo</th><th class="num">Commissioni</th><th class="num">Totale</th><th></th></tr></thead><tbody>${opRows.join('')}</tbody></table></div>` : UI.empty('Nessuna operazione. Registra il primo acquisto.')}
      </section>`;
  };

  // Etichetta colorata per tipo di movimento/operazione
  function tagBadge(tone, label) {
    const cls = { ok: 'ok', warn: 'warn', bad: 'danger' }[tone] || 'muted';
    return `<span class="badge ${cls}">${esc(label)}</span>`;
  }

  App.actions['etf-new'] = () => openEtfModal(null);
  App.actions['etf-edit'] = (el) => openEtfModal(App.byId('etfs', el.dataset.id));

  function openEtfModal(e) {
    const values = e ? { nome: e.nome, ticker: e.ticker || '', isin: e.isin || '', prezzo: e.prezzoAttualeCents ?? null, note: e.note || '' } : {};
    UI.modal({
      title: e ? `Modifica · ${e.nome}` : 'Nuovo ETF',
      body: `<form data-form="etf" data-id="${esc(e ? e.id : '')}" novalidate>
        ${UI.fieldsHTML(ETF_FIELDS, values)}
        <div class="form-actions"><button type="button" class="btn ghost" data-modal-close>Annulla</button><button type="submit" class="btn primary">Salva ETF</button></div>
      </form>`,
    });
  }

  App.forms.etf = (form) =>
    UI.guard(form, async () => {
      const { values, errors } = UI.readFields(form, ETF_FIELDS.map((f) => (f.name === 'nome' ? { ...f, required: false } : f)));
      const existing = form.dataset.id ? App.byId('etfs', form.dataset.id) : null;
      const rec = {
        ...(existing || {}),
        nome: values.nome,
        ticker: (values.ticker || '').toUpperCase(),
        isin: (values.isin || '').toUpperCase().replace(/\s/g, ''),
        prezzoAttualeCents: values.prezzo === null ? 0 : values.prezzo,
        dataPrezzo: existing && existing.dataPrezzo ? existing.dataPrezzo : '',
        note: values.note || '',
      };
      const all = [...errors, ...Risparmi.validateEtf(rec)];
      if (all.length) return UI.showErrors(form, all);
      await App.save('etfs', rec);
      UI.closeModalOf(form);
      UI.toast('ETF salvato');
      App.refresh();
    });

  App.actions['etf-price'] = (el) => {
    const e = App.byId('etfs', el.dataset.id);
    if (!e) return;
    UI.modal({
      title: `Prezzo · ${e.nome}`,
      size: 'small',
      body: `<form data-form="etf-price" data-id="${esc(e.id)}" novalidate>
        ${UI.fieldsHTML(PRICE_FIELDS, { prezzo: e.prezzoAttualeCents || null, dataPrezzo: App.today() })}
        <div class="form-actions"><button type="button" class="btn ghost" data-modal-close>Annulla</button><button type="submit" class="btn primary">Aggiorna</button></div>
      </form>`,
    });
  };

  App.forms['etf-price'] = (form) =>
    UI.guard(form, async () => {
      const { values, errors } = UI.readFields(form, PRICE_FIELDS);
      const e = App.byId('etfs', form.dataset.id);
      if (!e) return;
      if (values.prezzo !== null && values.prezzo <= 0) errors.push('Il prezzo deve essere maggiore di zero.');
      if (values.dataPrezzo && !Core.isValidISODate(values.dataPrezzo)) errors.push('Data non valida.');
      if (errors.length) return UI.showErrors(form, errors);
      await App.save('etfs', { ...e, prezzoAttualeCents: values.prezzo, dataPrezzo: values.dataPrezzo });
      UI.closeModalOf(form);
      UI.toast('Prezzo aggiornato');
      App.refresh();
    });

  App.actions['op-new'] = () => {
    if (!App.state.etfs.length) {
      UI.toast('Prima aggiungi un ETF con “+ ETF”.', 'err');
      return;
    }
    const fields = OP_FIELDS.map((f) => (f.name === 'etfId' ? { ...f, options: etfChoices() } : f));
    UI.modal({
      title: 'Nuova operazione',
      body: `<form data-form="operazione" novalidate>
        ${UI.fieldsHTML(fields, { tipo: 'acquisto', date: App.today() })}
        <div class="form-actions"><button type="button" class="btn ghost" data-modal-close>Annulla</button><button type="submit" class="btn primary">Salva operazione</button></div>
      </form>`,
    });
  };

  App.forms.operazione = (form) =>
    UI.guard(form, async () => {
      const fields = OP_FIELDS.map((f) => (f.name === 'etfId' ? { ...f, options: etfChoices() } : f));
      const { values, errors } = UI.readFields(form, fields);
      const rec = {
        etfId: values.etfId,
        date: values.date,
        tipo: values.tipo,
        quantita: values.quantita === null ? 0 : values.quantita,
        prezzoCents: values.prezzo === null ? 0 : values.prezzo,
        commissioniCents: values.commissioni === null ? 0 : values.commissioni,
        note: values.note || '',
      };
      const all = [...errors, ...Risparmi.validateInvestment(rec, App.state.investments)];
      if (!App.byId('etfs', rec.etfId)) all.push('Seleziona un ETF.');
      if (all.length) return UI.showErrors(form, all);
      await App.save('investments', rec);
      UI.closeModalOf(form);
      UI.toast('Operazione registrata');
      App.refresh();
    });

  App.actions['op-delete'] = async (el) => {
    const o = App.byId('investments', el.dataset.id);
    if (!o) return;
    // Non si può cancellare un acquisto se poi ci sono vendite che dipendono da lui
    const after = App.state.investments.filter((x) => x.id !== o.id);
    const broken = after.some((v) => v.tipo === 'vendita' && Risparmi.validateInvestment(v, after, v.id).length > 0);
    if (broken) {
      UI.toast('Non si può eliminare: alcune vendite successive diventerebbero impossibili.', 'err');
      return;
    }
    const ok = await UI.confirmDialog({ title: 'Eliminare l’operazione?', message: `${Risparmi.TIPI_OPERAZIONE[o.tipo]} di ${o.quantita} quote del ${fmtDate(o.date)}. Il costo medio verrà ricalcolato.`, confirmText: 'Elimina', danger: true });
    if (!ok) return;
    await App.remove('investments', o.id);
    UI.toast('Operazione eliminata');
    App.refresh();
  };

  // Patrimonio: conto + ETF, usato in dashboard
  App.patrimonio = () => {
    const conto = contoOf();
    const saldo = Risparmi.savingsBalance(App.state.savings, conto.saldoIniziale, null);
    const etf = Risparmi.portfolio(App.state.etfs, App.state.investments).totali.valore;
    return { conto: saldo, etf, totale: saldo + etf };
  };

})(typeof window !== 'undefined' ? window : globalThis);
