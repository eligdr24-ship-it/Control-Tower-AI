import { prisma } from '../../db/prisma'
import { NotFoundError } from '../../lib/errors'

export async function getOrganization(id: string) {
  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      members:        { include: { user: true } },
      googleAccounts: { select: { id: true, email: true, isActive: true, lastSyncAt: true } },
    },
  })
  if (!org) throw new NotFoundError('Organization')
  return org
}

export async function getOrganizationBySlug(slug: string) {
  const org = await prisma.organization.findUnique({ where: { slug } })
  if (!org) throw new NotFoundError('Organization')
  return org
}

// Stub for Phase 2 — returns demo org when DB has the seed data
export async function resolveOrgId(userId: string): Promise<string> {
  const member = await prisma.organizationMember.findFirst({
    where:   { userId },
    orderBy: { createdAt: 'asc' },
  })
  if (!member) {
    // Fallback to first org (demo mode)
    const first = await prisma.organization.findFirst()
    if (first) return first.id
    throw new NotFoundError('Organization')
  }
  return member.organizationId
}
