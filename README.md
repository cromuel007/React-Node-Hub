A full-stack user administration portal featuring JWT authentication, user profile management, messaging, and a user directory.

## 🚀 Live Demo https://react-node-hub-user-admin.vercel.app

Live Demo is deployed with:
- **Frontend:** Vercel
- **API:** Railway

## Setup ENV & Database

Rename all `.env.example` files to `.env` in the following directories:

- `/artifacts/api-server/`
- `/artifacts/mockup-sandbox/`
- `/artifacts/user-admin/`
- `/lib/db/`
- `/`

Install Docker, then start the PostgreSQL container:

- `docker compose up`

## Run & Operate

Run the following commands after the initial setup:

- `pnpm run typecheck` — Run TypeScript type checking across all packages.
- `pnpm run build` — Build all packages.
- `pnpm --filter @workspace/api-spec run codegen` — Generate the API client, React hooks, and Zod schemas from the OpenAPI specification.
- `pnpm --filter @workspace/db run push` — Push the database schema to PostgreSQL.

## Demo Accounts

Seed the database with demo users:

- `pnpm --filter @workspace/db run seed`

All seeded users use the following password:

`password123`

- `alice@example.com` — Admin
- `bob@example.com` — User
- `carol@example.com` — User
- `david@example.com` — User
- `eva@example.com` — User

Start the applications:

- `pnpm --filter @workspace/api-server run dev` — Start the API server (default port: `3000`, configurable in `.env`).
- `pnpm --filter @workspace/user-admin run dev` — Start the frontend application (default port: `3001`, configurable in `.env`).

## Stack

- pnpm Workspaces
- Node.js 24
- TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + TanStack Query + Wouter
- API: Express 5 + Pino
- Database: PostgreSQL + Drizzle ORM
- Authentication: JWT (`jsonwebtoken`) + `bcrypt`
- Validation: Zod (`zod/v4`) + `drizzle-zod`
- API Code Generation: Orval (from the OpenAPI specification)
- Build Tool: esbuild (CommonJS bundle)

## Where Things Live

- `lib/api-spec/openapi.yaml` — Single source of truth for the OpenAPI specification.
- `lib/db/src/schema/users.ts` — User table schema.
- `lib/db/src/schema/messages.ts` — Message table schema.
- `artifacts/api-server/src/routes/auth.ts` — Authentication routes (`register`, `login`, `/auth/me`).
- `artifacts/api-server/src/routes/users.ts` — User routes (list users, update profile, get user by ID).
- `artifacts/api-server/src/routes/messages.ts` — Message routes (conversations, messages).
- `artifacts/api-server/src/middlewares/auth.ts` — JWT authentication middleware (`requireAuth`) and `signToken`.
- `artifacts/user-admin/src/` — React frontend (login, register, dashboard, users, and profile pages).
- `artifacts/user-admin/src/hooks/use-auth.ts` — Authentication hook (login, logout, current user).
- `artifacts/user-admin/src/lib/api.ts` — Configures the authentication token provider for the API client.

## Architecture Decisions

- JWT access tokens are stored in `localStorage` and injected into API requests using `setAuthTokenGetter` from `@workspace/api-client-react`.
- All protected API routes are secured using the `requireAuth` middleware.
- `enabled: !!localStorage.getItem('token')` on `useGetMe` prevents unnecessary unauthenticated `401 Unauthorized` requests.
- Every TanStack Query v5 hook defines a `queryKey` to ensure strict type safety.

## Contact

- [LinkedIn](https://www.linkedin.com/in/cromuel)