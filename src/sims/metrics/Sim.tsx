import { useState } from 'react'
import { Choice, Illustrative, Panel, Slider, Stat, pct } from '../ui'
import { type Band, type Confusion, type MetricsParams, businessCost, confusion, metrics } from './model'

const show = (x: number) => (Number.isNaN(x) ? '—' : pct(x, 1))
const money = (x: number) => `$${Math.round(x).toLocaleString('en-US')}`
const THRESHOLDS = Array.from({ length: 11 }, (_, i) => i / 10)

export default function MetricsSim({ params }: { params: MetricsParams }) {
  const [mode, setMode] = useState<'threshold' | 'counts'>('threshold')
  const [threshold, setThreshold] = useState(params.threshold)
  const [typed, setTyped] = useState<Confusion>(() => confusion(params.bands, params.threshold))
  const cm = mode === 'threshold' ? confusion(params.bands, threshold) : typed
  const m = metrics(cm)
  const cost = businessCost(cm, params.costs)

  function switchMode(next: 'threshold' | 'counts') {
    // Typing starts from the matrix currently shown.
    if (next === 'counts') setTyped(confusion(params.bands, threshold))
    setMode(next)
  }

  return (
    <div className="space-y-4">
      <Choice
        label="How to set the matrix"
        value={mode}
        options={[
          { id: 'threshold', label: 'Move the threshold' },
          { id: 'counts', label: 'Type the counts' },
        ]}
        onChange={switchMode}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Confusion matrix">
          {mode === 'threshold' && (
            <div className="mb-4">
              <Slider
                label="Flag orders scoring at least"
                value={threshold}
                min={0}
                max={1}
                step={0.1}
                format={(v) => (v >= 1 ? '1.0 (flag nothing)' : v.toFixed(1))}
                onChange={setThreshold}
              />
            </div>
          )}
          <Matrix cm={cm} params={params} editable={mode === 'counts'} onChange={setTyped} />
        </Panel>

        <Panel title="Model metrics">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Accuracy" value={show(m.accuracy)} note={`(${cm.tp} + ${cm.tn}) / ${cm.tp + cm.fp + cm.fn + cm.tn}`} />
            <Stat label="Precision" value={show(m.precision)} note={`${cm.tp} / (${cm.tp} + ${cm.fp})`} />
            <Stat label="Recall" value={show(m.recall)} note={`${cm.tp} / (${cm.tp} + ${cm.fn})`} />
            <Stat label="F1 score" value={Number.isNaN(m.f1) ? '—' : m.f1.toFixed(2)} note="2 × P × R / (P + R)" />
          </div>
          {cm.tp + cm.fp === 0 && (
            <p className="mt-3 text-sm">Nothing is flagged, so precision is undefined and recall is 0%, however good the accuracy looks.</p>
          )}
        </Panel>
      </div>

      {mode === 'threshold' && (
        <Panel title="The precision and recall trade-off">
          <TradeOff bands={params.bands} threshold={threshold} />
        </Panel>
      )}

      <Panel title="What it costs the business">
        <p>
          {cm.fn} missed {params.positive.toLowerCase()} × {money(params.costs.missedFraud)} + {cm.fp} false alarms ×{' '}
          {money(params.costs.falseAlarm)} = <strong className="font-mono">{money(cost)}</strong>
        </p>
        <Illustrative>
          Invented figures: Cairnway assumes a missed fraudulent order loses {money(params.costs.missedFraud)}, and a legitimate order held by
          mistake costs {money(params.costs.falseAlarm)} in support time and lost goodwill. Find the threshold with the lowest cost: it is not
          the one with the best accuracy.
        </Illustrative>
      </Panel>
    </div>
  )
}

function Matrix({ cm, params, editable, onChange }: { cm: Confusion; params: MetricsParams; editable: boolean; onChange: (cm: Confusion) => void }) {
  const cell = (key: keyof Confusion, name: string, tone: string) => (
    <td className={`border border-slate-200 p-2 text-center ${tone}`}>
      {editable ? (
        <label>
          <span className="sr-only">{name}</span>
          <input
            type="number"
            min={0}
            value={cm[key]}
            onChange={(e) => onChange({ ...cm, [key]: Math.max(0, Math.floor(Number(e.target.value) || 0)) })}
            className="w-20 rounded border border-slate-300 bg-white px-1 text-center font-mono"
          />
        </label>
      ) : (
        <span className="font-mono text-lg">{cm[key]}</span>
      )}
      <span className="block text-xs text-slate-500">{name}</span>
    </td>
  )
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr>
          <th />
          <th className="p-1 font-medium">Flagged as {params.positive.toLowerCase()}</th>
          <th className="p-1 font-medium">Not flagged</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th className="p-1 text-left font-medium">Really {params.positive.toLowerCase()}</th>
          {cell('tp', 'True positive', 'bg-green-50')}
          {cell('fn', 'False negative (missed)', 'bg-red-50')}
        </tr>
        <tr>
          <th className="p-1 text-left font-medium">Really {params.negative.toLowerCase()}</th>
          {cell('fp', 'False positive (false alarm)', 'bg-red-50')}
          {cell('tn', 'True negative', 'bg-green-50')}
        </tr>
      </tbody>
    </table>
  )
}

/** Precision and recall at every threshold, with the current one marked. */
function TradeOff({ bands, threshold }: { bands: readonly Band[]; threshold: number }) {
  const [w, h, pad, left] = [320, 160, 28, 40]
  const x = (t: number) => left + t * (w - left - pad)
  const y = (v: number) => h - pad + (pad * 2 - h) * v
  const points = THRESHOLDS.map((t) => ({ t, ...metrics(confusion(bands, t)) }))
  const line = (key: 'precision' | 'recall') =>
    points
      .filter((p) => !Number.isNaN(p[key]))
      .map((p) => `${x(p.t)},${y(p[key])}`)
      .join(' ')
  return (
    <figure>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-xl" role="img" aria-label="Precision rises and recall falls as the threshold goes up">
        <line x1={left} y1={h - pad} x2={w - pad} y2={h - pad} className="stroke-slate-400" />
        <line x1={left} y1={pad} x2={left} y2={h - pad} className="stroke-slate-400" />
        <line x1={x(threshold)} y1={pad} x2={x(threshold)} y2={h - pad} strokeDasharray="4 3" className="stroke-slate-500" />
        <polyline points={line('precision')} fill="none" strokeWidth={2.5} className="stroke-accent" />
        <polyline points={line('recall')} fill="none" strokeWidth={2.5} className="stroke-brand" />
        {[0, 0.5, 1].map((v) => (
          <text key={v} x={left - 4} y={y(v) + 4} textAnchor="end" fontSize={10} className="fill-slate-500">
            {v * 100}%
          </text>
        ))}
        {[0, 0.5, 1].map((t) => (
          <text key={t} x={x(t)} y={h - pad + 14} textAnchor="middle" fontSize={10} className="fill-slate-500">
            {t.toFixed(1)}
          </text>
        ))}
      </svg>
      <figcaption className="mt-1 flex flex-wrap gap-4 text-sm">
        <span>
          <span className="mr-1 inline-block h-1 w-4 bg-accent align-middle" />
          Precision
        </span>
        <span>
          <span className="mr-1 inline-block h-1 w-4 bg-brand align-middle" />
          Recall
        </span>
        <span className="text-slate-500">Threshold along the bottom; the dashed line is yours.</span>
      </figcaption>
    </figure>
  )
}
