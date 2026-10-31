/* M13 CI/CD & infrastructure as code
   source = เลขบรรทัดในไฟล์สไลด์ต้นฉบับ (notes/ (13 f) ... M13-CICD.md) */
GUIDE.register({
  module: 'M13',
  title: 'CI/CD & Infrastructure as Code',
  summary: 'DevOps/DevSecOps, CI vs delivery vs deployment, CodePipeline/CodeBuild/CodeDeploy, CloudFormation (stack, template), SAM',

  notes: [
    {
      heading: 'DevOps และ DevSecOps',
      body: '<p>บนคลาวด์ "แอป" หมายถึงตัวโค้ด <strong>รวมถึง infrastructure ทั้งหมดที่เกี่ยวข้อง</strong> ไม่ใช่แค่โค้ดอย่างเดียว</p>' +
        '<ul><li>DevOps = วัฒนธรรม + วิธีปฏิบัติ + เครื่องมือ ที่ทำลายกำแพงระหว่างทีม Dev กับ Ops ให้รับผิดชอบร่วมกัน</li>' +
        '<li>DevSecOps = เพิ่มมิติ <strong>Security</strong> เข้าไปเป็นส่วนหนึ่งตั้งแต่ต้น</li>' +
        '<li>ผลที่ต้องการ: โค้ดที่ปลอดภัย เชื่อถือได้ และดูแลต่อได้ง่าย</li></ul>' +
        '<p>ในเรื่องคาเฟ่ Sofía อยากให้การปล่อยเว็บผิดพลาดจากคนน้อยลง Mateo จึงอธิบาย DevOps ให้ฟัง</p>',
      refs: ['q-m13-devops', 'g-m13-cicd']
    },
    {
      heading: 'CI vs Continuous delivery vs Continuous deployment',
      body: '<ul><li><strong>CI</strong>: รวมโค้ดและ build บ่อย ๆ (คนมักคิดว่า CI จบแค่ขั้น build)</li>' +
        '<li><strong>Continuous delivery</strong>: ต่อยอดจาก CI ให้มั่นใจมากขึ้นว่าซอฟต์แวร์ใช้ได้จริงบน production มีจุด <em>manual intervention</em> (คนอนุมัติ) ก่อน deploy</li>' +
        '<li><strong>Continuous deployment</strong>: อัตโนมัติตลอดทางจนถึง deploy ไม่มีคนมาคั่น</li></ul>' +
        '<p>จำง่าย ๆ: ถ้ามีคนกดอนุมัติก่อนขึ้น production = delivery, ถ้าไม่มี = deployment</p>',
      refs: ['g-m13-cicd', 'q-m13-approval', 'c-m13-cicd-approval']
    },
    {
      heading: 'AWS code services',
      body: '<ul><li><strong>CodePipeline</strong>: ร้อยทุกขั้นเข้าเป็น pipeline ของการปล่อย</li>' +
        '<li><strong>CodeBuild</strong>: ขั้น build (และทดสอบ)</li>' +
        '<li><strong>CodeDeploy</strong>: ขั้น deploy</li>' +
        '<li>CodeConnections อยู่ในกลุ่มเครื่องมือ CI/CD เหมือนกัน แต่สไลด์ไม่ได้อธิบายหน้าที่ จึงไม่ต้องกังวลว่าจะถูกถามรายละเอียด</li></ul>' +
        '<p>ขั้น Test ในภาพสไลด์เขียนว่า "your favorite tools" คือจะใช้เครื่องมือที่ชอบก็ได้ ส่วนในแล็บ คาเฟ่เก็บโค้ดไว้ใน code repository แล้วให้ CodePipeline อัปเดตเว็บอัตโนมัติ</p>',
      refs: ['g-m13-codesvc', 'q-m13-pipeline', 'q-m13-design', 'q-m13-written'],
      diagram: {
        title: 'ขั้นตอนของ CI/CD pipeline',
        caption: 'CodePipeline ร้อยทุกขั้นเข้าด้วยกัน โดย CodeBuild ทำขั้น Build และ CodeDeploy ทำขั้น Deploy',
        source: 'L297-321, L764-766',
        flow: {
          nodes: [
            { id: 'repo', label: 'Code repository' },
            { id: 'pipeline', label: 'CodePipeline' },
            { id: 'build', label: 'Build (CodeBuild)' },
            { id: 'test', label: 'Test (your tools)' },
            { id: 'manual', label: 'Manual intervention' },
            { id: 'deploy', label: 'Deploy (CodeDeploy)' }
          ],
          edges: [
            { from: 'repo', to: 'pipeline', label: '1' },
            { from: 'pipeline', to: 'build', label: '2' },
            { from: 'build', to: 'test', label: '3' },
            { from: 'test', to: 'manual', label: 'optional' },
            { from: 'manual', to: 'deploy', label: '4' }
          ]
        }
      }
    },
    {
      heading: 'CloudFormation: template และ stack',
      body: '<p>Infrastructure as code = สร้าง/แก้/ลบ infrastructure ด้วยโค้ด จึงเปิด environment dev/test ที่เหมือนกันได้ทุกครั้ง และใช้โค้ดชุดเดียวกันสร้าง production</p>' +
        '<ul><li><strong>Template</strong> = ไฟล์ข้อความ JSON หรือ YAML ระบุ resource ที่จะสร้าง</li>' +
        '<li><strong>Stack</strong> = หน่วยของการ deploy ที่เกิดจาก template สร้างและอัปเดตได้ <strong>ลบ stack = resource ใน stack ถูกลบทั้งหมด</strong></li>' +
        '<li>จำนวน stack อาจติด quota ถ้าชน ให้ขอเพิ่มผ่าน <strong>Support Center</strong> (เฉลยข้อสอบตัวอย่างในสไลด์)</li></ul>',
      refs: ['q-m13-stack-quota', 'l-m13-stack-quota'],
      diagram: {
        title: 'Template, stack และ resource',
        caption: 'Template สร้าง stack และ resource ทั้งหมดถูกสร้างพร้อมกัน ลบ stack แล้ว resource ถูกลบตามไปด้วย',
        source: 'L440-448, L648-656',
        flow: {
          nodes: [
            { id: 'template', label: 'Template (JSON/YAML)' },
            { id: 'stack', label: 'Stack' },
            { id: 'resources', label: 'Resources ใน stack' },
            { id: 'deleted', label: 'Resources ถูกลบ' }
          ],
          edges: [
            { from: 'template', to: 'stack', label: 'create/update' },
            { from: 'stack', to: 'resources', label: 'provision' },
            { from: 'stack', to: 'deleted', label: 'ลบ stack' }
          ]
        }
      }
    },
    {
      heading: 'โครงสร้าง template',
      body: '<p>ส่วนที่มีได้: AWSTemplateFormatVersion, Description, Metadata, Parameters, Mappings, Conditions, Transform, Resources, Outputs</p>' +
        '<ul><li>มี <strong>Resources</strong> เป็นส่วนเดียวที่จำเป็น (required)</li>' +
        '<li>AWSTemplateFormatVersion เวอร์ชันล่าสุดคือ 2010-09-09</li>' +
        '<li>ตัวอย่าง Parameters ในสไลด์: Type, Default, AllowedValues, NoEcho (ซ่อนค่าไม่ให้แสดง)</li></ul>',
      refs: ['g-m13-sections', 'l-m13-required', 'l-m13-version']
    },
    {
      heading: 'AWS SAM',
      body: '<ul><li>framework โอเพนซอร์สสำหรับสร้าง template ของแอป serverless แล้ว deploy ผ่าน CloudFormation</li>' +
        '<li>เป็น <strong>ส่วนขยายของ CloudFormation</strong> จึงได้ความน่าเชื่อถือของการ deploy แบบเดียวกัน</li>' +
        '<li>ใส่บรรทัด <code>Transform: AWS::Serverless-2016-10-31</code> เพื่อบอก CloudFormation ว่าต้องแปลง SAM template</li>' +
        '<li>ประเภท resource ในตัวอย่าง: <code>AWS::Serverless::Function</code> (Lambda + API event) และ <code>AWS::Serverless::SimpleTable</code> (DynamoDB)</li>' +
        '<li>เชื่อมกับ CodeBuild/CodeDeploy/CodePipeline ได้ และจำลองการเรียกใช้แบบ local ได้</li></ul>',
      refs: ['g-m13-iac', 'q-m13-sam', 'l-m13-sam-transform'],
      diagram: {
        title: 'SAM template ผ่าน CloudFormation',
        caption: 'บรรทัด Transform บอก CloudFormation ให้แปลง SAM template ก่อนสร้าง resource',
        source: 'L700-710',
        flow: {
          nodes: [
            { id: 'sam', label: 'SAM template' },
            { id: 'cfn', label: 'CloudFormation' },
            { id: 'func', label: 'Serverless::Function' },
            { id: 'table', label: 'Serverless::SimpleTable' }
          ],
          edges: [
            { from: 'sam', to: 'cfn', label: 'Transform' },
            { from: 'cfn', to: 'func', label: 'Lambda' },
            { from: 'cfn', to: 'table', label: 'DynamoDB' }
          ]
        }
      }
    }
  ],

  limits: [
    {
      id: 'l-m13-stack-quota', service: 'CloudFormation', name: 'วิธีขอเพิ่ม quota จำนวน stack',
      display: 'จำนวน stack ถูกจำกัดด้วย quota ขอเพิ่มผ่าน Support Center ใน Management Console',
      accept: ['support center', 'Support Center', 'ผ่าน support center'], source: 'L446, L929, L942'
    },
    {
      id: 'l-m13-version', service: 'CloudFormation', name: 'AWSTemplateFormatVersion ล่าสุด',
      display: '2010-09-09',
      accept: ['2010-09-09', '2010-9-9', '20100909'], source: 'L505, L543'
    },
    {
      id: 'l-m13-required', service: 'CloudFormation', name: 'Section ของ template ที่จำเป็นต้องมี',
      display: 'Resources (ส่วนเดียวที่ required)',
      accept: ['resources', 'Resources', 'section resources'], source: 'L513-516'
    },
    {
      id: 'l-m13-sam-transform', service: 'SAM', name: 'ค่า Transform ของ SAM template',
      display: 'AWS::Serverless-2016-10-31',
      accept: ['AWS::Serverless-2016-10-31', 'aws::serverless-2016-10-31', 'serverless-2016-10-31', '2016-10-31'], source: 'L706'
    }
  ],

  optionGroups: [
    {
      id: 'g-m13-cicd', service: 'CI/CD', title: 'CI vs Continuous delivery vs Continuous deployment',
      options: [
        { name: 'Continuous integration', traits: 'รวมโค้ดและ build (ทดสอบ) บ่อย ๆ มักถูกมองว่าจบที่ขั้น build', when: 'ต้องการตรวจโค้ดใหม่ทุกครั้งที่ merge', tradeoff: 'ยังไม่ครอบคลุมการ deploy' },
        { name: 'Continuous delivery', traits: 'ต่อยอด CI ให้มั่นใจว่าใช้ได้บน production มีจุด manual intervention ก่อน deploy', when: 'ต้องมีคนอนุมัติก่อนขึ้น production', tradeoff: 'ช้ากว่าเพราะรอคน' },
        { name: 'Continuous deployment', traits: 'อัตโนมัติตลอดทางจนถึง deploy ไม่มี manual intervention', when: 'ต้องการปล่อยทุก commit ที่ผ่านการทดสอบโดยอัตโนมัติเต็มรูปแบบ', tradeoff: 'ไม่มีด่านคนตรวจสุดท้าย ต้องพึ่งการทดสอบอัตโนมัติ' }
      ],
      challenges: [
        { id: 'c-m13-cicd-approval', requirement: 'ผู้จัดการต้องกดอนุมัติเองก่อนที่เวอร์ชันใหม่จะขึ้น production', answer: 'Continuous delivery', why: 'delivery มีจุด manual intervention ก่อน deploy (ในสไลด์เป็นป้ายกำกับในภาพ)', source: 'L297-305', supplement: true },
        { id: 'c-m13-cicd-auto', requirement: 'ทุก commit ที่ผ่านการทดสอบต้องถูก deploy ขึ้น production เองโดยไม่มีคนมาอนุมัติ', answer: 'Continuous deployment', why: 'deployment คืออัตโนมัติเต็มรูปแบบไม่มี manual intervention', source: 'L297-305', supplement: true },
        { id: 'c-m13-cicd-build', requirement: 'นักพัฒนา merge โค้ดเข้าที่กลางหลายครั้งต่อวันและให้ระบบ build ทุกครั้ง', answer: 'Continuous integration', why: 'CI คือการรวมโค้ดและ build บ่อย ๆ', source: 'L297, L334-338' }
      ]
    },
    {
      id: 'g-m13-codesvc', service: 'CI/CD', title: 'Code service ที่ตรงกับแต่ละขั้น',
      options: [
        { name: 'CodePipeline', traits: 'ประสานทุกขั้นของการปล่อยเข้าเป็น pipeline เดียว (ภาพสไลด์วางไว้ใต้ทุกขั้น)', when: 'อยากให้ commit ใหม่ไหลไปจน deploy อัตโนมัติ', tradeoff: 'ต้องมี service ทำ build/deploy ต่อกับมัน' },
        { name: 'CodeBuild', traits: 'ทำขั้น Build ของ pipeline', when: 'ต้องคอมไพล์/สร้าง artifact', tradeoff: 'ไม่ได้ทำหน้าที่ deploy' },
        { name: 'CodeDeploy', traits: 'ทำขั้น Deploy ของ pipeline', when: 'ต้องนำ build ที่ได้ไปติดตั้งบน compute ปลายทาง', tradeoff: 'ไม่ได้ build' }
      ],
      challenges: [
        { id: 'c-m13-svc-build', requirement: 'ขั้น Build ใน pipeline ต้องการ service มาจัดการสร้างโค้ด', answer: 'CodeBuild', why: 'ภาพ CI/CD with AWS code services ผูกขั้น Build กับ CodeBuild', source: 'L321' },
        { id: 'c-m13-svc-deploy', requirement: 'ขั้น Deploy ใน pipeline ต้องการ service มานำแอปไปติดตั้ง', answer: 'CodeDeploy', why: 'ภาพเดียวกันผูกขั้น Deploy กับ CodeDeploy', source: 'L321' },
        { id: 'c-m13-svc-pipe', requirement: 'ต้องการ service ที่เชื่อมขั้น build, test, deploy เข้าเป็นกระบวนการปล่อยอัตโนมัติเดียว', answer: 'CodePipeline', why: 'CodePipeline คือตัวประสานทั้ง workflow (ในแล็บคาเฟ่ก็ใช้อัปเดตเว็บอัตโนมัติ)', source: 'L321, L766' }
      ]
    },
    {
      id: 'g-m13-iac', service: 'IaC', title: 'CloudFormation vs SAM',
      options: [
        { name: 'CloudFormation', traits: 'บริการ fully managed สร้าง/อัปเดต/ลบ resource เป็น stack จาก template JSON หรือ YAML', when: 'ต้องการสร้าง infrastructure ทั้งชุด (VPC, ELB, EC2, RDS ฯลฯ) ซ้ำได้เหมือนเดิม', tradeoff: 'template ของ serverless เขียนยาวกว่า SAM' },
        { name: 'AWS SAM', traits: 'framework โอเพนซอร์ส ส่วนขยายของ CloudFormation สำหรับ serverless ใช้ Transform และ resource แบบ Serverless::Function / SimpleTable', when: 'สร้างแอป serverless (Lambda, API Gateway, DynamoDB) และอยากทดสอบ local', tradeoff: 'ยัง deploy ผ่าน CloudFormation อยู่' }
      ],
      challenges: [
        { id: 'c-m13-iac-env', requirement: 'ต้องการสร้าง environment dev, test, prod ที่เหมือนกันเป๊ะจากโค้ดชุดเดียว ครอบคลุม VPC, ELB, EC2 และ RDS', answer: 'CloudFormation', why: 'IaC ของ resource ทั่วไปใช้ CloudFormation สร้างเป็น stack ซ้ำได้', source: 'L363-367, L382-395' },
        { id: 'c-m13-iac-serverless', requirement: 'นิยามแอป serverless ที่มี Lambda, API Gateway และตาราง DynamoDB ด้วย template สั้น ๆ และเรียกฟังก์ชันทดสอบบนเครื่องได้', answer: 'AWS SAM', why: 'SAM ออกแบบมาสำหรับแอป serverless และมี invocation environment แบบ local', source: 'L678-686, L706' },
        { id: 'c-m13-iac-delete', requirement: 'ต้องการลบ resource ทั้งหมดที่สร้างมาด้วยกันในครั้งเดียว', answer: 'CloudFormation', why: 'ลบ stack จะลบ resource ทั้งหมดใน stack', source: 'L448, L653' }
      ]
    },
    {
      id: 'g-m13-sections', service: 'CloudFormation', title: 'Section ของ template',
      options: [
        { name: 'Resources', traits: 'กำหนด resource ที่จะสร้าง เช่น AWS::EC2::Volume ส่วนเดียวที่ required', when: 'ทุก template ต้องมี', tradeoff: '' },
        { name: 'Parameters', traits: 'รับค่าจากผู้ใช้ตอนสร้าง stack มี attribute เช่น Type, Default, AllowedValues, NoEcho', when: 'อยากเปลี่ยนค่าโดยไม่แก้ template', tradeoff: '' },
        { name: 'Transform', traits: 'ระบุ macro/transform ที่ CloudFormation ต้องประมวลผล เช่น ของ SAM', when: 'template เป็น SAM', tradeoff: '' },
        { name: 'AWSTemplateFormatVersion', traits: 'เวอร์ชันของรูปแบบ template ค่าล่าสุด 2010-09-09', when: 'ระบุหัว template', tradeoff: '' }
      ],
      challenges: [
        { id: 'c-m13-sec-required', requirement: 'section ใดของ template ที่ขาดไม่ได้เลย', answer: 'Resources', why: 'สไลด์ระบุว่า Resources เป็นส่วนเดียวที่ required', source: 'L513-516' },
        { id: 'c-m13-sec-noecho', requirement: 'ต้องการให้ผู้ใช้กรอกชื่อ admin ของฐานข้อมูลตอนสร้าง stack และมีตัวเลือกซ่อนค่าได้', answer: 'Parameters', why: 'NoEcho เป็น attribute ที่ปรากฏในตัวอย่างส่วน Parameters', source: 'L550-557' },
        { id: 'c-m13-sec-sam', requirement: 'บรรทัด AWS::Serverless-2016-10-31 อยู่ใน section ใดของ SAM template', answer: 'Transform', why: 'Transform บอก CloudFormation ว่าต้องแปลง SAM template', source: 'L706' }
      ]
    }
  ],

  questions: [
    {
      id: 'q-m13-stack-quota', type: 'scenario', format: 'choice', source: 'L925-950',
      prompt: 'นักพัฒนาใช้จำนวน CloudFormation stack ใน Region หนึ่งจนถึง account quota แล้ว ต้องการเพิ่ม quota ควรทำอย่างไร',
      keywords: ['account quota', 'CloudFormation stack'],
      choices: [
        { text: 'ใช้ Support Center ใน AWS Management Console เพื่อขอเพิ่ม', correct: true, why: 'เป็นเฉลยของข้อสอบตัวอย่างในสไลด์' },
        { text: 'ใช้ AWS CLI สั่งเพิ่ม quota โดยตรง', correct: false, why: 'สไลด์ไม่ใช่คำตอบนี้ ช่องทางที่ถูกคือ Support Center' },
        { text: 'ส่งอีเมลไปที่ quotas@amazon.com หัวข้อ "CloudFormation"', correct: false, why: 'เป็นตัวลวงในข้อสอบตัวอย่าง' },
        { text: 'quota ทุกตัวเป็นค่าคงที่ ขอเพิ่มไม่ได้', correct: false, why: 'quota ของ stack ขอเพิ่มได้ผ่าน Support Center' }
      ]
    },
    {
      id: 'q-m13-devops', type: 'scenario', format: 'choice', source: 'L67, L119-133, L267',
      prompt: 'ที่คาเฟ่ ทีมพัฒนาเขียนโค้ดแล้วส่งต่อให้ทีมดูแลระบบ deploy เอง ทำให้สื่อสารกันน้อยและปล่อยงานผิดพลาดบ่อย Sofía อยากลดข้อผิดพลาดจากคน และต้องการให้ความปลอดภัยเป็นส่วนหนึ่งของกระบวนการด้วย แนวทางใดเหมาะที่สุด',
      keywords: ['ทีมดูแลระบบ', 'ความปลอดภัย'],
      choices: [
        { text: 'DevSecOps: ทลายกำแพง Dev กับ Ops ใช้ automation และรวม Security เข้ามาร่วมรับผิดชอบ', correct: true, why: 'DevOps ลดกำแพงและเน้น shared responsibility ส่วน DevSecOps เพิ่ม Security' },
        { text: 'แยกทีม Dev กับ Ops ให้ชัดขึ้นและส่งงานผ่านเอกสาร', correct: false, why: 'ตรงข้ามกับ DevOps ที่ลดกำแพงระหว่างสองทีม' },
        { text: 'ให้ทีม Ops ทำ manual checklist ก่อน deploy ทุกครั้ง', correct: false, why: 'ยังเป็นกระบวนการ manual ที่เสี่ยงผิดพลาดจากคน' },
        { text: 'เพิ่ม instance type ของเซิร์ฟเวอร์ให้ใหญ่ขึ้น', correct: false, why: 'ไม่เกี่ยวกับกระบวนการปล่อยงาน' }
      ]
    },
    {
      id: 'q-m13-approval', type: 'scenario', format: 'choice', source: 'L297-305, L338',
      prompt: 'บริษัทต้องการ pipeline ที่ build และทดสอบอัตโนมัติ แต่ก่อนขึ้น production ต้องให้ผู้จัดการอนุมัติด้วยมือหนึ่งครั้ง ข้อใดอธิบายแนวทางนี้ได้ถูกต้อง',
      keywords: ['อนุมัติด้วยมือ'],
      choices: [
        { text: 'Continuous delivery เพราะมี manual intervention ก่อน deploy', correct: true, why: 'delivery ต่อยอด CI และมีจุดคนคั่นก่อน deploy' },
        { text: 'Continuous deployment เพราะอัตโนมัติทุกขั้นตอน', correct: false, why: 'deployment ไม่มี manual intervention' },
        { text: 'Continuous integration เพราะ CI ครอบคลุมถึงการ deploy', correct: false, why: 'CI มักจบที่ขั้น build' },
        { text: 'Infrastructure as code เพราะใช้ template', correct: false, why: 'IaC คือการสร้าง infrastructure ด้วยโค้ด ไม่ใช่รูปแบบการปล่อยงาน' }
      ]
    },
    {
      id: 'q-m13-pipeline', type: 'scenario', format: 'choice', source: 'L321, L764-766',
      prompt: 'หลังเว็บคาเฟ่ขึ้น production แล้ว Sofía ต้องการรวมโค้ดเว็บไว้ที่เดียวพร้อม version control และให้การอัปเดตเว็บเกิดอัตโนมัติ ควรทำอย่างไร (เลือก 2 ข้อ)',
      keywords: ['version control', 'อัปเดตเว็บเกิดอัตโนมัติ'],
      choices: [
        { text: 'เก็บโค้ดเว็บใน code repository', correct: true, why: 'ตรงกับแผนของ Sofía ในสไลด์: ใช้ code repository เก็บโค้ดและทำ version control' },
        { text: 'สร้าง pipeline ด้วย CodePipeline เพื่ออัปเดตเว็บอัตโนมัติ', correct: true, why: 'Mateo แนะนำ CodePipeline เพื่อ automate การอัปเดตเว็บ' },
        { text: 'ให้นักพัฒนาอัปโหลดไฟล์ขึ้น S3 ด้วยมือทุกครั้งที่แก้', correct: false, why: 'เป็นกระบวนการ manual ซึ่งเสี่ยงผิดพลาดจากคน' },
        { text: 'ลบ stack CloudFormation ทิ้งแล้วสร้างใหม่ทุกครั้ง', correct: false, why: 'ไม่ใช่วิธีอัปเดตเว็บ และลบ stack จะลบ resource ทั้งหมด' }
      ]
    },
    {
      id: 'q-m13-sam', type: 'scenario', format: 'written', source: 'L363-395, L678-686, L706',
      prompt: 'ทีมต้องสร้างสองอย่าง อย่างแรกคือ network ของแอป (VPC, subnet, ELB, EC2, RDS) ซ้ำกันใน dev, test และ prod อย่างที่สองคือแอป serverless เล็ก ๆ (Lambda + API Gateway + DynamoDB) ที่อยากทดสอบบนเครื่องก่อน จงอธิบายว่าแต่ละอย่างควรใช้เครื่องมืออะไร และสองเครื่องมือนี้เกี่ยวข้องกันอย่างไร',
      keywords: ['VPC, subnet, ELB, EC2, RDS', 'ทดสอบบนเครื่อง'],
      rubric: [
        'ใช้ CloudFormation (template JSON/YAML สร้างเป็น stack) สำหรับ infrastructure ทั่วไป ใช้ซ้ำได้ทุก environment',
        'ใช้ AWS SAM สำหรับแอป serverless และอธิบายว่ามี invocation แบบ local',
        'บอกว่า SAM เป็นส่วนขยายของ CloudFormation และ deploy ผ่าน CloudFormation',
        'กล่าวถึง Transform AWS::Serverless-2016-10-31 หรือ resource Serverless::Function/SimpleTable'
      ],
      modelAnswer: 'ส่วนแรกใช้ CloudFormation เขียน template (JSON หรือ YAML) ระบุ VPC, subnet, ELB, EC2, RDS แล้วสร้างเป็น stack เมื่อต้องการ dev/test/prod ที่เหมือนกันก็ใช้ template เดิมสร้าง stack ใหม่ และถ้าต้องการลบทั้งชุดก็ลบ stack\n\nส่วนที่สองใช้ AWS SAM ซึ่งเป็น framework โอเพนซอร์สสำหรับแอป serverless เขียน template สั้น ๆ โดยใส่ Transform: AWS::Serverless-2016-10-31 และ resource เช่น AWS::Serverless::Function (Lambda พร้อม API event) กับ AWS::Serverless::SimpleTable (DynamoDB) สามารถจำลองการเรียกฟังก์ชันบนเครื่องได้ จากนั้น deploy ผ่าน CloudFormation เพราะ SAM เป็นส่วนขยายของ CloudFormation จึงได้การ deploy ที่เชื่อถือได้แบบเดียวกัน'
    },
    {
      id: 'q-m13-written', type: 'scenario', format: 'written', source: 'L67, L297-321, L764-766',
      prompt: 'ร้านคาเฟ่ปล่อยเว็บด้วยการอัปโหลดไฟล์เองทุกครั้ง บางครั้งอัปผิดไฟล์จนเว็บพัง จงเสนอวิธีปรับปรุงด้วย CI/CD และอธิบายว่า service แต่ละตัวทำอะไร รวมทั้งถ้าอยากให้มีผู้อนุมัติก่อนขึ้นเว็บจริงควรเรียกแนวทางนี้ว่าอะไร',
      keywords: ['อัปโหลดไฟล์เอง', 'อนุมัติ'],
      rubric: [
        'เสนอเก็บโค้ดใน code repository และใช้ CodePipeline เป็นตัวประสาน',
        'ระบุ CodeBuild ทำขั้น build และ CodeDeploy ทำขั้น deploy',
        'อธิบายว่าลดข้อผิดพลาดจากคนเพราะกระบวนการอัตโนมัติ',
        'ระบุว่าการมีผู้อนุมัติคือ continuous delivery (ถ้าไม่มีคนคั่นคือ continuous deployment)'
      ],
      modelAnswer: 'เก็บโค้ดเว็บใน code repository (มี version control) แล้วสร้าง pipeline ด้วย CodePipeline ให้ทำงานเมื่อมี commit ใหม่ ขั้น Build ใช้ CodeBuild ขั้น Test ใช้เครื่องมือที่ทีมเลือก และขั้น Deploy ใช้ CodeDeploy (ในแล็บคือการ deploy ไปยัง S3 bucket ที่โฮสต์เว็บ) ทุกขั้นเป็นอัตโนมัติจึงไม่มีการอัปผิดไฟล์ด้วยมือ\n\nถ้าต้องการให้ผู้จัดการอนุมัติก่อนขึ้นเว็บจริง จะเป็น continuous delivery เพราะมี manual intervention ก่อน deploy แต่ถ้าปล่อยเองทั้งหมดโดยไม่มีคนคั่นจะเป็น continuous deployment'
    },
    {
      id: 'q-m13-design', type: 'design', format: 'written', source: 'L297-321, L764-766, L808',
      prompt: 'ออกแบบ flow การปล่อยเว็บคาเฟ่อัตโนมัติ: นักพัฒนา commit โค้ดเข้า code repository แล้วต้องมี pipeline ที่ build โค้ด ทดสอบ และ deploy ไปยังเว็บ จงวาดแผนภาพพร้อมใส่ลำดับบนลูกศร และเขียนอธิบายว่าแต่ละ service ทำหน้าที่อะไร',
      keywords: ['commit', 'pipeline', 'deploy'],
      flow: {
        nodes: [
          { id: 'dev', label: 'Developer' },
          { id: 'repo', label: 'Code repository' },
          { id: 'pipe', label: 'CodePipeline' },
          { id: 'build', label: 'CodeBuild' },
          { id: 'deploy', label: 'CodeDeploy' },
          { id: 'site', label: 'S3 (website)' }
        ],
        edges: [
          { from: 'dev', to: 'repo', label: '1 push' },
          { from: 'repo', to: 'pipe', label: '2 trigger' },
          { from: 'pipe', to: 'build', label: '3' },
          { from: 'build', to: 'deploy', label: '4' },
          { from: 'deploy', to: 'site', label: '5' }
        ],
        distractors: ['CloudFormation stack', 'Lambda', 'SQS', 'RDS']
      },
      rubric: [
        'มีลำดับ Developer → code repository → CodePipeline',
        'CodePipeline เรียกขั้น build (CodeBuild) แล้วต่อด้วยขั้น deploy (CodeDeploy)',
        'ปลายทางคือเว็บไซต์ (S3 bucket ที่โฮสต์เว็บ ตามแล็บ)',
        'อธิบายหน้าที่แต่ละ service ได้ถูกต้อง',
        'ไม่เอา service ที่ไม่เกี่ยว (เช่น RDS, SQS) มาใส่'
      ],
      modelAnswer: '1) นักพัฒนา push โค้ดเข้า code repository\n2) การ push กระตุ้น CodePipeline ซึ่งประสานทั้ง workflow\n3) CodePipeline ส่งโค้ดให้ CodeBuild ทำขั้น build (และทดสอบด้วยเครื่องมือที่ทีมเลือก)\n4) ผลลัพธ์ส่งต่อให้ CodeDeploy ทำขั้น deploy\n5) เว็บไซต์ (S3 bucket ที่โฮสต์เว็บในแล็บ) ถูกอัปเดตอัตโนมัติ\nถ้าต้องการให้คนอนุมัติก่อน deploy ให้เพิ่มจุด manual intervention (continuous delivery)'
    }
  ]
});
