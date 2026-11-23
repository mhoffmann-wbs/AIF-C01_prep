# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Phases 0 (scaffold), 1 (quiz engine), 2 (lessons) and 3 (question bank) are done: tooling, Pages deploy, the blueprint, the service catalog, the item schema, the content tests and scripts, practice, the question bank browser, the mock exam, the progress store and page, all 14 lessons, and the full question bank (650 items, every task at target). Phase 4 (Explore I) is done: the service drills and flashcards. The concept simulators (phase 5) are next. **`PLAN.md` is the build plan and sets the order of work.** It records the decisions made, the blueprint → content map, the item kinds, the Explore pillar and the phases. As parts get built, describe them here (commands, file layout, gotchas), and mark phases done in `PLAN.md` §8 with the date.

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
- **Lessons** (`src/content/lessons/<taskId>.mdx`; `3.1.mdx` is the reference template):
  - Each file exports `meta`, validated by `lessonMetaSchema`: `taskId`, `updated` (the date its AWS facts were checked), `tldr`, `objectivesCovered` (all of the task's objective ids), and `links` to AWS pages that back the lesson's facts.
  - The body has these sections, in order: `## Big idea`, `## Key concepts` (at least one `###` per objective), `## At Cairnway`, `## AWS services` (a `<Services ids={['…']} />` list from the catalog) and `## Exam traps` (`<Callout title="…">` boxes).
  - `lessons.test.ts` enforces this. `Services`, `Callout` and router-aware links come from `src/lessons/components.tsx`.
  - MDX is compiled with `remark-gfm`, so tables work, but a bare `{` or `<` in prose breaks the build.
  - `/learn` lists tasks by domain. `/learn/:taskId` shows the lesson, the guide's objectives, the sources, Mark as read, practice links, and previous/next navigation.
- **Quiz engine** (`src/quiz/`):
  - `grade.ts`: a `Response` per kind. `gradeParts()` returns one result per scored question (one per case part, otherwise one). `grade()` is all-or-nothing over the parts, and practice stats and streaks use it. The mock score counts the parts. `isAnswered()` treats an ordering item as always answered, so the mock runner tracks "touched" itself. `answer.ts` `freshResponse()` starts ordering items scrambled.
  - `pools.ts`: `practicePool(bank, extended)` applies the extended-kinds toggle. `taskWeights()` splits each domain's weight among its tasks by objective count.
  - `sampler.ts`, with `seededRng(n)` from `random.ts` in tests:
    - `buildMockExam` fills each domain's quota of scored questions (13 · 16 · 18 · 9 · 9) and prefers unseen items. With the extended kinds on, about `MOCK_EXTENDED_QUESTIONS` (8) of the questions come from at most one case set plus ordering and matching items, spread by domain weight. Core items fill any slots the bank can't cover, and when the bank is short the time scales to the real pace.
    - `buildMixedSet` samples by task weight.
    - `buildFocusSet` and `orderLeastMastered` put the lowest streak first.
  - `results.ts` `scoreMock`: percent, the scaled estimate, pass at 700, and rows by domain and task.
  - `ItemView`: renders all five kinds. Options are never shuffled and are lettered A–F. Match responses are listed alphabetically, each with a labelled dropdown. Case parts are `region`s named "Question n of m". The `keyboard` prop binds 1–6 and A–F; enable it on one ItemView per screen, and not for case items, since their parts would share the keys. `revealed` shows the key, every rationale and the explanations.
  - `shortcuts.ts` and `ShortcutHint` handle keyboard shortcuts. `SessionReview` is the end-of-practice review, misses first. `ScoreTable` shows result rows.
- **Pages** (all lazy):
  - `/`: the blueprint.
  - `/practice`: `?task=3.2`, `?domain=3` or `?mix=25`, each optionally with `&focus=1` for least mastered, or `?weak=1`.
  - `/questions`: the bank browser, filtered by `?task=`/`?domain=`, `?kind=` and `?mastery=`. `/questions/:itemId` shows one item to answer, recorded like a practice answer.
  - `/mock`.
  - `/progress`: readiness by domain, the weakest tasks, both toggles, and export/import.
  - The extended-kinds toggles live in `components/ExtendedKindsToggle.tsx`.
- **Drills** (`/explore/drills`, `/explore/drills/:deckId`, `?misses=1` replays the learner's misses):
  - Decks are `src/content/drills/<deckId>.json`, validated by `drillDeckSchema`: `which` (a scenario, the answer service id and exactly 3 distractor service ids, optional `why`) or `sort` (2–4 `buckets`, items each with a `bucket` and a `why`). Card ids are `<deckId>-NN` in file order and are stored in progress, so append, never renumber.
  - `src/content/drills/index.ts` adds the generated `scope` sorter (every in- and out-of-scope catalog service, ids `scope-<serviceId>`).
  - `src/drills/round.ts` `buildRound()` samples 10 cards, shuffles the four choices, and alternates buckets in sorters so lopsided decks stay balanced.
  - Each deck's `tasks` puts a "Drill:" link on those lessons. `drills.test.ts` checks that services are in-scope catalog entries with a one-liner.
  - `/explore` is the hub; add each Explore tool to `TOOLS` in `ExplorePage.tsx` when it exists.
- **Flashcards** (`/explore/flashcards`, `/explore/flashcards/review?deck=|task=|all=1`, `/explore/flashcards/deck/:deckId`):
  - Built-in cards are `src/content/flashcards/<taskId>.json` (`cardSchema`: `id` `<taskId>-cNN` in file order, `objectiveId`, `front`, `back`). `flashcards.test.ts` requires at least 3 cards per objective, fronts of at most 30 words and backs of at most 70, and no repeated fronts. Don't write "What is Amazon X?" cards: `src/flashcards/decks.ts` generates the service deck (`svc-<serviceId>`) from the catalog's one-liners.
  - Decks: one per domain (`d1`…`d5`), `services`, and the learner's own decks. `schedule.ts` is Leitner boxes 0–5 (0/1/3/7/16/35 days), due cards first, then up to 10 new ones. `share.ts` exports and imports own decks as files (`app: 'aif-c01-prep'`, `kind: 'flashcards'`); review state is never shared.
  - Lessons link to "Flashcards for this task", which goes through all of the task's cards.
- **Progress** (`src/progress/store.ts`, key `aifc01:progress`, version 3; older versions are upgraded):
  - Per-item stats with a `streak` (consecutive correct answers, reset by a wrong one), mock results (with `scaled` and domain rows), `lessonsRead`, `drills` (per deck: rounds, best percent, longest run), `drillMisses` (card ids last answered wrongly), flashcard review state (`cards`), own `decks` and `myCards`, and the toggles `extendedInPractice` and `extendedInMock`, both on by default.
  - Components read it with `useProgress()`.
  - `readiness.ts`: task readiness (coverage × accuracy, weighted by task weight), the weak-spot drill and `masteryOf()`.
- **Tests**:
  - Tests run in Node. Component tests start with `// @vitest-environment jsdom`.
  - Vitest runs without globals, so `src/test/setup.ts` registers `cleanup` itself.
  - `src/test/fixtures.ts` has one valid item per kind.
  - `src/pages/pages.test.tsx` renders the real routes with `createMemoryRouter` and an async `renderAt()` that waits for the lazy page's `h1`, so every page needs an `h1` (a `sr-only` one is fine). These tests run over the real bank, so keep them independent of item order and pool size.

## Rules that span the codebase

- **Content is data.** Lessons, questions, flashcards, drills and walkthroughs are files under `src/content/`, validated with Zod and rendered generically. To add content, add data, not a component. The exception is the concept simulators, which are components, though their copy and parameters are data.
- **AWS facts are never written from memory.** Service capabilities, quotas, prices and model names change often, and the newer services (Amazon Quick, Kiro, Strands Agents, Bedrock AgentCore, AWS Transform, Nova) especially. Check them against AWS pages, cite the source, and run `npm run content:links` afterwards. Simulator prices are illustrative and labelled as such.
- Match items need pairs that can't be swapped: never pair two answers that describe the same thing, such as "Overfitting" and "High variance". Distractors are plausible concepts or services, never joke options.
- Write every question for this app. Never reproduce live exam content (candidates are under NDA) or third-party question dumps. Explanations say why the key fits the stated constraint and why each distractor misses it, without option letters.
- AWS has closed SageMaker Clarify, Model Monitor, Ground Truth and Augmented AI (A2I) to new customers. The guide's concepts still include them, so lessons and questions test what each is for, never whether you can sign up. Likewise, Amazon Bedrock Agents is now "Agents Classic", with no new sign-ups, and AgentCore and Strands Agents are the current answer for agents. Bedrock's current customization methods are supervised fine-tuning, reinforcement fine-tuning and distillation. Continued pre-training is taught only as a general concept.
- The app is static: no backend, no AWS calls, no credentials, no live model calls (simulator outputs are precomputed). Console walkthroughs run in the learner's own account, are optional, state their cost and end with teardown steps.
- `src/progress/store.ts` is the only module that touches `localStorage`. On an unknown version it discards stored data, so when the shape changes, bump `VERSION`, add a migration in `load()` and `importProgress()`, and keep the Zod `ProgressSchema` in step.
- Question ids are stored in progress, so never renumber or reuse an item id.

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
