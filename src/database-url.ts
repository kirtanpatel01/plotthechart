const DEFAULT_LOCAL_DB_URL =
  'postgres://postgres:postgres@localhost:5432/template1?sslmode=disable&connection_limit=10&connect_timeout=0&max_idle_connection_lifetime=0&pool_timeout=0&socket_timeout=0'

export function getDatabaseUrl() {
  const envUrl = process.env.DATABASE_URL?.trim()
  if (envUrl) {
    return envUrl
  }
  const isCloudflareWorker =
    typeof navigator !== 'undefined' &&
    navigator.userAgent === 'Cloudflare-Workers'
  if (isCloudflareWorker) {
    throw new Error(
      'DATABASE_URL is missing in Cloudflare Worker runtime variables. Add DATABASE_URL under Worker -> Settings -> Variables and Secrets.',
    )
  }
  return DEFAULT_LOCAL_DB_URL
}
