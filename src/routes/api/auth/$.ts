import { createFileRoute } from '@tanstack/react-router'
import { auth, consumeLastAuthInternalError } from '#/lib/auth'

async function handleAuthRequest(request: Request): Promise<Response> {
  try {
    consumeLastAuthInternalError()
    const response = await auth.handler(request)
    if (response.status >= 500) {
      const internalMsg = consumeLastAuthInternalError()
      if (internalMsg) {
        return new Response(
          JSON.stringify({
            message: internalMsg,
            code: 'INTERNAL_AUTH_ERROR',
          }),
          {
            status: response.status,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      }
    }
    return response
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
