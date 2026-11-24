export const SUPABASE_URL = 'https://omutbodiluhiltmuwzeu.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdXRib2RpbHVoaWx0bXV3emV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNDgyMTYsImV4cCI6MjEwMzkyNDIxNn0.Q62RHOVRfSHi_Jt4GT_m-AiHJuWuE7H1M_oFEfsmbcs';
export const SUPABASE_CONFIGURED = !SUPABASE_URL.includes('YOUR-PROJECT-REF') && !SUPABASE_ANON_KEY.includes('YOUR-ANON-PUBLIC-KEY');

export const SKILLS = ['Web Design', 'Video Editing', 'Graphic Design', 'Photography', 'Tutoring'];
export const AVAILABLE = 'Available for Gigs';
export const BUSY = 'Busy with Exams';

export const SKILL_META = {
  'Web Design':     { line: 'Sites, landing pages, portfolios', color: '#2340ff', img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=85' },
  'Video Editing':  { line: 'Recaps, reels, short films',       color: '#ff6a4d', img: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=85' },
  'Graphic Design': { line: 'Logos, flyers, brand kits',        color: '#ffb800', img: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=85' },
  'Photography':    { line: 'Portraits, events, convocation',   color: '#10b981', img: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=85' },
  'Tutoring':       { line: 'Courses, past questions, 1-on-1',  color: '#0f766e', img: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=85' },
};
