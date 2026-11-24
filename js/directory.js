import { supabase } from './supabaseClient.js';
import { SKILLS, SKILL_META, AVAILABLE, SUPABASE_CONFIGURED } from './config.js';
import { $, esc, profileCard, skeletons, bindCardActions, animateNumber, toast, getSaved, coverOf, badge } from './ui.js';

let all = [];
let previewProfilesCache = [];
const state = { q: '', skill: new URLSearchParams(location.search).get('skill') || 'All', onlyAvail: false, saved: false, sort: 'new' };
const lookup = (id) => all.find((p) => p.id === id) || previewProfilesCache.find((p) => p.id === id);

export function initDirectory() {

  if ($('#pills')) {
    $('#pills').innerHTML = ['All', ...SKILLS].map((s) => `<button class="pill${s === state.skill ? ' active' : ''}" data-skill="${esc(s)}">${esc(s)}</button>`).join('');
    $('#pills').addEventListener('click', (e) => { const b = e.target.closest('.pill'); if (b) setSkill(b.dataset.skill); });
  }

  if ($('#tiles')) { $('#tiles').innerHTML = SKILLS.map((s) => `
    <button class="tile" data-skill="${esc(s)}" style="--tc:${SKILL_META[s].color}">
      <img src="${esc(SKILL_META[s].img)}" alt="" loading="lazy" onerror="this.remove()">
      <span class="tile-t"><b>${esc(s)}</b><small>${esc(SKILL_META[s].line)}</small><span class="mono" data-count="${esc(s)}">&nbsp;</span></span>
    </button>`).join('');
  $('#tiles')?.addEventListener('click', (e) => {
    const t = e.target.closest('.tile'); if (!t) return;
    location.href = `directory.html?skill=${encodeURIComponent(t.dataset.skill)}`;
  }); }

  const star = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 1l2.6 7.4L22 11l-7.4 2.6L12 21l-2.6-7.4L2 11l7.4-2.6z" fill="currentColor"/></svg>';
  const words = [...SKILLS, 'Linked to a matric number', 'Say hi on WhatsApp'];
  const row = words.map((w) => `<span>${esc(w)}</span>${star}`).join('');
  if ($('#ticker')) $('#ticker').innerHTML = row + row;

  $('#search')?.addEventListener('input', (e) => { state.q = e.target.value.trim().toLowerCase(); render(); });
  $('#onlyAvail')?.addEventListener('change', (e) => { state.onlyAvail = e.target.checked; render(); });
  $('#onlySaved')?.addEventListener('change', (e) => { state.saved = e.target.checked; render(); });
  $('#sort')?.addEventListener('change', (e) => { state.sort = e.target.value; render(); });
  $('#grid')?.addEventListener('click', (e) => { if (e.target.closest('[data-reset]')) resetFilters(); if (e.target.closest('[data-retry-directory]')) loadDirectory(); });
  addEventListener('saved-change', () => { updateSavedCount(); if (state.saved) render(); });

  if ($('#grid')) bindCardActions($('#grid'), lookup);
  if ($('#spot')) bindCardActions($('#spot'), lookup);
  if ($('#previewGrid')) bindCardActions($('#previewGrid'), lookup);
  updateSavedCount();
}

function setSkill(s) {
  state.skill = s;
  document.querySelectorAll('.pill').forEach((p) => p.classList.toggle('active', p.dataset.skill === s));
  render();
}

function resetFilters() {
  Object.assign(state, { q: '', skill: 'All', onlyAvail: false, saved: false });
  $('#search').value = ''; $('#onlyAvail').checked = false; $('#onlySaved').checked = false;
  setSkill('All');
}

function updateSavedCount() { const el = $('#savedCount'); if (el) el.textContent = getSaved().length; }

export async function loadDirectory() {
  if ($('#grid')) $('#grid').innerHTML = skeletons(6);
  if ($('#previewGrid')) $('#previewGrid').innerHTML = skeletons(3);
  if (!SUPABASE_CONFIGURED) {
    all = [];
    const setupMessage = `<div class="empty"><p>Student profiles will show here once Campulse is connected to Supabase. Add your project URL and anon key in <code>js/config.js</code>.</p></div>`;
    if ($('#grid')) $('#grid').innerHTML = setupMessage;
    if ($('#previewGrid')) $('#previewGrid').innerHTML = setupMessage;
    if ($('#statTotal')) $('#statTotal').textContent = '0';
    if ($('#statAvail')) $('#statAvail').textContent = '0';
    if ($('#stickAvail')) $('#stickAvail').textContent = '0';
    SKILLS.forEach((s) => { const countEl = $(`[data-count="${s}"]`); if (countEl) countEl.textContent = '0 creators'; });
    if ($('#spotWrap')) $('#spotWrap').hidden = true;
    return;
  }

  const orderNewest = (query) => query.order('created_at', { ascending: false, nullsFirst: false }).limit(3);
  const previewRender = (profiles) => {
    if (!$('#previewGrid')) return;
    if (!profiles.length) {
      $('#previewGrid').innerHTML = `<div class="empty"><p>No student profiles yet. Be the first to create a Campulse profile.</p><a class="btn primary" href="signup.html">Create a profile</a></div>`;
      return;
    }
    $('#previewGrid').innerHTML = profiles.map((p, i) => profileCard(p, i)).join('');
  };

  try {

    let previewResult = await orderNewest(supabase.from('profiles').select('*'));
    if (previewResult.error) previewResult = await supabase.from('profiles').select('*').limit(3);
    if (previewResult.error) throw previewResult.error;
    const previewProfiles = Array.isArray(previewResult.data) ? previewResult.data : [];
    previewProfilesCache = previewProfiles;
    previewRender(previewProfiles);
  } catch (previewErr) {
    console.error('[Campulse] Preview profiles failed:', previewErr);
    if ($('#previewGrid')) $('#previewGrid').innerHTML = `<div class="empty"><p>We couldn't load the newest student profiles right now.</p><button class="btn ghost" data-retry-directory>Try again</button></div>`;
    if ($('#previewGrid')) $('#previewGrid').onclick = (e) => { if (e.target.closest('[data-retry-directory]')) loadDirectory(); };
  }

  try {

    let directoryResult = await supabase.from('profiles').select('*').order('created_at', { ascending: false, nullsFirst: false });
    if (directoryResult.error) directoryResult = await supabase.from('profiles').select('*');
    if (directoryResult.error) throw directoryResult.error;
    all = Array.isArray(directoryResult.data) ? directoryResult.data : [];
    const open = all.filter((p) => p.availability === AVAILABLE);
    if ($('#statTotal')) animateNumber($('#statTotal'), all.length);
    if ($('#statAvail')) animateNumber($('#statAvail'), open.length);
    if ($('#stickAvail')) $('#stickAvail').textContent = open.length;
    SKILLS.forEach((s) => {
      const n = all.filter((p) => p.skill === s).length;
      const countEl = $(`[data-count="${s}"]`); if (countEl) countEl.textContent = `${n} ${n === 1 ? 'creator' : 'creators'}`;
    });
    if ($('#spotWrap')) renderSpotlight(open);
    render();
  } catch (directoryErr) {
    console.error('[Campulse] Directory loading failed:', directoryErr);
    if ($('#grid')) $('#grid').innerHTML = `<div class="empty"><p>We couldn't load the full directory right now. Please check your connection and try again.</p><button class="btn ghost" data-retry-directory>Try again</button></div>`;
    if ($('#grid')) $('#grid').onclick = (e) => { if (e.target.closest('[data-retry-directory]')) loadDirectory(); };
    toast('Unable to load Campulse profiles. Check your Supabase setup and connection.', 'err');
  }
}

function renderSpotlight(open) {
  if (!$('#spotWrap') || !$('#spot')) return;
  $('#spotWrap').hidden = !open.length;
  $('#spot').innerHTML = open.slice(0, 8).map((p) => `
    <button class="spot-card" data-view="${esc(p.id)}">
      <img src="${esc(coverOf(p))}" alt="" loading="lazy" onerror="this.remove()">
      <span class="spot-body">${badge(p.availability)}<strong>${esc(p.full_name)}</strong>
        <em>${esc(p.skill)}</em><span class="spot-bio">${esc(p.bio)}</span></span>
    </button>`).join('');
}

function render() {
  const saved = getSaved();
  let list = all.filter((p) =>
    (state.skill === 'All' || p.skill === state.skill) &&
    (!state.onlyAvail || p.availability === AVAILABLE) &&
    (!state.saved || saved.includes(p.id)) &&
    (!state.q || [p.full_name, p.skill, p.matric_no].some((v) => v.toLowerCase().includes(state.q))));
  if (state.sort === 'az') list = [...list].sort((a, b) => a.full_name.localeCompare(b.full_name));

  if ($('#count')) $('#count').textContent = `${list.length} ${list.length === 1 ? 'creator' : 'creators'}`;
  if (!$('#grid')) return;
  $('#grid').innerHTML = list.length
    ? list.map((p, i) => profileCard(p, i)).join('')
    : `<div class="empty"><p>${state.saved ? 'Nothing saved yet. Tap the heart on a card to keep someone for later.' : 'Nobody matches that search.'}</p>
       <button class="btn ghost" data-reset>Clear filters</button></div>`;
}
