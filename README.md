# UNSW PakSoc Manager

Full-stack society management platform built with React + TypeScript (frontend) and Node + Express + TypeScript (backend), backed by Supabase.

## Stack
- **Frontend**: React 18, TypeScript, Vite, React Router v6, Supabase JS
- **Backend**: Node.js, Express, TypeScript, Supabase Admin SDK
- **Database/Auth**: Supabase (Postgres + Auth)
- **Dev environment**: Docker Compose

## Getting Started

### Without Docker
```bash
# Frontend
cd client && npm install && npm run dev

# Backend (new terminal)
cd server && npm install && npm run dev
```

### With Docker
```bash
docker-compose up --build
```

### Sandbox mode (on by default in dev)
Reads come from the real database, but every write — rows and image uploads — is kept
in your browser instead of being saved, so real users never see your test changes.
`npm run dev` is safe; a yellow badge in the corner confirms it and resets your local
changes. To write for real from localhost you must opt out with `npm run dev:live`,
which shows a red warning banner the whole time.
See [app/src/core/supabase/sandbox/README.md](app/src/core/supabase/sandbox/README.md).

- Client → http://localhost:5173
- Server → http://localhost:4000
- Health check → http://localhost:4000/api/health

## Environment Variables

Copy the example files and fill in your Supabase credentials:
```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

## Folder Structure

```
├── client/src/
│   ├── components/        # Shared UI components
│   ├── hooks/             # Custom React hooks (useAuth, useEvents…)
│   ├── layouts/           # Page wrappers (DashboardLayout, AuthLayout)
│   ├── lib/               # Supabase client config
│   ├── services/          # API call helpers
│   └── pages/
│       ├── public/        # Visible to everyone
│       ├── member/        # Logged-in members only
│       ├── subcom/        # Sub-committee only
│       └── exec/          # Exec / admins only
│           └── presidents/
└── server/src/
    ├── controllers/
    ├── middleware/
    └── routes/
```
