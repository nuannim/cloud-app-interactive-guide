# AWS Interactive Guide

เว็บฝึกเตรียมสอบ AWS แบบข้อเขียน ไฟล์นี้เป็นอภิธานศัพท์ของโดเมนเท่านั้น รายละเอียดการสร้างอยู่ใน [docs/spec.md](docs/spec.md)

## Language

**Question**:
โจทย์ 1 ข้อ มี Question Type หนึ่งแบบ

**Question Type**:
ประเภทของโจทย์ มี 3 แบบ คือ Scenario, Detail, Design
_Avoid_: แบบ 1/2/3, สั้น/กลาง/ยาว (ความยาวไม่ใช่ตัวแบ่งประเภท)

**Scenario**:
Question Type ที่จำลองสถานการณ์ แล้วให้เลือก service หรือแนวทางพร้อมเหตุผล ยาวหรือสั้นก็ได้

**Detail**:
Question Type ที่ให้ความต้องการสั้น ๆ แล้วต้องโยงไปยัง Service Detail ที่ถูกต้อง เช่น ประหยัดค่าเก็บข้อมูล → S3 storage class ชื่ออะไร

**Design**:
Question Type ที่โจทย์ยาวมาก เกี่ยวข้องหลาย service และตอบด้วยข้อความคู่กับ diagram ได้

**Limit**:
ค่าเพดานเชิงตัวเลขของ service เช่น Lambda timeout 15 นาที

**Option**:
ตัวเลือก โหมด หรือ class ของ service ที่ต้องเลือกตามความต้องการ เช่น S3 Glacier Deep Archive

**Service Detail**:
คำรวมของ Limit และ Option คือสิ่งที่ Detail Question ถามถึง

**Rubric**:
รายการประเด็นที่คำตอบที่ดีต้องมี ใช้ตรวจทั้งแบบ self-check และให้ AI ตรวจ

**Reference Flow**:
diagram เฉลยของ Design Question ประกอบด้วย service ที่ต้องมีและการเชื่อมต่อที่สำคัญ

**Lecture**:
หน่วยจัดกลุ่มเนื้อหาตามสัปดาห์เรียน

**Supplement**:
เนื้อหาที่เติมจากนอก notes ของผู้ใช้ ต้องติดป้าย "นอก notes" เสมอ

**Mistake**:
บันทึกว่า Question หรือ Service Detail ข้อไหนที่ผู้ใช้ตอบผิด เป็นแหล่งข้อมูลของ Review

## Relationships

- Question หนึ่งข้อมี Question Type หนึ่งแบบ และมี Rubric หนึ่งชุด
- Detail Question ชี้ไปยัง Service Detail อย่างน้อยหนึ่งรายการ
- Design Question มี Reference Flow หนึ่งแบบ
- Service Detail และ Question สังกัด Lecture
- Mistake ชี้ไปยัง Question หรือ Service Detail
