const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://szckjmeawinxpqwqhylf.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Y2tqbWVhd2lueHBxd3FoeWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MTI3NjQsImV4cCI6MjA5NjA4ODc2NH0.Zb-HQwCPoXLaF-KCLhAtp-R43aSDrIQdCm5Ij4TtxKg";

async function main() {
  console.log("=== Test 1: Login directo ===");
  const client1 = createClient(supabaseUrl, supabaseAnonKey);
  const { data: loginData, error: loginError } = await client1.auth.signInWithPassword({
    email: "pablo.garciasalguero@gmail.com",
    password: "Admin2026!"
  });
  if (loginError) { console.log("ERROR LOGIN:", loginError); return; }
  console.log("LOGIN OK");
  const at = loginData.session.access_token;
  const rt = loginData.session.refresh_token;
  
  console.log("\n=== Test 2: setSession en cliente NUEVO ===");
  const client2 = createClient(supabaseUrl, supabaseAnonKey);
  const { data: setData, error: setError } = await client2.auth.setSession({
    access_token: at,
    refresh_token: rt,
  });
  if (setError) { console.log("ERROR SET SESSION:", setError); return; }
  console.log("SET SESSION OK, user:", setData.user?.email);
  
  console.log("\n=== Test 3: verify page flow ===");
  // Check identity_master_admins
  const { data: masterRow } = await client1
    .from("identity_master_admins")
    .select("id,name")
    .eq("user_id", "1e472e8e-4da5-4709-9f4f-83fc994bb2d1")
    .maybeSingle();
  console.log("Master admin row:", masterRow ? "OK - " + masterRow.name : "NOT FOUND");
  
  // Check identity_tenant_users table
  const { data: tenantRows } = await client1
    .from("identity_tenant_users")
    .select("*");
  console.log("Tenant users:", JSON.stringify(tenantRows));
  
  // Check identity_tenants table
  const { data: tenantData } = await client1
    .from("identity_tenants")
    .select("id,name,email,status,plan");
  console.log("Tenants:", JSON.stringify(tenantData));
}

main().catch(console.error);
