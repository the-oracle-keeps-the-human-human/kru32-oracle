#!/usr/bin/env bun
import { access } from "node:fs/promises";
import fs from "node:fs/promises";
import path from "node:path";

type AnyObj = Record<string, unknown>;
type WasmAppLike = {
  id?: string;
  preview?: string;
  flashable?: boolean;
  manifest?: string;
  name?: string;
};

const rootDir = process.cwd();

const failures: string[] = [];
const warnings: string[] = [];

const stripLeadingSlash = (value: string) => value.replace(/^\/+/, "");

const normalizeBaseUrl = async () => {
  const configText = await fs.readFile(path.join(rootDir, "astro.config.mjs"), "utf8");
  const match = /base:\s*(["'`])([^"'`]+)\1/.exec(configText);
  if (!match) return "/";
  const base = match[2].trim();
  if (!base) return "/";
  return base.startsWith("/") ? base : `/${base}`;
};

const baseUrl = await normalizeBaseUrl();

const resolvePublicPath = (assetUrlOrPath: string) => {
  if (!assetUrlOrPath) return "";
  const cleaned = assetUrlOrPath
    .split("?")[0]
    .replace(/^https?:\/\/[^/]+/i, "")
    .replace(/^\/+/, "");

  const baseTrimmed = stripLeadingSlash(baseUrl);
  const withoutBase = cleaned.startsWith(baseTrimmed)
    ? cleaned.slice(baseTrimmed.length).replace(/^\/+/, "")
    : cleaned;

  return path.join(rootDir, "public", withoutBase);
};

const existsFile = async (p: string) => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

const collectManifestBinPaths = (manifest: AnyObj): string[] => {
  const result: string[] = [];

  const addFromParts = (parts: unknown) => {
    if (!Array.isArray(parts)) return;
    for (const part of parts) {
      if (part && typeof part === "object") {
        const p = (part as AnyObj).path;
        if (typeof p === "string" && p.length > 0) {
          result.push(p);
        }
      }
    }
  };

  if (Array.isArray((manifest as AnyObj).parts)) {
    addFromParts((manifest as AnyObj).parts);
  }

  if (Array.isArray((manifest as AnyObj).builds)) {
    for (const build of (manifest as AnyObj).builds as unknown[]) {
      if (build && typeof build === "object") {
        addFromParts((build as AnyObj).parts);
      }
    }
  }

  return result;
};

const appsSource = await fs.readFile(path.join(rootDir, "src/data/apps.ts"), "utf8");
const appsMatch = /export const WASM_APPS\s*:\s*WasmApp\[\]\s*=\s*(\[[\s\S]*?\]);/m.exec(
  appsSource,
);

if (!appsMatch) {
  failures.push("Cannot parse WASM_APPS export from src/data/apps.ts");
} else {
  const arrayText = appsMatch[1].replace(/asset\(\s*(["'])((?:\\.|(?!\1)[^\\])*)\1\s*\)/g, (_m, _q, p) => {
    const url = `${baseUrl}/${stripLeadingSlash(p as string)}`;
    return `"${url}"`;
  });

  const apps = new Function(`return (${arrayText});`)() as WasmAppLike[];
  console.log(`Loaded ${apps.length} apps from src/data/apps.ts`);

  for (const app of apps) {
    const name = app.name || app.id || "<unnamed>";

    if (!app.preview || typeof app.preview !== "string") {
      failures.push(`${name}: missing preview`);
    } else {
      const previewPath = resolvePublicPath(app.preview);
      if (!(await existsFile(previewPath))) {
        failures.push(`${name}: preview missing -> ${app.preview}`);
      }
    }

    if (app.flashable) {
      if (!app.manifest || typeof app.manifest !== "string") {
        failures.push(`${name}: flashable but manifest missing`);
        continue;
      }

      const manifestPath = resolvePublicPath(app.manifest);
      if (!(await existsFile(manifestPath))) {
        failures.push(`${name}: manifest missing -> ${app.manifest}`);
        continue;
      }

      let manifestJson: AnyObj;
      try {
        const manifestRaw = await fs.readFile(manifestPath, "utf8");
        manifestJson = JSON.parse(manifestRaw) as AnyObj;
      } catch {
        failures.push(`${name}: manifest not JSON -> ${app.manifest}`);
        continue;
      }

      const eraseValue = (manifestJson as AnyObj).new_install_prompt_erase;
      if (eraseValue !== false) {
        failures.push(`${name}: manifest new_install_prompt_erase is ${String(eraseValue)} (expected false)`);
      }

      const manifestDir = path.dirname(manifestPath);
      const binPaths = collectManifestBinPaths(manifestJson).map((bin) => {
        return resolvePublicPath(
          path.join(path.relative(path.join(rootDir, "public"), manifestDir), bin),
        );
      });

      if (binPaths.length === 0) {
        warnings.push(`${name}: manifest has no part/bin paths`);
      }

      for (const [idx, binPath] of binPaths.entries()) {
        if (!(await existsFile(binPath))) {
          const key = (manifestJson.parts as AnyObj[] | undefined)?.[idx];
          const binRef = key && typeof key === "object" ? JSON.stringify((key as AnyObj).path) : `part#${idx + 1}`;
          failures.push(`${name}: manifest bin missing -> ${binRef} (from ${app.manifest})`);
        }
      }
    }
  }
}

const manifestFiles = (await fs.readdir(path.join(rootDir, "public", "wasm-apps"), {
  recursive: true,
  withFileTypes: true,
}))
  .filter((entry) => entry.isFile() && /manifest.*\.json$/i.test(entry.name))
  .map((entry) => path.join(entry.parentPath!, entry.name));

for (const manifestFile of manifestFiles) {
  let manifestJson: AnyObj;
  try {
    manifestJson = JSON.parse(await fs.readFile(manifestFile, "utf8")) as AnyObj;
  } catch {
    failures.push(`${manifestFile}: invalid JSON`);
    continue;
  }

  if ((manifestJson as AnyObj).new_install_prompt_erase !== false) {
    failures.push(
      `${manifestFile}: new_install_prompt_erase=${String((manifestJson as AnyObj).new_install_prompt_erase)} (expected false)`,
    );
  }

  const manifestDir = path.dirname(manifestFile);
  const bins = collectManifestBinPaths(manifestJson);
  for (const bin of bins) {
    const abs = resolvePublicPath(path.join(path.relative(path.join(rootDir, "public"), manifestDir), bin));
    if (!(await existsFile(abs))) {
      failures.push(`${manifestFile}: referenced bin missing -> ${bin}`);
    }
  }
}

console.log("\nVerification summary:");
if (warnings.length > 0) {
  console.log("Warnings:");
  for (const warning of warnings) console.log(` - ${warning}`);
}

if (failures.length === 0) {
  console.log("PASS: apps + manifest checks");
} else {
  console.log("FAIL: found validation issues:");
  for (const failure of failures) console.log(` - ${failure}`);
  process.exitCode = 1;
}
