import type {
  Agency,
  User,
  BusinessProfile,
  Review,
  Issue,
  KpiMetric,
  KeywordRanking,
  Agent,
  MorningBriefing,
} from '@/types'

// ── Agency ───────────────────────────────────────────────────
export const mockAgency: Agency = {
  id: 'agency-1',
  name: 'Peak Growth Agency',
  slug: 'peak-growth',
  profileCount: 47,
  createdAt: '2024-01-15T00:00:00Z',
}

export const mockUser: User = {
  id: 'user-1',
  name: 'Alex Rivera',
  email: 'alex@peakgrowth.agency',
  avatarInitials: 'AR',
  role: 'admin',
  agencyId: 'agency-1',
}

// ── Business Profiles ────────────────────────────────────────
export const mockProfiles: BusinessProfile[] = [
  {
    id: 'profile-1',
    name: 'Lakeside Bistro',
    category: 'Restaurant',
    location: 'Downtown',
    avatarInitials: 'LB',
    avatarColor: '#7c3aed',
    rating: 4.2,
    reviewCount: 312,
    monthlyViews: 1400,
    healthScore: 72,
    healthLevel: 'warning',
    status: 'active',
    agencyId: 'agency-1',
  },
  {
    id: 'profile-2',
    name: 'Downtown Dental',
    category: 'Dentist',
    location: 'Medical District',
    avatarInitials: 'DD',
    avatarColor: '#0891b2',
    rating: 4.8,
    reviewCount: 89,
    monthlyViews: 890,
    healthScore: 61,
    healthLevel: 'critical',
    status: 'active',
    agencyId: 'agency-1',
  },
  {
    id: 'profile-3',
    name: 'Westside Auto',
    category: 'Auto Repair',
    location: 'West End',
    avatarInitials: 'WA',
    avatarColor: '#16a34a',
    rating: 4.7,
    reviewCount: 204,
    monthlyViews: 2100,
    healthScore: 91,
    healthLevel: 'good',
    status: 'active',
    agencyId: 'agency-1',
  },
  {
    id: 'profile-4',
    name: 'Northgate Spa',
    category: 'Spa & Wellness',
    location: 'Northgate',
    avatarInitials: 'NS',
    avatarColor: '#db2777',
    rating: 4.9,
    reviewCount: 156,
    monthlyViews: 740,
    healthScore: 88,
    healthLevel: 'good',
    status: 'active',
    agencyId: 'agency-1',
  },
  {
    id: 'profile-5',
    name: 'Harbor Fitness',
    category: 'Gym & Fitness',
    location: 'Harbor District',
    avatarInitials: 'HF',
    avatarColor: '#ea580c',
    rating: 4.5,
    reviewCount: 178,
    monthlyViews: 1620,
    healthScore: 84,
    healthLevel: 'good',
    status: 'active',
    agencyId: 'agency-1',
  },
  {
    id: 'profile-6',
    name: 'Riverside Plumbing',
    category: 'Plumber',
    location: 'Riverside',
    avatarInitials: 'RP',
    avatarColor: '#0369a1',
    rating: 4.6,
    reviewCount: 93,
    monthlyViews: 560,
    healthScore: 78,
    healthLevel: 'warning',
    status: 'active',
    agencyId: 'agency-1',
  },
]

// ── Reviews ──────────────────────────────────────────────────
export const mockReviews: Review[] = [
  {
    id: 'review-1',
    businessProfileId: 'profile-1',
    businessName: 'Lakeside Bistro',
    businessAvatarInitials: 'LB',
    businessAvatarColor: '#7c3aed',
    authorName: 'John M.',
    rating: 1,
    text: "Waited 45 minutes, food came out cold. Won't be back.",
    publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    aiDraftReply:
      "Thank you for sharing your experience, John. We're truly sorry about the wait time and that your food arrived cold — that's not the standard we hold ourselves to. We'd love the opportunity to make it right. Please reach out to us directly at manager@lakesidebistro.com and we'll take care of you.",
  },
  {
    id: 'review-2',
    businessProfileId: 'profile-2',
    businessName: 'Downtown Dental',
    businessAvatarInitials: 'DD',
    businessAvatarColor: '#0891b2',
    authorName: 'Sarah K.',
    rating: 5,
    text: "Dr. Chen was amazing — so gentle and thorough. Best dental experience I've had.",
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    aiDraftReply:
      "Thank you so much, Sarah! We'll pass your kind words along to Dr. Chen — they'll mean a lot. We look forward to seeing you at your next visit!",
  },
  {
    id: 'review-3',
    businessProfileId: 'profile-3',
    businessName: 'Westside Auto',
    businessAvatarInitials: 'WA',
    businessAvatarColor: '#16a34a',
    authorName: 'Mike T.',
    rating: 3,
    text: "Good work but took longer than quoted. Would be 5 stars if they'd called to update me on timing.",
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    aiDraftReply:
      "Mike, thank you for the honest feedback. You're absolutely right — a courtesy call when timing changes is something we should always do, and we let you down there. We've shared this with our service team. We hope you'll give us another chance to do better.",
  },
  {
    id: 'review-4',
    businessProfileId: 'profile-1',
    businessName: 'Lakeside Bistro',
    businessAvatarInitials: 'LB',
    businessAvatarColor: '#7c3aed',
    authorName: 'Emma R.',
    rating: 1,
    text: 'Overpriced for what you get. The pasta was mushy and service was inattentive.',
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
  },
  {
    id: 'review-5',
    businessProfileId: 'profile-4',
    businessName: 'Northgate Spa',
    businessAvatarInitials: 'NS',
    businessAvatarColor: '#db2777',
    authorName: 'Lisa P.',
    rating: 5,
    text: 'Absolutely incredible. The hot stone massage was divine. Booking again next month!',
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
  },
]

// ── Issues ───────────────────────────────────────────────────
export const mockIssues: Issue[] = [
  {
    id: 'issue-1',
    businessProfileId: 'profile-2',
    businessName: 'Downtown Dental',
    title: 'Unverified address change — Downtown Dental',
    description: 'Google flagged a suggested edit 2 days ago · Needs owner approval',
    severity: 'critical',
    iconName: 'ti-map-pin-off',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'issue-2',
    businessProfileId: 'profile-1',
    businessName: 'Lakeside Bistro',
    title: '2 new 1-star reviews — Lakeside Bistro',
    description: 'Received in the last 24h · AI draft replies ready for approval',
    severity: 'critical',
    iconName: 'ti-star-off',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'issue-3',
    businessProfileId: 'profile-3',
    businessName: 'Westside Auto',
    title: '3 photos flagged — Westside Auto',
    description: 'Policy violation detected by Google · Replace within 7 days',
    severity: 'warning',
    iconName: 'ti-photo-off',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'issue-4',
    businessProfileId: 'profile-1',
    businessName: 'Multiple profiles',
    title: 'Missing holiday hours — 6 profiles',
    description: 'Independence Day hours not set · Affects search visibility',
    severity: 'warning',
    iconName: 'ti-clock-off',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

// ── KPIs ─────────────────────────────────────────────────────
export const mockKpis: KpiMetric[] = [
  {
    label: 'Profiles managed',
    value: 47,
    change: '+4 this month',
    trend: 'up',
  },
  {
    label: 'Avg. star rating',
    value: '4.6',
    change: '+0.2 vs last month',
    trend: 'up',
  },
  {
    label: 'Reviews this month',
    value: 183,
    change: '+27% vs prior',
    trend: 'up',
  },
  {
    label: 'Health score',
    value: '84%',
    change: '−3 pts, 3 issues',
    trend: 'down',
  },
]

// ── Keyword Rankings ─────────────────────────────────────────
export const mockRankings: KeywordRanking[] = [
  {
    id: 'rank-1',
    keyword: 'emergency dentist',
    position: 1,
    previousPosition: 3,
    businessProfileId: 'profile-2',
    businessName: 'Downtown Dental',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rank-2',
    keyword: 'bistro downtown',
    position: 4,
    previousPosition: 5,
    businessProfileId: 'profile-1',
    businessName: 'Lakeside Bistro',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rank-3',
    keyword: 'auto repair near me',
    position: 6,
    previousPosition: 6,
    businessProfileId: 'profile-3',
    businessName: 'Westside Auto',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rank-4',
    keyword: 'teeth whitening',
    position: 2,
    previousPosition: 4,
    businessProfileId: 'profile-2',
    businessName: 'Downtown Dental',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rank-5',
    keyword: 'italian restaurant',
    position: 11,
    previousPosition: 9,
    businessProfileId: 'profile-1',
    businessName: 'Lakeside Bistro',
    updatedAt: new Date().toISOString(),
  },
]

// ── AI Agents ────────────────────────────────────────────────
export const mockAgents: Agent[] = [
  {
    id: 'tower',
    name: 'Tower AI',
    description: 'Chief coordinator',
    iconName: 'ti-radar-2',
    color: 'blue',
    status: 'active',
    statusLabel: 'Active · Chief coordinator',
    stats: [
      { label: 'Profiles monitored', value: 47 },
      { label: 'Actions today', value: 24 },
      { label: 'Pending approval', value: 3 },
    ],
    introMessage:
      "Hello! I'm Tower AI, your chief coordination agent. I monitor all your 47 profiles and coordinate the other specialist agents. What would you like to know or action today?",
  },
  {
    id: 'ranking',
    name: 'Ranking Agent',
    description: 'Local SEO positions',
    iconName: 'ti-trophy',
    color: 'green',
    status: 'active',
    statusLabel: 'Scanning 47 profiles',
    stats: [
      { label: 'Keywords tracked', value: 312 },
      { label: 'Rankings improved', value: 8 },
      { label: 'Pending scan', value: 1 },
    ],
    introMessage:
      "Hi! I track keyword rankings and geo-grid positions for all your profiles. Last scan found 8 ranking improvements. Want a full report?",
  },
  {
    id: 'health',
    name: 'GBP Health Agent',
    description: 'Profile completeness',
    iconName: 'ti-heart-rate-monitor',
    color: 'amber',
    status: 'active',
    statusLabel: '3 issues detected',
    stats: [
      { label: 'Checks per profile', value: '40+' },
      { label: 'Issues detected', value: 3 },
      { label: 'Pending approval', value: 2 },
    ],
    introMessage:
      "I run 40+ health checks across your profiles. Right now I've flagged 3 critical issues that need your attention. Want me to walk you through them?",
  },
  {
    id: 'reviews',
    name: 'Reviews Agent',
    description: 'Review monitoring & replies',
    iconName: 'ti-star',
    color: 'purple',
    status: 'active',
    statusLabel: '12 drafts ready',
    stats: [
      { label: 'Total reviews', value: 183 },
      { label: 'Pending replies', value: 12 },
      { label: 'Avg. response time', value: '2h' },
    ],
    introMessage:
      "I monitor and draft replies for all your reviews. There are 12 pending replies — 2 are 1-star reviews that need priority attention. Shall I draft them?",
  },
  {
    id: 'content',
    name: 'Content Agent',
    description: 'Posts & descriptions',
    iconName: 'ti-pencil',
    color: 'blue',
    status: 'idle',
    statusLabel: 'Idle · Awaiting task',
    stats: [
      { label: 'Posts created', value: 0 },
      { label: 'Drafts queued', value: 0 },
      { label: 'Approvals pending', value: 0 },
    ],
    introMessage:
      "I'm your AI content creator for Google Posts, descriptions, and Q&A. I'm currently idle — give me a task and I'll get to work!",
  },
  {
    id: 'compliance',
    name: 'Compliance Agent',
    description: 'Policy & guidelines',
    iconName: 'ti-shield-check',
    color: 'amber',
    status: 'active',
    statusLabel: 'Weekly scan done',
    stats: [
      { label: 'Profiles scanned', value: 47 },
      { label: 'Violations found', value: 0 },
      { label: 'Last scan', value: 'Today' },
    ],
    introMessage:
      "Good news — the weekly compliance scan found no policy violations across your 47 profiles. All clear! Let me know if you want a detailed report.",
  },
]

// ── Morning Briefing ─────────────────────────────────────────
export const mockBriefing: MorningBriefing = {
  generatedAt: new Date().toISOString(),
  summary:
    'Your portfolio has 47 active profiles with a combined 4.6★ average. ' +
    '3 profiles need urgent attention — Downtown Dental has an unverified address change, ' +
    'Lakeside Bistro received 2 new 1-star reviews in the last 24h, and Westside Auto\'s photos are flagged for removal. ' +
    'Ranking engine detected a top-3 position gain for "emergency dentist downtown" — well ahead of target.',
  tags: [
    {
      label: '3 critical issues',
      color: 'red',
      iconName: 'ti-alert-triangle',
      promptText: 'Show me the critical issues in Control Tower AI',
    },
    {
      label: '12 reviews pending',
      color: 'amber',
      iconName: 'ti-star',
      promptText: 'Which reviews need a reply in Control Tower AI?',
    },
    {
      label: '8 rankings improved',
      color: 'green',
      iconName: 'ti-trending-up',
      promptText: 'Show me the ranking improvements in Control Tower AI',
    },
  ],
}
