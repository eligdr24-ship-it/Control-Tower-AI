# Control Tower AI

AI-powered Google Business Profile management for agencies.

## Deploy workflow

`dist/` folders are **committed to the repo**. Render serves them directly — no TypeScript compilation on Render, no Prisma binary downloads, no build-time failures.

**Before every push to production:**
```bash
cd server && npm run build   # compiles src/ → dist/
cd ../client && npm run build # compiles src/ → dist/
cd ..
git add server/dist client/dist
git commit -m "build: update compiled output"
git push
```

Render then just runs `npm install --omit=dev` and `node dist/index.js`.

---

## Local development

### Prerequisites
- Node.js 20+
- PostgreSQL running locally

### Setup
```bash
# Install all deps
cd client && npm install
cd ../server && npm install

# Configure env
cp .env.example server/.env
# Edit server/.env: set DATABASE_URL and JWT_SECRET

# Set up database
cd server
npx prisma db push        # create tables
npx prisma db seed        # load demo data (optional)

# Start dev servers (two terminals)
npm run dev               # server on :4000
cd ../client && npm run dev  # client on :3000
```

Demo login: `admin@peakgrowth.agency` / `demo1234`

---

## Required environment variables

### API service (Render → control-tower-ai-api → Environment)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `DIRECT_URL` | ✅ | Same as DATABASE_URL |
| `JWT_SECRET` | ✅ | 64+ random hex chars |
| `JWT_EXPIRES_IN` | ✅ | Token TTL (default: `7d`) |
| `CLIENT_ORIGIN` | ✅ | `https://control-tower-ai-client.onrender.com` |
| `NODE_ENV` | ✅ | `production` |
| `GOOGLE_CLIENT_ID` | Phase 2 | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Phase 2 | From Google Cloud Console |
| `GOOGLE_REDIRECT_URI` | Phase 2 | `https://control-tower-ai-api.onrender.com/api/v1/auth/google/callback` |
| `ENCRYPTION_KEY` | Phase 2 | 64 hex chars: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

### Client service (Render → control-tower-ai-client → Environment)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | ✅ | `https://control-tower-ai-api.onrender.com` |

> **Important:** `VITE_API_URL` is baked into the JS bundle at build time.
> After changing it, rebuild `client/dist/` and commit before pushing.

---

## Render deploy (Blueprint)

1. Push repo to GitHub (with `dist/` committed)
2. Render Dashboard → **New → Blueprint** → connect repo
3. Render reads `render.yaml` and creates API service + client site + PostgreSQL
4. Add secrets manually: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ENCRYPTION_KEY`

### Verify deployment
```bash
curl https://control-tower-ai-api.onrender.com/healthz
# Expected: {"status":"ok","db":"ok","cors":{"clientOrigin":"https://control-tower-ai-client.onrender.com"}}
```

---

## Project structure

```
control-tower-ai/
├── client/
│   ├── dist/          ← committed, served by Render directly
│   └── src/
│       ├── api/       ← Axios client + React Query functions
│       ├── components/
│       ├── context/   ← AuthContext, useAuth
│       ├── data/mock.ts
│       ├── pages/
│       └── types/
├── server/
│   ├── dist/          ← committed, run by Render directly
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── start.sh       ← runs migrations then node dist/index.js
│   └── src/
│       ├── config/    ← env validation (Zod)
│       ├── lib/       ← crypto, jwt, logger, errors
│       ├── middleware/ ← auth, cors, error handler
│       └── modules/   ← auth, profiles, reviews, agents, dashboard
├── .env.example
├── render.yaml
└── README.md
```
