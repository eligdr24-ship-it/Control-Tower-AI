import type { PageId } from '@/types'
import { useAuth } from '@/context/useAuth'

interface NavItem { id: PageId; label: string; icon: string; badge?: number; badgeGreen?: boolean }

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  { title: 'Overview', items: [
    { id: 'dashboard', label: 'Mission Control',   icon: 'ti-layout-dashboard' },
    { id: 'profiles',  label: 'Business Profiles', icon: 'ti-building-store' },
  ]},
  { title: 'Manage', items: [
    { id: 'reviews', label: 'Reviews', icon: 'ti-star',  badge: 12 },
    { id: 'posts',   label: 'Posts',   icon: 'ti-news' },
    { id: 'media',   label: 'Media',   icon: 'ti-photo' },
  ]},
  { title: 'Intelligence', items: [
    { id: 'rankings', label: 'Rankings',       icon: 'ti-trophy' },
    { id: 'health',   label: 'Health Scanner', icon: 'ti-heart-rate-monitor', badge: 3, badgeGreen: true },
    { id: 'agents',   label: 'AI Agents',      icon: 'ti-robot' },
  ]},
  { title: 'Reports', items: [
    { id: 'reporting',  label: 'Reporting',  icon: 'ti-chart-bar' },
    { id: 'automation', label: 'Automation', icon: 'ti-bolt' },
  ]},
]

interface SidebarProps { currentPage: PageId; onNavigate: (page: PageId) => void }

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { user, logout } = useAuth()
  const initials = user ? user.name.split(' ').slice(0,2).map((w: string) => w[0] ?? '').join('').toUpperCase() : '?'

  return (
    <aside className="flex flex-col w-[220px] min-w-[220px] h-full overflow-hidden"
           style={{ background: '#0f1c2e' }}
           aria-label="Main navigation">

      <div className="flex items-center gap-2.5 px-4 py-[18px] border-b border-white/[0.08] shrink-0">
        <div className="w-[30px] h-[30px] rounded-[7px] bg-blue-500 flex items-center justify-center text-white shrink-0">
          <i className="ti ti-radar-2 text-[15px]" aria-hidden="true" />
        </div>
        <div>
          <div className="text-white text-[14px] font-medium leading-tight">Control Tower</div>
          <div className="text-white/40 text-[10px] mt-px">AI · Agency Platform</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-1.5">
        {NAV_GROUPS.map(group => (
          <div key={group.title} className="mb-1">
            <div className="text-white/30 text-[10px] uppercase tracking-[0.7px] px-4 pt-2.5 pb-1">{group.title}</div>
            {group.items.map(item => {
              const active = currentPage === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-2 w-[calc(100%-16px)] mx-2 my-px px-2 py-[7px] rounded-md text-[13px] transition-all duration-100 border-none cursor-pointer text-left
                    ${active ? 'bg-blue-500 text-white' : 'bg-transparent text-white/52 hover:bg-white/[0.07] hover:text-white/85'}`}
                >
                  <i className={`ti ${item.icon} text-[15px] w-[18px] text-center shrink-0`} aria-hidden="true" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge !== undefined && (
                    <span className={`text-[9px] font-semibold px-1.5 py-px rounded-full min-w-[18px] text-center shrink-0
                      ${active ? 'bg-white/25 text-white' : item.badgeGreen ? 'bg-emerald-500/85 text-white' : 'bg-red-500/85 text-white'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/[0.08] p-3">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.06]">
          <div className="w-7 h-7 rounded-md bg-violet-500 flex items-center justify-center text-white text-[11px] font-medium shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white/75 text-[12px] font-medium truncate">{user?.orgName ?? 'Agency'}</div>
            <div className="text-white/32 text-[10px] truncate">{user?.email}</div>
          </div>
          <button
            onClick={logout}
            className="text-white/30 hover:text-white/70 bg-none border-none cursor-pointer transition-colors shrink-0"
            aria-label="Sign out"
            title="Sign out"
          >
            <i className="ti ti-logout text-[14px]" aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  )
}
