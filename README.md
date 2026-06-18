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
