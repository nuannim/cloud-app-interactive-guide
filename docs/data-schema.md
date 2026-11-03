# Data schema (`cloud-app/data/mXX.js`)

หนึ่งไฟล์ต่อหนึ่งโมดูล เรียก `GUIDE.register({...})` ตัวอย่างที่ถูกต้องและเป็นแม่แบบคือ [../cloud-app/data/m07.js](../cloud-app/data/m07.js)
ตรวจด้วย `node tools/validate.mjs` (ต้องผ่านก่อนส่งงาน)

## รูปแบบ
```js
GUIDE.register({
  module: 'M07', title: 'Lambda', summary: 'บรรทัดเดียว',
  notes:  [{ heading, body /* HTML สั้น ๆ */, refs?: [id],
             diagram?: { title, caption?, source, flow: { nodes: [{id,label}], edges: [{from,to,label?}] } } }],
  limits: [{ id, service, name, display, accept: [string], source, supplement?,
             sim?: { unit, min, limitAt, sliderMax?, step?, start?, lowAt?, overMsg, underMsg?, fix } }],
  optionGroups: [{ id, service, title,
                   options: [{ name, traits, when, tradeoff? }],
                   challenges: [{ id, requirement, answer /* = ชื่อ option ตรงตัว */, why, source, supplement? }] }],
  questions: [{ id, type: 'scenario'|'design', format: 'choice'|'written', prompt, keywords?: [string], source, supplement?,
                choices?: [{ text, correct, why }],            // format = choice
                rubric?: [string], modelAnswer?: string,       // format = written
                flow?: { nodes: [{id,label}], edges: [{from,to,label?}], distractors?: [string] } }] // type = design
});
```

## แผนภาพวาดมือ (`diagrams-src/` → `data/diagrams.js`)
วาดด้วย skill `diagram-design:diagram-design` ได้ไฟล์ HTML ใน `diagrams-src/<id>.html` (id ของ `<title>`/`<desc>` ต้องขึ้นต้นด้วย `<id>-`) ตรวจด้วย `python scripts/self_check.py` ของ skill แล้วรัน `node tools/embed-svg.mjs` เพื่อฝัง `<svg>` ลง `data/diagrams.js` (ไม่ใช้ fetch/`<img>` เพราะเปิดจาก file:// ไม่ได้) ใน notes ใช้ `diagrams: [{ title, caption?, source, supplement?, svgId: '<id>' }]` (หรือ `flow` แบบวาดอัตโนมัติ) หนึ่งหัวข้อมีได้หลายรูป; แผนภาพวาดมือกว้างขั้นต่ำ 600px จอแคบเลื่อนข้างได้

**ช่องวางภาพ:** ใส่ `<div class="fig-slot" data-i="N"></div>` ใน `body` เพื่อให้ `diagrams[N]` ไปอยู่ตรงนั้น (ท้ายหัวข้อย่อยของมัน) แทนการเรียงท้ายหัวข้อ ภาพที่ไม่มีช่องวางยังเรียงท้ายหัวข้อเหมือนเดิม `validate.mjs` ตรวจว่า N มีภาพจริงและไม่ซ้ำ · หัวข้อย่อยใช้ `<h3>` กล่องเน้นใช้ `<div class="callout"><span class="callout-title">…</span><p>…</p></div>` · ภาพที่ไม่อยู่ในสไลด์ใส่ `supplement: true` (ป้าย "นอก notes") · บรรทัดเปรียบเทียบต้นหัวข้อ `<p class="analogy">…</p>` (ตัวเอียงเทา) · รายการที่ซ่อนให้กดเปิดใช้ `<details><summary>…</summary>…</details>`

**ฉบับย่อ (`brief`):** แต่ละ `notes[]` ใส่ `brief` (HTML) ได้หนึ่งชิ้น เขียนมือ ใช้ `fig-slot` ชุดเดียวกับ `body` และต้องมีช่องวางครบทุกภาพ (โหมดย่อแสดงทุกภาพ) สั้นกว่า `body` ย่อถ้อยคำแต่ไม่ตัดข้อเท็จจริงที่ออกสอบ (ศัพท์ ตัวเลข ตาราง กล่อง "จำง่าย ๆ") ตัดบรรทัดเปรียบเทียบ โค้ดยาว และรายการ task ของแล็บ · โมดูลที่มี `brief` อย่างน้อยหนึ่งหัวข้อมีปุ่ม เนื้อหาเต็ม | เนื้อหาย่อ ใต้หัวเรื่องหน้าสรุป (สลับทั้งหน้า จำค่าใน localStorage คีย์ `aws-notes-mode`) หัวข้อที่ไม่มี `brief` ใช้ `body` ทั้งสองโหมด

## Knowledge Check (`data/kc.js`)
สร้างจาก `node tools/import-kc.mjs` ห้ามแก้ไฟล์ด้วยมือ: `GUIDE.registerKC('M07', { summary, remember: [{type:'list'|'table', ...}], questions: [{ id:'k-m07-01', prompt, code? /* โค้ดประกอบโจทย์ เช่น YAML ของ k-m13-10 แสดงเป็นกล่องโค้ดใต้โจทย์ */, choices:[{text,correct}], explain, source, topic? }] })` โจทย์เหล่านี้เป็น type `kc` ในโมดูลนั้น (`topic` = ลำดับหัวข้อใน notes ใช้เมื่ออัตโนมัติโยงผิด)

**คำแปลไทยของโจทย์ KC** อยู่ใน `data/kc-th.js` (เขียนมือ ไม่ถูกเขียนทับเมื่อ import KC ใหม่): `GUIDE.registerKCth({ 'k-m07-01': { prompt, choices: [ตามลำดับ A, B, C, …] } })` `core.js` เก็บต้นฉบับอังกฤษไว้ที่ `q.en` แล้วใช้ไทยเป็นค่าเริ่มต้น หน้าทำโจทย์มีปุ่ม ไทย | EN สลับได้ และโจทย์ KC ไม่สลับลำดับตัวเลือก (เหตุผลอ้างตัวอักษร A–D) `validate.mjs` ตรวจว่าทุกข้อมีคำแปลและจำนวนตัวเลือกเท่าต้นฉบับ

## เก็งข้อสอบ (`data/predict.js`)
เขียนด้วยมือ/สคริปต์ (ไม่ใช่โจทย์ฝึก ไม่เข้า `G.index`) เรียก `GUIDE.registerPredict({ questions: [...], sets: [...] })` ตรวจด้วย `node tools/validate.mjs`
```js
{ id: 'p-m07-1', modules: ['M07'], likelihood: 'สูง'|'กลาง', depth: 'พื้นฐาน'|'ลึก', why: 'ทำไมเก็ง 1 บรรทัด',
  prompt: 'โจทย์ scenario', hints: ['คำสำคัญ', 'service ที่เกี่ยว', 'โครงคำตอบ'], // ต้อง 3 ขั้น
  modelAnswer: '...', rubric: ['≥ 4 ข้อ'], topics: [{ module: 'M07', index: 1 }], // index = ลำดับ notes[] ต้องมีจริง
  source: ['M07 L431-460'], supplement?: true }
sets: [{ id: 'A', title: 'ชุดซ้อม A', questions: ['p-...' x5] }]  // 3 ชุด ชุดละ 5 ข้อ ไม่ซ้ำข้ามชุด
```
กติกา: id ขึ้นต้น `p-` ไม่ซ้ำ · ทุกโมดูล M07–M13 มีอย่างน้อย 2 ข้อ · ข้อเท็จจริงในเฉลยต้องอ้างบรรทัด notes ส่วนที่เกินสไลด์ใส่ `supplement: true` · ตัวเลขที่เป็นเงื่อนไขสมมติของโจทย์ต้องไม่ถูกเขียนเหมือนเป็น limit ของ AWS

## กติกา
- **id** ไม่ซ้ำทั้งเว็บ ขึ้นต้นด้วย `q-mXX-` (question), `l-mXX-` (limit), `g-mXX-` (option group), `c-mXX-` (challenge)
- **source** = เลขบรรทัดในไฟล์สไลด์ต้นฉบับ เช่น `'L975'` หรือ `'L431-460'` (ทุก limit/challenge/question ต้องมี)
- เนื้อหาที่ไม่ได้มาจากสไลด์ต้องมี `supplement: true` (ขึ้นป้าย "นอก notes") และห้ามใช้จุดที่ digest ระบุไว้ใน Unclear เป็นเฉลยโดยไม่ตรวจกับต้นฉบับ
- **choice**: ≥ 3 choices, ถูกอย่างน้อย 1 (ถ้าถูกหลายข้อ ในโจทย์ต้องบอกว่า "เลือก N ข้อ"), ทุก choice มี `why`
- **written**: `rubric` ≥ 3 ข้อ + `modelAnswer`
- **design**: `format: 'written'` + `flow` (nodes ≥ 3, edges อ้าง node id ที่มีจริง) ใส่ `distractors` 2–4 ตัวไว้ปนใน palette ของ canvas
- **limit.sim** ใส่เฉพาะลิมิตที่ลองตั้งค่าเกินได้จริง (ตัวเลขเดียว) ถ้าไม่มี sim ก็ยังใช้ในโหมดเดาตัวเลขได้ผ่าน `accept` (ค่าที่ยอมรับ ทั้งมีและไม่มีหน่วย)
- **challenge.answer** ต้องตรงกับ `options[].name` ตัวใดตัวหนึ่งเป๊ะ
- **notes[].diagram** (แผนภาพประกอบหน้าสรุป เหมือน flow ของโจทย์ Design แต่ไม่มี distractors): ใส่ 2–3 แผนภาพต่อโมดูล วาดสิ่งที่ "เข้าใจผ่านภาพได้ดีกว่าอ่าน" เช่น เส้นทาง request, การไหลของข้อความ, การตัดสินใจแบบ if/else (ใช้ label บนเส้น เช่น "hit"/"miss") กล่อง 3–9 กล่อง label ไม่เกิน 24 ตัวอักษร `source` = เลขบรรทัดที่ยืนยันแล้ว แผนภาพต้องตรงกับที่สไลด์พูดเท่านั้น
- **notes.body**: เขียนใหม่ด้วยถ้อยคำของเราเอง ไม่คัดลอกสไลด์ (เว็บเป็นสาธารณะ) ไทยปนศัพท์อังกฤษ
- **refs** ต้องชี้ id ที่มีจริง
- โจทย์เป็นภาษาไทยปนศัพท์อังกฤษ ชื่อ service ใช้ภาษาอังกฤษ
