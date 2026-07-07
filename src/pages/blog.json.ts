import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

// JSON feed ของ blog — machine-readable ให้ CLI / maw plugin / AI อ่านได้
// endpoint: /blog.json
const SITE = "https://the-oracle-keeps-the-human-human.github.io/kru32-oracle";

interface FeedPost {
  title: string;
  description: string;
  date: string; // YYYY-MM-DD (แสดงผล)
  datetime: string; // ISO 8601 เต็ม (GMT+7)
  timestamp: number; // epoch ms — sort ง่าย ๆ
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
      // date เป็นวัน · ถ้ามี time ระบุด้วย ใช้เวลานั้น ไม่งั้นถือเป็นต้นวัน (Bangkok +07:00)
      const time = entry.data.time;
      const datetime = time
        ? `${entry.data.date}T${time}:00+07:00`
        : `${entry.data.date}T00:00:00+07:00`;
      return {
        title: entry.data.title,
        description: entry.data.description,
        date: entry.data.date,
        datetime,
        timestamp: new Date(datetime).getTime(),
        tags: entry.data.tags,
        author: entry.data.author,
        model: entry.data.model,
        url: `${SITE}/blog/${entry.id}/`,
        markdown: `${SITE}/blog-md/${entry.id}.${ext}`,
      };
    })
    .sort((a, b) => b.timestamp - a.timestamp); // ใหม่ → เก่า ด้วย timestamp

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
