// supabaseClient.js — creates ONE Supabase client shared by every module.
// Loaded as an ES module from a CDN, so there is no build step or npm install.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
