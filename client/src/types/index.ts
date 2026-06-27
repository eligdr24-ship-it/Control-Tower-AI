// ── Navigation ────────────────────────────────────────────────
export type PageId =
  | 'dashboard' | 'profiles' | 'reviews' | 'posts'
  | 'media' | 'rankings' | 'health' | 'agents'
  | 'reporting' | 'automation'

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
}

// ── Reviews ───────────────────────────────────────────────────
export type ReviewStatus = 'pending_reply' | 'replied' | 'ignored' | 'flagged'

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

// ── Issues (derived on server) ────────────────────────────────
export type IssueSeverity = 'critical' | 'warning' | 'info'

export interface Issue {
  id:           string
  businessName: string
  healthScore:  number
  severity:     IssueSeverity
  title:        string
  description:  string
  iconName:     string
  createdAt:    string
}

// ── Google Accounts ───────────────────────────────────────────
export interface GoogleAccount {
  id:                      string
  email:                   string
  displayName:             string | null
  scopes:                  string[]
  lastSyncAt:              string | null
  createdAt:               string
}

/** Extended shape returned by /dashboard — includes profile count */
export interface DashboardGoogleAccount extends GoogleAccount {
  profileCount:            number
  hasBusinessManageScope:  boolean
}

// ── KPIs ──────────────────────────────────────────────────────
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
  googleAccounts: DashboardGoogleAccount[]  // requirement #6
}

// ── AI Agents ─────────────────────────────────────────────────
export type AgentStatus = 'active' | 'idle' | 'error'
export type AgentColor  = 'blue' | 'green' | 'amber' | 'purple' | 'red'

export interface Agent {
  id:           string
  name:         string
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

// ── API pagination ────────────────────────────────────────────
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

// ── Discovery result ──────────────────────────────────────────
export interface DiscoveryResult {
  discovered: number
  created:    number
  updated:    number
}

// ── Sync job ──────────────────────────────────────────────────
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
