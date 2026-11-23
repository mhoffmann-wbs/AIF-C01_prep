// @vitest-environment jsdom
// UI tests run against the real routes and the real question bank, so keep them
// independent of item order and pool size.
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider, createMemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { routes } from '../app/routes'
import { getProgress, resetProgress } from '../progress/store'

/** Renders the real routes at `path` and waits for the lazy page. */
async function renderAt(path: string) {
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />)
  return screen.findByRole('heading', { level: 1 })
}

beforeEach(() => {
  localStorage.clear()
  resetProgress()
})

describe('pages', () => {
  it('shows the blueprint with all five domains on the home page', async () => {
    expect(await renderAt('/')).toHaveTextContent('AIF-C01')
    expect(screen.getByText(/Domain 3: Applications of Foundation Models/)).toBeInTheDocument()
    expect(screen.getAllByText(/^Domain \d:/)).toHaveLength(5)
    expect(screen.getByText(/Not affiliated with or endorsed by Amazon Web Services/)).toBeInTheDocument()
  })

  it('shows a not-found page for unknown paths', async () => {
    expect(await renderAt('/nope')).toHaveTextContent('Page not found')
  })

  it('renders a lesson with its service cards and marks it read', async () => {
    const user = userEvent.setup()
    expect(await renderAt('/learn/3.1')).toHaveTextContent('3.1')
    expect(screen.getByRole('heading', { name: 'Exam traps' })).toBeInTheDocument()
    expect(screen.getByText(/Managed RAG: connects foundation models/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Mark as read' }))
    expect(getProgress().lessonsRead).toEqual(['3.1'])
  })

  it('links every task on the Learn index to its lesson', async () => {
    expect(await renderAt('/learn')).toHaveTextContent('Learn')
    expect(screen.getByRole('link', { name: /3\.1 Describe design considerations/ })).toBeInTheDocument()
    expect(screen.queryByText(/coming soon/)).not.toBeInTheDocument()
  })

  it('lists every domain on the practice picker', async () => {
    expect(await renderAt('/practice')).toHaveTextContent('Practice')
    expect(screen.getAllByText(/^Domain \d:/)).toHaveLength(5)
  })

  it('checks a practice answer, reveals explanations and records the attempt', async () => {
    const user = userEvent.setup()
    await renderAt('/questions/1.2-001')
    const check = screen.getByRole('button', { name: 'Check answer' })
    expect(check).toBeDisabled()
    await user.click(screen.getByRole('radio', { name: /Amazon Textract/ }))
    await user.click(check)
    expect(screen.getByRole('status')).toHaveTextContent('Correct')
    expect(screen.getByText('Explanation')).toBeInTheDocument()
    expect(getProgress().items['1.2-001']).toMatchObject({ attempts: 1, lastCorrect: true })
  })

  it('answers a matching item with dropdowns', async () => {
    const user = userEvent.setup()
    await renderAt('/questions/1.2-002')
    for (const [prompt, answer] of [
      [/support calls/, 'Amazon Transcribe'],
      [/aloud/, 'Amazon Polly'],
      [/Spanish/, 'Amazon Translate'],
    ] as const)
      await user.selectOptions(screen.getByRole('combobox', { name: prompt }), answer)
    await user.click(screen.getByRole('button', { name: 'Check answer' }))
    expect(screen.getByRole('status')).toHaveTextContent('Correct')
  })

  it('grades each part of a case study', async () => {
    const user = userEvent.setup()
    await renderAt('/questions/5.1-001')
    const first = screen.getByRole('region', { name: /Question 1 of 2/ })
    const second = screen.getByRole('region', { name: /Question 2 of 2/ })
    await user.click(within(first).getByRole('radio', { name: /Amazon Macie/ }))
    await user.click(within(second).getByRole('checkbox', { name: /prompt attack filter/ }))
    await user.click(within(second).getByRole('checkbox', { name: /temperature/ }))
    await user.click(screen.getByRole('button', { name: 'Check answer' }))
    expect(within(first).getByText('✓ Correct')).toBeInTheDocument()
    expect(within(second).getByText('✗ Not quite')).toBeInTheDocument()
  })

  it('reorders an ordering item with the arrow buttons', async () => {
    const user = userEvent.setup()
    await renderAt('/questions/3.1-002')
    const list = screen.getByRole('list', { name: 'Steps in your order' })
    const first = within(list).getAllByRole('listitem')[0]!
    const down = within(first).getByRole('button', { name: /down$/ })
    await user.click(down)
    expect(within(list).getAllByRole('listitem')[1]).toBe(first)
  })

  it('runs a mock exam to its score report', async () => {
    const user = userEvent.setup()
    expect(await renderAt('/mock')).toHaveTextContent('Mock exam')
    await user.click(screen.getByRole('button', { name: 'Start the mock exam' }))
    expect(screen.getByLabelText('time remaining')).toBeInTheDocument()
    // Step to the review screen without answering, then submit.
    while (!screen.queryByRole('button', { name: 'Submit exam' })) await user.click(screen.getByRole('button', { name: /^(Next|Review)$/ }))
    await user.click(screen.getByRole('button', { name: 'Submit exam' }))
    expect(screen.getByText(/Estimated scaled score/)).toBeInTheDocument()
    expect(getProgress().mockResults).toHaveLength(1)
    expect(getProgress().mockResults[0]).toMatchObject({ correct: 0, scaled: 100, passed: false })
  })

  it('plays a drill round to the end and keeps the misses', async () => {
    const user = userEvent.setup()
    expect(await renderAt('/explore/drills')).toHaveTextContent('Service drills')
    await user.click(screen.getByRole('link', { name: /Play a round: Ready-made AI services/ }))
    await screen.findByRole('heading', { level: 1, name: 'Ready-made AI services' })
    // Always pick the first choice; with four choices some answers are wrong.
    while (!screen.queryByText(/Round complete/)) {
      await user.click(within(screen.getByRole('group', { name: 'Choices' })).getAllByRole('button')[0]!)
      expect(screen.getByRole('status')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: /^(Next card|Finish)$/ }))
    }
    const stat = getProgress().drills['ai-services']
    expect(stat?.rounds).toBe(1)
    expect(getProgress().drillMisses.length).toBe(10 - Math.round((stat!.best / 100) * 10))
  })

  it('links a lesson to its drills', async () => {
    await renderAt('/learn/5.1')
    expect(screen.getByRole('link', { name: /Drill: Shared responsibility/ })).toBeInTheDocument()
  })

  it('shows readiness by domain and the extended-kinds toggles on the progress page', async () => {
    expect(await renderAt('/progress')).toHaveTextContent('Progress')
    expect(screen.getByText('By domain')).toBeInTheDocument()
    expect(screen.getAllByRole('checkbox', { name: /ordering, matching and case-study/ })).toHaveLength(2)
  })
})
