/* M08 Containers — source = เลขบรรทัดในไฟล์สไลด์ต้นฉบับ (notes/ ... M08-Containers.md) */
GUIDE.register({
  module: 'M08',
  title: 'Containers',
  summary: 'Container vs VM, Docker (Dockerfile, CLI), microservices, ECS (Fargate/EC2), ECR, EKS, Elastic Beanstalk และ deployment policies, Aurora Serverless, 2 แล็บ',

  notes: [
    {
      heading: 'Container คืออะไร: ตู้ขนส่งของฝั่งซอฟต์แวร์',
      body: '<p><strong>ต้นคิดมาจากตู้คอนเทนเนอร์ขนส่งสินค้า</strong></p>' +
        '<ul><li>ก่อนมีตู้ขนส่ง<ul><li>สินค้าถูกส่งด้วยภาชนะหลายแบบ ไม่มีมาตรฐานด้านน้ำหนัก รูปร่าง หรือขนาด</li><li>การขนส่งช้า ไม่มีประสิทธิภาพ และแพง</li></ul></li><li>หลังมีตู้ขนส่ง<ul><li>ตู้ขนาดเท่ากันทำให้ขึ้นของ ลงของ เก็บ และย้ายระหว่างพาหนะแต่ละชนิดได้ง่าย</li><li>การซ่อนรายละเอียดของสิ่งที่ขนส่ง (abstraction) ทำให้ประสิทธิภาพและผลิตภาพสูงขึ้น ต้นทุนลดลง</li></ul></li></ul>' +
        '<p><strong>ฝั่งซอฟต์แวร์ทำแบบเดียวกัน</strong></p>' +
        '<ul><li>container คือ <strong>หน่วยซอฟต์แวร์มาตรฐาน</strong> ที่ห่อทุกอย่างที่แอปต้องใช้ไว้ในกล่องเดียว</li><li>ของที่อยู่ในกล่อง <ul><li>runtime engine</li><li>application code</li><li>system tools</li><li>system libraries</li></ul></li><li>ข้างนอกไม่ต้องรู้ว่าข้างในมีอะไร เหมือนท่าเรือที่ไม่ต้องเปิดตู้ดู</li><li>ผลคือ deploy ได้ <strong>เร็ว เชื่อถือได้ และเหมือนเดิมทุกครั้ง</strong> ไม่ว่าจะรันในสภาพแวดล้อมไหน</li></ul>' +
        '<p class="small muted">ที่ Knowledge Check ถาม: ประโยชน์ที่ทั้งวงการขนส่งและซอฟต์แวร์ได้เหมือนกันคือ abstraction ซ่อนรายละเอียดข้างในแล้วระบบคล่องตัวขึ้น (agility) · ส่วนประกอบของ container คือ runtime engine และ application code ไม่ใช่ host server, OS หรือ VM</p>',
      refs: ['k-m08-01', 'k-m08-02']
    },
    {
      heading: 'วิวัฒนาการของการ deploy: Bare-metal → VM → Container',
      body: '<p>แต่ละยุคแก้ปัญหาของยุคก่อน แล้วสร้างข้อเสียของตัวเองขึ้นมา</p>' +
        '<ul><li><strong>Bare-metal server</strong> (หลายแอปบนเครื่องจริงเครื่องเดียว)<ul><li>แอปแย่งทรัพยากรของเครื่อง</li><li>ทุกแอปต้องแชร์ library เวอร์ชันเดียวกัน</li><li>ค่าฮาร์ดแวร์ไม่ยืดหยุ่น</li></ul></li><li><strong>VM</strong> (แต่ละแอปมี Guest OS ของตัวเองบน virtualization platform)<ul><li>ข้อดี: แอปแยกกัน library แยกกัน และใช้ทรัพยากรได้ดีกว่า</li><li>ข้อเสีย: ต้องดูแล OS เพิ่มขึ้น</li><li>ข้อเสีย: ต้องใช้พื้นที่ server เพิ่มสำหรับ OS</li></ul></li><li><strong>Container</strong> (แชร์ OS kernel เดียวบน containerization platform)<ul><li>เบา มีประสิทธิภาพ และเร็ว</li><li>พกพาง่ายมาก แอปรันเหมือนเดิมในทุก environment</li><li>library จะแยกหรือใช้ร่วมกันก็ได้</li><li>ใช้ทรัพยากรได้ดีกว่า</li></ul></li></ul>' +
        '<div class="fig-slot" data-i="0"></div>' +
        '<p>จำง่าย ๆ: VM แยกกันด้วย <em>OS ของใครของมัน</em> จึงหนักกว่า ส่วน container <em>แชร์ OS kernel</em> จึงเบากว่า</p>' +
        '<p class="small muted">โจทย์ฝึกในเว็บนี้: โปรแกรมเมอร์บ่นว่าแอปรันได้บนเครื่อง dev แต่ขึ้น production แล้วพฤติกรรมต่างกัน คำตอบคือ container เพราะรันเหมือนเดิมทุก environment</p>',
      refs: ['g-m08-model', 'q-m08-parity', 'c-m08-model-vm', 'c-m08-model-ct', 'c-m08-model-bm'],
      diagrams: [
        { title: 'Bare-metal, VM และ container ต่างกันที่ชั้นไหน', caption: 'container ตัดชั้น Guest OS ออก แล้วแชร์ OS kernel เดียวกัน', source: 'L185-237', svgId: 'm08-models' }
      ]
    },
    {
      heading: 'Docker: แพลตฟอร์ม ประโยชน์ และ 5 ส่วนประกอบ',
      body: '<p><strong>Docker คืออะไร</strong></p>' +
        '<ul><li>เป็น container virtualization platform แบบเบา</li><li>มีเครื่องมือสำหรับ <em>สร้าง เก็บ จัดการ และรัน</em> container</li><li>เชื่อมกับ pipeline ที่ build, test และ deploy อัตโนมัติได้</li></ul>' +
        '<p><strong>ประโยชน์ 5 อย่าง</strong></p>' +
        '<ul><li><strong>Portable</strong>: สภาพแวดล้อมรันแอปพกไปที่ไหนก็ได้</li><li>แอปกับ dependency ถูกแพ็กเป็น <strong>artifact ก้อนเดียวที่แก้ไม่ได้ (immutable)</strong></li><li>รันแอปหลายเวอร์ชันที่ใช้ dependency ต่างกัน <strong>พร้อมกัน</strong> ได้</li><li>วงจรพัฒนาและ deploy <strong>เร็วขึ้น</strong></li><li>ใช้ทรัพยากรได้ดีและมีประสิทธิภาพกว่า</li></ul>' +
        '<p><strong>5 ส่วนประกอบ</strong> (ออกสอบบ่อย: ใครคือใคร)</p>' +
        '<div class="table-wrap"><table><thead><tr><th>ส่วนประกอบ</th><th>คืออะไร</th><th>จุดที่ต้องจำ</th></tr></thead><tbody><tr><td><strong>Dockerfile</strong></td><td>ไฟล์ข้อความธรรมดา (plain text) ที่เป็นคำสั่งสำหรับสร้าง container image</td><td>ไม่ใช่ไฟล์ YAML</td></tr><tr><td><strong>Container image</strong></td><td>template แบบ read-only ที่ใช้สร้าง container ซึ่งเขียนได้</td><td>แก้ไม่ได้ ใช้สร้าง container ได้หลายตัว</td></tr><tr><td><strong>Container layer</strong></td><td>ชั้นบาง ๆ แบบ read/write ที่ใช้เปลี่ยนแปลงสิ่งต่าง ๆ ใน container ที่กำลังรัน</td><td>ไม่ใช่ read-only</td></tr><tr><td><strong>Container</strong></td><td>instance ที่รันได้ของ image</td><td>image คือ template ส่วน container คือของที่รันจริง</td></tr><tr><td><strong>Container registry</strong></td><td>ที่เก็บ image แบบ private หรือ public ซึ่งใช้เป็นฐานสร้าง image อื่นได้</td><td>ไม่ใช่ template ของ container</td></tr></tbody></table></div>' +
        '<div class="fig-slot" data-i="0"></div>' +
        '<p>เปรียบกับครัว: Dockerfile คือสูตร · image คืออาหารแพ็กสำเร็จที่แก้ไม่ได้ · container คือจานที่เอามาอุ่นเสิร์ฟ · container layer คือของที่เติมบนจาน · registry คือตู้แช่แข็งกลางที่เก็บของแพ็กไว้</p>' +
        '<p><strong>สรุปส่วนนี้</strong></p>' +
        '<ul><li>container สร้างจาก template แบบ read-only ที่เรียกว่า <strong>image</strong></li><li>image สร้างจาก <strong>Dockerfile</strong> และมักอิงจาก image อื่น</li><li>container คือ <strong>instance ที่รันได้</strong> ของ image และมี <strong>writable layer</strong></li><li>container <strong>registry</strong> คือที่เก็บ image</li><li>จัดการ image และ container ด้วยคำสั่ง <strong>Docker CLI</strong> จาก Bash terminal</li></ul>',
      refs: ['k-m08-03'],
      diagrams: [
        { title: 'ส่วนประกอบ 5 อย่างของ Docker', caption: 'Dockerfile → image → container และ registry ที่เก็บ image', source: 'L263-350, L669-681', svgId: 'm08-docker-parts' }
      ]
    },
    {
      heading: 'Dockerfile: เขียนอะไรลงไป และทำไมมี layer',
      body: '<p>Dockerfile คือสูตรทีละบรรทัด Docker อ่านจากบนลงล่างแล้วสร้าง image ให้ ตัวอย่างในสไลด์มี 3 ระดับ</p>' +
        '<h3>1) ง่ายที่สุด: พิมพ์ข้อความ</h3>' +
        '<pre><code># Start with the Ubuntu latest image\nFROM ubuntu:latest\n# Output hello world message\nCMD echo "Hello World!"</code></pre>' +
        '<ul><li><code>FROM</code> เลือก image ตั้งต้น (ที่นี่คือ Ubuntu เวอร์ชัน latest)</li><li><code>CMD</code> สั่งว่าให้รันอะไร (ที่นี่คือพิมพ์ Hello World!)</li></ul>' +
        '<h3>2) รันแอป Java</h3>' +
        '<pre><code># Start with open JDK version 8 image\nFROM openjdk:8\n# Copy the .jar file that contains your code from your system to the container\nCOPY /hello.jar /usr/src/hello.jar\n# Call Java to run your code\nCMD java -cp /usr/src/hello.jar Org.example.App</code></pre>' +
        '<ul><li><code>FROM</code> เริ่มจาก image OpenJDK 8</li><li><code>COPY</code> คัดลอกไฟล์ .jar ที่มีโค้ดจากเครื่องเราเข้าไปใน container</li><li><code>CMD</code> เรียก Java ให้รันโค้ดนั้น</li></ul>' +
        '<h3>3) งานที่ใช้บ่อย: ตั้ง web server Apache</h3>' +
        '<pre><code># Start with CentOS 7 image\nFROM centos:7\n# Update the OS and install Apache\nRUN yum -y update &amp;&amp; yum -y install httpd\n# Expose port 80 - the port that the web server "listens to"\nEXPOSE 80\n# Copy shell script and give it run permissions\nADD run-httpd.sh /run-httpd.sh\nRUN chmod -v +x /run-httpd.sh\n# Run shell script\nCMD ["/run-httpd.sh"]</code></pre>' +
        '<ul><li><code>FROM</code> เริ่มจาก CentOS 7</li><li><code>RUN</code> อัปเดต OS และติดตั้ง Apache (httpd)</li><li><code>EXPOSE 80</code> ประกาศพอร์ต 80 ซึ่งเป็นพอร์ตที่ web server "ฟัง" อยู่</li><li><code>ADD</code> คัดลอก shell script เข้าไป แล้ว <code>RUN chmod</code> ให้สิทธิ์รัน</li><li><code>CMD</code> รัน script นั้น</li></ul>' +
        '<h3>ทุกบรรทัดเพิ่ม 1 layer</h3>' +
        '<ul><li>ตัวอย่าง CentOS ข้างบน สไลด์นับเป็น 4 layer <ul><li>1 = base CentOS 7</li><li>2 = RUN yum</li><li>3 = EXPOSE 80</li><li>4 = ADD + RUN chmod</li></ul></li><li>layer ของ image เป็น <strong>read-only</strong> ทั้งหมด</li><li>ตอนรัน container จะมีชั้น <strong>read/write</strong> เพิ่มบนสุดอีก 1 ชั้น</li></ul>' +
        '<div class="fig-slot" data-i="0"></div>' +
        '<p class="small muted">ที่ Knowledge Check ข้อ 5 ถาม: Dockerfile ไม่ใช่ YAML · ทุกคำสั่งสร้าง layer แบบ read-only · Dockerfile สั่งรัน script ได้ (ตัวอย่างข้างบนใช้ CMD รัน script)</p>',
      refs: ['k-m08-05'],
      diagrams: [
        { title: 'Dockerfile แต่ละคำสั่งคือ 1 layer', caption: 'layer ของ image ซ้อนกัน (read-only) แล้วมีชั้น read/write ของ container อยู่บนสุด', source: 'L352-467', svgId: 'm08-dockerfile-layers' }
      ]
    },
    {
      heading: 'Docker CLI: คำสั่ง 16 ตัวและตัวอย่างที่ต้องรู้',
      body: '<p>รันคำสั่งเหล่านี้จาก Bash terminal เพื่อจัดการ image และ container</p>' +
        '<div class="table-wrap"><table><thead><tr><th>คำสั่ง</th><th>ทำอะไร</th></tr></thead><tbody><tr><td><code>docker build</code></td><td>สร้าง image จาก Dockerfile</td></tr><tr><td><code>docker images</code></td><td>แสดง image ที่มีบน Docker host</td></tr><tr><td><code>docker run</code></td><td>เปิด container จาก image</td></tr><tr><td><code>docker ps</code></td><td>แสดง container ที่กำลังรันอยู่</td></tr><tr><td><code>docker stop</code></td><td>หยุด container ที่กำลังรัน</td></tr><tr><td><code>docker start</code></td><td>เริ่ม container</td></tr><tr><td><code>docker push</code></td><td>ส่ง image ไปที่ registry</td></tr><tr><td><code>docker tag</code></td><td>ติด tag ให้ image</td></tr><tr><td><code>docker logs</code></td><td>ดู log ที่ container พิมพ์ออกมา</td></tr><tr><td><code>docker port</code></td><td>แสดง port mapping ของ container</td></tr><tr><td><code>docker inspect</code></td><td>ดูข้อมูลรายละเอียดของ container</td></tr><tr><td><code>docker exec</code></td><td>รันคำสั่งใน container</td></tr><tr><td><code>docker rm</code></td><td>ลบ container (หนึ่งตัวหรือหลายตัว)</td></tr><tr><td><code>docker rmi</code></td><td>ลบ image ออกจาก host</td></tr><tr><td><code>docker update</code></td><td>แก้การตั้งค่าของ container ขณะรัน</td></tr><tr><td><code>docker commit</code></td><td>สร้าง image ใหม่จากการเปลี่ยนแปลงของ container</td></tr></tbody></table></div>' +
        '<div class="fig-slot" data-i="0"></div>' +
        '<p><strong>ตัวอย่างในสไลด์</strong> (ใช้ image ชื่อ node_app)</p>' +
        '<h3>1) build: สร้าง image</h3>' +
        '<pre><code>docker build --tag node_app .</code></pre>' +
        '<ul><li>สร้าง image จาก Dockerfile ในโฟลเดอร์ปัจจุบัน และตั้งชื่อว่า node_app</li><li>ผลลัพธ์ที่เห็น <ul><li>Sending build context to Docker daemon</li><li>Step 1/7 : FROM node:11-alpine (ดึง base image มาก่อน)</li><li>Successfully built a5886f101e12</li><li>Successfully tagged node_app:latest</li></ul></li></ul>' +
        '<h3>2) images: ดูรายการ image</h3>' +
        '<pre><code>docker images</code></pre>' +
        '<ul><li>แสดง image ที่ Docker client รู้จัก (คอลัมน์ REPOSITORY, TAG, IMAGE ID, CREATED, SIZE)</li><li>ในตัวอย่างเห็น node_app:latest ขนาด 82.7MB สร้างเมื่อ 18 วินาทีก่อน</li></ul>' +
        '<h3>3) run: เปิด container</h3>' +
        '<pre><code>docker run -d --name node_app_1 -p 8000:80 node_app</code></pre>' +
        '<ul><li>สร้าง container ชื่อ node_app_1 จาก image ชื่อ node_app</li><li><code>-d</code> รันเบื้องหลังและพิมพ์ container ID ออกมา</li><li><code>-p 8000:80</code> เปิดพอร์ตให้ service อื่นเรียกผ่าน HTTP ได้</li><li>ใช้ <code>docker ps</code> ตรวจ: คอลัมน์ PORTS แสดง <code>0.0.0.0:8000->80/tcp</code> (STATUS: Up)</li><li><em>หมายเหตุผู้สรุป:</em> รูปแบบ <code>-p</code> คือ host:container ผล <code>0.0.0.0:8000->80/tcp</code> ในสไลด์แปลว่า host พอร์ต 8000 ส่งเข้า container พอร์ต 80 ส่วนคำอธิบายใต้คำสั่งในสไลด์เขียนสลับด้าน</li></ul>' +
        '<div class="fig-slot" data-i="1"></div>' +
        '<h3>4) exec: เข้าไปทำงานใน container ที่รันอยู่</h3>' +
        '<pre><code>docker exec -it node_app_1 sh</code></pre>' +
        '<ul><li>เปิด terminal แบบ <code>sh</code> ใน container ที่กำลังรัน</li><li>ตัวอย่างในสไลด์ <ul><li>สั่ง <code>ls</code> ดูไฟล์ในโฟลเดอร์ /usr/src/app</li><li>พิมพ์ <code>exit</code> เพื่อออกจาก shell (container ยังรันต่อ)</li></ul></li></ul>' +
        '<h3>5) stop และ rm: หยุดแล้วลบ container</h3>' +
        '<pre><code>docker stop node_app_1 &amp;&amp; docker rm node_app_1</code></pre>' +
        '<ul><li>หยุด container แล้วลบ container ที่หยุดแล้วนั้น</li><li>ผลลัพธ์พิมพ์ชื่อ node_app_1 สองครั้ง (ครั้งละหนึ่งคำสั่ง)</li></ul>' +
        '<p class="small muted">ที่ Knowledge Check ข้อ 4 ถาม: สร้าง container ชื่อ my_app_1 จาก image node_app ต้องใช้ docker run --name · ส่วน build สร้าง image, exec รันคำสั่งใน container, images แสดงรายการ image</p>',
      refs: ['k-m08-04'],
      diagrams: [
        { title: 'แผนที่คำสั่ง Docker CLI', caption: 'คำสั่งครบ 16 ตัวจับกับ Dockerfile, image, container และ registry', source: 'L469-667', svgId: 'm08-cli-map' },
        { title: 'docker run -p 8000:80', caption: 'host พอร์ต 8000 ส่งเข้า container พอร์ต 80 (ตามผล docker ps ในสไลด์)', source: 'L571-597', svgId: 'm08-port' }
      ]
    },
    {
      heading: 'Lab 8.1: ย้ายเว็บแอปไปรันใน Docker container',
      body: '<p><strong>สถานการณ์</strong></p>' +
        '<ul><li>เจ้าของคาเฟ่เพิ่งซื้อ supplier กาแฟเจ้าโปรด ซึ่งรันแอปติดตามสต็อกบน AWS account ของตัวเอง</li><li>คุณรับบท Sofía และต้อง <strong>ย้ายแอปนี้ไปรันบน container</strong></li></ul>' +
        '<p><strong>งาน 6 ขั้น</strong></p>' +
        '<ol><li>เตรียม development environment</li><li>วิเคราะห์โครงสร้างพื้นฐานของแอปที่มีอยู่</li><li>ย้ายแอปไปรันใน Docker container</li><li>ย้าย MySQL database ไปรันใน Docker container</li><li>ทดสอบ MySQL container กับ node application</li><li>เพิ่ม Docker image เข้า Amazon ECR</li></ol>' +
        '<p><strong>ผลลัพธ์สุดท้าย</strong></p>' +
        '<ul><li>EC2 instance ทำหน้าที่เป็น <strong>container host</strong> (มี Docker engine)</li><li>บน host รัน 2 container ได้แก่ node app กับ mysql ที่เชื่อมต่อกัน</li><li>ใช้เวลาประมาณ 90 นาที</li></ul>' +
        '<div class="fig-slot" data-i="0"></div>' +
        '<p class="small muted">สไลด์ Lab debrief: Key takeaways ของแล็บนี้เป็นภาพทั้งหน้า ไม่มีข้อความให้สรุป</p>',
      refs: [],
      diagrams: [
        {"title":"ผลลัพธ์ของ Lab 8.1","caption":"EC2 เป็น container host รัน node app กับ mysql และส่ง image ขึ้น ECR","source":"L688-788","flow":{"nodes":[{"id":"ec2","label":"EC2 (container host)"},{"id":"engine","label":"Docker engine"},{"id":"app","label":"Container: node app"},{"id":"db","label":"Container: mysql"},{"id":"ecr","label":"Amazon ECR"}],"edges":[{"from":"ec2","to":"engine"},{"from":"engine","to":"app"},{"from":"engine","to":"db"},{"from":"app","to":"db","label":"เชื่อมต่อกัน"},{"from":"engine","to":"ecr","label":"ส่ง image"}]}}
      ]
    },
    {
      heading: 'Microservices กับ container',
      body: '<p><strong>Monolith เทียบกับ microservices</strong></p>' +
        '<ul><li><strong>Monolith</strong>: storefront UI, account, cart, shipping และ data access รวมเป็นแอปก้อนเดียวที่ต่อกับ database</li><li><strong>Microservices</strong>: แยกเป็น service เล็ก ๆ แต่ละตัวเลือกภาษาได้ <ul><li>Account = Node.js</li><li>Storefront UI = Node.js</li><li>Cart = Python</li><li>Shipping = Java</li></ul></li></ul>' +
        '<div class="fig-slot" data-i="0"></div>' +
        '<p><strong>หลักออกแบบ microservices ↔ สิ่งที่ container ให้</strong></p>' +
        '<div class="table-wrap"><table><thead><tr><th>หลักออกแบบ microservices</th><th>ลักษณะของ container ที่รองรับ</th></tr></thead><tbody><tr><td>Decentralized, evolutionary design<br>Smart endpoints, dumb pipes</td><td>แต่ละ container ใช้ภาษาและเทคโนโลยีที่เหมาะกับ service นั้น<br>แต่ละส่วนแยกกันและพัฒนาแยกกันได้ ไม่ต้องอัปเดตทั้งระบบแบบ monolith</td></tr><tr><td>Independent products, not projects</td><td>แพ็ก dependency และ library ทั้งหมดไว้ใน object เดียวที่แก้ไม่ได้ (immutable)</td></tr><tr><td>Designed for failure<br>Disposable</td><td>ปิด container อย่างนุ่มนวลเมื่อมีอะไรผิดปกติ แล้วสร้าง instance ใหม่<br>เริ่มเร็ว ล้มเร็ว และปล่อย file handler<br>pattern คล้าย circuit breaker เพราะ container ถูกเพิ่มและลบ ปริมาณงานเปลี่ยน ทรัพยากรเป็นของชั่วคราว</td></tr><tr><td>Development and production parity</td><td>ทำให้ environment ของ development, test และ production สอดคล้องกัน<br>ช่วย DevOps เพราะแอปที่ทำงานบนเครื่อง developer จะทำงานแบบเดียวกันบน production</td></tr></tbody></table></div>' +
        '<p class="small muted">ที่ Knowledge Check ข้อ 6 ถาม: เหตุผลที่เลือก container กับ microservices คือแต่ละ container ใช้ภาษาและเทคโนโลยีที่เหมาะกับ service ได้ (ตัวหลอก: container ไม่ได้แยกออกจากกัน, container เหมาะกับการหลีกเลี่ยงทรัพยากรชั่วคราว)</p>',
      refs: ['q-m08-micro', 'k-m08-06'],
      diagrams: [
        { title: 'Monolith กับ microservices', caption: 'แยกเป็น service ที่ใช้คนละภาษาได้ และอัปเดตแยกกันได้', source: 'L799-843', svgId: 'm08-micro' }
      ]
    },
    {
      heading: 'จัดการ container จำนวนมาก: ทำไมต้องมี orchestration',
      body: '<p>รัน container ไม่กี่ตัวยังพอจัดการเองได้ แต่พอมีมากต้องตอบคำถามเหล่านี้ตลอดเวลา</p>' +
        '<ul><li>container แต่ละตัวอยู่ในสถานะ (state) อะไร</li><li>จะ schedule การเริ่มและหยุดเมื่อไร</li><li>แต่ละ server เหลือทรัพยากรเท่าไร</li><li>ทำอย่างไรให้ availability, resilience และ performance สูงที่สุด</li></ul>' +
        '<p><strong>Container orchestration platform</strong> ช่วยเรื่อง 3 อย่าง</p>' +
        '<ul><li><strong>Scheduling</strong>: สั่งเริ่มและหยุด container</li><li><strong>Placement</strong>: เลือกว่า container จะไปวางบน server ตัวไหน</li><li><strong>Service integration</strong>: ทำงานร่วมกับ service อื่น</li></ul>' +
        '<div class="fig-slot" data-i="0"></div>' +
        '<p class="small muted">ที่ Knowledge Check ข้อ 7 ถาม: เหตุผลหลักที่ใช้ orchestration service คือเพื่อ schedule การเริ่ม/หยุด container และตัดสินใจว่าจะวางไว้ที่ไหน</p>',
      refs: ['k-m08-07'],
      diagrams: [
        { title: 'ทำไมต้องมี container orchestration', caption: 'orchestrator ตัดสินใจเรื่อง scheduling, placement และ service integration แทนคุณ', source: 'L856-910', svgId: 'm08-orchestration' }
      ]
    },
    {
      heading: 'Amazon ECS และ ECR',
      body: '<p><strong>Amazon ECS</strong> (Elastic Container Service)</p>' +
        '<ul><li>เป็น container orchestration service ที่ <strong>fully managed</strong></li><li>ขยายได้เร็วถึงหลายพัน container โดยไม่เพิ่มความซับซ้อน</li><li>จัดตาราง placement ข้าม cluster ที่ AWS ดูแล</li><li>ทำงานร่วมกับ scheduler ของบุคคลที่สามและ service อื่นของ AWS</li><li>รองรับ Docker container</li></ul>' +
        '<p><strong>Amazon ECR</strong> (Elastic Container Registry)</p>' +
        '<ul><li>เป็น container registry แบบ fully managed สำหรับเก็บ รัน และจัดการ image ของแอปที่รันบน ECS</li><li>ขยายได้และมี availability สูง</li><li>ทำงานร่วมกับ ECS และ Docker CLI</li><li>ปลอดภัย <ul><li>เข้ารหัสข้อมูลที่เก็บไว้ (encryption at rest)</li><li>ใช้ IAM ควบคุมสิทธิ์</li></ul></li></ul>' +
        '<p><strong>ภาพรวมการทำงานของ ECS</strong> มี 4 ส่วน (ภาพในสไลด์ไม่ได้ระบุลำดับตัวเลข)</p>' +
        '<ul><li>ดึง container image จาก registry (ECR หรือ registry อื่น)</li><li>กำหนดแอปพลิเคชัน (define your application)</li><li>เลือก launch type: Fargate หรือ EC2</li><li>จัดการ container</li></ul>' +
        '<div class="fig-slot" data-i="0"></div>' +
        '<p><strong>สร้าง ECR repository และ push image</strong> (คำสั่งในสไลด์)</p>' +
        '<pre><code># สร้าง repository ชื่อ hello-world\naws ecr create-repository \\\n    --repository-name hello-world \\\n    --region us-east-1\n\n# build และ tag image\ndocker build -t hello-world .\ndocker tag hello-world:latest aws_account_id.dkr.ecr.us-east-1.amazonaws.com/hello-world:latest\n\n# authenticate Docker ไปที่ ECR registry\naws ecr get-login-password --region region | docker login --username AWS --password-stdin aws_account_id.dkr.ecr.region.amazonaws.com\n\n# push image ขึ้น repository\ndocker push aws_account_id.dkr.ecr.us-east-1.amazonaws.com/hello-world:latest</code></pre>' +
        '<ul><li>ข้ามขั้น <code>docker login</code> ได้ถ้าตั้ง <code>amazon-ecr-credential-helper</code> ไว้แล้ว</li></ul>' +
        '<div class="fig-slot" data-i="1"></div>' +
        '<div class="fig-slot" data-i="2"></div>' +
        '<p class="small muted">ที่ Knowledge Check ข้อ 8 ถาม: ECS รองรับ Docker และ scale ได้สูง · ECS ไม่ได้บังคับใช้ ECR · launch type คือ Fargate หรือ EC2 (ไม่ใช่ Lambda) · deploy แอปที่ไม่ได้ออกแบบมาสำหรับ container ไม่ได้อัตโนมัติ</p>',
      refs: ['k-m08-08', 'c-m08-svc-registry', 'c-m08-svc-orch'],
      diagrams: [
        { title: 'Amazon ECS: ภาพรวมการทำงาน', caption: 'ตามสไลด์ ECS solution architecture', source: 'L966-980', svgId: 'm08-ecs-arch' },
        {"title":"ส่ง image ขึ้น ECR","caption":"สร้าง repository, build และ tag image, login แล้ว push ขึ้น ECR","source":"L1018-L1042","flow":{"nodes":[{"id":"dockerfile","label":"Dockerfile"},{"id":"image","label":"Docker image"},{"id":"tagged","label":"Image ที่ tag แล้ว"},{"id":"login","label":"Docker login ไป ECR"},{"id":"repo","label":"ECR repository"}],"edges":[{"from":"dockerfile","to":"image","label":"docker build"},{"from":"image","to":"tagged","label":"docker tag"},{"from":"tagged","to":"repo","label":"docker push"},{"from":"login","to":"repo","label":"auth"}]}},
        { title: 'จากโค้ดถึง container ที่รันบน AWS', caption: 'เชื่อม Docker กับ ECR และ service ที่ใช้รัน (ประกอบจากสไลด์หลายหน้า)', source: 'L352-1049', svgId: 'm08-pipeline' }
      ]
    },
    {
      heading: 'Fargate หรือ EC2: เลือก launch type ของ ECS',
      body: '<p>ECS เอา container ไปรันได้ 2 แบบ ต่างกันที่ว่าใครดูแล Docker engine และ OS</p>' +
        '<ul><li><strong>Fargate</strong>: AWS ดูแล Docker engine และ Guest OS ของ VM ให้ คุณดูแลแค่ container กับแอป</li><li><strong>EC2</strong>: คุณดูแลทั้ง container, Docker engine และ OS ของ instance เอง</li></ul>' +
        '<div class="fig-slot" data-i="0"></div>' +
        '<h3>เลือกเมื่อไร: Fargate เทียบ EC2</h3>' +
        '<div class="table-wrap"><table><thead><tr><th>เกณฑ์</th><th>เลือก Fargate</th><th>เลือก EC2</th></tr></thead><tbody><tr><td><strong>ลักษณะโหลด</strong></td><td>service ที่ demand แกว่งกว้าง</td><td>ความต้องการทรัพยากรคาดการณ์ได้มากกว่า หรืออยากใช้ reserved instance เพื่อลดต้นทุน</td></tr><tr><td><strong>workload ใหญ่</strong></td><td>ปรับให้ overhead ต่ำ</td><td>ปรับให้ประหยัดค่าใช้จ่าย</td></tr><tr><td><strong>ข้อกำหนดขององค์กร</strong></td><td>—</td><td>ต้องปฏิบัติตามข้อกำหนดด้านความปลอดภัยขององค์กร</td></tr><tr><td><strong>งานเล็กหรือตามเวลา</strong></td><td>environment ทดสอบขนาดเล็ก · batch workload ที่รันตามตารางเวลา</td><td>—</td></tr><tr><td><strong>ของที่มีอยู่แล้ว</strong></td><td>—</td><td>ใช้ capacity ส่วนเกินของ EC2 ที่มีอยู่</td></tr></tbody></table></div>' +
        '<p class="small muted">สไลด์ไม่ได้จับคู่รายการ Fargate กับ EC2 ให้ การจัดแถวเป็นการจัดกลุ่มของผู้สรุป ช่องที่เป็น "—" คือสไลด์ไม่ระบุ</p>' +
        '<p>จำง่าย ๆ: ผันผวน ทดสอบ หรือรันเป็นรอบ → Fargate · คาดการณ์ได้ ประหยัด หรือมีข้อกำหนดเรื่องความปลอดภัย → EC2</p>' +
        '<h3>Fargate เรียกว่า serverless ไหม <span class="badge warn">นอก notes</span></h3>' +
        '<ul><li>ใช่ AWS เรียก Fargate ว่า <strong>serverless compute engine for containers</strong> (ใช้ได้ทั้งกับ ECS และ EKS)</li><li>serverless ในที่นี้ไม่ได้แปลว่าไม่มีเครื่อง แต่หมายถึง <strong>คุณไม่ต้องจัดการ server เอง</strong> ตรงกับภาพข้างบน: AWS ดูแล Docker engine และ OS ให้</li><li>เทียบ 3 ตัวที่มีคำว่า serverless <ul><li>Lambda = serverless <strong>compute service</strong> (รันเป็น function ตาม event)</li><li>Fargate = serverless <strong>compute engine for containers</strong> (รันเป็น container)</li><li>Aurora Serverless = serverless <strong>database</strong> (อยู่ในสไลด์: scale ตาม traffic และหยุดเมื่อไม่ใช้)</li></ul></li></ul>' +
        '<div class="fig-slot" data-i="1"></div>' +
        '<p class="small muted">คำว่า serverless ของ Fargate ไม่อยู่ในสไลด์ M08 ที่มา: <a href="https://aws.amazon.com/fargate/" target="_blank" rel="noopener">aws.amazon.com/fargate</a></p>',
      refs: ['g-m08-launch', 'q-m08-fargate', 'q-m08-ec2', 'c-m08-launch-spike', 'c-m08-launch-batch', 'c-m08-launch-reserved', 'c-m08-launch-comply'],
      diagrams: [
        { title: 'ECS cluster แบบ Fargate เทียบกับ EC2: ใครดูแลอะไร', caption: 'ตามสไลด์ ECS with Fargate or Amazon EC2: Fargate ตัดภาระ Docker engine และ OS ออกจากคุณ', source: 'L982-1016', svgId: 'm08-compute' },
        { title: 'Lambda, Fargate และ Aurora Serverless ต่างกันที่ชนิดของ serverless', caption: 'เส้นประ = ความรู้ทั่วไป (Aurora Serverless อยู่ในสไลด์)', source: 'AWS Fargate docs', supplement: true, svgId: 'm08-serverless' }
      ]
    },
    {
      heading: 'Amazon EKS และสรุปเลือก service ของ AWS',
      body: '<p><strong>Amazon EKS</strong> (Elastic Kubernetes Service)</p>' +
        '<ul><li>เป็น service ที่รัน Kubernetes บน AWS Cloud แบบ managed</li><li>สร้างร่วมกับชุมชน Kubernetes</li><li>conformant และ compatible กับ Kubernetes มาตรฐาน</li><li>secure by default</li></ul>' +
        '<p><strong>ขั้นตอนใช้ EKS</strong> (4 ขั้นในสไลด์)</p>' +
        '<ol><li>Provision EKS cluster</li><li>Deploy worker node ของ EKS cluster (เลือก Fargate หรือ Amazon EC2)</li><li>เชื่อมต่อกับ EKS cluster</li><li>รันแอป Kubernetes</li></ol>' +
        '<div class="fig-slot" data-i="0"></div>' +
        '<p><strong>สรุปส่วน container services</strong></p>' +
        '<ul><li>container orchestration service ช่วยจัดการ container จำนวนมากให้ง่ายขึ้น</li><li><strong>ECS</strong> คือ orchestration แบบ fully managed ที่เปิด container บน Fargate หรือ EC2</li><li><strong>ECR</strong> คือ registry แบบ fully managed</li><li><strong>EKS</strong> คือ service ที่รัน Kubernetes บนคลาวด์</li></ul>' +
        '<div class="table-wrap"><table><thead><tr><th>ต้องการ</th><th>เลือก</th></tr></thead><tbody><tr><td>ที่เก็บ Docker image ที่เข้ารหัสและคุมสิทธิ์ด้วย IAM</td><td>Amazon ECR</td></tr><tr><td>orchestration ของ AWS เอง (schedule และ placement)</td><td>Amazon ECS</td></tr><tr><td>ใช้ Kubernetes อยู่แล้ว อยากได้แบบ managed</td><td>Amazon EKS</td></tr><tr><td>ทีมเพิ่งเริ่ม อยากเริ่มเร็วและลองผิดลองถูก</td><td>Elastic Beanstalk (ดูหัวข้อถัดไป)</td></tr></tbody></table></div>',
      refs: ['g-m08-service', 'c-m08-svc-k8s', 'q-m08-written2'],
      diagrams: [
        { title: 'ขั้นตอนใช้ Amazon EKS', caption: 'ตามสไลด์ Amazon EKS: provision cluster → worker node (Fargate หรือ EC2) → เชื่อมต่อ → รันแอป Kubernetes', source: 'L1074-1088', svgId: 'm08-eks' }
      ]
    },
    {
      heading: 'Elastic Beanstalk: ภาพรวมและ component 8 ตัว',
      body: '<p><strong>Elastic Beanstalk</strong> คือ service สำหรับ deploy และ scale web application และ service</p>' +
        '<ul><li>จัดการรายละเอียดให้ ได้แก่ capacity provisioning, load balancing, automatic scaling และ application health monitoring</li><li>มี platform ให้เลือกหลายแบบสำหรับสร้างแอป</li><li>จัดการ resource ทั้งหมดที่รันแอปให้เป็นหนึ่ง <strong>environment</strong></li></ul>' +
        '<p><strong>component 8 ตัว</strong></p>' +
        '<div class="table-wrap"><table><thead><tr><th>ชื่อ</th><th>คืออะไร</th></tr></thead><tbody><tr><td><strong>Application</strong></td><td>กลุ่มของ component ของ Elastic Beanstalk ในเชิงตรรกะ คล้ายโฟลเดอร์</td></tr><tr><td><strong>Application version</strong></td><td>รุ่นที่ระบุชื่อชัดเจนของโค้ดที่ deploy ได้ สำหรับเว็บแอป</td></tr><tr><td><strong>Environment</strong></td><td>กลุ่มของ AWS resource ที่รัน application version หนึ่งรุ่น</td></tr><tr><td><strong>Environment tier</strong></td><td>ชนิดของแอปที่ environment รัน เป็นตัวกำหนดว่า Elastic Beanstalk จะ provision resource อะไรมารองรับ</td></tr><tr><td><strong>Environment configuration</strong></td><td>ชุด parameter และ setting ที่กำหนดพฤติกรรมของ environment และ resource ที่เกี่ยวข้อง</td></tr><tr><td><strong>Saved configuration</strong></td><td>template ที่ใช้เป็นจุดตั้งต้นในการสร้าง environment configuration แบบเฉพาะตัว</td></tr><tr><td><strong>Platform</strong></td><td>ชุดที่รวม OS, runtime ของภาษา, web server, application server และ component ของ Elastic Beanstalk คุณออกแบบแอปให้ตรงกับ platform</td></tr><tr><td><strong>Elastic Beanstalk CLI</strong></td><td>CLI ที่มีคำสั่งแบบโต้ตอบ ช่วยสร้าง อัปเดต และติดตาม environment จาก local repository</td></tr></tbody></table></div>' +
        '<div class="fig-slot" data-i="0"></div>' +
        '<p class="small muted">ที่ Knowledge Check ข้อ 9 ถาม: กลุ่มเชิงตรรกะคล้ายโฟลเดอร์ คือ Application (ไม่ใช่ Environment, Platform หรือ Environment tier)</p>',
      refs: ['k-m08-09'],
      diagrams: [
        { title: 'Component ทั้ง 8 ของ Elastic Beanstalk', caption: 'ความสัมพันธ์ของ Application, version, environment และส่วนประกอบของ environment', source: 'L1145-1170', svgId: 'm08-eb-components' }
      ]
    },
    {
      heading: 'Beanstalk คืออะไรกันแน่: PaaS ไม่ใช่ serverless และทำไมยังมี ECS/EKS',
      body: '<p>คำถามที่เจอบ่อย: Beanstalk คือ IaaS, PaaS, SaaS หรือ serverless และถ้ามี Beanstalk แล้วจะมี ECS/EKS ไว้ทำไม</p>' +
        '<h3>1) Beanstalk คือ PaaS <span class="badge warn">นอก notes</span></h3>' +
        '<div class="table-wrap"><table><thead><tr><th>แบบ</th><th>คุณดูแล</th><th>ผู้ให้บริการดูแล</th><th>ตัวอย่าง</th></tr></thead><tbody><tr><td><strong>IaaS</strong></td><td>OS, runtime, โค้ด และการตั้งค่าทุกอย่าง</td><td>ฮาร์ดแวร์ เครือข่าย</td><td>Amazon EC2</td></tr><tr><td><strong>PaaS</strong></td><td>โค้ดของคุณ (กับการตั้งค่าเล็กน้อย)</td><td>เครื่อง, load balancer, auto scaling, health monitoring</td><td>Elastic Beanstalk</td></tr><tr><td><strong>SaaS</strong></td><td>แค่ใช้งาน</td><td>ทุกอย่าง</td><td>Gmail, Microsoft 365</td></tr></tbody></table></div>' +
        '<ul><li>สไลด์บอกว่า Beanstalk จัดการ capacity provisioning, load balancing, automatic scaling และ application health monitoring ให้ จึงเข้าข่าย PaaS (คำว่า PaaS ไม่อยู่ในสไลด์)</li></ul>' +
        '<h3>2) ทำไมไม่ใช่ serverless <span class="badge warn">นอก notes</span></h3>' +
        '<ul><li>serverless = คุณไม่เห็นและไม่ต้องแตะเครื่อง</li><li>Beanstalk ตั้ง EC2, Auto Scaling group และ load balancer ให้ใน account ของคุณ คุณเห็นและแก้ได้ และจ่ายค่า instance เอง (ดูภาพ)</li></ul>' +
        '<div class="fig-slot" data-i="0"></div>' +
        '<h3>3) ทำไมยังมี ECS และ EKS</h3>' +
        '<ul><li>Beanstalk เป็นชั้นห่อทับที่เลือกค่าต่าง ๆ ให้คุณ <ul><li>สไลด์ multicontainer: Beanstalk สร้าง Auto Scaling group + ECS cluster ให้ แปลว่าข้างหลังใช้ ECS อยู่แล้ว</li><li>สไลด์ "simplifies container deployment": ECS ต้องทำเอง 3 ขั้น (task definition, cluster, service) ส่วน Beanstalk ทำแค่ Dockerrun + zip, เลือก platform, launch</li></ul></li><li>ECS/EKS ให้อำนาจควบคุมมากกว่า แลกกับต้องตั้งค่าเอง <span class="badge warn">นอก notes</span><ul><li>ใช้ Fargate รันโดยไม่มี EC2 ให้ดูแลได้</li><li>ใช้ Kubernetes ที่มีอยู่แล้วได้ (EKS)</li><li>คุมการวาง container ละเอียดเมื่อมี service หลายตัว (orchestration)</li><li>ใช้ได้กว้างกว่าการ deploy เว็บแอป</li></ul></li></ul>' +
        '<p>เปรียบเทียบ: Beanstalk คือห้องที่จัดเฟอร์นิเจอร์ให้ครบ เข้าอยู่ได้เลยแต่รื้อจัดใหม่ทุกจุดไม่ได้ · ECS/EKS คือห้องเปล่าที่จัดเองได้ทั้งหมดแต่ต้องซื้อและประกอบเอง</p>' +
        '<div class="fig-slot" data-i="1"></div>' +
        '<h3>4) เลือกอะไรเมื่อไร</h3>' +
        '<ul><li>ทีมเพิ่งเริ่ม ไม่ค่อยมีประสบการณ์ AWS หรือ container อยากเริ่มเร็วและทดลอง → <strong>Beanstalk</strong></li><li>ทีมรู้ Docker อยากคุม orchestration → <strong>ECS</strong> (Fargate หรือ EC2)</li><li>ใช้ Kubernetes อยู่แล้ว → <strong>EKS</strong></li></ul>' +
        '<div class="fig-slot" data-i="2"></div>' +
        '<p class="small muted">ตรงกับข้อสอบตัวอย่างท้ายสไลด์: keyword "ไม่ค่อยมีประสบการณ์ AWS/container" + "เริ่มเร็ว" → คำตอบ A Elastic Beanstalk</p>',
      refs: [],
      diagrams: [
        { title: 'Beanstalk ตั้งอะไรให้ข้างหลัง', caption: 'EC2, Auto Scaling group และ load balancer อยู่ใน account ของคุณ', source: 'L1120-1143, L1281-1295', supplement: true, svgId: 'm08-eb-behind' },
        { title: 'ใครดูแลอะไร: EC2, ECS, Fargate และ Beanstalk', caption: 'สรุปจากสไลด์ ECS แบบ Fargate/EC2 และ Beanstalk', source: 'L982-1016, L1248-1295', supplement: true, svgId: 'm08-who-manages' },
        { title: 'เลือก service สำหรับ container', caption: 'ข้อสรุปของผู้สรุปจากสไลด์ (ข้อสอบตัวอย่าง, Fargate/EC2, EKS)', source: 'L982-1090, L1719-1776', supplement: true, svgId: 'm08-choose' }
      ]
    },
    {
      heading: 'สิทธิ์ใน Beanstalk: Service role, Instance profile, User policies',
      body: '<p>IAM role ที่เกี่ยวกับ environment มี 3 แบบ</p>' +
        '<div class="table-wrap"><table><thead><tr><th>แบบ</th><th>ใช้ทำอะไร</th><th>กำหนดตอนไหน</th><th>ค่า default ในสไลด์</th></tr></thead><tbody><tr><td><strong>Service role</strong></td><td>Elastic Beanstalk assume role นี้เพื่อใช้ service อื่นแทนคุณ</td><td>ตอนสร้าง environment</td><td><code>awselasticbeanstalkservice-role</code></td></tr><tr><td><strong>Instance profile</strong></td><td>ใช้กับ instance ที่ถูก launch ใน environment</td><td>ตอนสร้าง environment</td><td><code>awselasticbeanstalkec2-role</code></td></tr><tr><td><strong>User policies</strong></td><td>แนบกับ user หรือ group ที่สร้างและจัดการ application และ environment</td><td>กำหนดหรือไม่ก็ได้ (optional)</td><td>มี managed policy ให้ 2 แบบ คือ full administrative access และ read-only access</td></tr></tbody></table></div>' +
        '<div class="fig-slot" data-i="0"></div>' +
        '<p><strong>ตัวอย่าง AWS managed policy</strong> (ส่วนหนึ่งของ AmazonEC2ReadOnlyAccess ที่สไลด์ตัดมาให้ดู)</p>' +
        '<pre><code>{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Allow",\n      "Action": "ec2:Describe*",\n      "Resource": "*"\n    },\n    {\n      "Effect": "Allow",\n      "Action": "elasticloadbalancing:Describe*",\n      "Resource": "*"\n    }\n    ... (ตัดบางส่วนเพื่อให้สั้น)\n  ]\n}</code></pre>' +
        '<ul><li>อ่านว่า: Allow ให้ดูรายละเอียด (Describe) ทรัพยากร EC2 และ load balancer ได้ทั้งหมด (Resource: *)</li></ul>',
      refs: ['l-m08-userpolicy'],
      diagrams: [
        { title: 'สิทธิ์ใน Elastic Beanstalk: 3 แบบ', caption: 'Service role, Instance profile และ User policies', source: 'L1172-1211', svgId: 'm08-eb-iam' }
      ]
    },
    {
      heading: 'Beanstalk เทียบกับ ECS: เริ่มง่ายกว่าอย่างไร และ multicontainer',
      body: '<p><strong>เริ่มใช้งานด้วย ECS เทียบกับ Elastic Beanstalk</strong></p>' +
        '<ul><li><strong>ECS</strong> (3 ขั้น)<ul><li>สร้าง task definition</li><li>สร้างและตั้งค่า cluster ซึ่งรวม EC2 instance, VPC settings และ IAM role</li><li>สร้าง service เพื่อรันและดูแลจำนวน instance ของ task ตามที่กำหนด</li></ul></li><li><strong>Elastic Beanstalk</strong> (3 ขั้น)<ul><li>เขียนไฟล์ <code>Dockerrun.aws.json</code> และเตรียมโค้ดที่ zip ไว้</li><li>เลือก platform ตามภาษา</li><li>launch แอป</li></ul></li></ul>' +
        '<div class="fig-slot" data-i="0"></div>' +
        '<p>Beanstalk ซ่อนรายละเอียดของ ECS ไว้ให้ จึงเหมาะกับทีมที่ยังไม่มีประสบการณ์ container หรือ AWS</p>' +
        '<p><strong>Multicontainer Docker platform</strong></p>' +
        '<ul><li>เปิด environment แบบหลาย container ได้เร็วโดย <strong>ไม่ต้องกังวลรายละเอียดการตั้งค่า ECS</strong></li><li>Elastic Beanstalk จัด Auto Scaling group และ ECS cluster ให้</li><li>แต่ละ instance รันได้หลาย task (container)</li><li>มี load balancing ด้านหน้า (ภาพในสไลด์แสดง app1.elasticbeanstalk.com ที่พอร์ต 80 และ 9000)</li></ul>' +
        '<div class="fig-slot" data-i="1"></div>' +
        '<p><strong>ตัวอย่างไฟล์ Dockerrun.aws.json เวอร์ชัน 2</strong> (ส่วนที่สไลด์แสดง)</p>' +
        '<pre><code>{\n  "AWSEBDockerrunVersion": 2,\n  "volumes": [\n    {\n      "name": "php-app",\n      "host": { "sourcePath": "/var/app/current/php-app" }\n    },\n    {\n      "name": "nginx-proxy-conf",\n      "host": { "sourcePath": "/var/app/current/proxy/conf.d" }\n    }\n  ],\n  "containerDefinitions": [\n    {\n      "name": "php-app",\n      "image": "php:fpm",\n      "environment": [\n        { "name": "Container", "value": "PHP" }\n      ],\n      "essential": true,\n      "memory": 128,\n      "mountPoints": [\n        {\n          "sourceVolume": "php-app",\n          "containerPath": "/var/www/html",\n          "readOnly": true\n        }\n      ]\n    }\n  ]\n}</code></pre>' +
        '<ul><li><code>AWSEBDockerrunVersion</code> เป็น 2 คือรูปแบบแบบหลาย container</li><li><code>volumes</code> ประกาศ volume ของ host ที่จะเอาไปเมานต์</li><li><code>containerDefinitions</code> ประกาศ container แต่ละตัว <ul><li>image ที่ใช้ (php:fpm)</li><li>ตัวแปร environment</li><li>essential: true และ memory: 128</li><li>mountPoints: เมานต์ volume เข้า container แบบ read-only</li></ul></li></ul>' +
        '<p class="small muted">สไลด์หน้านี้ตั้งหัวข้อว่า "Service role policy example" แต่เนื้อหาจริงคือไฟล์ Dockerrun.aws.json เวอร์ชัน 2</p>' +
        '<p class="small muted">ตัวอย่างข้อสอบ: ทีมไม่มีประสบการณ์ AWS/container อยากเริ่มเร็วและทดลอง ให้เลือก Elastic Beanstalk แบบ multicontainer Docker</p>',
      refs: ['q-m08-beanstalk', 'c-m08-svc-quick'],
      diagrams: [
        { title: 'เริ่มใช้ ECS เทียบกับ Elastic Beanstalk', caption: 'ชิ้นส่วนที่ต้องตั้งในแต่ละขั้น น้ำเงิน = คุณตั้งเอง ส้ม = Beanstalk ตั้งให้', source: 'L1248-1279', svgId: 'm08-eb-vs-ecs-steps' },
        { title: 'Multicontainer Docker บน Elastic Beanstalk', caption: 'ลูกศรน้ำเงิน = request ของผู้ใช้ · ส้มประ = Beanstalk สร้างให้ (วาดตามความเข้าใจ ไม่ใช่ภาพต้นฉบับ)', source: 'L1281-1295', svgId: 'm08-multicontainer' }
      ]
    },
    {
      heading: 'Deployment policy 5 แบบ และการตั้งค่า (namespace)',
      body: '<p>Beanstalk มี deployment policy ให้เลือก 5 แบบ เรียงจากเร็วที่สุดไปคุมได้มากที่สุด</p>' +
        '<ul><li><strong>All at once</strong><ul><li>deploy เวอร์ชันใหม่ไปทุก instance พร้อมกัน</li><li>เป็นวิธีที่เร็วที่สุด</li><li>ต้องมี downtime</li></ul></li><li><strong>Rolling</strong><ul><li>deploy ทีละ batch ของ instance</li><li>ไม่มี downtime และลด availability ที่ลดลงให้น้อยที่สุด</li><li>ใช้เวลา deploy นานขึ้น</li></ul></li><li><strong>Rolling with batch</strong><ul><li>เปิด batch เพิ่มก่อน แล้วค่อย rolling</li><li>ไม่ทำให้ capacity ลดลง</li><li>ใช้เวลานานกว่า rolling</li></ul></li><li><strong>Immutable</strong><ul><li>ใช้ instance ชุดใหม่ทั้งชุดเสมอ (เวอร์ชันใหม่อยู่บน instance ใหม่)</li><li>rollback ได้เร็วและปลอดภัย</li><li>ถ้าต้อง rollback บริการไม่สะดุด</li><li>ใช้เวลา deploy นาน</li></ul></li><li><strong>Traffic splitting</strong><ul><li>เปิด Auto Scaling group ที่สอง แล้วให้บริการทั้งเวอร์ชันเก่าและใหม่จนกว่า instance ใหม่จะผ่าน health check</li><li>เปิด instance ชุดเต็มเหมือน immutable</li><li>ทดสอบ health ของเวอร์ชันใหม่ด้วย traffic ส่วนหนึ่ง ส่วนที่เหลือยังไปเวอร์ชันเก่า</li><li>รองรับ <strong>canary testing</strong></li></ul></li></ul>' +
        '<div class="fig-slot" data-i="0"></div>' +
        '<div class="fig-slot" data-i="1"></div>' +
        '<div class="callout"><span class="callout-title">ข้อแลกเปลี่ยนหลัก: ยิ่งยอมให้มี downtime ยิ่ง deploy ได้เร็ว</span><p>ยอมหยุดได้ → All at once (เร็วที่สุด) · ไม่อยากหยุด → Rolling ไปจนถึง Immutable / Traffic splitting ซึ่งใช้เวลานานขึ้น</p></div>' +
        '<p class="small muted">สไลด์หน้านี้เรียกข้อความของ Immutable กับ Traffic splitting เป็นคอลัมน์เดียว การแยกว่าข้อไหนเป็นของใครอิงจากความหมาย (เช่น canary เป็นของ traffic splitting)</p>' +
        '<h3>ตั้งค่าด้วย namespace</h3>' +
        '<ul><li><code>aws:elasticbeanstalk:command</code><ul><li>เลือก deployment policy</li><li>ตั้ง timeout</li><li>เลือกขนาดและชนิดของ batch</li><li>เลือกว่าจะยกเลิก deployment ไหมเมื่อ health check ล้มเหลว</li></ul></li><li><code>aws:elasticbeanstalk:trafficsplitting</code><ul><li>เลือกเปอร์เซ็นต์ traffic ที่ไปยัง instance ใหม่</li><li>เลือกว่าจะรอนานเท่าไรก่อนเลื่อน traffic เพิ่ม</li></ul></li></ul>' +
        '<div class="fig-slot" data-i="3"></div>' +
        '<h3>ตัวอย่าง Traffic splitting (canary testing)</h3>' +
        '<pre><code>option_settings:\n  aws:elasticbeanstalk:command:\n    DeploymentPolicy: TrafficSplitting\n  aws:elasticbeanstalk:trafficsplitting:\n    NewVersionPercent: "15"\n    EvaluationTime: "10"</code></pre>' +
        '<ul><li><code>DeploymentPolicy: TrafficSplitting</code> เลือก policy แบบ traffic splitting</li><li><code>NewVersionPercent: "15"</code> ส่ง 15% ของ traffic ไปเวอร์ชันใหม่</li><li><code>EvaluationTime: "10"</code> ตรวจ health 10 นาทีตามหัวข้อสไลด์ก่อนเลื่อนต่อ</li></ul>' +
        '<div class="fig-slot" data-i="2"></div>' +
        '<p class="small muted">ที่ Knowledge Check ข้อ 10 ถาม: ต้องการทำ canary testing ให้ใช้ Traffic Splitting (ตัวหลอก: Immutable, Rolling with batch, Blue/Green)</p>',
      refs: ['g-m08-deploy', 'c-m08-dep-all', 'c-m08-dep-rolling', 'c-m08-dep-batch', 'c-m08-dep-immutable', 'c-m08-dep-canary', 'q-m08-canary', 'q-m08-rollback', 'k-m08-10'],
      diagrams: [
        { title: 'Deployment policy ของ Elastic Beanstalk 5 แบบ', caption: 'ยิ่งไปทางขวา ยิ่งคุมความเสี่ยงได้มาก แต่ใช้เวลานานขึ้น', source: 'L1364-1493', svgId: 'm08-deploy-policies' },
        { title: 'Deployment policy ทั้ง 5 แบบเป็นเส้นเวลา', caption: 'ตัวอย่างสมมติ 4 instance: v1 = เวอร์ชันเก่า v2 = เวอร์ชันใหม่', source: 'L1364-1444', svgId: 'm08-deploy-timeline' },
        { title: 'Traffic splitting (canary testing)', caption: 'ตามสไลด์ Example of traffic splitting', source: 'L1477-1493', svgId: 'm08-traffic-split' },
        { title: 'Namespace ของ Elastic Beanstalk คือหมวดของค่าตั้ง', caption: 'บรรทัดสีส้ม = ชื่อ namespace ส่วนบรรทัดเยื้องข้างใต้คือค่าในหมวดนั้น', source: 'L1446-1493', svgId: 'm08-namespace' }
      ]
    },
    {
      heading: 'Blue/green บน Elastic Beanstalk',
      body: '<p>อีกวิธีหนึ่งที่ไม่ใช่ policy ใน 5 แบบข้างบน คือ clone ทั้ง environment แล้วสลับ</p>' +
        '<ol><li><strong>Clone</strong> environment เดิม (blue) เป็น environment ใหม่ (green)</li><li><strong>Deploy และทดสอบ</strong> เวอร์ชันใหม่ใน environment ใหม่</li><li><strong>สลับ CNAME</strong> ระหว่างสอง environment เพื่อให้ผู้ใช้ไปที่เวอร์ชันใหม่ (ภาพในสไลด์แสดง URL ของทั้งสองฝั่งและ CNAMEs)</li></ol>' +
        '<div class="fig-slot" data-i="0"></div>' +
        '<h3>CNAME คืออะไร <span class="badge warn">นอก notes</span></h3>' +
        '<ul><li>CNAME คือระเบียน (record) ใน DNS ที่ชี้ <strong>ชื่อหนึ่งไปอีกชื่อหนึ่ง</strong> (ต่างจาก A record ที่ชี้ชื่อไปเลข IP)</li><li>URL หลัก (myapp...) เป็นแค่ป้ายชื่อที่ชี้ไป environment ใด environment หนึ่ง</li><li>การ swap CNAME คือ <strong>สลับป้ายชื่อ</strong> ของสอง environment ผู้ใช้จึงใช้ URL เดิมต่อได้โดยไม่รู้ว่าเปลี่ยน</li><li>ถ้า environment ใหม่มีปัญหา ก็สลับกลับได้</li><li>คล้าย alias ของ Lambda ใน M07 ที่เป็นป้ายชื่อซึ่งย้ายไปชี้ version อื่นได้ (alias เป็นของ Lambda ส่วน CNAME เป็นของ DNS)</li></ul>' +
        '<p class="small muted">สไลด์มีแค่คำว่า Swap the CNAMEs กับ URL สองตัว คำอธิบายว่า CNAME คืออะไรเป็นความรู้ทั่วไปของผู้สรุป</p>' +
        '<p><strong>สรุปส่วน Elastic Beanstalk</strong></p>' +
        '<ul><li>ใช้ Elastic Beanstalk <strong>จัดการ resource ทั้งหมดที่รันแอปเป็น environment</strong></li><li>เปิด <strong>Docker multicontainer</strong> environment ได้เร็วโดย<strong>ไม่ต้อง</strong>กังวลรายละเอียดการตั้งค่า ECS</li><li>ตัวเลือก deployment มี <strong>traffic splitting</strong> และ <strong>blue/green</strong> เพื่อรองรับการทดสอบเวอร์ชันใหม่</li></ul>' +
        '<p class="small muted">ที่ใช้สอบ: ปล่อยเวอร์ชันใหม่โดยไม่หยุดให้บริการและทดสอบก่อนสลับจริง → clone environment (blue/green) หรือ traffic splitting ขึ้นกับว่าต้องการสลับทั้งก้อนหรือแบ่ง traffic</p>',
      refs: ['c-m08-dep-bg', 'q-m08-design2'],
      diagrams: [
        { title: 'Blue/green บน Elastic Beanstalk', caption: 'ตามสไลด์ Blue/green deployments: clone → deploy/test → สลับ CNAMEs', source: 'L1495-1509', svgId: 'm08-bluegreen' }
      ]
    },
    {
      heading: 'Lab 8.2 และ Aurora Serverless: ย้าย database ออกจาก container',
      body: '<p><strong>สถานการณ์</strong></p>' +
        '<ul><li>Sofía containerize แอปของ supplier แล้ว แต่อยาก <strong>ลดภาระการดูแล</strong> และเพิ่ม <strong>scalability</strong></li><li>ตามแล็บก่อนหน้า เธออยากย้าย database ไปใช้ <strong>managed database service</strong> แทนการรันใน container</li><li>ผลการค้นคว้าทำให้เธอตัดสินใจ <ul><li>ใช้ <strong>AWS Elastic Beanstalk</strong> deploy เว็บไซต์ของแอป</li><li>ใช้ <strong>Amazon Aurora Serverless</strong> เป็น database</li><li>เลิกใช้ MySQL ใน container แล้วโหลด user, ตาราง และข้อมูลที่ต้องใช้เข้า Aurora Serverless</li></ul></li></ul>' +
        '<p><strong>Amazon Aurora</strong></p>' +
        '<ul><li>เป็น relational database engine แบบ fully managed ที่เข้ากันได้กับ MySQL และ PostgreSQL</li><li>เป็นส่วนหนึ่งของ Amazon RDS (managed database service)</li><li>รวมประสิทธิภาพและ availability ของฐานข้อมูลเชิงพาณิชย์ระดับสูง เข้ากับความเรียบง่ายและความคุ้มค่าของฐานข้อมูล open-source</li><li><strong>Aurora Serverless</strong> คือรูปแบบ on-demand ที่ <ul><li>scale ขึ้นหรือลงอัตโนมัติตาม traffic</li><li>หยุดการทำงานเมื่อไม่มีใครใช้</li></ul></li></ul>' +
        '<p><strong>งาน 10 ขั้นในแล็บ</strong></p>' +
        '<ol><li>เตรียม development environment</li><li>ตั้งค่า subnet ที่ Amazon RDS และ Elastic Beanstalk จะใช้</li><li>ตั้ง Aurora Serverless database</li><li>ตรวจ container image</li><li>ตั้งการสื่อสารระหว่าง container กับ database</li><li>สร้าง database object ของแอป</li><li>ใส่ข้อมูล supplier ลง database (seeding)</li><li>ตรวจ IAM policy และ role ของ Elastic Beanstalk</li><li>สร้าง Elastic Beanstalk application</li><li>ตั้ง API Gateway proxy</li></ol>' +
        '<p><strong>ผลลัพธ์สุดท้าย</strong> (ตามภาพในสไลด์)</p>' +
        '<ul><li>ใน Region เดียว มี public subnet 2 แห่ง แต่ละแห่งมี EC2 ที่รัน image ของเว็บ</li><li>มี Classic Load Balancer และ Elastic Beanstalk เป็นตัว deploy</li><li>image ของเว็บมาจาก Amazon ECR ส่วน database คือ Aurora Serverless</li><li>หน้าบ้านเรียกผ่าน API Gateway และใช้เวลาประมาณ 90 นาที</li></ul>' +
        '<div class="fig-slot" data-i="0"></div>' +
        '<div class="fig-slot" data-i="1"></div>' +
        '<p class="small muted">สไลด์ Lab debrief: Key takeaways ของแล็บนี้เป็นภาพทั้งหน้า ไม่มีข้อความให้สรุป</p>',
      refs: ['q-m08-aurora', 'q-m08-written', 'q-m08-design'],
      diagrams: [
        {"title":"ผลลัพธ์ของ Lab 8.2","caption":"ECR ส่ง image ให้ Beanstalk deploy ไป EC2 สองแห่ง ต่อกับ Aurora Serverless","source":"L1619-1633","flow":{"nodes":[{"id":"apigw","label":"API Gateway (proxy)"},{"id":"clb","label":"Classic Load Balancer"},{"id":"ec2a","label":"EC2 (public subnet 1)"},{"id":"ec2b","label":"EC2 (public subnet 2)"},{"id":"aurora","label":"Aurora Serverless"},{"id":"ecr","label":"Amazon ECR"},{"id":"eb","label":"Elastic Beanstalk"}],"edges":[{"from":"apigw","to":"clb"},{"from":"clb","to":"ec2a"},{"from":"clb","to":"ec2b"},{"from":"ec2a","to":"aurora"},{"from":"ec2b","to":"aurora"},{"from":"ecr","to":"eb","label":"image เว็บ"},{"from":"eb","to":"ec2a","label":"deploy"},{"from":"eb","to":"ec2b"}]}},
        { title: 'Lab 8.1 เทียบกับ Lab 8.2', caption: 'ประกอบจากข้อความและภาพของสไลด์ (ไม่ใช่ภาพต้นฉบับ)', source: 'L688-788, L1528-1671', svgId: 'm08-lab82-before-after' }
      ]
    },
    {
      heading: 'สรุปโมดูล ตัวอย่างข้อสอบ และแหล่งอ่านเพิ่ม',
      body: '<p><strong>สไลด์สรุปโมดูล</strong> บอกว่าคุณควรทำ 7 อย่างนี้ได้ (ตรงกับเป้าหมายต้นโมดูล)</p>' +
        '<ul><li>อธิบายประวัติ เทคโนโลยี และศัพท์ของ container</li><li>แยก container ออกจาก bare-metal server และ VM</li><li>อธิบายส่วนประกอบของ Docker และการทำงานร่วมกัน</li><li>ระบุลักษณะของ microservices architecture</li><li>รู้เหตุผลที่ใช้ container orchestration service และ AWS service สำหรับจัดการ container</li><li>host เว็บไดนามิกด้วย Docker container</li><li>อธิบายว่า Elastic Beanstalk ใช้ deploy container อย่างไร</li></ul>' +
        '<p><strong>ตัวอย่างข้อสอบในสไลด์</strong></p>' +
        '<ul><li>โจทย์: สถาปนิกต้องการย้ายเว็บแอปไปรันบน container ทีม <strong>ไม่ค่อยมีประสบการณ์ AWS หรือ container</strong> แต่อยาก <strong>เริ่มเร็ว</strong> เพื่อ <strong>ทดลอง</strong> ควรเลือกวิธีไหน</li><li>สไลด์ให้ระบุ key words และวลีสำคัญก่อนตอบ ซึ่งในข้อนี้คือ 3 วลีตัวหนาข้างบน</li></ul>' +
        '<div class="table-wrap"><table><thead><tr><th>ตัวเลือก</th><th>คำตอบ</th><th>ผล</th></tr></thead><tbody><tr><td>A</td><td>ใช้ Elastic Beanstalk เปิด multicontainer Docker environment</td><td><strong>ถูก</strong></td></tr><tr><td>B</td><td>ใช้ Amazon ECR เก็บ Docker image ที่สร้างเองตั้งแต่ต้น</td><td>ผิด (ECR เก็บ image ไม่ได้รันให้)</td></tr><tr><td>C</td><td>ตั้ง EC2 instance พร้อม automatic scaling แล้วติดตั้ง Docker image เอง</td><td>ผิด (ต้องตั้งเองทุกอย่าง)</td></tr><tr><td>D</td><td>ตั้ง Amazon ECS เป็น cluster ของ EC2 ที่รัน Docker container</td><td>ผิด (ต้องตั้ง task definition, cluster, service เอง)</td></tr></tbody></table></div>' +
        '<p class="small muted">เหตุผลที่ข้อ B, C, D ผิดเป็นข้อสรุปของผู้สรุป เทียบกับหน้า "ECS เทียบกับ Elastic Beanstalk" ในสไลด์ สไลด์ประกาศแค่ว่าคำตอบคือ A</p>' +
        '<p><strong>แหล่งอ่านเพิ่ม</strong> (blog จาก AWS)</p>' +
        '<ul><li>Building Container Images on Amazon ECS on AWS Fargate: <a href="https://aws.amazon.com/blogs/containers/building-container-images-on-amazon-ecs-on-aws-fargate/" target="_blank" rel="noopener">aws.amazon.com/blogs/containers/building-container-images-on-amazon-ecs-on-aws-fargate</a></li><li>Developing Twelve-Factor Apps Using Amazon ECS and AWS Fargate: <a href="https://aws.amazon.com/blogs/containers/developing-twelve-factor-apps-using-amazon-ecs-and-aws-fargate/" target="_blank" rel="noopener">aws.amazon.com/blogs/containers/developing-twelve-factor-apps-using-amazon-ecs-and-aws-fargate</a></li><li>Amazon ECS Workshop: <a href="https://ecsworkshop.com/" target="_blank" rel="noopener">ecsworkshop.com</a></li></ul>',
      refs: []
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
