import type { MDXComponents } from 'mdx/types'
import type { ComponentProps } from 'react'
import { Link } from 'react-router'
import { SERVICE_BY_ID } from '../content/services'

/** Catalog cards for the AWS services a lesson covers: name, one-liner and link. */
export function Services({ ids }: { ids: string[] }) {
  return (
    <ul className="not-prose my-4 grid gap-3 sm:grid-cols-2">
      {ids.map((id) => {
        const s = SERVICE_BY_ID.get(id)
        if (!s) throw new Error(`Unknown service id "${id}"`)
        return (
          <li key={id} className="rounded-lg border border-slate-200 bg-white p-3">
            <a href={s.url} target="_blank" rel="noreferrer" className="font-semibold text-brand-dark hover:underline">
              {s.name}
            </a>
            <p className="mt-1 text-sm text-slate-600">{s.oneLiner}</p>
          </li>
        )
      })}
    </ul>
  )
}

/** A highlighted box for an exam trap or a key takeaway. */
export function Callout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <aside className="not-prose my-4 rounded-lg border-l-4 border-accent bg-white p-4">
      <p className="font-semibold">{title}</p>
      <div className="mt-1 space-y-2 text-slate-700">{children}</div>
    </aside>
  )
}

/** Links starting with / go through the router (so the Pages base path applies); others open in a new tab. */
function A({ href = '', ...props }: ComponentProps<'a'>) {
  if (href.startsWith('/')) return <Link to={href} {...props} />
  return <a href={href} target="_blank" rel="noreferrer" {...props} />
}

export const lessonComponents: MDXComponents = { Services, Callout, a: A }
