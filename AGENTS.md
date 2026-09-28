<!-- intent-skills:start -->
## Skill Loading

Before editing files for a substantial task:
- Run `pnpm dlx @tanstack/intent@latest list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `pnpm dlx @tanstack/intent@latest load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->

# AGENTS.md — PlotTheChart (TanStack Start Data Visualization Studio)

This document maintains durable project context, CLI scaffolding history, TanStack Intent skill mappings, architectural decisions, environment variable requirements, and operational guidance for coding agents and developers.

---

## 1. Scaffolding & TanStack Intent Commands Used

### TanStack CLI Scaffold Command
The project was scaffolded directly into the root directory (`e:\Products\plotthechart`) using the TanStack CLI:

```bash
npx @tanstack/cli@latest create my-tanstack-app --agent --package-manager pnpm --tailwind --add-ons form,shadcn,table,tanstack-query,better-auth,prisma --target-dir .
```

### Post-Scaffold & TanStack Intent Commands
```bash
pnpm install
pnpm dlx shadcn@latest add --silent --yes button select input textarea slider switch label
npx @tanstack/intent@latest install
npx @tanstack/intent@latest list
pnpm generate-routes
```

### Loaded TanStack Intent Skills
Before making architectural or library-specific changes, the following package-shipped TanStack Intent skills were loaded and applied:
- `npx @tanstack/intent@latest load @tanstack/react-start#react-start`
- `npx @tanstack/intent@latest load @tanstack/start-client-core#start-core/server-functions`
- `npx @tanstack/intent@latest load @tanstack/router-core#router-core/auth-and-guards`
- `npx @tanstack/intent@latest load @tanstack/router-core#router-core/search-params`
- `npx @tanstack/intent@latest load @tanstack/react-table#getting-started`
- `@tanstack/table-core#table-features`, `@tanstack/table-core#pagination`, `@tanstack/table-core#global-filtering`

---

## 2. Chosen Stack & Integrations

- **Framework**: TanStack Start (`@tanstack/react-start` v1.168+) + TanStack Router (`@tanstack/react-router` v1.170+) with React 19 (`react@19.3.0`)
- **Data Fetching & Caching**: TanStack Query (`@tanstack/react-query` v5) integrated with SSR router dehydration (`@tanstack/react-router-ssr-query`)
- **Data Grid / Table Engine**: TanStack Table v9 (`@tanstack/react-table` v9.2.4) using `useTable`, `tableFeatures`, `createColumnHelper`, and `<table.FlexRender />`
- **Forms & Configuration State**: TanStack Form (`@tanstack/react-form` v1.33+)
- **UI Components & Styling**: Tailwind CSS v4 (`@tailwindcss/vite`) + `shadcn/ui` Radix primitives (`button`, `select`, `input`, `textarea`, `slider`, `switch`, `label`) + `lucide-react`
- **Authentication**: Better Auth (`better-auth` v1.7+) with `tanstackStartCookies()` and `prismaAdapter` (`postgresql`)
- **Database & ORM**: Prisma ORM v7 (`prisma` / `@prisma/client` v7.10.0) with `@prisma/adapter-pg` and local Prisma Postgres (`prisma dev`)

---

## 3. Environment Variable Requirements

Configure `.env.local` (and `.env`) in the project root:

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string used by Prisma Client (`@prisma/adapter-pg`) and Prisma CLI | `postgres://postgres:postgres@localhost:5432/template1?sslmode=disable&connection_limit=10&connect_timeout=0&max_idle_connection_lifetime=0&pool_timeout=0&socket_timeout=0` |
| `BETTER_AUTH_URL` | Base URL where the TanStack Start app is served | `http://localhost:3000` |
| `BETTER_AUTH_SECRET` | Secret key used by Better Auth to sign session cookies and tokens | Generate via `pnpm dlx @better-auth/cli secret` |

### Database Setup Commands
```bash
# 1. Start local Prisma Postgres development server (if not using an external Postgres instance)
pnpm exec prisma dev --name plotthechart --db-port 5432

# 2. Generate the typed Prisma client into src/generated/prisma
pnpm db:generate

# 3. Push the Prisma schema (User, Session, Account, Verification, ChartProject, Todo) to Postgres
pnpm db:push
```

---

## 4. Key Architectural Decisions

1. **General-Purpose & Domain-Neutral Workflow (`Enter Data → Visualize → Configure → Save`)**:
   - The landing route (`src/routes/index.tsx`) renders `ChartStudio` (`src/components/charts/ChartStudio.tsx`) with a side-by-side layout:
     - **Left**: `Data / Input Panel` (Chart type selector, sample presets, raw JSON schema inspector, and adaptive data editor).
     - **Right**: `Chart / Visualization Panel` (Responsive interactive SVG renderer `ChartCanvas.tsx` + `ChartConfigPanel.tsx`).
   - Anonymous visitors can freely select chart types, enter/import data, configure chart properties, and generate/preview charts **without creating an account**.
   - Clicking **Generate Chart** finalizes the preview and unlocks the **Save Project** action.
   - Clicking **Save Project** checks authentication: unauthenticated users are prompted in-place via `SaveProjectModal.tsx` to Sign Up or Sign In without losing their entered chart data or configuration.

2. **Polymorphic Data Model (No Fixed Row/Column Assumption)**:
   - Different visualizations require fundamentally different input structures. Rather than forcing every chart into a rigid row/column table, `src/lib/charts/types.ts` defines a discriminated union (`AnyChartDataSchema`) over `schemaKind`:
     - `'tabular-series'` (`TabularSeriesInput.tsx` using TanStack Table v9): Multi-series categorical table for **Bar**, **Line**, **Area**, and **Radar** charts.
     - `'proportional-slices'` (`ProportionalSlicesInput.tsx`): Part-to-whole slice cards with live percentage calculation, unit labels, and per-slice color/notes for **Pie / Donut** charts.
     - `'coordinate-points'` (`CoordinatePointsInput.tsx`): Named clusters/cohorts and continuous `(x, y, size)` coordinate tuples for **Scatter / Bubble** plots.
     - `'hierarchical-tree'` (`HierarchicalTreeInput.tsx`): Nested parent branches and child leaf nodes with proportional weights for **Hierarchical Treemap** visualizations.
   - In `prisma/schema.prisma`, `ChartProject` stores `chartType`, `schemaKind`, `schemaVersion`, `dataPayload` (`Json`), and `configPayload` (`Json`), validated at runtime via Zod in `src/lib/charts/projects.functions.ts`.

3. **Open-Closed Extensibility via Chart Registry (`src/lib/charts/registry.ts`)**:
   - Adding a new visualization type requires **zero database migrations** and **zero core studio rewrites**:
     1. Define or reuse a `schemaKind` Zod schema in `src/lib/charts/types.ts`.
     2. Register the chart metadata, default data/config, presets, and `specificOptionFields` in `CHART_REGISTRY` (`src/lib/charts/registry.ts`).
     3. Add the rendering branch in `ChartCanvas.tsx` (and input component if introducing a new `schemaKind`).

4. **Server Function Security Boundary (`src/lib/charts/projects.functions.ts`)**:
   - All private project mutations and queries (`listMyChartProjectsFn`, `getChartProjectByIdFn`, `saveChartProjectFn`, `duplicateChartProjectFn`, `deleteChartProjectFn`) use `createServerFn` and verify the Better Auth session directly inside the handler using `getRequest().headers` and `auth.api.getSession`, setting `Cache-Control: private, no-store`.

---

## 5. Known Gotchas

- **TanStack Table v9 API**: `@tanstack/react-table` is v9 (`9.2.4`). Do **not** use v8 `useReactTable` or `getCoreRowModel`. Always use `tableFeatures({...})`, `createColumnHelper<typeof features, TData>()`, `columnHelper.columns([...])`, `useTable({ features, data, columns })`, and `<table.FlexRender />`.
- **TanStack Start Server Headers**: Import `getRequest` and `setResponseHeader` from `@tanstack/react-start/server`. Use `setResponseHeader('Cache-Control', 'private, no-store')` on session-dependent responses.
- **Prisma v7 Config**: `prisma.config.ts` uses `process.loadEnvFile('.env.local')` so `pnpm exec prisma ...` commands automatically resolve `DATABASE_URL`.
- **`@tanstack/devtools-vite` Console Piping & Browser Extension Attributes**: In `vite.config.ts`, `devtools({ consolePiping: { enabled: false } })` disables bidirectional client↔server console piping so client-side `console.error` calls are not echoed back and forth between the browser and Vite dev server. Additionally, both `<html>` and `<body>` in `src/routes/__root.tsx` include `suppressHydrationWarning` so browser extensions that inject DOM attributes onto `<body>` (e.g. `cz-shortcut-listen="true"`) do not trigger hydration warnings.

---

## 6. Next Steps & Deployment Notes

- **Production Deployment**: Set `DATABASE_URL` to a managed PostgreSQL instance (e.g. Neon, Supabase, Railway, or Prisma Postgres), set a strong random `BETTER_AUTH_SECRET`, and set `BETTER_AUTH_URL` to the production origin.
- **Build & Start**: Run `pnpm build` (`vite build`) and serve the Nitro/Start output.
