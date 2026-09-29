import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { prisma } from '#/db'

function createAuth() {
  return betterAuth({
    database: prismaAdapter(prisma, {
      provider: 'postgresql',
    }),
    secret:
      process.env.BETTER_AUTH_SECRET ||
      'plotthechart-super-secret-key-2026-tanstack-start',
    baseURL: process.env.BETTER_AUTH_URL || undefined,
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 6,
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
