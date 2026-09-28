import { Link } from '@tanstack/react-router'
import { BarChart3, FolderKanban, Sparkles } from 'lucide-react'
import BetterAuthHeader from '../integrations/better-auth/header-user.tsx'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 pt-[env(safe-area-inset-top,0px)] backdrop-blur-lg">
      <nav className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-4 gap-y-2 py-2.5 sm:px-2">
        <h2 className="m-0 flex-shrink-0 text-base font-bold tracking-tight">
          <Link
            to="/"
            search={{}}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3.5 py-1.5 text-sm font-bold text-[var(--sea-ink)] no-underline shadow-[0_8px_24px_rgba(30,90,72,0.08)]"
          >
            <BarChart3 className="h-4 w-4 text-[var(--lagoon-deep)]" />
            PlotTheChart
          </Link>
        </h2>

        <div className="order-3 flex w-full flex-wrap items-center gap-x-5 gap-y-1 pb-1 text-xs font-semibold sm:order-none sm:w-auto sm:flex-nowrap sm:pb-0">
          <Link
            to="/"
            search={{}}
            className="nav-link inline-flex items-center gap-1.5"
            activeProps={{ className: 'nav-link is-active inline-flex items-center gap-1.5' }}
            activeOptions={{ exact: true }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Chart Studio
          </Link>
          <Link
            to="/dashboard"
            className="nav-link inline-flex items-center gap-1.5"
            activeProps={{ className: 'nav-link is-active inline-flex items-center gap-1.5' }}
          >
            <FolderKanban className="h-3.5 w-3.5" />
            Saved Projects
          </Link>
          <Link
            to="/about"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            Architecture
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <BetterAuthHeader />
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
