"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.getMe = getMe;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../../db/prisma");
const jwt_1 = require("../../lib/jwt");
const errors_1 = require("../../lib/errors");
const audit_1 = require("../../lib/audit");
async function register(email, password, name, orgName, orgSlug) {
    // Check email uniqueness
    const existing = await prisma_1.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing)
        throw new errors_1.ConflictError('An account with that email already exists.');
    // Check slug uniqueness
    const existingOrg = await prisma_1.prisma.organization.findUnique({ where: { slug: orgSlug } });
    if (existingOrg)
        throw new errors_1.ConflictError('That organization URL is already taken.');
    const passwordHash = await bcryptjs_1.default.hash(password, 12);
    // Create user + org + membership atomically
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await prisma_1.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                email: email.toLowerCase(),
                name,
                passwordHash,
                role: 'ADMIN',
                emailVerified: true, // skip email verification for MVP
            },
        });
        const org = await tx.organization.create({
            data: { name: orgName, slug: orgSlug },
        });
        await tx.organizationMember.create({
            data: {
                userId: user.id,
                organizationId: org.id,
                role: 'OWNER',
                acceptedAt: new Date(),
            },
        });
        return { user, org };
    });
    await (0, audit_1.writeAuditLog)({
        userId: result.user.id,
        organizationId: result.org.id,
        action: 'USER_CREATED',
        entityType: 'User',
        entityId: result.user.id,
    });
    const token = (0, jwt_1.signToken)({
        sub: result.user.id,
        email: result.user.email,
        orgId: result.org.id,
        role: 'ADMIN',
    });
    return {
        token,
        user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            role: 'ADMIN',
            orgId: result.org.id,
            orgName: result.org.name,
        },
    };
}
async function login(email, password) {
    const user = await prisma_1.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
    });
    if (!user || !user.passwordHash) {
        throw new errors_1.UnauthorizedError('Invalid email or password.');
    }
    const valid = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!valid)
        throw new errors_1.UnauthorizedError('Invalid email or password.');
    // Get their primary org
    const membership = await prisma_1.prisma.organizationMember.findFirst({
        where: { userId: user.id, acceptedAt: { not: null } },
        include: { organization: true },
        orderBy: { createdAt: 'asc' },
    });
    if (!membership)
        throw new errors_1.UnauthorizedError('No organization found for this user.');
    // Update last login
    await prisma_1.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
    });
    const token = (0, jwt_1.signToken)({
        sub: user.id,
        email: user.email,
        orgId: membership.organizationId,
        role: membership.role,
    });
    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: membership.role,
            orgId: membership.organizationId,
            orgName: membership.organization.name,
        },
    };
}
async function getMe(userId) {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        include: {
            memberships: {
                include: { organization: true },
                where: { acceptedAt: { not: null } },
            },
        },
    });
    if (!user)
        throw new errors_1.NotFoundError('User');
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        organizations: user.memberships.map((m) => ({
            id: m.organizationId,
            name: m.organization.name,
            slug: m.organization.slug,
            role: m.role,
        })),
    };
}
