import { useId, useState } from 'react'
import { Illustrative, Panel, Slider, Stat } from '../ui'
import { type FitParams, type Verdict, errorsByDegree, fit, verdict } from './model'

const VERDICTS: Record<Verdict, { label: string; text: string; tone: string }> = {
  underfitting: {
    label: 'Underfitting (high bias)',
    text: 'Too simple: the curve misses the real pattern, so it is wrong on the training points and on the new ones.',
    tone: 'border-amber-300 bg-amber-50',
  },
  good: {
    label: 'Good fit',
    text: 'The curve follows the real pattern without chasing every wobble, so it does well on points it never saw.',
    tone: 'border-green-600 bg-green-50',
  },
  overfitting: {
    label: 'Overfitting (high variance)',
    text: 'Too complex: the curve bends to pass close to every training point, noise included, and misses the new ones.',
    tone: 'border-red-600 bg-red-50',
  },
}

const COMPLEXITY = ['', 'a straight line', 'one bend', 'two bends', 'three bends']
const describe = (degree: number) => COMPLEXITY[degree] ?? `${degree - 1} bends`

export default function FitSim({ params }: { params: FitParams }) {
  const [degree, setDegree] = useState(params.start)
  const [other, setOther] = useState(false)
  const results = errorsByDegree(params)
  const current = results[degree - 1]!
  const v = VERDICTS[verdict(results, degree)]
  const f = fit(params.train, degree, params.xRange)
  const g = other ? fit(params.validation, degree, params.xRange) : undefined

  return (
    <div className="space-y-4">
      <Panel>
        <Slider
          label="Model complexity"
          value={degree}
          min={1}
          max={params.maxDegree}
          step={1}
          format={(d) => `${d} (${describe(d)})`}
          onChange={setDegree}
          hint="Each step lets the curve bend one more time."
        />
      </Panel>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Panel title="The model's curve">
          <DataPlot params={params} f={f} g={g} />
          <label className="mt-2 flex items-start gap-2 text-sm">
            <input type="checkbox" checked={other} onChange={(e) => setOther(e.target.checked)} className="mt-1 accent-brand" />
            <span>Also show the same model trained on the orange points instead (dashed). Simple models barely change; complex ones swing wildly: that is variance.</span>
          </label>
        </Panel>

        <div className="space-y-4">
          <div role="status" className={`rounded-lg border p-4 ${v.tone}`}>
            <p className="font-semibold">{v.label}</p>
            <p className="mt-1 text-sm">{v.text}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Training error" value={current.train.toFixed(0)} note="On the blue points it learned from" />
            <Stat label="Validation error" value={current.validation.toFixed(0)} note="On the orange points it never saw" />
          </div>
        </div>
      </div>

      <Panel title="Error at every complexity">
        <ErrorPlot results={results} degree={degree} />
      </Panel>

      <Illustrative>
        The sales figures are invented. Error here is the mean squared error: the average of the squared gaps between the curve and the points,
        so lower is better.
      </Illustrative>
    </div>
  )
}

const [W, H, PAD, LEFT] = [360, 220, 30, 40]

function DataPlot({ params, f, g }: { params: FitParams; f: (x: number) => number; g?: (x: number) => number }) {
  const clip = useId()
  const [x0, x1] = params.xRange
  const [y0, y1] = params.yRange
  const sx = (x: number) => LEFT + ((x - x0) / (x1 - x0)) * (W - LEFT - PAD)
  const sy = (y: number) => H - PAD - ((y - y0) / (y1 - y0)) * (H - 2 * PAD)
  const curve = (fn: (x: number) => number) =>
    Array.from({ length: 141 }, (_, i) => {
      const x = x0 + ((x1 - x0) * i) / 140
      // Keep wild values near the plot so the clipped line still leaves the frame.
      const y = Math.max(y0 - (y1 - y0), Math.min(y1 + (y1 - y0), fn(x)))
      return `${sx(x)},${sy(y)}`
    }).join(' ')
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${params.yLabel} against ${params.xLabel}, with the model's curve`}>
        <defs>
          <clipPath id={clip}>
            <rect x={LEFT} y={PAD} width={W - LEFT - PAD} height={H - 2 * PAD} />
          </clipPath>
        </defs>
        <line x1={LEFT} y1={H - PAD} x2={W - PAD} y2={H - PAD} className="stroke-slate-400" />
        <line x1={LEFT} y1={PAD} x2={LEFT} y2={H - PAD} className="stroke-slate-400" />
        {[y0, (y0 + y1) / 2, y1].map((y) => (
          <text key={y} x={LEFT - 4} y={sy(y) + 4} textAnchor="end" fontSize={10} className="fill-slate-500">
            {y}
          </text>
        ))}
        {[x0, Math.round((x0 + x1) / 2), x1].map((x) => (
          <text key={x} x={sx(x)} y={H - PAD + 14} textAnchor="middle" fontSize={10} className="fill-slate-500">
            {x}
          </text>
        ))}
        <text x={(LEFT + W - PAD) / 2} y={H - 2} textAnchor="middle" fontSize={10} className="fill-slate-500">
          {params.xLabel}
        </text>
        <g clipPath={`url(#${clip})`}>
          {g && <polyline points={curve(g)} fill="none" strokeWidth={2} strokeDasharray="5 4" className="stroke-accent" />}
          <polyline points={curve(f)} fill="none" strokeWidth={2.5} className="stroke-slate-700" />
        </g>
        {params.train.map((p) => (
          <circle key={`t${p.x}`} cx={sx(p.x)} cy={sy(p.y)} r={4} className="fill-brand" />
        ))}
        {params.validation.map((p) => (
          <rect key={`v${p.x}`} x={sx(p.x) - 3.5} y={sy(p.y) - 3.5} width={7} height={7} className="fill-accent" />
        ))}
      </svg>
      <figcaption className="mt-1 flex flex-wrap gap-4 text-sm">
        <span>
          <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-brand align-middle" />
          Training points
        </span>
        <span>
          <span className="mr-1 inline-block h-2.5 w-2.5 bg-accent align-middle" />
          Validation points
        </span>
        <span className="text-slate-500">{params.yLabel} per day</span>
      </figcaption>
    </figure>
  )
}

function ErrorPlot({ results, degree }: { results: ReturnType<typeof errorsByDegree>; degree: number }) {
  const cap = Math.min(...results.map((r) => r.validation)) * 4
  const n = results.length
  const sx = (d: number) => LEFT + ((d - 1) / (n - 1)) * (W - LEFT - PAD)
  const sy = (e: number) => H - PAD - (Math.min(e, cap) / cap) * (H - 2 * PAD)
  const line = (key: 'train' | 'validation') => results.map((r) => `${sx(r.degree)},${sy(r[key])}`).join(' ')
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-xl" role="img" aria-label="Training error falls as complexity rises; validation error falls, then rises">
        <line x1={LEFT} y1={H - PAD} x2={W - PAD} y2={H - PAD} className="stroke-slate-400" />
        <line x1={LEFT} y1={PAD} x2={LEFT} y2={H - PAD} className="stroke-slate-400" />
        <line x1={sx(degree)} y1={PAD} x2={sx(degree)} y2={H - PAD} strokeDasharray="4 3" className="stroke-slate-500" />
        <polyline points={line('train')} fill="none" strokeWidth={2.5} className="stroke-brand" />
        <polyline points={line('validation')} fill="none" strokeWidth={2.5} className="stroke-accent" />
        {results
          .filter((r) => r.validation > cap)
          .map((r) => (
            <text key={r.degree} x={sx(r.degree)} y={PAD - 6} textAnchor="middle" fontSize={10} className="fill-slate-500">
              ↑{r.validation.toFixed(0)}
            </text>
          ))}
        {results.map((r) => (
          <text key={r.degree} x={sx(r.degree)} y={H - PAD + 14} textAnchor="middle" fontSize={10} className="fill-slate-500">
            {r.degree}
          </text>
        ))}
        <text x={(LEFT + W - PAD) / 2} y={H - 2} textAnchor="middle" fontSize={10} className="fill-slate-500">
          Model complexity
        </text>
      </svg>
      <figcaption className="mt-1 flex flex-wrap gap-4 text-sm">
        <span>
          <span className="mr-1 inline-block h-1 w-4 bg-brand align-middle" />
          Training error
        </span>
        <span>
          <span className="mr-1 inline-block h-1 w-4 bg-accent align-middle" />
          Validation error
        </span>
        <span className="text-slate-500">Values off the top of the chart are written above it.</span>
      </figcaption>
    </figure>
  )
}
