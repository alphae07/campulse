-- =====================================================================
-- CAMPULSE — Supabase setup. Paste this whole file into
-- Supabase Dashboard → SQL Editor → New query → Run.
-- =====================================================================

-- 1. PROFILES TABLE -----------------------------------------------------
-- Passwords are NOT stored here. Supabase Auth keeps them (bcrypt-hashed)
-- in auth.users. This table only holds public portfolio data.
-- id is the same UUID as the auth user, so one account = one profile.
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text not null check (char_length(full_name) between 2 and 100),
  matric_no    text not null unique,
  skill        text not null check (skill in
                 ('Web Design','Video Editing','Graphic Design','Photography','Tutoring')),
  bio          text not null check (char_length(bio) between 10 and 300),
  work_link    text,
  whatsapp     text not null,
  availability text not null default 'Available for Gigs'
                 check (availability in ('Available for Gigs','Busy with Exams')),
  avatar_url   text,
  cover_url    text,
  created_at   timestamptz not null default now()
);

-- 2. ROW-LEVEL SECURITY ---------------------------------------------------
alter table public.profiles enable row level security;

-- Anyone (even logged-out visitors) may READ the directory.
create policy "Directory is public"
  on public.profiles for select using (true);

-- A user may only INSERT a row whose id is their own auth id.
create policy "Insert own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

-- A user may only UPDATE their own row (and cannot hand it to someone else).
create policy "Update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- A user may only DELETE their own row.
create policy "Delete own profile"
  on public.profiles for delete to authenticated
  using (auth.uid() = id);

-- 3. AUTO-CREATE PROFILE ON SIGN-UP ---------------------------------------
-- The sign-up form sends profile fields as user metadata. This trigger copies
-- them into `profiles` with id = the new auth user's id. It works even when
-- "Confirm email" is ON (when there is no session yet for the browser to insert).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles
    (id, full_name, matric_no, skill, bio, work_link, whatsapp, availability, avatar_url, cover_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    upper(trim(new.raw_user_meta_data->>'matric_no')),
    new.raw_user_meta_data->>'skill',
    new.raw_user_meta_data->>'bio',
    nullif(new.raw_user_meta_data->>'work_link',''),
    new.raw_user_meta_data->>'whatsapp',
    coalesce(new.raw_user_meta_data->>'availability','Available for Gigs'),
    nullif(new.raw_user_meta_data->>'avatar_url',''),
    nullif(new.raw_user_meta_data->>'cover_url','')
  );
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. SAFE MATRIC → EMAIL LOOKUP ---------------------------------------------
-- Emails live in auth.users, which the browser can never read. This function
-- runs with the owner's rights (SECURITY DEFINER) and returns ONE email for ONE
-- matric number. The email column is never exposed in the public directory.
create or replace function public.email_for_matric(p_matric text)
returns text language sql security definer stable set search_path = public, auth as $$
  select u.email::text
  from public.profiles p join auth.users u on u.id = p.id
  where p.matric_no = upper(trim(p_matric))
  limit 1;
$$;
revoke all on function public.email_for_matric(text) from public;
grant execute on function public.email_for_matric(text) to anon, authenticated;

-- 5. FULL ACCOUNT CLEAN-UP WHEN A STUDENT DELETES THEIR PROFILE -------------
-- Deleting the auth user cascades to profiles. Only ever deletes the caller.
create or replace function public.delete_my_account()
returns void language sql security definer set search_path = public, auth as $$
  delete from auth.users where id = auth.uid();
$$;
revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;

-- 6. SEED PROFILES (optional — makes the directory look alive) --------------
-- Inserting into auth.users fires the trigger above, which creates each profile.
-- These demo accounts have no password, so nobody can log in as them.
-- If your project rejects this block, skip it and sign up real accounts.
insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
   raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
       s.email, '', now(), '{"provider":"email","providers":["email"]}'::jsonb,
       jsonb_build_object('full_name',s.name,'matric_no',s.matric,'skill',s.skill,'bio',s.bio,
         'work_link',s.link,'whatsapp',s.wa,'availability',s.avail,
         'avatar_url',s.avatar,
         'cover_url',s.cover),
       now(), now()
from (values
  ('amina@seed.campulse.app','Amina Yusuf','24/CS/0418','Web Design','I design fast, responsive websites for student societies and small businesses.','https://github.com/','+2348012345678','Available for Gigs','https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=240&q=80','https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=800&q=85'),
  ('chinedu@seed.campulse.app','Chinedu Eze','23/CS/0296','Video Editing','Event recaps, short films and TikTok edits with sharp pacing and clean colour.','https://youtube.com/','+2348023456789','Busy with Exams','https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=240&q=80','https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=85'),
  ('tomiwa@seed.campulse.app','Tomiwa Adeyemi','24/CS/0183','Graphic Design','Logos, flyers and brand kits for campus events, clubs and startups.','https://behance.net/','+2348034567890','Available for Gigs','https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=240&q=80','https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=85'),
  ('ibrahim@seed.campulse.app','Ibrahim Bello','23/CS/0364','Tutoring','I teach intro programming and data structures with real examples, one problem at a time.','https://github.com/','+2348045678901','Busy with Exams','https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=240&q=80','https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=85'),
  ('chika@seed.campulse.app','Chika Nwosu','24/CS/0221','Web Design','Accessible, clean websites and landing pages with attention to small details.','https://github.com/','+2348056789012','Available for Gigs','https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=240&q=80','https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=85'),
  ('funke@seed.campulse.app','Funke Adebayo','23/CS/0102','Photography','Portraits, convocation shoots and event coverage. Natural light, honest colour.','https://instagram.com/','+2348067890123','Available for Gigs','https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=240&q=80','https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=85'),
  ('emeka@seed.campulse.app','Emeka Obi','22/CS/0077','Video Editing','Documentary-style edits, motion titles and podcast clips for student creators.','https://youtube.com/','+2348078901234','Available for Gigs','https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=240&q=80','https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=800&q=85'),
  ('zainab@seed.campulse.app','Zainab Musa','24/CS/0350','Tutoring','Maths and CSC 101 tutoring with past-question drills and simple study plans.','https://github.com/','+2348089012345','Available for Gigs','https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=240&q=80','https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=85')
) as s(email,name,matric,skill,bio,link,wa,avail,avatar,cover)
on conflict do nothing;
