import { useEffect, useRef, useState } from 'react'
import { TASK_BY_ID } from '../content/blueprint'
import { COUNT_WORDS, type ChoiceQuestion, type Item } from '../content/schema'
import { Inline } from '../components/Inline'
import { type ChoiceResponse, type Response, choiceCorrect } from './grade'
import { type ShortcutMap, useShortcuts } from './shortcuts'

const LETTERS = 'ABCDEF'

export const KIND_LABELS: Record<Item['kind'], string> = {
  single: 'Multiple choice',
  multi: 'Multiple response',
  order: 'Ordering',
  match: 'Matching',
  case: 'Case study',
}

interface Props {
  item: Item
  response: Response
  onChange: (response: Response) => void
  /** When true, inputs lock and the key, every rationale and the explanation are shown. */
  revealed?: boolean
  /** Select options with 1–6 or A–F. Only one ItemView on screen should enable this. */
  keyboard?: boolean
}

type Of<K extends Item['kind']> = Extract<Item, { kind: K }>

export function ItemView({ item, response, onChange, revealed = false, keyboard = false }: Props) {
  const task = TASK_BY_ID.get(item.taskId)!
  return (
    <article className="space-y-4" data-item-id={item.id}>
      <p className="text-xs uppercase tracking-wide text-slate-500">
        Task {task.id} · {task.title} · <span className="normal-case">{KIND_LABELS[item.kind]}</span>
      </p>
      {item.kind === 'case' ? (
        <CaseStudy item={item} response={response} onChange={onChange} revealed={revealed} />
      ) : (
        <>
          <p className="whitespace-pre-line text-lg leading-relaxed">
            <Inline text={item.stem} />
          </p>
          {item.kind === 'single' || item.kind === 'multi' ? (
            <Options
              question={item}
              name={item.id}
              response={response as ChoiceResponse}
              onChange={onChange}
              revealed={revealed}
              keyboard={keyboard}
            />
          ) : item.kind === 'order' ? (
            <Order item={item} response={response} onChange={onChange} revealed={revealed} />
          ) : (
            <Match item={item} response={response} onChange={onChange} revealed={revealed} />
          )}
          {revealed && <Explanation text={item.explanation} />}
        </>
      )}
    </article>
  )
}

function Explanation({ text }: { text: string }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="font-semibold">Explanation</h3>
      <p className="mt-1 whitespace-pre-line">
        <Inline text={text} />
      </p>
    </section>
  )
}

interface OptionsProps {
  question: ChoiceQuestion
  /** Groups the radio buttons; unique per question on screen. */
  name: string
  response: ChoiceResponse
  onChange: (response: ChoiceResponse) => void
  revealed: boolean
  keyboard?: boolean
}

function Options({ question, name, response, onChange, revealed, keyboard }: OptionsProps) {
  const multi = question.kind === 'multi'
  const selected = response.kind === 'multi' ? response.choices : response.choice !== null ? [response.choice] : []

  function toggle(i: number) {
    if (revealed) return
    if (!multi) return onChange({ kind: 'single', choice: i })
    if (selected.includes(i)) return onChange({ kind: 'multi', choices: selected.filter((s) => s !== i) })
    // Like the real exam, don't allow more selections than the question asks for.
    if (selected.length < question.select) onChange({ kind: 'multi', choices: [...selected, i] })
  }

  const keys: ShortcutMap = {}
  question.options.forEach((_, i) => {
    keys[String(i + 1)] = () => toggle(i)
    keys[LETTERS[i]!.toLowerCase()] = () => toggle(i)
  })
  useShortcuts(keys, !!keyboard && !revealed)

  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-sm font-medium text-slate-600">{multi ? `Select ${COUNT_WORDS[question.select]}.` : 'Select ONE.'}</legend>
      {question.options.map((option, i) => {
        const isSelected = selected.includes(i)
        const tone = !revealed
          ? isSelected
            ? 'border-brand bg-brand/5'
            : 'border-slate-200 bg-white hover:border-slate-400'
          : option.correct
            ? 'border-green-600 bg-green-50'
            : isSelected
              ? 'border-red-600 bg-red-50'
              : 'border-slate-200 bg-white opacity-80'
        return (
          <label key={i} className={`block cursor-pointer rounded-lg border-2 p-3 transition-colors ${tone}`}>
            <span className="flex gap-3">
              <input
                type={multi ? 'checkbox' : 'radio'}
                name={name}
                checked={isSelected}
                disabled={revealed}
                onChange={() => toggle(i)}
                className="mt-1 accent-brand"
              />
              <span className="font-semibold">{LETTERS[i]}.</span>
              <span>
                <Inline text={option.text} />
              </span>
            </span>
            {revealed && (
              <span className="mt-2 block pl-7 text-sm text-slate-700">
                <span className="font-semibold">{option.correct ? '✓ ' : '✗ '}</span>
                <Inline text={option.rationale} />
              </span>
            )}
          </label>
        )
      })}
    </fieldset>
  )
}

function CaseStudy({ item, response, onChange, revealed = false }: { item: Of<'case'> } & Omit<Props, 'item' | 'keyboard'>) {
  const parts = response.kind === 'case' ? response.parts : []
  const setPart = (n: number, r: ChoiceResponse) => onChange({ kind: 'case', parts: parts.map((p, i) => (i === n ? r : p)) })
  return (
    <div className="space-y-6">
      <section className="rounded-lg border-l-4 border-accent bg-white p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Scenario</h3>
        <p className="mt-1 whitespace-pre-line leading-relaxed">
          <Inline text={item.scenario} />
        </p>
      </section>
      {item.parts.map((part, n) => (
        <section key={n} className="space-y-3" aria-label={`Question ${n + 1} of ${item.parts.length}`}>
          <p className="text-lg leading-relaxed">
            <span className="mr-2 text-sm font-semibold text-slate-500">
              {n + 1}/{item.parts.length}
            </span>
            <Inline text={part.stem} />
          </p>
          <Options question={part} name={`${item.id}-${n}`} response={parts[n]!} onChange={(r) => setPart(n, r)} revealed={revealed} />
          {revealed && (
            <>
              <p className={`text-sm font-semibold ${choiceCorrect(part, parts[n]) ? 'text-green-600' : 'text-red-600'}`}>
                {choiceCorrect(part, parts[n]) ? '✓ Correct' : '✗ Not quite'}
              </p>
              <Explanation text={part.explanation} />
            </>
          )}
        </section>
      ))}
    </div>
  )
}

function Match({ item, response, onChange, revealed }: { item: Of<'match'> } & Omit<Props, 'item' | 'keyboard'>) {
  const picks = response.kind === 'match' ? response.picks : item.pairs.map(() => '')
  // Alphabetical, so the list order never gives away which response belongs to which prompt.
  const responses = [...item.pairs.map((p) => p.answer), ...(item.distractors ?? [])].sort((a, b) => a.localeCompare(b))
  const set = (n: number, value: string) => onChange({ kind: 'match', picks: picks.map((p, i) => (i === n ? value : p)) })
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-slate-600">
        Choose the matching response for each item.{item.distractors?.length ? ' Some responses are not used.' : ''}
      </p>
      <ul className="space-y-2">
        {item.pairs.map((pair, n) => {
          const right = picks[n] === pair.answer
          const tone = !revealed ? 'border-slate-200' : right ? 'border-green-600 bg-green-50' : 'border-red-600 bg-red-50'
          return (
            <li key={n} className={`rounded-lg border-2 bg-white p-3 ${tone}`}>
              <label className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  {revealed && <Verdict right={right} />}
                  <Inline text={pair.prompt} />
                </span>
                <select
                  aria-label={`Response for: ${pair.prompt}`}
                  value={picks[n]}
                  disabled={revealed}
                  onChange={(e) => set(n, e.target.value)}
                  className="w-full min-w-0 rounded border border-slate-300 bg-white px-2 py-2 text-sm sm:w-auto sm:max-w-xs sm:py-1"
                >
                  <option value="">Choose…</option>
                  {responses.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              {revealed && !right && (
                <p className="mt-2 text-sm">
                  <span className="font-semibold">Correct: </span>
                  <Inline text={pair.answer} />
                </p>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** A right/wrong mark that doesn't rely on the border colour alone. */
function Verdict({ right }: { right: boolean }) {
  return (
    <span className={`mr-1 font-semibold ${right ? 'text-green-700' : 'text-red-700'}`}>
      <span aria-hidden="true">{right ? '✓' : '✗'}</span>
      <span className="sr-only">{right ? 'Right: ' : 'Wrong: '}</span>
    </span>
  )
}

function Order({ item, response, onChange, revealed }: { item: Of<'order'> } & Omit<Props, 'item' | 'keyboard'>) {
  const order = response.kind === 'order' ? response.order : item.steps.map((_, i) => i)
  const [dragging, setDragging] = useState<number | null>(null)
  // Read out by screen readers after each move, since the list changes silently.
  const [announcement, setAnnouncement] = useState('')
  // After a button move, focus follows the moved step (to the same button, or the other one at an edge).
  const list = useRef<HTMLOListElement>(null)
  const [refocus, setRefocus] = useState<{ step: number; dir: 'up' | 'down' } | null>(null)
  useEffect(() => {
    if (!refocus || !list.current) return
    const row = list.current.querySelector(`[data-step="${refocus.step}"]`)
    const wanted = row?.querySelector<HTMLButtonElement>(`[data-dir="${refocus.dir}"]:not(:disabled)`)
    ;(wanted ?? row?.querySelector<HTMLButtonElement>('button:not(:disabled)'))?.focus()
    setRefocus(null)
  }, [refocus])
  const move = (from: number, to: number) => {
    if (revealed || to < 0 || to >= order.length || from === to) return
    const next = [...order]
    const [step] = next.splice(from, 1)
    next.splice(to, 0, step!)
    onChange({ kind: 'order', order: next })
    setAnnouncement(`${item.steps[step!]} moved to position ${to + 1} of ${order.length}.`)
    return step!
  }
  const nudge = (pos: number, dir: 'up' | 'down') => {
    const step = move(pos, dir === 'up' ? pos - 1 : pos + 1)
    if (step !== undefined) setRefocus({ step, dir })
  }
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-slate-600">Drag the steps into order, or use the arrow buttons.</p>
      <ol ref={list} className="space-y-1" aria-label="Steps in your order">
        {order.map((stepIndex, pos) => {
          const tone = !revealed ? 'cursor-grab border-slate-200 hover:border-slate-400' : stepIndex === pos ? 'border-green-600' : 'border-red-600'
          return (
            <li
              key={stepIndex}
              data-step={stepIndex}
              draggable={!revealed}
              onDragStart={() => setDragging(pos)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragging !== null) move(dragging, pos)
                setDragging(null)
              }}
              className={`flex items-center gap-2 rounded border-2 bg-white px-2 py-1 ${tone} ${dragging === pos ? 'opacity-50' : ''}`}
            >
              <span className="w-5 shrink-0 text-right text-xs text-slate-500" aria-hidden="true">
                {pos + 1}
              </span>
              <span className="min-w-0 flex-1 break-words">
                {revealed && <Verdict right={stepIndex === pos} />}
                <Inline text={item.steps[stepIndex]!} />
              </span>
              {!revealed && (
                <span className="flex shrink-0 gap-1">
                  {(['up', 'down'] as const).map((dir) => (
                    <button
                      key={dir}
                      type="button"
                      data-dir={dir}
                      aria-label={`Move step ${item.steps[stepIndex]} ${dir}`}
                      disabled={dir === 'up' ? pos === 0 : pos === order.length - 1}
                      onClick={() => nudge(pos, dir)}
                      className="h-10 w-10 rounded border disabled:opacity-30"
                    >
                      {dir === 'up' ? '↑' : '↓'}
                    </button>
                  ))}
                </span>
              )}
            </li>
          )
        })}
      </ol>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      {revealed && (
        <div className="space-y-1 text-sm">
          <p className="font-semibold">Correct order:</p>
          <ol className="list-decimal pl-6">
            {item.steps.map((s) => (
              <li key={s}>
                <Inline text={s} />
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
