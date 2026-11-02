// ทดสอบตัวแปลง markdown (applied-ai/md.js) กับข้อมูลจริงทุกข้อ  ใช้: node tools/test-applied-ai.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MiniMD = createRequire(import.meta.url)(path.join(root, 'applied-ai/md.js'));
const win = {};
vm.runInNewContext(fs.readFileSync(path.join(root, 'applied-ai/data/quiz.js'), 'utf8'), { window: win });
const Q = win.APPLIED_QUIZ.questions;

const failures = [];
const bad = (where, msg) => failures.push(`${where}: ${msg}`);
let checks = 0;
const eq = (name, got, want) => { checks++; if (got !== want) bad(name, `คาด ${JSON.stringify(want)} ได้ ${JSON.stringify(got)}`); };

// --- หน่วยเล็ก ---
eq('escape แท็ก', MiniMD.inline('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;');
eq('escape ในโค้ด', MiniMD.inline('`a<b && c>d`'), '<code>a&lt;b &amp;&amp; c&gt;d</code>');
eq('ตัวหนา', MiniMD.inline('**ข.** ถูก'), '<strong>ข.</strong> ถูก');
eq('ตัวหนาไม่ทำงานในโค้ด', MiniMD.inline('`**x**`'), '<code>**x**</code>');
eq('<= ปลอดภัย', MiniMD.inline('streamlit<=1.50.0'), 'streamlit&lt;=1.50.0');
eq('โค้ดบล็อก', MiniMD.render('```python\nif a < b:\n    pass\n```'), '<pre><code>if a &lt; b:\n    pass</code></pre>');
eq('บรรทัดใหม่ในย่อหน้า', MiniMD.render('บรรทัด 1\nบรรทัด 2'), '<p>บรรทัด 1<br>บรรทัด 2</p>');
eq('รายการ', MiniMD.render('- ก\n- ข'), '<ul><li>ก</li><li>ข</li></ul>');
eq('1) ไม่ใช่ลิสต์', MiniMD.render('1) A เปิด\n2) A กด'), '<p>1) A เปิด<br>2) A กด</p>');
eq('ตาราง', MiniMD.render('| a | b |\n| --- | --- |\n| 1 | `x | y` |'),
  '<div class="tbl-wrap"><table><thead><tr><th>a</th><th>b</th></tr></thead><tbody><tr><td>1</td><td><code>x | y</code></td></tr></tbody></table></div>');
eq('โค้ดบล็อกไม่ปิด', MiniMD.render('```\nabc'), '<pre><code>abc</code></pre>');

// --- ข้อมูลจริงทุกข้อ ---
const ALLOWED = new Set(['p', 'br', 'strong', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'ul', 'ol', 'li', 'div']);
function audit(where, html, raw) {
  checks++;
  for (const m of html.matchAll(/<(\/?)([a-zA-Z0-9]+)([^>]*)>/g)) {
    if (!ALLOWED.has(m[2].toLowerCase())) bad(where, `แท็กไม่อนุญาต <${m[2]}>`);
    if (m[2] === 'div' && m[1] === '' && m[3] !== ' class="tbl-wrap"') bad(where, `div แปลก ${m[0]}`);
    if (m[2] !== 'div' && m[3].trim()) bad(where, `แท็ก ${m[2]} มี attribute ${m[3]}`);
  }
  // ข้อความนอก <pre> ต้องไม่มี markdown ค้าง
  const outside = html.replace(/<pre><code>[\s\S]*?<\/code><\/pre>/g, '').replace(/<code>[\s\S]*?<\/code>/g, '');
  const plain = outside.replace(/<[^>]+>/g, ' ');
  if (/\*\*/.test(plain)) bad(where, 'มี ** ค้าง');
  if (/\|\s*:?-{3,}/.test(plain)) bad(where, 'มีแถวคั่นตารางค้าง');
  if (/`/.test(plain)) bad(where, 'มี backtick ค้างนอกโค้ด');
  if (/^\s*\|/m.test(plain)) bad(where, 'มีบรรทัดตารางดิบค้าง');
  if (/\[\[|\]\]/.test(plain)) bad(where, 'มี [[ ]] ค้าง');
  // < และ > ในเนื้อหาดิบต้องกลายเป็น entity
  const rawLt = (raw.match(/</g) || []).length;
  const entLt = (html.match(/&lt;/g) || []).length;
  if (entLt < rawLt - (raw.match(/<\/?[a-z]+>/gi) || []).length * 0) { /* นับรวมใน pre/code ด้วย */ }
  if (entLt !== rawLt) bad(where, `< ดิบ ${rawLt} ตัว แต่ &lt; ${entLt} ตัว`);
}
Q.forEach((q) => {
  audit(`ข้อ ${q.n} โจทย์`, MiniMD.render(q.stem), q.stem);
  audit(`ข้อ ${q.n} เฉลย`, MiniMD.render(q.explanation), q.explanation);
  q.options.forEach((o, i) => {
    if (/\n/.test(o)) bad(`ข้อ ${q.n} ตัวเลือก ${i}`, 'ตัวเลือกมีขึ้นบรรทัดใหม่');
    audit(`ข้อ ${q.n} ตัวเลือก ${'กขคงจ'[i]}`, MiniMD.inline(o), o);
  });
});

if (failures.length) {
  console.error(`ไม่ผ่าน ${failures.length} จุด (จาก ${checks} การตรวจ):`);
  failures.slice(0, 40).forEach((f) => console.error('  - ' + f));
  process.exit(1);
}
console.log(`ผ่านทั้งหมด ${checks} การตรวจ · ${Q.length} ข้อ (โจทย์ + เฉลย + ตัวเลือก 5 ตัวต่อข้อ)`);
