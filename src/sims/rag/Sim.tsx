import { useState } from 'react'
import { Bar, Choice, Illustrative, Panel, Slider } from '../ui'
import { type Chunk, type RagParams, type Vec, answerFound, augment, chunk, normalize, rank } from './model'

const STEPS = ['Chunk', 'Embed', 'Store', 'Retrieve', 'Augment', 'Generate'] as const

export default function RagSim({ params }: { params: RagParams }) {
  const [step, setStep] = useState(0)
  const [size, setSize] = useState(params.chunkSizes[1] ?? params.chunkSizes[0]!)
  const [questionId, setQuestionId] = useState(params.questions[0]!.id)
  const [topK, setTopK] = useState(Math.min(2, params.maxTopK))
  const chunks = chunk(params.sentences, size)
  const question = params.questions.find((q) => q.id === questionId)!
  const ranked = rank(chunks, question.vector)
  const retrieved = ranked.slice(0, topK)
  const found = answerFound(retrieved, question.answerSentence)
  const showQuery = step >= 3

  return (
    <div className="space-y-4">
      <nav aria-label="RAG steps">
        <ol className="flex flex-wrap gap-2">
          {STEPS.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                aria-current={i === step ? 'step' : undefined}
                onClick={() => setStep(i)}
                className={`rounded border px-3 py-1 text-sm ${i === step ? 'border-brand bg-brand text-chalk' : 'border-slate-300'}`}
              >
                {i + 1}. {s}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <p className="text-xs uppercase tracking-wide text-slate-500">
        {step < 3 ? 'Phase 1: preparing the data, done ahead of time' : 'Phase 2: answering a question, every time'}
      </p>

      {step === 0 && (
        <Panel title={`1. Split the ${params.document} into chunks`}>
          <Choice
            label="Sentences per chunk"
            value={String(size)}
            options={params.chunkSizes.map((n) => ({ id: String(n), label: String(n) }))}
            onChange={(v) => setSize(Number(v))}
          />
          <p className="mt-3 text-sm text-slate-600">
            {chunks.length} chunks.{' '}
            {size === Math.max(...params.chunkSizes)
              ? 'Each chunk now mixes different topics, and every retrieved chunk adds tokens to the prompt.'
              : size === 1
                ? 'Single sentences are precise, but a sentence on its own can lose the meaning around it.'
                : 'Each chunk stays on one topic.'}
          </p>
          <ol className="mt-3 space-y-2">
            {chunks.map((c) => (
              <li key={c.n} className="rounded border border-slate-200 p-2 text-sm">
                <span className="mr-2 font-mono text-xs text-slate-500">Chunk {c.n}</span>
                {c.text}
              </li>
            ))}
          </ol>
        </Panel>
      )}

      {(step === 1 || step === 3) && (
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <Panel title={step === 1 ? '2. Turn each chunk into an embedding' : 'Where the question lands'}>
            <VectorPlot chunks={chunks} retrieved={showQuery ? retrieved : []} query={showQuery ? question.vector : undefined} />
          </Panel>
          {step === 1 ? (
            <Panel title="Similar meaning, nearby vectors">
              <p className="text-sm">
                An embedding model turns each chunk into a vector: a list of numbers that captures its meaning. Chunks about the same topic point in
                a similar direction, so returns, shipping, repairs and sizing form four groups.
              </p>
              <ul className="mt-3 space-y-1 font-mono text-xs">
                {chunks.map((c) => (
                  <li key={c.n}>
                    Chunk {c.n}: [{c.vector[0].toFixed(2)}, {c.vector[1].toFixed(2)}]
                  </li>
                ))}
              </ul>
            </Panel>
          ) : (
            <Panel title="4. Retrieve the closest chunks">
              <div className="space-y-4">
                <Choice label="Customer question" value={questionId} options={params.questions.map((q) => ({ id: q.id, label: q.text }))} onChange={setQuestionId} />
                <Slider label="Top K (chunks to retrieve)" value={topK} min={1} max={params.maxTopK} step={1} onChange={setTopK} />
                <div className="space-y-1" role="list" aria-label="Chunks by similarity to the question">
                  {ranked.slice(0, 6).map((c, i) => (
                    <div role="listitem" key={c.n}>
                      <Bar label={`Chunk ${c.n}`} fraction={Math.max(0, c.score)} text={c.score.toFixed(2)} muted={i >= topK} />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500">
                  The score is cosine similarity: 1 means the same direction, 0 means unrelated. The question is embedded the same way as the
                  chunks.
                </p>
              </div>
            </Panel>
          )}
        </div>
      )}

      {step === 2 && (
        <Panel title="3. Store the vectors in a vector database">
          <div className="space-y-3">
            {params.store.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </Panel>
      )}

      {step === 4 && (
        <Panel title="5. Augment the prompt">
          <p className="mb-2 text-sm text-slate-600">The retrieved chunks are added to the prompt, between the instructions and the question.</p>
          <pre className="whitespace-pre-wrap rounded bg-code p-3 font-mono text-sm text-chalk">{augment(params.instructions, retrieved, question.text)}</pre>
        </Panel>
      )}

      {step === 5 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Panel title="6. Generate: with RAG">
            <p className="text-sm text-slate-600">“{question.text}”</p>
            <p className="mt-2 text-lg">{question.answerSentence === null || found ? question.grounded : params.notFound}</p>
            <p className="mt-2 text-sm text-slate-600">
              {found
                ? `Grounded in chunk ${retrieved.find((c) => c.sentences.includes(question.answerSentence!))!.n} of the FAQ, so it can be cited.`
                : question.answerSentence === null
                  ? 'The FAQ has no answer, and the instructions say not to guess.'
                  : 'The chunk with the answer was not retrieved. Raise top K or change the chunk size.'}
            </p>
          </Panel>
          <Panel title="Without RAG">
            <p className="text-sm text-slate-600">“{question.text}”</p>
            <p className="mt-2 text-lg">{question.withoutRag}</p>
            <p className="mt-2 rounded border border-red-600 bg-red-50 px-3 py-2 text-sm">
              Confident, fluent and invented: a hallucination. Nothing in the FAQ supports it, so a Guardrails contextual grounding check would
              flag it as ungrounded.
            </p>
          </Panel>
        </div>
      )}

      <div className="flex justify-between">
        <button type="button" disabled={step === 0} onClick={() => setStep((s) => s - 1)} className="rounded border px-4 py-2 disabled:opacity-40">
          ← Back
        </button>
        <button
          type="button"
          disabled={step === STEPS.length - 1}
          onClick={() => setStep((s) => s + 1)}
          className="rounded bg-brand px-4 py-2 font-medium text-chalk disabled:opacity-40"
        >
          Next: {STEPS[step + 1] ?? 'done'} →
        </button>
      </div>

      <Illustrative>
        The 2-D vectors and the answers are made up so you can see them. Real embeddings have far more numbers each, and a real
        model writes the answers.
      </Illustrative>
    </div>
  )
}

const SIZE = 240
const sx = (x: number) => SIZE / 2 + x * (SIZE / 2 - 16)
const sy = (y: number) => SIZE / 2 - y * (SIZE / 2 - 16)

function VectorPlot({ chunks, retrieved, query }: { chunks: readonly Chunk[]; retrieved: readonly Chunk[]; query?: Vec }) {
  const hit = new Set(retrieved.map((c) => c.n))
  // Only the direction matters for similarity, so the question is drawn inside the circle, along its ray.
  const q = query && ([normalize(query)[0] * 0.6, normalize(query)[1] * 0.6] as const)
  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="mx-auto w-full max-w-sm"
      role="img"
      aria-label={query ? `Chunk vectors and the question; retrieved chunks: ${[...hit].join(', ')}` : 'Chunk vectors, grouped by topic'}
    >
      <circle cx={sx(0)} cy={sy(0)} r={SIZE / 2 - 16} fill="none" className="stroke-slate-200" />
      <line x1={sx(-1)} y1={sy(0)} x2={sx(1)} y2={sy(0)} className="stroke-slate-200" />
      <line x1={sx(0)} y1={sy(-1)} x2={sx(0)} y2={sy(1)} className="stroke-slate-200" />
      {query && <line x1={sx(0)} y1={sy(0)} x2={sx(normalize(query)[0])} y2={sy(normalize(query)[1])} strokeDasharray="4 3" className="stroke-accent" />}
      {chunks.map((c) => (
        <g key={c.n}>
          <circle cx={sx(c.vector[0])} cy={sy(c.vector[1])} r={9} className={hit.has(c.n) ? 'fill-accent' : 'fill-brand'} />
          <text x={sx(c.vector[0])} y={sy(c.vector[1]) + 3.5} textAnchor="middle" fontSize={9} className="fill-white font-mono">
            {c.n}
          </text>
        </g>
      ))}
      {q && (
        <g>
          <rect x={sx(q[0]) - 6} y={sy(q[1]) - 6} width={12} height={12} transform={`rotate(45 ${sx(q[0])} ${sy(q[1])})`} className="fill-accent" />
          <text x={sx(q[0])} y={sy(q[1]) + 20} textAnchor="middle" fontSize={11} className="fill-slate-700 font-semibold">
            Question
          </text>
        </g>
      )}
    </svg>
  )
}
