import bcrypt from 'bcryptjs'
import { prisma } from '../../db/prisma'
import { signToken } from '../../lib/jwt'
import { ConflictError, UnauthorizedError, NotFoundError } from '../../lib/errors'
import { writeAuditLog } from '../../lib/audit'

export interface AuthResult {
  token: string
  user: {
    id: string
    email: string
    name: string
    role: string
    orgId: string
    orgName: string
  }
}

export async function register(
  email: string,
  password: string,
  name: string,
  orgName: string,
  orgSlug: string,
): Promise<AuthResult> {
  // Check email uniqueness
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (existing) throw new ConflictError('An account with that email already exists.')

  // Check slug uniqueness
  const existingOrg = await prisma.organization.findUnique({ where: { slug: orgSlug } })
  if (existingOrg) throw new ConflictError('That organization URL is already taken.')

  const passwordHash = await bcrypt.hash(password, 12)

  // Create user + org + membership atomically
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await prisma.$transaction(async (tx: any) => {
    const user = await tx.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        passwordHash,
        role: 'ADMIN',
        emailVerified: true, // skip email verification for MVP
      },
    })

    const org = await tx.organization.create({
      data: { name: orgName, slug: orgSlug },
    })

    await tx.organizationMember.create({
      data: {
        userId:         user.id,
        organizationId: org.id,
        role:           'OWNER',
        acceptedAt:     new Date(),
      },
    })

    return { user, org }
  })

  await writeAuditLog({
    userId:         result.user.id,
    organizationId: result.org.id,
    action:         'USER_CREATED',
    entityType:     'User',
    entityId:       result.user.id,
  })

  const token = signToken({
    sub:   result.user.id,
    email: result.user.email,
    orgId: result.org.id,
    role:  'ADMIN',
  })

  return {
    token,
    user: {
      id:      result.user.id,
      email:   result.user.email,
      name:    result.user.name,
      role:    'ADMIN',
      orgId:   result.org.id,
      orgName: result.org.name,
    },
  }
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  })

  if (!user || !user.passwordHash) {
    throw new UnauthorizedError('Invalid email or password.')
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) throw new UnauthorizedError('Invalid email or password.')

  // Get their primary org
  const membership = await prisma.organizationMember.findFirst({
    where:   { userId: user.id, acceptedAt: { not: null } },
    include: { organization: true },
    orderBy: { createdAt: 'asc' },
  })

  if (!membership) throw new UnauthorizedError('No organization found for this user.')

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data:  { lastLoginAt: new Date() },
  })

  const token = signToken({
    sub:   user.id,
    email: user.email,
    orgId: membership.organizationId,
    role:  membership.role,
  })

  return {
    token,
    user: {
      id:      user.id,
      email:   user.email,
      name:    user.name,
      role:    membership.role,
      orgId:   membership.organizationId,
      orgName: membership.organization.name,
    },
  }
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        include: { organization: true },
        where:   { acceptedAt: { not: null } },
      },
    },
  })
  if (!user) throw new NotFoundError('User')

  return {
    id:    user.id,
    email: user.email,
    name:  user.name,
    role:  user.role,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    organizations: user.memberships.map((m: any) => ({
      id:       m.organizationId,
      name:     m.organization.name,
      slug:     m.organization.slug,
      role:     m.role,
    })),
  }
}
