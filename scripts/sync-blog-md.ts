import { cp, mkdir, readdir, rm, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const srcBlogDir = join(projectRoot, "src/pages/blog");
const publicBlogDir = join(projectRoot, "public/blog-md");

async function copyBlogMarkdown() {
  try {
    await stat(srcBlogDir);
  } catch (err: any) {
    if (err?.code === "ENOENT") {
      console.info("[sync-blog-md] src/pages/blog not found; skipping");
      await rm(publicBlogDir, { recursive: true, force: true });
      return;
    }
    throw err;
  }

  await rm(publicBlogDir, { recursive: true, force: true });
  await mkdir(publicBlogDir, { recursive: true });

  const entries = await readdir(srcBlogDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) {
      continue;
    }
    const slug = entry.name.replace(/\.md$/, "");
    const src = join(srcBlogDir, entry.name);
    const dst = join(publicBlogDir, `${slug}.md`);
    await cp(src, dst);
    console.info(`[sync-blog-md] copied ${slug}.md`);
  }
}

void copyBlogMarkdown();
