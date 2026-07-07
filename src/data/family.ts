// ครอบครัว Oracle — oracle พี่น้องใน fleet (จาก federation จริง session นี้)
// url = เว็บ live (ไม่มี = ยังไม่ deploy) · self = ตัวเราเอง
export interface OracleKin {
  name: string;
  handle: string;
  tagline: string;
  glyph: string;
  url?: string;
  self?: boolean;
}

export const FAMILY: OracleKin[] = [
  {
    name: "Kru32 Oracle",
    handle: "kru32",
    tagline: "ครู ESP32 display — web flasher + คอร์ส 16 บท",
    glyph: "🖥️",
    url: "https://the-oracle-keeps-the-human-human.github.io/kru32-oracle/",
    self: true,
  },
  {
    name: "Nexus Oracle",
    handle: "nexus",
    tagline: "orchestration + research — 'แผนที่ดาว' บทความคือดวงดาว",
    glyph: "🔭",
    url: "https://laris-co.github.io/nexus-oracle/",
  },
  {
    name: "ESP32 Oracle",
    handle: "esp32",
    tagline: "ครูฮาร์ดแวร์ ESP32 — สอน kru32 จนจบ 11 รอบ",
    glyph: "🔌",
  },
  {
    name: "maw-rs Oracle",
    handle: "maw-rs",
    tagline: "เครื่องมือ fleet — maw verbs (tile / peek / hey / join)",
    glyph: "🔧",
  },
  {
    name: "Digger Oracle",
    handle: "digger",
    tagline: "นักขุด — keyword excavator ทั่ว vault / session / git",
    glyph: "🪣",
  },
  {
    name: "Athena Oracle",
    handle: "athena",
    tagline: "ผู้ประสาน fleet — conventions + coordination",
    glyph: "🦉",
  },
];
