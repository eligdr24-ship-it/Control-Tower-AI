import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ReviewSkeleton } from '@/components/ui/Skeleton'
import { reviewKeys, fetchReviews, postReviewReply, updateReviewStatus } from '@/api/queries'
import { timeAgo } from '@/lib/utils'
import type { Review } from '@/types'

type TabFilter = 'pending_reply' | 'low' | 'mid' | 'high'

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`text-[12px] ${i < rating ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
      ))}
    </div>
  )
}

export function ReviewsPage() {
  const qc = useQueryClient()
  const [tab, setTab]         = useState<TabFilter>('pending_reply')
  const [drafts, setDrafts]   = useState<Record<string, string>>({})

  const statusParam = tab === 'pending_reply' ? 'PENDING_REPLY' : undefined

  const { data, isLoading, isError } = useQuery({
    queryKey: reviewKeys.list({ status: statusParam }),
    queryFn:  () => fetchReviews({ status: statusParam, pageSize: 50 }),
  })

  const replyMutation = useMutation({
    mutationFn: ({ reviewId, text }: { reviewId: string; text: string }) =>
      postReviewReply(reviewId, { text, isAiDraft: true }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: reviewKeys.all })
    },
  })

  const ignoreMutation = useMutation({
    mutationFn: (reviewId: string) => updateReviewStatus(reviewId, 'IGNORED'),
    onSuccess:  () => { void qc.invalidateQueries({ queryKey: reviewKeys.all }) },
  })

  const allReviews: Review[] = data?.data ?? []

  const filtered = allReviews.filter(r => {
    if (tab === 'pending_reply') return r.status === 'pending_reply'
    if (tab === 'low')  return r.rating <= 2
    if (tab === 'mid')  return r.rating === 3
    if (tab === 'high') return r.rating >= 4
    return true
  })

  const pendingCount = allReviews.filter(r => r.status === 'pending_reply').length

  const loadDraft = (review: Review) => {
    // In Phase 3 this calls the Anthropic API; for now use a template
    const templates: Record<number, string> = {
      1: `Thank you for your feedback${review.authorName ? `, ${review.authorName.split(' ')[0]}` : ''}. We're sorry to hear about your experience and would love the opportunity to make it right. Please reach out to us directly so we can address your concerns.`,
      2: `Thank you for taking the time to leave a review. We're sorry your experience didn't meet your expectations. We'd love to hear more — please contact us so we can improve.`,
      3: `Thank you for your feedback! We're glad parts of your experience were positive and are always working to do better. We hope to serve you again soon.`,
      4: `Thank you so much for the kind words! We really appreciate you taking the time to share your experience. Hope to see you again soon!`,
      5: `Wow, thank you for the amazing review${review.authorName ? `, ${review.authorName.split(' ')[0]}` : ''}! Your kind words mean the world to our team. We look forward to welcoming you back!`,
    }
    setDrafts(d => ({ ...d, [review.id]: templates[review.rating] ?? '' }))
  }

  const submitReply = (reviewId: string) => {
    const text = drafts[reviewId]
    if (!text?.trim()) return
    replyMutation.mutate({ reviewId, text })
    setDrafts(d => { const n = { ...d }; delete n[reviewId]; return n })
  }

  const TABS = [
    { id: 'pending_reply' as TabFilter, label: `Pending (${pendingCount})` },
    { id: 'low'           as TabFilter, label: '1–2 stars' },
    { id: 'mid'           as TabFilter, label: '3 stars' },
    { id: 'high'          as TabFilter, label: '4–5 stars' },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title="Reviews"
        subtitle={`${data?.meta.total ?? '…'} total · ${pendingCount} awaiting reply`}
        actions={
          <Button variant="primary" icon="ti-robot">AI bulk reply</Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3.5">

        {/* Tabs */}
        <div className="flex gap-0.5 p-1 bg-gray-100 rounded-lg border border-gray-200" role="tablist">
          {TABS.map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 px-3.5 py-1.5 rounded-md text-[12px] font-[inherit] cursor-pointer border-none transition-all
                ${tab === t.id ? 'bg-white text-gray-900 font-medium shadow-sm' : 'bg-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {isError && (
          <div className="text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            Failed to load reviews.
          </div>
        )}

        {/* Review list */}
        {isLoading ? (
          <div className="bg-white rounded-xl border border-gray-200 px-3.5">
            {Array.from({ length: 3 }).map((_, i) => <ReviewSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            iconName="ti-star-off"
            title="No reviews in this category"
            description="All caught up! Switch to another tab to see more reviews."
          />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {filtered.map(review => (
              <div key={review.id} className="flex gap-3 px-3.5 py-3.5 border-b border-gray-100 last:border-0">
                <div className="w-[34px] h-[34px] rounded-lg flex items-center justify-center text-[11px] font-medium text-white shrink-0"
                  style={{ background: review.businessAvatarColor }}>
                  {review.businessAvatarInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <Stars rating={review.rating} />
                    <span className="text-[11px] text-gray-400">{timeAgo(review.publishedAt)}</span>
                  </div>
                  <p className="text-[13px] text-gray-700 leading-snug">"{review.text}"</p>
                  <div className="text-[11px] text-gray-400 mt-1">
                    {review.businessName} · {review.authorName}
                  </div>

                  {/* Reply draft area */}
                  {drafts[review.id] !== undefined ? (
                    <div className="mt-3 flex flex-col gap-2">
                      <textarea
                        value={drafts[review.id]}
                        onChange={e => setDrafts(d => ({ ...d, [review.id]: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 text-[12px] border border-gray-200 rounded-lg bg-gray-50 text-gray-800 resize-y outline-none focus:border-blue-400 font-[inherit] leading-relaxed"
                        aria-label="Edit reply"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm" variant="primary"
                          onClick={() => submitReply(review.id)}
                          disabled={replyMutation.isPending}
                        >
                          {replyMutation.isPending ? 'Posting…' : 'Post reply'}
                        </Button>
                        <Button size="sm" onClick={() => setDrafts(d => { const n={...d}; delete n[review.id]; return n })}>
                          Discard
                        </Button>
                      </div>
                    </div>
                  ) : review.status === 'replied' ? (
                    <div className="mt-2 text-[11px] text-emerald-600 flex items-center gap-1">
                      <i className="ti ti-circle-check" aria-hidden="true" /> Reply posted
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-2.5">
                      <Button size="sm" variant="primary" onClick={() => loadDraft(review)}>
                        Generate AI reply
                      </Button>
                      <Button size="sm" onClick={() => ignoreMutation.mutate(review.id)}>
                        Ignore
                      </Button>
                      <Button size="sm">Assign</Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
