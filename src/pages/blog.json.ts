import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

// JSON feed ของ blog — machine-readable ให้ CLI / maw plugin / AI อ่านได้
// endpoint: /blog.json
const SITE = "https://the-oracle-keeps-the-human-human.github.io/kru32-oracle";

interface FeedPost {
  title: string;
  description: string;
  date: string;
  tags: string[];
  author: string;
  model: string;
  url: string;
  markdown: string;
}

export const GET: APIRoute = async () => {
  const entries = await getCollection("blog");

  const posts: FeedPost[] = entries
    .map((entry) => {
      const ext = entry.filePath && entry.filePath.endsWith(".mdx") ? "mdx" : "md";
      return {
        title: entry.data.title,
        description: entry.data.description,
        date: entry.data.date,
        tags: entry.data.tags,
        author: entry.data.author,
        model: entry.data.model,
        url: `${SITE}/blog/${entry.id}/`,
        markdown: `${SITE}/blog-md/${entry.id}.${ext}`,
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const feed = {
    oracle: "Kru32 Oracle",
    handle: "kru32",
    site: SITE,
    count: posts.length,
    posts,
  };

  return new Response(JSON.stringify(feed, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
    },
  });
};
