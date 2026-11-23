import { useState } from 'react'
import { Choice, Panel } from '../ui'
import { type InferenceParams, type Mode, type Requirements, recommend } from './model'

const QUESTIONS: { key: keyof Requirements; label: string; options: { id: string; label: string }[] }[] = [
  {
    key: 'scope',
    label: 'What does the model score?',
    options: [
      { id: 'request', label: 'One request at a time' },
      { id: 'dataset', label: 'A whole data set at once' },
    ],
  },
  {
    key: 'wait',
    label: 'Is someone waiting for the answer?',
    options: [
      { id: 'now', label: 'Yes, right away' },
      { id: 'later', label: 'No, it can arrive later' },
    ],
  },
  {
    key: 'size',
    label: 'How big is each job?',
    options: [
      { id: 'small', label: 'Small and quick' },
      { id: 'large', label: 'Large files or minutes of processing' },
    ],
  },
  {
    key: 'traffic',
    label: 'How does the traffic look?',
    options: [
      { id: 'steady', label: 'Busy all day' },
      { id: 'idle', label: 'Quiet for long stretches; a short wake-up delay is fine' },
    ],
  },
]

export default function InferenceSim({ params }: { params: InferenceParams }) {
  const [req, setReq] = useState<Requirements>({ scope: 'request', wait: 'now', size: 'small', traffic: 'steady' })
  const [picks, setPicks] = useState<Record<string, Mode>>({})
  const rec = recommend(req)
  const modeName = (id: Mode) => params.modes.find((m) => m.id === id)!.name
  const answered = params.workloads.filter((w) => picks[w.id])
  const right = answered.filter((w) => picks[w.id] === w.answer).length

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Describe the workload">
          <div className="space-y-4">
            {QUESTIONS.map((q) => (
              <Choice
                key={q.key}
                label={q.label}
                value={req[q.key] as string}
                options={q.options}
                onChange={(v) => setReq((r) => ({ ...r, [q.key]: v }))}
              />
            ))}
          </div>
        </Panel>
        <div className="space-y-3">
          <div role="status" className="rounded-lg border border-brand bg-brand/10 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Recommended</p>
            <p className="text-2xl font-semibold">{modeName(rec.mode)} inference</p>
            <p className="mt-1">{rec.reason}</p>
          </div>
          <ul className="space-y-2">
            {params.modes.map((m) => (
              <li key={m.id} className={`rounded border p-3 text-sm ${m.id === rec.mode ? 'border-brand' : 'border-slate-200 text-slate-600'}`}>
                <p className="font-semibold">{m.name}</p>
                <p>{m.summary}</p>
                <p className="text-xs text-slate-500">Clue: {m.clue}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-semibold">Place Cairnway's workloads</h2>
          <p className="text-sm text-slate-600" aria-live="polite">
            {answered.length === 0 ? `${params.workloads.length} workloads` : `${right} of ${answered.length} right`}
            {answered.length > 0 && (
              <button type="button" onClick={() => setPicks({})} className="ml-3 rounded border px-2 py-0.5">
                Start over
              </button>
            )}
          </p>
        </div>
        <ol className="space-y-3">
          {params.workloads.map((w) => {
            const pick = picks[w.id]
            return (
              <li key={w.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <p>{w.text}</p>
                <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={`Inference mode for: ${w.text}`}>
                  {params.modes.map((m) => {
                    const tone =
                      pick === undefined
                        ? 'border-slate-300'
                        : m.id === w.answer
                          ? 'border-green-600 bg-green-50'
                          : m.id === pick
                            ? 'border-red-600 bg-red-50'
                            : 'border-slate-200 text-slate-400'
                    return (
                      <button
                        key={m.id}
                        type="button"
                        disabled={pick !== undefined}
                        aria-pressed={pick === m.id}
                        onClick={() => setPicks((p) => ({ ...p, [w.id]: m.id }))}
                        className={`rounded border px-3 py-1 text-sm ${tone}`}
                      >
                        {m.name}
                      </button>
                    )
                  })}
                </div>
                {pick && (
                  <p className="mt-2 text-sm">
                    <strong className={pick === w.answer ? 'text-green-600' : 'text-red-600'}>
                      {pick === w.answer ? '✓ Right.' : `✗ It's ${modeName(w.answer)}.`}
                    </strong>{' '}
                    {w.why}
                  </p>
                )}
              </li>
            )
          })}
        </ol>
      </section>
    </div>
  )
}
