import { google } from 'googleapis'
import type { Auth } from 'googleapis'
import { prisma } from '../../db/prisma'
import { getClientForAccount } from '../auth/google.service'
import { writeAuditLog } from '../../lib/audit'
import { logger } from '../../lib/logger'
import { NotFoundError, AppError } from '../../lib/errors'

interface GbpLocation {
  name: string
  title: string
  storefrontAddress?: { addressLines?: string[]; locality?: string; administrativeArea?: string; postalCode?: string; regionCode?: string }
  primaryPhone?: string
  websiteUri?: string
  primaryCategory?: { displayName: string }
  metadata?: { placeId?: string; mapsUrl?: string }
}

export async function discoverProfiles(
  googleAccountId: string,
  organizationId: string,
  userId: string,
): Promise<{ discovered: number; created: number; updated: number }> {
  const account = await prisma.googleAccount.findFirst({
    where: { id: googleAccountId, organizationId, isActive: true },
  })
  if (!account) throw new NotFoundError('GoogleAccount')

  const job = await prisma.syncJob.create({
    data: { googleAccountId, type: 'PROFILES', status: 'RUNNING', startedAt: new Date() },
  })

  try {
    const authClient = await getClientForAccount(googleAccountId, organizationId)
    const locations  = await fetchAllLocations(authClient)

    let created = 0
    let updated = 0

    for (const loc of locations) {
      const placeId = loc.metadata?.placeId
      const gbpName = loc.name

      const profileData = {
        organizationId, googleAccountId, gbpName,
        gbpPlaceId:  placeId ?? null,
        displayName: loc.title,
        category:    loc.primaryCategory?.displayName ?? null,
        address:     loc.storefrontAddress?.addressLines?.join(', ') ?? null,
        city:        loc.storefrontAddress?.locality ?? null,
        state:       loc.storefrontAddress?.administrativeArea ?? null,
        country:     loc.storefrontAddress?.regionCode ?? 'US',
        phone:       loc.primaryPhone ?? null,
        website:     loc.websiteUri ?? null,
        status:      'ACTIVE' as const,
        lastSyncAt:  new Date(),
      }

      const existing = await prisma.businessProfile.findFirst({
        where: placeId
          ? { OR: [{ gbpPlaceId: placeId }, { gbpName, organizationId }] }
          : { gbpName, organizationId },
      })

      if (existing) {
        await prisma.businessProfile.update({ where: { id: existing.id }, data: profileData })
        updated++
      } else {
        await prisma.businessProfile.create({ data: profileData })
        created++
      }
    }

    await prisma.syncJob.update({
      where: { id: job.id },
      data:  { status: 'COMPLETED', completedAt: new Date(), recordsProcessed: locations.length },
    })
    await prisma.googleAccount.update({ where: { id: googleAccountId }, data: { lastSyncAt: new Date() } })

    await writeAuditLog({
      userId, organizationId, action: 'PROFILE_SYNCED',
      entityType: 'GoogleAccount', entityId: googleAccountId,
      metadata: { discovered: locations.length, created, updated },
    })

    logger.info('GBP discovery complete', { googleAccountId, discovered: locations.length, created, updated })
    return { discovered: locations.length, created, updated }

  } catch (err) {
    await prisma.syncJob.update({
      where: { id: job.id },
      data:  { status: 'FAILED', completedAt: new Date(), errorMessage: err instanceof Error ? err.message : String(err) },
    })
    throw err
  }
}

async function fetchAllLocations(authClient: Auth.OAuth2Client): Promise<GbpLocation[]> {
  // Use the My Business Account Management API to list accounts
  const accountsApi = google.mybusinessaccountmanagement({ version: 'v1', auth: authClient })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const accountsRes = await (accountsApi.accounts.list as any)({})
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const accounts: any[] = accountsRes?.data?.accounts ?? []

  if (accounts.length === 0) {
    throw new AppError(404, 'No Google Business Profile accounts found for this Google account.', 'NO_GBP_ACCOUNTS')
  }

  const mybusiness = google.mybusinessbusinessinformation({ version: 'v1', auth: authClient })
  const allLocations: GbpLocation[] = []

  for (const acct of accounts) {
    let pageToken: string | undefined
    do {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const locRes = await (mybusiness.accounts.locations.list as any)({
        parent:   acct.name as string,
        pageToken,
        readMask: 'name,title,storefrontAddress,primaryPhone,websiteUri,primaryCategory,metadata',
        pageSize:  100,
      })
      const locations: GbpLocation[] = locRes?.data?.locations ?? []
      allLocations.push(...locations)
      pageToken = locRes?.data?.nextPageToken as string | undefined
    } while (pageToken)
  }

  return allLocations
}

export async function getSyncJobs(googleAccountId: string, organizationId: string) {
  const account = await prisma.googleAccount.findFirst({ where: { id: googleAccountId, organizationId } })
  if (!account) throw new NotFoundError('GoogleAccount')
  return prisma.syncJob.findMany({ where: { googleAccountId }, orderBy: { createdAt: 'desc' }, take: 10 })
}
