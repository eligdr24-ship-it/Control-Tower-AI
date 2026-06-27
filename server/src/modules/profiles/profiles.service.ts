import { prisma } from '../../db/prisma'
import { NotFoundError } from '../../lib/errors'

export type HealthLevel = 'good' | 'warning' | 'critical'

export function healthLevel(score: number): HealthLevel {
  if (score >= 85) return 'good'
  if (score >= 65) return 'warning'
  return 'critical'
}

function avatarColor(name: string): string {
  const colors = ['#7c3aed','#0891b2','#16a34a','#db2777','#ea580c','#0369a1','#b45309','#047857']
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) & 0xffffffff
  return colors[Math.abs(h) % colors.length]
}

function avatarInitials(name: string): string {
  return name.split(' ').slice(0,2).map(w => w[0]?.toUpperCase() ?? '').join('')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toDTO(p: any) {
  return {
    id: p.id as string,
    name: p.displayName as string,
    category: (p.category ?? 'Business') as string,
    location: ((p.city ?? p.address) ?? '') as string,
    avatarInitials: avatarInitials(p.displayName as string),
    avatarColor: avatarColor(p.displayName as string),
    rating: (p.avgRating ?? 0) as number,
    reviewCount: p.totalReviews as number,
    monthlyViews: p.monthlyViews as number,
    healthScore: p.healthScore as number,
    healthLevel: healthLevel(p.healthScore as number),
    status: (p.status as string).toLowerCase() as 'active' | 'suspended' | 'pending',
    isVerified: p.isVerified as boolean,
    lastSyncAt: p.lastSyncAt ? (p.lastSyncAt as Date).toISOString() : null,
    createdAt: (p.createdAt as Date).toISOString(),
  }
}

export async function listProfiles(
  organizationId: string,
  opts: { health?: string; search?: string; page: number; pageSize: number }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { organizationId }
  if (opts.search) {
    where.OR = [
      { displayName: { contains: opts.search, mode: 'insensitive' } },
      { category:    { contains: opts.search, mode: 'insensitive' } },
      { city:        { contains: opts.search, mode: 'insensitive' } },
    ]
  }
  if (opts.health === 'good')     where.healthScore = { gte: 85 }
  if (opts.health === 'warning')  where.healthScore = { gte: 65, lt: 85 }
  if (opts.health === 'critical') where.healthScore = { lt: 65 }

  const [profiles, total] = await Promise.all([
    prisma.businessProfile.findMany({ where, orderBy: { displayName: 'asc' }, skip: (opts.page-1)*opts.pageSize, take: opts.pageSize }),
    prisma.businessProfile.count({ where }),
  ])
  return { profiles: profiles.map(toDTO), total }
}

export async function getProfile(id: string, organizationId: string) {
  const p = await prisma.businessProfile.findFirst({ where: { id, organizationId } })
  if (!p) throw new NotFoundError('BusinessProfile')
  return toDTO(p)
}

export async function createProfile(
  organizationId: string,
  data: { displayName: string; category?: string; city?: string; address?: string; phone?: string; website?: string }
) {
  return toDTO(await prisma.businessProfile.create({ data: { ...data, organizationId } }))
}

export async function updateProfile(
  id: string, organizationId: string,
  data: Partial<{ displayName: string; category: string; city: string; phone: string; website: string }>
) {
  const existing = await prisma.businessProfile.findFirst({ where: { id, organizationId } })
  if (!existing) throw new NotFoundError('BusinessProfile')
  return toDTO(await prisma.businessProfile.update({ where: { id }, data }))
}

export async function getDashboardKpis(organizationId: string) {
  const [total, totalReviews, agg, pendingReviews] = await Promise.all([
    prisma.businessProfile.count({ where: { organizationId } }),
    prisma.review.count({ where: { businessProfile: { organizationId } } }),
    prisma.businessProfile.aggregate({ where: { organizationId }, _avg: { avgRating: true, healthScore: true } }),
    prisma.review.count({ where: { businessProfile: { organizationId }, status: 'PENDING_REPLY' } }),
  ])
  return {
    totalProfiles: total,
    avgRating: Number((agg._avg.avgRating ?? 0).toFixed(1)),
    totalReviews,
    avgHealthScore: Math.round(agg._avg.healthScore ?? 0),
    pendingReviews,
  }
}
