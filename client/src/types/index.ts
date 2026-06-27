// ── Navigation ────────────────────────────────────────────────
export type PageId =
  | 'dashboard' | 'profiles' | 'reviews' | 'posts'
  | 'media' | 'rankings' | 'health' | 'agents'
  | 'reporting' | 'automation'

// ── Agency ────────────────────────────────────────────────────
export interface Agency {
  id: string
  name: string
  ownerEmail?: string
  createdAt?: string
}

// ── User ──────────────────────────────────────────────────────
export interface User {
  id: string
  agencyId?: string
  name: string
  email: string
  role: string
  avatarUrl?: string
}

// ── Business Profiles ─────────────────────────────────────────
export type HealthLevel   = 'good' | 'warning' | 'critical'
export type ProfileStatus = 'active' | 'suspended' | 'pending'

export interface BusinessProfile {
  id:             string
  name:           string
  category:       string
  location:       string
  avatarInitials: string
  avatarColor:    string
  rating:         number
  reviewCount:    number
  monthlyViews:   number
  healthScore:    number
  healthLevel:    HealthLevel
  status:         ProfileStatus
  isVerified:     boolean
  lastSyncAt:     string | null
  createdAt:      string
  agencyId?:      string
}

// ── Reviews ───────────────────────────────────────────────────
export type ReviewStatus =
  | 'pending'
  | 'pending_reply'
  | 'replied'
  | 'unreplied'
  | 'ignored'
  | 'flagged'

export interface ReviewReply {
  id:          string
  text:        string
  isAiDraft:   boolean
  postedToGbp: boolean
  createdAt:   string
}

export interface Review {
  id:                     string
  businessProfileId:      string
  businessName:           string
  businessAvatarInitials: string
  businessAvatarColor:    string
  authorName:             string
  authorPhotoUrl:         string | null
  rating:                 number
  text:                   string
  publishedAt:            string
  status:                 ReviewStatus
  reply:                  ReviewReply | null
}

// ── Issues ────────────────────────────────────────────────────
export type IssueSeverity = 'critical' | 'warning' | 'info'

export interface Issue {
  id:                string
  businessProfileId?: string
  businessName:      string
  healthScore:       number
  severity:          IssueSeverity
  title:             string
  description:       string
  iconName:          string
  createdAt:         string
}

// ── KPI Metrics ───────────────────────────────────────────────
export interface KpiMetric {
  id: string
  label: string
  value: string | number
  change?: string | number
  trend?: 'up' | 'down' | 'neutral'
  description?: string
}

// ── Keyword Rankings ──────────────────────────────────────────
export interface KeywordRanking {
  id: string
  businessProfileId?: string
  keyword: string
  location?: string
  rank: number
  previousRank?: number
  change?: number
}

// ── Morning Briefing ──────────────────────────────────────────
export interface MorningBriefing {
  id: string
  title: string
  summary: string
  items?: string[]
  severity?: 'good' | 'warning' | 'critical'
  createdAt?: string
}

// ── Google Accounts ───────────────────────────────────────────
export interface GoogleAccount {
  id:          string
  email:       string
  displayName: string | null
  scopes:      string[]
  lastSyncAt:  string | null
  createdAt:   string
}

export interface DashboardGoogleAccount extends GoogleAccount {
  profileCount:           number
  hasBusinessManageScope: boolean
}

// ── Dashboard KPIs ────────────────────────────────────────────
export interface DashboardKpis {
  totalProfiles:  number
  avgRating:      number
  totalReviews:   number
  avgHealthScore: number
  pendingReviews: number
}

export interface DashboardData {
  kpis:           DashboardKpis
  recentReviews:  Review[]
  issues:         Issue[]
  googleAccounts: DashboardGoogleAccount[]
}

// ── AI Agents ─────────────────────────────────────────────────
export type AgentStatus = 'active' | 'idle' | 'error'
export type AgentColor  = 'blue' | 'green' | 'amber' | 'purple' | 'red'

export interface Agent {
  id:           string
  name:         string
  description?: string
  iconName:     string
  color:        AgentColor
  status:       AgentStatus
  statusLabel:  string
  introMessage: string
}

export interface ChatMessage {
  id:        string
  role:      'user' | 'assistant'
  content:   string
  timestamp: string
}

// ── API helpers ───────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total:      number
    page:       number
    pageSize:   number
    totalPages: number
  }
}

export interface ApiDataResponse<T> {
  data: T
}

// ── Discovery / Sync ──────────────────────────────────────────
export interface DiscoveryResult {
  discovered: number
  created:    number
  updated:    number
}

export type SyncStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'

export interface SyncJob {
  id:               string
  type:             string
  status:           SyncStatus
  startedAt:        string | null
  completedAt:      string | null
  errorMessage:     string | null
  recordsProcessed: number
  createdAt:        string
}
