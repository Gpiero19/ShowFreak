import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      <h1 style={{ fontSize: '4rem', margin: '0 0 1rem' }}>404</h1>
      <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>
        This page doesn't exist.
      </p>
      <button className="toggle-btn" onClick={() => navigate('/')}>
        Go home
      </button>
    </div>
  )
}
