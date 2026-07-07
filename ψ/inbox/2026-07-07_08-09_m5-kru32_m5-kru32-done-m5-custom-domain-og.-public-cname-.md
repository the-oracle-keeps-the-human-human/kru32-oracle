---
from: m5:kru32
to: kru32
timestamp: 2026-07-07T08:09:31.009Z
read: false
---

[m5:kru32] DONE m5 custom-domain/OG. public/CNAME added single line: kru32.buildwithoracle.com; bun run build PASS and dist/CNAME copied. DNS needed: CNAME kru32.buildwithoracle.com -> the-oracle-keeps-the-human-human.github.io (no /kru32-oracle repo path); live dig currently returns no record. Pages settings: repo Settings > Pages > Custom domain = kru32.buildwithoracle.com, source GitHub Actions, enable HTTPS after DNS. Base path research: for Astro custom domain, set site=https://kru32.buildwithoracle.com and remove base /kru32-oracle (root /); do NOT keep /kru32-oracle once cut over or asset/internal URLs stay under subpath. I did not edit astro.config/Base per instruction. OG snippet recommended in Base.astro: compute canonical = new URL(Astro.url.pathname, Astro.site); ogImageUrl = new URL(ogImage, Astro.site); add og:title/description/url/site_name/type/image + twitter:card/title/description/image.
