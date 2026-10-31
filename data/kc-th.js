/* คำแปลภาษาไทยของโจทย์ Knowledge Check (เขียนมือ) — ต้นฉบับอังกฤษอยู่ใน data/kc.js ที่สร้างจากสคริปต์
   ตัวเลือกเรียงตามลำดับเดิมของต้นฉบับ (A, B, C, …) ห้ามสลับลำดับ */
GUIDE.registerKCth({
  /* ---------- M07 Lambda ---------- */
  'k-m07-01': { prompt: "ข้อใดอธิบายลักษณะของ AWS Lambda", choices: [
    "Lambda รันโค้ดเฉพาะเมื่อมี event มากระตุ้น และใช้ทรัพยากร compute เท่าที่จำเป็นเท่านั้น",
    "วิธีและตัวเลือกการตั้งค่าเพื่อให้ Lambda มี high availability ของ developer คล้ายกับวิธีที่ใช้กับ Amazon Elastic Compute Cloud (Amazon EC2)",
    "Lambda function รันในสภาพแวดล้อมชั่วคราวที่สร้างตามความต้องการ และ developer เป็นผู้ควบคุมว่าจะสร้างหรือปิดสภาพแวดล้อมใหม่เมื่อไร",
    "developer ต้องเขียน Lambda function โดยใช้ runtime ตัวใดตัวหนึ่งที่บริการ Lambda มีให้เท่านั้น"] },
  'k-m07-02': { prompt: "ข้อจำกัด (constraint) ข้อใดแก้ไขไม่ได้", choices: [
    "Function timeout", "Reserved concurrency", "Burst quota", "Regional quota"] },
  'k-m07-03': { prompt: "ข้อใดอธิบายวิธีที่ Amazon API Gateway เรียกใช้ AWS Lambda", choices: [
    "API Gateway เรียก function โดยตรงด้วย synchronous invocation",
    "Lambda ประมวลผล request จาก API Gateway แบบ asynchronous และ retry แต่ละ request สูงสุดสองครั้ง",
    "Lambda ใช้ event source mapping และ poll API Gateway เพื่อดึง request",
    "API Gateway เรียก function โดยตรงและ retry request ไปเรื่อย ๆ จนกว่าจะสำเร็จหรือหมดอายุ"] },
  'k-m07-04': { prompt: "การกระทำใดต้องใช้สิทธิ์ที่กำหนดไว้ใน AWS Lambda execution role (เลือก 2 ข้อ)", choices: [
    "Lambda function เขียนข้อมูลลงตาราง Amazon DynamoDB",
    "Object ที่ถูกเขียนลง bucket ของ Amazon Simple Storage Service (Amazon S3) ทำให้ Lambda function ถูกเรียกใช้",
    "Lambda poll คิว Amazon Simple Queue Service (Amazon SQS) เพื่อดึงข้อความที่ทำให้ Lambda function ถูกเรียกใช้",
    "GET route ของ Amazon API Gateway ทำให้ Lambda function ถูกเรียกใช้",
    "ข้อความที่ถูกโพสต์ไปยัง topic ของ Amazon Simple Notification Service (Amazon SNS) ทำให้ Lambda function ถูกเรียกใช้"] },
  'k-m07-05': { prompt: "ข้อใดเกี่ยวกับ function handler ใน AWS Lambda function เป็นจริง", choices: [
    "function handler คือ entry point ที่ Lambda เรียกเพื่อเริ่มรัน Lambda function",
    "method ของ function handler อาจรับ event object หรือ context object",
    "event object ให้ข้อมูลเกี่ยวกับ event ที่เรียก Lambda function และต้องเป็น object ที่กำหนดไว้ล่วงหน้าซึ่งบริการ AWS สร้างขึ้น",
    "context object ให้ข้อมูล runtime และ developer ต้องสร้าง context object ให้ตรงกับ runtime ที่เลือกไว้สำหรับ function"] },
  'k-m07-06': { prompt: "ปัญหาใดอาจแก้ได้ด้วยการเพิ่ม provisioned concurrency ให้ AWS Lambda function", choices: [
    "มี Lambda function อื่นรันอยู่ใน account และ Region เดียวกัน บางครั้งมันพุ่งสูงและใช้ concurrency ที่มีทั้งหมดจน function ล้มเหลว",
    "แอปพลิเคชันที่ใช้ Lambda function ตอบสนองช้าสำหรับผู้ใช้ไม่กี่คนแรกที่ sign in ในแต่ละวัน และ metric ของ Lambda แสดง latency สูงกว่าปกติสำหรับ request ช่วงแรกเหล่านั้น",
    "ระบบ backend แบบ legacy ล้มเหลวเป็นพัก ๆ เมื่อ developer เชื่อมต่อ จึงอยากลดเวลารอของ function เมื่อ backend ล้มเหลวเพื่อหลีกเลี่ยงค่าใช้จ่ายส่วนเกิน",
    "developer ต้องการมองเห็น transaction ที่ใช้ Lambda function ให้ละเอียดขึ้นเพื่อหา bottleneck"] },
  'k-m07-07': { prompt: "developer ใช้การตั้งค่า AWS Lambda ตัวใดจัดการ error ของ function เมื่อตั้ง topic ของ Amazon Simple Notification Service (Amazon SNS) เป็น event source ของ Lambda function (เลือก 2 ข้อ)", choices: [
    "State machines", "File systems", "Destinations", "Virtual private cloud", "Asynchronous invocations"] },
  'k-m07-08': { prompt: "deployment package แบบ .zip ที่รวมโค้ดและ library ที่ทำเองมีขนาด 75 MB ควรใช้วิธี deploy AWS Lambda แบบใด", choices: [
    "คัดลอกโค้ดไปวางใน editor ของ Lambda console เพื่อสร้างและ deploy function",
    "อัปโหลดไฟล์ .zip จาก integrated development environment (IDE) เพื่อโหลด deployment package เข้า Lambda console โดยตรง",
    "อัปโหลด deployment package ไปที่ bucket ของ Amazon Simple Storage Service (Amazon S3) แล้วระบุชื่อ bucket และ object key ใน Lambda console",
    "อัปโหลด deployment package ไปที่ volume ของ Amazon Elastic Block Store (Amazon EBS) แล้วใช้การตั้งค่า File Systems เพื่ออ้างอิงถึงมัน"] },
  'k-m07-09': { prompt: "Amazon Resource Name (ARN) ของ function เป็นดังนี้: `arn:aws:lambda:aws-region:acct-id:function:helloworld:PROD`", choices: [
    "ARN นี้จะเรียก version PROD ของ function ซึ่งเป็น immutable",
    "ARN นี้จะเรียก version ของ function ที่ผูกอยู่กับ alias PROD ในขณะนั้น",
    "ARN นี้จะเรียก function และรวม AWS Lambda layer ที่ชื่อ PROD เข้าไปด้วย",
    "ARN นี้จะ deploy function helloworld ไปยัง account PROD"] },
  'k-m07-10': { prompt: "ผู้ใช้แอปพลิเคชัน serverless รายงานว่าเกิด error เมื่อพยายามดึงข้อมูลคำสั่งซื้อ สมมติว่าเปิดใช้ AWS X-Ray อยู่ ขั้นแรกที่ developer ควรทำใน X-Ray เพื่อเริ่มแก้ปัญหาที่ถูกรายงานให้เร็วคืออะไร", choices: [
    "เจาะลึก trace ล่าสุดเพื่อมองหา error",
    "ค้นหา metadata ที่เกี่ยวข้องกับผู้ใช้ที่รายงานปัญหา",
    "เพิ่ม annotation เพื่อใช้จัดกลุ่มและกรอง trace",
    "ใช้ service map เพื่อมองหาตำแหน่งที่เกิด error ทั่วทั้งแอปพลิเคชันด้วยภาพ"] },

  /* ---------- M08 Containers ---------- */
  'k-m08-01': { prompt: "ข้อใดอธิบายประโยชน์ที่ทำให้อุตสาหกรรมขนส่งและอุตสาหกรรมซอฟต์แวร์หันมาใช้ container", choices: [
    "ผู้ให้บริการโครงสร้างพื้นฐานสร้าง dependency ที่แน่นแฟ้นระหว่างแพลตฟอร์มของตนกับชนิดของ container ที่เลือกใช้ได้",
    "การซ่อนรายละเอียดของสิ่งที่ “ขนส่ง” ช่วยเพิ่มความคล่องตัว (agility) ของระบบ",
    "การมองเห็นรายละเอียดของสิ่งที่ “ขนส่ง” ได้มากขึ้นช่วยให้ทุกจุดในระบบให้การสนับสนุนได้ตรงชนิด",
    "การใช้ container ชนิดที่ไม่เป็นมาตรฐานทำให้ผู้ผลิตมีความยืดหยุ่น"] },
  'k-m08-02': { prompt: "ข้อใดเป็นส่วนประกอบของ container (เลือก 2 ข้อ)", choices: [
    "Host server", "Runtime engine", "Operating system", "Application code", "Virtual machine"] },
  'k-m08-03': { prompt: "ข้อใดเกี่ยวกับ Docker container เป็นจริง", choices: [
    "container คือ instance ที่รันได้ของ image",
    "container registry คือ template สำหรับเปิด container",
    "container image คือ template ที่เขียนทับได้ (writeable)",
    "container layer คือ layer แบบ read-only บาง ๆ ที่ผูกอยู่กับ container ที่กำลังรัน"] },
  'k-m08-04': { prompt: "คำสั่ง Docker CLI ใดสร้าง container ชื่อ my_app_1 จาก image ชื่อ node_app", choices: [
    "`docker run --name my_app_1 node_app`",
    "`docker build --tag my_app_1`",
    "`docker exec -it my_app_1 sh`",
    "`docker images my_app_1 from node_app`"] },
  'k-m08-05': { prompt: "ข้อใดเกี่ยวกับ Dockerfile เป็นจริง", choices: [
    "Dockerfile เป็นไฟล์ YAML ที่ให้คำสั่งสำหรับสร้าง container image",
    "ทุกคำสั่ง (instruction) ใน Dockerfile สร้าง layer แบบ read-only ใน image",
    "ถ้า developer แก้ Dockerfile แล้ว build image ใหม่ ทุก layer ของ image ต้องถูก build ใหม่หมด",
    "developer ใช้ Dockerfile รัน script ที่จะทำงานหลังจาก container ถูกสร้างขึ้นไม่ได้"] },
  'k-m08-06': { prompt: "developer ต้องการย้ายเว็บไซต์ shopping แบบ monolithic ไปเป็นแอปพลิเคชันแบบ microservice ข้อใดเป็นเหตุผลที่ควรเลือกใช้ container", choices: [
    "แต่ละ container ใช้ภาษาและเทคโนโลยีที่เหมาะกับ service นั้นที่สุดได้",
    "component ที่อยู่ใน container ไม่ได้แยกจากกัน แอปพลิเคชันจึงพัฒนาต่อไปเป็นระบบเดียว",
    "container เหมาะกับการออกแบบที่หลีกเลี่ยงการใช้ทรัพยากรชั่วคราว",
    "container แยก dependency และ library ของคุณออกไปไว้ใน object ของตัวเอง"] },
  'k-m08-07': { prompt: "developer เพิ่งสร้างแอปพลิเคชัน proof-of-concept ด้วย container และเจ้าของธุรกิจต้องการนำขึ้น production ข้อใดเป็นเหตุผลหลักที่ developer อาจใช้ container orchestration service", choices: [
    "เพื่อจัดตารางการเริ่มและหยุด container และกำหนดว่าจะวาง container ไว้ที่ใด",
    "เพื่อให้ container ของตนสร้างจาก image ของบุคคลที่สาม",
    "เพื่อตัดข้อกำหนดที่ต้องใช้ container registry",
    "เพื่อรับคำแนะนำอัตโนมัติว่าจะปรับปรุงโค้ดแอปพลิเคชันให้รันบน container ได้ดีขึ้นอย่างไร"] },
  'k-m08-08': { prompt: "ข้อใดเกี่ยวกับ Amazon Elastic Container Service (Amazon ECS) เป็นจริง", choices: [
    "Amazon ECS เป็น container orchestration service ที่ขยายได้สูงและรองรับ Docker container",
    "Amazon ECS บังคับให้ใช้ Amazon Elastic Container Registry (Amazon ECR) สำหรับ container image",
    "Amazon ECS รองรับการเปิด container บน Amazon EC2 หรือ AWS Lambda",
    "ด้วย Amazon ECS คุณ deploy แอปพลิเคชันไปยัง container ได้แม้จะไม่ได้ออกแบบมาให้รันบน container โดยเฉพาะ"] },
  'k-m08-09': { prompt: "ชื่อเรียกกลุ่มของ component ของ AWS Elastic Beanstalk ในเชิงตรรกะ ซึ่งมีแนวคิดคล้ายโฟลเดอร์ คืออะไร", choices: [
    "Environment", "Platform", "Application", "Environment tier"] },
  'k-m08-10': { prompt: "developer ต้องการทำ canary testing กับ deployment ใหม่ ควรใช้ตัวเลือก deployment policy ของ AWS Elastic Beanstalk แบบใด", choices: [
    "Immutable", "Rolling with batch", "Traffic Splitting", "Blue/Green"] },

  /* ---------- M09 Caching ---------- */
  'k-m09-01': { prompt: "architect แนะนำให้ developer เพิ่ม caching ให้แอปพลิเคชันที่มีอยู่เพื่อแก้ปัญหาด้านประสิทธิภาพ ข้อใดอธิบายปัจจัยที่ developer ควรพิจารณาเมื่อตัดสินใจว่าจะเพิ่ม caching ที่ใด", choices: [
    "หลีกเลี่ยงการ cache ข้อมูลของ query ที่ช้าและรันแพง",
    "ตรวจสอบข้อมูลและรูปแบบการเข้าถึง ข้อมูลที่เปลี่ยนเร็วแต่ถูกเข้าถึงไม่บ่อยควรถูก cache",
    "พิจารณาระดับที่ยอมรับข้อมูลเก่า (stale data) ได้ในแต่ละบริบทที่ใช้ข้อมูลนั้น",
    "เพิ่ม caching ให้มากที่สุดในหลายที่ที่สุดตั้งแต่ช่วงต้นของการพัฒนา"] },
  'k-m09-02': { prompt: "developer พบว่า in-memory key-value store จะช่วยให้ query ของแอปพลิเคชันเร็วขึ้น พวกเขาต้องการให้ solution ง่ายที่สุดเท่าที่ทำได้ และต้องรองรับ read replica ควรเลือกอะไร", choices: [
    "Amazon ElastiCache for Memcached", "Amazon ElastiCache for Redis", "Amazon CloudFront Functions", "Lambda@Edge"] },
  'k-m09-03': { prompt: "กำลังเพิ่ม Amazon ElastiCache ให้แอปพลิเคชันเพื่อให้ตอบสนองเร็วขึ้นและลดภาระของฐานข้อมูล โดย database ฝั่ง backend ของแอปพลิเคชันคือ Amazon Relational Database Service (Amazon RDS) งานใดเป็นความรับผิดชอบของ application developer", choices: [
    "ติดตั้ง software patch ให้ cache instance",
    "เขียนโค้ดตรวจสอบสุขภาพของ cluster ก่อนเขียนลง cache",
    "เขียนโค้ดที่หาข้อมูลที่ร้องขอใน cache และถ้าไม่พบก็ไปขอจากต้นทาง (origin)",
    "เขียนโค้ดเพื่อเชื่อม cache เข้ากับ Amazon RDS instance ที่มันจะอ่านข้อมูลมา"] },
  'k-m09-04': { prompt: "ข้อใดเกี่ยวกับ Amazon ElastiCache เป็นจริง", choices: [
    "node คือก้อน RAM ขนาดไม่คงที่ (variable-size) ที่ปลอดภัยและเชื่อมต่อกับเครือข่าย",
    "แอปพลิเคชันของคุณเชื่อมต่อกับ ElastiCache node โดยใช้ address เฉพาะที่เรียกว่า endpoint",
    "กับ engine แบบ Memcached ข้อมูลจะถูกแบ่งกระจายไปตาม shard ใน cluster",
    "ทุก node ใน cluster ต้องรัน cache engine ตัวเดียวกัน แต่ node อาจรันบน instance type ที่ต่างกันได้"] },
  'k-m09-05': { prompt: "developer ถูกขอให้แก้ข้อร้องเรียนของลูกค้าในพื้นที่ลอนดอนเกี่ยวกับประสิทธิภาพของเว็บแอปพลิเคชันที่โฮสต์อยู่ที่นิวยอร์ก developer อาจทำอย่างไร", choices: [
    "ใช้ Amazon CloudFront ทำสำเนาโค้ดแอปพลิเคชันไว้บน Amazon Elastic Compute Cloud (Amazon EC2) instance ใน Region ลอนดอน",
    "ตั้ง CloudFront distribution ที่ให้บริการ static content จาก edge location ที่อยู่ใกล้ผู้ใช้ในสหราชอาณาจักร",
    "ตั้ง CloudFront regional edge location ใน Region ลอนดอน",
    "ตั้ง CloudFront edge location หนึ่งแห่งในนิวยอร์กและอีกหนึ่งแห่งในลอนดอน"] },
  'k-m09-06': { prompt: "developer ถูกขอให้เพิ่ม cache hit ratio ของ Amazon CloudFront distribution ควรลองทำข้อใด", choices: [
    "ใส่ค่าใน cache key เฉพาะที่จำเป็นขั้นต่ำเท่านั้น",
    "ลดค่า maximum time to live (TTL) ใน cache policy",
    "ลดค่า max-age ใน Cache-Control header ของไฟล์",
    "เพิ่มค่า cache hit ใน cache policy"] },
  'k-m09-07': { prompt: "ข้อใดเกี่ยวกับการหมดอายุของไฟล์ที่ cache ไว้ใน Amazon CloudFront เป็นจริง", choices: [
    "ไฟล์แต่ละไฟล์ใน cache หมดอายุเองหลัง 24 ชั่วโมง และแก้ค่านี้ไม่ได้",
    "หลังไฟล์หมดอายุ ครั้งต่อไปที่ edge location ได้รับ request ของผู้ใช้สำหรับไฟล์นั้น CloudFront จะส่ง request ต่อไปยัง origin server",
    "เมื่อ origin ได้รับ request origin จะส่งไฟล์เวอร์ชันล่าสุดให้เสมอ ไม่ว่าจะเหมือนกับเวอร์ชันที่หมดอายุใน cache หรือไม่",
    "คุณควบคุมระยะเวลาที่ไฟล์อยู่ใน cache ได้ด้วยการตั้งค่า cache policy ของ CloudFront หรือ Cache-Control ใน header ของไฟล์ที่ origin แต่ใช้สองวิธีนี้ร่วมกันไม่ได้"] },
  'k-m09-08': { prompt: "use case ใดบ่งชี้ว่าควรใช้ Amazon CloudFront Functions", choices: [
    "function ที่ redirect ผู้ชมไปยัง URL อื่นและเพิ่ม custom response header",
    "function ที่ใช้ library ของบุคคลที่สาม",
    "function ที่ต้องเข้าถึงเครือข่ายเพื่อใช้บริการภายนอกในการประมวลผล",
    "function ที่ต้องเข้าถึง body ของ HTTP request"] },
  'k-m09-09': { prompt: "ข้อใดสะท้อนประโยชน์ของ lazy loading ในฐานะ caching strategy", choices: [
    "lazy loading ไม่ทำให้ cache เต็มไปด้วยข้อมูลที่ไม่มีใครร้องขอ",
    "ด้วย lazy loading ข้อมูลใน cache จะไม่มีวันเก่า (stale)",
    "ด้วย lazy loading ทุกการเขียนต้องไป 2 รอบ คือเขียนลง cache และเขียนลง database ซึ่งเพิ่ม latency ให้กระบวนการ",
    "lazy loading อาจทำให้เกิด cache churn คือ cache อาจถูกอัปเดตบ่อยถ้ามี record บางตัวถูกอัปเดตซ้ำ ๆ"] },
  'k-m09-10': { prompt: "developer ถูกถามว่า caching จะช่วยปรับปรุงประสิทธิภาพของแอปพลิเคชันประมูลออนไลน์ได้หรือไม่ ควรตอบอย่างไร", choices: [
    "caching คงไม่ช่วยให้ประสิทธิภาพดีขึ้นมากสำหรับแอปพลิเคชันประเภทนี้",
    "caching อาจช่วยให้ประสิทธิภาพดีขึ้นโดยลดจำนวนการเรียก database ฝั่ง backend แต่ caching แก้ปัญหาประสิทธิภาพที่เกิดระหว่าง client กับ web server ไม่ได้",
    "การใช้ caching หลายประเภทในแต่ละ layer ของแอปพลิเคชันอาจช่วยให้ทั้งฝั่ง frontend และ backend เร็วขึ้น",
    "caching อาจช่วยได้มากถ้าแอปพลิเคชันใช้การคำนวณหนัก (compute heavy) แต่ถ้าแอปพลิเคชันอ่านข้อมูลหนัก (read heavy) cache ก็ไม่ช่วยอะไรมาก"] },

  /* ---------- M10 SQS / SNS / Kinesis ---------- */
  'k-m10-01': { prompt: "ข้อใดอธิบายวิธีที่ message queue ประมวลผลข้อความ", choices: [
    "queue poll producer เพื่อดึงข้อความใหม่",
    "consumer poll queue เพื่อดึงข้อความ",
    "queue broadcast ข้อความไปยัง consumer",
    "consumer แจ้ง queue เมื่อประมวลผลข้อความสำเร็จ และการตั้งค่าของ queue เป็นตัวกำหนดว่าข้อความนั้นควรให้ consumer รายอื่นเห็นได้อีกหรือไม่"] },
  'k-m10-02': { prompt: "ข้อใดอธิบายวิธีทำงานของ publish/subscribe (pub/sub) messaging", choices: [
    "producer ส่งข้อความไปยัง subscriber",
    "subscriber poll topic เพื่อดึงข้อความใหม่",
    "เมื่อ topic ได้รับข้อความใหม่ topic จะส่งข้อความให้ subscriber รายแรกที่ตอบรับการแจ้งเตือน",
    "ข้อความใหม่ของ topic ถูก push ออกไปยัง subscriber ทุกราย"] },
  'k-m10-03': { prompt: "developer ต้องการเพิ่มคิว Amazon Simple Queue Service (Amazon SQS) เพื่อแยก (decouple) request คำสั่งซื้อที่เข้ามาออกจาก database ฝั่ง backend operation ของ Amazon SQS ใดอาจเป็นส่วนหนึ่งของการอัปเดตนี้", choices: [
    "ใช้ operation SendMessage โดยให้ QueueURL ชี้ไปที่ endpoint ของ database เพื่อวางข้อความลงคิว",
    "ใช้ operation ReceiveMessage โดยตั้ง MaxNumberOfMessages เป็น 5 เพื่อดึงข้อความออกจากคิวครั้งละไม่เกิน 5 ข้อความ",
    "ใช้ operation DeleteMessage เพื่อเปลี่ยน visibility ของข้อความทันทีที่ได้รับ ReceiptHandle",
    "ใช้ operation ReceiveMessage โดยตั้งพารามิเตอร์ WaitTimeSeconds เป็น 0 เพื่อลดจำนวน request ที่ว่างเปล่า"] },
  'k-m10-04': { prompt: "tester รายงานว่าข้อความของ Amazon Simple Queue Service (Amazon SQS) ถูกประมวลผลมากกว่าหนึ่งครั้ง developer พบว่า processing server ทำงานเสร็จช้ากว่าที่คาด และข้อความถูกทำให้ consumer รายอื่นเห็นได้ก่อนที่ consumer รายก่อนหน้าจะลบมัน ตัวเลือกใดอาจลดการเกิดปัญหานี้", choices: [
    "เพิ่ม visibility timeout", "เพิ่ม maxReceiveCount", "เพิ่ม MaxNumberOfMessages", "เพิ่มจำนวน producer ของคิว"] },
  'k-m10-05': { prompt: "ในแอปพลิเคชันประมวลผลคำสั่งซื้อที่ใช้คิว Amazon Simple Queue Service (Amazon SQS) developer พบว่า client เวอร์ชันเก่าสร้าง record คำสั่งซื้อที่ทำให้กระบวนการ backend ล้มเหลว ความล้มเหลวนี้ทำให้เกิด bottleneck ที่คิว developer จะลดผลกระทบของ record ที่ล้มเหลวได้อย่างไร", choices: [
    "เพิ่ม visibility timeout และตั้งค่า MaxNumberOfMessages ให้สูง",
    "เพิ่ม dead-letter queue และตั้ง maxReceiveCount ให้ต่ำ",
    "ใช้ long polling และตั้งเวลารอ (wait time) ให้สูง",
    "เปลี่ยนชนิดคิวจาก standard เป็น First-In-First-Out (FIFO) และตั้ง throughput rate ให้สูง"] },
  'k-m10-06': { prompt: "ข้อใดเกี่ยวกับตัวเลือกการ polling ของ Amazon Simple Queue Service (Amazon SQS) เป็นจริง", choices: [
    "โดย default เมื่อคุณเรียก ReceiveMessage API, Amazon SQS จะทำ long polling",
    "เมื่อตั้งค่า long polling, WaitTimeSeconds จะถูกตั้งเป็น 0",
    "เมื่อตั้งค่า short polling, Amazon SQS จะ query server ของตนทั้งหมด",
    "เมื่อตั้งค่า short polling, Amazon SQS จะสุ่มตัวอย่างจาก server ของตนเพียงบางส่วน"] },
  'k-m10-07': { prompt: "ข้อใดเกี่ยวกับ Amazon Simple Notification Service (Amazon SNS) เป็นจริง", choices: [
    "SNS topic คือจุดเข้าถึงเชิงตรรกะ (logical access point) ที่ทำหน้าที่เป็นช่องทางการสื่อสาร",
    "publisher ส่งข้อความได้เฉพาะไปยัง topic ที่ตนเองสร้างขึ้น",
    "โดย default subscriber แต่ละรายของ topic จะได้รับข้อความที่ต่างกัน",
    "Amazon SNS กำหนด delivery policy เพียงอันเดียวที่ใช้กับทุก delivery protocol"] },
  'k-m10-08': { prompt: "topic ของ Amazon Simple Notification Service (Amazon SNS) รับข้อความเกี่ยวกับคำสั่งซื้อ และมี AWS Lambda function ที่ประมวลผลคำสั่งซื้อที่ถูกยกเลิก subscribe topic นี้อยู่ developer จะลดต้นทุนโดยเรียก Lambda function เฉพาะกับคำสั่งซื้อที่ถูกยกเลิกได้อย่างไร", choices: [
    "วางคิว Amazon Simple Queue Service (Amazon SQS) ไว้หน้า Lambda function",
    "แยกข้อความคำสั่งซื้อใหม่กับข้อความยกเลิกคำสั่งซื้อให้ส่งโดย publisher สองตัวที่ต่างกัน",
    "ตั้ง filter policy เพื่อให้ subscription ของ Lambda function ได้รับเฉพาะข้อความยกเลิกคำสั่งซื้อ",
    "ใช้ operation ConfirmSubscription เพื่อจำกัดว่า Lambda function จะได้รับข้อความใด"] },
  'k-m10-09': { prompt: "developer ต้องสร้างแอปพลิเคชันแบบกำหนดเองเพื่อวาง log record ของแอปพลิเคชันลูกค้าลงใน Amazon Kinesis data stream ควรใช้อะไรสร้างแอปพลิเคชัน", choices: [
    "ใช้ Kinesis API", "ใช้ Kinesis Producer Library (KPL)", "ใช้ Kinesis Client Library (KCL)", "ใช้ Amazon Managed Service for Apache Flink"] },
  'k-m10-10': { prompt: "ข้อใดเกี่ยวกับ Amazon Kinesis Data Streams เป็นจริง", choices: [
    "เมื่อ record ถูกเพิ่มลงใน stream record จะอยู่ให้ใช้ได้จนกว่า consumer จะลบมัน",
    "data record ใน data stream ถูกกระจายไปตาม shard",
    "standard data stream มี consumer ได้หนึ่งราย ส่วนตัวเลือก enhanced fan-out ทำให้เพิ่ม consumer ได้หลายราย",
    "stream consumer ต้องลบ record ที่ประมวลผลสำเร็จแล้ว"] },

  /* ---------- M11 Step Functions ---------- */
  'k-m11-01': { prompt: "สถานการณ์ใดบ่งชี้ว่าต้องใช้ task coordination service เช่น AWS Step Functions", choices: [
    "เว็บไซต์ที่ให้บริการ static content กำลังขยายไปสู่ผู้ชมทั่วโลก",
    "แอปพลิเคชัน serverless ต้องรัน AWS Lambda function หลายตัวต่อเนื่องกันโดยแต่ละตัวพึ่งพากัน",
    "แอปพลิเคชัน monolithic ที่เขียนด้วย Java กำลังปรับ technology stack",
    "แอปพลิเคชันรายงานต้องปรับตรรกะการคำนวณเพื่อให้ข้อมูลเชิงวิเคราะห์แก่ผู้ใช้ฝ่ายธุรกิจมากขึ้น"] },
  'k-m11-02': { prompt: "ข้อใดอธิบายประโยชน์ของการใช้ AWS Step Functions กับแอปพลิเคชัน", choices: [
    "Step Functions ทำงานร่วมกับ state machine เพื่อให้ developer สลับไปมาระหว่าง workflow ของ Step Functions กับ workflow ของ state machine ได้",
    "Step Functions ตั้งค่าร่วมกับ Amazon EC2 Auto Scaling เพื่อ scale ขึ้นลงได้",
    "Step Functions กำหนดได้โดยใช้ Python หรือ Node.js อย่างใดอย่างหนึ่ง",
    "developer ใช้ Step Functions สร้าง workflow แบบภาพ (visual workflow) ได้"] },
  'k-m11-03': { prompt: "state type แบบ Task ใน AWS Step Functions มีบทบาทอะไร", choices: [
    "Task state ใช้หยุด workflow ที่ล้มเหลว",
    "Task state ทำงานหนึ่งหน่วย (unit of work)",
    "Task state ให้ตรรกะการแตกสาขา (branching)",
    "Task state บอก state machine ว่าต้องทำขั้นตอนตามลำดับใด"] },
  'k-m11-04': { prompt: "แอปพลิเคชันที่ประมวลผลการคืนสินค้าต้องทำขั้นตอนต่างกันขึ้นอยู่กับว่าการคืนสินค้าอยู่ภายใน 30 วันหลังซื้อหรือไม่ developer ใช้ state ใดของ AWS Step Functions ทำตรรกะนี้ได้", choices: [
    "Parallel", "Task", "Choice", "Wait"] },
  'k-m11-05': { prompt: "แอปพลิเคชันที่ประมวลผลการคืนสินค้าต้องรัน AWS Lambda function ตัวเดียวกันสำหรับสินค้าแต่ละชิ้นในคำสั่งซื้อ developer ใช้ state ใดของ AWS Step Functions ทำตรรกะนี้ได้", choices: [
    "Parallel", "Pass", "Map", "Task"] },
  'k-m11-06': { prompt: "ข้อใดเป็นจริงทั้งสำหรับ Succeed state และ Fail state", choices: [
    "Succeed state และ Fail state ไม่มี field Next",
    "ไม่จำเป็นต้องมี field End เพราะ Succeed state และ Fail state ไม่ใช่ terminal state",
    "field Type เป็นทางเลือกสำหรับ Succeed state และ Fail state",
    "ต้องมี field End เพราะ Succeed state และ Fail state เป็น terminal state"] },
  'k-m11-07': { prompt: "แอปพลิเคชันที่ประมวลผลการคืนสินค้าต้องรัน audit check อิสระสองอย่าง เมื่อทั้งสองอย่างเสร็จสมบูรณ์ ก็จะรันขั้นตอนอนุมัติการคืนสินค้า developer ใช้ state ใดของ AWS Step Functions ทำตรรกะนี้ได้", choices: [
    "Parallel", "Task", "Choice", "Wait"] },
  'k-m11-08': { prompt: "taskToken ถูกใช้อย่างไรใน use case ของ AWS Step Functions ที่มีขั้นตอนอนุมัติด้วยคน (manual approval)", choices: [
    "taskToken ถูกสร้างเมื่อ workflow เข้าสู่ Wait state และใช้ติดตามว่า workflow รอให้ task เสร็จมานานเท่าไร",
    "taskToken ใช้เปลี่ยนผ่านระหว่างแต่ละ state ใน workflow และกำหนดไว้ใน field Next",
    "taskToken ถูกส่งกลับมาเป็นส่วนหนึ่งของการเรียก action GetActivityTask และใช้ตอนเรียก action SendTaskSuccess เพื่อผูกผลลัพธ์เข้ากับ task",
    "taskToken เป็น output ของ Success state ใน Step Functions Express workflow แบบ synchronous และใช้ยืนยันว่าทุก task สำเร็จ"] },
  'k-m11-09': { prompt: "use case ใดเหมาะกับ AWS Step Functions Express workflow", choices: [
    "ทุก workflow ในแอปพลิเคชันต้องตรวจสอบย้อนหลัง (audit) ได้นานถึง 90 วันหลังรันจบ",
    "workflow ต้องมีขั้นตอนที่รันแอปพลิเคชันซึ่งโฮสต์อยู่บน Amazon Elastic Compute Cloud (Amazon EC2) instance",
    "workflow ใช้เวลารันระหว่าง 30 นาทีถึง 1 ชั่วโมง",
    "workflow ต้องรองรับอัตรา event ที่สูงมากซึ่งมาจากอุปกรณ์ Internet of Things (IoT)"] },
  'k-m11-10': { prompt: "ข้อใดเกี่ยวกับ AWS Step Functions เป็นจริง", choices: [
    "developer ใช้ Amazon API Gateway เพื่อผูก Step Functions API เข้ากับ method ใน API Gateway API ได้",
    "Step Functions มี quota ระดับ account เกี่ยวกับจำนวน state machine ที่ลงทะเบียนไว้ แต่ไม่มี quota ที่เกี่ยวกับการรัน Step Functions แต่ละครั้ง",
    "Step Functions ต้องสร้างใน visual editor บน Step Functions console แต่แก้ไขได้ด้วย AWS SDK",
    "developer ใช้ action Describe API เพื่อดูสรุป state machine ทั้งหมดและจำนวนครั้งที่แต่ละตัวถูกรันได้"] },

  /* ---------- M12 Security / Cognito ---------- */
  'k-m12-01': { prompt: "ข้อใดเกี่ยวกับการสร้างการเชื่อมต่อที่ปลอดภัยเป็นจริง", choices: [
    "ทั้ง Secure Sockets Layer (SSL) และ Transport Layer Security (TLS) เป็นมาตรฐานที่ AWS พัฒนาขึ้นสำหรับการสื่อสารที่ปลอดภัย",
    "SSL ใช้ certificate เพื่อยืนยันตัวตนของเว็บไซต์ แต่ TLS ไม่ใช้",
    "ทั้ง SSL และ TLS เข้ารหัสการสื่อสารผ่านเครือข่ายระหว่าง resource ที่เชื่อมต่อกัน",
    "SSL เป็นเวอร์ชันที่ใหม่กว่า TLS และทั้งสองใช้ยืนยันตัวตนของเว็บไซต์"] },
  'k-m12-02': { prompt: "ขั้นตอนใดในกระบวนการเชื่อมต่อที่ปลอดภัยเป็นหน้าที่ของ certificate authority (CA)", choices: [
    "ออก (issue) certificate",
    "ตรวจสอบว่า certificate มาจากแหล่งที่เชื่อถือได้หรือไม่",
    "ส่ง session key ที่เข้ารหัสแล้ว",
    "ส่ง certificate และ public key ไปยัง client"] },
  'k-m12-03': { prompt: "ข้อใดเกี่ยวกับ AWS Certificate Manager (ACM) เป็นจริง", choices: [
    "ACM จัดหา public certificate ให้ได้ แต่สำหรับ private certificate developer ต้องสร้าง certificate เองแล้วนำมาเชื่อมกับ ACM",
    "ACM จัดการการต่ออายุ certificate ทั้งแบบ public และ private",
    "ค่าใช้จ่ายของ ACM คิดตามจำนวน public certificate ที่ใช้งานอยู่ใน AWS account",
    "developer ต้องตั้งค่า load balancer ให้ใช้ certificate ของ ACM"] },
  'k-m12-04': { prompt: "ข้อใดสะท้อน best practice สำหรับ security credential", choices: [
    "แชร์ access key เฉพาะระหว่างผู้ใช้ใน AWS account เดียวกัน",
    "ใช้ AWS Identity and Access Management (IAM) role เพื่อขอ temporary security credential",
    "ถ้ามี access key ที่ไม่ได้เข้ารหัสอยู่ ให้ฝังไว้ในโค้ดที่เข้าถึงได้เฉพาะ developer แต่ผู้ใช้เข้าถึงไม่ได้",
    "ไม่อนุญาตให้ยืนยันตัวตนแบบ programmatic ไปยังบริการ AWS"] },
  'k-m12-05': { prompt: "ความแตกต่างหลักระหว่างการยืนยันตัวตนของ AWS Security Token Service (AWS STS) โดย federated user กับโดย AWS Identity and Access Management (IAM) user คืออะไร", choices: [
    "กับ federated user แอปพลิเคชันเรียก identity broker แต่ขั้นตอนนี้ถูกข้ามสำหรับ IAM user",
    "กับ federated user การยืนยันตัวตนครั้งแรกทำกับ IdP ส่วนกับ IAM user การยืนยันตัวตนครั้งแรกทำกับ IAM",
    "กับ federated user การยืนยันตัวตนครั้งที่สองทำกับ IdP ส่วนกับ IAM user การยืนยันตัวตนครั้งที่สองทำกับ IAM",
    "กับ federated user แอปพลิเคชันใช้ temporary security credential และ token เพื่อส่ง request ไปยังบริการ AWS ส่วน IAM user ไม่ต้องใช้ token"] },
  'k-m12-06': { prompt: "developer ถูกขอให้สืบสวนว่าไฟล์เว็บไซต์ถูกลบออกจาก bucket ของ Amazon Simple Storage Service (Amazon S3) ได้อย่างไร ควรทำอย่างไร", choices: [
    "ใช้ AWS CloudTrail ค้นหาข้อมูลเกี่ยวกับ event การลบ object บน S3 bucket",
    "ใช้ AWS Security Token Service (AWS STS) เพื่อบล็อกการลบจาก S3 bucket",
    "ใช้ AWS Identity and Access Management (IAM) ค้นหาผู้ใช้ที่ใช้สิทธิ์ลบบน S3 bucket",
    "ใช้การเรียก API GetSessionToken ของ AWS STS เพื่อดึงข้อมูลผู้ใช้ที่ลบไฟล์จาก S3 bucket"] },
  'k-m12-07': { prompt: "developer ถูกขอให้เพิ่มบริการ sign-up และ sign-in ให้แอปพลิเคชัน ควรใช้ฟีเจอร์ Amazon Cognito ใด", choices: [
    "Amazon Cognito identity pool", "Amazon Cognito user pool", "Amazon Cognito Lambda trigger", "Amazon Cognito access token"] },
  'k-m12-08': { prompt: "developer ถูกขอให้ลดความเสี่ยงด้านความปลอดภัยของผู้ใช้ที่ sign in ด้วยคู่ username และ password ที่ใช้ซ้ำกับเว็บไซต์อื่น developer ควรตั้งค่าฟีเจอร์ใดของ Amazon Cognito user pool", choices: [
    "Identity tokens", "Phone and email verification", "Adaptive authentication", "Compromised credentials check"] },
  'k-m12-09': { prompt: "ข้อใดเกี่ยวกับ Amazon Cognito identity pool เป็นจริง", choices: [
    "ด้วย identity pool ผู้ใช้ขอ AWS credential ชั่วคราวที่มีสิทธิ์จำกัดเพื่อเข้าถึงบริการ AWS อื่นได้",
    "identity pool ทำให้ไม่ต้องใช้ identity provider ของบุคคลที่สามอีกต่อไป",
    "เมื่อใช้ Amazon Cognito identity pool ผู้ใช้จะไม่ใช้ Amazon Cognito user pool ร่วมด้วย",
    "identity pool ให้ฟังก์ชัน sign-up และ sign-in สำหรับแอปมือถือ"] },
  'k-m12-10': { prompt: "developer วางแผนใช้ Amazon Cognito user pool ร่วมกับ Amazon API Gateway ขั้นตอนใดเป็นส่วนหนึ่งของ authentication flow ของ user pool กับ API Gateway", choices: [
    "แอปมือถือส่ง request ไปยัง API Gateway และ API Gateway ไปขอ JSON Web Token (JWT) จาก user pool",
    "ผู้ใช้แอปมือถือยืนยันตัวตนกับ user pool และ user pool ส่ง JWT กลับมาให้แอป",
    "user pool ตรวจสอบ token กับ identity pool",
    "Amazon Cognito เรียก API หลังจากตรวจสอบสิทธิ์สำเร็จ"] },

  /* ---------- M13 CI/CD ---------- */
  'k-m13-01': { prompt: "ข้อใดอธิบายปรัชญาของ DevOps", choices: [
    "DevOps คือการสอนทีมพัฒนาและทีมปฏิบัติการให้ใช้ชุดเครื่องมือเดียวกันเพื่อย่นรอบการทดสอบและ deploy",
    "DevOps คือการขจัดกำแพงระหว่างงานพัฒนากับงานปฏิบัติการ เพื่อเพิ่มประสิทธิภาพการทำงานและความน่าเชื่อถือ",
    "วัฒนธรรม DevOps สะท้อนอยู่ในแนวคิด “Processes over people” ซึ่งหมายความว่าถ้ามีกระบวนการที่แข็งแรง สมาชิกทีมคนไหนก็ทำงานใดก็ได้",
    "วัฒนธรรม DevOps สะท้อนอยู่ในแนวคิดที่ว่า tight coupling นำไปสู่ความเหมือนกัน (parity) ที่มากขึ้นระหว่างสภาพแวดล้อม development, test และ production"] },
  'k-m13-02': { prompt: "แนวปฏิบัติ DevOps สะท้อนอยู่ใน software development lifecycle สำหรับสถาปัตยกรรมคลาวด์อย่างไร", choices: [
    "ทุกเฟสของ software development lifecycle ถูกทำให้อัตโนมัติ",
    "developer ใช้ continuous integration เพื่อ merge โค้ดเข้า repository ในเครื่องตนเองและเชื่อมต่อกับสภาพแวดล้อมทดสอบเพื่อทดสอบในสถานการณ์จริงได้",
    "ด้วย continuous delivery developer deploy โค้ดได้โดยไม่ต้องมี continuous monitoring",
    "เครื่องมือด้านโครงสร้างพื้นฐานเปรียบเทียบสภาพแวดล้อมพัฒนาในเครื่องกับสภาพแวดล้อมทดสอบและ staging แล้วรายงานความแตกต่าง เพื่อให้ทีมปฏิบัติการดูแลให้เหมือนกันได้"] },
  'k-m13-03': { prompt: "developer อาจใช้ AWS CodePipeline ในกระบวนการ continuous integration และ continuous deployment (CI/CD) อย่างไร", choices: [
    "คอมไพล์ซอร์สโค้ด รันการทดสอบ และสร้างซอฟต์แวร์แพ็กเกจที่พร้อม deploy",
    "โฮสต์ repository แบบ Git และให้ source control",
    "deploy ไปยัง compute service ได้หลายแบบ",
    "ทำขั้นตอนที่ต้องใช้ในการ release ซอฟต์แวร์ให้อัตโนมัติ ตาม release model ที่ developer กำหนดเอง"] },
  'k-m13-04': { prompt: "ข้อใดเกี่ยวกับ continuous integration และ continuous delivery/deployment (CI/CD) เป็นจริง", choices: [
    "continuous deployment ลดความเสี่ยงของ bug บน production แต่อาจทำให้ส่งมอบฟีเจอร์ใหม่ช้าลง",
    "continuous integration ต้องการให้ทีมเขียน automated test",
    "continuous delivery ครอบคลุมไปจนถึง production deployment โดยไม่ต้องมีคนเข้ามาเกี่ยวข้อง",
    "continuous deployment ครอบคลุมตั้งแต่ check-in ไปจนถึง production แต่ยังมีการแทรกแซงด้วยคนบางส่วนหลังจาก check-in โค้ดและก่อนปล่อยโค้ดให้ลูกค้า"] },
  'k-m13-05': { prompt: "developer ต้องการใช้ infrastructure as code กับเว็บแอปพลิเคชันที่เขียนด้วย Java บน AWS งานใดอาจเป็นส่วนหนึ่งของงานนี้", choices: [
    "สร้าง Amazon Elastic Compute Cloud (Amazon EC2) instance โดยใช้ AWS CodeBuild และใช้ AWS CodeDeploy push แอปพลิเคชันไปยัง EC2 instance โดยอัตโนมัติ",
    "สร้าง AWS CloudFormation template แบบ Java ที่กำหนด layer ของแอปพลิเคชันและ database ของแอปพลิเคชัน",
    "สร้าง AWS CloudFormation template ที่มี section Resources เพื่อกำหนด AWS resource ของแอปพลิเคชัน",
    "ใช้ AWS CodePipeline สร้าง pipeline ที่ทำให้การ release แอปพลิเคชันทั้งหมดเป็นอัตโนมัติ"] },
  'k-m13-06': { prompt: "developer ต้องการใช้ AWS CloudFormation template ตัวเดียวสำหรับทั้งสภาพแวดล้อมทดสอบและ production ควรใช้ section ใดของ template เพื่อรองรับแนวทางนี้", choices: [
    "ใช้ section Transform เพื่อกำหนดตัวแปรที่ต้องเปลี่ยนในแต่ละสภาพแวดล้อมระหว่างการสร้างหรืออัปเดต stack",
    "ใช้ section Format Version เพื่อกำหนดพารามิเตอร์ที่ต้องส่งให้แต่ละสภาพแวดล้อมระหว่างการสร้างหรืออัปเดต stack",
    "ใช้ section Outputs เพื่อกำหนดแต่ละสภาพแวดล้อมที่ template ควรสร้างระหว่างการสร้างหรืออัปเดต stack",
    "ใช้ section Conditions เพื่อควบคุมว่า resource บางตัวจะถูกสร้างหรือไม่ระหว่างการสร้างหรืออัปเดต stack"] },
  'k-m13-07': { prompt: "ข้อใดเกี่ยวกับ AWS CloudFormation stack เป็นจริง", choices: [
    "การลบ stack จะลบ CloudFormation template ของมัน แต่ไม่ลบ resource ที่ deployment ล่าสุดสร้างไว้",
    "CloudFormation stack คือหน่วยของการ deploy (unit of deployment)",
    "ต้องลบ stack ที่มีอยู่ก่อนจึงจะ deploy template ที่อัปเดตเพื่อแก้พารามิเตอร์ของ resource ใน stack นั้นได้",
    "CloudFormation มี quota บางอย่างที่เกี่ยวกับ resource ที่กำหนดในแต่ละ stack แต่ไม่มี quota ที่เกี่ยวกับจำนวน stack เอง"] },
  'k-m13-08': { prompt: "developer กำลังสร้างแอปพลิเคชัน serverless ตัวแรกบน AWS พวกเขาต้องคิดต่างออกไปอย่างไรเกี่ยวกับการ deploy แอปพลิเคชัน", choices: [
    "จำลองสภาพแวดล้อม production ในเครื่องแบบเดียวกับที่ทำได้กับการ deploy บน server ไม่ได้",
    "ใช้ AWS CloudFormation เป็น infrastructure as code เพื่อ deploy แอปพลิเคชันไม่ได้",
    "ขั้นตอนการเชื่อมต่อกับ AWS Lambda server เพื่อ debug ต่างจากขั้นตอนเชื่อมต่อกับ server แบบดั้งเดิม",
    "เครื่องมือพัฒนา serverless ไม่ได้ทำงานร่วมกับเครื่องมือพัฒนาอื่นของ AWS ที่ใช้ใน deployment pipeline"] },
  'k-m13-09': { prompt: "AWS Serverless Application Model (AWS SAM) template ต่างจาก AWS CloudFormation template อย่างไร", choices: [
    "AWS SAM template เขียนด้วยภาษาเดียวกับ AWS Lambda runtime ที่ใช้ใน function ที่กำลัง deploy",
    "section Globals พบได้เฉพาะใน AWS SAM template เท่านั้น",
    "section Resources ใน AWS SAM template ใส่ได้เฉพาะ serverless resource",
    "AWS SAM template ไม่จำเป็นต้องมี Transform declaration"] },
  'k-m13-10': { prompt: "บรรทัดต่อไปนี้อยู่ใน section Resources ของ AWS Serverless Application Model (AWS SAM) template บรรทัดเหล่านี้จะสร้างอะไร", choices: [
    "AWS Lambda function ชื่อ Orders ที่เชื่อมต่อกับตาราง Amazon DynamoDB",
    "ตาราง Amazon DynamoDB ที่ชื่อ Orders",
    "API GET method ที่อ่านจากตาราง Orders",
    "ตาราง MySQL ที่ชื่อ Orders"] }
});
