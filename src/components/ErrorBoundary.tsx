import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <h1 style={{ marginBottom: '1rem' }}>Something went wrong</h1>
          <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>
            An unexpected error occurred.
          </p>
          <button
            className="toggle-btn"
            onClick={() => {
              this.setState({ hasError: false })
              window.location.href = '/'
            }}
          >
            Go home
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
