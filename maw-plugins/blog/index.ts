// maw blog — อ่าน blog ของ oracle จาก /blog.json feed
// maw blog [oracle|url]              list บทความ
// maw blog read <slug> [oracle|url]  อ่านเนื้อหา
// oracle ที่รู้จัก resolve เป็น URL ให้ · ส่ง URL ตรง ๆ ก็ได้

interface InvokeContext {
  source: string;
  args: string[] | Record<string, unknown>;
  writer?: (...a: unknown[]) => void;
}
interface InvokeResult {
  ok: boolean;
  output?: string;
  error?: string;
}

// registry oracle → site (ตัวที่มีเว็บ live) · ตัวอื่นส่ง URL ตรงได้
const ORACLES: Record<string, string> = {
  kru32: "https://the-oracle-keeps-the-human-human.github.io/kru32-oracle",
  self: "https://the-oracle-keeps-the-human-human.github.io/kru32-oracle",
  nexus: "https://laris-co.github.io/nexus-oracle",
};

const c = {
  gold: (s: string) => `\x1b[38;5;220m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[38;5;44m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
  green: (s: string) => `\x1b[38;5;42m${s}\x1b[0m`,
};

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
interface Feed {
  oracle: string;
  handle: string;
  site: string;
  count: number;
  posts: FeedPost[];
}

const resolveFeed = (input: string): string => {
  const site = ORACLES[input] ?? (/^https?:\/\//.test(input) ? input : ORACLES.kru32);
  return site.endsWith(".json") ? site : `${site.replace(/\/$/, "")}/blog.json`;
};

// fetch feed พร้อม error ที่อ่านรู้เรื่อง (oracle ที่ยังไม่มี /blog.json = 404)
const getFeed = async (feedUrl: string): Promise<Feed> => {
  const res = await fetch(feedUrl);
  if (!res.ok) {
    throw new Error(`oracle นี้ยังไม่มี /blog.json feed (${res.status}) — ${feedUrl}`);
  }
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("json")) {
    throw new Error(`ตอบกลับไม่ใช่ JSON — oracle อาจยังไม่ได้ทำ /blog.json feed (${feedUrl})`);
  }
  return (await res.json()) as Feed;
};

export const command = {
  name: ["blog"],
  description: "อ่าน blog ของ oracle — maw blog <oracle>",
};

export default async function handler(ctx: InvokeContext): Promise<InvokeResult> {
  // bun-dev = subprocess → console.log ออก stdout ตรง (maw ไม่ render InvokeResult.output)
  const args = Array.isArray(ctx.args) ? ctx.args : [];

  try {
    if (args[0] === "read") {
      const slug = args[1];
      if (!slug) {
        console.error("usage: maw blog read <slug> [oracle]");
        return { ok: false };
      }
      const feedUrl = resolveFeed(args[2] ?? "kru32");
      const feed = await getFeed(feedUrl);
      const post = feed.posts.find((p) => p.url.includes(`/blog/${slug}/`));
      if (!post) {
        console.error(`ไม่เจอ slug "${slug}" (ลอง maw blog ก่อน)`);
        return { ok: false };
      }
      const body = await (await fetch(post.markdown)).text();
      console.log(c.gold("━".repeat(56)));
      console.log(c.bold(post.title));
      console.log(`${c.dim("เขียนโดย")} ${post.author} ${c.green(post.model)} ${c.dim("·")} ${c.gold(post.date)}`);
      console.log(c.cyan(post.tags.map((t) => `#${t}`).join(" ")));
      console.log(c.dim(post.url));
      console.log(c.gold("━".repeat(56)));
      console.log("");
      console.log(body);
      return { ok: true };
    }

    // list mode
    const feedUrl = resolveFeed(args[0] ?? "kru32");
    const feed = await getFeed(feedUrl);
    console.log("");
    console.log(`${c.gold("★")} ${c.bold(feed.oracle)} ${c.dim(`(${feed.handle}) · ${feed.count} บทความ`)}`);
    console.log(c.dim(`  ${feed.site}`));
    console.log("");
    for (const p of feed.posts) {
      console.log(`  ${c.gold(p.date)}  ${c.bold(p.title)}`);
      console.log(`  ${c.dim(p.description)}`);
      console.log(`  ${c.cyan(p.tags.map((t) => `#${t}`).join(" "))}  ${c.dim("·")}  ${p.author} ${c.green(p.model)}`);
      console.log(`  ${c.dim("→")} ${c.cyan(p.url)}`);
      console.log("");
    }
    console.log(c.dim("  อ่านเนื้อหา: maw blog read <slug>"));
    console.log(c.dim("  oracle อื่น: maw blog nexus | maw blog <url>"));
    return { ok: true };
  } catch (e: unknown) {
    console.error("✗", e instanceof Error ? e.message : String(e));
    return { ok: false };
  }
}

// bun-dev dispatch รัน `bun index.ts <args>` ตรง ๆ — bun ไม่ auto-call default export
// self-invoke เมื่อรันเป็น main (ไม่ใช่ import) → เรียก handler + console.log ออก stdout
if (import.meta.main) {
  const result = await handler({ source: "cli", args: process.argv.slice(2) });
  process.exit(result.ok ? 0 : 1);
}
