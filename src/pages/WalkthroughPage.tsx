import { useEffect } from 'react'
import { Link, useParams } from 'react-router'
import { WALKTHROUGHS, WALKTHROUGH_BY_ID, type Walkthrough } from '../content/walkthroughs'
import { lessonComponents } from '../lessons/components'
import { resetWalkthrough, setWalkthroughStep, useProgress } from '../progress/store'

export default function WalkthroughPage() {
  const { walkthroughId } = useParams()
  if (!walkthroughId) return <WalkthroughList />
  const walkthrough = WALKTHROUGH_BY_ID.get(walkthroughId)
  if (!walkthrough) return <h1 className="text-2xl font-semibold">No walkthrough called “{walkthroughId}”</h1>
  return <WalkthroughView key={walkthroughId} walkthrough={walkthrough} />
}

function Optional() {
  return (
    <p className="rounded-lg border-l-4 border-accent bg-white p-4 text-sm">
      <strong>Optional.</strong> Walkthroughs run in your own AWS account and cost real money, even if only cents. Nothing here is needed
      for the exam, and they never count toward readiness. Use an IAM user or role, not the root user, and always do the teardown.
    </p>
  )
}

function WalkthroughList() {
  const { walkthroughs } = useProgress()
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Console walkthroughs</h1>
      <p className="text-slate-600">
        Step-by-step checklists for trying the services the exam talks about in the AWS console. Each one says what it costs, how to keep it
        cheap and how to delete everything afterwards.
      </p>
      <Optional />
      <ul className="grid gap-4 sm:grid-cols-2">
        {WALKTHROUGHS.map(({ meta }) => {
          const done = walkthroughs[meta.id]?.length ?? 0
          return (
            <li key={meta.id} className="flex flex-col rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Tasks {meta.tasks.join(', ')} · about {meta.minutes} min
              </p>
              <h2 className="mt-1 font-semibold">
                <Link to={`/explore/walkthroughs/${meta.id}`} className="text-brand-dark underline-offset-2 hover:underline">
                  {meta.title}
                </Link>
              </h2>
              <p className="mt-1 text-sm text-slate-600">{meta.summary}</p>
              <p className="mt-2 text-sm">
                <strong>Cost:</strong> {meta.cost}
              </p>
              {done > 0 && (
                <p className="mt-1 text-sm text-slate-500">
                  {done} of {meta.steps.length} steps done
                </p>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function WalkthroughView({ walkthrough: { meta, Content } }: { walkthrough: Walkthrough }) {
  const ticked = useProgress().walkthroughs[meta.id] ?? []
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  return (
    <article className="space-y-6">
      <Link to="/explore/walkthroughs" className="text-sm text-slate-600 hover:underline print:hidden">
        ← Console walkthroughs
      </Link>
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{meta.title}</h1>
        <p className="text-lg text-slate-700">{meta.summary}</p>
        <p className="text-sm text-slate-500">
          About {meta.minutes} minutes · console steps and prices checked on {meta.updated}. The console changes often, so labels may differ
          slightly.
        </p>
      </header>
      <Optional />
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-semibold">Estimated cost</h2>
          <p className="mt-1 text-sm">{meta.cost}</p>
          <h2 className="mt-3 font-semibold">Stay cheap</h2>
          <p className="mt-1 text-sm">{meta.stayCheap}</p>
        </div>
        <fieldset className="rounded-lg border border-slate-200 bg-white p-4">
          <legend className="px-1 font-semibold">
            Checklist ({ticked.length} of {meta.steps.length})
          </legend>
          <ol className="space-y-1 text-sm">
            {meta.steps.map((step, i) => (
              <li key={step}>
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={ticked.includes(i)}
                    onChange={(e) => setWalkthroughStep(meta.id, i, e.target.checked)}
                    className="mt-1"
                  />
                  <span className={ticked.includes(i) ? 'text-slate-500 line-through' : ''}>
                    {i + 1}. {step}
                  </span>
                </label>
              </li>
            ))}
          </ol>
          {ticked.length > 0 && (
            <button type="button" onClick={() => resetWalkthrough(meta.id)} className="mt-3 rounded border px-3 py-1 text-sm print:hidden">
              Clear the checklist
            </button>
          )}
        </fieldset>
      </section>
      <div className="prose max-w-none prose-a:text-brand-dark prose-code:before:content-none prose-code:after:content-none">
        <Content components={lessonComponents} />
      </div>
      <footer className="space-y-3 border-t border-slate-200 pt-4 text-sm">
        <div>
          <h2 className="font-semibold">Sources</h2>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {meta.links.map((link) => (
              <li key={link.url}>
                <a href={link.url} target="_blank" rel="noreferrer" className="text-brand-dark underline">
                  {link.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-semibold">Lessons</h2>
          <ul className="mt-1 flex flex-wrap gap-2">
            {meta.tasks.map((id) => (
              <li key={id}>
                <Link to={`/learn/${id}`} className="rounded border px-3 py-1">
                  Lesson {id}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </footer>
    </article>
  )
}
