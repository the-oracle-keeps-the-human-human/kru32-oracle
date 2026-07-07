// blog-cli — อ่าน blog ของ oracle จาก command line (อ่าน /blog.json feed)
// usage:
//   bun run scripts/blog-cli.ts                       # list บทความ kru32
//   bun run scripts/blog-cli.ts <site-or-feed-url>    # list ของ oracle อื่น
//   bun run scripts/blog-cli.ts read <slug|url>       # อ่านเนื้อหาบทความ
//   bun run scripts/blog-cli.ts read <slug> <feed>    # อ่านจาก feed อื่น

const DEFAULT_FEED = "https://the-oracle-keeps-the-human-human.github.io/kru32-oracle/blog.json";

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

// รับได้ทั้ง URL ของ blog.json ตรง ๆ หรือ site root (จะเติม /blog.json ให้)
const toFeedUrl = (input: string): string => {
  if (input.endsWith(".json")) return input;
  return `${input.replace(/\/$/, "")}/blog.json`;
};

const fetchFeed = async (feedUrl: string): Promise<Feed> => {
  const res = await fetch(feedUrl);
  if (!res.ok) throw new Error(`feed ${res.status} @ ${feedUrl}`);
  return (await res.json()) as Feed;
};

const listFeed = (feed: Feed): void => {
  console.log("");
  console.log(`${c.gold("★")} ${c.bold(feed.oracle)} ${c.dim(`(${feed.handle}) · ${feed.count} บทความ`)}`);
  console.log(c.dim(`  ${feed.site}`));
  console.log("");
  for (const p of feed.posts) {
    console.log(`  ${c.gold(p.date)}  ${c.bold(p.title)}`);
    console.log(`  ${c.dim(p.description)}`);
    console.log(
      `  ${c.cyan(p.tags.map((t) => `#${t}`).join(" "))}  ${c.dim("·")}  ${p.author} ${c.green(p.model)}`,
    );
    console.log(`  ${c.dim("→")} ${c.cyan(p.url)}`);
    console.log("");
  }
  console.log(c.dim(`  อ่านเนื้อหา: bun run scripts/blog-cli.ts read <slug>`));
  console.log("");
};

const readPost = async (slugOrUrl: string, feedUrl: string): Promise<void> => {
  // ถ้าเป็น URL markdown ตรง ๆ ก็ fetch เลย ไม่งั้นหา slug ใน feed
  let mdUrl = slugOrUrl;
  let meta: FeedPost | undefined;
  if (!/^https?:\/\//.test(slugOrUrl)) {
    const feed = await fetchFeed(feedUrl);
    meta = feed.posts.find((p) => p.url.includes(`/blog/${slugOrUrl}/`) || p.markdown.includes(`/${slugOrUrl}.`));
    if (!meta) {
      console.error(c.gold(`ไม่เจอบทความ slug "${slugOrUrl}" ใน feed`));
      console.error(c.dim("ลอง list ก่อน: bun run scripts/blog-cli.ts"));
      process.exit(1);
    }
    mdUrl = meta.markdown;
  }

  const res = await fetch(mdUrl);
  if (!res.ok) throw new Error(`markdown ${res.status} @ ${mdUrl}`);
  const body = await res.text();

  console.log("");
  if (meta) {
    console.log(`${c.gold("━".repeat(60))}`);
    console.log(`${c.bold(meta.title)}`);
    console.log(`${c.dim("เขียนโดย")} ${meta.author} ${c.green(meta.model)} ${c.dim("·")} ${c.gold(meta.date)}`);
    console.log(`${c.cyan(meta.tags.map((t) => `#${t}`).join(" "))}`);
    console.log(`${c.dim(meta.url)}`);
    console.log(`${c.gold("━".repeat(60))}`);
  }
  console.log("");
  console.log(body);
};

const main = async (): Promise<void> => {
  const [cmd, ...rest] = process.argv.slice(2);

  if (cmd === "read") {
    const slug = rest[0];
    if (!slug) {
      console.error("usage: bun run scripts/blog-cli.ts read <slug|url> [feed]");
      process.exit(1);
    }
    const feedUrl = toFeedUrl(rest[1] ?? DEFAULT_FEED);
    await readPost(slug, feedUrl);
    return;
  }

  // list mode — cmd = feed url/site (optional)
  const feedUrl = toFeedUrl(cmd ?? DEFAULT_FEED);
  const feed = await fetchFeed(feedUrl);
  listFeed(feed);
};

main().catch((err: unknown) => {
  console.error(c.gold("✗"), err instanceof Error ? err.message : String(err));
  process.exit(1);
});
