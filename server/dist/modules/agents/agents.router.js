"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../../middleware/auth");
const errors_1 = require("../../lib/errors");
const validate_1 = require("../../lib/validate");
exports.agentsRouter = (0, express_1.Router)();
exports.agentsRouter.use(auth_1.requireAuth);
const AGENTS = [
    { id: 'tower', name: 'Tower AI', iconName: 'ti-radar-2', color: 'blue', status: 'active', statusLabel: 'Active · Chief coordinator', introMessage: "Hello! I'm Tower AI, your chief coordination agent. I monitor all your profiles and coordinate the specialist agents. What would you like to action today?" },
    { id: 'ranking', name: 'Ranking Agent', iconName: 'ti-trophy', color: 'green', status: 'active', statusLabel: 'Ready to scan', introMessage: "I track keyword rankings and geo-grid positions for all your profiles. Connect your GBP account to start scanning." },
    { id: 'health', name: 'GBP Health Agent', iconName: 'ti-heart-rate-monitor', color: 'amber', status: 'active', statusLabel: 'Ready', introMessage: "I run 40+ health checks across your profiles. Once connected to GBP, I'll surface issues and recommendations." },
    { id: 'reviews', name: 'Reviews Agent', iconName: 'ti-star', color: 'purple', status: 'active', statusLabel: 'Ready', introMessage: "I monitor and draft replies for all your reviews. Connect GBP to enable automatic monitoring." },
    { id: 'content', name: 'Content Agent', iconName: 'ti-pencil', color: 'blue', status: 'idle', statusLabel: 'Idle · Awaiting task', introMessage: "I'm your AI content creator for Google Posts, descriptions, and Q&A. Give me a task and I'll get to work!" },
    { id: 'compliance', name: 'Compliance Agent', iconName: 'ti-shield-check', color: 'amber', status: 'active', statusLabel: 'Ready', introMessage: "I check all your profiles for Google policy compliance. Connect GBP to start compliance scanning." },
];
// GET /api/v1/agents
exports.agentsRouter.get('/', (_req, res) => {
    (0, errors_1.ok)(res, AGENTS);
});
// GET /api/v1/agents/:id
exports.agentsRouter.get('/:id', (req, res, next) => {
    try {
        const agent = AGENTS.find(a => a.id === req.params.id);
        if (!agent) {
            res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Agent not found' } });
            return;
        }
        (0, errors_1.ok)(res, agent);
    }
    catch (e) {
        next(e);
    }
});
// POST /api/v1/agents/:id/chat  — Phase 3: wire to Anthropic SDK
exports.agentsRouter.post('/:id/chat', async (req, res, next) => {
    try {
        const body = (0, validate_1.validateBody)(zod_1.z.object({ message: zod_1.z.string().min(1) }), req);
        res.json({
            data: {
                role: 'assistant',
                content: `[Phase 3 placeholder] ${req.params.id} received: "${body.message}". Connect ANTHROPIC_API_KEY in Phase 3 to enable real AI responses.`,
                timestamp: new Date().toISOString(),
            },
        });
    }
    catch (e) {
        next(e);
    }
});
