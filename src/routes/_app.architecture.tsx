import { Link, createFileRoute } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { CHART_TYPES_LIST } from '#/lib/charts/registry'

export const Route = createFileRoute('/_app/architecture')({
  component: ArchitecturePage,
})

function ArchitecturePage() {
  return (
    <main className="w-full min-w-0 p-3 sm:p-6 space-y-6 sm:space-y-8">
      <section className="rounded-2xl border border-border bg-card/85 p-5 sm:p-8 space-y-3.5 sm:space-y-4">
        <p className="text-[0.69rem] font-bold uppercase tracking-[0.14em] text-primary">
          Architecture &amp; Extensibility
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Polymorphic Schema &amp; Chart Registry Design
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-4xl">
          PlotTheChart is designed so new visualization types and custom
          data-input schemas can be added without rewriting the core
          application or migrating database tables. Each chart type registers
          its own Zod data schema, adaptive input UI, SVG renderer, and
          chart-specific configuration fields.
        </p>
        <div className="pt-2">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link to="/workspace" search={{}} className="no-underline">
              Launch Chart Studio →
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3.5 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {CHART_TYPES_LIST.map((def) => (
          <article
            key={def.type}
            className="animate-in fade-in slide-in-from-bottom-2 duration-200 rounded-xl border border-border bg-card/75 p-4 sm:p-5 space-y-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm sm:text-base font-bold">{def.label}</h2>
              <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {def.schemaKind}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {def.shortDescription}
            </p>
          </article>
        ))}
      </section>
    </main>
  )
}
