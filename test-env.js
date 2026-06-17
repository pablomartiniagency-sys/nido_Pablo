const { execSync } = require("child_process");
const out = execSync("npx netlify env:list", { encoding: "utf8" });
console.log(out);
