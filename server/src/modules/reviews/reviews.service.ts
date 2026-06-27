import { prisma } from '../../db/prisma'
import { NotFoundError } from '../../lib/errors'

function avatarColor(name: string): string {
  const colors = ['#7c3aed','#0891b2','#16a34a','#db2777','#ea580c','#0369a1']
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff
  return colors[Math.abs(h) % colors.length]
}
function initials(name: string): string {
  return name.split(' ').slice(0,2).map(w => w[0]?.toUpperCase() ?? '').join('')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toDTO(r: any) {
  return {
    id: r.id as string,
    businessProfileId: r.businessProfileId as string,
    businessName: r.businessProfile.displayName as string,
    businessAvatarInitials: initials(r.businessProfile.displayName as string),
    businessAvatarColor: avatarColor(r.businessProfile.displayName as string),
    authorName: r.authorName as string,
    authorPhotoUrl: r.authorPhotoUrl as string | null,
    rating: r.rating as number,
    text: (r.text ?? '') as string,
    publishedAt: (r.publishedAt as Date).toISOString(),
    status: (r.status as string).toLowerCase() as 'pending_reply'|'replied'|'ignored'|'flagged',
    reply: r.reply ? {
      id: r.reply.id as string, text: r.reply.text as string,
      isAiDraft: r.reply.isAiDraft as boolean, postedToGbp: r.reply.postedToGbp as boolean,
      createdAt: (r.reply.createdAt as Date).toISOString(),
    } : null,
  }
}

export async function listReviews(
  organizationId: string,
  opts: { status?: string; profileId?: string; page: number; pageSize: number }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { businessProfile: { organizationId } }
  if (opts.profileId) where.businessProfileId = opts.profileId
  if (opts.status)    where.status = opts.status.toUpperCase()

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({ where, include: { businessProfile: true, reply: true }, orderBy: { publishedAt: 'desc' }, skip: (opts.page-1)*opts.pageSize, take: opts.pageSize }),
    prisma.review.count({ where }),
  ])
  return { reviews: reviews.map(toDTO), total }
}

export async function createReply(
  reviewId: string, organizationId: string,
  authorId: string, text: string, isAiDraft: boolean
) {
  const review = await prisma.review.findFirst({ where: { id: reviewId, businessProfile: { organizationId } } })
  if (!review) throw new NotFoundError('Review')
  const reply = await prisma.reviewReply.upsert({
    where: { reviewId }, create: { reviewId, authorId, text, isAiDraft }, update: { text, isAiDraft, updatedAt: new Date() },
  })
  await prisma.review.update({ where: { id: reviewId }, data: { status: 'REPLIED' } })
  return reply
}

export async function updateReviewStatus(reviewId: string, organizationId: string, status: string) {
  const review = await prisma.review.findFirst({ where: { id: reviewId, businessProfile: { organizationId } } })
  if (!review) throw new NotFoundError('Review')
  return prisma.review.update({ where: { id: reviewId }, data: { status }, include: { businessProfile: true, reply: true } })
}
