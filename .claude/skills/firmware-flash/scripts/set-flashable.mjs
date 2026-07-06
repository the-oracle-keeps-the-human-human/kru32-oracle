// Flip flashable:true + add manifest for given app ids in src/data/apps.ts.
// usage: bun .claude/skills/firmware-flash/scripts/set-flashable.mjs <id> [<id> ...]
import { readFileSync, writeFileSync } from "fs";
const ids = process.argv.slice(2);
if (!ids.length) { console.error("usage: set-flashable.mjs <id> [<id> ...]"); process.exit(1); }
const f = "src/data/apps.ts";
let s = readFileSync(f, "utf8");
let n = 0;
for (const id of ids) {
  const re = new RegExp(`(id: "${id}",[\\s\\S]*?)flashable: false,`);
  if (re.test(s)) {
    s = s.replace(re, `$1flashable: true,\n    manifest: asset("wasm-apps/${id}/manifest-${id}.json"),`);
    n++;
  } else {
    console.log("  WARN no flashable:false match for", id, "(already flashable or id missing)");
  }
}
writeFileSync(f, s);
console.log(`set flashable:true for ${n}/${ids.length} app(s)`);
