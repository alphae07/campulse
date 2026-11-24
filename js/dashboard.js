// dashboard.js — "My Dashboard": preview, availability toggle, profile strength, UPDATE and DELETE.
// Every query is filtered by the logged-in user's id AND protected again by RLS on the server.
import { supabase } from './supabaseClient.js';
import { AVAILABLE, BUSY } from './config.js';
import { $, profileCard, bindCardActions, toast, openModal, closeModal, safeUrl, busy, fillSkills } from './ui.js';

let me = null, bound = false;

export async function loadDashboard(user) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (error) return toast(error.message, 'err');
  me = data;
  if (!me) { $('#dashPreview').innerHTML = `<p class="empty">No profile found for this account.</p>`; return; }
  paint();
  if (!bound) { bind(); bound = true; }
}

// Re-draw everything from the `me` object.
function paint() {
  $('#dashHi').textContent = `Hi ${me.full_name.split(' ')[0]}. Keep your card fresh and tell campus when you're free.`;
  $('#dashPreview').innerHTML = profileCard(me, 0, { fav: false });
  $('#availToggle').checked = me.availability === AVAILABLE;
  $('#availLabel').textContent = me.availability;
  const form = $('#editForm');
  fillSkills(form.elements.skill);
  for (const el of form.elements) if (el.name && me[el.name] !== undefined) el.value = me[el.name] ?? '';
  $('#matricShown').textContent = me.matric_no;
  strength();
}

// Profile strength: 5 checks worth 20% each, plus a tip for the first thing missing.
function strength() {
  const checks = [
    [me.avatar_url, 'Add a profile photo so people recognise you.'],
    [me.cover_url, 'Add a cover image of your work so your card stands out.'],
    [me.work_link, 'Add a link to your best work.'],
    [(me.bio || '').length >= 60, 'Stretch your bio to a couple of full sentences.'],
    [me.whatsapp, 'Add a WhatsApp number so people can reach you.'],
  ];
  const pct = checks.filter((c) => c[0]).length * 20;
  $('#meterBar').style.width = `${pct}%`;
  $('#meterPct').textContent = `${pct}%`;
  const next = checks.find((c) => !c[0]);
  $('#meterTip').textContent = next ? next[1] : 'Your profile is complete. Nice work.';
}

// Shared UPDATE helper.
async function save(changes) {
  const { data, error } = await supabase.from('profiles').update(changes).eq('id', me.id).select().single();
  if (error) { toast(error.message, 'err'); return false; }
  me = data; paint(); return true;
}

function bind() {
  bindCardActions($('#dashPreview'), () => me);

  // Quick availability toggle.
  $('#availToggle').addEventListener('change', async (e) => {
    const ok = await save({ availability: e.target.checked ? AVAILABLE : BUSY });
    if (ok) toast(`You're now: ${me.availability}`); else e.target.checked = !e.target.checked;
  });

  // Full edit form.
  $('#editForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target)), btn = e.target.querySelector('[type=submit]');
    if (f.work_link && !safeUrl(f.work_link)) return toast('Work link must start with http:// or https://', 'err');
    busy(btn, true);
    const ok = await save({
      full_name: f.full_name.trim(), skill: f.skill, bio: f.bio.trim(), whatsapp: f.whatsapp.trim(),
      availability: f.availability, work_link: f.work_link.trim() || null,
      avatar_url: f.avatar_url.trim() || null, cover_url: f.cover_url.trim() || null,
    });
    busy(btn, false);
    if (ok) toast('Changes saved.');
  });

  // Delete with a confirmation modal.
  $('#deleteBtn').addEventListener('click', () => {
    openModal(`
      <div class="m-body confirm">
        <h3>Delete your profile?</h3>
        <p class="bio full">This removes you from the directory and deletes your login. It can't be undone.</p>
        <div class="actions"><button class="btn ghost" data-close>Keep my profile</button>
        <button class="btn danger" id="confirmDel">Delete profile</button></div>
      </div>`);
    $('#confirmDel').onclick = async () => {
      const { error } = await supabase.from('profiles').delete().eq('id', me.id);   // RLS: own row only
      if (error) return toast(error.message, 'err');
      await supabase.rpc('delete_my_account');       // also remove the login itself
      await supabase.auth.signOut();
      closeModal(); toast('Profile deleted.'); location.href = 'index.html';
    };
  });
}
