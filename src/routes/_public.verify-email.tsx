import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { authClient } from '#/lib/auth-client'
import { MailCheck } from 'lucide-react'
import { useState } from 'react'
import { getServerSessionFn } from '#/lib/charts/projects.functions'

export const Route = createFileRoute('/_public/verify-email')({
  loader: async () => {
    const session = await getServerSessionFn()
    return { session }
  },
  component: VerifyEmailPage,
})

function VerifyEmailPage() {
  const { session } = Route.useLoaderData()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  if (!session?.user) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-[calc(100vh-8rem)]">
        <p>Please sign in to continue.</p>
        <Button onClick={() => navigate({ to: '/signin' })} className="mt-4">
          Sign In
        </Button>
      </div>
    )
  }

  if (session.user.emailVerified) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-[calc(100vh-8rem)]">
        <p>Your email is already verified!</p>
        <Button onClick={() => navigate({ to: '/workspace' })} className="mt-4">
          Go to Workspace
        </Button>
      </div>
    )
  }

  const handleResend = async () => {
    setLoading(true)
    setError('')
    try {
      await authClient.sendVerificationEmail({
        email: session.user.email,
        callbackURL: '/workspace'
      })
      setSent(true)
    } catch (err: any) {
      setError(err?.message || 'Failed to resend verification email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 h-[calc(100vh-8rem)] max-w-md mx-auto text-center space-y-6">
      <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
        <MailCheck className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-2xl font-bold">Check your email</h1>
      <p className="text-muted-foreground">
        We sent a verification link to <span className="font-medium text-foreground">{session.user.email}</span>.
        Please verify your email address to access your workspace.
      </p>

      {error && <p className="text-destructive text-sm">{error}</p>}
      
      {sent ? (
        <p className="text-emerald-500 font-medium text-sm">Verification email sent! Check your inbox.</p>
      ) : (
        <Button onClick={handleResend} disabled={loading} variant="outline" className="w-full">
          {loading ? 'Sending...' : 'Resend Verification Email'}
        </Button>
      )}

      <Button variant="ghost" onClick={async () => {
        await authClient.signOut()
        navigate({ to: '/signin' })
      }} className="w-full">
        Sign out
      </Button>
    </div>
  )
}
