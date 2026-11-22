// One valid item per kind, for schema, quality and engine tests.
import type { Item } from '../content/schema'

const opt = (text: string, correct = false) => ({ text, correct, rationale: `Why "${text}" ${correct ? 'fits' : 'misses'}.` })

export const SINGLE: Extract<Item, { kind: 'single' }> = {
  id: '1.2-001',
  taskId: '1.2',
  kind: 'single',
  objectives: ['1.2.5'],
  services: ['textract'],
  stem: 'Cairnway Outfitters wants to pull line items out of scanned supplier invoices. Which AWS service meets this need?',
  options: [opt('Amazon Textract', true), opt('Amazon Comprehend'), opt('Amazon Rekognition'), opt('Amazon Translate')],
  explanation: 'Textract extracts text, forms and tables from scanned documents.',
}

export const MULTI: Extract<Item, { kind: 'multi' }> = {
  id: '3.1-001',
  taskId: '3.1',
  kind: 'multi',
  objectives: ['3.1.4'],
  stem: 'Which AWS services can store embeddings for vector search? (Select TWO.)',
  select: 2,
  options: [opt('Amazon OpenSearch Service', true), opt('Amazon Aurora', true), opt('Amazon Polly'), opt('AWS Budgets'), opt('Amazon Lex')],
  explanation: 'OpenSearch Service and Aurora PostgreSQL with pgvector both support vector search.',
}

export const ORDER: Extract<Item, { kind: 'order' }> = {
  id: '3.1-002',
  taskId: '3.1',
  kind: 'order',
  objectives: ['3.1.3'],
  stem: 'Put the steps of preparing documents for RAG in order.',
  steps: ['Split the documents into chunks', 'Create an embedding for each chunk', 'Store the embeddings in a vector database'],
  explanation: 'Chunks are embedded, then the vectors are stored for similarity search.',
}

export const MATCH: Extract<Item, { kind: 'match' }> = {
  id: '1.2-002',
  taskId: '1.2',
  kind: 'match',
  objectives: ['1.2.5'],
  stem: 'Match each task to the AWS service that performs it.',
  pairs: [
    { prompt: 'Turn call recordings into text', answer: 'Amazon Transcribe' },
    { prompt: 'Read product descriptions aloud', answer: 'Amazon Polly' },
    { prompt: 'Translate the help center into Spanish', answer: 'Amazon Translate' },
  ],
  distractors: ['Amazon Lex'],
  explanation: 'Transcribe is speech-to-text, Polly is text-to-speech, Translate translates text.',
}

export const CASE: Extract<Item, { kind: 'case' }> = {
  id: '5.1-001',
  taskId: '5.1',
  kind: 'case',
  scenario: 'Cairnway Outfitters is launching a support chatbot on Amazon Bedrock that answers from order data.',
  parts: [
    {
      kind: 'single',
      objectives: ['5.1.1'],
      stem: 'Which service finds customer PII in the S3 bucket that feeds the chatbot?',
      options: [opt('Amazon Macie', true), opt('Amazon Inspector'), opt('AWS Config'), opt('AWS Artifact')],
      explanation: 'Macie discovers sensitive data in S3.',
    },
    {
      kind: 'multi',
      objectives: ['5.1.4'],
      select: 2,
      stem: 'Which measures reduce the risk of prompt injection? (Select TWO.)',
      options: [opt('Bedrock Guardrails prompt-attack filter', true), opt('Validating and filtering model output', true), opt('A larger model'), opt('A higher temperature'), opt('Longer prompts')],
      explanation: 'Input filtering and output validation both limit what an injected prompt can do.',
    },
  ],
}

export const FIXTURES: Item[] = [SINGLE, MULTI, ORDER, MATCH, CASE]
