/*
 * Fatture, incassi (pagamenti) e spese.
 * Regole chiave (applicate in core.js):
 *  - una fattura emessa non si cancella: si annulla (il numero resta bruciato);
 *  - si cancella solo una bozza senza incassi;
 *  - un incasso collegato a una fattura non può superare il residuo;
 *  - i numeri fattura sono progressivi per anno e unici.
 */
(function (root) {
  'use strict';

  const { Core, UI, App } = root;
  const { esc, fmtDate, badge } = UI;
  const V = App.views;

  const STATO_FILTRI = [
    ['', 'Tutte'],
    ['emessa', 'Da pagare'],
    ['parziale', 'Pagate in parte'],
    ['scaduta', 'Scadute'],
    ['pagata', 'Pagate'],
    ['bozza', 'Bozze'],
    ['annullata', 'Annullate'],
  ];

  const currentYear = () => new Date().getFullYear();

  function yearChoices() {
    const ys = new Set([currentYear(), currentYear() + 1]);
    for (const i of App.state.invoices) ys.add(Number(i.issueDate.slice(0, 4)));
    for (const p of App.state.payments) ys.add(Number(p.date.slice(0, 4)));
    for (const e of App.state.expenses) ys.add(Number(e.date.slice(0, 4)));
    return [...ys].sort((a, b) => b - a);
  }

  function yearSelect(name, value, changeKey, withAll) {
    const opts = yearChoices().map((y) => `<option value="${y}"${String(y) === String(value) ? ' selected' : ''}>${y}</option>`);
    if (withAll) opts.unshift(`<option value=""${value === '' ? ' selected' : ''}>Tutti gli anni</option>`);
    return `<label class="field"><span class="lbl">Anno</span><select name="${name}" data-change="${changeKey}">${opts.join('')}</select></label>`;
  }

  const invoiceOf = (id) => App.byId('invoices', id);

  function paymentsOf(invoiceId) {
    return App.state.payments.filter((p) => p.invoiceId === invoiceId);
  }

  function projectOptions(clientId) {
    return App.state.projects
      .filter((p) => p.clientId === clientId)
      .map((p) => [p.id, p.titolo]);
  }

  /* ------------------------------ Elenco fatture ------------------------------ */
  function invoiceRows() {
    const today = App.today();
    const year = App.ui.invYear === null ? currentYear() : App.ui.invYear;
    const stato = App.ui.invStato;
    const q = (App.ui.invSearch || '').trim().toLowerCase();
    const list = App.state.invoices
      .filter((i) => year === '' || Number(i.issueDate.slice(0, 4)) === Number(year))
      .map((i) => {
        const c = App.clientOf(i.clientId);
        return { i, c, st: Core.invoiceState(i, App.state.payments, today) };
      })
      .filter(({ st }) => !stato || st.code === stato)
      .filter(({ i, c }) => !q || `${i.number} ${c ? App.clientName(c) : ''}`.toLowerCase().includes(q))
      .sort((a, b) => (a.i.issueDate < b.i.issueDate ? 1 : a.i.issueDate > b.i.issueDate ? -1 : (a.i.number < b.i.number ? 1 : -1)));
    if (!list.length) return `<tr><td colspan="8">${UI.empty('Nessuna fattura con questi filtri.')}</td></tr>`;
    return list.map(({ i, c, st }) => `
      <tr class="click" data-href="#/fatture/${esc(i.id)}">
        <td><a href="#/fatture/${esc(i.id)}"><b>${esc(i.number)}</b></a></td>
        <td>${esc(fmtDate(i.issueDate))}</td>
        <td>${esc(c ? App.clientName(c) : '—')}</td>
        <td>${esc(fmtDate(i.dueDate))}</td>
        <td class="num">${esc(Core.formatEuro(st.totale))}</td>
        <td class="num">${esc(Core.formatEuro(st.paid))}</td>
        <td class="num">${esc(Core.formatEuro(st.residuo > 0 ? st.residuo : 0))}</td>
        <td>${badge(st.code, st.label)}</td>
      </tr>`).join('') + `<tr class="total-row"><td colspan="4"><b>Totale elenco</b></td>${totalsCells(list)}</tr>`;
  }

  function totalsCells(list) {
    const tot = list.reduce((s, x) => s + x.st.totale, 0);
    const paid = list.reduce((s, x) => s + x.st.paid, 0);
    const res = list.reduce((s, x) => s + (x.st.residuo > 0 ? x.st.residuo : 0), 0);
    return `<td class="num"><b>${esc(Core.formatEuro(tot))}</b></td><td class="num"><b>${esc(Core.formatEuro(paid))}</b></td><td class="num"><b>${esc(Core.formatEuro(res))}</b></td><td></td>`;
  }

  V.fattureList = () => {
    const year = App.ui.invYear === null ? currentYear() : App.ui.invYear;
    return `
      <header class="page-head">
        <div><p class="eyebrow">Fatturazione</p><h1>Fatture</h1>
          <p class="muted">Numerazione progressiva per anno. Le fatture annullate restano nell’elenco.</p></div>
        <div class="head-actions"><a class="btn primary" href="#/fatture/nuova">+ Nuova fattura</a></div>
      </header>
      <div class="toolbar">
        ${yearSelect('year', year, 'inv-year', true)}
        <label class="field"><span class="lbl">Stato</span>
          <select name="stato" data-change="inv-stato">${STATO_FILTRI.map(([v, l]) => `<option value="${v}"${v === App.ui.invStato ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></label>
        <label class="field grow"><span class="lbl">Cerca</span>
          <input type="search" value="${esc(App.ui.invSearch)}" placeholder="Numero o cliente…" data-input="inv-search" aria-label="Cerca fattura"></label>
      </div>
      <div class="table-wrap"><table class="table">
        <thead><tr><th>Numero</th><th>Emissione</th><th>Cliente</th><th>Scadenza</th><th class="num">Totale</th><th class="num">Incassato</th><th class="num">Residuo</th><th>Stato</th></tr></thead>
        <tbody id="inv-rows">${invoiceRows()}</tbody>
      </table></div>`;
  };

  App.changes['inv-year'] = (el) => {
    App.ui.invYear = el.value === '' ? '' : Number(el.value);
    App.refresh();
  };
  App.changes['inv-stato'] = (el) => {
    App.ui.invStato = el.value;
    App.refresh();
  };
  App.inputs['inv-search'] = (el) => {
    App.ui.invSearch = el.value;
    const tb = UI.$('#inv-rows');
    if (tb) tb.innerHTML = invoiceRows();
  };

  /* ------------------------------ Form fattura ------------------------------ */
  function rowHTML(r = {}) {
    const qta = r.quantita === undefined || r.quantita === null ? '1' : String(r.quantita).replace('.', ',');
    const prezzo = r.prezzoCents === undefined || r.prezzoCents === null ? '' : Core.centsToPlain(r.prezzoCents);
    return `
      <div class="riga">
        <label class="field grow"><span class="lbl">Descrizione</span>
          <input name="rdesc" value="${esc(r.descrizione || '')}" placeholder="es. Spot video 30 secondi, montaggio, ore AI…" data-required-row></label>
        <label class="field narrow"><span class="lbl">Quantità</span>
          <input name="rqta" value="${esc(qta)}" inputmode="decimal"></label>
        <label class="field narrow"><span class="lbl">Prezzo unitario (€)</span>
          <input name="rprezzo" data-type="money" value="${esc(prezzo)}" inputmode="decimal" placeholder="0,00"></label>
        <div class="riga-tot"><span class="lbl">Importo</span><b data-riga-tot>—</b></div>
        <button type="button" class="btn small ghost danger" data-action="invoice-row-remove" aria-label="Rimuovi riga">✕</button>
      </div>`;
  }

  function parseQta(txt) {
    const s = String(txt || '').trim().replace(',', '.');
    if (s === '') return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  // Legge le righe dal DOM. Le righe vuote vengono ignorate.
  function rowsFromForm(form) {
    return [...form.querySelectorAll('.riga')]
      .map((row) => ({
        descrizione: row.querySelector('[name="rdesc"]').value.trim(),
        quantita: parseQta(row.querySelector('[name="rqta"]').value),
        prezzoCents: Core.parseEuroToCents(row.querySelector('[name="rprezzo"]').value),
        _raw: row,
      }))
      .filter((r) => r.descrizione || r.quantita !== null || r.prezzoCents !== null);
  }

  function updateTotals(form) {
    const rows = rowsFromForm(form);
    for (const r of rows) {
      const cell = r._raw.querySelector('[data-riga-tot]');
      if (r.quantita !== null && r.prezzoCents !== null) cell.textContent = Core.formatEuro(Math.round(r.quantita * r.prezzoCents));
      else cell.textContent = '—';
    }
    const rate = parseQta(form.elements.ivaRate.value);
    const valid = rows.filter((r) => r.quantita !== null && r.prezzoCents !== null);
    const t = Core.invoiceTotals({ righe: valid, ivaRate: rate === null ? 0 : rate });
    const box = form.querySelector('[data-totals]');
    if (box) {
      box.innerHTML = `
        <div><span>Imponibile</span><b>${esc(Core.formatEuro(t.imponibile))}</b></div>
        <div><span>IVA ${esc(String(rate === null ? 0 : rate).replace('.', ','))}%</span><b>${esc(Core.formatEuro(t.iva))}</b></div>
        <div class="grand"><span>Totale fattura</span><b>${esc(Core.formatEuro(t.totale))}</b></div>`;
    }
  }

  function invoiceFields(clients) {
    return [
      { name: 'clientId', label: 'Cliente', type: 'select', options: clients, required: true, full: false },
      { name: 'projectId', label: 'Progetto (facoltativo)', type: 'select', options: [], empty: '— nessuno —' },
      { name: 'number', label: 'Numero', required: true, hint: 'Formato AAAA/001, progressivo' },
      { name: 'issueDate', label: 'Data emissione', type: 'date', required: true },
      { name: 'dueDate', label: 'Scadenza pagamento', type: 'date', required: true },
      { name: 'ivaRate', label: 'Aliquota IVA %', type: 'number', step: '0.01', min: 0, required: true, hint: 'Usa 0 se in regime forfettario' },
    ];
  }

  V.fatturaForm = (id) => {
    const existing = id ? invoiceOf(id) : null;
    if (id && !existing) return `<div class="alert warn">Fattura non trovata. <a href="#/fatture">Torna all’elenco</a>.</div>`;
    if (existing && existing.stato === 'annullata') return `<div class="alert warn">Le fatture annullate non si modificano. <a href="#/fatture/${esc(existing.id)}">Torna alla fattura</a>.</div>`;
    const s = App.settings();
    const pre = App.ui.prefillClient || '';
    App.ui.prefillClient = null;
    const today = App.today();
    const issueDate = existing ? existing.issueDate : today;
    const clientId = existing ? existing.clientId : pre;
    const values = existing
      ? { ...existing, ivaRate: existing.ivaRate, stato: existing.stato === 'bozza' }
      : {
          clientId,
          projectId: '',
          number: Core.nextInvoiceNumber(Number(issueDate.slice(0, 4)), App.state.invoices),
          issueDate,
          dueDate: Core.addDays(issueDate, s.giorniScadenza || 30),
          ivaRate: s.ivaDefault,
          stato: false,
        };
    const righe = existing ? existing.righe : [{ descrizione: '', quantita: 1, prezzoCents: null }];
    const fields = invoiceFields(App.clientOptions(clientId)).map((f) =>
      f.name === 'projectId' ? { ...f, options: projectOptions(clientId) } : f
    );
    const rowsHTML = righe.map((r) => rowHTML(r)).join('');
    const payments = existing ? paymentsOf(existing.id) : [];
    const paid = payments.reduce((x, p) => x + p.amountCents, 0);
    return `
      <nav class="crumbs"><a href="#/fatture">Fatture</a> / <span>${existing ? esc(existing.number) : 'Nuova'}</span></nav>
      <header class="page-head"><div><p class="eyebrow">${existing ? 'Modifica' : 'Nuova fattura'}</p><h1>${existing ? `Fattura ${esc(existing.number)}` : 'Nuova fattura'}</h1></div></header>
      ${paid > 0 ? `<div class="alert info">Su questa fattura ci sono già incassi per ${esc(Core.formatEuro(paid))}: il totale non può scendere sotto questa cifra.</div>` : ''}
      <form data-form="invoice" data-id="${esc(existing ? existing.id : '')}" data-input="invoice-totals" data-new="${existing ? '0' : '1'}" novalidate class="card">
        ${UI.fieldsHTML(fields, values)}
        <label class="field check"><input type="checkbox" name="stato"${values.stato ? ' checked' : ''}> <span>Salva come bozza (non conta ancora nel fatturato)</span></label>
        <h3 class="mt">Righe</h3>
        <div id="righe">${rowsHTML}</div>
        <div class="form-actions left"><button type="button" class="btn small" data-action="invoice-row-add">+ Aggiungi riga</button></div>
        <div class="totals" data-totals></div>
        <label class="field full"><span class="lbl">Note in fattura (facoltativo)</span>
          <textarea name="note" rows="2" placeholder="es. Pagamento tramite bonifico sul conto indicato">${esc(existing ? existing.note || '' : '')}</textarea></label>
        <div class="form-actions">
          <a class="btn ghost" href="${existing ? `#/fatture/${esc(existing.id)}` : '#/fatture'}">Annulla</a>
          <button type="submit" class="btn primary">${existing ? 'Salva modifiche' : 'Crea fattura'}</button>
        </div>
      </form>
      <template id="riga-tpl">${rowHTML({})}</template>`;
  };

  App.actions['invoice-prefill'] = (el) => {
    App.ui.prefillClient = el.dataset.client;
  };

  App.actions['invoice-row-add'] = (el) => {
    const form = el.closest('form');
    const box = form.querySelector('#righe');
    box.insertAdjacentHTML('beforeend', rowHTML({}));
    updateTotals(form);
    const inputs = box.querySelectorAll('.riga');
    const last = inputs[inputs.length - 1];
    if (last) last.querySelector('[name="rdesc"]').focus();
  };

  App.actions['invoice-row-remove'] = (el) => {
    const form = el.closest('form');
    const rows = form.querySelectorAll('.riga');
    if (rows.length <= 1) {
      el.closest('.riga').querySelectorAll('input').forEach((i) => { i.value = ''; });
    } else {
      el.closest('.riga').remove();
    }
    updateTotals(form);
  };

  // L'handler riceve il form stesso (data-input sul form), non un singolo campo
  App.inputs['invoice-totals'] = (el) => {
    updateTotals(el.tagName === 'FORM' ? el : el.form);
  };

  App.changes['invoice-client'] = (el) => {
    const form = el.form;
    const sel = form.elements.projectId;
    const opts = projectOptions(el.value).map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`);
    sel.innerHTML = `<option value="">— nessuno —</option>${opts.join('')}`;
  };

  // Su nuova fattura: cambiando la data di emissione aggiorniamo numero (anno) e scadenza
  App.changes['invoice-issue'] = (el) => {
    const form = el.form;
    if (form.dataset.new !== '1' || !Core.isValidISODate(el.value)) return;
    const y = Number(el.value.slice(0, 4));
    form.elements.number.value = Core.nextInvoiceNumber(y, App.state.invoices);
    form.elements.dueDate.value = Core.addDays(el.value, App.settings().giorniScadenza || 30);
  };

  App.forms.invoice = (form) =>
    UI.guard(form, async () => {
      const header = UI.readFields(form, invoiceFields([]));
      const existing = form.dataset.id ? invoiceOf(form.dataset.id) : null;
      const rows = rowsFromForm(form);
      const righe = rows.map((r) => ({
        descrizione: r.descrizione,
        quantita: r.quantita,
        prezzoCents: r.prezzoCents,
      }));
      const bozza = form.elements.stato.checked;
      let stato = 'emessa';
      if (existing && existing.stato === 'annullata') stato = 'annullata';
      else if (bozza) stato = 'bozza';
      const rec = {
        ...(existing || {}),
        id: existing ? existing.id : undefined,
        clientId: header.values.clientId,
        projectId: header.values.projectId || '',
        number: header.values.number,
        issueDate: header.values.issueDate,
        dueDate: header.values.dueDate,
        ivaRate: header.values.ivaRate,
        stato,
        righe,
        note: form.elements.note.value.trim(),
      };
      // Le righe vuote non sono un errore a sé: se restano senza dati, validateInvoice lo segnala
      const errors = [...header.errors, ...Core.validateInvoice(rec, {
        clients: App.state.clients,
        invoices: App.state.invoices,
        payments: App.state.payments,
      })];
      if (rows.some((r) => !r.descrizione && (r.quantita !== null || r.prezzoCents !== null))) {
        errors.push('Una riga ha quantità o prezzo ma manca la descrizione.');
      }
      if (rows.some((r) => r.quantita === null && r.prezzoCents === null && !r.descrizione)) {
        // riga completamente vuota: la ignoriamo, ma nessun errore
      }
      if (rec.projectId && !App.state.projects.some((p) => p.id === rec.projectId && p.clientId === rec.clientId)) {
        errors.push('Il progetto selezionato non appartiene al cliente.');
      }
      if (errors.length) return UI.showErrors(form, errors);
      const saved = await App.save('invoices', rec);
      UI.toast(existing ? 'Fattura aggiornata' : `Fattura ${saved.number} creata`);
      location.hash = `#/fatture/${saved.id}`;
    });

  /* ------------------------------ Dettaglio fattura ------------------------------ */
  // Dati dell'emittente che una fattura valida deve riportare
  function issuerMissing() {
    const s = App.settings();
    const missing = [];
    const hasName = s.tipoAttivita === 'azienda' ? !!(s.ragioneSociale || '').trim() : !!((s.nome || '').trim() && (s.cognome || '').trim());
    if (!hasName) missing.push(s.tipoAttivita === 'azienda' ? 'ragione sociale' : 'nome e cognome');
    if (!(s.partitaIva || '').trim()) missing.push('partita IVA');
    if (!(s.indirizzo || '').trim()) missing.push('indirizzo');
    return missing;
  }

  function issuerBanner() {
    const m = issuerMissing();
    if (!m.length) return '';
    return `<div class="alert warn"><strong>Mancano i tuoi dati nella fattura:</strong> ${esc(m.join(', '))}.
      Senza questi dati la fattura stampata non è valida. <a href="#/impostazioni">Completa le Impostazioni</a>.</div>`;
  }
  function printHTML(inv) {
    const s = App.settings();
    const c = App.clientOf(inv.clientId);
    const t = Core.invoiceTotals(inv);
    const emittente = s.tipoAttivita === 'azienda' ? s.ragioneSociale : `${s.nome || ''} ${s.cognome || ''}`.trim();
    const righe = (inv.righe || []).map((r) => `<tr>
      <td>${esc(r.descrizione)}</td>
      <td class="r">${esc(String(r.quantita).replace('.', ','))}</td>
      <td class="r">${esc(Core.formatEuro(r.prezzoCents))}</td>
      <td class="r">${esc(Core.formatEuro(Math.round(r.quantita * r.prezzoCents)))}</td></tr>`).join('');
    return `
      <div class="print-page">
        <header class="p-head">
          <div><h1>FATTURA ${esc(inv.number)}</h1><p>Data emissione: ${esc(fmtDate(inv.issueDate))}<br>Scadenza: ${esc(fmtDate(inv.dueDate))}</p></div>
          <div class="p-from"><b>${esc(emittente || '')}</b><br>${esc(s.indirizzo || '')}${s.cap || s.citta ? '<br>' + esc([s.cap, s.citta, s.provincia].filter(Boolean).join(' ')) : ''}<br>${s.partitaIva ? 'P.IVA ' + esc(s.partitaIva) : ''}${s.codiceFiscale ? '<br>C.F. ' + esc(s.codiceFiscale) : ''}${s.email ? '<br>' + esc(s.email) : ''}</div>
        </header>
        <section class="p-to"><span class="muted">Spettabile</span><br><b>${esc(c ? App.clientName(c) : '—')}</b><br>${esc(c ? [c.indirizzo, [c.cap, c.citta, c.provincia].filter(Boolean).join(' ')].filter(Boolean).join(', ') : '')}${c && c.partitaIva ? '<br>P.IVA ' + esc(c.partitaIva) : ''}${c && c.codiceFiscale ? '<br>C.F. ' + esc(c.codiceFiscale) : ''}</section>
        <table class="p-table"><thead><tr><th>Descrizione</th><th class="r">Q.tà</th><th class="r">Prezzo</th><th class="r">Importo</th></tr></thead><tbody>${righe}</tbody></table>
        <table class="p-totals"><tr><td>Imponibile</td><td class="r">${esc(Core.formatEuro(t.imponibile))}</td></tr>
          <tr><td>IVA ${esc(String(inv.ivaRate).replace('.', ','))}%</td><td class="r">${esc(Core.formatEuro(t.iva))}</td></tr>
          <tr class="grand"><td>Totale</td><td class="r">${esc(Core.formatEuro(t.totale))}</td></tr></table>
        ${inv.note ? `<p class="p-note">${esc(inv.note)}</p>` : ''}
        <footer class="p-foot">
          ${s.iban ? `<p>Pagamento tramite bonifico · IBAN ${esc(s.iban)}</p>` : ''}
          ${s.regimeFiscale ? `<p>${esc(s.regimeFiscale)}</p>` : ''}
        </footer>
      </div>`;
  }

  V.fatturaDetail = (id) => {
    const inv = invoiceOf(id);
    if (!inv) return `<div class="alert warn">Fattura non trovata. <a href="#/fatture">Torna all’elenco</a>.</div>`;
    const c = App.clientOf(inv.clientId);
    const today = App.today();
    const st = Core.invoiceState(inv, App.state.payments, today);
    const t = Core.invoiceTotals(inv);
    const payments = paymentsOf(inv.id).sort((a, b) => (a.date < b.date ? 1 : -1));
    const project = inv.projectId ? App.byId('projects', inv.projectId) : null;
    const files = App.state.files.filter((f) => f.relatedId === inv.id);
    const hasPayments = payments.length > 0;
    const canPay = inv.stato === 'emessa' && st.residuo > 0;
    const rows = (inv.righe || []).map((r) => `<tr>
        <td>${esc(r.descrizione)}</td>
        <td class="num">${esc(String(r.quantita).replace('.', ','))}</td>
        <td class="num">${esc(Core.formatEuro(r.prezzoCents))}</td>
        <td class="num">${esc(Core.formatEuro(Math.round(r.quantita * r.prezzoCents)))}</td></tr>`).join('');
    // La stampa usa un’area separata: la pagina dell’app non viene stampata
    App.ui.printInvoiceId = inv.id;
    return `
      <nav class="crumbs"><a href="#/fatture">Fatture</a> / <span>${esc(inv.number)}</span></nav>
      <header class="page-head">
        <div>
          <p class="eyebrow">Fattura ${esc(fmtDate(inv.issueDate))}</p>
          <h1>${esc(inv.number)} · ${esc(c ? App.clientName(c) : '—')}</h1>
          <p>${badge(st.code, st.label)} ${project ? `<span class="muted">· progetto: ${esc(project.titolo)}</span>` : ''}</p>
        </div>
        <div class="head-actions">
          ${inv.stato === 'bozza' ? `<button type="button" class="btn primary" data-action="invoice-issue" data-id="${esc(inv.id)}">Emetti fattura</button>` : ''}
          ${canPay ? `<button type="button" class="btn primary" data-action="payment-new" data-invoice="${esc(inv.id)}" data-client="${esc(inv.clientId)}">Registra incasso</button>` : ''}
          ${inv.stato !== 'annullata' ? `<a class="btn" href="#/fatture/${esc(inv.id)}/modifica">Modifica</a>` : ''}
          <button type="button" class="btn" data-action="invoice-print">Stampa / PDF</button>
          ${inv.stato === 'emessa' && !hasPayments ? `<button type="button" class="btn danger ghost" data-action="invoice-cancel" data-id="${esc(inv.id)}">Annulla fattura</button>` : ''}
          ${inv.stato === 'bozza' ? `<button type="button" class="btn danger ghost" data-action="invoice-delete" data-id="${esc(inv.id)}">Elimina bozza</button>` : ''}
        </div>
      </header>
      ${issuerBanner()}
      ${inv.stato === 'annullata' ? `<div class="alert warn">Fattura annullata: non entra nel fatturato. Il numero resta riservato.</div>` : ''}
      ${inv.stato === 'emessa' && hasPayments ? `<p class="muted small-note">Per annullare questa fattura prima elimina i suoi incassi.</p>` : ''}
      <section class="kpi-grid small">
        <article class="kpi"><span class="kpi-label">Imponibile</span><strong class="kpi-value">${esc(Core.formatEuro(t.imponibile))}</strong></article>
        <article class="kpi"><span class="kpi-label">IVA ${esc(String(inv.ivaRate).replace('.', ','))}%</span><strong class="kpi-value">${esc(Core.formatEuro(t.iva))}</strong></article>
        <article class="kpi"><span class="kpi-label">Totale</span><strong class="kpi-value">${esc(Core.formatEuro(t.totale))}</strong></article>
        <article class="kpi ${st.residuo > 0 && inv.stato === 'emessa' ? 'warn' : ''}"><span class="kpi-label">Residuo da incassare</span><strong class="kpi-value">${esc(Core.formatEuro(Math.max(0, st.residuo)))}</strong></article>
      </section>
      <div class="two-col">
        <section class="card">
          <h3>Righe</h3>
          <div class="table-wrap"><table class="table"><thead><tr><th>Descrizione</th><th class="num">Q.tà</th><th class="num">Prezzo</th><th class="num">Importo</th></tr></thead><tbody>${rows}</tbody></table></div>
          ${inv.dueDate ? `<p class="muted small-note">Scadenza: ${esc(fmtDate(inv.dueDate))}${inv.note ? ' · ' + esc(inv.note) : ''}</p>` : ''}
        </section>
        <section class="card">
          <h3>Dati</h3>
          <dl class="dl">
            <dt>Cliente</dt><dd>${c ? `<a href="#/clienti/${esc(c.id)}">${esc(App.clientName(c))}</a>` : '—'}</dd>
            <dt>Emissione</dt><dd>${esc(fmtDate(inv.issueDate))}</dd>
            <dt>Scadenza</dt><dd>${esc(fmtDate(inv.dueDate))}</dd>
            <dt>Incassato</dt><dd>${esc(Core.formatEuro(st.paid))}</dd>
          </dl>
        </section>
      </div>
      <section class="card">
        <div class="section-head"><h3>Incassi collegati (${payments.length})</h3></div>
        ${payments.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Data</th><th>Metodo</th><th class="num">Importo</th><th></th></tr></thead><tbody>${payments.map((p) => `<tr>
          <td>${esc(fmtDate(p.date))}</td><td>${esc(p.metodo || '—')}</td><td class="num">${esc(Core.formatEuro(p.amountCents))}</td>
          <td class="num row-actions"><button type="button" class="btn small ghost" data-action="payment-edit" data-id="${esc(p.id)}">Modifica</button>
          <button type="button" class="btn small ghost danger" data-action="payment-delete" data-id="${esc(p.id)}">Elimina</button></td></tr>`).join('')}</tbody></table></div>` : UI.empty('Nessun incasso collegato a questa fattura.')}
      </section>
      <section class="card">
        <h3>Documenti collegati (${files.length})</h3>
        ${files.length ? `<ul class="file-list">${files.map(App.fileRow).join('')}</ul>` : UI.empty('Nessun documento. Puoi allegarli dalla scheda cliente, sezione Documenti.')}
      </section>
`;
  };

  App.actions['invoice-print'] = () => {
    const id = App.ui.printInvoiceId;
    const inv = id ? invoiceOf(id) : null;
    if (!inv) return;
    const m = issuerMissing();
    if (m.length) UI.toast(`Attenzione: nella fattura mancano ${m.join(', ')}. Completali in Impostazioni.`, 'err');
    // Unica area di stampa: quella fuori dall'app (un secondo id uguale la rendeva vuota)
    const area = document.getElementById('print-area');
    if (area) area.innerHTML = printHTML(inv);
    root.print();
  };

  App.actions['invoice-issue'] = async (el) => {
    const inv = invoiceOf(el.dataset.id);
    if (!inv) return;
    const errs = Core.validateInvoice({ ...inv, stato: 'emessa' }, { clients: App.state.clients, invoices: App.state.invoices, payments: App.state.payments });
    if (errs.length) {
      UI.toast(errs[0], 'err');
      return;
    }
    await App.save('invoices', { ...inv, stato: 'emessa' });
    UI.toast('Fattura emessa: ora conta nel fatturato del mese di emissione');
    App.refresh();
  };

  App.actions['invoice-cancel'] = async (el) => {
    const inv = invoiceOf(el.dataset.id);
    if (!inv) return;
    if (paymentsOf(inv.id).length) {
      UI.toast('La fattura ha incassi collegati: eliminali prima di annullarla.', 'err');
      return;
    }
    const ok = await UI.confirmDialog({
      title: 'Annullare la fattura?',
      message: `La fattura ${inv.number} uscirà dal fatturato. Il numero resta riservato e non verrà riutilizzato.`,
      confirmText: 'Annulla fattura',
      danger: true,
    });
    if (!ok) return;
    await App.save('invoices', { ...inv, stato: 'annullata' });
    UI.toast('Fattura annullata');
    App.refresh();
  };

  App.actions['invoice-delete'] = async (el) => {
    const inv = invoiceOf(el.dataset.id);
    if (!inv || inv.stato !== 'bozza') return;
    const ok = await UI.confirmDialog({ title: 'Eliminare la bozza?', message: `La bozza ${inv.number} verrà eliminata. Il numero tornerà disponibile.`, confirmText: 'Elimina', danger: true });
    if (!ok) return;
    await App.remove('invoices', inv.id);
    UI.toast('Bozza eliminata');
    location.hash = '#/fatture';
  };

  /* ------------------------------ Incassi ------------------------------ */
  function paymentFields(clientId, invoiceId, editing) {
    const clients = App.clientOptions(clientId);
    return [
      { name: 'clientId', label: 'Cliente', type: 'select', options: clients, required: true },
      { name: 'invoiceId', label: 'Fattura collegata', type: 'select', options: invoiceChoices(clientId, invoiceId, editing), empty: '— acconto generico, senza fattura —', hint: 'Solo fatture emesse con residuo' },
      { name: 'amount', label: 'Importo (€)', type: 'money', required: true },
      { name: 'date', label: 'Data incasso', type: 'date', required: true },
      { name: 'metodo', label: 'Metodo', type: 'select', options: Core.METODI_PAGAMENTO.map((m) => [m, m]), empty: '— seleziona —' },
      { name: 'note', label: 'Riferimento / note', full: false, placeholder: 'es. CRO bonifico, causale…' },
      { name: 'receipt', label: 'Ricevuta o screenshot (facoltativo)', type: 'file', full: true, hint: 'Allega la ricevuta del bonifico: resta collegata a questo incasso' },
    ];
  }

  function invoiceChoices(clientId, selectedId, editing) {
    if (!clientId) return [];
    return App.state.invoices
      .filter((i) => i.clientId === clientId && i.stato === 'emessa')
      .filter((i) => {
        if (i.id === selectedId) return true;
        return Core.invoiceState(i, App.state.payments, App.today()).residuo > 0;
      })
      .sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1))
      .map((i) => [i.id, `${i.number} · residuo ${Core.formatEuro(Core.invoiceState(i, App.state.payments, App.today()).residuo)}`]);
  }

  function openPaymentModal({ payment = null, clientId = '', invoiceId = '' } = {}) {
    const existingInvoice = payment && payment.invoiceId ? invoiceOf(payment.invoiceId) : null;
    const cid = payment ? payment.clientId : clientId || (existingInvoice ? existingInvoice.clientId : '');
    const iid = payment ? payment.invoiceId || '' : invoiceId || '';
    const values = payment
      ? { clientId: cid, invoiceId: iid, amount: payment.amountCents, date: payment.date, metodo: payment.metodo || '', note: payment.note || '' }
      : { clientId: cid, invoiceId: iid, amount: null, date: App.today(), metodo: 'Bonifico', note: '' };
    UI.modal({
      title: payment ? 'Modifica incasso' : 'Registra incasso',
      size: 'wide',
      body: `
        <form data-form="payment" data-id="${esc(payment ? payment.id : '')}" data-input="payment-amount" novalidate>
          ${UI.fieldsHTML(paymentFields(cid, iid, !!payment).map((f) => (f.name === 'invoiceId' ? { ...f, attrs: 'data-change="payment-invoice"' } : f.name === 'clientId' ? { ...f, attrs: 'data-change="payment-client"' } : f)), values)}
          <div class="form-actions"><button type="button" class="btn ghost" data-modal-close>Annulla</button><button type="submit" class="btn primary">Salva incasso</button></div>
        </form>`,
    });
  }

  App.openPaymentModal = openPaymentModal;

  App.actions['payment-new'] = (el) => {
    openPaymentModal({ clientId: el.dataset.client || '', invoiceId: el.dataset.invoice || '' });
  };

  App.actions['payment-edit'] = (el) => {
    const p = App.byId('payments', el.dataset.id);
    if (p) openPaymentModal({ payment: p });
  };

  App.actions['payment-delete'] = async (el) => {
    const p = App.byId('payments', el.dataset.id);
    if (!p) return;
    const ok = await UI.confirmDialog({
      title: 'Eliminare l’incasso?',
      message: `Eliminerai l’incasso di ${Core.formatEuro(p.amountCents)} del ${fmtDate(p.date)}. Le ricevute allegate verranno eliminate.`,
      confirmText: 'Elimina',
      danger: true,
    });
    if (!ok) return;
    await App.removeWithFiles('payments', p.id);
    UI.toast('Incasso eliminato');
    App.refresh();
  };

  App.changes['payment-client'] = (el) => {
    const form = el.form;
    const sel = form.elements.invoiceId;
    const choices = invoiceChoices(el.value, '', false);
    sel.innerHTML = `<option value="">— acconto generico, senza fattura —</option>${choices.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')}`;
  };

  // Scegliendo una fattura, l'importo si propone pari al residuo
  App.changes['payment-invoice'] = (el) => {
    const form = el.form;
    const inv = el.value ? invoiceOf(el.value) : null;
    if (!inv) return;
    const st = Core.invoiceState(inv, App.state.payments, App.today());
    const editing = form.dataset.id;
    const residuo = editing ? st.residuo + (App.byId('payments', editing)?.amountCents || 0) : st.residuo;
    form.elements.amount.value = Core.centsToPlain(Math.max(0, residuo));
  };

  App.inputs['payment-amount'] = () => {};

  V.incassi = () => {
    const year = App.ui.payYear === null ? currentYear() : App.ui.payYear;
    const month = App.ui.payMonth;
    const client = App.ui.payClient;
    const list = App.state.payments
      .filter((p) => year === '' || Number(p.date.slice(0, 4)) === Number(year))
      .filter((p) => !month || Number(p.date.slice(5, 7)) === Number(month))
      .filter((p) => !client || p.clientId === client)
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    const total = list.reduce((s, p) => s + p.amountCents, 0);
    const rows = list.map((p) => {
      const c = App.clientOf(p.clientId);
      const inv = p.invoiceId ? invoiceOf(p.invoiceId) : null;
      const files = App.state.files.filter((f) => f.relatedId === p.id).length;
      return `<tr>
        <td>${esc(fmtDate(p.date))}</td>
        <td>${c ? `<a href="#/clienti/${esc(c.id)}">${esc(App.clientName(c))}</a>` : '—'}</td>
        <td>${inv ? `<a href="#/fatture/${esc(inv.id)}">${esc(inv.number)}</a>` : '<span class="muted">acconto</span>'}</td>
        <td>${esc(p.metodo || '—')}</td>
        <td>${files ? `<span class="muted">${files} allegato</span>` : ''}</td>
        <td class="num"><b>${esc(Core.formatEuro(p.amountCents))}</b></td>
        <td class="num row-actions"><button type="button" class="btn small ghost" data-action="payment-edit" data-id="${esc(p.id)}">Modifica</button>
          <button type="button" class="btn small ghost danger" data-action="payment-delete" data-id="${esc(p.id)}">Elimina</button></td>
      </tr>`;
    });
    const months = Core.MESI.map((m, i) => [i + 1, m.charAt(0).toUpperCase() + m.slice(1)]);
    const clientOpts = App.clientOptions('').map(([v, l]) => [v, l]);
    return `
      <header class="page-head">
        <div><p class="eyebrow">Cassa</p><h1>Incassi</h1><p class="muted">Pagamenti ricevuti. Il mese è quello della data di pagamento.</p></div>
        <div class="head-actions"><button type="button" class="btn primary" data-action="payment-new">+ Registra incasso</button></div>
      </header>
      <div class="toolbar">
        ${yearSelect('year', year, 'pay-year', true)}
        <label class="field"><span class="lbl">Mese</span>
          <select name="month" data-change="pay-month"><option value="">Tutti i mesi</option>${months.map(([v, l]) => `<option value="${v}"${String(v) === String(month) ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></label>
        <label class="field"><span class="lbl">Cliente</span>
          <select name="client" data-change="pay-client"><option value="">Tutti i clienti</option>${clientOpts.map(([v, l]) => `<option value="${esc(v)}"${v === client ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></label>
      </div>
      <p class="summary">Totale nell’elenco: <b>${esc(Core.formatEuro(total))}</b> · ${list.length} incassi</p>
      <div class="table-wrap"><table class="table">
        <thead><tr><th>Data</th><th>Cliente</th><th>Fattura</th><th>Metodo</th><th></th><th class="num">Importo</th><th></th></tr></thead>
        <tbody>${rows.length ? rows.join('') : `<tr><td colspan="7">${UI.empty('Nessun incasso con questi filtri.')}</td></tr>`}</tbody>
      </table></div>`;
  };

  App.changes['pay-year'] = (el) => {
    App.ui.payYear = el.value === '' ? '' : Number(el.value);
    App.refresh();
  };
  App.changes['pay-month'] = (el) => {
    App.ui.payMonth = el.value;
    App.refresh();
  };
  App.changes['pay-client'] = (el) => {
    App.ui.payClient = el.value;
    App.refresh();
  };

  App.forms.payment = (form) =>
    UI.guard(form, async () => {
      const { values, errors } = UI.readFields(form, paymentFields('', '', false));
      const existing = form.dataset.id ? App.byId('payments', form.dataset.id) : null;
      const rec = {
        ...(existing || {}),
        id: existing ? existing.id : undefined,
        clientId: values.clientId,
        invoiceId: values.invoiceId || null,
        date: values.date,
        amountCents: values.amount === null ? 0 : values.amount,
        metodo: values.metodo || '',
        note: values.note || '',
      };
      const all = [...errors, ...Core.validatePayment(rec, {
        clients: App.state.clients,
        invoices: App.state.invoices,
        payments: App.state.payments,
      })];
      if (values.receipt) all.push(...Core.validateFile(values.receipt));
      if (all.length) return UI.showErrors(form, all);
      const saved = await App.save('payments', rec);
      if (values.receipt) {
        await App.addFile({ name: values.receipt.name, kind: 'ricevuta', date: rec.date, clientId: rec.clientId, relatedId: saved.id, relatedType: 'payment', note: rec.note }, values.receipt);
      }
      UI.closeModalOf(form);
      UI.toast('Incasso registrato');
      App.refresh();
    });

  /* ------------------------------ Spese ------------------------------ */
  const EXPENSE_FIELDS = [
    { name: 'date', label: 'Data', type: 'date', required: true },
    { name: 'descrizione', label: 'Descrizione', required: true, full: true, placeholder: 'es. Abbonamento editing, crediti generazione video' },
    { name: 'categoria', label: 'Categoria', type: 'select', options: Core.CATEGORIE_SPESA.map((c) => [c, c]), required: true },
    { name: 'fornitore', label: 'Fornitore', placeholder: 'es. Adobe, Higgsfield…' },
    { name: 'amount', label: 'Importo (€)', type: 'money', required: true },
    { name: 'note', label: 'Note', full: true },
    { name: 'receipt', label: 'Ricevuta / fattura del fornitore (facoltativo)', type: 'file', full: true },
  ];

  App.ui.expYear = App.ui.expYear ?? null;

  V.spese = () => {
    const year = App.ui.expYear === null ? currentYear() : App.ui.expYear;
    const cat = App.ui.expCat;
    const list = App.state.expenses
      .filter((e) => year === '' || Number(e.date.slice(0, 4)) === Number(year))
      .filter((e) => !cat || e.categoria === cat)
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    const total = list.reduce((s, e) => s + e.amountCents, 0);
    const byCat = {};
    for (const e of list) byCat[e.categoria] = (byCat[e.categoria] || 0) + e.amountCents;
    const catRows = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    const rows = list.map((e) => {
      const files = App.state.files.filter((f) => f.relatedId === e.id).length;
      return `<tr>
        <td>${esc(fmtDate(e.date))}</td>
        <td><b>${esc(e.descrizione)}</b>${e.fornitore ? `<div class="muted small-note">${esc(e.fornitore)}</div>` : ''}</td>
        <td>${esc(e.categoria)}</td>
        <td>${files ? `<span class="muted">${files} allegato</span>` : ''}</td>
        <td class="num"><b>${esc(Core.formatEuro(e.amountCents))}</b></td>
        <td class="num row-actions"><button type="button" class="btn small ghost" data-action="expense-edit" data-id="${esc(e.id)}">Modifica</button>
          <button type="button" class="btn small ghost danger" data-action="expense-delete" data-id="${esc(e.id)}">Elimina</button></td>
      </tr>`;
    });
    return `
      <header class="page-head">
        <div><p class="eyebrow">Costi</p><h1>Spese</h1><p class="muted">Ogni spesa va registrata con la data in cui l’hai sostenuta.</p></div>
        <div class="head-actions"><button type="button" class="btn primary" data-action="expense-new">+ Nuova spesa</button></div>
      </header>
      <div class="toolbar">
        ${yearSelect('year', year, 'exp-year', true)}
        <label class="field"><span class="lbl">Categoria</span>
          <select name="cat" data-change="exp-cat"><option value="">Tutte</option>${Core.CATEGORIE_SPESA.map((c) => `<option${c === cat ? ' selected' : ''}>${esc(c)}</option>`).join('')}</select></label>
      </div>
      <div class="two-col">
        <section class="card">
          <h3>Per categoria</h3>
          ${catRows.length ? `<ul class="plain-list">${catRows.map(([c, v]) => `<li>${esc(c)}<span class="right">${esc(Core.formatEuro(v))}</span></li>`).join('')}</ul>` : '<p class="muted">Nessuna spesa nel filtro.</p>'}
          <p class="summary">Totale: <b>${esc(Core.formatEuro(total))}</b></p>
        </section>
        <section class="card">
          <h3>Come leggere l’utile</h3>
          <p class="small-note muted">Utile competenza = fatturato del periodo − spese. Utile di cassa = incassi del periodo − spese. Le spese sono registrate per data di sostenimento.</p>
        </section>
      </div>
      <div class="table-wrap"><table class="table">
        <thead><tr><th>Data</th><th>Descrizione</th><th>Categoria</th><th></th><th class="num">Importo</th><th></th></tr></thead>
        <tbody>${rows.length ? rows.join('') : `<tr><td colspan="6">${UI.empty('Nessuna spesa con questi filtri.')}</td></tr>`}</tbody>
      </table></div>`;
  };

  App.changes['exp-year'] = (el) => {
    App.ui.expYear = el.value === '' ? '' : Number(el.value);
    App.refresh();
  };
  App.changes['exp-cat'] = (el) => {
    App.ui.expCat = el.value;
    App.refresh();
  };

  function openExpenseModal(expense) {
    const values = expense
      ? { date: expense.date, descrizione: expense.descrizione, categoria: expense.categoria, fornitore: expense.fornitore || '', amount: expense.amountCents, note: expense.note || '' }
      : { date: App.today(), categoria: 'Software e abbonamenti' };
    UI.modal({
      title: expense ? 'Modifica spesa' : 'Nuova spesa',
      size: 'wide',
      body: `
        <form data-form="expense" data-id="${esc(expense ? expense.id : '')}" novalidate>
          ${UI.fieldsHTML(EXPENSE_FIELDS, values)}
          <div class="form-actions"><button type="button" class="btn ghost" data-modal-close>Annulla</button><button type="submit" class="btn primary">Salva spesa</button></div>
        </form>`,
    });
  }

  App.actions['expense-new'] = () => openExpenseModal(null);
  App.actions['expense-edit'] = (el) => {
    const e = App.byId('expenses', el.dataset.id);
    if (e) openExpenseModal(e);
  };
  App.actions['expense-delete'] = async (el) => {
    const e = App.byId('expenses', el.dataset.id);
    if (!e) return;
    const ok = await UI.confirmDialog({ title: 'Eliminare la spesa?', message: `“${e.descrizione}” di ${Core.formatEuro(e.amountCents)} verrà eliminata, con la sua ricevuta.`, confirmText: 'Elimina', danger: true });
    if (!ok) return;
    await App.removeWithFiles('expenses', e.id);
    UI.toast('Spesa eliminata');
    App.refresh();
  };

  App.forms.expense = (form) =>
    UI.guard(form, async () => {
      const { values, errors } = UI.readFields(form, EXPENSE_FIELDS);
      const existing = form.dataset.id ? App.byId('expenses', form.dataset.id) : null;
      const rec = {
        ...(existing || {}),
        id: existing ? existing.id : undefined,
        date: values.date,
        descrizione: values.descrizione,
        categoria: values.categoria,
        fornitore: values.fornitore || '',
        amountCents: values.amount === null ? 0 : values.amount,
        note: values.note || '',
      };
      const all = [...errors, ...Core.validateExpense(rec)];
      if (values.receipt) all.push(...Core.validateFile(values.receipt));
      if (all.length) return UI.showErrors(form, all);
      const saved = await App.save('expenses', rec);
      if (values.receipt) {
        await App.addFile({ name: values.receipt.name, kind: 'ricevuta', date: rec.date, relatedId: saved.id, relatedType: 'expense', note: rec.descrizione }, values.receipt);
      }
      UI.closeModalOf(form);
      UI.toast('Spesa salvata');
      App.refresh();
    });

  App.invoiceState = (inv) => Core.invoiceState(inv, App.state.payments, App.today());
  App.invoiceOf = invoiceOf;
  App.paymentsOf = paymentsOf;
  App.openExpenseModal = openExpenseModal;
  App.fileYearChoices = yearChoices;
})(typeof window !== 'undefined' ? window : globalThis);
