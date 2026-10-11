/*
 * Andamento annuo, Task, Report settimanale, Fiscale, Esporta, Impostazioni.
 */
(function (root) {
  'use strict';

  const { Core, DB, UI, Fiscale, App } = root;
  const { esc, fmtDate, badge } = UI;
  const V = App.views;

  const yearNow = () => new Date().getFullYear();
  const eur = (c) => Core.formatEuro(c);

  // Grafico a barre SVG generico: series = [{values:[..], cls}], labels
  function barsSVG(labels, series, { ariaLabel, height = 240, fmt = (v) => v } = {}) {
    const W = 760;
    const H = height;
    const left = 48;
    const top = 14;
    const bottom = 30;
    const plotH = H - top - bottom;
    const n = labels.length;
    const max = Math.max(1, ...series.flatMap((s) => s.values));
    const slot = (W - left - 8) / n;
    const groupW = slot * 0.7;
    const bw = groupW / series.length;
    let svg = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(ariaLabel)}">`;
    for (let i = 0; i <= 4; i++) {
      const y = top + plotH - (plotH * i) / 4;
      svg += `<line class="grid" x1="${left}" x2="${W - 8}" y1="${y}" y2="${y}"></line>`;
      svg += `<text class="axis" x="${left - 8}" y="${y + 4}" text-anchor="end">${esc(fmt((max * i) / 4))}</text>`;
    }
    labels.forEach((lab, i) => {
      const x0 = left + i * slot + (slot - groupW) / 2;
      series.forEach((s, k) => {
        const v = s.values[i] || 0;
        const h = (plotH * v) / max;
        svg += `<rect class="bar ${s.cls}" style="animation-delay:${(i * 40 + k * 80)}ms" x="${x0 + k * bw + 2}" y="${top + plotH - h}" width="${Math.max(2, bw - 4)}" height="${h}" rx="3"><title>${esc(lab)} · ${esc(s.name)}: ${esc(fmt(v))}</title></rect>`;
      });
      svg += `<text class="axis" x="${left + i * slot + slot / 2}" y="${H - 10}" text-anchor="middle">${esc(lab)}</text>`;
    });
    return `${svg}</svg>`;
  }

  // Linea (es. saldo cumulato) come SVG
  function lineSVG(labels, values, ariaLabel) {
    const W = 760;
    const H = 180;
    const top = 16;
    const bottom = 28;
    const left = 16;
    const max = Math.max(1, ...values);
    const step = (W - left * 2) / Math.max(1, labels.length - 1);
    const pts = values.map((v, i) => [left + i * step, top + (H - top - bottom) * (1 - v / max)]);
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    const area = `${d} L${pts[pts.length - 1][0].toFixed(1)},${H - bottom} L${left},${H - bottom} Z`;
    return `<svg class="chart line" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(ariaLabel)}">
      <defs><linearGradient id="lg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".45"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>
      <path class="area" d="${area}" fill="url(#lg)"></path><path class="stroke" d="${d}" pathLength="1"></path>
      ${pts.map((p, i) => `<circle class="dot" cx="${p[0]}" cy="${p[1]}" r="3"><title>${esc(labels[i])}: ${esc(eur(Math.round(values[i])))}</title></circle>`).join('')}
      ${labels.map((l, i) => `<text class="axis" x="${left + i * step}" y="${H - 8}" text-anchor="middle">${esc(l)}</text>`).join('')}
    </svg>`;
  }

  App.barsSVG = barsSVG;
  App.lineSVG = lineSVG;

  function fileYear() {
    return App.ui.altroYear || yearNow();
  }

  /* ============================== ANDAMENTO ============================== */
  V.andamento = () => {
    const year = fileYear();
    const trendAll = Fiscale.yearTrend(App.data(), year);
    const labels = trendAll.map((t) => t.short);
    const closedTotal = trendAll.reduce((s, t) => s + t.lavoriChiusi, 0);
    const newTotal = trendAll.reduce((s, t) => s + t.nuoviClienti, 0);
    const fatTot = trendAll.reduce((s, t) => s + t.fatturato, 0);
    const incTot = trendAll.reduce((s, t) => s + t.incassato, 0);
    let cum = 0;
    const cumulative = trendAll.map((t) => (cum += t.incassato));
    const closedList = trendAll.flatMap((t) => t.lavoriChiusiElenco.map((p) => ({ p, m: t.label })));
    const clientName = (id) => {
      const c = App.clientOf(id);
      return c ? App.clientName(c) : '—';
    };
    const rows = closedList
      .sort((a, b) => (a.p.dataConsegna < b.p.dataConsegna ? 1 : -1))
      .map(({ p }) => `<tr>
        <td><b>${esc(p.titolo)}</b><div class="muted small-note">${esc(p.servizio || '')}</div></td>
        <td>${esc(clientName(p.clientId))}</td>
        <td>${esc(fmtDate(p.dataInizio))}</td>
        <td>${esc(fmtDate(p.dataConsegna))}</td>
        <td class="num">${p.dataInizio && p.dataConsegna ? `${Core.daysBetween(p.dataInizio, p.dataConsegna)} gg` : '—'}</td>
        <td>${badge(p.stato, Core.STATI_PROGETTO[p.stato])}</td></tr>`);
    const openProjects = App.state.projects.filter((p) => p.stato === 'in_corso' || p.stato === 'preventivo');
    return `
      <header class="page-head">
        <div><p class="eyebrow">Andamento</p><h1>Andamento ${year}</h1><p class="muted">Gennaio–dicembre. Lavori chiusi con data di apertura e chiusura, nuovi clienti per mese.</p></div>
        <div class="head-actions">${yearPicker(year, 'alt-year')}</div>
      </header>
      <section class="kpi-grid">
        <article class="kpi accent"><span class="kpi-label">Fatturato anno</span><strong class="kpi-value" data-count-eur="${fatTot}">${esc(eur(fatTot))}</strong></article>
        <article class="kpi"><span class="kpi-label">Incassato anno</span><strong class="kpi-value">${esc(eur(incTot))}</strong></article>
        <article class="kpi"><span class="kpi-label">Lavori chiusi</span><strong class="kpi-value" data-count="${closedTotal}">${closedTotal}</strong><span class="delta muted">${openProjects.length} aperti ora</span></article>
        <article class="kpi"><span class="kpi-label">Nuovi clienti</span><strong class="kpi-value" data-count="${newTotal}">${newTotal}</strong></article>
      </section>
      <section class="card">
        <h3>Fatturato e incassi per mese</h3>
        ${barsSVG(labels, [
          { name: 'Fatturato', cls: 'fat', values: trendAll.map((t) => t.fatturato) },
          { name: 'Incassato', cls: 'inc', values: trendAll.map((t) => t.incassato) },
        ], { ariaLabel: `Fatturato e incassi ${year}`, height: 280, fmt: (v) => (v / 100 >= 1000 ? `${Math.round(v / 100000)}k` : String(Math.round(v / 100))) })}
        <div class="legend"><span><i class="sw fat"></i>Fatturato</span><span><i class="sw inc"></i>Incassato</span></div>
      </section>
      <div class="two-col">
        <section class="card">
          <h3>Lavori chiusi per mese</h3>
          ${barsSVG(labels, [{ name: 'Lavori chiusi', cls: 'closed', values: trendAll.map((t) => t.lavoriChiusi) }], { ariaLabel: 'Lavori chiusi per mese', height: 200 })}
        </section>
        <section class="card">
          <h3>Nuovi clienti per mese</h3>
          ${barsSVG(labels, [{ name: 'Nuovi clienti', cls: 'newc', values: trendAll.map((t) => t.nuoviClienti) }], { ariaLabel: 'Nuovi clienti per mese', height: 200 })}
        </section>
      </div>
      <section class="card">
        <h3>Incasso cumulato</h3>
        ${lineSVG(labels, cumulative, 'Incasso cumulato nell’anno')}
      </section>
      <section class="card">
        <div class="section-head"><h3>Lavori chiusi nell’anno (${closedList.length})</h3></div>
        ${closedList.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Lavoro</th><th>Cliente</th><th>Aperto il</th><th>Chiuso il</th><th class="num">Durata</th><th>Stato</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>` : UI.empty('Nessun lavoro chiuso in questo anno. Chiudi i progetti dalla scheda cliente.')}
      </section>`;
  };

  function yearPicker(year, changeKey) {
    const ys = App.fileYearChoices ? App.fileYearChoices() : [yearNow()];
    return `<label class="field"><span class="lbl">Anno</span><select name="year" data-change="${changeKey}">${ys.map((y) => `<option value="${y}"${y === year ? ' selected' : ''}>${y}</option>`).join('')}</select></label>`;
  }

  App.changes['alt-year'] = (el) => {
    App.ui.altroYear = Number(el.value);
    App.refresh();
  };

  /* ============================== TASK ============================== */
  const TASK_FIELDS = [
    { name: 'titolo', label: 'Cosa devi fare', required: true, full: true, placeholder: 'es. Inviare preventivo a Acme' },
    { name: 'scadenza', label: 'Scadenza', type: 'date', hint: 'Facoltativa' },
    { name: 'priorita', label: 'Priorità', type: 'select', options: Object.entries(Fiscale.PRIORITA), empty: false, required: true },
    { name: 'clientId', label: 'Cliente (facoltativo)', type: 'select', options: [], empty: '— nessuno —' },
    { name: 'note', label: 'Note', type: 'textarea', full: true },
  ];

  function taskFields() {
    return TASK_FIELDS.map((f) => (f.name === 'clientId' ? { ...f, options: App.clientOptions('') } : f));
  }

  function taskItem(t, today) {
    const b = Fiscale.taskBucket(t, today);
    const c = t.clientId ? App.clientOf(t.clientId) : null;
    const pr = { alta: 'danger', media: 'warn', bassa: 'muted' }[t.priorita] || 'muted';
    return `<li class="task ${b}">
      <button type="button" class="check-btn" data-action="task-toggle" data-id="${esc(t.id)}" aria-label="${t.stato === 'fatto' ? 'Riapri' : 'Segna fatto'}">${t.stato === 'fatto' ? '✓' : ''}</button>
      <div class="task-body" data-action="task-edit" data-id="${esc(t.id)}">
        <b>${esc(t.titolo)}</b>
        <div class="muted small-note">${t.scadenza ? `scadenza ${esc(fmtDate(t.scadenza))}` : 'senza scadenza'}${c ? ` · ${esc(App.clientName(c))}` : ''}</div>
      </div>
      <span class="badge ${pr}">${esc(Fiscale.PRIORITA[t.priorita] || '')}</span>
    </li>`;
  }

  V.tasks = () => {
    const today = App.today();
    const all = App.state.tasks;
    const groups = [
      ['scaduto', 'In ritardo', 'danger'],
      ['oggi', 'Oggi', 'accent'],
      ['prossimo', 'Prossimi', ''],
      ['senza', 'Senza scadenza', ''],
      ['fatto', 'Completati', 'muted'],
    ];
    const open = all.filter((t) => t.stato !== 'fatto').length;
    const body = groups.map(([k, label, tone]) => {
      const list = all
        .filter((t) => Fiscale.taskBucket(t, today) === k)
        .sort((a, b) => (a.scadenza || '9999') < (b.scadenza || '9999') ? -1 : 1);
      if (!list.length) return '';
      return `<section class="card task-group ${tone}"><h3>${esc(label)} <span class="count">${list.length}</span></h3><ul class="task-list">${list.map((t) => taskItem(t, today)).join('')}</ul></section>`;
    }).join('');
    return `
      <header class="page-head">
        <div><p class="eyebrow">Da fare</p><h1>Task</h1><p class="muted">${open} aperti · ${all.length - open} completati</p></div>
        <div class="head-actions"><button type="button" class="btn primary" data-action="task-new">+ Nuovo task</button></div>
      </header>
      ${all.length ? body : UI.empty('Nessun task. Aggiungi le cose da non dimenticare: scadenze fiscali, follow-up, consegne.')}`;
  };

  function openTaskModal(task) {
    const values = task ? task : { priorita: 'media' };
    UI.modal({
      title: task ? 'Modifica task' : 'Nuovo task',
      body: `<form data-form="task" data-id="${esc(task ? task.id : '')}" novalidate>
        ${UI.fieldsHTML(taskFields(), values)}
        <div class="form-actions">${task ? `<button type="button" class="btn danger ghost" data-action="task-delete" data-id="${esc(task.id)}">Elimina</button>` : ''}<span class="grow"></span><button type="button" class="btn ghost" data-modal-close>Annulla</button><button type="submit" class="btn primary">Salva</button></div>
      </form>`,
    });
  }

  App.actions['task-new'] = () => openTaskModal(null);
  App.actions['task-edit'] = (el) => openTaskModal(App.byId('tasks', el.dataset.id));

  App.actions['task-toggle'] = async (el, e) => {
    if (e) e.stopPropagation();
    const t = App.byId('tasks', el.dataset.id);
    if (!t) return;
    const fatto = t.stato !== 'fatto';
    await App.save('tasks', { ...t, stato: fatto ? 'fatto' : 'aperto', completedAt: fatto ? new Date().toISOString() : null });
    App.refresh();
  };

  App.actions['task-delete'] = async (el) => {
    const t = App.byId('tasks', el.dataset.id);
    if (!t) return;
    const ok = await UI.confirmDialog({ title: 'Eliminare il task?', message: `“${t.titolo}” verrà eliminato.`, confirmText: 'Elimina', danger: true });
    if (!ok) return;
    UI.closeTopModal();
    await App.remove('tasks', t.id);
    UI.toast('Task eliminato');
    App.refresh();
  };

  App.forms.task = (form) =>
    UI.guard(form, async () => {
      const { values, errors } = UI.readFields(form, taskFields());
      const existing = form.dataset.id ? App.byId('tasks', form.dataset.id) : null;
      const rec = { ...(existing || {}), titolo: values.titolo, scadenza: values.scadenza || '', priorita: values.priorita, clientId: values.clientId || '', note: values.note || '', stato: existing ? existing.stato : 'aperto' };
      const all = [...errors, ...Fiscale.validateTask(rec)];
      if (all.length) return UI.showErrors(form, all);
      await App.save('tasks', rec);
      UI.closeModalOf(form);
      UI.toast('Task salvato');
      App.refresh();
    });

  /* ============================== REPORT SETTIMANALE ============================== */
  function weekParam() {
    return App.ui.weekAnchor || App.today();
  }

  function weekHTML(r, anchor, standalone) {
    const period = `${fmtDate(r.from)} → ${fmtDate(r.to)}`;
    const lista = (items, render, empty) => (items.length ? `<ul class="plain-list">${items.map(render).join('')}</ul>` : `<p class="muted">${esc(empty)}</p>`);
    const clientName = (id) => {
      const c = App.clientOf(id);
      return c ? App.clientName(c) : '—';
    };
    const body = `
      <section class="kpi-grid">
        <article class="kpi accent"><span class="kpi-label">Fatturato</span><strong class="kpi-value">${esc(eur(r.fatturato))}</strong><span class="delta muted">${r.fattureEmesse} fatture emesse</span></article>
        <article class="kpi"><span class="kpi-label">Incassato</span><strong class="kpi-value">${esc(eur(r.incassato))}</strong><span class="delta muted">${r.incassi.length} incassi</span></article>
        <article class="kpi"><span class="kpi-label">Spese</span><strong class="kpi-value">${esc(eur(r.spese))}</strong></article>
        <article class="kpi ${r.utile < 0 ? 'bad' : ''}"><span class="kpi-label">Utile di cassa</span><strong class="kpi-value">${esc(eur(r.utile))}</strong></article>
        <article class="kpi"><span class="kpi-label">Lavori chiusi</span><strong class="kpi-value">${r.lavoriChiusi.length}</strong></article>
        <article class="kpi"><span class="kpi-label">Nuovi clienti</span><strong class="kpi-value">${r.nuoviClienti.length}</strong></article>
      </section>
      <div class="two-col">
        <section class="card"><h3>Lavori chiusi questa settimana</h3>
          ${lista(r.lavoriChiusi, (p) => `<li><b>${esc(p.titolo)}</b> · ${esc(clientName(p.clientId))}<div class="muted small-note">aperto ${esc(fmtDate(p.dataInizio))} · chiuso ${esc(fmtDate(p.dataConsegna))}${p.durataGiorni !== null ? ` · ${p.durataGiorni} giorni` : ''}</div></li>`, 'Nessun lavoro chiuso.')}
        </section>
        <section class="card"><h3>Nuovi clienti</h3>
          ${lista(r.nuoviClienti, (c) => `<li><b>${esc(App.clientName(c))}</b></li>`, 'Nessun nuovo cliente.')}
        </section>
      </div>
      <div class="two-col">
        <section class="card"><h3>Task completati (${r.tasksFatti.length})</h3>
          ${lista(r.tasksFatti, (t) => `<li>✓ ${esc(t.titolo)}</li>`, 'Nessun task completato.')}
        </section>
        <section class="card"><h3>Da fare nei prossimi giorni</h3>
          ${lista(r.tasksAperti.filter((t) => !t.scadenza || t.scadenza >= r.from).slice(0, 12), (t) => `<li>${esc(t.titolo)}<span class="right muted">${t.scadenza ? esc(fmtDate(t.scadenza)) : ''}</span></li>`, 'Niente in agenda.')}
          ${r.tasksScaduti.length ? `<p class="label-danger">In ritardo: ${r.tasksScaduti.length}</p>` : ''}
        </section>
      </div>
      <section class="card"><h3>Incassi e attività</h3>
        ${lista(r.incassi, (p) => `<li>${esc(fmtDate(p.date))} · ${esc(clientName(p.clientId))}<span class="right">${esc(eur(p.amountCents))}</span></li>`, 'Nessun incasso in questa settimana.')}
        <p class="muted small-note">Attività registrate nelle schede clienti: ${r.attivita.length}</p>
      </section>`;
    if (standalone) return { title: `Report settimana ${period}`, body, period };
    return `
      <header class="page-head">
        <div><p class="eyebrow">Settimana</p><h1>Report settimanale</h1><p class="muted">${esc(period)} · lunedì–domenica</p></div>
        <div class="head-actions">
          <label class="field"><span class="lbl">Settimana del</span><input type="date" value="${esc(anchor)}" data-change="week-anchor"></label>
          <button type="button" class="btn primary" data-action="week-download">Scarica report (HTML)</button>
          <button type="button" class="btn" data-action="week-print">Stampa / PDF</button>
        </div>
      </header>
      <div id="week-body" class="stagger">${body}</div>`;
  }

  V.settimana = () => {
    const anchor = weekParam();
    const r = Fiscale.weekReport(App.data(), anchor, App.today());
    return weekHTML(r, anchor, false);
  };

  App.changes['week-anchor'] = (el) => {
    if (!Core.isValidISODate(el.value)) return;
    App.ui.weekAnchor = el.value;
    App.refresh();
  };

  function standaloneReport(title, body, styleKind) {
    return `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
      <style>
        body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111;margin:40px;max-width:980px}
        h1{font-size:26px;margin:0 0 6px} h3{margin:22px 0 8px;border-bottom:1px solid #ddd;padding-bottom:4px}
        .kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.kpi{border:1px solid #ddd;border-radius:8px;padding:10px}
        .kpi b{display:block;font-size:18px}.muted{color:#666;font-size:12px}
        table{width:100%;border-collapse:collapse;font-size:13px}th,td{padding:6px;border-bottom:1px solid #eee;text-align:left}
        td.n,th.n{text-align:right}ul{padding-left:18px}.warn{color:#a15c00}.bad{color:#b00020}
        @media print{body{margin:14mm}}
      </style></head><body><h1>${esc(title)}</h1>${body}<p class="muted">Generato il ${esc(fmtDate(App.today()))}. Stime e riepiloghi: verifiche con il commercialista.</p></body></html>`;
  }

  App.actions['week-download'] = () => {
    const anchor = weekParam();
    const r = Fiscale.weekReport(App.data(), anchor, App.today());
    const s = weekHTML(r, anchor, true);
    UI.downloadText(`report-settimana-${r.from}.html`, standaloneReport(s.title, s.body, 'settimana'), 'text/html;charset=utf-8');
  };

  App.actions['week-print'] = () => {
    const anchor = weekParam();
    const r = Fiscale.weekReport(App.data(), anchor, App.today());
    const s = weekHTML(r, anchor, true);
    const area = document.getElementById('print-area');
    if (area) area.innerHTML = `<div class="print-page"><h1>${esc(s.title)}</h1>${s.body}</div>`;
    root.print();
  };

  /* ============================== FISCALE ============================== */
  function fiscalCfg() {
    return App.settings().fiscal || Fiscale.DEFAULT_FISCAL;
  }

  function fiscalData(year) {
    const cfg = fiscalCfg();
    const ricavi = Fiscale.ricaviIncassati(App.data(), year);
    const t = Fiscale.taxEstimate({ anno: year, ricaviCents: ricavi, cfg });
    const today = App.today();
    const mesi = Number(today.slice(0, 4)) === year ? Number(today.slice(5, 7)) : 12;
    const proiezione = Fiscale.projectYear(ricavi, mesi);
    const pt = Fiscale.taxEstimate({ anno: year, ricaviCents: proiezione, cfg });
    const fatturato = App.state.invoices
      .filter((i) => i.stato === 'emessa' && Number(i.issueDate.slice(0, 4)) === year)
      .reduce((s, i) => s + Core.invoiceTotals(i).imponibile, 0);
    return { cfg, t, pt, ricavi, fatturato, mesi, proiezione };
  }

  function fiscalHTML(year) {
    const { cfg, t, pt, fatturato, mesi, proiezione } = fiscalData(year);
    const nextYear = Fiscale.taxEstimate({ anno: year + 1, ricaviCents: pt.ricavi, cfg });
    const ultimoAnnoAgevolato = Number(cfg.annoInizio) + Number(cfg.anniStartup) - 1;
    return `
      <header class="page-head">
        <div><p class="eyebrow">Fisco · regime forfettario</p><h1>Stima fiscale ${year}</h1>
          <p class="muted">Stima basata sugli incassi dell’anno. Non sostituisce il commercialista.</p></div>
        <div class="head-actions">
          ${yearPicker(year, 'fisc-year')}
          <button type="button" class="btn primary" data-action="fiscal-download">Scarica report (HTML)</button>
          <button type="button" class="btn" data-action="fiscal-print">Stampa / PDF</button>
          <button type="button" class="btn" data-action="fiscal-csv">CSV</button>
        </div>
      </header>
      <section class="kpi-grid">
        <article class="kpi accent"><span class="kpi-label">Da versare (stima)</span><strong class="kpi-value">${esc(eur(t.totaleDaPagare))}</strong><span class="delta muted">contributi + imposta</span></article>
        <article class="kpi"><span class="kpi-label">Contributi INPS (${esc(String(t.aliquotaInps).replace('.', ','))}%)</span><strong class="kpi-value">${esc(eur(t.contributi))}</strong></article>
        <article class="kpi"><span class="kpi-label">Imposta sostitutiva (${t.aliquotaImposta}%)</span><strong class="kpi-value">${esc(eur(t.imposta))}</strong><span class="delta muted">${t.inStartup ? 'aliquota agevolata primi 5 anni' : 'aliquota ordinaria'}</span></article>
        <article class="kpi"><span class="kpi-label">Netto stimato</span><strong class="kpi-value">${esc(eur(t.nettoStimato))}</strong><span class="delta muted">pressione fiscale ${esc(String(t.effettivo).replace('.', ','))}%</span></article>
      </section>
      <div class="two-col">
        <section class="card">
          <h3>Come è calcolato</h3>
          <dl class="dl">
            <dt>Compensi incassati ${year}</dt><dd>${esc(eur(t.ricavi))}</dd>
            <dt>Coefficiente redditività</dt><dd>${esc(String(t.coefficiente).replace('.', ','))}%</dd>
            <dt>Reddito lordo</dt><dd>${esc(eur(t.redditoLordo))}</dd>
            <dt>− Contributi INPS</dt><dd>${esc(eur(t.contributi))}</dd>
            <dt>Imponibile</dt><dd>${esc(eur(t.imponibile))}</dd>
            <dt>Imposta (${t.aliquotaImposta}%)</dt><dd>${esc(eur(t.imposta))}</dd>
          </dl>
          <p class="muted small-note">I contributi sono deducibili dal reddito prima dell’imposta sostitutiva. Il coefficiente dipende dal codice ATECO: conferma il tuo.</p>
        </section>
        <section class="card">
          <h3>Soglia e proiezione</h3>
          <p>Limite regime: <b>${esc(eur(cfg.sogliaRicavi * 100))}</b> di compensi. Hai usato il <b>${t.percentualeSoglia}%</b>.</p>
          <div class="meter big"><i style="width:${t.percentualeSoglia}%"></i></div>
          ${t.sogliaRaggiunta ? `<p class="label-danger">Hai superato la soglia: dall’anno successivo il regime cessa.</p>` : ''}
          <ul class="plain-list">
            <li>Fatturato dell’anno (netto IVA): <b>${esc(eur(fatturato))}</b></li>
            <li>Proiezione a fine anno sui ${mesi} mesi trascorsi: <b>${esc(eur(proiezione))}</b></li>
            <li>Da versare sulla proiezione: <b>${esc(eur(pt.totaleDaPagare))}</b></li>
            <li>Imposta agevolata: ${year <= ultimoAnnoAgevolato && year >= Number(cfg.annoInizio) ? `valida fino al ${ultimoAnnoAgevolato} (se ne hai i requisiti)` : 'non applicabile in questo anno'}</li>
          </ul>
        </section>
      </div>
      <section class="card">
        <h3>Anno successivo (stima ${year + 1})</h3>
        <p class="muted small-note">Basato sulla proiezione di ${year}: ${esc(eur(nextYear.totaleDaPagare))} tra contributi e imposta, con aliquota ${nextYear.aliquotaImposta}%.</p>
        <p class="small-note">Il saldo e gli acconti seguono le scadenze fiscali del tuo commercialista: per ora il gestionale non calcola gli acconti.</p>
      </section>`;
  }

  V.fiscale = () => fiscalHTML(fileYear());

  App.changes['fisc-year'] = (el) => {
    App.ui.altroYear = Number(el.value);
    App.refresh();
  };

  function fiscalReport(year) {
    const { t, pt, fatturato, ricavi } = fiscalData(year);
    const body = `
      <table><tbody>
        <tr><td>Compensi incassati ${year}</td><td class="n">${esc(eur(ricavi))}</td></tr>
        <tr><td>Fatturato netto IVA ${year}</td><td class="n">${esc(eur(fatturato))}</td></tr>
        <tr><td>Coefficiente di redditività</td><td class="n">${esc(String(t.coefficiente).replace('.', ','))}%</td></tr>
        <tr><td>Reddito lordo</td><td class="n">${esc(eur(t.redditoLordo))}</td></tr>
        <tr><td>Contributi INPS (${esc(String(t.aliquotaInps).replace('.', ','))}%)</td><td class="n">${esc(eur(t.contributi))}</td></tr>
        <tr><td>Imponibile</td><td class="n">${esc(eur(t.imponibile))}</td></tr>
        <tr><td>Imposta sostitutiva (${t.aliquotaImposta}%)</td><td class="n">${esc(eur(t.imposta))}</td></tr>
        <tr><td><b>Totale stimato da versare</b></td><td class="n"><b>${esc(eur(t.totaleDaPagare))}</b></td></tr>
      </tbody></table>
      <h3>Proiezione fine anno</h3>
      <p>Compensi proiettati: ${esc(eur(pt.ricavi))} · da versare stimato: ${esc(eur(pt.totaleDaPagare))}</p>
      <p class="muted">Basato sul principio di cassa: contano gli incassi dell’anno. Coefficiente e aliquote configurabili in Impostazioni.</p>`;
    return { title: `Report fiscale ${year}`, body };
  }

  App.actions['fiscal-download'] = () => {
    const year = fileYear();
    const r = fiscalReport(year);
    UI.downloadText(`report-fiscale-${year}.html`, standaloneReport(r.title, r.body, 'fiscale'), 'text/html;charset=utf-8');
  };

  App.actions['fiscal-print'] = () => {
    const r = fiscalReport(fileYear());
    const area = document.getElementById('print-area');
    if (area) area.innerHTML = `<div class="print-page"><h1>${esc(r.title)}</h1>${r.body}</div>`;
    root.print();
  };

  App.actions['fiscal-csv'] = () => {
    const year = fileYear();
    const { t } = fiscalData(year);
    const rows = [
      { voce: 'Compensi incassati', cents: t.ricavi },
      { voce: 'Reddito lordo', cents: t.redditoLordo },
      { voce: 'Contributi INPS', cents: t.contributi },
      { voce: 'Imponibile', cents: t.imponibile },
      { voce: 'Imposta sostitutiva', cents: t.imposta },
      { voce: 'Totale da versare', cents: t.totaleDaPagare },
    ];
    const csv = Core.toCsv(
      [{ label: 'Voce', get: (r) => r.voce }, { label: 'Importo (€)', get: (r) => Core.centsToPlain(r.cents) }],
      rows
    );
    UI.downloadText(`stima-fiscale-${year}.csv`, csv);
  };

  /* ============================== ESPORTA ============================== */
  V.esporta = () => {
    const year = fileYear();
    const s = App.settings();
    return `
      <header class="page-head"><div><p class="eyebrow">Dati</p><h1>Esporta e backup</h1>
        <p class="muted">I tuoi dati sono in questo browser. Fai un backup ogni settimana: è l’unica copia di sicurezza.</p></div></header>
      <div class="two-col">
        <section class="card">
          <h3>Backup completo</h3>
          <p class="muted small-note">Un file JSON con tutto: clienti, fatture, incassi, spese, task, attività e documenti. Puoi reimportarlo su un altro dispositivo o dopo una pulizia del browser.</p>
          <div class="form-actions left"><button type="button" class="btn primary" data-action="backup-export">Scarica backup</button></div>
          <p class="small-note muted">${s.lastBackupAt ? `Ultimo backup: ${esc(fmtDate(s.lastBackupAt.slice(0, 10)))}` : 'Nessun backup ancora.'}</p>
          <hr>
          <h3>Copie di sicurezza automatiche</h3>
          <p class="muted small-note">Il gestionale salva da solo una copia dei dati prima di ogni eliminazione e ogni 10 minuti mentre lavori. Puoi tornare indietro da qui.</p>
          <div class="form-actions left"><button type="button" class="btn small" data-action="snap-now">Crea copia ora</button></div>
          <ul id="snap-list" class="snap-list" aria-live="polite"><li class="muted">Caricamento copie…</li></ul>
          <hr>
          <h3>Ripristina da backup</h3>
          <form data-form="import-backup" novalidate>
            <label class="field full"><span class="lbl">File di backup (.json)</span><input type="file" name="file" accept="application/json,.json"></label>
            <p class="small-note label-danger">Attenzione: il ripristino sostituisce tutti i dati attuali.</p>
            <div class="form-actions left"><button type="submit" class="btn danger">Ripristina</button></div>
          </form>
        </section>
        <section class="card">
          <h3>Esportazioni CSV per il commercialista</h3>
          <p class="muted small-note">Separatore punto e virgola, virgola decimale: si apre direttamente in Excel italiano.</p>
          <div class="yearrow">${yearPicker(year, 'alt-year')}</div>
          <div class="btn-grid">
            <button type="button" class="btn" data-action="csv" data-what="fatture">Fatture</button>
            <button type="button" class="btn" data-action="csv" data-what="incassi">Incassi</button>
            <button type="button" class="btn" data-action="csv" data-what="spese">Spese</button>
            <button type="button" class="btn" data-action="csv" data-what="clienti">Clienti e saldi</button>
            <button type="button" class="btn" data-action="csv" data-what="mensile">Riepilogo mensile</button>
          </div>
        </section>
      </div>`;
  };

  App.actions['csv'] = (el) => {
    const year = fileYear();
    const d = App.data();
    const what = el.dataset.what;
    const today = App.today();
    const money = (c) => Core.centsToPlain(c);
    let csv;
    let name;
    if (what === 'fatture') {
      name = `fatture-${year}.csv`;
      const rows = d.invoices.filter((i) => Number(i.issueDate.slice(0, 4)) === year).sort((a, b) => (a.issueDate < b.issueDate ? -1 : 1));
      csv = Core.toCsv([
        { label: 'Numero', get: (i) => i.number }, { label: 'Data emissione', get: (i) => i.issueDate }, { label: 'Scadenza', get: (i) => i.dueDate },
        { label: 'Cliente', get: (i) => { const c = App.clientOf(i.clientId); return c ? App.clientName(c) : ''; } },
        { label: 'Stato', get: (i) => Core.invoiceState(i, d.payments, today).label },
        { label: 'Imponibile', get: (i) => money(Core.invoiceTotals(i).imponibile) }, { label: 'IVA', get: (i) => money(Core.invoiceTotals(i).iva) },
        { label: 'Totale', get: (i) => money(Core.invoiceTotals(i).totale) }, { label: 'Incassato', get: (i) => money(Core.invoiceState(i, d.payments, today).paid) },
      ], rows);
    } else if (what === 'incassi') {
      name = `incassi-${year}.csv`;
      const rows = d.payments.filter((p) => Number(p.date.slice(0, 4)) === year).sort((a, b) => (a.date < b.date ? -1 : 1));
      csv = Core.toCsv([
        { label: 'Data', get: (p) => p.date }, { label: 'Cliente', get: (p) => { const c = App.clientOf(p.clientId); return c ? App.clientName(c) : ''; } },
        { label: 'Fattura', get: (p) => { const i = p.invoiceId ? App.byId('invoices', p.invoiceId) : null; return i ? i.number : ''; } },
        { label: 'Metodo', get: (p) => p.metodo || '' }, { label: 'Importo', get: (p) => money(p.amountCents) }, { label: 'Note', get: (p) => p.note || '' },
      ], rows);
    } else if (what === 'spese') {
      name = `spese-${year}.csv`;
      const rows = d.expenses.filter((e) => Number(e.date.slice(0, 4)) === year).sort((a, b) => (a.date < b.date ? -1 : 1));
      csv = Core.toCsv([
        { label: 'Data', get: (e) => e.date }, { label: 'Descrizione', get: (e) => e.descrizione }, { label: 'Fornitore', get: (e) => e.fornitore || '' },
        { label: 'Categoria', get: (e) => e.categoria }, { label: 'Importo', get: (e) => money(e.amountCents) },
      ], rows);
    } else if (what === 'clienti') {
      name = 'clienti-saldi.csv';
      csv = Core.toCsv([
        { label: 'Cliente', get: (c) => App.clientName(c) }, { label: 'Tipo', get: (c) => c.tipo }, { label: 'P.IVA / CF', get: (c) => App.clientIdentity(c) },
        { label: 'Email', get: (c) => c.email || '' }, { label: 'Città', get: (c) => c.citta || '' },
        { label: 'Fatturato netto', get: (c) => money(Core.clientBalance(c.id, d).imponibile) },
        { label: 'Incassato', get: (c) => money(Core.clientBalance(c.id, d).incassato) },
        { label: 'Saldo', get: (c) => money(Core.clientBalance(c.id, d).saldo) },
      ], d.clients);
    } else {
      name = `riepilogo-mensile-${year}.csv`;
      const trend = Fiscale.yearTrend(d, year);
      csv = Core.toCsv([
        { label: 'Mese', get: (t) => t.label }, { label: 'Fatturato', get: (t) => money(t.fatturato) }, { label: 'Incassato', get: (t) => money(t.incassato) },
        { label: 'Spese', get: (t) => money(t.spese) }, { label: 'Utile cassa', get: (t) => money(t.incassato - t.spese) },
        { label: 'Lavori chiusi', get: (t) => t.lavoriChiusi }, { label: 'Nuovi clienti', get: (t) => t.nuoviClienti },
      ], trend);
    }
    UI.downloadText(name, csv);
  };

  App.actions['backup-export'] = async () => {
    const backup = await DB.exportAll();
    const stamp = App.today();
    // JSON puro, senza BOM: il BOM serve ai CSV per Excel, ma romperebbe la rilettura del backup
    UI.downloadBlob(`gestionale-backup-${stamp}.json`, new Blob([JSON.stringify(backup)], { type: 'application/json' }));
    await App.saveSettings({ lastBackupAt: new Date().toISOString() });
    UI.toast('Backup scaricato');
    App.refresh();
  };

  // Elenco delle copie di sicurezza (caricato dopo il render della pagina Esporta)
  App.loadSnapshotList = async () => {
    const box = UI.$('#snap-list');
    if (!box) return;
    const list = await DB.listSnapshots();
    if (!list.length) {
      box.innerHTML = '<li class="muted">Nessuna copia ancora: verrà creata alla prossima modifica.</li>';
      return;
    }
    box.innerHTML = list.slice(0, 40).map((s) => `<li>
        <div><b>${esc(new Date(s.savedAt).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }))}</b>
          <span class="muted"> · ${esc(s.reason)}</span>
          <div class="muted small-note">${esc(Object.entries(s.counts || {}).map(([k, v]) => `${v} ${k}`).join(' · '))}</div></div>
        <button type="button" class="btn small ghost" data-action="snap-restore" data-id="${esc(s.id)}">Ripristina</button>
      </li>`).join('');
  };

  App.actions['snap-now'] = async () => {
    await App.snapshot('manuale');
    UI.toast('Copia di sicurezza creata');
    App.loadSnapshotList();
  };

  App.actions['snap-restore'] = async (el) => {
    const ok = await UI.confirmDialog({
      title: 'Ripristinare questa copia?',
      message: 'I record attuali (clienti, fatture, incassi, spese, task) verranno sostituiti. Prima viene salvata una copia dello stato attuale, quindi potrai tornare indietro. I documenti non vengono toccati.',
      confirmText: 'Ripristina',
      danger: true,
    });
    if (!ok) return;
    await App.restoreSnapshot(el.dataset.id);
    UI.toast('Copia ripristinata');
    App.refresh();
  };

  App.forms['import-backup'] = (form) =>
    UI.guard(form, async () => {
      const file = form.elements.file.files[0];
      if (!file) return UI.showErrors(form, ['Seleziona un file di backup.']);
      let obj;
      try {
        // Toglie un eventuale BOM iniziale (es. file salvati da altri programmi)
        obj = JSON.parse((await file.text()).replace(/^\uFEFF/, ''));
        DB.validateBackup(obj);
      } catch (e) {
        return UI.showErrors(form, [`File non valido: ${e.message}`]);
      }
      const ok = await UI.confirmDialog({
        title: 'Ripristinare il backup?',
        message: `Tutti i dati attuali verranno sostituiti da quelli del backup (${obj.exportedAt ? fmtDate(obj.exportedAt.slice(0, 10)) : 'data sconosciuta'}).`,
        confirmText: 'Sostituisci i dati',
        danger: true,
      });
      if (!ok) return;
      await DB.importAll(obj);
      App.state = { ...App.state, ...(await DB.loadAll()) };
      const stored = App.state.settings || {};
      App.state.settings = { ...App.state.settings, fiscal: { ...Fiscale.DEFAULT_FISCAL, ...(stored.fiscal || {}) } };
      UI.toast('Backup ripristinato');
      App.refresh();
    });

  /* ============================== IMPOSTAZIONI ============================== */
  const SETTINGS_FIELDS = [
    { name: 'tipoAttivita', label: 'Intestato a', type: 'select', options: [['privato', 'Persona fisica / libero professionista'], ['azienda', 'Società']], empty: false },
    { name: 'nome', label: 'Nome' },
    { name: 'cognome', label: 'Cognome' },
    { name: 'ragioneSociale', label: 'Ragione sociale (se società)' },
    { name: 'partitaIva', label: 'Partita IVA' },
    { name: 'codiceFiscale', label: 'Codice fiscale' },
    { name: 'indirizzo', label: 'Indirizzo', full: true },
    { name: 'cap', label: 'CAP' },
    { name: 'citta', label: 'Città' },
    { name: 'provincia', label: 'Provincia' },
    { name: 'email', label: 'Email' },
    { name: 'telefono', label: 'Telefono' },
    { name: 'iban', label: 'IBAN (per le fatture)' },
    { name: 'regimeFiscale', label: 'Riga regime fiscale in fattura', full: true, placeholder: 'es. Operazione in franchigia IVA ai sensi art. 1, commi 54-89, L. 190/2014' },
    { name: 'ivaDefault', label: 'IVA predefinita %', type: 'number', step: '0.01', min: 0 },
    { name: 'giorniScadenza', label: 'Giorni di pagamento predefiniti', type: 'number', min: 0 },
  ];

  const FISCAL_FIELDS = [
    { name: 'regimeForfettario', label: 'Regime forfettario attivo', type: 'checkbox' },
    { name: 'annoInizio', label: 'Anno di inizio attività', type: 'number', min: 2000 },
    { name: 'coefficiente', label: 'Coefficiente di redditività %', type: 'number', step: '0.01', hint: 'Dipende dal codice ATECO. Confermalo con il commercialista.' },
    { name: 'aliquotaInps', label: 'Contributi INPS %', type: 'number', step: '0.01', hint: 'Aliquota gestione separata: impostala come ti ha indicato il commercialista.' },
    { name: 'aliquotaStartup', label: 'Imposta agevolata %', type: 'number', step: '0.01' },
    { name: 'anniStartup', label: 'Anni di imposta agevolata', type: 'number', min: 1 },
    { name: 'aliquotaSostitutiva', label: 'Imposta sostitutiva ordinaria %', type: 'number', step: '0.01' },
    { name: 'sogliaRicavi', label: 'Soglia ricavi (€)', type: 'number', step: '1' },
  ];

  V.impostazioni = () => {
    const s = App.settings();
    const values = { ...s };
    const f = { ...Fiscale.DEFAULT_FISCAL, ...(s.fiscal || {}) };
    return `
      <header class="page-head"><div><p class="eyebrow">Configurazione</p><h1>Impostazioni</h1></div></header>
      <form data-form="settings" novalidate>
        <section class="card"><h3>Dati della tua attività</h3>${UI.fieldsHTML(SETTINGS_FIELDS, values)}</section>
        <section class="card"><h3>Parametri fiscali (stime)</h3>
          <p class="muted small-note">Sono i valori usati nella stima fiscale. Modificali solo con indicazioni del commercialista.</p>
          ${UI.fieldsHTML(FISCAL_FIELDS, f)}
        </section>
        <div class="form-actions"><button type="submit" class="btn primary">Salva impostazioni</button></div>
      </form>`;
  };

  App.forms.settings = (form) =>
    UI.guard(form, async () => {
      const { values, errors } = UI.readFields(form, SETTINGS_FIELDS);
      const fiscalRead = UI.readFields(form, FISCAL_FIELDS);
      const numErr = [];
      for (const k of ['coefficiente', 'aliquotaInps', 'aliquotaStartup', 'aliquotaSostitutiva', 'sogliaRicavi', 'anniStartup', 'annoInizio']) {
        const v = fiscalRead.values[k];
        if (v === null || !Number.isFinite(v) || v < 0) numErr.push(`Parametro fiscale “${k}” non valido.`);
      }
      if (values.ivaDefault === null || values.ivaDefault < 0 || values.ivaDefault > 100) numErr.push('IVA predefinita non valida.');
      if (values.giorniScadenza === null || values.giorniScadenza < 0) numErr.push('Giorni di pagamento non validi.');
      const all = [...errors, ...fiscalRead.errors, ...numErr];
      if (all.length) return UI.showErrors(form, all);
      const fiscal = { ...fiscalRead.values, regimeForfettario: !!fiscalRead.values.regimeForfettario };
      const patch = { ...values, ivaDefault: Number(values.ivaDefault), giorniScadenza: Number(values.giorniScadenza), fiscal };
      patch.partitaIva = (patch.partitaIva || '').replace(/\s/g, '');
      patch.codiceFiscale = (patch.codiceFiscale || '').toUpperCase().replace(/\s/g, '');
      if (patch.partitaIva && !Core.isValidPartitaIva(patch.partitaIva)) return UI.showErrors(form, ['Partita IVA non valida.']);
      if (patch.codiceFiscale && !Core.isValidCodiceFiscale(patch.codiceFiscale)) return UI.showErrors(form, ['Codice fiscale non valido.']);
      await App.saveSettings(patch);
      UI.toast('Impostazioni salvate');
      App.refresh();
    });

  /* ============================== 404 ============================== */
  V.notFound = () => `<div class="empty">Pagina non trovata. <a href="#/dashboard">Torna alla dashboard</a></div>`;

})(typeof window !== 'undefined' ? window : globalThis);
