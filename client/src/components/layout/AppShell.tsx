import { Sidebar } from './Sidebar'
import { useNavigation } from '@/hooks/useNavigation'
import { DashboardPage } from '@/pages/DashboardPage'
import { ProfilesPage } from '@/pages/ProfilesPage'
import { ReviewsPage } from '@/pages/ReviewsPage'
import { AgentsPage } from '@/pages/AgentsPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import type { PageId } from '@/types'
import styles from './AppShell.module.css'

const PAGE_TITLES: Record<PageId, { title: string; icon: string; description: string }> = {
  posts: { title: 'Google Posts', icon: 'ti-news', description: 'AI-powered content creation for all your profiles' },
  media: { title: 'Media Manager', icon: 'ti-photo', description: 'Bulk photo & video management with AI optimization' },
  rankings: { title: 'Ranking Engine', icon: 'ti-trophy', description: 'Local SEO positions with geo-grid visualization' },
  health: { title: 'Health Scanner', icon: 'ti-heart-rate-monitor', description: '40+ checks for GBP completeness and compliance' },
  reporting: { title: 'Reporting', icon: 'ti-chart-bar', description: 'Automated white-label client reports with AI insights' },
  automation: { title: 'Automation', icon: 'ti-bolt', description: 'Workflows and scheduled tasks with approval gates' },
  dashboard: { title: '', icon: '', description: '' },
  profiles: { title: '', icon: '', description: '' },
  reviews: { title: '', icon: '', description: '' },
  agents: { title: '', icon: '', description: '' },
}

export function AppShell() {
  const { currentPage, navigate } = useNavigation()

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onNavigate={navigate} />
      case 'profiles':
        return <ProfilesPage />
      case 'reviews':
        return <ReviewsPage />
      case 'agents':
        return <AgentsPage />
      default: {
        const meta = PAGE_TITLES[currentPage]
        return (
          <PlaceholderPage
            title={meta.title}
            iconName={meta.icon}
            description={meta.description}
          />
        )
      }
    }
  }

  return (
    <div className={styles.shell}>
      <Sidebar currentPage={currentPage} onNavigate={navigate} />
      <main className={styles.main} id="main-content">
        {renderPage()}
      </main>
    </div>
  )
}
