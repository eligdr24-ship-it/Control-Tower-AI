"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.discoverProfiles = discoverProfiles;
exports.getSyncJobs = getSyncJobs;
const googleapis_1 = require("googleapis");
const prisma_1 = require("../../db/prisma");
const google_service_1 = require("../auth/google.service");
const audit_1 = require("../../lib/audit");
const logger_1 = require("../../lib/logger");
const errors_1 = require("../../lib/errors");
async function discoverProfiles(googleAccountId, organizationId, userId) {
    const account = await prisma_1.prisma.googleAccount.findFirst({
        where: { id: googleAccountId, organizationId, isActive: true },
    });
    if (!account)
        throw new errors_1.NotFoundError('GoogleAccount');
    const job = await prisma_1.prisma.syncJob.create({
        data: { googleAccountId, type: 'PROFILES', status: 'RUNNING', startedAt: new Date() },
    });
    try {
        const authClient = await (0, google_service_1.getClientForAccount)(googleAccountId, organizationId);
        const locations = await fetchAllLocations(authClient);
        let created = 0;
        let updated = 0;
        for (const loc of locations) {
            const placeId = loc.metadata?.placeId;
            const gbpName = loc.name;
            const profileData = {
                organizationId, googleAccountId, gbpName,
                gbpPlaceId: placeId ?? null,
                displayName: loc.title,
                category: loc.primaryCategory?.displayName ?? null,
                address: loc.storefrontAddress?.addressLines?.join(', ') ?? null,
                city: loc.storefrontAddress?.locality ?? null,
                state: loc.storefrontAddress?.administrativeArea ?? null,
                country: loc.storefrontAddress?.regionCode ?? 'US',
                phone: loc.primaryPhone ?? null,
                website: loc.websiteUri ?? null,
                status: 'ACTIVE',
                lastSyncAt: new Date(),
            };
            const existing = await prisma_1.prisma.businessProfile.findFirst({
                where: placeId
                    ? { OR: [{ gbpPlaceId: placeId }, { gbpName, organizationId }] }
                    : { gbpName, organizationId },
            });
            if (existing) {
                await prisma_1.prisma.businessProfile.update({ where: { id: existing.id }, data: profileData });
                updated++;
            }
            else {
                await prisma_1.prisma.businessProfile.create({ data: profileData });
                created++;
            }
        }
        await prisma_1.prisma.syncJob.update({
            where: { id: job.id },
            data: { status: 'COMPLETED', completedAt: new Date(), recordsProcessed: locations.length },
        });
        await prisma_1.prisma.googleAccount.update({ where: { id: googleAccountId }, data: { lastSyncAt: new Date() } });
        await (0, audit_1.writeAuditLog)({
            userId, organizationId, action: 'PROFILE_SYNCED',
            entityType: 'GoogleAccount', entityId: googleAccountId,
            metadata: { discovered: locations.length, created, updated },
        });
        logger_1.logger.info('GBP discovery complete', { googleAccountId, discovered: locations.length, created, updated });
        return { discovered: locations.length, created, updated };
    }
    catch (err) {
        await prisma_1.prisma.syncJob.update({
            where: { id: job.id },
            data: { status: 'FAILED', completedAt: new Date(), errorMessage: err instanceof Error ? err.message : String(err) },
        });
        throw err;
    }
}
async function fetchAllLocations(authClient) {
    // Use the My Business Account Management API to list accounts
    const accountsApi = googleapis_1.google.mybusinessaccountmanagement({ version: 'v1', auth: authClient });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accountsRes = await accountsApi.accounts.list({});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accounts = accountsRes?.data?.accounts ?? [];
    if (accounts.length === 0) {
        throw new errors_1.AppError(404, 'No Google Business Profile accounts found for this Google account.', 'NO_GBP_ACCOUNTS');
    }
    const mybusiness = googleapis_1.google.mybusinessbusinessinformation({ version: 'v1', auth: authClient });
    const allLocations = [];
    for (const acct of accounts) {
        let pageToken;
        do {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const locRes = await mybusiness.accounts.locations.list({
                parent: acct.name,
                pageToken,
                readMask: 'name,title,storefrontAddress,primaryPhone,websiteUri,primaryCategory,metadata',
                pageSize: 100,
            });
            const locations = locRes?.data?.locations ?? [];
            allLocations.push(...locations);
            pageToken = locRes?.data?.nextPageToken;
        } while (pageToken);
    }
    return allLocations;
}
async function getSyncJobs(googleAccountId, organizationId) {
    const account = await prisma_1.prisma.googleAccount.findFirst({ where: { id: googleAccountId, organizationId } });
    if (!account)
        throw new errors_1.NotFoundError('GoogleAccount');
    return prisma_1.prisma.syncJob.findMany({ where: { googleAccountId }, orderBy: { createdAt: 'desc' }, take: 10 });
}
