"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.getOrgId = getOrgId;
exports.getUserId = getUserId;
const jwt_1 = require("../lib/jwt");
const errors_1 = require("../lib/errors");
const prisma_1 = require("../db/prisma");
const logger_1 = require("../lib/logger");
/**
 * Phase 2: Real JWT verification from Authorization: Bearer <token>
 * Falls back to demo context in development when no token is present.
 */
async function requireAuth(req, _res, next) {
    const authHeader = req.headers.authorization;
    // ── Dev fallback: no token → use first org from DB ────────
    if (!authHeader && process.env.NODE_ENV === 'development') {
        try {
            const member = await prisma_1.prisma.organizationMember.findFirst({
                include: { user: true },
                orderBy: { createdAt: 'asc' },
            });
            if (member) {
                req.user = {
                    sub: member.user.id,
                    email: member.user.email,
                    orgId: member.organizationId,
                    role: member.role,
                };
                next();
                return;
            }
        }
        catch (err) {
            logger_1.logger.warn('Dev auth fallback failed — DB may not be seeded', { err });
        }
        // DB not seeded yet — use static demo values so app still loads
        req.user = { sub: 'demo', email: 'demo@example.com', orgId: 'demo', role: 'ADMIN' };
        next();
        return;
    }
    // ── Real JWT path ──────────────────────────────────────────
    if (!authHeader?.startsWith('Bearer ')) {
        throw new errors_1.UnauthorizedError('Missing or invalid Authorization header');
    }
    const token = authHeader.slice(7);
    try {
        req.user = (0, jwt_1.verifyToken)(token);
        next();
    }
    catch {
        throw new errors_1.UnauthorizedError('Invalid or expired token');
    }
}
function getOrgId(req) {
    if (!req.user?.orgId)
        throw new errors_1.UnauthorizedError();
    return req.user.orgId;
}
function getUserId(req) {
    if (!req.user?.sub)
        throw new errors_1.UnauthorizedError();
    return req.user.sub;
}
