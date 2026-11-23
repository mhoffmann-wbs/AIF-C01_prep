import { useState } from 'react'
import { Choice, Illustrative, Panel, Slider, pct } from '../ui'
import { type CostParams, type Workload, monthly } from './model'

const money = (x: number) =>
  x >= 100 ? `$${Math.round(x).toLocaleString('en-US')}` : x >= 1 ? `$${x.toFixed(2)}` : `$${x.toFixed(4)}`
const tokens = (n: number) => n.toLocaleString('en-US')

export default function CostSim({ params }: { params: CostParams }) {
  const first = params.presets[0]!
  const [presetId, setPresetId] = useState(first.id)
  const [w, setW] = useState<Workload>(first.workload)
  const [waiting, setWaiting] = useState(first.realtime)
  const r = params.rates
  const m = monthly(w, r, params.daysPerMonth)
  const preset = params.presets.find((p) => p.id === presetId)!

  function pickPreset(id: string) {
    const p = params.presets.find((x) => x.id === id)!
    setPresetId(id)
    setW(p.workload)
    setWaiting(p.realtime)
  }

  const set = (change: Partial<Workload>) =>
    setW((old) => {
      const next = { ...old, ...change }
      return { ...next, cachedPrefix: Math.min(next.cachedPrefix, next.inputTokens) }
    })

  const stepIndex = params.requestSteps.reduce(
    (best, v, i) => (Math.abs(v - w.requestsPerDay) < Math.abs(params.requestSteps[best]! - w.requestsPerDay) ? i : best),
    0,
  )

  const options = [
    { id: 'onDemand', name: 'On-demand', cost: m.onDemand, note: 'Per token, no commitment.', fits: true },
    {
      id: 'batch',
      name: 'Batch',
      cost: m.batch,
      note: waiting ? 'Not real time: someone is waiting for each answer, so batch does not fit.' : 'Requests run together, results later.',
      fits: !waiting,
    },
    {
      id: 'provisioned',
      name: 'Provisioned Throughput',
      cost: m.provisioned,
      note: `${m.units} model ${m.units === 1 ? 'unit' : 'units'} × ${money(r.unitPerHour)} an hour, around the clock, used or not.`,
      fits: true,
    },
  ]
  const cheapest = options.filter((o) => o.fits).reduce((a, b) => (b.cost < a.cost ? b : a))
  const top = Math.max(...options.map((o) => o.cost))

  return (
    <div className="space-y-4">
      <Choice label="Start from" value={presetId} options={params.presets.map((p) => ({ id: p.id, label: p.label }))} onChange={pickPreset} />
      <p className="text-sm text-slate-600">{preset.note}</p>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="The workload">
          <div className="space-y-4">
            <Slider label="Input tokens per request" value={w.inputTokens} min={100} max={20000} step={100} format={tokens} onChange={(v) => set({ inputTokens: v })} />
            <Slider label="Output tokens per request" value={w.outputTokens} min={50} max={4000} step={50} format={tokens} onChange={(v) => set({ outputTokens: v })} />
            <Slider
              label="Requests per day"
              value={stepIndex}
              min={0}
              max={params.requestSteps.length - 1}
              step={1}
              format={(i) => tokens(params.requestSteps[i]!)}
              onChange={(i) => set({ requestsPerDay: params.requestSteps[i]! })}
            />
            <Choice
              label="Does someone wait for each answer?"
              value={waiting ? 'yes' : 'no'}
              options={[
                { id: 'yes', label: 'Yes' },
                { id: 'no', label: 'No, it can wait' },
              ]}
              onChange={(v) => setWaiting(v === 'yes')}
            />
          </div>
        </Panel>

        <Panel title="Prompt caching (on-demand)">
          <div className="space-y-4">
            <Slider
              label="Repeated prefix that can be cached"
              value={w.cachedPrefix}
              min={0}
              max={w.inputTokens}
              step={100}
              format={(v) => `${tokens(v)} tokens`}
              onChange={(v) => set({ cachedPrefix: v })}
              hint="The same instructions or document at the start of every request."
            />
            <Slider
              label="Requests that find it in the cache"
              value={w.hitRate}
              min={0}
              max={1}
              step={0.05}
              format={(v) => pct(v)}
              onChange={(v) => set({ hitRate: v })}
            />
            <p className="text-sm">
              Without caching: <span className="font-mono">{money(m.onDemandNoCache)}</span> a month. With it:{' '}
              <span className="font-mono">{money(m.onDemand)}</span>
              {m.onDemand < m.onDemandNoCache
                ? ` (${pct(1 - m.onDemand / m.onDemandNoCache)} less).`
                : m.onDemand > m.onDemandNoCache
                  ? ': more, because cache writes cost extra and too few requests reuse them.'
                  : '.'}
            </p>
          </div>
        </Panel>
      </div>

      <Panel title={`A month: ${tokens(m.requests)} requests`}>
        <ul className="space-y-3">
          {options.map((o) => (
            <li key={o.id} className={o.fits ? '' : 'opacity-60'}>
              <p className="font-medium">{o.name}</p>
              <span className="mt-1 block h-3 rounded bg-slate-100" aria-hidden="true">
                <span className={`block h-3 rounded ${o.fits ? 'bg-brand' : 'bg-slate-300'}`} style={{ width: `${(o.cost / top) * 100}%` }} />
              </span>
              <p className="mt-1 text-sm">
                <strong className="font-mono">{money(o.cost)}</strong>
                {o === cheapest && <span className="ml-2 rounded bg-green-50 px-1.5 text-xs text-green-600">cheapest that fits</span>} ·{' '}
                {money(o.cost / m.requests)} per request · {o.note}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-slate-600">
          Each answer takes about {m.outputSeconds.toFixed(1)} seconds to write at {r.tokensPerSecond} tokens a second: more output tokens cost more{' '}
          <em>and</em> take longer.
        </p>
      </Panel>

      <Illustrative>
        Every rate here is an invented example, not an AWS price: {money(r.inputPerMillion)} per million input tokens,{' '}
        {money(r.outputPerMillion)} per million output tokens, {money(r.unitPerHour)} per model unit per hour, cache reads at{' '}
        {r.cacheRead}× and cache writes at {r.cacheWrite}× the input rate. Real prices depend on the model, the provider and the Region; see the
        Amazon Bedrock pricing page in the sources below. The batch discount follows AWS's statement that select models cost 50% less in batch.
      </Illustrative>
    </div>
  )
}
