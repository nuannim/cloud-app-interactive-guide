// ตรวจไฟล์ data/mXX.js ตาม docs/data-schema.md   ใช้: node tools/validate.mjs [data/m07.js ...]
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'data');
const files = process.argv.length > 2
  ? process.argv.slice(2).map((f) => path.resolve(f))
  : fs.readdirSync(dataDir).filter((f) => /^m\d+\.js$/.test(f)).sort().map((f) => path.join(dataDir, f));

const errors = [];
const warnings = [];
const err = (file, where, msg) => errors.push(`${path.basename(file)} ${where}: ${msg}`);
const str = (v) => typeof v === 'string' && v.trim().length > 0;
const strs = (v) => Array.isArray(v) && v.length > 0 && v.every(str);

// id ของแผนภาพวาดมือที่ฝังไว้ (data/diagrams.js)
const svgIds = new Set();
try {
  const g = { svgDiagrams: {} };
  vm.runInNewContext(fs.readFileSync(path.join(dataDir, 'diagrams.js'), 'utf8'), { GUIDE: g });
  Object.keys(g.svgDiagrams).forEach((k) => svgIds.add(k));
} catch { /* ยังไม่มี data/diagrams.js: ถือว่าไม่มีแผนภาพวาดมือ */ }

const modules = [];
for (const file of files) {
  let mod = null;
  try {
    vm.runInNewContext(fs.readFileSync(file, 'utf8'), { GUIDE: { register: (m) => { mod = m; } } }, { filename: file });
  } catch (e) { err(file, 'load', e.message); continue; }
  if (!mod) { err(file, 'load', 'ไม่ได้เรียก GUIDE.register'); continue; }
  modules.push({ file, mod });
}

const ids = new Map();
function claim(file, id, prefix) {
  if (!str(id)) return err(file, 'id', 'ขาด id');
  if (!id.startsWith(prefix)) err(file, id, `id ต้องขึ้นต้นด้วย ${prefix}`);
  if (ids.has(id)) err(file, id, `id ซ้ำกับ ${ids.get(id)}`);
  ids.set(id, path.basename(file));
}

const counts = [];
for (const { file, mod } of modules) {
  const mm = (mod.module || '').toLowerCase();
  if (!/^M\d+$/.test(mod.module || '')) err(file, 'module', 'ต้องเป็นรูป M07');
  if (!str(mod.title)) err(file, 'title', 'ขาด title');
  if (!str(mod.summary)) err(file, 'summary', 'ขาด summary');
  if (!Array.isArray(mod.notes) || !mod.notes.length) err(file, 'notes', 'ต้องมี notes อย่างน้อย 1 หัวข้อ');
  (mod.notes || []).forEach((n, i) => {
    if (!str(n.heading) || !str(n.body)) err(file, `notes[${i}]`, 'ต้องมี heading และ body');
    const ds = n.diagrams || (n.diagram ? [n.diagram] : []);
    // ช่องวางภาพใน body (<div class="fig-slot" data-i="N">) ต้องอ้างภาพที่มีจริงและไม่ซ้ำ
    const slots = [...String(n.body || '').matchAll(/class="fig-slot" data-i="(\d+)"/g)].map((m) => Number(m[1]));
    slots.forEach((k, si) => {
      if (k >= ds.length) err(file, `notes[${i}]`, `fig-slot data-i="${k}" ไม่มีภาพ (มีภาพ ${ds.length} ภาพ)`);
      if (slots.indexOf(k) !== si) err(file, `notes[${i}]`, `fig-slot data-i="${k}" ซ้ำ`);
    });
    // ฉบับย่อ (brief): ใช้ช่องวางภาพชุดเดียวกัน ต้องแสดงทุกภาพของหัวข้อครั้งเดียว และสั้นกว่า body
    if (n.brief != null) {
      if (!str(n.brief)) err(file, `notes[${i}].brief`, 'brief ว่าง');
      const bs = [...String(n.brief).matchAll(/class="fig-slot" data-i="(\d+)"/g)].map((m) => Number(m[1]));
      bs.forEach((k, si) => {
        if (k >= ds.length) err(file, `notes[${i}].brief`, `fig-slot data-i="${k}" ไม่มีภาพ (มีภาพ ${ds.length} ภาพ)`);
        if (bs.indexOf(k) !== si) err(file, `notes[${i}].brief`, `fig-slot data-i="${k}" ซ้ำ`);
      });
      for (let k = 0; k < ds.length; k++) if (!bs.includes(k)) err(file, `notes[${i}].brief`, `ภาพที่ ${k} ไม่มีช่องวางใน brief (โหมดย่อต้องแสดงทุกภาพ)`);
      const plain = (s) => String(s).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').length;
      if (plain(n.brief) >= plain(n.body)) err(file, `notes[${i}].brief`, 'brief ต้องสั้นกว่า body');
    }
    ds.forEach((d, di) => {
      const w = `notes[${i}].diagram[${di}]`;
      if (!str(d.title)) err(file, w, 'ต้องมี title');
      if (!str(d.source)) err(file, w, 'ต้องมี source (เลขบรรทัดที่ยืนยันแล้ว)');
      if (d.svgId != null) { // แผนภาพวาดมือ (skill diagram-design) ฝังใน data/diagrams.js
        if (!svgIds.has(d.svgId)) err(file, w, `svgId "${d.svgId}" ไม่มีใน data/diagrams.js (รัน node tools/embed-svg.mjs)`);
        if (d.flow) err(file, w, 'ใช้ svgId หรือ flow อย่างใดอย่างหนึ่ง');
        return;
      }
      const f = d.flow;
      if (!f || !Array.isArray(f.nodes) || f.nodes.length < 3 || f.nodes.length > 9) err(file, w, 'flow.nodes ต้อง 3–9 กล่อง');
      else {
        const nid = new Set(f.nodes.map((x) => x.id));
        if (nid.size !== f.nodes.length) err(file, w, 'node id ซ้ำ');
        f.nodes.forEach((x) => { if (!str(x.id) || !str(x.label)) err(file, w, 'node ต้องมี id, label'); else if (x.label.length > 24) err(file, w, `label "${x.label}" ยาวเกิน 24 ตัวอักษร`); });
        if (!Array.isArray(f.edges) || !f.edges.length) err(file, w, 'flow.edges ว่าง');
        (f.edges || []).forEach((e) => { if (!nid.has(e.from) || !nid.has(e.to)) err(file, w, `edge ${e.from}->${e.to} อ้าง node ที่ไม่มี`); });
      }
    });
  });
  if (!(mod.notes || []).some((n) => n.diagram || (n.diagrams || []).length)) warnings.push(`${path.basename(file)}: ยังไม่มี diagram ใน notes`);

  (mod.limits || []).forEach((l) => {
    claim(file, l.id, `l-${mm}-`);
    ['service', 'name', 'display', 'source'].forEach((k) => { if (!str(l[k])) err(file, l.id, `ขาด ${k}`); });
    if (!strs(l.accept)) err(file, l.id, 'accept ต้องเป็น array ของ string อย่างน้อย 1 ค่า');
    if (l.sim) {
      const s = l.sim;
      if (!str(s.unit)) err(file, l.id, 'sim.unit ขาด');
      if (typeof s.limitAt !== 'number') err(file, l.id, 'sim.limitAt ต้องเป็นตัวเลข');
      if (!str(s.overMsg) || !str(s.fix)) err(file, l.id, 'sim ต้องมี overMsg และ fix');
      if (s.lowAt != null && typeof s.lowAt !== 'number') err(file, l.id, 'sim.lowAt ต้องเป็นตัวเลข');
      if (s.lowAt != null && !str(s.underMsg)) err(file, l.id, 'มี lowAt ต้องมี underMsg');
      if (typeof s.start === 'number' && (s.start > s.limitAt || (s.lowAt != null && s.start < s.lowAt))) err(file, l.id, 'sim.start ต้องอยู่ในช่วงที่ใช้ได้');
    }
  });

  (mod.optionGroups || []).forEach((g) => {
    claim(file, g.id, `g-${mm}-`);
    ['service', 'title'].forEach((k) => { if (!str(g[k])) err(file, g.id, `ขาด ${k}`); });
    if (!Array.isArray(g.options) || g.options.length < 2) err(file, g.id, 'ต้องมี options อย่างน้อย 2');
    const names = (g.options || []).map((o) => o.name);
    (g.options || []).forEach((o) => {
      ['name', 'traits', 'when'].forEach((k) => { if (!str(o[k])) err(file, g.id, `option ขาด ${k}`); });
    });
    if (new Set(names).size !== names.length) err(file, g.id, 'ชื่อ option ซ้ำ');
    if (!Array.isArray(g.challenges) || !g.challenges.length) err(file, g.id, 'ต้องมี challenges อย่างน้อย 1');
    (g.challenges || []).forEach((c) => {
      claim(file, c.id, `c-${mm}-`);
      ['requirement', 'answer', 'why', 'source'].forEach((k) => { if (!str(c[k])) err(file, c.id, `ขาด ${k}`); });
      if (!names.includes(c.answer)) err(file, c.id, `answer "${c.answer}" ไม่ตรงกับชื่อ option ใด`);
    });
  });

  (mod.questions || []).forEach((q) => {
    claim(file, q.id, `q-${mm}-`);
    if (!['scenario', 'design'].includes(q.type)) err(file, q.id, 'type ต้องเป็น scenario หรือ design');
    if (!['choice', 'written'].includes(q.format)) err(file, q.id, 'format ต้องเป็น choice หรือ written');
    if (!str(q.prompt)) err(file, q.id, 'ขาด prompt');
    if (!str(q.source)) err(file, q.id, 'ขาด source');
    if (q.keywords != null && !strs(q.keywords)) err(file, q.id, 'keywords ต้องเป็น array ของ string');
    (q.keywords || []).forEach((k) => { if (!q.prompt.toLowerCase().includes(k.toLowerCase())) err(file, q.id, `keyword "${k}" ไม่อยู่ใน prompt`); });
    if (q.type === 'design' && q.format !== 'written') err(file, q.id, 'design ต้องเป็น format written');
    if (q.format === 'choice') {
      if (!Array.isArray(q.choices) || q.choices.length < 3) err(file, q.id, 'choice ต้องมี choices ≥ 3');
      else {
        if (!q.choices.some((c) => c.correct)) err(file, q.id, 'ไม่มีตัวเลือกที่ถูก');
        q.choices.forEach((c, i) => { if (!str(c.text) || !str(c.why) || typeof c.correct !== 'boolean') err(file, q.id, `choices[${i}] ต้องมี text, why, correct`); });
        if (q.choices.filter((c) => c.correct).length > 1 && !/เลือก\s*\d+\s*ข้อ/.test(q.prompt)) err(file, q.id, 'ถูกหลายข้อ ต้องระบุ "(เลือก N ข้อ)" ใน prompt');
      }
    } else {
      if (!Array.isArray(q.rubric) || q.rubric.length < 3 || !q.rubric.every(str)) err(file, q.id, 'written ต้องมี rubric ≥ 3 ข้อ');
      if (!str(q.modelAnswer)) err(file, q.id, 'written ต้องมี modelAnswer');
    }
    if (q.type === 'design') {
      const f = q.flow;
      if (!f || !Array.isArray(f.nodes) || f.nodes.length < 3) err(file, q.id, 'design ต้องมี flow.nodes ≥ 3');
      else {
        const nid = new Set(f.nodes.map((n) => n.id));
        if (nid.size !== f.nodes.length) err(file, q.id, 'flow node id ซ้ำ');
        f.nodes.forEach((n) => { if (!str(n.id) || !str(n.label)) err(file, q.id, 'flow node ต้องมี id, label'); });
        if (!Array.isArray(f.edges) || !f.edges.length) err(file, q.id, 'flow.edges ว่าง');
        (f.edges || []).forEach((e) => { if (!nid.has(e.from) || !nid.has(e.to)) err(file, q.id, `edge ${e.from}->${e.to} อ้าง node ที่ไม่มี`); });
        if (f.distractors != null && !strs(f.distractors)) err(file, q.id, 'distractors ต้องเป็น array ของ string');
      }
    }
  });

  counts.push(`${mod.module}: ${(mod.questions || []).filter((q) => q.type === 'scenario').length} scenario, ` +
    `${(mod.questions || []).filter((q) => q.type === 'design').length} design, ` +
    `${(mod.optionGroups || []).reduce((n, g) => n + (g.challenges || []).length, 0)} detail(option), ` +
    `${(mod.limits || []).length} limit (${(mod.limits || []).filter((l) => l.sim).length} sim)`);
}

// Knowledge Check (data/kc.js สร้างจาก tools/import-kc.mjs)
const kcFile = path.join(dataDir, 'kc.js');
if (fs.existsSync(kcFile)) {
  const kcs = [];
  try {
    vm.runInNewContext(fs.readFileSync(kcFile, 'utf8'), { GUIDE: { registerKC: (mid, kc) => kcs.push({ mid, kc }) } }, { filename: kcFile });
  } catch (e) { err(kcFile, 'load', e.message); }
  const known = new Set(modules.map((x) => x.mod.module));
  let kcCount = 0;
  for (const { mid, kc } of kcs) {
    if (!known.has(mid)) err(kcFile, mid, 'ไม่มีโมดูลนี้ใน data/');
    if (!Array.isArray(kc.remember) || !kc.remember.length) err(kcFile, mid, 'ขาดสรุป "จำไว้"');
    (kc.questions || []).forEach((q) => {
      kcCount++;
      claim(kcFile, q.id, `k-${mid.toLowerCase()}-`);
      if (!str(q.prompt) || !str(q.explain) || !str(q.source)) err(kcFile, q.id, 'ต้องมี prompt, explain, source');
      if (!Array.isArray(q.choices) || q.choices.length < 3 || !q.choices.every((c) => str(c.text) && typeof c.correct === 'boolean')) err(kcFile, q.id, 'ต้องมีตัวเลือก ≥ 3 (text, correct)');
      else {
        const ok = q.choices.filter((c) => c.correct).length;
        if (!ok) err(kcFile, q.id, 'ไม่มีตัวเลือกที่ถูก');
        if (ok > 1 && !/select\s+(two|three|2|3)/i.test(q.prompt)) err(kcFile, q.id, 'ถูกหลายข้อ แต่ prompt ไม่บอก "(Select TWO)"');
      }
      if (q.topic != null && !(modules.find((x) => x.mod.module === mid)?.mod.notes || [])[q.topic]) err(kcFile, q.id, 'topic ชี้หัวข้อที่ไม่มี');
    });
  }
  counts.push(`KC: ${kcCount} ข้อ ใน ${kcs.length} โมดูล`);

  // คำแปลไทย (data/kc-th.js): ทุกข้อ KC ต้องมี และจำนวนตัวเลือกต้องเท่าต้นฉบับ
  const thFile = path.join(dataDir, 'kc-th.js');
  if (!fs.existsSync(thFile)) err(thFile, 'file', 'ไม่พบไฟล์คำแปล');
  else {
    let th = {};
    try {
      vm.runInNewContext(fs.readFileSync(thFile, 'utf8'), { GUIDE: { registerKCth: (m) => { th = m; } } }, { filename: thFile });
    } catch (e) { err(thFile, 'load', e.message); }
    const all = new Map(kcs.flatMap(({ kc }) => kc.questions.map((q) => [q.id, q])));
    for (const [id, q] of all) {
      const t = th[id];
      if (!t) { err(thFile, id, 'ไม่มีคำแปล'); continue; }
      if (!str(t.prompt)) err(thFile, id, 'prompt ว่าง');
      if (!Array.isArray(t.choices) || t.choices.length !== q.choices.length || !t.choices.every(str)) err(thFile, id, `ตัวเลือกต้องมี ${q.choices.length} ข้อ และไม่ว่าง`);
    }
    for (const id of Object.keys(th)) if (!all.has(id)) err(thFile, id, 'id ไม่มีใน data/kc.js');
    counts.push(`KC แปลไทย: ${Object.keys(th).length}/${all.size} ข้อ`);
  }
}

// refs ต้องชี้ id ที่มีจริง
for (const { file, mod } of modules) {
  (mod.notes || []).forEach((n, i) => (n.refs || []).forEach((r) => { if (!ids.has(r)) err(file, `notes[${i}].refs`, `ไม่พบ id ${r}`); }));
}

console.log(counts.join('\n'));
if (warnings.length) console.log('\nคำเตือน:\n' + warnings.map((w) => '  - ' + w).join('\n'));
if (errors.length) {
  console.error(`\n✗ พบ ${errors.length} ปัญหา:\n` + errors.map((e) => '  - ' + e).join('\n'));
  process.exit(1);
}
console.log(`\n✓ ผ่าน (${modules.length} โมดูล, ${ids.size} รายการ)`);
