# Data schema (`data/mXX.js`)

หนึ่งไฟล์ต่อหนึ่งโมดูล เรียก `GUIDE.register({...})` ตัวอย่างที่ถูกต้องและเป็นแม่แบบคือ [../data/m07.js](../data/m07.js)
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

## Knowledge Check (`data/kc.js`)
สร้างจาก `node tools/import-kc.mjs` ห้ามแก้ไฟล์ด้วยมือ: `GUIDE.registerKC('M07', { summary, remember: [{type:'list'|'table', ...}], questions: [{ id:'k-m07-01', prompt, choices:[{text,correct}], explain, source, topic? }] })` โจทย์เหล่านี้เป็น type `kc` ในโมดูลนั้น (`topic` = ลำดับหัวข้อใน notes ใช้เมื่ออัตโนมัติโยงผิด)

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
