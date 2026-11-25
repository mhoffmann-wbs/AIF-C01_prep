import { DOMAINS, EXAM_FORMAT, GUIDE, MOCK, allocateItems, tasksOf } from '../content/blueprint'

const PILLARS = [
  { title: 'Learn', text: 'One plain-language lesson per exam task, built around one online retailer adopting AI on AWS.' },
  { title: 'Check', text: 'Practice questions in the exam’s formats with full explanations, and a timed 65-question mock exam, plus spaced-review flashcards.' },
  { title: 'Explore', text: 'Concept simulators, “which service?” drills and optional walkthroughs in the AWS console.' },
]

export default function HomePage() {
  const mockItems = allocateItems()
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold">AWS Certified AI Practitioner (AIF-C01)</h1>
        <p className="text-lg text-slate-700">
          A free self-study course for the exam: {EXAM_FORMAT.items} questions in {EXAM_FORMAT.minutes} minutes, scored{' '}
          {EXAM_FORMAT.scaleMin}–{EXAM_FORMAT.scaleMax.toLocaleString('en')}, {EXAM_FORMAT.passScore} to pass. No coding and no AWS account
          needed.
        </p>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        {PILLARS.map((p) => (
          <div key={p.title} className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-brand-dark">{p.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{p.text}</p>
          </div>
        ))}
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">The exam blueprint</h2>
        <p className="text-sm text-slate-600">
          Weights are percent of scored content; question counts are this app’s {MOCK.items}-question mock exam.{' '}
          <a href={GUIDE.url} className="underline">
            Official exam guide v{GUIDE.version}
          </a>
        </p>
        {DOMAINS.map((d) => (
          <details key={d.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <summary className="flex cursor-pointer justify-between gap-4 font-semibold">
              <span>
                Domain {d.id}: {d.title}
              </span>
              <span className="shrink-0 font-normal text-slate-500">
                {d.weight}% · {mockItems.get(d.id)} questions
              </span>
            </summary>
            <ul className="mt-2 space-y-1 text-sm">
              {tasksOf(d.id).map((t) => (
                <li key={t.id}>
                  <span className="font-medium">Task {t.id}</span> {t.title}
                </li>
              ))}
            </ul>
          </details>
        ))}
      </section>
    </div>
  )
}
