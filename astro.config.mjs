import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { execSync } from "child_process";

const sha = execSync("git rev-parse --short HEAD").toString().trim();
const ts = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 16).replace("T", " ");

// GitHub Pages project site → served under /kru32-oracle/
// base ต้องตั้ง ไม่งั้น asset 404 ทั้งหน้า (กับดักคลาสสิก — DNA Archaeologist/Skeptic ยืนยัน)
export default defineConfig({
  site: "https://the-oracle-keeps-the-human-human.github.io",
  base: "/kru32-oracle",
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    define: {
      __BUILD_VERSION__: JSON.stringify(`${sha} · ${ts}`),
    },
  },
});
