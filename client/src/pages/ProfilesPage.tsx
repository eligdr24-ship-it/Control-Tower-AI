import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { ConnectGoogleAccount } from '@/components/features/ConnectGoogleAccount'
import { profileKeys, fetchProfiles } from '@/api/queries'
import { formatNumber } from '@/lib/utils'
import type { BusinessProfile, HealthLevel } from '@/types'

type Filter = 'all' | 'good' | 'warning' | 'critical'

const healthLabel: Record<HealthLevel, string> = { good: 'Healthy', warning: 'Warning', critical: 'Critical' }
const healthStyle: Record<HealthLevel, string> = {
  good:     'bg-emerald-500/12 text-emerald-600 border-emerald-500/30',
  warning:  'bg-amber-500/12 text-amber-600 border-amber-500/30',
  critical: 'bg-red-500/12 text-red-500 border-red-500/30',
}

export function ProfilesPage() {
  const location  = useLocation()
  const navigate  = useNavigate()
  const [filter, setFilter]  = useState<Filter>('all')
  const [search, setSearch]  = useState('')
  const [page,   setPage]    = useState(1)
  const [showConnect, setShowConnect] = useState(false)
  const [oauthBanner, setOauthBanner] = useState<'success'|'denied'|'error'|null>(null)
  const pageSize = 12

  // Handle OAuth callback result (?oauth=success|denied|error)
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const oauth  = params.get('oauth') as typeof oauthBanner
    if (oauth) {
      setOauthBanner(oauth)
      if (oauth === 'success') setShowConnect(true)
      navigate('/profiles', { replace: true })
    }
  }, [location.search, navigate])

  const params = {
    page, pageSize,
    ...(filter !== 'all' && { health: filter }),
    ...(search.trim()   && { search: search.trim() }),
  }

  const { data, isLoading, isError, error } = useQuery({
    queryKey: profileKeys.list(params),
    queryFn:  () => fetchProfiles(params),
    placeholderData: prev => prev,
  })

  const profiles = data?.data ?? []
  const total    = data?.meta.total ?? 0

  const handleFilter = (f: Filter) => { setFilter(f); setPage(1) }
  const handleSearch = (s: string) => { setSearch(s);  setPage(1) }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title="Business profiles"
        subtitle={`${total} profiles`}
        actions={
          <>
            <Button icon="ti-plug-connected" onClick={() => setShowConnect(v => !v)}>
              {showConnect ? 'Hide' : 'Connect'} Google account
            </Button>
            <Button variant="primary" icon="ti-plus">Add manual profile</Button>
          </>
        }
      />

      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3.5">

        {/* OAuth result banner */}
        {oauthBanner === 'success' && (
          <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-[13px]">
            <i className="ti ti-circle-check text-[16px]" aria-hidden="true" />
            Google account connected! Click "Discover profiles" to import your GBP locations.
            <button onClick={() => setOauthBanner(null)} className="ml-auto text-emerald-500 hover:text-emerald-700 bg-none border-none cursor-pointer">
              <i className="ti ti-x" aria-hidden="true" />
            </button>
          </div>
        )}
        {(oauthBanner === 'denied' || oauthBanner === 'error') && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-[13px]">
            <i className="ti ti-alert-circle text-[16px]" aria-hidden="true" />
            {oauthBanner === 'denied' ? 'Google account connection was cancelled.' : 'Google account connection failed. Please try again.'}
            <button onClick={() => setOauthBanner(null)} className="ml-auto text-red-400 hover:text-red-600 bg-none border-none cursor-pointer">
              <i className="ti ti-x" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Connect Google Account panel */}
        {showConnect && <ConnectGoogleAccount />}

        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg">
          <i className="ti ti-search text-[16px] text-gray-400" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search profiles, locations, categories…"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="flex-1 border-none bg-transparent outline-none text-[13px] text-gray-900 placeholder-gray-400"
            aria-label="Search profiles"
          />
          {search && (
            <button onClick={() => handleSearch('')} className="text-gray-400 hover:text-gray-600 bg-none border-none cursor-pointer">
              <i className="ti ti-x text-[14px]" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 p-1 bg-gray-100 rounded-lg border border-gray-200" role="tablist">
          {(['all', 'good', 'warning', 'critical'] as Filter[]).map(f => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              onClick={() => handleFilter(f)}
              className={`flex-1 px-3.5 py-1.5 rounded-md text-[12px] font-[inherit] cursor-pointer border-none transition-all
                ${filter === f ? 'bg-white text-gray-900 font-medium shadow-sm' : 'bg-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {f === 'all' ? `All (${total})` : healthLabel[f as HealthLevel]}
            </button>
          ))}
        </div>

        {isError && (
          <div className="text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            Failed to load profiles: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 gap-2.5">
            {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : profiles.length === 0 ? (
          <EmptyState
            iconName="ti-building-store"
            title={search ? 'No profiles match your search' : 'No profiles yet'}
            description={
              search
                ? `No profiles found for "${search}"`
                : 'Connect a Google account above to import your Business Profile locations, or add a profile manually.'
            }
            action={
              search
                ? <Button onClick={() => handleSearch('')}>Clear search</Button>
                : <Button variant="primary" icon="ti-plug-connected" onClick={() => setShowConnect(true)}>Connect Google account</Button>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2.5">
              {profiles.map(p => <ProfileCard key={p.id} profile={p} />)}
            </div>

            {data && data.meta.totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 text-[12px] text-gray-500">
                <span>Page {data.meta.page} of {data.meta.totalPages} ({total} total)</span>
                <div className="flex gap-2">
                  <Button size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
                  <Button size="sm" disabled={page >= data.meta.totalPages} onClick={() => setPage(p => p + 1)}>Next →</Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function ProfileCard({ profile }: { profile: BusinessProfile }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3.5 cursor-pointer hover:border-blue-400 transition-colors">
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-[13px] font-medium text-white shrink-0"
          style={{ background: profile.avatarColor }}
          aria-hidden="true"
        >
          {profile.avatarInitials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium text-gray-900 truncate">{profile.name}</div>
          <div className="text-[11px] text-gray-400 mt-0.5 truncate">{profile.category} · {profile.location}</div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${healthStyle[profile.healthLevel]}`}>
            {profile.healthScore}%
          </span>
          {profile.isVerified && (
            <span className="text-[10px] text-emerald-600 flex items-center gap-0.5">
              <i className="ti ti-circle-check text-[11px]" aria-hidden="true" /> Verified
            </span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
        <div>
          <div className="text-[15px] font-medium text-gray-900">{profile.rating > 0 ? `${profile.rating}★` : '—'}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Rating</div>
        </div>
        <div>
          <div className="text-[15px] font-medium text-gray-900">{profile.reviewCount}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Reviews</div>
        </div>
        <div>
          <div className="text-[15px] font-medium text-gray-900">{formatNumber(profile.monthlyViews)}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Views/mo</div>
        </div>
      </div>
    </div>
  )
}
