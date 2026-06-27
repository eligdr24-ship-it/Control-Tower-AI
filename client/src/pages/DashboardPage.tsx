import { useQuery } from '@tanstack/react-query'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { KpiSkeleton, ReviewSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { dashboardKeys, fetchDashboard } from '@/api/queries'
import { timeAgo, positionToPercent } from '@/lib/utils'
import type { PageId, IssueSeverity, DashboardGoogleAccount } from '@/types'

const MOCK_RANKINGS = [
  { id: '1', keyword: 'emergency dentist',   position: 1 },
  { id: '2', keyword: 'bistro downtown',     position: 4 },
  { id: '3', keyword: 'auto repair near me', position: 6 },
  { id: '4', keyword: 'teeth whitening',     position: 2 },
  { id: '5', keyword: 'italian restaurant',  position: 11 },
]

const BRIEFING_TAGS = [
  { label: '3 critical issues',   color: 'red',   icon: 'ti-alert-triangle' },
  { label: '12 reviews pending',  color: 'amber', icon: 'ti-star' },
  { label: '8 rankings improved', color: 'green', icon: 'ti-trending-up' },
] as const

const severityVariant: Record<IssueSeverity, 'critical' | 'warning' | 'info'> = {
  critical: 'critical', warning: 'warning', info: 'info',
}

interface Props { onNavigate: (page: PageId) => void }

export function DashboardPage({ onNavigate }: Props) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: dashboardKeys.data(),
    queryFn:  fetchDashboard,
  })

  const now     = new Date()
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  const kpis = data ? [
    { label: 'Profiles managed',   value: data.kpis.totalProfiles,              change: '+4 this month',      trend: 'up'   as const },
    { label: 'Avg. star rating',   value: data.kpis.avgRating.toFixed(1),       change: '+0.2 vs last month', trend: 'up'   as const },
    { label: 'Reviews this month', value: data.kpis.totalReviews,               change: '+27% vs prior',      trend: 'up'   as const },
    { label: 'Health score',       value: `${data.kpis.avgHealthScore}%`,        change: `${data.kpis.pendingReviews} reviews pending`, trend: 'down' as const },
  ] : []

  const googleAccounts: DashboardGoogleAccount[] = data?.googleAccounts ?? []
  const connectedCount = googleAccounts.length

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title="Mission Control"
        subtitle={`${dateStr} · ${data?.kpis.totalProfiles ?? '…'} profiles active`}
        actions={
          <>
            <Button icon="ti-refresh" onClick={() => refetch()}>Refresh</Button>
            <Button variant="primary" icon="ti-plus" onClick={() => onNavigate('profiles')}>Add profile</Button>
          </>
        }
      />

      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">

        {/* Error state */}
        {isError && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-[13px]">
            <i className="ti ti-alert-circle text-[16px]" aria-hidden="true" />
            Failed to load dashboard: {error instanceof Error ? error.message : 'Unknown error'}
            <button onClick={() => refetch()} className="ml-auto text-[12px] underline">Retry</button>
          </div>
        )}

        {/* AI Morning Briefing */}
        <section
          className="rounded-xl p-4 border border-white/10 relative overflow-hidden shrink-0"
          style={{ background: 'linear-gradient(135deg, #162236 0%, #1e3352 100%)' }}
          aria-label="AI Morning Briefing"
        >
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981] animate-pulse" aria-hidden="true" />
            <span className="text-white/50 text-[11px] uppercase tracking-[0.6px]">AI Morning Briefing</span>
            <span className="text-white/30 text-[11px] ml-auto">
              {now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </span>
          </div>
          <p className="text-white/82 text-[13px] leading-relaxed">
            <strong className="text-white">Good morning.</strong>{' '}
            {isLoading
              ? 'Loading your portfolio summary…'
              : data
                ? `Your portfolio has ${data.kpis.totalProfiles} active profiles with a ${data.kpis.avgRating.toFixed(1)}★ average. ${data.kpis.pendingReviews} reviews are awaiting a reply. ${connectedCount > 0 ? `${connectedCount} Google account${connectedCount > 1 ? 's' : ''} connected.` : 'No Google accounts connected yet — connect one to start syncing.'}`
                : 'Connect your Google Business Profile account to get started.'
            }
          </p>
          <div className="flex gap-2 mt-3 flex-wrap">
            {BRIEFING_TAGS.map(tag => (
              <div key={tag.label}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] cursor-pointer border transition-opacity hover:opacity-80
                  ${tag.color === 'red'   ? 'bg-red-500/12 border-red-500/30 text-red-300'       : ''}
                  ${tag.color === 'amber' ? 'bg-amber-500/12 border-amber-500/30 text-amber-300'   : ''}
                  ${tag.color === 'green' ? 'bg-emerald-500/12 border-emerald-500/30 text-emerald-300' : ''}`}
              >
                <i className={`ti ${tag.icon} text-[11px]`} aria-hidden="true" />
                {tag.label}
              </div>
            ))}
          </div>
        </section>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-3" role="region" aria-label="Key performance indicators">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
            : kpis.map(kpi => (
                <div key={kpi.label} className="bg-white rounded-xl p-3.5 border border-gray-200">
                  <div className="text-[11px] text-gray-400 uppercase tracking-[0.4px] mb-1.5">{kpi.label}</div>
                  <div className="text-[24px] font-medium text-gray-900 leading-none">{kpi.value}</div>
                  <div className={`flex items-center gap-1 text-[11px] mt-1.5 ${kpi.trend === 'up' ? 'text-emerald-500' : 'text-red-400'}`}>
                    <i className={`ti ${kpi.trend === 'up' ? 'ti-trending-up' : 'ti-trending-down'} text-[11px]`} aria-hidden="true" />
                    {kpi.change}
                  </div>
                </div>
              ))
          }
        </div>

        {/* ── Requirement #6: Google account connection status ── */}
        <section aria-label="Connected Google accounts">
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-[13px] font-medium text-gray-900">Google account status</h2>
            <button
              className="text-[12px] text-blue-500 bg-none border-none cursor-pointer p-0"
              onClick={() => onNavigate('profiles')}
            >
              Manage →
            </button>
          </div>

          {isLoading ? (
            <div className="h-[60px] bg-white rounded-xl border border-gray-200 skeleton" />
          ) : googleAccounts.length === 0 ? (
            <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <i className="ti ti-brand-google text-amber-600 text-[14px]" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-amber-800">No Google account connected</div>
                <div className="text-[12px] text-amber-600 mt-0.5">Connect a Google account to import and sync your Business Profile locations.</div>
              </div>
              <Button size="sm" variant="primary" icon="ti-plug-connected" onClick={() => onNavigate('profiles')}>
                Connect
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {googleAccounts.map((ga: DashboardGoogleAccount) => (
                <div key={ga.id} className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[13px] font-semibold shrink-0">
                    {ga.email[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-gray-900 truncate">{ga.email}</span>
                      {ga.hasBusinessManageScope ? (
                        <span className="text-[10px] text-emerald-600 flex items-center gap-1 shrink-0">
                          <i className="ti ti-circle-check text-[11px]" aria-hidden="true" />
                          GBP access
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-600 flex items-center gap-1 shrink-0">
                          <i className="ti ti-alert-triangle text-[11px]" aria-hidden="true" />
                          Reconnect needed
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      {ga.profileCount} profile{ga.profileCount !== 1 ? 's' : ''} synced
                      {ga.lastSyncAt && ` · Last sync ${new Date(ga.lastSyncAt).toLocaleDateString()}`}
                    </div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" aria-label="Connected" />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Issues */}
        <section aria-label="Issues requiring action">
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-[13px] font-medium text-gray-900">Issues requiring action</h2>
            <button className="text-[12px] text-blue-500 bg-none border-none cursor-pointer p-0" onClick={() => onNavigate('health')}>
              View all →
            </button>
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-[60px] bg-white rounded-lg border border-gray-200 skeleton" />
              ))}
            </div>
          ) : (data?.issues ?? []).length === 0 ? (
            <EmptyState iconName="ti-circle-check" title="No issues" description="All profiles are healthy." />
          ) : (
            <div className="flex flex-col gap-2">
              {(data?.issues ?? []).map(issue => (
                <div key={issue.id} className="flex items-center gap-2.5 px-3.5 py-2.5 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all">
                  <div className={`w-[30px] h-[30px] rounded-[7px] flex items-center justify-center text-[14px] shrink-0
                    ${issue.severity === 'critical' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    <i className={`ti ${issue.iconName}`} aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-gray-900 truncate">{issue.title}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5 truncate">{issue.description}</div>
                  </div>
                  <Badge variant={severityVariant[issue.severity]}>
                    {issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Two-col panels */}
        <div className="grid grid-cols-2 gap-3">

          {/* Recent Reviews */}
          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden" aria-label="Recent reviews">
            <div className="flex items-center justify-between px-3.5 py-3 border-b border-gray-100">
              <span className="text-[13px] font-medium text-gray-900">Recent reviews</span>
              <button className="text-[12px] text-blue-500 bg-none border-none cursor-pointer p-0" onClick={() => onNavigate('reviews')}>
                All reviews →
              </button>
            </div>
            <div className="px-3.5">
              {isLoading
                ? Array.from({ length: 2 }).map((_, i) => <ReviewSkeleton key={i} />)
                : (data?.recentReviews ?? []).length === 0
                  ? <div className="py-8 text-center text-[12px] text-gray-400">No pending reviews</div>
                  : (data?.recentReviews ?? []).slice(0, 2).map(review => (
                      <div key={review.id} className="flex gap-2.5 py-2.5 border-b border-gray-100 last:border-0">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-medium text-white shrink-0"
                          style={{ background: review.businessAvatarColor }}>
                          {review.businessAvatarInitials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex gap-0.5 mb-1" aria-label={`${review.rating} out of 5 stars`}>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span key={i} className={`text-[11px] ${i < review.rating ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
                            ))}
                          </div>
                          <div className="text-[12px] text-gray-600 leading-snug truncate">"{review.text}"</div>
                          <div className="text-[11px] text-gray-400 mt-0.5">
                            {review.businessName} · {timeAgo(review.publishedAt)} · {review.authorName}
                          </div>
                          <div className="flex gap-1.5 mt-1.5">
                            <Button size="sm" variant="primary" onClick={() => onNavigate('reviews')}>AI reply</Button>
                            <Button size="sm">Ignore</Button>
                          </div>
                        </div>
                      </div>
                    ))
              }
            </div>
          </section>

          {/* Rankings */}
          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden" aria-label="Top keyword rankings">
            <div className="flex items-center justify-between px-3.5 py-3 border-b border-gray-100">
              <span className="text-[13px] font-medium text-gray-900">Top keyword rankings</span>
              <button className="text-[12px] text-blue-500 bg-none border-none cursor-pointer p-0" onClick={() => onNavigate('rankings')}>
                Full report →
              </button>
            </div>
            <div className="px-3.5 py-3 flex flex-col gap-2.5">
              {MOCK_RANKINGS.map(r => (
                <div key={r.id} className="flex items-center gap-2">
                  <span className="text-[12px] text-gray-600 min-w-[120px] truncate">{r.keyword}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden"
                    role="meter" aria-valuenow={r.position} aria-valuemin={1} aria-valuemax={20}>
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${positionToPercent(r.position)}%` }} />
                  </div>
                  <span className="text-[11px] text-gray-400 min-w-[28px] text-right">#{r.position}</span>
                </div>
              ))}
              <div className="flex flex-col items-center justify-center gap-1.5 p-4 mt-1 bg-gray-50 rounded-lg border border-gray-200 text-center">
                <i className="ti ti-map-2 text-[22px] text-gray-300" aria-hidden="true" />
                <p className="text-[11px] text-gray-400">Geo-grid map · 5×5 ranking visualization</p>
                <Button size="sm" onClick={() => onNavigate('rankings')}>View geo-grid</Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
