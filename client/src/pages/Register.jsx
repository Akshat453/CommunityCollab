import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', city: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form.name, form.email, form.password, form.city)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
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
              <span className="material-symbols-outlined text-white text-3xl material-fill">group_add</span>
            </div>
            <h1 className="text-3xl font-headline font-extrabold tracking-tight mb-2">Join the Hearth</h1>
            <p className="text-on-surface-variant text-sm">Create your community account</p>
          </div>
          {error && (
            <div className="bg-error-container text-on-error-container px-4 py-3 rounded-xl text-sm font-medium mb-6">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-semibold block mb-2">Full Name</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none" placeholder="Your full name" />
            </div>
            <div>
              <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-semibold block mb-2">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none" placeholder="you@example.com" />
            </div>
            <div>
              <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-semibold block mb-2">Password</label>
              <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none" placeholder="Minimum 6 characters" />
            </div>
            <div>
              <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-semibold block mb-2">City</label>
              <input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none" placeholder="Seattle, WA" />
            </div>
            <button type="submit" disabled={loading} className="w-full primary-gradient text-white py-4 rounded-xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform disabled:opacity-50">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-sm text-on-surface-variant mt-8">
            Already have an account? <Link to="/login" className="text-primary font-bold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
