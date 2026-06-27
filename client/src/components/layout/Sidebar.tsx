import type { PageId } from '@/types'
import { mockAgency, mockUser } from '@/data/mock'
import styles from './Sidebar.module.css'

interface NavItem {
  id: PageId
  label: string
  icon: string
  badge?: string | number
  badgeVariant?: 'red' | 'green'
}

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Overview',
    items: [
      { id: 'dashboard', label: 'Mission Control', icon: 'ti-layout-dashboard' },
      { id: 'profiles', label: 'Business Profiles', icon: 'ti-building-store', badge: 47 },
    ],
  },
  {
    title: 'Manage',
    items: [
      { id: 'reviews', label: 'Reviews', icon: 'ti-star', badge: 12, badgeVariant: 'red' },
      { id: 'posts', label: 'Posts', icon: 'ti-news' },
      { id: 'media', label: 'Media', icon: 'ti-photo' },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { id: 'rankings', label: 'Rankings', icon: 'ti-trophy' },
      { id: 'health', label: 'Health Scanner', icon: 'ti-heart-rate-monitor', badge: 3, badgeVariant: 'green' },
      { id: 'agents', label: 'AI Agents', icon: 'ti-robot' },
    ],
  },
  {
    title: 'Reports',
    items: [
      { id: 'reporting', label: 'Reporting', icon: 'ti-chart-bar' },
      { id: 'automation', label: 'Automation', icon: 'ti-bolt' },
    ],
  },
]

interface SidebarProps {
  currentPage: PageId
  onNavigate: (page: PageId) => void
}

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <aside className={styles.sidebar} aria-label="Main navigation">
      <div className={styles.logo}>
        <div className={styles.logoIcon} aria-hidden="true">
          <i className="ti ti-radar-2" />
        </div>
        <div>
          <div className={styles.logoText}>Control Tower</div>
          <div className={styles.logoSub}>AI · Agency Platform</div>
        </div>
      </div>

      <nav className={styles.nav}>
        {NAV_GROUPS.map(group => (
          <div key={group.title} className={styles.group}>
            <div className={styles.groupLabel}>{group.title}</div>
            {group.items.map(item => (
              <button
                key={item.id}
                className={`${styles.navItem} ${currentPage === item.id ? styles.active : ''}`}
                onClick={() => onNavigate(item.id)}
                aria-current={currentPage === item.id ? 'page' : undefined}
              >
                <i className={`ti ${item.icon}`} aria-hidden="true" />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`${styles.badge} ${item.badgeVariant === 'green' ? styles.badgeGreen : ''}`}
                    aria-label={`${item.badge} items`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className={styles.footer}>
        <div className={styles.agencyPill}>
          <div className={styles.agencyAvatar}>{mockUser.avatarInitials}</div>
          <div>
            <div className={styles.agencyName}>{mockAgency.name}</div>
            <div className={styles.agencyRole}>
              {mockUser.role.charAt(0).toUpperCase() + mockUser.role.slice(1)} · {mockAgency.profileCount} profiles
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
