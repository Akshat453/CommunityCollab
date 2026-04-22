import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-surface-container-low rounded-[2rem] p-10 shadow-lg">
          <div className="text-center mb-10">
            <div className="w-16 h-16 primary-gradient rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="material-symbols-outlined text-white text-3xl material-fill">local_fire_department</span>
            </div>
            <h1 className="text-3xl font-headline font-extrabold tracking-tight mb-2">Welcome Back</h1>
            <p className="text-on-surface-variant text-sm">Sign in to the Kinetic Hearth</p>
          </div>
          {error && (
            <div className="bg-error-container text-on-error-container px-4 py-3 rounded-xl text-sm font-medium mb-6">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-semibold block mb-2">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none" placeholder="priya@test.com" />
            </div>
            <div>
              <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-semibold block mb-2">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="w-full primary-gradient text-white py-4 rounded-xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className="text-center text-sm text-on-surface-variant mt-8">
            Don&apos;t have an account? <Link to="/register" className="text-primary font-bold hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
