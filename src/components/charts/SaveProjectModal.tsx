import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { authClient } from '#/lib/auth-client'

export function SaveProjectModal({
  isOpen,
  onOpenChange,
  onSuccess,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}) {
  const router = useRouter()
  const [mode, setMode] = useState<'signin' | 'signup'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (mode === 'signup') {
        const { error: signUpError } = await authClient.signUp.email({
          email,
          password,
          name,
        })
        if (signUpError) {
          setError(signUpError.message || 'An error occurred during sign up.')
        } else {
          setIsSuccess(true)
          await router.invalidate()
          onSuccess?.()
          setTimeout(() => {
            onOpenChange(false)
          }, 2000)
        }
      } else {
        const { error: signInError } = await authClient.signIn.email({
          email,
          password,
        })
        if (signInError) {
          setError(signInError.message || 'Invalid email or password.')
        } else {
          await router.invalidate()
          onSuccess?.()
          onOpenChange(false)
        }
      }
    } catch (err) {
      setError('An unexpected error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Your Chart Project</DialogTitle>
          <DialogDescription>
            You need to be signed in to save and manage your chart projects. 
            Your current progress will be preserved.
          </DialogDescription>
        </DialogHeader>
        {isSuccess ? (
          <div className="py-6 text-center space-y-4">
            <h3 className="text-lg font-semibold text-primary">Success!</h3>
            <p className="text-sm text-muted-foreground">
              Your account has been created. You can now save your project. 
              (Please check your email to verify your account later).
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" className="w-full mt-2" disabled={isLoading}>
              {isLoading ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
            </Button>
            <div className="text-center text-sm mt-2">
              <button
                type="button"
                className="text-muted-foreground underline hover:text-foreground"
                onClick={() => {
                  setMode(mode === 'signup' ? 'signin' : 'signup')
                  setError('')
                }}
              >
                {mode === 'signup'
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
