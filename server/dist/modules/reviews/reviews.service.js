"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listReviews = listReviews;
exports.createReply = createReply;
exports.updateReviewStatus = updateReviewStatus;
const prisma_1 = require("../../db/prisma");
const errors_1 = require("../../lib/errors");
// Mirror of the ReviewStatus enum from prisma/schema.prisma.
// Using a const object avoids the @prisma/client import-at-build-time problem
// while keeping full type safety.
const ReviewStatus = {
    PENDING_REPLY: 'PENDING_REPLY',
    REPLIED: 'REPLIED',
    IGNORED: 'IGNORED',
    FLAGGED: 'FLAGGED',
};
function avatarColor(name) {
    const colors = ['#7c3aed', '#0891b2', '#16a34a', '#db2777', '#ea580c', '#0369a1'];
    let h = 0;
    for (const c of name)
        h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
    return colors[Math.abs(h) % colors.length];
}
function initials(name) {
    return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toDTO(r) {
    return {
        id: r.id,
        businessProfileId: r.businessProfileId,
        businessName: r.businessProfile.displayName,
        businessAvatarInitials: initials(r.businessProfile.displayName),
        businessAvatarColor: avatarColor(r.businessProfile.displayName),
        authorName: r.authorName,
        authorPhotoUrl: r.authorPhotoUrl,
        rating: r.rating,
        text: (r.text ?? ''),
        publishedAt: r.publishedAt.toISOString(),
        status: r.status.toLowerCase(),
        reply: r.reply ? {
            id: r.reply.id,
            text: r.reply.text,
            isAiDraft: r.reply.isAiDraft,
            postedToGbp: r.reply.postedToGbp,
            createdAt: r.reply.createdAt.toISOString(),
        } : null,
    };
}
/** Validate and normalise a status string to the Prisma enum value */
function toReviewStatus(raw) {
    const upper = raw.toUpperCase();
    if (Object.values(ReviewStatus).includes(upper))
        return upper;
    throw new errors_1.ValidationError(`Invalid review status: "${raw}". Valid values: ${Object.values(ReviewStatus).join(', ')}`);
}
async function listReviews(organizationId, opts) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where = { businessProfile: { organizationId } };
    if (opts.profileId)
        where.businessProfileId = opts.profileId;
    if (opts.status)
        where.status = toReviewStatus(opts.status);
    const [reviews, total] = await Promise.all([
        prisma_1.prisma.review.findMany({
            where,
            include: { businessProfile: true, reply: true },
            orderBy: { publishedAt: 'desc' },
            skip: (opts.page - 1) * opts.pageSize,
            take: opts.pageSize,
        }),
        prisma_1.prisma.review.count({ where }),
    ]);
    return { reviews: reviews.map(toDTO), total };
}
async function createReply(reviewId, organizationId, authorId, text, isAiDraft) {
    const review = await prisma_1.prisma.review.findFirst({
        where: { id: reviewId, businessProfile: { organizationId } },
    });
    if (!review)
        throw new errors_1.NotFoundError('Review');
    const reply = await prisma_1.prisma.reviewReply.upsert({
        where: { reviewId },
        create: { reviewId, authorId, text, isAiDraft },
        update: { text, isAiDraft, updatedAt: new Date() },
    });
    await prisma_1.prisma.review.update({
        where: { id: reviewId },
        data: { status: ReviewStatus.REPLIED },
    });
    return reply;
}
async function updateReviewStatus(reviewId, organizationId, status) {
    const review = await prisma_1.prisma.review.findFirst({
        where: { id: reviewId, businessProfile: { organizationId } },
    });
    if (!review)
        throw new errors_1.NotFoundError('Review');
    return prisma_1.prisma.review.update({
        where: { id: reviewId },
        data: { status: toReviewStatus(status) },
        include: { businessProfile: true, reply: true },
    });
}
