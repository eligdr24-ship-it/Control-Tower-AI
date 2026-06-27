"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthLevel = healthLevel;
exports.listProfiles = listProfiles;
exports.getProfile = getProfile;
exports.createProfile = createProfile;
exports.updateProfile = updateProfile;
exports.getDashboardKpis = getDashboardKpis;
const prisma_1 = require("../../db/prisma");
const errors_1 = require("../../lib/errors");
function healthLevel(score) {
    if (score >= 85)
        return 'good';
    if (score >= 65)
        return 'warning';
    return 'critical';
}
function avatarColor(name) {
    const colors = ['#7c3aed', '#0891b2', '#16a34a', '#db2777', '#ea580c', '#0369a1', '#b45309', '#047857'];
    let h = 0;
    for (const ch of name)
        h = (h * 31 + ch.charCodeAt(0)) & 0xffffffff;
    return colors[Math.abs(h) % colors.length];
}
function avatarInitials(name) {
    return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toDTO(p) {
    return {
        id: p.id,
        name: p.displayName,
        category: (p.category ?? 'Business'),
        location: ((p.city ?? p.address) ?? ''),
        avatarInitials: avatarInitials(p.displayName),
        avatarColor: avatarColor(p.displayName),
        rating: (p.avgRating ?? 0),
        reviewCount: p.totalReviews,
        monthlyViews: p.monthlyViews,
        healthScore: p.healthScore,
        healthLevel: healthLevel(p.healthScore),
        status: p.status.toLowerCase(),
        isVerified: p.isVerified,
        lastSyncAt: p.lastSyncAt ? p.lastSyncAt.toISOString() : null,
        createdAt: p.createdAt.toISOString(),
    };
}
async function listProfiles(organizationId, opts) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where = { organizationId };
    if (opts.search) {
        where.OR = [
            { displayName: { contains: opts.search, mode: 'insensitive' } },
            { category: { contains: opts.search, mode: 'insensitive' } },
            { city: { contains: opts.search, mode: 'insensitive' } },
        ];
    }
    if (opts.health === 'good')
        where.healthScore = { gte: 85 };
    if (opts.health === 'warning')
        where.healthScore = { gte: 65, lt: 85 };
    if (opts.health === 'critical')
        where.healthScore = { lt: 65 };
    const [profiles, total] = await Promise.all([
        prisma_1.prisma.businessProfile.findMany({ where, orderBy: { displayName: 'asc' }, skip: (opts.page - 1) * opts.pageSize, take: opts.pageSize }),
        prisma_1.prisma.businessProfile.count({ where }),
    ]);
    return { profiles: profiles.map(toDTO), total };
}
async function getProfile(id, organizationId) {
    const p = await prisma_1.prisma.businessProfile.findFirst({ where: { id, organizationId } });
    if (!p)
        throw new errors_1.NotFoundError('BusinessProfile');
    return toDTO(p);
}
async function createProfile(organizationId, data) {
    return toDTO(await prisma_1.prisma.businessProfile.create({ data: { ...data, organizationId } }));
}
async function updateProfile(id, organizationId, data) {
    const existing = await prisma_1.prisma.businessProfile.findFirst({ where: { id, organizationId } });
    if (!existing)
        throw new errors_1.NotFoundError('BusinessProfile');
    return toDTO(await prisma_1.prisma.businessProfile.update({ where: { id }, data }));
}
async function getDashboardKpis(organizationId) {
    const [total, totalReviews, agg, pendingReviews] = await Promise.all([
        prisma_1.prisma.businessProfile.count({ where: { organizationId } }),
        prisma_1.prisma.review.count({ where: { businessProfile: { organizationId } } }),
        prisma_1.prisma.businessProfile.aggregate({ where: { organizationId }, _avg: { avgRating: true, healthScore: true } }),
        prisma_1.prisma.review.count({ where: { businessProfile: { organizationId }, status: 'PENDING_REPLY' } }),
    ]);
    return {
        totalProfiles: total,
        avgRating: Number((agg._avg.avgRating ?? 0).toFixed(1)),
        totalReviews,
        avgHealthScore: Math.round(agg._avg.healthScore ?? 0),
        pendingReviews,
    };
}
