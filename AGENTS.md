# Repository Guidelines

## Project Structure & Module Organization
- `src/app/` — Next.js App Router routes for dashboards, outreach, templates, and admin flows.
- `src/components/` — shared UI elements; import via `@/components` alias.
- `src/lib/` — server helpers, data fetchers, and utility modules backing API routes.
- `src/config/` — JSON templates powering milestone defaults and role progressions (`role-milestones.json`, `role-next.json`).
- `prisma/schema.prisma` & `prisma/seed.ts` — database models and seed data; update both when adjusting domain models.
- `public/` — static assets, PWA icons, and manifest; keep branding resources here.

## Build, Test, and Development Commands
- `npm install` — fetch dependencies; rerun after editing `package.json`.
- `copy .env.example .env` — scaffold local env; edit secrets without committing them.
- `npx prisma generate` / `npm run prisma:generate` — sync Prisma client after schema changes.
- `npx prisma migrate dev --name <label>` / `npm run prisma:migrate` — apply local migrations.
- `npx ts-node prisma/seed.ts` / `npm run prisma:seed` — load demo data for local workflows.
- `npm run dev` — start Next.js dev server at http://localhost:3000.
- `npm run build && npm run start` — produce and serve the production bundle.

## Coding Style & Naming Conventions
- TypeScript throughout; split client/server components per App Router rules ("use client" on interactive pages).
- Prefer functional components, React hooks, and `camelCase` helpers; use `PascalCase` for component files and `kebab-case` route segments.
- Tailwind CSS handles styling; manage shared tokens in `tailwind.config.ts`, avoid ad-hoc inline styles.
- Prisma models stay PascalCase; add enums/relations with descriptive singular names.

## Testing Guidelines
- No automated suite yet; validate key flows manually: dashboard analytics, outreach board drag/drop, templates editor, import/export endpoints.
- Reset data with `npx prisma migrate dev` then `npm run prisma:seed` when verifying schema changes.
- For new APIs, exercise the corresponding `/api/*` route via fetch, REST client, or integration script and review server logs.

## Commit & Pull Request Guidelines
- Use short imperative commit subjects (~50 chars) with optional scope, e.g. `Add readiness filter logic`; keep unrelated changes split.
- Reference related issues/cards in the body; call out schema or env changes explicitly.
- Pull requests should include: summary of user-visible impact, test notes (manual steps), screenshots/GIFs for UI updates, and checklist for migrations or seed adjustments.
- List required env vars (`GOOGLE_CLIENT_ID`, `ADMIN_EMAILS`, `DEV_BYPASS_AUTH`) so reviewers can reproduce changes.

