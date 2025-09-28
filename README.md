
# IGN Trajectory – Live Starter

Next.js + Prisma + Tailwind app to track **current roles** and **future goals** across outreaches.

## Run (Windows + VS Code)

```bash
npm install
copy .env.example .env
npx prisma generate
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts
npm run dev
```
Run additional migrations with `npm run prisma:migrate -- --name <label>` so each change gets a unique name.

Open http://localhost:3000

## Pages
- `/` – dashboard analytics (pipeline health, readiness, coverage)
- `/outreach` – live board with **outreach filter** and **quick actions** (add activity, complete next milestone)
- `/roles` – role management (CRUD + color)
- `/goal/new` – **Goal wizard** (creates goal + auto‑milestones from templates)
- `/import` – Excel importer (admin only; uses the active org scope)

## API
- `POST /api/activities` – log an activity
- `POST /api/milestones/complete-next?personId=...` – completes the next open milestone and flips goal to IN_PROGRESS if needed
- `POST /api/goals` – create a goal; archives active goals for that person and seeds milestones
- `GET /api/roles`, `POST /api/roles`, `PATCH/DELETE /api/roles/[id]`
- `GET /api/people-min` – for wizard dropdown

## Auth (NextAuth)
- By default, `.env` sets `DEV_BYPASS_AUTH=true`, so auth is **skipped** for local dev.
- To enable Google OAuth later:
  - Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
  - Set `DEV_BYPASS_AUTH=false`
  - Ensure `NEXTAUTH_URL` and `NEXTAUTH_SECRET` are set

## Alerts & Automation
- Configure `SMTP_HOST`, `SMTP_USER`, and related settings to send digests, alerts, and nudges; otherwise payloads are stored for review in the database.
- Protect `/api/cron/daily` by sending the `CRON_SECRET` value in the `x-ign-cron-secret` header when your scheduler triggers the job.

## Integrations
- Optional `SLACK_WEBHOOK_URL` and `TEAMS_WEBHOOK_URL` let `/api/integrations/test` push a quick webhook health check.
- Leave both blank locally to skip outbound webhook calls.

## Milestone Templates
Edit `src/config/role-milestones.json` to customize default checklists per target role.

## Notes
- Excel colors are not imported; add a `TargetRole` text column per sheet.
- Outreach filter uses `?outreachId=...` query string.
- `npm run prisma:seed` now provisions sample orgs, outreaches, people, goals, and activities for local demos.


## New features
- **Optimistic Analytics**: Dashboard auto-refreshes when data changes (also has a manual Refresh button).
- **Drag-and-Drop Kanban**: Move people between columns to change goal stage. Columns map to Planned / Coaching Now / Ready Next / Deferred.
- **Per-Outreach Permissions (scaffold)**: Added `OutreachAccess` model. When you disable `DEV_BYPASS_AUTH`, you can store `userEmail` + `outreachId` rows to scope leaders to their site(s) in future queries.


## Admin & RBAC
- Set `ADMIN_EMAILS` (comma-separated) in `.env`. When auth is enabled (`DEV_BYPASS_AUTH=false`), only these emails are treated as admins.
- Admins can manage per-outreach access at `/access`.
- APIs enforce access using `OutreachAccess`:
  - Actions on a `personId` require access to that person's `outreachId` (or admin).
  - The board data and outreaches are scoped to the signed-in leader unless admin.



## New Prototypes
- **Dashboard charts**: Pipeline bar chart, readiness pie, milestone completion distribution (Recharts).
- **Progress bars on cards**: Visual milestone progress on Outreach cards.
- **Milestone Template Editor**: `/templates` page with `GET/PUT /api/templates` writing to `src/config/role-milestones.json` (local dev).


## New Improvements
- **Outreach Filters**: Search, role, and status filters on the board.
- **Heatmap by Outreach**: `GET /api/activities/heatmap?days=...&outreachId=...` and a selector-ready query param (`outreachId`) on the dashboard.
- **Activities CSV Export**: `GET /api/export/activities?outreachId=...&personId=...&days=...` (RBAC enforced).
- **Printable Summary**: `/print` renders a printable dashboard + board snapshot with print CSS.


## New Features (Round 2)
- **Inline Editing in Drawer**: Edit name, current role, and outreach directly in the person drawer (PATCH `/api/person/[id]`).
- **Activity Types Chart**: Dashboard shows 30‑day activity type breakdown.
- **Batch Milestones**: `/milestones/batch` to set progress % for many people; API `POST /api/milestones/batch`.
- **Weekly Digest (Scaffold)**: Preview at `GET /api/digest/preview?outreachId=...`; send with `POST /api/digest/send` (configure SMTP in `.env`).
- **Better PWA Caching**: Service worker now uses stale‑while‑revalidate for GET `/api/*` requests for snappier loads.
- **Outreach Picker on Dashboard**: Quick filter for heatmap/charts via query string.


## New Features (Round 3)
- **Inline card edits**: Rename person and set goal target date right on the card.
- **Drag‑and‑drop milestone templates**: Reorder milestones in `/templates` via drag & drop.
- **Offline queue**: Activity batch posts enqueue when offline and auto‑flush later.
- **Weekly auto‑digest**: POST `/api/digest/run` to email all outreach leaders their digest (uses SMTP, supports simulation).
- **Saved Views**: Create shareable dashboards at `/views`, open at `/dashboard/[slug]`.


## New Features (Round 4)
- **At‑Risk insights**: Dashboard banner shows people likely needing attention (low progress or 30d inactivity).
- **Tags/Labels**: Create tags and assign/remove to people; tags appear as pills on cards.
- **Quick goal role set**: Change a person’s goal target role from the card.
- **Audit log**: `/audit` page and `/api/audit` for recent changes (activities, milestones, goals, templates, person edits).
- **WIP limit field**: `Outreach.wipLimit` column added (UI hook ready for later warnings).
- **Templates import/export** _(admin only)_: Download or POST a JSON to replace role milestone templates.


## New Features (Round 6)
- **Coaching assignments**: `Person.coachEmail`, coach selector in drawer, analytics **Coach Load** chart, `/api/coaches`.
- **Auto-advance goals**: When milestones hit 100%, mark **ACHIEVED** and auto-create the next role based on `src/config/role-next.json` (+60 days).
- **Global Search**: `/search` page and `GET /api/search?q=` (people, tags, outreaches).
- **CSV Import** _(admin only)_: `/import/people` UI and `POST /api/import/people` for quick bulk onboarding.
- **ICS Export**: `GET /api/export/ics?outreachId=...|personId=...` to subscribe to goal target dates in calendar apps.
- **Duplicates detector**: `/duplicates` page and `GET /api/people/duplicates` to spot same-name entries.


## New Features (Round 8)
- **Merge undo (soft)**: Merge now soft-deletes the source and logs to `MergeLog`; undo reactivates the source record.
- **Coach WIP limits (DB)**: `CoachLimit` model, with UI to set per-coach limits and API at `/api/coach/limits`.
- **Bulk coach reassign**: `/coach/assign` page and `/api/coach/reassign` endpoint.
- **Coach nudges via email**: Button on Coach Focus to email at‑risk summaries via `/api/nudge` (uses SMTP; simulates if not configured).
- **Saved Views → server-side filtering**: `GET /api/views/[slug]/board` returns board data filtered by outreach and tags.


## New Features (Round 9)
- **Board filters (server-side)**: `/api/board` now supports `tagIds`, `roleContains`, `status`. Outreach UI includes tag multi-select, role text filter, and status dropdown.
- **Template versioning**: `RoleTemplateVersion` model; `POST /api/templates/version`; migrate a goal with `PATCH /api/goals/[id] { migrateToVersionId }` (milestones are replaced with completion preserved by name-match); `GoalPlan.templateVersionId` added.
- **Readiness Index**: computed mix of progress, recency, and streak (API returns `readinessIndexAvg`, `readinessTop3`; board people include `readinessIndex`). Badge appears on cards (RD xx).
- **Alerts system**: `/api/alerts/preview` (HTML) and `POST /api/alerts/run { simulate?: true }` for at-risk alerts; logs to `AlertLog` and emails via SMTP if configured.


## Phase 2 Completed
- **Template history & diff**: `/templates/history` to compare versions; migrate a goal to a chosen version.
- **Readiness 2.0**: adds weekly streaks (last 8 weeks) and a tooltip on the RD badge; board sort by readiness.
- **Coach trends & redistribution**: `/api/coach/trends` for 90-day weekly series; `/api/coach/redistribute` suggestions; UI on `/coach` to view and apply.
- **Background Sync (global)**: a fetch shim queues **all** `POST /api/*` when offline and shows a queue **banner + modal** for flush/inspect. Adds `X-IGN-OFFLINE-REPLAY` header on replay.


## Phase 2 — extras
- **Coach Trends charts** (sparklines via Recharts) on `/coach`.
- **Alerts tab UI** on `/alerts` with HTML preview; `GET /api/alerts/logs`.
- **Saved Views sorting**: choose **Sort by Readiness**; applied in `/dashboard/[slug]`.
- **Coach Focus sorting**: sort by readiness on the page.
- **Daily cron endpoint**: `GET /api/cron/daily` triggers alert runs (wire this to your host's scheduled job).


## Phase 3
- **Multi-tenant (Orgs)**: `Org` and `UserOrg` models, `orgId` on Person/Outreach/Tag; org switcher at `/orgs`. APIs (board/analytics) respect `X-IGN-ORG` header or `ign_org` cookie.
- **PWA**: `public/manifest.json` + icons; manifest linked in layout for installable app.
- **Daily Focus**: `/focus` mobile-friendly page for coaches (due soon, inactive) with quick actions.
- **Slack / Teams webhooks**: `POST /api/integrations/test` sends a test message to `SLACK_WEBHOOK_URL`/`TEAMS_WEBHOOK_URL` if set.



