// ============================================================
// Demor Hair Space — Supabase Client
// ============================================================
// This file creates one shared connection to your database,
// used by every page that needs to read or write data.

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
