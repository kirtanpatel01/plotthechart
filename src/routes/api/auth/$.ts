import { createFileRoute } from '@tanstack/react-router'
import { auth } from '#/lib/auth'

async function handleAuthRequest(request: Request): Promise<Response> {
  try {
    return await auth.handler(request)
  } catch (error) {
    console.error('[Better Auth Handler Error]:', error)
    const message =
      error instanceof Error ? error.message : 'Authentication server error'
    return new Response(
      JSON.stringify({
        message,
        code: 'INTERNAL_AUTH_ERROR',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: ({ request }) => handleAuthRequest(request),
      POST: ({ request }) => handleAuthRequest(request),
    },
  },
})
