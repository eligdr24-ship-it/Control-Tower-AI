# Control Tower AI

> AI-powered Google Business Profile management platform for agencies.

Built with React + TypeScript (client) and Node.js + Express (server). This is **Version 1** — production-ready foundation with mock data, ready for real API integration in upcoming sprints.

---

## Table of Contents

- [Features (V1)](#features-v1)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Deployment (Render)](#deployment-render)
- [GitHub Setup](#github-setup)
- [Sprint Roadmap](#sprint-roadmap)
- [Adding a New Feature Module](#adding-a-new-feature-module)

---

## Features (V1)

| Module | Status | Notes |
|---|---|---|
| Mission Control dashboard | ✅ Built | KPIs, briefing, issues, reviews, rankings |
| Business Profiles | ✅ Built | Search, filter by health, health scores |
| Reviews | ✅ Built | AI draft replies, tab filters, post reply |
| AI Agent Center | ✅ Built | 6 agents, per-agent chat, stats |
| Posts / Media / Rankings / Health / Reporting / Automation | 🔲 Placeholder | Scaffolded, ready for Sprint 2–4 |
| Google OAuth + Auth | 🔲 Sprint 1 | See `.env.example` |
| PostgreSQL + Redis | 🔲 Sprint 1 | Mock store ready to swap |
| Real GBP API calls | 🔲 Sprint 2 | Routes stubbed |
| Real AI Agents (Anthropic) | 🔲 Sprint 5 | Chat UI built, API stub in place |

---

## Tech Stack

**Client**
- React 18 + TypeScript
- React Router v6
- CSS Modules (no CSS-in-JS runtime cost)
- Vite (build tool)

**Server**
- Node.js 20 + Express 4
- TypeScript
- Helmet, CORS, rate-limiting, compression
- Morgan (request logging) + audit middleware

**Planned (future sprints)**
- PostgreSQL + Prisma ORM
- Redis (BullMQ for background workers)
- Google OAuth 2.0
- Anthropic SDK (AI agents)

---

## Project Structure

```
control-tower-ai/
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/         # AppShell, Sidebar, TopBar
│   │   │   └── ui/             # Button, Badge, EmptyState, ErrorBoundary, Skeleton
│   │   ├── data/
│   │   │   └── mock.ts         # All demo data — swap for API calls
│   │   ├── hooks/
│   │   │   ├── useAsync.ts     # Loading/error state wrapper
│   │   │   └── useNavigation.ts
│   │   ├── lib/
│   │   │   └── utils.ts        # timeAgo, formatNumber, positionToPercent…
│   │   ├── pages/              # One file per route/module
│   │   ├── types/
│   │   │   └── index.ts        # All TypeScript interfaces
│   │   └── index.css           # Design tokens (CSS custom properties)
│   ├── public/
│   │   └── favicon.svg
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── server/                     # Express API
│   └── src/
│       ├── index.ts            # App entry, middleware stack
│       ├── middleware/
│       │   ├── errorHandler.ts
│       │   └── requestLogger.ts
│       ├── routes/
│       │   ├── profiles.ts
│       │   ├── reviews.ts
│       │   ├── agents.ts
│       │   └── health.ts
│       └── services/
│           └── mockStore.ts    # Mock data — replace with DB queries
│
├── .env.example                # All environment variables documented
├── .gitignore
├── render.yaml                 # One-click Render deployment
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI
└── README.md
```

---

## Local Development

### Prerequisites

- Node.js 20+
- npm 10+

### 1. Clone and install

```bash
git clone https://github.com/YOUR_ORG/control-tower-ai.git
cd control-tower-ai

# Install client dependencies
cd client && npm install

# Install server dependencies
cd ../server && npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — at minimum set NODE_ENV=development (defaults work for local dev)
```

### 3. Start development servers

In two terminals:

```bash
# Terminal 1 — client (http://localhost:3000)
cd client && npm run dev

# Terminal 2 — server (http://localhost:4000)
cd server && npm run dev
```

The client proxies `/api` requests to `localhost:4000` via `vite.config.ts`.

### 4. Verify

- Client: http://localhost:3000
- Server health: http://localhost:4000/healthz
- API example: http://localhost:4000/api/v1/profiles

---

## Environment Variables

Copy `.env.example` to `.env` and fill in values. **Never commit `.env`.**

| Variable | Required now | Description |
|---|---|---|
| `NODE_ENV` | ✅ | `development` or `production` |
| `PORT` | ✅ | Server port (default 4000) |
| `CLIENT_ORIGIN` | Production | CORS allow-list |
| `DATABASE_URL` | Sprint 1 | PostgreSQL connection string |
| `REDIS_URL` | Sprint 1 | Redis connection string |
| `GOOGLE_CLIENT_ID` | Sprint 1 | OAuth 2.0 client ID |
| `GOOGLE_CLIENT_SECRET` | Sprint 1 | OAuth 2.0 client secret |
| `ANTHROPIC_API_KEY` | Sprint 5 | AI agents |
| `JWT_SECRET` | Sprint 1 | Minimum 64 random characters |

---

## Deployment (Render)

### Option A — render.yaml (recommended)

1. Push to GitHub.
2. In Render Dashboard → **New → Blueprint** → connect your repo.
3. Render reads `render.yaml` and creates both services automatically.
4. Add secrets via **Environment** tab (DATABASE_URL, JWT_SECRET, etc.).

### Option B — Manual

**Client (Static Site)**
- Build command: `cd client && npm install && npm run build`
- Publish path: `client/dist`
- Rewrite rule: `/* → /index.html`

**Server (Web Service)**
- Build command: `cd server && npm install && npm run build`
- Start command: `cd server && npm start`
- Health check: `/healthz`
- Node version: 20

---

## GitHub Setup

```bash
# 1. Create a new repo on github.com (do not initialise with README)

# 2. From project root:
git init
git add .
git commit -m "feat: initial production-ready scaffold (V1)"
git branch -M main
git remote add origin https://github.com/YOUR_ORG/control-tower-ai.git
git push -u origin main
```

### Recommended branch strategy

```
main        ← production (Render auto-deploys)
develop     ← integration branch
feature/*   ← individual features (PRs into develop)
```

### Branch protection (GitHub Settings → Branches)

- Require PR before merging to `main`
- Require status checks: `CI / Client` and `CI / Server`
- Dismiss stale reviews on push

---

## Sprint Roadmap

| Sprint | Focus | Key deliverables |
|---|---|---|
| 1 | Foundation | PostgreSQL schema, Auth, Google OAuth, JWT, RBAC |
| 2 | Core modules | Real GBP API: profiles, reviews, posts, media |
| 3 | Intelligence | Ranking engine, geo-grid scans |
| 4 | Health & recovery | Health scanner, compliance, recovery workflow |
| 5 | AI Agents | Anthropic SDK, agent memory, approval workflow |
| 6 | Polish | Reporting, automation, performance, e2e tests |

---

## Adding a New Feature Module

1. **Type** — add interfaces to `client/src/types/index.ts`
2. **Mock data** — add to `client/src/data/mock.ts` and `server/src/services/mockStore.ts`
3. **API route** — create `server/src/routes/yourModule.ts`, register in `server/src/index.ts`
4. **Page** — create `client/src/pages/YourModulePage.tsx` + `.module.css`
5. **Navigation** — add entry to `NAV_GROUPS` in `client/src/components/layout/Sidebar.tsx`
6. **Router** — add case to `AppShell.tsx` switch
7. **Checklist** — verify desktop, mobile, loading state, empty state, error state, RBAC

---

## License

Proprietary — all rights reserved.
