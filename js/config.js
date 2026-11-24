// config.js — the only file you MUST edit before running.
// Supabase Dashboard → Project Settings → API → copy "Project URL" and the "anon public" key.
// The anon key is safe in the browser: Row-Level Security decides what it can do.
export const SUPABASE_URL = 'https://YOUR-PROJECT-REF.supabase.co';
export const SUPABASE_ANON_KEY = 'YOUR-ANON-PUBLIC-KEY';
export const SUPABASE_CONFIGURED = !SUPABASE_URL.includes('YOUR-PROJECT-REF') && !SUPABASE_ANON_KEY.includes('YOUR-ANON-PUBLIC-KEY');

export const SKILLS = ['Web Design', 'Video Editing', 'Graphic Design', 'Photography', 'Tutoring'];
export const AVAILABLE = 'Available for Gigs';
export const BUSY = 'Busy with Exams';

// Artwork for the "Pick a skill" tiles. Swap any `img` for your own photo,
// e.g. 'assets/web.jpg'. `color` is the tint laid over the photo.
export const SKILL_META = {
  'Web Design':     { line: 'Sites, landing pages, portfolios', color: '#2340ff', img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=85' },
  'Video Editing':  { line: 'Recaps, reels, short films',       color: '#ff6a4d', img: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=85' },
  'Graphic Design': { line: 'Logos, flyers, brand kits',        color: '#ffb800', img: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=85' },
  'Photography':    { line: 'Portraits, events, convocation',   color: '#10b981', img: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=85' },
  'Tutoring':       { line: 'Courses, past questions, 1-on-1',  color: '#0f766e', img: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=85' },
};
