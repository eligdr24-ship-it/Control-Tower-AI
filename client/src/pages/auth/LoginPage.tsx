import { useState, type FormEvent } from 'react'
import { useAuth } from '@/context/useAuth'
import { Button } from '@/components/ui/Button'
import { API_ORIGIN } from '@/api/client'

interface Props {
  onSwitchToRegister: () => void
}

export function LoginPage({ onSwitchToRegister }: Props) {
  const { login } = useAuth()
  const [email,    setEmail]    = useState('admin@peakgrowth.agency')
  const [password, setPassword] = useState('demo1234')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  // Show in UI whether the API URL is configured — helps diagnose connection issues
  const apiLabel = API_ORIGIN || '(not set — check VITE_API_URL)'
  const apiOk    = Boolean(API_ORIGIN)

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f1c2e' }}>
      <div className="w-full max-w-[380px] px-4">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center">
            <i className="ti ti-radar-2 text-white text-[18px]" aria-hidden="true" />
          </div>
          <div>
            <div className="text-white text-[18px] font-medium">Control Tower AI</div>
            <div className="text-white/40 text-[11px]">Agency Platform</div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <h1 className="text-[20px] font-medium text-gray-900 mb-1">Sign in</h1>
          <p className="text-[13px] text-gray-400 mb-6">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToRegister}
              className="text-blue-500 hover:underline bg-none border-none cursor-pointer font-[inherit] text-[13px] p-0"
            >
              Create one
            </button>
          </p>

          {/* API connection status — shown only when misconfigured */}
          {!apiOk && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-[12px] mb-4">
              <i className="ti ti-alert-triangle text-[14px] mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <div className="font-medium">API not configured</div>
                <div className="mt-0.5 text-amber-600">
                  Set <code className="bg-amber-100 px-1 rounded">VITE_API_URL</code> in Render → client service → Environment.
                </div>
              </div>
            </div>
          )}

          {/* Login error */}
          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-red-600 text-[13px] mb-4">
              <i className="ti ti-alert-circle text-[15px] mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <div>{error}</div>
                {/* Show the target URL so connection errors are easy to diagnose */}
                <div className="mt-1 text-[11px] text-red-400 font-mono break-all">
                  API: {apiLabel}/api/v1/auth/login
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-gray-700">Email</span>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="px-3 py-2.5 text-[14px] border border-gray-200 rounded-lg outline-none focus:border-blue-400 text-gray-900"
                placeholder="you@agency.com"
                required
                autoComplete="email"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-gray-700">Password</span>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="px-3 py-2.5 text-[14px] border border-gray-200 rounded-lg outline-none focus:border-blue-400 text-gray-900"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </label>

            <Button
              type="submit"
              variant="primary"
              disabled={loading || !apiOk}
              className="w-full justify-center py-2.5 text-[14px] mt-1"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-5 pt-4 border-t border-gray-100 text-center text-[12px] text-gray-400">
            Demo:{' '}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">admin@peakgrowth.agency</code>
            {' '}/ <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">demo1234</code>
          </div>
        </div>

        {/* Connection debug — always visible below the card */}
        <div className={`mt-3 text-center text-[11px] font-mono ${apiOk ? 'text-white/25' : 'text-amber-400'}`}>
          API: {apiLabel}
        </div>
      </div>
    </div>
  )
}
