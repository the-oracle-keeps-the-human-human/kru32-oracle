import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

// llms.txt — แผนที่เนื้อหาสำหรับ LLM (llmstxt.org)
// AUTO-generate: blog section ดึงจาก getCollection ทุก build → เพิ่มบทความแล้วอัปเดตเอง
const SITE = "https://the-oracle-keeps-the-human-human.github.io/kru32-oracle";

export const GET: APIRoute = async () => {
  const entries = await getCollection("blog");
  const posts = entries.sort((a, b) => (a.data.date < b.data.date ? 1 : -1));

  const blogLines = posts
    .map((p) => `- [${p.data.title}](${SITE}/blog/${p.id}/): ${p.data.description} (${p.data.date}, โดย ${p.data.author} · ${p.data.model})`)
    .join("\n");

  const body = `# Kru32 Oracle

> Thai-first static web flasher and lesson gallery for Guition JC3248W535 (ESP32-S3 + AXS15231B 320x480 QSPI touch). Kru32 helps learners flash ESP32 display lessons + WASM/pet firmware from a WebSerial browser, and configure WiFi after flashing.

Deployed as a GitHub Pages project site at \`${SITE}/\`. Use the \`/kru32-oracle/\` base path when resolving relative links. Audience: Thai beginner-to-intermediate ESP32 learners. Device scope: JC3248W535 only.

Notes:
- Web flashing needs a desktop Chromium browser with WebSerial (Chrome / Edge / Comet).
- Firmware served as \`.factory.bin\` via esp-web-tools manifests; all manifests use \`new_install_prompt_erase: false\` to avoid a Chromium/WebSerial crash on ESP32-S3 native USB.
- WiFi setup is separate from flashing (native USB re-enumerates after flash).

## Main Pages

- [Home](${SITE}/): Choose a flashable app or lesson and install on JC3248W535 from the browser.
- [Blog (/blog)](${SITE}/blog/): Technical articles, organized by month.
- [Oracle Family (/family)](${SITE}/family/): Links to sibling oracles in the fleet.
- [WiFi setup (/wifi)](${SITE}/wifi/): Configure WiFi over Improv Serial after flashing.
- [Lesson: erase:false (/lesson)](${SITE}/lesson/): Why full-chip erase can crash Chromium/WebSerial.
- [Lessons start (/lessons/basic/)](${SITE}/lessons/basic/): First ESPHome lesson with full YAML.

## Blog Articles

${blogLines}

## Machine-readable

- [Blog JSON feed](${SITE}/blog.json): All articles with metadata (title, date, tags, author, model, url, markdown).
- [Sitemap](${SITE}/sitemap-index.xml): All pages.
- [Full LLM context](${SITE}/llms-full.txt): Expanded markdown — site summary, lesson catalog, WASM apps, ESPHome YAML sources.
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "access-control-allow-origin": "*",
    },
  });
};
