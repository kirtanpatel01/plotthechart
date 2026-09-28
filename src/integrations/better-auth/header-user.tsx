import { Link } from '@tanstack/react-router'
import { LogIn, LogOut, User } from 'lucide-react'
import { authClient } from '#/lib/auth-client'

export default function BetterAuthHeader() {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return (
      <div className="h-8 w-20 rounded-lg bg-muted animate-pulse" />
    )
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card/80 px-2.5 py-1.5 text-xs font-semibold text-foreground no-underline hover:bg-muted transition-colors"
        >
          <User className="h-3.5 w-3.5 text-primary" />
          <span className="max-w-[140px] truncate">
            {session.user.name || session.user.email}
          </span>
        </Link>
        <button
          type="button"
          onClick={() => {
            void authClient.signOut()
          }}
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          data-testid="header-signout-btn"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    )
  }

  return (
    <Link
      to="/signin"
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-semibold text-foreground no-underline hover:bg-muted transition-colors"
      data-testid="header-signin-link"
    >
      <LogIn className="h-3.5 w-3.5 text-primary" />
      Sign in / Sign up
    </Link>
  )
}
