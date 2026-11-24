import { supabase } from './supabaseClient.js';
import { $, toast, busy } from './ui.js';
import { uploadProfileImage, getUploader, clearUploaders } from './images.js';

export function initAuth() {
  $('#signupForm')?.addEventListener('submit', onSignup);
  $('#loginForm')?.addEventListener('submit', onLogin);

  document.addEventListener('click', (e) => { if (e.target.closest('[data-signout]')) logout(); });
}

async function onSignup(e) {
  e.preventDefault();
  const form = e.target, btn = form.querySelector('[type=submit]');
  const f = Object.fromEntries(new FormData(form));
  f.matric_no = f.matric_no.trim().toUpperCase();
  f.email = f.email.trim().toLowerCase();

  if (f.password.length < 8) return toast('Password must be at least 8 characters.', 'err');
  if (!/^\+?\d[\d\s-]{7,}$/.test(f.whatsapp.trim())) return toast('Enter a valid WhatsApp number, e.g. +234 801 234 5678.', 'err');

  const avatarFile = getUploader(form, 'avatar').file;
  const coverFile = getUploader(form, 'cover').file;
  busy(btn, true);

  const { email, password, ...meta } = f;
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: meta } });

  if (error) {
    busy(btn, false);
    const dup = /database error|duplicate|unique/i.test(error.message);
    return toast(dup ? 'That matric number is already registered.' : error.message, 'err');
  }
  let imagesFailed = false;
  if (data.session && (avatarFile || coverFile)) {
    try {
      const patch = {};
      if (avatarFile) patch.avatar_url = await uploadProfileImage(data.user.id, avatarFile, 'avatar');
      if (coverFile) patch.cover_url = await uploadProfileImage(data.user.id, coverFile, 'cover');
      const { error: patchError } = await supabase.from('profiles').update(patch).eq('id', data.user.id);
      if (patchError) throw patchError;
    } catch {
      imagesFailed = true;
    }
  }
  busy(btn, false);
  form.reset();
  clearUploaders(form);
  if (!data.session) {
    toast(avatarFile || coverFile ? 'Almost there! Confirm your email, log in, then add your photos from your dashboard.' : 'Almost there! Confirm your email, then log in.');
    location.href = 'login.html';
  } else if (imagesFailed) {
    toast('Profile created, but your images did not upload. Add them from your dashboard.', 'err');
    setTimeout(() => { location.href = 'dashboard.html'; }, 1800);
  } else {
    toast('Welcome to Campulse! Your profile is live.');
    location.href = 'dashboard.html';
  }
}

async function onLogin(e) {
  e.preventDefault();
  const form = e.target, btn = form.querySelector('[type=submit]');
  const { identifier, password } = Object.fromEntries(new FormData(form));
  busy(btn, true);

  let email = identifier.trim();
  if (!email.includes('@')) {

    const { data, error } = await supabase.rpc('email_for_matric', { p_matric: email });
    if (error || !data) { busy(btn, false); return toast('Wrong matric number or password.', 'err'); }
    email = data;
  }
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  busy(btn, false);
  if (error) return toast('Wrong email/matric number or password.', 'err');

  form.reset();
  toast('Welcome back!');
  location.href = 'dashboard.html';
}

export async function logout() {
  await supabase.auth.signOut();
  toast('Signed out.');
  location.href = 'index.html';
}
