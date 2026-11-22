# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Phase 0 (scaffold) is done: tooling, Pages deploy, the blueprint, the service catalog, the item schema, the content tests and scripts, and a home page that shows the blueprint. The question bank, lessons, quiz engine, progress store and Explore pillar don't exist yet. **`PLAN.md` is the build plan and sets the order of work.** It records the decisions made, the blueprint → content map, the item kinds, the Explore pillar and the phases. As parts get built, describe them here (commands, file layout, gotchas), and mark phases done in `PLAN.md` §8 with the date.

## Purpose

**AIF-C01_prep** is a self-study web app for the **AWS Certified AI Practitioner (AIF-C01)** exam, written in English for non-technical learners. It has three pillars:
- **Learn**: one lesson per task statement (14).
- **Check**: practice, the question bank and a mock exam of 65 items in 90 minutes, all scored.
- **Explore**: concept simulators, service-matcher drills, flashcards and optional AWS console walkthroughs. These replace a coding lab, because the exam has no coding.

Every scenario uses one invented company, **Cairnway Outfitters**, an online outdoor-gear retailer.

## Authoritative sources

- Exam guide v1.2 (2026-10-29), with the URLs in `GUIDE` in `blueprint.ts`. It is the single source of truth for domains, weights, tasks, objectives and services. When it changes, update `src/content/blueprint.ts` and `services.ts` first. The content tests then show what has to follow. AWS publishes guide changes about a month before the exam changes, so check the revisions page before each content phase.
- Certification page: duration (90 min), 65 questions, and the Skill Builder prep plan. It doesn't list question formats.
- The footer and README say "Not affiliated with or endorsed by Amazon Web Services."

## Architecture

- **Stack**: Vite 8, React 19, TypeScript 7, Tailwind v4, React Router 8 (imported from `react-router`), Zod 4, MDX (`@mdx-js/rollup` with `remark-gfm`; wired up but not used yet), Vitest 5 with RTL, and oxlint. The app is a static SPA.
- **Deploy**: `.github/workflows/deploy.yml` lints, tests, builds with `BASE_PATH=/AIF-C01_prep/`, copies `index.html` to `404.html` for deep links, and publishes to GitHub Pages on every push to `main`. The router takes `basename={import.meta.env.BASE_URL}`, so use router `Link`s and never root-relative `<a href="/…">`.
- **Pages** are lazy-loaded in `src/app/routes.tsx`. Keep content imports out of `routes.tsx`, `Layout.tsx` and `main.tsx`. Add a pillar's nav entry to `NAV` in `Layout.tsx` when its pages exist.
- **Theme**: colour tokens (`brand`, `brand-dark`, `accent`, `chalk`, `page`, `header`, `code`) are set in `src/index.css` via `@theme`. Dark mode follows the OS by remapping the tokens and the slate scale once, so components don't use `dark:` variants.
- **`src/content/blueprint.ts`**:
  - The verbatim domains, 14 tasks and 69 objectives. Objective ids are `<taskId>.<n>` in guide order.
  - `EXAM_FORMAT`, `MOCK` and `OUT_OF_SCOPE_TASKS`.
  - `largestRemainder`, `allocateItems()` (mock: 13 · 16 · 18 · 9 · 9), `questionTarget()` (650 split by domain weight, then by objective count) and `estimateScaledScore()` (a linear estimate on 100–1,000; always label it an estimate).
- **`src/content/services.ts`**:
  - Every in-scope service (51) and out-of-scope service (93) from the guide, with a stable `id`. In-scope entries carry a `oneLiner` and a `url`.
  - Features the objectives name but the service list doesn't (Bedrock Guardrails, Knowledge Bases, Model Evaluation, Prompt Management, SageMaker Model Cards, PrivateLink) carry `featureOf`, and are left out of `IN_SCOPE_SERVICES` so the in/out-of-scope sorter stays faithful to the guide.
  - Questions tag services by `id`.
- **`src/content/schema.ts`**: a Zod union of five item kinds:

  | Kind | Shape |
  |---|---|
  | `single` | 4 options |
  | `multi` | 5–6 options; the stem must contain "(Select TWO.)" etc. |
  | `order` | `steps` in the correct order |
  | `match` | `pairs` plus optional `distractors` |
  | `case` | a `scenario` with 2–4 `single`/`multi` `parts`, each scored separately |

  - Ids are `<taskId>-NNN`.
  - Every question part has `objectives[]`. Items may have `services[]` and `sourceLinks[]`.
  - `isExtended`: `order`, `match` and `case` sit behind the learner's toggles.
  - Other helpers: `itemObjectives()` and `scoredCount()`.
- **Questions**: `src/content/questions/<taskId>.json`, one array per task, loaded through `import.meta.glob` in `bank.ts`. Cross-checks against the blueprint and the catalog are in `bank.test.ts`: the file matches the task, ids are unique, objectives belong to the item's task, service ids exist, and the bank passes the quality checks.
- **`src/content/quality.ts`**: the anti-giveaway checks. They include case parts:
  - no key letter in more than 40% of single-select questions
  - the key is the longest option at most 40% of the time
  - no duplicate stems or scenarios
  - no option letters in explanations or rationales, so options can be reordered
- **Tests**:
  - Tests run in Node. Component tests start with `// @vitest-environment jsdom`.
  - Vitest runs without globals, so `src/test/setup.ts` registers `cleanup` itself.
  - `src/test/fixtures.ts` has one valid item per kind.
  - `src/pages/pages.test.tsx` renders the real routes with `createMemoryRouter` and an async `renderAt()` that waits for the lazy page.

## Rules that span the codebase

- **Content is data.** Lessons, questions, flashcards, drills and walkthroughs are files under `src/content/`, validated with Zod and rendered generically. To add content, add data, not a component. The exception is the concept simulators, which are components, though their copy and parameters are data.
- **AWS facts are never written from memory.** Service capabilities, quotas, prices and model names change often, and the newer services (Amazon Quick, Kiro, Strands Agents, Bedrock AgentCore, AWS Transform, Nova) especially. Check them against AWS pages, cite the source, and run `npm run content:links` afterwards. Simulator prices are illustrative and labelled as such.
- Write every question for this app. Never reproduce live exam content (candidates are under NDA) or third-party question dumps. Explanations say why the key fits the stated constraint and why each distractor misses it, without option letters.
- The app is static: no backend, no AWS calls, no credentials, no live model calls (simulator outputs are precomputed). Console walkthroughs run in the learner's own account, are optional, state their cost and end with teardown steps.
- `src/progress/store.ts` (phase 1) is meant to be the only module that touches `localStorage`. It is versioned: bump `VERSION`, add a migration and keep the Zod `ProgressSchema` in step when the shape changes.

## Commands

```bash
npm run dev               # Vite dev server
npm run build             # tsc -b + production build (BASE_PATH=/AIF-C01_prep/ for Pages)
npm run lint              # oxlint
npm run typecheck         # tsc -b
npm test                  # Vitest, run once; npm run test:watch for watch mode
npx vitest run src/content/schema.test.ts   # single file
npx vitest run -t "allocates"               # single test by name
npm run content:status    # items per task vs. target, objectives below 5 items, kind mix
npm run content:quality [-- <file.json> ...]  # anti-giveaway checks, whole bank or given files
npm run content:links     # fetch every cited URL (needs network; not part of npm test)
```

The scripts run TypeScript directly with Node, so imports in `scripts/` use `.ts` extensions. Vitest caches `import.meta.glob` results: if a new question file doesn't show up in tests, run `npx vitest --clearCache`.
