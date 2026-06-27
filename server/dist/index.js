"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./config/env");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
const env_1 = require("./config/env");
const logger_1 = require("./lib/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const requestLogger_1 = require("./middleware/requestLogger");
const prisma_1 = require("./db/prisma");
const auth_router_1 = require("./modules/auth/auth.router");
const profiles_router_1 = require("./modules/profiles/profiles.router");
const reviews_router_1 = require("./modules/reviews/reviews.router");
const agents_router_1 = require("./modules/agents/agents.router");
const dashboard_router_1 = require("./modules/dashboard/dashboard.router");
const google_accounts_router_1 = require("./modules/organizations/google-accounts.router");
const app = (0, express_1.default)();
// ── Security headers ──────────────────────────────────────────
app.use((0, helmet_1.default)({
    contentSecurityPolicy: env_1.config.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
}));
// ── CORS ──────────────────────────────────────────────────────
//
// CLIENT_ORIGIN (server env var) must match the exact origin of the
// deployed client. Set it in Render → API service → Environment.
//
// Supports a comma-separated list for multiple origins:
//   CLIENT_ORIGIN=https://control-tower-ai-client.onrender.com,https://app.example.com
//
// The client sends JWT via Authorization header, NOT cookies, so
// credentials:true / withCredentials is not needed and has been removed
// to eliminate the class of CORS failures it causes.
//
function buildCorsOptions(nodeEnv, clientOrigin) {
    if (nodeEnv !== 'production') {
        // Development: allow all origins, no restrictions
        return {
            origin: true,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
            credentials: false,
        };
    }
    const allowed = clientOrigin
        .split(',')
        .map(o => o.trim())
        .filter(Boolean);
    if (allowed.length === 0) {
        logger_1.logger.error('CLIENT_ORIGIN is not set. CORS will reject all browser requests. ' +
            'Set CLIENT_ORIGIN in Render → API service → Environment.');
    }
    else {
        logger_1.logger.info('CORS allow-list', { origins: allowed });
    }
    return {
        origin: (origin, callback) => {
            // No Origin header = same-origin request, server-to-server, or curl → allow
            if (!origin)
                return callback(null, true);
            if (allowed.includes(origin))
                return callback(null, true);
            logger_1.logger.warn('CORS rejected', { origin, allowed });
            callback(new Error(`CORS: origin "${origin}" is not allowed`));
        },
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: false, // No cookies — JWT via Authorization header only
    };
}
const corsOptions = buildCorsOptions(env_1.config.NODE_ENV, env_1.config.CLIENT_ORIGIN);
// Handle preflight OPTIONS for every route BEFORE rate-limiting and auth
app.options('*', (0, cors_1.default)(corsOptions));
app.use((0, cors_1.default)(corsOptions));
// ── Rate limiting ─────────────────────────────────────────────
app.use('/api', (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: 'RATE_LIMITED', message: 'Too many requests.' } },
}));
// ── Request parsing ───────────────────────────────────────────
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '2mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
if (env_1.config.NODE_ENV !== 'test') {
    app.use((0, morgan_1.default)(env_1.config.NODE_ENV === 'production' ? 'combined' : 'dev'));
}
app.use(requestLogger_1.requestLogger);
// ── API routes ────────────────────────────────────────────────
app.use('/api/v1/auth', auth_router_1.authRouter);
app.use('/api/v1/dashboard', dashboard_router_1.dashboardRouter);
app.use('/api/v1/profiles', profiles_router_1.profilesRouter);
app.use('/api/v1/reviews', reviews_router_1.reviewsRouter);
app.use('/api/v1/agents', agents_router_1.agentsRouter);
app.use('/api/v1/google-accounts', google_accounts_router_1.googleAccountsRouter);
// ── Health check ──────────────────────────────────────────────
app.get('/healthz', async (_req, res) => {
    let dbOk = true;
    try {
        await prisma_1.prisma.$queryRaw `SELECT 1`;
    }
    catch {
        dbOk = false;
    }
    res.status(dbOk ? 200 : 503).json({
        status: dbOk ? 'ok' : 'degraded',
        version: '2.0.0',
        db: dbOk ? 'ok' : 'error',
        cors: { clientOrigin: env_1.config.CLIENT_ORIGIN },
        timestamp: new Date().toISOString(),
    });
});
// ── Static client (production only) ──────────────────────────
if (env_1.config.NODE_ENV === 'production') {
    const clientDist = path_1.default.join(__dirname, '../../client/dist');
    app.use(express_1.default.static(clientDist, { maxAge: '1y', etag: true }));
    app.get('*', (_req, res) => res.sendFile(path_1.default.join(clientDist, 'index.html')));
}
// ── Error handler (must be last) ─────────────────────────────
app.use(errorHandler_1.errorHandler);
// ── Start ─────────────────────────────────────────────────────
const server = app.listen(env_1.config.PORT, () => {
    logger_1.logger.info('Server started', {
        port: env_1.config.PORT,
        env: env_1.config.NODE_ENV,
        clientOrigin: env_1.config.CLIENT_ORIGIN,
    });
});
async function shutdown(signal) {
    logger_1.logger.info(`${signal} — shutting down`);
    server.close(async () => {
        await prisma_1.prisma.$disconnect();
        process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
}
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
exports.default = app;
