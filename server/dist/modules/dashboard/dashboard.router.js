"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const errors_1 = require("../../lib/errors");
const profiles_service_1 = require("../profiles/profiles.service");
const prisma_1 = require("../../db/prisma");
exports.dashboardRouter = (0, express_1.Router)();
exports.dashboardRouter.use(auth_1.requireAuth);
/**
 * GET /api/v1/dashboard
 *
 * Returns everything the Mission Control page needs in one request:
 *   - kpis:            aggregate metrics
 *   - recentReviews:   pending reviews needing a reply
 *   - issues:          low-health profiles
 *   - googleAccounts:  connected Google accounts with sync status (req #6)
 */
exports.dashboardRouter.get('/', async (req, res, next) => {
    try {
        const orgId = (0, auth_1.getOrgId)(req);
        const palette = ['#7c3aed', '#0891b2', '#16a34a', '#db2777', '#ea580c'];
        const [kpis, recentReviews, issueProfiles, googleAccounts] = await Promise.all([
            (0, profiles_service_1.getDashboardKpis)(orgId),
            prisma_1.prisma.review.findMany({
                where: { businessProfile: { organizationId: orgId }, status: 'PENDING_REPLY' },
                include: { businessProfile: true, reply: true },
                orderBy: { publishedAt: 'desc' },
                take: 5,
            }),
            prisma_1.prisma.businessProfile.findMany({
                where: { organizationId: orgId, healthScore: { lt: 75 } },
                orderBy: { healthScore: 'asc' },
                take: 5,
            }),
            // Requirement #6: connected Google account status for the dashboard
            prisma_1.prisma.googleAccount.findMany({
                where: { organizationId: orgId, isActive: true },
                select: {
                    id: true,
                    email: true,
                    displayName: true,
                    lastSyncAt: true,
                    scopes: true,
                    // Count profiles synced from this account
                    _count: { select: { businessProfiles: true } },
                },
                orderBy: { createdAt: 'asc' },
            }),
        ]);
        (0, errors_1.ok)(res, {
            kpis,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            recentReviews: recentReviews.map((r, idx) => ({
                id: r.id,
                businessName: r.businessProfile.displayName,
                businessAvatarInitials: r.businessProfile.displayName
                    .split(' ')
                    .slice(0, 2)
                    .map((w) => w[0] ?? '')
                    .join(''),
                businessAvatarColor: palette[idx % palette.length],
                authorName: r.authorName,
                rating: r.rating,
                text: r.text ?? '',
                publishedAt: r.publishedAt.toISOString(),
                status: r.status.toLowerCase(),
            })),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            issues: issueProfiles.map((p) => ({
                id: p.id,
                businessName: p.displayName,
                healthScore: p.healthScore,
                severity: p.healthScore < 65 ? 'critical' : 'warning',
                title: `Health score low — ${p.displayName}`,
                description: `Score is ${p.healthScore}% — review profile completeness`,
                iconName: p.healthScore < 65 ? 'ti-alert-triangle' : 'ti-alert-circle',
                createdAt: p.updatedAt.toISOString(),
            })),
            // Requirement #6: Google account connection status
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            googleAccounts: googleAccounts.map((ga) => ({
                id: ga.id,
                email: ga.email,
                displayName: ga.displayName,
                profileCount: ga._count.businessProfiles,
                lastSyncAt: ga.lastSyncAt?.toISOString() ?? null,
                hasBusinessManageScope: ga.scopes.includes('https://www.googleapis.com/auth/business.manage'),
            })),
        });
    }
    catch (e) {
        next(e);
    }
});
