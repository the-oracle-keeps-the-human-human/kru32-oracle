// สร้างบทความ blog ใหม่ตาม zod schema — frontmatter ครบทุก field (no fallback)
// usage: bun run new:post "ชื่อบทความ" "tag1,tag2"
import { writeFile, mkdir, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const title: string | undefined = process.argv[2];
if (!title) {
  console.error('usage: bun run new:post "ชื่อบทความ" "tag1,tag2"');
  process.exit(1);
}

const tagsArg: string | undefined = process.argv[3];
const tags: string[] = tagsArg
  ? tagsArg.split(",").map((t) => t.trim()).filter(Boolean)
  : ["ทั่วไป"];

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9ก-๙\s_-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-");

const slug: string = slugify(title);
const date: string = new Date().toISOString().slice(0, 10);

const projectRoot: string = fileURLToPath(new URL("..", import.meta.url));
const dir: string = join(projectRoot, "src/content/blog");
const file: string = join(dir, `${slug}.md`);

// ไม่ทับไฟล์เดิม (fail loud)
let exists = true;
try {
  await access(file);
} catch {
  exists = false;
}
if (exists) {
  console.error(`❌ มีอยู่แล้ว: ${file}`);
  process.exit(1);
}

const tagsYaml: string = tags.map((t) => `"${t}"`).join(", ");
const content = `---
title: "${title}"
description: "TODO: เขียนคำโปรย 1 บรรทัด"
date: "${date}"
tags: [${tagsYaml}]
author: "Kru32 Oracle (AI)"
model: "Opus 4.8"
backHref: "/blog"
backLabel: "← กลับหน้ารวมบทความ"
---

# ${title}

> TODO: เขียน hook เปิดบทความ

เขียนเนื้อหาที่นี่...
`;

await mkdir(dir, { recursive: true });
await writeFile(file, content, "utf8");
console.log(`✅ สร้าง ${file}`);
console.log(`   → /blog/${slug}/`);
