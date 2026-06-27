import { useLocation, useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { DashboardPage }   from '@/pages/DashboardPage'
import { ProfilesPage }    from '@/pages/ProfilesPage'
import { ReviewsPage }     from '@/pages/ReviewsPage'
import { AgentsPage }      from '@/pages/AgentsPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import type { PageId } from '@/types'

const PLACEHOLDERS: Record<string, { title: string; icon: string; description: string }> = {
  posts:      { title: 'Google Posts',    icon: 'ti-news',              description: 'AI-powered content creation across all profiles — coming in Phase 3.' },
  media:      { title: 'Media Manager',   icon: 'ti-photo',             description: 'Bulk photo & video management — coming in Phase 3.' },
  rankings:   { title: 'Ranking Engine',  icon: 'ti-trophy',            description: 'Local SEO positions with geo-grid visualization — coming in Phase 3.' },
  health:     { title: 'Health Scanner',  icon: 'ti-heart-rate-monitor',description: '40+ GBP health checks per profile — coming in Phase 3.' },
  reporting:  { title: 'Reporting',       icon: 'ti-chart-bar',         description: 'Automated white-label client reports — coming in Phase 3.' },
  automation: { title: 'Automation',      icon: 'ti-bolt',              description: 'Workflow automation with approval gates — coming in Phase 3.' },
}

export function AppShell() {
  const location = useLocation()
  const navigate  = useNavigate()

  const currentPage = (location.pathname.replace('/', '') || 'dashboard') as PageId
  const onNavigate  = (page: PageId) => navigate(`/${page}`)

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage onNavigate={onNavigate} />
      case 'profiles':  return <ProfilesPage />
      case 'reviews':   return <ReviewsPage />
      case 'agents':    return <AgentsPage />
      default: {
        const meta = PLACEHOLDERS[currentPage]
        if (!meta) return <DashboardPage onNavigate={onNavigate} />
        return <PlaceholderPage title={meta.title} iconName={meta.icon} description={meta.description} />
      }
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} />
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <ErrorBoundary>{renderPage()}</ErrorBoundary>
      </main>
    </div>
  )
}
