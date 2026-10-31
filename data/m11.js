/* M11 Step Functions — source = เลขบรรทัดในไฟล์สไลด์ (notes/(11 f) ...M11-StepFunctions.md) */
GUIDE.register({
  module: 'M11',
  title: 'Step Functions',
  summary: 'Orchestration ด้วย state machine (ASL), 8 state type, Standard vs Express, activity + taskToken, API operations',

  notes: [
    {
      heading: 'Step Functions คืออะไร',
      body: '<p>เป็น serverless <strong>orchestration</strong> ที่เอา Lambda และ service อื่นมาต่อเป็นลำดับงานแบบ visual workflow แทนที่จะให้แต่ละ microservice เรียกกันเอง ตัว Step Functions จะสั่งงานแต่ละขั้น ติดตามผล retry เมื่อ error และบันทึกสถานะของทุกขั้นให้</p>' +
        '<p>รูปแบบที่ทำได้: เรียงลำดับ, ทำขนาน, เลือกงานตามข้อมูล, try-catch-finally และ retry งานที่ล้ม</p>',
      refs: ['q-m11-written-why', 'q-m11-map-parallel']
    },
    {
      heading: 'State machine และ ASL',
      body: '<p>Workflow = <strong>state machine</strong> เขียนเป็น JSON ด้วย <strong>Amazon States Language (ASL)</strong> ประกอบด้วย state (ขั้นตอน) และ transition (เส้นเชื่อม) แต่ละรอบเริ่มจาก input แล้ว state แปลงข้อมูลส่ง output ต่อให้ state ถัดไป</p>' +
        '<ul><li><code>StartAt</code> = state แรก (จำเป็น)</li><li>ทุก state มี <code>Type</code></li><li>ต้องมี <code>Next</code> หรือ <code>End: true</code> ยกเว้น Succeed/Fail ที่ไม่ต้องมี End</li></ul>',
      diagram: {title:"Parallel: แตก branch แล้วรวม",caption:"Parallel รันหลาย branch พร้อมกัน เสร็จแล้วค่อยไป state ถัดไป (Next)",source:"L575-599",flow:{nodes:[{id:"par",label:"LookupCustomerInfo"},{id:"b1",label:"Branch: PState1"},{id:"b2",label:"Branch: PState2"},{id:"nextstate",label:"NextState"}],edges:[{from:"par",to:"b1"},{from:"par",to:"b2"},{from:"b1",to:"nextstate"},{from:"b2",to:"nextstate"}]}},
      refs: ['g-m11-state-type', 'c-m11-st-end']
    },
    {
      heading: 'State 8 ชนิด',
      body: '<ul><li><strong>Task</strong> ทำงานหนึ่งหน่วย (Lambda หรือ activity)</li><li><strong>Choice</strong> แตกกิ่งตามเงื่อนไข มี Default</li>' +
        '<li><strong>Fail</strong> / <strong>Succeed</strong> จบแบบล้มเหลว / สำเร็จ</li><li><strong>Pass</strong> ส่ง input เป็น output ไม่ทำงานจริง (ใส่ Result ได้)</li>' +
        '<li><strong>Wait</strong> หน่วงเวลา</li><li><strong>Parallel</strong> หลาย branch ที่ต่างกันพร้อมกัน</li><li><strong>Map</strong> วนทำขั้นเดียวกันกับทุก item ใน array</li></ul>' +
        '<p>ข้อสอบตัวอย่างของสไลด์: "เปรียบเทียบคำขอกับวงเงินแล้วแยกทาง" = <strong>Choice</strong></p>',
      diagram: {title:"Choice state แตกกิ่งตามเงื่อนไข",caption:"Choice ตรวจค่าใน input ($.branch) แล้วเลือกทางตามเงื่อนไข ถ้าไม่ตรงเลยไป Default",source:"L436-446",flow:{nodes:[{id:"start",label:"StartState"},{id:"choice",label:"ChoiceState (Choice)"},{id:"yes",label:"ChoiceYes"},{id:"no",label:"ChoiceNo"},{id:"def",label:"DefaultState"},{id:"final",label:"FinalState"}],edges:[{from:"start",to:"choice"},{from:"choice",to:"yes",label:"$.branch = 1"},{from:"choice",to:"no",label:"$.branch = 2"},{from:"choice",to:"def",label:"Default"},{from:"yes",to:"final"},{from:"no",to:"final"}]}},
      refs: ['g-m11-state-type', 'q-m11-credit-choice']
    },
    {
      heading: 'Standard vs Express',
      body: '<ul><li><strong>Standard</strong>: สูงสุด 1 ปี, exactly-once, 2,000 เริ่มรัน/วินาที, 4,000 transition/วินาที, คิดเงินต่อ state transition, รองรับ activity, รองรับ pattern ครบ</li>' +
        '<li><strong>Express</strong>: สูงสุด 5 นาที, at-least-once (async) หรือ at-most-once (sync), 100,000 เริ่มรัน/วินาที, transition เกือบไม่จำกัด, คิดเงินตามจำนวน+ระยะเวลา request และ memory, <em>ไม่</em>รองรับ activity, pattern รองรับ "ส่วนใหญ่"</li></ul>' +
        '<p>จำง่าย: ยาว/ตรวจสอบย้อนหลัง/ห้ามซ้ำ = Standard, ปริมาณมาก/สั้น = Express</p>',
      refs: ['g-m11-workflow-type', 'l-m11-std-duration', 'l-m11-exp-duration', 'l-m11-std-invoke', 'l-m11-exp-invoke', 'l-m11-std-transition', 'l-m11-exp-transition', 'q-m11-express-iot', 'q-m11-standard-long']
    },
    {
      heading: 'Activity, taskToken และ manual approval',
      body: '<p>Activity ผูกโค้ดภายนอกกับ Task หนึ่งใน state machine worker อยู่บนแอปอะไรก็ได้ที่ยิง HTTP ได้ Step Functions สร้าง <strong>taskToken</strong> ให้งานที่ส่งออกไป</p>' +
        '<ol><li>Step Functions ตั้งงาน activity รอไว้</li><li>worker เรียก <code>GetActivityTask</code> ได้ task + token</li><li>ส่งอีเมลขออนุมัติ (ตัวอย่างในสไลด์ใช้ SES และ API Gateway)</li><li>คนตอบ แล้วเรียก <code>SendTaskSuccess</code> หรือ <code>SendTaskFailure</code></li></ol>' +
        '<p>ใน ASL ใช้ Task ที่ Resource เป็น activity ARN และกำหนด TimeoutSeconds กันรอเกินไป</p>',
      diagram: {title:"Manual approval ด้วย activity",caption:"worker poll งานด้วย GetActivityTask ได้ taskToken แล้วรายงานผลกลับเมื่อคนตัดสินใจ",source:"L830-835, L905-916",flow:{nodes:[{id:"task",label:"Task state (activity)"},{id:"worker",label:"Activity worker"},{id:"human",label:"คนอนุมัติ/ปฏิเสธ"},{id:"ok",label:"SendTaskSuccess"},{id:"ko",label:"SendTaskFailure"},{id:"next",label:"State machine ไปต่อ"}],edges:[{from:"task",to:"worker",label:"GetActivityTask"},{from:"worker",to:"human",label:"taskToken"},{from:"human",to:"ok",label:"approve"},{from:"human",to:"ko",label:"reject"},{from:"ok",to:"next",label:"taskToken"},{from:"ko",to:"next",label:"taskToken"}]}},
      refs: ['q-m11-manual-approval', 'q-m11-design-approval', 'g-m11-task-resource']
    },
    {
      heading: 'API, quota และ lab',
      body: '<ul><li>เข้าถึงได้ผ่าน Console, SDK หรือ API</li><li>ตัวอย่าง operation: Create, StartExecution, StopExecution, List, Describe, GetExecutionHistory</li>' +
        '<li>Quota แยกหมวด (ชื่อ, account, run, task, throttling) และต่างกันระหว่าง Standard/Express (สไลด์ไม่ให้ตัวเลข)</li>' +
        '<li>เปิดเป็น REST ได้โดยผูกกับ method ของ API Gateway</li></ul>' +
        '<p>Lab 11.1: API Gateway เรียก state machine → Lambda ดึงข้อมูลซัพพลายเออร์ → Lambda สร้าง HTML → เก็บบน S3 → SNS ส่งลิงก์รายงานทางอีเมล</p>',
      refs: ['g-m11-api-op', 'q-m11-design-report']
    }
  ],

  limits: [
    {
      id: 'l-m11-std-invoke', service: 'Step Functions Standard', name: 'Invocation rate (เริ่มรัน)', display: '2,000 ต่อวินาที',
      accept: ['2000', '2,000', '2000 per second', '2,000 per second', '2000 ต่อวินาที'], source: 'L710',
      sim: {
        unit: 'ต่อวินาที', min: 0, limitAt: 2000, sliderMax: 4000, step: 50, start: 500,
        overMsg: 'Standard รับ invocation ได้ 2,000 ต่อวินาที',
        fix: 'ถ้าต้องรับงานปริมาณสูงและงานสั้น (ไม่เกิน 5 นาที) ให้ใช้ Express workflow ซึ่งรับได้ถึง 100,000 ต่อวินาที'
      }
    },
    {
      id: 'l-m11-exp-invoke', service: 'Step Functions Express', name: 'Invocation rate (เริ่มรัน)', display: '100,000 ต่อวินาที',
      accept: ['100000', '100,000', '100000 per second', '100,000 per second', '100k'], source: 'L710'
    },
    {
      id: 'l-m11-std-transition', service: 'Step Functions Standard', name: 'Transition rate', display: '4,000 ต่อวินาที',
      accept: ['4000', '4,000', '4000 per second', '4,000 per second', '4000 ต่อวินาที'], source: 'L711'
    },
    {
      id: 'l-m11-exp-transition', service: 'Step Functions Express', name: 'Transition rate', display: 'เกือบไม่จำกัด (nearly unlimited)',
      accept: ['nearly unlimited', 'unlimited', 'เกือบไม่จำกัด', 'ไม่จำกัด'], source: 'L711'
    },
    {
      id: 'l-m11-std-duration', service: 'Step Functions Standard', name: 'ระยะเวลารันสูงสุด', display: '1 ปี',
      accept: ['1 year', '1 ปี', 'one year', '1'], source: 'L734',
      sim: {
        unit: 'ปี', min: 0, limitAt: 1, sliderMax: 3, step: 1, start: 0,
        overMsg: 'Standard รันได้นานสุด 1 ปี',
        fix: 'workflow ที่ยาวกว่า 1 ปีต้องแบ่งเป็นหลายรอบ/หลาย execution'
      }
    },
    {
      id: 'l-m11-exp-duration', service: 'Step Functions Express', name: 'ระยะเวลารันสูงสุด', display: '5 นาที',
      accept: ['5 minutes', '5 min', '5 นาที', '5'], source: 'L762',
      sim: {
        unit: 'นาที', min: 0, limitAt: 5, sliderMax: 15, step: 1, start: 2,
        overMsg: 'Express รันได้นานสุด 5 นาที',
        fix: 'งานที่นานกว่า 5 นาทีต้องใช้ Standard workflow (รันได้ถึง 1 ปี)'
      }
    }
  ],

  optionGroups: [
    {
      id: 'g-m11-workflow-type', service: 'Step Functions', title: 'Standard vs Express workflow',
      options: [
        { name: 'Standard', traits: 'รันได้ถึง 1 ปี, exactly-once (ไม่รันซ้ำถ้าไม่ได้กำหนด Retry ใน ASL), 2,000 invocation/s, 4,000 transition/s, คิดเงินต่อ state transition, รองรับ activity และ integration pattern ครบ', when: 'workflow ยาว ต้อง audit ได้ ห้ามทำซ้ำ หรือมี manual approval (activity)', tradeoff: 'throughput ต่ำกว่า Express' },
        { name: 'Express', traits: 'รันได้ถึง 5 นาที, at-least-once (async) / at-most-once (sync), 100,000 invocation/s, transition เกือบไม่จำกัด, คิดเงินตามจำนวนและระยะเวลา request + memory, ไม่รองรับ activity', when: 'งาน event-processing ปริมาณสูงและสั้น', tradeoff: 'รันซ้ำได้, ไม่มี activity, รองรับ pattern แค่ส่วนใหญ่' }
      ],
      challenges: [
        { id: 'c-m11-wt-year', requirement: 'workflow ประมวลผลคำสั่งซื้อที่ต้องรอได้นานหลายเดือนและต้องตรวจสอบย้อนหลังได้', answer: 'Standard', why: 'Standard รันได้ถึง 1 ปี และเหมาะกับ workflow ยาวที่ audit ได้ ส่วน Express จำกัด 5 นาที', source: 'L732-734' },
        { id: 'c-m11-wt-rate', requirement: 'ต้องเริ่ม workflow ประมาณ 60,000 ครั้งต่อวินาที เป็นงานประมวลผล event สั้น ๆ', answer: 'Express', why: 'Express รับ invocation ได้ 100,000/วินาที ขณะที่ Standard ได้แค่ 2,000/วินาที', source: 'L710, L760' },
        { id: 'c-m11-wt-once', requirement: 'ต้องรับประกันว่าแต่ละขั้นไม่ถูกรันซ้ำ (exactly-once) เว้นแต่ตั้ง Retry เอง', answer: 'Standard', why: 'Standard ใช้ exactly-once ส่วน Express invocation อาจรันมากกว่า 1 ครั้ง', source: 'L736-738, L764-766' },
        { id: 'c-m11-wt-price', requirement: 'ค่าบริการคิดจากจำนวนและระยะเวลาของ request รวมถึง memory ที่ใช้ ไม่ใช่ต่อ state transition', answer: 'Express', why: 'Express คิดตาม request/duration/memory ส่วน Standard คิดต่อ state transition', source: 'L712, L770' },
        { id: 'c-m11-wt-activity', requirement: 'workflow ต้องใช้ activity (worker ภายนอก) สำหรับขั้นตอนที่รอคนอนุมัติ', answer: 'Standard', why: 'Express ไม่รองรับ Step Functions activities', source: 'L713' }
      ]
    },
    {
      id: 'g-m11-state-type', service: 'Step Functions', title: 'State type ทั้ง 8 ชนิด',
      options: [
        { name: 'Task', traits: 'หน่วยงานเดียว ชี้ Resource เป็น Lambda ARN หรือ activity ARN', when: 'ต้องลงมือทำงานจริง', tradeoff: 'ต้องมี Next หรือ End' },
        { name: 'Choice', traits: 'เพิ่มตรรกะแตกกิ่ง ตรวจ variable ด้วยกฎ เช่น NumericEquals แล้ว Next หรือ Default', when: 'เปรียบเทียบ/ตัดสินใจจากข้อมูล input', tradeoff: 'ควรมี Default ไว้รองรับกรณีไม่ตรงกฎ' },
        { name: 'Fail', traits: 'หยุดและบันทึกเป็นล้มเหลว มี Error และ Cause ไม่ต้องมี End', when: 'จบแบบ error', tradeoff: 'จบ execution ทันที' },
        { name: 'Succeed', traits: 'หยุดอย่างสำเร็จ ไม่ต้องมี End', when: 'จบแบบสำเร็จ', tradeoff: 'จบ execution ทันที' },
        { name: 'Pass', traits: 'ส่ง input เป็น output โดยไม่ทำงาน ใส่ Result/ResultPath แทรกข้อมูลได้', when: 'ทดสอบ/ใส่ข้อมูลคงที่/no-op', tradeoff: 'ไม่ได้เรียก service ใด' },
        { name: 'Wait', traits: 'หน่วงเวลาตามที่กำหนด (เช่น Seconds)', when: 'ต้องรอ/หยุดชั่วคราวก่อนขั้นต่อไป', tradeoff: 'เป็นแค่การหน่วง' },
        { name: 'Parallel', traits: 'สร้างหลาย branch (Branches) แต่ละ branch มี StartAt/States ของตัวเอง รันพร้อมกัน', when: 'งานที่ต่างกันหลายอย่างควรทำพร้อมกัน', tradeoff: 'ต้องกำหนดทุก branch ไว้ล่วงหน้า' },
        { name: 'Map', traits: 'วนทำชุดขั้นตอนเดียวกันกับ item ใน array (ItemsPath, Iterator, MaxConcurrency)', when: 'ประมวลผลรายการที่ไม่ทราบจำนวนล่วงหน้าด้วย logic เดียวกัน', tradeoff: 'ทุก item ใช้ logic เดียวกัน' }
      ],
      challenges: [
        { id: 'c-m11-st-compare', requirement: 'เทียบยอดคำขอกับวงเงิน แล้วเลือกเดินทางใดทางหนึ่งตามผลเปรียบเทียบ', answer: 'Choice', why: 'Choice เพิ่มตรรกะแตกกิ่งตามค่าใน input (คำตอบของข้อสอบตัวอย่าง)', source: 'L364, L1162-1209' },
        { id: 'c-m11-st-parallel', requirement: 'ค้นข้อมูลลูกค้าจาก 2 แหล่งที่ต่างกันพร้อม ๆ กันแล้วค่อยไปต่อ', answer: 'Parallel', why: 'Parallel รันหลาย branch พร้อมกัน (ตัวอย่างในสไลด์ชื่อ LookupCustomerInfo)', source: 'L364, L575-599, L684' },
        { id: 'c-m11-st-map', requirement: 'มีรายการสินค้าที่ส่งแล้วใน array ต้องเรียก Lambda ตรวจสอบทีละรายการด้วย logic เดียวกัน', answer: 'Map', why: 'Map วนทำขั้นเดียวกันกับทุก item ใน array (ตัวอย่าง Validate-All)', source: 'L364, L626-663' },
        { id: 'c-m11-st-wait', requirement: 'ให้ workflow หยุดรอ 10 วินาทีก่อนทำขั้นถัดไป', answer: 'Wait', why: 'Wait หน่วงเวลาตามที่กำหนด', source: 'L364, L538-541' },
        { id: 'c-m11-st-pass', requirement: 'ต้องการ state ที่แค่ส่ง input ไป output และแทรกค่าคงที่ลงใน JSON โดยไม่เรียก service ใดเลย', answer: 'Pass', why: 'Pass ไม่ทำงานจริง แต่ส่งต่อและใส่ Result ได้', source: 'L364, L491-504' },
        { id: 'c-m11-st-fail', requirement: 'ผลตรวจสอบไม่ถูกต้อง ต้องหยุด workflow และบันทึก Error กับ Cause', answer: 'Fail', why: 'Fail หยุดและทำเครื่องหมายว่าล้มเหลว มี Cause และ Error', source: 'L459-463' },
        { id: 'c-m11-st-task', requirement: 'ขั้นที่ต้องเรียก Lambda function หนึ่งตัวให้ทำงานจริง', answer: 'Task', why: 'Task คือหน่วยงานเดียวที่ทำงานจริง โดยชี้ Resource ไปที่ Lambda', source: 'L364, L411-421' },
        { id: 'c-m11-st-end', requirement: 'state ชนิดใดที่ไม่จำเป็นต้องมี field End (คู่กับ Fail)', answer: 'Succeed', why: 'Succeed และ Fail ไม่ต้องมี End field', source: 'L686' }
      ]
    },
    {
      id: 'g-m11-task-resource', service: 'Step Functions', title: 'Task: Lambda vs Activity',
      options: [
        { name: 'Lambda function task', traits: 'Resource เป็น Lambda ARN Step Functions เรียก function โดยตรง', when: 'ขั้นตอนเป็นโค้ดที่รันบน Lambda', tradeoff: 'รันได้ตามข้อจำกัดของ Lambda' },
        { name: 'Activity', traits: 'Resource เป็น activity ARN worker ภายนอก (EC2, ECS หรือแอปที่ยิง HTTP ได้) poll ด้วย GetActivityTask รับ taskToken แล้วตอบด้วย SendTaskSuccess/SendTaskFailure', when: 'ต้องรอคนอนุมัติ หรือใช้โค้ดนอก Lambda', tradeoff: 'ต้องใช้ Standard และควรตั้ง TimeoutSeconds' }
      ],
      challenges: [
        { id: 'c-m11-tr-human', requirement: 'ขั้นตอนต้องรอผู้จัดการกดอนุมัติทางอีเมลก่อนจึงไปต่อ', answer: 'Activity', why: 'activity worker ถือ taskToken แล้วรายงานผลด้วย SendTaskSuccess/SendTaskFailure เมื่อคนตอบ', source: 'L830, L912-916' },
        { id: 'c-m11-tr-lambda', requirement: 'ขั้นตอนเป็น Lambda function ที่ Step Functions เรียกตรง ๆ โดยไม่ต้องมี worker คอย poll', answer: 'Lambda function task', why: 'Task ชี้ Resource ไปที่ Lambda ARN ได้เลย', source: 'L411-421' }
      ]
    },
    {
      id: 'g-m11-api-op', service: 'Step Functions', title: 'API operations',
      options: [
        { name: 'StartExecution', traits: 'เริ่มรัน state machine และคืน ARN ที่ระบุ execution นั้น', when: 'ต้องการสั่งเริ่มงาน', tradeoff: 'ไม่ได้ดึงรายละเอียดหรือประวัติ แค่เริ่มรันและคืน ARN' },
        { name: 'List', traits: 'ไล่รายการ state machine, execution และ activity ทั้งหมด', when: 'ต้องการดูว่ามีอะไรบ้าง', tradeoff: 'ได้แค่รายการ ไม่ใช่รายละเอียด' },
        { name: 'Describe', traits: 'ดูรายละเอียดของ state machine, execution หรือ activity ตัวใดตัวหนึ่ง', when: 'ต้องการรายละเอียดรายตัว', tradeoff: 'รายตัว ไม่ใช่ทั้งหมด' },
        { name: 'GetExecutionHistory', traits: 'ดึงประวัติของ execution เป็นลิสต์ของ event', when: 'ต้องการไล่ย้อนดูว่าแต่ละขั้นเกิดอะไร', tradeoff: 'เป็นข้อมูลระดับ event' }
      ],
      challenges: [
        { id: 'c-m11-api-history', requirement: 'ต้องการดูประวัติการรันของ state machine เป็นลิสต์ของ event เพื่อ debug', answer: 'GetExecutionHistory', why: 'operation นี้คืนประวัติ execution เป็นรายการ event', source: 'L941' },
        { id: 'c-m11-api-list', requirement: 'ต้องการรายการ state machine, execution และ activity ทั้งหมดในบัญชี', answer: 'List', why: 'List ไล่รายการของทั้งสามอย่าง', source: 'L941' },
        { id: 'c-m11-api-start', requirement: 'สั่งเริ่ม execution แล้วต้องได้ ARN ไว้ระบุ execution นั้น', answer: 'StartExecution', why: 'StartExecution คืน ARN ที่ระบุการรัน', source: 'L941' }
      ]
    }
  ],

  questions: [
    {
      id: 'q-m11-credit-choice', type: 'scenario', format: 'choice', source: 'L1162-1209',
      prompt: 'เมื่อลูกค้าส่งคำขอเพิ่มวงเงินบัตรเครดิต ระบบต้องประมวลผลอัตโนมัติด้วยการเปรียบเทียบคำขอกับวงเงินที่อนุมัติล่วงหน้า ถ้าคำขอเกินวงเงิน Step Functions ต้องส่งคำขอไปให้ผู้จัดการอนุมัติ ควรใช้ state type ใดสำหรับการเปรียบเทียบนี้',
      keywords: ['เปรียบเทียบ', 'ส่งคำขอไปให้ผู้จัดการ'],
      choices: [
        { text: 'Choice', correct: true, why: 'Choice ใช้แตกกิ่งตามเงื่อนไขจากข้อมูล (คำขอ > วงเงิน หรือไม่) ซึ่งตรงกับคำสำคัญ "comparing" ของข้อสอบตัวอย่าง' },
        { text: 'Parallel', correct: false, why: 'Parallel รันหลาย branch พร้อมกัน ไม่ได้เลือกทางตามการเปรียบเทียบ' },
        { text: 'Task', correct: false, why: 'Task ทำงานหนึ่งหน่วย ไม่ได้ตัดสินใจแตกกิ่ง (ใช้ส่งงานให้ผู้จัดการหลังจาก Choice เลือกทางแล้ว)' },
        { text: 'Pass', correct: false, why: 'Pass แค่ส่ง input เป็น output ไม่ทำการเปรียบเทียบ' }
      ]
    },
    {
      id: 'q-m11-standard-long', type: 'scenario', format: 'choice', source: 'L710-714, L732-740',
      prompt: 'บริษัทออกแบบ workflow ประมวลผลสินเชื่อที่อาจรอเอกสารจากลูกค้านานหลายสัปดาห์ ต้องไม่ทำขั้นตอนซ้ำเกินโดยไม่ตั้งใจ และผู้ตรวจสอบต้องย้อนดูได้ ควรเลือก workflow แบบใด',
      keywords: ['หลายสัปดาห์', 'ไม่ทำขั้นตอนซ้ำ'],
      choices: [
        { text: 'Standard workflow', correct: true, why: 'รันได้ถึง 1 ปี exactly-once เหมาะกับงานยาวที่ audit ได้' },
        { text: 'Express workflow', correct: false, why: 'Express รันได้แค่ 5 นาที และ invocation อาจรันซ้ำได้' },
        { text: 'Express workflow แล้วเพิ่ม Wait state ให้ยาวขึ้น', correct: false, why: 'Wait ไม่ขยายเพดาน 5 นาทีของ Express' },
        { text: 'ใช้ Parallel state เพื่อให้ workflow เร็วขึ้นจนจบภายใน 5 นาที', correct: false, why: 'ความยาวของงานมาจากการรอเอกสาร ไม่ใช่ความช้าของ state' }
      ]
    },
    {
      id: 'q-m11-express-iot', type: 'scenario', format: 'choice', source: 'L710-714, L760-770',
      prompt: 'ร้านกาแฟสาขาทั่วประเทศส่ง event การขายเข้ามาถึงประมาณ 50,000 event ต่อวินาที แต่ละ event ประมวลผลเสร็จภายในไม่กี่วินาที ทีมต้องการ workflow ที่จ่ายตามจำนวนและระยะเวลา request ข้อใดเหมาะที่สุด',
      keywords: ['50,000 event ต่อวินาที', 'ระยะเวลา request'],
      choices: [
        { text: 'Express workflow', correct: true, why: 'Express รับ 100,000 invocation/s เหมาะกับ event-processing ปริมาณสูงและสั้น คิดเงินตาม request/duration/memory' },
        { text: 'Standard workflow', correct: false, why: 'Standard รับ invocation ได้ 2,000/s ไม่พอกับ 50,000/s และคิดเงินต่อ state transition' },
        { text: 'Standard workflow แล้วเพิ่ม Map state', correct: false, why: 'Map ไม่ได้เพิ่มเพดาน invocation rate ของ Standard' },
        { text: 'Standard workflow ที่ใช้ activity', correct: false, why: 'activity ไม่ได้ช่วยเรื่อง throughput และตัวเลือกนี้ยังติด 2,000/s อยู่' }
      ]
    },
    {
      id: 'q-m11-manual-approval', type: 'scenario', format: 'choice', source: 'L830-880, L912-916',
      prompt: 'workflow เลื่อนตำแหน่งพนักงานต้องหยุดรอให้ผู้บริหารกดอนุมัติทางอีเมล แล้ว Step Functions จึงไปต่อ ข้อใดคือแนวทางที่ถูกต้อง (เลือก 2 ข้อ)',
      keywords: ['กดอนุมัติ', 'เลือก 2 ข้อ'],
      choices: [
        { text: 'ใช้ Task ที่ Resource เป็น activity แล้วให้ worker รับ taskToken จาก GetActivityTask', correct: true, why: 'activity ผูกโค้ด/ผู้ตอบภายนอกกับ task และ taskToken แทน task ที่มอบหมายไป' },
        { text: 'เมื่อผู้บริหารตอบ ให้เรียก SendTaskSuccess หรือ SendTaskFailure พร้อม token', correct: true, why: 'เป็นวิธีรายงานผลกลับให้ Step Functions ไปต่อหรือล้ม' },
        { text: 'ใช้ Express workflow เพราะเร็วที่สุด', correct: false, why: 'Express ไม่รองรับ activity และจำกัด 5 นาที' },
        { text: 'ใช้ Pass state ใส่ผลอนุมัติลงไปเลย', correct: false, why: 'Pass ไม่รอใคร แค่ส่ง input เป็น output' }
      ]
    },
    {
      id: 'q-m11-map-parallel', type: 'scenario', format: 'written', source: 'L575-599, L626-663, L684',
      prompt: 'workflow สร้างรายงานต้องทำสองอย่าง: (1) ดึงข้อมูลลูกค้าจากสองระบบพร้อมกัน และ (2) ตรวจสอบสินค้าทุกรายการใน array ด้วยฟังก์ชันเดียวกัน จงเลือก state type ที่เหมาะกับแต่ละส่วนและอธิบายความต่างของสอง state นี้',
      keywords: ['พร้อมกัน', 'ทุกรายการใน array'],
      rubric: [
        'เลือก Parallel สำหรับดึงข้อมูลจากสองระบบพร้อมกัน',
        'เลือก Map สำหรับตรวจสินค้าทุกรายการใน array',
        'อธิบายว่า Parallel รันหลาย branch ที่กำหนดไว้ (อาจต่างกัน) พร้อมกัน',
        'อธิบายว่า Map วนทำขั้นเดียวกันซ้ำกับแต่ละ item (ItemsPath/Iterator)'
      ],
      modelAnswer: 'ส่วนดึงข้อมูลจากสองระบบใช้ Parallel state โดยกำหนด Branches หนึ่งต่อหนึ่งระบบ แต่ละ branch มี StartAt/States ของตัวเอง ทั้งสองรันพร้อมกัน แล้วไปต่อที่ Next\n\nส่วนตรวจสินค้าทุกชิ้นใช้ Map state ชี้ ItemsPath ไปที่ array แล้วกำหนด Iterator เป็นขั้นตอน Task (Lambda) ตัวเดียวกัน Step Functions จะวนทำกับทุก item (ตั้ง MaxConcurrency ได้)\n\nความต่าง: Parallel = หลายงานต่างชนิดที่แยกกันไว้ล่วงหน้า, Map = งานเดียวกันกับข้อมูลหลายชิ้นที่จำนวนไม่แน่นอน'
    },
    {
      id: 'q-m11-written-why', type: 'scenario', format: 'written', source: 'L190-200, L245-253',
      prompt: 'คาเฟ่แยกระบบเป็น microservice หลายตัว ตอนนี้แต่ละ Lambda เรียกกันต่อ ๆ กันเอง ทำให้ดูไม่ออกว่าติดขัดที่ขั้นไหนและต้องเขียน retry เองทุกที่ จงอธิบายว่าควรใช้ AWS Step Functions อย่างไรและได้ประโยชน์อะไร',
      keywords: ['microservice', 'retry'],
      rubric: [
        'เสนอ Step Functions เป็นตัว orchestrate Lambda แทนการเรียกกันเอง',
        'ระบุว่านิยาม workflow เป็น state machine ด้วย ASL (JSON) และดูภาพ visual workflow ใน console ได้',
        'ระบุว่า Step Functions trigger/ติดตามแต่ละขั้น, retry เมื่อ error และ log state ของทุกขั้น',
        'กล่าวถึง pattern ที่ใช้ได้ เช่น sequence, parallel, เลือกตามข้อมูล, try-catch'
      ],
      modelAnswer: 'ใช้ Step Functions เป็น orchestrator กลาง นิยาม workflow เป็น state machine ใน ASL (JSON) โดยให้แต่ละ Lambda เป็น Task state และต่อด้วย transition แทนที่จะให้ function เรียกกันเอง\n\nประโยชน์: ดูเส้นทางและสถานะของทุก execution แบบ visual ใน console หา step ที่ติดได้ทันที, Step Functions trigger และติดตามแต่ละขั้นให้ รวมทั้ง retry เมื่อเกิด error (กำหนดใน ASL ไม่ต้องเขียนเอง) และ log สถานะของทุกขั้น นอกจากนี้ยังทำ sequence, parallel, Choice และ try-catch ได้ในที่เดียว'
    },
    {
      id: 'q-m11-design-report', type: 'design', format: 'written', source: 'L1026, L1039-1055, L1071',
      prompt: 'ออกแบบ flow สร้างรายงานสต็อกกาแฟของคาเฟ่ พนักงานเรียก endpoint create_report ผ่าน API Gateway ซึ่งสั่งให้ state machine ของ Step Functions ทำงาน: ดึงข้อมูลซัพพลายเออร์จากฐานข้อมูล RDS, สร้างรายงาน HTML แล้วเก็บบน S3 และส่งลิงก์รายงานให้พนักงานทางอีเมล จงวาด flow ใส่ลำดับบนลูกศร และอธิบายว่าแต่ละขั้นทำอะไร',
      keywords: ['create_report', 'RDS', 'ส่งลิงก์รายงาน'],
      flow: {
        nodes: [
          { id: 'apigw', label: 'API Gateway' },
          { id: 'sfn', label: 'Step Functions state machine' },
          { id: 'data', label: 'Lambda GenerateReportData' },
          { id: 'rds', label: 'RDS (Coffee supplier table)' },
          { id: 'html', label: 'Lambda Generate HTML' },
          { id: 's3', label: 'S3 (report.html)' },
          { id: 'sns', label: 'SNS topic (email)' }
        ],
        edges: [
          { from: 'apigw', to: 'sfn', label: '1' },
          { from: 'sfn', to: 'data', label: '2' },
          { from: 'data', to: 'rds', label: '3' },
          { from: 'sfn', to: 'html', label: '4' },
          { from: 'html', to: 's3', label: '5' },
          { from: 'sfn', to: 'sns', label: '6' }
        ],
        distractors: ['SQS', 'EC2', 'CloudFront']
      },
      rubric: [
        'API Gateway endpoint เป็นจุดเริ่ม และสั่งให้ Step Functions state machine ทำงาน',
        'state machine เรียก Lambda ดึงข้อมูลซัพพลายเออร์จาก RDS แล้วเรียก Lambda สร้าง HTML',
        'รายงาน HTML ถูกเก็บบน S3 และเข้าถึงด้วย presigned URL',
        'ใช้ SNS topic ส่งอีเมลลิงก์รายงานให้พนักงาน',
        'อธิบายลำดับขั้นสั้น ๆ'
      ],
      modelAnswer: '1) พนักงานเรียก endpoint create_report ที่ API Gateway ซึ่งเรียกให้ state machine เริ่มรัน\n2) state machine เรียก Lambda GenerateReportData\n3) Lambda นี้อ่านตาราง Coffee supplier จาก RDS\n4) ส่งข้อมูลต่อให้ Lambda Generate HTML สร้างรายงาน\n5) รายงาน report.html ถูกเก็บบน S3 และเข้าถึงด้วย presigned URL (สร้างโดย Lambda ตัวหนึ่ง)\n6) state machine ส่งข้อความไป SNS topic ซึ่งอีเมลลิงก์รายงานให้พนักงานที่ subscribe ไว้ แล้วพนักงานเปิดรายงานบน S3\nStep Functions ทำหน้าที่ลำดับขั้นและ retry/track ให้ทุกขั้น'
    },
    {
      id: 'q-m11-design-approval', type: 'design', format: 'written', source: 'L830-880, L1162-1209',
      prompt: 'ออกแบบ state machine ประมวลผลคำขอเพิ่มวงเงิน: เปรียบเทียบคำขอกับวงเงินที่อนุมัติล่วงหน้า ถ้าไม่เกินให้อนุมัติอัตโนมัติ ถ้าเกินให้ส่งไปให้ผู้จัดการอนุมัติ (รอผลจากคน) ถ้าผู้จัดการอนุมัติให้จบสำเร็จ ถ้าปฏิเสธให้จบแบบล้มเหลว จงวาด flow และระบุชนิด state ของแต่ละกล่อง',
      keywords: ['เปรียบเทียบ', 'ผู้จัดการอนุมัติ'],
      flow: {
        nodes: [
          { id: 'choice', label: 'Choice (เทียบวงเงิน)' },
          { id: 'auto', label: 'Succeed (อนุมัติอัตโนมัติ)' },
          { id: 'manual', label: 'Task (activity ManualApproval)' },
          { id: 'worker', label: 'Activity worker (taskToken)' },
          { id: 'ok', label: 'Succeed (ผู้จัดการอนุมัติ)' },
          { id: 'fail', label: 'Fail (ถูกปฏิเสธ)' }
        ],
        edges: [
          { from: 'choice', to: 'auto', label: 'ไม่เกินวงเงิน' },
          { from: 'choice', to: 'manual', label: 'เกินวงเงิน' },
          { from: 'manual', to: 'worker', label: 'GetActivityTask' },
          { from: 'worker', to: 'ok', label: 'SendTaskSuccess' },
          { from: 'worker', to: 'fail', label: 'SendTaskFailure' }
        ],
        distractors: ['Parallel', 'Map', 'Pass']
      },
      rubric: [
        'ใช้ Choice state เปรียบเทียบคำขอกับวงเงินและแตกสองทาง (มี Default ถ้าจำเป็น)',
        'กรณีไม่เกินวงเงินไป Succeed โดยตรง',
        'กรณีเกินวงเงินใช้ Task ที่ Resource เป็น activity ARN (มี TimeoutSeconds)',
        'worker รับ taskToken ผ่าน GetActivityTask และรายงานด้วย SendTaskSuccess/SendTaskFailure ไป Succeed หรือ Fail',
        'ระบุว่าต้องใช้ Standard workflow เพราะ Express ไม่รองรับ activity'
      ],
      modelAnswer: 'เริ่มที่ Choice state เปรียบเทียบยอดคำขอกับวงเงิน (Default ไว้สำหรับกรณีไม่ตรงกฎ)\n- ไม่เกินวงเงิน: ไป Succeed state (อนุมัติอัตโนมัติ)\n- เกินวงเงิน: ไป Task state ที่ Resource เป็น activity ARN (เช่น ManualApproval) ตั้ง TimeoutSeconds กันรอไม่สิ้นสุด activity worker เรียก GetActivityTask ได้ taskToken แล้วส่งอีเมลขออนุมัติ เมื่อผู้จัดการตอบจะเรียก SendTaskSuccess (ไป Succeed) หรือ SendTaskFailure (ไป Fail)\nเนื่องจากใช้ activity ต้องเลือก Standard workflow เพราะ Express ไม่รองรับ activity'
    }
  ]
});
