const DEFAULT_LOCAL_DB_URL =
  'postgres://postgres:postgres@localhost:5432/template1?sslmode=disable&connection_limit=10&connect_timeout=0&max_idle_connection_lifetime=0&pool_timeout=0&socket_timeout=0'

export function getDatabaseUrl() {
  return process.env.DATABASE_URL || DEFAULT_LOCAL_DB_URL
}
