# Control Tower AI — Phase 1

> AI-powered Google Business Profile management for agencies.

**Current phase:** Phase 1 — Production foundation with PostgreSQL, Prisma, React Query, and real API.

---

## Quick start (local)

### Prerequisites
- Node.js 20+
- PostgreSQL 15+ running locally (or use a free [Neon](https://neon.tech) / [Supabase](https://supabase.com) database)

### 1. Clone and install

```bash
git clone https://github.com/YOUR_ORG/control-tower-ai.git
cd control-tower-ai
npm run install:all
```

### 2. Configure environment

```bash
cp .env.example server/.env
```

Edit `server/.env` — at minimum set:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/control_tower_ai
DIRECT_URL=postgresql://postgres:password@localhost:5432/control_tower_ai
JWT_SECRET=<run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
```

### 3. Set up the database

```bash
# Create the database (if it doesn't exist yet)
createdb control_tower_ai

# Generate Prisma client
npm run db:generate

# Run migrations (creates all tables)
npm run db:migrate

# Seed with demo data
npm run db:seed
```

Seed creates:
- **Org:** Peak Growth Agency
- **Admin user:** `admin@peakgrowth.agency` / `demo1234`
- **6 business profiles** with realistic data
- **5 demo reviews**

### 4. Start dev servers

```bash
# Terminal 1 — API (http://localhost:4000)
npm run dev:server

# Terminal 2 — Client (http://localhost:3000)
npm run dev:client
```

Open http://localhost:3000 — the UI connects to the real database.

---

## Required environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ Phase 1 | PostgreSQL connection string |
| `DIRECT_URL` | ✅ Phase 1 | Same as `DATABASE_URL` (Prisma requirement) |
| `JWT_SECRET` | ✅ Phase 1 | 64+ random hex characters |
| `JWT_EXPIRES_IN` | Phase 1 | Token TTL, default `7d` |
| `NODE_ENV` | Phase 1 | `development` or `production` |
| `PORT` | Phase 1 | Server port, default `4000` |
| `CLIENT_ORIGIN` | Production | CORS origin for the client |
| `GOOGLE_CLIENT_ID` | Phase 2 | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Phase 2 | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | Phase 2 | OAuth callback URL |
| `ANTHROPIC_API_KEY` | Phase 3 | Anthropic API key for AI agents |
| `VITE_API_URL` | Production | Client: points to API base URL |

---

## Deployment on Render

### Option A — Blueprint (recommended, one click)

1. Push to GitHub.
2. Render Dashboard → **New → Blueprint** → connect your repo.
3. Render reads `render.yaml` and creates:
   - A **PostgreSQL** database
   - The **API** web service (auto-runs migrations on deploy)
   - The **client** static site
4. Add secrets in Render Dashboard → each service → **Environment**:
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (Phase 2)
   - `ANTHROPIC_API_KEY` (Phase 3)

### Option B — Manual

**PostgreSQL:** Add a Render PostgreSQL service. Copy the **Internal Connection String** as `DATABASE_URL` and `DIRECT_URL`.

**API service:**
- Environment: Node
- Build command: `cd server && npm install && npm run db:generate && npm run build`
- Start command: `cd server && npm run db:migrate && node dist/index.js`
- Health check: `/healthz`
- Set all env vars from the table above

**Client static site:**
- Build command: `cd client && npm install && npm run build`
- Publish path: `client/dist`
- Rewrite: `/* → /index.html`
- Set `VITE_API_URL` to your API service URL

---

## GitHub setup

```bash
git init
git add .
git commit -m "feat: Phase 1 — production foundation"
git branch -M main
git remote add origin https://github.com/YOUR_ORG/control-tower-ai.git
git push -u origin main
```

**Branch strategy:**
- `main` → production (Render auto-deploys)
- `develop` → integration branch
- `feature/*` → PR into `develop`

**Branch protection (Settings → Branches → main):**
- Require PR review before merge
- Required status checks: `Server — type-check & build`, `Client — lint, type-check & build`

---

## Project structure

```
control-tower-ai/
├── client/
│   └── src/
│       ├── api/
│       │   ├── client.ts        # Axios instance + typed helpers
│       │   └── queries.ts       # All API query/mutation functions
│       ├── components/
│       │   ├── layout/          # AppShell, Sidebar, TopBar
│       │   └── ui/              # Button, Badge, EmptyState, ErrorBoundary, Skeleton
│       ├── lib/
│       │   ├── queryClient.ts   # React Query setup
│       │   └── utils.ts
│       ├── pages/               # DashboardPage, ProfilesPage, ReviewsPage, AgentsPage, ...
│       └── types/index.ts       # All TypeScript interfaces
│
├── server/
│   ├── prisma/
│   │   ├── schema.prisma        # Full DB schema (all phases)
│   │   └── seed.ts              # Demo data seeder
│   └── src/
│       ├── config/env.ts        # Zod env validation (crashes clearly on missing vars)
│       ├── db/prisma.ts         # Prisma singleton
│       ├── lib/                 # logger, errors, jwt, validate, audit
│       ├── middleware/          # errorHandler, auth (Phase 1 bypass), requestLogger
│       └── modules/
│           ├── dashboard/       # Aggregated KPIs route
│           ├── profiles/        # CRUD + search + filter
│           ├── reviews/         # List + reply + status
│           ├── agents/          # Static config + chat stub
│           └── organizations/   # Org service + Google accounts stub
│
├── .env.example                 # All variables documented with phase annotations
├── render.yaml                  # One-click Render deployment
└── .github/workflows/ci.yml    # Type-check + lint + build on every PR
```

---

## API endpoints (v1)

| Method | Path | Description |
|---|---|---|
| GET | `/healthz` | Infrastructure health (DB ping) |
| GET | `/api/v1/dashboard` | KPIs + recent reviews + issues |
| GET | `/api/v1/profiles` | List profiles (paginated, search, filter) |
| GET | `/api/v1/profiles/kpis` | Aggregate KPIs |
| GET | `/api/v1/profiles/:id` | Single profile |
| POST | `/api/v1/profiles` | Create profile |
| PATCH | `/api/v1/profiles/:id` | Update profile |
| GET | `/api/v1/reviews` | List reviews (paginated, status filter) |
| POST | `/api/v1/reviews/:id/reply` | Post a reply |
| PATCH | `/api/v1/reviews/:id/status` | Update review status |
| GET | `/api/v1/agents` | List AI agents |
| POST | `/api/v1/agents/:id/chat` | Chat with agent (stub) |
| GET | `/api/v1/google-accounts` | List connected Google accounts |
| POST | `/api/v1/google-accounts/connect` | Connect Google account (Phase 2) |

---

## Phase roadmap

| Phase | Focus | Status |
|---|---|---|
| **1** | Foundation: PostgreSQL, Prisma, React Query, real API | ✅ **Current** |
| **2** | Google OAuth + GBP account connection | 🔲 Next |
| **3** | Profile sync, reviews from GBP, posts, real AI agents | 🔲 Planned |
| **4** | Rankings/geo-grid, health scanner, compliance, reporting | 🔲 Planned |

### Phase 2 checklist
- [ ] `passport-google-oauth20` + `/api/v1/auth/google` callback route
- [ ] Token encryption at rest (`ENCRYPTION_KEY` env var)
- [ ] `GoogleAccount` connection flow in UI (`/profiles` → "Connect account" button)
- [ ] Remove `BYPASS_AUTH=true` from `auth.ts` middleware
- [ ] Real JWT issued on login, stored in httpOnly cookie

### Phase 3 checklist
- [ ] GBP API: `accounts.locations.list` → populate `business_profiles`
- [ ] GBP API: `accounts.locations.reviews.list` → populate `reviews`
- [ ] `SyncJob` workers (BullMQ + Redis)
- [ ] Anthropic SDK in agent chat route
- [ ] Agent memory via `agent_memory` table
