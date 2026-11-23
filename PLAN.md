# Build Plan — AIF-C01_prep

An interactive, self-study web app for the **AWS Certified AI Practitioner (AIF-C01)** exam.
The footer and README say: "Not affiliated with or endorsed by Amazon Web Services. AWS and AWS Certified are trademarks of Amazon.com, Inc. or its affiliates."

Authoritative sources (where they disagree with this plan, they win):
- Exam guide (HTML, v1.2, 2026-10-29): https://docs.aws.amazon.com/aws-certification/latest/ai-practitioner-01/ai-practitioner-01.html, with one subpage per domain, the in-scope and out-of-scope service lists, and the revision history (`aif-01-revisions.html`).
- Exam guide (PDF): https://docs.aws.amazon.com/pdfs/aws-certification/latest/ai-practitioner-01/ai-practitioner-01.pdf
- Certification page (duration, price, official prep links): https://aws.amazon.com/certification/certified-ai-practitioner/

AWS publishes guide updates "approximately one month before updates will be reflected on your exam". Recheck the revision history before every content phase.

---

## 1. Decisions so far

| Topic | Decision |
|---|---|
| Name | **AIF-C01_prep**: `github.com/mhoffmann-wbs/AIF-C01_prep` → `https://mhoffmann-wbs.github.io/AIF-C01_prep/` |
| Audience | English-speaking, **non-technical** learners: business and product people, career changers, bootcamp students with little AWS or ML background. Lessons explain everything from scratch. |
| Theme | One invented company, **Cairnway Outfitters**, an online outdoor-gear retailer adopting AI on AWS. All scenarios, simulators and walkthroughs use it: recommendations, product-description generation, a support chatbot and agent, review sentiment, invoice OCR, fraud, demand forecasting, PII and compliance. Every person, product and figure is invented. |
| Pillars | **Learn** (lessons), **Check** (practice, question bank, mock exam) and **Explore**, which replaces a coding lab or playground with: concept simulators, service-matcher drills, flashcards and optional console walkthroughs (§6). |
| Granularity | One lesson per **task statement** (14). Questions carry a task id and the objective bullet(s) they test, so coverage is checked per bullet. |
| Item kinds | All five kinds are built: multiple choice and multiple response are the core (~80%), and ordering, matching and case study (~20%) sit behind a learner toggle (§3). |
| Bank size | About **650 items** (§4). |
| Mock exam | 65 items in 90 minutes, **all scored** (the real exam has 50 scored and 15 unscored). The report shows a scaled-score estimate against 700. |
| Stack | Vite + React + TypeScript + Tailwind v4 + React Router + Zod + MDX + Vitest/RTL + oxlint. A static SPA with no backend: progress lives in `localStorage` and can be exported and imported. |
| AWS account | Never needed. The console walkthroughs are optional and never count toward readiness. The app never calls AWS and never stores credentials. |

## 2. Exam facts the app must mirror

| Fact | Value | App consequence |
|---|---|---|
| Items | 65 (50 scored + 15 unscored, not identified) | The mock has 65 items, all scored, allocated by domain weight: **13 · 16 · 18 · 9 · 9** (largest remainder). |
| Time | 90 min (from the certification page; the guide doesn't state it) | Countdown, flag for review, review screen. |
| Score | Scaled 100–1,000, pass at **700**, compensatory (no per-domain pass) | The scaled score is a linear estimate from percent correct, always labelled "estimate". The report shows pass/fail plus percent per domain and per task. |
| Guessing | Unanswered = wrong, no penalty | The mock warns about unanswered items on the review screen. |
| Item kinds (guide v1.2) | Multiple choice (1 of 4), multiple response (2+ of 5+) | The core of the bank. |
| Item kinds (AWS, since 2024, not in v1.2) | Ordering, matching, case study | Built, behind a toggle. No partial credit: all-or-nothing. |

## 3. Blueprint → content map

`blueprint.ts` holds the domains, tasks and objective bullets **verbatim** from guide v1.2. Task ids follow the guide (`"3.2"`) and objective ids are `<taskId>.<n>` in guide order (`"3.2.4"` = prompt-engineering risks).

| Domain | Weight | Mock items | Tasks (objectives) |
|---|---|---|---|
| 1 Fundamentals of AI and ML | 20% | 13 | 1.1 basic AI concepts and terminology (5) · 1.2 practical use cases (6) · 1.3 the AI/ML development lifecycle (6) |
| 2 Fundamentals of GenAI | 24% | 16 | 2.1 basic GenAI concepts, including tokens, context engineering and agentic AI/MCP (6) · 2.2 capabilities and limitations (4) · 2.3 AWS infrastructure and technologies for GenAI (4) |
| 3 Applications of Foundation Models | 28% | 18 | 3.1 FM application design considerations: selection, inference parameters, RAG, vector stores, customization cost, agents (6) · 3.2 prompt engineering, including Bedrock Prompt Management (5) · 3.3 training and fine-tuning (3) · 3.4 evaluating FM performance (5) |
| 4 Guidelines for Responsible AI | 14% | 9 | 4.1 developing responsible AI systems (7) · 4.2 transparent and explainable models (4) |
| 5 Security, Compliance, and Governance | 14% | 9 | 5.1 securing AI systems (5) · 5.2 governance and compliance (3) |

The blueprint also holds:
- **The service catalog** (`services.ts`): every in-scope and out-of-scope service from the guide, with its category, a one-line "what it is for" and a docs link. The drills, the flashcards and the lesson service chips derive from it. A test checks that every service a question's `services[]` field names is in the catalog.
- **The guide's out-of-scope job tasks** (coding models, feature engineering, hyperparameter tuning…), shown in the exam-day guide so learners don't over-study.

Newer services in v1.2 (Amazon Quick, Kiro, Strands Agents, Amazon Bedrock AgentCore with Identity and Policy, AWS Transform, Amazon Nova) change fast. Check what they are and do against the AWS docs when writing about them, never from memory.

## 4. Question bank

**Targets.** 650 items, split by domain weight and then by each task's objective count:

| Task | 1.1 | 1.2 | 1.3 | 2.1 | 2.2 | 2.3 | 3.1 | 3.2 | 3.3 | 3.4 | 4.1 | 4.2 | 5.1 | 5.2 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Items | 38 | 46 | 46 | 67 | 45 | 44 | 57 | 48 | 29 | 48 | 58 | 33 | 57 | 34 |

Domain totals: 130 · 156 · 182 · 91 · 91. Every objective needs **at least 5** items. `questionTarget()` computes these numbers, and `npm run content:status` shows progress against them; tests don't enforce them.

**Kind mix** (bank-wide): about 80% `single` and `multi`, with roughly 2 single for every multi. About 20% extended kinds: around 45 `order`, 50 `match`, and 12 `case` sets of 3–4 sub-items each.

**Item kinds.** A Zod discriminated union on `kind`. Every item shares `id` (`<taskId>-NNN`), `taskId`, `objectives[]`, optional `services[]`, `stem` and `explanation`.

| `kind` | Interaction | Grading |
|---|---|---|
| `single` | Pick 1 of 4. | exact |
| `multi` | Pick N of 5+. The stem says "(Select TWO.)". | all-or-nothing |
| `order` | Arrange 3–5 steps (e.g. the RAG ingestion steps, the ML pipeline stages). Drag, or use the keyboard with ↑/↓ buttons. | exact sequence |
| `match` | Match 3–5 prompts to responses from a list that may contain extras, for example scenario → service or metric → use. Uses dropdowns, which work with the keyboard. | all pairs correct |
| `case` | A shared scenario with 2–4 sub-items, each `single` or `multi`. | each sub-item is scored separately, as on the exam |

**Extended-kinds toggle** ("Include ordering, matching and case-study items"): there's one toggle each for practice and the mock, both **on by default**. With the mock toggle on, the mock exam swaps in about 8 extended items, including at most one case set, while keeping each domain's count. With it off, only `single` and `multi` are drawn.

**Authoring rules** (tests enforce the ones marked ✓):
- Scenario stems in the exam's style: "Cairnway Outfitters wants to… Which solution meets these requirements with the LEAST operational overhead?" There's one defensible answer, and the distractors are plausible AWS services or techniques.
- ✓ The key letter of `single` items is at most 40% for any letter, the key is the longest option at most 40% of the time, there are no duplicate stems, and explanations never mention option letters (so options can be reordered).
- ✓ `multi`: `correct.length === select`, and there are at least 5 options. `match`: every prompt has exactly one response. `order`: there are no duplicate steps.
- ✓ Every `objectives[]` id exists and belongs to the item's `taskId`, and every `services[]` name is in the catalog.
- Explanations are written for non-technical learners: why the key fits the stated constraint, then why each distractor misses it.
- Every item is written for this app. Never reproduce live exam content (candidates are under NDA) or third-party dumps.
- Facts about AWS services are checked against AWS documentation, and any item that states a quota, price or model detail cites a source in `sourceLinks`.

## 5. Learn: lessons

There are 14 MDX lessons, one per task, at `lessons/<taskId>.mdx`. The required sections, in order:
1. `## Big idea`: a plain-language intro with no unexplained jargon.
2. `## Key concepts`: one sub-heading per objective bullet, with tables and comparisons (e.g. RAG vs. fine-tuning vs. pre-training cost).
3. `## At Cairnway`: the task applied to the running company.
4. `## AWS services`: service chips from the catalog, each with a one-liner and a docs link.
5. `## Exam traps`: confusable pairs (Comprehend vs. Textract, Macie vs. Inspector, CloudTrail vs. Config, precision vs. recall, ROUGE vs. BLEU…).

The links to the matching simulators, drills, flashcards and walkthroughs are generated by the lesson page from their data, not written into the MDX (decided 2026-11-23, because the Explore pillar is built after the lessons).

`meta`: `taskId`, `updated`, `tldr`, `objectivesCovered` (a test checks that every objective bullet of the task is covered), and `links` to AWS documentation.

## 6. Explore: the hands-on replacement

### 6a. Concept simulators (`/explore/sims/:simId`)
Small interactive widgets, each built as a React component with its copy and parameters kept as data. Each ends with 2–3 "now you try" questions taken from the bank.

| Sim | What the learner does | Objectives |
|---|---|---|
| Next-token sampler | Moves the temperature, top-p and top-k sliders over a toy token distribution, sees the probabilities reshape, and samples completions. | 3.1.2, 2.2.2 |
| Metrics lab | Edits a confusion matrix (fraud at Cairnway) and watches accuracy, precision, recall and F1 change. A threshold slider shows the precision/recall trade-off. | 1.3.6 |
| Fit explorer | Changes model complexity on a toy dataset to see underfitting, a good fit and overfitting, with training vs. validation error. | 1.1.1, 4.1.6 |
| Token cost calculator | Sets the input and output tokens, request volume, on-demand vs. batch vs. provisioned throughput, and prompt caching. Uses **example rates labelled as illustrative**, with a link to the Bedrock pricing page. | 2.1.4, 2.3.4, 3.1.1 |
| RAG pipeline step-through | Chunks a product FAQ, embeds it (toy 2-D vectors), runs a similarity search, builds the augmented prompt and gets a grounded answer, then compares the same question without RAG. | 2.1.1, 3.1.3, 3.1.4, 5.1.5 |
| Customization ladder | Answers a requirement (fresh data? style? new domain? budget?) to place a use case on prompting → RAG → fine-tuning → continued pre-training → pre-training, with the cost and effort of each step. | 3.1.5, 3.3.1 |
| Prompt technique compare | Runs one task as zero-shot, few-shot and chain-of-thought with **canned** outputs, plus a prompt-injection attempt with and without a guardrail. | 3.2.1–3.2.4 |
| Guardrails configurator | Configures denied topics, content filters, word filters and PII redaction, then runs canned chatbot exchanges through them. | 4.1.2, 5.1.1, 5.1.4 |
| Inference mode chooser | Places workloads (nightly catalog tagging, live chat, large video jobs…) on real-time, batch, asynchronous or serverless inference. | 1.1.3 |

No live model calls: every output is precomputed, so the app stays static and free.

### 6b. Service-matcher drills (`/explore/drills`)
Fast, timed rounds built from the service catalog and from `drills/<deckId>.json`:
- **Which service?**: a scenario card (e.g. "extract line items from scanned supplier invoices") → pick from 4 catalog services. Each miss shows the one-liners of both the picked and the correct service.
- **Sorters**: drag items into buckets, for example the shared responsibility model (AWS vs. customer), in scope vs. out of scope, supervised vs. unsupervised vs. reinforcement learning, governance service → purpose.
- Per-deck best score and streak are kept in progress. Missed cards feed the weak-spot drill.

### 6c. Flashcards (`/explore/flashcards`)
Leitner boxes 0–5 rated Again/Good/Easy, with intervals 0/1/3/7/16/35 days. A session shows the due cards first, then new ones. There are about 300 built-in cards (`flashcards/<taskId>.json`), with service cards generated from the catalog. Learners can make their own decks and share them as validated JSON files. Review state is never shared.

### 6d. Console walkthroughs (`/explore/walkthroughs/:id`, optional)
There are about 6 walkthroughs in MDX: the Bedrock playground (with inference parameters), a Bedrock Knowledge Base on an S3 FAQ, a Bedrock Guardrails setup, a Bedrock model evaluation, a Comprehend sentiment run on reviews, and IAM least privilege for Bedrock. Each has `meta.steps` (a checklist stored in progress), an **estimated cost**, a "stay cheap" note and a mandatory `## Teardown` section. They never count toward readiness. Console UIs change, so each walkthrough carries `updated` and is checked again when it gets old.

## 7. Architecture

The stack is listed in §1. Because Pages serves the app under `/AIF-C01_prep/`, Vite's `base` and the router's `basename` come from `BASE_PATH`. The deploy copies `index.html` to `404.html` so deep links work.

App features:
- a versioned `localStorage` progress store with export and import. It records item stats with a streak, mock results, lessons read, the extended-kinds toggles, flashcard state, own decks, drill scores and walkthrough checklists.
- readiness per task: coverage × accuracy, weighted by domain weight
- `masteryOf()`: not tested / recent error / past error since correct / always correct
- practice by task, domain, weighted mix, least-mastered or weak spots
- a session review after each practice session
- a question bank browser with task, kind and mastery filters
- keyboard shortcuts
- all pages lazy-loaded
- print-ready guides: a cheat sheet and an exam-day guide

Tooling:
- content tests
- `content:status` (items per task and objective against target, with the kind mix)
- `content:quality` (the anti-giveaway checks)
- `content:links` (checks every cited AWS URL)

## 8. Phases

0. **Scaffold** (done 2026-11-23): set up the tooling and the Pages deploy workflow, and add the non-affiliation footer. Write `blueprint.ts` (verbatim from guide v1.2: 14 tasks, 69 objectives), `services.ts` (51 in-scope and 93 out-of-scope services, plus 6 objective-named features), the schema with all 5 kinds, the content tests, and the three content scripts. The certification page confirms 65 questions in 90 minutes. It doesn't list question formats, and it links the Skill Builder prep plan, which is now in `GUIDE.prepPlanUrl`.
1. **Quiz engine** (done 2026-11-23): render and grade all kinds; practice, the question bank and the mock exam with the extended-kinds toggles; the scaled-score report by domain and task; the progress store and page. 6 seed items, at least one of each kind.
2. **Lessons** (done 2026-11-23): 14 lessons, about 33,000 words. Every AWS fact was checked against AWS pages, and each lesson cites its sources (134 links). The catalog gained 22 feature entries (SageMaker features, Bedrock pricing and logging features, AgentCore Identity, Policy and Evaluations, Glue Data Catalog and Data Quality, S3 Lifecycle) for the lessons' service cards.
3. **Question bank** (done 2026-11-23): 650 items, every task at its target and every objective with at least 5 items. Kinds: 359 single, 175 multi, 44 order, 54 match and 18 case sets (18% extended). Single-select keys are A 103, B 103, C 102 and D 100. Written by agents per task from a shared brief, then reviewed: ambiguous match pairs and joke distractors were fixed.
   - *Follow-up:* the key is the strictly longest option in only about 13% of single-select questions, below the 25% chance rate, so "never pick the longest" is a slight hint. A later pass should lengthen some keys, and a lower-bound check would keep it fixed.
4. **Explore I** (done 2026-11-23): service catalog drills and sorters, then flashcards.
   - *Drills* (done 2026-11-23): 5 "Which service?" decks (80 cards) and 4 sorters (shared responsibility, learning types, prompt engineering vs. RAG vs. fine-tuning, and the in/out-of-scope sorter generated from the catalog). Buttons replace drag and drop, so sorters work with the keyboard and on phones. Missed cards are kept per learner and can be replayed per deck.
   - *Flashcards* (done 2026-11-23): 316 written cards (3–7 per objective, written by agents per task from the lessons, then reviewed) and 78 service cards generated from the catalog (51 services and 27 features), in 5 domain decks and a service deck. Own decks can be written, downloaded and uploaded. Ported spaced repetition: Leitner boxes with Again/Good/Easy.
5. **Explore II** (done 2026-11-23): nine concept simulators, each with exam takeaways and three bank questions to answer. Built from data plus one component folder each: the next-token sampler, metrics lab (it reproduces lesson 1.3's fraud example), fit explorer, token cost calculator (illustrative rates; only the batch discount and Provisioned Throughput rules are AWS facts), RAG step-through (toy 2-D embeddings), customization ladder, prompt technique compare, Guardrails configurator (filter strengths and PII masking checked against the AWS Guardrails pages) and inference mode chooser.
6. **Walkthroughs and guides**: console walkthroughs, the cheat sheet, the exam-day guide, a mobile pass and accessibility for the order and match items.
