# maw tile / bring / join สูตรโกง

> ดึง codex coders มา tile ข้าง main — จาก session 1a4f1440 kru32-oracle (37h marathon)

---

## 🔧 Layout ที่ต้องการ

```
┌──────────┬──────────┐
│          │ codex-1  │
│  main    ├──────────┤
│          │ codex-2  │
└──────────┴──────────┘
```

## 🐾 maw tile — spawn ใหม่ + auto layout

```bash
maw tile 2 -e omx                    # 2 codex panes ข้าง main (main-vertical auto)
maw tile 3                           # 3 panes grid
maw tile 2 --cmd 'OMX_AUTO_UPDATE=0 CODEX_HOME=~/.codex-team/1 omx'  # custom env
maw tile clean                       # ลบ tile panes ทั้งหมด
```

pane count ≤ 4 → main-vertical อัตโนมัติ (source: tmux_tile.rs:259)

## 📨 maw bring — wake + split (ไม่ใช่ join!)

```bash
maw bring kru32-bins-flash --to 81-kru32:kru32     # wake oracle + split ใน target
```

⚠️ **bring = wake + split** ไม่ใช่ join-pane จาก pane ที่มีอยู่ — ชื่อ "bring" ทำให้เข้าใจผิดได้

## 🔌 join pane ที่มีอยู่แล้ว (raw tmux — รอ maw join verb #264)

```bash
# 1. หา pane ID
tmux list-panes -t 81-kru32 -a -F '#{pane_id} #{window_name}' | grep bins-flash
# → %356

tmux list-panes -t 81-kru32 -a -F '#{pane_id} #{window_name}' | grep wasm-compile
# → %357

# 2. join เข้า main window
tmux join-pane -h -s %356 -t 81-kru32:kru32        # bins-flash → ขวา
tmux join-pane -v -s %357 -t 81-kru32:kru32.1      # wasm-compile → ใต้ขวา

# 3. set layout
tmux select-layout -t 81-kru32:kru32 main-vertical
```

## 🔍 ดูสถานะ

```bash
maw ls -v                                           # ดู sessions + panes ทั้งหมด
maw codex status                                     # ดู codex team status
tmux list-panes -t 81-kru32:kru32 -F '#{pane_id} #{pane_index} #{pane_width}x#{pane_height}'
tmux list-windows -t 81-kru32                        # ดู windows ทั้งหมดใน session
```

## 📨 สื่อสารกับ coders

```bash
maw hey "81-kru32:kru32-oracle-kru32-bins-flash" "status?"     # ส่งข้อความ
maw hey maw-rs "ช่วยทำ verb ใหม่ให้หน่อย"                       # ถาม maw-rs oracle
tmux capture-pane -t "81-kru32:3" -p -S -40 | tail -20         # peek output
```

## 🔁 ส่ง pane กลับ (scatter)

```bash
tmux break-pane -t %356 -d        # ส่ง pane กลับเป็น window แยก
tmux break-pane -t %357 -d
```

## ⚡ ลัด

| ทำอะไร | คำสั่ง |
|--------|--------|
| spawn 2 codex + tile | `maw tile 2 -e omx` |
| ดู sessions ทั้งหมด | `maw ls -v` |
| ดู codex team | `maw codex status` |
| join pane ที่มีอยู่ | `tmux join-pane -h -s %ID -t session:window` |
| set layout L-shaped | `tmux select-layout -t session:window main-vertical` |
| ส่ง pane กลับ | `tmux break-pane -t %ID -d` |
| peek coder output | `tmux capture-pane -t session:window -p -S -40` |
| ส่งข้อความ coder | `maw hey "session:window" "message"` |

## ⚠️ trap ที่เจอจริง

| trap | วิธีเลี่ยง |
|------|-----------|
| `maw bring` ไม่ใช่ join-pane — เป็น wake+split | ใช้ raw `tmux join-pane` หรือรอ `maw join` verb (#264) |
| `maw bring` ใช้ oracle name ไม่ใช่ window name | `kru32-bins-flash` ไม่ใช่ `kru32-oracle-kru32-bins-flash` |
| bring ย้าย pane ไม่ใช่ copy — pane หายจาก window เดิม | `tmux break-pane -t %ID -d` เพื่อส่งกลับ |
| `tmux select-layout` ไม่มี maw verb ครอบ | raw tmux ตอนนี้ รอ `maw layout` (#264) |
| tile ≤ 4 panes = main-vertical, > 4 = grid | ใช้ count ที่ถูกต้องเพื่อได้ layout ที่ต้องการ |
| maw-rs ตอบผิดได้ — verify กับ source เสมอ | ถาม confirm + ให้ maw-rs ขุด source ก่อนรัน |

---

🤖 สูตรโกงจาก kru32-oracle — session 1a4f1440 | 2026-07-07
