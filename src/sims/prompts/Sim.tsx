import { useId, useState } from 'react'
import { Choice, Illustrative, Panel } from '../ui'
import { type PromptsParams, attackOutcome, correctParts } from './model'

export default function PromptsSim({ params }: { params: PromptsParams }) {
  return (
    <div className="space-y-6">
      <PartsQuiz parts={params.parts} />
      <Techniques tasks={params.tasks} />
      <Attacks attacks={params.attacks} blockedMessage={params.blockedMessage} />
      <Illustrative>Every model output here was written in advance to show typical behaviour. A real model can answer differently.</Illustrative>
    </div>
  )
}

function PartsQuiz({ parts }: { parts: PromptsParams['parts'] }) {
  const [labels, setLabels] = useState<(string | undefined)[]>([])
  const [checked, setChecked] = useState(false)
  const id = useId()
  const right = new Set(correctParts(parts.segments, labels))
  const typeLabel = (t: string) => parts.types.find((x) => x.id === t)!.label

  return (
    <Panel title="1. Label the parts of Trailmate's prompt">
      <ol className="space-y-3">
        {parts.segments.map((s, i) => (
          <li key={s.text} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-center">
            <p id={`${id}-${i}`} className="rounded bg-slate-100 px-3 py-2 font-mono text-sm">
              {s.text}
            </p>
            <div>
              <select
                aria-labelledby={`${id}-${i}`}
                value={labels[i] ?? ''}
                disabled={checked}
                onChange={(e) => setLabels((l) => Object.assign([...l], { [i]: e.target.value || undefined }))}
                className="w-full rounded border border-slate-300 bg-white px-2 py-1"
              >
                <option value="">Choose a part…</option>
                {parts.types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
              {checked && (
                <p className={`text-sm ${right.has(i) ? 'text-green-600' : 'text-red-600'}`}>
                  {right.has(i) ? '✓' : `✗ ${typeLabel(s.type)}`}: {parts.types.find((t) => t.id === s.type)!.hint.toLowerCase()}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-3 flex items-center gap-3">
        {checked ? (
          <>
            <p role="status" className="font-semibold">
              {right.size} of {parts.segments.length} right
            </p>
            <button
              type="button"
              onClick={() => {
                setLabels([])
                setChecked(false)
              }}
              className="rounded border px-3 py-1 text-sm"
            >
              Try again
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={labels.filter(Boolean).length < parts.segments.length}
            onClick={() => setChecked(true)}
            className="rounded bg-brand px-4 py-2 font-medium text-chalk disabled:opacity-40"
          >
            Check labels
          </button>
        )}
      </div>
    </Panel>
  )
}

function Techniques({ tasks }: { tasks: PromptsParams['tasks'] }) {
  const [taskId, setTaskId] = useState(tasks[0]!.id)
  const task = tasks.find((t) => t.id === taskId)!
  const [techId, setTechId] = useState(task.techniques[0]!.id)
  const tech = task.techniques.find((t) => t.id === techId) ?? task.techniques[0]!

  return (
    <Panel title="2. Compare techniques">
      <div className="space-y-3">
        <Choice
          label="Task"
          value={taskId}
          options={tasks.map((t) => ({ id: t.id, label: t.label }))}
          onChange={(id) => {
            setTaskId(id)
            setTechId(tasks.find((t) => t.id === id)!.techniques[0]!.id)
          }}
        />
        <p className="text-sm text-slate-600">{task.task}</p>
        <Choice label="Technique" value={tech.id} options={task.techniques.map((t) => ({ id: t.id, label: t.name }))} onChange={setTechId} />
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Prompt</p>
            <pre className="mt-1 whitespace-pre-wrap rounded bg-code p-3 font-mono text-sm text-chalk">{tech.prompt}</pre>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Model output</p>
            <p className={`mt-1 rounded border p-3 ${tech.good ? 'border-green-600 bg-green-50' : 'border-red-600 bg-red-50'}`}>{tech.output}</p>
            <p className="mt-2 text-sm">{tech.note}</p>
          </div>
        </div>
      </div>
    </Panel>
  )
}

function Attacks({ attacks, blockedMessage }: { attacks: PromptsParams['attacks']; blockedMessage: string }) {
  const [filterOn, setFilterOn] = useState(false)
  return (
    <Panel title="3. Prompt attacks">
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={filterOn} onChange={(e) => setFilterOn(e.target.checked)} className="accent-brand" />
        <span className="font-medium">Amazon Bedrock Guardrails prompt attack filter on the user's input</span>
      </label>
      <ul className="mt-4 grid gap-4 md:grid-cols-2">
        {attacks.map((a) => {
          const out = attackOutcome(a, filterOn, blockedMessage)
          return (
            <li key={a.id} className="rounded-lg border border-slate-200 p-3 text-sm">
              <p className="font-semibold">{a.risk}</p>
              <p className="text-slate-600">{a.what}</p>
              {a.hidden && <p className="mt-2 rounded bg-amber-50 px-2 py-1">{a.hidden}</p>}
              <p className="mt-2">
                <span className="text-xs uppercase tracking-wide text-slate-500">User</span> {a.user}
              </p>
              <p className={`mt-2 rounded border px-2 py-1 ${out.blocked ? 'border-green-600 bg-green-50' : 'border-red-600 bg-red-50'}`}>
                <span className="text-xs uppercase tracking-wide text-slate-500">Trailmate</span> {out.reply}
              </p>
              {filterOn && <p className="mt-2">{a.defense}</p>}
            </li>
          )
        })}
      </ul>
      {!filterOn && <p className="mt-3 text-sm text-slate-600">Every attack gets through. Switch the filter on to see which ones it stops, and why one still gets through.</p>}
    </Panel>
  )
}
