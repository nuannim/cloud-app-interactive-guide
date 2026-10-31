// ดึง <svg> ที่ skill diagram-design สร้าง (diagrams-src/*.html) ไปฝังเป็นสตริงใน data/diagrams.js
// ใช้: node tools/embed-svg.mjs   (ฝังแทน fetch/<img> เพื่อให้เปิดจาก file:// ได้และใช้ฟอนต์ของเว็บ)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'diagrams-src');
const outFile = path.join(root, 'data', 'diagrams.js');

const files = fs.readdirSync(srcDir).filter((f) => f.endsWith('.html')).sort();
const problems = [];
let out = '/* สร้างโดย tools/embed-svg.mjs จาก diagrams-src/*.html — ห้ามแก้ด้วยมือ */\nGUIDE.svgDiagrams = GUIDE.svgDiagrams || {};\n';
for (const f of files) {
  const id = f.replace(/\.html$/, '');
  const html = fs.readFileSync(path.join(srcDir, f), 'utf8');
  const m = html.match(/<svg[\s\S]*?<\/svg>/);
  if (!m) { problems.push(`${f}: ไม่พบ <svg>`); continue; }
  const svg = m[0].replace(/\n\s+/g, '\n').trim();
  if (!/role="img"/.test(svg) || !/<title id="[^"]+">/.test(svg) || !/<desc id="[^"]+">/.test(svg)) problems.push(`${f}: ต้องมี role="img", <title id>, <desc id>`);
  if (!svg.includes(`${id}-title`)) problems.push(`${f}: id ของ title/desc ต้องขึ้นต้นด้วย "${id}-"`);
  if (/<script|onload=|onclick=/i.test(svg)) problems.push(`${f}: ห้ามมี script/event handler`);
  out += `GUIDE.svgDiagrams[${JSON.stringify(id)}] = ${JSON.stringify(svg)};\n`;
}
fs.writeFileSync(outFile, out);
console.log(`ฝัง ${files.length} แผนภาพ -> ${path.relative(process.cwd(), outFile)}: ${files.map((f) => f.replace('.html', '')).join(', ')}`);
if (problems.length) { console.error(problems.map((p) => '  - ' + p).join('\n')); process.exit(1); }
