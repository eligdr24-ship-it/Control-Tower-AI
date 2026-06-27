import { useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAsync } from '@/hooks/useAsync'
import { mockReviews } from '@/data/mock'
import { timeAgo } from '@/lib/utils'
import type { Review } from '@/types'
import styles from './ReviewsPage.module.css'

type RatingFilter = 'pending' | 'low' | 'mid' | 'high'

const fetchReviews = () =>
  new Promise<Review[]>(resolve => setTimeout(() => resolve(mockReviews), 400))

function Stars({ rating }: { rating: number }) {
  return (
    <div className={styles.stars} aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < rating ? styles.starFilled : styles.starEmpty}>★</span>
      ))}
    </div>
  )
}

export function ReviewsPage() {
  const { data: reviews, loading } = useAsync(fetchReviews)
  const [activeTab, setActiveTab] = useState<RatingFilter>('pending')
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const [replied, setReplied] = useState<Set<string>>(new Set())

  const filtered = (reviews ?? []).filter(r => {
    if (replied.has(r.id)) return false
    if (activeTab === 'pending') return r.status === 'pending'
    if (activeTab === 'low') return r.rating <= 2
    if (activeTab === 'mid') return r.rating === 3
    if (activeTab === 'high') return r.rating >= 4
    return true
  })

  const pendingCount = (reviews ?? []).filter(r => r.status === 'pending' && !replied.has(r.id)).length

  const handleGenerateDraft = (review: Review) => {
    if (review.aiDraftReply) {
      setReplyDrafts(d => ({ ...d, [review.id]: review.aiDraftReply! }))
    }
  }

  const handleSubmitReply = (reviewId: string) => {
    setReplied(prev => new Set(prev).add(reviewId))
    setReplyDrafts(d => { const n = { ...d }; delete n[reviewId]; return n })
  }

  return (
    <div className={styles.page}>
      <TopBar
        title="Reviews"
        subtitle={`${(reviews ?? []).length} total · ${pendingCount} awaiting reply`}
        actions={
          <Button variant="primary" icon="ti-robot">AI bulk reply</Button>
        }
      />

      <div className={styles.content}>
        <div className={styles.tabRow} role="tablist">
          {[
            { id: 'pending' as RatingFilter, label: `Pending (${pendingCount})` },
            { id: 'low'     as RatingFilter, label: '1–2 stars' },
            { id: 'mid'     as RatingFilter, label: '3 stars' },
            { id: 'high'    as RatingFilter, label: '4–5 stars' },
          ].map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className={styles.loadingMsg}>Loading reviews…</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            iconName="ti-star-off"
            title="No reviews in this category"
            description="All caught up! Switch to another tab to see more reviews."
          />
        ) : (
          <div className={styles.panel}>
            {filtered.map(review => (
              <div key={review.id} className={styles.reviewItem}>
                <div
                  className={styles.avatar}
                  style={{ background: review.businessAvatarColor }}
                  aria-hidden="true"
                >
                  {review.businessAvatarInitials}
                </div>
                <div className={styles.body}>
                  <div className={styles.meta}>
                    <Stars rating={review.rating} />
                    <span className={styles.time}>{timeAgo(review.publishedAt)}</span>
                  </div>
                  <div className={styles.text}>"{review.text}"</div>
                  <div className={styles.byline}>
                    {review.businessName} · {review.authorName}
                  </div>

                  {replyDrafts[review.id] ? (
                    <div className={styles.draftArea}>
                      <textarea
                        className={styles.textarea}
                        value={replyDrafts[review.id]}
                        onChange={e => setReplyDrafts(d => ({ ...d, [review.id]: e.target.value }))}
                        rows={3}
                        aria-label="Edit reply draft"
                      />
                      <div className={styles.draftActions}>
                        <Button size="sm" variant="primary" onClick={() => handleSubmitReply(review.id)}>
                          Post reply
                        </Button>
                        <Button size="sm" onClick={() => setReplyDrafts(d => { const n={...d}; delete n[review.id]; return n })}>
                          Discard
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.actions}>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleGenerateDraft(review)}
                        disabled={!review.aiDraftReply}
                      >
                        {review.aiDraftReply ? 'Generate AI reply' : 'No draft available'}
                      </Button>
                      <Button size="sm">Flag</Button>
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
