/* สร้างโดย tools/import-kc.mjs จาก Knowledge Check ของ AWS Academy — ห้ามแก้ด้วยมือ */
GUIDE.registerKC("M07", {
 "summary": {
  "asks": "AWS Lambda ได้แก่ ลักษณะของ Lambda, quota, วิธีที่บริการต่าง ๆ เรียก Lambda (sync · async · polling), execution role, handler, cold start, การ deploy, alias, X-Ray",
  "main": "Lambda ทำงานเมื่อมี event มาเรียกเท่านั้น และใช้ทรัพยากรเท่าที่ใช้จริง · บริการแต่ละตัวเรียก Lambda คนละแบบ ซึ่งเป็นตัวกำหนดว่าสิทธิ์ต้องอยู่ที่ไหนและ retry อย่างไร",
  "thinking": "ถามก่อนว่าใครเรียกใคร ถ้า Lambda เป็นฝ่ายไปทำงานกับบริการอื่น (เขียน DynamoDB, poll SQS) สิทธิ์อยู่ใน execution role · ถ้าบริการอื่นเป็นฝ่ายเรียก Lambda (S3, API Gateway, SNS) สิทธิ์อยู่ใน resource-based policy",
  "rules": "API Gateway เรียกแบบ synchronous · SNS กับ S3 เรียกแบบ asynchronous · SQS ใช้วิธีให้ Lambda ไป poll (event source mapping)"
 },
 "remember": [
  {
   "type": "table",
   "head": [
    "ใครเรียก Lambda",
    "แบบ",
    "retry",
    "สิทธิ์อยู่ที่"
   ],
   "rows": [
    [
     "API Gateway",
     "synchronous",
     "ไม่ retry (client รับ error)",
     "resource-based policy"
    ],
    [
     "SNS · S3",
     "asynchronous",
     "2 ครั้ง + on-failure destination",
     "resource-based policy"
    ],
    [
     "SQS · Kinesis · DynamoDB Streams",
     "Lambda poll (event source mapping)",
     "ตามการตั้งค่าของ source",
     "execution role"
    ]
   ]
  },
  {
   "type": "list",
   "items": [
    "เจอ cold start ใช้ provisioned concurrency · กันโควตาไว้ให้ function ใช้ reserved concurrency · burst quota แก้ไม่ได้",
    "package ใหญ่เกิน 50 MB ให้ผ่าน S3",
    "ใน ARN ถ้าท้ายเป็นตัวเลขคือ version ถ้าเป็นคำคือ alias"
   ]
  }
 ],
 "questions": [
  {
   "id": "k-m07-01",
   "prompt": "Which statement describes a characteristic of AWS Lambda?",
   "choices": [
    {
     "text": "Lambda runs code only when it is activated by an event and uses only the compute resources that are needed.",
     "correct": true
    },
    {
     "text": "A developer's methods and configuration options for ensuring high availability with Lambda are similar to their approach with Amazon Elastic Compute Cloud (Amazon EC2).",
     "correct": false
    },
    {
     "text": "Lambda functions run in on-demand, temporary environments, and the developer controls when new environments are created or shut down.",
     "correct": false
    },
    {
     "text": "A developer must write Lambda functions that use one of the runtimes that the Lambda service provides.",
     "correct": false
    }
   ],
   "explain": "ข้อ B ผิด เพราะ high availability ของ Lambda เป็นหน้าที่ของ AWS ต่างจาก EC2 ที่ต้องจัดเอง · ข้อ C ผิดที่ \"developer controls\" เพราะ Lambda เป็นคนสร้างและปิด environment เอง · ข้อ D ผิด เพราะใช้ custom runtime หรือ container image ได้",
   "source": "KC M07 ข้อ 1",
   "topic": 0
  },
  {
   "id": "k-m07-02",
   "prompt": "Which constraint cannot be modified?",
   "choices": [
    {
     "text": "Function timeout",
     "correct": false
    },
    {
     "text": "Reserved concurrency",
     "correct": false
    },
    {
     "text": "Burst quota",
     "correct": true
    },
    {
     "text": "Regional quota",
     "correct": false
    }
   ],
   "explain": "timeout ตั้งได้ถึง 15 นาที · reserved concurrency ตั้งเองได้ทีละ function · regional quota (concurrency รวมของ Region) ขอเพิ่มได้ · มีแค่ burst quota ที่แก้ไม่ได้",
   "source": "KC M07 ข้อ 2"
  },
  {
   "id": "k-m07-03",
   "prompt": "Which option describes how Amazon API Gateway invokes AWS Lambda?",
   "choices": [
    {
     "text": "API Gateway directly invokes a function with a synchronous invocation.",
     "correct": true
    },
    {
     "text": "Lambda processes API Gateway requests asynchronously and retries each request up to two times.",
     "correct": false
    },
    {
     "text": "Lambda uses an event source mapping and polls API Gateway for requests.",
     "correct": false
    },
    {
     "text": "API Gateway directly invokes a function and retries the request until it succeeds or expires.",
     "correct": false
    }
   ],
   "explain": "client ยืนรอคำตอบอยู่ จึงต้องเป็นแบบ sync · ข้อ B คือพฤติกรรมของ async (เช่น SNS, S3) ที่ retry 2 ครั้ง · ข้อ C คือแบบ polling ใช้กับ SQS, Kinesis, DynamoDB Streams · ข้อ D คือพฤติกรรมของ stream ที่ retry จนกว่าจะสำเร็จหรือข้อมูลหมดอายุ",
   "source": "KC M07 ข้อ 3"
  },
  {
   "id": "k-m07-04",
   "prompt": "Which actions require permissions that are defined in the AWS Lambda execution role? (Select TWO.)",
   "choices": [
    {
     "text": "A Lambda function writes to an Amazon DynamoDB table.",
     "correct": true
    },
    {
     "text": "An object that is written to an Amazon Simple Storage Service (Amazon S3) bucket initiates invocation of a Lambda function.",
     "correct": false
    },
    {
     "text": "Lambda polls an Amazon Simple Queue Service (Amazon SQS) queue for messages that initiate invocation of a Lambda function.",
     "correct": true
    },
    {
     "text": "An Amazon API Gateway GET route initiates invocation of a Lambda function.",
     "correct": false
    },
    {
     "text": "A message that is posted to an Amazon Simple Notification Service (Amazon SNS) topic initiates invocation of a Lambda function.",
     "correct": false
    }
   ],
   "explain": "execution role คือสิทธิ์ที่ Lambda ใช้ตอน \"ไปทำงานกับบริการอื่น\" · ข้อ B, D และ E เป็น push event source คือบริการอื่นเป็นฝ่ายเรียก Lambda สิทธิ์จึงไปอยู่ที่ resource-based policy ของ function แทน",
   "source": "KC M07 ข้อ 4"
  },
  {
   "id": "k-m07-05",
   "prompt": "Which statement about the function handler in an AWS Lambda function is true?",
   "choices": [
    {
     "text": "The function handler is the entry point that Lambda calls to start running the Lambda function.",
     "correct": true
    },
    {
     "text": "The function handler method might take an event object or a context object.",
     "correct": false
    },
    {
     "text": "The event object provides information about the event that invoked the Lambda function. It must be a predefined object that an AWS service generates.",
     "correct": false
    },
    {
     "text": "The context object provides runtime information, and the developer must create a context object that matches the runtime that was selected for the function.",
     "correct": false
    }
   ],
   "explain": "ข้อ B ผิดตรงคำว่า \"or\" เพราะ handler รับทั้งสองตัวเสมอ · ข้อ C ผิด เพราะ event เป็น JSON ที่เราส่งเองได้ ไม่จำเป็นต้องมาจากบริการของ AWS · ข้อ D ผิด เพราะ Lambda สร้าง context object ให้เอง",
   "source": "KC M07 ข้อ 5",
   "topic": 0
  },
  {
   "id": "k-m07-06",
   "prompt": "Which issue might be addressed by adding provisioned concurrency to an AWS Lambda function?",
   "choices": [
    {
     "text": "Another Lambda function runs in the same account and Region. It sometimes spikes and consumes all available concurrency, causing the function to fail.",
     "correct": false
    },
    {
     "text": "An application that uses the Lambda function responds slowly for the first few users who sign in each day. Lambda metrics show higher latency for those initial requests.",
     "correct": true
    },
    {
     "text": "A legacy backend system fails intermittently when the developer connects to it. To avoid extra costs, they want to reduce the function's wait time when the backend fails.",
     "correct": false
    },
    {
     "text": "The developer wants more visibility into transactions that use the Lambda function to identify bottlenecks.",
     "correct": false
    }
   ],
   "explain": "อาการนี้คือ cold start ซึ่ง provisioned concurrency แก้ได้ด้วยการเปิด environment รอไว้ก่อน · ข้อ A ต้องแก้ด้วย reserved concurrency (กันโควตาไว้ให้ function) · ข้อ C แก้ด้วยการลด timeout · ข้อ D ใช้ X-Ray",
   "source": "KC M07 ข้อ 6"
  },
  {
   "id": "k-m07-07",
   "prompt": "Which AWS Lambda configuration setting might a developer use to manage function errors when configuring an Amazon Simple Notification Service (Amazon SNS) topic as the event source for a Lambda function? (Select TWO.)",
   "choices": [
    {
     "text": "State machines",
     "correct": false
    },
    {
     "text": "File systems",
     "correct": false
    },
    {
     "text": "Destinations",
     "correct": true
    },
    {
     "text": "Virtual private cloud",
     "correct": false
    },
    {
     "text": "Asynchronous invocations",
     "correct": true
    }
   ],
   "explain": "SNS เรียก Lambda แบบ async จึงตั้งจำนวนครั้ง retry ได้ในหน้า asynchronous invocation และตั้ง on-failure destination ไว้ส่งงานที่ล้มเหลวไปเก็บได้ (เช่น SQS หรือ SNS)",
   "source": "KC M07 ข้อ 7"
  },
  {
   "id": "k-m07-08",
   "prompt": "A zipped deployment package including code and custom libraries is 75 MB in size. Which AWS Lambda deployment option should be used?",
   "choices": [
    {
     "text": "Copy the code into the Lambda console editor to create and deploy the function.",
     "correct": false
    },
    {
     "text": "Upload a .zip file from an integrated development environment (IDE) to load the deployment package directly into the Lambda console.",
     "correct": false
    },
    {
     "text": "Upload the deployment package to an Amazon Simple Storage Service (Amazon S3) bucket, and specify the bucket name and object key on the Lambda console.",
     "correct": true
    },
    {
     "text": "Upload the deployment package to an Amazon Elastic Block Store (Amazon EBS) volume, and use the File Systems configuration to reference it.",
     "correct": false
    }
   ],
   "explain": "อัปโหลด .zip ตรงได้ไม่เกิน 50 MB ไฟล์ 75 MB จึงต้องผ่าน S3 · ข้อ D ผิด เพราะ File systems ของ Lambda ใช้ EFS ไม่ใช่ EBS",
   "source": "KC M07 ข้อ 8"
  },
  {
   "id": "k-m07-09",
   "prompt": "A function's Amazon Resource Name (ARN) is as follows: `arn:aws:lambda:aws-region:acct-id:function:helloworld:PROD`",
   "choices": [
    {
     "text": "This ARN will invoke the immutable PROD version of the function.",
     "correct": false
    },
    {
     "text": "This ARN will invoke the version of the function that is currently associated with the PROD alias.",
     "correct": true
    },
    {
     "text": "This ARN will invoke the function and include the AWS Lambda layer that is named PROD.",
     "correct": false
    },
    {
     "text": "This ARN will deploy the helloworld function into the PROD account.",
     "correct": false
    }
   ],
   "explain": "version ของ Lambda เป็นตัวเลข (1, 2, 3) หรือ `$LATEST` ชื่อที่เป็นคำอย่าง PROD จึงเป็น alias · alias ย้ายไปชี้ version อื่นได้ เลยไม่ใช่ \"immutable\" แบบในข้อ A",
   "source": "KC M07 ข้อ 9"
  },
  {
   "id": "k-m07-10",
   "prompt": "Users of a serverless application have reported errors that occur when they try to retrieve order information. Assuming that AWS X-Ray is enabled, what is the first step the developer might take in X-Ray to start troubleshooting the reported issues quickly?",
   "choices": [
    {
     "text": "Drill down into the most recent traces to look for errors.",
     "correct": false
    },
    {
     "text": "Search for metadata that is related to the users who are reporting issues.",
     "correct": false
    },
    {
     "text": "Add annotations that the developer can use to start grouping and filtering traces.",
     "correct": false
    },
    {
     "text": "Use the service map to visually locate errors across the application.",
     "correct": true
    }
   ],
   "explain": "โจทย์ถามว่า \"ขั้นแรก\" และ \"เร็ว\" service map ชี้ให้เห็นทั้งระบบในภาพเดียวว่าจุดไหนมี error แล้วค่อยเจาะลงไป · ไล่ trace ทีละตัว (A) ช้ากว่า · metadata ค้นหาไม่ได้ (B) · annotation ต้องแก้ code เพิ่มก่อน (C)",
   "source": "KC M07 ข้อ 10"
  }
 ]
});

GUIDE.registerKC("M08", {
 "summary": {
  "asks": "container คืออะไร, Docker (image · container · Dockerfile · คำสั่ง CLI), เหตุผลที่ microservices ใช้ container, orchestration, Amazon ECS, Elastic Beanstalk",
  "main": "container ห่อ code กับทุกอย่างที่ code ต้องใช้ไว้ด้วยกัน จึงย้ายไปรันที่ไหนก็ได้ · image คือแม่แบบที่อ่านอย่างเดียว ส่วน container คือตัวที่รันจาก image",
  "thinking": "ถ้าถามเรื่อง \"จัดตาราง วางที่ เปิดปิด container จำนวนมาก\" คำตอบคือ orchestration (ECS, EKS) · ถ้าถามเรื่อง deploy ของ Beanstalk ให้ดูว่าต้องการแบ่ง traffic เป็น % หรือไม่",
  "rules": "Dockerfile 1 คำสั่งได้ 1 layer แบบ read-only · Beanstalk ทำ canary ใช้ Traffic splitting"
 },
 "remember": [
  {
   "type": "list",
   "items": [
    "image เป็นแม่แบบที่อ่านอย่างเดียว · container คือ instance ที่รันได้ · registry เป็นที่เก็บ image",
    "`docker build` ได้ image · `docker run` ได้ container · `docker exec` เข้าไปใน container",
    "ECS launch type คือ EC2 กับ Fargate ไม่มี Lambda",
    "ชั้นของ Beanstalk: application → environment → platform"
   ]
  },
  {
   "type": "table",
   "head": [
    "Beanstalk policy",
    "ทำยังไง"
   ],
   "rows": [
    [
     "All at once",
     "deploy ทุก instance พร้อมกัน (ระบบล่มช่วงหนึ่ง)"
    ],
    [
     "Rolling / Rolling with additional batch",
     "ทยอย deploy ทีละ batch"
    ],
    [
     "Immutable",
     "สร้าง instance ชุดใหม่ทั้งหมด"
    ],
    [
     "Traffic splitting",
     "สร้างชุดใหม่แล้วแบ่ง % traffic (canary)"
    ]
   ]
  }
 ],
 "questions": [
  {
   "id": "k-m08-01",
   "prompt": "Which option describes a benefit that led the shipping industry and the software industry to use containers?",
   "choices": [
    {
     "text": "Infrastructure providers can create strong dependencies between their platform and the types of containers that they choose to work with.",
     "correct": false
    },
    {
     "text": "The abstraction of details of what's being \"shipped\" increases the agility of a system.",
     "correct": true
    },
    {
     "text": "Increased visibility into the details of what's being \"shipped\" helps each point in the system to provide the right type of support.",
     "correct": false
    },
    {
     "text": "The ability to use nonstandard types of containers gives producers flexibility.",
     "correct": false
    }
   ],
   "explain": "ตู้คอนเทนเนอร์เรือมีขนาดมาตรฐาน เรือ รถ และเครนจึงไม่ต้องรู้ว่าข้างในมีอะไร container ของซอฟต์แวร์ก็ทำแบบเดียวกัน · ข้อ C กลับด้านกับความจริง (ยิ่งต้องเห็นรายละเอียดยิ่งช้า) · ข้อ D ผิด เพราะประโยชน์มาจากการใช้มาตรฐานเดียวกัน",
   "source": "KC M08 ข้อ 1"
  },
  {
   "id": "k-m08-02",
   "prompt": "Which options are components of a container? (Select TWO.)",
   "choices": [
    {
     "text": "Host server",
     "correct": false
    },
    {
     "text": "Runtime engine",
     "correct": true
    },
    {
     "text": "Operating system",
     "correct": false
    },
    {
     "text": "Application code",
     "correct": true
    },
    {
     "text": "Virtual machine",
     "correct": false
    }
   ],
   "explain": "container ไม่มี OS เต็มตัว เพราะใช้ kernel ร่วมกับเครื่อง host · host server กับ virtual machine เป็นที่ที่ container ไปรัน ไม่ใช่ส่วนประกอบของ container",
   "source": "KC M08 ข้อ 2"
  },
  {
   "id": "k-m08-03",
   "prompt": "Which statement about Docker containers is true?",
   "choices": [
    {
     "text": "A container is a runnable instance of an image.",
     "correct": true
    },
    {
     "text": "A container registry is a template to launch containers.",
     "correct": false
    },
    {
     "text": "A container image is a writeable template.",
     "correct": false
    },
    {
     "text": "A container layer is a thin read-only layer that is associated with a running container.",
     "correct": false
    }
   ],
   "explain": "ข้อ B ผิด เพราะ registry เป็นที่เก็บ image ส่วนแม่แบบคือ image เอง · ข้อ C ผิด เพราะ image เป็น read-only · ข้อ D สลับกัน เพราะ container layer ที่เพิ่มตอนรันเป็นชั้นบาง ๆ ที่ \"เขียนได้\"",
   "source": "KC M08 ข้อ 3"
  },
  {
   "id": "k-m08-04",
   "prompt": "Which Docker CLI command creates a container named my_app_1 from the image named node_app?",
   "choices": [
    {
     "text": "`docker run --name my_app_1 node_app`",
     "correct": true
    },
    {
     "text": "`docker build --tag my_app_1`",
     "correct": false
    },
    {
     "text": "`docker exec -it my_app_1 sh`",
     "correct": false
    },
    {
     "text": "`docker images my_app_1 from node_app`",
     "correct": false
    }
   ],
   "explain": "`run` สร้าง container จาก image แล้วรัน · `build` สร้าง image จาก Dockerfile · `exec` เข้าไปสั่งคำสั่งใน container ที่รันอยู่แล้ว · `images` แสดงรายการ image และไม่มี syntax `from`",
   "source": "KC M08 ข้อ 4"
  },
  {
   "id": "k-m08-05",
   "prompt": "Which statement about a Dockerfile is true?",
   "choices": [
    {
     "text": "A Dockerfile is a YAML file that provides instructions to create a container image.",
     "correct": false
    },
    {
     "text": "Each instruction in a Dockerfile creates a read-only layer in the image.",
     "correct": true
    },
    {
     "text": "If a developer changes the Dockerfile and rebuilds the image, all layers of the image must be rebuilt.",
     "correct": false
    },
    {
     "text": "Developers cannot use the Dockerfile to run scripts that would run after the container is instantiated.",
     "correct": false
    }
   ],
   "explain": "ข้อ A ผิด เพราะ Dockerfile เป็น plain text ไม่ใช่ YAML · ข้อ C ผิด เพราะ Docker cache layer ไว้ แล้ว build ใหม่เฉพาะ layer ที่เปลี่ยนกับ layer ที่อยู่ถัดลงไป · ข้อ D ผิด เพราะมี `CMD` กับ `ENTRYPOINT` ไว้สั่งรันตอน container เริ่มทำงาน",
   "source": "KC M08 ข้อ 5"
  },
  {
   "id": "k-m08-06",
   "prompt": "A developer wants to migrate a monolithic shopping website to a microservice-based application. Which option reflects a reason to choose containers?",
   "choices": [
    {
     "text": "Each container can use the language and technology that are best suited for the service.",
     "correct": true
    },
    {
     "text": "Containerized components are not isolated, so the application will evolve as a singular system.",
     "correct": false
    },
    {
     "text": "Containers are well-suited to designs that avoid the use of temporary resources.",
     "correct": false
    },
    {
     "text": "Containers separate your dependencies and libraries into their own objects.",
     "correct": false
    }
   ],
   "explain": "ข้อ B ผิด เพราะ container แยกขาดจากกัน และ microservices ก็ต้องโตแยกกันได้ · ข้อ C ผิด เพราะ container เหมาะกับทรัพยากรชั่วคราวที่เปิดปิดบ่อย · ข้อ D ผิด เพราะ container รวม dependency ไว้กับ code ไม่ได้แยกออกไป",
   "source": "KC M08 ข้อ 6"
  },
  {
   "id": "k-m08-07",
   "prompt": "A developer recently built a proof-of-concept application using containers, and the business owner wants to roll it out to production. Which option reflects a primary reason that the developer might use a container orchestration service?",
   "choices": [
    {
     "text": "To schedule container starts and stops and determine where to place containers",
     "correct": true
    },
    {
     "text": "To base their containers on third-party images",
     "correct": false
    },
    {
     "text": "To remove the requirement to use a container registry",
     "correct": false
    },
    {
     "text": "To receive automated recommendations about how to improve their application code to run on containers",
     "correct": false
    }
   ],
   "explain": "งานหลักของ orchestration คือ scheduling กับ placement · การใช้ image จากที่อื่น การมีหรือไม่มี registry และคำแนะนำเรื่อง code ไม่ใช่หน้าที่ของ orchestration",
   "source": "KC M08 ข้อ 7"
  },
  {
   "id": "k-m08-08",
   "prompt": "Which statement about the Amazon Elastic Container Service (Amazon ECS) is true?",
   "choices": [
    {
     "text": "Amazon ECS is a highly scalable container orchestration service that supports Docker containers.",
     "correct": true
    },
    {
     "text": "Amazon ECS requires the use of the Amazon Elastic Container Registry (Amazon ECR) for container images.",
     "correct": false
    },
    {
     "text": "Amazon ECS supports launching containers in Amazon EC2 or AWS Lambda.",
     "correct": false
    },
    {
     "text": "With Amazon ECS, you can deploy applications to containers even if they have not been architected specifically to run on containers.",
     "correct": false
    }
   ],
   "explain": "ข้อ B ผิด เพราะดึง image จาก registry อื่นได้ เช่น Docker Hub · ข้อ C ผิด เพราะ launch type ของ ECS คือ EC2 กับ Fargate ไม่มี Lambda · ข้อ D ผิด เพราะแอปต้องถูกทำเป็น container ก่อน",
   "source": "KC M08 ข้อ 8"
  },
  {
   "id": "k-m08-09",
   "prompt": "What is the name for a logical collection of AWS Elastic Beanstalk components, which is conceptually similar to a folder?",
   "choices": [
    {
     "text": "Environment",
     "correct": false
    },
    {
     "text": "Platform",
     "correct": false
    },
    {
     "text": "Application",
     "correct": true
    },
    {
     "text": "Environment tier",
     "correct": false
    }
   ],
   "explain": "ใน Beanstalk ลำดับชั้นคือ application (เหมือนโฟลเดอร์) → environment (ชุด resource ที่รัน version หนึ่ง) → platform (OS + runtime) · environment tier แยกระหว่าง web server กับ worker",
   "source": "KC M08 ข้อ 9"
  },
  {
   "id": "k-m08-10",
   "prompt": "A developer wants to do canary testing on a new deployment. Which AWS Elastic Beanstalk deployment policy option should the developer use?",
   "choices": [
    {
     "text": "Immutable",
     "correct": false
    },
    {
     "text": "Rolling with batch",
     "correct": false
    },
    {
     "text": "Traffic Splitting",
     "correct": true
    },
    {
     "text": "Blue/Green",
     "correct": false
    }
   ],
   "explain": "canary คือปล่อยให้ traffic ส่วนน้อยไปลอง version ใหม่ก่อน · Traffic splitting ตั้งเป็น % ได้แล้วค่อยย้ายทั้งหมด · Immutable สร้าง instance ใหม่ทั้งชุดแต่ไม่แบ่ง % · Blue/Green สลับทั้ง environment ผ่าน URL swap ซึ่งไม่ใช่ policy ในหน้า deploy",
   "source": "KC M08 ข้อ 10"
  }
 ]
});

GUIDE.registerKC("M09", {
 "summary": {
  "asks": "หลักการ caching, ElastiCache (Redis เทียบ Memcached, endpoint, หน้าที่ของ developer), CloudFront (edge location, cache hit ratio, การหมดอายุ, CloudFront Functions), lazy loading",
  "main": "ข้อมูลใน cache ให้ถือว่าเก่าเสมอ จะ cache อะไรได้ขึ้นกับว่าแต่ละที่ยอมรับข้อมูลเก่าได้แค่ไหน · cache ใส่ได้ทุกชั้นของแอป",
  "thinking": "ต้องการ read replica หรือฟีเจอร์ครบ เลือก Redis · ผู้ใช้อยู่ไกลจาก server ใช้ CloudFront · งานเบา ๆ ที่ edge (redirect, ใส่ header) ใช้ CloudFront Functions",
  "rules": "logic ของ lazy loading (ดู cache ก่อน ไม่เจอค่อยไปเอาจาก DB แล้วเก็บลง cache) developer ต้องเขียนเอง"
 },
 "remember": [
  {
   "type": "table",
   "head": [
    "เรื่อง",
    "Redis",
    "Memcached"
   ],
   "rows": [
    [
     "read replica · persistence · โครงข้อมูลซับซ้อน",
     "มี",
     "ไม่มี"
    ],
    [
     "แบ่งข้อมูล",
     "shard",
     "กระจายตาม node"
    ],
    [
     "เหมาะกับ",
     "งานที่ต้องการฟีเจอร์ครบ",
     "งาน cache ง่าย ๆ ที่ใช้หลาย thread"
    ]
   ]
  },
  {
   "type": "table",
   "head": [
    "กลยุทธ์",
    "ข้อดี",
    "ข้อเสีย"
   ],
   "rows": [
    [
     "Lazy loading",
     "cache เฉพาะที่ถูกขอ, node พังก็ไม่เป็นไร",
     "cache miss แรกช้า, ข้อมูลเก่าได้"
    ],
    [
     "Write-through",
     "ข้อมูลใน cache ไม่เก่า",
     "เขียนต้องไปสองที่, cache churn"
    ]
   ]
  },
  {
   "type": "list",
   "items": [
    "CloudFront Functions ใช้กับงานเบา (header, redirect) · Lambda@Edge ใช้กับงานหนัก (network, library, body)",
    "เพิ่ม cache hit ratio ด้วยการลดค่าใน cache key"
   ]
  }
 ],
 "questions": [
  {
   "id": "k-m09-01",
   "prompt": "An architect suggests that the developers implement caching on an existing application to address performance issues. Which option describes factors that the developers should consider when they decide where to add caching?",
   "choices": [
    {
     "text": "Avoid caching for data queries that are slow and expensive to run.",
     "correct": false
    },
    {
     "text": "Review the data and its access patterns. Data that changes rapidly but is infrequently accessed should be cached.",
     "correct": false
    },
    {
     "text": "Consider the tolerance for stale data in each context where the data is used.",
     "correct": true
    },
    {
     "text": "Add as much caching in as many places as you can as early in development as possible.",
     "correct": false
    }
   ],
   "explain": "ข้อ A กลับด้าน เพราะ query ที่ช้าและแพงคือข้อมูลที่ควร cache ที่สุด · ข้อ B ก็กลับด้าน เพราะข้อมูลที่ควร cache คือข้อมูลที่เปลี่ยนช้าแต่ถูกอ่านบ่อย · ข้อ D ใส่ cache เยอะโดยไม่ได้ดูข้อมูลก่อนจะเพิ่มความซับซ้อนและเสี่ยงได้ข้อมูลเก่า",
   "source": "KC M09 ข้อ 1",
   "topic": 2
  },
  {
   "id": "k-m09-02",
   "prompt": "A developer has determined that an in-memory key-value store would improve performance of their application's queries. They want to keep the solution as simple as possible and need to support read replicas. Which option should they choose?",
   "choices": [
    {
     "text": "Amazon ElastiCache for Memcached",
     "correct": false
    },
    {
     "text": "Amazon ElastiCache for Redis",
     "correct": true
    },
    {
     "text": "Amazon CloudFront Functions",
     "correct": false
    },
    {
     "text": "Lambda@Edge",
     "correct": false
    }
   ],
   "explain": "ทั้งสองตัวเป็น in-memory key-value store แต่มี read replica เฉพาะ Redis · CloudFront Functions กับ Lambda@Edge เป็น code ที่รันที่ edge ไม่ใช่ที่เก็บข้อมูล",
   "source": "KC M09 ข้อ 2",
   "topic": 3
  },
  {
   "id": "k-m09-03",
   "prompt": "Amazon ElastiCache is being added to an application to improve response times and alleviate database pressure. The backend database for the application is an Amazon Relational Database Service (Amazon RDS) database. Which task would be the responsibility of the application developer?",
   "choices": [
    {
     "text": "Applying software patches to the cache instances",
     "correct": false
    },
    {
     "text": "Writing code to check the health of the cluster before writing to the cache",
     "correct": false
    },
    {
     "text": "Writing code that looks for the requested data in the cache and, if the data is not found, requests it from the origin",
     "correct": true
    },
    {
     "text": "Write code to integrate the cache with the Amazon RDS instances that it will be reading from",
     "correct": false
    }
   ],
   "explain": "ElastiCache เป็น managed service AWS จึงทำ patch และตรวจสุขภาพ cluster ให้ (A, B) · ข้อ D ผิด เพราะ cache ไม่ได้ต่อกับ RDS เอง แอปเป็นตัวกลางที่คุยกับทั้งสองฝั่ง",
   "source": "KC M09 ข้อ 3",
   "topic": 6
  },
  {
   "id": "k-m09-04",
   "prompt": "Which statement about Amazon ElastiCache is true?",
   "choices": [
    {
     "text": "A node is a variable-size chunk of secure, network-attached RAM.",
     "correct": false
    },
    {
     "text": "Your application connects to an ElastiCache node by using a unique address called an endpoint.",
     "correct": true
    },
    {
     "text": "With the Memcached engine, data is partitioned across shards in a cluster.",
     "correct": false
    },
    {
     "text": "Every node within a cluster must run the same cache engine, but the nodes can run on different instance types.",
     "correct": false
    }
   ],
   "explain": "ข้อ A ผิดตรง \"variable-size\" เพราะ node มีขนาดคงที่ · ข้อ C ผิด เพราะ shard เป็นคำของ Redis ส่วน Memcached กระจายข้อมูลไปตาม node · ข้อ D ผิด เพราะทุก node ใน cluster ต้องเป็น instance type เดียวกันด้วย",
   "source": "KC M09 ข้อ 4",
   "topic": 4
  },
  {
   "id": "k-m09-05",
   "prompt": "A developer has been asked to address complaints from customers in the London area about the performance of a web-based application that is hosted in New York. Which option might the developer implement?",
   "choices": [
    {
     "text": "Use Amazon CloudFront to replicate the application code on Amazon Elastic Compute Cloud (Amazon EC2) instances in the London Region.",
     "correct": false
    },
    {
     "text": "Set up a CloudFront distribution that can serve static content from edge locations that are closer to UK users.",
     "correct": true
    },
    {
     "text": "Set up a CloudFront regional edge location in the London Region.",
     "correct": false
    },
    {
     "text": "Set up one CloudFront edge location in New York and one in London.",
     "correct": false
    }
   ],
   "explain": "CloudFront เป็น CDN ไม่ได้ copy code ไปลง EC2 (A) · edge location กับ regional edge cache เป็นของ AWS เราสร้างหรือเลือกตั้งเองไม่ได้ (C, D) · เราสร้างแค่ distribution แล้ว CloudFront จะส่ง request ไปที่ edge ที่ใกล้ที่สุดเอง",
   "source": "KC M09 ข้อ 5",
   "topic": 9
  },
  {
   "id": "k-m09-06",
   "prompt": "A developer has been asked to increase the cache hit ratio for their Amazon CloudFront distribution. Which option should they try?",
   "choices": [
    {
     "text": "Include only the minimum necessary values in the cache key.",
     "correct": true
    },
    {
     "text": "Decrease the maximum time to live (TTL) setting in a cache policy.",
     "correct": false
    },
    {
     "text": "Decrease the max-age setting in a file's Cache-Control header.",
     "correct": false
    },
    {
     "text": "Increase the cache hit setting in a cache policy.",
     "correct": false
    }
   ],
   "explain": "ยิ่ง cache key มีค่ามาก (header, cookie, query string) ยิ่งแตกเป็นหลาย object และเจอซ้ำน้อยลง · ลด TTL หรือ max-age ทำให้ object หมดอายุเร็วขึ้น hit ratio จึงลดลง (B, C) · ใน cache policy ไม่มีค่าที่ชื่อ \"cache hit setting\" (D)",
   "source": "KC M09 ข้อ 6"
  },
  {
   "id": "k-m09-07",
   "prompt": "Which statement about Amazon CloudFront cached file expiration is true?",
   "choices": [
    {
     "text": "Each file in the cache automatically expires after 24 hours, and you cannot modify this setting.",
     "correct": false
    },
    {
     "text": "After a file expires, the next time the edge location gets a user request for the file, CloudFront forwards the request to the origin server.",
     "correct": true
    },
    {
     "text": "When the origin receives a request, the origin sends the latest version of the file regardless of whether it is the same as the expired version in the cache.",
     "correct": false
    },
    {
     "text": "You can control cache file duration with CloudFront cache policy settings or through Cache-Control settings in the origin file headers. However, you cannot combine these options.",
     "correct": false
    }
   ],
   "explain": "24 ชั่วโมงเป็นแค่ค่า default ที่แก้ได้ (A) · ถ้าไฟล์ที่ origin ไม่เปลี่ยน origin ตอบ 304 Not Modified ไม่ต้องส่งไฟล์ซ้ำ (C) · cache policy กับ Cache-Control header ใช้ร่วมกันได้ โดย min/max TTL ใน policy เป็นกรอบ (D)",
   "source": "KC M09 ข้อ 7",
   "topic": 11
  },
  {
   "id": "k-m09-08",
   "prompt": "Which use case suggests the use of Amazon CloudFront Functions?",
   "choices": [
    {
     "text": "A function that redirects the viewer to a different URL and adds a custom response header",
     "correct": true
    },
    {
     "text": "A function that uses a third-party library",
     "correct": false
    },
    {
     "text": "A function that requires network access to use external services for processing",
     "correct": false
    },
    {
     "text": "A function that requires access to the body of HTTP requests",
     "correct": false
    }
   ],
   "explain": "CloudFront Functions ใช้กับงานเบามาก ๆ (แก้ header, redirect, rewrite URL) · ใช้ library ภายนอก ต่อ network หรืออ่าน request body ไม่ได้ ข้อ B, C และ D จึงต้องใช้ Lambda@Edge",
   "source": "KC M09 ข้อ 8"
  },
  {
   "id": "k-m09-09",
   "prompt": "Which statement reflects a benefit of lazy loading as a caching strategy?",
   "choices": [
    {
     "text": "Lazy loading avoids filling up the cache with data that is not requested.",
     "correct": true
    },
    {
     "text": "With lazy loading, data in the cache never becomes stale.",
     "correct": false
    },
    {
     "text": "With lazy loading, every write involves two trips—a write to the cache and a write to the database—which adds latency to the process.",
     "correct": false
    },
    {
     "text": "Lazy loading might result in cache churn. The cache might be updated often if certain records are updated repeatedly.",
     "correct": false
    }
   ],
   "explain": "ข้อ C กับ D เป็นข้อเสียของ write-through ไม่ใช่ lazy loading · ข้อ B ผิด เพราะ lazy loading นี่แหละที่ข้อมูลเก่าได้ (ข้อมูลใน DB เปลี่ยนแล้วแต่ cache ยังไม่เปลี่ยน) จึงต้องตั้ง TTL",
   "source": "KC M09 ข้อ 9"
  },
  {
   "id": "k-m09-10",
   "prompt": "A developer has been asked whether caching might improve the performance of their online bidding application. How should they answer this question?",
   "choices": [
    {
     "text": "Caching probably will not yield much performance improvement for this type of application.",
     "correct": false
    },
    {
     "text": "Caching might improve performance by reducing the number of hits to the backend database. However, caching cannot improve performance issues that occur between the client and the web server.",
     "correct": false
    },
    {
     "text": "Using different types of caching at each application layer might improve both the frontend and backend performance.",
     "correct": true
    },
    {
     "text": "Caching might greatly improve performance if the application is compute heavy, but if the application is read heavy, a cache will not provide much benefit.",
     "correct": false
    }
   ],
   "explain": "ข้อ B ผิด เพราะช่วงระหว่าง client กับ web server ใช้ CDN (CloudFront) ช่วยได้ · ข้อ D กลับด้าน เพราะแอปที่อ่านเยอะคือแอปที่ cache ช่วยได้มากที่สุด",
   "source": "KC M09 ข้อ 10",
   "topic": 1
  }
 ]
});

GUIDE.registerKC("M10", {
 "summary": {
  "asks": "queue เทียบ pub/sub, การใช้งาน Amazon SQS (ReceiveMessage, visibility timeout, dead-letter queue, polling), Amazon SNS (topic, filter policy), Amazon Kinesis Data Streams (KPL, shard)",
  "main": "SQS เป็น queue ที่ consumer ต้องมา poll เอา และข้อความหนึ่งถูกประมวลผลครั้งเดียว · SNS เป็น pub/sub ที่ topic push ข้อความไปให้ subscriber ทุกตัว · Kinesis เป็น stream ที่ข้อมูลอยู่จนหมดอายุ อ่านซ้ำได้หลายตัว",
  "thinking": "ข้อความถูกประมวลผลซ้ำ แก้ด้วยการเพิ่ม visibility timeout · ข้อความเสียวนอยู่ในคิว แก้ด้วย DLQ กับ maxReceiveCount ต่ำ · subscriber อยากได้ข้อความบางประเภท ใช้ filter policy",
  "rules": "ReceiveMessage ดึงได้ครั้งละไม่เกิน 10 ข้อความ · long polling ต้องตั้ง WaitTimeSeconds มากกว่า 0 (ค่า default คือ short polling)"
 },
 "remember": [
  {
   "type": "table",
   "head": [
    "",
    "SQS",
    "SNS",
    "Kinesis Data Streams"
   ],
   "rows": [
    [
     "รูปแบบ",
     "queue (consumer poll)",
     "pub/sub (push)",
     "stream (consumer อ่าน)"
    ],
    [
     "ข้อความหนึ่งไปถึง",
     "consumer ตัวเดียว",
     "subscriber ทุกตัว",
     "consumer ทุกตัว อ่านซ้ำได้"
    ],
    [
     "ข้อความหายเมื่อ",
     "consumer ลบ",
     "ส่งถึงแล้ว",
     "หมด retention"
    ],
    [
     "คำสำคัญ",
     "visibility timeout, DLQ, long polling",
     "topic, filter policy",
     "shard, KPL/KCL"
    ]
   ]
  },
  {
   "type": "list",
   "items": [
    "ข้อความถูกประมวลผลซ้ำ แก้ด้วยการเพิ่ม visibility timeout · ข้อความพังอุดคิว แก้ด้วย DLQ กับ maxReceiveCount ต่ำ",
    "ฝั่งเขียนลง Kinesis ใช้ KPL · ฝั่งอ่านใช้ KCL"
   ]
  }
 ],
 "questions": [
  {
   "id": "k-m10-01",
   "prompt": "Which option describes how a message queue processes messages?",
   "choices": [
    {
     "text": "The queue polls producers for new messages.",
     "correct": false
    },
    {
     "text": "Consumers poll the queue for messages.",
     "correct": true
    },
    {
     "text": "The queue broadcasts messages to consumers.",
     "correct": false
    },
    {
     "text": "Consumers notify the queue when a message has been successfully processed. The queue configuration determines whether the message should be available to other consumers.",
     "correct": false
    }
   ],
   "explain": "producer เป็นฝ่ายส่งเข้าคิวเอง คิวไม่ได้ไปดึง (A) · การ broadcast เป็นแบบ pub/sub (C) · consumer บอกว่าเสร็จด้วยการ \"ลบ\" ข้อความ ส่วนการที่ข้อความกลับมาให้ตัวอื่นเห็นอีกขึ้นกับ visibility timeout ไม่ได้ขึ้นกับการแจ้ง (D)",
   "source": "KC M10 ข้อ 1"
  },
  {
   "id": "k-m10-02",
   "prompt": "Which option describes how publish/subscribe (pub/sub) messaging works?",
   "choices": [
    {
     "text": "Producers send messages to subscribers.",
     "correct": false
    },
    {
     "text": "Subscribers poll topics for new messages.",
     "correct": false
    },
    {
     "text": "When a topic receives a new message, the topic sends the message to the first subscriber who responds to a notification.",
     "correct": false
    },
    {
     "text": "A new topic message is pushed out to all topic subscribers.",
     "correct": true
    }
   ],
   "explain": "producer ส่งไปที่ topic ไม่ได้ส่งตรงถึง subscriber (A) · pub/sub ใช้ push ไม่ใช่ poll (B) · ส่งให้ทุกตัว ไม่ใช่เฉพาะตัวแรก (C)",
   "source": "KC M10 ข้อ 2"
  },
  {
   "id": "k-m10-03",
   "prompt": "A developer wants to add an Amazon Simple Queue Service (Amazon SQS) queue to decouple incoming order requests from a backend database. Which Amazon SQS operations might be part of this update?",
   "choices": [
    {
     "text": "Use the SendMessage operation with the QueueURL mapped to the database endpoint to put messages on the queue.",
     "correct": false
    },
    {
     "text": "Use the ReceiveMessage operation with MaxNumberOfMessages set to 5 to retrieve up to 5 messages off the queue at one time.",
     "correct": true
    },
    {
     "text": "Use the DeleteMessage operation to change the visibility of the message as soon as the ReceiptHandle is received.",
     "correct": false
    },
    {
     "text": "Use the ReceiveMessage operation with the WaitTimeSeconds parameter set to 0 to reduce the number of empty requests.",
     "correct": false
    }
   ],
   "explain": "QueueURL คือ URL ของคิว ไม่ใช่ endpoint ของ database (A) · DeleteMessage ลบข้อความ ส่วนการเปลี่ยน visibility ใช้ ChangeMessageVisibility (C) · WaitTimeSeconds = 0 คือ short polling ซึ่งได้ response เปล่าบ่อยขึ้น จึงต้องตั้งมากกว่า 0 (D)",
   "source": "KC M10 ข้อ 3"
  },
  {
   "id": "k-m10-04",
   "prompt": "A tester reports that Amazon Simple Queue Service (Amazon SQS) messages are being processed more than once. The developer finds that processing servers are not completing as quickly as expected, and messages are made available to other consumers before the prior consumer deletes them. Which option might reduce occurrences of this issue?",
   "choices": [
    {
     "text": "Increase the visibility timeout.",
     "correct": true
    },
    {
     "text": "Increase maxReceiveCount.",
     "correct": false
    },
    {
     "text": "Increase MaxNumberOfMessages.",
     "correct": false
    },
    {
     "text": "Increase the number of producers on the queue.",
     "correct": false
    }
   ],
   "explain": "visibility timeout คือช่วงที่ข้อความถูกซ่อนจาก consumer ตัวอื่นหลังมีตัวหนึ่งรับไปแล้ว ถ้าประมวลผลนานเกินช่วงนี้ ข้อความจะกลับมาให้ตัวอื่นเห็นอีก · maxReceiveCount ใช้กับ DLQ · ดึงทีละมากขึ้น (C) หรือเพิ่ม producer (D) ทำให้ปัญหาแย่ลง",
   "source": "KC M10 ข้อ 4"
  },
  {
   "id": "k-m10-05",
   "prompt": "For an order-processing application that uses an Amazon Simple Queue Service (Amazon SQS) queue, a developer finds that an older version of the client generates order records that fail the backend process. The failures cause a bottleneck on the queue. How might the developer reduce the impact of the failed records?",
   "choices": [
    {
     "text": "Increase the visibility timeout and set a high value for MaxNumberOfMessages.",
     "correct": false
    },
    {
     "text": "Add a dead-letter queue and set a low maxReceiveCount.",
     "correct": true
    },
    {
     "text": "Use long polling and set a high wait time.",
     "correct": false
    },
    {
     "text": "Change the queue type from standard to First-In-First-Out (FIFO) and set a high throughput rate.",
     "correct": false
    }
   ],
   "explain": "ข้อความที่พังจะถูกรับซ้ำจนครบ maxReceiveCount แล้วย้ายไป DLQ ตั้งค่าต่ำจะย้ายเร็ว ไม่วนอุดคิว · ข้อ A, C และ D ไม่ได้แยกข้อความเสียออกจากคิว",
   "source": "KC M10 ข้อ 5"
  },
  {
   "id": "k-m10-06",
   "prompt": "Which statement about Amazon Simple Queue Service (Amazon SQS) polling options is true?",
   "choices": [
    {
     "text": "By default, when you make a ReceiveMessage API call, Amazon SQS performs long polling.",
     "correct": false
    },
    {
     "text": "When long polling is configured, WaitTimeSeconds is set to 0.",
     "correct": false
    },
    {
     "text": "When short polling is configured, Amazon SQS queries all of its servers.",
     "correct": false
    },
    {
     "text": "When short polling is configured, Amazon SQS samples a subset of its servers.",
     "correct": true
    }
   ],
   "explain": "ค่า default คือ short polling (A ผิด) · long polling ต้องตั้ง WaitTimeSeconds 1–20 วินาที ส่วน 0 คือ short (B ผิด) · ถามทุก server คือ long polling (C ผิด) · short polling จึงอาจตอบว่าว่างทั้งที่ยังมีข้อความอยู่",
   "source": "KC M10 ข้อ 6"
  },
  {
   "id": "k-m10-07",
   "prompt": "Which statement about Amazon Simple Notification Service (Amazon SNS) is true?",
   "choices": [
    {
     "text": "An SNS topic is a logical access point, which acts as a communication channel.",
     "correct": true
    },
    {
     "text": "A publisher can only send messages to topics that they have created.",
     "correct": false
    },
    {
     "text": "By default, different subscribers to a topic receive different messages.",
     "correct": false
    },
    {
     "text": "Amazon SNS defines a single delivery policy, which is applied to all delivery protocols.",
     "correct": false
    }
   ],
   "explain": "ถ้ามีสิทธิ์ก็ส่งเข้า topic ที่คนอื่นสร้างได้ (B) · ค่า default คือทุก subscriber ได้ข้อความเดียวกัน ถ้าจะแยกต้องใช้ filter policy (C) · delivery policy ตั้งแยกตาม protocol ได้ (D)",
   "source": "KC M10 ข้อ 7"
  },
  {
   "id": "k-m10-08",
   "prompt": "An Amazon Simple Notification Service (Amazon SNS) topic receives messages about orders. An AWS Lambda function that processes canceled orders is subscribed to the topic. How might the developer reduce costs by only invoking the Lambda function for canceled orders?",
   "choices": [
    {
     "text": "Put an Amazon Simple Queue Service (Amazon SQS) queue in front of the Lambda function.",
     "correct": false
    },
    {
     "text": "Separate the new order and cancel order messages to be sent by two different publishers.",
     "correct": false
    },
    {
     "text": "Set up a filter policy so that the Lambda function subscription only receives cancel order messages.",
     "correct": true
    },
    {
     "text": "Use the ConfirmSubscription operation to limit which messages the Lambda function receives.",
     "correct": false
    }
   ],
   "explain": "ใส่ SQS คั่นไว้ (A) Lambda ก็ยังได้ข้อความทุกประเภท · แยก publisher (B) ไม่ได้ช่วย ถ้ายังส่งเข้า topic เดียวกัน · ConfirmSubscription ใช้แค่ยืนยันการสมัคร (D)",
   "source": "KC M10 ข้อ 8"
  },
  {
   "id": "k-m10-09",
   "prompt": "A developer needs to build a custom application to put customer application log records onto an Amazon Kinesis data stream. What should they use to build the application?",
   "choices": [
    {
     "text": "Use the Kinesis API.",
     "correct": false
    },
    {
     "text": "Use the Kinesis Producer Library (KPL).",
     "correct": true
    },
    {
     "text": "Use the Kinesis Client Library (KCL).",
     "correct": false
    },
    {
     "text": "Use Amazon Managed Service for Apache Flink.",
     "correct": false
    }
   ],
   "explain": "ฝั่งที่ \"ใส่\" ข้อมูลเข้า stream คือ producer จึงใช้ KPL · KCL ใช้ฝั่ง consumer ที่อ่านข้อมูล · Flink ใช้วิเคราะห์ stream · Kinesis API ใช้ได้เหมือนกัน แต่ KPL จัดการ batching กับ retry ให้ จึงเหมาะกับการสร้างแอปมากกว่า",
   "source": "KC M10 ข้อ 9"
  },
  {
   "id": "k-m10-10",
   "prompt": "Which statement about Amazon Kinesis Data Streams is true?",
   "choices": [
    {
     "text": "When a record is added to the stream, the record is available until a consumer deletes it.",
     "correct": false
    },
    {
     "text": "The data records in a data stream are distributed into shards.",
     "correct": true
    },
    {
     "text": "A standard data stream can have one consumer. With the enhanced fanout option, you can add multiple consumers.",
     "correct": false
    },
    {
     "text": "A stream consumer must delete the records that it processes successfully.",
     "correct": false
    }
   ],
   "explain": "record อยู่ใน stream จนหมด retention period (default 24 ชั่วโมง) consumer ลบเองไม่ได้ (A, D ผิด และนี่คือจุดที่ต่างจาก SQS) · stream ปกติก็มีหลาย consumer ได้อยู่แล้ว ส่วน enhanced fan-out ให้ throughput แยกต่อ consumer (C ผิด)",
   "source": "KC M10 ข้อ 10",
   "topic": 4
  }
 ]
});

GUIDE.registerKC("M11", {
 "summary": {
  "asks": "AWS Step Functions ได้แก่ ใช้เมื่อไหร่, state แต่ละชนิด (Task · Choice · Map · Parallel · Succeed/Fail), taskToken สำหรับขั้นที่ต้องรอคนอนุมัติ, Standard กับ Express workflow, การต่อกับ API Gateway",
  "main": "Step Functions คุมลำดับ การแตกทาง การ retry และ error ของหลายขั้นตอนให้ ตัว function จึงเขียนแค่ business logic",
  "thinking": "จับคำในโจทย์กับ state ให้ได้ คือ \"ขึ้นกับเงื่อนไข\" = Choice · \"ทำซ้ำทุกชิ้นใน array\" = Map · \"สองงานพร้อมกันแล้วรอทั้งคู่\" = Parallel · \"ทำงานจริง\" = Task",
  "rules": "Express ใช้กับงานเร็ว ปริมาณมาก (ไม่เกิน 5 นาที) · Standard ใช้กับงานยาว (ไม่เกิน 1 ปี) ที่ต้อง audit ย้อนหลังได้"
 },
 "remember": [
  {
   "type": "table",
   "head": [
    "คำในโจทย์",
    "state"
   ],
   "rows": [
    [
     "ทำงานจริง (เรียก Lambda หรือ activity)",
     "Task"
    ],
    [
     "แตกทางตามเงื่อนไข",
     "Choice"
    ],
    [
     "ทำขั้นเดิมกับทุกชิ้นใน array",
     "Map"
    ],
    [
     "หลายงานพร้อมกันแล้วรอทั้งหมด",
     "Parallel"
    ],
    [
     "รอตามเวลา",
     "Wait"
    ],
    [
     "ส่งข้อมูลต่อ ไม่ทำงาน",
     "Pass"
    ],
    [
     "จบ (ไม่มี `Next`)",
     "Succeed / Fail"
    ]
   ]
  },
  {
   "type": "table",
   "head": [
    "",
    "Standard",
    "Express"
   ],
   "rows": [
    [
     "รันได้นานสุด",
     "1 ปี",
     "5 นาที"
    ],
    [
     "เหมาะกับ",
     "งานยาวที่ต้อง audit ย้อนหลัง",
     "event ปริมาณสูงมาก (IoT, streaming)"
    ]
   ]
  },
  {
   "type": "list",
   "items": [
    "ขั้นที่รอคนอนุมัติใช้ taskToken ร่วมกับ `SendTaskSuccess` หรือ `SendTaskFailure`"
   ]
  }
 ],
 "questions": [
  {
   "id": "k-m11-01",
   "prompt": "Which scenario suggests the need for a task coordination service such as AWS Step Functions?",
   "choices": [
    {
     "text": "A website that serves static content is expanding its reach to a global audience.",
     "correct": false
    },
    {
     "text": "A serverless application must run a series of AWS Lambda functions that are dependent on each other.",
     "correct": true
    },
    {
     "text": "A monolithic application that is written in Java is updating its technology stack.",
     "correct": false
    },
    {
     "text": "A reporting application must update its calculation logic to provide more analytical data to business users.",
     "correct": false
    }
   ],
   "explain": "งานหลายขั้นที่ต่อกันคือสิ่งที่ Step Functions ทำ · ข้อ A ใช้ CloudFront · ข้อ C เป็นเรื่องย้ายเทคโนโลยี · ข้อ D เป็นเรื่องแก้ logic ภายในแอป",
   "source": "KC M11 ข้อ 1"
  },
  {
   "id": "k-m11-02",
   "prompt": "Which statement describes a benefit of using AWS Step Functions for an application?",
   "choices": [
    {
     "text": "Step Functions integrates with state machines so that developers can transition between their Step Functions workflow and their state machine workflow.",
     "correct": false
    },
    {
     "text": "Step Functions can be configured with Amazon EC2 Auto Scaling to scale up and down.",
     "correct": false
    },
    {
     "text": "Step Functions can be defined by using either Python or Node.js.",
     "correct": false
    },
    {
     "text": "Developers can use Step Functions to build visual workflows.",
     "correct": true
    }
   ],
   "explain": "workflow ของ Step Functions ก็คือ state machine อยู่แล้ว ไม่ได้เป็นสองอย่างที่สลับกัน (A) · Step Functions เป็น serverless จึงไม่ใช้ EC2 Auto Scaling (B) · นิยามด้วย Amazon States Language (JSON) ไม่ใช่ Python หรือ Node.js (C)",
   "source": "KC M11 ข้อ 2"
  },
  {
   "id": "k-m11-03",
   "prompt": "What is the role of the Task state type in AWS Step Functions?",
   "choices": [
    {
     "text": "Task states are used to stop a failed workflow.",
     "correct": false
    },
    {
     "text": "Task states perform a unit of work.",
     "correct": true
    },
    {
     "text": "Task states provide branching logic.",
     "correct": false
    },
    {
     "text": "Task states tell the state machine the order to perform the steps in.",
     "correct": false
    }
   ],
   "explain": "หยุด workflow ที่ล้มเหลวใช้ Fail state (A) · แตกทางใช้ Choice state (C) · ลำดับขั้นกำหนดด้วย field `Next` (D)",
   "source": "KC M11 ข้อ 3",
   "topic": 2
  },
  {
   "id": "k-m11-04",
   "prompt": "An application that processes order returns must complete different steps depending on whether the return is within 30 days of purchase. Which AWS Step Functions state could a developer use to implement this logic?",
   "choices": [
    {
     "text": "Parallel",
     "correct": false
    },
    {
     "text": "Task",
     "correct": false
    },
    {
     "text": "Choice",
     "correct": true
    },
    {
     "text": "Wait",
     "correct": false
    }
   ],
   "explain": "คำว่า \"ทำขั้นต่างกันตามเงื่อนไข\" คือการแตกทาง ซึ่งเป็นหน้าที่ของ Choice",
   "source": "KC M11 ข้อ 4"
  },
  {
   "id": "k-m11-05",
   "prompt": "An application that processes order returns must run the same AWS Lambda function for each item in an order. Which AWS Step Functions state could a developer use to implement this logic?",
   "choices": [
    {
     "text": "Parallel",
     "correct": false
    },
    {
     "text": "Pass",
     "correct": false
    },
    {
     "text": "Map",
     "correct": true
    },
    {
     "text": "Task",
     "correct": false
    }
   ],
   "explain": "\"ทำขั้นเดิมกับทุกชิ้นใน array\" คือ Map · Parallel รันหลาย \"สาขา\" ที่ต่างกันพร้อมกัน · Pass ส่ง input ต่อไปเฉย ๆ โดยไม่ทำงาน",
   "source": "KC M11 ข้อ 5"
  },
  {
   "id": "k-m11-06",
   "prompt": "Which statement is true for both Succeed states and Fail states?",
   "choices": [
    {
     "text": "Succeed states and Fail states do not include the Next field.",
     "correct": true
    },
    {
     "text": "The End field is not required because Succeed states and Fail states are not terminal states.",
     "correct": false
    },
    {
     "text": "The Type field is optional for Succeed states and Fail states.",
     "correct": false
    },
    {
     "text": "The End field is required because Succeed states and Fail states are terminal states.",
     "correct": false
    }
   ],
   "explain": "ทั้งคู่เป็น terminal state คือจบ workflow ในตัวเองแล้ว จึงไม่มี `Next` และไม่ต้องใส่ `End` (B ผิดตรงคำว่า \"not terminal\" · D ผิดตรงคำว่า \"required\") · `Type` ต้องมีทุก state (C)",
   "source": "KC M11 ข้อ 6",
   "topic": 2
  },
  {
   "id": "k-m11-07",
   "prompt": "An application that processes order returns must run two independent audit checks. When both checks are successfully completed, the return authorization step is run. Which AWS Step Functions state could a developer use to implement this logic?",
   "choices": [
    {
     "text": "Parallel",
     "correct": true
    },
    {
     "text": "Task",
     "correct": false
    },
    {
     "text": "Choice",
     "correct": false
    },
    {
     "text": "Wait",
     "correct": false
    }
   ],
   "explain": "\"สองงานที่ไม่ขึ้นต่อกัน ต้องเสร็จทั้งคู่ก่อนไปขั้นถัดไป\" คือ Parallel",
   "source": "KC M11 ข้อ 7",
   "topic": 1
  },
  {
   "id": "k-m11-08",
   "prompt": "How is a taskToken used in an AWS Step Functions use case that includes a manual approval step?",
   "choices": [
    {
     "text": "A taskToken is generated when the workflow hits a Wait state. The taskToken tracks how long the workflow has been waiting for a task to finish.",
     "correct": false
    },
    {
     "text": "A taskToken is used to transition between each state in the workflow and is defined in the Next field.",
     "correct": false
    },
    {
     "text": "A taskToken is returned as part of a call to the GetActivityTask action and is used when calling the SendTaskSuccess action to associate a result with a task.",
     "correct": true
    },
    {
     "text": "A taskToken is an output of the Success state in a synchronous Step Functions Express workflow. A taskToken is used to confirm success of all tasks.",
     "correct": false
    }
   ],
   "explain": "ขั้นอนุมัติจากคน workflow จะหยุดรอ พอคนอนุมัติ ระบบเรียก `SendTaskSuccess` (หรือ `SendTaskFailure`) พร้อม token เพื่อบอกว่าผลนี้เป็นของ task ไหน · Wait state รอตามเวลาที่ตั้งไว้ ไม่เกี่ยวกับ token (A)",
   "source": "KC M11 ข้อ 8"
  },
  {
   "id": "k-m11-09",
   "prompt": "Which use case is a good fit for AWS Step Functions Express workflows?",
   "choices": [
    {
     "text": "All workflows in the application must be auditable up to 90 days after a completed run.",
     "correct": false
    },
    {
     "text": "The workflow requires a step that will run an application that is hosted on an Amazon Elastic Compute Cloud (Amazon EC2) instance.",
     "correct": false
    },
    {
     "text": "The workflow takes between 30 minutes and 1 hour to run.",
     "correct": false
    },
    {
     "text": "The workflow must support a very high rate of events that come from Internet of Things (IoT) devices.",
     "correct": true
    }
   ],
   "explain": "Express รันได้ไม่เกิน 5 นาที แต่รับปริมาณได้สูงมาก · ข้อ A (ดูประวัติย้อนหลัง 90 วัน) กับข้อ C (รัน 30–60 นาที) เป็นงานของ Standard · ข้อ B เกี่ยวกับ activity ที่รันบน EC2 ซึ่งไม่ใช่จุดที่บอกว่าต้องใช้ Express",
   "source": "KC M11 ข้อ 9"
  },
  {
   "id": "k-m11-10",
   "prompt": "Which statement about AWS Step Functions is true?",
   "choices": [
    {
     "text": "A developer can use Amazon API Gateway to associate their Step Functions APIs with methods in an API Gateway API.",
     "correct": true
    },
    {
     "text": "Step Functions has quotas at the account level regarding the number of registered state machines, but no quotas are related to individual Step Functions runs.",
     "correct": false
    },
    {
     "text": "Step Functions must be created in the visual editor on the Step Functions console but can be edited with the AWS SDKs.",
     "correct": false
    },
    {
     "text": "A developer can use the Describe API action to get a summary of all state machines and the number of times that each has been run.",
     "correct": false
    }
   ],
   "explain": "มี quota ต่อ execution ด้วย เช่น ระยะเวลาและขนาดของ history (B) · สร้างได้ทั้งด้วย SDK, CLI และ CloudFormation ไม่จำเป็นต้องใช้ console (C) · Describe ดูได้ทีละ state machine หรือทีละ execution ไม่ได้สรุปให้ทั้งหมด (D)",
   "source": "KC M11 ข้อ 10"
  }
 ]
});

GUIDE.registerKC("M12", {
 "summary": {
  "asks": "SSL/TLS กับ certificate authority, AWS Certificate Manager (ACM), วิธีดูแล credential ให้ปลอดภัย, AWS STS (IAM user เทียบกับ federated user), CloudTrail, Amazon Cognito (user pool · identity pool · ฟีเจอร์ความปลอดภัย · ใช้คู่กับ API Gateway)",
  "main": "ใช้ credential ชั่วคราว (IAM role หรือ STS) แทน access key ถาวร · user pool ใช้ \"ยืนยันตัวตน\" (sign-up/sign-in ได้ JWT) · identity pool ใช้ \"แลกเป็นสิทธิ์ AWS\" (ได้ credential ชั่วคราว)",
  "thinking": "ถ้าโจทย์ถาม \"ใครทำอะไรเมื่อไหร่\" คำตอบคือ CloudTrail · ถ้าถามเรื่อง sign-up/sign-in คือ user pool · ถ้าถามว่าผู้ใช้จะเข้าบริการ AWS อื่นได้ยังไง คือ identity pool",
  "rules": "flow กับ API Gateway คือ แอป sign in กับ user pool → ได้ JWT → แอปแนบ JWT ไปเรียก API Gateway"
 },
 "remember": [
  {
   "type": "table",
   "head": [
    "",
    "User pool",
    "Identity pool"
   ],
   "rows": [
    [
     "ทำอะไร",
     "ยืนยันตัวตน (sign-up, sign-in, MFA)",
     "ให้สิทธิ์เข้า AWS"
    ],
    [
     "ได้อะไร",
     "JWT (ID token, access token)",
     "AWS credential ชั่วคราว"
    ],
    [
     "ใช้กับ",
     "API Gateway (Cognito authorizer)",
     "เรียก S3, DynamoDB ตรงจากแอป"
    ]
   ]
  },
  {
   "type": "list",
   "items": [
    "สืบว่าใครทำอะไรใช้ CloudTrail · credential ใช้แบบชั่วคราวเสมอ (IAM role หรือ STS)",
    "TLS ใหม่กว่า SSL · CA ออก certificate · ACM ต่ออายุให้อัตโนมัติ",
    "รหัสผ่านที่หลุดจากเว็บอื่นใช้ compromised credentials check · การ sign in ที่ดูผิดปกติใช้ adaptive authentication"
   ]
  }
 ],
 "questions": [
  {
   "id": "k-m12-01",
   "prompt": "Which statement about creating secure connections is true?",
   "choices": [
    {
     "text": "Both Secure Sockets Layer (SSL) and Transport Layer Security (TLS) are standards that AWS developed for secure communications.",
     "correct": false
    },
    {
     "text": "SSL uses certificates to establish website identity, but TLS does not.",
     "correct": false
    },
    {
     "text": "Both SSL and TLS encrypt network communications between connected resources.",
     "correct": true
    },
    {
     "text": "SSL is a newer version of TLS. Both are used to establish the identify of websites.",
     "correct": false
    }
   ],
   "explain": "AWS ไม่ได้เป็นคนสร้างมาตรฐานนี้ (A) · TLS ก็ใช้ certificate ด้วย (B) · TLS ใหม่กว่า SSL ข้อ D จึงพูดกลับด้าน",
   "source": "KC M12 ข้อ 1"
  },
  {
   "id": "k-m12-02",
   "prompt": "Which step in the secure connection process is the responsibility of the certificate authority (CA)?",
   "choices": [
    {
     "text": "Issue a certificate.",
     "correct": true
    },
    {
     "text": "Verify whether the certificate is from a trusted source.",
     "correct": false
    },
    {
     "text": "Send an encrypted session key.",
     "correct": false
    },
    {
     "text": "Send a certificate and public key to the client.",
     "correct": false
    }
   ],
   "explain": "client (browser) เป็นคนตรวจว่า certificate มาจากแหล่งที่เชื่อถือได้ไหม (B) · client ส่ง session key ที่เข้ารหัสแล้ว (C) · server ส่ง certificate กับ public key ให้ client (D)",
   "source": "KC M12 ข้อ 2"
  },
  {
   "id": "k-m12-03",
   "prompt": "Which statement about AWS Certificate Manager (ACM) is true?",
   "choices": [
    {
     "text": "ACM can provision public certificates, but for private certificates, developers must produce their own certificate and connect it to ACM.",
     "correct": false
    },
    {
     "text": "ACM manages certificate renewals for both public and private certificates.",
     "correct": true
    },
    {
     "text": "ACM costs are based on the number of active public certificates in an AWS account.",
     "correct": false
    },
    {
     "text": "A developer must configure a load balancer to use ACM certificates.",
     "correct": false
    }
   ],
   "explain": "private certificate ออกผ่าน AWS Private CA ได้ (A) · public certificate ของ ACM ไม่เสียเงิน (C) · ใช้กับ CloudFront, API Gateway และบริการอื่นได้ ไม่จำเป็นต้องมี load balancer (D)",
   "source": "KC M12 ข้อ 3"
  },
  {
   "id": "k-m12-04",
   "prompt": "Which statement reflects a best practice for security credentials?",
   "choices": [
    {
     "text": "Only share access keys between users in the same AWS account.",
     "correct": false
    },
    {
     "text": "Use AWS Identity and Access Management (IAM) roles to retrieve temporary security credentials.",
     "correct": true
    },
    {
     "text": "If there are unencrypted access keys, embed them in code that is available only to developers but not accessible to users.",
     "correct": false
    },
    {
     "text": "Do not allow programmatic authentication to AWS services.",
     "correct": false
    }
   ],
   "explain": "access key ห้ามแชร์ (A) และห้ามฝังใน code (C) · การปิด programmatic access ทั้งหมด (D) ไม่ใช่ทางแก้ เพราะแอปยังต้องเรียก AWS",
   "source": "KC M12 ข้อ 4"
  },
  {
   "id": "k-m12-05",
   "prompt": "What is the primary difference between AWS Security Token Service (AWS STS) authentication by federated users and AWS STS authentication by AWS Identity and Access Management (IAM) users?",
   "choices": [
    {
     "text": "With federated users, the application calls an identity broker, but this step is skipped with IAM users.",
     "correct": false
    },
    {
     "text": "With federated users, the first authentication is made against an IdP. With IAM users, the first authentication is made against IAM.",
     "correct": true
    },
    {
     "text": "With federated users, the second authentication is made against an IdP. With IAM users, the second authentication is made against IAM",
     "correct": false
    },
    {
     "text": "With federated users, applications use the temporary security credentials and token to make requests to an AWS service. No token is necessary with IAM users.",
     "correct": false
    }
   ],
   "explain": "ข้อ C ผิดที่ \"second\" เพราะจุดที่ต่างคือครั้งแรก · ข้อ D ผิด เพราะทั้งสองแบบได้ credential ชั่วคราวพร้อม session token มาใช้เหมือนกัน",
   "source": "KC M12 ข้อ 5",
   "topic": 2
  },
  {
   "id": "k-m12-06",
   "prompt": "A developer has been asked to investigate how website files have been deleted from an Amazon Simple Storage Service (Amazon S3) bucket. Which approach should they take?",
   "choices": [
    {
     "text": "Use AWS CloudTrail to search for information about delete object events on the S3 bucket.",
     "correct": true
    },
    {
     "text": "Use AWS Security Token Service (AWS STS) to block deletions from the S3 bucket.",
     "correct": false
    },
    {
     "text": "Use AWS Identity and Access Management (IAM) to search for users who have used their delete permissions on the S3 bucket.",
     "correct": false
    },
    {
     "text": "Use the AWS STS GetSessionToken API call to retrieve information about users who deleted files from the S3 bucket.",
     "correct": false
    }
   ],
   "explain": "\"สืบว่าใครทำอะไร\" คือ CloudTrail · STS ใช้ออก credential ไม่ได้ใช้บล็อกหรือสืบค้น (B, D) · IAM บอกได้ว่าใครมีสิทธิ์ แต่ไม่บอกว่าใครใช้สิทธิ์นั้นไปแล้ว (C)",
   "source": "KC M12 ข้อ 6",
   "topic": 3
  },
  {
   "id": "k-m12-07",
   "prompt": "A developer has been asked to add a sign-up and sign-in service to their application. Which Amazon Cognito feature should they use?",
   "choices": [
    {
     "text": "Amazon Cognito identity pool",
     "correct": false
    },
    {
     "text": "Amazon Cognito user pool",
     "correct": true
    },
    {
     "text": "Amazon Cognito Lambda trigger",
     "correct": false
    },
    {
     "text": "Amazon Cognito access token",
     "correct": false
    }
   ],
   "explain": "sign-up กับ sign-in คือหน้าที่ของ user pool · identity pool ใช้แลก token เป็น AWS credential · Lambda trigger ใช้แทรก logic ในขั้นต่าง ๆ · access token เป็นสิ่งที่ได้หลัง sign in",
   "source": "KC M12 ข้อ 7"
  },
  {
   "id": "k-m12-08",
   "prompt": "A developer has been asked to reduce the security risk of users who sign in to their application with username and password pairs that they use on other websites. Which Amazon Cognito user pool feature might the developer configure?",
   "choices": [
    {
     "text": "Identity tokens",
     "correct": false
    },
    {
     "text": "Phone and email verification",
     "correct": false
    },
    {
     "text": "Adaptive authentication",
     "correct": false
    },
    {
     "text": "Compromised credentials check",
     "correct": true
    }
   ],
   "explain": "โจทย์พูดถึงรหัสผ่านที่ใช้ซ้ำกับเว็บอื่น ซึ่งอาจหลุดไปแล้ว ฟีเจอร์นี้ตรวจตรงจุดนั้น · adaptive authentication ดูความเสี่ยงของการ sign in แต่ละครั้ง (อุปกรณ์ ตำแหน่ง) ไม่ได้ดูว่ารหัสเคยหลุดไหม",
   "source": "KC M12 ข้อ 8"
  },
  {
   "id": "k-m12-09",
   "prompt": "Which statement about Amazon Cognito identity pools is true?",
   "choices": [
    {
     "text": "With an identity pool, users can obtain temporary, limited-privilege AWS credentials to access other AWS services.",
     "correct": true
    },
    {
     "text": "Identity pools replace the need for a third-party identity provider.",
     "correct": false
    },
    {
     "text": "When using Amazon Cognito identity pools, a user would not also use Amazon Cognito user pools.",
     "correct": false
    },
    {
     "text": "Identity pools provide sign-up and sign-in functionality for mobile apps.",
     "correct": false
    }
   ],
   "explain": "identity pool ยังต้องพึ่ง IdP (B ผิด) · ใช้คู่กับ user pool ได้และนิยมใช้คู่กัน (C ผิด) · sign-up/sign-in เป็นของ user pool (D ผิด)",
   "source": "KC M12 ข้อ 9"
  },
  {
   "id": "k-m12-10",
   "prompt": "A developer plans to use Amazon Cognito user pools with Amazon API Gateway. Which step is part of the user pool authentication flow with API Gateway?",
   "choices": [
    {
     "text": "A mobile app sends a request to API Gateway, and API Gateway gets JSON Web Tokens (JWTs) from the user pool.",
     "correct": false
    },
    {
     "text": "A mobile app user authenticates with a user pool, and the user pool returns JWTs to the app.",
     "correct": true
    },
    {
     "text": "The user pool validates the tokens against an identity pool.",
     "correct": false
    },
    {
     "text": "Amazon Cognito invokes the API after successfully validating the permissions.",
     "correct": false
    }
   ],
   "explain": "ลำดับคือ แอปไปเอา token ก่อน แล้วแนบไปกับ request ไม่ใช่ API Gateway ไปเอา token เอง (A) · ไม่ต้องผ่าน identity pool (C) · API Gateway (Cognito authorizer) เป็นคนตรวจ token แล้วเรียก backend ไม่ใช่ Cognito เรียก API (D)",
   "source": "KC M12 ข้อ 10"
  }
 ]
});

GUIDE.registerKC("M13", {
 "summary": {
  "asks": "แนวคิด DevOps, CI/CD, AWS CodePipeline, AWS CloudFormation (template, Conditions, stack), การ deploy แอป serverless, AWS SAM (Globals, SimpleTable)",
  "main": "DevOps คือการทลายกำแพงระหว่างทีม dev กับทีม ops และ automate ทุกขั้น · infrastructure as code (CloudFormation หรือ SAM) อธิบาย resource ไว้ใน template แล้วให้ AWS สร้างให้",
  "thinking": "แยกเครื่องมือตามหน้าที่ คือ CodeCommit เก็บ code · CodeBuild build และ test · CodeDeploy deploy · CodePipeline ร้อยทุกขั้นเป็น pipeline",
  "rules": "template เดียวใช้หลาย environment ได้ด้วย Conditions (กับ Parameters) · Globals มีเฉพาะใน SAM · `AWS::Serverless::SimpleTable` สร้างตาราง DynamoDB"
 },
 "remember": [
  {
   "type": "table",
   "head": [
    "เครื่องมือ",
    "หน้าที่"
   ],
   "rows": [
    [
     "CodeCommit",
     "เก็บ code (Git)"
    ],
    [
     "CodeBuild",
     "compile · test · package"
    ],
    [
     "CodeDeploy",
     "deploy ไปยัง EC2, Lambda, ECS"
    ],
    [
     "CodePipeline",
     "ร้อยทุกขั้นเป็น release pipeline"
    ]
   ]
  },
  {
   "type": "table",
   "head": [
    "",
    "Continuous delivery",
    "Continuous deployment"
   ],
   "rows": [
    [
     "ขึ้น production",
     "มีคนกดอนุมัติ",
     "อัตโนมัติทั้งหมด"
    ]
   ]
  },
  {
   "type": "list",
   "items": [
    "section ของ CloudFormation: Parameters รับค่าเข้า · Conditions เลือกสร้างตามเงื่อนไข · Resources (บังคับมี) · Outputs ส่งค่าออก · Transform เรียก macro เช่น SAM",
    "ของที่มีเฉพาะ SAM: Globals · `AWS::Serverless::Function` / `Api` / `SimpleTable` · SAM CLI ใช้ทดสอบในเครื่อง"
   ]
  }
 ],
 "questions": [
  {
   "id": "k-m13-01",
   "prompt": "Which option describes the philosophy of DevOps?",
   "choices": [
    {
     "text": "DevOps is about teaching development and operations teams to use the same set of tools to shorten testing and deployment cycles.",
     "correct": false
    },
    {
     "text": "DevOps is about removing barriers between development and operations functions to optimize productivity and reliability.",
     "correct": true
    },
    {
     "text": "DevOps culture is reflected in the idea of \"Processes over people,\" which means that, with strong processes, any team member can perform any task.",
     "correct": false
    },
    {
     "text": "DevOps culture is reflected in the idea that tight coupling leads to tighter parity between development, test, and production environments.",
     "correct": false
    }
   ],
   "explain": "DevOps เป็นเรื่องวัฒนธรรมการทำงาน ไม่ใช่แค่การใช้เครื่องมือชุดเดียวกัน (A) · ให้ความสำคัญกับคนมากกว่ากระบวนการ (C กลับด้าน) · DevOps ชอบ loose coupling ไม่ใช่ tight coupling (D)",
   "source": "KC M13 ข้อ 1"
  },
  {
   "id": "k-m13-02",
   "prompt": "How are DevOps practices reflected in the software development lifecycle for cloud architectures?",
   "choices": [
    {
     "text": "Every phase of the software development lifecycle is automated.",
     "correct": true
    },
    {
     "text": "Developers can use continuous integration to merge code into their local repository and connect to the test environment for authentic test scenarios.",
     "correct": false
    },
    {
     "text": "With continuous delivery, developers can deploy code without the need for continuous monitoring.",
     "correct": false
    },
    {
     "text": "Infrastructure tools compare local development environments to test environments and staging environments, and report on environmental differences so that the operations team can ensure parity.",
     "correct": false
    }
   ],
   "explain": "CI คือการ merge เข้า repository ที่ใช้ร่วมกัน ไม่ใช่ repository ในเครื่องตัวเอง (B) · ยังต้อง monitor ตลอดเวลา (C) · ข้อ D เป็นเครื่องมือที่ไม่มีอยู่จริง ความเหมือนกันของแต่ละ environment ได้มาจาก IaC",
   "source": "KC M13 ข้อ 2",
   "topic": 0
  },
  {
   "id": "k-m13-03",
   "prompt": "How might a developer use AWS CodePipeline in their continuous integration and continuous deployment (CI/CD) process?",
   "choices": [
    {
     "text": "Compile source code, run tests, and produce software packages that are ready to deploy.",
     "correct": false
    },
    {
     "text": "Host Git-based repositories and provide source control.",
     "correct": false
    },
    {
     "text": "Deploy to a variety of compute services.",
     "correct": false
    },
    {
     "text": "Automate the steps that are required to release software based on a release model that the developer defines.",
     "correct": true
    }
   ],
   "explain": "ข้อ A คือ CodeBuild · ข้อ B คือ CodeCommit · ข้อ C คือ CodeDeploy · CodePipeline เป็นตัวที่ร้อยขั้นตอนทั้งหมดเข้าด้วยกัน",
   "source": "KC M13 ข้อ 3"
  },
  {
   "id": "k-m13-04",
   "prompt": "Which statement about continuous integration and continuous delivery/deployment (CI/CD) is true?",
   "choices": [
    {
     "text": "Continuous deployment reduces the risk of production bugs, but it might increase the time that it takes to deliver new features.",
     "correct": false
    },
    {
     "text": "Continuous integration requires teams to write automated tests.",
     "correct": true
    },
    {
     "text": "Continuous delivery extends all the way to production deployment without human intervention.",
     "correct": false
    },
    {
     "text": "Continuous deployment extends from check-in through production, but some manual intervention occurs after code is checked in and before that code is released to customers.",
     "correct": false
    }
   ],
   "explain": "continuous deployment ทำให้ส่งฟีเจอร์ได้เร็วขึ้น ไม่ได้ช้าลง (A) · ข้อ C กับ D สลับนิยามกัน: continuous **delivery** มีคนกดอนุมัติก่อนขึ้น production ส่วน continuous **deployment** ขึ้น production เองทั้งหมด",
   "source": "KC M13 ข้อ 4"
  },
  {
   "id": "k-m13-05",
   "prompt": "A developer wants to use infrastructure as code for their Java-based web application on AWS. Which task might be part of their work?",
   "choices": [
    {
     "text": "Create an Amazon Elastic Compute Cloud (Amazon EC2) instance by using AWS CodeBuild, and use AWS CodeDeploy to automatically push the application to the EC2 instance.",
     "correct": false
    },
    {
     "text": "Create a Java AWS CloudFormation template that defines the application and database layers for the application.",
     "correct": false
    },
    {
     "text": "Create an AWS CloudFormation template with a Resources section that defines the AWS resources for the application.",
     "correct": true
    },
    {
     "text": "Use AWS CodePipeline to create a pipeline that automates the complete release of the application.",
     "correct": false
    }
   ],
   "explain": "CodeBuild ไม่ได้ใช้สร้าง EC2 (A) · template เขียนด้วย JSON หรือ YAML ไม่ใช่ Java (B) · CodePipeline เป็นเรื่อง CI/CD ไม่ใช่ IaC (D)",
   "source": "KC M13 ข้อ 5"
  },
  {
   "id": "k-m13-06",
   "prompt": "A developer wants to use a single AWS CloudFormation template for both the test and production environments. Which section of the template might they use to support this approach?",
   "choices": [
    {
     "text": "Use the Transform section to define the variables that must be changed for each environment during stack creation or update.",
     "correct": false
    },
    {
     "text": "Use the Format Version section to define the parameters to be passed for each environment during stack creation or update.",
     "correct": false
    },
    {
     "text": "Use the Outputs section to define each environment that the template should create during stack creation or update.",
     "correct": false
    },
    {
     "text": "Use the Conditions section to control whether certain resources are created during stack creation or update.",
     "correct": true
    }
   ],
   "explain": "Transform ใช้เรียก macro เช่น SAM (A) · Format Version บอกแค่ version ของ template ส่วนค่าที่ส่งเข้ามาคือ Parameters (B) · Outputs ใช้ส่งค่าออกหลังสร้างเสร็จ (C)",
   "source": "KC M13 ข้อ 6"
  },
  {
   "id": "k-m13-07",
   "prompt": "Which statement about AWS CloudFormation stacks is true?",
   "choices": [
    {
     "text": "Deleting a stack deletes its CloudFormation template but does not delete any resources that the most recent deployment created.",
     "correct": false
    },
    {
     "text": "A CloudFormation stack is a unit of deployment.",
     "correct": true
    },
    {
     "text": "An existing stack must be deleted before deploying an updated template to modify the resource parameters of that stack.",
     "correct": false
    },
    {
     "text": "CloudFormation has some quotas that are related to the resources defined in each stack, but no quotas are related to the number of stacks themselves.",
     "correct": false
    }
   ],
   "explain": "ลบ stack แล้ว resource ในนั้นถูกลบด้วย ยกเว้นที่ตั้ง DeletionPolicy ไว้ (A) · อัปเดตได้โดยไม่ต้องลบก่อน ผ่าน update stack หรือ change set (C) · จำนวน stack ต่อบัญชีก็มี quota (D)",
   "source": "KC M13 ข้อ 7"
  },
  {
   "id": "k-m13-08",
   "prompt": "A developer is building their first serverless application on AWS. What must they think about differently with respect to deploying the application?",
   "choices": [
    {
     "text": "They can't replicate the production environment locally in the same way that they might with a server-based deployment.",
     "correct": true
    },
    {
     "text": "They can't use AWS CloudFormation for infrastructure as code to deploy the application.",
     "correct": false
    },
    {
     "text": "The steps to connect to the AWS Lambda server for debugging are different than those to connect to a traditional server.",
     "correct": false
    },
    {
     "text": "Serverless development tools are not integrated with other AWS development tools that are used in the deployment pipeline.",
     "correct": false
    }
   ],
   "explain": "CloudFormation ใช้กับ serverless ได้ และ SAM ก็ต่อยอดมาจาก CloudFormation (B) · Lambda ไม่มี server ให้เรา connect เข้าไป (C) · SAM ต่อกับ CodePipeline และ CodeBuild ได้ (D)",
   "source": "KC M13 ข้อ 8"
  },
  {
   "id": "k-m13-09",
   "prompt": "How does an AWS Serverless Application Model (AWS SAM) template differ from an AWS CloudFormation template?",
   "choices": [
    {
     "text": "AWS SAM templates are written in the same language as the AWS Lambda runtime that is used in the functions that are being deployed.",
     "correct": false
    },
    {
     "text": "The Globals section is found only in AWS SAM templates.",
     "correct": true
    },
    {
     "text": "The Resources section in an AWS SAM template may only contain serverless resources.",
     "correct": false
    },
    {
     "text": "The Transform declaration is not required for AWS SAM templates.",
     "correct": false
    }
   ],
   "explain": "SAM ก็เขียนด้วย YAML หรือ JSON เหมือนกัน (A) · ใส่ resource ทั่วไปของ CloudFormation ปนได้ (C) · ต้องมี `Transform: AWS::Serverless-2016-10-31` เสมอ (D)",
   "source": "KC M13 ข้อ 9"
  },
  {
   "id": "k-m13-10",
   "prompt": "The following lines are in the Resources section of an AWS Serverless Application Model (AWS SAM) template. What would these lines create?",
   "choices": [
    {
     "text": "An AWS Lambda function that is named Orders and is connected to an Amazon DynamoDB table",
     "correct": false
    },
    {
     "text": "An Amazon DynamoDB table that is called Orders",
     "correct": true
    },
    {
     "text": "An API GET method that reads from the Orders table",
     "correct": false
    },
    {
     "text": "A MySQL table that is called Orders",
     "correct": false
    }
   ],
   "explain": "`SimpleTable` สร้างตาราง DynamoDB ที่มี primary key ตัวเดียว · ถ้าเป็น function จะใช้ `AWS::Serverless::Function` · ถ้าเป็น API จะใช้ `AWS::Serverless::Api`",
   "source": "KC M13 ข้อ 10",
   "code": "Resources:\n  Orders:\n    Type: AWS::Serverless::SimpleTable"
  }
 ]
});
