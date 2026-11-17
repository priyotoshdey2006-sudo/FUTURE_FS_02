
import { useState } from 'react'
import { LockKeyhole, Mail, TrendingUp, Eye, EyeOff } from 'lucide-react'
import api from '../api/axios'

function Login({ onLogin }) {
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      })

      localStorage.setItem('crm_token', response.data.token)
      onLogin(response.data.admin)
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090b12] px-4 text-slate-100">
      <div className="w-full max-w-md rounded-3xl border border-white/[0.08] bg-[#10131e] p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600">
            <TrendingUp size={28} />
          </div>
          <h1 className="text-2xl font-bold">LeadFlow</h1>
          <p className="mt-2 text-sm text-slate-400">Sign in to your CRM workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm text-slate-300">Email address</label>
            <div className="relative">
              <Mail size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/[0.08] bg-[#090b12] py-3 pl-10 pr-4 text-sm outline-none focus:border-violet-500"
                placeholder="admin@example.com"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">Password</label>
            <div className="relative">
              <LockKeyhole size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/[0.08] bg-[#090b12] py-3 pl-10 pr-11 text-sm outline-none focus:border-violet-500"
                placeholder="Enter your admin password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-violet-600 py-3 font-semibold transition hover:bg-violet-500 disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign in to dashboard'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Secure administrator access · LeadFlow CRM
        </p>
      </div>
    </div>
  )
}

export default Login
