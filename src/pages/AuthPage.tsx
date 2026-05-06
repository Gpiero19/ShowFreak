import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LoginRequest, RegisterRequest } from '../types'

interface Message {
  text: string
  type: 'success' | 'error'
}

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [message, setMessage] = useState<Message | null>(null)
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (isLogin) {
        await login({ email, password } as LoginRequest)
        showMessage('Login successful!', 'success')
        setTimeout(() => navigate('/'), 1000)
      } else {
        await register({ email, password, username } as RegisterRequest)
        showMessage('Registration successful! Welcome!', 'success')
        setTimeout(() => navigate('/'), 1000)
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Authentication failed. Please try again.'
      showMessage(errorMsg, 'error')
    }
  }

  return (
    <div className="auth-page" style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      {message && (
        <div
          style={{
            padding: '12px 20px',
            borderRadius: '8px',
            marginBottom: '20px',
            color: 'white',
            fontWeight: 'bold',
            backgroundColor: message.type === 'success' ? '#22c55e' : '#ef4444',
            animation: 'fadeIn 0.3s ease-in-out',
          }}
        >
          {message.text}
        </div>
      )}

      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>{isLogin ? 'Login' : 'Register'}</h1>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {!isLogin && (
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <button
          type="submit"
          style={{
            padding: '12px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          {isLogin ? 'Login' : 'Register'}
        </button>
      </form>

      <button
        onClick={() => setIsLogin(!isLogin)}
        style={{
          marginTop: '20px',
          background: 'none',
          border: 'none',
          color: '#3b82f6',
          cursor: 'pointer',
          textDecoration: 'underline',
        }}
      >
        {isLogin ? 'Need an account? Register' : 'Have an account? Login'}
      </button>
    </div>
  )
}