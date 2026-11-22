// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { routes } from '../app/routes'

/** Renders the real routes at `path` and waits for the lazy page. */
async function renderAt(path: string) {
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />)
  return screen.findByRole('heading', { level: 1 })
}

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
})
