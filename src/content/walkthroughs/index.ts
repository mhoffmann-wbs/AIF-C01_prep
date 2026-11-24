import type { MDXComponents } from 'mdx/types'
import type { ComponentType } from 'react'
import { type WalkthroughMeta, walkthroughMetaSchema } from '../schema'

// One MDX file per walkthrough: <id>.mdx, exporting `meta`.
interface WalkthroughModule {
  default: ComponentType<{ components?: MDXComponents }>
  meta: unknown
}

const modules = import.meta.glob<WalkthroughModule>('./*.mdx', { eager: true })

export interface Walkthrough {
  meta: WalkthroughMeta
  Content: WalkthroughModule['default']
}

/** The walkthroughs in the order the list shows them. */
export const WALKTHROUGH_ORDER = ['playground', 'comprehend', 'guardrails', 'knowledge-base', 'evaluation', 'iam'] as const

export const WALKTHROUGHS: Walkthrough[] = Object.values(modules)
  .map((mod) => ({ meta: walkthroughMetaSchema.parse(mod.meta), Content: mod.default }))
  .sort((a, b) => WALKTHROUGH_ORDER.indexOf(a.meta.id as never) - WALKTHROUGH_ORDER.indexOf(b.meta.id as never))

export const WALKTHROUGH_BY_ID = new Map(WALKTHROUGHS.map((w) => [w.meta.id, w]))

/** Every walkthrough body must contain these sections, in this order. */
export const REQUIRED_SECTIONS = ['## Before you start', '## Steps', '## What this shows for the exam', '## Teardown'] as const
