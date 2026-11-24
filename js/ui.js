import { SKILLS, SKILL_META, AVAILABLE } from './config.js';

export const $ = (sel, root = document) => root.querySelector(sel);

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const safeUrl = (u) => {
  try {
    const x = new URL(u);
    return ['http:', 'https:'].includes(x.protocol) ? x.href : '';
  } catch { return ''; }
};

const PATHS = {
  heart: '<path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  out: '<path d="M7 17L17 7M8 7h9v9"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
};
export const icon = (n) =>
  `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[n] || ''}</svg>`;

/* ---------- Theme (light / dark) persisted in localStorage ---------- */
export function initTheme() {
  const btn = $('#themeBtn');
  if (!btn) return;
  const apply = (t) => {
    document.documentElement.dataset.theme = t;
    localStorage.setItem('campulse-theme', t);
    btn.innerHTML = icon(t === 'dark' ? 'sun' : 'moon');
    btn.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  };
  apply(document.documentElement.dataset.theme || 'light');
  btn.addEventListener('click', () => apply(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
}

/* ---------- Mobile menu ---------- */
export function initNav() {
  const btn = $('#menuBtn'), nav = $('.nav');
  if (!btn || !nav) return;
  const set = (open) => {
    nav.classList.toggle('open', open);
    btn.innerHTML = icon(open ? 'close' : 'menu');
    btn.setAttribute('aria-expanded', open);
  };
  set(false);
  btn.addEventListener('click', () => set(!nav.classList.contains('open')));
  nav.addEventListener('click', (e) => { if (e.target.closest('a, [data-signout], [data-scroll]')) set(false); });
}

/* ---------- Scroll reveal for landing sections ---------- */
export function initReveal() {
  const targets = document.querySelectorAll('.reveal');
  if (!targets.length) return;
  
  if (!('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('in'));
    return;
  }
  try {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: 0.12 });
    document.documentElement.classList.add('reveal-enabled');
    targets.forEach((el) => io.observe(el));
  } catch (err) {
    document.documentElement.classList.remove('reveal-enabled');
    targets.forEach((el) => el.classList.add('in'));
  }
}

/* ---------- Toast / loading button ---------- */
let toastTimer;
export function toast(msg, type = 'ok') {
  const t = $('#toast');
  if (!t) { console.warn('[Campulse]', msg); return; }
  t.textContent = msg;
  t.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.className = 'toast'), 3200);
}
export const busy = (btn, on) => { btn.disabled = on; btn.classList.toggle('loading', on); };

/* ---------- Modal (one shared container; CSS handles the transition) ---------- */
export function openModal(html) {
  $('#modalBody').innerHTML = html;
  $('#modal').classList.add('open');
  document.body.classList.add('lock');
}
export function closeModal() {
  $('#modal').classList.remove('open');
  document.body.classList.remove('lock');
}
export function initModal() {
  const modal = $('#modal');
  if (!modal) return;
  modal.addEventListener('click', (e) => {
    if (e.target.id === 'modal' || e.target.closest('[data-close]')) closeModal();
    const c = e.target.closest('[data-mcopy]');
    if (c) copyText(c.dataset.mcopy, c);
  });
  addEventListener('keydown', (e) => e.key === 'Escape' && closeModal());
}

/* ---------- Clipboard with instant "Copied!" feedback ---------- */
export async function copyText(text, btn) {
  try { await navigator.clipboard.writeText(text); }
  catch { 
    const t = document.createElement('textarea');
    t.value = text; document.body.append(t); t.select(); document.execCommand('copy'); t.remove();
  }
  if (btn) {
    const old = btn.textContent;
    btn.textContent = 'Copied!'; btn.classList.add('done');
    setTimeout(() => { btn.textContent = old; btn.classList.remove('done'); }, 1600);
  }
}

/* ---------- Saved profiles (the heart button), kept in this browser only ---------- */
const SAVED_KEY = 'campulse-saved';
export const getSaved = () => { try { return JSON.parse(localStorage.getItem(SAVED_KEY)) || []; } catch { return []; } };
export function toggleSaved(id) {
  const s = new Set(getSaved());
  const on = !s.has(id);
  on ? s.add(id) : s.delete(id);
  try { localStorage.setItem(SAVED_KEY, JSON.stringify([...s])); } catch { /* storage blocked */ }
  dispatchEvent(new CustomEvent('saved-change'));
  return on;
}

/* ---------- Misc ---------- */
export function fillSkills(select) {
  select.innerHTML = SKILLS.map((s) => `<option>${esc(s)}</option>`).join('');
}
export function animateNumber(el, to) {
  const from = Number(el.textContent) || 0, start = performance.now(), dur = 800;
  const tick = (now) => {
    const p = Math.min((now - start) / dur, 1);
    el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}


export const avatarOf = (p) => safeUrl(p.avatar_url) || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.full_name || 'Student')}&background=2340ff&color=ffffff&size=240&bold=true`; 
export const coverOf = (p) => safeUrl(p.cover_url) || SKILL_META[p.skill]?.img || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=85';

export const badge = (a) =>
  `<span class="badge ${a === AVAILABLE ? 'ok' : 'warn'}"><i></i>${esc(a)}</span>`;

export function profileCard(p, i = 0, { fav = true } = {}) {
  const saved = getSaved().includes(p.id);
  return `
  <article class="card" style="--i:${i}">
    <div class="cover">
      <img src="${esc(coverOf(p))}" alt="${esc(p.full_name)}'s work" loading="lazy" onerror="this.remove()">
      <span class="sticker">${esc(p.skill)}</span>
      ${fav ? `<button class="heart${saved ? ' on' : ''}" data-fav="${esc(p.id)}" aria-pressed="${saved}" aria-label="Save ${esc(p.full_name)}">${icon('heart')}</button>` : ''}
    </div>
    <div class="card-body">
      <div class="who">
        <img class="avatar" src="${esc(avatarOf(p))}" alt="" onerror="this.style.visibility='hidden'">
        <div><h3>${esc(p.full_name)}<span class="tick" title="Linked to a matric number">${icon('check')}</span></h3>
        <span class="mono">${esc(p.matric_no)}</span></div>
      </div>
      ${badge(p.availability)}
      <p class="bio">${esc(p.bio)}</p>
      <div class="actions">
        <button class="btn primary" data-view="${esc(p.id)}">View work</button>
        <button class="btn ghost" data-copy="${esc(p.id)}">Copy WhatsApp</button>
      </div>
    </div>
  </article>`;
}

export const skeletons = (n = 6) =>
  Array.from({ length: n }, () => `
  <div class="card skel-card"><div class="cover skel"></div><div class="card-body">
    <div class="skel line w60"></div><div class="skel line w30"></div><div class="skel line"></div><div class="skel line w80"></div>
  </div></div>`).join('');

/* ---------- "View work" modal ---------- */
export function showProfileModal(p) {
  const link = safeUrl(p.work_link);
  const wa = String(p.whatsapp || '').replace(/\D/g, '');
  openModal(`
    <button class="x" data-close aria-label="Close">${icon('close')}</button>
    <div class="cover m-cover"><img src="${esc(coverOf(p))}" alt="" onerror="this.remove()"></div>
    <div class="m-body">
      <div class="who">
        <img class="avatar" src="${esc(avatarOf(p))}" alt="" onerror="this.style.visibility='hidden'">
        <div><h3>${esc(p.full_name)}</h3><span class="mono">${esc(p.matric_no)}</span></div>
      </div>
      <div class="row"><span class="tag">${esc(p.skill)}</span>${badge(p.availability)}</div>
      <p class="bio full">${esc(p.bio)}</p>
      <div class="actions">
        ${link ? `<a class="btn primary" href="${esc(link)}" target="_blank" rel="noopener noreferrer">Open their work ${icon('out')}</a>` : ''}
        <button class="btn ghost" data-mcopy="${esc(p.whatsapp)}">Copy WhatsApp</button>
      </div>
      ${wa ? `<a class="wa" href="https://wa.me/${wa}" target="_blank" rel="noopener noreferrer">${icon('chat')} Message on WhatsApp</a>` : ''}
    </div>`);
}

export function bindCardActions(root, lookup) {
  root.addEventListener('click', (e) => {
    const v = e.target.closest('[data-view]');
    const c = e.target.closest('[data-copy]');
    const f = e.target.closest('[data-fav]');
    if (v) showProfileModal(lookup(v.dataset.view));
    if (c) copyText(lookup(c.dataset.copy).whatsapp, c);
    if (f) {
      const on = toggleSaved(f.dataset.fav);
      f.classList.toggle('on', on);
      f.setAttribute('aria-pressed', on);
      f.classList.remove('pop'); void f.offsetWidth; f.classList.add('pop');  
    }
  });
}
