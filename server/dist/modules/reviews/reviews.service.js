"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listReviews = listReviews;
exports.createReply = createReply;
exports.updateReviewStatus = updateReviewStatus;
const prisma_1 = require("../../db/prisma");
const errors_1 = require("../../lib/errors");
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
            id: r.reply.id, text: r.reply.text,
            isAiDraft: r.reply.isAiDraft, postedToGbp: r.reply.postedToGbp,
            createdAt: r.reply.createdAt.toISOString(),
        } : null,
    };
}
async function listReviews(organizationId, opts) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where = { businessProfile: { organizationId } };
    if (opts.profileId)
        where.businessProfileId = opts.profileId;
    if (opts.status)
        where.status = opts.status.toUpperCase();
    const [reviews, total] = await Promise.all([
        prisma_1.prisma.review.findMany({ where, include: { businessProfile: true, reply: true }, orderBy: { publishedAt: 'desc' }, skip: (opts.page - 1) * opts.pageSize, take: opts.pageSize }),
        prisma_1.prisma.review.count({ where }),
    ]);
    return { reviews: reviews.map(toDTO), total };
}
async function createReply(reviewId, organizationId, authorId, text, isAiDraft) {
    const review = await prisma_1.prisma.review.findFirst({ where: { id: reviewId, businessProfile: { organizationId } } });
    if (!review)
        throw new errors_1.NotFoundError('Review');
    const reply = await prisma_1.prisma.reviewReply.upsert({
        where: { reviewId }, create: { reviewId, authorId, text, isAiDraft }, update: { text, isAiDraft, updatedAt: new Date() },
    });
    await prisma_1.prisma.review.update({ where: { id: reviewId }, data: { status: 'REPLIED' } });
    return reply;
}
async function updateReviewStatus(reviewId, organizationId, status) {
    const review = await prisma_1.prisma.review.findFirst({ where: { id: reviewId, businessProfile: { organizationId } } });
    if (!review)
        throw new errors_1.NotFoundError('Review');
    return prisma_1.prisma.review.update({ where: { id: reviewId }, data: { status }, include: { businessProfile: true, reply: true } });
}
