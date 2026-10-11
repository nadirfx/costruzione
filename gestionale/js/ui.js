/*
 * Helper di interfaccia: escape HTML, modali, conferme, toast, form dichiarativi.
 * Ogni valore che arriva dai dati viene passato da esc() prima di finire nell'HTML.
 */
(function (root) {
  'use strict';

  const Core = root.Core;

  const esc = (v) =>
    String(v === null || v === undefined ? '' : v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const $ = (sel, scope = document) => scope.querySelector(sel);

  function toast(message, kind = 'ok') {
    const host = $('#toasts');
    if (!host) return;
    const el = document.createElement('div');
    el.className = `toast toast-${kind}`;
    el.setAttribute('role', 'status');
    el.textContent = message;
    host.appendChild(el);
    setTimeout(() => el.classList.add('toast-out'), kind === 'err' ? 6000 : 3200);
    setTimeout(() => el.remove(), kind === 'err' ? 6500 : 3700);
  }

  /* ------------------------------ Modali ------------------------------ */
  let openModals = [];

  // body: stringa HTML. Ritorna { close(), el }. onOpen(el) viene chiamato dopo l'inserimento.
  function modal({ title, body, size = '', onOpen = null, onClose = null }) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `
      <div class="modal ${esc(size)}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        <header class="modal-head">
          <h2>${esc(title)}</h2>
          <button type="button" class="icon-btn" data-modal-close aria-label="Chiudi">✕</button>
        </header>
        <div class="modal-body">${body}</div>
      </div>`;
    document.body.appendChild(overlay);
    const entry = {
      el: overlay,
      close() {
        overlay.remove();
        openModals = openModals.filter((m) => m !== entry);
        if (onClose) onClose();
      },
    };
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) return; // niente chiusura per click fuori: evita di perdere dati digitati
      if (e.target.closest('[data-modal-close]')) entry.close();
    });
    overlay.modalEntry = entry;
    openModals.push(entry);
    if (onOpen) onOpen(overlay.querySelector('.modal'), entry);
    const first = overlay.querySelector('input, select, textarea, button:not([data-modal-close])');
    if (first) first.focus();
    return entry;
  }

  function closeTopModal() {
    const m = openModals[openModals.length - 1];
    if (m) m.close();
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && openModals.length) closeTopModal();
  });

  // Conferma con Promise<boolean>
  function confirmDialog({ title = 'Conferma', message, confirmText = 'Conferma', danger = false }) {
    return new Promise((resolve) => {
      let done = false;
      const finish = (v) => {
        if (done) return;
        done = true;
        resolve(v);
      };
      const m = modal({
        title,
        size: 'small',
        body: `
          <p class="confirm-msg">${esc(message)}</p>
          <div class="form-actions">
            <button type="button" class="btn ghost" data-confirm="no">Annulla</button>
            <button type="button" class="btn ${danger ? 'danger' : 'primary'}" data-confirm="yes">${esc(confirmText)}</button>
          </div>`,
        onOpen: (el) => {
          el.addEventListener('click', (e) => {
            const b = e.target.closest('[data-confirm]');
            if (!b) return;
            finish(b.dataset.confirm === 'yes');
            m.close();
          });
        },
        onClose: () => finish(false),
      });
    });
  }

  /* ------------------------------ Form dichiarativi ------------------------------ */
  // field: { name, label, type, options, required, hint, full, placeholder, value, min, step, attrs }
  // type: text | textarea | date | money | number | select | checkbox | file
  function fieldHTML(f, values = {}) {
    const raw = values[f.name] !== undefined && values[f.name] !== null ? values[f.name] : (f.value ?? '');
    const req = f.required ? ' required' : '';
    const cls = `field${f.full ? ' full' : ''}${f.type === 'checkbox' ? ' check' : ''}`;
    const hint = f.hint ? `<small class="hint">${esc(f.hint)}</small>` : '';
    const label = `<span class="lbl">${esc(f.label)}${f.required ? ' <b class="req">*</b>' : ''}</span>`;
    const extra = f.attrs || '';
    let control;
    switch (f.type) {
      case 'textarea':
        control = `<textarea name="${esc(f.name)}" rows="${f.rows || 3}"${req} placeholder="${esc(f.placeholder || '')}">${esc(raw)}</textarea>`;
        break;
      case 'select': {
        const opts = (f.options || []).map((o) => {
          const [v, l] = Array.isArray(o) ? o : [o, o];
          return `<option value="${esc(v)}"${String(v) === String(raw) ? ' selected' : ''}>${esc(l)}</option>`;
        });
        if (f.empty !== false) opts.unshift(`<option value="">${esc(f.empty || '— seleziona —')}</option>`);
        control = `<select name="${esc(f.name)}"${req} ${extra}>${opts.join('')}</select>`;
        break;
      }
      case 'checkbox':
        return `<label class="${cls}"><input type="checkbox" name="${esc(f.name)}"${raw ? ' checked' : ''} ${extra}> <span>${esc(f.label)}</span>${hint}</label>`;
      case 'money': {
        const shown = typeof raw === 'number' ? Core.centsToPlain(raw) : raw;
        control = `<input type="text" inputmode="decimal" name="${esc(f.name)}" data-type="money" value="${esc(shown)}" placeholder="0,00"${req} ${extra}>`;
        break;
      }
      case 'number':
        control = `<input type="number" name="${esc(f.name)}" value="${esc(raw)}" step="${esc(f.step || 'any')}"${f.min !== undefined ? ` min="${f.min}"` : ''}${req} ${extra}>`;
        break;
      case 'file':
        control = `<input type="file" name="${esc(f.name)}" ${extra}>`;
        break;
      default:
        control = `<input type="${esc(f.type || 'text')}" name="${esc(f.name)}" value="${esc(raw)}"${req}${f.placeholder ? ` placeholder="${esc(f.placeholder)}"` : ''} ${extra}>`;
    }
    return `<label class="${cls}">${label}${control}${hint}</label>`;
  }

  function fieldsHTML(fields, values = {}) {
    return `<div class="form-grid">${fields.map((f) => fieldHTML(f, values)).join('')}</div>`;
  }

  // Legge i valori del form secondo i campi. Ritorna { values, errors }
  function readFields(form, fields) {
    const values = {};
    const errors = [];
    for (const f of fields) {
      const el = form.elements[f.name];
      if (!el) continue;
      if (f.type === 'checkbox') {
        values[f.name] = el.checked;
      } else if (f.type === 'file') {
        values[f.name] = el.files && el.files[0] ? el.files[0] : null;
      } else if (f.type === 'money') {
        const txt = (el.value || '').trim();
        if (txt === '') {
          values[f.name] = null;
        } else {
          const c = Core.parseEuroToCents(txt);
          if (c === null) errors.push(`${f.label}: importo non valido (usa es. 1.250,00).`);
          values[f.name] = c;
        }
      } else if (f.type === 'number') {
        const txt = (el.value || '').trim();
        values[f.name] = txt === '' ? null : Number(txt.replace(',', '.'));
      } else {
        values[f.name] = (el.value || '').trim();
      }
      if (f.required && (values[f.name] === '' || values[f.name] === null || values[f.name] === undefined)) {
        errors.push(`${f.label}: campo obbligatorio.`);
      }
    }
    return { values, errors };
  }

  function showErrors(form, errors) {
    let box = form.querySelector('.form-errors');
    if (!box) {
      box = document.createElement('div');
      box.className = 'form-errors';
      box.setAttribute('role', 'alert');
      form.insertBefore(box, form.firstChild);
    }
    if (!errors.length) {
      box.remove();
      return;
    }
    box.innerHTML = `<strong>Controlla questi punti:</strong><ul>${errors.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>`;
    box.scrollIntoView({ block: 'nearest' });
  }

  /* ------------------------------ Download ------------------------------ */
  // Chiude la modale che contiene l'elemento (se c'è)
  function closeModalOf(el) {
    const ov = el && el.closest ? el.closest('.overlay') : null;
    if (ov && ov.modalEntry) ov.modalEntry.close();
  }

  // Esegue work() una sola volta alla volta per quel form (evita doppi salvataggi)
  async function guard(form, work) {
    if (form.dataset.busy === '1') return;
    form.dataset.busy = '1';
    const btn = form.querySelector('[type="submit"]');
    if (btn) btn.disabled = true;
    try {
      return await work();
    } finally {
      delete form.dataset.busy;
      if (btn) btn.disabled = false;
    }
  }

  function downloadBlob(filename, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  function downloadText(filename, text, mime = 'text/csv;charset=utf-8') {
    // BOM UTF-8: Excel in italiano legge correttamente le lettere accentate
    downloadBlob(filename, new Blob(['﻿', text], { type: mime }));
  }

  function fmtDate(iso) {
    if (!Core.isValidISODate(iso)) return '—';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  function badge(code, label) {
    const cls = {
      pagata: 'ok', parziale: 'warn', scaduta: 'danger', emessa: 'info', bozza: 'muted', annullata: 'muted',
      attivo: 'ok', in_corso: 'info', preventivo: 'muted', consegnato: 'ok', chiuso: 'muted', annullato: 'muted',
    }[code] || 'muted';
    return `<span class="badge ${cls}">${esc(label)}</span>`;
  }

  function empty(msg) {
    return `<div class="empty">${esc(msg)}</div>`;
  }

  root.UI = {
    esc, $, toast, modal, closeTopModal, closeModalOf, guard, confirmDialog, fieldHTML, fieldsHTML, readFields, showErrors,
    downloadBlob, downloadText, fmtDate, badge, empty,
  };
})(typeof window !== 'undefined' ? window : globalThis);
