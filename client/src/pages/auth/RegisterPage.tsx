import { useState, type FormEvent } from 'react'
import { useAuth } from '@/context/useAuth'
import { Button } from '@/components/ui/Button'

interface Props {
  onSwitchToLogin: () => void
}

export function RegisterPage({ onSwitchToLogin }: Props) {
  const { register } = useAuth()
  const [form, setForm] = useState({ email: '', password: '', name: '', orgName: '', orgSlug: '' })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setForm(f => ({
      ...f,
      [field]: value,
      // Auto-generate slug from orgName
      ...(field === 'orgName' && {
        orgSlug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      }),
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { id: 'name',     label: 'Your name',        type: 'text',     placeholder: 'Alex Rivera',           autoComplete: 'name' },
    { id: 'email',    label: 'Work email',        type: 'email',    placeholder: 'you@agency.com',        autoComplete: 'email' },
    { id: 'password', label: 'Password',          type: 'password', placeholder: 'Min. 8 characters',     autoComplete: 'new-password' },
    { id: 'orgName',  label: 'Agency name',       type: 'text',     placeholder: 'Peak Growth Agency',    autoComplete: 'organization' },
    { id: 'orgSlug',  label: 'Agency URL slug',   type: 'text',     placeholder: 'peak-growth',           autoComplete: 'off' },
  ] as const

  return (
    <div className="min-h-screen flex items-center justify-center py-10" style={{ background: '#0f1c2e' }}>
      <div className="w-full max-w-[420px] px-4">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center">
            <i className="ti ti-radar-2 text-white text-[18px]" aria-hidden="true" />
          </div>
          <div>
            <div className="text-white text-[18px] font-medium">Control Tower AI</div>
            <div className="text-white/40 text-[11px]">Agency Platform</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <h1 className="text-[20px] font-medium text-gray-900 mb-1">Create your account</h1>
          <p className="text-[13px] text-gray-400 mb-6">
            Already have an account?{' '}
            <button onClick={onSwitchToLogin} className="text-blue-500 hover:underline bg-none border-none cursor-pointer font-[inherit] text-[13px] p-0">
              Sign in
            </button>
          </p>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-red-600 text-[13px] mb-4">
              <i className="ti ti-alert-circle text-[15px]" aria-hidden="true" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {fields.map(f => (
              <label key={f.id} className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium text-gray-700">{f.label}</span>
                <input
                  type={f.type}
                  value={form[f.id]}
                  onChange={handleChange(f.id)}
                  className="px-3 py-2.5 text-[14px] border border-gray-200 rounded-lg outline-none focus:border-blue-400 text-gray-900"
                  placeholder={f.placeholder}
                  autoComplete={f.autoComplete}
                  required
                />
                {f.id === 'orgSlug' && form.orgSlug && (
                  <span className="text-[11px] text-gray-400">
                    URL: controltower.ai/<strong>{form.orgSlug}</strong>
                  </span>
                )}
              </label>
            ))}

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full justify-center py-2.5 text-[14px] mt-1"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
