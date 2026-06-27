import { Router } from 'express'
import { mockProfiles } from '../services/mockStore'

export const profilesRouter = Router()

// GET /api/v1/profiles
profilesRouter.get('/', (req, res) => {
  const { health, search } = req.query

  let results = [...mockProfiles]

  if (typeof health === 'string' && health !== 'all') {
    results = results.filter(p => p.healthLevel === health)
  }

  if (typeof search === 'string' && search.trim()) {
    const q = search.toLowerCase()
    results = results.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q)
    )
  }

  res.json({ data: results, total: results.length })
})

// GET /api/v1/profiles/:id
profilesRouter.get('/:id', (req, res) => {
  const profile = mockProfiles.find(p => p.id === req.params.id)
  if (!profile) {
    res.status(404).json({ error: 'Profile not found' })
    return
  }
  res.json({ data: profile })
})
