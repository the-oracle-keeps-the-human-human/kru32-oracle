import { readFileSync, readdirSync, existsSync } from "fs";
import { join, dirname, basename } from "path";

const root = "public/wasm-apps";
const dirs = readdirSync(root).filter((d) => existsSync(join(root, d, ".")) && !d.startsWith("_"));
const ok = [], bad = [];
for (const d of dirs) {
  const dir = join(root, d);
  const mf = readdirSync(dir).find((f) => /^manifest.*\.json$/.test(f));
  if (!mf) continue;
  let m;
  try { m = JSON.parse(readFileSync(join(dir, mf), "utf8")); } catch (e) { bad.push([d, "bad json"]); continue; }
  const parts = m.builds?.[0]?.parts || [];
  const p0 = parts.find((p) => (p.offset ?? -1) === 0);
  if (!p0) { bad.push([d, "no offset-0 part"]); continue; }
  // resolve path relative to manifest dir
  let binPath = join(dir, p0.path.replace(/^\.\//, ""));
  if (!existsSync(binPath)) binPath = join(dir, basename(p0.path));
  if (!existsSync(binPath)) { bad.push([d, "offset-0 bin missing: " + p0.path]); continue; }
  const b0 = readFileSync(binPath)[0];
  const erase = m.new_install_prompt_erase;
  if (b0 === 0xe9 && erase === false) ok.push(d);
  else bad.push([d, `byte0=0x${b0.toString(16)} erase=${erase} (${basename(binPath)})`]);
}
console.log("FLASHABLE (offset-0=0xE9, erase:false):", ok.length);
console.log("  " + ok.sort().join(", "));
console.log("PROBLEM:", bad.length);
for (const [d, why] of bad) console.log("  ✗ " + d + " — " + why);
