import { useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { CardSkeleton } from '@/components/ui/LoadingSkeleton'
import { useAsync } from '@/hooks/useAsync'
import { mockProfiles } from '@/data/mock'
import { formatNumber } from '@/lib/utils'
import type { BusinessProfile, HealthLevel } from '@/types'
import styles from './ProfilesPage.module.css'

type Filter = 'all' | 'good' | 'warning' | 'critical'

const fetchProfiles = () =>
  new Promise<BusinessProfile[]>(resolve =>
    setTimeout(() => resolve(mockProfiles), 500)
  )

const healthLabel: Record<HealthLevel, string> = {
  good: 'Healthy',
  warning: 'Warning',
  critical: 'Critical',
}

export function ProfilesPage() {
  const { data: profiles, loading } = useAsync(fetchProfiles)
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')

  const filtered = (profiles ?? []).filter(p => {
    const matchesFilter = filter === 'all' || p.healthLevel === filter
    const matchesSearch =
      search === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const counts = {
    all: (profiles ?? []).length,
    good: (profiles ?? []).filter(p => p.healthLevel === 'good').length,
    warning: (profiles ?? []).filter(p => p.healthLevel === 'warning').length,
    critical: (profiles ?? []).filter(p => p.healthLevel === 'critical').length,
  }

  return (
    <div className={styles.page}>
      <TopBar
        title="Business profiles"
        subtitle={`${counts.all} profiles · 6 clients`}
        actions={
          <>
            <Button icon="ti-upload">Import CSV</Button>
            <Button variant="primary" icon="ti-plus">Connect account</Button>
          </>
        }
      />

      <div className={styles.content}>
        <div className={styles.searchBar}>
          <i className="ti ti-search" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search profiles, locations, categories…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search profiles"
          />
        </div>

        <div className={styles.tabRow} role="tablist" aria-label="Filter profiles">
          {(['all', 'good', 'warning', 'critical'] as Filter[]).map(f => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              className={`${styles.tab} ${filter === f ? styles.tabActive : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? `All (${counts.all})` : `${healthLabel[f as HealthLevel]} (${counts[f]})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className={styles.grid}>
            {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            iconName="ti-building-store"
            title="No profiles found"
            description={search ? `No profiles match "${search}"` : 'No profiles in this category yet.'}
            action={search ? <Button onClick={() => setSearch('')}>Clear search</Button> : undefined}
          />
        ) : (
          <div className={styles.grid}>
            {filtered.map(profile => (
              <ProfileCard key={profile.id} profile={profile} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ProfileCard({ profile }: { profile: BusinessProfile }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div
          className={styles.avatar}
          style={{ background: profile.avatarColor }}
          aria-hidden="true"
        >
          {profile.avatarInitials}
        </div>
        <div className={styles.cardInfo}>
          <div className={styles.cardName}>{profile.name}</div>
          <div className={styles.cardCat}>{profile.category} · {profile.location}</div>
        </div>
        <div className={`${styles.healthScore} ${styles[profile.healthLevel]}`}>
          {profile.healthScore}%
        </div>
      </div>
      <div className={styles.stats}>
        <div>
          <div className={styles.statVal}>{profile.rating}★</div>
          <div className={styles.statLbl}>Rating</div>
        </div>
        <div>
          <div className={styles.statVal}>{profile.reviewCount}</div>
          <div className={styles.statLbl}>Reviews</div>
        </div>
        <div>
          <div className={styles.statVal}>{formatNumber(profile.monthlyViews)}</div>
          <div className={styles.statLbl}>Views/mo</div>
        </div>
      </div>
    </div>
  )
}
