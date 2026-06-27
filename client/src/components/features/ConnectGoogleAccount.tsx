/**
 * ConnectGoogleAccount
 *
 * Shows all Google accounts connected to this organization.
 * Lets the user:
 *   - Connect a new Google account via OAuth
 *   - Trigger GBP location discovery for a connected account
 *   - View the last sync time and profile count
 *   - View sync job history
 *   - Disconnect an account
 *
 * Security note:
 *   The OAuth URL is fetched from the server — GOOGLE_CLIENT_SECRET
 *   never touches the frontend. The server builds the URL and returns it.
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  googleAccountKeys, profileKeys,
  fetchGoogleAccounts, fetchGoogleConnectUrl,
  discoverGbpProfiles, disconnectGoogleAccount,
  fetchSyncJobs,
} from '@/api/queries'
import { Button }  from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import type { GoogleAccount, SyncJob } from '@/types'

export function ConnectGoogleAccount() {
  const qc = useQueryClient()
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null)

  const { data: accounts = [], isLoading, isError } = useQuery({
    queryKey: googleAccountKeys.list(),
    queryFn:  fetchGoogleAccounts,
  })

  // ── Connect: fetch URL from server then redirect ──────────
  // The GOOGLE_CLIENT_SECRET never leaves the server.
  const connectMutation = useMutation({
    mutationFn: fetchGoogleConnectUrl,
    onSuccess: ({ url }) => {
      window.location.href = url
    },
    onError: (err: Error) => {
      const isNotConfigured = err.message.includes('NOT_CONFIGURED') || err.message.includes('not configured')
      if (isNotConfigured) {
        alert(
          'Google OAuth is not configured on this server.\n\n' +
          'Add these to your server .env file:\n' +
          '  GOOGLE_CLIENT_ID\n' +
          '  GOOGLE_CLIENT_SECRET\n' +
          '  GOOGLE_REDIRECT_URI\n\n' +
          'Then enable the My Business APIs in Google Cloud Console.'
        )
      } else {
        alert(`Could not start Google connection: ${err.message}`)
      }
    },
  })

  // ── Discover: trigger GBP API → upsert business_profiles ─
  const discoverMutation = useMutation({
    mutationFn: discoverGbpProfiles,
    onSuccess: (_result, accountId) => {
      void qc.invalidateQueries({ queryKey: profileKeys.all })
      void qc.invalidateQueries({ queryKey: googleAccountKeys.list() })
      void qc.invalidateQueries({ queryKey: googleAccountKeys.syncJobs(accountId) })
    },
    onError: (err: Error) => {
      alert(`Discovery failed: ${err.message}`)
    },
  })

  // ── Disconnect: POST /auth/google/disconnect ──────────────
  const disconnectMutation = useMutation({
    mutationFn: disconnectGoogleAccount,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: googleAccountKeys.list() })
      void qc.invalidateQueries({ queryKey: profileKeys.all })
      setExpandedAccountId(null)
    },
    onError: (err: Error) => {
      alert(`Disconnect failed: ${err.message}`)
    },
  })

  const handleDisconnect = (account: GoogleAccount) => {
    if (!confirm(
      `Disconnect ${account.email}?\n\n` +
      `Your ${pluralize('business profile')} imported from this account will remain, ` +
      `but live sync will stop. You can reconnect at any time.`
    )) return
    disconnectMutation.mutate(account.id)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div>
          <div className="text-[13px] font-medium text-gray-900">Connected Google accounts</div>
          <div className="text-[11px] text-gray-400 mt-0.5">
            Import and sync your Google Business Profile locations
          </div>
        </div>
        <Button
          variant="primary"
          icon="ti-brand-google"
          onClick={() => connectMutation.mutate()}
          disabled={connectMutation.isPending}
        >
          {connectMutation.isPending ? 'Redirecting to Google…' : 'Connect Google account'}
        </Button>
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="px-4 py-3 flex flex-col gap-2">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>

      ) : isError ? (
        <div className="px-4 py-6 text-center text-[13px] text-red-500">
          Failed to load connected accounts.
        </div>

      ) : accounts.length === 0 ? (
        <EmptyAccountsState onConnect={() => connectMutation.mutate()} connecting={connectMutation.isPending} />

      ) : (
        <div className="divide-y divide-gray-100">
          {accounts.map(account => (
            <AccountRow
              key={account.id}
              account={account}
              isDiscovering={discoverMutation.isPending && discoverMutation.variables === account.id}
              isExpanded={expandedAccountId === account.id}
              onDiscover={() => discoverMutation.mutate(account.id)}
              onDisconnect={() => handleDisconnect(account)}
              onToggleExpand={() =>
                setExpandedAccountId(prev => prev === account.id ? null : account.id)
              }
            />
          ))}

          {/* Add another account */}
          <div className="px-4 py-2.5">
            <button
              onClick={() => connectMutation.mutate()}
              disabled={connectMutation.isPending}
              className="flex items-center gap-1.5 text-[12px] text-blue-500 hover:text-blue-600 bg-none border-none cursor-pointer font-[inherit] p-0 disabled:opacity-50"
            >
              <i className="ti ti-plus text-[13px]" aria-hidden="true" />
              Add another Google account
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────

function EmptyAccountsState({ onConnect, connecting }: { onConnect: () => void; connecting: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center gap-3">
      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
        <i className="ti ti-brand-google text-[22px] text-gray-400" aria-hidden="true" />
      </div>
      <div>
        <div className="text-[13px] font-medium text-gray-600">No Google accounts connected</div>
        <p className="text-[12px] text-gray-400 mt-0.5 max-w-xs leading-relaxed">
          Connect your Google account to automatically import and sync your Business Profile locations.
        </p>
      </div>
      <Button variant="primary" icon="ti-brand-google" onClick={onConnect} disabled={connecting}>
        {connecting ? 'Redirecting to Google…' : 'Connect Google account'}
      </Button>
    </div>
  )
}

interface AccountRowProps {
  account:       GoogleAccount
  isDiscovering: boolean
  isExpanded:    boolean
  onDiscover:    () => void
  onDisconnect:  () => void
  onToggleExpand: () => void
}

function AccountRow({
  account, isDiscovering, isExpanded, onDiscover, onDisconnect, onToggleExpand,
}: AccountRowProps) {
  const hasGbpScope = account.scopes.includes('https://www.googleapis.com/auth/business.manage')

  return (
    <div>
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[14px] font-semibold shrink-0">
          {account.email[0].toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium text-gray-900 truncate">{account.email}</div>
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            <span className="flex items-center gap-1 text-[11px] text-emerald-600">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
              Connected
            </span>
            {!hasGbpScope && (
              <span className="text-[11px] text-amber-600 flex items-center gap-1">
                <i className="ti ti-alert-triangle text-[11px]" aria-hidden="true" />
                Missing GBP scope — reconnect
              </span>
            )}
            {account.lastSyncAt && (
              <span className="text-[11px] text-gray-400">
                · Last synced {new Date(account.lastSyncAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="primary"
            icon="ti-refresh"
            onClick={onDiscover}
            disabled={isDiscovering || !hasGbpScope}
            title={!hasGbpScope ? 'Reconnect account to grant GBP access' : 'Sync locations from Google'}
          >
            {isDiscovering ? 'Syncing…' : 'Sync profiles'}
          </Button>

          <button
            onClick={onToggleExpand}
            className="text-gray-400 hover:text-gray-600 bg-none border-none cursor-pointer p-1"
            aria-label="Show details"
          >
            <i className={`ti ${isExpanded ? 'ti-chevron-up' : 'ti-chevron-down'} text-[14px]`} />
          </button>

          <button
            onClick={onDisconnect}
            className="text-gray-400 hover:text-red-500 bg-none border-none cursor-pointer p-1 transition-colors"
            aria-label="Disconnect account"
            title="Disconnect this Google account"
          >
            <i className="ti ti-unlink text-[14px]" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Expanded sync job history */}
      {isExpanded && <SyncJobHistory accountId={account.id} />}
    </div>
  )
}

function SyncJobHistory({ accountId }: { accountId: string }) {
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: googleAccountKeys.syncJobs(accountId),
    queryFn:  () => fetchSyncJobs(accountId),
  })

  const statusColor: Record<string, string> = {
    COMPLETED: 'text-emerald-600',
    RUNNING:   'text-blue-500',
    FAILED:    'text-red-500',
    PENDING:   'text-gray-400',
  }

  return (
    <div className="px-4 pb-3 bg-gray-50 border-t border-gray-100">
      <div className="text-[11px] font-medium text-gray-500 py-2">Sync history</div>
      {isLoading ? (
        <Skeleton className="h-8 w-full" />
      ) : jobs.length === 0 ? (
        <div className="text-[12px] text-gray-400 py-1">No syncs yet. Click "Sync profiles" to start.</div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {jobs.slice(0, 5).map((job: SyncJob) => (
            <div key={job.id} className="flex items-center gap-3 text-[11px]">
              <span className={`font-medium ${statusColor[job.status] ?? 'text-gray-500'}`}>
                {job.status}
              </span>
              <span className="text-gray-400">{job.type}</span>
              {job.recordsProcessed > 0 && (
                <span className="text-gray-500">{job.recordsProcessed} profiles</span>
              )}
              {job.completedAt && (
                <span className="text-gray-400 ml-auto">
                  {new Date(job.completedAt).toLocaleDateString()}
                </span>
              )}
              {job.errorMessage && (
                <span className="text-red-400 ml-auto truncate max-w-[200px]" title={job.errorMessage}>
                  {job.errorMessage}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function pluralize(word: string, count = 0): string {
  return count === 1 ? word : `${word}s`
}
