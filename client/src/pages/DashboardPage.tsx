import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { KpiSkeleton } from '@/components/ui/LoadingSkeleton'
import { mockBriefing, mockKpis, mockIssues, mockReviews, mockRankings } from '@/data/mock'
import { timeAgo, positionToPercent } from '@/lib/utils'
import type { PageId, IssueSeverity } from '@/types'
import { useAsync } from '@/hooks/useAsync'
import styles from './DashboardPage.module.css'

// Simulates network latency — replace with real fetch() in future sprints
const fetchDashboard = (): Promise<boolean> =>
  new Promise(resolve => setTimeout(() => resolve(true), 600))

interface DashboardPageProps {
  onNavigate: (page: PageId) => void
}

const severityToVariant: Record<IssueSeverity, 'critical' | 'warning' | 'info'> = {
  critical: 'critical',
  warning: 'warning',
  info: 'info',
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { loading } = useAsync(fetchDashboard)

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className={styles.page}>
      <TopBar
        title="Mission Control"
        subtitle={`${dateStr} · 47 profiles active`}
        actions={
          <>
            <Button icon="ti-refresh" onClick={() => window.location.reload()}>Refresh</Button>
            <Button variant="primary" icon="ti-plus" onClick={() => onNavigate('profiles')}>Add profile</Button>
          </>
        }
      />

      <div className={styles.content}>
        {/* AI Morning Briefing */}
        <section className={styles.briefingCard} aria-label="AI Morning Briefing">
          <div className={styles.briefingHeader}>
            <div className={styles.briefingDot} aria-hidden="true" />
            <span className={styles.briefingLabel}>AI Morning Briefing</span>
            <span className={styles.briefingTime}>
              {now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </span>
          </div>
          <p className={styles.briefingText}>
            <strong style={{ color: '#fff' }}>Good morning.</strong>{' '}
            {mockBriefing.summary}
          </p>
          <div className={styles.briefingTags}>
            {mockBriefing.tags.map(tag => (
              <div key={tag.label} className={`${styles.briefingTag} ${styles[tag.color]}`}>
                <i className={`ti ${tag.iconName}`} aria-hidden="true" />
                {tag.label}
              </div>
            ))}
          </div>
        </section>

        {/* KPIs */}
        <div className={styles.kpiGrid} role="region" aria-label="Key performance indicators">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
            : mockKpis.map(kpi => (
                <div key={kpi.label} className={styles.kpiCard}>
                  <div className={styles.kpiLabel}>{kpi.label}</div>
                  <div className={styles.kpiValue}>{kpi.value}</div>
                  <div className={`${styles.kpiChange} ${styles[kpi.trend]}`}>
                    <i
                      className={`ti ${kpi.trend === 'up' ? 'ti-trending-up' : 'ti-trending-down'}`}
                      aria-hidden="true"
                    />
                    {kpi.change}
                  </div>
                </div>
              ))}
        </div>

        {/* Issues */}
        <section aria-label="Issues requiring action">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Issues requiring action</h2>
            <button className={styles.sectionLink} onClick={() => onNavigate('health')}>
              View all →
            </button>
          </div>
          <div className={styles.issuesList}>
            {mockIssues.map(issue => (
              <div key={issue.id} className={styles.issueItem}>
                <div className={`${styles.issueIcon} ${styles[issue.severity]}`} aria-hidden="true">
                  <i className={`ti ${issue.iconName}`} />
                </div>
                <div className={styles.issueBody}>
                  <div className={styles.issueTitle}>{issue.title}</div>
                  <div className={styles.issueSub}>{issue.description}</div>
                </div>
                <Badge variant={severityToVariant[issue.severity]}>
                  {issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
                </Badge>
              </div>
            ))}
          </div>
        </section>

        {/* Two-col panels */}
        <div className={styles.twoCol}>
          {/* Recent Reviews */}
          <section className={styles.panel} aria-label="Recent reviews">
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>Recent reviews</span>
              <button className={styles.sectionLink} onClick={() => onNavigate('reviews')}>
                All reviews →
              </button>
            </div>
            <div className={styles.reviewsList}>
              {mockReviews.slice(0, 2).map(review => (
                <div key={review.id} className={styles.reviewItem}>
                  <div
                    className={styles.reviewAvatar}
                    style={{ background: review.businessAvatarColor }}
                    aria-hidden="true"
                  >
                    {review.businessAvatarInitials}
                  </div>
                  <div className={styles.reviewBody}>
                    <div className={styles.reviewStars} aria-label={`${review.rating} out of 5 stars`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={i < review.rating ? styles.starFilled : styles.starEmpty}>
                          ★
                        </span>
                      ))}
                    </div>
                    <div className={styles.reviewText}>{review.text}</div>
                    <div className={styles.reviewMeta}>
                      {review.businessName} · {timeAgo(review.publishedAt)} · {review.authorName}
                    </div>
                    <div className={styles.reviewActions}>
                      <Button size="sm" variant="primary">AI reply</Button>
                      <Button size="sm">Ignore</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Rankings */}
          <section className={styles.panel} aria-label="Top keyword rankings">
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>Top keyword rankings</span>
              <button className={styles.sectionLink} onClick={() => onNavigate('rankings')}>
                Full report →
              </button>
            </div>
            <div className={styles.rankingList}>
              {mockRankings.map(r => (
                <div key={r.id} className={styles.rankingBar}>
                  <span className={styles.rankingKw}>{r.keyword}</span>
                  <div className={styles.rankingTrack} role="meter" aria-valuenow={r.position} aria-valuemin={1} aria-valuemax={20} aria-label={`Position ${r.position}`}>
                    <div
                      className={styles.rankingFill}
                      style={{ width: `${positionToPercent(r.position)}%` }}
                    />
                  </div>
                  <span className={styles.rankingPos}>#{r.position}</span>
                </div>
              ))}
              <div className={styles.geoPlaceholder}>
                <i className="ti ti-map-2" aria-hidden="true" />
                <p>Geo-grid map · 5×5 ranking visualization</p>
                <Button size="sm" onClick={() => onNavigate('rankings')}>View geo-grid</Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
