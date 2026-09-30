import { Link, createFileRoute, redirect, useNavigate, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { z } from 'zod'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { authClient } from '#/lib/auth-client'
import { getServerSessionFn } from '#/lib/charts/projects.functions'

const SignUpSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
})

export const Route = createFileRoute('/signup')({
  beforeLoad: async () => {
    const session = await getServerSessionFn()
    if (session?.user) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: SignUpPage,
})

function SignUpPage() {
  const router = useRouter()
  const navigate = useNavigate()
  const { data: session, isPending } = authClient.useSession()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session?.user) {
      void navigate({ to: '/dashboard', replace: true })
    }
  }, [session?.user, navigate])

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
      const parsed = SignUpSchema.safeParse({
        name,
        email,
        password,
      })
      if (!parsed.success) {
        setError(parsed.error.errors[0].message)
        setLoading(false)
        return
      }

      const result = await authClient.signUp.email({
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
      })
      if (result.error) {
        setError(result.error.message || 'Sign up failed')
        return
      }
      await router.invalidate()
      await navigate({ to: '/dashboard', replace: true })
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
            Create an account
          </h1>
          <p className="text-xs text-muted-foreground">
            Enter your details below to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
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
            {loading ? 'Please wait...' : 'Sign up'}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{' '}
          <Link
            to="/signin"
            className="font-medium text-foreground underline underline-offset-4 hover:opacity-80"
          >
            Sign in
          </Link>
        </p>
      </section>
    </main>
  )
}
