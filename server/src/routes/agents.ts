import { Router } from 'express'
import { mockAgents } from '../services/mockStore'

export const agentsRouter = Router()

// GET /api/v1/agents
agentsRouter.get('/', (_req, res) => {
  res.json({ data: mockAgents, total: mockAgents.length })
})

// GET /api/v1/agents/:id
agentsRouter.get('/:id', (req, res) => {
  const agent = mockAgents.find(a => a.id === req.params.id)
  if (!agent) {
    res.status(404).json({ error: 'Agent not found' })
    return
  }
  res.json({ data: agent })
})

// POST /api/v1/agents/:id/chat
// Stub — will be wired to Anthropic SDK in Sprint 5
agentsRouter.post('/:id/chat', (req, res) => {
  const { message } = req.body as { message?: string }
  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'message is required' })
    return
  }
  res.json({
    data: {
      role: 'assistant',
      content: `[Sprint 5 placeholder] Agent received: "${message}". Connect Anthropic SDK to enable real AI responses.`,
      timestamp: new Date().toISOString(),
    },
  })
})
