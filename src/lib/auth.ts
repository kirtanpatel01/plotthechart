import disposableDomains from 'disposable-email-domains'
import { betterAuth } from 'better-auth'
import { APIError, createAuthMiddleware } from 'better-auth/api'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { verifyPassword as verifyScryptPassword } from 'better-auth/crypto'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { prisma } from '#/db'
import { sendEmail } from './email'

const disposableSet = new Set(disposableDomains)

const PBKDF2_ITERATIONS = 100_000
const SALT_BYTES = 16
const KEY_BITS = 256

let lastAuthInternalError: string | null = null

export function consumeLastAuthInternalError(): string | null {
  const err = lastAuthInternalError
  lastAuthInternalError = null
  return err
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

async function hashPasswordWebCrypto(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_BITS,
  )
  const hashHex = bytesToHex(new Uint8Array(derivedBits))
  return `pbkdf2:${PBKDF2_ITERATIONS}:${bytesToHex(salt)}:${hashHex}`
}

async function verifyPasswordWebCrypto({
  hash,
  password,
}: {
  hash: string
  password: string
}): Promise<boolean> {
  if (!hash.startsWith('pbkdf2:')) {
    return verifyScryptPassword({ hash, password })
  }
  const parts = hash.split(':')
  if (parts.length !== 4) return false
  const iterations = Number.parseInt(parts[1], 10)
  const salt = hexToBytes(parts[2])
  const expectedBytes = hexToBytes(parts[3])

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    expectedBytes.length * 8,
  )
  const actualBytes = new Uint8Array(derivedBits)
  if (actualBytes.length !== expectedBytes.length) return false
  let diff = 0
  for (let i = 0; i < actualBytes.length; i++) {
    diff |= actualBytes[i] ^ expectedBytes[i]
  }
  return diff === 0
}

function getEffectiveBaseURL(): string | undefined {
  const url = process.env.BETTER_AUTH_URL?.trim()
  if (!url || url.includes('localhost') || url.includes('127.0.0.1')) {
    return undefined
  }
  return url
}

function getEffectiveSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'BETTER_AUTH_SECRET environment variable is required in production.',
      )
    }
    return 'plotthechart-super-secret-key-2026-tanstack-start'
  }
  return secret
}

function createAuth() {
  return betterAuth({
    database: prismaAdapter(prisma, {
      provider: 'postgresql',
    }),
    secret: getEffectiveSecret(),
    baseURL: getEffectiveBaseURL(),
    trustedOrigins: (request) => {
      const allowed = process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) || []
      if (allowed.length > 0) return allowed
      if (!request) return []
      try {
        return [new URL(request.url).origin]
      } catch {
        return []
      }
    },
    rateLimit: {
      enabled: true,
      window: 60, // 1 minute
      max: 100, // max 100 requests per IP per window
    },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path === '/sign-up/email') {
          const email = (ctx.body as any)?.email
          const password = (ctx.body as any)?.password
          
          if (typeof password === 'string') {
            if (password.length < 8) {
              throw new APIError('BAD_REQUEST', { message: 'Password must be at least 8 characters long.' })
            }
            if (!/[a-z]/.test(password)) {
              throw new APIError('BAD_REQUEST', { message: 'Password must contain at least one lowercase letter.' })
            }
            if (!/[A-Z]/.test(password)) {
              throw new APIError('BAD_REQUEST', { message: 'Password must contain at least one uppercase letter.' })
            }
            if (!/[0-9]/.test(password)) {
              throw new APIError('BAD_REQUEST', { message: 'Password must contain at least one number.' })
            }
            const commonPasswords = ['12345678', 'password', 'password123', '123456789', 'qwertyuiop']
            if (commonPasswords.includes(password.toLowerCase())) {
              throw new APIError('BAD_REQUEST', { message: 'This password is too common or easily guessable.' })
            }
          }

          if (typeof email === 'string') {
            const domain = email.split('@')[1]?.toLowerCase()
            if (domain) {
              if (disposableSet.has(domain)) {
                throw new APIError('BAD_REQUEST', {
                  message: 'Disposable email addresses are not allowed. Please use a valid email.',
                })
              }
            }
          }
        }
      }),
    },
    onAPIError: {
      onError(error) {
        console.error('[Better Auth API Error]:', error)
        if (error instanceof Error) {
          lastAuthInternalError = error.message
        } else if (
          error &&
          typeof error === 'object' &&
          'message' in error &&
          typeof (error as { message: unknown }).message === 'string'
        ) {
          lastAuthInternalError = (error as { message: string }).message
        }
      },
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      password: {
        hash: hashPasswordWebCrypto,
        verify: verifyPasswordWebCrypto,
      },
      sendResetPassword: async ({ user, url }) => {
        sendEmail({
          to: user.email,
          subject: 'Reset your password - PlotTheChart',
          html: `<p>Hi ${user.name},</p><p>You recently requested to reset your password.</p><p><a href="${url}">Click here to reset your password</a></p><p>If you did not request this, please ignore this email.</p>`,
        }).catch(console.error)
      }
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        sendEmail({
          to: user.email,
          subject: 'Verify your email - PlotTheChart',
          html: `<p>Hi ${user.name},</p><p>Welcome to PlotTheChart! Please verify your email address by clicking the link below:</p><p><a href="${url}">Verify my email</a></p>`,
        }).catch(console.error)
      }
    },
    plugins: [tanstackStartCookies()],
  })
}

type AuthInstance = ReturnType<typeof createAuth>

let cachedAuth: AuthInstance | undefined
let cachedAuthKey: string | undefined

function getAuth(): AuthInstance {
  const key = `${process.env.BETTER_AUTH_SECRET ?? ''}|${process.env.BETTER_AUTH_URL ?? ''}`
  if (!cachedAuth || cachedAuthKey !== key) {
    cachedAuth = createAuth()
    cachedAuthKey = key
  }
  return cachedAuth
}

export const auth = new Proxy({} as AuthInstance, {
  get(_target, prop, receiver) {
    const instance = getAuth()
    const value = Reflect.get(instance, prop, receiver)
    return typeof value === 'function' ? value.bind(instance) : value
  },
})
