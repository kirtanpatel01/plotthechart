import { Link, createFileRoute, redirect, useNavigate, useRouter } from '@tanstack/react-router'
import { Eye, EyeOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { z } from 'zod'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { authClient } from '#/lib/auth-client'
import { getServerSessionFn } from '#/lib/charts/projects.functions'

const signinSearchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/_public/signin')({
  validateSearch: signinSearchSchema,
  beforeLoad: async ({ search }) => {
    const session = await getServerSessionFn()
    if (session?.user) {
      throw redirect({ to: (search.redirect as any) || '/saved-projects' })
    }
  },
  component: SignInPage,
})

function SignInPage() {
  const router = useRouter()
  const navigate = useNavigate()
  const search = Route.useSearch()
  const redirectUrl = search.redirect || '/saved-projects'
  
  const { data: session, isPending } = authClient.useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session?.user) {
      if (session.user.emailVerified) {
        void navigate({ to: redirectUrl as any, replace: true })
      } else {
        void navigate({ to: '/verify-email', replace: true })
      }
    }
  }, [session?.user, navigate, redirectUrl])

  if (isPending || session?.user) {
    return (
      <main className="flex flex-1 w-full items-center justify-center p-4">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      </main>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await authClient.signIn.email({
        email: email.trim(),
        password,
      })
      if (result.error) {
        setError(result.error.message || 'Sign in failed')
        return
      }
      await router.invalidate()
      const currentSession = await authClient.getSession()
      if (currentSession.data?.user?.emailVerified) {
        await navigate({ to: redirectUrl as any, replace: true })
      } else {
        await navigate({ to: '/verify-email', replace: true })
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
          <h1 className="text-lg font-semibold tracking-tight">Sign in</h1>
          <p className="text-xs text-muted-foreground">
            Enter your email and password to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
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
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="h-9 pr-9"
                required
                minLength={6}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-9 w-9 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="sr-only">Toggle password visibility</span>
              </Button>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full h-9">
            {loading ? 'Please wait...' : 'Sign in'}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link
            to="/signup"
            className="font-medium text-foreground underline underline-offset-4 hover:opacity-80"
          >
            Sign up
          </Link>
        </p>
      </section>
    </main>
  )
}





