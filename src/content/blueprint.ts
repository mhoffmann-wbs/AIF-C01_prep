// The AIF-C01 exam blueprint, verbatim from the exam guide v1.2 (2026-10-29).
// Single source of truth for domains, weights, tasks and objectives: mock-exam
// allocation, question targets and the content tests all derive from this file.
// When the guide changes, update this file first.

export const GUIDE = {
  version: '1.2',
  date: '2026-10-29',
  url: 'https://docs.aws.amazon.com/aws-certification/latest/ai-practitioner-01/ai-practitioner-01.html',
  revisionsUrl: 'https://docs.aws.amazon.com/aws-certification/latest/ai-practitioner-01/aif-01-revisions.html',
  certificationUrl: 'https://aws.amazon.com/certification/certified-ai-practitioner/',
  prepPlanUrl: 'https://skillbuilder.aws/category/exam-prep/ai-practitioner-AIF-C01',
}

/** Format of the real exam (guide, plus duration from the certification page). */
export const EXAM_FORMAT = {
  items: 65,
  scoredItems: 50,
  unscoredItems: 15,
  minutes: 90,
  scaleMin: 100,
  scaleMax: 1000,
  passScore: 700,
}

/** The app's mock exam: real length and time, but every item is scored. */
export const MOCK = { items: EXAM_FORMAT.items, minutes: EXAM_FORMAT.minutes }

/** Bank-wide question target (PLAN.md §4). */
export const BANK_TARGET = 650

/** Every objective needs at least this many items. */
export const MIN_ITEMS_PER_OBJECTIVE = 5

export interface Domain {
  id: string
  title: string
  /** Percent of scored content. */
  weight: number
}

export interface Objective {
  /** `${taskId}.${n}` in guide order, e.g. "3.2.4". */
  id: string
  text: string
}

export interface Task {
  /** As in the guide, e.g. "3.2". */
  id: string
  domainId: string
  title: string
  objectives: Objective[]
}

export const DOMAINS: Domain[] = [
  { id: '1', title: 'Fundamentals of AI and ML', weight: 20 },
  { id: '2', title: 'Fundamentals of GenAI', weight: 24 },
  { id: '3', title: 'Applications of Foundation Models', weight: 28 },
  { id: '4', title: 'Guidelines for Responsible AI', weight: 14 },
  { id: '5', title: 'Security, Compliance, and Governance for AI Solutions', weight: 14 },
]

const task = (id: string, title: string, objectives: string[]): Task => ({
  id,
  domainId: id.split('.')[0]!,
  title,
  objectives: objectives.map((text, i) => ({ id: `${id}.${i + 1}`, text })),
})

export const TASKS: Task[] = [
  task('1.1', 'Explain basic AI concepts and terminologies.', [
    'Define basic AI terms (for example, AI, ML, deep learning, neural networks, computer vision, natural language processing [NLP], model, algorithm, training and inferencing, bias, fairness, fit, large language model [LLM], generative AI [GenAI], agentic AI).',
    'Describe the similarities and differences between AI, ML, GenAI, deep learning, and agentic AI.',
    'Describe various types of inferencing (for example, batch, real-time, asynchronous, serverless).',
    'Describe the different types of data in AI models (for example, labeled and unlabeled, tabular, time-series, image, text, structured and unstructured).',
    'Describe different types of AI/ML learning (for example, supervised learning, unsupervised learning, reinforcement learning methods).',
  ]),
  task('1.2', 'Identify practical use cases for AI.', [
    'Recognize applications where AI/ML can provide value (for example, assist human decision making, solution scalability, automation).',
    'Determine when AI/ML solutions are not appropriate (for example, cost-benefit analyses, situations when a specific outcome is needed instead of a prediction).',
    'Select the appropriate AI/ML techniques for specific use cases (for example, regression, classification, clustering).',
    'Identify examples of real-world AI applications (for example, computer vision, NLP, speech recognition, recommendation systems, fraud detection, forecasting, knowledge bases, agentic AI).',
    'Explain the capabilities of AWS managed AI/ML services (for example, Amazon SageMaker AI, Amazon Transcribe, Amazon Translate, Amazon Comprehend, Amazon Lex, Amazon Polly).',
    'Identify when traditional ML models or foundation models (FMs) are appropriate for a specific use case (for example, based on regulatory concerns, explainability requirements, operational constraints).',
  ]),
  task('1.3', 'Describe the AI/ML development lifecycle.', [
    'Describe and differentiate components of an AI/ML pipeline.',
    'Describe sources of FM models (for example, open source pre-trained models, training custom models).',
    'Describe methods to use a model in production (for example, managed API service, self-hosted API).',
    'Identify relevant AWS services and features for each stage of an AI/ML pipeline (for example, Amazon Bedrock, Amazon Quick, Kiro, SageMaker AI).',
    'Describe fundamental concepts of ML operations (MLOps) (for example, experimentation, repeatable processes, scalable systems, managing technical debt, achieving production readiness, model monitoring, model re-training).',
    'Describe model performance metrics (for example, accuracy, precision, recall, F1 score) and business metrics (for example, cost per user, development costs, customer feedback, return on investment [ROI]) to evaluate ML models.',
  ]),
  task('2.1', 'Explain the basic concepts of generative AI (GenAI).', [
    'Define foundational GenAI concepts (for example, tokens, chunking, embeddings, vectors, prompt engineering, transformer-based large language models [LLMs], foundation models [FMs], multi-modal models, diffusion models).',
    'Identify potential use cases for GenAI models (for example, image, video, and audio generation; summarization; AI assistants; translation; code generation; customer service agents; search; recommendation engines).',
    'Describe the FM lifecycle (for example, data selection, model selection, pre-training, fine-tuning, evaluation, deployment, feedback).',
    'Describe the token-based pricing model and its effect on cost and performance for inference.',
    'Describe the role of context engineering in FM applications.',
    'Define foundational agentic AI concepts (for example, multi-agent system patterns for complex AI applications, Model Context Protocol [MCP] and its role in connecting agents to external systems, multi-agent communication patterns, memory management, tool usage, and workflow orchestration).',
  ]),
  task('2.2', 'Understand the capabilities and limitations of GenAI for solving business problems.', [
    'Describe the advantages of GenAI (for example, adaptability, responsiveness, conversational capabilities, ability to generate content).',
    'Identify disadvantages of GenAI solutions (for example, hallucinations, interpretability, inaccuracy, nondeterminism).',
    'Identify factors to consider when selecting GenAI models (for example, model types, performance requirements, capabilities, constraints, compliance, cost, latency, model complexity).',
    'Determine business value and metrics for GenAI applications (for example, cross-domain performance, ROI, efficiency, conversion rate, average revenue per user, accuracy, customer lifetime value).',
  ]),
  task('2.3', 'Describe AWS infrastructure and technologies for building GenAI applications.', [
    'Identify AWS services and features to develop GenAI applications (for example, Amazon Bedrock, Amazon SageMaker AI, SageMaker JumpStart, Amazon Quick, Kiro, Strands Agents, Amazon Bedrock AgentCore).',
    'Describe the advantages of using AWS GenAI services to build applications (for example, accessibility, lower barrier to entry, efficiency, cost-effectiveness, speed to market, ability to meet business objectives).',
    'Describe the benefits of AWS infrastructure for GenAI applications (for example, security, compliance, responsibility, safety).',
    'Describe cost tradeoffs of AWS GenAI services (for example, responsiveness, availability, redundancy, performance, regional coverage, token-based pricing, provision throughput, custom models).',
  ]),
  task('3.1', 'Describe design considerations for applications that use foundation models (FMs).', [
    'Identify selection criteria to choose FMs (for example, cost, modality, latency, multi-lingual, model size, model complexity, customization, input/output length, prompt caching).',
    'Describe the effect of inference parameters on model responses (for example, temperature, input/output length).',
    'Define Retrieval Augmented Generation (RAG) and describe its business applications (for example, Amazon Bedrock Knowledge Bases).',
    'Identify AWS services that help store embeddings within vector databases (for example, Amazon OpenSearch Service, Amazon Aurora, Amazon Neptune, Amazon RDS for PostgreSQL).',
    'Explain the cost tradeoffs of various approaches to FM customization (for example, pre-training, fine-tuning, in-context learning, RAG, model distillation).',
    "Define the role of AI agents and describe AI agents' business applications.",
  ]),
  task('3.2', 'Choose effective prompt engineering techniques.', [
    'Define the concepts and constructs of prompt engineering (for example, context, instruction, negative prompts).',
    'Define techniques for prompt engineering (for example, chain-of-thought, zero-shot, single-shot, few-shot, prompt templates).',
    'Identify and describe the benefits and best practices for prompt engineering (for example, response quality improvement, experimentation, guardrails, discovery, specificity and concision, using multiple comments).',
    'Define potential risks and limitations of prompt engineering (for example, exposure, poisoning, hijacking, jailbreaking).',
    'Describe prompt versioning and management strategies that use Amazon Bedrock Prompt Management.',
  ]),
  task('3.3', 'Describe the training and fine-tuning process for FMs.', [
    'Describe the key elements of training an FM (for example, pre-training, fine-tuning, continuous pre-training, distillation).',
    'Define methods for fine-tuning an FM (for example, instruction tuning, adapting models for specific domains, transfer learning, continuous pre-training).',
    'Describe how to prepare data to fine-tune an FM (for example, data curation, governance, size, labeling, representativeness, reinforcement learning from human feedback [RLHF]).',
  ]),
  task('3.4', 'Describe methods to evaluate FM performance.', [
    'Determine approaches to evaluate FM performance (for example, human-in-the-loop evaluation, benchmark datasets, Amazon Bedrock Model Evaluation).',
    'Identify relevant metrics to assess FM performance (for example, Recall-Oriented Understudy for Gisting Evaluation [ROUGE], Bilingual Evaluation Understudy [BLEU], BERTScore, LLM-as-a-judge).',
    'Determine whether an FM effectively meets business objectives (for example, productivity, user engagement, task engineering).',
    'Identify approaches to evaluate the performance of applications built with FM (for example, RAG, agents, workflows).',
    'Identify business objective alignment metrics for AI applications (for example, task completion rate, user satisfaction, cost per interaction).',
  ]),
  task('4.1', 'Explain the development of AI systems that are responsible.', [
    'Identify features of responsible AI (for example, bias, fairness, inclusivity, robustness, safety, veracity).',
    'Explain how to use tools to identify features of responsible AI (for example, Amazon Bedrock Guardrails).',
    'Define responsible practices to select a model (for example, environmental considerations, sustainability).',
    'Identify legal risks of working with generative AI (GenAI) (for example, intellectual property infringement claims, biased model outputs, loss of customer trust, end user risk, hallucinations).',
    'Identify characteristics of datasets (for example, inclusivity, diversity, curated data sources, balanced datasets).',
    'Describe effects of bias and variance (for example, effects on demographic groups, inaccuracy, overfitting, underfitting).',
    'Describe tools to detect and monitor bias, trustworthiness, and truthfulness (for example, analyzing label quality, human audits, subgroup analysis).',
  ]),
  task('4.2', 'Recognize the importance of transparent and explainable models.', [
    'Describe the differences between models that are transparent and explainable and models that are not transparent and explainable.',
    'Describe tools to identify transparent and explainable models (for example, Amazon SageMaker Model Cards, Amazon Bedrock Model Evaluations, open source models, data, licensing).',
    'Identify tradeoffs between model safety and transparency (for example, measure interpretability and performance).',
    'Describe principles of human-centered design for explainable AI (for example, user-feedback mechanisms, AI decision transparency).',
  ]),
  task('5.1', 'Explain methods to secure AI systems.', [
    'Identify AWS services and features to secure AI systems (for example, IAM roles, policies, and permissions; encryption; Amazon Macie; AWS PrivateLink; AWS shared responsibility model; Amazon Bedrock AgentCore Identity; Policy in AgentCore; Amazon Bedrock Guardrails).',
    'Describe the concept of source citation and documenting data origins (for example, data lineage, data cataloging, Amazon SageMaker Model Cards).',
    'Describe best practices for secure data engineering (for example, assessing data quality, implementing privacy-enhancing technologies, data access control, data integrity).',
    'Describe security and privacy considerations for AI systems (for example, application security, threat detection, vulnerability management, infrastructure protection, prompt injection, encryption at rest and in transit, data leakage prevention, output filtering and validation, audit trail and logging requirements for AI interactions, toxicity).',
    'Describe hallucination detection methods and grounding techniques to improve output accuracy (for example, Retrieval Augmented Generation [RAG] grounding, output validation, confidence scoring).',
  ]),
  task('5.2', 'Recognize governance and compliance regulations for AI systems.', [
    'Identify AWS services and features to assist with governance and regulation compliance (for example, AWS Config, Amazon Inspector, AWS Artifact, AWS CloudTrail, AWS Trusted Advisor).',
    'Describe data governance strategies (for example, data lifecycles, logging, residency, monitoring, observation, retention).',
    'Describe processes to follow governance protocols (for example, policies, review cadence, review strategies, governance frameworks such as the Generative AI Security Scoping Matrix, transparency standards, team training requirements).',
  ]),
]

export const DOMAIN_BY_ID = new Map(DOMAINS.map((d) => [d.id, d]))
export const TASK_BY_ID = new Map(TASKS.map((t) => [t.id, t]))
export const OBJECTIVE_BY_ID = new Map(TASKS.flatMap((t) => t.objectives.map((o) => [o.id, o] as const)))

export const tasksOf = (domainId: string) => TASKS.filter((t) => t.domainId === domainId)

/** The guide's out-of-scope job tasks, shown in the exam-day guide. */
export const OUT_OF_SCOPE_TASKS = [
  'Developing or coding AI/ML models or algorithms',
  'Implementing data engineering or feature engineering techniques',
  'Performing hyperparameter tuning or model optimization',
  'Building and deploying AI/ML pipelines or infrastructure',
  'Conducting mathematical or statistical analysis of AI/ML models',
  'Implementing security or compliance protocols for AI/ML systems',
  'Developing and implementing governance frameworks and policies for AI/ML solutions',
]

/**
 * Largest-remainder split of `total` by `weights`. Ties go to the earlier entry,
 * so the result is deterministic.
 */
export function largestRemainder(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0)
  const exact = weights.map((w) => (total * w) / sum)
  const counts = exact.map(Math.floor)
  let left = total - counts.reduce((a, b) => a + b, 0)
  const order = exact.map((x, i) => [x - Math.floor(x), i] as const).sort((a, b) => b[0] - a[0] || a[1] - b[1])
  for (const [, i] of order) {
    if (left-- <= 0) break
    counts[i]!++
  }
  return counts
}

/** Mock-exam items per domain (13 · 16 · 18 · 9 · 9). */
export function allocateItems(total = MOCK.items): Map<string, number> {
  const counts = largestRemainder(total, DOMAINS.map((d) => d.weight))
  return new Map(DOMAINS.map((d, i) => [d.id, counts[i]!]))
}

/**
 * Question target per task: the bank split by domain weight, then within each
 * domain by the tasks' objective counts (PLAN.md §4).
 */
export const QUESTION_TARGETS: Map<string, number> = new Map(
  [...allocateItems(BANK_TARGET)].flatMap(([domainId, n]) => {
    const tasks = tasksOf(domainId)
    const counts = largestRemainder(n, tasks.map((t) => t.objectives.length))
    return tasks.map((t, i) => [t.id, counts[i]!] as const)
  }),
)

export const questionTarget = (taskId: string) => QUESTION_TARGETS.get(taskId) ?? 0

/** Linear estimate of the scaled score from percent correct. Always label it an estimate. */
export const estimateScaledScore = (fraction: number) =>
  Math.round(EXAM_FORMAT.scaleMin + fraction * (EXAM_FORMAT.scaleMax - EXAM_FORMAT.scaleMin))
