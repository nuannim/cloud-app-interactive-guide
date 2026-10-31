/* M08 Containers — source = เลขบรรทัดในไฟล์สไลด์ต้นฉบับ (notes/ ... M08-Containers.md) */
GUIDE.register({
  module: 'M08',
  title: 'Containers',
  summary: 'Container vs VM, microservices, ECS (Fargate/EC2), ECR, EKS, Elastic Beanstalk และ deployment policies, Aurora Serverless',

  notes: [
    {
      heading: 'Container vs VM vs Bare-metal',
      body: '<ul>' +
        '<li><strong>Bare-metal</strong>: หลายแอปแย่งทรัพยากรเครื่องเดียว และต้องใช้เวอร์ชันไลบรารีร่วมกัน</li>' +
        '<li><strong>VM</strong>: แต่ละแอปแยกกัน มี Guest OS ของตัวเองบน virtualization platform ใช้ทรัพยากรดีขึ้น แต่ต้องดูแล OS เพิ่มและกินที่เพิ่ม</li>' +
        '<li><strong>Container</strong>: ใช้ OS kernel ร่วมกัน เบา เร็ว พกไปรันได้เหมือนกันทุก environment</li></ul>' +
        '<p>จำง่าย ๆ: VM = 1 Guest OS ต่อ 1 แอป, Container = แชร์ kernel</p>',
      refs: ['g-m08-model', 'q-m08-parity']
    },
    {
      heading: 'Docker และ Microservices',
      body: '<ul><li>Dockerfile (ไฟล์คำสั่ง) → build เป็น <strong>image</strong> (template อ่านอย่างเดียว) → run เป็น <strong>container</strong> (instance ที่มี layer เขียนได้บาง ๆ) → เก็บ image ไว้ใน <strong>registry</strong></li>' +
        '<li>Microservices แตกแอปใหญ่ (monolith) เป็นบริการย่อย แต่ละตัวเลือกภาษาที่เหมาะได้ พัฒนาและอัปเดตแยกกัน ออกแบบให้ล้มได้ ทิ้งและสร้างใหม่ได้</li>' +
        '<li>Container ช่วยให้ dev/test/prod เหมือนกัน (parity)</li></ul>',
      refs: ['q-m08-parity', 'q-m08-micro']
    },
    {
      heading: 'ECS, ECR, EKS ต่างกันอย่างไร',
      body: '<ul><li><strong>ECS</strong>: orchestration แบบ managed ของ AWS จัด scheduling/placement ส่ง container ไปรันบน Fargate หรือ EC2</li>' +
        '<li><strong>ECR</strong>: registry เก็บ image มี encryption at rest และเชื่อม IAM, ECS, Docker CLI</li>' +
        '<li><strong>EKS</strong>: Kubernetes แบบ managed worker node ใช้ EC2 หรือ Fargate ได้ เหมาะกับทีมที่ใช้ Kubernetes อยู่แล้ว</li></ul>' +
        '<p>Launch type: <strong>Fargate</strong> = AWS ดูแลชั้น VM/OS ให้ เหมาะกับ demand แกว่ง งาน batch ตามเวลา test env เล็ก ๆ ส่วน <strong>EC2</strong> = เราดูแลเอง เหมาะกับ workload คาดการณ์ได้ จะใช้ reserved instance ประหยัดต้นทุน หรือมีข้อกำหนด compliance</p>',
      refs: ['g-m08-launch', 'g-m08-service', 'q-m08-fargate', 'q-m08-ec2']
    },
    {
      heading: 'Elastic Beanstalk',
      body: '<p>บริการระดับ application: ดูแล provisioning, load balancing, auto scaling, health monitoring ให้ และจัดทุกอย่างเป็น <strong>environment</strong> เริ่มใช้ได้เร็วกว่า ECS เพราะไม่ต้องตั้งค่า task definition/cluster เอง (เขียน Dockerrun.aws.json + zip โค้ด เลือก platform แล้ว launch) เหมาะกับทีมที่ยังไม่มีประสบการณ์ container/AWS</p>' +
        '<p>IAM: service role (Beanstalk ใช้ service อื่นแทนเรา), instance profile (ติดกับ instance), user policy (ทางเลือก มี 2 แบบ: full admin / read-only)</p>',
      refs: ['q-m08-beanstalk', 'l-m08-userpolicy', 'g-m08-service']
    },
    {
      heading: 'Beanstalk deployment policies',
      body: '<ul><li><strong>All at once</strong>: เร็วสุด แต่มี downtime</li>' +
        '<li><strong>Rolling</strong>: ทีละ batch ไม่ downtime แต่ capacity ลดชั่วคราว</li>' +
        '<li><strong>Rolling with batch</strong>: เพิ่ม batch ใหม่ก่อนค่อย rolling จึงไม่เสีย capacity</li>' +
        '<li><strong>Immutable</strong>: สร้าง Auto Scaling group ที่สองด้วย instance ใหม่ทั้งชุด rollback ปลอดภัยและไม่สะดุด แต่ใช้เวลานาน</li>' +
        '<li><strong>Traffic splitting</strong>: เหมือน immutable แต่ส่ง traffic ส่วนหนึ่งไปทดสอบ version ใหม่ (canary)</li>' +
        '<li><strong>Blue/green</strong>: clone environment ใหม่ ทดสอบ แล้วสลับ CNAME</li></ul>' +
        '<p>สไลด์วางแกน "เร็ว ← → คุมได้มากกว่า" ยิ่งคุมได้มาก ยิ่ง deploy นาน</p>',
      refs: ['g-m08-deploy', 'q-m08-canary', 'q-m08-rollback']
    },
    {
      heading: 'Aurora Serverless (ย้าย DB ออกจาก container)',
      body: '<p>Aurora เป็น relational DB แบบ managed ใน RDS เข้ากันได้กับ MySQL/PostgreSQL ส่วน <strong>Aurora Serverless</strong> คือรูปแบบ on-demand ที่ scale ขึ้น/ลงตาม traffic และหยุดเมื่อไม่มีใช้งาน ใน lab ใช้แทน MySQL ที่รันใน container เพื่อลดงานดูแลและ scale ได้ดีขึ้น</p>',
      refs: ['q-m08-aurora', 'q-m08-written']
    }
  ],

  limits: [
    {
      id: 'l-m08-userpolicy', service: 'Elastic Beanstalk', name: 'จำนวน managed user policy ที่ให้มา',
      display: '2 แบบ: full administrative access และ read-only access',
      accept: ['2', 'two', '2 แบบ', '2 policy'], source: 'L1204'
    }
  ],

  optionGroups: [
    {
      id: 'g-m08-model', service: 'Containers', title: 'รูปแบบการ deploy: Bare-metal vs VM vs Container',
      options: [
        { name: 'Bare-metal server', traits: 'แอปแย่งทรัพยากรเครื่อง ต้องใช้ไลบรารีเวอร์ชันเดียวกัน ต้นทุนฮาร์ดแวร์ยืดหยุ่นยาก', when: 'ไม่ใช่ตัวเลือกที่สไลด์แนะนำ เป็นจุดเริ่มต้นของวิวัฒนาการ', tradeoff: 'ไม่ยืดหยุ่น แอปรบกวนกันได้' },
        { name: 'Virtual machine', traits: 'แต่ละแอปแยกจากกัน มี Guest OS ของตัวเองบน virtualization platform', when: 'ต้องการแยกแอปและไลบรารีออกจากกันเด็ดขาด', tradeoff: 'ต้องดูแล OS เพิ่ม และใช้พื้นที่เซิร์ฟเวอร์ไปกับ OS' },
        { name: 'Container', traits: 'แชร์ OS kernel บน containerization platform เบา เร็ว พกพาได้ รันเหมือนกันทุก environment', when: 'ต้องการความ portable, start เร็ว, environment สม่ำเสมอ', tradeoff: 'แชร์ kernel เดียวกัน (ไม่มี Guest OS แยกต่อแอป)' }
      ],
      challenges: [
        { id: 'c-m08-model-vm', requirement: 'แต่ละแอปต้องมี Guest OS ของตัวเอง และทีมยอมรับภาระดูแล OS ที่เพิ่มขึ้น', answer: 'Virtual machine', why: 'VM มี Guest OS ต่อ VM จึงต้องดูแล OS เพิ่มและกินพื้นที่เซิร์ฟเวอร์ ต่างจาก container ที่แชร์ kernel', source: 'L201-214' },
        { id: 'c-m08-model-ct', requirement: 'หลายแอปต้องแชร์ OS kernel เดียวกัน เบา เริ่มเร็ว และรันเหมือนกันทุก environment', answer: 'Container', why: 'Container แชร์ kernel บน containerization platform จึงเบา เร็ว และ portable', source: 'L223-232' },
        { id: 'c-m08-model-bm', requirement: 'หลายแอปบนเครื่องจริงเครื่องเดียว แย่งทรัพยากรกัน และต้องใช้ไลบรารีเวอร์ชันเดียวกันทุกแอป', answer: 'Bare-metal server', why: 'นี่คือข้อจำกัดของ bare-metal ที่ VM/container เข้ามาแก้', source: 'L185-194' }
      ]
    },
    {
      id: 'g-m08-launch', service: 'Amazon ECS', title: 'ECS launch type: Fargate vs EC2',
      options: [
        { name: 'Fargate', traits: 'AWS ดูแลชั้น VM/Guest OS ให้ เราดูแลแค่ container', when: 'demand แกว่งมาก, workload ที่เน้น overhead ต่ำ, test env เล็ก ๆ, batch ที่รันตามเวลา', tradeoff: 'ควบคุมระดับ instance ได้น้อยกว่า' },
        { name: 'EC2 launch type', traits: 'เราดูแล Docker engine และ Guest OS ใน cluster เอง', when: 'resource คาดการณ์ได้ / ใช้ reserved instance ลดต้นทุน, workload ใหญ่ที่ปรับตามราคา, ต้อง comply ข้อกำหนด security, มี EC2 capacity เหลือ', tradeoff: 'ต้องจัดการ instance เอง' }
      ],
      challenges: [
        { id: 'c-m08-launch-spike', requirement: 'บริการ container มี demand แกว่งมาก และทีมไม่อยากดูแล instance/OS ของ cluster', answer: 'Fargate', why: 'Fargate เหมาะกับ service ที่ demand แกว่ง และ AWS ดูแลชั้น VM/OS ให้', source: 'L989-993' },
        { id: 'c-m08-launch-batch', requirement: 'ต้องรัน batch job ตามตารางเวลา และต้องการ test environment เล็ก ๆ โดยไม่จัดการ server', answer: 'Fargate', why: 'batch ตามเวลาและ test env เล็กอยู่ในรายการ "Choose Fargate"', source: 'L997-999' },
        { id: 'c-m08-launch-reserved', requirement: 'workload คาดการณ์ resource ได้แน่นอน และต้องการใช้ reserved instance เพื่อลดต้นทุน', answer: 'EC2 launch type', why: 'resource คาดการณ์ได้ / reserved instance อยู่ในรายการ "Choose Amazon EC2"', source: 'L1003' },
        { id: 'c-m08-launch-comply', requirement: 'องค์กรมีข้อกำหนด security ที่ต้องควบคุม Docker engine และ OS ของเครื่องเอง', answer: 'EC2 launch type', why: 'compliance กับข้อกำหนด security เป็นเหตุผลให้เลือก EC2 ที่เราจัดการ instance เอง', source: 'L1007' }
      ]
    },
    {
      id: 'g-m08-service', service: 'Container services', title: 'เลือก service ให้ตรงงาน: ECS / ECR / EKS / Elastic Beanstalk',
      options: [
        { name: 'Amazon ECS', traits: 'orchestration แบบ managed ของ AWS จัด scheduling และ placement ส่งไป Fargate หรือ EC2', when: 'ต้อง orchestrate container จำนวนมากบน AWS', tradeoff: 'ต้องตั้ง task definition และ cluster' },
        { name: 'Amazon ECR', traits: 'registry จัดเก็บ image, encryption at rest, เชื่อม IAM/ECS/Docker CLI', when: 'เก็บและจัดการ Docker image อย่างปลอดภัย', tradeoff: 'เก็บ image อย่างเดียว ไม่ได้รัน container' },
        { name: 'Amazon EKS', traits: 'Kubernetes แบบ managed, conformant และ compatible, secure by default, worker node บน EC2 หรือ Fargate', when: 'ทีมใช้ Kubernetes อยู่แล้ว', tradeoff: 'ไม่ใช่ orchestrator แบบ AWS-native' },
        { name: 'AWS Elastic Beanstalk', traits: 'บริการระดับ application จัดทุกอย่างเป็น environment รัน Docker multicontainer ได้โดยไม่ต้องตั้งค่า ECS เอง', when: 'ทีมประสบการณ์น้อย อยากเริ่มเร็ว/ทดลอง', tradeoff: 'คุมระดับล่างได้น้อยกว่า' }
      ],
      challenges: [
        { id: 'c-m08-svc-registry', requirement: 'ต้องการที่เก็บ Docker image ที่เข้ารหัส at rest และคุมสิทธิ์ผ่าน IAM', answer: 'Amazon ECR', why: 'ECR เป็น container registry ที่มี encryption at rest และ integrate IAM', source: 'L943-957' },
        { id: 'c-m08-svc-k8s', requirement: 'องค์กรใช้ Kubernetes อยู่แล้ว และต้องการ service managed ที่ conformant กับ Kubernetes', answer: 'Amazon EKS', why: 'EKS รัน Kubernetes แบบ managed ที่ conformant และ compatible', source: 'L1059-1065' },
        { id: 'c-m08-svc-orch', requirement: 'ต้องการ orchestration ที่ schedule/placement container ข้าม cluster และเลือก launch ไป Fargate หรือ EC2 ได้', answer: 'Amazon ECS', why: 'ECS คือ orchestration แบบ managed ที่ schedule placement และรองรับทั้ง Fargate กับ EC2', source: 'L920-926' },
        { id: 'c-m08-svc-quick', requirement: 'ทีมแทบไม่มีประสบการณ์ AWS/container อยากเริ่มเร็วและลองผิดลองถูก ไม่อยากตั้งค่า ECS เอง', answer: 'AWS Elastic Beanstalk', why: 'Beanstalk launch Docker multicontainer environment ได้โดยไม่ต้องจัดการรายละเอียด ECS (เฉลยข้อสอบตัวอย่างของสไลด์)', source: 'L1517, L1721-1763' }
      ]
    },
    {
      id: 'g-m08-deploy', service: 'Elastic Beanstalk', title: 'Deployment policy',
      options: [
        { name: 'All at once', traits: 'deploy version ใหม่ลงทุก instance พร้อมกัน เร็วที่สุด', when: 'ต้องการเร็วสุดและยอมรับ downtime ได้', tradeoff: 'มี downtime' },
        { name: 'Rolling', traits: 'deploy ทีละ batch ของ instance', when: 'ไม่ต้องการ downtime', tradeoff: 'ลด availability ชั่วคราว และช้ากว่า all at once' },
        { name: 'Rolling with additional batch', traits: 'เปิด batch เพิ่มก่อน แล้วค่อย rolling', when: 'ต้องรักษา capacity เต็มระหว่าง deploy', tradeoff: 'ช้ากว่า rolling' },
        { name: 'Immutable', traits: 'สร้าง Auto Scaling group ที่สอง instance ใหม่ทั้งชุด version ใหม่อยู่บน instance ใหม่เสมอ', when: 'ต้อง rollback เร็วและปลอดภัย ไม่ให้บริการสะดุด', tradeoff: 'ใช้เวลา deploy นาน' },
        { name: 'Traffic splitting', traits: 'เหมือน immutable แต่ส่ง traffic ส่วนหนึ่งไปทดสอบ health ของ version ใหม่ ที่เหลือไป version เก่า', when: 'ต้องการทำ canary testing', tradeoff: 'ใช้เวลา deploy นาน' },
        { name: 'Blue/green', traits: 'clone environment (blue → green) deploy และทดสอบใน environment ใหม่ แล้วสลับ CNAME', when: 'ต้องการทดสอบ version ใหม่ใน environment แยก', tradeoff: 'ต้องมี environment ที่สองชั่วคราว' }
      ],
      challenges: [
        { id: 'c-m08-dep-all', requirement: 'ทีมต้องการ deploy ให้เร็วที่สุด และยอมรับได้ว่าบริการหยุดช่วงสั้น ๆ', answer: 'All at once', why: 'All at once เร็วที่สุดแต่ต้องมี downtime', source: 'L1375-1383' },
        { id: 'c-m08-dep-rolling', requirement: 'ต้องการ deploy ทีละกลุ่ม instance เพื่อไม่ให้บริการหยุด โดยยอมรับว่า capacity ลดลงบ้างชั่วคราว', answer: 'Rolling', why: 'Rolling deploy ทีละ batch เลี่ยง downtime และลด availability เพียงเล็กน้อย', source: 'L1377-1387' },
        { id: 'c-m08-dep-batch', requirement: 'ต้องการ deploy แบบ rolling แต่ห้ามให้ capacity ลดลงระหว่าง deploy', answer: 'Rolling with additional batch', why: 'เปิด batch เพิ่มก่อนแล้วค่อย rolling จึงเลี่ยง reduced availability', source: 'L1391-1397' },
        { id: 'c-m08-dep-immutable', requirement: 'ต้องการให้ version ใหม่อยู่บน instance ใหม่เสมอ และ rollback ได้เร็วโดยบริการไม่สะดุด', answer: 'Immutable', why: 'Immutable สร้าง Auto Scaling group ที่สองและให้ rollback ปลอดภัยโดยไม่ interrupt service', source: 'L1419-1437' },
        { id: 'c-m08-dep-canary', requirement: 'ต้องการ canary test: ส่ง traffic บางส่วนไป version ใหม่ ที่เหลือยังไป version เก่า', answer: 'Traffic splitting', why: 'Traffic splitting ทดสอบ health ด้วย traffic ส่วนหนึ่ง และรองรับ canary testing', source: 'L1421-1433' },
        { id: 'c-m08-dep-bg', requirement: 'ต้องการ clone environment เป็นชุดใหม่ ทดสอบให้เรียบร้อยแล้วค่อยสลับ CNAME', answer: 'Blue/green', why: 'Blue/green clone environment, deploy+test ใน environment ใหม่ แล้ว swap CNAME', source: 'L1495-1502' }
      ]
    }
  ],

  questions: [
    {
      id: 'q-m08-beanstalk', type: 'scenario', format: 'choice', source: 'L1721-1763',
      prompt: 'สถาปนิกต้องการย้าย web application ไปรันบน container ทีมมีประสบการณ์ AWS และ container น้อยมาก แต่อยากเริ่มได้เร็วเพื่อทดลอง ข้อใดเหมาะที่สุด',
      keywords: ['ประสบการณ์ AWS และ container น้อยมาก', 'เริ่มได้เร็ว', 'ทดลอง'],
      choices: [
        { text: 'ใช้ Elastic Beanstalk launch multicontainer Docker environment', correct: true, why: 'Beanstalk จัดการ environment ให้และไม่ต้องตั้งค่ารายละเอียด ECS เหมาะกับทีมใหม่ที่อยากเริ่มเร็ว' },
        { text: 'ใช้ Amazon ECR เก็บ Docker image ที่สร้างขึ้นเองตั้งแต่ศูนย์', correct: false, why: 'ECR เป็นแค่ registry เก็บ image ไม่ได้ช่วยรันหรือ deploy application' },
        { text: 'ตั้ง EC2 พร้อม auto scaling แล้วลง Docker image บน instance เอง', correct: false, why: 'ต้องจัดการ instance และ scaling เองทั้งหมด ไม่เหมาะกับทีมที่ยังไม่มีประสบการณ์' },
        { text: 'ตั้ง ECS cluster บน EC2 instance ที่รัน Docker container', correct: false, why: 'ต้องตั้ง task definition, cluster, VPC, IAM เอง ซับซ้อนกว่าสำหรับทีมมือใหม่' }
      ]
    },
    {
      id: 'q-m08-fargate', type: 'scenario', format: 'choice', source: 'L989-999',
      prompt: 'บริษัทมี service บน container ที่ traffic แกว่งหนักตามแคมเปญ และมี batch job ที่รันตามเวลา ทีมไม่อยากดูแล OS ของเครื่องใน cluster ควรเลือก ECS แบบใด และเพราะอะไร (เลือก 2 ข้อ)',
      keywords: ['traffic แกว่งหนัก', 'batch job', 'ไม่อยากดูแล OS'],
      choices: [
        { text: 'ใช้ ECS ด้วย Fargate launch type', correct: true, why: 'Fargate เหมาะกับ service ที่ demand แกว่งและ batch ตามเวลา' },
        { text: 'เพราะ AWS ดูแลชั้น VM/Guest OS ให้ เราดูแลเฉพาะ container', correct: true, why: 'ตามไดอะแกรมของสไลด์ Fargate: AWS manages VM guest OS, you manage containers' },
        { text: 'ใช้ EC2 launch type เพราะต้องจัดการ Docker engine เองจึงลดงานดูแล', correct: false, why: 'EC2 launch type คือเราต้องจัดการ Docker engine และ Guest OS เอง งานดูแลมากกว่า' },
        { text: 'ใช้ Amazon ECR เพื่อ schedule container ตามเวลา', correct: false, why: 'ECR เป็น registry ไม่ใช่ orchestrator หรือ launch type' }
      ]
    },
    {
      id: 'q-m08-ec2', type: 'scenario', format: 'choice', source: 'L1003-1009',
      prompt: 'องค์กรการเงินมี workload container ขนาดใหญ่ที่ใช้ resource คงที่คาดการณ์ได้ อยากซื้อ reserved instance เพื่อลดต้นทุน และนโยบาย security บังคับให้ควบคุมเครื่องที่รัน Docker เอง ควรเลือก launch type ใดของ ECS',
      keywords: ['reserved instance', 'ควบคุมเครื่องที่รัน Docker เอง'],
      choices: [
        { text: 'EC2 launch type', correct: true, why: 'resource คาดการณ์ได้, reserved instance, และ compliance ด้านความปลอดภัยเป็นเหตุผลให้เลือก EC2' },
        { text: 'Fargate', correct: false, why: 'Fargate ให้ AWS ดูแล VM/OS ให้ จึงไม่ตอบโจทย์ที่ต้องคุมเครื่องเอง' },
        { text: 'Amazon ECR', correct: false, why: 'ECR เป็น registry ไม่ใช่ launch type' },
        { text: 'Aurora Serverless', correct: false, why: 'เป็นฐานข้อมูล ไม่เกี่ยวกับการเลือกที่รัน container' }
      ]
    },
    {
      id: 'q-m08-canary', type: 'scenario', format: 'choice', source: 'L1421-1433',
      prompt: 'ทีมใช้ Elastic Beanstalk และต้องการปล่อย version ใหม่โดยส่ง traffic ส่วนหนึ่งไปทดสอบก่อน ส่วนที่เหลือยังใช้ version เดิม ต้องกำหนด namespace อะไรเพื่อตั้งสัดส่วน traffic และเวลารอก่อนเลื่อนสัดส่วนเพิ่ม และใช้ deployment policy ใด',
      keywords: ['ส่ง traffic ส่วนหนึ่ง', 'version เดิม'],
      choices: [
        { text: 'Traffic splitting และตั้งค่าใน aws:elasticbeanstalk:trafficsplitting', correct: true, why: 'namespace นี้ใช้กำหนด % traffic ไป instance ใหม่ และระยะเวลารอก่อนเลื่อนต่อ (ใช้ทำ canary)' },
        { text: 'All at once และตั้งค่าใน aws:elasticbeanstalk:command', correct: false, why: 'All at once deploy ลงทุก instance พร้อมกัน ไม่แบ่ง traffic' },
        { text: 'Rolling และตั้งสัดส่วน traffic ผ่าน aws:elasticbeanstalk:command', correct: false, why: 'Rolling แบ่งเป็น batch ของ instance ไม่ใช่แบ่ง traffic' },
        { text: 'Blue/green ซึ่งแบ่ง traffic อัตโนมัติ 15% เสมอ', correct: false, why: 'Blue/green สลับ CNAME ทั้งก้อน และ 15% เป็นเพียงค่าในตัวอย่างของสไลด์ ไม่ใช่ค่าตายตัว' }
      ]
    },
    {
      id: 'q-m08-rollback', type: 'scenario', format: 'choice', source: 'L1423-1437',
      prompt: 'แอปต้องการ deploy version ใหม่โดยให้ version ใหม่อยู่บน instance ใหม่เสมอ ไม่ให้บริการสะดุด และต้อง rollback ได้เร็วอย่างปลอดภัยถ้ามีปัญหา ควรเลือก Elastic Beanstalk deployment policy ใด',
      keywords: ['instance ใหม่เสมอ', 'rollback'],
      choices: [
        { text: 'Immutable: สร้าง Auto Scaling group ที่สองด้วย instance ใหม่ แล้วค่อยสลับ', correct: true, why: 'สไลด์ระบุว่า Immutable ทำให้ version ใหม่อยู่บน instance ใหม่เสมอ และ rollback ได้เร็วอย่างปลอดภัยโดยไม่ interrupt service' },
        { text: 'All at once', correct: false, why: 'เร็วที่สุดแต่มี downtime และ deploy ทับ instance เดิม' },
        { text: 'Rolling', correct: false, why: 'deploy ลง instance เดิมทีละ batch จึงไม่ใช่ instance ใหม่เสมอ และ capacity ลดลงชั่วคราว' },
        { text: 'Rolling with additional batch', correct: false, why: 'เพิ่ม batch ก่อนแล้ว rolling เพื่อไม่ให้ capacity ลด แต่ยังเป็นการ deploy ทับ instance เดิมทีละกลุ่ม' }
      ]
    },
    {
      id: 'q-m08-micro', type: 'scenario', format: 'choice', source: 'L799-834',
      prompt: 'ร้านค้าออนไลน์เป็น monolith ตัวเดียว ทีมอยากให้ service บัญชี ตะกร้า และจัดส่ง เขียนด้วยภาษาที่เหมาะกับแต่ละงาน แยกอัปเดตได้อิสระ และถ้า service ใดล้มก็เปลี่ยน instance ใหม่ได้ทันที เหมาะกับแนวทางใด',
      keywords: ['ภาษาที่เหมาะกับแต่ละงาน', 'แยกอัปเดตได้อิสระ'],
      choices: [
        { text: 'แตกเป็น microservices แล้วรันแต่ละ service ใน container', correct: true, why: 'container ใช้ภาษา/เทคโนโลยีที่เหมาะกับแต่ละ service อัปเดตแยกกันได้ และปิด/สร้าง instance ใหม่ได้เมื่อมีปัญหา' },
        { text: 'คง monolith แต่เพิ่ม memory ของเซิร์ฟเวอร์', correct: false, why: 'ไม่แก้เรื่องการแยกภาษา/แยกอัปเดต' },
        { text: 'ย้ายทั้งก้อนไปบน bare-metal เครื่องใหม่', correct: false, why: 'bare-metal แย่งทรัพยากรและต้องใช้ไลบรารีร่วมกัน ตรงข้ามกับโจทย์' },
        { text: 'ใช้ Amazon ECR เก็บโค้ด monolith', correct: false, why: 'ECR เก็บ container image ไม่ได้ทำให้เป็น microservices' }
      ]
    },
    {
      id: 'q-m08-parity', type: 'scenario', format: 'choice', source: 'L833-834',
      prompt: 'โปรแกรมเมอร์บ่นว่าแอปทำงานได้บนเครื่อง dev แต่พอขึ้น production แล้วพฤติกรรมต่างกัน เพราะเวอร์ชันไลบรารีไม่ตรงกัน ควรแก้ด้วยวิธีใดตามแนวคิดของโมดูลนี้',
      keywords: ['เครื่อง dev', 'production'],
      choices: [
        { text: 'แพ็กแอปพร้อม dependency และไลบรารีเป็น container image แล้วใช้ image เดียวกันทุก environment', correct: true, why: 'container รวม dependency เป็นหน่วยเดียวที่ไม่เปลี่ยน ทำให้ dev, test, prod สอดคล้องกัน (dev/prod parity)' },
        { text: 'เพิ่ม CPU ให้เซิร์ฟเวอร์ production', correct: false, why: 'ปัญหาคือความต่างของ environment ไม่ใช่กำลังประมวลผล' },
        { text: 'ติดตั้งไลบรารีด้วยมือบน production ให้ตรงกับ dev', correct: false, why: 'ยังคงซ้ำซ้อนและพลาดได้ ไม่ใช่การทำให้ environment เหมือนกันอย่างเป็นระบบ' },
        { text: 'ย้ายไป bare-metal เพื่อไม่ให้มี layer เพิ่ม', correct: false, why: 'bare-metal ต้องแชร์เวอร์ชันไลบรารีข้ามแอป ซึ่งทำให้ปัญหาแย่ลง' }
      ]
    },
    {
      id: 'q-m08-aurora', type: 'scenario', format: 'choice', source: 'L1546-1554, L1563-1577',
      prompt: 'ทีมรัน MySQL ใน container แต่ต้องการลดงานดูแล ให้ฐานข้อมูล scale ขึ้นลงตาม traffic อัตโนมัติ และหยุดทำงานเมื่อไม่มีผู้ใช้ ควรเลือกอะไร',
      keywords: ['MySQL ใน container', 'scale ขึ้นลงตาม traffic'],
      choices: [
        { text: 'ย้ายไป Amazon Aurora Serverless', correct: true, why: 'Aurora Serverless เข้ากันได้กับ MySQL เป็น managed และ scale ตาม traffic พร้อมหยุดเมื่อไม่ใช้งาน' },
        { text: 'เพิ่ม container MySQL อีกหลายตัวด้วยมือ', correct: false, why: 'ยังต้องดูแลเอง ไม่ได้ลดงาน' },
        { text: 'ใช้ Amazon ECR เก็บข้อมูลของฐานข้อมูล', correct: false, why: 'ECR เก็บ container image ไม่ใช่ข้อมูลของ DB' },
        { text: 'ใช้ Fargate รัน MySQL แทน EC2', correct: false, why: 'ยังเป็น DB ที่รันใน container เอง ไม่ใช่ managed database service ที่ scale ตาม traffic' }
      ]
    },
    {
      id: 'q-m08-written', type: 'scenario', format: 'written', source: 'L1546-1554, L1517, L1592-1610',
      prompt: 'คาเฟ่ได้ containerize แอปของ supplier แล้ว แต่ต้องการลดภาระการดูแลและเพิ่มความสามารถในการ scale ตอนนี้ฐานข้อมูล MySQL ยังรันใน container จงเสนอแนวทางปรับ architecture สำหรับ website และฐานข้อมูล พร้อมอธิบายเหตุผลเทียบกับการรัน container เอง',
      keywords: ['ลดภาระการดูแล', 'scale', 'MySQL'],
      rubric: [
        'เสนอ Elastic Beanstalk สำหรับ deploy website ที่ containerize แล้ว (จัด provisioning, load balancing, auto scaling, health monitoring ให้)',
        'เสนอ Aurora Serverless แทน MySQL ใน container (managed, เข้ากันได้กับ MySQL, scale ตาม traffic)',
        'อธิบายว่าการย้าย DB ออกจาก container ลดงานดูแล',
        'ระบุว่า image ของเว็บเก็บใน ECR เพื่อให้ Beanstalk ดึงไปใช้ (หรือกล่าวถึง registry)'
      ],
      modelAnswer: 'ใช้ Elastic Beanstalk deploy website เพราะ Beanstalk ดูแล capacity provisioning, load balancing, auto scaling และ health monitoring ให้ทั้งหมดในรูป environment ทีมจึงไม่ต้องตั้งค่า ECS เอง ส่วนฐานข้อมูลให้ย้ายจาก MySQL ใน container ไปเป็น Amazon Aurora Serverless ซึ่งเข้ากันได้กับ MySQL เป็น managed service ใน RDS และ scale ขึ้นลงตาม traffic อัตโนมัติ พร้อมหยุดเมื่อไม่มีใช้งาน ต้อง load user, table และข้อมูลเดิมเข้าไป image ของเว็บเก็บไว้ใน Amazon ECR ให้ Beanstalk ดึงไปรัน ผลคือดูแลน้อยลงและ scale ได้ดีกว่าการจัดการ container และ DB เอง'
    },
    {
      id: 'q-m08-written2', type: 'scenario', format: 'written', source: 'L912-1009, L1051-1065',
      prompt: 'บริษัทต้องรัน container ขนาดใหญ่จำนวนมากบน AWS ทีมกำลังตัดสินใจระหว่างใช้ orchestrator แบบ AWS-native กับ Kubernetes และต้องเลือกด้วยว่าจะให้ใครดูแลเครื่องที่รัน container จงอธิบายตัวเลือกและเงื่อนไขที่ควรเลือกแต่ละแบบ',
      keywords: ['AWS-native', 'Kubernetes', 'ดูแลเครื่อง'],
      rubric: [
        'ระบุ ECS เป็น orchestration แบบ AWS-native และ EKS เป็น managed Kubernetes (เลือก EKS ถ้าทีมใช้ Kubernetes อยู่แล้ว)',
        'อธิบาย Fargate: AWS ดูแลชั้น VM/OS เหมาะกับ demand แกว่ง, batch ตามเวลา, test env เล็ก',
        'อธิบาย EC2 launch type: เราดูแลเอง เหมาะกับ workload คาดการณ์ได้/reserved instance/compliance',
        'กล่าวถึง ECR เป็นที่เก็บ image ที่ ECS ดึงไปใช้'
      ],
      modelAnswer: 'ถ้าทีมไม่ผูกกับ Kubernetes ใช้ Amazon ECS ซึ่งเป็น orchestration แบบ managed ของ AWS จัด scheduling/placement ให้ แต่ถ้าใช้ Kubernetes อยู่แล้วให้เลือก Amazon EKS ที่ conformant และ worker node ใช้ EC2 หรือ Fargate ได้ ส่วนตัวรัน: ถ้าอยากให้ AWS ดูแล OS/VM ให้และ demand แกว่ง มี batch ตามเวลา หรือเป็น test env เล็ก ให้เลือก Fargate แต่ถ้า resource คาดการณ์ได้ อยากใช้ reserved instance ลดต้นทุน หรือมีข้อกำหนดด้านความปลอดภัยที่ต้องคุมเครื่องเอง ให้เลือก EC2 launch type image ทั้งหมดเก็บไว้ใน ECR แล้วให้ ECS/EKS ดึงไปรัน'
    },
    {
      id: 'q-m08-design', type: 'design', format: 'written', source: 'L118, L1626, L1546-1554',
      prompt: 'ออกแบบ architecture ของเว็บ supplier ของคาเฟ่: image ของเว็บเก็บในที่เก็บ image ที่ปลอดภัย แล้วนำไป deploy บนบริการที่จัดการ load balancing และ auto scaling ให้เอง ผู้ใช้เข้าผ่าน REST API (proxy) และข้อมูลอยู่ในฐานข้อมูลที่ scale ตาม traffic อัตโนมัติ จงวาด flow พร้อมลำดับบนลูกศร และอธิบายสั้น ๆ',
      keywords: ['เก็บ image', 'load balancing และ auto scaling', 'scale ตาม traffic'],
      flow: {
        nodes: [
          { id: 'user', label: 'Users' },
          { id: 'apigw', label: 'API Gateway' },
          { id: 'eb', label: 'Elastic Beanstalk' },
          { id: 'lb', label: 'Load Balancer' },
          { id: 'ec2', label: 'EC2 (Docker container)' },
          { id: 'ecr', label: 'Amazon ECR' },
          { id: 'aurora', label: 'Aurora Serverless' }
        ],
        edges: [
          { from: 'user', to: 'apigw', label: '1' },
          { from: 'apigw', to: 'lb', label: '2' },
          { from: 'lb', to: 'ec2', label: '3' },
          { from: 'ec2', to: 'aurora', label: '4' },
          { from: 'ecr', to: 'ec2', label: 'pull image' },
          { from: 'eb', to: 'lb', label: 'manages' }
        ],
        distractors: ['Lambda', 'EKS', 'S3', 'Amazon RDS (EC2 MySQL)']
      },
      rubric: [
        'มี Users → API Gateway → Elastic Beanstalk environment (load balancer + instance) ตามลำดับ',
        'แสดง ECR เป็นต้นทางของ image ที่ถูกดึงมารัน',
        'แสดง Aurora Serverless เป็นฐานข้อมูลที่ app เชื่อมต่อ (แทน MySQL ใน container)',
        'อธิบายว่า Beanstalk จัด load balancing/auto scaling/health monitoring ให้',
        'ไม่ใส่ service ที่ไม่จำเป็น (เช่น EKS, Lambda)'
      ],
      modelAnswer: '1) ผู้ใช้เรียกผ่าน API Gateway (ทำหน้าที่ proxy)\n2) API Gateway ส่ง request ไปที่ Elastic Beanstalk environment ซึ่งมี load balancer อยู่ด้านหน้า\n3) Load balancer กระจายไปยัง EC2 instance ที่รัน Docker container ของเว็บ (Beanstalk ดูแล provisioning, auto scaling, health monitoring)\n4) container ดึง image จาก Amazon ECR ตอน deploy และเชื่อมต่อ Amazon Aurora Serverless เป็นฐานข้อมูลที่ scale ตาม traffic'
    },
    {
      id: 'q-m08-design2', type: 'design', format: 'written', source: 'L1495-1502, L1364-1437',
      prompt: 'ทีมต้องปล่อย version ใหม่ของแอปบน Elastic Beanstalk ที่ต้องไม่หยุดให้บริการ ต้องทดสอบ version ใหม่ใน environment แยกก่อนให้ผู้ใช้จริง แล้วค่อยสลับการให้บริการ จงวาด flow ของ blue/green deployment พร้อมลำดับบนลูกศร แล้วอธิบายขั้นตอน',
      keywords: ['environment แยก', 'สลับ'],
      flow: {
        nodes: [
          { id: 'users', label: 'Users' },
          { id: 'blue', label: 'Environment (blue)' },
          { id: 'clone', label: 'Clone environment' },
          { id: 'green', label: 'Environment (green)' },
          { id: 'test', label: 'Deploy and test new version' },
          { id: 'swap', label: 'Swap CNAMEs' }
        ],
        edges: [
          { from: 'users', to: 'blue', label: 'ก่อน swap' },
          { from: 'blue', to: 'clone', label: '1' },
          { from: 'clone', to: 'green', label: '1' },
          { from: 'green', to: 'test', label: '2' },
          { from: 'test', to: 'swap', label: '3' },
          { from: 'swap', to: 'users', label: 'traffic ไป green' }
        ],
        distractors: ['Terminate all instances', 'Immutable ASG', 'Amazon ECR']
      },
      rubric: [
        'เริ่มจาก environment เดิม (blue) รับ traffic อยู่',
        'ขั้นที่ 1 clone environment เป็นชุดใหม่ (green)',
        'ขั้นที่ 2 deploy และทดสอบ version ใหม่ใน environment ใหม่',
        'ขั้นที่ 3 swap CNAME เพื่อสลับ traffic ไป green'
      ],
      modelAnswer: '1) Clone environment ปัจจุบัน (blue) ได้ environment ใหม่ (green)\n2) deploy version ใหม่และทดสอบใน green ขณะที่ blue ยังรับผู้ใช้อยู่\n3) เมื่อพร้อม swap CNAME ของสอง environment ผู้ใช้จึงถูกส่งไป green โดยบริการไม่หยุด และถ้ามีปัญหายังสลับกลับไป blue ได้'
    }
  ]
});
