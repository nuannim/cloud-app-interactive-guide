// ข้อเก็งข้อสอบข้อเขียน (เก็งจากน้ำหนักเนื้อหา M07–M13 ไม่ใช่ข้อสอบจริง) · แท็บ #/predict · ตรวจด้วย node tools/validate.mjs
GUIDE.registerPredict({
 "questions": [
  {
   "id": "p-m07-1",
   "modules": [
    "M07"
   ],
   "likelihood": "สูง",
   "depth": "พื้นฐาน",
   "why": "Invocation 3 แบบ (sync / async / polling) เป็นหัวข้อที่ notes ทำเครื่องหมายว่าออกสอบบ่อย และ scenario เลือกแบบการเรียกตามพฤติกรรม retry/response ออกง่ายที่สุด",
   "prompt": "ร้านอาหารออนไลน์ 'ครัวเที่ยง' ใช้ AWS Lambda เป็นแกนของระบบ มี 3 งานดังนี้\n(ก) ปุ่ม 'สั่งซื้อ' บนเว็บเรียก endpoint /order ผ่าน API Gateway หน้าเว็บต้องรอผลว่าออเดอร์สำเร็จหรือไม่ก่อนแสดงหน้ายืนยัน\n(ข) เมื่อร้านอัปโหลดรูปเมนูลง Amazon S3 ต้องสร้าง thumbnail อัตโนมัติ ผู้ใช้ไม่ต้องรอผล แต่ถ้า function ล้มเหลวต้องไม่ปล่อยให้เหตุการณ์หายเงียบ ๆ\n(ค) ออเดอร์ที่ลูกค้ากดมาจะถูกใส่ลง Amazon SQS queue แล้วต้องให้ Lambda ดึงมาประมวลผลเป็น batch\nให้ระบุว่าแต่ละงานควรใช้ invocation model แบบใด (synchronous / asynchronous / polling) พร้อมอธิบายพฤติกรรม retry และการจัดการ error ของแต่ละแบบ และบอกว่า S3 ต้องมีสิทธิ์อะไรจึงจะเรียก function ได้",
   "hints": [
    "คำสำคัญ: 'ต้องรอผล' (ก), 'ผู้ใช้ไม่ต้องรอ / ห้ามหายเงียบ' (ข), 'ดึงจาก queue เป็น batch' (ค), 'S3 ต้องมีสิทธิ์อะไร'",
    "เกี่ยวกับ: invocation แบบ RequestResponse / Event / event source mapping, retry 0-2 ครั้ง, destinations หรือ dead-letter queue, resource-based (function) policy",
    "โครงคำตอบ: 1) จับคู่ (ก)(ข)(ค) กับ invocation model 2) พฤติกรรม retry/response ของแต่ละแบบ 3) วิธีไม่ให้เหตุการณ์ (ข) หาย 4) policy ที่ให้ S3 เรียก function"
   ],
   "modelAnswer": "(ก) ใช้ synchronous push (RequestResponse) เพราะผู้เรียกต้องรอ response จาก function (ได้ StatusCode 200 กลับมา) แบบนี้ Lambda ไม่มี retry ในตัว ฝั่งผู้เรียก (เช่น หน้าเว็บหรือ API Gateway) ต้องจัดการ error/retry เอง\n(ข) ใช้ asynchronous push (Event) ซึ่ง S3 เป็นต้นทางตามตัวอย่างในสไลด์ Lambda จะ queue event ไว้แล้วตอบรับ 202 ทันที ผู้ใช้ไม่ต้องรอ ถ้า function ล้มเหลว Lambda retry ให้อัตโนมัติ 0-2 ครั้ง (ตั้งได้) และเก็บ event รอได้นานสุด 6 ชั่วโมง หากยังล้มเหลวต้องตั้ง dead-letter queue หรือ destination on failure (SNS / SQS / Lambda อื่น / EventBridge) เพื่อไม่ให้ event หายเงียบ\n(ค) ใช้ pull / polling ผ่าน event source mapping Lambda ไปดึงจาก SQS แล้วเรียก function ด้วย batch ของ record ถ้า batch มี error ตัว batch จะถูกคืนกลับเข้า queue (ต่างจาก Kinesis / DynamoDB Streams ที่ error ใน shard จะบล็อกการประมวลผลต่อ)\nสิทธิ์: S3 เป็น event source แบบ push จึงต้องเพิ่ม resource-based (function) policy ให้ service s3.amazonaws.com มี lambda:InvokeFunction (ใส่ด้วย aws lambda add-permission) ส่วนสิ่งที่ function ทำกับ S3/DynamoDB ต่อ ต้องกำหนดด้วย execution role คนละชั้นกัน\nทางเลือกที่ตัดทิ้ง: ใช้ async กับ (ก) ไม่ได้ เพราะจะได้แค่ 202 ไม่ได้ผลลัพธ์ออเดอร์; ใช้ sync กับ (ข) ทำให้ผู้ใช้ต้องรอและ S3 ไม่ใช่ผู้เรียกที่จะมา retry ให้",
   "rubric": [
    "จับคู่ถูก: (ก) synchronous / RequestResponse, (ข) asynchronous / Event, (ค) polling ผ่าน event source mapping",
    "บอกว่า sync ไม่มี retry ในตัว ผู้เรียกต้องจัดการเอง และได้ผลลัพธ์กลับทันที",
    "บอกว่า async ถูก queue แล้วตอบ 202 retry 0-2 ครั้ง เก็บ event ได้สูงสุด 6 ชั่วโมง",
    "เสนอ dead-letter queue หรือ destination on failure สำหรับ (ข)",
    "บอกว่า polling ส่ง batch และ error ใน batch ของ SQS ถูกคืนเข้า queue (stream แบบ shard จะ block)",
    "บอกว่า S3 ต้องการ resource-based (function) policy ที่อนุญาต lambda:InvokeFunction และแยกจาก execution role"
   ],
   "topics": [
    {
     "module": "M07",
     "index": 1
    },
    {
     "module": "M07",
     "index": 3
    }
   ],
   "source": [
    "M07 L431-460",
    "M07 L486-512",
    "M07 L521-540",
    "M07 L561",
    "M07 L591",
    "M07 L664-688",
    "M07 L1000-1001"
   ]
  },
  {
   "id": "p-m07-2",
   "modules": [
    "M07"
   ],
   "likelihood": "กลาง",
   "depth": "ลึก",
   "why": "ข้อสอบ scenario ชอบรวมหลายข้อจำกัดของ Lambda (timeout, concurrency, cold start, memory) ในโจทย์เดียว และให้เลือก config ให้ตรงแต่ละปัญหา",
   "prompt": "ระบบสั่งอาหาร 'ครัวเที่ยง' มี spike หนักช่วงเที่ยง ใช้ Lambda ทั้งหมดและมีปัญหา 3 อย่าง\n1) API ดูเมนูต้องตอบเร็วสม่ำเสมอ แต่ลูกค้าบ่นว่าช่วงที่เพิ่งมี traffic เข้ามาครั้งแรกจะช้าเป็นพิเศษ\n2) function บันทึกออเดอร์เขียนลงฐานข้อมูลที่รองรับงานพร้อมกันได้จำกัด (สมมติรับได้ประมาณ 100 งานพร้อมกัน) ช่วง spike ฐานข้อมูลล่มเพราะถูกยิงพร้อมกันมากเกินไป ทั้งที่บัญชีนี้ยังมี concurrency เหลือใช้\n3) งานประมวลผลรูปอาหารต้องใช้เวลา 20 นาทีต่อชุด และตอนนี้ล้มเหลวทุกครั้ง\nให้อธิบายสาเหตุและเลือก config / แนวทางแก้ของแต่ละข้อ พร้อมบอกว่าทางเลือกอื่นที่ตัดทิ้งเพราะอะไร และข้อไหนที่มีค่าใช้จ่ายเพิ่ม",
   "hints": [
    "คำสำคัญ: 'ช้าตอนมี traffic เข้ามาครั้งแรก' = cold start, 'ฐานข้อมูลรับได้จำกัด ทั้งที่ concurrency เหลือ' = ต้องจำกัดที่ระดับ function, '20 นาที ล้มเหลวทุกครั้ง' = ชนเพดาน timeout",
    "เกี่ยวกับ: provisioned concurrency, concurrency (default 1,000 ต่อ Region ต่อ account เป็น soft limit) และการตั้ง limit ต่อ function, timeout (1 วินาที ถึง 15 นาที), memory 128 MB-10,240 MB, Step Functions state machines, database proxy",
    "โครงคำตอบ: ข้อ 1 สาเหตุ + วิธีแก้ + ค่าใช้จ่าย / ข้อ 2 สาเหตุ + วิธีแก้ + ตัวช่วยเรื่อง connection / ข้อ 3 เพดาน timeout + ทางออก 2 แนว / สรุปทางเลือกที่ตัดทิ้ง"
   ],
   "modelAnswer": "ข้อ 1: เป็น cold start เพราะ Lambda ต้องสร้าง environment ใหม่ตอนที่ยังไม่มีตัวอุ่นพร้อมใช้ วิธีแก้คือเปิด provisioned concurrency เพื่อ keep warm จำนวน environment ที่ต้องการ ซึ่งคิดเงินแยกต่างหาก จึงควรเปิดเฉพาะ function ที่ latency-sensitive (API ดูเมนู) ไม่ใช่ทุกตัว ทางเลือกที่ตัดทิ้ง: เพิ่ม memory อย่างเดียว ช่วยเรื่อง CPU แต่ไม่ได้ทำให้ไม่มี cold start\nข้อ 2: concurrency คือจำนวน invocation ที่รันพร้อมกัน ค่า default ระดับบัญชี 1,000 ต่อ Region (soft limit) ซึ่งสูงกว่าที่ฐานข้อมูลรับไหวมาก ต้องตั้ง concurrency limit ระดับ function ของตัวบันทึกออเดอร์ (ให้ต่ำกว่า 100 ตามที่ DB รับได้) เพื่อไม่ให้ downstream ถูกท่วม สไลด์ระบุตรง ๆ ว่าตั้งต่อ function ได้เพื่อป้องกันระบบปลายทาง และถ้า function เชื่อมต่อ RDS สามารถใช้ database proxy ช่วยทำ connection pooling ได้ ทางเลือกที่ตัดทิ้ง: ขอเพิ่ม account concurrency ซึ่งยิ่งทำให้ยิงเข้า DB พร้อมกันมากขึ้น\nข้อ 3: timeout สูงสุดของ Lambda คือ 15 นาที งาน 20 นาทีจึงรันเป็น function เดียวไม่ได้ ไม่ว่าจะเพิ่ม memory (ซึ่งเพิ่มแค่ CPU ตามสัดส่วน ไม่ได้ขยายเวลา) ทางออก: แยกงานเป็นชิ้นย่อยที่แต่ละชิ้นใช้เวลาต่ำกว่า 15 นาที แล้วใช้ Step Functions state machine เรียก function ทีละขั้น หรือย้ายงานนี้ไปรันบน container เช่น ECS on Fargate ที่เหมาะกับ batch (ดู M08)\nสรุปค่าใช้จ่าย: provisioned concurrency คิดเงินแยก ส่วน limit ต่อ function ไม่มีค่าใช้จ่ายเพิ่มแต่ใช้จากโควตาของบัญชี",
   "rubric": [
    "ระบุว่าอาการข้อ 1 คือ cold start และแก้ด้วย provisioned concurrency พร้อมบอกว่าคิดเงินแยก",
    "ระบุว่าข้อ 2 ต้องตั้ง concurrency limit ต่อ function เพื่อป้องกัน downstream และอ้างค่า default 1,000 ต่อ Region ต่อ account (soft limit) ได้ถูกต้อง",
    "ระบุเพดาน timeout 15 นาที (ช่วง 1 วินาที-15 นาที) และสรุปว่างาน 20 นาทีรันใน function เดียวไม่ได้",
    "เสนอทางออกข้อ 3 อย่างน้อยหนึ่งแนว: แตกงานย่อย + Step Functions หรือย้ายไป container (ECS/Fargate)",
    "แยกให้ถูกว่า memory ปรับ CPU ตามสัดส่วน (128-10,240 MB) แต่ไม่ได้ขยาย timeout หรือแก้ cold start",
    "อธิบายทางเลือกที่ตัดทิ้งอย่างน้อย 2 อย่างพร้อมเหตุผลโยงกับตัวเลขในโจทย์ (เช่น DB รับ 100, งาน 20 นาที)"
   ],
   "topics": [
    {
     "module": "M07",
     "index": 2
    }
   ],
   "source": [
    "M07 L974-977",
    "M07 L1002-1005",
    "M07 L1094",
    "M08 L993-999"
   ]
  },
  {
   "id": "p-m08-1",
   "modules": [
    "M08"
   ],
   "likelihood": "สูง",
   "depth": "พื้นฐาน",
   "why": "การเลือกบริการ container ของ AWS (ECS / EKS / ECR / Beanstalk / Fargate vs EC2) เป็นแกนของ M08 และตรงกับ sample question ท้ายโมดูล โจทย์ scenario จึงมักให้จับคู่ตามเงื่อนไขทีม",
   "prompt": "บริษัท 'ลานนา เดลิเวอรี' มี 4 ทีมที่ต้องการรันแอปบน container บน AWS\nทีม A: นักพัฒนา 3 คน ไม่เคยใช้ container และ AWS มาก่อน อยากเริ่มเร็วเพื่อทดลองในสัปดาห์นี้\nทีม B: ใช้ Kubernetes บน data center เดิมอยู่แล้ว ต้องการย้ายมา AWS โดยยังใช้ Kubernetes ต่อ\nทีม C: API สั่งอาหารที่ traffic แกว่งมากตามแคมเปญ (บางวันเพิ่มเป็น 10 เท่า) กับ batch ที่รันตามเวลา ไม่อยากดูแลระบบปฏิบัติการของเครื่องใน cluster\nทีม D: ระบบการเงินที่ใช้ resource คงที่ล่วงหน้าคาดการณ์ได้ อยากซื้อ reserved instances และมีข้อกำหนด compliance ขององค์กร\nและทุกทีมต้องเก็บ Docker image ไว้ที่เดียวอย่างปลอดภัย ให้เลือกบริการของแต่ละทีมพร้อมเหตุผล และบอกว่าบริการใดใช้เก็บ image",
   "hints": [
    "คำสำคัญ: 'ไม่เคยใช้ / เริ่มเร็ว', 'ใช้ Kubernetes อยู่แล้ว', 'แกว่ง + batch + ไม่ดูแล OS', 'resource คงที่ + reserved + compliance', 'เก็บ image ปลอดภัย'",
    "เกี่ยวกับ: Elastic Beanstalk, Amazon EKS, Amazon ECS ทั้ง Fargate และ EC2 launch type, Amazon ECR",
    "โครงคำตอบ: ทีมละ 1 ข้อ (บริการ + เหตุผลโยงเงื่อนไข) + ทางเลือกที่ตัดทิ้งสั้น ๆ + ข้อสุดท้ายเรื่อง registry"
   ],
   "modelAnswer": "ทีม A: Elastic Beanstalk (multicontainer Docker) เพราะเริ่มได้ด้วยการเขียน Dockerrun.aws.json + zip โค้ด เลือก platform แล้ว launch โดยไม่ต้องตั้งรายละเอียดของ ECS เอง (task definition, cluster, VPC, IAM) ตัดทิ้ง ECS/EC2 ตรง ๆ เพราะต้องตั้งค่าเยอะเกินสำหรับทีมใหม่\nทีม B: Amazon EKS เพราะเป็น managed Kubernetes ที่ conformant และ compatible กับ Kubernetes ทำให้ย้ายแอปเดิมมาโดยแทบไม่เปลี่ยนวิธีทำงาน worker node รันบน EC2 หรือ Fargate ได้ ตัดทิ้ง ECS เพราะเป็น orchestrator ของ AWS เอง ไม่ใช่ Kubernetes\nทีม C: Amazon ECS บน Fargate launch type เพราะ AWS ดูแลชั้น VM / guest OS ให้ เราดูแลเฉพาะ container และสไลด์ระบุว่า Fargate เหมาะกับ service ที่ demand แกว่ง และ batch ที่รันตามเวลา ตัดทิ้ง EC2 launch type เพราะเราต้องจัดการ Docker engine / guest OS เอง\nทีม D: Amazon ECS บน EC2 launch type เพราะ resource คาดการณ์ได้ ใช้ reserved instances ลดต้นทุนได้ และตอบข้อกำหนด compliance ขององค์กรที่ต้องคุมเครื่องเอง ตัดทิ้ง Fargate เพราะจุดแข็งของมันคือ demand แกว่ง ไม่ใช่ workload คงที่ที่ต้องการคุมโครงสร้างพื้นฐาน\nเก็บ image: Amazon ECR เป็น fully managed container registry มี encryption at rest และเชื่อม IAM รวมทั้งทำงานร่วมกับ ECS และ Docker CLI ได้ (ECR เก็บ image อย่างเดียว ไม่ได้รัน container)",
   "rubric": [
    "ทีม A ตอบ Elastic Beanstalk (multicontainer Docker) พร้อมเหตุผลเรื่องไม่ต้องตั้งค่า ECS เอง",
    "ทีม B ตอบ Amazon EKS เพราะใช้ Kubernetes อยู่แล้ว (conformant / compatible)",
    "ทีม C ตอบ ECS on Fargate และอธิบายว่า AWS จัดการ guest OS / infrastructure ให้ เหมาะกับ demand แกว่งและ batch ตามเวลา",
    "ทีม D ตอบ ECS on EC2 โดยโยงกับ reserved instances / workload คาดการณ์ได้ / compliance",
    "ระบุ Amazon ECR เป็นที่เก็บ image และบอกว่าไม่ได้ทำหน้าที่รัน container",
    "ให้เหตุผลตัดทางเลือกอื่นอย่างน้อย 2 ทีม ไม่ใช่แค่ชื่อบริการ"
   ],
   "topics": [
    {
     "module": "M08",
     "index": 10
    },
    {
     "module": "M08",
     "index": 9
    }
   ],
   "source": [
    "M08 L912-928",
    "M08 L937-957",
    "M08 L973-1009",
    "M08 L1051-1100",
    "M08 L1252-1272",
    "M08 L1721-1763"
   ]
  },
  {
   "id": "p-m08-2",
   "modules": [
    "M08"
   ],
   "likelihood": "กลาง",
   "depth": "ลึก",
   "why": "อาจารย์ใช้ AWS จริง จึงมีโอกาสให้เขียนลำดับ workflow Docker -> ECR -> ECS ตั้งแต่ Dockerfile ถึงรัน service และอธิบายแนวคิด layer / image / container ให้ถูก",
   "prompt": "ทีมพัฒนาของร้าน 'ครัวเที่ยง' มี Node.js app ของระบบสต็อกวัตถุดิบ และต้องการนำขึ้นรันบน AWS ด้วย container ให้ได้ service ที่คงจำนวน instance ที่ต้องการไว้เสมอ\n(1) อธิบายขั้นตอนตั้งแต่เขียน Dockerfile จนส่ง image ขึ้น Amazon ECR (ระบุคำสั่ง / ขั้นหลักตามลำดับ) และอธิบายว่าทำไม image ที่ build จาก Dockerfile 4 บรรทัด (FROM, RUN, EXPOSE, ADD) จึงมีหลาย layer แล้ว container ต่างจาก image อย่างไร\n(2) จากนั้นต้องทำอะไรบน Amazon ECS บ้างจึงได้ service ที่รัน task จำนวนคงที่\n(3) ทีมเดิมรัน MySQL ไว้ใน container เดียวกับแอป เพื่อนบอกว่าไม่ปลอดภัยกับข้อมูล ให้อธิบายความเสี่ยงและเสนอทางเลือกที่เหมาะกว่า",
   "hints": [
    "คำสำคัญ: 'Dockerfile -> image -> registry', 'หลาย layer', 'image vs container', 'service ที่คงจำนวน task', 'MySQL ใน container ไม่ปลอดภัยกับข้อมูล'",
    "เกี่ยวกับ: docker build / docker tag / aws ecr get-login-password | docker login / docker push, read-only image layer กับ thin read/write container layer, ECS task definition / cluster / service, Aurora Serverless",
    "โครงคำตอบ: 1) ขั้น ECR ตามลำดับ 2) layer + image vs container 3) 3 ขั้นของ ECS 4) ความเสี่ยง DB ใน container + ทางเลือก"
   ],
   "modelAnswer": "(1) ลำดับ: สร้าง repository ด้วย aws ecr create-repository -> docker build -t <ชื่อ> . ให้ได้ image -> docker tag ให้ชื่อ image ตรงกับ URI ของ ECR -> ยืนยันตัวตนด้วย aws ecr get-login-password | docker login (หรือใช้ credential helper) -> docker push ขึ้น ECR\nทำไมมีหลาย layer: ทุกบรรทัดคำสั่งใน Dockerfile สร้าง read-only layer ซ้อนต่อกัน เช่น 1 FROM base image, 2 RUN ติดตั้งแพ็กเกจ, 3 EXPOSE, 4 ADD / RUN chmod image จึงเป็น read-only template ส่วน container คือ instance ที่รันได้ของ image และมี container layer บางชั้นแบบอ่าน/เขียนเพิ่มบนสุดไว้ให้ทำการเปลี่ยนแปลงขณะรัน\n(2) บน ECS: 1) สร้าง task definition 2) สร้างและตั้งค่า cluster (EC2 instances, VPC settings, IAM role) 3) สร้าง service เพื่อรันและคงจำนวน task instance ตามที่กำหนด (ถ้าเลือก Fargate ไม่ต้องดูแลเครื่อง EC2 เอง)\n(3) ความเสี่ยง: container ออกแบบให้เป็นของที่ทิ้งและแทนที่ได้ (disposable) และข้อมูลที่เขียนลง container layer ผูกกับ container ตัวนั้น เมื่อ container ถูกแทนที่ ข้อมูลอาจหายหากไม่ได้เก็บไว้ที่อื่น (ประเด็นนี้เป็นการอนุมานจากหลัก disposable ไม่ได้ระบุตรงในสไลด์) ทั้งยังต้องดูแลฐานข้อมูลเองและ scale ยาก ทางเลือกที่ตามสไลด์: ย้ายฐานข้อมูลไป Amazon Aurora Serverless ซึ่งเป็น managed database (MySQL-compatible) ลดงานดูแลและ scale อัตโนมัติ ตามที่ Lab 8.2 ทำ ทางเลือกที่ตัดทิ้ง: คงไว้ใน container ต่อไป เพราะยังต้องดูแลเองทั้งหมด",
   "rubric": [
    "เรียงขั้นตอน ECR ถูก: create-repository, build, tag, login (get-login-password), push",
    "อธิบายว่าแต่ละบรรทัดใน Dockerfile สร้าง read-only layer และ image เป็น read-only template",
    "แยก image กับ container ได้: container คือ runnable instance ที่มี thin read/write layer",
    "ระบุ 3 ขั้นของ ECS: task definition, cluster (EC2/VPC/IAM), service ที่คงจำนวน task",
    "อธิบายความเสี่ยงของ DB ใน container ได้สมเหตุสมผล (ข้อมูลผูกกับ container ที่ disposable ภาระดูแลเอง)",
    "เสนอ Aurora Serverless (managed DB) เป็นทางเลือก พร้อมประโยชน์ (ลดภาระดูแล scale อัตโนมัติ)"
   ],
   "topics": [
    {
     "module": "M08",
     "index": 3
    },
    {
     "module": "M08",
     "index": 8
    },
    {
     "module": "M08",
     "index": 17
    }
   ],
   "source": [
    "M08 L335-343",
    "M08 L430-460",
    "M08 L833",
    "M08 L1022-1042",
    "M08 L1252-1272",
    "M08 L1546-1554",
    "M08 L1563-1577"
   ],
   "supplement": true
  },
  {
   "id": "p-m09-1",
   "modules": [
    "M09"
   ],
   "likelihood": "สูง",
   "depth": "พื้นฐาน",
   "why": "ภาพรวม 'cache ได้ทุกชั้น' กับ 4 คำถามว่าควร cache ไหม เป็นฐานของทั้งโมดูล และเหมาะกับโจทย์ให้เลือกชั้น cache ให้ตรงข้อมูลแต่ละประเภท",
   "prompt": "ระบบสั่งอาหาร 'ครัวเที่ยง' มีผู้ใช้ทั่วประเทศ ช่วงเที่ยงมีผู้ใช้พร้อมกันหลักพัน ปัญหาคือหน้าเว็บโหลดช้า สมมติว่า query เมนูยอดนิยมจากฐานข้อมูลใช้เวลาประมาณ 800 ms และถูกเรียกซ้ำเกือบทุก request ให้ออกแบบว่าข้อมูลต่อไปนี้ควร cache ที่ชั้นไหน ด้วยบริการอะไร\n(ก) รูปเมนูและไฟล์ JavaScript/CSS ที่แทบไม่เปลี่ยน\n(ข) ผลลัพธ์ของ REST API ราคาโปรโมชันที่ถูกเรียกซ้ำบ่อยผ่าน API Gateway\n(ค) ผล query รายการเมนูยอดนิยมจากฐานข้อมูล\n(ง) session ของผู้ใช้ที่ login\nและอธิบายว่าก่อนจะ cache ข้อมูลหนึ่ง ๆ ควรถามตัวเองด้วยคำถามอะไรบ้าง รวมถึงข้อเสียที่ต้องยอมรับ",
   "hints": [
    "คำสำคัญ: 'ข้อมูลแทบไม่เปลี่ยน', 'API ถูกเรียกซ้ำ', 'query 800 ms ซ้ำเกือบทุก request', 'session', 'cache ทุกชั้น'",
    "เกี่ยวกับ: browser caching (Cache-Control headers), Amazon CloudFront, API Gateway cache, Amazon ElastiCache (database query caching, web session management)",
    "โครงคำตอบ: ตารางจับคู่ (ก)-(ง) -> ชั้น cache + เหตุผล / 4 คำถามก่อนตัดสินใจ / ข้อเสีย (stale data, ความซับซ้อน, ค่าใช้จ่าย)"
   ],
   "modelAnswer": "(ก) รูปและไฟล์ static: cache ที่ browser ด้วย HTTP Cache-Control headers และที่ edge ด้วย Amazon CloudFront ผู้ใช้ทั่วประเทศจะได้ไฟล์จาก edge location ใกล้ตัวและ origin ไม่ต้องรับทุก request\n(ข) ผล REST API ที่เรียกซ้ำ: เปิด API Gateway cache เพื่อตอบจาก cache แทนการเรียก backend ทุกครั้ง\n(ค) ผล query เมนูยอดนิยม: ใช้ Amazon ElastiCache (in-memory key-value store ตอบระดับ submillisecond) คั่นระหว่างแอปกับฐานข้อมูล เพื่อลดการ query ซ้ำ 800 ms และลดภาระ DB ซึ่งเป็น read-heavy workload โดยตรง\n(ง) session: ElastiCache ก็รองรับ web session management\nคำถามก่อนตัดสินใจ cache: 1) ข้อมูลช้าและ query แพง (หรือสร้างยาก) ไหม 2) ถูกเรียกบ่อยและค่อนข้างคงที่ไหม 3) ข้อมูลยอมให้ stale (ล้าสมัย) ได้ไหม 4) คุ้มกับงานพัฒนาที่ต้องเพิ่มและต้นทุนที่สูงขึ้นหรือไม่ ข้อเสียที่ต้องยอมรับคือ ข้อมูลใน cache อาจเก่ากว่า origin จนกว่า TTL จะหมด และมี cache miss penalty (ต้องไปอ่าน DB แล้วอัปเดต cache) ทางเลือกที่ตัดทิ้ง: ไม่ควร cache ข้อมูลที่ต้องเป็นปัจจุบันทุกวินาที หรือข้อมูลที่ถูกอ่านน้อยจนไม่คุ้ม",
   "rubric": [
    "จับคู่ชั้น cache ถูก: static -> browser + CloudFront, API response -> API Gateway cache, DB query -> ElastiCache",
    "ระบุว่า ElastiCache รองรับทั้ง database query caching และ web session management",
    "ยกคำถาม 4 ข้อก่อน cache ครบ: ช้า/แพง, เข้าถึงบ่อยและค่อนข้างคงที่, ยอม stale ได้ไหม, คุ้มความซับซ้อน/ค่าใช้จ่ายไหม",
    "กล่าวถึงข้อเสียหรือข้อควรระวังอย่างน้อยหนึ่งอย่าง เช่น stale data, TTL, cache miss penalty",
    "เชื่อมเหตุผลกับตัวเลขในโจทย์ (800 ms ซ้ำเกือบทุก request, ผู้ใช้หลักพันพร้อมกัน)"
   ],
   "topics": [
    {
     "module": "M09",
     "index": 1
    },
    {
     "module": "M09",
     "index": 2
    }
   ],
   "source": [
    "M09 L133-141",
    "M09 L149-157",
    "M09 L213-240",
    "M09 L268-286",
    "M09 L404-413"
   ]
  },
  {
   "id": "p-m09-2",
   "modules": [
    "M09"
   ],
   "likelihood": "กลาง",
   "depth": "ลึก",
   "why": "CloudFront มีรายละเอียดที่ออกเป็นข้อวิเคราะห์ได้ลึก (cache key, TTL / expiration, edge function) และอาจารย์ใช้ AWS จริงจึงอาจให้แก้ปัญหา hit ratio ต่ำ + การอัปเดตไฟล์",
   "prompt": "เว็บข่าวของ 'ครัวเที่ยง' อยู่บน S3 ผ่าน Amazon CloudFront ทีมพบ 3 ปัญหา\n1) cache hit ต่ำ ทั้งที่หน้าเดียวกัน ทีมเปิดให้ cache key รวม query string, cookie และ header ทั้งหมด ผู้ใช้ที่เปิด URL path เดียวกันแต่ติด ref=... คนละค่าและมี session cookie คนละค่าจึงไม่ใช้ cache ร่วมกัน\n2) แบนเนอร์ banner.jpg ถูกเปลี่ยนแล้ว แต่ผู้ใช้ยังเห็นรูปเก่าเกือบทั้งวัน\n3) ต้องการ (ก) redirect ผู้ใช้จากหน้าแรกไปหน้าภาษาตามที่ตั้ง แบบเบา ๆ ที่ viewer request และ (ข) เลือก origin ตามประเทศของผู้ชมด้วยตรรกะที่ซับซ้อนที่ origin request\nให้อธิบายสาเหตุและวิธีแก้แต่ละข้อ รวมถึงเลือกระหว่าง Lambda@Edge กับ CloudFront Functions สำหรับ (ก) และ (ข) พร้อมเหตุผล",
   "hints": [
    "คำสำคัญ: 'cache key รวม query string/cookie/header', 'รูปเก่าเกือบทั้งวัน' (default 24 ชั่วโมง), 'viewer request เบา ๆ', 'origin request ซับซ้อน'",
    "เกี่ยวกับ: default cache key (domain + URL path), cache policy (Min / Max / Default TTL), Cache-Control / Expires headers, 304 Not Modified, Lambda@Edge vs CloudFront Functions",
    "โครงคำตอบ: ข้อ 1 สาเหตุ + ปรับ cache key / ข้อ 2 สาเหตุ + ปรับ TTL หรือ header / ข้อ 3 ตารางเลือก (ก)(ข) พร้อมข้อจำกัดของแต่ละตัว"
   ],
   "modelAnswer": "ข้อ 1: cache key คือตัวแยกว่า request ไหนใช้ object ใน cache ร่วมกันได้ ค่าที่ใส่ใน cache key ยิ่งมากยิ่งแตกเป็นหลาย entry และค่าเหล่านั้นถูกส่งไป origin ด้วย ค่า default ของ CloudFront คือ domain name + URL path เท่านั้น (ไม่รวม query string, cookie, header) ซึ่งสไลด์ใช้ยกตัวอย่างว่า request ที่ต่างกันที่ ref, session cookie และ User-Agent ยัง hit cache เดียวกัน ทางแก้: กำหนด cache policy ให้ใส่เฉพาะค่าที่ทำให้เนื้อหาต่างกันจริง (ตัด ref และ session cookie ออก)\nข้อ 2: ค่า default ที่ object อยู่ใน cache คือ 24 ชั่วโมง ถ้ายังไม่ถึงเวลา CloudFront จะตอบจาก cache เมื่อหมดอายุจึงไปเช็คกับ origin (ถ้าไม่เปลี่ยน ตอบ 304 Not Modified ไม่งั้นส่งเวอร์ชันใหม่) ทางแก้: ปรับ TTL (Minimum / Maximum / Default TTL ใน cache policy) ให้สั้นลง หรือให้ origin ส่ง Cache-Control / Expires ใน response header ซึ่งกำหนดอายุรายไฟล์หรือทั้ง path pattern ได้ ข้อแลกเปลี่ยนคือ TTL สั้นลงทำให้ origin ถูกเรียกบ่อยขึ้น\nข้อ 3 (ก): ใช้ CloudFront Functions เพราะเป็นงานเบา สั้น ทำงานที่ viewer request/response (ภาษา JavaScript, sub-millisecond, 2 MB memory, 10 KB function size) สไลด์ยกตัวอย่าง redirect 302 Found ด้วย function ชนิดนี้\n(ข) ใช้ Lambda@Edge เพราะรองรับ origin request/response ซึ่ง CloudFront Functions ทำไม่ได้ และรองรับตรรกะที่ซับซ้อน (Node.js หรือ Python, duration/memory/size สูงกว่า) สไลด์ยกตัวอย่างเปลี่ยน origin ตามประเทศ (GB, DE, IE)\nทางเลือกที่ตัดทิ้ง: ใช้ Lambda@Edge ทำงาน redirect เบา ๆ ได้แต่เกินความจำเป็นสำหรับงานแค่ header/redirect; ใช้ CloudFront Functions เลือก origin ตามประเทศไม่ได้เพราะไม่มี origin event",
   "rubric": [
    "ระบุ default cache key = domain name + URL path (ไม่รวม query string, cookie, header) และอธิบายว่ายิ่งใส่ค่ามาก hit ยิ่งต่ำ",
    "เสนอให้ใส่เฉพาะค่าที่ทำให้เนื้อหาต่างจริงใน cache key/cache policy",
    "ระบุ default การเก็บ cache 24 ชั่วโมง และวิธีปรับ: TTL (Min/Max/Default) หรือ Cache-Control / Expires ที่ origin",
    "อธิบายกระบวนการหมดอายุ: ถึงเวลาแล้วเช็ค origin ได้ 304 Not Modified ถ้าไม่เปลี่ยน",
    "เลือก CloudFront Functions สำหรับ (ก) และ Lambda@Edge สำหรับ (ข) พร้อมเหตุผลเรื่อง event source (viewer-only vs origin events) และความซับซ้อน",
    "กล่าวข้อจำกัดของ CloudFront Functions (JavaScript, sub-millisecond, 2 MB, 10 KB) ได้ถูกต้อง"
   ],
   "topics": [
    {
     "module": "M09",
     "index": 10
    },
    {
     "module": "M09",
     "index": 11
    },
    {
     "module": "M09",
     "index": 13
    }
   ],
   "source": [
    "M09 L677-741",
    "M09 L721-762",
    "M09 L750-752",
    "M09 L832-857",
    "M09 L899",
    "M09 L934-948"
   ]
  },
  {
   "id": "p-m10-1",
   "modules": [
    "M10"
   ],
   "likelihood": "สูง",
   "depth": "พื้นฐาน",
   "why": "SQS decoupling + visibility timeout + DLQ เป็นแกนของ M10 และออกเป็น scenario งานหนักช่วง spike ได้ง่ายที่สุด",
   "prompt": "แอปสั่งอาหารออนไลน์แห่งหนึ่งมี traffic พุ่งสูงช่วงเที่ยง ร้านค้าอัปโหลดรูปอาหารเข้า S3 และระบบต้องประมวลผลรูปแต่ละรูป (resize + ใส่ลายน้ำ) ซึ่งใช้เวลารูปละประมาณ 20 นาที ทีมมี worker เป็น EC2 instance ใน Auto Scaling group ข้อกำหนดคือ (1) หน้าเว็บต้องไม่รอผลประมวลผล (2) ถ้า worker ตัวใดล้มกลางทางงานต้องไม่หาย (3) ห้าม worker สองตัวหยิบรูปเดียวกันไปทำซ้อนกันขณะที่ตัวแรกยังทำอยู่ (4) รูปเสียบางไฟล์ทำให้ประมวลผลล้มทุกครั้ง ต้องแยกออกไปตรวจโดยไม่ขวางรูปอื่น (5) ลำดับของรูปไม่สำคัญ ต้องการ throughput สูง จงออกแบบ flow ด้วย messaging service พร้อมระบุค่าตั้งที่ต้องปรับและอธิบายเหตุผล รวมทั้งบอกว่าทำไมไม่เลือกแนวทางอื่น",
   "hints": [
    "① คำสำคัญ: หน้าเว็บไม่รอ (asynchronous / decoupling), งาน 20 นาที (เทียบกับ visibility timeout default), ห้ามทำซ้อน, ล้มกลางทางไม่หาย, รูปเสีย แยกออก, ลำดับไม่สำคัญ + throughput สูง",
    "② service/feature: SQS Standard queue, ReceiveMessage/DeleteMessage, visibility timeout, dead-letter queue (maxReceiveCount), long polling; เทียบกับ SQS FIFO, SNS, Kinesis Data Streams",
    "③ โครงคำตอบ: 1) วาด flow S3 -> SQS -> workers 2) เลือกชนิดคิวพร้อมเหตุผล 3) ปรับ visibility timeout ให้มากกว่าเวลาประมวลผลจริง 4) เปิด DLQ สำหรับรูปเสีย 5) ลบข้อความหลังทำเสร็จเท่านั้น 6) ตัดตัวเลือกอื่นพร้อมเหตุผล"
   ],
   "modelAnswer": "Flow: ผู้ใช้อัปโหลดรูปลง S3 -> ส่งข้อความที่ระบุรูปนั้นเข้า SQS queue -> worker ใน Auto Scaling group เรียก ReceiveMessage (ตั้ง long polling เพื่อลดการได้ผลว่างและให้ query ทุก server) -> ประมวลผลรูป -> เขียนผลกลับ S3 -> เรียก DeleteMessage ด้วย ReceiptHandle เมื่อสำเร็จเท่านั้น. เหตุผลแต่ละข้อ: (1) ใช้ queue คั่นกลาง หน้าเว็บแค่ส่งข้อความแล้วตอบกลับทันที ลดการพึ่งพากันแบบ synchronous. ช่วง spike เที่ยง คิวทำหน้าที่เป็น buffer และ Auto Scaling เพิ่ม worker ตามความยาวคิวได้. (2) SQS เก็บข้อความซ้ำซ้อนหลาย server และข้อความจะไม่ถูกลบจนกว่า consumer จะเรียก DeleteMessage ถ้า worker ล้ม ข้อความกลับมาให้ตัวอื่นรับต่อ. (3) ขณะ receive SQS ซ่อนข้อความจาก consumer อื่นตาม visibility timeout ซึ่ง default คือ 30 วินาที สั้นกว่างาน 20 นาทีมาก ถ้าไม่ปรับ ข้อความจะโผล่กลับมาแล้ว worker ตัวอื่นหยิบไปทำซ้อน จึงต้องตั้ง visibility timeout ให้ยาวกว่าเวลาประมวลผลจริงของรูปหนึ่งรูป (เช่นเผื่อเป็นราว 25 นาทีแล้วแต่ทีมเลือก). (4) ตั้ง dead-letter queue พร้อม maxReceiveCount เมื่อข้อความถูกรับแล้วล้มเกินจำนวนครั้งที่กำหนด SQS ย้ายไป DLQ ให้ทีมตรวจแยกต่างหาก ไม่วนขวางรูปอื่น. (5) เลือก Standard queue เพราะ throughput แทบไม่จำกัดและลำดับไม่สำคัญ (use case ตรงกับ 'ให้ผู้ใช้อัปโหลดสื่อขณะ resize/encode') ข้อแลกเปลี่ยนคือ at-least-once อาจส่งซ้ำ จึงควรให้ worker ทำงานแบบ idempotent. ทางเลือกที่ตัดทิ้ง: FIFO ให้ลำดับและ exactly-once แต่ throughput จำกัดกว่า ซึ่งไม่จำเป็นเมื่อลำดับไม่สำคัญ; SNS อย่างเดียวเป็น push ไปยัง subscriber ไม่ได้เก็บให้ worker ดึงไปทำตามจังหวะตัวเอง (ใช้ได้ถ้าจะ fanout เข้าหลายคิว); Kinesis Data Streams เหมาะกับข้อมูลต่อเนื่องที่เอาไปรวมวิเคราะห์ และไม่ลบข้อความหลังประมวลผล ขณะที่งานนี้คุณค่าอยู่ที่แต่ละข้อความ; เรียก worker แบบ synchronous จากหน้าเว็บจะทำให้เว็บช้าและพึ่งพากันแน่น.",
   "rubric": [
    "เสนอ queue (SQS) คั่นกลางให้หน้าเว็บตอบทันที อธิบายว่า decouple และเป็น buffer ช่วง spike",
    "ระบุว่า default visibility timeout คือ 30 วินาที สั้นกว่างาน 20 นาที ต้องปรับให้ยาวกว่าเวลาประมวลผล เพื่อกัน worker ตัวอื่นหยิบซ้ำ",
    "อธิบายว่าต้องเรียก DeleteMessage หลังทำสำเร็จเท่านั้น ถ้า worker ล้มข้อความกลับมาให้ตัวอื่นรับได้ (งานไม่หาย)",
    "ใช้ DLQ + maxReceiveCount แยกรูปเสีย ไม่ขวางข้อความอื่น",
    "เลือก Standard queue เพราะลำดับไม่สำคัญและต้องการ throughput สูง พร้อมบอกข้อแลกเปลี่ยน (อาจซ้ำ) และตัดทิ้ง FIFO",
    "บอกได้ว่าทำไมไม่ใช้ Kinesis Data Streams หรือ SNS อย่างเดียว"
   ],
   "topics": [
    {
     "module": "M10",
     "index": 2
    },
    {
     "module": "M10",
     "index": 1
    }
   ],
   "source": [
    "M10 L126-164",
    "M10 L325-343",
    "M10 L354-366",
    "M10 L438-468",
    "M10 L470-515",
    "M10 L1303-1308"
   ]
  },
  {
   "id": "p-m10-2",
   "modules": [
    "M10"
   ],
   "likelihood": "กลาง",
   "depth": "ลึก",
   "why": "SNS fanout + filter policy + FIFO topic + DLQ เป็นหัวข้อรวมหลายกลไกที่อาจารย์ใช้ออกข้อเชิงออกแบบได้",
   "prompt": "แพลตฟอร์ม e-commerce ของบริษัทหนึ่ง publish event หลายชนิดเข้า SNS topic (order_placed, order_cancelled, product_page_visited) ผู้รับมี 4 ราย: (ก) ระบบ Payment ต้องการเฉพาะ event ที่ชื่อขึ้นต้นด้วย order และต้องประมวลผลตามลำดับที่เกิดขึ้น ห้ามซ้ำ (ข) ระบบ Search index ต้องการเฉพาะ product_page_visited (ค) ระบบ Data warehouse ต้องการทุก event แต่ประมวลผลช้าและบางช่วงปิดปรับปรุง ห้ามพลาด event (ง) เจ้าของร้านต้องการอีเมลแจ้งเตือนเมื่อมี order ใหม่ ฝั่ง publisher ไม่ต้องการรู้จักผู้รับแต่ละราย จงเสนอสถาปัตยกรรมด้วย SNS/SQS พร้อมเหตุผลของแต่ละรายและวิธีรับมือกรณีส่งไม่สำเร็จ",
   "hints": [
    "① คำสำคัญ: หลายผู้รับ publisher ไม่รู้จักผู้รับ (fanout), เฉพาะ event บางแบบ (filter), ตามลำดับ + ห้ามซ้ำ, ปิดปรับปรุงห้ามพลาด (ต้องมี buffer), อีเมล (A2P)",
    "② service/feature: SNS topic, subscription filter policy + message attributes (prefix match), FIFO topic + FIFO SQS queue, SQS queue เป็น subscriber, SNS delivery retry + dead-letter queue, email endpoint",
    "③ โครงคำตอบ: 1) topic กลาง + publisher ใส่ MessageAttributes event_type 2) ผู้รับแต่ละรายใช้ filter อะไร/endpoint ชนิดไหน 3) ส่วนที่ต้องเรียงลำดับใช้ FIFO 4) ส่วนที่ต้องกันพลาดใช้ SQS คั่น 5) failure handling 6) ข้อแลกเปลี่ยน"
   ],
   "modelAnswer": "แนวคิด: publisher ส่ง event ไปที่ SNS topic เดียวพร้อมใส่ MessageAttributes (เช่น event_type) เพื่อให้ subscriber แต่ละรายกรองเองด้วย subscription filter policy โดย publisher ไม่ต้องรู้ปลายทาง (pub/sub แบบ many-to-many). รายผู้รับ: (ก) Payment: subscribe ด้วย SQS queue และตั้ง filter policy แบบ prefix เช่น event_type ขึ้นต้นด้วย order จะได้ทั้ง order_placed และ order_cancelled แต่ไม่ได้ product_page_visited. ข้อกำหนดเรื่องลำดับและห้ามซ้ำต้องใช้ FIFO: SNS มี FIFO topic ที่ทำงานคู่กับ FIFO SQS queue เพื่อรักษาลำดับ (ข้อแลกเปลี่ยนคือ throughput จำกัดกว่า Standard จึงควรใช้เฉพาะเส้นทางที่จำเป็น เช่นแยก topic สำหรับ order events แทนการบังคับให้ทุก event ไปทางนี้). (ข) Search index: subscribe ด้วย Lambda function (A2A endpoint) พร้อม filter event_type = product_page_visited. (ค) Data warehouse: subscribe ด้วย SQS queue (ไม่ใส่ filter หรือกรองให้ครบ) เพราะคิวเก็บข้อความไว้ให้ consumer ดึงตามจังหวะของตัวเอง ช่วงปิดปรับปรุงข้อความไม่หาย ซึ่งเป็นรูปแบบ SNS fanout เข้า SQS. (ง) เจ้าของร้าน: subscribe ด้วย email endpoint (A2P) และ filter ให้ได้เฉพาะ order_placed; ต้อง ConfirmSubscription ก่อนจึงได้รับ. การรับมือเมื่อส่งไม่สำเร็จ: SNS มี delivery retry ตาม delivery policy เมื่อ retry หมดแล้วทิ้งหรือส่งเข้า dead-letter queue ได้ และฝั่ง SQS แต่ละคิวตั้ง DLQ + maxReceiveCount สำหรับข้อความที่ consumer ประมวลผลล้มเหลวซ้ำ. ทางเลือกที่ตัดทิ้ง: ให้ publisher เรียกแต่ละระบบโดยตรง (พึ่งพากันแน่นและต้องรู้ปลายทาง), ใช้ SQS อย่างเดียว (หนึ่งข้อความถูก consumer รายเดียวลบไป ส่งหลายระบบไม่ได้), ให้ทุก subscriber รับทุก event แล้วกรองเองในโค้ด (เปลือง traffic และ logic กระจัดกระจาย).",
   "rubric": [
    "ระบุ SNS topic เดียว + subscription filter policy กับ MessageAttributes และใช้ prefix match สำหรับ event ที่ขึ้นต้นด้วย order",
    "ใช้ SNS fanout เข้า SQS สำหรับผู้รับที่ช้า/ปิดปรับปรุงได้ เพื่อกันข้อความหาย",
    "จัดการข้อกำหนดลำดับ + ห้ามซ้ำของ Payment ด้วย FIFO topic คู่กับ FIFO SQS queue และบอกข้อแลกเปลี่ยนเรื่อง throughput",
    "เลือก endpoint ถูกชนิด: SQS/Lambda (A2A) และ email (A2P) พร้อมกล่าวถึงการ confirm subscription",
    "อธิบาย failure handling: SNS delivery retry + DLQ และ DLQ ของ SQS",
    "ตัดทางเลือกอื่น (เรียกตรง, SQS อย่างเดียว) พร้อมเหตุผล"
   ],
   "topics": [
    {
     "module": "M10",
     "index": 3
    }
   ],
   "source": [
    "M10 L788-806",
    "M10 L822",
    "M10 L831-858",
    "M10 L872-885",
    "M10 L892-898",
    "M10 L909-993"
   ]
  },
  {
   "id": "p-m11-1",
   "modules": [
    "M11"
   ],
   "likelihood": "สูง",
   "depth": "พื้นฐาน",
   "why": "Standard vs Express มีตัวเลขเทียบชัดในสไลด์ (2,000/s vs 100,000/s, 1 ปี vs 5 นาที) ออกเป็นโจทย์เลือกประเภท workflow ได้ตรง ๆ",
   "prompt": "บริษัท fintech ต้องออกแบบ workflow ด้วย AWS Step Functions สองงาน งาน A: ขั้นตอนอนุมัติสินเชื่อที่ต้องรอเอกสารจากลูกค้าและรอผู้จัดการกดอนุมัติ อาจใช้เวลาหลายสัปดาห์ ต้องไม่ทำขั้นตอนซ้ำโดยไม่ตั้งใจ และผู้ตรวจสอบต้องย้อนดูประวัติได้ งาน B: รับ event การชำระเงินเข้ามาประมาณ 60,000 ครั้งต่อวินาที แต่ละ event ประมวลผลเสร็จภายในไม่กี่วินาที ต้องการค่าใช้จ่ายตามจำนวนและระยะเวลาของ request จงเลือกประเภท workflow ให้แต่ละงานพร้อมเหตุผลโดยอ้างตัวเลข และอธิบายวิธีทำขั้นตอนรอผู้จัดการอนุมัติของงาน A",
   "hints": [
    "① คำสำคัญ: หลายสัปดาห์ (เทียบ 1 ปี / 5 นาที), ไม่ทำซ้ำ + ตรวจย้อนได้ (exactly-once, auditable), 60,000 ครั้ง/วินาที (เทียบ invocation rate), ราคาตามจำนวนและระยะเวลา request",
    "② service/feature: Standard workflow, Express workflow, invocation rate / transition rate, pricing model, Activity + taskToken + SendTaskSuccess/SendTaskFailure",
    "③ โครงคำตอบ: 1) งาน A เลือกอะไร อ้าง limit 2) งาน B เลือกอะไร อ้าง limit 3) ทำไมสลับกันไม่ได้ 4) ขั้นอนุมัติใช้ Activity อย่างไร 5) ข้อแลกเปลี่ยนด้านราคา"
   ],
   "modelAnswer": "งาน A เลือก Standard workflow: รันได้นานถึง 1 ปี จึงรอได้หลายสัปดาห์ (Express รันได้แค่ 5 นาที), ใช้โมเดล exactly-once และไม่รันซ้ำเกินหนึ่งครั้งเว้นแต่กำหนด Retry ใน ASL ตรงกับข้อกำหนดห้ามทำซ้ำ, เหมาะกับ long-running และ auditable จึงตรวจย้อนได้, และรองรับ Step Functions activities ซึ่งจำเป็นต่อขั้นรอคน. ราคาคิดตามจำนวน state transition. งาน B เลือก Express workflow: invocation rate 100,000 ต่อวินาที เหนือ 60,000 ที่ต้องการ ส่วน Standard รับได้เพียง 2,000 ต่อวินาที จึงไม่พอ, transition rate เกือบไม่จำกัด (Standard 4,000 ต่อวินาที), แต่ละ event จบภายในไม่กี่วินาทีจึงอยู่ในเพดาน 5 นาที, และคิดเงินตามจำนวนและระยะเวลาของ request รวมทั้งหน่วยความจำที่ใช้ ตรงกับข้อกำหนดด้านต้นทุน. ข้อแลกเปลี่ยนของ Express: เป็นโมเดล at-least-once (async) หรือ at-most-once (sync) หนึ่ง invocation อาจรันมากกว่าหนึ่งครั้ง และไม่รองรับ activities จึงต้องออกแบบขั้นตอนให้ทนต่อการทำซ้ำ. ขั้นอนุมัติของงาน A: ใช้ Task state ที่ชี้ไปยัง Activity (ตั้ง TimeoutSeconds ให้เหมาะ) Step Functions จัดคิวงานและสร้าง taskToken, activity worker (แอปใดก็ได้ที่เชื่อม HTTP ได้) poll ด้วย GetActivityTask ได้ token, ส่งอีเมลหาผู้จัดการ (เช่นผ่าน SES พร้อมลิงก์ที่มี token ผ่าน API Gateway/Lambda), เมื่อกดอนุมัติเรียก SendTaskSuccess หรือ SendTaskFailure ให้ workflow เดินต่อหรือล้ม.",
   "rubric": [
    "เลือก Standard ให้งาน A โดยอ้าง 1 ปี (เทียบ 5 นาที) exactly-once และ auditable",
    "เลือก Express ให้งาน B โดยอ้าง 100,000 ต่อวินาที เทียบ Standard 2,000 ต่อวินาที และอยู่ในเพดาน 5 นาที",
    "อธิบายโมเดลราคาให้ตรง: Standard ต่อ state transition, Express ต่อจำนวนและระยะเวลา request (+ memory)",
    "บอกข้อแลกเปลี่ยนของ Express (at-least-once/at-most-once, อาจรันซ้ำ, ไม่รองรับ activities)",
    "อธิบายขั้นรอคนด้วย Activity: taskToken, GetActivityTask, SendTaskSuccess/SendTaskFailure"
   ],
   "topics": [
    {
     "module": "M11",
     "index": 3
    },
    {
     "module": "M11",
     "index": 4
    }
   ],
   "source": [
    "M11 L708-714",
    "M11 L732-742",
    "M11 L760-772",
    "M11 L830-880",
    "M11 L912-916"
   ]
  },
  {
   "id": "p-m11-2",
   "modules": [
    "M11"
   ],
   "likelihood": "กลาง",
   "depth": "ลึก",
   "why": "โจทย์ให้ออกแบบ state machine ที่ผสมหลาย state type (Choice/Parallel/Map/Wait/Fail) เป็นวิธีวัดว่าเข้าใจ 8 ชนิดจริง",
   "prompt": "ร้านค้าออนไลน์ใช้ Lambda หลายตัวเรียกต่อกันเอง ตอนนี้ไม่รู้ว่าออเดอร์ค้างที่ขั้นไหนและต้องเขียน retry เองทุกฟังก์ชัน ทีมจะย้ายมาใช้ Step Functions ลำดับงานของออเดอร์คือ: (1) ลูกค้ากดสั่งผ่าน API Gateway (2) ตรวจสอบ fraud และตรวจสต็อกพร้อมกัน เพราะสองงานไม่ขึ้นต่อกัน (3) ถ้ายอดเกินวงเงินที่ตั้งไว้ต้องไปขั้นอนุมัติพิเศษ ถ้าไม่เกินข้ามไป (4) ตัดสต็อกสินค้าทุกรายการในตะกร้า (จำนวนรายการไม่แน่นอน) ด้วยฟังก์ชันเดียวกัน (5) ขั้นเรียกระบบชำระเงินบางครั้งล้มชั่วคราว ต้อง retry (6) ถ้า fraud ไม่ผ่านต้องหยุดและบันทึกสาเหตุว่าล้มเหลว จงระบุ state type ที่ใช้ในแต่ละขั้นพร้อมเหตุผล และอธิบายว่า Step Functions แก้ปัญหาเดิมได้อย่างไร",
   "hints": [
    "① คำสำคัญ: พร้อมกัน/ไม่ขึ้นต่อกัน, ยอดเกินวงเงิน (ตัดสินใจจากข้อมูล), รายการไม่แน่นอน + ฟังก์ชันเดียวกัน, ล้มชั่วคราว retry, หยุดและบันทึกสาเหตุ, ดูไม่ออกว่าค้างขั้นไหน",
    "② service/feature: Parallel, Choice (+ Default), Map (ItemsPath/Iterator/MaxConcurrency), Task, Fail (Cause/Error), Succeed, API Gateway ผูกกับ state machine, retry/try-catch ตาม ASL, ภาพ workflow และ log ของแต่ละ step",
    "③ โครงคำตอบ: 1) trigger 2) ตารางจับคู่ขั้น -> state type 3) ข้อควรจำเรื่อง Next/End:true และ Fail/Succeed ไม่มี End 4) ประโยชน์ที่แก้ปัญหาเดิม 5) ทางเลือกที่ตัดทิ้ง (Lambda เรียกกันเอง)"
   ],
   "modelAnswer": "Trigger: ผูก API Gateway method กับ state machine เพื่อเริ่มรันเมื่อลูกค้าสั่ง. จับคู่ขั้นกับ state: (2) Parallel เพราะต้องรันหลาย branch พร้อมกัน (branch หนึ่งตรวจ fraud อีก branch ตรวจสต็อก ต่างมี StartAt/States ของตัวเอง) ต่างจาก Choice ที่เลือกทางเดียวจากข้อมูล. (3) Choice เปรียบเทียบยอดกับวงเงิน มีกฎ + Next ของแต่ละทาง และ Default สำหรับกรณีไม่ตรงกฎ (ข้ามไปขั้นต่อไป). (4) Map เพราะต้องทำขั้นเดียวกันซ้ำกับทุกรายการใน array ที่ไม่ทราบจำนวนล่วงหน้า (ItemsPath ชี้ array, Iterator คือขั้นตอนที่ทำต่อรายการ, ควบคุม MaxConcurrency ได้) ต่างจาก Parallel ที่แต่ละ branch เป็นงานต่างกันและจำนวนคงที่. (5) Task ที่เรียก Lambda ของระบบชำระเงิน พร้อมตั้ง retry ในนิยาม ASL ให้ Step Functions ลองใหม่เมื่อล้มชั่วคราว ไม่ต้องเขียนในโค้ดแต่ละฟังก์ชัน. (6) ถ้า fraud ไม่ผ่านให้ Choice พาไป Fail state ซึ่งหยุดและทำเครื่องหมายว่าล้มเหลวพร้อม Cause และ Error; ถ้าสำเร็จตลอดไปจบที่ Succeed. กติกาที่ต้องใส่: ทุก state มี Type, state ทั่วไปต้องมี Next หรือ End:true ส่วน Succeed/Fail ไม่ต้องมี End, StartAt ระบุจุดเริ่ม. ประโยชน์เทียบของเดิม: Step Functions ทำ orchestration แบบ serverless สร้าง workflow ภาพ ติดตามทุก step และบันทึกสถานะแต่ละขั้น จึงเห็นว่าออเดอร์ค้างตรงไหน, ใส่ retry/try-catch ที่ระดับ workflow แทนเขียนซ้ำทุกฟังก์ชัน และแต่ละ Lambda ทำหน้าที่เดียวไม่ต้องรู้จักตัวถัดไป. ทางเลือกที่ตัดทิ้ง: Lambda เรียกกันเอง (ผูกกันแน่น ดูสถานะรวมไม่ได้), ใช้ Pass/Wait แทนไม่ตรงงาน เพราะ Pass แค่ส่ง input เป็น output และ Wait แค่หน่วงเวลา.",
   "rubric": [
    "เลือก Parallel สำหรับ fraud + สต็อกที่ทำพร้อมกัน และอธิบายต่างจาก Choice/Map",
    "เลือก Choice (พร้อม Default) สำหรับเช็กวงเงิน",
    "เลือก Map สำหรับตัดสต็อกทุกรายการ และอธิบายความต่างกับ Parallel (ฟังก์ชันเดียวกันกับทุก item vs branch งานต่างกัน)",
    "ใช้ Retry/error handling ที่ระดับ workflow สำหรับขั้นชำระเงิน และใช้ Fail state (Cause/Error) เมื่อ fraud ไม่ผ่าน",
    "กล่าวถึงประโยชน์: มองเห็นสถานะแต่ละ step, ไม่ต้องเขียน retry ซ้ำ, ผูก API Gateway เป็นจุดเริ่ม",
    "บอกกติกา ASL ที่สำคัญ (StartAt, Next/End:true, Fail/Succeed ไม่ต้อง End)"
   ],
   "topics": [
    {
     "module": "M11",
     "index": 2
    },
    {
     "module": "M11",
     "index": 0
    }
   ],
   "source": [
    "M11 L184-200",
    "M11 L245-253",
    "M11 L364",
    "M11 L440-470",
    "M11 L575-599",
    "M11 L626-663",
    "M11 L684-688",
    "M11 L985"
   ]
  },
  {
   "id": "p-m12-1",
   "modules": [
    "M12"
   ],
   "likelihood": "สูง",
   "depth": "พื้นฐาน",
   "why": "user pool vs identity pool คือแกนของ M12 และทุก flow ในสไลด์ (token -> API Gateway, token -> credential) เป็นโจทย์ออกแบบที่ตรงที่สุด",
   "prompt": "สตาร์ทอัปทำแอปมือถือสำหรับจองโต๊ะร้านอาหาร ข้อกำหนด: (1) ผู้ใช้สมัครและล็อกอินเองได้ ยืนยันอีเมลหรือเบอร์โทร และล็อกอินด้วยบัญชี Google ได้ โดยทีมไม่อยากสร้างระบบเก็บผู้ใช้และหน้า login เอง (2) แอปเรียก REST API ที่ API Gateway และ API ต้องปฏิเสธคนที่ยังไม่ล็อกอิน (3) ผู้ใช้อัปโหลดรูปโปรไฟล์ขึ้น S3 ได้โดยตรงจากแอป ด้วยสิทธิ์ชั่วคราว ห้ามฝัง access key ไว้ในแอป จงเลือกบริการและอธิบาย flow พร้อมบอกหน้าที่ของ token แต่ละชนิด และเหตุผลที่ไม่เลือกทางเลือกอื่น",
   "hints": [
    "① คำสำคัญ: สมัคร/ล็อกอิน + login UI ที่ไม่อยากทำเอง, Google, API ปฏิเสธคนไม่ล็อกอิน, สิทธิ์ชั่วคราวเข้าถึง S3 โดยตรง, ห้ามฝัง key",
    "② service/feature: Cognito user pool, Cognito identity pool, JWT tokens (ID/access/refresh), API Gateway authorizer, STS role + IAM policy; เทียบ IAM users, access key ฝังในแอป",
    "③ โครงคำตอบ: 1) user pool ทำอะไร 2) flow ผ่าน API Gateway 3) token 3 ชนิด 4) identity pool ให้ credential ชั่วคราวอย่างไร 5) ตัดทิ้งทางเลือกอื่นพร้อมเหตุผล"
   ],
   "modelAnswer": "ใช้ Amazon Cognito สองส่วนประกอบกัน. (1) User pool: เป็น directory ของผู้ใช้ให้บริการ sign-up/sign-in พร้อม login web UI ที่ปรับแต่งได้ ยืนยันอีเมล/เบอร์โทร และรองรับ third-party IdP อย่าง Google ตรงข้อกำหนด 1 โดยทีมไม่ต้องสร้างเอง. เมื่อล็อกอินสำเร็จ user pool คืน tokens (JWT) ให้แอป. (2) ป้องกัน API: แอปแนบ token เรียก API Gateway, API Gateway (ตั้ง Cognito user pool authorizer) ตรวจสอบ token แล้วจึง invoke Lambda/backend ถ้าไม่มี token ที่ถูกต้องคำขอถูกปฏิเสธ. หน้าที่ token: ID token = claims ตัวตนผู้ใช้ (เช่นชื่อ อีเมล) ใช้ authorize การเรียก API; access token = authorize การเรียก API ตาม custom scopes ของ resource ที่ปกป้อง; refresh token = ใช้ขอ ID/access token ใหม่ เมื่ออันเดิมหมดอายุโดยไม่ต้องให้ผู้ใช้ล็อกอินใหม่. (3) Identity pool: แอปนำ token จาก user pool (หรือจาก Google) ไปขอ AWS credential จาก identity pool ซึ่งออก temporary credential ผ่าน STS ตาม IAM role ที่ผูกไว้ แอปจึงเรียก S3 ได้ตามสิทธิ์ของ IAM policy นั้น โดยไม่ฝัง key ใด ๆ. ทางเลือกที่ตัดทิ้ง: IAM user ต่อผู้ใช้แต่ละคน (เป็นเครื่องมือจัดการสิทธิ์ AWS ไม่ใช่ระบบ sign-up/sign-in ของแอป), ฝัง/แชร์ access key ในโค้ด (เป็น bad practice ในสไลด์), Secrets Manager (ไว้หมุนเวียน credential ของ DB ไม่เกี่ยวกับการ sign-in), user pool อย่างเดียว (ได้ token แต่ token ไม่ใช่ AWS credential สำหรับเรียก S3 โดยตรง).",
   "rubric": [
    "ระบุ user pool สำหรับ sign-up/sign-in + federation (Google) และได้ JWT tokens",
    "อธิบาย flow แอปแนบ token เรียก API Gateway แล้ว API Gateway validate ก่อนเรียก Lambda/backend",
    "อธิบาย ID token / access token / refresh token ได้ถูกหน้าที่",
    "ระบุ identity pool ที่แลก token เป็น temporary AWS credential ผ่าน STS role เพื่อเข้าถึง S3 โดยตรง",
    "ชี้ว่าการฝัง/แชร์ access key เป็น bad practice และบอกว่าทำไมไม่ใช้ IAM user หรือ Secrets Manager"
   ],
   "topics": [
    {
     "module": "M12",
     "index": 4
    },
    {
     "module": "M12",
     "index": 5
    }
   ],
   "source": [
    "M12 L294-306",
    "M12 L534-559",
    "M12 L575-585",
    "M12 L600-605",
    "M12 L621-631",
    "M12 L660",
    "M12 L676-690"
   ]
  },
  {
   "id": "p-m12-2",
   "modules": [
    "M12"
   ],
   "likelihood": "กลาง",
   "depth": "ลึก",
   "why": "STS operations 5 แบบ + CloudTrail เป็นส่วนที่เรียนแล้วมักสลับกัน เหมาะกับโจทย์หลายข้อกำหนดให้จับคู่",
   "prompt": "องค์กรหนึ่งมี AWS account หลักและมีข้อกำหนด 5 ข้อ: (1) บริษัทพันธมิตรที่มี AWS account ของตัวเองต้องเข้าอ่าน S3 bucket รายงานของเรา (IAM users ของเขาอยู่คนละ account) (2) พนักงานล็อกอินด้วยระบบ Active Directory ขององค์กรที่ใช้ SAML อยู่แล้วและต้องเข้า AWS console ได้โดยไม่สร้าง IAM user ให้ทุกคน (3) ผู้ดูแลระบบที่เป็น IAM user ต้องส่งคำขอที่อ่อนไหวได้เฉพาะเมื่อยืนยันตัวด้วย MFA (4) แอปบน EC2 ต้องเรียก AWS API โดยไม่เก็บ access key ไว้ในโค้ด (5) วันหนึ่งพบว่ามี EC2 instance ถูก terminate โดยผู้ใช้ที่ล็อกอินผ่าน SAML ต้องรู้ว่าใครทำ จงจับคู่แต่ละข้อกับ service/operation ที่เหมาะพร้อมเหตุผล และอธิบายขั้นตอนสืบหาผู้ใช้ในข้อ 5",
   "hints": [
    "① คำสำคัญ: คนละ account (cross-account), SAML + ไม่สร้าง IAM user ทุกคน (federated), MFA, ไม่เก็บ access key, ใครทำ (audit)",
    "② service/feature: IAM role, AWS STS (AssumeRole, AssumeRoleWithSAML, AssumeRoleWithWebIdentity, GetFederationToken, GetSessionToken), CloudTrail (eventName, userName)",
    "③ โครงคำตอบ: ตารางข้อกำหนด -> operation + เหตุผล, แล้วเดินขั้นตอน CloudTrail ทีละขั้น, ปิดท้ายด้วยข้อควรระวังเรื่องอายุ credential"
   ],
   "modelAnswer": "จับคู่: (1) cross-account สำหรับ IAM users ใช้ STS AssumeRole (อายุ default 1 ชั่วโมง) ให้ผู้ใช้ฝั่งพันธมิตร assume role ใน account เรา. (2) ใช้ AssumeRoleWithSAML เพราะเป็น federated users ที่ authenticate ด้วย identity system ขององค์กรเอง (เลี่ยงการสร้าง IAM user ให้ทุกคน; กระบวนการคือ authenticate กับ IdP ก่อน แล้ว identity broker ไปขอ temporary credential จาก STS อีกชั้น จากนั้นสิทธิ์ถูกตัดสินด้วย IAM). ถ้าเป็นผู้ใช้ social login ใช้ AssumeRoleWithWebIdentity แทน. (3) ใช้ GetSessionToken สำหรับ IAM user ที่ต้องการความปลอดภัยเพิ่ม เช่นบังคับ MFA. (4) ใช้ IAM role กับ EC2 เพื่อได้ temporary credential เอง ไม่ฝัง/แชร์ access key ซึ่งเป็น bad practice ถ้า role ใช้ไม่ได้จึงใช้ STS. (5) ใช้ CloudTrail ซึ่งบันทึก action ของผู้ใช้ที่ authenticate แล้วลง log ใน S3: ค้น event ที่ eventName = TerminateInstances -> ดู ARN ของ IAM role ที่ federated user ใช้ assume -> ค้น event ที่ eventName = AssumeRoleWithSAML ที่มี role ARN นั้น -> อ่านตัวตนผู้ใช้ SAML ใน attribute userName. ข้อควรรู้: GetFederationToken ก็ใช้กับ federated users แต่ default อายุ 12 ชั่วโมง ยาวกว่า AssumeRole (1 ชั่วโมง) จึงเลือกเมื่อต้องการ session ยาวกว่า และ credential ชั่วคราวใช้ซ้ำไม่ได้หลังหมดอายุ. ทางเลือกที่ตัดทิ้ง: สร้าง IAM user + access key ให้พนักงาน/พันธมิตรทุกคน (จัดการยาก เสี่ยงรั่ว), แชร์ key ร่วมกัน (ตรวจย้อนไม่ได้ว่าใครทำ).",
   "rubric": [
    "จับคู่ cross-account -> AssumeRole (default 1 ชั่วโมง)",
    "จับคู่ SAML/องค์กรมี IdP -> AssumeRoleWithSAML (และบอกว่า social login คือ AssumeRoleWithWebIdentity)",
    "จับคู่ MFA -> GetSessionToken",
    "จับคู่แอปบน EC2 -> IAM role และชี้ว่าฝัง/แชร์ key เป็น bad practice",
    "เดินขั้นตอน CloudTrail ถูกลำดับ: TerminateInstances -> role ARN -> AssumeRoleWithSAML -> userName",
    "กล่าวถึงความต่างอายุ default AssumeRole 1 ชั่วโมง vs GetFederationToken 12 ชั่วโมง"
   ],
   "topics": [
    {
     "module": "M12",
     "index": 2
    },
    {
     "module": "M12",
     "index": 3
    }
   ],
   "source": [
    "M12 L294-306",
    "M12 L349-359",
    "M12 L377",
    "M12 L409-433",
    "M12 L446-450",
    "M12 L471-488"
   ]
  },
  {
   "id": "p-m13-1",
   "modules": [
    "M13"
   ],
   "likelihood": "สูง",
   "depth": "พื้นฐาน",
   "why": "CI/CD pipeline กับ code services (CodePipeline/CodeBuild/CodeDeploy) และ delivery vs deployment เป็นแกนของ M13 ที่ออกเป็น scenario ได้ตรงสุด",
   "prompt": "ทีมพัฒนา 6 คนของบริษัทหนึ่งปล่อยเว็บแอปด้วยการ build บนเครื่องตัวเองแล้วอัปโหลดไฟล์ขึ้นเซิร์ฟเวอร์ด้วยมือ สัปดาห์ละ 2 ครั้ง แต่ละครั้งใช้เวลาประมาณ 3 ชั่วโมงและพลาดบ่อย (อัปผิดไฟล์ ลืมรันเทส) ผู้บริหารต้องการ: (1) ทุกครั้งที่ commit โค้ด ให้ build และทดสอบอัตโนมัติ (2) ปล่อยไป staging อัตโนมัติทั้งหมด (3) ก่อนขึ้น production ต้องมีผู้จัดการอนุมัติหนึ่งครั้ง (4) ความปลอดภัยต้องเป็นส่วนหนึ่งของกระบวนการ ไม่ใช่มาตรวจตอนท้าย จงเสนอแนวทางด้วย AWS code services พร้อมบอกว่าแต่ละ service ทำอะไร ใช้คำเรียกที่ถูกต้องของแนวทางในแต่ละ environment และบอกปัญหาของวิธีเดิมจากมุม DevOps",
   "hints": [
    "① คำสำคัญ: manual + พลาดบ่อย (automate every phase), commit แล้ว build/test (CI), staging อัตโนมัติ, production ต้องอนุมัติ (continuous delivery vs continuous deployment), security ในกระบวนการ (DevSecOps)",
    "② service/feature: CodePipeline, CodeBuild, CodeDeploy, code repository (version control), manual approval/manual intervention, DevOps / DevSecOps",
    "③ โครงคำตอบ: 1) flow Code -> Build -> Test -> Deploy 2) service แต่ละตัวทำอะไร 3) staging = continuous deployment, production = continuous delivery เพราะมีคนอนุมัติ 4) DevSecOps 5) ประโยชน์เทียบวิธีเดิม"
   ],
   "modelAnswer": "Flow: นักพัฒนา commit โค้ดเข้า code repository (รวมโค้ดไว้ที่เดียวพร้อม version control) -> CodePipeline ถูกกระตุ้นและทำหน้าที่ orchestrate ทั้ง pipeline -> CodeBuild build และรัน test (ขั้น test ใช้เครื่องมือที่ทีมเลือกได้) -> CodeDeploy deploy ไป staging อัตโนมัติ -> มีขั้นรออนุมัติจากผู้จัดการ -> deploy ไป production. คำเรียก: Continuous integration (CI) คือ commit/build (+ test) ซึ่งตรงข้อ 1. ที่ staging ที่ไม่มีคนแทรกเลยเรียก continuous deployment (automation เต็มทางจนถึง deploy). ที่ production ที่ต้องมี manual intervention ก่อน deploy เรียก continuous delivery ซึ่งช่วยให้มั่นใจว่าซอฟต์แวร์ทำงานได้ใน production มากขึ้นและยังคุมการปล่อยด้วยคน. DevOps: ปัญหาเดิมคือแบ่งงาน dev/ops เป็นไซโลและพึ่งงานมือซึ่งเกิดความผิดพลาดง่าย DevOps ลดกำแพงนั้นด้วยการ automate ทุกขั้นและมี CI/CD; การทำให้ความปลอดภัยเป็นส่วนของกระบวนการตั้งแต่ต้นคือ DevSecOps (ตัว Sec เพิ่มมา). ประโยชน์: ปล่อยเร็วขึ้นและน่าเชื่อถือขึ้น ลดข้อผิดพลาดจากคน (อัปผิดไฟล์/ลืมเทสไม่เกิด เพราะ pipeline ทำเหมือนกันทุกครั้ง) ทางเลือกที่ตัดทิ้ง: ยังอัปโหลดมือต่อไป (ไม่ตอบข้อ 1-2), ทำ continuous deployment ถึง production ทั้งหมด (ขัดข้อ 3 ที่ต้องมีผู้อนุมัติ), ใช้ CloudFormation แทน (เป็นเครื่องมือ IaC ที่สร้าง resource ไม่ใช่ตัวจัดการ release workflow).",
   "rubric": [
    "วาง flow Code -> Build -> Test -> Deploy และระบุว่า CodePipeline เป็นตัว orchestrate",
    "ระบุ CodeBuild สำหรับ build/test และ CodeDeploy สำหรับ deploy และมี code repository เป็นต้นทาง",
    "แยก continuous delivery (มี manual intervention ก่อน production) จาก continuous deployment (อัตโนมัติเต็ม) ให้ตรง environment",
    "เชื่อมกับ DevOps/DevSecOps: ตัดไซโลและ automate ทุกขั้น, security เป็นส่วนหนึ่งของกระบวนการ",
    "ชี้ว่าวิธีเดิมพลาดเพราะงานมือ และ pipeline ลดความผิดพลาด"
   ],
   "topics": [
    {
     "module": "M13",
     "index": 1
    },
    {
     "module": "M13",
     "index": 2
    },
    {
     "module": "M13",
     "index": 0
    }
   ],
   "source": [
    "M13 L119-133",
    "M13 L146-162",
    "M13 L297-305",
    "M13 L321",
    "M13 L334-340"
   ]
  },
  {
   "id": "p-m13-2",
   "modules": [
    "M13"
   ],
   "likelihood": "กลาง",
   "depth": "ลึก",
   "why": "CloudFormation (template/stack/section) กับ SAM เป็นหัวข้อ IaC ที่ออกเป็นโจทย์รวมหลายข้อกำหนดได้ และมีข้อ quota ในตัวอย่างข้อสอบ",
   "prompt": "บริษัทต้องสร้างสภาพแวดล้อม dev, test, prod ที่หน้าตาเหมือนกัน (VPC, subnet, ELB, EC2 app servers, RDS) ทุกครั้งที่ทีมใหม่ขอ environment ต้องได้ชุดเดียวกันโดยไม่ต้องคลิกมือ ข้อกำหนดเพิ่มเติม: (1) รหัสผ่านฐานข้อมูลที่กรอกตอนสร้างต้องไม่โชว์เป็นข้อความธรรมดา (2) เมื่อโปรเจกต์ dev จบต้องลบทุก resource ที่สร้างพร้อมกันให้หมดในครั้งเดียว (3) บริษัทยังมีแอป serverless เล็ก ๆ (Lambda + API Gateway + DynamoDB) ที่อยากทดสอบบนเครื่องก่อน deploy และให้ต่อกับ pipeline CI/CD ได้ (4) มีวันที่สร้าง stack จนชนโควตาจำนวน stack ของ Region จงเสนอเครื่องมือและโครงสร้างสำหรับแต่ละข้อ พร้อมอธิบายความสัมพันธ์ของเครื่องมือที่เลือกและเหตุผลที่ตัดทางอื่นทิ้ง",
   "hints": [
    "① คำสำคัญ: เหมือนกันทุก environment/ไม่คลิกมือ (infrastructure as code), รหัสผ่านไม่โชว์, ลบทั้งชุดในครั้งเดียว, serverless + ทดสอบบนเครื่อง, ชนโควตา stack",
    "② service/feature: CloudFormation template (JSON/YAML), stack, Parameters (NoEcho), Resources (required), AWS SAM (Transform, local invocation), CodeBuild/CodeDeploy integration, Support Center",
    "③ โครงคำตอบ: 1) template + stack สำหรับ 3 environment 2) section ที่ใช้และ NoEcho 3) ลบ stack 4) SAM ต่อยอดจาก CloudFormation อย่างไร 5) ขอเพิ่ม quota 6) ตัดทางเลือกอื่น"
   ],
   "modelAnswer": "ใช้ AWS CloudFormation เป็น infrastructure as code: เขียน template (ไฟล์ข้อความรูปแบบ JSON หรือ YAML) ที่ระบุ resource ใน section Resources (section เดียวที่จำเป็น) แล้วสร้าง stack จาก template เดียวกันสำหรับ dev, test, prod ทำให้ได้สภาพแวดล้อมเหมือนกันและทำซ้ำได้ ส่วนค่าที่ต่างกันรับผ่าน Parameters (template ยังมี section อื่นเช่น Mappings, Conditions, Outputs ที่ช่วยปรับตาม environment). ข้อ (1): ประกาศรหัสผ่านเป็น parameter ที่ตั้ง NoEcho เป็น true เพื่อไม่ให้แสดงค่า. ข้อ (2): stack คือ unit ของการ deploy ที่สร้างและอัปเดตด้วย template เมื่อลบ stack resource ทั้งหมดใน stack จะถูกลบไปด้วย จึงลบ stack dev ครั้งเดียวจบ (ควรแยก stack ต่อ environment เพื่อลบแยกกันได้). ข้อ (3): ใช้ AWS SAM เป็น open-source framework สำหรับแอป serverless ซึ่งเป็นส่วนขยายของ CloudFormation: template ของ SAM ใส่ Transform: AWS::Serverless-2016-10-31 เพื่อให้ CloudFormation แปลง แล้วสร้าง Lambda (Serverless::Function) ที่มี API event ต่อ API Gateway และ DynamoDB (Serverless::SimpleTable) ด้วยบรรทัดไม่กี่บรรทัด; SAM มี invocation environment ในเครื่องให้ทดสอบก่อน deploy, deploy ผ่าน CloudFormation จึงได้ความน่าเชื่อถือแบบเดียวกัน, และรวมกับ CI/CD tools เช่น CodeBuild และ CodeDeploy ได้ รวมทั้ง deploy ไปหลาย AWS account ได้. ข้อ (4): จำนวน stack ถูกจำกัดด้วย quota แต่ขอเพิ่มได้ผ่าน Support Center ใน AWS Management Console. สรุปความสัมพันธ์: CloudFormation เหมาะกับ infrastructure ทั่วไป (VPC, ELB, EC2, RDS) ส่วน SAM คือทางลัดเฉพาะ serverless ที่สุดท้ายก็ถูก deploy เป็น CloudFormation stack. ทางเลือกที่ตัดทิ้ง: สร้างด้วยมือใน console (ผิดพลาดและไม่เหมือนกัน), ใช้ SAM กับ network ทั่วไป (เจาะจง serverless), เขียนอีเมลหรือรอ quota เพิ่มเอง (ต้องขอผ่าน Support Center), และตั้ง quota เป็นค่าคงที่แก้ไม่ได้ (ไม่จริง).",
   "rubric": [
    "เลือก CloudFormation (template JSON/YAML + stack) สร้าง 3 environment ซ้ำได้ และบอกว่า Resources เป็น section ที่จำเป็น",
    "ใช้ Parameters (เช่น NoEcho) ซ่อนรหัสผ่าน และกล่าวถึง Mappings/Conditions/Outputs เมื่อปรับตาม environment",
    "อธิบายว่าลบ stack = ลบ resource ทั้งหมดใน stack จึงตอบข้อ (2)",
    "เลือก SAM สำหรับ serverless, อธิบายว่าเป็นส่วนขยายของ CloudFormation (Transform AWS::Serverless-2016-10-31), ทดสอบ local ได้, ต่อ CodeBuild/CodeDeploy ได้",
    "ตอบวิธีขอเพิ่ม quota stack ว่าผ่าน Support Center ใน Management Console"
   ],
   "topics": [
    {
     "module": "M13",
     "index": 3
    },
    {
     "module": "M13",
     "index": 4
    },
    {
     "module": "M13",
     "index": 5
    }
   ],
   "source": [
    "M13 L363-395",
    "M13 L440-448",
    "M13 L466-478",
    "M13 L494-521",
    "M13 L554-560",
    "M13 L653",
    "M13 L678-686",
    "M13 L706",
    "M13 L717-727",
    "M13 L898-950"
   ]
  },
  {
   "id": "p-x-1",
   "modules": [
    "M07",
    "M10",
    "M11"
   ],
   "likelihood": "สูง",
   "depth": "ลึก",
   "why": "อาจารย์ใช้ AWS จริง จึงน่าถามระบบที่ต่อหลาย service: คิว + workflow + ลิมิตของ Lambda ในโจทย์เดียว",
   "prompt": "บริษัทขายตั๋วคอนเสิร์ต \"TixNow\" เปิดขายตั๋วแล้วมีออเดอร์พุ่งประมาณ 3,000 ออเดอร์ต่อวินาที ผู้ใช้ต้องได้รับการตอบรับทันทีว่า \"รับออเดอร์แล้ว\" โดยไม่ต้องรอหลังบ้าน ขั้นตอนหลังบ้านคือ ตรวจสต็อก → ชำระเงิน (ล้มเหลวบ่อย ต้องลองใหม่เอง) → ออกตั๋ว PDF (ใช้เวลาประมาณ 20 นาทีต่อใบ) → ส่งอีเมล และออเดอร์ที่ยอดเกิน 50,000 บาทต้องรอผู้จัดการกดอนุมัติ ซึ่งอาจรอเป็นวัน\nให้ออกแบบว่าจะใช้ service อะไรรับออเดอร์ คุมลำดับขั้นตอน และรันงาน 20 นาที พร้อมอธิบายว่าทำไมไม่ใช้ทางเลือกอื่น",
   "hints": [
    "จับคำสำคัญ: ตอบรับทันที / พุ่ง 3,000 ต่อวินาที / ลองใหม่เอง / 20 นาที / รอเป็นวัน",
    "service ที่เกี่ยว: SQS (buffer ตอนพุ่ง), Step Functions Standard vs Express (ลิมิตอัตราเริ่มและเวลารัน), Lambda (timeout สูงสุด), ECS/Fargate",
    "โครงคำตอบ: 1) รับออเดอร์แล้วใส่คิว 2) workflow คุมขั้นตอน + retry + Choice ยอดเกิน 50,000 + รออนุมัติ 3) งาน 20 นาทีรันที่ไหน 4) ทำไมไม่ใช้ Express / Lambda ล้วน"
   ],
   "modelAnswer": "1) รับออเดอร์: ให้ API ใส่ออเดอร์ลง Amazon SQS แล้วตอบผู้ใช้ทันที (async) คิวช่วยดูดซับช่วงพุ่ง ถ้า consumer ใช้เวลานาน ต้องตั้ง visibility timeout ให้ยาวกว่าเวลาประมวลผล (default 30 วินาที) และมี DLQ เก็บออเดอร์ที่ล้มซ้ำ\n2) คุมขั้นตอน: ใช้ AWS Step Functions ชนิด Standard เพราะรันได้นานถึง 1 ปี (Express รันได้แค่ 5 นาที จึงรอผู้จัดการเป็นวันไม่ได้) ใช้ state Choice แยกยอดเกิน 50,000 บาท, ใส่ retry ที่ขั้นชำระเงิน, ขั้นรออนุมัติใช้ Activity + taskToken รอจนมีคนส่ง success\n3) อัตราเริ่ม: Standard เริ่ม workflow ได้ประมาณ 2,000 ต่อวินาที น้อยกว่า 3,000 ที่พุ่ง จึงต้องให้คิวคุมอัตรา แล้วค่อยให้ตัวอ่านคิวเริ่ม workflow ตามกำลัง (Express รับได้ 100,000 ต่อวินาทีแต่ติดเวลา 5 นาที)\n4) งาน 20 นาที: Lambda timeout สูงสุด 15 นาที จึงรันงานนี้ใน Lambda ไม่ได้ ให้รันเป็น container task บน ECS Fargate (ไม่ต้องดูแลเซิร์ฟเวอร์) แล้วให้ workflow รอผล\nหมายเหตุผู้สรุป (นอก notes): การให้ Step Functions เรียก task บน ECS และการใช้ตัวอ่านคิวคุมอัตราเริ่ม workflow เป็นแนวออกแบบของเราเอง สไลด์ไม่ได้ยกเป็นตัวอย่าง",
   "rubric": [
    "ใช้คิว (SQS) แยกการรับออเดอร์ออกจากหลังบ้านและตอบผู้ใช้ทันที",
    "เลือก Step Functions Standard พร้อมเหตุผลเรื่องเวลารันนาน (1 ปี) ไม่ใช่ Express (5 นาที)",
    "ใช้ Choice, retry และ Activity/taskToken ได้ตรงกับเงื่อนไข ยอดเกิน 50,000 / ชำระเงินล้ม / รออนุมัติ",
    "บอกได้ว่า Lambda timeout สูงสุด 15 นาที จึงไม่ใช้กับงาน 20 นาที และเสนอทางเลือก (ECS/Fargate)",
    "เชื่อมตัวเลข 3,000 ต่อวินาที กับลิมิตอัตราเริ่ม workflow (2,000 ต่อวินาที) หรือกล่าวถึง visibility timeout/DLQ"
   ],
   "topics": [
    {
     "module": "M10",
     "index": 2
    },
    {
     "module": "M11",
     "index": 3
    },
    {
     "module": "M11",
     "index": 4
    },
    {
     "module": "M07",
     "index": 2
    }
   ],
   "source": [
    "M10 L438-468",
    "M10 L470-515",
    "M11 L708-714",
    "M11 L732-742",
    "M11 L760-772",
    "M11 L830-880",
    "M11 L912-916",
    "M07 L974-977",
    "M08 L993-999"
   ],
   "supplement": true
  },
  {
   "id": "p-x-2",
   "modules": [
    "M12",
    "M09"
   ],
   "likelihood": "สูง",
   "depth": "พื้นฐาน",
   "why": "login กับ cache เป็นสองเรื่องที่ทุกแอปจริงมี และกับดักเรื่อง cache ข้อมูลเฉพาะบุคคลเป็นประเด็นการใช้งานจริงที่อาจารย์น่าชอบถาม",
   "prompt": "แอปจองโต๊ะ \"ครัวเที่ยง\" มีผู้ใช้ทั่วประเทศ ต้องการ (1) ให้ผู้ใช้สมัครและ login ได้ รวมถึง login ด้วยบัญชี Google (2) ให้เฉพาะผู้ที่ login แล้วเรียก API จองโต๊ะได้ (3) ให้แอปมือถืออัปโหลดรูปโปรไฟล์เข้า S3 ได้โดยไม่ฝัง access key ไว้ในแอป (4) หน้าเมนูและหน้า \"ร้านยอดนิยม\" โหลดช้า ทีมเลยเปิด CloudFront cache หน้า \"การจองของฉัน\" ซึ่งแสดงข้อมูลเฉพาะของแต่ละผู้ใช้ด้วย แล้วพบว่าบางคนเห็นการจองของคนอื่น\nให้ออกแบบ (1)–(3) ด้วย service ที่เหมาะสม และอธิบายสาเหตุกับวิธีแก้ปัญหาใน (4)",
   "hints": [
    "จับคำสำคัญ: สมัคร/login + Google / เฉพาะคน login เรียก API / ไม่ฝัง access key / เห็นข้อมูลคนอื่น",
    "service ที่เกี่ยว: Amazon Cognito user pool vs identity pool, API Gateway authorizer, CloudFront cache key (default = domain + path), ElastiCache",
    "โครงคำตอบ: 1) user pool ทำ login + token 2) ใช้ token คุม API 3) identity pool แลก credential ชั่วคราว 4) cache key ไม่แยกผู้ใช้ → ทุกคนใช้ cache เดียวกัน แก้โดยไม่ cache เนื้อหาเฉพาะบุคคลที่ชั้น shared หรือใส่ตัวแยกผู้ใช้ใน key"
   ],
   "modelAnswer": "(1) ใช้ Cognito user pool จัดการ sign-up / sign-in พร้อมหน้า login สำเร็จรูป และเชื่อม external IdP (เช่น Google) ให้ผู้ใช้ login ได้ user pool จะออก token ให้แอป\n(2) ให้ API Gateway ตรวจ token ด้วย authorizer ที่ใช้ user pool ผู้ที่ไม่มี token ที่ถูกต้องจะเรียก API จองโต๊ะไม่ได้ (Cognito ช่วยควบคุมว่าใครเข้า API ได้)\n(3) ใช้ Cognito identity pool แลก token เป็น temporary security credentials ตามสิทธิ์ของ IAM role แล้วให้แอปใช้ credential ชั่วคราวนั้นอัปโหลดเข้า S3 ไม่ต้องฝัง access key ถาวรในแอป\n(4) สาเหตุ: cache key ค่า default ของ CloudFront คือ domain name + URL path เท่านั้น ไม่รวม cookie หรือ header ที่ระบุตัวผู้ใช้ request ของคนละผู้ใช้ที่เรียก path เดียวกันจึงถูกตอบจาก cache object เดียวกัน (ตัวอย่างในสไลด์: session cookie ต่างกันแต่ยัง hit cache เดียวกัน) ทางแก้: เนื้อหาเฉพาะบุคคลไม่ควรไปอยู่ใน cache ที่ใช้ร่วมกันทุกคนโดยไม่มีตัวแยกผู้ใช้ ให้ cache เฉพาะข้อมูลที่ทุกคนเห็นเหมือนกัน (หน้าเมนู, ร้านยอดนิยม, รูปและไฟล์ static) ส่วนข้อมูลรายคนให้ดึงตรงจาก backend หรือถ้าจะ cache ต้องทำให้ cache key แยกตามผู้ใช้ และตอบคำถามก่อน cache ว่าข้อมูลนี้ยอมให้ stale หรือให้คนอื่นเห็นได้ไหม",
   "rubric": [
    "เลือก Cognito user pool สำหรับ sign-up/sign-in (และ external IdP อย่าง Google)",
    "ใช้ token จาก user pool คุมการเรียก API ผ่าน API Gateway",
    "ใช้ identity pool ให้ temporary credentials เข้า S3 โดยไม่ฝัง access key",
    "บอกสาเหตุของ (4) ว่า cache key default = domain + path ไม่แยกผู้ใช้",
    "เสนอวิธีแก้: ไม่ cache เนื้อหาเฉพาะบุคคลร่วมกัน หรือทำให้ key แยกผู้ใช้ และ cache เฉพาะข้อมูลที่ทุกคนเห็นเหมือนกัน"
   ],
   "topics": [
    {
     "module": "M12",
     "index": 4
    },
    {
     "module": "M12",
     "index": 5
    },
    {
     "module": "M09",
     "index": 10
    },
    {
     "module": "M09",
     "index": 2
    }
   ],
   "source": [
    "M12 L534-559",
    "M12 L575-585",
    "M12 L600-605",
    "M09 L133-141",
    "M09 L213-240",
    "M09 L677-741",
    "M09 L689-691"
   ],
   "supplement": true
  },
  {
   "id": "p-x-3",
   "modules": [
    "M13",
    "M08"
   ],
   "likelihood": "สูง",
   "depth": "พื้นฐาน",
   "why": "CI/CD กับ container deploy เป็นงานจริงที่ทีมทำทุกวัน และโมดูล 13 เป็นโมดูลสุดท้ายที่มักถูกถามเป็นภาพรวมการ deploy",
   "prompt": "ทีม 5 คนของบริษัท \"Snapfood\" มีแอปเว็บที่ทำเป็น Docker image และรันบน Elastic Beanstalk ตอนนี้ปล่อยงานด้วยมือสัปดาห์ละ 2 ครั้ง ต้อง build image, push ขึ้นที่เก็บ image และไปกด deploy เองทุกครั้ง บางครั้งลืมเทสต์ ต้องการ pipeline อัตโนมัติ: เมื่อ commit โค้ดให้ build และเทสต์ แล้ว deploy ไป staging อัตโนมัติ ส่วน production ให้มีคนกดอนุมัติก่อน และ production ห้ามมี downtime และต้องย้อนกลับเวอร์ชันเก่าได้ทันทีถ้าเจอปัญหา\nให้ออกแบบ pipeline ด้วย AWS service และอธิบายว่า staging กับ production เป็น continuous deployment หรือ continuous delivery ตามนิยาม",
   "hints": [
    "จับคำสำคัญ: commit แล้ว build+เทสต์อัตโนมัติ / staging อัตโนมัติ / production กดอนุมัติ / ไม่มี downtime / ย้อนกลับทันที",
    "service ที่เกี่ยว: CodePipeline, CodeBuild, CodeDeploy, Amazon ECR, Elastic Beanstalk blue/green (สลับ CNAME)",
    "โครงคำตอบ: 1) ขั้นของ pipeline (source → build/test → ECR → deploy) 2) staging = ? production = ? ต่างกันที่ไหน 3) blue/green ทำให้ไม่มี downtime และย้อนกลับได้อย่างไร"
   ],
   "modelAnswer": "1) Pipeline: ใช้ AWS CodePipeline เป็นตัวร้อยขั้นตอน ตั้งแต่ source (code repository) → AWS CodeBuild build image และรันเทสต์ (docker build, tag, login แล้ว push ขึ้น Amazon ECR ตามขั้นตอนเดียวกับที่ทำมือ) → AWS CodeDeploy / การ deploy ไป Elastic Beanstalk (แอป Docker ใช้ Dockerrun.aws.json ระบุ image)\n2) นิยาม: staging ที่ deploy อัตโนมัติทุกครั้งที่ผ่านเทสต์ คือ continuous deployment ส่วน production ที่ต้องมีคนกดอนุมัติ (manual intervention) ก่อนปล่อย คือ continuous delivery คือโค้ดพร้อมปล่อยเสมอแต่คนตัดสินใจจังหวะปล่อย\n3) ไม่มี downtime และย้อนกลับได้: ใช้ blue/green deployment บน Elastic Beanstalk สร้าง environment ใหม่ (green) ถัดจากตัวเดิม (blue) ทดสอบเวอร์ชันใหม่ก่อน แล้วสลับ CNAME ให้ผู้ใช้ไปที่ environment ใหม่ ถ้าเกิดปัญหาก็สลับกลับไปที่ environment เดิมที่ยังอยู่ (ทางเลือกอื่นคือ traffic splitting ทยอยส่ง traffic ไปเวอร์ชันใหม่)\nทางเลือกที่ตัดทิ้ง: deploy ทับ environment เดิมโดยตรงอาจมี downtime และย้อนกลับยากกว่า",
   "rubric": [
    "ระบุ CodePipeline ร้อยขั้นตอน, CodeBuild สำหรับ build/test และมีขั้น deploy (CodeDeploy/Beanstalk)",
    "อธิบายว่า image ถูก push ขึ้น Amazon ECR (build, tag, login, push)",
    "จำแนกให้ถูก: staging อัตโนมัติ = continuous deployment, production มีคนอนุมัติ = continuous delivery",
    "เสนอ blue/green (สลับ CNAME) หรือ traffic splitting เพื่อไม่มี downtime",
    "อธิบายการย้อนกลับ: สลับกลับ environment เดิมที่ยังอยู่"
   ],
   "topics": [
    {
     "module": "M13",
     "index": 1
    },
    {
     "module": "M13",
     "index": 2
    },
    {
     "module": "M08",
     "index": 16
    },
    {
     "module": "M08",
     "index": 8
    }
   ],
   "source": [
    "M13 L119-133",
    "M13 L146-162",
    "M13 L214-218",
    "M13 L297-305",
    "M13 L321",
    "M13 L334-340",
    "M08 L937-957",
    "M08 L1022-1042",
    "M08 L1252-1272",
    "M08 L1495-1519"
   ]
  },
  {
   "id": "p-x-4",
   "modules": [
    "M07",
    "M09",
    "M10"
   ],
   "likelihood": "กลาง",
   "depth": "ลึก",
   "why": "อาจารย์ใช้ของจริงน่าถามปัญหาที่เจอจริงคือ Lambda scale เร็วจน database รับไม่ไหว ซึ่งต้องผสม concurrency + คิว + cache",
   "prompt": "รายการทีวี \"Star Voice\" เปิดให้โหวตผ่านแอป ช่วงท้ายรายการมีโหวตประมาณ 20,000 ครั้งต่อวินาที ระบบเป็น API → Lambda → Amazon RDS ซึ่งรับ connection พร้อมกันได้จำกัด (สมมติ 200) พบว่า Lambda scale ออกมาเปิด connection จำนวนมากจน database ล่ม โหวตหาย นอกจากนี้ผู้ชมประมาณ 1 ล้านคนกดรีเฟรชหน้า \"คะแนนรวมล่าสุด\" ทุก 5 วินาที ซึ่งเป็น query นับคะแนนที่หนักมาก ให้ออกแบบให้ database รอดทั้งฝั่งเขียนโหวตและฝั่งอ่านคะแนน พร้อมเหตุผลและข้อแลกเปลี่ยน",
   "hints": [
    "จับคำสำคัญ: 20,000 ต่อวินาที / RDS รับ connection จำกัด / Lambda scale ออก / รีเฟรชทุก 5 วินาที / query หนัก",
    "service ที่เกี่ยว: SQS (buffer) + Lambda ที่อ่านคิวเป็น batch + จำกัด concurrency ต่อ function, database proxy, ElastiCache / CloudFront / API Gateway cache",
    "โครงคำตอบ: ฝั่งเขียน 1) ใส่คิวแทนยิง DB ตรง 2) คุม concurrency ให้ต่ำกว่าที่ DB รับ 3) proxy รวม connection · ฝั่งอ่าน 4) cache คะแนนรวมด้วย TTL สั้น + ยอมรับ stale 5 วินาที"
   ],
   "modelAnswer": "ฝั่งเขียน: อย่าให้ Lambda ที่รับ request เขียน database ตรง ให้ใส่โหวตลง Amazon SQS ก่อน (คิวดูดซับช่วงพุ่งและแยกจังหวะผู้ส่งออกจากความเร็ว database) แล้วให้ Lambda อีกตัวอ่านคิวแบบ batch (Lambda โพลคิวแล้วเรียก function พร้อมข้อความหลายรายการ) และเขียน database เป็นก้อน จากนั้นตั้ง concurrency ของ function ตัวอ่านคิวให้ต่ำกว่า connection ที่ database รับได้ (ตั้งต่อ function ได้ ไม่ใช่แค่ลิมิตรวมของ account ซึ่ง default 1,000 ต่อ Region และเป็น soft limit) แล้วใส่ database proxy (การตั้งค่า RDS proxy ใน Lambda) เพื่อรวม connection ที่ใช้ซ้ำ ข้อความที่ล้มซ้ำเก็บใน DLQ และต้องตั้ง visibility timeout ให้พอกับเวลาเขียน\nฝั่งอ่าน: ก่อน cache ถามตัวเองว่าข้อมูลคะแนนช้า/แพง, ถูกเรียกบ่อยและค่อนข้างคงที่, ยอมให้ stale ได้, และคุ้มความซับซ้อนไหม คะแนนรวมตอบทุกข้อ จึง cache ผลคะแนนรวมไว้ใน Amazon ElastiCache (ตอบระดับ submillisecond) ด้วย TTL ราว 5 วินาที หรือตอบจาก API Gateway cache / CloudFront ให้ผู้ชม 1 ล้านคนอ่านสำเนาเดียวกัน แล้วมี query นับคะแนนจริงแค่ครั้งเดียวต่อรอบ TTL\nข้อแลกเปลี่ยน: คะแนนที่ผู้ชมเห็นอาจช้ากว่าความจริงไม่เกิน TTL (stale) และโหวตถูกบันทึกแบบ async จึงเห็นผลช้ากว่าเขียนตรง\nหมายเหตุผู้สรุป (นอก notes): ตัวเลข 200 connection, 20,000 โหวต, 1 ล้านผู้ชม เป็นตัวเลขสมมติของโจทย์ และการตั้ง TTL 5 วินาทีเป็นค่าตัวอย่าง",
   "rubric": [
    "ใช้ SQS buffer ฝั่งเขียน แทนการให้ Lambda เขียน database ตรง",
    "จำกัด concurrency ของ function ที่เขียน database ให้ต่ำกว่าที่ database รับได้ (และรู้ลิมิต concurrency 1,000 ต่อ Region)",
    "ใช้ database proxy เพื่อจัดการ connection pool",
    "ฝั่งอ่าน: cache คะแนนรวม (ElastiCache / API Gateway cache / CloudFront) พร้อม TTL สั้น",
    "ตอบ/ใช้คำถามก่อน cache และบอกข้อแลกเปลี่ยน stale / โหวตเห็นผลช้ากว่า"
   ],
   "topics": [
    {
     "module": "M07",
     "index": 2
    },
    {
     "module": "M07",
     "index": 1
    },
    {
     "module": "M10",
     "index": 2
    },
    {
     "module": "M09",
     "index": 2
    },
    {
     "module": "M09",
     "index": 5
    }
   ],
   "source": [
    "M07 L431-460",
    "M07 L974-977",
    "M07 L1002-1005",
    "M10 L438-468",
    "M09 L133-141",
    "M09 L213-240",
    "M09 L268-286",
    "M09 L404-413"
   ],
   "supplement": true
  }
 ],
 "sets": [
  {
   "id": "A",
   "title": "ชุดซ้อม A",
   "questions": [
    "p-x-1",
    "p-m08-1",
    "p-m09-1",
    "p-m12-1",
    "p-m13-2"
   ]
  },
  {
   "id": "B",
   "title": "ชุดซ้อม B",
   "questions": [
    "p-x-2",
    "p-m07-1",
    "p-m10-2",
    "p-m11-1",
    "p-m12-2"
   ]
  },
  {
   "id": "C",
   "title": "ชุดซ้อม C",
   "questions": [
    "p-x-3",
    "p-x-4",
    "p-m10-1",
    "p-m09-2",
    "p-m13-1"
   ]
  }
 ]
});
