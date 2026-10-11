/*
 * Clienti: elenco, anagrafica, scheda cliente con schede (panoramica, progetti,
 * fatture, pagamenti, documenti, attività). Un cliente con fatture o incassi
 * non si elimina: si archivia, così lo storico resta intatto.
 */
(function (root) {
  'use strict';

  const { Core, DB, UI, App } = root;
  const { esc, fmtDate, badge } = UI;
  const V = App.views;

  const CLIENT_FIELDS = [
    { name: 'tipo', label: 'Tipo', type: 'select', options: [['privato', 'Privato'], ['azienda', 'Azienda / libero professionista']], required: true, empty: false, full: true },
    { name: 'nome', label: 'Nome' },
    { name: 'cognome', label: 'Cognome' },
    { name: 'ragioneSociale', label: 'Ragione sociale (aziende)', full: true },
    { name: 'partitaIva', label: 'Partita IVA', hint: '11 cifre, controllata automaticamente' },
    { name: 'codiceFiscale', label: 'Codice fiscale' },
    { name: 'email', label: 'Email', type: 'text' },
    { name: 'pec', label: 'PEC' },
    { name: 'sdi', label: 'Codice SDI', hint: '7 caratteri, fatturazione elettronica' },
    { name: 'telefono', label: 'Telefono', type: 'text' },
    { name: 'indirizzo', label: 'Indirizzo', full: true },
    { name: 'cap', label: 'CAP' },
    { name: 'citta', label: 'Città' },
    { name: 'provincia', label: 'Provincia', placeholder: 'es. MI' },
    { name: 'note', label: 'Note', type: 'textarea', full: true },
  ];

  const PROJECT_FIELDS = [
    { name: 'titolo', label: 'Titolo progetto', required: true, full: true, placeholder: 'es. Spot prodotto estate 2026' },
    { name: 'servizio', label: 'Tipo di lavoro', placeholder: 'es. Video, spot AI, montaggio' },
    { name: 'stato', label: 'Stato', type: 'select', options: Object.entries(Core.STATI_PROGETTO), required: true, empty: false },
    { name: 'budget', label: 'Budget (€)', type: 'money' },
    { name: 'dataInizio', label: 'Data inizio', type: 'date' },
    { name: 'dataConsegna', label: 'Data consegna', type: 'date' },
    { name: 'note', label: 'Note', type: 'textarea', full: true },
  ];

  const ACTIVITY_FIELDS = [
    { name: 'tipo', label: 'Tipo', type: 'select', options: Object.entries(Core.TIPI_ATTIVITA), required: true, empty: false },
    { name: 'date', label: 'Data', type: 'date', required: true },
    { name: 'testo', label: 'Cosa è successo / cosa hai fatto', type: 'textarea', required: true, full: true },
  ];

  const FILE_FIELDS = [
    { name: 'file', label: 'File', type: 'file', required: true, full: true, hint: 'PDF, immagini, video… massimo 25 MB' },
    { name: 'kind', label: 'Tipo documento', type: 'select', options: Object.entries(Core.TIPI_DOCUMENTO), required: true, empty: false },
    { name: 'date', label: 'Data del documento', type: 'date', required: true },
    { name: 'scadenza', label: 'Scadenza (facoltativa)', type: 'date', hint: 'Utile per contratti con rinnovo' },
    { name: 'note', label: 'Note', full: true },
  ];

  /* ------------------------------ Helpers ------------------------------ */
  const clientName = (c) => (c.tipo === 'azienda' ? c.ragioneSociale || '(senza nome)' : `${c.nome || ''} ${c.cognome || ''}`.trim() || '(senza nome)');

  const clientOf = (id) => App.byId('clients', id);

  function clientIdentity(c) {
    return c.tipo === 'azienda' ? c.partitaIva || '' : c.codiceFiscale || '';
  }

  function clientOptions(selectedId) {
    return App.state.clients
      .filter((c) => !c.archiviato || c.id === selectedId)
      .slice()
      .sort((a, b) => clientName(a).localeCompare(clientName(b), 'it'))
      .map((c) => [c.id, clientName(c)]);
  }

  function normalizeClient(v) {
    const out = { ...v };
    for (const k of ['nome', 'cognome', 'ragioneSociale', 'email', 'pec', 'telefono', 'indirizzo', 'cap', 'citta', 'provincia', 'sdi', 'note']) {
      if (typeof out[k] === 'string') out[k] = out[k].trim();
    }
    out.partitaIva = (out.partitaIva || '').replace(/\s/g, '');
    out.codiceFiscale = (out.codiceFiscale || '').replace(/\s/g, '').toUpperCase();
    out.sdi = (out.sdi || '').toUpperCase();
    out.provincia = (out.provincia || '').toUpperCase();
    if (out.tipo === 'privato') {
      out.ragioneSociale = '';
      out.partitaIva = out.partitaIva || '';
    }
    return out;
  }

  function fileRow(f) {
    const kind = Core.TIPI_DOCUMENTO[f.kind] || 'Documento';
    const scad = f.scadenza ? ` · scade ${fmtDate(f.scadenza)}` : '';
    const size = f.size ? ` · ${(f.size / 1024 / 1024).toFixed(2).replace('.', ',')} MB` : '';
    return `<li class="file-row">
      <div><b>${esc(f.name)}</b><div class="muted small-note">${esc(kind)} · ${esc(fmtDate(f.date))}${esc(scad)}${esc(size)}</div>${f.note ? `<div class="small-note">${esc(f.note)}</div>` : ''}</div>
      <div class="row-actions">
        <button type="button" class="btn small" data-action="file-download" data-id="${esc(f.id)}">Apri / scarica</button>
        <button type="button" class="btn small danger ghost" data-action="file-delete" data-id="${esc(f.id)}">Elimina</button>
      </div></li>`;
  }

  /* ------------------------------ Elenco clienti ------------------------------ */
  function clientRows(search, showArchived) {
    const q = (search || '').trim().toLowerCase();
    const data = App.data();
    const rows = App.state.clients
      .filter((c) => showArchived || !c.archiviato)
      .filter((c) => !q || `${clientName(c)} ${clientIdentity(c)} ${c.email || ''} ${c.citta || ''}`.toLowerCase().includes(q))
      .map((c) => ({ c, b: Core.clientBalance(c.id, data) }))
      .sort((a, b) => clientName(a.c).localeCompare(clientName(b.c), 'it'));
    if (!rows.length) return `<tr><td colspan="6">${UI.empty(q ? 'Nessun cliente corrisponde alla ricerca.' : 'Nessun cliente. Aggiungine uno con “Nuovo cliente”.')}</td></tr>`;
    return rows.map(({ c, b }) => `
      <tr class="click" data-href="#/clienti/${esc(c.id)}">
        <td><a href="#/clienti/${esc(c.id)}">${esc(clientName(c))}</a>${c.archiviato ? ' ' + badge('muted', 'Archiviato') : ''}
          <div class="muted small-note">${esc(c.tipo === 'azienda' ? 'Azienda' : 'Privato')}${c.citta ? ' · ' + esc(c.citta) : ''}</div></td>
        <td class="mono">${esc(clientIdentity(c) || '—')}</td>
        <td class="num">${esc(Core.formatEuro(b.imponibile))}</td>
        <td class="num">${esc(Core.formatEuro(b.incassato))}</td>
        <td class="num ${b.saldo > 0 ? 'warn-text' : ''}">${esc(Core.formatEuro(b.saldo))}</td>
        <td class="num"><button type="button" class="btn small ghost" data-action="client-edit" data-id="${esc(c.id)}">Modifica</button></td>
      </tr>`).join('');
  }

  V.clientiList = () => {
    const hasArchived = App.state.clients.some((c) => c.archiviato);
    return `
      <header class="page-head">
        <div><p class="eyebrow">Anagrafica</p><h1>Clienti</h1>
          <p class="muted">${App.state.clients.filter((c) => !c.archiviato).length} clienti attivi</p></div>
        <div class="head-actions"><button type="button" class="btn primary" data-action="client-new">+ Nuovo cliente</button></div>
      </header>
      <div class="toolbar">
        <label class="field grow"><span class="lbl">Cerca</span>
          <input type="search" placeholder="Nome, P.IVA, email, città…" value="${esc(App.ui.clientSearch)}" data-input="client-search" aria-label="Cerca cliente"></label>
        ${hasArchived ? `<label class="check"><input type="checkbox" data-change="client-archived"${App.ui.showArchived ? ' checked' : ''}> Mostra archiviati</label>` : ''}
      </div>
      <div class="table-wrap"><table class="table">
        <thead><tr><th>Cliente</th><th>P.IVA / CF</th><th class="num">Fatturato</th><th class="num">Incassato</th><th class="num">Saldo</th><th></th></tr></thead>
        <tbody id="client-rows">${clientRows(App.ui.clientSearch, App.ui.showArchived)}</tbody>
      </table></div>
      <p class="muted small-note">Fatturato = imponibile delle fatture emesse. Saldo = fatturato lordo − incassato: positivo se ti deve ancora pagare, negativo se ha pagato in anticipo.</p>`;
  };

  App.inputs['client-search'] = (el) => {
    App.ui.clientSearch = el.value;
    const tbody = UI.$('#client-rows');
    if (tbody) tbody.innerHTML = clientRows(App.ui.clientSearch, App.ui.showArchived);
  };

  App.changes['client-archived'] = (el) => {
    App.ui.showArchived = el.checked;
    App.refresh();
  };

  // Riga cliccabile (senza rompere i link e i pulsanti interni)
  document.addEventListener('click', (e) => {
    const tr = e.target.closest('tr[data-href]');
    if (!tr || e.target.closest('a, button, input, select, textarea')) return;
    location.hash = tr.dataset.href.replace('#', '');
  });

  /* ------------------------------ Anagrafica (modale) ------------------------------ */
  function openClientModal(client) {
    const isNew = !client;
    const values = client ? client : { tipo: 'privato' };
    UI.modal({
      title: isNew ? 'Nuovo cliente' : `Modifica · ${clientName(client)}`,
      size: 'wide',
      body: `
        <form data-form="client" data-id="${esc(client ? client.id : '')}" novalidate>
          ${UI.fieldsHTML(CLIENT_FIELDS, values)}
          <div class="form-actions">
            <button type="button" class="btn ghost" data-modal-close>Annulla</button>
            <button type="submit" class="btn primary">Salva cliente</button>
          </div>
        </form>`,
    });
  }

  App.actions['client-new'] = () => openClientModal(null);
  App.actions['client-edit'] = (el, e) => {
    if (e) e.stopPropagation();
    openClientModal(clientOf(el.dataset.id));
  };

  App.forms.client = (form) =>
    UI.guard(form, async () => {
      const { values, errors } = UI.readFields(form, CLIENT_FIELDS);
      const existing = form.dataset.id ? clientOf(form.dataset.id) : null;
      const rec = normalizeClient({ ...values, ...(existing ? { archiviato: existing.archiviato } : {}), id: existing ? existing.id : undefined });
      const all = [...errors, ...Core.validateClient(rec)];
      if (all.length) return UI.showErrors(form, all);
      const saved = await App.save('clients', { ...(existing || {}), ...rec });
      UI.closeModalOf(form);
      UI.toast(existing ? 'Cliente aggiornato' : 'Cliente creato');
      App.refresh();
      location.hash = `#/clienti/${saved.id}`;
    });

  /* ------------------------------ Scheda cliente ------------------------------ */
  const TABS = [
    ['panoramica', 'Panoramica'],
    ['progetti', 'Progetti'],
    ['fatture', 'Fatture'],
    ['pagamenti', 'Pagamenti'],
    ['documenti', 'Documenti'],
    ['attivita', 'Attività'],
  ];

  function tabCount(tab, id) {
    const s = App.state;
    switch (tab) {
      case 'progetti': return s.projects.filter((p) => p.clientId === id).length;
      case 'fatture': return s.invoices.filter((i) => i.clientId === id).length;
      case 'pagamenti': return s.payments.filter((p) => p.clientId === id).length;
      case 'documenti': return s.files.filter((f) => f.clientId === id).length;
      case 'attivita': return s.activities.filter((a) => a.clientId === id).length;
      default: return null;
    }
  }

  function tabPanoramica(c) {
    const rows = [
      ['Tipo', c.tipo === 'azienda' ? 'Azienda / libero professionista' : 'Privato'],
      ['Ragione sociale', c.ragioneSociale],
      ['Partita IVA', c.partitaIva],
      ['Codice fiscale', c.codiceFiscale],
      ['Email', c.email],
      ['PEC', c.pec],
      ['Codice SDI', c.sdi],
      ['Telefono', c.telefono],
      ['Indirizzo', [c.indirizzo, [c.cap, c.citta, c.provincia].filter(Boolean).join(' ')].filter(Boolean).join(', ')],
    ].filter(([, v]) => v);
    return `
      <div class="two-col">
        <section class="card">
          <h3>Anagrafica</h3>
          ${rows.length ? `<dl class="dl">${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>` : UI.empty('Nessun dato anagrafico. Usa “Modifica”.')}
        </section>
        <section class="card">
          <h3>Note</h3>
          <form data-form="client-note" data-id="${esc(c.id)}">
            <textarea name="note" rows="8" aria-label="Note cliente" placeholder="Preferenze, storia, cose da ricordare…">${esc(c.note || '')}</textarea>
            <div class="form-actions"><button type="submit" class="btn">Salva note</button></div>
          </form>
        </section>
      </div>`;
  }

  function tabProgetti(c) {
    const projects = App.state.projects.filter((p) => p.clientId === c.id).sort((a, b) => (a.dataInizio || '') < (b.dataInizio || '') ? 1 : -1);
    const rows = projects.map((p) => {
      const invs = App.state.invoices.filter((i) => i.projectId === p.id && i.stato !== 'bozza' && i.stato !== 'annullata');
      const imp = invs.reduce((s, i) => s + Core.invoiceTotals(i).imponibile, 0);
      const inc = invs.reduce((s, i) => s + Core.paidOnInvoice(i.id, App.state.payments), 0);
      return `<tr>
        <td><b>${esc(p.titolo)}</b><div class="muted small-note">${esc(p.servizio || '')}</div></td>
        <td>${badge(p.stato, Core.STATI_PROGETTO[p.stato] || p.stato)}</td>
        <td>${esc(fmtDate(p.dataInizio))} → ${esc(fmtDate(p.dataConsegna))}</td>
        <td class="num">${p.budgetCents ? esc(Core.formatEuro(p.budgetCents)) : '—'}</td>
        <td class="num">${esc(Core.formatEuro(imp))}</td>
        <td class="num">${esc(Core.formatEuro(inc))}</td>
        <td class="num row-actions">
          <button type="button" class="btn small ghost" data-action="project-edit" data-id="${esc(p.id)}">Modifica</button>
          <button type="button" class="btn small ghost danger" data-action="project-delete" data-id="${esc(p.id)}">Elimina</button>
        </td></tr>`;
    });
    return `
      <div class="section-head"><h3>Progetti</h3>
        <button type="button" class="btn primary small" data-action="project-new" data-client="${esc(c.id)}">+ Nuovo progetto</button></div>
      ${rows.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Progetto</th><th>Stato</th><th>Date</th><th class="num">Budget</th><th class="num">Fatturato</th><th class="num">Incassato</th><th></th></tr></thead><tbody>${rows.join('')}</tbody></table></div>` : UI.empty('Nessun progetto per questo cliente.')}`;
  }

  function tabFatture(c) {
    const list = App.state.invoices.filter((i) => i.clientId === c.id).sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1));
    const today = App.today();
    const rows = list.map((i) => {
      const st = Core.invoiceState(i, App.state.payments, today);
      return `<tr class="click" data-href="#/fatture/${esc(i.id)}">
        <td><a href="#/fatture/${esc(i.id)}">${esc(i.number)}</a></td>
        <td>${esc(fmtDate(i.issueDate))}</td>
        <td>${esc(fmtDate(i.dueDate))}</td>
        <td class="num">${esc(Core.formatEuro(st.totale))}</td>
        <td class="num">${esc(Core.formatEuro(st.paid))}</td>
        <td>${badge(st.code, st.label)}</td></tr>`;
    });
    return `
      <div class="section-head"><h3>Fatture</h3>
        <a class="btn primary small" href="#/fatture/nuova" data-action="invoice-prefill" data-client="${esc(c.id)}">+ Nuova fattura</a></div>
      ${rows.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Numero</th><th>Emissione</th><th>Scadenza</th><th class="num">Totale</th><th class="num">Incassato</th><th>Stato</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>` : UI.empty('Nessuna fattura per questo cliente.')}`;
  }

  function tabPagamenti(c) {
    const list = App.state.payments.filter((p) => p.clientId === c.id).sort((a, b) => (a.date < b.date ? 1 : -1));
    const rows = list.map((p) => {
      const inv = p.invoiceId ? App.byId('invoices', p.invoiceId) : null;
      const files = App.state.files.filter((f) => f.relatedId === p.id).length;
      return `<tr>
        <td>${esc(fmtDate(p.date))}</td>
        <td>${inv ? `<a href="#/fatture/${esc(inv.id)}">${esc(inv.number)}</a>` : '<span class="muted">acconto generico</span>'}</td>
        <td>${esc(p.metodo || '—')}</td>
        <td class="num"><b>${esc(Core.formatEuro(p.amountCents))}</b></td>
        <td>${files ? `<span class="muted">${files} ricevuta</span>` : ''}</td>
        <td class="num row-actions">
          <button type="button" class="btn small ghost" data-action="payment-edit" data-id="${esc(p.id)}">Modifica</button>
          <button type="button" class="btn small ghost danger" data-action="payment-delete" data-id="${esc(p.id)}">Elimina</button>
        </td></tr>`;
    });
    return `
      <div class="section-head"><h3>Pagamenti ricevuti</h3>
        <button type="button" class="btn primary small" data-action="payment-new" data-client="${esc(c.id)}">+ Registra incasso</button></div>
      ${rows.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Data</th><th>Fattura</th><th>Metodo</th><th class="num">Importo</th><th></th><th></th></tr></thead><tbody>${rows.join('')}</tbody></table></div>` : UI.empty('Nessun pagamento registrato.')}`;
  }

  function tabDocumenti(c) {
    const invoices = App.state.invoices.filter((i) => i.clientId === c.id);
    const files = App.state.files.filter((f) => f.clientId === c.id).sort((a, b) => (a.date < b.date ? 1 : -1));
    const invOptions = invoices.map((i) => [i.id, `${i.number} · ${fmtDate(i.issueDate)}`]);
    const fields = [
      ...FILE_FIELDS,
      ...(invOptions.length ? [{ name: 'invoiceId', label: 'Collegato a una fattura (facoltativo)', type: 'select', options: invOptions, full: true, empty: '— nessuna —' }] : []),
    ];
    App.ui.fileFields = fields;
    return `
      <section class="card">
        <h3>Carica un documento</h3>
        <p class="muted small-note">Contratti firmati, brief, ricevute, fatture PDF. I file restano solo su questo computer, dentro il gestionale.</p>
        <form data-form="file-upload" data-client="${esc(c.id)}">
          ${UI.fieldsHTML(fields, { date: App.today(), kind: 'contratto' })}
          <div class="form-actions"><button type="submit" class="btn primary">Carica documento</button></div>
        </form>
      </section>
      <section class="card">
        <h3>Documenti (${files.length})</h3>
        ${files.length ? `<ul class="file-list">${files.map(fileRow).join('')}</ul>` : UI.empty('Nessun documento caricato.')}
      </section>`;
  }

  function tabAttivita(c) {
    const list = App.state.activities.filter((a) => a.clientId === c.id).sort((a, b) => (a.date < b.date ? 1 : -1) || (a.createdAt < b.createdAt ? 1 : -1));
    return `
      <div class="section-head"><h3>Attività e cronologia</h3>
        <button type="button" class="btn primary small" data-action="activity-new" data-client="${esc(c.id)}">+ Aggiungi attività</button></div>
      ${list.length ? `<ol class="timeline">${list.map((a) => `
        <li>
          <div class="tl-meta"><b>${esc(Core.TIPI_ATTIVITA[a.tipo] || a.tipo)}</b> · ${esc(fmtDate(a.date))}
            <button type="button" class="link-btn danger" data-action="activity-delete" data-id="${esc(a.id)}">elimina</button></div>
          <p>${esc(a.testo)}</p>
        </li>`).join('')}</ol>` : UI.empty('Nessuna attività registrata. Annota chiamate, email, riunioni e consegne.')}`;
  }

  V.clienteDetail = (id) => {
    const c = clientOf(id);
    if (!c) return `<div class="alert warn">Cliente non trovato. <a href="#/clienti">Torna all’elenco</a>.</div>`;
    const data = App.data();
    const b = Core.clientBalance(c.id, data);
    const tab = App.ui.clientTab || 'panoramica';
    const body = {
      panoramica: tabPanoramica,
      progetti: tabProgetti,
      fatture: tabFatture,
      pagamenti: tabPagamenti,
      documenti: tabDocumenti,
      attivita: tabAttivita,
    }[tab](c);
    return `
      <nav class="crumbs"><a href="#/clienti">Clienti</a> / <span>${esc(clientName(c))}</span></nav>
      <header class="page-head">
        <div>
          <p class="eyebrow">${esc(c.tipo === 'azienda' ? 'Azienda' : 'Privato')}${c.archiviato ? ' · archiviato' : ''}</p>
          <h1>${esc(clientName(c))}</h1>
          <p class="muted">${esc([clientIdentity(c) && `${c.tipo === 'azienda' ? 'P.IVA' : 'CF'} ${clientIdentity(c)}`, c.email, c.telefono].filter(Boolean).join(' · ') || 'Nessun contatto')}</p>
        </div>
        <div class="head-actions">
          <button type="button" class="btn" data-action="client-edit" data-id="${esc(c.id)}">Modifica</button>
          <button type="button" class="btn" data-action="client-archive" data-id="${esc(c.id)}">${c.archiviato ? 'Riattiva' : 'Archivia'}</button>
          <button type="button" class="btn danger ghost" data-action="client-delete" data-id="${esc(c.id)}">Elimina</button>
        </div>
      </header>
      <section class="kpi-grid small">
        <article class="kpi"><span class="kpi-label">Fatturato (netto IVA)</span><strong class="kpi-value">${esc(Core.formatEuro(b.imponibile))}</strong></article>
        <article class="kpi"><span class="kpi-label">Fatturato lordo</span><strong class="kpi-value">${esc(Core.formatEuro(b.totale))}</strong></article>
        <article class="kpi"><span class="kpi-label">Incassato</span><strong class="kpi-value">${esc(Core.formatEuro(b.incassato))}</strong></article>
        <article class="kpi ${b.saldo > 0 ? 'warn' : ''}"><span class="kpi-label">${b.saldo < 0 ? 'Acconto a credito' : 'Da incassare'}</span><strong class="kpi-value">${esc(Core.formatEuro(Math.abs(b.saldo)))}</strong></article>
      </section>
      <nav class="tabs" role="tablist">
        ${TABS.map(([k, label]) => {
          const n = tabCount(k, c.id);
          return `<button type="button" role="tab" aria-selected="${k === tab}" class="tab${k === tab ? ' active' : ''}" data-action="client-tab" data-tab="${k}">${esc(label)}${n !== null ? ` <span class="count">${n}</span>` : ''}</button>`;
        }).join('')}
      </nav>
      <section class="tab-body" role="tabpanel">${body}</section>`;
  };

  App.actions['client-tab'] = (el) => {
    App.ui.clientTab = el.dataset.tab;
    App.refresh();
  };

  App.actions['client-archive'] = async (el) => {
    const c = clientOf(el.dataset.id);
    if (!c) return;
    await App.save('clients', { ...c, archiviato: !c.archiviato });
    UI.toast(c.archiviato ? 'Cliente riattivato' : 'Cliente archiviato. Lo storico resta disponibile.');
    App.refresh();
  };

  App.actions['client-delete'] = async (el) => {
    const c = clientOf(el.dataset.id);
    if (!c) return;
    const hasMoney = App.state.invoices.some((i) => i.clientId === c.id) || App.state.payments.some((p) => p.clientId === c.id);
    if (hasMoney) {
      UI.toast('Questo cliente ha fatture o incassi: non si può eliminare. Usa “Archivia”.', 'err');
      return;
    }
    const ok = await UI.confirmDialog({
      title: 'Eliminare il cliente?',
      message: `Eliminerai ${clientName(c)} insieme a progetti, attività e documenti collegati. Operazione non reversibile.`,
      confirmText: 'Elimina definitivamente',
      danger: true,
    });
    if (!ok) return;
    const projects = App.state.projects.filter((p) => p.clientId === c.id);
    const activities = App.state.activities.filter((a) => a.clientId === c.id);
    const files = App.state.files.filter((f) => f.clientId === c.id);
    for (const f of files) await App.removeFile(f.id);
    for (const a of activities) await App.remove('activities', a.id);
    for (const p of projects) await App.remove('projects', p.id);
    await App.remove('clients', c.id);
    UI.toast('Cliente eliminato');
    location.hash = '#/clienti';
  };

  /* ------------------------------ Note ------------------------------ */
  App.forms['client-note'] = (form) =>
    UI.guard(form, async () => {
      const c = clientOf(form.dataset.id);
      if (!c) return;
      await App.save('clients', { ...c, note: form.elements.note.value });
      UI.toast('Note salvate');
      App.refresh();
    });

  /* ------------------------------ Progetti ------------------------------ */
  function openProjectModal(project, clientId) {
    const values = project || { stato: 'in_corso', clientId };
    UI.modal({
      title: project ? 'Modifica progetto' : 'Nuovo progetto',
      size: 'wide',
      body: `
        <form data-form="project" data-id="${esc(project ? project.id : '')}" data-client="${esc(project ? project.clientId : clientId)}" novalidate>
          ${UI.fieldsHTML(PROJECT_FIELDS, { ...values, budget: values.budgetCents })}
          <div class="form-actions"><button type="button" class="btn ghost" data-modal-close>Annulla</button><button type="submit" class="btn primary">Salva progetto</button></div>
        </form>`,
    });
  }

  App.actions['project-new'] = (el) => openProjectModal(null, el.dataset.client);
  App.actions['project-edit'] = (el) => openProjectModal(App.byId('projects', el.dataset.id), null);
  App.actions['project-delete'] = async (el) => {
    const p = App.byId('projects', el.dataset.id);
    if (!p) return;
    if (App.state.invoices.some((i) => i.projectId === p.id)) {
      UI.toast('Il progetto è collegato a delle fatture: non si può eliminare.', 'err');
      return;
    }
    const ok = await UI.confirmDialog({ title: 'Eliminare il progetto?', message: `“${p.titolo}” verrà eliminato.`, confirmText: 'Elimina', danger: true });
    if (!ok) return;
    await App.remove('projects', p.id);
    UI.toast('Progetto eliminato');
    App.refresh();
  };

  App.forms.project = (form) =>
    UI.guard(form, async () => {
      const { values, errors } = UI.readFields(form, PROJECT_FIELDS);
      const existing = form.dataset.id ? App.byId('projects', form.dataset.id) : null;
      const rec = {
        ...(existing || {}),
        clientId: form.dataset.client,
        titolo: values.titolo,
        servizio: values.servizio || '',
        stato: values.stato,
        budgetCents: values.budget === null ? 0 : values.budget,
        dataInizio: values.dataInizio || '',
        dataConsegna: values.dataConsegna || '',
        note: values.note || '',
      };
      // Un lavoro consegnato o chiuso senza data prende la data di oggi: serve per i report dei lavori chiusi
      if (['consegnato', 'chiuso'].includes(rec.stato) && !rec.dataConsegna) rec.dataConsegna = App.today();
      const all = [...errors, ...Core.validateProject(rec, { clients: App.state.clients })];
      if (all.length) return UI.showErrors(form, all);
      await App.save('projects', rec);
      UI.closeModalOf(form);
      UI.toast('Progetto salvato');
      App.refresh();
    });

  /* ------------------------------ Attività ------------------------------ */
  App.actions['activity-new'] = (el) => {
    UI.modal({
      title: 'Nuova attività',
      body: `
        <form data-form="activity" data-client="${esc(el.dataset.client)}" novalidate>
          ${UI.fieldsHTML(ACTIVITY_FIELDS, { tipo: 'nota', date: App.today() })}
          <div class="form-actions"><button type="button" class="btn ghost" data-modal-close>Annulla</button><button type="submit" class="btn primary">Salva</button></div>
        </form>`,
    });
  };

  App.forms.activity = (form) =>
    UI.guard(form, async () => {
      const { values, errors } = UI.readFields(form, ACTIVITY_FIELDS);
      const all = [...errors, ...Core.validateActivity(values)];
      if (all.length) return UI.showErrors(form, all);
      await App.save('activities', { ...values, clientId: form.dataset.client });
      UI.closeModalOf(form);
      UI.toast('Attività salvata');
      App.refresh();
    });

  App.actions['activity-delete'] = async (el) => {
    const ok = await UI.confirmDialog({ title: 'Eliminare l’attività?', message: 'La voce verrà rimossa dalla cronologia.', confirmText: 'Elimina', danger: true });
    if (!ok) return;
    await App.remove('activities', el.dataset.id);
    App.refresh();
  };

  /* ------------------------------ Documenti ------------------------------ */
  App.forms['file-upload'] = (form) =>
    UI.guard(form, async () => {
      const fields = App.ui.fileFields || FILE_FIELDS;
      const { values, errors } = UI.readFields(form, fields);
      const all = [...errors, ...Core.validateFile(values.file)];
      if (values.date && !Core.isValidISODate(values.date)) all.push('Data non valida.');
      if (values.scadenza && !Core.isValidISODate(values.scadenza)) all.push('Scadenza non valida.');
      if (all.length) return UI.showErrors(form, all);
      await App.addFile(
        {
          name: values.file.name,
          kind: values.kind,
          date: values.date,
          scadenza: values.scadenza || '',
          note: values.note || '',
          clientId: form.dataset.client,
          invoiceId: values.invoiceId || '',
          relatedId: values.invoiceId || '',
          relatedType: values.invoiceId ? 'invoice' : 'client',
        },
        values.file
      );
      UI.toast('Documento caricato');
      App.refresh();
    });

  App.actions['file-download'] = async (el) => {
    const f = App.byId('files', el.dataset.id) || App.state.files.find((x) => x.id === el.dataset.id);
    if (!f) return;
    const blob = await DB.getBlob(f.id);
    if (!blob) {
      UI.toast('Contenuto del documento non trovato', 'err');
      return;
    }
    UI.downloadBlob(f.name, blob);
  };

  App.actions['file-delete'] = async (el) => {
    const f = App.state.files.find((x) => x.id === el.dataset.id);
    if (!f) return;
    const ok = await UI.confirmDialog({ title: 'Eliminare il documento?', message: `“${f.name}” verrà cancellato dal computer. Scaricalo prima se ti serve.`, confirmText: 'Elimina', danger: true });
    if (!ok) return;
    await App.removeFile(f.id);
    UI.toast('Documento eliminato');
    App.refresh();
  };

  App.clientName = clientName;
  App.clientIdentity = clientIdentity;
  App.clientOptions = clientOptions;
  App.normalizeClient = normalizeClient;
  App.fileRow = fileRow;
  App.clientOf = clientOf;
})(typeof window !== 'undefined' ? window : globalThis);
