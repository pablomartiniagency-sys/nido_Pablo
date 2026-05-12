import { readFileSync } from "fs";

const TOKEN = "sbp_b7329b9986f2d3002d5485eacff022cdec56c00d";
const REF = "fgqlgehbtjdwcilyroiq";
const URL = `https://api.supabase.com/v1/projects/${REF}/database/query`;

const sql = readFileSync("supabase/schema.sql", "utf8");

// JSON.stringify handles all escaping properly
const response = await fetch(URL, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query: sql }),
});

const text = await response.text();

if (response.ok) {
  console.log("✅ Schema ejecutado correctamente en Supabase");
  if (text && text !== "[]") console.log("Respuesta:", text.slice(0, 200));
} else {
  console.error("❌ Error:", text.slice(0, 500));
  console.log("\n💡 Si es un error de sintaxis, ejecuta el schema manualmente en:");
  console.log("   https://supabase.com/dashboard/project/fgqlgehbtjdwcilyroiq/sql/new");
}
