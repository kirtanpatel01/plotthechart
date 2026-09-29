export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto w-full border-t border-border/40 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] text-xs text-muted-foreground">
      <div className="flex w-full flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
        <p className="m-0 inline-flex items-center gap-1.5">
          <img
            src="/logo.png"
            alt=""
            className="size-4 shrink-0 rounded-xs object-contain"
          />
          <span>&copy; {year} PlotTheChart</span>
        </p>
        <p className="m-0">Data Visualization Studio</p>
      </div>
    </footer>
  )
}
