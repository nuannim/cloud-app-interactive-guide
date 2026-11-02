/* M09 Caching — source = เลขบรรทัดในไฟล์สไลด์ (notes/(9 f) ...M09-Cachings.md) */
GUIDE.register({
  module: 'M09',
  title: 'Caching',
  summary: 'ทำไมต้อง cache, ElastiCache (Memcached vs Redis), lazy loading vs write-through, CDN และ CloudFront (cache key, TTL), Lambda@Edge vs CloudFront Functions, 2 แล็บ',

  notes: [
    {
      heading: 'ทำไมต้อง cache: ปัญหาข้อมูลยุคใหม่ และ caching คืออะไร',
      body: '<p class="analogy">เหมือนจดเบอร์ที่โทรบ่อยไว้หน้าแรกของสมุด ไม่ต้องเปิดหาทั้งเล่มทุกครั้ง</p>' +
        '<h3>โจทย์ของคาเฟ่</h3>' +
        '<ul><li><strong>ปัญหาเดิม:</strong> หน้าสต็อกเมล็ดกาแฟบนเว็บโหลดช้ามาก ยิ่งคนเข้าเยอะ database ยิ่งทำงานหนัก</li><li><strong>ความต้องการของ Sofía</strong> (นักพัฒนา): ลด latency ให้เห็นผลชัด และให้เว็บรองรับ HTTPS</li><li><strong>โซลูชัน:</strong> ใช้ caching 2 ระดับ คือชั้น database ด้วย <strong>Amazon ElastiCache</strong> และชั้นส่งไปทั่วโลกด้วย <strong>Amazon CloudFront</strong></li></ul>' +
        '<h3>ความท้าทายของข้อมูลในแอปยุคใหม่</h3>' +
        '<ul><li>ผู้ใช้หลายล้านคน</li><li>กระจายอยู่ทั่วโลก</li><li>request หลายล้านต่อวินาที</li><li>ต้องตอบเร็วระดับ microsecond ถึง millisecond</li><li>เข้ามาจากหลายช่องทาง: mobile, อุปกรณ์ IoT ฯลฯ</li><li>ตัวอย่างงานที่เจอแรงกดดันนี้: e-commerce, media streaming, social media, online gaming, shared economy</li></ul>' +
        '<p>ผลคือแหล่งข้อมูลของแอป (data source) ต้องรับงานหนักมาก ถ้า database ถูกยิงตรง ๆ ตลอดเวลาจะรับไม่ไหวและเกิดคอขวด (bottleneck)</p>' +
        '<h3>Caching คืออะไร</h3>' +
        '<ul><li>cache คือ <strong>สำเนา</strong> ของข้อมูลบางส่วนหรือทั้งหมดของต้นทาง (origin) เก็บไว้ในที่ที่เข้าถึงเร็ว เช่น RAM หรือ edge location</li><li>ถ้าข้อมูลที่ขอมีใน cache (hit) ตอบทันที</li><li>ถ้าไม่มี (miss) ถามต้นทาง แล้วเก็บสำเนาไว้</li><li>สำเนามีอายุ เรียกว่า <strong>TTL</strong> (time to live)</li><li>ผลที่ได้ 2 อย่าง: <strong>lower latency</strong> (ผู้ใช้ได้คำตอบเร็วขึ้น) และ <strong>reduced load on origin</strong> (database หรือ server ต้นทางรับงานน้อยลง)</li></ul>' +
        '<div class="fig-slot" data-i="0"></div>' +
        '<h3>ภาพรวม: cache 2 ด่านของเว็บคาเฟ่</h3>' +
        '<ul><li><strong>ด่านที่ 1 (หน้าบ้าน):</strong> CloudFront ตรวจ cache key ที่ edge เจอไฟล์ก็ตอบเลย ไม่เจอหรือเป็นคำขอ API ค่อยส่งต่อเข้า application</li><li><strong>ด่านที่ 2 (หลังบ้าน):</strong> application ถาม ElastiCache ก่อน เจอใน RAM ก็ใช้เลย ไม่เจอหรือ TTL หมด ค่อย query database แล้วเติมลง cache</li><li>แอปตอบกลับผ่าน CloudFront ซึ่งเก็บคำตอบไว้ให้รอบถัดไป</li></ul>' +
        '<div class="fig-slot" data-i="1"></div>' +
        '<p class="small muted">ภาพรวมนี้เรียบเรียงจากโจทย์คาเฟ่ ไม่ใช่ภาพต้นฉบับของสไลด์ <span class="badge warn">นอก notes</span></p>' +
        '<p><strong>ใจความหลักของส่วนนี้</strong> (ตามสไลด์ Key takeaways, L248-250)</p><ul><li>แอปยุคใหม่เรียกร้องประสิทธิภาพสูงจาก data source</li><li>caching เพิ่มประสิทธิภาพโดยตอบจาก <strong>สำเนาของข้อมูล</strong> (cache) แทนที่จะไปถามต้นทาง</li><li>cache ทำได้ <strong>ทุกชั้น</strong> ของแอป (หัวข้อถัดไป)</li></ul>',
      brief: '<h3>โจทย์ของคาเฟ่</h3><ul><li><strong>ปัญหา:</strong> หน้าสต็อกเมล็ดกาแฟโหลดช้า คนเข้าเยอะ database ยิ่งหนัก</li><li><strong>Sofía</strong> ต้องการลด latency และรองรับ HTTPS</li><li><strong>โซลูชัน:</strong> cache 2 ระดับ ElastiCache (database) + CloudFront (ทั่วโลก)</li></ul><h3>ปัญหาข้อมูลยุคใหม่</h3><ul><li>ผู้ใช้หลายล้านคน กระจายทั่วโลก</li><li>request หลายล้านต่อวินาที ต้องตอบระดับ microsecond ถึง millisecond</li><li>เข้ามาจากหลายช่องทาง: mobile, IoT</li><li>ตัวอย่าง: e-commerce, media streaming, social media, online gaming, shared economy</li><li>ผลคือ data source ต้องรับงานหนัก ถ้าถูกยิงตรง ๆ จะเกิดคอขวด (bottleneck)</li></ul><h3>Caching คืออะไร</h3><ul><li>cache = <strong>สำเนา</strong> ของข้อมูลจากต้นทาง (origin)</li><li>มีใน cache (hit) ตอบทันที</li><li>ไม่มี (miss) ถาม origin แล้วเก็บสำเนา</li><li>สำเนามีอายุ = <strong>TTL</strong> (time to live)</li><li>ผล: <strong>lower latency</strong> และ <strong>reduced load on origin</strong></li><li>cache ทำได้ <strong>ทุกชั้น</strong> ของแอป</li></ul><div class="fig-slot" data-i="0"></div><h3>ภาพรวม: cache 2 ด่านของเว็บคาเฟ่</h3><ul><li><strong>ด่านที่ 1:</strong> CloudFront ตรวจ cache key ที่ edge เจอก็ตอบเลย ไม่เจอหรือเป็น API ส่งต่อเข้าแอป</li><li><strong>ด่านที่ 2:</strong> แอปถาม ElastiCache ก่อน ไม่เจอ/TTL หมดค่อย query database แล้วเติม cache</li><li>แอปตอบผ่าน CloudFront ซึ่งเก็บคำตอบไว้รอบหน้า</li></ul><div class="fig-slot" data-i="1"></div><p class="small muted">ภาพรวมนี้เรียบเรียงเอง <span class="badge warn">นอก notes</span></p>',
      refs: ['q-m09-elasticache-choice'],
      diagrams: [
        { title: 'Cache ทำงานอย่างไร', caption: 'ตามสไลด์ What is caching?: hit ตอบทันที, miss ไปถาม origin แล้วเก็บสำเนา พร้อม TTL', source: 'L133-140', svgId: 'm09-what-is-cache' },
        { title: 'Cache 2 ด่านของเว็บคาเฟ่', caption: 'CloudFront (ด่านหน้า) → application → ElastiCache (ด่านหลัง) → database เรียบเรียงจากโจทย์คาเฟ่และเนื้อหาโมดูล', source: 'สรุปผู้เรียบเรียง', supplement: true, svgId: 'm09-two-layer' }
      ]
    },
    {
      heading: 'Cache ได้ทุกชั้นของแอป',
      body: '<p class="analogy">เหมือนของที่ใช้บ่อยวางใกล้มือหลายจุด ในกระเป๋า บนโต๊ะ ในตู้ ไม่ต้องไปคลังกลางทุกครั้ง</p>' +
        '<p>ข้อมูลเดินทางจากผู้ใช้ ผ่านอินเทอร์เน็ต ไปที่แอป แล้วไปถึง database ทุกจุดตามทางใส่ cache ได้</p>' +
        '<ul><li><strong>ฝั่งผู้ใช้ (Client / Browser)</strong> (single-page web application, เบราว์เซอร์)<ul><li>browser caching ด้วย HTTP cache-control header</li></ul></li><li><strong>เนื้อหาเว็บ (Edge)</strong> (web content) เก็บภาพ วิดีโอ หน้าเว็บ ที่ขอบเครือข่ายใกล้ผู้ใช้<ul><li>web content caching</li><li>proxy และ resolver</li><li>Amazon CloudFront</li></ul></li><li><strong>ประสิทธิภาพของแอปและ API (Application &amp; API)</strong><ul><li>Amazon API Gateway cache</li><li>Amazon ElastiCache</li><li>Amazon CloudFront</li></ul></li><li><strong>ฐานข้อมูล (Database query)</strong> กัน database ไม่ให้ถูก query ซ้ำ ๆ<ul><li>database query caching</li><li>web session management</li><li>Amazon ElastiCache</li></ul></li></ul>' +
        '<p class="small muted">ตัวอักษรในภาพสไลด์นี้เพี้ยน การจับคู่ชั้นกับ service เรียบเรียงตามตำแหน่งในภาพ ถ้าต้องการให้ตรงต้นฉบับ แปะภาพสไลด์ "You can cache at all layers" มาได้</p>',
      brief: '<ul><li><strong>ฝั่งผู้ใช้ (Client / Browser)</strong>: browser caching ด้วย HTTP cache-control header</li><li><strong>web content (Edge)</strong>: web content caching, proxy และ resolver, Amazon CloudFront</li><li><strong>แอปและ API</strong>: Amazon API Gateway cache, Amazon ElastiCache, Amazon CloudFront</li><li><strong>ฐานข้อมูล (Database query)</strong>: database query caching, web session management, Amazon ElastiCache</li></ul><p class="small muted">จัดกลุ่มตามตำแหน่งในภาพ (ข้อความในภาพสไลด์เพี้ยน)</p>',
      refs: []
    },
    {
      heading: 'ควร cache ไหม: workload ที่ได้ประโยชน์ และ 4 คำถามก่อนตัดสินใจ',
      body: '<p class="analogy">เหมือนคิดว่าจะซื้อตู้เย็นเล็กไว้ข้างเตียงดีไหม คุ้มเมื่อเปิดบ่อยและของไม่เสียเร็ว</p>' +
        '<h3>Workload ที่ได้ประโยชน์จาก cache</h3>' +
        '<div class="table-wrap"><table><thead><tr><th>ชนิด</th><th>ประโยชน์</th><th>ตัวอย่าง</th></tr></thead><tbody><tr><td><strong>Read-heavy</strong><br>(อ่านมากกว่าเขียน)</td><td>ลด latency<br>ปรับปรุง IOPS (input/output operations per second)</td><td>social networking<br>gaming<br>media sharing<br>question and answer (Q&A) portals</td></tr><tr><td><strong>Compute-intensive</strong><br>(ใช้การคำนวณหนัก)</td><td>จัดการ dataset ขนาดใหญ่แบบ real time<br>คำนวณครั้งเดียวแล้วเก็บผลไว้ ไม่ต้องคำนวณใหม่ทุกครั้ง</td><td>recommendation engine<br>high performance computing (HPC) simulation</td></tr></tbody></table></div>' +
        '<p class="small muted">ข้อความในภาพสไลด์สลับตำแหน่งกัน (รายการ IOPS และ Q&A portals) การจัดกลุ่มข้างบนตามที่ AWS ใช้ในเอกสาร ElastiCache ตัวอย่างอื่นที่พบบ่อย: gaming leaderboard, เว็บข่าว <span class="badge warn">นอก notes</span></p>' +
        '<h3>4 คำถามก่อนตัดสินใจ cache</h3>' +
        '<ol><li>query ที่ช้า/แพงต้องใช้สร้างข้อมูลนี้หรือเปล่า</li><li>ข้อมูลค่อนข้างนิ่ง และถูกเรียกใช้บ่อยหรือเปล่า</li><li>ข้อมูลยอมให้เก่า (stale) ได้หรือเปล่า</li><li>คุ้มกับความซับซ้อนในการพัฒนาและค่าใช้จ่ายที่เพิ่มขึ้นหรือเปล่า</li></ol>' +
        '<div class="fig-slot" data-i="0"></div>',
      brief: '<h3>Workload ที่ได้ประโยชน์</h3><div class="table-wrap"><table><thead><tr><th>ชนิด</th><th>ประโยชน์</th><th>ตัวอย่าง</th></tr></thead><tbody><tr><td><strong>Read-heavy</strong> (อ่านมากกว่าเขียน)</td><td>ลด latency, ปรับปรุง IOPS</td><td>social networking, gaming, media sharing, Q&A portals</td></tr><tr><td><strong>Compute-intensive</strong></td><td>จัดการ dataset ใหญ่แบบ real time (คำนวณครั้งเดียวแล้วเก็บผลไว้)</td><td>recommendation engine, HPC simulation</td></tr></tbody></table></div><p class="small muted">การจัดกลุ่มตามเอกสาร ElastiCache <span class="badge warn">นอก notes</span></p><h3>4 คำถามก่อนตัดสินใจ cache</h3><ol><li>query ช้า/แพงใช่ไหม</li><li>ข้อมูลค่อนข้างนิ่งและถูกเรียกบ่อยไหม</li><li>ยอมให้ข้อมูลเก่า (stale) ได้ไหม</li><li>คุ้มกับความซับซ้อนและค่าใช้จ่ายที่เพิ่มไหม</li></ol><div class="fig-slot" data-i="0"></div>',
      refs: [],
      diagrams: [
        { title: '4 คำถามก่อนตัดสินใจ cache', caption: 'ตามสไลด์ Factors for considering whether to cache', source: 'L213-240', svgId: 'm09-should-cache' }
      ]
    },
    {
      heading: 'Amazon ElastiCache: Memcached กับ Redis',
      body: '<p class="analogy">เหมือนจดคำตอบที่ถูกถามบ่อยไว้บนกระดานหน้าร้าน (RAM) แทนการเดินเข้าไปเปิดแฟ้มในห้องหลังร้านทุกครั้ง</p>' +
        '<p>ElastiCache คือ <strong>in-memory</strong> data store แบบ fully managed ที่ตอบได้ระดับ <strong>submillisecond</strong></p>' +
        '<ul><li>เป็น key-value store ที่อยู่ระหว่างแอปกับ data store ต้นทาง</li><li>ลด latency ในการเข้าถึง</li><li>เพิ่ม throughput</li><li>ลดภาระของ database และแอป</li><li>scale ได้ทั้งออก เข้า ขึ้น ลง (scale out, in, up, down) ตามความต้องการ</li><li>เข้ากันได้เต็มที่กับ open-source <strong>Redis</strong> และ <strong>Memcached</strong></li></ul>' +
        '<h3>เลือก engine: Memcached หรือ Redis</h3>' +
        '<div class="table-wrap"><table><thead><tr><th></th><th>ElastiCache for Memcached</th><th>ElastiCache for Redis</th></tr></thead><tbody><tr><td>สถาปัตยกรรม</td><td><strong>multithreading</strong> (ใช้ CPU หลายคอร์ได้เต็มที่)</td><td>single-threaded core (เร็วด้วย event loop)</td></tr><tr><td>โครงสร้างข้อมูล</td><td>key-value ธรรมดา (string/object)</td><td><strong>data type ซับซ้อน</strong> เช่น strings, hashes, lists, sets, sorted sets, bitmaps</td></tr><tr><td>persistence</td><td>ไม่มี (node ดับ ข้อมูลหายทันที)</td><td><strong>มี</strong> (snapshot / append-only file)</td></tr><tr><td>high availability</td><td>ไม่มี replication ในตัว (กระจายข้อมูลข้าม node)</td><td><strong>replication</strong> แบบ primary-replica, Multi-AZ, <strong>automatic failover</strong></td></tr><tr><td>ฟีเจอร์อื่น</td><td>ดูแลง่าย (low maintenance)<br>scale แนวนอนง่ายด้วย <strong>Auto Discovery</strong></td><td><strong>publish/subscribe</strong><br>geospatial query</td></tr><tr><td>เหมาะเมื่อ</td><td>ต้องการโมเดลที่ <strong>ง่ายที่สุด</strong></td><td>ต้องการข้อมูลคงอยู่ (persistence)<br>ต้องการ data type ขั้นสูง<br>หรือต้องการฟีเจอร์อื่นในรายการข้างบน</td></tr></tbody></table></div>' +
        '<div class="callout"><span class="callout-title">จำง่าย ๆ</span><p>ต้องการแบบง่ายที่สุด → Memcached · ต้องการฟีเจอร์เพิ่ม (persistence, replication, failover, pub/sub, data type ขั้นสูง) → Redis</p></div>' +
        '<p class="small muted"><strong>จุดออกสอบบ่อย</strong> ข้อสอบตัวอย่างของโมดูลถามเรื่องนี้ตรง ๆ ดูท้ายหน้าสรุป</p>' +
        '<p class="small muted">สไลด์ระบุแค่จุดเด่นในรายการ รายละเอียดที่เกินนั้น (single-threaded/event loop, ชื่อ data type, snapshot/AOF, Multi-AZ, geospatial) เป็นความรู้เพิ่มจากไฟล์สรุป <span class="badge warn">นอก notes</span></p>',
      brief: '<p>ElastiCache = <strong>in-memory</strong> data store แบบ fully managed ตอบระดับ <strong>submillisecond</strong></p><ul><li>key-value store คั่นระหว่างแอปกับ data store ต้นทาง</li><li>ลด latency, เพิ่ม throughput, ลดภาระ database และแอป</li><li>scale out, in, up, down ได้</li><li>เข้ากันได้เต็มที่กับ open-source <strong>Redis</strong> และ <strong>Memcached</strong></li></ul><div class="table-wrap"><table><thead><tr><th></th><th>Memcached</th><th>Redis</th></tr></thead><tbody><tr><td>สถาปัตยกรรม</td><td><strong>multithreading</strong></td><td>single-threaded core (event loop)</td></tr><tr><td>โครงสร้างข้อมูล</td><td>key-value ธรรมดา</td><td><strong>data type ซับซ้อน</strong> (strings, hashes, lists, sets, sorted sets, bitmaps)</td></tr><tr><td>persistence</td><td>ไม่มี (node ดับ ข้อมูลหาย)</td><td><strong>มี</strong> (snapshot / AOF)</td></tr><tr><td>high availability</td><td>ไม่มี replication ในตัว</td><td><strong>replication</strong> (primary-replica), Multi-AZ, <strong>automatic failover</strong></td></tr><tr><td>ฟีเจอร์อื่น</td><td>low maintenance<br>scale แนวนอนง่ายด้วย <strong>Auto Discovery</strong></td><td><strong>pub/sub</strong><br>geospatial query</td></tr><tr><td>เหมาะเมื่อ</td><td>ต้องการโมเดลที่ <strong>ง่ายที่สุด</strong></td><td>ต้องการ persistence, data type ขั้นสูง หรือฟีเจอร์อื่นข้างบน</td></tr></tbody></table></div><div class="callout"><span class="callout-title">จำง่าย ๆ</span><p>แบบง่ายที่สุด → Memcached · ต้องการฟีเจอร์เพิ่ม (persistence, replication, failover, pub/sub, data type ขั้นสูง) → Redis</p></div><p class="small muted"><strong>จุดออกสอบบ่อย</strong> · รายละเอียดที่เกินสไลด์ (event loop, ชื่อ data type, snapshot/AOF, Multi-AZ, geospatial) <span class="badge warn">นอก notes</span></p>',
      refs: ['g-m09-engine', 'q-m09-engine-detail', 'q-m09-elasticache-choice2', 'q-m09-elasticache-choice', 'q-m09-redis-written']
    },
    {
      heading: 'ศัพท์ของ ElastiCache: node, cluster, shard',
      body: '<p class="analogy">node เหมือนล็อกเกอร์หนึ่งช่อง cluster คือตู้ล็อกเกอร์ทั้งแถว shard คือชุดช่องที่ผูกกัน (ช่องหลัก + ช่องสำรอง)</p>' +
        '<ul><li><strong>Node</strong> = RAM ขนาดคงที่ที่ปลอดภัยและต่อเข้าเครือข่าย</li><li><strong>Cluster</strong> = กลุ่มตรรกะของ node ตั้งแต่ 1 ตัวขึ้นไป</li><li>Memcached cluster ใช้การแบ่งข้อมูล (data partitioning) ไปเก็บคนละ node</li></ul>' +
        '<div class="fig-slot" data-i="0"></div>' +
        '<h3>ศัพท์เฉพาะของ Redis</h3>' +
        '<ul><li><strong>Redis shard</strong> (หรือ node group) = กลุ่ม node ที่เกี่ยวข้องกัน 1–6 ตัว (primary + replica)</li><li><strong>Redis cluster</strong> (หรือ replication group) = กลุ่มของ shard ตั้งแต่ 1 ตัวขึ้นไป</li><li>cluster mode ปิด: มี shard เดียว (primary + replica)</li><li>cluster mode เปิด: มีหลาย shard (แต่ละ shard มี primary + replica ของตัวเอง)</li></ul>' +
        '<div class="fig-slot" data-i="1"></div>',
      brief: '<ul><li><strong>Node</strong> = RAM ขนาดคงที่ ปลอดภัย ต่อเข้าเครือข่าย</li><li><strong>Cluster</strong> = กลุ่มตรรกะของ node ตั้งแต่ 1 ตัวขึ้นไป</li><li>Memcached cluster ใช้ data partitioning แบ่งข้อมูลไปเก็บคนละ node</li></ul><div class="fig-slot" data-i="0"></div><h3>ศัพท์เฉพาะของ Redis</h3><ul><li><strong>Redis shard</strong> (node group) = กลุ่ม node ที่เกี่ยวข้องกัน 1–6 ตัว (primary + replica)</li><li><strong>Redis cluster</strong> (replication group) = กลุ่มของ shard ตั้งแต่ 1 ตัวขึ้นไป</li><li>cluster mode ปิด: shard เดียว (primary + replica)</li><li>cluster mode เปิด: หลาย shard (แต่ละ shard มี primary + replica ของตัวเอง)</li></ul><div class="fig-slot" data-i="1"></div>',
      refs: ['l-m09-shard-nodes', 'q-m09-redis-written'],
      diagrams: [
        { title: 'Memcached cluster: แบ่งข้อมูลไปหลาย node', caption: 'ตามชื่อภาพสไลด์ Memcached cluster with data partitioning (key ตัวอย่างเป็นของผู้สรุป)', source: 'L346-356', svgId: 'm09-memcached-partition' },
        { title: 'Redis: shard และ cluster', caption: 'ตามสไลด์ ElastiCache terminology: Redis (cluster mode ปิดและเปิด)', source: 'L363-379', svgId: 'm09-redis-cluster' }
      ]
    },
    {
      heading: 'ElastiCache ทำงานในแอปอย่างไร: miss penalty และ TTL',
      body: '<p class="analogy">พนักงานเช็กกระดานก่อน ถ้าไม่มีค่อยเข้าไปเปิดแฟ้ม แล้วจดลงกระดานเผื่อคนถัดไป</p>' +
        '<h3>5 ขั้นของตัวอย่างในสไลด์</h3>' +
        '<ol><li>แอปขอข้อมูลจาก cache</li><li>ถ้ามี คืนข้อมูลจาก cache</li><li>ถ้าไม่มีใน cache หรือหมดอายุ ขอข้อมูลจาก database</li><li>database คืนค่าปัจจุบัน</li><li>แอปอัปเดต cache ด้วยค่าที่ได้มา</li></ol>' +
        '<p>ภาพในสไลด์มีกล่อง external API ด้วย (เช่น login ของบุคคลที่สาม หรือ data stream) แปลว่าใช้ cache หน้า API ภายนอกได้ในแบบเดียวกัน</p>' +
        '<div class="fig-slot" data-i="0"></div>' +
        '<h3>Cache miss penalty และ TTL</h3>' +
        '<ul><li>ถ้าข้อมูลไม่อยู่ใน cache หรือ TTL หมดอายุ แอปต้องไปขอจาก database แล้วเขียนกลับ cache</li><li>เวลาที่เสียเพิ่มตรงนี้เรียกว่า <strong>cache miss penalty</strong></li></ul>' +
        '<div class="fig-slot" data-i="1"></div>' +
        '<p><strong>ใจความหลักของส่วนนี้</strong> (ตามสไลด์ Key takeaways, L420-428)</p><ul><li>ElastiCache เป็น fully managed, <strong>in-memory</strong> data store ที่มี latency ระดับ <strong>sub-millisecond</strong></li><li>รองรับ engine in-memory caching แบบ open source 2 ตัว: <strong>Memcached</strong> และ <strong>Redis</strong></li><li><strong>node</strong> คือ RAM ขนาดคงที่ที่ปลอดภัยและต่อเครือข่าย ส่วน <strong>cluster</strong> คือกลุ่มตรรกะของ node ตั้งแต่ 1 ตัวขึ้นไป</li></ul>',
      brief: '<h3>5 ขั้นของตัวอย่างในสไลด์</h3><ol><li>แอปขอข้อมูลจาก cache</li><li>ถ้ามี คืนจาก cache</li><li>ถ้าไม่มีหรือหมดอายุ ขอจาก database</li><li>database คืนค่าปัจจุบัน</li><li>แอปอัปเดต cache ด้วยค่าที่ได้</li></ol><ul><li>สไลด์มีกล่อง external API ด้วย (เช่น login บุคคลที่สาม, data stream) = cache หน้า API ภายนอกได้เหมือนกัน</li></ul><div class="fig-slot" data-i="0"></div><h3>Cache miss penalty และ TTL</h3><ul><li>ไม่อยู่ใน cache หรือ TTL หมด → แอปขอจาก database แล้วเขียนกลับ cache</li><li>เวลาที่เสียเพิ่ม = <strong>cache miss penalty</strong></li></ul><div class="fig-slot" data-i="1"></div>',
      refs: [],
      diagrams: [
        { title: 'ElastiCache ทำงานในแอปอย่างไร', caption: 'ตามสไลด์ Example: ElastiCache in an application (เลข 1–5 ตามสไลด์)', source: 'L388-402', svgId: 'm09-elasticache-flow' },
        { title: 'Cache miss penalty', caption: 'ตามสไลด์ Cache miss penalty and TTL: เทียบเส้นทาง hit กับ miss', source: 'L404-418', svgId: 'm09-miss-penalty' }
      ]
    },
    {
      heading: 'กลยุทธ์ cache: Lazy loading กับ Write-through',
      body: '<p class="analogy">lazy loading = จดลงกระดานเมื่อมีคนถามแล้วไม่เจอ · write-through = จดกระดานทุกครั้งที่แก้แฟ้ม</p>' +
        '<p class="small muted">ในสไลด์เรื่องนี้อยู่ส่วนที่ 5 (หลัง CloudFront) ย้ายมาไว้ต่อจาก ElastiCache เพราะเป็นวิธีใช้ cache กับ database โดยตรง</p>' +
        '<p>มี 2 กลยุทธ์หลัก ต่างกันที่ <strong>เวลาที่ cache ถูกอัปเดต</strong></p>' +
        '<div class="table-wrap"><table><thead><tr><th></th><th>Lazy loading</th><th>Write-through</th></tr></thead><tbody><tr><td>cache ถูกอัปเดตเมื่อ</td><td>จำเป็นเท่านั้น (ตอน cache hit หรือ miss)</td><td>ทุกครั้งที่เขียนข้อมูลลง database</td></tr><tr><td>ใช้เมื่อ</td><td>ข้อมูลอ่านบ่อยแต่เขียนนาน ๆ ที</td><td>ข้อมูลต้องอัปเดตแบบ real time</td></tr><tr><td>ตัวอย่าง</td><td>user profile</td><td>leaderboard top 100 ของเกม<br>ข่าวยอดนิยม top 10</td></tr><tr><td>ข้อดี</td><td>ไม่มีข้อมูลที่ไม่ถูกใช้ค้างใน cache<br>node ล่มไม่ร้ายแรง (non-fatal)</td><td>ไม่มีข้อมูลเก่า (stale) ใน cache</td></tr><tr><td>ข้อเสีย</td><td>cache miss penalty<br>ข้อมูลอาจเก่า (stale) แก้ได้ด้วยการตั้ง TTL</td><td>write penalty (เขียนช้าลง เพราะต้องเขียน 2 ที่)<br>ข้อมูลหายเมื่อ node ล่ม (node ใหม่ไม่มีข้อมูลจนกว่าจะมีการเขียนครั้งถัดไป)<br>มีข้อมูลที่ไม่มีใครอ่านค้างใน cache<br>cache churn (เขียนลง cache ทั้งที่อาจไม่มีใครอ่าน เปลือง RAM)</td></tr></tbody></table></div>' +
        '<div class="callout"><span class="callout-title">เลือกยังไง</span><p>อ่านบ่อยแต่แก้น้อย → Lazy loading · ต้องการข้อมูลตรงกับ database เสมอ (real time) → Write-through · ไม่ว่าเลือกแบบไหน ควรตั้ง TTL กำกับไว้ด้วยเสมอ <span class="badge warn">นอก notes</span></p></div>' +
        '<h3>Lazy loading (หรือ cache-aside)</h3>' +
        '<ol><li>แอปรับ request ขอข้อมูล แล้วเช็ก cache (hit หรือ miss)</li><li>ถ้า miss: ขอข้อมูลจาก database</li><li>อัปเดต cache ด้วยข้อมูลที่ได้</li></ol>' +
        '<pre><code># Python\ndef get_user(user_id):\n    # เช็กที่ cache ก่อน\n    record = cache.get(user_id)\n    if record is None:\n        # ถ้าไม่เจอ ไปคิวรีที่ database\n        record = db.query("select * from users where id = ?", user_id)\n        # เก็บลง cache ไว้ใช้รอบหน้า\n        cache.set(user_id, record)\n    return record</code></pre>' +
        '<p>อ่านโค้ด: ถาม cache ก่อน ถ้าได้ <code>None</code> (miss) ค่อย query database แล้วเก็บผลลง cache ก่อนคืนค่า</p>' +
        '<div class="fig-slot" data-i="0"></div>' +
        '<h3>Write-through</h3>' +
        '<ol><li>แอปรับข้อมูลที่ต้องเขียน</li><li>อัปเดต database</li><li>อัปเดต cache ตาม</li></ol>' +
        '<pre><code># Python\ndef save_user(user_id, values):\n    # บันทึกลง database\n    record = db.query("update users ... where id = ?", user_id, values)\n    # อัปเดต cache ทันที\n    cache.set(user_id, record)\n    return record</code></pre>' +
        '<p>อ่านโค้ด: เขียน database ก่อน แล้ว push ค่าที่ได้เข้า cache ทันที ทุกครั้งที่บันทึก</p>' +
        '<div class="fig-slot" data-i="1"></div>' +
        '<p><strong>ใจความหลักของส่วนนี้</strong> (ตามสไลด์ Key takeaways, L1123-1131)</p><ul><li>caching มี 2 กลยุทธ์หลัก: <strong>lazy loading</strong> และ <strong>write-through</strong></li><li>lazy loading อัปเดต cache <strong>เมื่อจำเป็นเท่านั้น</strong> (hit หรือ miss)</li><li>write-through อัปเดต cache <strong>ทุกครั้งที่เขียน</strong> ลง database</li><li>เลือกกลยุทธ์ที่ <strong>ตรงกับ use case</strong> ของข้อมูล</li></ul>',
      brief: '<p class="small muted">lazy loading และ write-through ย้ายมาจากส่วนที่ 5 ของสไลด์ (หลัง CloudFront)</p><div class="table-wrap"><table><thead><tr><th></th><th>Lazy loading</th><th>Write-through</th></tr></thead><tbody><tr><td>cache อัปเดตเมื่อ</td><td>จำเป็นเท่านั้น (hit หรือ miss)</td><td>ทุกครั้งที่เขียนลง database</td></tr><tr><td>ใช้เมื่อ</td><td>อ่านบ่อย เขียนนาน ๆ ที</td><td>ต้องอัปเดตแบบ real time</td></tr><tr><td>ตัวอย่าง</td><td>user profile</td><td>leaderboard top 100 ของเกม, ข่าวยอดนิยม top 10</td></tr><tr><td>ข้อดี</td><td>ไม่มีข้อมูลที่ไม่ถูกใช้ค้างใน cache<br>node ล่มไม่ร้ายแรง (non-fatal)</td><td>ไม่มีข้อมูลเก่า (stale)</td></tr><tr><td>ข้อเสีย</td><td>cache miss penalty<br>ข้อมูลอาจ stale (แก้ด้วย TTL)</td><td>write penalty (เขียนช้าลง)<br>ข้อมูลหายเมื่อ node ล่ม (ไม่เติมใหม่จนกว่าจะเขียนอีก)<br>มีข้อมูลที่ไม่มีใครอ่านค้างใน cache<br>cache churn (เปลือง RAM)</td></tr></tbody></table></div><div class="callout"><span class="callout-title">เลือกยังไง</span><p>อ่านบ่อยแต่แก้น้อย → Lazy loading · ต้องตรงกับ database เสมอ (real time) → Write-through · ตั้ง TTL กำกับเสมอ <span class="badge warn">นอก notes</span></p></div><h3>Lazy loading (cache-aside)</h3><ol><li>แอปรับ request แล้วเช็ก cache (hit หรือ miss)</li><li>ถ้า miss ขอข้อมูลจาก database</li><li>อัปเดต cache ด้วยข้อมูลที่ได้</li></ol><p class="small muted">โค้ดตัวอย่าง: ถาม cache ก่อน ถ้าไม่มีค่อย query database แล้ว cache.set</p><div class="fig-slot" data-i="0"></div><h3>Write-through</h3><ol><li>แอปรับข้อมูลที่ต้องเขียน</li><li>อัปเดต database</li><li>อัปเดต cache ตาม</li></ol><p class="small muted">โค้ดตัวอย่าง: เขียน database ก่อน แล้ว cache.set ทันที</p><div class="fig-slot" data-i="1"></div>',
      refs: ['g-m09-strategy', 'q-m09-strategy', 'q-m09-leaderboard'],
      diagrams: [
        { title: 'Lazy loading', caption: 'ตามสไลด์ Lazy loading: hit ตอบเลย, miss อ่าน database แล้วเติม cache', source: 'L1013-1042', svgId: 'm09-lazy-loading' },
        { title: 'Write-through', caption: 'ตามสไลด์ Write-through: อัปเดต database แล้วอัปเดต cache', source: 'L1072-1085', svgId: 'm09-write-through' }
      ]
    },
    {
      heading: 'Lab 9.1: เพิ่ม ElastiCache ให้เว็บคาเฟ่',
      body: '<p><strong>สถานการณ์</strong></p>' +
        '<ul><li>ข้อมูลสต็อกเมล็ดกาแฟของ supplier ถูกรวมเข้าเว็บคาเฟ่แล้ว แต่ลูกค้าบ่นว่าหน้าแสดงช้า</li><li>Olivia ลูกค้าที่เป็น AWS consultant แนะนำให้เพิ่ม database caching</li><li>เครื่องมือที่แนะนำคือ ElastiCache ซึ่งคล้าย Aurora Serverless ตรงที่ deploy และดูแล cache cluster ง่ายขึ้น</li></ul>' +
        '<details><summary>งาน 8 ข้อใน Lab (กดเพื่อดู)</summary><ol><li>เตรียม development environment</li><li>ตั้งค่า subnet ให้ ElastiCache ใช้</li><li>สร้าง ElastiCache cluster</li><li>โหลด record จาก database เข้า cache</li><li>อัปเดตข้อมูล</li><li>สร้าง record ใหม่</li><li>ลบ record</li><li>อัปเดต application container</li></ol></details>' +
        '<p>ผลลัพธ์สุดท้าย: coffee supplier application บน Elastic Beanstalk ส่ง query ไปยัง ElastiCache for Memcached และรับ response กลับ โดยมี Aurora Serverless เป็น database ด้านหลัง</p>' +
        '<div class="fig-slot" data-i="0"></div>' +
        '<p class="small muted">ใช้เวลาประมาณ 90 นาที · สไลด์ Lab debrief เป็นภาพล้วน ไม่มีข้อความให้สรุป</p>',
      brief: '<ul><li>สถานการณ์: ข้อมูลสต็อกเมล็ดกาแฟของ supplier รวมเข้าเว็บคาเฟ่แล้ว แต่หน้าแสดงช้า</li><li>Olivia (AWS consultant) แนะนำให้เพิ่ม database caching ด้วย ElastiCache ซึ่งคล้าย Aurora Serverless ตรงที่ deploy และดูแลง่าย</li><li>ผลลัพธ์: coffee supplier application บน Elastic Beanstalk ส่ง query ไป ElastiCache for Memcached โดยมี Aurora Serverless เป็น database ด้านหลัง</li><li>ใช้เวลาประมาณ 90 นาที</li></ul><div class="fig-slot" data-i="0"></div>',
      refs: [],
      diagrams: [
        { title: 'Lab 9.1: ก่อนและหลังใส่ ElastiCache', caption: 'ภาพ "หลัง" ตามสไลด์ Lab: Final product ภาพ "ก่อน" เรียบเรียงจากสถานการณ์ใน scenario', source: 'L451-526', svgId: 'm09-lab91-before-after' }
      ]
    },
    {
      heading: 'ปัญหาเสิร์ฟข้อมูลทั่วโลก และ CDN',
      body: '<p class="analogy">เหมือนร้านสาขาใกล้บ้าน แทนการสั่งของจากโรงงานที่อยู่ไกลอีกซีกโลก</p>' +
        '<h3>ปัญหา: network latency สูงระหว่าง origin กับผู้ใช้บางกลุ่ม</h3>' +
        '<ul><li>ระยะทางระหว่าง origin กับผู้ใช้ยิ่งไกล ประสิทธิภาพยิ่งแย่</li><li>จำนวน hop (router ที่ผ่าน) ระหว่าง origin กับผู้ใช้ยิ่งมาก ประสิทธิภาพยิ่งแย่</li></ul>' +
        '<h3>CDN (content delivery network)</h3>' +
        '<ul><li>เก็บสำเนาของ resource แบบ static ไว้ที่จุดใกล้ผู้ใช้ (POP)</li><li>ส่ง dynamic content ที่เหมาะกับตำแหน่งทางภูมิศาสตร์ของผู้ใช้</li><li>ผลคือ network latency ต่ำลง</li></ul>' +
        '<div class="fig-slot" data-i="0"></div>',
      brief: '<h3>ปัญหา: network latency สูงระหว่าง origin กับผู้ใช้</h3><ul><li>ระยะทางไกลยิ่งแย่</li><li>จำนวน hop (router ที่ผ่าน) มากยิ่งแย่</li></ul><h3>CDN (content delivery network)</h3><ul><li>เก็บสำเนา static resource ไว้ที่จุดใกล้ผู้ใช้ (POP)</li><li>ส่ง dynamic content ที่เหมาะกับตำแหน่งภูมิศาสตร์ของผู้ใช้</li><li>ผล: network latency ต่ำลง</li></ul><div class="fig-slot" data-i="0"></div>',
      refs: [],
      diagrams: [
        { title: 'CDN ลดระยะทางและจำนวน hop', caption: 'ตามสไลด์ Challenges of serving data globally และ What is a CDN?', source: 'L545-567', svgId: 'm09-cdn' }
      ]
    },
    {
      heading: 'Amazon CloudFront: ทำงานอย่างไร และ distribution 3 ชนิด',
      body: '<p class="analogy">เหมือนเครือข่ายร้านสาขาที่ตุนของยอดนิยมไว้ทุกสาขา ลูกค้าไปสาขาที่ใกล้ที่สุด</p>' +
        '<p>CloudFront คือบริการ <strong>CDN</strong> ที่ส่งข้อมูล วิดีโอ แอปพลิเคชัน และ API ให้ลูกค้าทั่วโลกอย่างปลอดภัย ด้วย <strong>low latency</strong> และ <strong>high transfer speed</strong></p>' +
        '<ul><li>ปรับให้เหมาะกับประสิทธิภาพและ scale</li><li>มีฟีเจอร์ security ในตัว</li><li>เชื่อมลึกกับ AWS service อื่น</li><li>ปรับแต่งได้สูง</li></ul>' +
        '<h3>CloudFront ทำงาน 5 ขั้น</h3>' +
        '<ol><li>ผู้ใช้ขอไฟล์</li><li>DNS ส่งไปยัง edge location ของ CloudFront ที่ดีที่สุด</li><li>CloudFront ตรวจ cache ถ้ามีไฟล์ก็คืนให้ ถ้าไม่มีก็ขอจาก origin</li><li>origin (เช่น S3 bucket หรือ HTTP server) ส่งไฟล์กลับมาที่ edge location</li><li>CloudFront ส่งไฟล์ให้ผู้ใช้ และเก็บไฟล์ลง cache</li></ol>' +
        '<div class="fig-slot" data-i="0"></div>' +
        '<h3>Distribution 3 ชนิด</h3>' +
        '<div class="table-wrap"><table><thead><tr><th>ชนิด</th><th>ใช้กับ</th><th>origin</th><th>เงื่อนไข</th></tr></thead><tbody><tr><td><strong>Web content</strong></td><td>ส่งเนื้อหาผ่าน HTTP/HTTPS ทั้ง static และ dynamic</td><td>HTTP server หรือ S3 bucket</td><td>—</td></tr><tr><td><strong>Video on demand</strong></td><td>วิดีโอที่ผู้ใช้ดูเมื่อไรก็ได้</td><td>HTTP server หรือ S3 bucket</td><td>ต้อง encode วิดีโอให้รองรับ streaming</td></tr><tr><td><strong>Live event</strong></td><td>ถ่ายทอดสด</td><td>AWS Elemental MediaStore หรือ AWS Elemental MediaPackage</td><td>ต้อง encode และ compress ให้เหมาะกับอุปกรณ์ที่ดู</td></tr></tbody></table></div>',
      brief: '<p>CloudFront = <strong>CDN</strong> ส่งข้อมูล วิดีโอ แอป และ API ทั่วโลกอย่างปลอดภัย ด้วย <strong>low latency</strong> และ <strong>high transfer speed</strong></p><ul><li>ปรับให้เหมาะกับประสิทธิภาพและ scale</li><li>มี security ในตัว</li><li>เชื่อมลึกกับ AWS service อื่น</li><li>ปรับแต่งได้สูง</li></ul><h3>ทำงาน 5 ขั้น</h3><ol><li>ผู้ใช้ขอไฟล์</li><li>DNS ส่งไปยัง edge location ที่ดีที่สุด</li><li>CloudFront ตรวจ cache มีก็คืน ไม่มีก็ขอจาก origin</li><li>origin (เช่น S3 bucket หรือ HTTP server) ส่งไฟล์มาที่ edge location</li><li>CloudFront ส่งไฟล์ให้ผู้ใช้ และเก็บลง cache</li></ol><div class="fig-slot" data-i="0"></div><h3>Distribution 3 ชนิด</h3><div class="table-wrap"><table><thead><tr><th>ชนิด</th><th>ใช้กับ</th><th>origin</th><th>เงื่อนไข</th></tr></thead><tbody><tr><td><strong>Web content</strong></td><td>HTTP/HTTPS ทั้ง static และ dynamic</td><td>HTTP server หรือ S3 bucket</td><td>-</td></tr><tr><td><strong>Video on demand</strong></td><td>วิดีโอที่ดูเมื่อไรก็ได้</td><td>HTTP server หรือ S3 bucket</td><td>ต้อง encode ให้รองรับ streaming</td></tr><tr><td><strong>Live event</strong></td><td>ถ่ายทอดสด</td><td>AWS Elemental MediaStore หรือ MediaPackage</td><td>ต้อง encode และ compress ให้เหมาะกับอุปกรณ์</td></tr></tbody></table></div>',
      refs: ['g-m09-distribution', 'q-m09-web-written', 'q-m09-design'],
      diagrams: [
        { title: 'CloudFront ทำงาน 5 ขั้นตอน', caption: 'ตามสไลด์ How CloudFront works (เลข 1–5 ตามสไลด์)', source: 'L598-624', svgId: 'm09-cloudfront-flow' }
      ]
    },
    {
      heading: 'Cache key และ cache policy',
      body: '<p class="analogy">เหมือนเลขที่ช่องเก็บของ ถ้าเลขตรงกันก็ได้ของชิ้นเดิม ไม่ว่าใครมาเอา</p>' +
        '<p><strong>Cache key</strong> คือตัวระบุเฉพาะของแต่ละ object ใน cache</p>' +
        '<ul><li>ค่าเริ่มต้นคือ <strong>domain name ของ distribution + URL path</strong> ของ object ที่ขอ</li><li>ค่าอื่นใน request (query string, header, cookie) ไม่รวมใน cache key โดยค่าเริ่มต้น</li><li>ตัวอย่างในสไลด์: key คือ <code>d111111abcdef8.cloudfront.net</code> + <code>/content/stories/example-story.html</code></li><li>Request 1 ไม่เจอ key ใน cache → <strong>cache miss</strong></li><li>Request 2 มี query string, cookie, user-agent ต่างจาก Request 1 แต่ key เหมือนกัน → <strong>cache hit</strong></li></ul>' +
        '<div class="fig-slot" data-i="0"></div>' +
        '<p><strong>ข้อควรระวัง:</strong> เพราะค่าเริ่มต้นไม่รวม query string การเรียก <code>page.html?user=A</code> กับ <code>page.html?user=B</code> จึงถูกมองเป็นไฟล์เดียวกัน และคนที่สองอาจได้ผลลัพธ์ของคนแรก ถ้าค่าเหล่านั้นทำให้ผลต่างกัน ต้องใส่เข้า cache key ผ่าน cache policy <span class="badge warn">นอก notes</span></p>' +
        '<h3>คุม cache key ด้วย cache policy</h3>' +
        '<div class="table-wrap"><table><thead><tr><th>หมวดการตั้งค่า</th><th>อธิบาย</th><th>ค่าที่ตั้งได้</th></tr></thead><tbody><tr><td><strong>Policy information</strong></td><td>อธิบาย policy</td><td>ชื่อ policy (ใช้ผูก policy กับ caching behavior)<br>comment</td></tr><tr><td><strong>Time to live (TTL) settings</strong></td><td>ทำงานร่วมกับ header Cache-Control และ Expires (ถ้ามีใน response ของ origin) กำหนดว่า object อยู่ใน cache ได้นานแค่ไหนก่อนที่ CloudFront จะเช็กกับ origin</td><td>Minimum TTL<br>Maximum TTL<br>Default TTL</td></tr><tr><td><strong>Cache key settings</strong></td><td>ระบุค่าใน viewer request ที่ CloudFront ใส่ใน cache key ค่าเหล่านี้ถูกส่งไปใน request ที่ CloudFront ส่งให้ origin ด้วย (เรียก origin request)</td><td>URL query string<br>HTTP header<br>cookie<br>compression support (เช่น Gzip, Brotli)</td></tr></tbody></table></div>' +
        '<h3>Cache hit ratio และการออกแบบ cache key</h3>' +
        '<p><strong>Cache hit ratio</strong> คือสัดส่วนคำขอที่ตอบจาก cache ได้โดยไม่ต้องไปถึง origin หัวใจคือออกแบบ <strong>cache key ให้มีขนาดน้อยที่สุด</strong></p>' +
        '<ul><li>cache key ทำงานเหมือนคำค้นใน dictionary ต้อง <strong>exact match</strong> ต่างกันตัวอักษรเดียวก็คนละ key</li><li>ถ้า key ละเอียดเกินไป (เช่นใส่ <code>User-Agent</code> หรือ cookie ที่ผันแปรสูง) ไฟล์เดียวกันจะแตกเป็นหลายชุด เรียกว่า <strong>cache fragmentation</strong> ทำให้ origin ถูกเรียกซ้ำ ๆ และ hit ตกฮวบ</li><li>key ยิ่งสั้น ยิ่งแชร์ไฟล์กันได้มาก</li></ul>' +
        '<div class="fig-slot" data-i="1"></div>' +
        '<p><strong>4 เทคนิคเพิ่ม hit ratio</strong></p>' +
        '<ol><li><strong>ใส่เฉพาะค่าที่จำเป็น:</strong> เลือก query string, header, cookie ที่ต้องใช้แสดงผลจริงเข้า cache key เท่านั้น</li><li><strong>เพิ่ม TTL:</strong> ปรับ Default/Maximum TTL ใน cache policy หรือให้ origin ส่ง <code>Cache-Control: max-age</code> นานขึ้น</li><li><strong>แยก cache behavior:</strong> static asset (ภาพ, CSS) ไม่ใส่ค่าใดใน key และตั้ง TTL นาน ส่วน dynamic content แยกไปอีก behavior</li><li><strong>Normalize request:</strong> ใช้ CloudFront Functions ปรับตัวพิมพ์เล็ก/ใหญ่และเรียงลำดับ query string ให้เป็นแบบเดียวกันก่อนค้น cache</li></ol>' +
        '<p class="small muted">หัวข้อย่อยนี้เรียบเรียงจากไฟล์สรุป ไม่ได้อยู่ในสไลด์ <span class="badge warn">นอก notes</span></p>',
      brief: '<p><strong>Cache key</strong> = ตัวระบุเฉพาะของแต่ละ object ใน cache</p><ul><li>ค่าเริ่มต้น = <strong>domain name ของ distribution + URL path</strong></li><li>query string, header, cookie ไม่รวมใน cache key โดยค่าเริ่มต้น</li><li>ตัวอย่าง: key = <code>d111111abcdef8.cloudfront.net</code> + <code>/content/stories/example-story.html</code></li><li>Request 1 ไม่เจอ key → <strong>cache miss</strong></li><li>Request 2 มี query string, cookie, user-agent ต่างไป แต่ key เหมือนเดิม → <strong>cache hit</strong></li></ul><div class="fig-slot" data-i="0"></div><p><strong>ข้อควรระวัง:</strong> key เริ่มต้นไม่รวม query string ดังนั้น <code>page.html?user=A</code> กับ <code>?user=B</code> ถูกมองเป็นไฟล์เดียวกัน (ต้องใส่ค่าเข้า key ผ่าน cache policy ถ้าผลต่างกัน) <span class="badge warn">นอก notes</span></p><h3>คุม cache key ด้วย cache policy</h3><div class="table-wrap"><table><thead><tr><th>หมวด</th><th>อธิบาย</th><th>ค่าที่ตั้งได้</th></tr></thead><tbody><tr><td><strong>Policy information</strong></td><td>อธิบาย policy</td><td>ชื่อ policy (ผูกกับ caching behavior), comment</td></tr><tr><td><strong>TTL settings</strong></td><td>ทำงานร่วมกับ header Cache-Control และ Expires (ถ้ามีใน response ของ origin) กำหนดว่า object อยู่ใน cache ได้นานแค่ไหนก่อนเช็กกับ origin</td><td>Minimum TTL<br>Maximum TTL<br>Default TTL</td></tr><tr><td><strong>Cache key settings</strong></td><td>ค่าใน viewer request ที่ใส่ใน cache key และถูกส่งไปใน origin request ด้วย</td><td>URL query string<br>HTTP header<br>cookie<br>compression support (Gzip, Brotli)</td></tr></tbody></table></div><h3>Cache hit ratio และการออกแบบ cache key</h3><ul><li><strong>Cache hit ratio</strong> = สัดส่วนคำขอที่ตอบจาก cache ได้ ทำให้สูงด้วย <strong>cache key ที่น้อยที่สุด</strong></li><li>key ต้อง <strong>exact match</strong> ต่างตัวเดียวก็คนละ key</li><li>key ละเอียดเกิน (เช่น <code>User-Agent</code>) → ไฟล์เดียวแตกเป็นหลายชุด = <strong>cache fragmentation</strong> origin ถูกเรียกซ้ำ hit ตกฮวบ</li><li>key ยิ่งสั้น ยิ่งแชร์ได้มาก</li></ul><div class="fig-slot" data-i="1"></div><p><strong>4 เทคนิคเพิ่ม hit ratio</strong></p><ol><li>ใส่เฉพาะ query string/header/cookie ที่จำเป็นเข้า key</li><li>เพิ่ม TTL (cache policy หรือ <code>Cache-Control: max-age</code>)</li><li>แยก cache behavior ระหว่าง static กับ dynamic</li><li>normalize request ด้วย CloudFront Functions (ตัวพิมพ์เล็ก/ใหญ่, เรียงลำดับ query string)</li></ol><p class="small muted">หัวข้อย่อยนี้เรียบเรียงจากไฟล์สรุป <span class="badge warn">นอก notes</span></p>',
      refs: ['q-m09-cachekey'],
      diagrams: [
        { title: 'Cache key เริ่มต้นของ CloudFront', caption: 'ตามสไลด์ Understanding the cache key: ค่าเริ่มต้นนับแค่ domain + URL path', source: 'L674-691', svgId: 'm09-cache-key' },
        { title: 'Cache key สั้น เทียบกับ key ที่มี User-Agent', caption: 'key สั้นแชร์ไฟล์ได้ทุกเบราว์เซอร์ key ยาวทำให้ cache แตกเป็นหลายชุด (เรียบเรียงจากไฟล์สรุป)', source: 'สรุปผู้เรียบเรียง', supplement: true, svgId: 'm09-key-fragment' }
      ]
    },
    {
      heading: 'ไฟล์ใน cache หมดอายุอย่างไร',
      body: '<p class="analogy">เหมือนวันหมดอายุบนนมกล่อง พอหมดแล้วต้องถามร้านต้นทางว่ามีของใหม่ไหม</p>' +
        '<ul><li>ถ้ายังไม่ถึงเวลาหมดอายุของ img4.jpg → คืนไฟล์จาก cache</li><li>ถ้าหมดอายุ → ขอเวอร์ชันล่าสุดจาก origin</li><li>ถ้าไฟล์ใน cache ตรงกับเวอร์ชันล่าสุดที่ origin → origin ตอบ <strong>304 Not Modified</strong> (CloudFront ใช้ไฟล์เดิมต่อ ไม่ต้องโหลดใหม่ทั้งไฟล์)</li><li>ถ้าไม่ตรง → ส่งเวอร์ชันล่าสุดของ img4.jpg</li><li>ระยะเวลาเริ่มต้นคือ <strong>24 ชั่วโมง</strong></li></ul>' +
        '<div class="fig-slot" data-i="0"></div>' +
        '<h3>ปรับระยะเวลาได้ 2 ที่</h3>' +
        '<div class="table-wrap"><table><thead><tr><th>ตั้งที่</th><th>ทำอย่างไร</th><th>ผลกับอะไร</th></tr></thead><tbody><tr><td><strong>ใน CloudFront</strong></td><td>ตั้ง Minimum TTL, Maximum TTL, Default TTL ใน cache policy</td><td>ไฟล์ที่ผูกกับ policy นั้น</td></tr><tr><td><strong>ใน response header</strong></td><td>ใส่ header <code>Cache-Control</code> (เช่น <code>max-age=3600</code> = เก็บ 1 ชั่วโมง) หรือ <code>Expires</code></td><td>เปลี่ยนอายุของไฟล์แต่ละไฟล์<br>หรือไฟล์ทั้งหมดที่ตรงกับ path pattern</td></tr></tbody></table></div>',
      brief: '<ul><li>ยังไม่หมดอายุ → คืนไฟล์จาก cache</li><li>หมดอายุ → ขอเวอร์ชันล่าสุดจาก origin</li><li>ไฟล์ใน cache ตรงกับ origin → origin ตอบ <strong>304 Not Modified</strong> (ใช้ไฟล์เดิมต่อ ไม่โหลดใหม่)</li><li>ไม่ตรง → ส่งเวอร์ชันล่าสุด</li><li>ระยะเริ่มต้น = <strong>24 ชั่วโมง</strong></li></ul><div class="fig-slot" data-i="0"></div><h3>ปรับระยะเวลาได้ 2 ที่</h3><div class="table-wrap"><table><thead><tr><th>ตั้งที่</th><th>ทำอย่างไร</th><th>ผลกับ</th></tr></thead><tbody><tr><td><strong>ใน CloudFront</strong></td><td>Minimum / Maximum / Default TTL ใน cache policy</td><td>ไฟล์ที่ผูกกับ policy นั้น</td></tr><tr><td><strong>ใน response header</strong></td><td>header <code>Cache-Control</code> (เช่น <code>max-age=3600</code> = 1 ชั่วโมง) หรือ <code>Expires</code></td><td>ไฟล์แต่ละไฟล์ หรือทุกไฟล์ที่ตรง path pattern</td></tr></tbody></table></div>',
      refs: ['l-m09-default-ttl'],
      diagrams: [
        { title: 'ไฟล์ใน CloudFront cache หมดอายุแล้วเกิดอะไรขึ้น', caption: 'ตามสไลด์ Managing cached file expiration', source: 'L750-762', svgId: 'm09-expiry' }
      ]
    },
    {
      heading: 'ใช้ CloudFront เร่งการโอนไฟล์ Amazon S3',
      body: '<p class="analogy">เหมือนฝากพัสดุที่ศูนย์รับของใกล้บ้านให้ขนส่งทางด่วนต่อ ได้ผลมากเมื่อบ้านอยู่ไกลคลัง</p>' +
        '<p>ใช้เครือข่าย edge location ของ CloudFront ช่วยเร่งการ <strong>upload</strong> ไฟล์ขนาดใหญ่จากทั่วโลกขึ้น S3 bucket</p>' +
        '<ul><li>เปิด transfer acceleration ที่ S3 bucket</li><li>ผู้ใช้ที่อยู่ไกล bucket: มีโอกาสเร็วขึ้น เพราะใช้เส้นทางเครือข่ายที่ปรับให้เหมาะ (optimized network path)</li><li>ผู้ใช้ที่อยู่ใกล้ bucket อยู่แล้ว: เร็วขึ้นเล็กน้อย หรืออาจช้าลง</li></ul>' +
        '<div class="fig-slot" data-i="0"></div>',
      brief: '<p>เร่งการ <strong>upload</strong> ไฟล์ใหญ่จากทั่วโลกขึ้น S3 ผ่าน edge ของ CloudFront</p><ul><li>เปิด transfer acceleration ที่ S3 bucket</li><li>ผู้ใช้ไกล bucket: มีโอกาสเร็วขึ้น เพราะใช้ optimized network path</li><li>ผู้ใช้ใกล้ bucket อยู่แล้ว: เร็วขึ้นเล็กน้อย หรืออาจช้าลง</li></ul><div class="fig-slot" data-i="0"></div>',
      refs: [],
      diagrams: [
        { title: 'เร่งการโอนไฟล์ S3 ด้วย CloudFront', caption: 'ตามสไลด์ Using CloudFront to accelerate Amazon S3 file transfer', source: 'L771-778', svgId: 'm09-s3-accel' }
      ]
    },
    {
      heading: 'Edge function: Lambda@Edge กับ CloudFront Functions',
      body: '<p class="analogy">เหมือนพนักงานหน้าด่านของสาขา ที่แก้คำสั่งหรือชี้ทางให้ก่อนส่งต่อไปข้างใน</p>' +
        '<ul><li>ใช้ edge function ปรับแต่งวิธีที่ distribution ประมวลผล request และ response</li><li>โค้ดรันใกล้ผู้ชม (viewer) เพื่อลด latency</li><li>เขียนและจัดการได้ 2 แบบ: <strong>Lambda@Edge</strong> และ <strong>CloudFront Functions</strong></li></ul>' +
        '<div class="fig-slot" data-i="0"></div>' +
        '<h3>Lambda@Edge</h3>' +
        '<ol><li>นักพัฒนาผูก Lambda function ให้ทำงานตาม event ของ CloudFront distribution</li><li>Lambda replicate function ไปยัง CloudFront Regional edge location</li><li>เมื่อ event ที่ตั้งไว้เกิดขึ้น function ถูกเรียกที่ Regional edge cache</li></ol>' +
        '<p>ตัวอย่างในสไลด์: เลือก origin ตามประเทศของผู้ชม</p>' +
        '<pre><code>def lambda_handler(event, context):\n    request = event[\'Records\'][0][\'cf\'][\'request\']\n    viewerCountry = request[\'headers\'].get(\'cloudfront-viewer-country\')\n    if viewerCountry:\n        countryCode = viewerCountry[0][\'value\']\n        if countryCode == \'GB\' or countryCode == \'DE\' or countryCode == \'IE\':\n            domainName = \'eu.example.com\'\n            request[\'origin\'][\'custom\'][\'domainName\'] = domainName\n            request[\'headers\'][\'host\'] = [{\'key\': \'host\', \'value\': domainName}]\n    return request</code></pre>' +
        '<p>อ่านโค้ด: ถ้าผู้ชมมาจาก GB, DE หรือ IE ให้เปลี่ยน origin และ host header ไปที่ <code>eu.example.com</code> (origin ของยุโรป) นอกนั้นส่ง request ต่อตามเดิม</p>' +
        '<h3>CloudFront Functions</h3>' +
        '<ol><li>นักพัฒนา publish function แล้วผูกกับ event ของ CloudFront distribution</li><li>CloudFront ดัก request และ response ที่ edge location แล้วส่งให้ function</li></ol>' +
        '<p>ตัวอย่างในสไลด์: redirect ไปหน้า CloudFront ของ AWS (ผูกกับ event ชนิด viewer request)</p>' +
        '<pre><code>function handler(event) {\n    // NOTE: This example function is for a viewer request event type.\n    // Choose viewer request for event type when you associate this function\n    // with a distribution.\n    var response = {\n        statusCode: 302,\n        statusDescription: \'Found\',\n        headers: {\n            \'cloudfront-functions\': { value: \'generated-by-CloudFront-Functions\' },\n            \'location\': { value: \'https://aws.amazon.com/cloudfront/\' }\n        }\n    };\n    return response;\n}</code></pre>' +
        '<p>อ่านโค้ด: ตอบ status 302 พร้อม header <code>location</code> ทำให้ผู้ที่เปิด URL ของ distribution (<code>https://d111111abcdef8.cloudfront.net/</code>) ถูกส่งต่อไป <code>https://aws.amazon.com/cloudfront/</code></p>' +
        '<div class="fig-slot" data-i="1"></div>' +
        '<h3>เลือกอันไหน</h3>' +
        '<div class="table-wrap"><table><thead><tr><th></th><th>Lambda@Edge</th><th>CloudFront Functions</th></tr></thead><tbody><tr><td>เหมาะกับ</td><td>function ซับซ้อน และ logic ของแอปเต็มรูปแบบ</td><td>function เบา รันสั้น</td></tr><tr><td>สร้างและทดสอบใน CloudFront ทั้งหมดได้ไหม</td><td>ไม่ได้</td><td>ได้</td></tr><tr><td>เป็น</td><td>ส่วนต่อยอดของ Lambda</td><td>ฟีเจอร์ native ของ CloudFront</td></tr><tr><td>ภาษา</td><td>runtime Node.js หรือ Python</td><td>JavaScript (ECMAScript 5.1)</td></tr><tr><td>event ที่จับได้</td><td>viewer request/response และ origin request/response</td><td>viewer request/response</td></tr><tr><td>ขนาด</td><td>duration, memory และขนาด function ใหญ่กว่า CloudFront Functions (สไลด์ไม่ให้ตัวเลข)</td><td>duration ระดับ sub-millisecond<br>memory 2 MB<br>ขนาด function 10 KB</td></tr><tr><td>ตัวเลขของ Lambda@Edge</td><td>viewer trigger: 5 วินาที / 128 MB / 1 MB<br>origin trigger: 30 วินาที / สูงสุด 10,240 MB / 50 MB</td><td>-</td></tr><tr><td>network / file system</td><td>ต่อ network เรียก API ภายนอกหรือ AWS service อื่นได้</td><td>ไม่มี (ต่อ network ออกไม่ได้ ไม่มี disk)</td></tr><tr><td>ที่รัน</td><td>CloudFront Regional edge cache</td><td>CloudFront edge location ทั่วโลก (หลักร้อยจุด)</td></tr><tr><td>ตัวอย่างงาน</td><td>resize ภาพทันที, authentication หนัก ๆ, เชื่อมต่อ database</td><td>URL rewrite/redirect, ปรับ header, validate token เบื้องต้น</td></tr></tbody></table></div>' +
        '<p class="small muted">สไลด์ไม่ให้ตัวเลขของ Lambda@Edge และไม่ได้ลงรายละเอียดแถว network, ที่รัน, ตัวอย่างงาน แถวเหล่านี้กับ ECMAScript 5.1 ของ CloudFront Functions มาจากไฟล์สรุปและเอกสาร AWS <span class="badge warn">นอก notes</span></p>' +
        '<div class="callout"><span class="callout-title">จำง่าย ๆ</span><p>งานเล็ก เร็ว JavaScript จับแค่ฝั่ง viewer → CloudFront Functions · งานซับซ้อน หรือต้องจับฝั่ง origin → Lambda@Edge</p></div>' +
        '<p><strong>ใจความหลักของส่วนนี้</strong> (ตามสไลด์ Key takeaways, L952-960)</p><ul><li>CloudFront เป็น <strong>CDN</strong> ที่ส่งข้อมูลทั่วโลกด้วย <strong>low latency</strong> และ <strong>high transfer speed</strong></li><li>distribution ส่งได้ทั้ง <strong>web</strong>, <strong>video</strong> และ <strong>live streaming</strong></li><li><strong>cache key</strong> คือ <strong>ตัวระบุเฉพาะ</strong> ของแต่ละ object ใน cache</li><li>ใช้ <strong>CloudFront Functions</strong> และ <strong>Lambda@Edge</strong> ปรับแต่งวิธีที่ distribution ประมวลผล request และ response</li></ul>',
      brief: '<ul><li>ใช้ edge function ปรับวิธีที่ distribution ประมวลผล request และ response</li><li>โค้ดรันใกล้ผู้ชม (viewer) เพื่อลด latency</li><li>มี 2 แบบ: <strong>Lambda@Edge</strong> และ <strong>CloudFront Functions</strong></li></ul><div class="fig-slot" data-i="0"></div><h3>Lambda@Edge</h3><ol><li>ผูก Lambda function กับ event ของ CloudFront distribution</li><li>Lambda replicate function ไปยัง CloudFront Regional edge location</li><li>event เกิดขึ้น → function ถูกเรียกที่ Regional edge cache</li></ol><p class="small muted">ตัวอย่างโค้ด: เลือก origin ตามประเทศของผู้ชม (GB, DE, IE → eu.example.com)</p><h3>CloudFront Functions</h3><ol><li>publish function แล้วผูกกับ event ของ distribution</li><li>CloudFront ดัก request และ response ที่ edge location แล้วส่งให้ function</li></ol><p class="small muted">ตัวอย่างโค้ด: redirect ด้วย status <code>302</code> ผูกกับ viewer request</p><div class="fig-slot" data-i="1"></div><h3>เลือกอันไหน</h3><div class="table-wrap"><table><thead><tr><th></th><th>Lambda@Edge</th><th>CloudFront Functions</th></tr></thead><tbody><tr><td>เหมาะกับ</td><td>function ซับซ้อน, logic ของแอปเต็มรูปแบบ</td><td>function เบา รันสั้น</td></tr><tr><td>สร้างและทดสอบใน CloudFront ทั้งหมด</td><td>ไม่ได้</td><td>ได้</td></tr><tr><td>เป็น</td><td>ส่วนต่อยอดของ Lambda</td><td>ฟีเจอร์ native ของ CloudFront</td></tr><tr><td>ภาษา</td><td>Node.js หรือ Python</td><td>JavaScript</td></tr><tr><td>event</td><td>viewer request/response และ origin request/response</td><td>viewer request/response</td></tr><tr><td>ขนาด</td><td>duration, memory, function size ใหญ่กว่า (สไลด์ไม่ให้ตัวเลข)</td><td>duration sub-millisecond<br>memory 2 MB<br>ขนาด function 10 KB</td></tr><tr><td>ตัวเลขของ Lambda@Edge</td><td>viewer: 5 วินาที / 128 MB / 1 MB<br>origin: 30 วินาที / สูงสุด 10,240 MB / 50 MB</td><td>-</td></tr><tr><td>network / file system</td><td>ต่อ network เรียก API ภายนอก/AWS service ได้</td><td>ไม่มี</td></tr><tr><td>ที่รัน</td><td>Regional edge cache</td><td>edge location ทั่วโลก</td></tr><tr><td>ตัวอย่างงาน</td><td>resize ภาพ, authentication หนัก, ต่อ database</td><td>URL rewrite/redirect, ปรับ header, validate token เบื้องต้น</td></tr></tbody></table></div><p class="small muted">แถวตัวเลข Lambda@Edge, network, ที่รัน, ตัวอย่างงาน และ ECMAScript 5.1 ของ CloudFront Functions ไม่อยู่ในสไลด์ <span class="badge warn">นอก notes</span></p><div class="callout"><span class="callout-title">จำง่าย ๆ</span><p>งานเล็ก เร็ว JavaScript จับแค่ฝั่ง viewer → CloudFront Functions · งานซับซ้อน หรือต้องจับฝั่ง origin → Lambda@Edge</p></div>',
      refs: ['g-m09-edge', 'l-m09-cff-memory', 'l-m09-cff-size', 'l-m09-cff-duration', 'q-m09-edge'],
      diagrams: [
        { title: 'จุดที่ edge function เกาะได้ 4 จุด', caption: 'เส้นทาง request ผ่าน 4 จุด และ function ไหนจับจุดไหน (ลำดับจุดเป็นความรู้ทั่วไป)', source: 'AWS CloudFront docs', supplement: true, svgId: 'm09-edge-events' },
        { title: 'ขั้นตอนใช้ Lambda@Edge เทียบกับ CloudFront Functions', caption: 'ตามสไลด์ Using CloudFront with Lambda@Edge และ Using CloudFront Functions', source: 'L808-823, L867-873', svgId: 'm09-edge-deploy' }
      ]
    },
    {
      heading: 'Lab 9.2: CloudFront เพื่อ cache และปกป้องเว็บ',
      body: '<p><strong>สถานการณ์</strong></p>' +
        '<ul><li>เว็บคาเฟ่ยังรันบน HTTP ยังไม่รองรับ HTTPS</li><li>คาเฟ่อยากให้หน้าเว็บโหลดเร็วสำหรับผู้ใช้ทั่วโลก</li><li>Sofía ตัดสินใจส่งเว็บคาเฟ่ผ่าน <strong>content delivery network (CDN)</strong></li></ul>' +
        '<details><summary>งาน 6 ข้อใน Lab (กดเพื่อดู)</summary><ol><li>เตรียม development environment</li><li>ตั้งค่า CloudFront distribution สำหรับเนื้อหา static ของเว็บ</li><li>ป้องกัน network access ของ CloudFront distribution ด้วย AWS WAF</li><li>ป้องกัน REST API endpoint ด้วย AWS WAF</li><li>ตั้งค่า CloudFront Function บนเว็บ</li><li>ปรับระยะเวลา cache (cache duration)</li></ol></details>' +
        '<p>ผลลัพธ์สุดท้ายที่อ่านออกจากภาพ</p>' +
        '<ul><li>S3 bucket เป็น origin ของ CloudFront และ edge location ถูกกำหนดโดย CloudFront distribution</li><li>object ใน cache มี metadata <code>max-age</code> ควบคุมอายุ และ refresh cache ตามที่ตั้งค่า</li><li>CloudFront Function ทำหน้าที่ URL redirect และปรับ header ของเว็บ <span class="badge warn">นอก notes</span></li><li>AWS WAF ปกป้องทั้ง CloudFront และ API Gateway REST API</li><li>ฝั่ง supplier ยังเป็น Beanstalk, Lambda, Aurora Serverless, ElastiCache for Memcached และ DynamoDB ตามเดิม</li></ul>' +
        '<p>AWS WAF คือ web application firewall ใช้กรอง traffic อันตราย (สไลด์โมดูลนี้ไม่ได้อธิบาย WAF มีแค่ชื่อ task) <span class="badge warn">นอก notes</span></p>' +
        '<p class="small muted">ข้อความในภาพ Lab final product อ่านได้ไม่ครบ รายการข้างบนเรียบเรียงจากส่วนที่อ่านออก · ใช้เวลาประมาณ 90 นาที · Lab debrief เป็นภาพล้วน</p>',
      brief: '<ul><li>สถานการณ์: เว็บคาเฟ่ยังรันบน HTTP ไม่รองรับ HTTPS และอยากให้โหลดเร็วทั่วโลก</li><li>Sofía ตัดสินใจส่งเว็บผ่าน <strong>CDN</strong></li><li>ผลลัพธ์: S3 bucket เป็น origin ของ CloudFront</li><li>object ใน cache มี metadata <code>max-age</code> ควบคุมอายุ</li><li>CloudFront Function ทำ URL redirect และปรับ header <span class="badge warn">นอก notes</span></li><li>AWS WAF ปกป้องทั้ง CloudFront และ API Gateway REST API</li><li>ฝั่ง supplier ยังเป็น Beanstalk, Lambda, Aurora Serverless, ElastiCache for Memcached และ DynamoDB</li><li>AWS WAF = web application firewall กรอง traffic อันตราย <span class="badge warn">นอก notes</span></li><li>ใช้เวลาประมาณ 90 นาที</li></ul>',
      refs: []
    },
    {
      heading: 'สรุปโมดูล ตัวเลขที่ต้องจำ ตัวอย่างข้อสอบ และแหล่งอ่านเพิ่ม',
      body: '<p><strong>สไลด์สรุปโมดูล</strong> บอกว่าคุณควรทำ 5 อย่างนี้ได้</p>' +
        '<ul><li>อธิบายได้ว่าใช้ caching เมื่อไร</li><li>อธิบาย caching ด้วย ElastiCache</li><li>อธิบาย caching ด้วย CloudFront</li><li>อธิบายและเทียบ Lambda@Edge กับ CloudFront Functions</li><li>ใช้กลยุทธ์ caching ได้</li></ul>' +
        '<p><strong>ตัวเลขที่ต้องจำ</strong></p>' +
        '<ul><li>Redis shard: 1–6 node</li><li>ระยะ cache เริ่มต้นของ CloudFront: 24 ชั่วโมง</li><li>CloudFront Functions: memory 2 MB, ขนาด 10 KB, duration ระดับ sub-millisecond</li></ul>' +
        '<p><strong>ตัวอย่างข้อสอบในสไลด์</strong></p>' +
        '<ul><li>โจทย์: ข้อใดเป็นเหตุผลที่เลือก <strong>Memcached แทน Redis</strong> สำหรับ ElastiCache</li><li>สไลด์ให้ระบุ key words ก่อนตอบ: <strong>requirement</strong>, <strong>Memcached over Redis</strong>, <strong>ElastiCache</strong></li></ul>' +
        '<div class="table-wrap"><table><thead><tr><th>ตัวเลือก</th><th>คำตอบ</th><th>ผล</th></tr></thead><tbody><tr><td>A</td><td>ต้องการ replication ของข้อมูล</td><td>ผิด (replication เป็นฟีเจอร์ของ Redis)</td></tr><tr><td>B</td><td>ต้องการโมเดลที่ง่ายที่สุด</td><td><strong>ถูก</strong></td></tr><tr><td>C</td><td>มี data type ที่ซับซ้อน</td><td>ผิด (เป็นของ Redis)</td></tr><tr><td>D</td><td>ต้องการ in-memory cache</td><td>ผิด (ทั้งสอง engine เป็น in-memory)</td></tr></tbody></table></div>' +
        '<p class="small muted">เหตุผลของข้อ A, C, D เป็นข้อสรุปของผู้สรุป เทียบกับตารางฟีเจอร์ของ engine สไลด์ประกาศแค่ว่าคำตอบคือ B</p>' +
        '<p><strong>วิธีตัดช้อยส์</strong></p>' +
        '<ol><li>ตัด D ก่อน: Memcached และ Redis เป็น in-memory cache ทั้งคู่ จึงไม่ใช่เหตุผลเลือกตัวใดตัวหนึ่ง</li><li>ตัด A และ C: replication และ data type ซับซ้อนเป็นจุดเด่นของ Redis</li><li>เหลือ B: Memcached เหมาะกับคนที่ต้องการโมเดลที่ง่ายที่สุด</li></ol>' +
        '<p><strong>สรุปรวมสำหรับนักพัฒนา</strong></p>' +
        '<ol><li>caching ทำได้ทุก layer: browser, CDN edge, API Gateway ไปจนถึงชั้น database</li><li>ElastiCache: <strong>Memcached</strong> (ง่าย, multithread) หรือ <strong>Redis</strong> (data type ซับซ้อน, persistence, replica)</li><li>CloudFront ลด latency ระดับโลก หัวใจคือออกแบบ <strong>cache key</strong> และ <strong>TTL</strong></li><li>Edge computing: งานเบาใช้ <strong>CloudFront Functions</strong> (JavaScript, sub-millisecond) งานหนักหรือต้องต่อ origin/database ใช้ <strong>Lambda@Edge</strong></li><li>Pattern: อ่านบ่อยเขียนน้อย → <strong>lazy loading</strong> · ต้อง real time → <strong>write-through</strong> และตั้ง <strong>TTL</strong> คู่เสมอ</li></ol>' +
        '<p><strong>แหล่งอ่านเพิ่ม</strong> (จากสไลด์)</p>' +
        '<ul><li>วิดีโอ: Getting Started with Caching: Turbocharging Your Application Workloads</li><li>บล็อก: Introducing CloudFront Functions – Run Your Code at the Edge with Low Latency at Any Scale</li></ul>',
      brief: '<p><strong>ต้องทำได้ 5 อย่าง</strong></p><ul><li>อธิบายว่าใช้ caching เมื่อไร</li><li>อธิบาย caching ด้วย ElastiCache</li><li>อธิบาย caching ด้วย CloudFront</li><li>เทียบ Lambda@Edge กับ CloudFront Functions</li><li>ใช้กลยุทธ์ caching ได้</li></ul><p><strong>ตัวเลขที่ต้องจำ</strong></p><ul><li>Redis shard: 1–6 node</li><li>ระยะ cache เริ่มต้นของ CloudFront: 24 ชั่วโมง</li><li>CloudFront Functions: memory 2 MB, ขนาด 10 KB, duration sub-millisecond</li></ul><p><strong>ตัวอย่างข้อสอบ</strong></p><ul><li>โจทย์: เหตุผลที่เลือก <strong>Memcached แทน Redis</strong> สำหรับ ElastiCache</li><li>key words: <strong>requirement</strong>, <strong>Memcached over Redis</strong>, <strong>ElastiCache</strong></li></ul><div class="table-wrap"><table><thead><tr><th>ตัวเลือก</th><th>คำตอบ</th><th>ผล</th></tr></thead><tbody><tr><td>A</td><td>ต้องการ replication</td><td>ผิด (ฟีเจอร์ของ Redis)</td></tr><tr><td>B</td><td>ต้องการโมเดลที่ง่ายที่สุด</td><td><strong>ถูก</strong></td></tr><tr><td>C</td><td>มี data type ซับซ้อน</td><td>ผิด (ของ Redis)</td></tr><tr><td>D</td><td>ต้องการ in-memory cache</td><td>ผิด (ทั้งสอง engine เป็น in-memory)</td></tr></tbody></table></div><p class="small muted">เหตุผลข้อ A, C, D เป็นข้อสรุปของผู้สรุป สไลด์ประกาศแค่ว่าคำตอบคือ B</p><p><strong>วิธีตัดช้อยส์</strong></p><ol><li>ตัด D: ทั้งสอง engine เป็น in-memory cache</li><li>ตัด A, C: replication และ data type ซับซ้อนเป็นของ Redis</li><li>เหลือ B: Memcached = โมเดลที่ง่ายที่สุด</li></ol><p><strong>สรุปรวมสำหรับนักพัฒนา</strong></p><ol><li>cache ได้ทุก layer: browser, CDN edge, API Gateway, database</li><li>ElastiCache: <strong>Memcached</strong> (ง่าย, multithread) / <strong>Redis</strong> (data type ซับซ้อน, persistence, replica)</li><li>CloudFront: ออกแบบ <strong>cache key</strong> และ <strong>TTL</strong></li><li>งานเบา → <strong>CloudFront Functions</strong> · งานหนัก/ต่อ origin → <strong>Lambda@Edge</strong></li><li>อ่านบ่อยเขียนน้อย → <strong>lazy loading</strong> · real time → <strong>write-through</strong> + <strong>TTL</strong></li></ol><p><strong>แหล่งอ่านเพิ่ม</strong></p><ul><li>วิดีโอ: Getting Started with Caching: Turbocharging Your Application Workloads</li><li>บล็อก: Introducing CloudFront Functions – Run Your Code at the Edge with Low Latency at Any Scale</li></ul>',
      refs: ['q-m09-engine-detail']
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
