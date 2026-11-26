// Mission card: cover image of the latest version (plays on hover/focus), title, format, status, stage, progress.
import { S, el, STATUS } from './state.js';
import { STAGES, stageOf, stageIdx, deptOf } from './org.js';
import { playableUrl, posterUrl } from './player.js';

export function missionCard(p, { onOpen, extra } = {}) {
  const vs = (p.versions || []).slice().sort((a, b) => a.v - b.v); const last = vs[vs.length - 1];
  const st = stageOf(p), si = stageIdx(st), S_ = STAGES[si], d = deptOf(S_.dept);
  const pv = el('div', { class: 'pv' });
  pv.append(el('div', { class: 'nv', text: p.format || '?' }));
  let vid = null;
  if (last && last.assetId) {
    const cover = posterUrl(last);
    if (cover) pv.append(el('img', { src: cover, alt: '', loading: 'lazy', decoding: 'async' }));
    pv.append(el('span', { class: 'play', text: 'v' + last.v + (last.durationSec ? ' · ' + Math.round(last.durationSec) + ' s' : '') }));
  }
  const card = el('div', { class: 'mission', role: 'button', tabindex: '0', 'aria-label': 'Apri ' + (p.title || 'missione'), 'aria-current': String(p.id === S.cur), 'data-id': p.id, onclick: () => onOpen && onOpen(p.id), onkeydown: (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === card) { e.preventDefault(); onOpen && onOpen(p.id); } } },
    pv,
    el('div', { class: 'bd' },
      el('span', { class: 't', text: p.title || 'Missione senza titolo' }),
      el('span', { class: 'm' }, el('span', { class: 'fmt ' + p.format, text: p.format }), el('span', { class: 'st ' + (p.status || 'brief'), text: STATUS[p.status] || 'Brief' }), el('span', { class: 'dpt', style: '--c:' + d.color }, el('i'), S_.name)),
      el('div', { class: 'prg', title: 'Fase ' + (si + 1) + ' di ' + STAGES.length }, el('i', { style: 'width:' + Math.round((si + 1) / STAGES.length * 100) + '%' })),
      extra || null));
  if (last && last.assetId) {
    let on = false;
    const play = async () => {
      on = true;
      if (!vid) { vid = el('video', { muted: true, playsinline: true, loop: true, preload: 'auto', 'aria-hidden': 'true' }); vid.muted = true; pv.insertBefore(vid, pv.querySelector('.play')); vid.src = await playableUrl(last.assetId); }
      if (on) vid.play().catch(() => { });
    };
    const stop = () => { on = false; if (vid) vid.pause(); };
    card.addEventListener('pointerenter', play); card.addEventListener('pointerleave', stop); card.addEventListener('focus', play); card.addEventListener('blur', stop);
  }
  return card;
}
