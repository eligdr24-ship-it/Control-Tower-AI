// ── Agency & Users ──────────────────────────────────────────
export interface Agency {
  id: string
  name: string
  slug: string
  logo?: string
  profileCount: number
  createdAt: string
}

export interface User {
  id: string
  name: string
  email: string
  avatarInitials: string
  role: 'admin' | 'manager' | 'viewer'
  agencyId: string
}

// ── Business Profiles ────────────────────────────────────────
export type HealthLevel = 'good' | 'warning' | 'critical'
export type ProfileStatus = 'active' | 'suspended' | 'pending'

export interface BusinessProfile {
  id: string
  name: string
  category: string
  location: string
  avatarInitials: string
  avatarColor: string
  rating: number
  reviewCount: number
  monthlyViews: number
  healthScore: number
  healthLevel: HealthLevel
  status: ProfileStatus
  agencyId: string
}

// ── Reviews ──────────────────────────────────────────────────
export type ReviewStatus = 'pending' | 'replied' | 'ignored'

export interface Review {
  id: string
  businessProfileId: string
  businessName: string
  businessAvatarInitials: string
  businessAvatarColor: string
  authorName: string
  rating: number
  text: string
  publishedAt: string
  status: ReviewStatus
  aiDraftReply?: string
}

// ── Issues ───────────────────────────────────────────────────
export type IssueSeverity = 'critical' | 'warning' | 'info'

export interface Issue {
  id: string
  businessProfileId: string
  businessName: string
  title: string
  description: string
  severity: IssueSeverity
  iconName: string
  createdAt: string
  resolvedAt?: string
}

// ── KPIs ─────────────────────────────────────────────────────
export interface KpiMetric {
  label: string
  value: string | number
  change: string
  trend: 'up' | 'down' | 'neutral'
}

// ── Keyword Rankings ─────────────────────────────────────────
export interface KeywordRanking {
  id: string
  keyword: string
  position: number
  businessProfileId: string
  businessName: string
  previousPosition?: number
  updatedAt: string
}

// ── AI Agents ────────────────────────────────────────────────
export type AgentStatus = 'active' | 'idle' | 'error'
export type AgentColor = 'blue' | 'green' | 'amber' | 'purple' | 'red'

export interface Agent {
  id: string
  name: string
  description: string
  iconName: string
  color: AgentColor
  status: AgentStatus
  statusLabel: string
  stats: {
    label: string
    value: string | number
  }[]
  introMessage: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

// ── Morning Briefing ─────────────────────────────────────────
export interface BriefingTag {
  label: string
  color: 'red' | 'amber' | 'green'
  iconName: string
  promptText: string
}

export interface MorningBriefing {
  generatedAt: string
  summary: string
  tags: BriefingTag[]
}

// ── API Response Wrapper ─────────────────────────────────────
export interface ApiResponse<T> {
  data: T
  error?: string
  loading?: boolean
}

// ── Navigation ───────────────────────────────────────────────
export type PageId =
  | 'dashboard'
  | 'profiles'
  | 'reviews'
  | 'posts'
  | 'media'
  | 'rankings'
  | 'health'
  | 'agents'
  | 'reporting'
  | 'automation'
