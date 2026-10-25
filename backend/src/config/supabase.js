const { createClient } = require("@supabase/supabase-js");

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  console.warn("Configura SUPABASE_URL, SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY en .env");
}

const publicClient = createClient(url || "http://localhost", anonKey || "missing");
const adminClient = createClient(url || "http://localhost", serviceKey || "missing", {
  auth: { autoRefreshToken: false, persistSession: false }
});

module.exports = { publicClient, adminClient };
