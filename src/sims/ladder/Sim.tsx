import { useState } from 'react'
import { Panel } from '../ui'
import { type LadderParams, type Need, type Rung, recommend } from './model'

/** "Prompt engineering (in-context learning)" → "Prompt engineering", for buttons. */
const short = (name: string) => name.replace(/\s*\(.*\)$/, '')

export default function LadderSim({ params }: { params: LadderParams }) {
  const [needs, setNeeds] = useState<Need[]>([])
  const [picks, setPicks] = useState<Record<string, Rung>>({})
  const rec = recommend(needs)
  const rungName = (id: Rung) => short(params.rungs.find((r) => r.id === id)!.name)
  const answered = params.scenarios.filter((s) => picks[s.id])
  const right = answered.filter((s) => picks[s.id] === s.answer).length

  const toggle = (id: Need) => setNeeds((n) => (n.includes(id) ? n.filter((x) => x !== id) : [...n, id]))

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <Panel title="What does the use case need?">
          <fieldset className="space-y-3">
            <legend className="sr-only">Needs</legend>
            {params.needs.map((n) => (
              <label key={n.id} className="flex items-start gap-2">
                <input type="checkbox" checked={needs.includes(n.id)} onChange={() => toggle(n.id)} className="mt-1 accent-brand" />
                <span>{n.label}</span>
              </label>
            ))}
          </fieldset>
          <p role="status" className="mt-4 rounded border border-brand bg-brand/10 p-3">
            Cheapest fit: <strong>{rungName(rec)}</strong>
            {needs.includes('facts') && rec !== 'rag' && rec !== 'prompting' && (
              <span className="block text-sm">Your facts still change, so combine it with RAG: training doesn't keep facts current.</span>
            )}
          </p>
        </Panel>

        <Panel title="The ladder: cost and effort rise as you climb">
          <ol className="space-y-2" aria-label="Customization approaches from costliest to cheapest">
            {[...params.rungs].reverse().map((r) => (
              <li
                key={r.id}
                aria-current={r.id === rec ? 'step' : undefined}
                className={`rounded border p-3 text-sm ${r.id === rec ? 'border-brand bg-brand/10' : 'border-slate-200'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">
                    {r.name}
                    {r.id === 'distillation' && <span className="ml-1 font-normal text-slate-500">(a side step: cheaper to run)</span>}
                  </p>
                  <span className="shrink-0 font-mono text-accent" aria-label={`Cost level ${r.level} of 5`}>
                    {'$'.repeat(r.level)}
                  </span>
                </div>
                <p>{r.what}</p>
                <p className="text-xs text-slate-500">
                  Data: {r.data} Costs: {r.costs} {r.trains ? 'Changes the model.' : 'The model stays the same.'}
                </p>
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-semibold">Place Cairnway's use cases</h2>
          <p className="text-sm text-slate-600" aria-live="polite">
            {answered.length === 0 ? `${params.scenarios.length} use cases` : `${right} of ${answered.length} right`}
            {answered.length > 0 && (
              <button type="button" onClick={() => setPicks({})} className="ml-3 rounded border px-2 py-0.5">
                Start over
              </button>
            )}
          </p>
        </div>
        <ol className="space-y-3">
          {params.scenarios.map((s) => {
            const pick = picks[s.id]
            return (
              <li key={s.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <p>{s.text}</p>
                <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={`Approach for: ${s.text}`}>
                  {params.rungs.map((r) => {
                    const tone =
                      pick === undefined
                        ? 'border-slate-300'
                        : r.id === s.answer
                          ? 'border-green-600 bg-green-50'
                          : r.id === pick
                            ? 'border-red-600 bg-red-50'
                            : 'border-slate-200 text-slate-400'
                    return (
                      <button
                        key={r.id}
                        type="button"
                        disabled={pick !== undefined}
                        aria-pressed={pick === r.id}
                        onClick={() => setPicks((p) => ({ ...p, [s.id]: r.id }))}
                        className={`rounded border px-3 py-1 text-sm ${tone}`}
                      >
                        {short(r.name)}
                      </button>
                    )
                  })}
                </div>
                {pick && (
                  <p className="mt-2 text-sm">
                    <strong className={pick === s.answer ? 'text-green-600' : 'text-red-600'}>
                      {pick === s.answer ? '✓ Right.' : `✗ It's ${rungName(s.answer)}.`}
                    </strong>{' '}
                    {s.why}
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
