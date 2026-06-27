import { PrismaClient, UserRole, OrgMemberRole, ProfileStatus, ReviewStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ── Demo org ───────────────────────────────────────────────
  const org = await prisma.organization.upsert({
    where: { slug: 'peak-growth' },
    update: {},
    create: {
      name: 'Peak Growth Agency',
      slug: 'peak-growth',
      website: 'https://peakgrowth.agency',
    },
  })

  // ── Demo admin user ────────────────────────────────────────
  const passwordHash = await bcrypt.hash('demo1234', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@peakgrowth.agency' },
    update: {},
    create: {
      email: 'admin@peakgrowth.agency',
      name: 'Alex Rivera',
      passwordHash,
      role: UserRole.ADMIN,
      emailVerified: true,
    },
  })

  await prisma.organizationMember.upsert({
    where: { userId_organizationId: { userId: admin.id, organizationId: org.id } },
    update: {},
    create: {
      userId: admin.id,
      organizationId: org.id,
      role: OrgMemberRole.OWNER,
      acceptedAt: new Date(),
    },
  })

  // ── Demo profiles ──────────────────────────────────────────
  const profilesData = [
    { displayName: 'Lakeside Bistro',    category: 'Restaurant',    city: 'Downtown',        avgRating: 4.2, totalReviews: 312, monthlyViews: 1400, healthScore: 72, status: ProfileStatus.ACTIVE },
    { displayName: 'Downtown Dental',    category: 'Dentist',       city: 'Medical District', avgRating: 4.8, totalReviews: 89,  monthlyViews: 890,  healthScore: 61, status: ProfileStatus.ACTIVE },
    { displayName: 'Westside Auto',      category: 'Auto Repair',   city: 'West End',         avgRating: 4.7, totalReviews: 204, monthlyViews: 2100, healthScore: 91, status: ProfileStatus.ACTIVE },
    { displayName: 'Northgate Spa',      category: 'Spa & Wellness',city: 'Northgate',        avgRating: 4.9, totalReviews: 156, monthlyViews: 740,  healthScore: 88, status: ProfileStatus.ACTIVE },
    { displayName: 'Harbor Fitness',     category: 'Gym & Fitness', city: 'Harbor District',  avgRating: 4.5, totalReviews: 178, monthlyViews: 1620, healthScore: 84, status: ProfileStatus.ACTIVE },
    { displayName: 'Riverside Plumbing', category: 'Plumber',       city: 'Riverside',        avgRating: 4.6, totalReviews: 93,  monthlyViews: 560,  healthScore: 78, status: ProfileStatus.ACTIVE },
  ]

  const profiles = []
  for (const p of profilesData) {
    const profile = await prisma.businessProfile.create({
      data: { ...p, organizationId: org.id },
    })
    profiles.push(profile)
  }

  // ── Demo reviews ───────────────────────────────────────────
  const reviewsData = [
    { profileIdx: 0, authorName: 'John M.',  rating: 1, text: "Waited 45 minutes, food came out cold. Won't be back.",                                        publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000) },
    { profileIdx: 1, authorName: 'Sarah K.', rating: 5, text: "Dr. Chen was amazing — so gentle and thorough. Best dental experience I've had.",              publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000) },
    { profileIdx: 2, authorName: 'Mike T.',  rating: 3, text: "Good work but took longer than quoted. Would be 5 stars if they'd called to update me.",      publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    { profileIdx: 0, authorName: 'Emma R.',  rating: 1, text: 'Overpriced for what you get. The pasta was mushy and service was inattentive.',                publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000) },
    { profileIdx: 3, authorName: 'Lisa P.',  rating: 5, text: 'Absolutely incredible. The hot stone massage was divine. Booking again next month!',           publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
  ]

  for (const r of reviewsData) {
    await prisma.review.create({
      data: {
        businessProfileId: profiles[r.profileIdx].id,
        authorName: r.authorName,
        rating: r.rating,
        text: r.text,
        publishedAt: r.publishedAt,
        status: ReviewStatus.PENDING_REPLY,
      },
    })
  }

  console.log('✅ Seed complete')
  console.log(`   Org:      ${org.name} (${org.id})`)
  console.log(`   Admin:    ${admin.email} / demo1234`)
  console.log(`   Profiles: ${profiles.length}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
