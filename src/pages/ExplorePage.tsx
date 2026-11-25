import { Link } from 'react-router'

// One entry per Explore tool, added as each gets built (PLAN.md §6).
const TOOLS = [
  {
    to: '/explore/sims',
    title: 'Concept simulators',
    text: 'Move sliders to see how temperature, thresholds, model complexity, token prices, retrieval and guardrails change the outcome, then answer a few questions.',
  },
  {
    to: '/explore/drills',
    title: 'Service drills',
    text: 'Quick rounds that match Cairnway tasks to AWS services, and sorters for shared responsibility, learning types, customization and exam scope.',
  },
  {
    to: '/explore/walkthroughs',
    title: 'Console walkthroughs',
    text: 'Optional checklists for trying Bedrock, Guardrails, Knowledge Bases, Comprehend and IAM in your own AWS account, with costs and teardown steps.',
  },
]

export default function ExplorePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Explore</h1>
      <p className="text-slate-600">
        The exam has no coding, so instead of a lab you get tools that make the concepts stick. Only the optional console walkthroughs need an AWS account.
      </p>
      <ul className="grid gap-4 sm:grid-cols-2">
        {TOOLS.map((t) => (
          <li key={t.to} className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="font-semibold">
              <Link to={t.to} className="text-brand-dark underline-offset-2 hover:underline">
                {t.title}
              </Link>
            </h2>
            <p className="mt-1 text-sm text-slate-600">{t.text}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
