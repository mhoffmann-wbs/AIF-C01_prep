import { useState } from 'react'
import { Illustrative, Panel, Slider } from '../ui'
import { type GuardrailConfig, type GuardrailsParams, type PiiAction, STRENGTHS, type Strength, applyGuardrail, emptyConfig } from './model'

const STRENGTH_LABELS: Record<Strength, string> = { none: 'None', low: 'Low', medium: 'Medium', high: 'High' }
const PII_LABELS: Record<PiiAction, string> = { off: 'Off', mask: 'Mask', block: 'Block' }
const threshold = (v: number) => (v === 0 ? 'off' : v.toFixed(2))

const selectClass = 'rounded border border-slate-300 bg-white px-2 py-1 text-sm'

export default function GuardrailsSim({ params }: { params: GuardrailsParams }) {
  const [config, setConfig] = useState<GuardrailConfig>(() => emptyConfig(params))
  const set = (change: Partial<GuardrailConfig>) => setConfig((c) => ({ ...c, ...change }))
  const toggle = (list: string[], item: string) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item])
  const outcomes = params.exchanges.map((ex) => ({ ex, out: applyGuardrail(ex, config, params) }))
  const blocked = outcomes.filter((o) => o.out.blocked).length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setConfig(emptyConfig(params))} className="rounded border px-3 py-1 text-sm">
          Switch everything off
        </button>
        <button type="button" onClick={() => setConfig(params.preset)} className="rounded border border-brand px-3 py-1 text-sm text-brand-dark">
          Use Cairnway's setup
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="space-y-4">
          <Panel title="Content filters">
            <div className="grid grid-cols-[1fr_auto] items-center gap-2">
              {params.categories.map((c) => (
                <label key={c.id} className="contents">
                  <span className="text-sm">
                    {c.label}
                    {c.inputOnly && <span className="text-xs text-slate-500"> (user input)</span>}
                  </span>
                  <select
                    value={config.content[c.id] ?? 'none'}
                    onChange={(e) => set({ content: { ...config.content, [c.id]: e.target.value as Strength } })}
                    className={selectClass}
                  >
                    {STRENGTHS.map((s) => (
                      <option key={s} value={s}>
                        {STRENGTH_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">Low blocks only clear cases; High also blocks borderline ones.</p>
          </Panel>

          <Panel title="Denied topics">
            {params.topics.map((t) => (
              <label key={t.id} className="flex items-start gap-2 text-sm">
                <input type="checkbox" checked={config.topics.includes(t.id)} onChange={() => set({ topics: toggle(config.topics, t.id) })} className="mt-1 accent-brand" />
                <span>
                  <strong>{t.name}</strong>: {t.definition}
                </span>
              </label>
            ))}
          </Panel>

          <Panel title="Word filters">
            <div className="flex flex-wrap gap-4">
              {params.words.map((w) => (
                <label key={w} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={config.words.includes(w)} onChange={() => set({ words: toggle(config.words, w) })} className="accent-brand" />
                  {w}
                </label>
              ))}
            </div>
          </Panel>

          <Panel title="Sensitive information (PII)">
            <div className="grid grid-cols-[1fr_auto] items-center gap-2">
              {params.entities.map((e) => (
                <label key={e.id} className="contents">
                  <span className="text-sm">
                    {e.label} <span className="font-mono text-xs text-slate-500">{e.id}</span>
                  </span>
                  <select
                    value={config.pii[e.id] ?? 'off'}
                    onChange={(ev) => set({ pii: { ...config.pii, [e.id]: ev.target.value as PiiAction } })}
                    className={selectClass}
                  >
                    {(Object.keys(PII_LABELS) as PiiAction[]).map((a) => (
                      <option key={a} value={a}>
                        {PII_LABELS[a]}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </Panel>

          <Panel title="Contextual grounding check">
            <p className="mb-3 text-sm text-slate-600">Source text: “{params.source}”</p>
            <div className="space-y-3">
              <Slider label="Grounding threshold" value={config.grounding} min={0} max={0.95} step={0.05} format={threshold} onChange={(grounding) => set({ grounding })} />
              <Slider label="Relevance threshold" value={config.relevance} min={0} max={0.95} step={0.05} format={threshold} onChange={(relevance) => set({ relevance })} />
            </div>
          </Panel>
        </div>

        <section aria-labelledby="gr-results" className="space-y-3">
          <h2 id="gr-results" className="font-semibold">
            Trailmate conversations <span className="font-normal text-slate-600">· {blocked} of {outcomes.length} blocked</span>
          </h2>
          <ol className="space-y-3">
            {outcomes.map(({ ex, out }) => {
              const masked = !out.blocked && out.reasons.length > 0
              const badge = out.blocked
                ? { text: `Blocked at the ${out.blocked}`, tone: 'border-red-600 bg-red-50' }
                : masked
                  ? { text: 'Passed with masking', tone: 'border-amber-300 bg-amber-50' }
                  : { text: 'Passed', tone: 'border-slate-300' }
              return (
                <li key={ex.id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{ex.label}</p>
                    <span className={`rounded border px-2 py-0.5 text-xs ${badge.tone}`}>{badge.text}</span>
                  </div>
                  <p className="mt-2">
                    <span className="text-xs uppercase tracking-wide text-slate-500">Customer</span> {out.input}
                  </p>
                  <p className="mt-1">
                    <span className="text-xs uppercase tracking-wide text-slate-500">Trailmate</span> {out.reply}
                  </p>
                  {out.reasons.length > 0 && (
                    <ul className="mt-2 list-disc pl-5 text-xs text-slate-600">
                      {out.reasons.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-1 text-xs text-slate-500">
                    Grounding {ex.grounding.toFixed(2)} · relevance {ex.relevance.toFixed(2)}
                  </p>
                </li>
              )
            })}
          </ol>
        </section>
      </div>

      <Illustrative>
        The conversations, Trailmate's unguarded replies and what the guardrail detects in each (confidence levels, topics, personal details and
        grounding scores) are written in advance. How the settings act on those findings follows the Amazon Bedrock Guardrails documentation.
      </Illustrative>
    </div>
  )
}
