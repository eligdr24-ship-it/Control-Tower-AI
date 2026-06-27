import { useState } from 'react'
import { useAuth } from '@/context/useAuth'
import { LoginPage }    from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'

type AuthView = 'login' | 'register'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthed, loading } = useAuth()
  const [view, setView] = useState<AuthView>('login')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f1c2e' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center animate-pulse">
            <i className="ti ti-radar-2 text-white text-[18px]" aria-hidden="true" />
          </div>
          <div className="text-white/50 text-[13px]">Loading…</div>
        </div>
      </div>
    )
  }

  if (!isAuthed) {
    return view === 'login'
      ? <LoginPage    onSwitchToRegister={() => setView('register')} />
      : <RegisterPage onSwitchToLogin={() => setView('login')} />
  }

  return <>{children}</>
}
