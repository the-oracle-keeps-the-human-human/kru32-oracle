---
from: m5:kru32
to: kru32
timestamp: 2026-07-06T23:45:54.458Z
read: false
---

[m5:kru32] placeholder compile FAILED (exit 2), no artifacts/commit. Exact output:
Already up to date.
Installed 88 packages in 249ms
INFO ESPHome 2026.6.4
INFO Reading configuration lessons/00-placeholder/placeholder.yaml...
WARNING GPIO3 is a strapping PIN and should only be used for I/O with care.
Attaching external pullup/down resistors to strapping pins can cause unexpected failures.
See https://esphome.io/guides/faq/#why-am-i-getting-a-warning-about-strapping-pins
Failed config

font: [source lessons/00-placeholder/placeholder.yaml:99]
  - file: 
      family: Roboto
      weight: 400
      italic: False
      refresh: 1d
      type: gfonts
    id: font_title
    size: 24
    glyphs: 
      - KruOaclePhd 32
    glyphsets: []
    ignore_missing_glyphs: False
    bpp: 1
    extras: []
  
  Found duplicate glyphs: o (b'o'), i (b'i'), n (b'n'), S (b'S').
  - file: gfonts://Roboto
    id: font_label
    size: 14
