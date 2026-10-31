# Spec: AWS Interactive Guide

สถานะ: ร่างที่ตกลงกันแล้ว (ยังไม่เริ่มสร้างเว็บ) · ศัพท์ที่ใช้ในเอกสารนี้นิยามไว้ใน [CONTEXT.md](../CONTEXT.md)

## 1. เป้าหมาย
เว็บ interactive ที่บังคับให้ "ลงมือ" (ตัดสินใจ ชนลิมิต วาดเอง เขียนตอบเอง) เพื่อเตรียมสอบปลายภาค AWS แบบข้อเขียน
ผู้ใช้เป็นคนที่ต้องลงมือทำถึงจะจำได้ จุดที่อ่อนคือรายละเอียดย่อยและลิมิตของ service ที่ไม่เคยใช้ในโปรเจกต์จริง
เนื้อหาอิงจาก notes ของผู้ใช้เป็นหลัก

## 2. ผู้ใช้และการใช้งาน
- ผู้ใช้คนเดียว ใช้มือถือและคอมพอ ๆ กัน ทุกโหมดต้องใช้ดีทั้งสองจอ (บนมือถือ diagram ใช้การแตะเลือกแล้วแตะเพื่อต่อเส้น แทนการลาก)
- ภาษา: ไทยปนศัพท์อังกฤษ (ชื่อ service และศัพท์เทคนิคเป็นอังกฤษ)
- ข้อสอบเป็นแบบข้อเขียน ตอบอิสระ

## 3. ประเภทโจทย์ (จากข้อสอบกลางภาค)
ผู้ใช้ไม่มีข้อสอบเก่า จำรูปแบบได้ 3 แบบ

| ประเภท | ลักษณะ | ฝึกในโหมด |
|---|---|---|
| **Scenario** | จำลองสถานการณ์ (สั้นหรือยาว) แล้วให้เลือก service หรือแนวทาง พร้อมเหตุผล | Scenario Drill |
| **Detail** | ความต้องการสั้น ๆ แล้วโยงไปยังรายละเอียดย่อยของ service เช่น "ประหยัดค่าเก็บข้อมูล" → S3 storage class ไหน ชื่ออะไร (ผู้ใช้บอกว่าจำยากที่สุด) | Details Lab |
| **Design** | โจทย์ยาวมาก เกี่ยวข้องหลาย service อนุญาตให้ใช้ diagram ประกอบคำอธิบาย | Scenario Drill (แบบเขียน + canvas) |

รูปแบบ diagram ในข้อสอบกลางภาคเป็นแบบอิสระ ส่วนปลายภาคยังไม่ทราบ จึงรองรับทั้ง architecture (กล่อง service + ลูกศร) และลำดับขั้นตอน (เลขบนลูกศร)

## 4. โหมด
1. **Scenario Drill**
   - แบบเลือก: เฉลยว่าทำไมตัวเลือกนี้ถูก ตัวเลือกอื่นผิดเพราะอะไร และไฮไลต์ keyword ในโจทย์ที่ใช้ตัดสิน (เช่น "serverless", "> 15 min")
   - แบบเขียน: textarea + timer ฝึกทั้งข้อสั้นและข้อยาว แล้วเทียบกับ Rubric (self-check) และมีปุ่ม copy prompt สำหรับให้ AI ตรวจ
   - โจทย์ Design: หน้าตอบมีทั้ง textarea และ diagram canvas แบบง่าย (วาง service, ต่อเส้น, ใส่ label) และดู Reference Flow ได้
2. **Details Lab**: Service Detail ทั้ง Limit และ Option ของแต่ละ service
   - "ลองแล้วชน": ตั้งค่าเกินลิมิตแล้วระบบแจ้ง error พร้อมทางแก้ (เช่น Lambda > 15 นาที → Step Functions / ECS / Batch)
   - "เลือก config ตามความต้องการ": ได้โจทย์ความต้องการสั้น ๆ แล้วเลือก Option (S3 class, EC2 purchase option, DynamoDB capacity mode, RDS Multi-AZ vs Read Replica ฯลฯ) ระบบแสดงผลที่ตามมา เช่น ค่าใช้จ่าย เวลาดึงข้อมูลคืน ระยะเก็บขั้นต่ำ
   - โหมดเดาตัวเลขลิมิต
3. **Diagram Builder**: canvas แบบอิสระ วาง service ต่อเส้น ใส่ label หรือเลขลำดับ ตรวจเทียบ Reference Flow แบบยืดหยุ่น (เช็ก node ที่ต้องมีและ edge สำคัญ ไม่บังคับให้เหมือนเป๊ะ) มีโหมดวาดอิสระ + copy คำอธิบาย flow ไปให้ AI ตรวจ
4. **Review**: flashcard แบบ spaced repetition (Leitner box) ดึงจากข้อที่ตอบผิดในทุกโหมด พร้อม Mistake Log
5. **Study Notes**: สรุปที่เขียนใหม่เอง (ไม่คัดลอกจากสไลด์) จัดกลุ่มตาม Lecture/สัปดาห์ แต่ละ service ลิงก์ไปยังโจทย์และ Service Detail ที่เกี่ยวข้อง

## 5. Phases
สอบปลายภาคเวลาจำกัด (ยังไม่ทราบวันสอบ) จึงทำเป็นช่วง เรียงตามจุดอ่อนที่สุดก่อน

- **Phase 1**: Scenario Drill (รวมโจทย์ Design + canvas แบบง่าย + ดูเฉลยแผนภาพ) + Details Lab + Study Notes
- **Phase 2**: Diagram Builder เต็มรูปแบบ (ตรวจอัตโนมัติเทียบ Reference Flow)
- **Phase 3**: Review (Leitner + Mistake Log)

## 6. เนื้อหา
- แหล่งหลัก: `notes/*.md` (export จาก PDF + สรุปของผู้ใช้)
- เติมจากความรู้ AWS ได้ แต่ต้องติดป้าย **"นอก notes"** (Supplement)
- ลิมิตยึดตาม notes เป็นหลัก ถ้าตัวเลขต่างจาก AWS ปัจจุบันจะติดป้ายบอก
- Rubric มาตรฐาน: service ที่เลือก + เหตุผลที่โยงกับข้อจำกัดในโจทย์ + ทางเลือกที่ตัดทิ้งเพราะอะไร (+ diagram สำหรับโจทย์ Design)
- โจทย์กลางภาคที่ผู้ใช้จำได้ใช้เป็นแม่แบบรูปแบบโจทย์ ถ้าผู้ใช้เล่าเพิ่มให้เพิ่มลงที่นี่

## 7. การตรวจคำตอบ
- Self-check: เฉลย + Rubric checklist ให้ติ๊กเอง ใช้งานแบบ offline ได้
- AI: ปุ่ม copy prompt ที่รวม โจทย์ + Rubric + คำตอบ (+ คำอธิบาย diagram เป็นข้อความ) ไปวางในแอป Claude ไม่ต้องใช้ API key และใช้ได้บนมือถือ

## 8. เทคนิคและการ deploy
- Static site, vanilla HTML/CSS/JS ไม่มี build step (เข้ากับ GitHub Pages)
- เนื้อหาแยกเป็นไฟล์ data (services, details/limits, questions, flows, notes) ออกจาก UI เพื่อเพิ่มโจทย์ได้ง่าย
- ความคืบหน้าเก็บใน localStorage แยกแต่ละเครื่อง ไม่ต้อง sync ข้ามเครื่อง (ไม่มี export/import)
- Deploy: GitHub Pages โดยใช้ repo = โฟลเดอร์ `interactive-guide/` เหตุผลที่เลือกแทนการส่งไฟล์: เปิด Artifact บนมือถือไม่ได้ และต้องใช้ได้ทั้งมือถือและคอม
- เว็บเป็นสาธารณะ ดังนั้น `notes/` (ต้นฉบับจากสไลด์) อยู่ใน `.gitignore` ไม่ขึ้น GitHub หน้า Study Notes ต้องเขียนใหม่ด้วยถ้อยคำของเราเอง

## 9. Notes ที่ได้รับ
แหล่งเนื้อหาคือสไลด์ AWS Academy Cloud Developing ครบ 13 โมดูล (ไฟล์ต้นฉบับใน `notes/`, สรุปรายโมดูลใน `notes/_digest/M01.md`–`M13.md` ซึ่งอยู่ใต้ `notes/` จึงไม่ขึ้น GitHub) แต่ละ Lecture = 1 โมดูล:

| Lecture | หัวข้อ |
|---|---|
| M01 | Intro (คาเฟ่เป็นเรื่องราวต่อเนื่องทุกโมดูล) |
| M02 | Development environment (Console/CLI/SDK, CloudShell, Amazon Q Developer) |
| M03 | S3 |
| M04 | IAM |
| M05 | DynamoDB |
| M06 | API Gateway |
| M07 | Lambda |
| M08 | Containers (ECS/ECR/EKS, Elastic Beanstalk) |
| M09 | Caching (ElastiCache, CloudFront) |
| M10 | SQS / SNS / Kinesis |
| M11 | Step Functions |
| M12 | Cognito / STS |
| M13 | CI/CD (CodePipeline, CloudFormation, SAM) |

ข้อสังเกตจากการอ่าน notes
- สไลด์บางโมดูลมีข้อสอบตัวอย่างฝังอยู่ (เช่น M02 Amazon Q Developer, M03 versioning, M11 Choice state, M12 Cognito, M13 Support Center) ใช้เป็นแม่แบบโจทย์ได้
- **S3 storage class, lifecycle, replication ไม่มีในสไลด์เลย** ถ้าจะทำโจทย์ Detail เรื่องนี้ ต้องเป็น Supplement ("นอก notes")
- OCR เพี้ยนบางจุด ห้ามใช้ทำเฉลยโดยไม่ตรวจกับต้นฉบับ: แผนภาพคาเฟ่ใน M01, ตาราง STS ใน M12, การจัดกลุ่มเครื่องมือ DevOps ใน M13, port mapping และสไลด์ Dockerrun ใน M08, แผนภาพ endpoint type/throttling ใน M06
- ตัวเลขลิมิตที่สุ่มตรวจกับต้นฉบับแล้วตรงกัน: Lambda (memory/timeout/concurrency/layers), Step Functions (Standard vs Express), DynamoDB (RCU/WCU/batch), S3 (5 GB/5 TB/presigned URL)
- โมดูลที่แทบไม่มีตัวเลขลิมิต (ฝึกแบบ Option และ Comparison แทน): M01, M04, M08, M10

## 10. Open items
- ยังไม่ทราบวันสอบ (มีผลต่อขอบเขตของแต่ละ phase)
- ตัดสินใจแล้ว: เรื่อง S3 storage class / lifecycle / replication ใส่เป็น Supplement ติดป้าย "นอก notes" ชัดเจน (สไลด์ไม่มีเนื้อหานี้) ยังต้องถามผู้ใช้ภายหลังว่าอาจารย์เน้นหรือออกสอบจริงไหม

## 12. สถานะการสร้าง (อัปเดต 2026-10-31)
ขอบเขตรอบแรกถูกจำกัดตามเวลา: สอบปลายภาคในอีก 3 วัน ผู้ใช้อ่านได้จริง 1–2 วัน และขอบเขตปลายภาคคือ **M07–M13** เท่านั้น (M01–M06 ยังไม่ใส่ โครงข้อมูลรองรับการเพิ่มทีหลังด้วยไฟล์ `data/mXX.js` + บรรทัด script ใน `index.html`)

สร้างแล้ว (Phase 1): Scenario Drill (choice / multi-answer / written / design + canvas), Details Lab (ชนลิมิต / เลือก Option / เดาตัวเลข), Study Notes รายโมดูล, หน้าข้อที่ผิด (Review ฉบับย่อ: ฝึกซ้ำเฉพาะข้อที่ล่าสุดตอบผิด)
เนื้อหา: 7 โมดูล ประมาณ 226 รายการ (scenario/design/detail/limit) ทุกข้อมีเลขบรรทัดอ้างอิงใน notes
ตัดออกจากรอบนี้: Diagram Builder แบบตรวจอัตโนมัติเทียบ Reference Flow (ตอนนี้วาดแล้วเทียบเฉลยด้วยตาเอง หรือ copy คำอธิบายให้ AI ตรวจ), Leitner spaced repetition, เนื้อหา M01–M06 และ Supplement เรื่อง S3 storage class

การตัดสินใจที่เกิดระหว่างสร้าง
- ลิมิตจุกจิกที่ไม่ใช่เนื้อหาสอบ (เวลาแล็บ จำนวน task ในแล็บ จำนวนขั้นของ diagram ชื่อ role เริ่มต้น) ถูกตัดออกจากโหมดเดาตัวเลข
- ข้อสอบตัวอย่างใน M12: เฉลยคือ A และ E ตามหัวข้อสไลด์ (ตัวหนาที่ข้อ C เป็นความผิดเพี้ยนของการ export)
- ข้อสอบที่ต้องใช้ความรู้นอกสไลด์ติดป้าย "นอก notes" (ตอนนี้มี 2 รายการใน M13: Continuous delivery vs deployment)
- canvas บนจอแคบใช้ viewBox เล็กลงและวางกล่องเป็น 2 คอลัมน์ ส่วนแผนภาพเฉลยเลื่อนแนวนอนได้
- ป้ายอ้างอิงในเว็บเขียนว่า "notes L975" (เลขบรรทัดในไฟล์ notes ของผู้ใช้ ไม่ใช่เลขสไลด์)

ตรวจแล้ว: `node tools/validate.mjs` ผ่าน, ทดสอบโต้ตอบจริงในเบราว์เซอร์ (headless Edge) ทุกโหมด + เปิดทุกรายการ, ไม่มีหน้าล้นแนวนอนที่ความกว้าง 390px, สุ่มเทียบเฉลยกับ notes ประมาณ 25 ข้อ + เทียบลิมิตทุกรายการ (พบและแก้ 1 ข้อใน M08 ที่เฉลยเกินกว่าที่สไลด์พูด)
ยังไม่ได้ทดสอบ: การลากด้วยนิ้วบนมือถือจริง (ทดสอบด้วย pointer event จำลองเท่านั้น)

## 11. สถานะการตรวจ digest
- สุ่มเทียบตัวเลขลิมิตกับต้นฉบับครบทุกโมดูลที่มีตัวเลขสำคัญ (M02, M03, M05, M06, M07, M09, M10, M11, M12, M13, M08 บางส่วน) ตรงกัน
- ข้อควรระวังที่เหลือ: ตารางที่สไลด์ถูกแบน (เช่น M09 บรรทัด 941 เรื่อง CloudFront Functions vs Lambda@Edge) agent จัดแถวใหม่เอง ค่าที่อ่านได้ตรงกับข้อความต้นฉบับ แต่ถ้าจะใช้เป็นเฉลยของ Detail ให้เปิดดู digest ส่วน Unclear ก่อน
- ยังไม่ทราบรูปแบบ diagram ที่ข้อสอบปลายภาคจะใช้
- ผู้ใช้อาจเล่ารูปแบบโจทย์กลางภาคเพิ่ม
