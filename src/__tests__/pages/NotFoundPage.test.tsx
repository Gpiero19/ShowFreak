import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NotFoundPage from '../../pages/NotFoundPage'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('NotFoundPage', () => {
  it('renders a 404 heading', () => {
    render(<NotFoundPage />)
    expect(screen.getByRole('heading', { name: '404' })).toBeTruthy()
  })

  it('renders the "This page doesn\'t exist." message', () => {
    render(<NotFoundPage />)
    expect(screen.getByText("This page doesn't exist.")).toBeTruthy()
  })

  it('navigates to / when the Go home button is clicked', async () => {
    const user = userEvent.setup()
    render(<NotFoundPage />)

    await user.click(screen.getByRole('button', { name: 'Go home' }))

    expect(mockNavigate).toHaveBeenCalledWith('/')
  })
})
