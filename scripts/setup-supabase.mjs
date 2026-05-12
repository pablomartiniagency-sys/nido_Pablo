import { readFileSync } from "fs";

const PROJECT_REF = "fgqlgehbtjdwcilyroiq";
const MANAGEMENT_TOKEN = "sbp_b7329b9986f2d3002d5485eacff022cdec56c00d";
const API = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;
const HEADERS = { Authorization: `Bearer ${MANAGEMENT_TOKEN}`, "Content-Type": "application/json" };

async function execSQL(sql) {
  const res = await fetch(API, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) {
    const text = await res.text();
    if (text.includes("already exists")) return { ok: true, note: "exists" };
    throw new Error(text.slice(0, 300));
  }
  return { ok: true };
}

async function main() {
  // Read raw SQL, split by statement-ending semicolons followed by newline
  const raw = readFileSync("supabase/schema.sql", "utf8");

  // Better splitting: match statements ending with semicolon
  const stmts = raw
    .replace(/^--.*$/gm, "")        // remove comment lines
    .split(";")                      // split by semicolon
    .map(s => s.trim())
    .filter(s => s.length > 5);     // skip empty

  console.log(`📦 Ejecutando ${stmts.length} statements...\n`);

  let ok = 0, fail = 0;
  for (let i = 0; i < stmts.length; i++) {
    // Re-add semicolon
    const sql = stmts[i] + ";";
    const preview = sql.replace(/\n/g, " ").slice(0, 70);
    try {
      const r = await execSQL(sql);
      console.log(`  ${r.note ? "⏭️" : "✅"} [${i + 1}/${stmts.length}] ${preview}...`);
      ok++;
    } catch (e) {
      // If it's a "not exist" error for DROP or ALTER, skip
      if (e.message.includes("does not exist") && (sql.includes("DROP") || sql.includes("ALTER") || sql.includes("CREATE INDEX"))) {
        console.log(`  ⏭️  [${i + 1}/${stmts.length}] ${preview}... (no existe)`);
        ok++;
      } else {
        console.log(`  ❌ [${i + 1}/${stmts.length}] ${e.message.slice(0, 150)}`);
        fail++;
      }
    }
  }

  console.log(`\n📊 ${ok} OK, ${fail} fallos`);
  if (fail === 0) console.log("🎉 Schema completado!");
  else console.log("⚠️  Algunos fallaron. Verifica en el dashboard de Supabase.");
}

main().catch(console.error);
