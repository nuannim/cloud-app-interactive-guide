// สร้าง applied-ai/data/quiz.js จากไฟล์ข้อสอบ markdown ของวิชา Applied AI for IT
// ใช้: node tools/build-applied-ai-quiz.mjs <path ไฟล์ applied-ai-quiz.md> [--out applied-ai/data/quiz.js]
// ไม่ copy ไฟล์ .md ลง repo: อ่านแล้วเขียนเฉพาะข้อมูลสำเร็จรูป ตรวจไม่ผ่านจะหยุดและไม่เขียนไฟล์
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const outFile = path.resolve(root, outIdx >= 0 ? args[outIdx + 1] : 'applied-ai/data/quiz.js');
const input = args.find((a, i) => !a.startsWith('--') && (outIdx < 0 || i !== outIdx + 1));
if (!input) {
  console.error('ใช้: node tools/build-applied-ai-quiz.mjs <path ไฟล์ applied-ai-quiz.md> [--out applied-ai/data/quiz.js]');
  process.exit(2);
}

const LETTERS = ['ก', 'ข', 'ค', 'ง', 'จ'];
const ALLOWED_TAGS = new Set(['ไล่โค้ด', 'หาบั๊ก', 'ยาก', 'นอกสไลด์']);
const SECTIONS = [
  { id: 'real', title: 'ชุดของจริง', sub: 'quiz 2 Cache และ quiz 3 Session', from: 1, to: 10 },
  { id: 'c1', title: 'บท 1 Streamlit', sub: 'rerun · widget · form · layout', from: 11, to: 18 },
  { id: 'c2', title: 'บท 2 Caching', sub: 'cache_data · cache_resource · โมเดล local', from: 19, to: 30 },
  { id: 'c3', title: 'บท 3 Session State', sub: 'session · callback · key', from: 31, to: 42 },
  { id: 'c4', title: 'บท 4 Supabase', sub: 'query · pagination · key · RLS', from: 43, to: 51 },
  { id: 'c5', title: 'บท 5 Deployment', sub: 'GitHub · Streamlit Cloud · secrets', from: 52, to: 58 },
  { id: 'c6', title: 'บท 6 AI-Assisted Dev', sub: 'agent · prompt · workshop', from: 59, to: 73 },
  { id: 'out', title: 'นอกสไลด์', sub: 'ความรู้ทั่วไปที่อาจารย์อาจถาม', from: 74, to: 77 },
  { id: 'hard', title: 'ชุดยาก', sub: 'ไล่โค้ดหลายแนวคิด · หาบั๊ก · สถานการณ์', from: 78, to: 107 },
];

const errors = [];
const fail = (n, msg) => errors.push(`ข้อ ${n}: ${msg}`);

const text = fs.readFileSync(path.resolve(input), 'utf8');
const lines = text.split(/\r?\n/);

// หาจุดเริ่มข้อ (บรรทัดชิดซ้ายที่ขึ้นต้น **N.** นอกโค้ดบล็อก)
const starts = [];
let inFence = false;
lines.forEach((line, i) => {
  if (/^\s*```/.test(line)) inFence = !inFence;
  if (!inFence) {
    const m = line.match(/^\*\*(\d+)\.\*\*/);
    if (m) starts.push({ n: Number(m[1]), i });
  }
});

const LINK_WRAP = /\(สรุป\s+((?:\[\[[^\]]+\]\](?:\s*(?:และ|·|,)\s*)?)+)\)/g;
const LINK_ITEM = /\[\[([^\]|]+)#([^\]|]+)\|([^\]]+)\]\]/g;
const SPLIT_DOT = /\s·\s(?=[กขคงจ](?:\s(?:และ|กับ)\s[กขคงจ])?\s(?:ผิด|ถูก))/;

// ฉบับเว็บไม่มีไฟล์สรุป/หนังสือ จึงตัดข้อความที่อ้างถึงสิ่งเหล่านั้น (ต้นฉบับ .md ยังอ้างได้ตามปกติ)
const WEB_CLEANUPS = [
  [/\s*\(หนังสือบท[^)]*\)/g, ''],
  [/\s*ในไฟล์สรุป/g, ''],
];
const DANGLING = /ไฟล์สรุป|หนังสือบท|reading-notes|Obsidian/;
function webClean(s) { return WEB_CLEANUPS.reduce((acc, [re, to]) => acc.replace(re, to), s); }

function tidyExplanation(raw) {
  // " · ก ผิดเพราะ ... · ข ผิดเพราะ ..." ในบรรทัดเดียว → รายการทีละบรรทัด อ่านง่ายบนมือถือ
  const out = [];
  for (const line of raw.split('\n')) {
    const plain = !/^\s*(\||- |\d+\. |```)/.test(line);
    if (plain && SPLIT_DOT.test(line)) {
      const parts = line.split(SPLIT_DOT);
      out.push(parts[0], '');
      parts.slice(1).forEach((p) => out.push('- ' + p));
      out.push('');
    } else out.push(line);
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

const questions = [];
starts.forEach((s, k) => {
  const endLimit = k + 1 < starts.length ? starts[k + 1].i : lines.length;
  const block = lines.slice(s.i, endLimit);
  const ci = block.findIndex((l) => /^>\s*\[!success\][-+]?\s*เฉลย/.test(l));
  if (ci < 0) return fail(s.n, 'ไม่พบกล่อง "> [!success]- เฉลย"');

  // ส่วนโจทย์ + ตัวเลือก (ก่อนกล่องเฉลย) · ตัวเลือกดูเฉพาะนอกโค้ดบล็อก
  const head = block.slice(0, ci);
  const stemLines = [];
  const options = [];
  let fence = false;
  head.forEach((l, idx) => {
    const line = l.replace(/\s+$/, '');
    if (/^\s*```/.test(line)) fence = !fence;
    const om = !fence && options.length < 5 && line.match(/^([กขคงจ])\.\s+(.*)$/);
    if (om && options.length === 0 && om[1] !== LETTERS[0]) return fail(s.n, `ตัวเลือกแรกต้องเป็น ก แต่เจอ ${om[1]}`);
    if (om) {
      if (om[1] !== LETTERS[options.length]) fail(s.n, `ตัวเลือกเรียงผิด คาด ${LETTERS[options.length]} เจอ ${om[1]}`);
      options.push(om[2].trim());
    } else if (options.length === 0) {
      stemLines.push(idx === 0 ? line.replace(/^\*\*\d+\.\*\*\s*/, '') : line);
    } else if (line.trim() !== '') {
      fail(s.n, `มีข้อความหลังตัวเลือกที่ไม่ใช่ตัวเลือก: "${line.slice(0, 40)}" (ตัวเลือกต้องบรรทัดเดียว)`);
    }
  });
  if (options.length !== 5) fail(s.n, `ตัวเลือกต้องมี 5 ตัว เจอ ${options.length}`);

  // แท็กนำหน้าโจทย์ เช่น [ยาก] [ไล่โค้ด]
  let stem = stemLines.join('\n').trim();
  const tags = [];
  const tm = stem.match(/^((?:\[[^\]\n]+\]\s*)+)/);
  if (tm) {
    for (const t of tm[1].matchAll(/\[([^\]]+)\]/g)) tags.push(t[1]);
    stem = stem.slice(tm[0].length).trim();
  }
  tags.forEach((t) => { if (!ALLOWED_TAGS.has(t)) fail(s.n, `แท็กที่ไม่รู้จัก [${t}]`); });
  if (!stem) fail(s.n, 'โจทย์ว่าง');

  // กล่องเฉลย: บรรทัดต่อเนื่องที่ขึ้นต้นด้วย >
  const callout = [];
  for (let j = ci + 1; j < block.length && block[j].startsWith('>'); j++) callout.push(block[j].replace(/^>\s?/, '').replace(/\s+$/, ''));
  let expl = callout.join('\n').trim();
  const am = expl.match(/^\*\*([กขคงจ])\.\*\*/);
  if (!am) fail(s.n, 'บรรทัดแรกของเฉลยต้องขึ้นต้น **X.**');
  const answer = am ? am[1] : null;

  // ลิงก์ Obsidian ท้ายเฉลย → เก็บเป็นชื่อหัวข้อที่ควรทบทวน แล้วตัดทิ้ง
  const topics = [];
  expl = expl.replace(LINK_WRAP, (_, group) => {
    for (const m of group.matchAll(LINK_ITEM)) topics.push(m[2].trim());
    return '';
  });
  expl = tidyExplanation(webClean(expl).replace(/[ \t]+\n/g, '\n').replace(/\s+$/, ''));
  if (DANGLING.test(expl + stem + options.join(''))) fail(s.n, 'ยังอ้างถึงไฟล์สรุป/หนังสือที่ไม่ได้ขึ้นเว็บ: เพิ่มกติกาใน WEB_CLEANUPS');
  if (/\[\[|\]\]/.test(expl)) fail(s.n, 'ยังมีลิงก์ [[ ]] ค้างในเฉลย');
  if (/\[\[|\]\]/.test(stem + options.join(''))) fail(s.n, 'ยังมีลิงก์ [[ ]] ค้างในโจทย์');

  const sec = SECTIONS.find((x) => s.n >= x.from && s.n <= x.to);
  if (!sec) fail(s.n, 'เลขข้อไม่อยู่ในส่วนใดเลย');
  const q = { n: s.n, section: sec ? sec.id : null, tags, stem, options, answer, explanation: expl, topics };
  if (s.n >= 1 && s.n <= 5) q.group = 'Quiz 2 · Cache';
  if (s.n >= 6 && s.n <= 10) q.group = 'Quiz 3 · Session';
  questions.push(q);
});

// ตรวจรวม
const nums = questions.map((q) => q.n);
if (new Set(nums).size !== nums.length) errors.push('เลขข้อซ้ำ');
const max = Math.max(...nums);
for (let n = 1; n <= max; n++) if (!nums.includes(n)) errors.push(`เลขข้อขาด ${n}`);
SECTIONS.forEach((sec) => {
  const got = questions.filter((q) => q.section === sec.id).length;
  if (got !== sec.to - sec.from + 1) errors.push(`ส่วน ${sec.id}: คาด ${sec.to - sec.from + 1} ข้อ เจอ ${got}`);
});
if (max !== SECTIONS[SECTIONS.length - 1].to) errors.push(`เลขข้อสูงสุด ${max} ไม่ตรงกับช่วงส่วนสุดท้าย ${SECTIONS[SECTIONS.length - 1].to} (ถ้าเพิ่มข้อใหม่ ให้แก้ SECTIONS ในสคริปต์นี้)`);
questions.forEach((q) => {
  q.answer && !q.options[LETTERS.indexOf(q.answer)] && fail(q.n, 'คำตอบถูกชี้ตัวเลือกที่ไม่มี');
  if (/<u>/i.test(q.stem + q.explanation + q.options.join(''))) fail(q.n, 'มี <u> ขีดเส้นใต้');
});

// ห้ามมีค่า key จริงหลุด (ตัวแทนอย่าง sb_publishable_... ผ่านได้)
const blob = JSON.stringify(questions);
const SECRET = /(sb_(?:secret|publishable)_[A-Za-z0-9]{8,}|eyJ[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY)/;
if (SECRET.test(blob)) errors.push('พบข้อความคล้าย key จริง: ' + blob.match(SECRET)[0].slice(0, 20) + '…');
if (/66070\d{3}|@kmitl\.ac\.th/.test(blob)) errors.push('พบรหัสนักศึกษาหรืออีเมล');

if (errors.length) {
  console.error('build ไม่ผ่าน ' + errors.length + ' ข้อ (ไม่เขียนไฟล์):');
  errors.forEach((e) => console.error('  - ' + e));
  process.exit(1);
}

questions.sort((a, b) => a.n - b.n);
const dist = {};
questions.forEach((q) => { dist[q.answer] = (dist[q.answer] || 0) + 1; });
const data = { sections: SECTIONS, questions };
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, '/* สร้างโดย tools/build-applied-ai-quiz.mjs — ห้ามแก้ด้วยมือ */\nwindow.APPLIED_QUIZ = ' + JSON.stringify(data) + ';\n', 'utf8');

console.log(`OK ${questions.length} ข้อ → ${path.relative(root, outFile)} (${fs.statSync(outFile).size} bytes)`);
console.log('คำตอบถูก:', LETTERS.map((l) => `${l}${dist[l] || 0}`).join(' '));
SECTIONS.forEach((sec) => console.log(`  ${sec.title.padEnd(26)} ${questions.filter((q) => q.section === sec.id).length} ข้อ`));
console.log('แท็ก:', ['ไล่โค้ด', 'หาบั๊ก', 'ยาก', 'นอกสไลด์'].map((t) => `${t} ${questions.filter((q) => q.tags.includes(t)).length}`).join(' · '));
console.log('มีหัวข้อทบทวน:', questions.filter((q) => q.topics.length).length, 'ข้อ');
