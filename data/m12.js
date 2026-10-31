/* M12 Authentication & authorization (TLS/ACM, STS, CloudTrail, Cognito)
   source = เลขบรรทัดในไฟล์สไลด์ต้นฉบับ (notes/(12 f) ...M12-Cognito.md) */
GUIDE.register({
  module: 'M12',
  title: 'Authentication & authorization (Cognito)',
  summary: 'TLS/ACM, temporary credentials ด้วย STS, ติดตาม federated user ด้วย CloudTrail, Cognito user pool vs identity pool, token 3 ชนิด และ flow กับ API Gateway',

  notes: [
    {
      heading: 'ความปลอดภัยของแอปมี 2 ด้าน',
      body: '<ul><li><strong>เส้นทางเครือข่าย</strong>: เข้ารหัสการสื่อสารระหว่าง client กับ server ด้วย TLS/SSL โดยใช้ certificate ยืนยันตัวตนเว็บไซต์ และ <strong>ACM</strong> ช่วยออก/ติดตั้ง/ต่ออายุ certificate ให้ (ใช้ cert ของตัวเองได้ผ่าน ACM Private CA)</li>' +
        '<li><strong>การควบคุมสิทธิ์</strong>: ให้ผู้ใช้/แอปเข้าถึง resource ด้วย credential ชั่วคราว ไม่ฝัง access key ในโค้ด</li></ul>' +
        '<p>TLS handshake ในสไลด์มี 7 ขั้น สรุปคือ CA ออก cert ให้ server, client ตรวจว่า CA น่าเชื่อถือ แล้วส่ง session key ที่เข้ารหัส หลังจากนั้นข้อมูลทั้งหมดเข้ารหัสด้วย session key</p>',
      refs: ['q-m12-employee-login']
    },
    {
      heading: 'Authentication vs Authorization และคำศัพท์',
      body: '<ul><li><strong>Authentication</strong> = พิสูจน์ว่าคุณคือใคร, <strong>Authorization</strong> = ตรวจว่าทำอะไรได้บ้าง</li>' +
        '<li><strong>IdP</strong> = ที่เก็บ/ยืนยันตัวตน, <strong>identity broker</strong> = ตัวกลางที่ยืนยันกับ IdP แล้วไปขอ credential ชั่วคราวจาก STS</li>' +
        '<li>SAML = มาตรฐานแลกเปลี่ยนข้อมูล authn/authz, OIDC = ให้ IdP ภายนอก (Google ฯลฯ) ยืนยันผู้ใช้แทนเว็บอื่น, JWT = รูปแบบส่งข้อมูลระหว่างสองฝ่ายอย่างปลอดภัย</li></ul>',
      refs: ['q-m12-written-flow']
    },
    {
      heading: 'Temporary credentials และ AWS STS',
      body: '<p>แนวปฏิบัติที่ดี: ใช้ <strong>IAM role</strong> ดึง credential ชั่วคราวก่อน ถ้าทำไม่ได้ค่อยใช้ <strong>STS</strong> ส่วนการฝัง key ในโค้ดหรือแชร์ key ในทีมคือแนวปฏิบัติที่ห้ามทำ</p>' +
        '<p>credential จาก STS ประกอบด้วย access key ID, secret access key และ session token อายุสั้น กำหนดอายุได้ และใช้ซ้ำไม่ได้หลังหมดอายุ</p>' +
        '<ul><li><strong>AssumeRole</strong>: IAM user ที่มีอยู่ / cross-account (default 1 ชม.)</li><li><strong>GetFederationToken</strong>: federated user อายุ default นานกว่า คือ 12 ชม.</li><li><strong>GetSessionToken</strong>: IAM user ที่ต้องการความปลอดภัยเพิ่ม เช่น บังคับ MFA</li></ul>',
      refs: ['l-m12-assumerole', 'l-m12-getfedtoken', 'g-m12-sts', 'g-m12-cred']
    },
    {
      heading: 'CloudTrail ไล่รอยผู้ใช้ federated',
      body: '<p>CloudTrail บันทึก action ของผู้ใช้ที่ authenticate แล้วลง S3 และตั้งให้ตอบสนอง/แจ้งเตือนได้ วิธีไล่ว่าใครสั่ง terminate instance: ค้น <code>TerminateInstances</code> → ดู ARN ของ role ที่ผู้ใช้ assume → ค้น event <code>AssumeRoleWithSAML</code> ที่มี ARN นั้น → อ่านตัวตนผู้ใช้จาก attribute <code>userName</code> (รวม 4 ขั้น)</p>',
      refs: ['q-m12-cloudtrail']
    },
    {
      heading: 'Cognito: user pool vs identity pool',
      body: '<ul><li><strong>User pool</strong> = ไดเรกทอรีผู้ใช้ มี sign-up/sign-in, หน้า login สำเร็จรูปปรับแต่งได้, ควบคุมการเข้าถึง API, ตรวจ credential ที่รั่ว, ยืนยันเบอร์/อีเมล, adaptive authentication และออก token</li>' +
        '<li><strong>Identity pool</strong> (federated identities) = รับ identity จาก Amazon/Google/Facebook/SAML/OIDC แล้วแลกเป็น <strong>credential ชั่วคราวของ AWS</strong> ผ่าน STS role</li></ul>' +
        '<p>จำง่าย ๆ: ต้องการ "ล็อกอิน" = user pool, ต้องการ "สิทธิ์ AWS ตรง ๆ" = identity pool สองตัวใช้ร่วมกันได้</p>',
      refs: ['g-m12-pools', 'q-m12-employee-login', 'q-m12-identity-pool']
    },
    {
      heading: 'Token 3 ชนิด และ flow กับ API Gateway',
      body: '<ul><li><strong>ID token</strong>: claim เกี่ยวกับตัวผู้ใช้ (ชื่อ, อีเมล)</li><li><strong>Access token</strong>: อนุญาตการเรียก API ตาม custom scope ของ resource ที่ป้องกันไว้</li><li><strong>Refresh token</strong>: ใช้ขอ ID/access token ใหม่</li></ul>' +
        '<p>flow ตัวอย่าง (6 ขั้น): แอปมือถือ login กับ user pool → ได้ JWT → เรียก API Gateway → API Gateway ตรวจ ID token → เรียก Lambda → Lambda เข้าถึง DynamoDB ส่วน flow identity pool (8 ขั้น) เพิ่มการขอ credential ชั่วคราวแล้ว sign request ให้ IAM policy ตรวจ</p>' +
        '<p>ข้อสอบตัวอย่าง: sign-up/sign-in = Cognito (ไม่ใช่ IAM) และ log sign-in event = Lambda ที่ถูกเรียกหลัง post-authentication</p>',
      refs: ['g-m12-token', 'q-m12-sample-exam', 'q-m12-design-api', 'q-m12-design-identity']
    }
  ],

  limits: [
    {
      id: 'l-m12-assumerole', service: 'STS', name: 'อายุ default ของ AssumeRole', display: '1 ชั่วโมง (สไลด์ระบุโดยเทียบกับ GetFederationToken)',
      accept: ['1 ชั่วโมง', '1 hour', '1 hr', '1 h', '1', '60 นาที', '60 min'], source: 'L433'
    },
    {
      id: 'l-m12-getfedtoken', service: 'STS', name: 'อายุ default ของ GetFederationToken', display: '12 ชั่วโมง (นานกว่า AssumeRole ที่ 1 ชั่วโมง)',
      accept: ['12 ชั่วโมง', '12 hours', '12 hr', '12 h', '12'], source: 'L433'
    }
  ],

  optionGroups: [
    {
      id: 'g-m12-pools', service: 'Cognito', title: 'User pool vs Identity pool',
      options: [
        { name: 'Cognito user pool', traits: 'ไดเรกทอรีผู้ใช้ มี sign-up/sign-in, หน้า login ในตัว, ควบคุมการเข้าถึง API, ตรวจ credential รั่ว, ยืนยันเบอร์/อีเมล, adaptive authentication, ออก token', when: 'ต้องการระบบสมัคร/ล็อกอินให้เว็บหรือมือถือ', tradeoff: 'ตัวมันเองให้ token ไม่ใช่ credential ของ AWS' },
        { name: 'Cognito identity pool', traits: 'รับ identity จาก Login with Amazon/Google/Facebook/SAML/OIDC แล้วให้ credential ชั่วคราวผ่าน STS role สร้าง unique identity ได้', when: 'ผู้ใช้ต้องเข้าถึง AWS service (S3, DynamoDB) ด้วยสิทธิ์ชั่วคราว', tradeoff: 'ไม่ใช่ที่เก็บผู้ใช้ ต้องมี IdP หรือ user pool ยืนยันตัวตนก่อน' }
      ],
      challenges: [
        { id: 'c-m12-pool-signin', requirement: 'ต้องการระบบสมัครสมาชิกและล็อกอินพร้อมหน้า login สำเร็จรูปให้เว็บไซต์', answer: 'Cognito user pool', why: 'user pool เป็นไดเรกทอรีผู้ใช้ที่ให้ sign-up/sign-in และ login UI ในตัว', source: 'L551-553, L575-577' },
        { id: 'c-m12-pool-creds', requirement: 'ผู้ใช้ที่ล็อกอินด้วย Google ต้องได้ credential ชั่วคราวเพื่อเรียก AWS service โดยตรง', answer: 'Cognito identity pool', why: 'identity pool รับ identity จาก IdP ภายนอกแล้วให้ credential ชั่วคราวผ่าน STS role', source: 'L555-557, L676' },
        { id: 'c-m12-pool-adaptive', requirement: 'ต้องการตรวจ credential ที่รั่วไหลและใช้ adaptive authentication ตอนผู้ใช้ล็อกอิน', answer: 'Cognito user pool', why: 'compromised credentials check และ adaptive authentication เป็นฟีเจอร์ความปลอดภัยของ user pool', source: 'L581-585' }
      ]
    },
    {
      id: 'g-m12-token', service: 'Cognito', title: 'Token ของ user pool',
      options: [
        { name: 'ID token', traits: 'มี claim เกี่ยวกับตัวตนผู้ใช้ เช่น ชื่อ อีเมล', when: 'ต้องรู้ว่าผู้ใช้คือใคร / API Gateway ตรวจใน flow ตัวอย่าง', tradeoff: 'ไม่ใช่ตัวขอ token ใหม่' },
        { name: 'Access token', traits: 'อนุญาตการเรียก API ตาม custom scope ของ resource ที่ป้องกัน', when: 'ควบคุมว่าเรียก API ส่วนไหนได้', tradeoff: 'ไม่ได้บรรจุข้อมูลตัวตนเป็นหลัก' },
        { name: 'Refresh token', traits: 'มีข้อมูลที่จำเป็นต่อการขอ ID หรือ access token ใหม่', when: 'token เดิมหมดอายุแล้วอยากได้ใหม่โดยไม่ให้ผู้ใช้ล็อกอินซ้ำ', tradeoff: 'ไม่ใช้เรียก API โดยตรง' }
      ],
      challenges: [
        { id: 'c-m12-tok-id', requirement: 'ต้องการ token ที่มี claim ชื่อและอีเมลของผู้ใช้', answer: 'ID token', why: 'ID token มี claim เกี่ยวกับ identity ของผู้ใช้ เช่น name, email', source: 'L621-623' },
        { id: 'c-m12-tok-access', requirement: 'ต้องการ token เพื่ออนุญาตการเรียก API ตาม custom scope ของ resource ที่ป้องกัน', answer: 'Access token', why: 'access token authorize การเรียก API ตาม custom scope ของ access-protected resource', source: 'L625-627' },
        { id: 'c-m12-tok-refresh', requirement: 'ID token หมดอายุ ต้องการขอ token ใหม่โดยไม่ให้ผู้ใช้ล็อกอินซ้ำ', answer: 'Refresh token', why: 'refresh token บรรจุข้อมูลที่ใช้ขอ ID หรือ access token ใหม่', source: 'L629-631' }
      ]
    },
    {
      id: 'g-m12-sts', service: 'STS', title: 'เลือก STS operation',
      options: [
        { name: 'AssumeRole', traits: 'ให้ credential ชั่วคราวแก่ IAM user ที่มีอยู่ เช่น cross-account (default 1 ชม.)', when: 'เข้าถึง resource ข้าม account', tradeoff: 'อายุ default สั้นกว่า GetFederationToken' },
        { name: 'AssumeRoleWithSAML', traits: 'สำหรับ federated user ที่ยืนยันกับระบบ identity ขององค์กร (event นี้ปรากฏใน CloudTrail ตอนไล่รอย SAML user)', when: 'SSO ขององค์กรแบบ SAML', tradeoff: 'ต้องมี SAML IdP' },
        { name: 'AssumeRoleWithWebIdentity', traits: 'สำหรับ federated user ที่ยืนยันผ่าน public IdP', when: 'ล็อกอินด้วยบัญชีโซเชียลสาธารณะ', tradeoff: 'พึ่ง public IdP' },
        { name: 'GetFederationToken', traits: 'สำหรับ federated user อายุ default 12 ชม. แทนที่จะเป็น 1 ชม.', when: 'ต้องการ session ยาวกว่า AssumeRole', tradeoff: 'session นานกว่าโดย default' },
        { name: 'GetSessionToken', traits: 'สำหรับ IAM user ที่ต้องการความปลอดภัยเพิ่ม เช่น อนุญาต request เมื่อเปิด MFA เท่านั้น', when: 'บังคับ MFA', tradeoff: 'ผู้ใช้ต้องมี MFA' }
      ],
      challenges: [
        { id: 'c-m12-sts-xacct', requirement: 'IAM user ต้องเข้าถึง resource ใน AWS account อื่น (cross-account)', answer: 'AssumeRole', why: 'AssumeRole ให้ credential ชั่วคราวแก่ IAM user ที่มีอยู่สำหรับ cross-account access', source: 'L431' },
        { id: 'c-m12-sts-12h', requirement: 'ผู้ใช้ federated ต้องการ session ที่ default นาน 12 ชั่วโมง ไม่ใช่ 1 ชั่วโมง', answer: 'GetFederationToken', why: 'สไลด์ระบุว่า GetFederationToken ต่างจาก AssumeRole ที่อายุ default นานกว่ามาก (12 ชม. แทน 1 ชม.)', source: 'L433' },
        { id: 'c-m12-sts-mfa', requirement: 'ต้องการให้ AWS request ทำได้เฉพาะเมื่อ IAM user เปิด MFA แล้ว', answer: 'GetSessionToken', why: 'GetSessionToken ใช้กับ IAM user เพื่อความปลอดภัยเพิ่ม เช่น อนุญาตเฉพาะเมื่อมี MFA', source: 'L433' }
      ]
    },
    {
      id: 'g-m12-cred', service: 'IAM/STS', title: 'วิธีได้ credential เข้าถึง AWS',
      options: [
        { name: 'IAM role', traits: 'ดึง credential ชั่วคราวโดยไม่ต้องฝัง key (best practice)', when: 'ตัวเลือกแรกสำหรับแอป', tradeoff: 'ต้องตั้ง role ให้ถูก' },
        { name: 'AWS STS', traits: 'ขอ credential ชั่วคราว (key ID, secret, session token) อายุสั้นกำหนดได้', when: 'ใช้ IAM role ไม่ได้', tradeoff: 'ต้องจัดการการขอ/หมดอายุ' },
        { name: 'ฝัง access key ในโค้ด', traits: 'ฝัง key ในโค้ดที่ไม่เข้ารหัส หรือแชร์ key ในทีม', when: 'ไม่ควรเลือก', tradeoff: 'ความเสี่ยงด้านความปลอดภัยสูง' }
      ],
      challenges: [
        { id: 'c-m12-cred-first', requirement: 'แอปต้องเรียก AWS service และต้องการแนวปฏิบัติที่ดีที่สุดในการได้ credential', answer: 'IAM role', why: 'สไลด์ระบุให้ใช้ IAM role ดึง credential ชั่วคราวเป็น best practice', source: 'L304' },
        { id: 'c-m12-cred-fallback', requirement: 'ใช้ IAM role ไม่ได้ แต่ยังต้องการ credential ชั่วคราวอายุสั้น', answer: 'AWS STS', why: 'ถ้า IAM role ไม่ใช่ตัวเลือก ให้ใช้ STS ดึง credential', source: 'L306' }
      ]
    }
  ],

  questions: [
    {
      id: 'q-m12-sample-exam', type: 'scenario', format: 'choice', source: 'L880-946',
      prompt: 'นักพัฒนาเพิ่ม sign-up และ sign-in ให้แอป และแอปต้องเรียก API ไปยังระบบ custom analytics เพื่อบันทึก sign-in event ควรทำอย่างไร (เลือก 2 ข้อ)',
      keywords: ['sign-up และ sign-in', 'custom analytics', 'sign-in event'],
      choices: [
        { text: 'ใช้ Amazon Cognito เป็นระบบ sign-up และ sign-in', correct: true, why: 'Cognito (user pool) ให้ sign-up/sign-in สำหรับเว็บและมือถือ' },
        { text: 'ใช้ Lambda function เรียก API จาก post-authentication event', correct: true, why: 'โค้ดที่รันหลัง authentication สำเร็จใช้ Lambda ผูกกับ post-authentication event ตามเฉลยในสไลด์' },
        { text: 'ใช้ IAM เป็นระบบ sign-up และ sign-in ของแอป', correct: false, why: 'IAM ไม่ใช่ระบบผู้ใช้ของแอป เฉลยคือ Cognito' },
        { text: 'เก็บ database credential ใน Secrets Manager และตั้ง rotation อัตโนมัติ', correct: false, why: 'Secrets Manager เรื่อง rotate credential ไม่เกี่ยวกับ sign-in หรือ log event' }
      ]
    },
    {
      id: 'q-m12-employee-login', type: 'scenario', format: 'choice', source: 'L67, L534-538, L551-553',
      prompt: 'Sofía ต้องการแก้เว็บคาเฟ่ให้พนักงานมี login เพื่อเข้าถึงฟีเจอร์ที่ผู้ใช้ภายนอกไม่มี โดยไม่อยากสร้างระบบเก็บผู้ใช้และหน้า login เอง ควรเลือกอะไร',
      keywords: ['login', 'ไม่อยากสร้างระบบเก็บผู้ใช้'],
      choices: [
        { text: 'Amazon Cognito user pool', correct: true, why: 'เป็นไดเรกทอรีผู้ใช้ มี sign-in และหน้า login ในตัว' },
        { text: 'ฝัง access key ของพนักงานไว้ใน JavaScript ของเว็บ', correct: false, why: 'ฝัง key ในโค้ดเป็น bad practice' },
        { text: 'AWS Certificate Manager', correct: false, why: 'ACM จัดการ TLS certificate ไม่ใช่การยืนยันผู้ใช้' },
        { text: 'ใช้ GetSessionToken ให้ทุกคน', correct: false, why: 'GetSessionToken ใช้กับ IAM user ที่ต้องการ MFA ไม่ใช่ระบบ login ของแอป' }
      ]
    },
    {
      id: 'q-m12-identity-pool', type: 'scenario', format: 'choice', source: 'L555-559, L676, L690',
      prompt: 'แอปมือถือให้ผู้ใช้ล็อกอินด้วยบัญชี Google และต้องให้ผู้ใช้อ่านข้อมูลจาก DynamoDB โดยตรงด้วยสิทธิ์ชั่วคราว ไม่ต้องฝัง key ควรใช้ส่วนประกอบใดของ Cognito เพื่อให้ได้ credential ของ AWS',
      keywords: ['บัญชี Google', 'สิทธิ์ชั่วคราว'],
      choices: [
        { text: 'Cognito identity pool แลก identity เป็น credential ชั่วคราวผ่าน STS role', correct: true, why: 'identity pool รับ identity จาก Google/SAML/OIDC และให้ credential ชั่วคราว' },
        { text: 'Cognito user pool อย่างเดียว เพราะให้ credential AWS ในตัว', correct: false, why: 'user pool ให้ token ไม่ใช่ credential ของ AWS' },
        { text: 'แชร์ access key เดียวให้ผู้ใช้ทุกคน', correct: false, why: 'การแชร์ key คือ bad practice' },
        { text: 'ใช้ ACM ออก certificate ให้ผู้ใช้', correct: false, why: 'ACM ไม่เกี่ยวกับการให้สิทธิ์เข้าถึง DynamoDB' }
      ]
    },
    {
      id: 'q-m12-sts-choice', type: 'scenario', format: 'choice', source: 'L431-433',
      prompt: 'ทีมความปลอดภัยต้องการให้ IAM user ส่ง AWS request ได้เฉพาะเมื่อยืนยันด้วย MFA แล้ว ควรให้ผู้ใช้ขอ credential ชั่วคราวด้วย STS operation ใด',
      keywords: ['IAM user', 'MFA'],
      choices: [
        { text: 'GetSessionToken', correct: true, why: 'ใช้กับ IAM user เพื่อความปลอดภัยเพิ่ม เช่น อนุญาตเมื่อเปิด MFA' },
        { text: 'GetFederationToken', correct: false, why: 'เป็นของ federated user และต่างที่อายุ default 12 ชม.' },
        { text: 'AssumeRoleWithWebIdentity', correct: false, why: 'ใช้กับผู้ใช้ที่ยืนยันผ่าน public IdP ไม่ใช่ IAM user ที่บังคับ MFA' },
        { text: 'ฝัง access key ถาวรในแอป', correct: false, why: 'ขัดกับหลัก temporary credentials' }
      ]
    },
    {
      id: 'q-m12-cloudtrail', type: 'scenario', format: 'written', source: 'L446-450, L471-488',
      prompt: 'มี EC2 instance ถูก terminate โดยผู้ใช้ที่ล็อกอินผ่าน SAML federation องค์กรต้องการรู้ว่าใครทำ อธิบายขั้นตอนใช้ CloudTrail สืบหาตัวผู้ใช้',
      keywords: ['terminate', 'SAML', 'CloudTrail'],
      rubric: [
        'ค้น event ที่ eventName เป็น TerminateInstances',
        'หา ARN ของ IAM role ที่ federated user assume',
        'ค้น event AssumeRoleWithSAML ที่ตรงกับ ARN ของ role นั้น',
        'อ่านตัวตนผู้ใช้จาก attribute userName'
      ],
      modelAnswer: 'CloudTrail บันทึก action ของผู้ใช้ที่ authenticate แล้วเก็บ log ใน S3 ขั้นตอน: 1) ค้น log ที่ eventName = TerminateInstances 2) ดูว่า action นั้นทำภายใต้ IAM role ตัวไหน แล้วจด ARN ของ role 3) ค้น event AssumeRoleWithSAML ที่ใช้ ARN ของ role นั้น 4) อ่านตัวตนของผู้ใช้ SAML ที่ attribute userName ได้ผู้ที่ terminate instance'
    },
    {
      id: 'q-m12-written-flow', type: 'scenario', format: 'written', source: 'L600-605, L621-631, L660',
      prompt: 'อธิบายว่าแอปมือถือที่ใช้ Cognito user pool ปกป้อง API ที่ API Gateway ได้อย่างไร และ token แต่ละชนิดทำหน้าที่อะไร',
      keywords: ['user pool', 'API Gateway', 'token'],
      rubric: [
        'ผู้ใช้ authenticate กับ user pool (หรือ IdP ภายนอก) แล้วได้ token (JWT)',
        'แอปส่ง token ไปกับการเรียก API Gateway และ API Gateway ตรวจ ID token',
        'ถ้าผ่านจึง invoke Lambda แล้ว Lambda เข้าถึง AWS resource เช่น DynamoDB',
        'อธิบาย ID token (ตัวตน), access token (สิทธิ์เรียก API ตาม scope), refresh token (ขอ token ใหม่)'
      ],
      modelAnswer: 'ผู้ใช้ sign in กับ Cognito user pool ได้ JWT กลับมา แอปแนบ token เรียก resource ที่ API Gateway ซึ่งตรวจ ID token ก่อน ถ้าผ่านจึงเรียก Lambda และ Lambda เข้าถึง DynamoDB หรือ resource อื่น (6 ขั้นตามสไลด์) ID token บอกตัวตน (ชื่อ อีเมล) access token อนุญาตการเรียก API ตาม custom scope ส่วน refresh token ใช้ขอ ID/access token ใหม่ ผู้ที่ไม่มี token ที่ถูกต้องจึงเรียก API ไม่ได้'
    },
    {
      id: 'q-m12-design-api', type: 'design', format: 'written', source: 'L67, L600-605, L660',
      prompt: 'ออกแบบ flow ให้พนักงานคาเฟ่ล็อกอินผ่านแอปมือถือ แล้วเรียก API ที่ตรวจสิทธิ์ก่อนไปดึงข้อมูลสินค้าจาก DynamoDB ผ่าน Lambda จงวาดแผนภาพพร้อมลำดับบนลูกศร และอธิบายแต่ละขั้น',
      keywords: ['ล็อกอิน', 'DynamoDB', 'Lambda'],
      flow: {
        nodes: [
          { id: 'app', label: 'Mobile app' },
          { id: 'up', label: 'Cognito user pool' },
          { id: 'apigw', label: 'API Gateway' },
          { id: 'lambda', label: 'Lambda' },
          { id: 'ddb', label: 'DynamoDB' }
        ],
        edges: [
          { from: 'app', to: 'up', label: '1 authenticate' },
          { from: 'up', to: 'app', label: '2 JWTs' },
          { from: 'app', to: 'apigw', label: '3 call API' },
          { from: 'apigw', to: 'up', label: '4 validate' },
          { from: 'apigw', to: 'lambda', label: '5 invoke' },
          { from: 'lambda', to: 'ddb', label: '6 access' }
        ],
        distractors: ['ACM Private CA', 'Secrets Manager', 'CloudTrail']
      },
      rubric: [
        'พนักงาน authenticate กับ Cognito user pool และได้ JWT',
        'แอปเรียก API Gateway พร้อม token และ API Gateway ตรวจ token',
        'API Gateway invoke Lambda เมื่อ token ผ่าน',
        'Lambda เข้าถึง DynamoDB',
        'ไม่ฝัง access key ในแอป'
      ],
      modelAnswer: '1) พนักงาน sign in กับ Cognito user pool 2) ได้ JWT กลับมา 3) แอปเรียก API Gateway resource 4) API Gateway ตรวจ ID token กับ user pool 5) เมื่อผ่านจึง invoke Lambda 6) Lambda เข้าถึง DynamoDB อ่านข้อมูลสินค้ากลับไป ไม่ต้องฝัง key ในแอป และ user pool ยังคุมได้ว่าใครเข้าถึง API'
    },
    {
      id: 'q-m12-design-identity', type: 'design', format: 'written', source: 'L676-690',
      prompt: 'ออกแบบ flow ให้แอปมือถือเข้าถึงข้อมูลใน DynamoDB โดยตรงด้วย credential ชั่วคราวหลังผู้ใช้ล็อกอินกับ user pool จงวาดแผนภาพพร้อมลำดับและอธิบาย',
      keywords: ['credential ชั่วคราว', 'DynamoDB'],
      flow: {
        nodes: [
          { id: 'app', label: 'Mobile app' },
          { id: 'up', label: 'Cognito user pool' },
          { id: 'ip', label: 'Cognito identity pool' },
          { id: 'sts', label: 'AWS STS role' },
          { id: 'iam', label: 'IAM policy' },
          { id: 'ddb', label: 'DynamoDB' }
        ],
        edges: [
          { from: 'app', to: 'up', label: '1 authenticate' },
          { from: 'up', to: 'app', label: '2 JWTs' },
          { from: 'app', to: 'ip', label: '3 request credentials' },
          { from: 'ip', to: 'sts', label: '4' },
          { from: 'sts', to: 'app', label: '5 temp credentials' },
          { from: 'app', to: 'iam', label: '6-7 sign + check' },
          { from: 'iam', to: 'ddb', label: '8 data' }
        ],
        distractors: ['ACM', 'SQS', 'CloudFront']
      },
      rubric: [
        'authenticate กับ user pool แล้วได้ JWT',
        'ส่ง token ไปขอ AWS credential จาก identity pool',
        'identity pool ให้ credential ชั่วคราวผ่าน STS role',
        'แอป sign request และ IAM policy ถูกตรวจก่อนเข้าถึง DynamoDB'
      ],
      modelAnswer: '1) ผู้ใช้ authenticate กับ user pool 2) ได้ JWT 3) แอปขอ AWS credential จาก identity pool 4-5) identity pool ให้ credential ชั่วคราวผ่าน STS role 6) แอป sign payload 7) IAM policy ถูกตรวจ 8) DynamoDB คืนข้อมูลที่ขอ สิทธิ์จึงเป็นชั่วคราวและจำกัดตาม role'
    }
  ]
});
