/* คำแปลภาษาไทยของโจทย์ Knowledge Check (เขียนมือ) — ต้นฉบับอังกฤษอยู่ใน data/kc.js ที่สร้างจากสคริปต์
   ตัวเลือกเรียงตามลำดับเดิมของต้นฉบับ (A, B, C, …) ห้ามสลับลำดับ */
GUIDE.registerKCth({
  /* ---------- M07 Lambda ---------- */
  'k-m07-01': { prompt: "ข้อไหนบอกลักษณะของ AWS Lambda ได้ถูกต้อง", choices: [
    "Lambda รันโค้ดก็ต่อเมื่อมี event มากระตุ้น และใช้ compute เท่าที่จำเป็นเท่านั้น",
    "การตั้งค่า high availability ให้ Lambda ทำคล้ายกับที่ทำกับ Amazon Elastic Compute Cloud (Amazon EC2)",
    "Lambda function รันใน environment ชั่วคราวที่สร้างตามต้องการ และ developer เป็นคนกำหนดว่าจะสร้างหรือปิด environment ใหม่เมื่อไร",
    "developer ต้องเขียน Lambda function ด้วยหนึ่งใน runtime ที่บริการ Lambda มีให้เท่านั้น"] },
  'k-m07-02': { prompt: "ข้อจำกัด (constraint) ข้อไหนแก้ไขไม่ได้", choices: [
    "Function timeout", "Reserved concurrency", "Burst quota", "Regional quota"] },
  'k-m07-03': { prompt: "Amazon API Gateway เรียก AWS Lambda ด้วยวิธีไหน", choices: [
    "API Gateway เรียก function โดยตรงแบบ synchronous invocation",
    "Lambda ประมวลผล request จาก API Gateway แบบ asynchronous และ retry แต่ละ request สูงสุด 2 ครั้ง",
    "Lambda ใช้ event source mapping คอย poll request จาก API Gateway",
    "API Gateway เรียก function โดยตรง และ retry request ไปเรื่อย ๆ จนกว่าจะสำเร็จหรือหมดอายุ"] },
  'k-m07-04': { prompt: "การกระทำไหนต้องใช้สิทธิ์ที่กำหนดไว้ใน AWS Lambda execution role (เลือก 2 ข้อ)", choices: [
    "Lambda function เขียนข้อมูลลง Amazon DynamoDB table",
    "object ที่ถูกเขียนลง Amazon Simple Storage Service (Amazon S3) bucket กระตุ้นให้ Lambda function ทำงาน",
    "Lambda poll ข้อความจาก Amazon Simple Queue Service (Amazon SQS) queue เพื่อกระตุ้นให้ Lambda function ทำงาน",
    "GET route ของ Amazon API Gateway กระตุ้นให้ Lambda function ทำงาน",
    "ข้อความที่ถูกโพสต์ลง Amazon Simple Notification Service (Amazon SNS) topic กระตุ้นให้ Lambda function ทำงาน"] },
  'k-m07-05': { prompt: "ข้อไหนจริงเกี่ยวกับ function handler ใน AWS Lambda function", choices: [
    "function handler คือจุดเริ่มต้นที่ Lambda เรียกเพื่อเริ่มรัน Lambda function",
    "method ของ function handler อาจรับ event object หรือ context object",
    "event object บอกข้อมูลของ event ที่เรียก Lambda function และต้องเป็น object ที่กำหนดไว้ล่วงหน้าซึ่งบริการ AWS สร้างขึ้น",
    "context object บอกข้อมูลของ runtime และ developer ต้องสร้าง context object ให้ตรงกับ runtime ที่เลือกไว้กับ function"] },
  'k-m07-06': { prompt: "ปัญหาไหนที่แก้ได้ด้วยการเพิ่ม provisioned concurrency ให้ AWS Lambda function", choices: [
    "มี Lambda function อีกตัวใน account และ Region เดียวกัน บางครั้งมันพุ่งสูงจนใช้ concurrency ที่เหลือหมด ทำให้ function ของเราล้มเหลว",
    "แอปที่ใช้ Lambda function ตอบสนองช้าสำหรับผู้ใช้ไม่กี่คนแรกที่ล็อกอินในแต่ละวัน และ Lambda metrics แสดง latency ที่สูงกว่าปกติใน request แรก ๆ เหล่านั้น",
    "ระบบ backend แบบ legacy ล้มเหลวเป็นพัก ๆ เวลา developer เชื่อมต่อ และ developer อยากลดเวลาที่ function รอเมื่อ backend ล้ม เพื่อไม่ให้เสียค่าใช้จ่ายเพิ่ม",
    "developer อยากเห็นรายละเอียดของ transaction ที่ใช้ Lambda function มากขึ้น เพื่อหา bottleneck"] },
  'k-m07-07': { prompt: "ถ้าตั้ง Amazon Simple Notification Service (Amazon SNS) topic เป็น event source ของ Lambda function developer ใช้ค่า configuration ของ AWS Lambda ตัวไหนจัดการ error ของ function ได้บ้าง (เลือก 2 ข้อ)", choices: [
    "State machines", "File systems", "Destinations", "Virtual private cloud", "Asynchronous invocations"] },
  'k-m07-08': { prompt: "deployment package แบบ zip ที่มีโค้ดและ custom library ขนาด 75 MB ควรใช้วิธี deploy Lambda แบบไหน", choices: [
    "คัดลอกโค้ดไปวางใน editor บน Lambda console เพื่อสร้างและ deploy function",
    "อัปโหลดไฟล์ .zip จาก integrated development environment (IDE) เข้า Lambda console โดยตรง",
    "อัปโหลด deployment package ไปที่ Amazon Simple Storage Service (Amazon S3) bucket แล้วระบุชื่อ bucket และ object key ใน Lambda console",
    "อัปโหลด deployment package ไปที่ Amazon Elastic Block Store (Amazon EBS) volume แล้วใช้ค่า File Systems อ้างอิงถึง"] },
  'k-m07-09': { prompt: "Amazon Resource Name (ARN) ของ function เป็นดังนี้: `arn:aws:lambda:aws-region:acct-id:function:helloworld:PROD`", choices: [
    "ARN นี้จะเรียก version PROD ของ function ซึ่งเป็น immutable",
    "ARN นี้จะเรียก version ของ function ที่ alias PROD ชี้อยู่ ณ ตอนนั้น",
    "ARN นี้จะเรียก function พร้อมใช้ AWS Lambda layer ที่ชื่อ PROD",
    "ARN นี้จะ deploy function helloworld ไปยัง account PROD"] },
  'k-m07-10': { prompt: "ผู้ใช้แอป serverless แจ้งว่าเจอ error ตอนดึงข้อมูล order สมมติว่าเปิด AWS X-Ray ไว้แล้ว developer ควรทำอะไรเป็นอย่างแรกใน X-Ray เพื่อเริ่มหาสาเหตุให้ได้เร็ว", choices: [
    "เจาะดู trace ล่าสุดเพื่อหา error",
    "ค้นหา metadata ที่เกี่ยวกับผู้ใช้ที่แจ้งปัญหา",
    "เพิ่ม annotation ไว้ใช้จัดกลุ่มและกรอง trace",
    "ใช้ service map เพื่อดู error ทั่วทั้งแอปจากภาพ"] },

  /* ---------- M08 Containers ---------- */
  'k-m08-01': { prompt: "ข้อไหนคือประโยชน์ที่ทำให้อุตสาหกรรมขนส่งและอุตสาหกรรมซอฟต์แวร์หันมาใช้ container", choices: [
    "ผู้ให้บริการ infrastructure สร้างความผูกพันที่แน่นแฟ้นระหว่างแพลตฟอร์มของตนกับ container ชนิดที่เลือกใช้ได้",
    "การซ่อนรายละเอียดของสิ่งที่ \"ขนส่ง\" ช่วยให้ระบบคล่องตัว (agility) ขึ้น",
    "การเห็นรายละเอียดของสิ่งที่ \"ขนส่ง\" มากขึ้น ช่วยให้แต่ละจุดในระบบให้การสนับสนุนได้เหมาะสม",
    "การใช้ container ที่ไม่เป็นมาตรฐานได้ ทำให้ผู้ผลิตมีความยืดหยุ่น"] },
  'k-m08-02': { prompt: "ข้อไหนเป็นส่วนประกอบของ container (เลือก 2 ข้อ)", choices: [
    "Host server", "Runtime engine", "Operating system", "Application code", "Virtual machine"] },
  'k-m08-03': { prompt: "ข้อไหนจริงเกี่ยวกับ Docker container", choices: [
    "container คือ instance ที่รันได้ของ image",
    "container registry คือ template สำหรับเปิด container",
    "container image คือ template ที่เขียนได้",
    "container layer คือ layer บาง ๆ แบบ read-only ที่ผูกกับ container ที่กำลังรัน"] },
  'k-m08-04': { prompt: "คำสั่ง Docker CLI ไหนสร้าง container ชื่อ my_app_1 จาก image ชื่อ node_app", choices: [
    "`docker run --name my_app_1 node_app`",
    "`docker build --tag my_app_1`",
    "`docker exec -it my_app_1 sh`",
    "`docker images my_app_1 from node_app`"] },
  'k-m08-05': { prompt: "ข้อไหนจริงเกี่ยวกับ Dockerfile", choices: [
    "Dockerfile คือไฟล์ YAML ที่เก็บคำสั่งสำหรับสร้าง container image",
    "แต่ละคำสั่งใน Dockerfile สร้าง layer แบบ read-only ใน image",
    "ถ้า developer แก้ Dockerfile แล้ว build image ใหม่ ทุก layer ของ image ต้องถูก build ใหม่หมด",
    "developer ใช้ Dockerfile สั่งรันสคริปต์หลังจาก container ถูกสร้างขึ้นมาแล้วไม่ได้"] },
  'k-m08-06': { prompt: "developer อยากย้ายเว็บ shopping แบบ monolithic ไปเป็นแอปแบบ microservice ข้อไหนเป็นเหตุผลที่ควรเลือกใช้ container", choices: [
    "แต่ละ container ใช้ภาษาและเทคโนโลยีที่เหมาะกับ service นั้นที่สุดได้",
    "component ที่อยู่ใน container ไม่ได้แยกขาดจากกัน แอปจึงพัฒนาต่อไปเป็นระบบเดียว",
    "container เหมาะกับการออกแบบที่หลีกเลี่ยงการใช้ทรัพยากรชั่วคราว",
    "container แยก dependency และ library ออกเป็น object ของตัวเอง"] },
  'k-m08-07': { prompt: "developer เพิ่งสร้างแอป proof-of-concept ด้วย container และเจ้าของธุรกิจอยากนำขึ้น production ข้อไหนเป็นเหตุผลหลักที่ developer อาจใช้ container orchestration service", choices: [
    "เพื่อจัดตารางการเริ่มและหยุด container และตัดสินใจว่าจะวาง container ไว้ที่ไหน",
    "เพื่อสร้าง container จาก image ของบุคคลที่สาม",
    "เพื่อไม่ต้องใช้ container registry",
    "เพื่อรับคำแนะนำอัตโนมัติว่าจะปรับโค้ดแอปให้รันบน container ได้ดีขึ้นอย่างไร"] },
  'k-m08-08': { prompt: "ข้อไหนจริงเกี่ยวกับ Amazon Elastic Container Service (Amazon ECS)", choices: [
    "Amazon ECS คือ container orchestration service ที่ scale ได้สูงและรองรับ Docker container",
    "Amazon ECS บังคับให้ใช้ Amazon Elastic Container Registry (Amazon ECR) เก็บ container image",
    "Amazon ECS รองรับการเปิด container บน Amazon EC2 หรือ AWS Lambda",
    "ด้วย Amazon ECS คุณ deploy แอปลง container ได้ แม้แอปนั้นจะไม่ได้ออกแบบมาให้รันบน container โดยเฉพาะ"] },
  'k-m08-09': { prompt: "AWS Elastic Beanstalk เรียกกลุ่มของ component ที่รวมกันอย่างมีเหตุผล ซึ่งเปรียบได้กับโฟลเดอร์ ว่าอะไร", choices: [
    "Environment", "Platform", "Application", "Environment tier"] },
  'k-m08-10': { prompt: "developer อยากทำ canary testing กับ deployment ใหม่ ควรเลือก deployment policy ของ AWS Elastic Beanstalk แบบไหน", choices: [
    "Immutable", "Rolling with batch", "Traffic Splitting", "Blue/Green"] },

  /* ---------- M09 Caching ---------- */
  'k-m09-01': { prompt: "สถาปนิกแนะนำให้ developer เพิ่ม caching ให้แอปที่มีอยู่แล้วเพื่อแก้ปัญหาด้าน performance ตอนตัดสินใจว่าจะใส่ caching ตรงไหน developer ควรพิจารณาอะไร", choices: [
    "ไม่ต้อง cache ข้อมูลที่ query ช้าและแพง",
    "ดูข้อมูลและรูปแบบการเข้าถึงข้อมูล ข้อมูลที่เปลี่ยนเร็วแต่ถูกเรียกใช้น้อยควรเอาไป cache",
    "ดูว่าในแต่ละจุดที่ใช้ข้อมูล รับข้อมูลเก่า (stale) ได้แค่ไหน",
    "ใส่ caching ให้มากที่สุดในหลายจุดที่สุด และใส่ตั้งแต่ช่วงแรกของการพัฒนา"] },
  'k-m09-02': { prompt: "developer ประเมินแล้วว่า in-memory key-value store จะช่วยให้ query ของแอปเร็วขึ้น เขาอยากให้ solution ง่ายที่สุดเท่าที่ทำได้ และต้องรองรับ read replica ควรเลือกอะไร", choices: [
    "Amazon ElastiCache for Memcached",
    "Amazon ElastiCache for Redis",
    "Amazon CloudFront Functions",
    "Lambda@Edge"] },
  'k-m09-03': { prompt: "ทีมกำลังเพิ่ม Amazon ElastiCache ให้แอปเพื่อให้ตอบสนองเร็วขึ้นและลดภาระของฐานข้อมูล โดยแอปใช้ฐานข้อมูล Amazon Relational Database Service (Amazon RDS) เป็น backend งานข้อใดเป็นหน้าที่ของ application developer", choices: [
    "ติดตั้ง software patch ให้ cache instance",
    "เขียนโค้ดตรวจสอบสถานะ (health) ของ cluster ก่อนเขียนข้อมูลลง cache",
    "เขียนโค้ดที่หาข้อมูลที่ต้องการใน cache ก่อน ถ้าไม่เจอก็ไปขอจาก origin",
    "เขียนโค้ดเชื่อม cache เข้ากับ Amazon RDS instance ที่จะอ่านข้อมูลมาเก็บ"] },
  'k-m09-04': { prompt: "ข้อใดเกี่ยวกับ Amazon ElastiCache เป็นจริง", choices: [
    "node คือ RAM ที่เชื่อมต่อผ่านเครือข่ายอย่างปลอดภัย และมีขนาดปรับเปลี่ยนได้",
    "แอปเชื่อมต่อกับ ElastiCache node ผ่านที่อยู่เฉพาะที่เรียกว่า endpoint",
    "ถ้าใช้ Memcached engine ข้อมูลจะถูกแบ่งกระจายไปตาม shard ใน cluster",
    "ทุก node ใน cluster ต้องใช้ cache engine ตัวเดียวกัน แต่จะใช้ instance type ต่างกันได้"] },
  'k-m09-05': { prompt: "ลูกค้าแถวลอนดอนบ่นว่าเว็บแอปที่โฮสต์อยู่ที่นิวยอร์กช้า developer ถูกขอให้แก้ปัญหานี้ developer อาจทำอะไรได้", choices: [
    "ใช้ Amazon CloudFront ทำสำเนาโค้ดแอปไปไว้บน Amazon Elastic Compute Cloud (Amazon EC2) instance ใน London Region",
    "ตั้งค่า CloudFront distribution ให้ส่ง static content จาก edge location ที่อยู่ใกล้ผู้ใช้ในสหราชอาณาจักร",
    "ตั้ง CloudFront regional edge location ใน London Region",
    "ตั้ง CloudFront edge location ที่นิวยอร์ก 1 แห่ง และที่ลอนดอน 1 แห่ง"] },
  'k-m09-06': { prompt: "developer ถูกขอให้เพิ่ม cache hit ratio ของ Amazon CloudFront distribution ควรลองทำอะไร", choices: [
    "ใส่ใน cache key เฉพาะค่าที่จำเป็นขั้นต่ำเท่านั้น",
    "ลดค่า maximum time to live (TTL) ใน cache policy",
    "ลดค่า max-age ใน header Cache-Control ของไฟล์",
    "เพิ่มค่า cache hit ใน cache policy"] },
  'k-m09-07': { prompt: "ข้อใดเกี่ยวกับการหมดอายุของไฟล์ที่ cache ไว้ใน Amazon CloudFront เป็นจริง", choices: [
    "ไฟล์ใน cache ทุกไฟล์หมดอายุอัตโนมัติหลัง 24 ชั่วโมง และเปลี่ยนค่านี้ไม่ได้",
    "หลังไฟล์หมดอายุ เมื่อ edge location ได้รับ request ขอไฟล์นั้นจากผู้ใช้ครั้งถัดไป CloudFront จะส่ง request ต่อไปที่ origin server",
    "เมื่อ origin ได้รับ request origin จะส่งไฟล์เวอร์ชันล่าสุดกลับไปเสมอ ไม่ว่าจะเหมือนกับไฟล์ที่หมดอายุใน cache หรือไม่",
    "ควบคุมระยะเวลาที่ไฟล์อยู่ใน cache ได้จาก cache policy ของ CloudFront หรือจาก Cache-Control ใน header ของไฟล์ที่ origin แต่ใช้สองวิธีนี้ร่วมกันไม่ได้"] },
  'k-m09-08': { prompt: "use case ข้อใดเหมาะกับ Amazon CloudFront Functions", choices: [
    "function ที่ redirect viewer ไปยัง URL อื่น และเพิ่ม custom response header",
    "function ที่ใช้ third-party library",
    "function ที่ต้องเข้าถึงเครือข่ายเพื่อเรียกใช้บริการภายนอกในการประมวลผล",
    "function ที่ต้องเข้าถึง body ของ HTTP request"] },
  'k-m09-09': { prompt: "ข้อใดเป็นประโยชน์ของ lazy loading ในฐานะกลยุทธ์ caching", choices: [
    "lazy loading ไม่ทำให้ cache เต็มไปด้วยข้อมูลที่ไม่มีใครขอ",
    "ถ้าใช้ lazy loading ข้อมูลใน cache จะไม่เก่า (stale) เลย",
    "ถ้าใช้ lazy loading ทุกครั้งที่เขียนข้อมูลต้องไป 2 รอบ คือเขียนลง cache และเขียนลงฐานข้อมูล ทำให้ช้าลง",
    "lazy loading อาจทำให้เกิด cache churn คือ cache อาจถูกอัปเดตบ่อย ถ้ามี record บางตัวถูกอัปเดตซ้ำ ๆ"] },
  'k-m09-10': { prompt: "มีคนถาม developer ว่า caching จะช่วยให้แอปประมูลออนไลน์ (online bidding) ทำงานเร็วขึ้นไหม developer ควรตอบอย่างไร", choices: [
    "caching คงไม่ช่วยให้แอปแบบนี้เร็วขึ้นมากนัก",
    "caching อาจช่วยได้โดยลดจำนวนครั้งที่เรียกฐานข้อมูล backend แต่แก้ปัญหา performance ระหว่าง client กับ web server ไม่ได้",
    "ใช้ caching หลายประเภทในแต่ละ layer ของแอป อาจช่วยให้ทั้ง frontend และ backend เร็วขึ้น",
    "caching อาจช่วยได้มากถ้าแอปใช้ compute หนัก แต่ถ้าแอปอ่านข้อมูลหนัก (read heavy) cache จะช่วยได้ไม่มาก"] },

  /* ---------- M10 SQS / SNS / Kinesis ---------- */
  'k-m10-01': { prompt: "message queue ประมวลผลข้อความอย่างไร", choices: [
    "queue ไปดึงข้อความใหม่จาก producer",
    "consumer ไปดึงข้อความจาก queue (poll)",
    "queue กระจายข้อความไปให้ consumer (broadcast)",
    "consumer แจ้ง queue เมื่อประมวลผลข้อความสำเร็จ แล้วค่าตั้งของ queue จะกำหนดว่าข้อความนั้นยังให้ consumer ตัวอื่นเห็นได้หรือไม่"] },
  'k-m10-02': { prompt: "การส่งข้อความแบบ publish/subscribe (pub/sub) ทำงานอย่างไร", choices: [
    "producer ส่งข้อความตรงไปให้ subscriber",
    "subscriber ไปดึงข้อความใหม่จาก topic (poll)",
    "เมื่อ topic ได้รับข้อความใหม่ topic จะส่งข้อความให้ subscriber คนแรกที่ตอบรับ notification",
    "ข้อความใหม่ของ topic จะถูกส่ง (push) ไปให้ subscriber ทุกคนของ topic"] },
  'k-m10-03': { prompt: "developer ต้องการเพิ่ม Amazon Simple Queue Service (Amazon SQS) queue เพื่อแยก (decouple) request สั่งซื้อที่เข้ามาออกจากฐานข้อมูล backend การเปลี่ยนแปลงนี้อาจใช้ Amazon SQS operation ใด", choices: [
    "ใช้ operation SendMessage โดยให้ QueueURL ชี้ไปที่ endpoint ของฐานข้อมูล เพื่อใส่ข้อความลง queue",
    "ใช้ operation ReceiveMessage โดยตั้ง MaxNumberOfMessages เป็น 5 เพื่อดึงข้อความออกจาก queue ครั้งละไม่เกิน 5 ข้อความ",
    "ใช้ operation DeleteMessage เพื่อเปลี่ยน visibility ของข้อความทันทีที่ได้ ReceiptHandle",
    "ใช้ operation ReceiveMessage โดยตั้งพารามิเตอร์ WaitTimeSeconds เป็น 0 เพื่อลดจำนวน request ที่ได้ผลว่าง"] },
  'k-m10-04': { prompt: "tester รายงานว่าข้อความใน Amazon Simple Queue Service (Amazon SQS) ถูกประมวลผลมากกว่าหนึ่งครั้ง developer พบว่า processing server ทำงานเสร็จช้ากว่าที่คาด และข้อความกลับไปให้ consumer ตัวอื่นเห็นก่อนที่ consumer ตัวก่อนจะลบมัน ทำอย่างไรจึงจะลดปัญหานี้ได้", choices: [
    "เพิ่ม visibility timeout",
    "เพิ่ม maxReceiveCount",
    "เพิ่ม MaxNumberOfMessages",
    "เพิ่มจำนวน producer ของ queue"] },
  'k-m10-05': { prompt: "แอปประมวลผลคำสั่งซื้อใช้ Amazon Simple Queue Service (Amazon SQS) queue developer พบว่า client เวอร์ชันเก่าสร้าง order record ที่ทำให้ process ฝั่ง backend ล้มเหลว และความล้มเหลวนี้ทำให้ queue ติดคอขวด developer จะลดผลกระทบจาก record ที่ล้มเหลวได้อย่างไร", choices: [
    "เพิ่ม visibility timeout และตั้ง MaxNumberOfMessages ให้สูง",
    "เพิ่ม dead-letter queue และตั้ง maxReceiveCount ให้ต่ำ",
    "ใช้ long polling และตั้ง wait time ให้สูง",
    "เปลี่ยนชนิด queue จาก standard เป็น First-In-First-Out (FIFO) และตั้ง throughput ให้สูง"] },
  'k-m10-06': { prompt: "ข้อใดเกี่ยวกับตัวเลือกการ polling ของ Amazon Simple Queue Service (Amazon SQS) เป็นจริง", choices: [
    "โดยค่าเริ่มต้น เมื่อเรียก ReceiveMessage API Amazon SQS จะทำ long polling",
    "ถ้าตั้งค่า long polling WaitTimeSeconds จะเท่ากับ 0",
    "ถ้าตั้งค่า short polling Amazon SQS จะ query server ทั้งหมดของมัน",
    "ถ้าตั้งค่า short polling Amazon SQS จะสุ่มตัวอย่าง query จาก server บางส่วน"] },
  'k-m10-07': { prompt: "ข้อใดเกี่ยวกับ Amazon Simple Notification Service (Amazon SNS) เป็นจริง", choices: [
    "SNS topic คือ logical access point ที่ทำหน้าที่เป็นช่องทางสื่อสาร",
    "publisher ส่งข้อความได้เฉพาะ topic ที่ตัวเองสร้างเท่านั้น",
    "โดยค่าเริ่มต้น subscriber แต่ละคนของ topic จะได้ข้อความไม่เหมือนกัน",
    "Amazon SNS กำหนด delivery policy เดียวและใช้กับทุก delivery protocol"] },
  'k-m10-08': { prompt: "Amazon Simple Notification Service (Amazon SNS) topic รับข้อความเกี่ยวกับคำสั่งซื้อ และมี AWS Lambda function ที่ประมวลผลคำสั่งซื้อที่ถูกยกเลิก subscribe topic นี้อยู่ developer จะลดค่าใช้จ่ายโดยให้เรียก Lambda function เฉพาะเมื่อเป็นคำสั่งซื้อที่ถูกยกเลิกได้อย่างไร", choices: [
    "วาง Amazon Simple Queue Service (Amazon SQS) queue ไว้หน้า Lambda function",
    "แยกข้อความคำสั่งซื้อใหม่กับข้อความยกเลิกคำสั่งซื้อให้ส่งโดย publisher สองตัวที่ต่างกัน",
    "ตั้ง filter policy ให้ subscription ของ Lambda function รับเฉพาะข้อความยกเลิกคำสั่งซื้อ",
    "ใช้ operation ConfirmSubscription เพื่อจำกัดว่า Lambda function จะรับข้อความอะไรบ้าง"] },
  'k-m10-09': { prompt: "developer ต้องสร้าง custom application เพื่อใส่ log record ของแอปลูกค้าลงใน Amazon Kinesis data stream ควรใช้อะไรสร้างแอปนี้", choices: [
    "ใช้ Kinesis API",
    "ใช้ Kinesis Producer Library (KPL)",
    "ใช้ Kinesis Client Library (KCL)",
    "ใช้ Amazon Managed Service for Apache Flink"] },
  'k-m10-10': { prompt: "ข้อใดเกี่ยวกับ Amazon Kinesis Data Streams เป็นจริง", choices: [
    "เมื่อเพิ่ม record ลงใน stream แล้ว record จะอยู่ใน stream จนกว่า consumer จะลบ",
    "data record ใน data stream ถูกกระจายไปตาม shard",
    "standard data stream มี consumer ได้ตัวเดียว ถ้าใช้ตัวเลือก enhanced fan-out จะเพิ่ม consumer ได้หลายตัว",
    "consumer ของ stream ต้องลบ record ที่ประมวลผลสำเร็จแล้ว"] },

  /* ---------- M11 Step Functions ---------- */
  'k-m11-01': { prompt: "สถานการณ์ไหนบ่งบอกว่าต้องใช้บริการประสานงาน task อย่าง AWS Step Functions", choices: [
    "เว็บไซต์ที่ให้บริการเนื้อหา static กำลังขยายไปยังผู้ใช้ทั่วโลก",
    "serverless application ต้องรัน AWS Lambda function หลายตัวที่ขึ้นอยู่กับกันและกัน",
    "monolithic application ที่เขียนด้วย Java กำลังเปลี่ยน technology stack",
    "reporting application ต้องปรับตรรกะการคำนวณ เพื่อให้ข้อมูลวิเคราะห์แก่ผู้ใช้ฝั่งธุรกิจได้มากขึ้น"] },
  'k-m11-02': { prompt: "ข้อไหนคือประโยชน์ของการใช้ AWS Step Functions ในแอปพลิเคชัน", choices: [
    "Step Functions ทำงานร่วมกับ state machine ได้ ทำให้ developer สลับไปมาระหว่าง workflow ของ Step Functions กับ workflow ของ state machine ได้",
    "ตั้งค่า Step Functions ให้ใช้ร่วมกับ Amazon EC2 Auto Scaling เพื่อขยายขึ้นหรือลดลงได้",
    "เขียน Step Functions ได้ด้วย Python หรือ Node.js อย่างใดอย่างหนึ่ง",
    "developer ใช้ Step Functions สร้าง visual workflow ได้"] },
  'k-m11-03': { prompt: "Task state ใน AWS Step Functions ทำหน้าที่อะไร", choices: [
    "ใช้หยุด workflow ที่ล้มเหลว",
    "ทำงานหนึ่งหน่วย (unit of work)",
    "ให้ตรรกะการแตกสาขา (branching)",
    "บอก state machine ว่าต้องทำขั้นตอนต่าง ๆ ตามลำดับใด"] },
  'k-m11-04': { prompt: "แอปประมวลผลการคืนสินค้าต้องทำขั้นตอนต่างกัน ขึ้นอยู่กับว่าคืนภายใน 30 วันหลังซื้อหรือไม่ developer ใช้ state ใดของ AWS Step Functions เพื่อทำตรรกะนี้ได้", choices: [
    "Parallel", "Task", "Choice", "Wait"] },
  'k-m11-05': { prompt: "แอปประมวลผลการคืนสินค้าต้องรัน AWS Lambda function ตัวเดียวกันกับสินค้าแต่ละชิ้นในออเดอร์ developer ใช้ state ใดของ AWS Step Functions เพื่อทำตรรกะนี้ได้", choices: [
    "Parallel", "Pass", "Map", "Task"] },
  'k-m11-06': { prompt: "ข้อไหนเป็นจริงทั้งกับ Succeed state และ Fail state", choices: [
    "ทั้งสอง state ไม่มี field Next",
    "ไม่ต้องมี field End เพราะทั้งสอง state ไม่ใช่ terminal state",
    "field Type เป็นแบบ optional สำหรับทั้งสอง state",
    "ต้องมี field End เพราะทั้งสอง state เป็น terminal state"] },
  'k-m11-07': { prompt: "แอปประมวลผลการคืนสินค้าต้องรัน audit check ที่เป็นอิสระต่อกัน 2 อย่าง เมื่อทั้งสองอย่างเสร็จสมบูรณ์ จึงจะรันขั้นตอนอนุมัติการคืนสินค้า developer ใช้ state ใดของ AWS Step Functions เพื่อทำตรรกะนี้ได้", choices: [
    "Parallel", "Task", "Choice", "Wait"] },
  'k-m11-08': { prompt: "taskToken ถูกใช้อย่างไรในกรณีใช้งาน AWS Step Functions ที่มีขั้นตอนอนุมัติด้วยคน (manual approval)", choices: [
    "taskToken ถูกสร้างเมื่อ workflow เข้าสู่ Wait state และใช้ติดตามว่า workflow รอให้ task เสร็จมานานเท่าไร",
    "taskToken ใช้เปลี่ยนจาก state หนึ่งไปอีก state หนึ่งใน workflow และกำหนดไว้ใน field Next",
    "taskToken ถูกส่งกลับมาพร้อมการเรียก action GetActivityTask และใช้ตอนเรียก action SendTaskSuccess เพื่อเชื่อมผลลัพธ์เข้ากับ task",
    "taskToken เป็น output ของ Success state ใน synchronous Step Functions Express workflow และใช้ยืนยันว่า task ทั้งหมดสำเร็จ"] },
  'k-m11-09': { prompt: "กรณีใช้งานไหนเหมาะกับ AWS Step Functions Express workflow", choices: [
    "ทุก workflow ในแอปต้องตรวจสอบย้อนหลัง (audit) ได้ถึง 90 วันหลังรันเสร็จ",
    "workflow มีขั้นตอนที่ต้องรันแอปพลิเคชันที่โฮสต์บน Amazon Elastic Compute Cloud (Amazon EC2) instance",
    "workflow ใช้เวลารัน 30 นาทีถึง 1 ชั่วโมง",
    "workflow ต้องรองรับ event จำนวนมากในอัตราที่สูงมากจากอุปกรณ์ Internet of Things (IoT)"] },
  'k-m11-10': { prompt: "ข้อไหนเกี่ยวกับ AWS Step Functions เป็นจริง", choices: [
    "developer ใช้ Amazon API Gateway เชื่อม Step Functions API เข้ากับ method ใน API Gateway API ได้",
    "Step Functions มี quota ระดับ account สำหรับจำนวน state machine ที่ลงทะเบียน แต่ไม่มี quota ที่เกี่ยวกับการรัน Step Functions แต่ละครั้ง",
    "ต้องสร้าง Step Functions ใน visual editor บน Step Functions console แต่แก้ไขด้วย AWS SDK ได้",
    "developer ใช้ Describe API action เพื่อดูสรุป state machine ทั้งหมด และจำนวนครั้งที่แต่ละตัวถูกรันได้"] },

  /* ---------- M12 Security / Cognito ---------- */
  'k-m12-01': { prompt: "ข้อไหนเกี่ยวกับการสร้างการเชื่อมต่อที่ปลอดภัยเป็นจริง", choices: [
    "ทั้ง Secure Sockets Layer (SSL) และ Transport Layer Security (TLS) เป็นมาตรฐานที่ AWS พัฒนาขึ้นสำหรับการสื่อสารที่ปลอดภัย",
    "SSL ใช้ certificate ยืนยันตัวตนของเว็บไซต์ แต่ TLS ไม่ใช้",
    "ทั้ง SSL และ TLS เข้ารหัสการสื่อสารผ่านเครือข่ายระหว่าง resource ที่เชื่อมต่อกัน",
    "SSL เป็นเวอร์ชันใหม่กว่า TLS และทั้งสองใช้ยืนยันตัวตนของเว็บไซต์"] },
  'k-m12-02': { prompt: "ขั้นตอนไหนในกระบวนการเชื่อมต่อที่ปลอดภัยเป็นหน้าที่ของ certificate authority (CA)", choices: [
    "ออก certificate",
    "ตรวจสอบว่า certificate มาจากแหล่งที่เชื่อถือได้หรือไม่",
    "ส่ง session key ที่เข้ารหัสแล้ว",
    "ส่ง certificate และ public key ให้ client"] },
  'k-m12-03': { prompt: "ข้อไหนเกี่ยวกับ AWS Certificate Manager (ACM) เป็นจริง", choices: [
    "ACM จัดสรร public certificate ให้ได้ แต่ private certificate developer ต้องสร้างเองแล้วนำมาเชื่อมกับ ACM",
    "ACM จัดการการต่ออายุ certificate ให้ทั้ง public และ private certificate",
    "ค่าใช้จ่ายของ ACM คิดตามจำนวน public certificate ที่ active อยู่ใน AWS account",
    "developer ต้องตั้งค่า load balancer ให้ใช้ certificate ของ ACM"] },
  'k-m12-04': { prompt: "ข้อไหนเป็น best practice สำหรับ security credential", choices: [
    "แชร์ access key ได้เฉพาะระหว่างผู้ใช้ใน AWS account เดียวกัน",
    "ใช้ AWS Identity and Access Management (IAM) role เพื่อขอ temporary security credential",
    "ถ้า access key ไม่ได้เข้ารหัส ให้ฝังไว้ในโค้ดที่เฉพาะ developer เข้าถึงได้ ผู้ใช้เข้าถึงไม่ได้",
    "ไม่อนุญาตให้ยืนยันตัวตนกับบริการ AWS ผ่านโปรแกรม (programmatic authentication)"] },
  'k-m12-05': { prompt: "AWS Security Token Service (AWS STS) แบบ federated user กับแบบ AWS Identity and Access Management (IAM) user ต่างกันที่จุดสำคัญอะไร", choices: [
    "federated user: แอปเรียก identity broker ส่วน IAM user ข้ามขั้นตอนนี้",
    "federated user: การยืนยันตัวตนครั้งแรกทำกับ IdP ส่วน IAM user: ครั้งแรกทำกับ IAM",
    "federated user: การยืนยันตัวตนครั้งที่สองทำกับ IdP ส่วน IAM user: ครั้งที่สองทำกับ IAM",
    "federated user: แอปใช้ temporary security credential และ token เพื่อส่ง request ไปยังบริการ AWS ส่วน IAM user ไม่ต้องใช้ token"] },
  'k-m12-06': { prompt: "developer ได้รับมอบหมายให้สืบว่าไฟล์เว็บไซต์ถูกลบออกจาก Amazon Simple Storage Service (Amazon S3) bucket ได้อย่างไร ควรทำอย่างไร", choices: [
    "ใช้ AWS CloudTrail ค้นหาข้อมูล event การลบ object ใน S3 bucket",
    "ใช้ AWS Security Token Service (AWS STS) บล็อกการลบจาก S3 bucket",
    "ใช้ AWS Identity and Access Management (IAM) ค้นหาผู้ใช้ที่เคยใช้สิทธิ์ลบบน S3 bucket",
    "ใช้การเรียก API GetSessionToken ของ AWS STS เพื่อดึงข้อมูลผู้ใช้ที่ลบไฟล์จาก S3 bucket"] },
  'k-m12-07': { prompt: "developer ได้รับมอบหมายให้เพิ่มบริการ sign-up และ sign-in ให้แอปพลิเคชัน ควรใช้ฟีเจอร์ Amazon Cognito ตัวไหน", choices: [
    "Amazon Cognito identity pool",
    "Amazon Cognito user pool",
    "Amazon Cognito Lambda trigger",
    "Amazon Cognito access token"] },
  'k-m12-08': { prompt: "developer ได้รับมอบหมายให้ลดความเสี่ยงด้านความปลอดภัย ในกรณีที่ผู้ใช้ sign in แอปด้วย username และ password คู่เดียวกับที่ใช้ในเว็บไซต์อื่น developer อาจตั้งค่าฟีเจอร์ใดของ Amazon Cognito user pool", choices: [
    "Identity token",
    "การยืนยันโทรศัพท์และอีเมล",
    "Adaptive authentication",
    "Compromised credentials check"] },
  'k-m12-09': { prompt: "ข้อไหนเกี่ยวกับ Amazon Cognito identity pool เป็นจริง", choices: [
    "identity pool ทำให้ผู้ใช้ขอ AWS credential ชั่วคราวที่มีสิทธิ์จำกัด เพื่อเข้าถึงบริการ AWS อื่นได้",
    "identity pool ทำให้ไม่ต้องใช้ third-party identity provider อีกต่อไป",
    "ถ้าใช้ Amazon Cognito identity pool จะไม่ใช้ Amazon Cognito user pool ร่วมด้วย",
    "identity pool ให้ฟังก์ชัน sign-up และ sign-in สำหรับแอปมือถือ"] },
  'k-m12-10': { prompt: "developer วางแผนใช้ Amazon Cognito user pool กับ Amazon API Gateway ขั้นตอนไหนเป็นส่วนหนึ่งของ authentication flow ของ user pool ร่วมกับ API Gateway", choices: [
    "แอปมือถือส่ง request ไปที่ API Gateway แล้ว API Gateway ขอ JSON Web Token (JWT) จาก user pool",
    "ผู้ใช้แอปมือถือยืนยันตัวตนกับ user pool แล้ว user pool ส่ง JWT กลับมาให้แอป",
    "user pool ตรวจสอบ token กับ identity pool",
    "Amazon Cognito เรียก API หลังตรวจสอบสิทธิ์สำเร็จ"] },

  /* ---------- M13 CI/CD ---------- */
  'k-m13-01': { prompt: "ข้อไหนคือปรัชญาของ DevOps", choices: [
    "สอนทีม development กับทีม operations ให้ใช้เครื่องมือชุดเดียวกัน เพื่อให้ test และ deploy ได้เร็วขึ้น",
    "ลดกำแพงระหว่างงาน development กับงาน operations เพื่อให้ทำงานได้เต็มประสิทธิภาพและระบบน่าเชื่อถือ",
    "วัฒนธรรม DevOps คือ “Processes over people” หมายความว่าถ้ากระบวนการแข็งแรง ใครในทีมก็ทำงานอะไรแทนกันได้",
    "วัฒนธรรม DevOps คือแนวคิดที่ว่า tight coupling ทำให้ environment ของ development, test และ production เหมือนกันมากขึ้น (parity)"] },
  'k-m13-02': { prompt: "ใน software development lifecycle ของงานบน cloud แนวปฏิบัติ DevOps แสดงออกมาอย่างไร", choices: [
    "ทุกเฟสของ software development lifecycle ทำงานอัตโนมัติ",
    "developer ใช้ continuous integration merge โค้ดเข้า repository ในเครื่องตัวเอง และต่อกับ test environment เพื่อทดสอบในสถานการณ์จริง",
    "ถ้าใช้ continuous delivery developer deploy โค้ดได้โดยไม่ต้อง monitor ต่อเนื่อง",
    "เครื่องมือด้าน infrastructure เทียบ environment ในเครื่อง developer กับ test และ staging แล้วรายงานความต่าง เพื่อให้ทีม operations ทำให้ทุก environment เหมือนกัน"] },
  'k-m13-03': { prompt: "developer อาจใช้ AWS CodePipeline ในกระบวนการ continuous integration และ continuous deployment (CI/CD) ได้อย่างไร", choices: [
    "compile source code, รัน test และสร้าง software package ที่พร้อม deploy",
    "เป็นที่เก็บ repository แบบ Git และทำ source control",
    "deploy ไปยัง compute service ได้หลายประเภท",
    "ทำขั้นตอนที่ต้องใช้ในการ release ซอฟต์แวร์ให้อัตโนมัติ ตาม release model ที่ developer กำหนดเอง"] },
  'k-m13-04': { prompt: "ข้อไหนเกี่ยวกับ continuous integration และ continuous delivery/deployment (CI/CD) เป็นจริง", choices: [
    "continuous deployment ลดความเสี่ยงที่จะมี bug บน production แต่อาจทำให้ส่งฟีเจอร์ใหม่ช้าลง",
    "continuous integration บังคับให้ทีมต้องเขียน automated test",
    "continuous delivery ทำอัตโนมัติไปจนถึง deploy ขึ้น production โดยไม่ต้องมีคนทำอะไรเลย",
    "continuous deployment ครอบคลุมตั้งแต่ check-in ไปจนถึง production แต่หลัง check-in และก่อนปล่อยให้ลูกค้า ยังมีขั้นตอนที่ต้องใช้คนทำเองบางส่วน"] },
  'k-m13-05': { prompt: "developer อยากใช้ infrastructure as code กับเว็บแอปที่เขียนด้วย Java บน AWS งานข้อไหนอาจเป็นส่วนหนึ่งของงานนี้", choices: [
    "สร้าง Amazon Elastic Compute Cloud (Amazon EC2) instance ด้วย AWS CodeBuild แล้วใช้ AWS CodeDeploy push แอปไปที่ EC2 instance อัตโนมัติ",
    "สร้าง AWS CloudFormation template แบบ Java ที่กำหนด application layer และ database layer ของแอป",
    "สร้าง AWS CloudFormation template ที่มี section Resources กำหนด AWS resource ของแอป",
    "ใช้ AWS CodePipeline สร้าง pipeline ที่ release แอปให้อัตโนมัติทั้งกระบวนการ"] },
  'k-m13-06': { prompt: "developer อยากใช้ AWS CloudFormation template ตัวเดียวกันทั้ง test environment และ production environment ควรใช้ section ไหนของ template เพื่อทำแบบนี้", choices: [
    "ใช้ section Transform กำหนดตัวแปรที่ต้องเปลี่ยนในแต่ละ environment ตอนสร้างหรืออัปเดต stack",
    "ใช้ section Format Version กำหนด parameter ที่ต้องส่งให้แต่ละ environment ตอนสร้างหรืออัปเดต stack",
    "ใช้ section Outputs กำหนดว่า template ควรสร้าง environment ไหนบ้าง ตอนสร้างหรืออัปเดต stack",
    "ใช้ section Conditions ควบคุมว่าจะสร้าง resource บางตัวหรือไม่ ตอนสร้างหรืออัปเดต stack"] },
  'k-m13-07': { prompt: "ข้อไหนเกี่ยวกับ AWS CloudFormation stack เป็นจริง", choices: [
    "ลบ stack แล้ว CloudFormation template ของ stack นั้นจะถูกลบ แต่ resource ที่ deployment ล่าสุดสร้างไว้จะไม่ถูกลบ",
    "CloudFormation stack คือ unit of deployment",
    "ต้องลบ stack เดิมทิ้งก่อน ถึงจะ deploy template ที่อัปเดตเพื่อแก้ parameter ของ resource ใน stack นั้นได้",
    "CloudFormation มี quota เกี่ยวกับจำนวน resource ใน stack แต่ละตัว แต่ไม่มี quota เกี่ยวกับจำนวน stack"] },
  'k-m13-08': { prompt: "developer กำลังสร้าง serverless application ตัวแรกบน AWS เรื่อง deploy แอปนี้ เขาต้องคิดต่างจากเดิมอย่างไร", choices: [
    "จำลอง production environment ในเครื่องแบบเดียวกับที่ทำกับการ deploy บน server ไม่ได้",
    "ใช้ AWS CloudFormation เป็น infrastructure as code เพื่อ deploy แอปไม่ได้",
    "ขั้นตอนการเชื่อมต่อกับ AWS Lambda server เพื่อ debug ต่างจากการเชื่อมต่อกับ server แบบเดิม",
    "เครื่องมือพัฒนา serverless ไม่ทำงานร่วมกับเครื่องมือพัฒนาอื่นของ AWS ที่ใช้ใน deployment pipeline"] },
  'k-m13-09': { prompt: "AWS Serverless Application Model (AWS SAM) template ต่างจาก AWS CloudFormation template อย่างไร", choices: [
    "AWS SAM template เขียนด้วยภาษาเดียวกับ AWS Lambda runtime ของ function ที่จะ deploy",
    "section Globals มีเฉพาะใน AWS SAM template",
    "section Resources ใน AWS SAM template ใส่ได้เฉพาะ serverless resource",
    "AWS SAM template ไม่จำเป็นต้องมี Transform declaration"] },
  'k-m13-10': { prompt: "บรรทัดด้านล่างอยู่ใน section Resources ของ AWS Serverless Application Model (AWS SAM) template บรรทัดเหล่านี้สร้างอะไร", choices: [
    "AWS Lambda function ชื่อ Orders ที่เชื่อมต่อกับ Amazon DynamoDB table",
    "Amazon DynamoDB table ชื่อ Orders",
    "API GET method ที่อ่านข้อมูลจาก table Orders",
    "MySQL table ชื่อ Orders"] },
});
