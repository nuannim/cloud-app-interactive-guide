/* M07 Lambda — ตัวอย่างโครงข้อมูลที่ถูกต้อง (ดู docs/data-schema.md)
   source = เลขบรรทัดในไฟล์สไลด์ต้นฉบับ (notes/ ... M07-Lambda.md) */
GUIDE.register({
  module: 'M07',
  title: 'Lambda',
  summary: 'Serverless compute, invocation แบบ sync/async/polling, สิทธิ์, version/alias, layer, monitoring',

  notes: [
    {
      heading: 'Lambda คืออะไร',
      body: '<p>Lambda คือ compute แบบ serverless เราส่งโค้ดขึ้นไป ไม่ต้องสร้างหรือดูแล server โค้ดจะรันเมื่อมี <strong>event</strong> เข้ามา ระบบ scale ให้เอง จ่ายเฉพาะช่วงที่รันจริง ไม่จ่ายตอนว่าง และมี log/metric ส่งเข้า CloudWatch ให้ในตัว</p>' +
        '<p>สองรูปแบบที่สไลด์ยกเป็นตัวอย่าง: (1) เว็บบน S3 → API Gateway → Lambda → DynamoDB (2) stream แบบ real-time: Kinesis → Lambda → DynamoDB</p>',
      refs: ['q-m07-design', 'q-m07-design-stream', 'q-m07-written'],
      diagram: {
        title: 'เว็บ cafe แบบ dynamic',
        caption: 'S3 เสิร์ฟหน้าเว็บ ส่วนข้อมูลมาจาก API Gateway → Lambda → DynamoDB',
        source: 'L101, L1742',
        flow: {
          nodes: [
            { id: 'user', label: 'User / Browser' },
            { id: 's3', label: 'S3 (website)' },
            { id: 'apigw', label: 'API Gateway' },
            { id: 'lambda', label: 'Lambda' },
            { id: 'ddb', label: 'DynamoDB' }
          ],
          edges: [
            { from: 'user', to: 's3', label: '1 load page' },
            { from: 'user', to: 'apigw', label: '2 call API' },
            { from: 'apigw', to: 'lambda', label: '3 invoke' },
            { from: 'lambda', to: 'ddb', label: 'query' }
          ]
        }
      }
    },
    {
      heading: 'Invocation 3 แบบ (ออกสอบบ่อย)',
      body: '<ul>' +
        '<li><strong>Synchronous (push)</strong>: ผู้เรียกยืนรอคำตอบ เช่น API Gateway ไม่มี retry ในตัว ผู้เรียกต้องจัดการ error เอง</li>' +
        '<li><strong>Asynchronous (push)</strong>: Lambda รับ event เข้าคิวแล้วตอบ ack 202 ทันที เช่น S3 retry 0–2 ครั้ง เก็บ event ที่ล้มเหลวด้วย DLQ หรือ destination ได้</li>' +
        '<li><strong>Polling / event source mapping (pull)</strong>: Lambda เป็นฝ่ายไปดึงจาก SQS, Kinesis, DynamoDB Streams แล้วส่งเป็น batch ถ้า error ฝั่ง stream shard จะติดค้าง ฝั่ง SQS batch ถูกคืนเข้าคิว</li></ul>' +
        '<p>คีย์เวิร์ด: "ต้องรอผล" = sync, "ไม่ต้องรอ / fire-and-forget" = async, "ดึงจากคิว/stream เป็นชุด" = polling</p>',
      refs: ['g-m07-invocation', 'q-m07-async-fail', 'l-m07-async-retry', 'l-m07-async-wait'],
      diagram: {
        title: 'Async invocation: คิว, retry, DLQ',
        caption: 'ตอบ 202 ทันทีโดยยังไม่รันเสร็จ และ event ที่ล้มเหลวส่งไป DLQ/destination ได้',
        source: 'L479-512, L578-591, L1001, L1211-1220',
        flow: {
          nodes: [
            { id: 'caller', label: 'Client / S3' },
            { id: 'queue', label: 'Lambda event queue' },
            { id: 'fn', label: 'Lambda function' },
            { id: 'dlq', label: 'DLQ / destination' }
          ],
          edges: [
            { from: 'caller', to: 'queue', label: 'Event (202 ack)' },
            { from: 'queue', to: 'fn', label: 'run' },
            { from: 'fn', to: 'dlq', label: 'fail หลัง retry 0-2' }
          ]
        }
      }
    },
    {
      heading: 'ลิมิตและ config ด้านประสิทธิภาพ',
      body: '<ul><li>Memory 128–10,240 MB และ CPU เพิ่มตามสัดส่วน memory</li><li>Timeout ตั้งได้ 1 วินาที ถึง <strong>15 นาที</strong> งานที่นานกว่านี้ไม่เหมาะกับ Lambda</li>' +
        '<li>Concurrency ค่าเริ่มต้น 1,000 ต่อ Region ต่อ account (soft limit) ตั้ง limit ราย function ได้เพื่อไม่ให้ระบบปลายทางล้น หรือจองส่วนแบ่งไว้</li>' +
        '<li><strong>Provisioned concurrency</strong> = อุ่น environment ไว้ ลด cold start คิดเงินแยก</li>' +
        '<li>Layer ใส่ได้ไม่เกิน 5 ต่อ function ตัวเลขขนาดที่สไลด์ให้คือ 250 MB</li></ul>',
      refs: ['l-m07-timeout', 'l-m07-memory', 'l-m07-concurrency', 'l-m07-layers', 'l-m07-layer-size', 'q-m07-timeout', 'q-m07-concurrency', 'g-m07-config']
    },
    {
      heading: 'สิทธิ์ 2 ชั้น: ใครเรียกได้ vs function ทำอะไรได้',
      body: '<ul><li><strong>Resource (function) policy</strong> = อนุญาตให้ event source (เช่น S3, SNS) เรียก function ด้วย action <code>lambda:InvokeFunction</code> เพิ่มได้ด้วย <code>aws lambda add-permission</code></li>' +
        '<li><strong>Execution role</strong> = สิ่งที่ function ทำกับ service อื่นได้ (เขียน log, อ่าน DynamoDB) ประกอบด้วย IAM policy และ trust policy ที่ให้ lambda.amazonaws.com assume role</li></ul>' +
        '<p>จำง่าย ๆ: ขาเข้า = resource policy, ขาออก = execution role</p>',
      refs: ['g-m07-permission', 'c-m07-perm-s3', 'c-m07-perm-ddb']
    },
    {
      heading: 'ส่งโค้ดขึ้น Lambda (Deploy): .zip หรือ container image',
      body: '<p>เขียนโค้ดเสร็จแล้วยังรันไม่ได้ ต้อง "ส่งขึ้นระบบ" (deploy) ก่อน ซึ่งทำได้ 2 ท่า:</p>' +
        '<ul><li><strong>.zip archive</strong>: ตอนสร้าง function เลือก <strong>runtime</strong> (เช่น Python) แล้วบีบอัดโค้ด + library ที่ใช้เป็น .zip ส่งเข้า Lambda ตรง ๆ (จาก console หรือ IDE) <em>หรือ</em> พักไฟล์ไว้ที่ <strong>Amazon S3</strong> แล้วบอก Lambda ให้ไปเอา</li>' +
        '<li><strong>Container image</strong>: ตอน build image เลือก <strong>runtime + Linux distribution</strong> เอง build จาก Dockerfile แล้วเก็บ image ไว้ที่ <strong>Amazon ECR</strong> (registry ของ AWS) Lambda จะดึง image ไปรัน</li></ul>' +
        '<p>ข้อสอบ Knowledge Check ข้อ 8 ถามว่า .zip ขนาด 75 MB ต้องทำอย่างไร เฉลยคือ <strong>อัปโหลดตรงได้ไม่เกิน 50 MB</strong> ถ้าใหญ่กว่านั้นให้พักที่ S3 ก่อน</p>' +
        '<p>จำง่าย ๆ: แพ็กเล็ก ๆ ใช้ภาษาที่ AWS รองรับ → .zip · อยากใช้เครื่องมือ Docker เดิมหรือแพ็กใหญ่ → container image ส่วนภาษาที่ AWS ไม่รองรับใช้ <strong>custom runtime</strong> (มีไฟล์ <code>bootstrap</code> เป็นจุดเริ่ม) วางไว้กับโค้ดหรือใน layer ก็ได้</p>' +
        '<p class="small muted">ตัวเลขที่มี * ในแผนภาพ (.zip ไม่เกิน 250 MB หลังคลายไฟล์, container image ไม่เกิน 10 GB) ไม่ได้อยู่ในสไลด์ เป็นข้อมูลจากเอกสาร AWS (นอก notes)</p>',
      refs: ['k-m07-08'],
      diagrams: [
        {
          title: 'ส่งโค้ดขึ้น Lambda 2 ทาง',
          caption: '.zip อัปโหลดตรงหรือพักที่ S3 · container image ต้องผ่าน ECR',
          source: 'L1136-1190',
          supplement: true,
          svgId: 'm07-deploy'
        }
      ]
    },
    {
      heading: 'Version และ Alias: สำเนาที่แก้ไม่ได้ + ป้ายที่ย้ายได้',
      body: '<p><strong>ปัญหาที่มันแก้:</strong> โค้ดมีการแก้บ่อย แต่ลูกค้าจริงควรใช้เฉพาะตัวที่ทดสอบแล้ว และเราอยากสลับ/ย้อนกลับให้เร็ว</p>' +
        '<ol><li><strong>$LATEST = ฉบับร่าง</strong> คือโค้ดที่กำลังเขียนอยู่ แก้ได้ตลอด (ARN ลงท้าย <code>:$LATEST</code>)</li>' +
        '<li><strong>Publish = ถ่ายสำเนา</strong> เก็บสำเนา $LATEST ทั้งโค้ดและ config เป็น <strong>Version 1, 2, 3 …</strong> เลขเรียงต่อกัน <strong>แก้ไม่ได้อีก</strong> และมี ARN ของตัวเอง (ลงท้ายด้วยตัวเลข เช่น <code>:1</code>)</li>' +
        '<li><strong>Alias = ป้ายชื่อที่ชี้ไปที่ version</strong> เช่น <code>PROD</code>, <code>TEST</code> ย้ายป้ายไปชี้ version อื่นได้ (ต่างจาก version ที่แก้ไม่ได้) และมี ARN ของตัวเอง ลงท้ายด้วยชื่อ เช่น <code>:PROD</code></li></ol>' +
        '<p><strong>เปรียบเทียบกับ Git:</strong> $LATEST ≈ ไฟล์ที่กำลังแก้ ยังไม่ commit · Version ≈ commit (แก้ย้อนหลังไม่ได้ เรียงลำดับ) · Alias ≈ tag/branch ที่ย้ายไปชี้ commit อื่นได้</p>' +
        '<p><strong>ทำไมต้องมี alias:</strong> ให้ trigger (เช่น API Gateway, S3) ชี้ที่ <code>:PROD</code> ครั้งเดียวพอ เมื่อออกเวอร์ชันใหม่ก็แค่ย้ายป้าย ไม่ต้องไปแก้ trigger และถ้าเวอร์ชันใหม่มีปัญหาก็ย้ายป้ายกลับเวอร์ชันเก่าได้ทันที</p>' +
        '<p><strong>ดู ARN ในข้อสอบ:</strong> ลงท้ายด้วยตัวเลข = version · ลงท้ายด้วยชื่อ (เช่น PROD) = alias · ลงท้าย <code>$LATEST</code> = ฉบับร่าง (Knowledge Check ข้อ 9)</p>' +
        '<p><strong>ตัวอย่าง:</strong> ลูกค้าจริงใช้ PROD (ชี้ Version 1) ทีมทดสอบใช้ TEST (ชี้ Version 2) พอ Version 2 ทดสอบผ่านก็ย้าย PROD ไปชี้ Version 2 (ดูภาพ 2 ขั้นด้านล่าง)</p>',
      refs: ['g-m07-version', 'q-m07-written-release', 'c-m07-ver-snapshot', 'c-m07-ver-alias', 'k-m07-09'],
      diagrams: [
        {
          title: 'ขั้นที่ 1: PROD ชี้ Version 1, TEST ชี้ Version 2',
          caption: 'version เรียงบนเส้นเวลาเดียวกัน (ซ้ายเก่า ขวาใหม่) alias เป็นป้ายที่ชี้ลงมา',
          source: 'L1200-1285',
          svgId: 'm07-version-before'
        },
        {
          title: 'ขั้นที่ 2: ทดสอบผ่าน ย้าย PROD ไป Version 2',
          caption: 'ย้ายแค่ป้าย trigger ไม่ต้องแก้ Version 1 ยังอยู่ ย้ายกลับได้ทันที',
          source: 'L1200-1285',
          svgId: 'm07-version-after'
        }
      ]
    },
    {
      heading: 'Layer: กองไลบรารีไว้ตรงกลางให้ทุก function ใช้ร่วมกัน',
      body: '<p>ถ้ามี function 8 ตัวใช้ไลบรารีชุดเดียวกัน (เช่น numpy, requests) แล้วยัดไลบรารีลงใน .zip ของทุกตัว ไฟล์จะใหญ่ ซ้ำซ้อน และอัปเดตทีต้อง deploy ทุกตัว</p>' +
        '<p><strong>Layer</strong> คือการแพ็กโค้ด/ไลบรารี/ข้อมูลที่ใช้ร่วมกันไว้ที่เดียว แล้วให้ function "อ้างอิง" ไปใช้ ผลที่สไลด์ระบุ: <strong>ลดขนาด package</strong> และ <strong>deploy เร็วขึ้น</strong></p>' +
        '<ul><li>ลิมิตตามสไลด์: ผูกได้ <strong>ไม่เกิน 5 layer</strong> ต่อ function และสไลด์เขียนตัวเลข <strong>250 MB</strong> (สไลด์ไม่ได้บอกชัดว่าเป็นต่อ layer หรือรวมทุก layer)</li>' +
        '<li>custom runtime (ภาษาที่ไม่รองรับ) วางไว้ใน layer ได้</li></ul>' +
        '<p>จำง่าย ๆ: "ไลบรารีซ้ำกันหลาย function → ใช้ layer"</p>' +
        '<p class="small muted">ตัวเลข 1 MB / 49 MB ในแผนภาพเป็นตัวอย่างประกอบให้เห็นภาพ ไม่ใช่ค่าจากสไลด์</p>',
      refs: ['q-m07-layer', 'c-m07-cfg-layer', 'l-m07-layers', 'l-m07-layer-size'],
      diagrams: [
        {
          title: 'ก่อน/หลังใช้ Layer',
          caption: 'function เหลือแค่โค้ด ไลบรารีกองไว้ที่ Layer ตรงกลาง (ตัวเลข MB เป็นตัวอย่าง)',
          source: 'L1312-1329',
          svgId: 'm07-layers'
        }
      ]
    },
    {
      heading: 'Monitoring: CloudWatch vs X-Ray',
      body: '<ul><li><strong>CloudWatch</strong>: log, metric, alarm ของ function</li>' +
        '<li><strong>X-Ray</strong>: ตาม request ที่วิ่งผ่านหลาย service เห็น service map และจุดที่ช้า ประกอบด้วย segment และ subsegment</li>' +
        '<li>Annotation = key-value ที่ถูก index ใช้ filter ได้ / Metadata = ข้อมูลชนิดใดก็ได้ ไม่ถูก index ใช้ค้นหาไม่ได้</li></ul>',
      refs: ['q-m07-xray', 'g-m07-monitor']
    }
  ],

  limits: [
    {
      id: 'l-m07-timeout', service: 'Lambda', name: 'Timeout สูงสุด', display: '15 นาที (900 วินาที) ตั้งได้ตั้งแต่ 1 วินาที',
      accept: ['15 นาที', '15 min', '15 minutes', '900 วินาที', '900 s', '900', '15'], source: 'L975',
      sim: {
        unit: 'วินาที', min: 0, lowAt: 1, limitAt: 900, sliderMax: 1800, step: 1, start: 30,
        overMsg: 'Timeout ตั้งได้สูงสุด 15 นาที (900 วินาที)',
        underMsg: 'Timeout ต่ำสุดคือ 1 วินาที',
        fix: 'งานที่นานกว่า 15 นาทีไม่เหมาะกับ Lambda ให้ไปรันบน container (M08) หรือแตกเป็นขั้นย่อยแล้วประสานด้วย Step Functions (M11)'
      }
    },
    {
      id: 'l-m07-memory', service: 'Lambda', name: 'Memory', display: '128 – 10,240 MB (CPU เพิ่มตามสัดส่วนของ memory)',
      accept: ['128-10240', '128 - 10240', '128–10240', '128-10240 mb', '10240', '10240 mb', '10,240 mb', '10 gb'], source: 'L974',
      sim: {
        unit: 'MB', min: 0, lowAt: 128, limitAt: 10240, sliderMax: 12000, step: 64, start: 512,
        overMsg: 'Memory ตั้งได้สูงสุด 10,240 MB',
        underMsg: 'Memory ต่ำสุดคือ 128 MB',
        fix: 'ไม่มีช่องให้ตั้งค่าเกินนี้ ถ้างานหนักกว่านี้ต้องแตกงานหรือใช้บริการอื่น (เพิ่ม memory = เพิ่ม CPU ตามสัดส่วนอยู่แล้ว)'
      }
    },
    {
      id: 'l-m07-concurrency', service: 'Lambda', name: 'Concurrency เริ่มต้น', display: '1,000 invocation พร้อมกัน ต่อ Region ต่อ account (soft limit ขอเพิ่มได้)',
      accept: ['1000', '1,000', '1000 concurrent', '1000 invocations'], source: 'L976',
      sim: {
        unit: 'invocations', min: 0, limitAt: 1000, sliderMax: 2000, step: 10, start: 200,
        overMsg: 'เกิน default 1,000 concurrent ต่อ Region ต่อ account',
        fix: 'เป็น soft limit ขอเพิ่มได้ หรือตั้ง per-function concurrency เพื่อจองส่วนแบ่ง/กันไม่ให้ function หนึ่งกิน pool จนระบบปลายทางล้น'
      }
    },
    {
      id: 'l-m07-layers', service: 'Lambda', name: 'จำนวน layer ต่อ function', display: 'ไม่เกิน 5 layer',
      accept: ['5', '5 layers', 'five', '5 layer'], source: 'L1327',
      sim: {
        unit: 'layers', min: 0, limitAt: 5, sliderMax: 10, step: 1, start: 2,
        overMsg: 'ผูก layer ได้ไม่เกิน 5 ต่อ function',
        fix: 'รวมไลบรารีหลายตัวไว้ใน layer เดียวกัน หรือแพ็กทั้งหมดเป็น container image'
      }
    },
    {
      id: 'l-m07-async-retry', service: 'Lambda', name: 'Retry ของ async invocation', display: '0–2 ครั้ง',
      accept: ['0-2', '0–2', '2', '2 ครั้ง', '0 ถึง 2'], source: 'L1001',
      sim: {
        unit: 'ครั้ง', min: 0, limitAt: 2, sliderMax: 5, step: 1, start: 1,
        overMsg: 'async retry ตั้งได้ 0–2 ครั้งเท่านั้น',
        fix: 'ใช้ DLQ หรือ destination (on failure) เก็บ event ที่ยังล้มเหลวแทนการ retry เพิ่ม'
      }
    },
    {
      id: 'l-m07-async-wait', service: 'Lambda', name: 'เวลาสูงสุดที่ event async รอในคิว', display: 'สูงสุด 6 ชั่วโมง',
      accept: ['6 ชั่วโมง', '6 hours', '6 h', '6 hr', '6'], source: 'L1001'
    },
    {
      id: 'l-m07-layer-size', service: 'Lambda', name: 'ขนาด layer ที่สไลด์ระบุ', display: '250 MB (สไลด์เขียนเพียงตัวเลขนี้ใต้หัวข้อ limit ของ layer)',
      accept: ['250', '250 mb', '250mb'], source: 'L1329'
    },
    {
      id: 'l-m07-async-ack', service: 'Lambda', name: 'StatusCode ที่ตอบกลับ async invocation', display: '202 (sync สำเร็จแสดง 200)',
      accept: ['202', 'statuscode 202', 'http 202'], source: 'L591'
    },
    {
      id: 'l-m07-sync-retry', service: 'Lambda', name: 'Retry ของ synchronous invocation', display: 'ไม่มี retry ในตัว (0)',
      accept: ['0', 'none', 'ไม่มี', 'no retry', 'ไม่มี retry'], source: 'L490'
    }
  ],

  optionGroups: [
    {
      id: 'g-m07-invocation', service: 'Lambda', title: 'รูปแบบการเรียก (invocation)',
      options: [
        { name: 'Synchronous', traits: 'ผู้เรียกรอผลตอบกลับ (RequestResponse) ไม่มี retry ในตัว เช่น API Gateway เรียก', when: 'ต้องการผลทันที เช่น REST endpoint', tradeoff: 'ผู้เรียกต้องจัดการ error/retry เอง' },
        { name: 'Asynchronous', traits: 'Lambda เอา event เข้าคิวก่อน ตอบ 202 retry 0–2 ครั้ง ตั้ง DLQ/destination ได้ เช่น S3', when: 'ไม่ต้องรอผล (fire-and-forget) เช่น S3 upload event', tradeoff: 'ผู้เรียกไม่ได้ผลลัพธ์กลับ' },
        { name: 'Polling (event source mapping)', traits: 'Lambda ไปดึงจาก SQS / Kinesis / DynamoDB Streams แล้วส่งเป็น batch', when: 'ประมวลผล queue หรือ stream เป็นชุด', tradeoff: 'stream: error ใน shard บล็อกต่อ / SQS: batch ที่ error กลับเข้าคิว' }
      ],
      challenges: [
        { id: 'c-m07-inv-api', requirement: 'API Gateway ต้องเรียก Lambda เพื่อคืนรายการสินค้าให้เบราว์เซอร์ทันที', answer: 'Synchronous', why: 'ผู้เรียก (API Gateway) ต้องรอผลลัพธ์เพื่อตอบกลับผู้ใช้', source: 'L431-460' },
        { id: 'c-m07-inv-s3', requirement: 'ผู้ใช้อัปโหลดรูปขึ้น S3 แล้วให้ Lambda สร้าง thumbnail โดยผู้อัปโหลดไม่ต้องรอผล', answer: 'Asynchronous', why: 'S3 เรียกแบบ async: Lambda รับ event เข้าคิวแล้วตอบ 202 ไม่รอผล และ retry ได้ 0–2 ครั้ง', source: 'L479-512' },
        { id: 'c-m07-inv-sqs', requirement: 'ให้ Lambda ดึงข้อความจากคิว SQS มาประมวลผลเป็น batch', answer: 'Polling (event source mapping)', why: 'Lambda เป็นฝ่ายไป poll คิว/stream แล้วส่ง batch ให้ function', source: 'L521-540' }
      ]
    },
    {
      id: 'g-m07-version', service: 'Lambda', title: 'Version vs Alias',
      options: [
        { name: '$LATEST', traits: 'เวอร์ชันที่แก้ไขได้ (mutable) สร้างพร้อม function', when: 'ช่วงพัฒนา', tradeoff: 'ไม่เสถียรสำหรับผูก event source' },
        { name: 'Published version', traits: 'snapshot ของโค้ด + config แก้ไขไม่ได้ มี ARN ของตัวเอง', when: 'ต้องการ freeze release เพื่อ rollback', tradeoff: 'ออกเวอร์ชันใหม่ = ARN ใหม่' },
        { name: 'Alias', traits: 'ตัวชี้ (pointer) ไปยัง version เช่น PROD มี ARN ของตัวเอง', when: 'event source ชี้ที่ alias เพื่อไม่ต้องแก้เมื่อออก version ใหม่', tradeoff: 'ต้องจำไว้ว่า alias ชี้ไป version ไหน' }
      ],
      challenges: [
        { id: 'c-m07-ver-snapshot', requirement: 'ต้องการเก็บโค้ดและ config ที่เปลี่ยนแปลงไม่ได้ไว้ เผื่อ rollback ภายหลัง', answer: 'Published version', why: 'version ที่ publish แล้วเป็น snapshot แก้ไม่ได้ ต่างจาก $LATEST ที่แก้ได้เรื่อย ๆ', source: 'L1204' },
        { id: 'c-m07-ver-alias', requirement: 'ต้องการให้ S3 trigger ชี้ที่เดียวและไม่ต้องแก้ ทุกครั้งที่ปล่อย version ใหม่', answer: 'Alias', why: 'alias เป็น pointer ที่ย้ายไปชี้ version ใหม่ได้ event source จึงไม่ต้องอัปเดต', source: 'L1280' }
      ]
    },
    {
      id: 'g-m07-permission', service: 'Lambda', title: 'ชนิดของสิทธิ์',
      options: [
        { name: 'Resource (function) policy', traits: 'บอกว่า "ใครเรียก function ได้" เช่น s3.amazonaws.com ได้ lambda:InvokeFunction', when: 'ให้ S3 / SNS / service อื่น trigger function', tradeoff: 'เพิ่มด้วย aws lambda add-permission' },
        { name: 'Execution role', traits: 'บอกว่า "function ทำอะไรกับ service อื่นได้" มี IAM policy + trust policy (lambda.amazonaws.com assume role)', when: 'function ต้องเขียน log, อ่าน DynamoDB, ส่ง SQS ฯลฯ', tradeoff: 'ให้สิทธิ์เท่าที่จำเป็น (least privilege)' }
      ],
      challenges: [
        { id: 'c-m07-perm-s3', requirement: 'ต้องการให้ S3 bucket มีสิทธิ์เรียก (invoke) Lambda function', answer: 'Resource (function) policy', why: 'การอนุญาต "ผู้เรียก" ใช้ resource-based policy บน function', source: 'L664-688' },
        { id: 'c-m07-perm-ddb', requirement: 'Lambda function ต้องเขียน log ลง CloudWatch และอ่านตาราง DynamoDB', answer: 'Execution role', why: 'สิทธิ์ที่ function ใช้เข้าถึง service อื่นมาจาก execution role', source: 'L759' }
      ]
    },
    {
      id: 'g-m07-config', service: 'Lambda', title: 'ตัวเลือกด้าน concurrency / package / runtime',
      options: [
        { name: 'Provisioned concurrency', traits: 'อุ่น (keep warm) environment ไว้ล่วงหน้า ลด cold start คิดเงินแยก', when: 'งานที่ไวต่อ latency ต้องเลี่ยง cold start', tradeoff: 'มีค่าใช้จ่ายเพิ่ม' },
        { name: 'Per-function concurrency limit', traits: 'ตั้งเพดานราย function เพื่อกันระบบปลายทางล้น หรือจองส่วนแบ่งจาก pool ของ account', when: 'function เขียนลง database ที่รับโหลดได้จำกัด', tradeoff: 'ใช้ส่วนแบ่งจาก pool 1,000 ของ account' },
        { name: 'Lambda layer', traits: 'ชุดไลบรารี/โค้ดที่หลาย function แชร์ ลดขนาด package ใส่ได้ไม่เกิน 5', when: 'หลาย function ใช้ dependency ชุดเดียวกัน', tradeoff: 'ผูกได้ไม่เกิน 5 layer ต่อ function' },
        { name: 'Environment variables', traits: 'key-value ที่โค้ดอ่านได้ ใช้เก็บ config โดยไม่ต้องแก้โค้ด', when: 'ต้องเปลี่ยนค่า config เช่น ชื่อตาราง โดยไม่ deploy โค้ดใหม่', tradeoff: 'ไม่ใช่ที่เก็บ dependency' },
        { name: 'Custom runtime', traits: 'ใช้ภาษาที่ Lambda ไม่รองรับ มีไฟล์ bootstrap เป็นจุดเริ่ม deploy ข้างโค้ดหรือใน layer ได้', when: 'ภาษาที่ต้องการไม่อยู่ในรายการ runtime ที่รองรับ', tradeoff: 'ต้องจัดการ runtime interface เอง' }
      ],
      challenges: [
        { id: 'c-m07-cfg-prov', requirement: 'API ที่ผู้ใช้เรียกเจอ cold start ช้าตอนเริ่ม ต้องการให้ environment พร้อมรันตลอดและยอมจ่ายเพิ่ม', answer: 'Provisioned concurrency', why: 'provisioned concurrency อุ่น environment ไว้เพื่อหลีกเลี่ยง cold start และคิดเงินแยก', source: 'L977' },
        { id: 'c-m07-cfg-reserve', requirement: 'Lambda เขียนลง database เดิม ถ้าถูกเรียกพร้อมกันมากจะทำให้ database ล้น ต้องจำกัดจำนวนที่รันพร้อมกันของ function นี้', answer: 'Per-function concurrency limit', why: 'ตั้ง limit ราย function ได้เพื่อไม่ให้ระบบปลายทางถูกถล่ม', source: 'L976' },
        { id: 'c-m07-cfg-layer', requirement: '8 function ใช้ไลบรารีเดียวกัน ไม่อยากแพ็กซ้ำทุก function', answer: 'Lambda layer', why: 'layer เก็บโค้ด/ข้อมูลที่แชร์กันข้าม function ลดขนาด package และเร่ง deploy', source: 'L1315-1329' },
        { id: 'c-m07-cfg-env', requirement: 'ต้องเปลี่ยนชื่อตาราง DynamoDB ที่ function ใช้ โดยไม่ต้องแก้โค้ด', answer: 'Environment variables', why: 'environment variables เก็บ config ที่โค้ดอ่านได้โดยไม่ต้องแก้โค้ด', source: 'L1026' },
        { id: 'c-m07-cfg-custom', requirement: 'ทีมเขียนโค้ดด้วยภาษาที่ Lambda ไม่มี runtime รองรับ แต่ยังอยากรันบน Lambda', answer: 'Custom runtime', why: 'custom runtime ให้ใช้ภาษาอื่นได้ โดยมีไฟล์ bootstrap เป็น entry point', source: 'L1288-1298' }
      ]
    },
    {
      id: 'g-m07-monitor', service: 'Lambda', title: 'X-Ray: annotation vs metadata',
      options: [
        { name: 'Annotations', traits: 'key-value ที่ถูก index ใช้กับ filter expression เพื่อจัดกลุ่ม trace', when: 'ต้องการค้นหา/กรอง trace ด้วยค่านั้น', tradeoff: 'ต้องเลือกเฉพาะค่าที่จะใช้ค้นจริง' },
        { name: 'Metadata', traits: 'key-value ชนิดใดก็ได้ ไม่ถูก index', when: 'เก็บข้อมูลประกอบใน trace ที่ไม่ได้ใช้ค้นหา', tradeoff: 'ค้นหา/filter ด้วยค่านี้ไม่ได้' }
      ],
      challenges: [
        { id: 'c-m07-xr-ann', requirement: 'ต้องการแปะค่า เช่น customer tier ลงใน trace เพื่อ filter ดูเฉพาะ trace ของลูกค้ากลุ่มนั้นในคอนโซล', answer: 'Annotations', why: 'annotation ถูก index ใช้กับ filter expression ได้', source: 'L1614' },
        { id: 'c-m07-xr-meta', requirement: 'ต้องการเก็บ object ขนาดใหญ่ไว้ใน trace เพื่อ debug แต่ไม่ต้องใช้ค้นหา', answer: 'Metadata', why: 'metadata เก็บค่าชนิดใดก็ได้ ไม่ถูก index จึงใช้ค้นหาไม่ได้', source: 'L1615' }
      ]
    }
  ],

  questions: [
    {
      id: 'q-m07-layer', type: 'scenario', format: 'choice', source: 'L1319-1329',
      prompt: 'ทีมมี Lambda 8 function ที่ใช้ไลบรารี Python ชุดเดียวกัน ไลบรารีมีขนาดใหญ่ ทำให้ package ของทุก function ใหญ่และต้อง deploy ไลบรารีซ้ำทุกครั้ง ต้องการลดความซ้ำซ้อน ควรทำอย่างไร',
      keywords: ['ไลบรารี', 'ชุดเดียวกัน', 'ซ้ำ'],
      choices: [
        { text: 'สร้าง Lambda layer เก็บไลบรารีนั้น แล้วให้ทุก function เรียกใช้ layer', correct: true, why: 'layer คือชุดไลบรารีที่หลาย function แชร์กันได้ ไม่ต้องแพ็กซ้ำ' },
        { text: 'เพิ่ม memory ของทุก function เป็น 10,240 MB', correct: false, why: 'memory ไม่เกี่ยวกับขนาด package หรือการแชร์ไลบรารี' },
        { text: 'เปลี่ยนให้ทุก function ถูกเรียกแบบ asynchronous', correct: false, why: 'รูปแบบการเรียกไม่ช่วยเรื่องขนาด/การ deploy ไลบรารี' },
        { text: 'สร้าง alias ชื่อ PROD ให้ทุก function', correct: false, why: 'alias เป็นตัวชี้ไปยัง version ไม่ได้แชร์ไลบรารี' }
      ]
    },
    {
      id: 'q-m07-timeout', type: 'scenario', format: 'choice', source: 'L975',
      prompt: 'งานสร้างรายงานประจำเดือนใช้เวลาประมาณ 25 นาทีต่อรอบ ทีมอยากย้ายไปรันบน Lambda เพราะไม่อยากดูแล server ข้อใดถูกต้อง',
      keywords: ['25 นาที'],
      choices: [
        { text: 'ไม่เหมาะ เพราะ timeout สูงสุดของ Lambda คือ 15 นาที ควรใช้บริการอื่น เช่นรันบน container', correct: true, why: 'Lambda ตั้ง timeout ได้ไม่เกิน 15 นาที งานที่นานกว่านั้นต้องแยกงานหรือไปรันที่อื่น' },
        { text: 'ตั้ง timeout เป็น 25 นาทีได้ตามต้องการ', correct: false, why: 'เกินลิมิต 15 นาที ตั้งไม่ได้' },
        { text: 'เพิ่ม memory เป็น 10,240 MB แล้ว timeout จะขยายเอง', correct: false, why: 'memory กับ timeout เป็นคนละค่ากัน เพิ่ม memory ไม่ได้ขยายเวลา' },
        { text: 'ใช้ Lambda layer เพื่อเพิ่มเวลาที่รันได้', correct: false, why: 'layer ใช้แชร์ไลบรารี ไม่เกี่ยวกับเวลา' }
      ]
    },
    {
      id: 'q-m07-async-fail', type: 'scenario', format: 'choice', source: 'L1000-1001',
      prompt: 'S3 เรียก Lambda function แบบ asynchronous บางครั้ง function ล้มเหลวแม้ retry แล้ว ทีมต้องการไม่ให้ event สูญหายและรู้ว่า event ไหนล้มเหลว ควรทำอย่างไร (เลือก 2 ข้อ)',
      keywords: ['asynchronous', 'ไม่ให้ event สูญหาย'],
      choices: [
        { text: 'ตั้ง destination แบบ on failure ไปที่ SQS queue หรือ SNS topic', correct: true, why: 'destination รับ invocation record เมื่อล้มเหลว (หรือสำเร็จ) ได้' },
        { text: 'ตั้ง dead-letter queue (DLQ) สำหรับ async invocation', correct: true, why: 'DLQ เก็บ event ที่ยังล้มเหลวหลัง retry ครบ' },
        { text: 'ตั้ง retry เป็น 5 ครั้ง', correct: false, why: 'async retry ตั้งได้สูงสุดแค่ 0–2 ครั้ง' },
        { text: 'เปลี่ยนไปเรียกแบบ synchronous', correct: false, why: 'S3 เป็นผู้เรียกแบบ async ไม่ใช่ตัวเลือกที่เปลี่ยนได้ และ sync ก็ไม่มี retry ในตัว' }
      ]
    },
    {
      id: 'q-m07-written', type: 'scenario', format: 'written', source: 'L101, L1742',
      prompt: 'คาเฟ่มีเว็บไซต์ static ที่โฮสต์บน S3 ตอนนี้อยากให้หน้าเว็บแสดงรายการสินค้าจากตาราง DynamoDB แบบ dynamic โดยทีมไม่อยากดูแล server เอง จงเสนอแนวทาง อธิบายว่าแต่ละ service ทำหน้าที่อะไร และต้องตั้งสิทธิ์อะไรให้ Lambda บ้าง',
      keywords: ['ไม่อยากดูแล server', 'DynamoDB'],
      rubric: [
        'เสนอ API Gateway เป็นจุดรับ request จากหน้าเว็บ (REST API)',
        'เสนอ Lambda ทำหน้าที่ query DynamoDB (serverless ไม่ต้องดูแล server)',
        'อธิบายว่า API Gateway เรียก Lambda แบบ synchronous เพื่อรอผลส่งกลับ',
        'ระบุ execution role ให้ Lambda อ่าน DynamoDB และเขียน log ลง CloudWatch',
        'ระบุ resource policy ให้ API Gateway มีสิทธิ์ invoke Lambda'
      ],
      modelAnswer: 'ให้หน้าเว็บบน S3 เรียก REST API ที่ API Gateway ซึ่งผูก integration กับ Lambda function (เช่น get_all_products) ตอนมี request API Gateway จะเรียก Lambda แบบ synchronous เพราะต้องรอผลไปตอบเบราว์เซอร์ Lambda query ตาราง DynamoDB (FoodProducts) แล้วส่งข้อมูลกลับผ่าน API Gateway ไปแสดงที่หน้าเว็บ\n\nสิทธิ์: ตั้ง execution role ให้ Lambda (trust policy ให้ lambda.amazonaws.com assume role + IAM policy อนุญาตอ่าน DynamoDB และเขียน log ลง CloudWatch Logs) และมี resource-based policy บน function ให้ API Gateway มีสิทธิ์ lambda:InvokeFunction ทั้งหมดไม่ต้องมี server ให้ดูแล และจ่ายตามการใช้งานจริง'
    },
    {
      id: 'q-m07-design', type: 'design', format: 'written', source: 'L101, L1742',
      prompt: 'ออกแบบ flow ของเว็บคาเฟ่แบบ dynamic: ผู้ใช้เปิดหน้าเว็บ (โฮสต์บน S3) หน้าเว็บเรียก REST API เพื่อดึงรายการสินค้า ข้อมูลสินค้าเก็บใน DynamoDB และต้องการให้เห็น log การทำงานของ function ภายหลัง จงวาดแผนภาพ flow พร้อมใส่ลำดับขั้นตอนบนลูกศร และเขียนอธิบายสั้น ๆ ว่าแต่ละขั้นเกิดอะไรขึ้น',
      keywords: ['REST API', 'DynamoDB', 'log'],
      flow: {
        nodes: [
          { id: 'user', label: 'User / Browser' },
          { id: 's3', label: 'S3 (website)' },
          { id: 'apigw', label: 'API Gateway' },
          { id: 'lambda', label: 'Lambda' },
          { id: 'ddb', label: 'DynamoDB' },
          { id: 'cw', label: 'CloudWatch Logs' }
        ],
        edges: [
          { from: 'user', to: 's3', label: '1' },
          { from: 's3', to: 'apigw', label: '2' },
          { from: 'apigw', to: 'lambda', label: '3' },
          { from: 'lambda', to: 'ddb', label: '4' },
          { from: 'lambda', to: 'cw', label: 'log' }
        ],
        distractors: ['EC2', 'SQS', 'RDS']
      },
      rubric: [
        'มีลำดับ User → S3 (เว็บ) → API Gateway → Lambda → DynamoDB ครบ',
        'ลูกศรจากหน้าเว็บไป API Gateway เป็นการเรียก REST API',
        'API Gateway เรียก Lambda (sync) และ Lambda เป็นตัว query DynamoDB',
        'มี Lambda ส่ง log ไป CloudWatch Logs',
        'อธิบายสั้น ๆ ว่าแต่ละขั้นทำอะไร'
      ],
      modelAnswer: '1) ผู้ใช้เปิดเว็บ ได้ไฟล์ HTML/JS จาก S3\n2) JavaScript บนหน้าเว็บเรียก REST API ที่ API Gateway\n3) API Gateway เรียก Lambda function (synchronous)\n4) Lambda query ตาราง DynamoDB แล้วส่งข้อมูลกลับผ่าน API Gateway ไปแสดงที่เว็บ\nระหว่างทำงาน Lambda เขียน log ไปที่ CloudWatch Logs (log group /aws/lambda/<ชื่อ function>) เพื่อไว้ตรวจสอบภายหลัง'
    },
    {
      id: 'q-m07-concurrency', type: 'scenario', format: 'choice', source: 'L976',
      prompt: 'Lambda function ตัวหนึ่งเขียนข้อมูลลงฐานข้อมูลที่รับงานพร้อมกันได้จำกัด เมื่อมี event เข้ามาเป็นจำนวนมาก ฐานข้อมูลล้ม ทีมต้องการไม่ให้ function นี้ทำให้ฐานข้อมูลปลายทางล้น ควรทำอย่างไร',
      keywords: ['ฐานข้อมูล', 'ล้น'],
      choices: [
        { text: 'ตั้ง per-function concurrency limit ให้ function นี้', correct: true, why: 'สไลด์ระบุว่าตั้ง limit ราย function ได้เพื่อป้องกันระบบปลายทางถูกถล่ม' },
        { text: 'เปิด provisioned concurrency', correct: false, why: 'ใช้ลด cold start ไม่ได้จำกัดจำนวนที่รันพร้อมกัน' },
        { text: 'เพิ่ม memory เป็น 10,240 MB', correct: false, why: 'memory เพิ่ม CPU ไม่ได้ควบคุมจำนวนที่รันพร้อมกัน' },
        { text: 'ตั้ง timeout เป็น 15 นาที', correct: false, why: 'timeout คือเวลารันสูงสุดต่อ invocation ไม่เกี่ยวกับจำนวนที่รันพร้อมกัน' }
      ]
    },
    {
      id: 'q-m07-xray', type: 'scenario', format: 'choice', source: 'L1580-1596, L1614-1615',
      prompt: 'ระบบมี API Gateway เรียก Lambda แล้ว query DynamoDB ผู้ใช้บ่นว่าช้า ทีมต้องการ trace request ข้าม service เพื่อหาว่าขั้นไหนเป็นคอขวด และต้องการติด key-value ที่ใช้ filter ค้นหา trace ได้ ควรทำอย่างไร (เลือก 2 ข้อ)',
      keywords: ['trace request', 'filter'],
      choices: [
        { text: 'เปิด AWS X-Ray (active tracing) ให้ function', correct: true, why: 'X-Ray ตาม request ข้ามหลาย service แสดง service map และ latency จุดที่ช้า' },
        { text: 'ใส่ข้อมูลเป็น annotation ใน trace', correct: true, why: 'annotation ถูก index และใช้กับ filter expression ได้' },
        { text: 'ใส่ข้อมูลเป็น metadata ใน trace', correct: false, why: 'metadata ไม่ถูก index ใช้ค้นหา trace ไม่ได้' },
        { text: 'ดูแค่ CloudWatch Logs ของ Lambda อย่างเดียว', correct: false, why: 'log ของ function เดียวไม่เห็นภาพ request ข้าม service ทั้งเส้น' }
      ]
    },
    {
      id: 'q-m07-written-release', type: 'scenario', format: 'written', source: 'L664-688, L1197-1285',
      prompt: 'ทีมให้ S3 trigger Lambda เพื่อประมวลผลไฟล์ที่อัปโหลด ทีมออกโค้ดใหม่บ่อย และต้องการ (1) rollback ไปโค้ดเก่าได้ (2) ไม่ต้องแก้ trigger ทุกครั้งที่ออกเวอร์ชันใหม่ (3) ให้ S3 มีสิทธิ์เรียก function ได้ จงอธิบายแนวทาง',
      keywords: ['rollback', 'ไม่ต้องแก้ trigger', 'S3'],
      rubric: [
        'publish version ที่แก้ไขไม่ได้ (immutable snapshot) ทุกครั้งที่ปล่อย',
        'สร้าง alias เช่น PROD ชี้ไปยัง version และให้ S3 trigger ชี้ที่ alias',
        'rollback ด้วยการย้าย alias กลับไปชี้ version เก่า ไม่ต้องแก้ trigger',
        'ใช้ resource-based (function) policy ให้ S3 มีสิทธิ์ lambda:InvokeFunction',
        'กล่าวว่า S3 เรียกแบบ asynchronous (อาจเสริม DLQ/destination)'
      ],
      modelAnswer: 'ทุกครั้งที่ปล่อยโค้ดให้ publish เป็น version ซึ่งเป็น snapshot ของโค้ดและ config ที่แก้ไม่ได้ จากนั้นสร้าง alias เช่น PROD ชี้ไปที่ version ล่าสุดที่ผ่านการทดสอบ แล้วตั้ง S3 trigger ให้ใช้ ARN ของ alias ครั้งต่อไปเมื่อออก version ใหม่ก็แค่ย้าย alias ไปชี้ version ใหม่ โดยไม่ต้องแก้ trigger ถ้ามีปัญหาก็ย้าย alias กลับไป version เดิมเพื่อ rollback\n\nด้านสิทธิ์ ต้องมี resource-based (function) policy อนุญาตให้ s3.amazonaws.com ทำ lambda:InvokeFunction (เพิ่มด้วย aws lambda add-permission) S3 เรียกแบบ asynchronous จึงควรตั้ง DLQ หรือ destination on failure เก็บ event ที่ล้มเหลวด้วย'
    },
    {
      id: 'q-m07-design-stream', type: 'design', format: 'written', source: 'L327-358',
      prompt: 'บริษัทต้องการวิเคราะห์ hashtag ที่กำลังมาแรงจาก social media stream แบบ real-time ข้อมูลไหลเข้าตลอดเวลา ต้องการประมวลผลโดยไม่ดูแล server และให้ฝ่ายธุรกิจ query ผลสรุปได้ ออกแบบ flow พร้อมอธิบายว่า Lambda ถูกเรียกแบบไหน และถ้า error ใน stream จะเกิดอะไรขึ้น',
      keywords: ['real-time', 'stream', 'ไม่ดูแล server'],
      flow: {
        nodes: [
          { id: 'social', label: 'Social media stream' },
          { id: 'kinesis', label: 'Kinesis Data Streams' },
          { id: 'lambda', label: 'Lambda' },
          { id: 'ddb', label: 'DynamoDB' },
          { id: 'biz', label: 'Business users' }
        ],
        edges: [
          { from: 'social', to: 'kinesis', label: '1' },
          { from: 'kinesis', to: 'lambda', label: '2 poll batch' },
          { from: 'lambda', to: 'ddb', label: '3' },
          { from: 'biz', to: 'ddb', label: '4 query' }
        ],
        distractors: ['EC2', 'API Gateway', 'S3', 'SNS']
      },
      rubric: [
        'มี Kinesis รับ stream real-time แล้วส่งให้ Lambda',
        'Lambda คำนวณ hashtag trend แล้วเขียนผลลง DynamoDB',
        'ฝ่ายธุรกิจ query ผลจาก DynamoDB',
        'อธิบายว่า Lambda ใช้ polling (event source mapping) ดึงเป็น batch จาก stream',
        'ระบุว่า error ใน shard จะบล็อกการประมวลผลต่อของ shard นั้น'
      ],
      modelAnswer: '1) ข้อมูลจาก social media ไหลเข้า Kinesis Data Streams แบบ real-time\n2) Lambda ใช้ polling (event source mapping) ดึง record จาก shard เป็น batch แล้วเรียก function\n3) function คำนวณ hashtag trend แล้วเขียนผลลง DynamoDB\n4) ผู้ใช้ฝ่ายธุรกิจ query ผลจาก DynamoDB\nทั้งหมดไม่มี server ให้ดูแล ถ้า function error ระหว่างประมวลผล batch จาก shard การประมวลผลต่อของ shard นั้นจะติดค้างจนกว่าจะผ่าน'
    }
  ]
});
