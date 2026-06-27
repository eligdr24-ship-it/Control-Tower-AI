"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrganization = getOrganization;
exports.getOrganizationBySlug = getOrganizationBySlug;
exports.resolveOrgId = resolveOrgId;
const prisma_1 = require("../../db/prisma");
const errors_1 = require("../../lib/errors");
async function getOrganization(id) {
    const org = await prisma_1.prisma.organization.findUnique({
        where: { id },
        include: {
            members: { include: { user: true } },
            googleAccounts: { select: { id: true, email: true, isActive: true, lastSyncAt: true } },
        },
    });
    if (!org)
        throw new errors_1.NotFoundError('Organization');
    return org;
}
async function getOrganizationBySlug(slug) {
    const org = await prisma_1.prisma.organization.findUnique({ where: { slug } });
    if (!org)
        throw new errors_1.NotFoundError('Organization');
    return org;
}
// Stub for Phase 2 — returns demo org when DB has the seed data
async function resolveOrgId(userId) {
    const member = await prisma_1.prisma.organizationMember.findFirst({
        where: { userId },
        orderBy: { createdAt: 'asc' },
    });
    if (!member) {
        // Fallback to first org (demo mode)
        const first = await prisma_1.prisma.organization.findFirst();
        if (first)
            return first.id;
        throw new errors_1.NotFoundError('Organization');
    }
    return member.organizationId;
}
