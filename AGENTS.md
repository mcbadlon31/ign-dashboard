# Repository Guidelines

## Project Structure & Module Organization
- `src/app/` holds Next.js App Router routes for dashboards, outreach, templates, admin flows; segment folders in kebab-case.
- `src/components/` contains shared UI pieces accessible via `@/components`; keep components reusable and typed.
- `src/lib/` stores server utilities and API helpers backing `app` routes.
- `src/config/` carries JSON role templates; sync updates with Prisma seed data.
- `prisma/` defines database models and seed scripts; run Prisma commands after edits.
- `public/` hosts static assets, PWA icons, and manifest resources.

## Build, Test, and Development Commands
- `npm install` fetches dependencies; rerun after `package.json` updates.
- `copy .env.example .env` primes local environment secrets (never commit `.env`).
- `npm run dev` starts the Next.js dev server at http://localhost:3000.
- `npm run build && npm run start` compiles and serves the production bundle.
- `npx prisma generate` refreshes the Prisma client; `npx prisma migrate dev --name <label>` applies local schema changes.
- `npm run prisma:seed` reloads demo data; run after migrations to reset state.

## Coding Style & Naming Conventions
- Write modern TypeScript with functional React components; mark client components via "use client".
- Rely on Tailwind utility classes; shared tokens live in `tailwind.config.ts`.
- Use `camelCase` for helpers, `PascalCase` for components and Prisma models, kebab-case route directories.
- Default to ASCII, avoid ad-hoc inline styles, and keep comments purposeful.

## Testing Guidelines
- No automated suite yet; manually cover dashboard analytics, outreach drag/drop, templates editor, and import/export APIs.
- Before verification, run `npx prisma migrate dev` then `npm run prisma:seed` to reset data.
- Exercise new `/api/*` endpoints via fetch scripts or REST clients while watching server logs.

## Security & Configuration Tips
- Secrets live in `.env`; request current values from the ops lead and keep them out of version control.
- Limit `DEV_BYPASS_AUTH` to local development and disable it before demos or staging deploys.
- Update `role-milestones.json` and `role-next.json` in tandem with Prisma seeds to avoid drift in onboarding flows.
- Set `CRON_SECRET` and send it as the `x-ign-cron-secret` header when triggering `/api/cron/daily` from a scheduler.
- Populate `SLACK_WEBHOOK_URL` / `TEAMS_WEBHOOK_URL` only when you intend to hit `/api/integrations/test`; leave both blank for local dev.

## Commit & Pull Request Guidelines
- Keep commits short, imperative (e.g. `Add readiness filter logic`); separate unrelated changes.
- Reference related issues/cards, and flag schema or env updates explicitly.
- PRs should outline user-visible impact, include manual test notes, and attach screenshots or GIFs for UI changes.
- List required env vars (`GOOGLE_CLIENT_ID`, `ADMIN_EMAILS`, `DEV_BYPASS_AUTH`, `CRON_SECRET`, optional `SLACK_WEBHOOK_URL`/`TEAMS_WEBHOOK_URL`) so reviewers can reproduce.
