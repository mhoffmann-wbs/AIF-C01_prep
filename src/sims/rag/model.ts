// RAG pipeline step-through: chunk an FAQ, embed the chunks as toy 2-D
// vectors, retrieve the closest chunks for a question by cosine similarity,
// and answer from them. A chunk's vector is the normalized mean of its
// sentences' vectors; real embeddings have far more dimensions.
import { z } from 'zod'

const nonEmpty = z.string().trim().min(1)
const vector = z.tuple([z.number(), z.number()])

export const paramsSchema = z.object({
  document: nonEmpty,
  sentences: z.array(z.object({ text: nonEmpty, vector })).min(8),
  /** Sentences per chunk the learner can choose from. */
  chunkSizes: z.array(z.number().int().min(1)).min(2),
  /** Shown in the Store step: what a vector store is and the AWS options. */
  store: z.array(nonEmpty).min(1),
  /** The instruction at the top of the augmented prompt. */
  instructions: nonEmpty,
  questions: z
    .array(
      z.object({
        id: z.string().regex(/^[a-z][a-z0-9-]*$/),
        text: nonEmpty,
        vector,
        /** Index of the sentence that answers it, or null when the FAQ has no answer. */
        answerSentence: z.number().int().min(0).nullable(),
        /** The canned answer when the answer sentence was retrieved. */
        grounded: nonEmpty,
        /** The canned answer of the model without RAG. */
        withoutRag: nonEmpty,
      }),
    )
    .min(3),
  /** The canned answer when the answer sentence was not retrieved, or doesn't exist. */
  notFound: nonEmpty,
  maxTopK: z.number().int().min(1).max(5),
})

export type RagParams = z.infer<typeof paramsSchema>
export type Vec = readonly [number, number]

export interface Chunk {
  /** 1-based, as shown to the learner. */
  n: number
  sentences: number[]
  text: string
  vector: Vec
}

const norm = (v: Vec) => Math.hypot(v[0], v[1])
export const normalize = (v: Vec): Vec => [v[0] / norm(v), v[1] / norm(v)]
export const cosine = (a: Vec, b: Vec) => (a[0] * b[0] + a[1] * b[1]) / (norm(a) * norm(b))

/** Splits the sentences into chunks of `size` consecutive sentences. */
export function chunk(sentences: RagParams['sentences'], size: number): Chunk[] {
  const chunks: Chunk[] = []
  for (let i = 0; i < sentences.length; i += size) {
    const part = sentences.slice(i, i + size)
    const sum: Vec = part.reduce<Vec>((s, x) => [s[0] + x.vector[0], s[1] + x.vector[1]], [0, 0])
    chunks.push({
      n: chunks.length + 1,
      sentences: part.map((_, j) => i + j),
      text: part.map((x) => x.text).join(' '),
      vector: normalize(sum),
    })
  }
  return chunks
}

export interface Ranked extends Chunk {
  score: number
}

/** Every chunk with its similarity to the question, most similar first. */
export const rank = (chunks: readonly Chunk[], query: Vec): Ranked[] =>
  chunks.map((c) => ({ ...c, score: cosine(c.vector, query) })).sort((a, b) => b.score - a.score || a.n - b.n)

/** True when one of the retrieved chunks holds the answer sentence. */
export const answerFound = (retrieved: readonly Chunk[], answerSentence: number | null) =>
  answerSentence !== null && retrieved.some((c) => c.sentences.includes(answerSentence))

/** The augmented prompt: instructions, numbered context chunks, then the question. */
export const augment = (instructions: string, retrieved: readonly Chunk[], question: string) =>
  [instructions, '', 'Context:', ...retrieved.map((c, i) => `[${i + 1}] ${c.text}`), '', `Question: ${question}`].join('\n')
