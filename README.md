<div align="center">
  <img src="./public/logo.png" alt="PlotTheChart Logo" width="72" height="72" />
  <h1>PlotTheChart</h1>
  <p><strong>Open-Source Data Visualization Studio built with TanStack Start</strong></p>
</div>

---

**PlotTheChart** is an open-source web workspace for creating, configuring, saving, and exporting SVG charts. Visitors can enter or paste data, switch between chart types, customize palettes and geometry, and download `.svg` files without an account—or sign in to save and manage projects in a personal dashboard.

## Features

- **7 Chart Types**:
  - **Bar Chart** (`tabular-series`): Grouped, stacked, or 100% normalized vertical/horizontal bars.
  - **Line Chart** (`tabular-series`): Multi-series trend lines with smooth/linear interpolation and optional area fill.
  - **Area Chart** (`tabular-series`): Overlapping or stacked cumulative area charts.
  - **Pie / Donut Chart** (`proportional-slices`): Part-to-whole slices with adjustable donut inner radius, slice padding, and percentage/value labels.
  - **Scatter / Bubble Plot** (`coordinate-points`): Continuous `(x, y, size)` coordinates grouped by named clusters with optional linear trendline.
  - **Radar / Spider Chart** (`tabular-series`): Multi-axis polygon comparison across categorical dimensions.
  - **Hierarchical Treemap** (`hierarchical-tree`): Nested parent/child proportional blocks.
- **4 Schema-Specific Data Editors**:
  - **Tabular Series Grid** (powered by TanStack Table v9) with multi-series columns and **CSV / TSV paste import**.
  - **Proportional Slices Editor** with custom per-slice color pickers, notes, sorting, and 100% normalization.
  - **Coordinate Points Editor** with cluster cohorts and `(x, y, size)` tuples.
  - **Hierarchical Tree Editor** with expandable parent branches and child leaf nodes.
  - **JSON Schema Inspector** with one-click copy.
- **8 Built-in Color Palettes & Styling Controls**:
  - `Ocean Teal`, `Emerald Forest`, `Amber Sunset`, `Royal Indigo`, `Rose Coral`, `Slate Mono`, `Cyber Mint`, and `Berry Plum`.
  - Configure chart titles, subtitles, X/Y axis labels, legend position (`top`, `bottom`, `none`), gridlines, value labels, and chart-specific geometry options.
- **Interactive SVG Renderer & Export**:
  - Responsive vector canvas with hover value tooltips and one-click `.svg` file download.
- **Saved Projects Dashboard**:
  - Email/password authentication via Better Auth.
  - Save, search, filter by chart type, duplicate, reopen, and delete chart projects stored in PostgreSQL.

---

## Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) + [TanStack Router](https://tanstack.com/router) (React 19)
- **Data Fetching**: [TanStack Query v5](https://tanstack.com/query) with SSR router integration
- **Data Grid**: [TanStack Table v9](https://tanstack.com/table)
- **Styling & UI**: [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) + [Lucide Icons](https://lucide.dev/)
- **Authentication**: [Better Auth](https://www.better-auth.com/) (`better-auth` with Prisma adapter)
- **Database & ORM**: [Prisma ORM v7](https://www.prisma.io/) (`@prisma/client` + `@prisma/adapter-pg`) with PostgreSQL

---

## Getting Started

### Prerequisites

- **Node.js** 20+
- **pnpm** 9+
- **PostgreSQL** database (or use the built-in local Prisma Postgres server via `pnpm exec prisma dev`)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/kirtanpatel01/plotthechart.git
cd plotthechart
pnpm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
DATABASE_URL="postgres://postgres:postgres@localhost:5432/plotthechart?sslmode=disable"
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="your-secret-key"
```

You can generate a secure `BETTER_AUTH_SECRET` with:

```bash
pnpm dlx @better-auth/cli secret
```

### 3. Initialize the Database

If you don't have a local PostgreSQL instance running, you can start a local Prisma Postgres development server:

```bash
pnpm exec prisma dev --name plotthechart --db-port 5432
```

Then generate the Prisma client and push the schema:

```bash
pnpm db:generate
pnpm db:push
```

### 4. Start the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser:
- `/` — Standalone landing page
- `/studio` — Interactive Chart Studio
- `/dashboard` — Saved Projects dashboard
- `/about` — Architecture & schema overview
- `/signin` — Sign in / Sign up

---

## Project Structure

```text
├── prisma/
│   └── schema.prisma                  # User, Session, Account, Verification, ChartProject models
├── public/
│   ├── logo.png                       # App logo
│   ├── favicon.png                    # PNG favicon
│   └── favicon.ico                    # ICO favicon
└── src/
    ├── components/
    │   ├── app-sidebar.tsx            # Collapsible workspace sidebar
    │   ├── charts/
    │   │   ├── ChartStudio.tsx        # Main studio workspace (data input + live preview)
    │   │   ├── ChartCanvas.tsx        # Interactive SVG renderer for all 7 chart types
    │   │   ├── ChartConfigPanel.tsx   # Palette, axes, legend, and chart-specific settings
    │   │   ├── SaveProjectModal.tsx   # Project save & inline auth modal
    │   │   └── inputs/                # Schema-specific data editors
    │   └── ui/                        # shadcn/ui primitives
    ├── lib/
    │   ├── auth.ts                    # Better Auth server configuration
    │   ├── auth-client.ts             # Better Auth client hooks
    │   └── charts/
    │       ├── types.ts               # Polymorphic Zod schemas & color palettes
    │       ├── registry.ts            # Declarative chart registry & default configs
    │       └── projects.functions.ts  # Authenticated server functions for CRUD
    └── routes/
        ├── __root.tsx                 # Root document & layout switcher
        ├── index.tsx                  # Standalone landing page
        ├── studio.tsx                 # Chart Studio route (/studio)
        ├── dashboard.tsx              # Saved Projects dashboard (/dashboard)
        ├── about.tsx                  # Architecture overview (/about)
        └── signin.tsx                 # Authentication page (/signin)
```

---

## Extending With a New Chart Type

PlotTheChart uses a polymorphic `schemaKind` union and a declarative chart registry so new chart types can be added without database migrations:

1. **Schema (`src/lib/charts/types.ts`)**: Reuse an existing `schemaKind` (`tabular-series`, `proportional-slices`, `coordinate-points`, `hierarchical-tree`) or add a new Zod schema to `AnyChartDataSchema`.
2. **Registry (`src/lib/charts/registry.ts`)**: Register the chart type metadata, blank `defaultData()`, `defaultConfig()`, and `specificOptionFields` in `CHART_REGISTRY`.
3. **Renderer (`src/components/charts/ChartCanvas.tsx`)**: Add the SVG rendering branch for the new chart type.

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Start the Vite development server on port `3000` |
| `pnpm build` | Build the application for production |
| `pnpm preview` | Preview the production build locally |
| `pnpm generate-routes` | Regenerate TanStack Router route tree (`src/routeTree.gen.ts`) |
| `pnpm db:generate` | Generate the typed Prisma client into `src/generated/prisma` |
| `pnpm db:push` | Push the Prisma schema to PostgreSQL |
| `pnpm db:studio` | Open Prisma Studio to inspect database records |

---

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to fork the repository, create a feature branch, and open a pull request.

## License

This project is open-source and available under the [MIT License](https://opensource.org/licenses/MIT).
