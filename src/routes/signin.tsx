import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { authClient } from '#/lib/auth-client'

export const Route = createFileRoute('/signin')({
  component: SignInPage,
})

function SignInPage() {
  const { data: session, isPending } = authClient.useSession()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isPending) {
    return (
      <main className="flex flex-1 w-full items-center justify-center p-4">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      </main>
    )
  }

  if (session?.user) {
    return (
      <main className="flex flex-1 w-full items-center justify-center p-4">
        <section className="w-full max-w-sm rounded-xl border border-border/70 bg-card p-6 shadow-xs space-y-5">
          <div className="space-y-1 text-center">
            <h1 className="text-lg font-semibold tracking-tight">
              Welcome back
            </h1>
            <p className="text-xs text-muted-foreground">
              Signed in as {session.user.email}
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt=""
                className="h-9 w-9 rounded-full"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">
                {session.user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {session.user.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {session.user.email}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              void authClient.signOut()
            }}
            className="w-full h-9"
          >
            Sign out
          </Button>
        </section>
      </main>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignUp) {
        const result = await authClient.signUp.email({
          email,
          password,
          name,
        })
        if (result.error) {
          setError(result.error.message || 'Sign up failed')
        }
      } else {
        const result = await authClient.signIn.email({
          email,
          password,
        })
        if (result.error) {
          setError(result.error.message || 'Sign in failed')
        }
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex flex-1 w-full items-center justify-center p-4">
      <section className="w-full max-w-sm rounded-xl border border-border/70 bg-card p-6 shadow-xs space-y-5">
        <div className="space-y-1 text-center">
          <h1 className="text-lg font-semibold tracking-tight">
            {isSignUp ? 'Create an account' : 'Sign in'}
          </h1>
          <p className="text-xs text-muted-foreground">
            {isSignUp
              ? 'Enter your details below to get started'
              : 'Enter your email and password to continue'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isSignUp && (
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs">
                Name
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="h-9"
                required
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="h-9"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-9"
              required
              minLength={6}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full h-9">
            {loading ? 'Please wait...' : isSignUp ? 'Sign up' : 'Sign in'}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError('')
            }}
            className="font-medium text-foreground underline underline-offset-4 hover:opacity-80"
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </section>
    </main>
  )
}
