import { useEffect } from 'react'
import { Link, useParams } from 'react-router'
import { Inline } from '../components/Inline'
import { DOMAINS, DOMAIN_BY_ID, TASKS, TASK_BY_ID, tasksOf } from '../content/blueprint'
import { ITEMS } from '../content/bank'
import { DRILL_DECKS } from '../content/drills'
import { CARDS } from '../content/flashcards'
import { SIMS, simTasks } from '../content/sims'
import { LESSONS } from '../content/lessons'
import { WALKTHROUGHS } from '../content/walkthroughs'
import { lessonComponents } from '../lessons/components'
import { setLessonRead, useProgress } from '../progress/store'

export default function LearnPage() {
  const { taskId } = useParams()
  return taskId ? <LessonView key={taskId} taskId={taskId} /> : <LessonIndex />
}

function LessonIndex() {
  const { lessonsRead } = useProgress()
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Learn</h1>
      <p className="text-slate-600">
        One lesson per exam task: the big idea in plain words, the key concepts, how Cairnway Outfitters uses them, the AWS services
        involved, and the traps the exam likes to set. {lessonsRead.length} of {LESSONS.size} marked as read.
      </p>
      {DOMAINS.map((d) => (
        <section key={d.id} className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-semibold">
            Domain {d.id}: {d.title} <span className="font-normal text-slate-500">({d.weight}%)</span>
          </h2>
          <ul className="mt-2 space-y-1">
            {tasksOf(d.id).map((t) => (
              <li key={t.id} className="flex items-baseline gap-2 text-sm">
                <span className="w-4 shrink-0">{lessonsRead.includes(t.id) ? '✓' : ''}</span>
                {LESSONS.has(t.id) ? (
                  <Link to={`/learn/${t.id}`} className="text-brand-dark hover:underline">
                    {t.id} {t.title}
                  </Link>
                ) : (
                  <span className="text-slate-400">
                    {t.id} {t.title} (coming soon)
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function LessonView({ taskId }: { taskId: string }) {
  const { lessonsRead } = useProgress()
  const task = TASK_BY_ID.get(taskId)
  const lesson = LESSONS.get(taskId)
  // The topic links sit at the bottom of the page, so start each lesson at the top
  // (the view is keyed by task, so this runs once per lesson).
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  if (!task) {
    return (
      <p>
        No such task.{' '}
        <Link to="/learn" className="underline">
          Back to Learn
        </Link>
      </p>
    )
  }
  const domain = DOMAIN_BY_ID.get(task.domainId)!
  const read = lessonsRead.includes(taskId)
  const practiceCount = ITEMS.filter((i) => i.taskId === taskId).length

  return (
    <article className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm text-slate-500">
          <Link to="/learn" className="hover:underline">
            Learn
          </Link>{' '}
          / Domain {domain.id}: {domain.title}
        </p>
        <h1 className="text-3xl font-bold">
          {task.id} {task.title}
        </h1>
        {lesson && <p className="text-sm text-slate-600">AWS facts checked on {lesson.meta.updated}</p>}
      </header>

      {lesson ? (
        <>
          <p className="rounded-lg border-l-4 border-brand bg-white p-4">
            <strong>In short:</strong> <Inline text={lesson.meta.tldr} />
          </p>
          <div className="prose max-w-none prose-a:text-brand-dark prose-code:before:content-none prose-code:after:content-none">
            <lesson.Content components={lessonComponents} />
          </div>
        </>
      ) : (
        <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">The lesson for this task is coming soon.</p>
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-semibold">What the exam guide covers</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
            {task.objectives.map((o) => (
              <li key={o.id}>{o.text}</li>
            ))}
          </ol>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-semibold">Sources and further reading</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {lesson?.meta.links.map((link) => (
              <li key={link.url}>
                <a href={link.url} target="_blank" rel="noreferrer" className="text-brand-dark underline">
                  {link.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="flex flex-wrap items-center gap-3">
        {lesson && (
          <button
            onClick={() => setLessonRead(taskId, !read)}
            className={`rounded px-4 py-2 font-medium ${read ? 'border border-brand text-brand-dark' : 'bg-brand text-chalk'}`}
          >
            {read ? '✓ Marked as read' : 'Mark as read'}
          </button>
        )}
        {practiceCount > 0 && (
          <Link to={`/practice?task=${taskId}`} className="rounded border px-4 py-2">
            Practise this task ({practiceCount})
          </Link>
        )}
        {practiceCount > 0 && (
          <Link to={`/questions?task=${taskId}`} className="rounded border px-4 py-2">
            Browse its questions
          </Link>
        )}
        {CARDS.some((c) => c.id.startsWith(`${taskId}-`)) && (
          <Link to={`/flashcards/review?task=${taskId}`} className="rounded border px-4 py-2">
            Flashcards for this task
          </Link>
        )}
        {SIMS.filter((s) => simTasks(s).includes(taskId)).map((s) => (
          <Link key={s.id} to={`/explore/sims/${s.id}`} className="rounded border px-4 py-2">
            Simulator: {s.title}
          </Link>
        ))}
        {DRILL_DECKS.filter((d) => d.tasks.includes(taskId)).map((d) => (
          <Link key={d.id} to={`/explore/drills/${d.id}`} className="rounded border px-4 py-2">
            Drill: {d.title}
          </Link>
        ))}
        {WALKTHROUGHS.filter((w) => w.meta.tasks.includes(taskId)).map(({ meta }) => (
          <Link key={meta.id} to={`/explore/walkthroughs/${meta.id}`} className="rounded border px-4 py-2">
            Walkthrough: {meta.title}
          </Link>
        ))}
      </footer>

      <LessonNav taskId={taskId} />
    </article>
  )
}

/** Previous and next lesson in blueprint order, skipping tasks without a lesson yet. */
function LessonNav({ taskId }: { taskId: string }) {
  const order = TASKS.map((t) => t.id).filter((id) => LESSONS.has(id) || id === taskId)
  const index = order.indexOf(taskId)
  const prev = order[index - 1]
  const next = order[index + 1]
  const card = (id: string, label: string, align: string) => (
    <Link to={`/learn/${id}`} className={`flex-1 rounded-lg border border-slate-200 bg-white p-4 hover:border-brand ${align}`}>
      <span className="block text-xs text-slate-500">{label}</span>
      <span className="font-medium text-brand-dark">
        {id} {TASK_BY_ID.get(id)!.title}
      </span>
    </Link>
  )
  return (
    <nav aria-label="Lesson navigation" className="flex gap-3 border-t border-slate-200 pt-6">
      {prev && card(prev, '← Previous task', '')}
      {next && card(next, 'Next task →', 'ml-auto text-right')}
    </nav>
  )
}
