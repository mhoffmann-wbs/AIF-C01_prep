import { describe, expect, it } from 'vitest'
import data from '../../content/sims/rag.json'
import { answerFound, augment, chunk, cosine, paramsSchema, rank } from './model'

const params = paramsSchema.parse(data.params)

describe('RAG step-through', () => {
  it('measures similarity by direction, not length', () => {
    expect(cosine([1, 0], [5, 0])).toBeCloseTo(1)
    expect(cosine([1, 0], [0, 2])).toBeCloseTo(0)
    expect(cosine([1, 0], [-1, 0])).toBeCloseTo(-1)
  })

  it('groups consecutive sentences into chunks, keeping a short last chunk', () => {
    const chunks = chunk(params.sentences.slice(0, 5), 2)
    expect(chunks.map((c) => c.sentences)).toEqual([[0, 1], [2, 3], [4]])
    expect(chunks[0]!.text).toBe(`${params.sentences[0]!.text} ${params.sentences[1]!.text}`)
    expect(Math.hypot(...chunks[0]!.vector)).toBeCloseTo(1)
  })

  it('retrieves the answer sentence first for every answerable question at every chunk size', () => {
    const misses = params.questions.flatMap((q) =>
      q.answerSentence === null
        ? []
        : params.chunkSizes.filter((size) => !answerFound(rank(chunk(params.sentences, size), q.vector).slice(0, 1), q.answerSentence)).map((size) => `${q.id} @ ${size}`),
    )
    expect(misses).toEqual([])
  })

  it('finds nothing for a question the FAQ cannot answer, and the closest chunk is far away', () => {
    const q = params.questions.find((x) => x.answerSentence === null)!
    const ranked = rank(chunk(params.sentences, 1), q.vector)
    expect(answerFound(ranked, q.answerSentence)).toBe(false)
    expect(ranked[0]!.score).toBeLessThan(0.5)
  })

  it('builds the prompt from instructions, numbered chunks and the question', () => {
    const chunks = chunk(params.sentences, 4).slice(0, 2)
    const prompt = augment('Be brief.', chunks, 'Why?')
    expect(prompt).toBe(['Be brief.', '', 'Context:', `[1] ${chunks[0]!.text}`, `[2] ${chunks[1]!.text}`, '', 'Question: Why?'].join('\n'))
  })
})
