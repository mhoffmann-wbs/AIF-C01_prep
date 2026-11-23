import { useState } from 'react'
import { Bar, Choice, Illustrative, Panel, Slider, pct } from '../ui'
import { type SamplerParams, type Settings, reshape, sample } from './model'

/** Temperature 1 with nothing cut off: the model's own chances. */
const neutral = (tokens: readonly unknown[]): Settings => ({ temperature: 1, topK: tokens.length, topP: 1 })

export default function SamplerSim({ params }: { params: SamplerParams }) {
  const [scenarioId, setScenarioId] = useState(params.scenarios[0]!.id)
  const scenario = params.scenarios.find((s) => s.id === scenarioId)!
  const [settings, setSettings] = useState(() => neutral(scenario.tokens))
  const [completions, setCompletions] = useState<string[]>([])
  const shaped = reshape(scenario.tokens, settings)

  function change(next: Partial<Settings>) {
    setSettings((s) => ({ ...s, ...next }))
    setCompletions([])
  }

  function pickScenario(id: string) {
    const next = params.scenarios.find((s) => s.id === id)!
    setScenarioId(id)
    setSettings(neutral(next.tokens))
    setCompletions([])
  }

  function generate() {
    setCompletions(Array.from({ length: params.samples }, () => shaped[sample(shaped)]!.text))
  }

  const distinct = new Set(completions).size
  return (
    <div className="space-y-4">
      <Choice label="Use case" value={scenarioId} options={params.scenarios.map((s) => ({ id: s.id, label: s.label }))} onChange={pickScenario} />

      <Panel>
        <p className="text-lg">
          {scenario.prompt} <span className="rounded bg-slate-100 px-2 font-mono">___</span>
        </p>
        <p className="mt-1 text-sm text-slate-600">{scenario.goal}</p>
      </Panel>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Panel title="Inference parameters">
          <div className="space-y-4">
            <Slider
              label="Temperature"
              value={settings.temperature}
              min={0}
              max={2}
              step={0.1}
              format={(v) => v.toFixed(1)}
              onChange={(temperature) => change({ temperature })}
              hint="Low: the likeliest word almost always wins. High: unlikely words get a real chance."
            />
            <Slider
              label="Top K"
              value={settings.topK}
              min={1}
              max={scenario.tokens.length}
              step={1}
              onChange={(topK) => change({ topK })}
              hint="Only the K likeliest words can be picked."
            />
            <Slider
              label="Top P"
              value={settings.topP}
              min={0.05}
              max={1}
              step={0.05}
              format={(v) => v.toFixed(2)}
              onChange={(topP) => change({ topP })}
              hint="Only the likeliest words whose probabilities add up to P can be picked."
            />
            <button type="button" onClick={() => pickScenario(scenarioId)} className="rounded border px-3 py-1 text-sm">
              Reset
            </button>
          </div>
        </Panel>

        <Panel title="Chance of each next word">
          <div className="space-y-1" role="list" aria-label="Next-word probabilities">
            {shaped.map((s) => (
              <div role="listitem" key={s.text}>
                <Bar label={s.text} fraction={s.p} text={s.kept ? pct(s.p) : 'cut'} muted={!s.kept} />
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Grey words are cut off by top K or top P. At temperature 1 with nothing cut, the chances are the model's own.
          </p>
        </Panel>
      </div>

      <Panel title="Generate">
        <button type="button" onClick={generate} className="rounded bg-brand px-4 py-2 font-medium text-chalk">
          Generate {params.samples} completions
        </button>
        {completions.length > 0 && (
          <div className="mt-3 space-y-2">
            <ol className="flex flex-wrap gap-2" aria-label="Completions">
              {completions.map((c, i) => (
                <li key={i} className="rounded border border-slate-200 px-2 py-1 font-mono text-sm">
                  {c}
                </li>
              ))}
            </ol>
            <p role="status" className="text-sm">
              {distinct === 1
                ? `The same word all ${completions.length} times: predictable output.`
                : `${distinct} different words in ${completions.length} tries: the same prompt gives different answers.`}
            </p>
          </div>
        )}
      </Panel>

      <Illustrative>
        The words and their chances are made up for this toy. A real model chooses among tens of thousands of tokens, and each model sets its own
        parameter ranges and defaults.
      </Illustrative>
    </div>
  )
}
