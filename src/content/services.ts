// The AWS service catalog: every in-scope and out-of-scope offering listed in
// exam guide v1.2, grouped by the guide's categories. Drills, flashcards, lesson
// service chips and question `services[]` tags all derive from it.
// One-liners for newer offerings are taken from their AWS product pages (checked
// 2026-11-23); recheck them when the guide changes.

export interface Service {
  /** Stable slug used in question `services[]`, e.g. "bedrock-guardrails". */
  id: string
  name: string
  category: string
  inScope: boolean
  /**
   * Set for features the objectives name that the guide's service list doesn't
   * (e.g. Bedrock Guardrails): the parent service's id, or "" for none listed.
   */
  featureOf?: string
  /** What it is for, in plain words. In-scope services only. */
  oneLiner?: string
  url?: string
}

type Entry = [id: string, name: string, oneLiner: string, url: string, featureOf?: string]

const inScope = (category: string, entries: Entry[]): Service[] =>
  entries.map(([id, name, oneLiner, url, featureOf]) => ({
    id,
    name,
    category,
    inScope: true,
    oneLiner,
    url,
    ...(featureOf === undefined ? {} : { featureOf }),
  }))

const outOfScope = (category: string, names: string[]): Service[] =>
  names.map((name) => ({
    id: name
      .toLowerCase()
      .replace(/\(.*?\)/g, '')
      .replace(/^(amazon|aws)\s+/, '')
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, ''),
    name,
    category,
    inScope: false,
  }))

const IN_SCOPE: Service[] = [
  ...inScope('Analytics', [
    ['data-exchange', 'AWS Data Exchange', 'Find, subscribe to and use third-party data sets in the cloud.', 'https://aws.amazon.com/data-exchange/'],
    ['emr', 'Amazon EMR', 'Run big-data frameworks such as Apache Spark and Hadoop on managed clusters.', 'https://aws.amazon.com/emr/'],
    ['glue', 'AWS Glue', 'Serverless data integration: discover, catalog, clean and transform data (ETL), with the Glue Data Catalog.', 'https://aws.amazon.com/glue/'],
    ['glue-databrew', 'AWS Glue DataBrew', 'Visual, no-code tool to clean and normalize data for analytics and ML.', 'https://aws.amazon.com/glue/features/databrew/'],
    ['lake-formation', 'AWS Lake Formation', 'Build a secure data lake and manage fine-grained access to its data.', 'https://aws.amazon.com/lake-formation/'],
    ['opensearch', 'Amazon OpenSearch Service', 'Managed search and analytics, including vector search for embeddings (RAG).', 'https://aws.amazon.com/opensearch-service/'],
    ['quick', 'Amazon Quick', 'An AI workspace for business users that includes Quick Sight BI dashboards and agents.', 'https://aws.amazon.com/quick/'],
    ['redshift', 'Amazon Redshift', 'Managed cloud data warehouse for SQL analytics at scale.', 'https://aws.amazon.com/redshift/'],
  ]),
  ...inScope('Cloud Financial Management', [
    ['budgets', 'AWS Budgets', 'Set cost and usage budgets and get alerts when you exceed them.', 'https://aws.amazon.com/aws-cost-management/aws-budgets/'],
    ['cost-explorer', 'AWS Cost Explorer', 'Visualize and analyze your AWS costs and usage over time.', 'https://aws.amazon.com/aws-cost-management/aws-cost-explorer/'],
  ]),
  ...inScope('Compute', [
    ['ec2', 'Amazon EC2', 'Virtual servers, including GPU and AWS Trainium/Inferentia instances for ML.', 'https://aws.amazon.com/ec2/'],
    ['lambda', 'AWS Lambda', 'Run code without managing servers, triggered by events; pay per request.', 'https://aws.amazon.com/lambda/'],
  ]),
  ...inScope('Containers', [
    ['ecs', 'Amazon Elastic Container Service (Amazon ECS)', 'Run and scale containerized applications with AWS-managed orchestration.', 'https://aws.amazon.com/ecs/'],
    ['eks', 'Amazon Elastic Kubernetes Service (Amazon EKS)', 'Managed Kubernetes for running containers.', 'https://aws.amazon.com/eks/'],
  ]),
  ...inScope('Database', [
    ['aurora', 'Amazon Aurora', 'MySQL- and PostgreSQL-compatible relational database; with pgvector it can store embeddings.', 'https://aws.amazon.com/rds/aurora/'],
    ['documentdb', 'Amazon DocumentDB (with MongoDB compatibility)', 'Managed JSON document database, with vector search support.', 'https://aws.amazon.com/documentdb/'],
    ['dynamodb', 'Amazon DynamoDB', 'Serverless key-value and document database with single-digit-millisecond latency.', 'https://aws.amazon.com/dynamodb/'],
    ['elasticache', 'Amazon ElastiCache', 'Managed in-memory cache (Valkey, Redis OSS, Memcached), also usable for vector search.', 'https://aws.amazon.com/elasticache/'],
    ['neptune', 'Amazon Neptune', 'Managed graph database, with vector search through Neptune Analytics.', 'https://aws.amazon.com/neptune/'],
    ['rds', 'Amazon RDS', 'Managed relational databases; RDS for PostgreSQL with pgvector stores embeddings.', 'https://aws.amazon.com/rds/'],
  ]),
  ...inScope('Developer Tools', [
    ['kiro', 'Kiro', 'An agentic AI engineering system from AWS, used through an IDE, CLI and other interfaces.', 'https://kiro.dev/'],
    ['strands-agents', 'Strands Agents', 'An open-source toolkit from AWS for building production AI agents in code.', 'https://strandsagents.com/'],
  ]),
  ...inScope('Machine Learning', [
    ['bedrock', 'Amazon Bedrock', 'Fully managed access to foundation models from many providers through one API, with customization, RAG and agents.', 'https://aws.amazon.com/bedrock/'],
    ['bedrock-agentcore', 'Amazon Bedrock AgentCore', 'A platform to run, secure and operate AI agents in production, with any framework and any model.', 'https://aws.amazon.com/bedrock/agentcore/'],
    ['bedrock-guardrails', 'Amazon Bedrock Guardrails', 'Configurable safeguards for GenAI apps: denied topics, content filters, PII redaction, grounding checks.', 'https://aws.amazon.com/bedrock/guardrails/', 'bedrock'],
    ['bedrock-knowledge-bases', 'Amazon Bedrock Knowledge Bases', 'Managed RAG: connects foundation models and agents to your company data sources.', 'https://aws.amazon.com/bedrock/knowledge-bases/', 'bedrock'],
    ['bedrock-evaluations', 'Amazon Bedrock Model Evaluation', 'Evaluate and compare foundation models, including custom and imported ones, with automatic, human or LLM-as-a-judge methods.', 'https://aws.amazon.com/bedrock/evaluations/', 'bedrock'],
    ['bedrock-prompt-management', 'Amazon Bedrock Prompt Management', 'Create, evaluate, version and run prompts.', 'https://aws.amazon.com/bedrock/prompt-management/', 'bedrock'],
    ['comprehend', 'Amazon Comprehend', 'NLP on text: sentiment, entities, key phrases, language, PII detection, custom classification.', 'https://aws.amazon.com/comprehend/'],
    ['lex', 'Amazon Lex', 'Build conversational chatbots and voice bots (intents, slots).', 'https://aws.amazon.com/lex/'],
    ['nova', 'Amazon Nova', "Amazon's own portfolio of AI offerings, including the Nova foundation models.", 'https://aws.amazon.com/nova/'],
    ['personalize', 'Amazon Personalize', 'Real-time personalized recommendations from user-interaction data.', 'https://aws.amazon.com/personalize/'],
    ['polly', 'Amazon Polly', 'Text-to-speech: turn text into lifelike speech.', 'https://aws.amazon.com/polly/'],
    ['rekognition', 'Amazon Rekognition', 'Computer vision on images and video: objects, faces, text, content moderation.', 'https://aws.amazon.com/rekognition/'],
    ['sagemaker-ai', 'Amazon SageMaker AI', 'Build, train, customize and deploy your own ML models, with MLOps tooling.', 'https://aws.amazon.com/sagemaker/ai/'],
    ['sagemaker-jumpstart', 'Amazon SageMaker JumpStart', 'An ML hub of pre-trained and foundation models and solutions to deploy or fine-tune.', 'https://aws.amazon.com/sagemaker/ai/jumpstart/'],
    ['sagemaker-model-cards', 'Amazon SageMaker Model Cards', 'Document a model’s intended use, training details, evaluation and risk rating in one place.', 'https://docs.aws.amazon.com/sagemaker/latest/dg/model-cards.html', 'sagemaker-ai'],
    ['textract', 'Amazon Textract', 'Extract printed and handwritten text, forms and tables from scanned documents.', 'https://aws.amazon.com/textract/'],
    ['transcribe', 'Amazon Transcribe', 'Speech-to-text: turn audio into text.', 'https://aws.amazon.com/transcribe/'],
    ['translate', 'Amazon Translate', 'Neural machine translation between languages.', 'https://aws.amazon.com/translate/'],
    ['transform', 'AWS Transform', 'Uses agentic AI to modernize legacy applications and workloads.', 'https://aws.amazon.com/transform/'],
  ]),
  ...inScope('Management and Governance', [
    ['cloudtrail', 'AWS CloudTrail', 'Records API calls in your account: who did what, when (audit trail).', 'https://aws.amazon.com/cloudtrail/'],
    ['cloudwatch', 'Amazon CloudWatch', 'Metrics, logs, dashboards and alarms for monitoring resources and applications.', 'https://aws.amazon.com/cloudwatch/'],
    ['config', 'AWS Config', 'Records resource configurations over time and checks them against compliance rules.', 'https://aws.amazon.com/config/'],
    ['trusted-advisor', 'AWS Trusted Advisor', 'Checks your account against best practices for cost, security, performance and fault tolerance.', 'https://aws.amazon.com/premiumsupport/technology/trusted-advisor/'],
    ['well-architected-tool', 'AWS Well-Architected Tool', 'Review workloads against the Well-Architected Framework pillars and lenses.', 'https://aws.amazon.com/well-architected-tool/'],
  ]),
  ...inScope('Networking and Content Delivery', [
    ['cloudfront', 'Amazon CloudFront', 'Content delivery network that caches content close to users.', 'https://aws.amazon.com/cloudfront/'],
    ['vpc', 'Amazon VPC', 'Your own isolated virtual network in AWS; with PrivateLink, traffic to services stays off the internet.', 'https://aws.amazon.com/vpc/'],
    ['privatelink', 'AWS PrivateLink', 'Private connectivity from your VPC to AWS services such as Bedrock without crossing the public internet.', 'https://aws.amazon.com/privatelink/', 'vpc'],
  ]),
  ...inScope('Security, Identity, and Compliance', [
    ['artifact', 'AWS Artifact', 'Self-service download of AWS compliance reports (e.g. SOC, ISO) and agreements.', 'https://aws.amazon.com/artifact/'],
    ['iam', 'AWS Identity and Access Management (IAM)', 'Control who can access which AWS resources: users, roles, policies, permissions.', 'https://aws.amazon.com/iam/'],
    ['inspector', 'Amazon Inspector', 'Automated vulnerability scanning of EC2, container images and Lambda functions.', 'https://aws.amazon.com/inspector/'],
    ['kms', 'AWS Key Management Service (AWS KMS)', 'Create and control encryption keys for data at rest.', 'https://aws.amazon.com/kms/'],
    ['macie', 'Amazon Macie', 'Discovers and protects sensitive data such as PII in Amazon S3, using ML.', 'https://aws.amazon.com/macie/'],
    ['secrets-manager', 'AWS Secrets Manager', 'Store, rotate and retrieve secrets such as database passwords and API keys.', 'https://aws.amazon.com/secrets-manager/'],
  ]),
  ...inScope('Storage', [
    ['s3', 'Amazon S3', 'Object storage for any amount of data; the usual home of training data and RAG documents.', 'https://aws.amazon.com/s3/'],
    ['s3-glacier', 'Amazon S3 Glacier', 'Low-cost archive storage classes for long-term retention.', 'https://aws.amazon.com/s3/storage-classes/glacier/'],
  ]),
]

const OUT_OF_SCOPE: Service[] = [
  ...outOfScope('Analytics', ['AWS Clean Rooms', 'Amazon CloudSearch', 'Amazon Managed Streaming for Apache Kafka (Amazon MSK)']),
  ...outOfScope('Application Integration', ['Amazon AppFlow', 'Amazon MQ', 'Amazon Simple Workflow Service (Amazon SWF)']),
  ...outOfScope('Business Applications', ['Amazon Simple Email Service (Amazon SES)', 'AWS Supply Chain', 'AWS Wickr']),
  ...outOfScope('Cloud Financial Management', ['AWS Application Cost Profiler', 'AWS Billing Conductor']),
  ...outOfScope('Compute', ['AWS Elastic Beanstalk', 'EC2 Image Builder', 'Amazon Lightsail']),
  ...outOfScope('Containers', ['Red Hat OpenShift Service on AWS (ROSA)']),
  ...outOfScope('Customer Enablement', ['AWS Managed Services (AMS)', 'AWS re:Post Private', 'AWS Support']),
  ...outOfScope('Database', ['Amazon Keyspaces (for Apache Cassandra)', 'Amazon Timestream']),
  ...outOfScope('Developer Tools', ['AWS AppConfig', 'AWS Application Composer', 'AWS CloudShell', 'AWS Fault Injection Service', 'AWS X-Ray']),
  ...outOfScope('End User Computing', ['Amazon AppStream 2.0', 'Amazon WorkSpaces', 'Amazon WorkSpaces Thin Client', 'Amazon WorkSpaces Secure Browser']),
  ...outOfScope('Frontend Web and Mobile', ['AWS Amplify', 'AWS Device Farm', 'Amazon Location Service']),
  ...outOfScope('Internet of Things (IoT)', [
    'AWS IoT Core',
    'AWS IoT Device Defender',
    'AWS IoT Device Management',
    'AWS IoT FleetWise',
    'FreeRTOS',
    'AWS IoT Greengrass',
    'AWS IoT SiteWise',
    'AWS IoT TwinMaker',
  ]),
  ...outOfScope('Machine Learning', ['AWS HealthImaging', 'AWS HealthOmics']),
  ...outOfScope('Management and Governance', [
    'AWS Control Tower',
    'AWS Health Dashboard',
    'AWS Launch Wizard',
    'AWS License Manager',
    'Amazon Managed Grafana',
    'Amazon Managed Service for Prometheus',
    'AWS Resilience Hub',
    'AWS Resource Explorer',
    'AWS Resource Groups',
    'AWS Systems Manager Incident Manager',
    'AWS Service Catalog',
    'Service Quotas',
    'AWS Telco Network Builder',
    'AWS User Notifications',
  ]),
  ...outOfScope('Media', [
    'AWS Elemental MediaConnect',
    'AWS Elemental MediaConvert',
    'AWS Elemental MediaLive',
    'AWS Elemental MediaPackage',
    'AWS Elemental MediaTailor',
    'Amazon Interactive Video Service (Amazon IVS)',
  ]),
  ...outOfScope('Migration and Transfer', [
    'AWS Application Discovery Service',
    'AWS Application Migration Service',
    'AWS Database Migration Service (AWS DMS)',
    'AWS DataSync',
    'AWS Mainframe Modernization',
    'AWS Migration Hub',
    'AWS Transfer Family',
  ]),
  ...outOfScope('Networking and Content Delivery', [
    'AWS Cloud Map',
    'AWS Direct Connect',
    'AWS Global Accelerator',
    'Amazon Route 53',
    'Amazon Route 53 Application Recovery Controller',
    'Amazon VPC IP Address Manager (IPAM)',
  ]),
  ...outOfScope('Security, Identity, and Compliance', [
    'AWS Certificate Manager (ACM)',
    'AWS CloudHSM',
    'Amazon Cognito',
    'Amazon Detective',
    'AWS Directory Service',
    'AWS Firewall Manager',
    'Amazon GuardDuty',
    'AWS Payment Cryptography',
    'AWS Private Certificate Authority',
    'AWS Resource Access Manager (AWS RAM)',
    'AWS Security Hub',
    'Amazon Security Lake',
    'AWS Shield',
    'AWS Signer',
    'Amazon Verified Permissions',
    'AWS WAF',
  ]),
  ...outOfScope('Storage', ['AWS Backup', 'AWS Elastic Disaster Recovery']),
]

export const SERVICES: Service[] = [...IN_SCOPE, ...OUT_OF_SCOPE]
export const SERVICE_BY_ID = new Map(SERVICES.map((s) => [s.id, s]))
/** Services the guide lists as in scope (features excluded). */
export const IN_SCOPE_SERVICES = IN_SCOPE.filter((s) => s.featureOf === undefined)
export const OUT_OF_SCOPE_SERVICES = OUT_OF_SCOPE
