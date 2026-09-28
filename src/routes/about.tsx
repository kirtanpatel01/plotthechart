import { Link, createFileRoute } from '@tanstack/react-router'
import { CHART_TYPES_LIST } from '#/lib/charts/registry'

export const Route = createFileRoute('/about')({
  component: AboutPage,
})

function AboutPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 space-y-8">
      <section className="rounded-2xl border border-border bg-card/85 p-8 space-y-4">
        <p className="island-kicker">Architecture &amp; Extensibility</p>
        <h1 className="text-3xl font-bold tracking-tight">
          Polymorphic Schema &amp; Chart Registry Design
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
          PlotTheChart is designed so new visualization types and custom
          data-input schemas can be added without rewriting the core
          application or migrating database tables. Each chart type registers
          its own Zod data schema, adaptive input UI, SVG renderer, and
          chart-specific configuration fields.
        </p>
        <div className="pt-2">
          <Link
            to="/"
            search={{}}
            className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground no-underline"
          >
            Launch Chart Studio →
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CHART_TYPES_LIST.map((def) => (
          <article
            key={def.type}
            className="stagger-item rounded-xl border border-border bg-card/75 p-5 space-y-2"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold">{def.label}</h2>
              <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-semibold">
                {def.schemaKind}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {def.shortDescription}
            </p>
          </article>
        ))}
      </section>
    </main>
  )
}
