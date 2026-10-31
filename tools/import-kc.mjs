// แปลง Knowledge Check (markdown) เป็น data/kc.js   ใช้: node tools/import-kc.mjs [path/to/cloud-developing-kc.md]
// ไฟล์ผลลัพธ์สร้างจากสคริปต์นี้ ห้ามแก้ด้วยมือ ถ้าต้องแก้หัวข้อที่โยงผิดให้เพิ่มใน topicOverrides
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const src = process.argv[2] || 'C:/Users/noey/Desktop/my personal researcher 2/knowledge/aws-academy/cloud-developing-kc.md';
const outFile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'kc.js');
const FIRST = 7; // ขอบเขตปลายภาค M07-M13 (ไฟล์ต้นทางมี M6-M13)

// id ของข้อ -> ลำดับหัวข้อใน notes ของโมดูล (0 เริ่มต้น) ใช้เมื่อการจับคู่อัตโนมัติโยงผิด
// (ตรวจจากตารางผลการจับคู่อัตโนมัติแล้ว แก้เฉพาะข้อที่โยงผิดชัดเจน)
const topicOverrides = {
  'k-m07-01': 0, // characteristic of Lambda -> Lambda คืออะไร
  'k-m07-05': 0, // function handler -> Lambda คืออะไร (ไม่มีหัวข้อ handler โดยเฉพาะ)
  'k-m10-10': 4, // Kinesis Data Streams -> Kinesis และ queue vs stream
  'k-m11-03': 2, // role of Task state -> State 8 ชนิด
  'k-m11-06': 2, // Succeed/Fail states -> State 8 ชนิด
  'k-m11-07': 1, // two independent branches (Parallel) -> State machine และ ASL
  'k-m12-05': 2, // difference STS federated vs IAM user -> Temporary credentials และ AWS STS
  'k-m12-06': 3, // investigate deleted files -> CloudTrail
  'k-m13-02': 0  // DevOps practices in SDLC -> DevOps และ DevSecOps
};

const lines = fs.readFileSync(src, 'utf8').split(/\r?\n/);
const mods = [];
let cur = null;
for (const ln of lines) {
  const m = ln.match(/^## Module (\d+) — (.*)$/);
  if (m) { cur = { n: +m[1], lines: [] }; mods.push(cur); continue; }
  if (/^## /.test(ln)) { cur = null; continue; }
  if (cur) cur.lines.push(ln);
}

const problems = [];
const result = [];
for (const mod of mods.filter((x) => x.n >= FIRST)) {
  const L = mod.lines, mid = 'M' + String(mod.n).padStart(2, '0');
  const keyOf = { 'บทนี้ถาม': 'asks', 'หลักใหญ่': 'main', 'วิธีคิด': 'thinking', 'กฎที่ต้องจำ': 'rules' };
  const summary = {};
  for (const ln of L) {
    if (/^\*\*\d+\.\*\*/.test(ln)) break;
    const m = ln.match(/^>\s*\*\*(บทนี้ถาม|หลักใหญ่|วิธีคิด|กฎที่ต้องจำ):\*\*\s*(.*)$/);
    if (m) summary[keyOf[m[1]]] = m[2].trim();
  }
  // "จำไว้" ท้ายบทมีทั้งรายการ (- ...) และตารางเปรียบเทียบ (| ... |) เก็บเป็นบล็อกตามลำดับ
  const remember = [];
  const ri = L.findIndex((l) => l.startsWith('📌'));
  if (ri >= 0) {
    const cells = (s) => s.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
    for (let i = ri + 1; i < L.length; i++) {
      const ln = L[i];
      if (ln.startsWith('> 📊') || ln.startsWith('![[')) break;
      if (ln.startsWith('|')) {
        const rows = [];
        while (i < L.length && L[i].startsWith('|')) { rows.push(cells(L[i])); i++; }
        i--;
        const body = rows.filter((r) => !r.every((c) => /^:?-{3,}:?$/.test(c)));
        remember.push({ type: 'table', head: body[0], rows: body.slice(1) });
      } else if (ln.startsWith('- ')) {
        const items = [];
        while (i < L.length && L[i].startsWith('- ')) { items.push(L[i].slice(2).trim()); i++; }
        i--;
        remember.push({ type: 'list', items });
      }
    }
  }

  const questions = [];
  let i = 0;
  while (i < L.length) {
    const qm = L[i].match(/^\*\*(\d+)\.\*\*\s*(.*)$/);
    if (!qm) { i++; continue; }
    const q = { n: +qm[1], prompt: qm[2].trim(), opts: [], ans: null, explain: '' };
    i++;
    while (i < L.length && L[i].trim() && !/^- [A-F]\./.test(L[i])) { q.prompt += ' ' + L[i].trim(); i++; }
    while (i < L.length && !/^\*\*\d+\.\*\*/.test(L[i]) && !L[i].startsWith('📌')) {
      let m;
      if ((m = L[i].match(/^- ([A-F])\.\s*(.*)$/))) q.opts.push({ letter: m[1], text: m[2].trim() });
      else if ((m = L[i].match(/^>\s*✅\s*\*\*([A-F](?:\s*\+\s*[A-F])*)\*\*/))) q.ans = m[1].split('+').map((s) => s.trim());
      else if ((m = L[i].match(/^>\s*💡\s*(.*)$/))) {
        q.explain = m[1].trim();
        let j = i + 1;
        while (j < L.length && /^>\s+\S/.test(L[j]) && !/^>\s*(เว็บ:|!\[|\[!)/.test(L[j])) { q.explain += ' ' + L[j].replace(/^>\s*/, '').trim(); j++; }
      }
      i++;
    }
    const id = `k-${mid.toLowerCase()}-${String(q.n).padStart(2, '0')}`;
    if (q.opts.length < 3) problems.push(`${id}: ตัวเลือกน้อยกว่า 3`);
    if (!q.ans) problems.push(`${id}: ไม่พบเฉลย`);
    else if (!q.ans.every((a) => q.opts.some((o) => o.letter === a))) problems.push(`${id}: เฉลยอ้างตัวเลือกที่ไม่มี`);
    if (!q.explain) problems.push(`${id}: ไม่พบเหตุผล`);
    const item = {
      id, prompt: q.prompt,
      choices: q.opts.map((o) => ({ text: o.text, correct: !!q.ans && q.ans.includes(o.letter) })),
      explain: q.explain,
      source: `KC ${mid} ข้อ ${q.n}`
    };
    if (topicOverrides[id] != null) item.topic = topicOverrides[id];
    questions.push(item);
  }
  if (questions.length !== 10) problems.push(`${mid}: พบ ${questions.length} ข้อ (คาดว่า 10)`);
  result.push({ mid, summary, remember, questions });
}

const header = '/* สร้างโดย tools/import-kc.mjs จาก Knowledge Check ของ AWS Academy — ห้ามแก้ด้วยมือ */\n';
fs.writeFileSync(outFile, header + result.map((r) => `GUIDE.registerKC(${JSON.stringify(r.mid)}, ${JSON.stringify({ summary: r.summary, remember: r.remember, questions: r.questions }, null, 1)});\n`).join('\n'));
console.log(`เขียน ${path.relative(process.cwd(), outFile)}: ${result.map((r) => `${r.mid}=${r.questions.length}ข้อ`).join(' ')} | multi-answer ${result.reduce((n, r) => n + r.questions.filter((q) => q.choices.filter((c) => c.correct).length > 1).length, 0)}`);
if (problems.length) { console.error('ปัญหา:\n' + problems.map((p) => '  - ' + p).join('\n')); process.exit(1); }
