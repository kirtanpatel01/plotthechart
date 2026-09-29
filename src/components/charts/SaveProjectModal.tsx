import React, { useEffect, useState } from 'react'
import { CheckCircle2, Save, X } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { authClient } from '#/lib/auth-client'

interface SaveProjectModalProps {
  open: boolean
  onClose: () => void
  initialName: string
  initialDescription: string
  isUpdatingExisting: boolean
  onSaveConfirmed: (details: {
    name: string
    description: string
  }) => Promise<void>
}

export function SaveProjectModal({
  open,
  onClose,
  initialName,
  initialDescription,
  isUpdatingExisting,
  onSaveConfirmed,
}: SaveProjectModalProps) {
  const { data: session, isPending } = authClient.useSession()
  const [projectName, setProjectName] = useState(initialName)
  const [projectDescription, setProjectDescription] =
    useState(initialDescription)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Auth form state when not signed in
  const [isSignUp, setIsSignUp] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    if (open) {
      setProjectName(initialName || 'Untitled-1')
      setProjectDescription(initialDescription || '')
      setSaveError('')
      setAuthError('')
    }
  }, [open, initialName, initialDescription])

  if (!open) return null

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    setAuthLoading(true)

    try {
      if (isSignUp) {
        const res = await authClient.signUp.email({
          name: name.trim() || email.split('@')[0] || 'Chart Creator',
          email: email.trim(),
          password,
        })
        if (res.error) {
          setAuthError(res.error.message || 'Could not create account.')
          return
        }
      } else {
        const res = await authClient.signIn.email({
          email: email.trim(),
          password,
        })
        if (res.error) {
          setAuthError(res.error.message || 'Invalid email or password.')
          return
        }
      }
      await onSaveConfirmed({
        name: (initialName || 'Untitled-1').trim(),
        description: (initialDescription || '').trim(),
      })
      onClose()
    } catch (err: any) {
      setAuthError(err?.message || 'Authentication failed. Please try again.')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectName.trim()) {
      setSaveError('Project name is required.')
      return
    }
    setSaveError('')
    setSaving(true)
    try {
      await onSaveConfirmed({
        name: projectName.trim(),
        description: projectDescription.trim(),
      })
      onClose()
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save project.')
    } finally {
      setSaving(false)
    }
  }

  const isAuthenticated = Boolean(session?.user)

  return (
    <div
      className="animate-in fade-in duration-200 fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      data-testid="save-project-modal"
    >
      <div className="animate-in fade-in zoom-in-95 duration-200 origin-center relative w-full max-w-sm rounded-xl border border-border/70 bg-card p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="cursor-pointer absolute right-3.5 top-3.5 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {isPending ? (
          <div className="py-10 text-center text-xs text-muted-foreground">
            Checking authentication status...
          </div>
        ) : !isAuthenticated ? (
          <div className="space-y-5" data-testid="auth-prompt-step">
            <div className="space-y-1 text-center">
              <h2 className="text-lg font-semibold tracking-tight">
                {isSignUp ? 'Create an account' : 'Sign in'}
              </h2>
              <p className="text-xs text-muted-foreground">
                Sign in to save your chart project
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              {isSignUp && (
                <div className="space-y-1.5">
                  <Label htmlFor="modal-auth-name" className="text-xs">
                    Name
                  </Label>
                  <Input
                    id="modal-auth-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="h-9"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="modal-auth-email" className="text-xs">
                  Email
                </Label>
                <Input
                  id="modal-auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="modal-auth-password" className="text-xs">
                  Password
                </Label>
                <Input
                  id="modal-auth-password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-9"
                />
              </div>

              {authError && (
                <div className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {authError}
                </div>
              )}

              <Button
                type="submit"
                disabled={authLoading}
                className="w-full h-9"
                data-testid="modal-auth-submit"
              >
                {authLoading
                  ? 'Please wait...'
                  : isSignUp
                    ? 'Sign up & continue'
                    : 'Sign in & continue'}
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp((v) => !v)
                  setAuthError('')
                }}
                className="cursor-pointer font-medium text-foreground underline underline-offset-4 hover:opacity-80"
                data-testid="modal-auth-toggle-mode"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </div>
        ) : (
          <div className="space-y-4" data-testid="save-details-step">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">
                  {isUpdatingExisting
                    ? 'Update Saved Project'
                    : 'Save Chart Project'}
                </h2>
                <p className="text-muted-foreground">
                  Signed in as{' '}
                  <span className="font-medium text-foreground">
                    {session?.user?.email}
                  </span>
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveSubmit} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <Label htmlFor="save-project-name">Project Name</Label>
                <Input
                  id="save-project-name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Q4 Regional Revenue Analysis"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="save-project-desc">
                  Project Notes / Description (Optional)
                </Label>
                <textarea
                  id="save-project-desc"
                  rows={3}
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Describe the data source, methodology, or key takeaway..."
                  className="w-full rounded-md border border-input bg-background p-3"
                />
              </div>

              {saveError && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive">
                  {saveError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="gap-1.5"
                  data-testid="confirm-save-project-btn"
                >
                  <Save className="h-4 w-4" />
                  {saving
                    ? 'Saving...'
                    : isUpdatingExisting
                      ? 'Update Project'
                      : 'Save to Dashboard'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
