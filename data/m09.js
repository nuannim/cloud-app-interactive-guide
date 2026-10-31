/* M09 Caching — source = เลขบรรทัดในไฟล์สไลด์ (notes/(9 f) ...M09-Cachings.md) */
GUIDE.register({
  module: 'M09',
  title: 'Caching',
  summary: 'ElastiCache (Memcached vs Redis), lazy loading vs write-through, CloudFront (cache key, TTL), Lambda@Edge vs CloudFront Functions, WAF',

  notes: [
    {
      heading: 'Caching คืออะไร และใช้ตรงไหนได้บ้าง',
      body: '<p>เก็บ <strong>สำเนา</strong> ของข้อมูลไว้ใกล้ผู้ขอ ถ้าเจอใน cache (hit) ตอบทันที ถ้าไม่เจอ (miss) ค่อยไปถามต้นทาง (origin) แล้วเก็บสำเนาไว้พร้อม <strong>TTL</strong> ผลคือ latency ต่ำลงและ origin รับงานน้อยลง</p>' +
        '<ul><li>cache ได้หลายชั้น: browser (Cache-Control header), API Gateway cache, ElastiCache (query ฐานข้อมูล / session), CloudFront (เนื้อหาเว็บ)</li>' +
        '<li>คุ้มเมื่อ: อ่านบ่อย, query ช้า/แพง, ข้อมูลค่อนข้างนิ่ง, ยอมให้ข้อมูลเก่าได้บ้าง และคุ้มกับความซับซ้อนที่เพิ่ม</li></ul>',
      refs: ['q-m09-elasticache-choice', 'q-m09-strategy']
    },
    {
      heading: 'ElastiCache: Memcached vs Redis',
      body: '<p>ElastiCache คือ in-memory key-value store แบบ managed ตอบในระดับ submillisecond คั่นระหว่างแอปกับฐานข้อมูล</p>' +
        '<ul><li><strong>Memcached</strong>: multithreading, ดูแลง่าย, scale แนวนอนง่ายด้วย Auto Discovery เหมาะเมื่อต้องการโมเดลที่ <em>ง่ายที่สุด</em></li>' +
        '<li><strong>Redis</strong>: data type ซับซ้อน, persistence, replication (HA), automatic failover, pub/sub</li>' +
        '<li>Redis shard (node group) มี node ได้ 1-6 ตัว (primary + replica) และ Redis cluster (replication group) คือกลุ่มของ shard ตั้งแต่ 1 ตัวขึ้นไป</li></ul>',
      refs: ['g-m09-engine', 'l-m09-shard-nodes', 'q-m09-elasticache-choice', 'q-m09-redis-written']
    },
    {
      heading: 'Lazy loading vs Write-through',
      body: '<ul><li><strong>Lazy loading</strong>: เติม cache เฉพาะตอน miss (อ่าน DB แล้วค่อยเขียนลง cache) ข้อดี: ไม่มีข้อมูลที่ไม่มีใครใช้ค้างใน cache, node ล่มไม่ร้ายแรง ข้อเสีย: miss ช้า และข้อมูลอาจเก่า (stale) เหมาะกับข้อมูลที่อ่านบ่อยแต่แก้นาน ๆ ที เช่น user profile</li>' +
        '<li><strong>Write-through</strong>: ทุกครั้งที่เขียน DB ให้อัปเดต cache ด้วย ข้อดี: cache ไม่เก่า ข้อเสีย: เขียนช้าลง, ข้อมูลหายเมื่อ node ล่ม, มีข้อมูลที่ไม่มีใครอ่านค้าง, cache churn เหมาะกับข้อมูลที่ต้อง real-time เช่น leaderboard, ข่าวยอดนิยม</li></ul>',
      refs: ['g-m09-strategy', 'q-m09-strategy', 'q-m09-leaderboard'],
      diagram: {
        title: 'Lazy loading: อ่านผ่าน cache',
        caption: 'ถ้า cache miss แอปอ่านจาก database แล้วเติมข้อมูลลง cache',
        source: 'L1020',
        flow: {
          nodes: [
            { id: 'app', label: 'Application รับ request' },
            { id: 'cache', label: 'ElastiCache' },
            { id: 'hit', label: 'คืนข้อมูลจาก cache' },
            { id: 'db', label: 'Database' },
            { id: 'update', label: 'Update cache' }
          ],
          edges: [
            { from: 'app', to: 'cache', label: '1' },
            { from: 'cache', to: 'hit', label: 'hit' },
            { from: 'cache', to: 'db', label: 'miss' },
            { from: 'db', to: 'update', label: '2' }
          ]
        }
      }
    },
    {
      heading: 'Write-through: เขียน DB แล้วอัปเดต cache',
      body: '<p>ลำดับของ write-through: แอปรับข้อมูลที่ต้องเขียน อัปเดต database ก่อน (ขั้น 1) แล้วอัปเดต cache ตาม (ขั้น 2) จึงไม่มีข้อมูลเก่าใน cache</p>',
      refs: ['g-m09-strategy'],
      diagram: {
        title: 'Write-through: ลำดับการเขียน',
        caption: 'ทุกครั้งที่เขียน database จะอัปเดต cache ต่อทันที',
        source: 'L1079',
        flow: {
          nodes: [
            { id: 'app', label: 'Application' },
            { id: 'db', label: 'Database' },
            { id: 'cache', label: 'ElastiCache' }
          ],
          edges: [
            { from: 'app', to: 'db', label: '1 update DB' },
            { from: 'db', to: 'cache', label: '2 update cache' }
          ]
        }
      }
    },
    {
      heading: 'CloudFront: distribution, cache key, TTL',
      body: '<p>CloudFront คือ CDN ที่ส่งเนื้อหาจาก edge location ใกล้ผู้ใช้ ลดปัญหาระยะทางและจำนวน hop ผู้ใช้ทั่วโลกจึงโหลดเร็วขึ้น</p>' +
        '<ul><li>ชนิด distribution: Web content (origin = HTTP server หรือ S3), Video on demand, Live event (origin = MediaStore/MediaPackage)</li>' +
        '<li><strong>Cache key</strong> ค่าเริ่มต้น = domain ของ distribution + URL path เท่านั้น query string/cookie/header ที่ต่างกันยังได้ cache entry เดิม ถ้าอยากแยก ต้องเพิ่มเข้า cache key ใน cache policy</li>' +
        '<li>TTL: Minimum / Maximum / Default TTL ใน cache policy ทำงานร่วมกับ header Cache-Control และ Expires จาก origin ค่าเริ่มต้นเก็บนาน 24 ชั่วโมง ถ้าหมดอายุ CloudFront ถาม origin ถ้าไฟล์ไม่เปลี่ยนจะได้ 304 Not Modified</li></ul>',
      refs: ['g-m09-distribution', 'l-m09-default-ttl', 'q-m09-cachekey', 'q-m09-design'],
      diagram: {
        title: 'CloudFront: cache หมดอายุ',
        caption: 'ถ้ายังไม่หมดเวลา cache ส่งจาก cache ถ้าหมดจะถาม origin ว่าเวอร์ชันล่าสุดเปลี่ยนไหม',
        source: 'L750-754',
        flow: {
          nodes: [
            { id: 'viewer', label: 'Viewer request' },
            { id: 'edge', label: 'CloudFront edge location' },
            { id: 'cached', label: 'คืนไฟล์จาก cache' },
            { id: 'origin', label: 'Origin' },
            { id: 'nm', label: '304 Not Modified' },
            { id: 'latest', label: 'คืนเวอร์ชันล่าสุด' }
          ],
          edges: [
            { from: 'viewer', to: 'edge' },
            { from: 'edge', to: 'cached', label: 'ยังไม่หมดอายุ' },
            { from: 'edge', to: 'origin', label: 'หมดอายุ' },
            { from: 'origin', to: 'nm', label: 'ตรงกับ origin' },
            { from: 'origin', to: 'latest', label: 'ไม่ตรง' }
          ]
        }
      }
    },
    {
      heading: 'Lambda@Edge vs CloudFront Functions',
      body: '<ul><li><strong>CloudFront Functions</strong>: เป็นฟีเจอร์ native ของ CloudFront เขียนด้วย JavaScript เท่านั้น จับได้เฉพาะ viewer request/response เบามาก (sub-millisecond, memory 2 MB, ขนาด 10 KB) พัฒนาและทดสอบในตัว CloudFront ได้ครบ เหมาะกับงานเล็ก เช่น redirect, แก้ header</li>' +
        '<li><strong>Lambda@Edge</strong>: ต่อยอดจาก Lambda เขียนด้วย Node.js หรือ Python จับได้ทั้ง viewer และ origin request/response รันงานซับซ้อนได้ ทรัพยากรมากกว่า (สไลด์ไม่ระบุตัวเลข) แต่สร้าง/ทดสอบทั้งหมดใน CloudFront อย่างเดียวไม่ได้</li>' +
        '<li>AWS WAF: ใส่หน้า CloudFront หรือ REST API เพื่อกรอง traffic อันตราย (ใช้ใน lab 9.2)</li></ul>',
      refs: ['g-m09-edge', 'l-m09-cff-memory', 'l-m09-cff-size', 'q-m09-edge']
    },
    {
      heading: 'ลิมิตและตัวเลขที่ต้องจำ',
      body: '<ul><li>Redis shard: 1-6 node</li><li>CloudFront cache duration ค่าเริ่มต้น: 24 ชั่วโมง</li><li>CloudFront Functions: memory 2 MB, ขนาด 10 KB, duration ระดับ sub-millisecond</li></ul>',
      refs: ['l-m09-shard-nodes', 'l-m09-default-ttl', 'l-m09-cff-memory', 'l-m09-cff-size', 'l-m09-cff-duration']
    }
  ],

  limits: [
    {
      id: 'l-m09-shard-nodes', service: 'ElastiCache for Redis', name: 'จำนวน node ต่อ shard (node group)', display: '1-6 node (primary + replica)',
      accept: ['1-6', '1–6', '1 - 6', '6', '6 nodes', '6 node', '1-6 nodes'], source: 'L363-367',
      sim: {
        unit: 'nodes', min: 0, lowAt: 1, limitAt: 6, sliderMax: 12, step: 1, start: 3,
        overMsg: 'shard (node group) มี node ได้ 1-6 ตัวเท่านั้น',
        underMsg: 'shard ต้องมีอย่างน้อย 1 node (primary)',
        fix: 'ถ้าต้องการความจุ/throughput มากกว่านี้ ให้เพิ่มจำนวน shard (cluster mode) แทนการเพิ่ม node ใน shard เดียว'
      }
    },
    {
      id: 'l-m09-default-ttl', service: 'CloudFront', name: 'ระยะเวลา cache เริ่มต้น', display: '24 ชั่วโมง (ปรับได้ด้วย TTL ใน cache policy หรือ header Cache-Control/Expires)',
      accept: ['24 ชั่วโมง', '24 hours', '24 hour', '24 h', '24 hr', '24', '1 วัน', '1 day'], source: 'L750-754'
    },
    {
      id: 'l-m09-cff-memory', service: 'CloudFront Functions', name: 'Memory ของ function', display: '2 MB',
      accept: ['2 mb', '2mb', '2', '2 เมกะไบต์'], source: 'L941',
      sim: {
        unit: 'MB', min: 0, limitAt: 2, sliderMax: 6, step: 0.5, start: 1,
        overMsg: 'CloudFront Functions ใช้ memory ได้ไม่เกิน 2 MB',
        fix: 'ถ้างานต้องใช้ทรัพยากรมากกว่านี้ ให้ย้ายไปใช้ Lambda@Edge ซึ่งมี duration/memory/function size มากกว่า'
      }
    },
    {
      id: 'l-m09-cff-size', service: 'CloudFront Functions', name: 'ขนาดของ function', display: '10 KB',
      accept: ['10 kb', '10kb', '10', '10 กิโลไบต์'], source: 'L941',
      sim: {
        unit: 'KB', min: 0, limitAt: 10, sliderMax: 30, step: 1, start: 5,
        overMsg: 'CloudFront Functions มีขนาดได้ไม่เกิน 10 KB',
        fix: 'โค้ดที่ใหญ่หรือซับซ้อนกว่านี้ให้ใช้ Lambda@Edge (function size ใหญ่กว่า)'
      }
    },
    {
      id: 'l-m09-cff-duration', service: 'CloudFront Functions', name: 'ระยะเวลารันของ function', display: 'sub-millisecond (น้อยกว่า 1 มิลลิวินาที)',
      accept: ['sub-millisecond', 'sub-milliseconds', 'sub millisecond', 'น้อยกว่า 1 ms', 'น้อยกว่า 1 มิลลิวินาที', '<1 ms'], source: 'L941'
    }
  ],

  optionGroups: [
    {
      id: 'g-m09-engine', service: 'ElastiCache', title: 'Engine: Memcached vs Redis',
      options: [
        { name: 'ElastiCache for Memcached', traits: 'multithreading, ดูแลน้อย, scale แนวนอนง่ายด้วย Auto Discovery', when: 'ต้องการโมเดลที่ง่ายที่สุด', tradeoff: 'ไม่มีฟีเจอร์ชุดของ Redis (persistence, replication, failover, pub/sub, data type ซับซ้อน)' },
        { name: 'ElastiCache for Redis', traits: 'data type ซับซ้อน, persistence, HA (replication), automatic failover, pub/sub', when: 'ต้องการข้อมูลคงอยู่ หรือฟีเจอร์ใดฟีเจอร์หนึ่งข้างต้น', tradeoff: 'ซับซ้อนกว่า Memcached' }
      ],
      challenges: [
        { id: 'c-m09-eng-simple', requirement: 'ต้องการ cache แบบง่ายที่สุด ไม่ต้องมี persistence หรือ replication', answer: 'ElastiCache for Memcached', why: 'Memcached เหมาะเมื่อต้องการโมเดลที่ง่ายที่สุด (ตรงกับข้อสอบตัวอย่างในสไลด์)', source: 'L295-337, L1287-1337' },
        { id: 'c-m09-eng-persist', requirement: 'ต้องการให้ข้อมูลใน cache คงอยู่ (persistence) และมี automatic failover', answer: 'ElastiCache for Redis', why: 'persistence และ automatic failover เป็นฟีเจอร์ของ Redis', source: 'L295-337' },
        { id: 'c-m09-eng-pubsub', requirement: 'ต้องใช้ publish/subscribe และ data type ที่ซับซ้อน', answer: 'ElastiCache for Redis', why: 'pub/sub และ complex data types อยู่ในรายการฟีเจอร์ของ Redis', source: 'L295-337' },
        { id: 'c-m09-eng-autodisc', requirement: 'ต้องการ scale แนวนอนง่าย ๆ ด้วย Auto Discovery และใช้ multithreading', answer: 'ElastiCache for Memcached', why: 'multithreading และ Auto Discovery เป็นจุดเด่นของ Memcached', source: 'L295-337' }
      ]
    },
    {
      id: 'g-m09-strategy', service: 'ElastiCache', title: 'Caching strategy',
      options: [
        { name: 'Lazy loading', traits: 'เติม cache เฉพาะเมื่อ miss: อ่าน DB แล้วอัปเดต cache', when: 'ข้อมูลอ่านบ่อยแต่เขียนนาน ๆ ที เช่น user profile', tradeoff: 'miss penalty และข้อมูลอาจ stale' },
        { name: 'Write-through', traits: 'ทุกครั้งที่เขียน DB อัปเดต cache ตามทันที', when: 'ข้อมูลต้อง real-time เช่น top 100 game leaderboard', tradeoff: 'write penalty, ข้อมูลหายเมื่อ node ล่ม, มีข้อมูลไม่ถูกใช้ค้าง, cache churn' }
      ],
      challenges: [
        { id: 'c-m09-str-profile', requirement: 'ข้อมูลโปรไฟล์ผู้ใช้ อ่านบ่อยมาก แต่ผู้ใช้แก้ไขนาน ๆ ครั้ง', answer: 'Lazy loading', why: 'อ่านบ่อย เขียนน้อย เหมาะ lazy loading และไม่เปลือง cache กับข้อมูลที่ไม่มีใครอ่าน', source: 'L996, L1002' },
        { id: 'c-m09-str-leader', requirement: 'ตารางคะแนน top 100 ของเกมต้องตรงกับฐานข้อมูลเสมอ ห้ามมีข้อมูลเก่า', answer: 'Write-through', why: 'write-through อัปเดต cache ทุกครั้งที่เขียน DB จึงไม่มี stale data', source: 'L1000-1004, L1079' },
        { id: 'c-m09-str-penalty', requirement: 'ข้อเสียคือ request แรกหลัง miss ต้องไปอ่าน DB จึงช้า (cache miss penalty) และข้อมูลอาจเก่า', answer: 'Lazy loading', why: 'miss penalty และ potential for stale data เป็นข้อเสียของ lazy loading', source: 'L1051-1062' },
        { id: 'c-m09-str-churn', requirement: 'ข้อเสียคือเขียนช้าลง และมีข้อมูลที่ไม่เคยถูกอ่านค้างใน cache (cache churn)', answer: 'Write-through', why: 'write penalty, unused data และ cache churn เป็นข้อเสียของ write-through', source: 'L1079-1111' }
      ]
    },
    {
      id: 'g-m09-distribution', service: 'CloudFront', title: 'ชนิดของ distribution',
      options: [
        { name: 'Web content', traits: 'ส่ง static/dynamic content ผ่าน HTTP หรือ HTTPS origin เป็น HTTP server หรือ S3 bucket', when: 'เว็บไซต์ทั่วไป', tradeoff: 'ไม่ใช่ชนิดสำหรับ live streaming' },
        { name: 'Video on demand', traits: 'วิดีโอที่ผู้ใช้ดูเมื่อไรก็ได้ ต้อง encode ให้รองรับ streaming origin เป็น HTTP server หรือ S3', when: 'คลังวิดีโอ', tradeoff: 'ต้อง encode วิดีโอก่อน' },
        { name: 'Live event', traits: 'ถ่ายทอดสด ต้อง encode และ compress ให้เหมาะกับอุปกรณ์ origin เป็น AWS Elemental MediaStore หรือ MediaPackage', when: 'live streaming', tradeoff: 'origin จำกัดเฉพาะ MediaStore/MediaPackage' }
      ],
      challenges: [
        { id: 'c-m09-dist-web', requirement: 'ส่งเว็บไซต์ static ที่เก็บใน S3 ให้ผู้ใช้ผ่าน HTTPS', answer: 'Web content', why: 'Web content ใช้กับเนื้อหา static/dynamic ผ่าน HTTP/HTTPS และ origin เป็น S3 ได้', source: 'L626-665' },
        { id: 'c-m09-dist-live', requirement: 'ถ่ายทอดสดงานแข่งขัน โดย origin คือ AWS Elemental MediaPackage', answer: 'Live event', why: 'origin แบบ MediaStore/MediaPackage ใช้กับ distribution ชนิด Live event', source: 'L661-665' }
      ]
    },
    {
      id: 'g-m09-edge', service: 'CloudFront', title: 'Lambda@Edge vs CloudFront Functions',
      options: [
        { name: 'CloudFront Functions', traits: 'native ของ CloudFront, JavaScript เท่านั้น, viewer request/response เท่านั้น, sub-millisecond, 2 MB, 10 KB, สร้างและทดสอบในตัว CloudFront ได้', when: 'งานเบา สั้น เช่น redirect (302), แก้ header', tradeoff: 'ทำ origin event และงานซับซ้อนไม่ได้' },
        { name: 'Lambda@Edge', traits: 'ต่อยอดจาก Lambda, Node.js หรือ Python, viewer + origin request/response, ทรัพยากรมากกว่า', when: 'logic ซับซ้อน เช่น เลือก origin ตามประเทศของผู้ชม', tradeoff: 'สร้างและทดสอบทั้งหมดใน CloudFront อย่างเดียวไม่ได้' }
      ],
      challenges: [
        { id: 'c-m09-edge-redirect', requirement: 'redirect request ง่าย ๆ ตอน viewer request ใช้เวลาน้อยมากและเขียนด้วย JavaScript', answer: 'CloudFront Functions', why: 'งานเบา viewer event และ JavaScript ตรงกับ CloudFront Functions', source: 'L899, L941' },
        { id: 'c-m09-edge-origin', requirement: 'ต้อง hook ที่ origin request เพื่อเปลี่ยน origin ตามประเทศของผู้ชมด้วย Python', answer: 'Lambda@Edge', why: 'รองรับ origin request/response และ runtime Python ส่วน CloudFront Functions ทำได้แค่ viewer events กับ JavaScript', source: 'L832-857, L941' },
        { id: 'c-m09-edge-test', requirement: 'ต้องการ function ที่สร้างและทดสอบได้ครบภายใน CloudFront เอง', answer: 'CloudFront Functions', why: 'CloudFront Functions build/test entirely within CloudFront ได้ ส่วน Lambda@Edge ทำไม่ได้', source: 'L941' }
      ]
    }
  ],

  questions: [
    {
      id: 'q-m09-elasticache-choice', type: 'scenario', format: 'choice', source: 'L73, L455-459',
      prompt: 'เว็บคาเฟ่แสดงข้อมูลสต็อกเมล็ดกาแฟช้า เพราะ query ฐานข้อมูลซ้ำ ๆ ทีมต้องการลด latency โดยไม่ต้องดูแล cache cluster เอง ควรทำอย่างไร',
      keywords: ['query ฐานข้อมูลซ้ำ', 'ลด latency', 'ไม่ต้องดูแล cache cluster'],
      choices: [
        { text: 'ใส่ Amazon ElastiCache คั่นระหว่างแอปกับฐานข้อมูลเพื่อ cache ผล query', correct: true, why: 'ElastiCache เป็น managed in-memory cache ตอบ submillisecond ช่วยลดภาระและ latency ของ DB' },
        { text: 'ใช้ CloudFront ลด hop ระหว่างแอปกับฐานข้อมูล', correct: false, why: 'CloudFront cache เนื้อหาเว็บที่ edge ไม่ใช่ cache ผล query ฐานข้อมูลของแอป' },
        { text: 'ใช้ AWS WAF ตรวจ request ก่อนถึงฐานข้อมูล', correct: false, why: 'WAF ไว้กรอง traffic อันตราย ไม่ช่วยความเร็ว query' },
        { text: 'ใช้ Lambda@Edge รัน query แทน', correct: false, why: 'Lambda@Edge ทำงานที่ edge กับ request/response ของ CloudFront ไม่ใช่ cache ของฐานข้อมูล' }
      ]
    },
    {
      id: 'q-m09-engine-detail', type: 'scenario', format: 'choice', source: 'L295-337, L1287-1337',
      prompt: 'ข้อใดเป็นเหตุผลที่ควรเลือก Memcached แทน Redis สำหรับ ElastiCache',
      keywords: ['Memcached', 'Redis'],
      choices: [
        { text: 'ต้องการโมเดลที่ง่ายที่สุด', correct: true, why: 'สไลด์ระบุ suitability ของ Memcached คือต้องการโมเดลที่ง่ายที่สุด' },
        { text: 'ต้องการ replication ของข้อมูล', correct: false, why: 'replication (HA) เป็นฟีเจอร์ของ Redis' },
        { text: 'ต้องใช้ data type ที่ซับซ้อน', correct: false, why: 'complex data types เป็นของ Redis' },
        { text: 'ต้องการ in-memory cache', correct: false, why: 'ทั้ง Memcached และ Redis เป็น in-memory จึงไม่ใช่เหตุผลเลือก Memcached เหนือ Redis' }
      ]
    },
    {
      id: 'q-m09-elasticache-choice2', type: 'scenario', format: 'choice', source: 'L317-337',
      prompt: 'แอปเกมต้องการ cache ที่มี automatic failover, ข้อมูลคงอยู่เมื่อ restart และใช้ publish/subscribe ส่งข้อความระหว่างผู้เล่น ควรเลือก engine ใดและทำไม (เลือก 2 ข้อ)',
      keywords: ['automatic failover', 'publish/subscribe'],
      choices: [
        { text: 'เลือก ElastiCache for Redis', correct: true, why: 'Redis มี persistence, automatic failover และ pub/sub' },
        { text: 'เพราะ Redis รองรับ high availability ด้วย replication (primary + replica)', correct: true, why: 'replication group/shard ที่มี primary และ replica คือกลไก HA ของ Redis' },
        { text: 'เลือก ElastiCache for Memcached เพราะ multithreading', correct: false, why: 'multithreading ไม่ตอบโจทย์ failover/persistence/pub-sub' },
        { text: 'เลือก Memcached เพราะต้องการโมเดลที่ง่ายที่สุด', correct: false, why: 'โจทย์ต้องการฟีเจอร์ขั้นสูง ซึ่งไม่ใช่เหตุผลของ Memcached' }
      ]
    },
    {
      id: 'q-m09-strategy', type: 'scenario', format: 'choice', source: 'L996-1004, L1051-1111',
      prompt: 'แอปมีข้อมูลโปรไฟล์ลูกค้า อ่านบ่อยมากแต่แก้ไขนาน ๆ ที ทีมไม่อยากเก็บข้อมูลที่ไม่มีใครเรียกไว้ใน cache ควรใช้ caching strategy ใด',
      keywords: ['อ่านบ่อยมากแต่แก้ไขนาน ๆ ที', 'ไม่อยากเก็บข้อมูลที่ไม่มีใครเรียก'],
      choices: [
        { text: 'Lazy loading', correct: true, why: 'เติม cache เมื่อ miss เท่านั้น จึงมีข้อมูลที่ไม่ถูกใช้น้อย เหมาะกับข้อมูลอ่านบ่อย เขียนน้อย' },
        { text: 'Write-through', correct: false, why: 'จะเขียน cache ทุกครั้งที่เขียน DB ทำให้มีข้อมูลที่ไม่ถูกอ่านค้างใน cache' },
        { text: 'ไม่ใช้ cache เพราะข้อมูลอาจ stale', correct: false, why: 'ข้อมูลอ่านบ่อยและค่อนข้างนิ่ง เป็นกรณีที่ caching คุ้ม' },
        { text: 'ใช้ CloudFront Functions เก็บโปรไฟล์', correct: false, why: 'CloudFront Functions ไม่ใช่ cache ของข้อมูลแอป' }
      ]
    },
    {
      id: 'q-m09-leaderboard', type: 'scenario', format: 'choice', source: 'L1000-1004, L1079',
      prompt: 'เกมออนไลน์แสดง top 100 leaderboard ที่ต้องสะท้อนคะแนนล่าสุดทันที ห้ามแสดงข้อมูลเก่า ยอมให้การเขียนช้าลงเล็กน้อยได้ ควรใช้ strategy ใด และข้อเสียที่ต้องยอมรับคืออะไร',
      keywords: ['top 100 leaderboard', 'ห้ามแสดงข้อมูลเก่า'],
      choices: [
        { text: 'Write-through ยอมรับ write penalty และข้อมูลที่ไม่ถูกใช้ค้าง cache', correct: true, why: 'อัปเดต cache ทุกครั้งที่เขียน DB จึงไม่มี stale data แลกกับ write penalty / cache churn' },
        { text: 'Lazy loading ยอมรับ cache miss penalty', correct: false, why: 'lazy loading อาจมี stale data ซึ่งโจทย์ห้าม' },
        { text: 'Lazy loading ยอมรับว่า node ล่มแล้วข้อมูลหาย', correct: false, why: 'ความเสี่ยงข้อมูลหายตอน node ล่มเป็นข้อเสียของ write-through ไม่ใช่ lazy loading และ lazy loading ก็ไม่ตรงโจทย์' },
        { text: 'ปิด cache แล้วอ่านฐานข้อมูลตรงเสมอ โดยตั้ง TTL 24 ชั่วโมง', correct: false, why: 'ขัดแย้งกันเอง และ TTL 24 ชั่วโมงทำให้ข้อมูลเก่าได้' }
      ]
    },
    {
      id: 'q-m09-cachekey', type: 'scenario', format: 'choice', source: 'L677-741',
      prompt: 'เว็บใช้ CloudFront ตั้งค่า default cache key ผู้ใช้สองคนขอ URL path เดียวกันแต่ query string และ cookie ต่างกัน และต้องการให้ได้เนื้อหาที่ต่างกันตาม query string ผลที่เกิดและวิธีแก้คือข้อใด',
      keywords: ['default cache key', 'query string'],
      choices: [
        { text: 'ทั้งสองได้ cache entry เดิม (cache hit) ต้องเพิ่ม query string เข้าไปใน cache key ใน cache policy', correct: true, why: 'default cache key มีแค่ domain + URL path ค่าอื่นไม่ถูกรวม ต้องเพิ่มเองใน cache key settings' },
        { text: 'ทั้งสองได้เนื้อหาต่างกันเสมอเพราะ CloudFront แยกตาม query string อัตโนมัติ', correct: false, why: 'ค่า default ไม่รวม query string' },
        { text: 'ต้องเพิ่ม Default TTL เป็น 0 จึงจะแยกเนื้อหาได้', correct: false, why: 'TTL คุมอายุ cache ไม่ได้ทำให้ cache key แยกกัน' },
        { text: 'ต้องย้ายไปใช้ Lambda@Edge เท่านั้น', correct: false, why: 'ตั้งค่า cache key ใน cache policy ได้เลยโดยไม่ต้องใช้ edge function' }
      ]
    },
    {
      id: 'q-m09-edge', type: 'scenario', format: 'choice', source: 'L832-857, L934-948',
      prompt: 'ทีมต้องการเปลี่ยน origin ของ request ตามประเทศของผู้ชม (เช่น GB, DE, IE ไป origin ของยุโรป) โดยใช้ logic ที่ค่อนข้างซับซ้อน ควรใช้อะไร',
      keywords: ['เปลี่ยน origin', 'ประเทศของผู้ชม'],
      choices: [
        { text: 'Lambda@Edge ผูกกับ origin request', correct: true, why: 'เปลี่ยน origin ต้องจับ origin request ซึ่งทำได้เฉพาะ Lambda@Edge (CloudFront Functions จับแค่ viewer events)' },
        { text: 'CloudFront Functions ผูกกับ origin request', correct: false, why: 'CloudFront Functions รองรับ viewer request/response เท่านั้น' },
        { text: 'AWS WAF', correct: false, why: 'WAF ไว้กรอง traffic ไม่ได้ไว้เลือก origin' },
        { text: 'ElastiCache for Redis', correct: false, why: 'ไม่เกี่ยวกับการ routing ที่ edge' }
      ]
    },
    {
      id: 'q-m09-redis-written', type: 'scenario', format: 'written', source: 'L295-337, L363-379',
      prompt: 'แอปแชตต้องการ cache ที่เก็บข้อมูลคงอยู่ ถ้า node หลักล่มต้องสลับไปใช้ node สำรองอัตโนมัติ และต้องมี pub/sub จงเลือก engine ของ ElastiCache พร้อมอธิบายโครงสร้าง cluster ที่เหมาะสมและเหตุผลที่ไม่เลือกอีก engine',
      keywords: ['คงอยู่', 'node หลักล่ม', 'pub/sub'],
      rubric: [
        'เลือก ElastiCache for Redis',
        'อ้างฟีเจอร์ Redis: persistence, replication, automatic failover, pub/sub',
        'อธิบายว่า shard มี primary + replica (1-6 node) และ cluster คือกลุ่มของ shard',
        'อธิบายว่า Memcached เหมาะกับโมเดลที่ง่ายที่สุดและไม่มีฟีเจอร์ข้างต้น'
      ],
      modelAnswer: 'เลือก ElastiCache for Redis เพราะรองรับ persistence, high availability ด้วย replication, automatic failover และ publish/subscribe\n\nโครงสร้าง: ใช้ Redis cluster (replication group) ที่มี shard อย่างน้อย 1 ตัว แต่ละ shard (node group) ประกอบด้วย primary node กับ replica node รวม 1-6 node ถ้า primary ล่ม replica ถูกยกขึ้นแทนอัตโนมัติ ถ้าต้องการขยายความจุให้เพิ่มจำนวน shard (cluster mode)\n\nไม่เลือก Memcached เพราะจุดเด่นคือ multithreading, ดูแลง่าย และ scale ด้วย Auto Discovery เหมาะเมื่อต้องการโมเดลที่ง่ายที่สุด แต่ไม่มีฟีเจอร์ persistence/failover/pub-sub ที่โจทย์ต้องการ'
    },
    {
      id: 'q-m09-web-written', type: 'scenario', format: 'written', source: 'L549-589, L1158-1180',
      prompt: 'เว็บ static ของคาเฟ่ที่โฮสต์บน S3 ยังเป็น HTTP ผู้ใช้ทั่วโลกบ่นว่าโหลดช้า และทีมกังวลเรื่อง traffic อันตรายที่เข้ามายัง REST API จงเสนอแนวทางและอธิบายว่าแต่ละส่วนช่วยอะไร',
      keywords: ['ผู้ใช้ทั่วโลก', 'HTTP', 'traffic อันตราย'],
      rubric: [
        'เสนอ CloudFront เป็น CDN หน้า S3 ให้เนื้อหา cache ที่ edge ใกล้ผู้ใช้ ลดระยะทาง/hop',
        'ระบุว่าให้ผู้ใช้เข้าผ่าน CloudFront เพื่อรองรับ HTTPS (แก้ปัญหาเว็บที่ยังเป็น HTTP)',
        'เสนอ AWS WAF บน CloudFront และบน REST API เพื่อกรอง traffic อันตราย',
        'พูดถึงการคุมอายุ cache ด้วย TTL / Cache-Control (ค่าเริ่มต้น 24 ชั่วโมง)'
      ],
      modelAnswer: 'สร้าง CloudFront distribution (ชนิด web content) ให้ S3 bucket เป็น origin ผู้ใช้ทั่วโลกจะได้ไฟล์จาก edge location ที่ใกล้ที่สุดซึ่ง cache ไว้ ลด latency จากระยะทางและจำนวน hop และให้ผู้ใช้เข้าผ่าน CloudFront เพื่อให้เว็บรองรับ HTTPS\n\nตั้ง AWS WAF กับ CloudFront distribution และกับ REST API (API Gateway) เพื่อกรอง request อันตราย\n\nปรับอายุ cache ด้วย TTL ใน cache policy หรือ header Cache-Control/Expires (ค่าเริ่มต้นคือ 24 ชั่วโมง) และเพิ่ม CloudFront Function ถ้าต้องแก้ request/response เล็ก ๆ ที่ edge'
    },
    {
      id: 'q-m09-design', type: 'design', format: 'written', source: 'L73, L605-617, L1158-1196',
      prompt: 'ออกแบบ flow ให้เว็บคาเฟ่ที่โฮสต์บน S3 ซึ่งตอนนี้โหลดช้าสำหรับผู้ใช้ทั่วโลกและยังไม่รองรับ HTTPS: ผู้ใช้ขอไฟล์ผ่านโดเมนของเว็บ ต้องการให้ไฟล์ถูก cache ใกล้ผู้ใช้ ต้องมีการกรอง traffic อันตราย และเมื่อ cache ไม่มีไฟล์ต้องไปดึงจากต้นทาง จงวาดแผนภาพ flow พร้อมลำดับบนลูกศรและอธิบายแต่ละขั้น',
      keywords: ['ผู้ใช้ทั่วโลก', 'HTTPS', 'กรอง traffic อันตราย'],
      flow: {
        nodes: [
          { id: 'user', label: 'User (ทั่วโลก)' },
          { id: 'dns', label: 'DNS' },
          { id: 'waf', label: 'AWS WAF' },
          { id: 'edge', label: 'CloudFront edge location (cache)' },
          { id: 's3', label: 'S3 bucket (origin)' }
        ],
        edges: [
          { from: 'user', to: 'dns', label: '1' },
          { from: 'dns', to: 'edge', label: '2' },
          { from: 'waf', to: 'edge', label: 'กรอง' },
          { from: 'edge', to: 's3', label: '3 (miss)' },
          { from: 's3', to: 'edge', label: '4' },
          { from: 'edge', to: 'user', label: '5' }
        ],
        distractors: ['ElastiCache', 'Lambda@Edge', 'EC2', 'Aurora Serverless']
      },
      rubric: [
        'ผู้ใช้ถูกนำทางไป CloudFront edge location ที่ใกล้ที่สุดผ่าน DNS',
        'มี AWS WAF ผูกกับ CloudFront เพื่อกรอง traffic อันตราย',
        'ถ้า cache มีไฟล์ตอบทันที ถ้า miss ไปขอจาก S3 origin',
        'edge เก็บไฟล์ลง cache แล้วส่งให้ผู้ใช้ (อายุตาม TTL ค่าเริ่มต้น 24 ชั่วโมง)',
        'ระบุว่าผู้ใช้เข้าผ่าน CloudFront เพื่อรองรับ HTTPS'
      ],
      modelAnswer: '1) ผู้ใช้ขอไฟล์ผ่านโดเมนของเว็บ\n2) DNS นำทางไป CloudFront edge location ที่เหมาะสมที่สุด (ใกล้ผู้ใช้) โดย request ผ่านการกรองของ AWS WAF ที่ผูกกับ distribution\n3) edge ตรวจ cache ถ้ามีและยังไม่หมดอายุ ตอบผู้ใช้ทันที (hit) ถ้าไม่มี (miss) ขอจาก S3 bucket ซึ่งเป็น origin\n4) S3 ส่งไฟล์กลับมาที่ edge\n5) edge ส่งไฟล์ให้ผู้ใช้และเก็บลง cache ตาม TTL (ค่าเริ่มต้น 24 ชั่วโมง ปรับได้ด้วย cache policy หรือ Cache-Control)\nผู้ใช้เชื่อมต่อผ่าน CloudFront จึงรองรับ HTTPS ได้ และโหลดเร็วเพราะลดระยะทาง/hop'
    }
  ]
});
