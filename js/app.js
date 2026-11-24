import { $, initTheme, initNav, initModal, initReveal, fillSkills } from './ui.js';
import { initAuth } from './auth.js';
import { initDirectory, loadDirectory } from './directory.js';
import { loadDashboard } from './dashboard.js';
import { initUploaders } from './images.js';
import { supabase } from './supabaseClient.js';

initTheme(); initNav(); initModal(); initAuth();
const signupSkill = $('#suSkill'); if (signupSkill) fillSkills(signupSkill);
if ($('#tiles') || $('#grid')) initDirectory();
if ($('.reveal')) initReveal();
if ($('.uploader')) initUploaders();
const page = location.pathname.split('/').pop() || 'index.html';
if (page === 'index.html' || page === 'directory.html') loadDirectory();
if (page === 'dashboard.html') supabase.auth.getSession().then(({data}) => {
  if (!data.session) location.href = 'login.html'; else loadDashboard(data.session.user);
});
supabase.auth.onAuthStateChange((_event, session) => {
  const navAuth = $('#navAuth'); if (!navAuth) return;
  navAuth.innerHTML = session ? `<a href="dashboard.html">My Dashboard</a><button class="link" data-signout>Sign out</button>` : `<a href="login.html">Log in</a><a class="btn sun" href="signup.html">Join campulse</a>`;
});
supabase.auth.getSession().then(({data}) => { const navAuth=$('#navAuth'); if(navAuth) navAuth.innerHTML=data.session?`<a href="dashboard.html">My Dashboard</a><button class="link" data-signout>Sign out</button>`:`<a href="login.html">Log in</a><a class="btn sun" href="signup.html">Join campulse</a>`; });
