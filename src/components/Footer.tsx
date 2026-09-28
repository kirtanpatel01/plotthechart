export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-16 w-full border-t border-border/40 px-6 py-6 text-muted-foreground">
      <div className="flex w-full flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
        <p className="m-0">
          &copy; {year} PlotTheChart
        </p>
        <p className="m-0">
          Data Visualization Studio
        </p>
      </div>
    </footer>
  )
}
