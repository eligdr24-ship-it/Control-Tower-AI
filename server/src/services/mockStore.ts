// In Sprint 1, these will be replaced with PostgreSQL queries via pg/Prisma.
// The shape mirrors /client/src/data/mock.ts so the API contract is stable.

export const mockProfiles = [
  { id: 'profile-1', name: 'Lakeside Bistro',    category: 'Restaurant',    location: 'Downtown',        avatarInitials: 'LB', avatarColor: '#7c3aed', rating: 4.2, reviewCount: 312, monthlyViews: 1400, healthScore: 72, healthLevel: 'warning',  status: 'active', agencyId: 'agency-1' },
  { id: 'profile-2', name: 'Downtown Dental',    category: 'Dentist',       location: 'Medical District', avatarInitials: 'DD', avatarColor: '#0891b2', rating: 4.8, reviewCount: 89,  monthlyViews: 890,  healthScore: 61, healthLevel: 'critical', status: 'active', agencyId: 'agency-1' },
  { id: 'profile-3', name: 'Westside Auto',      category: 'Auto Repair',   location: 'West End',         avatarInitials: 'WA', avatarColor: '#16a34a', rating: 4.7, reviewCount: 204, monthlyViews: 2100, healthScore: 91, healthLevel: 'good',     status: 'active', agencyId: 'agency-1' },
  { id: 'profile-4', name: 'Northgate Spa',      category: 'Spa & Wellness',location: 'Northgate',        avatarInitials: 'NS', avatarColor: '#db2777', rating: 4.9, reviewCount: 156, monthlyViews: 740,  healthScore: 88, healthLevel: 'good',     status: 'active', agencyId: 'agency-1' },
  { id: 'profile-5', name: 'Harbor Fitness',     category: 'Gym & Fitness', location: 'Harbor District',  avatarInitials: 'HF', avatarColor: '#ea580c', rating: 4.5, reviewCount: 178, monthlyViews: 1620, healthScore: 84, healthLevel: 'good',     status: 'active', agencyId: 'agency-1' },
  { id: 'profile-6', name: 'Riverside Plumbing', category: 'Plumber',       location: 'Riverside',        avatarInitials: 'RP', avatarColor: '#0369a1', rating: 4.6, reviewCount: 93,  monthlyViews: 560,  healthScore: 78, healthLevel: 'warning',  status: 'active', agencyId: 'agency-1' },
]

export const mockReviews = [
  { id: 'review-1', businessProfileId: 'profile-1', businessName: 'Lakeside Bistro',  businessAvatarInitials: 'LB', businessAvatarColor: '#7c3aed', authorName: 'John M.',  rating: 1, text: "Waited 45 minutes, food came out cold. Won't be back.",                                        publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), status: 'pending' },
  { id: 'review-2', businessProfileId: 'profile-2', businessName: 'Downtown Dental',  businessAvatarInitials: 'DD', businessAvatarColor: '#0891b2', authorName: 'Sarah K.', rating: 5, text: "Dr. Chen was amazing — so gentle and thorough. Best dental experience I've had.", publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), status: 'pending' },
  { id: 'review-3', businessProfileId: 'profile-3', businessName: 'Westside Auto',    businessAvatarInitials: 'WA', businessAvatarColor: '#16a34a', authorName: 'Mike T.',  rating: 3, text: "Good work but took longer than quoted. Would be 5 stars if they'd called to update me on timing.", publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), status: 'pending' },
  { id: 'review-4', businessProfileId: 'profile-1', businessName: 'Lakeside Bistro',  businessAvatarInitials: 'LB', businessAvatarColor: '#7c3aed', authorName: 'Emma R.',  rating: 1, text: 'Overpriced for what you get. The pasta was mushy and service was inattentive.',               publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),  status: 'pending' },
  { id: 'review-5', businessProfileId: 'profile-4', businessName: 'Northgate Spa',    businessAvatarInitials: 'NS', businessAvatarColor: '#db2777', authorName: 'Lisa P.',  rating: 5, text: 'Absolutely incredible. The hot stone massage was divine. Booking again next month!',           publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), status: 'pending' },
]

export const mockAgents = [
  { id: 'tower',      name: 'Tower AI',           color: 'blue',   status: 'active', statusLabel: 'Active · Chief coordinator' },
  { id: 'ranking',    name: 'Ranking Agent',       color: 'green',  status: 'active', statusLabel: 'Scanning 47 profiles' },
  { id: 'health',     name: 'GBP Health Agent',    color: 'amber',  status: 'active', statusLabel: '3 issues detected' },
  { id: 'reviews',    name: 'Reviews Agent',       color: 'purple', status: 'active', statusLabel: '12 drafts ready' },
  { id: 'content',    name: 'Content Agent',       color: 'blue',   status: 'idle',   statusLabel: 'Idle · Awaiting task' },
  { id: 'compliance', name: 'Compliance Agent',    color: 'amber',  status: 'active', statusLabel: 'Weekly scan done' },
]
