# Repository Guidelines

## Project Structure & Module Organization
- `src/app/` hosts Next.js App Router routes for dashboards, outreach, templates, and admin flows; keep route folders kebab-case.
- `src/components/` exposes reusable, typed UI primitives through `@/components`; prefer composition over duplication.
- `src/lib/` centralizes server utilities and API helpers consumed by `app` routes.
- `src/config/` stores role template JSON that must match Prisma seeds; update both together.
- `prisma/` contains schema and seed scripts; rerun migrations and seeds after edits.
- `public/` houses static assets, manifest files, and PWA icons served as-is.
- Place temporary scripts under `scripts/` only if they are repository-wide helpers; remove once obsolete.

## Build, Test, and Development Commands
- `npm install` pulls dependencies; rerun whenever `package.json` changes.
- `copy .env.example .env` prepares local secrets (never commit `.env`).
- `npm run dev` launches the Next.js dev server on http://localhost:3000 with live reload.
- `npm run build && npm run start` compiles the production bundle and serves it locally.
- `npx prisma generate` refreshes the Prisma client after schema tweaks.
- `npx prisma migrate dev --name <label>` creates and applies a migration; follow with `npm run prisma:seed` to reset demo data.

## Coding Style & Naming Conventions
- Write modern TypeScript and functional React components; add "use client" when leveraging client-only APIs.
- Favor Tailwind utility classes; avoid ad-hoc inline styles unless absolutely necessary.
- Use `camelCase` for helpers, `PascalCase` for React components and Prisma models, and kebab-case for route directories.
- Default to ASCII, keep comments purposeful, and back shared tokens via `tailwind.config.ts`.

## Testing Guidelines
- No automated suite yet; manually exercise dashboard analytics, outreach drag-and-drop, templates editor, and import/export APIs.
- Before each verification run, execute `npx prisma migrate dev` then `npm run prisma:seed` to ensure a clean dataset.
- Validate new `/api/*` endpoints with fetch scripts or REST clients while observing server logs for errors.

## Security & Configuration Tips
- Store secrets in `.env`; request current values from the ops lead and exclude them from version control.
- Keep `DEV_BYPASS_AUTH` confined to local development; disable it before demos or staging deploys.
- Align updates to `role-milestones.json` and `role-next.json` with Prisma seed adjustments.
- Set `CRON_SECRET` and include it as the `x-ign-cron-secret` header when invoking `/api/cron/daily`.
- Only populate `SLACK_WEBHOOK_URL` or `TEAMS_WEBHOOK_URL` when actively testing `/api/integrations/test`.

## Commit & Pull Request Guidelines
- Write short, imperative commit messages (e.g., `Add readiness filter logic`); separate unrelated changes.
- Flag schema or environment updates explicitly and reference related issues or cards.
- PRs should summarize user-visible impact, note manual test coverage, and attach UI screenshots or GIFs when applicable.
- Include required env vars (`GOOGLE_CLIENT_ID`, `ADMIN_EMAILS`, `DEV_BYPASS_AUTH`, `CRON_SECRET`, optional `SLACK_WEBHOOK_URL`/`TEAMS_WEBHOOK_URL`) so reviewers can reproduce the setup.
