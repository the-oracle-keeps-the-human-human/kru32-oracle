export type Level = "basic" | "standard" | "intermediate" | "advanced";

export interface Lesson {
  id: string;
  num: string;
  name: string;
  level: Level;
  size: string;
  desc: string;
  /**
   * HTML ต้นทางสำหรับ gen-capture.ts เท่านั้น (สร้าง previews/<id>.png)
   * runtime ไม่เรนเดอร์ HTML นี้แล้ว — ทั้ง cell และจอใหญ่ใช้รูป PNG
   */
  preview: string;
}

export const LEVELS: { key: Level; label: string; color: string }[] = [
  { key: "basic", label: "Basic — เริ่มที่นี่", color: "text-[#4ae08a] border-[#1a2838]" },
  { key: "standard", label: "Standard", color: "text-[#f0c050] border-[#1a2838]" },
  { key: "intermediate", label: "Intermediate", color: "text-[#4dc4ff] border-[#1a2838]" },
  { key: "advanced", label: "Advanced", color: "text-[#ff6050] border-[#1a2838]" },
];

export const LESSONS: Lesson[] = [
  {
    id: "basic", num: "01", name: "Hello Display", level: "basic", size: "765 KB",
    desc: "จอดำ + ข้อความ + backlight ติด จุดเริ่มของทุกอย่าง",
    preview: `<div style="font-size:16px;color:#fff;font-weight:600">Hello Kru32 Oracle</div>`,
  },
  {
    id: "standard", num: "02", name: "Living Screen", level: "standard", size: "770 KB",
    desc: "Counter เปลี่ยนทุกวินาที + รูปทรง + brightness",
    preview: `<div style="color:#ffc800;font-size:10px;margin-bottom:8px">Kru32 Oracle Standard</div><div style="font-size:28px;color:#fff;font-weight:700">42</div><div style="width:65%;height:5px;background:#1a1a2e;border-radius:3px;margin-top:8px"><div style="width:42%;height:100%;background:#ffc800;border-radius:3px"></div></div><div style="color:#aaa;font-size:8px;margin-top:6px">seconds</div>`,
  },
  {
    id: "intermediate", num: "03", name: "Touch Interactive", level: "intermediate", size: "976 KB",
    desc: "LVGL + ปุ่มสัมผัส กดแล้วตัวเลขเพิ่ม bar วิ่ง",
    preview: `<div style="color:#ffd27f;font-size:10px;margin-bottom:10px">Kru32 Oracle Interactive</div><div style="font-size:32px;color:#0f7;font-weight:700">70</div><div style="width:70%;height:6px;background:#1a1a2e;border-radius:3px;margin:10px 0"><div style="width:70%;height:100%;background:#0f7;border-radius:3px"></div></div><div style="background:#1f3540;border:1px solid #ffd27f;color:#ffd27f;padding:4px 14px;border-radius:6px;font-size:10px;font-weight:600">+10</div>`,
  },
  {
    id: "advanced", num: "04", name: "Multi-page Nav", level: "advanced", size: "970 KB",
    desc: "3 หน้า + nav bar ล่าง แตะเปลี่ยนหน้า",
    preview: `<div style="color:#ffd27f;font-size:14px;font-weight:600;margin-bottom:4px">HOME</div><div style="color:#fff;font-size:9px">Welcome to Kru32 Oracle</div><div style="display:flex;gap:5px;margin-top:auto;padding-top:20px"><div style="background:#1f3540;border:1px solid #ffd27f;color:#ffd27f;padding:3px 8px;border-radius:5px;font-size:7px;font-weight:600">HOME</div><div style="background:#0a1428;border:1px solid #4fb3ff;color:#4fb3ff;padding:3px 8px;border-radius:5px;font-size:7px">STATS</div><div style="background:#280a0a;border:1px solid #ff6b6b;color:#ff6b6b;padding:3px 8px;border-radius:5px;font-size:7px">ABOUT</div></div>`,
  },
  {
    id: "time", num: "05", name: "NTP Clock", level: "standard", size: "988 KB",
    desc: "นาฬิกาจริงจาก NTP — HH:MM + วินาที + วันที่",
    preview: `<div style="color:#888;font-size:8px;margin-bottom:6px">Kru32 Oracle Clock</div><div style="font-size:36px;color:#ffd27f;font-weight:700;letter-spacing:-1px">14:32</div><div style="font-size:16px;color:#4fb3ff;margin:4px 0">05</div><div style="color:#aaa;font-size:9px">2026-07-05</div>`,
  },
  {
    id: "http", num: "06", name: "WiFi Status", level: "standard", size: "1.1 MB",
    desc: "สัญญาณ WiFi + IP + uptime แบบ card",
    preview: `<div style="color:#ffd27f;font-size:9px;margin-bottom:8px;font-weight:600">Network Status</div><div style="background:#141428;padding:6px 10px;border-radius:6px;width:90%;margin-bottom:5px;text-align:left"><div style="color:#888;font-size:7px">WiFi Signal</div><div style="color:#4fb3ff;font-size:10px;font-weight:600">-42 dBm</div><div style="width:100%;height:3px;background:#1f1f3f;border-radius:2px;margin-top:3px"><div style="width:72%;height:100%;background:#4fb3ff;border-radius:2px"></div></div></div><div style="background:#141428;padding:6px 10px;border-radius:6px;width:90%;text-align:left"><div style="color:#888;font-size:7px">IP Address</div><div style="color:#0f7;font-size:10px">192.168.1.42</div></div>`,
  },
  {
    id: "animation", num: "07", name: "Motion & Arcs", level: "intermediate", size: "981 KB",
    desc: "Arc gauge + spinner + bar เคลื่อนไหว",
    preview: `<div class="kru-spin" style="width:70px;height:70px;border:5px solid #1f1f3f;border-top-color:#4fb3ff;border-right-color:#4fb3ff;border-radius:50%"></div><div style="font-size:24px;color:#fff;font-weight:700;margin-top:10px">67%</div>`,
  },
  {
    id: "gestures", num: "08", name: "Swipe Pages", level: "intermediate", size: "967 KB",
    desc: "ปัดซ้าย-ขวาเปลี่ยนหน้า ด้วย gesture detection",
    preview: `<div style="background:#051a05;width:90%;height:70%;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center"><div style="color:#0f7;font-size:20px;font-weight:700">Page 2</div><div style="color:#888;font-size:9px;margin-top:4px">← Swipe →</div></div>`,
  },
  {
    id: "themes", num: "09", name: "Color Themes", level: "intermediate", size: "969 KB",
    desc: "สลับธีม 3 สีด้วยปุ่มสัมผัส",
    preview: `<div style="color:#fff;font-size:10px;margin-bottom:10px">Theme Demo</div><div style="width:80%;height:40px;background:#141428;border:2px solid #bb86fc;border-radius:10px;display:flex;align-items:center;justify-content:center"><div style="color:#fff;font-size:8px">Sample Card</div></div><div style="display:flex;gap:6px;margin-top:12px"><div style="width:28px;height:28px;border-radius:6px;background:#1a0a2a;border:1px solid #bb86fc"></div><div style="width:28px;height:28px;border-radius:6px;background:#0a1a1a;border:1px solid #03dac5"></div><div style="width:28px;height:28px;border-radius:6px;background:#1a1a0a;border:1px solid #ffd27f"></div></div>`,
  },
  {
    id: "sensors", num: "10", name: "Data Cards", level: "advanced", size: "973 KB",
    desc: "Template sensors → LVGL cards พร้อม on_value",
    preview: `<div style="color:#ffd27f;font-size:9px;margin-bottom:8px">Sensor Dashboard</div><div style="background:#0f1428;padding:8px 10px;border-radius:8px;border:1px solid #ff6b6b;width:85%;margin-bottom:5px;text-align:left"><div style="color:#888;font-size:7px">Temperature</div><div style="color:#ff6b6b;font-size:16px;font-weight:700">25.0 C</div></div><div style="background:#0f1428;padding:8px 10px;border-radius:8px;border:1px solid #4fb3ff;width:85%;text-align:left"><div style="color:#888;font-size:7px">Humidity</div><div style="color:#4fb3ff;font-size:16px;font-weight:700">60 %</div></div>`,
  },
  {
    id: "persistent", num: "11", name: "NVS Memory", level: "advanced", size: "973 KB",
    desc: "Boot counter + high score รอดข้าม reboot",
    preview: `<div style="color:#ffd27f;font-size:9px;margin-bottom:6px">Persistent State</div><div style="color:#ff6b6b;font-size:8px">Boots: 3</div><div style="font-size:32px;color:#4fb3ff;font-weight:700;margin:6px 0">12</div><div style="color:#0f7;font-size:8px">Total: 47 · High: 12</div><div style="background:#1f3540;border:1px solid #4fb3ff;color:#4fb3ff;padding:5px 16px;border-radius:8px;font-size:9px;font-weight:600;margin-top:12px">TAP ME</div>`,
  },
  {
    id: "dropdown", num: "12", name: "Dropdown & Roller", level: "intermediate", size: "978 KB",
    desc: "Dropdown เลือกบอร์ด + roller ปรับ brightness",
    preview: `<div style="color:#ffd27f;font-size:9px;margin-bottom:8px">Select Mode</div><div style="background:#141428;border:1px solid #4fb3ff;padding:5px 10px;border-radius:6px;width:80%;color:#fff;font-size:9px;text-align:left">JC3248W535 ▾</div><div style="color:#888;font-size:7px;margin-top:8px">Brightness</div><div style="background:#141428;padding:8px;border-radius:6px;margin-top:3px;width:60%"><div style="color:#fff;font-size:11px;text-align:center">80%</div></div>`,
  },
  {
    id: "automation", num: "13", name: "Timer State Machine", level: "advanced", size: "996 KB",
    desc: "นับถอยหลัง 30 วิ Start/Reset สาม state",
    preview: `<div style="color:#ffd27f;font-size:9px;margin-bottom:6px">Timer Automation</div><div style="width:60px;height:60px;border:4px solid #1f1f3f;border-top-color:#0f7;border-right-color:#0f7;border-radius:50%;display:flex;align-items:center;justify-content:center"><span style="color:#fff;font-size:18px;font-weight:700">30</span></div><div style="color:#4fb3ff;font-size:9px;margin-top:6px">Ready</div><div style="display:flex;gap:6px;margin-top:10px"><div style="background:#0a3a1a;border:1px solid #0f7;color:#0f7;padding:3px 10px;border-radius:5px;font-size:8px">Start</div><div style="background:#3a0a0a;border:1px solid #ff6b6b;color:#ff6b6b;padding:3px 10px;border-radius:5px;font-size:8px">Reset</div></div>`,
  },
  {
    id: "dashboard", num: "14", name: "Brewing Dashboard", level: "advanced", size: "976 KB",
    desc: "Dashboard เต็มรูปแบบ — cards, progress, temp",
    preview: `<div style="width:90%;text-align:left"><div style="color:#fff;font-size:9px;font-weight:600">Kru32 Oracle Brewing <span style="color:#0f7;border:1px solid #0f7;padding:1px 4px;border-radius:4px;font-size:7px">ACTIVE</span></div><div style="background:#0a1419;border:1px solid #1f3540;border-radius:6px;padding:6px 8px;margin-top:6px"><div style="color:#888;font-size:7px">Fermentation</div><div style="color:#ffd27f;font-size:13px;font-weight:600">Day 5/14</div><div style="width:100%;height:3px;background:#1f1f2f;border-radius:2px;margin-top:4px"><div style="width:36%;height:100%;background:#ffd27f;border-radius:2px"></div></div></div><div style="background:#0a1419;border:1px solid #1f3540;border-radius:6px;padding:6px 8px;margin-top:4px"><div style="color:#888;font-size:7px">Temperature</div><div style="color:#ff6b6b;font-size:13px;font-weight:600">22.5 C</div></div></div>`,
  },
  {
    id: "production", num: "15", name: "Production Ready", level: "advanced", size: "1.1 MB",
    desc: "OTA + safe mode + fallback AP พร้อม deploy",
    preview: `<div style="color:#0f7;font-size:10px;font-weight:600;margin-bottom:8px">Production Status</div><div style="text-align:left;font-size:8px;line-height:2"><div><span style="color:#0f7">●</span> OTA enabled</div><div><span style="color:#0f7">●</span> Safe Mode: 5 attempts</div><div><span style="color:#ffd27f">●</span> Fallback AP: Kru32 Oracle</div><div><span style="color:#0f7">●</span> Captive Portal</div></div>`,
  },
  {
    id: "gif-animation", num: "16", name: "GIF Animation", level: "advanced", size: "848 KB",
    desc: "เล่น GIF หลายเฟรมด้วย animation: component",
    preview: `<div style="color:#ffd27f;font-size:10px;margin-bottom:14px">Kru32 Oracle GIF animation</div><div class="kru-bounce" style="width:40px;height:40px;border-radius:50%;background:#4dc4ff"></div><div style="width:70%;height:2px;background:#283c50;margin-top:2px"></div>`,
  },
];
