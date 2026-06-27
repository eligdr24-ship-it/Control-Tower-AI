import { Router } from 'express'
import { mockReviews } from '../services/mockStore'

export const reviewsRouter = Router()

// GET /api/v1/reviews
reviewsRouter.get('/', (req, res) => {
  const { status, profileId } = req.query
  let results = [...mockReviews]

  if (typeof status === 'string') results = results.filter(r => r.status === status)
  if (typeof profileId === 'string') results = results.filter(r => r.businessProfileId === profileId)

  res.json({ data: results, total: results.length })
})

// PATCH /api/v1/reviews/:id/reply
reviewsRouter.patch('/:id/reply', (req, res) => {
  const { reply } = req.body as { reply?: string }
  const review = mockReviews.find(r => r.id === req.params.id)

  if (!review) {
    res.status(404).json({ error: 'Review not found' })
    return
  }
  if (!reply || typeof reply !== 'string' || reply.trim().length === 0) {
    res.status(400).json({ error: 'Reply text is required' })
    return
  }

  // In production: update DB + call GBP API to post the reply
  res.json({ data: { ...review, status: 'replied', reply: reply.trim() } })
})
