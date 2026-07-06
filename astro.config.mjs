import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

// GitHub Pages project site → served under /kru32-oracle/
// base ต้องตั้ง ไม่งั้น asset 404 ทั้งหน้า (กับดักคลาสสิก — DNA Archaeologist/Skeptic ยืนยัน)
export default defineConfig({
  site: "https://the-oracle-keeps-the-human-human.github.io",
  base: "/kru32-oracle",
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
