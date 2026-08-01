import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function LoginPage() {
  const { login, signup, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from =
    (location.state as { from?: string } | null)?.from ?? '/plan'

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await signup(email, password, passwordConfirmation)
      }
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Auth failed')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="login-page">
      <header>
        <h1>Meal Planner</h1>
        <p className="muted">Plan the week. Shop once.</p>
      </header>

      <div className="chip-row">
        <button
          type="button"
          className={`chip ${mode === 'login' ? 'chip--active' : ''}`}
          onClick={() => setMode('login')}
        >
          Log in
        </button>
        <button
          type="button"
          className={`chip ${mode === 'signup' ? 'chip--active' : ''}`}
          onClick={() => setMode('signup')}
        >
          Sign up
        </button>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}

      <form onSubmit={onSubmit}>
        <label className="field">
          <span className="mono muted">Email</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="field">
          <span className="mono muted">Password</span>
          <input
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {mode === 'signup' ? (
          <label className="field">
            <span className="mono muted">Confirm password</span>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
            />
          </label>
        ) : null}
        <button type="submit" className="btn btn--primary" disabled={pending}>
          {pending ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
        </button>
      </form>
    </div>
  )
}
