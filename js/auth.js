// auth.js — sign up, log in (email OR matric number), sign out.
import { supabase } from './supabaseClient.js';
import { $, toast, busy } from './ui.js';

export function initAuth() {
  $('#signupForm')?.addEventListener('submit', onSignup);
  $('#loginForm')?.addEventListener('submit', onLogin);
  // Any element with data-signout (nav button, dashboard button) signs the user out.
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

  busy(btn, true);
  // Everything except email/password travels as metadata; a database trigger turns it
  // into the `profiles` row (id = the new user's auth id). See supabase/schema.sql.
  const { email, password, ...meta } = f;
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: meta } });
  busy(btn, false);

  if (error) {
    const dup = /database error|duplicate|unique/i.test(error.message);
    return toast(dup ? 'That matric number is already registered.' : error.message, 'err');
  }
  form.reset();
  if (!data.session) {                       // "Confirm email" is ON in Supabase
    toast('Almost there! Confirm your email, then log in.');
    location.href = 'login.html';
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
    // Matric number → ask the database (safe RPC function) for the matching email.
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
