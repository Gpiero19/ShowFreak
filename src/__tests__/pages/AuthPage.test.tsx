import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AuthPage from '../../pages/AuthPage'

const mockNavigate = vi.fn()
const mockLogin = vi.fn()
const mockRegister = vi.fn()

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin, register: mockRegister }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockLogin.mockResolvedValue(undefined)
  mockRegister.mockResolvedValue(undefined)
})

describe('AuthPage', () => {
  it('renders the login form by default', () => {
    render(<AuthPage />)
    expect(screen.getByRole('heading', { name: 'Login' })).toBeTruthy()
    expect(screen.getByPlaceholderText('Email')).toBeTruthy()
    expect(screen.getByPlaceholderText('Password')).toBeTruthy()
  })

  it('does not show the username field on the login form', () => {
    render(<AuthPage />)
    expect(screen.queryByPlaceholderText('Username')).toBeNull()
  })

  it('switches to the register form when the toggle is clicked', async () => {
    const user = userEvent.setup()
    render(<AuthPage />)

    await user.click(screen.getByText(/Need an account\? Register/))

    expect(screen.getByRole('heading', { name: 'Register' })).toBeTruthy()
  })

  it('shows the username field only in register mode', async () => {
    const user = userEvent.setup()
    render(<AuthPage />)

    await user.click(screen.getByText(/Need an account\? Register/))

    expect(screen.getByPlaceholderText('Username')).toBeTruthy()
  })

  it('calls login() with email and password on login form submit', async () => {
    const user = userEvent.setup()
    render(<AuthPage />)

    await user.type(screen.getByPlaceholderText('Email'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Login' }))

    expect(mockLogin).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    })
  })

  it('calls register() with email, password, and username on register form submit', async () => {
    const user = userEvent.setup()
    render(<AuthPage />)

    await user.click(screen.getByText(/Need an account\? Register/))
    await user.type(screen.getByPlaceholderText('Username'), 'newuser')
    await user.type(screen.getByPlaceholderText('Email'), 'new@example.com')
    await user.type(screen.getByPlaceholderText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Register' }))

    expect(mockRegister).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'password123',
      username: 'newuser',
    })
  })

  it('shows a success message after successful login', async () => {
    const user = userEvent.setup()
    render(<AuthPage />)

    await user.type(screen.getByPlaceholderText('Email'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Login' }))

    expect(await screen.findByText('Login successful!')).toBeTruthy()
  })

  it('shows an error message when login fails', async () => {
    mockLogin.mockRejectedValue({
      response: { data: { error: 'Invalid credentials' } },
    })
    const user = userEvent.setup()
    render(<AuthPage />)

    await user.type(screen.getByPlaceholderText('Email'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('Password'), 'wrongpass')
    await user.click(screen.getByRole('button', { name: 'Login' }))

    expect(await screen.findByText('Invalid credentials')).toBeTruthy()
  })

  it('password field has minLength of 8 in register mode', async () => {
    const user = userEvent.setup()
    render(<AuthPage />)

    await user.click(screen.getByText(/Need an account\? Register/))

    const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement
    expect(passwordInput.minLength).toBe(8)
  })
})
