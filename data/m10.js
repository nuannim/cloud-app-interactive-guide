/* M10 Messaging & streaming — SQS, SNS, Kinesis
   source = เลขบรรทัดในไฟล์สไลด์ notes/(10 f) AcademyCloudDeveloping-EN-ILT-M10-SQS-SNS.md */
GUIDE.register({
  module: 'M10',
  title: 'Messaging & streaming (SQS, SNS, Kinesis)',
  summary: 'Sync vs async, SQS Standard/FIFO, visibility timeout, DLQ, short/long polling, SNS fanout + filter policy, Kinesis Streams/Firehose/Analytics, queue vs stream',

  notes: [
    {
      heading: 'ทำไมต้อง async และมี messaging 3 แบบ',
      body: '<ul><li><strong>Sync</strong>: ผู้เรียกส่ง request แล้วรอผลจากปลายทางโดยตรง (coupled แน่น)</li>' +
        '<li><strong>Async</strong><ul><li>ได้ acknowledgement กลับก่อน ผลอาจมาทางอื่นทีหลัง</li>' +
        '<li>พึ่งพากันน้อยลง</li><li>client ตอบสนองไวขึ้น</li></ul></li></ul>' +
        '<ul><li><strong>Queue (SQS)</strong><ol><li>ใส่ข้อความ</li><li>consumer ไป poll</li><li>ประมวลผล</li><li>ลบ</li></ol></li>' +
        '<li><strong>Pub/sub (SNS)</strong>: publish เข้า topic แล้ว push ไปให้ subscriber ทุกราย</li>' +
        '<li><strong>Stream (Kinesis Data Streams)</strong>: ข้อมูลต่อเนื่องปริมาณมาก ไว้รวมและวิเคราะห์</li></ul>',
      refs: ['g-m10-style', 'q-m10-decouple', 'c-m10-style-queue', 'c-m10-style-pubsub']
    },
    {
      heading: 'SQS: Standard vs FIFO',
      body: '<ul><li><strong>Standard</strong> (ค่าเริ่มต้น)<ul><li>ลำดับแบบ best effort</li><li>ส่งอย่างน้อย 1 ครั้ง (อาจซ้ำ)</li><li>throughput แทบไม่จำกัด</li></ul></li>' +
        '<li><strong>FIFO</strong><ul><li>รักษาลำดับ</li><li>ส่งแบบ exactly-once</li><li>throughput จำกัดกว่า</li></ul></li></ul>' +
        '<p><strong>วิธีเลือก</strong></p>' +
        '<ul><li>ลำดับหรือการซ้ำมีผลต่อความถูกต้อง (เช่น ฝากก่อนถอน, ตัดบัตรครั้งเดียว) = FIFO</li>' +
        '<li>เน้นปริมาณมากและลำดับไม่สำคัญ (เช่น resize รูป, ตรวจบัตรจำนวนมาก) = Standard</li></ul>',
      refs: ['g-m10-sqs-type', 'q-m10-fifo', 'q-m10-standard', 'c-m10-type-order', 'c-m10-type-volume']
    },
    {
      heading: 'วงจรข้อความ, visibility timeout, DLQ, polling',
      body: '<ol><li>Producer เรียก <strong>SendMessage</strong></li>' +
        '<li>SQS เก็บสำเนาหลาย server</li>' +
        '<li>Consumer เรียก <strong>ReceiveMessage</strong></li>' +
        '<li>ข้อความถูกซ่อนไว้ช่วง <strong>visibility timeout</strong> (default 30 วินาที)</li>' +
        '<li>ประมวลผลเสร็จต้องเรียก <strong>DeleteMessage</strong></li></ol>' +
        '<p>ถ้าไม่ลบ ข้อความจะกลับมาให้ consumer อื่นเห็นอีก</p>' +
        '<p>ถ้า consumer ล้มเหลวซ้ำจนถึง <strong>maxReceiveCount</strong> ข้อความจะถูกย้ายไป <strong>dead-letter queue</strong> ไว้ตรวจแยกต่างหาก</p>' +
        '<ul><li><strong>Short polling</strong>: สุ่มถามบาง server (อาจพลาดข้อความ)</li>' +
        '<li><strong>Long polling</strong>: ถามทุก server และรอได้ตาม <code>WaitTimeSeconds</code></li></ul>',
      refs: ['l-m10-visibility', 'g-m10-polling', 'q-m10-visibility', 'q-m10-dlq', 'q-m10-polling', 'q-m10-design-supplier'],
      diagram: {
        title: 'วงจรข้อความ SQS + DLQ',
        caption: 'ข้อความถูกซ่อนช่วง visibility timeout ถ้าลบทัน จบ ถ้าไม่ทันจะกลับมาเห็นอีก จนครบ maxReceiveCount จึงเข้า DLQ',
        source: 'L379-468',
        flow: {
          nodes: [
            { id: 'producer', label: 'Producer' },
            { id: 'queue', label: 'SQS queue' },
            { id: 'consumer', label: 'Consumer' },
            { id: 'deleted', label: 'DeleteMessage (สำเร็จ)' },
            { id: 'dlq', label: 'Dead-letter queue' }
          ],
          edges: [
            { from: 'producer', to: 'queue', label: 'SendMessage' },
            { from: 'queue', to: 'consumer', label: 'Receive (ซ่อน 30 s)' },
            { from: 'consumer', to: 'deleted', label: 'delete' },
            { from: 'consumer', to: 'dlq', label: 'fail ถึง maxReceiveCount' }
          ]
        }
      }
    },
    {
      heading: 'SNS: topic, fanout, filter policy',
      body: '<ul><li>Publisher ส่งเข้า <strong>topic</strong> แล้ว SNS push สำเนาไปทุก subscriber (many-to-many)</li>' +
        '<li>Endpoint<ul><li>แบบ A2A: Lambda, SQS, Kinesis Data Firehose, HTTP(S)</li>' +
        '<li>แบบ A2P (แจ้งคน): Email, SMS, mobile push</li></ul></li>' +
        '<li><strong>Fanout</strong>: topic เดียวส่งต่อเข้าหลาย SQS queue ให้แต่ละระบบประมวลผลคนละงาน</li>' +
        '<li><strong>Filter policy</strong><ul><li>ตั้งที่ subscription และใช้ message attributes จากฝั่ง publisher</li>' +
        '<li>subscriber ได้เฉพาะข้อความที่เกี่ยวข้อง</li></ul></li>' +
        '<li>ส่งไม่สำเร็จจะ retry ตาม delivery policy แล้วทิ้งหรือส่งเข้า DLQ</li>' +
        '<li>FIFO topic ใช้คู่กับ FIFO SQS เพื่อรักษาลำดับ</li></ul>',
      refs: ['q-m10-fanout', 'q-m10-filter', 'q-m10-notify', 'q-m10-design-fanout', 'c-m10-sns-a2p'],
      diagram: {
        title: 'SNS fanout เข้าหลาย SQS',
        caption: 'Publisher ส่งเข้า topic เดียว แล้ว SNS push สำเนาไปทุก SQS queue ให้แต่ละระบบทำงานของตัวเอง',
        source: 'L815-843',
        flow: {
          nodes: [
            { id: 'order', label: 'Ordering system' },
            { id: 'topic', label: 'SNS topic new-order' },
            { id: 'q-ful', label: 'SQS: fulfillment' },
            { id: 'q-dw', label: 'SQS: data warehouse' },
            { id: 'q-dev', label: 'SQS: DEV' }
          ],
          edges: [
            { from: 'order', to: 'topic', label: 'publish' },
            { from: 'topic', to: 'q-ful' },
            { from: 'topic', to: 'q-dw' },
            { from: 'topic', to: 'q-dev' }
          ]
        }
      }
    },
    {
      heading: 'Kinesis และ queue vs stream',
      body: '<ul><li><strong>Data Streams</strong><ul><li>รับ พัก และประมวลผลข้อมูลสตรีมแบบ real-time</li><li>เก็บใน shard</li><li>หลาย consumer อ่านได้พร้อมกัน</li></ul></li>' +
        '<li><strong>Data Firehose</strong>: ส่งข้อมูลสตรีมไป data store โดยไม่ต้องเขียน consumer เอง</li>' +
        '<li><strong>Data Analytics</strong>: วิเคราะห์ข้อมูลในสตรีมด้วย SQL (หรือ Flink/Java/Scala/Python)</li></ul>' +
        '<ul><li><strong>Queue</strong><ul><li>ค่าอยู่ที่ข้อความแต่ละชิ้น</li><li>อัตราไม่คงที่</li><li>ประมวลผลแล้วถูกลบ</li><li>เช่น order, ธุรกรรมการเงิน</li></ul></li>' +
        '<li><strong>Stream</strong><ul><li>ค่าอยู่ที่การรวมข้อมูล</li><li>อัตราต่อเนื่องสูง</li><li>หลาย consumer แต่ละคนมี pointer ของตัวเอง</li><li>ไม่ลบ record</li><li>เช่น clickstream, log</li></ul></li></ul>',
      refs: ['g-m10-kinesis', 'q-m10-clickstream', 'q-m10-queue-vs-stream', 'c-m10-kin-firehose'],
      diagram: {
        title: 'Kinesis Data Streams',
        caption: 'Producer put record ลง shard ของ stream (เก็บตาม retention period) แล้ว consumer หลายแบบ poll ไปใช้',
        source: 'L1150-1160',
        flow: {
          nodes: [
            { id: 'producers', label: 'Producers' },
            { id: 'stream', label: 'Kinesis data stream' },
            { id: 'kcl', label: 'KCL app บน EC2' },
            { id: 'lambda', label: 'Lambda function' },
            { id: 'firehose', label: 'Firehose' },
            { id: 's3', label: 'Amazon S3' }
          ],
          edges: [
            { from: 'producers', to: 'stream', label: 'put' },
            { from: 'stream', to: 'kcl', label: 'poll' },
            { from: 'stream', to: 'lambda', label: 'poll' },
            { from: 'stream', to: 'firehose', label: 'poll' },
            { from: 'firehose', to: 's3' }
          ]
        }
      }
    },
    {
      heading: 'โจทย์คาเฟ่: อัปเดตสต็อกจาก supplier',
      body: '<p>แทนที่จะอัปเดตสต็อกบนเว็บด้วยมือ ให้ supplier ส่งข้อมูลผ่านลำดับนี้</p>' +
        '<ol><li>Supplier ส่งข้อมูลเข้า <strong>SNS topic</strong></li>' +
        '<li>ต่อเข้า <strong>SQS queue</strong> (มี DLQ รองรับข้อความที่ประมวลผลไม่สำเร็จ)</li>' +
        '<li>แอปบน Elastic Beanstalk poll คิว</li>' +
        '<li>เขียนลง Aurora Serverless</li></ol>' +
        '<p>ผลที่ได้</p>' +
        '<ul><li>decouple supplier ออกจากแอป</li><li>ข้อความไม่หายแม้แอปช้า</li></ul>',
      refs: ['q-m10-design-supplier', 'q-m10-written-cafe']
    }
  ],

  limits: [
    {
      id: 'l-m10-visibility', service: 'SQS', name: 'Visibility timeout เริ่มต้น', display: '30 วินาที (ข้อความที่ถูก receive จะถูกซ่อนจาก consumer อื่นตลอดช่วงนี้)',
      accept: ['30', '30 วินาที', '30 s', '30 sec', '30 seconds'], source: 'L445',
      sim: {
        unit: 'วินาที', min: 0, limitAt: 30, sliderMax: 120, step: 1, start: 30,
        overMsg: 'ค่านี้สูงกว่า default 30 วินาที (ตั้งเพิ่มได้ แต่ถ้าสั้นเกินเวลาประมวลผลข้อความจะโผล่ซ้ำ)',
        fix: 'ตั้ง visibility timeout ให้ยาวกว่าเวลาที่ consumer ใช้ประมวลผลจริง และต้อง DeleteMessage ก่อนหมดเวลา ไม่งั้นข้อความกลับมาให้ consumer อื่นรับซ้ำ'
      }
    }
  ],

  optionGroups: [
    {
      id: 'g-m10-sqs-type', service: 'SQS', title: 'Standard vs FIFO queue',
      options: [
        { name: 'SQS Standard', traits: 'ลำดับแบบ best effort, at-least-once (อาจซ้ำ), throughput แทบไม่จำกัด', when: 'ปริมาณสูง ลำดับไม่สำคัญ เช่น resize/encode media, ตรวจบัตรเครดิตจำนวนมาก, งานเขียน DB ที่ไม่ขึ้นต่อกัน', tradeoff: 'ไม่รับประกันลำดับ และอาจได้ข้อความซ้ำ' },
        { name: 'SQS FIFO', traits: 'รักษาลำดับ, exactly-once delivery, throughput จำกัดกว่า', when: 'ฝากก่อนถอน, ธุรกรรมบัตรต้องไม่ถูกประมวลผลซ้ำ, นักศึกษาต้องสมัครบัญชีก่อนลงทะเบียนเรียน', tradeoff: 'throughput ต่ำกว่า Standard' }
      ],
      challenges: [
        { id: 'c-m10-type-order', requirement: 'ระบบธนาคารต้องบันทึกการฝากเงินก่อนการถอนเงินเสมอ ลำดับต้องไม่สลับ', answer: 'SQS FIFO', why: 'FIFO รักษาลำดับข้อความ ส่วน Standard เป็นแค่ best effort', source: 'L331-345' },
        { id: 'c-m10-type-volume', requirement: 'ตรวจสอบคำขอบัตรเครดิตจำนวนมหาศาล ลำดับไม่สำคัญ ต้องการ throughput สูงสุด', answer: 'SQS Standard', why: 'Standard throughput แทบไม่จำกัด และเหมาะกับงานที่ไม่ขึ้นกับลำดับ', source: 'L325-343' },
        { id: 'c-m10-type-once', requirement: 'ต้องการให้ธุรกรรมบัตรแต่ละรายการถูกประมวลผลเพียงครั้งเดียว ห้ามซ้ำ', answer: 'SQS FIFO', why: 'FIFO ส่งแบบ exactly-once ส่วน Standard เป็น at-least-once จึงอาจซ้ำ', source: 'L331-341' },
        { id: 'c-m10-type-dup', requirement: 'ผู้ใช้อัปโหลดสื่อและให้ระบบ resize/encode จำนวนมากแบบขนาน ยอมรับได้ถ้าบางข้อความถูกส่งซ้ำ', answer: 'SQS Standard', why: 'งานไม่ขึ้นกับลำดับและทนข้อความซ้ำได้ จึงใช้ Standard ที่ throughput สูงกว่า', source: 'L325-337' }
      ]
    },
    {
      id: 'g-m10-polling', service: 'SQS', title: 'Short polling vs Long polling',
      options: [
        { name: 'Short polling', traits: 'SQS สุ่มตัวอย่างบางส่วนของ server แล้วตอบทันที', when: 'ไม่ได้ต้องการค้นครบทุก server', tradeoff: 'อาจไม่ได้ข้อความที่อยู่บน server ที่ไม่ถูกสุ่ม' },
        { name: 'Long polling', traits: 'SQS สอบถามทุก server และรอตามค่า WaitTimeSeconds', when: 'ต้องการได้ข้อความจากทุก server', tradeoff: 'request ต้องรอ (ตามเวลา wait)' }
      ],
      challenges: [
        { id: 'c-m10-poll-all', requirement: 'consumer ต้องการให้ ReceiveMessage สอบถามข้อความจากทุก SQS server ในคิว', answer: 'Long polling', why: 'long polling query ทุก server ส่วน short polling สุ่มเฉพาะบางส่วน', source: 'L486-499, L566' },
        { id: 'c-m10-poll-sample', requirement: 'ReceiveMessage ที่ SQS สุ่มตัวอย่างเพียงบาง server แล้วตอบกลับ ใช้โหมดใด', answer: 'Short polling', why: 'short polling samples servers จึงอาจพลาดข้อความบางส่วน', source: 'L470-481, L566' },
        { id: 'c-m10-poll-wait', requirement: 'request ReceiveMessage มีพารามิเตอร์ WaitTimeSeconds=10 เพื่อรอข้อความสูงสุด 10 วินาที', answer: 'Long polling', why: 'ตัวอย่างในสไลด์ใช้ long polling ที่กำหนด wait time 10 วินาที', source: 'L502-515' }
      ]
    },
    {
      id: 'g-m10-style', service: 'Messaging', title: 'Queue vs Pub/sub vs Stream',
      options: [
        { name: 'SQS (queue)', traits: 'producer ใส่ข้อความ, consumer poll, ประมวลผล แล้วลบออกจากคิว', when: 'งานแต่ละชิ้นต้องถูกประมวลผลเอง เช่น order, ธุรกรรมการเงิน', tradeoff: 'ข้อความถูกลบหลังประมวลผล ไม่ได้ให้หลายระบบอ่านชุดเดียวกัน' },
        { name: 'SNS (pub/sub)', traits: 'publish เข้า topic แล้ว push ไปทุก subscriber', when: 'ส่งข้อความเดียวให้หลายระบบ/หลายคน (fanout, แจ้งเตือน)', tradeoff: 'เป็นแบบ push ไม่ใช่ให้ consumer poll เอง' },
        { name: 'Kinesis Data Streams (stream)', traits: 'ข้อมูลต่อเนื่องปริมาณมาก เก็บใน shard หลาย consumer อ่านขนาน ไม่ลบ record', when: 'clickstream, application log, วิเคราะห์ real-time', tradeoff: 'เหมาะกับการรวม/วิเคราะห์มากกว่าจัดการข้อความทีละชิ้น' }
      ],
      challenges: [
        { id: 'c-m10-style-queue', requirement: 'ระบบรับออเดอร์ ต้องประมวลผลแต่ละออเดอร์ทีละรายการแล้วลบทิ้งเมื่อเสร็จ', answer: 'SQS (queue)', why: 'queue ให้ consumer poll ประมวลผลแต่ละข้อความและลบหลังเสร็จ เหมาะกับ product orders/ธุรกรรม', source: 'L216, L1303-1308' },
        { id: 'c-m10-style-pubsub', requirement: 'เมื่อมีออเดอร์ใหม่ ต้องแจ้งหลายระบบพร้อมกัน (fulfillment, data warehouse) โดย publisher ส่งครั้งเดียว', answer: 'SNS (pub/sub)', why: 'SNS push สำเนาไปยัง subscriber ทุกราย (fanout)', source: 'L232, L831-843' },
        { id: 'c-m10-style-stream', requirement: 'รวบรวม clickstream ของเว็บที่เข้ามาต่อเนื่องปริมาณสูงเพื่อวิเคราะห์ และให้หลายแอปอ่านพร้อมกัน', answer: 'Kinesis Data Streams (stream)', why: 'stream รองรับข้อมูลต่อเนื่องปริมาณสูง หลาย consumer อ่านคู่ขนาน และ record ไม่ถูกลบ', source: 'L1099-1105, L1303-1308' }
      ]
    },
    {
      id: 'g-m10-kinesis', service: 'Kinesis', title: 'Kinesis Data Streams vs Firehose vs Analytics',
      options: [
        { name: 'Kinesis Data Streams', traits: 'รับ พัก และประมวลผลข้อมูลสตรีมแบบ real-time ด้วย consumer ที่เขียนเอง (KCL บน EC2, Lambda ฯลฯ)', when: 'ต้องควบคุมการประมวลผลเอง หรือมีหลาย consumer', tradeoff: 'ต้องพัฒนา consumer application' },
        { name: 'Kinesis Data Firehose', traits: 'ส่งข้อมูลสตรีมไป data store โดยไม่ต้องเขียน consumer', when: 'ต้องการเก็บสตรีมลง store (เช่น S3) แบบง่าย ๆ', tradeoff: 'เน้นการ deliver ไม่ใช่ logic ประมวลผลเอง' },
        { name: 'Kinesis Data Analytics', traits: 'วิเคราะห์ข้อมูลในสตรีมแบบ real-time ด้วย SQL (หรือ Apache Flink / Java / Scala / Python)', when: 'ต้อง query/วิเคราะห์ข้อมูลก่อนบันทึกลง store', tradeoff: 'เป็นบริการวิเคราะห์ ไม่ใช่ที่รับ-พักข้อมูลหลัก' }
      ],
      challenges: [
        { id: 'c-m10-kin-firehose', requirement: 'ต้องการส่งข้อมูลสตรีมลง data store โดยไม่อยากเขียน consumer application เอง', answer: 'Kinesis Data Firehose', why: 'Firehose deliver ข้อมูลไป store โดยไม่ต้องเขียน consumer ให้สตรีม', source: 'L1180-1183' },
        { id: 'c-m10-kin-analytics', requirement: 'ต้องการรัน SQL query วิเคราะห์ข้อมูลที่ไหลอยู่ในสตรีมแบบ real-time ก่อนบันทึกลง store', answer: 'Kinesis Data Analytics', why: 'Analytics วิเคราะห์ข้อมูลในสตรีมด้วย SQL ก่อน persist', source: 'L1186-1190' },
        { id: 'c-m10-kin-streams', requirement: 'ต้องการที่รับข้อมูลต่อเนื่องปริมาณสูงเข้าสตรีม แล้วเขียน consumer เอง (เช่น KCL บน EC2) มาอ่านและประมวลผล', answer: 'Kinesis Data Streams', why: 'Data Streams เป็นแกนที่ ingest/buffer/process ข้อมูล และ consumer อ่านจาก shard', source: 'L1092-1105, L1157' }
      ]
    },
    {
      id: 'g-m10-sns-endpoint', service: 'SNS', title: 'SNS endpoint: A2A vs A2P',
      options: [
        { name: 'A2A (application-to-application)', traits: 'ส่งให้ระบบ: Lambda, SQS, Kinesis Data Firehose, HTTP(S)', when: 'ส่งข้อมูลระหว่างระบบ เช่น fanout เข้า SQS', tradeoff: 'ไม่ใช่ช่องทางแจ้งผู้ใช้โดยตรง' },
        { name: 'A2P (application-to-person)', traits: 'ส่งให้คน: Email, SMS, mobile push', when: 'แจ้งเตือนผู้ใช้/ทีมงาน', tradeoff: 'ไม่ใช่ endpoint สำหรับระบบประมวลผลอัตโนมัติ' }
      ],
      challenges: [
        { id: 'c-m10-sns-a2p', requirement: 'ส่งอีเมลและ SMS แจ้งผู้จัดการเมื่อสต็อกสินค้าใกล้หมด', answer: 'A2P (application-to-person)', why: 'Email/SMS/mobile push คือ endpoint แบบ A2P สำหรับแจ้งคน', source: 'L822, L1066' },
        { id: 'c-m10-sns-a2a', requirement: 'ให้ SNS topic ส่งข้อความต่อเข้า SQS queue และ Lambda function', answer: 'A2A (application-to-application)', why: 'SQS และ Lambda เป็น endpoint แบบ A2A (ระบบถึงระบบ)', source: 'L822, L1066' }
      ]
    }
  ],

  questions: [
    {
      id: 'q-m10-decouple', type: 'scenario', format: 'choice', source: 'L126-164, L270-272',
      prompt: 'เว็บสั่งซื้อของคาเฟ่เรียกระบบตัดสต็อกโดยตรงแบบ synchronous ทำให้ถ้าระบบตัดสต็อกช้า หน้าเว็บก็ช้าตามและพึ่งพากันแน่น ทีมต้องการลดการพึ่งพากันและให้หน้าเว็บตอบสนองไวขึ้น ควรทำอย่างไร',
      keywords: ['synchronous', 'ลดการพึ่งพากัน'],
      choices: [
        { text: 'ออกแบบเป็น asynchronous โดยใช้ messaging service เช่น SQS มาคั่นกลาง', correct: true, why: 'async ลด interdependency และช่วยให้ client ตอบสนองไวขึ้น ส่วน messaging services (queue, pub/sub, stream) ช่วยสร้างดีไซน์แบบนี้' },
        { text: 'ให้ระบบตัดสต็อกตอบเร็วขึ้นโดยคงการเรียกแบบ synchronous ไว้', correct: false, why: 'ยังคง coupled แน่นเหมือนเดิม ปัญหาการพึ่งพากันไม่หาย' },
        { text: 'ให้หน้าเว็บ retry เรียกระบบตัดสต็อกซ้ำ ๆ จนกว่าจะสำเร็จ', correct: false, why: 'เป็นการเพิ่มภาระและยังต้องรอผลแบบ sync ไม่ได้ decouple' },
        { text: 'รวมสองระบบเป็นแอปเดียวกัน', correct: false, why: 'ยิ่งทำให้ coupled แน่นขึ้น ขัดกับเป้าหมาย' }
      ]
    },
    {
      id: 'q-m10-fifo', type: 'scenario', format: 'choice', source: 'L1485-1504, L331-345',
      prompt: 'ธนาคารต้องการเชื่อมแอปแบบ asynchronous เพื่อประมวลผลธุรกรรมฝาก/ถอนของลูกค้าทีละรายการ โดยต้องทำตามลำดับที่เข้ามา และห้ามประมวลผลซ้ำ ควรเลือกอะไร',
      keywords: ['ตามลำดับที่เข้ามา', 'ห้ามประมวลผลซ้ำ'],
      choices: [
        { text: 'SQS FIFO queue', correct: true, why: 'FIFO รักษาลำดับและส่งแบบ exactly-once ตรงกับ keyword ในโจทย์ (individual transactions + order)' },
        { text: 'SQS Standard queue', correct: false, why: 'ลำดับเป็น best effort และอาจมีข้อความซ้ำ' },
        { text: 'Kinesis Data Firehose', correct: false, why: 'ใช้ส่งสตรีมไป data store ไม่ใช่ queue สำหรับทีละธุรกรรม' },
        { text: 'SNS topic แบบ standard ส่งให้ subscriber ทุกราย', correct: false, why: 'เป็น fanout ไม่ได้ทำ queue แบบรักษาลำดับ/ประมวลผลครั้งเดียว' }
      ]
    },
    {
      id: 'q-m10-standard', type: 'scenario', format: 'choice', source: 'L325-343',
      prompt: 'ผู้ใช้อัปโหลดรูปหลายพันรูปต่อนาที ระบบต้องส่งข้อความเข้าคิวเพื่อให้ worker resize รูปแบบขนาน ลำดับของรูปไม่สำคัญ ต้องการปริมาณงานสูงสุด ข้อใดถูกต้อง (เลือก 2 ข้อ)',
      keywords: ['ลำดับของรูปไม่สำคัญ', 'ปริมาณงานสูงสุด'],
      choices: [
        { text: 'ใช้ SQS Standard queue เพราะ throughput แทบไม่จำกัด', correct: true, why: 'Standard เหมาะกับ media resize/encode ที่ไม่ขึ้นกับลำดับ' },
        { text: 'ออกแบบให้ worker ทนข้อความซ้ำได้ (เช่น resize รูปเดิมซ้ำไม่เกิดผลเสีย)', correct: true, why: 'Standard เป็น at-least-once อาจส่งข้อความซ้ำ จึงต้องรับมือ' },
        { text: 'ใช้ SQS FIFO เพราะรับประกัน exactly-once จึงเร็วที่สุด', correct: false, why: 'FIFO มี throughput จำกัดกว่า ไม่ใช่ตัวเลือกที่ให้ปริมาณสูงสุด' },
        { text: 'ใช้ SNS email เป็นคิวให้ worker', correct: false, why: 'email เป็น endpoint แบบ A2P สำหรับคน ไม่ใช่คิวงาน' }
      ]
    },
    {
      id: 'q-m10-visibility', type: 'scenario', format: 'choice', source: 'L438-452',
      prompt: 'consumer ตัวหนึ่งรับข้อความจากคิว SQS มาประมวลผล แต่ผู้ดูแลพบว่า consumer ตัวอื่นรับข้อความเดียวกันไปประมวลผลซ้ำ เพราะ consumer แรกใช้เวลานานกว่าที่ตั้งไว้และยังไม่ลบข้อความ ควรตรวจและแก้อย่างไร',
      keywords: ['รับข้อความเดียวกัน', 'ยังไม่ลบข้อความ'],
      choices: [
        { text: 'ปรับ visibility timeout ให้ยาวกว่าเวลาประมวลผลจริง และให้ consumer เรียก DeleteMessage ก่อนหมดเวลา', correct: true, why: 'ข้อความถูกซ่อนแค่ช่วง visibility timeout (default 30 วินาที) ถ้ายังไม่ลบเมื่อหมดเวลา จะกลับมาให้ consumer อื่นเห็น' },
        { text: 'เปลี่ยนเป็น short polling', correct: false, why: 'polling mode ไม่ได้ควบคุมช่วงเวลาที่ข้อความถูกซ่อน' },
        { text: 'ตั้ง dead-letter queue ให้คิว', correct: false, why: 'DLQ รับข้อความที่ล้มเหลวซ้ำเกิน maxReceiveCount ไม่ได้กันการ receive ซ้ำระหว่างประมวลผล' },
        { text: 'เปลี่ยนเป็น SNS topic', correct: false, why: 'SNS push ไปทุก subscriber ไม่ได้แก้ปัญหาข้อความถูกรับซ้ำ' }
      ]
    },
    {
      id: 'q-m10-dlq', type: 'scenario', format: 'choice', source: 'L454-468, L562-564, L643-651',
      prompt: 'ข้อความบางชิ้นในคิว SQS ทำให้ consumer ประมวลผลล้มเหลวทุกครั้ง ข้อความวนกลับมาให้ลองใหม่ซ้ำ ๆ ทีมต้องการแยกข้อความที่มีปัญหาออกไปตรวจสอบต่างหาก โดยไม่ขัดขวางข้อความอื่น ควรทำอย่างไร',
      keywords: ['ล้มเหลวทุกครั้ง', 'แยกข้อความที่มีปัญหา'],
      choices: [
        { text: 'ตั้ง dead-letter queue พร้อม RedrivePolicy ที่กำหนด maxReceiveCount', correct: true, why: 'เมื่อ receive เกินจำนวนครั้งที่กำหนด ข้อความจะถูกย้ายไป DLQ เพื่อประมวลผล/ตรวจแยก' },
        { text: 'เพิ่ม visibility timeout ให้ยาวที่สุด', correct: false, why: 'แค่ยืดเวลาซ่อน ข้อความที่พังก็ยังวนกลับมาอยู่ดี' },
        { text: 'เปลี่ยนจาก Standard เป็น FIFO', correct: false, why: 'ชนิดคิวไม่ได้แยกข้อความที่ล้มเหลวออก' },
        { text: 'เปลี่ยนเป็น long polling', correct: false, why: 'polling mode เกี่ยวกับวิธีดึงข้อความ ไม่ได้จัดการข้อความที่พัง' }
      ]
    },
    {
      id: 'q-m10-polling', type: 'scenario', format: 'choice', source: 'L470-515, L566',
      prompt: 'consumer ของคิว SQS เรียก ReceiveMessage บ่อย ๆ แต่บางครั้งได้ผลว่างทั้งที่ในคิวมีข้อความอยู่ เพราะ SQS ตอบจากบาง server เท่านั้น ทีมต้องการให้ query ทุก server ควรปรับอย่างไร',
      keywords: ['บาง server', 'ทุก server'],
      choices: [
        { text: 'เปิด long polling โดยกำหนด WaitTimeSeconds ใน ReceiveMessage', correct: true, why: 'long polling query ทุก server ส่วน short polling แค่สุ่มตัวอย่างบาง server' },
        { text: 'คง short polling แต่เรียกถี่ขึ้น', correct: false, why: 'short polling ยังสุ่มบางส่วนเหมือนเดิม และเรียกถี่ขึ้นก็ไม่ใช่วิธีให้ query ทุก server' },
        { text: 'เพิ่ม maxReceiveCount ของ DLQ', correct: false, why: 'ไม่เกี่ยวกับการดึงข้อความจาก server' },
        { text: 'เปลี่ยนไปใช้ SNS A2P', correct: false, why: 'เป็นช่องทางแจ้งคน ไม่ใช่วิธีดึงข้อความจากคิว' }
      ]
    },
    {
      id: 'q-m10-fanout', type: 'scenario', format: 'choice', source: 'L831-858',
      prompt: 'ระบบ ordering ของร้านต้องส่งข้อมูลออเดอร์ใหม่ให้หลายระบบพร้อมกัน ได้แก่ fulfillment, data warehouse และทีม dev โดยแต่ละระบบประมวลผลด้วยจังหวะของตัวเองและ publisher ไม่อยากรู้จักปลายทางแต่ละตัว ควรออกแบบอย่างไร',
      keywords: ['หลายระบบพร้อมกัน', 'จังหวะของตัวเอง'],
      choices: [
        { text: 'publish เข้า SNS topic แล้วให้แต่ละระบบมี SQS queue ของตัวเองสมัครเป็น subscriber (fanout)', correct: true, why: 'SNS ส่งสำเนาให้ทุก subscriber และ SQS ของแต่ละระบบเก็บข้อความไว้ให้ประมวลผลตามจังหวะตัวเอง' },
        { text: 'ส่งเข้า SQS queue เดียว ให้ทุกระบบแย่งกัน poll', correct: false, why: 'ข้อความถูกประมวลผลแล้วลบ จึงได้แค่ระบบเดียวต่อข้อความ ไม่ใช่ทุกระบบ' },
        { text: 'ให้ ordering system เรียกแต่ละระบบโดยตรงแบบ synchronous', correct: false, why: 'coupled แน่น ต้องรู้จักทุกปลายทางและรอทีละระบบ' },
        { text: 'ใช้ Kinesis Data Analytics ส่งข้อความให้ทุกระบบ', correct: false, why: 'Analytics ใช้วิเคราะห์ข้อมูลสตรีมด้วย SQL ไม่ใช่ตัวกระจายข้อความ' }
      ]
    },
    {
      id: 'q-m10-filter', type: 'scenario', format: 'choice', source: 'L909-993, L1062',
      prompt: 'เว็บ e-commerce publish event หลายชนิดเข้า SNS topic เดียว (เช่น order_placed, order_cancelled, product_page_visited) ระบบ Payment ต้องการรับเฉพาะ event ที่ขึ้นต้นด้วย order เท่านั้น ควรทำอย่างไร',
      keywords: ['รับเฉพาะ event', 'topic เดียว'],
      choices: [
        { text: 'ตั้ง filter policy บน subscription ของ Payment และให้ publisher ใส่ message attribute event_type', correct: true, why: 'subscriber ที่ตั้ง FilterPolicy จะได้เฉพาะข้อความที่ attribute ตรงเงื่อนไข (รองรับ prefix เช่น order)' },
        { text: 'สร้าง topic แยกให้ทุก event type แล้วให้ Payment อ่านเอง', correct: false, why: 'ไม่ใช้ความสามารถ filtering ของ SNS และทำให้ฝั่ง publisher ต้องจัดการ routing เอง' },
        { text: 'ให้ Payment รับทุกข้อความแล้วกรองในโค้ดตัวเอง', correct: false, why: 'ขัดกับจุดเด่นของ SNS ที่ offload filtering logic จากฝั่ง subscriber' },
        { text: 'เปลี่ยนไปใช้ SQS FIFO', correct: false, why: 'FIFO เกี่ยวกับลำดับ ไม่ได้กรองข้อความตามประเภท' }
      ]
    },
    {
      id: 'q-m10-notify', type: 'scenario', format: 'choice', source: 'L822, L1066',
      prompt: 'เมื่อ supplier ส่งข้อมูลสต็อกที่ผิดปกติเข้ามา ต้องการแจ้งเจ้าของร้านทางอีเมลและ SMS โดยใช้ SNS ควรใช้ endpoint แบบใด',
      keywords: ['อีเมลและ SMS'],
      choices: [
        { text: 'A2P (application-to-person) เช่น Email และ SMS', correct: true, why: 'Email, SMS, mobile push เป็น endpoint ที่ SNS ใช้แจ้งคน' },
        { text: 'A2A เช่น SQS queue', correct: false, why: 'A2A ส่งให้ระบบ ไม่ใช่ให้คนรับอีเมล/SMS' },
        { text: 'Kinesis Data Firehose', correct: false, why: 'เป็น endpoint ส่งข้อมูลเข้า data store ไม่ใช่ช่องทางแจ้งคน' },
        { text: 'ใช้ dead-letter queue', correct: false, why: 'DLQ เก็บข้อความที่ส่ง/ประมวลผลไม่สำเร็จ ไม่ใช่ช่องทางแจ้งเตือนคน' }
      ]
    },
    {
      id: 'q-m10-clickstream', type: 'scenario', format: 'choice', source: 'L1092-1105, L1180-1190, L1303-1308',
      prompt: 'เว็บมี clickstream ไหลเข้ามาต่อเนื่องปริมาณสูง ทีมต้องการเก็บไว้ในสตรีมให้หลายแอปอ่านขนานกันได้ โดยแต่ละแอปอ่านตาม pointer ของตัวเอง และมีอีกงานที่ต้องส่งข้อมูลลง S3 โดยไม่เขียน consumer เอง ควรเลือกอย่างไร (เลือก 2 ข้อ)',
      keywords: ['หลายแอปอ่านขนาน', 'ไม่เขียน consumer เอง'],
      choices: [
        { text: 'ใช้ Kinesis Data Streams เป็นที่รับและพักข้อมูลสตรีม', correct: true, why: 'Streams รองรับข้อมูลต่อเนื่องปริมาณสูง หลาย consumer อ่านขนานโดยแต่ละตัวถือ pointer และ record ไม่ถูกลบ' },
        { text: 'ใช้ Kinesis Data Firehose ส่งข้อมูลลง S3', correct: true, why: 'Firehose deliver ข้อมูลสตรีมไป data store โดยไม่ต้องเขียน consumer เอง' },
        { text: 'ใช้ SQS Standard เป็นที่เก็บให้หลายแอปอ่านชุดเดียวกัน', correct: false, why: 'ข้อความ SQS ถูกลบหลังประมวลผล ไม่ได้ให้หลาย consumer อ่านชุดเดียวกันตาม pointer' },
        { text: 'ใช้ SNS A2P ส่ง SMS ทุก click', correct: false, why: 'A2P แจ้งคน ไม่ใช่การประมวลผลสตรีม' }
      ]
    },
    {
      id: 'q-m10-queue-vs-stream', type: 'scenario', format: 'written', source: 'L1296-1308',
      prompt: 'ทีมกำลังตัดสินใจระหว่างใช้ SQS กับ Kinesis Data Streams สำหรับสองงาน: (ก) ประมวลผลออเดอร์สินค้าของลูกค้าทีละรายการ (ข) เก็บ application log ที่ไหลต่อเนื่องปริมาณสูงเพื่อนำไปรวมวิเคราะห์ จงเลือก service ให้แต่ละงาน พร้อมอธิบายความต่างระหว่าง queue กับ stream อย่างน้อย 3 ด้าน',
      keywords: ['application log', 'ทีละรายการ'],
      rubric: [
        'เลือก SQS (queue) สำหรับออเดอร์ และ Kinesis Data Streams สำหรับ application log',
        'ระบุว่า queue ค่าอยู่ที่ข้อความแต่ละชิ้น ส่วน stream ค่าอยู่ที่การรวมข้อมูลเพื่อวิเคราะห์',
        'ระบุว่า queue อัตราข้อความไม่คงที่ ส่วน stream ต่อเนื่องปริมาณสูง',
        'ระบุว่า queue ลบข้อความหลังประมวลผลสำเร็จ ส่วน stream หลาย consumer อ่านขนานโดยแต่ละตัวมี pointer และไม่ลบ record'
      ],
      modelAnswer: '(ก) ใช้ SQS เพราะออเดอร์เป็นข้อความที่ต้องประมวลผลแยกทีละชิ้น consumer poll มาประมวลผลแล้วลบออกจากคิว (ถ้าลำดับสำคัญใช้ FIFO)\n(ข) ใช้ Kinesis Data Streams เพราะ log ไหลมาต่อเนื่องปริมาณสูง และคุณค่าอยู่ที่การรวมวิเคราะห์\n\nความต่าง: 1) คุณค่าของข้อมูล: queue = แต่ละข้อความ / stream = การ aggregate 2) อัตราข้อความ: queue = แปรผัน / stream = ต่อเนื่องและสูง 3) การประมวลผล: queue ลบข้อความหลังสำเร็จ / stream หลาย consumer อ่านขนาน แต่ละตัวมี pointer ของตัวเองและไม่ลบ record'
    },
    {
      id: 'q-m10-written-cafe', type: 'scenario', format: 'written', source: 'L82, L1389, L438-468',
      prompt: 'ปัจจุบันคาเฟ่ต้องอัปเดตสต็อกกาแฟบนเว็บด้วยมือ ผู้จัดการต้องการให้ supplier ส่งข้อมูลสต็อกเข้ามาแล้วระบบประมวลผลเองอัตโนมัติ และถ้าข้อความใดประมวลผลไม่สำเร็จต้องไม่หายและตรวจย้อนหลังได้ จงเสนอแนวทางด้วย messaging services พร้อมอธิบายบทบาทของแต่ละ service และกลไกที่กันข้อความหาย',
      keywords: ['supplier', 'ไม่หาย'],
      rubric: [
        'ให้ supplier publish ข้อมูลเข้า SNS topic',
        'SNS ส่งต่อเข้า SQS queue ที่ subscribe topic นั้น เพื่อ decouple supplier กับแอป',
        'แอป (เช่น บน Elastic Beanstalk) poll ข้อความจาก SQS แล้วอัปเดตฐานข้อมูล (Aurora Serverless)',
        'มี dead-letter queue (maxReceiveCount) เก็บข้อความที่ประมวลผลไม่สำเร็จ',
        'กล่าวถึง visibility timeout / การ DeleteMessage หลังประมวลผลสำเร็จ'
      ],
      modelAnswer: 'ให้ supplier publish ข้อมูลสต็อกเข้า SNS topic แล้วให้ SQS queue สมัครเป็น subscriber ของ topic ทำให้ supplier ไม่ต้องพึ่งแอปโดยตรง (async) แอปบน Elastic Beanstalk poll ข้อความจาก SQS ประมวลผล แล้วอัปเดตตารางสต็อกใน Aurora Serverless จากนั้นเรียก DeleteMessage\n\nระหว่างประมวลผล SQS ซ่อนข้อความด้วย visibility timeout ถ้าแอปไม่ลบทันก็จะกลับมาให้ลองใหม่ และถ้าล้มเหลวซ้ำจนเกิน maxReceiveCount ข้อความจะย้ายไป dead-letter queue ไว้ตรวจย้อนหลัง จึงไม่สูญหาย'
    },
    {
      id: 'q-m10-design-supplier', type: 'design', format: 'written', source: 'L82, L1389, L438-468',
      prompt: 'ออกแบบ flow ระบบรับสต็อกจาก supplier ของคาเฟ่: supplier ส่งข้อมูลสต็อก ต้องมี topic รับและกระจาย คิวเก็บข้อความ แอปดึงข้อความไปประมวลผลแล้วเก็บลงฐานข้อมูล และมีที่แยกเก็บข้อความที่ประมวลผลล้มเหลว จงวาดแผนภาพพร้อมลำดับบนลูกศรและอธิบายแต่ละขั้น',
      keywords: ['supplier', 'ข้อความที่ประมวลผลล้มเหลว'],
      flow: {
        nodes: [
          { id: 'supplier', label: 'Coffee suppliers' },
          { id: 'sns', label: 'SNS topic' },
          { id: 'sqs', label: 'SQS queue' },
          { id: 'dlq', label: 'SQS DLQ' },
          { id: 'app', label: 'Elastic Beanstalk app' },
          { id: 'aurora', label: 'Aurora Serverless' }
        ],
        edges: [
          { from: 'supplier', to: 'sns', label: '1 publish' },
          { from: 'sns', to: 'sqs', label: '2' },
          { from: 'app', to: 'sqs', label: '3 poll' },
          { from: 'app', to: 'aurora', label: '4' },
          { from: 'sqs', to: 'dlq', label: 'เกิน maxReceiveCount' }
        ],
        distractors: ['Kinesis Data Firehose', 'S3', 'API Gateway']
      },
      rubric: [
        'มีลำดับ Supplier → SNS topic → SQS queue',
        'แอปเป็นฝ่าย poll SQS แล้วเขียนลง Aurora Serverless',
        'มี DLQ ต่อจาก SQS สำหรับข้อความที่ล้มเหลวเกิน maxReceiveCount',
        'อธิบายว่า SNS ทำ pub/sub ส่ง และ SQS ช่วย decouple/บัฟเฟอร์',
        'กล่าวถึง visibility timeout และ DeleteMessage หลังประมวลผลสำเร็จ'
      ],
      modelAnswer: '1) supplier publish ข้อมูลสต็อกเข้า SNS topic\n2) SNS ส่งสำเนาไปยัง SQS queue ที่ subscribe อยู่\n3) แอปบน Elastic Beanstalk poll ข้อความจาก SQS (ข้อความถูกซ่อนด้วย visibility timeout ระหว่างประมวลผล)\n4) แอปอัปเดตสต็อกลง Aurora Serverless แล้ว DeleteMessage\nถ้าประมวลผลล้มเหลวซ้ำเกิน maxReceiveCount ข้อความถูกย้ายไป DLQ เพื่อตรวจแยก'
    },
    {
      id: 'q-m10-design-fanout', type: 'design', format: 'written', source: 'L847-858',
      prompt: 'ออกแบบ flow ประมวลผลรูปแบบ fanout: ผู้ใช้อัปโหลดรูปลง S3 bucket ต้นทาง จากนั้นต้องสร้างรูปหลายขนาดพร้อมกัน (thumbnail, ขนาดสำหรับมือถือ, ขนาดสำหรับเว็บ) แล้วเก็บผลลง S3 bucket ปลายทาง โดยแต่ละงานประมวลผลอิสระต่อกัน จงวาดแผนภาพพร้อมลำดับบนลูกศรและอธิบาย',
      keywords: ['fanout', 'พร้อมกัน'],
      flow: {
        nodes: [
          { id: 'src', label: 'S3 source bucket' },
          { id: 'l1', label: 'Lambda (publish)' },
          { id: 'sns', label: 'SNS topic' },
          { id: 'q1', label: 'SQS: thumbnail' },
          { id: 'q2', label: 'SQS: mobile' },
          { id: 'q3', label: 'SQS: web' },
          { id: 'l2', label: 'Lambda (resize)' },
          { id: 'dst', label: 'S3 destination bucket' }
        ],
        edges: [
          { from: 'src', to: 'l1', label: '1' },
          { from: 'l1', to: 'sns', label: '2 publish' },
          { from: 'sns', to: 'q1', label: '3' },
          { from: 'sns', to: 'q2', label: '3' },
          { from: 'sns', to: 'q3', label: '3' },
          { from: 'q1', to: 'l2', label: '4' },
          { from: 'q2', to: 'l2', label: '4' },
          { from: 'q3', to: 'l2', label: '4' },
          { from: 'l2', to: 'dst', label: '5' }
        ],
        distractors: ['Kinesis Data Analytics', 'RDS', 'SNS SMS']
      },
      rubric: [
        'S3 source → Lambda → SNS topic',
        'SNS topic fanout ไปหลาย SQS queue (ขนาดละคิว)',
        'Lambda ดึงจากแต่ละ queue มา resize แล้วเขียนลง S3 ปลายทาง',
        'อธิบายว่า topic เดียวส่งสำเนาให้ทุก subscriber และ SQS ให้แต่ละงานประมวลผลอิสระ'
      ],
      modelAnswer: '1) ผู้ใช้อัปโหลดรูปลง S3 ต้นทาง ซึ่งเรียก Lambda\n2) Lambda publish ข้อความเข้า SNS topic\n3) SNS fanout สำเนาไปยัง SQS 3 คิว (thumbnail, mobile, web)\n4) Lambda ของแต่ละคิว poll ข้อความมา resize รูปตามขนาดนั้น\n5) เขียนผลลง S3 ปลายทาง\nแต่ละงานแยกกันและไม่กระทบกันเพราะมีคิวของตัวเอง'
    }
  ]
});
