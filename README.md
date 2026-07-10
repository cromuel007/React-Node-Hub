A full-stack user administration portal with JWT authentication, profile editing, messaging feature, and a user directory.

## Setup Database

RENAME ALL .env.example TO .env

Install docker and run 
- `docker compose up` — create docker container for PostgreSQL

## Run & Operate

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)


## Demo accounts
- `pnpm --filter @workspace/db run seed` — seed DB users (dev only)

    All seeded users have password: `password123`

    - `alice@example.com` — admin role
    - `bob@example.com` — user role
    - `carol@example.com` — user role
    - `david@example.com` — user role
    - `eva@example.com` — user role

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 3000)
- `pnpm --filter @workspace/user-admin run dev` — run the frontend (port 3001)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + TanStack Query + Wouter
- API: Express 5 + pino logging
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT (jsonwebtoken + bcrypt)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/users.ts` — users table definition
- `lib/db/src/schema/messages.ts` — messages table definition
- `artifacts/api-server/src/routes/auth.ts` — register, login, /auth/me
- `artifacts/api-server/src/routes/users.ts` — list users, update profile, get user by ID
- `artifacts/api-server/src/middlewares/auth.ts` — JWT requireAuth middleware + signToken
- `artifacts/user-admin/src/` — React frontend (pages: login, register, dashboard, users, profile)
- `artifacts/user-admin/src/hooks/use-auth.ts` — auth hook (login, logout, current user)
- `artifacts/user-admin/src/lib/api.ts` — sets up auth token getter for API client

## Architecture decisions

- JWT stored in `localStorage`; injected via `setAuthTokenGetter` from `@workspace/api-client-react`
- All protected routes gate on `requireAuth` middleware server-side
- `enabled: !!localStorage.getItem('token')` on `useGetMe` prevents unauthenticated 401 floods
- `queryKey` is always supplied to TanStack Query v5 hooks to satisfy strict typing

