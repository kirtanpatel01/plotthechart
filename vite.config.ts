import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig(({ command }) => ({
  resolve: { tsconfigPaths: true },
  server: {
    watch: {
      ignored: ['**/.agents/**', '**/.cursor/**', '**/.claude/**'],
    },
  },
  plugins: [
    devtools({
      consolePiping: {
        enabled: false,
      },
    }),
    {
      name: 'wasm-module-dev-loader',
      apply: 'serve',
      load(id) {
        if (!id.endsWith('.wasm?module')) return null
        const filePath = id.slice(0, -'?module'.length)
        return `import { readFileSync } from 'node:fs';\nexport default new WebAssembly.Module(readFileSync(${JSON.stringify(filePath)}));`
      },
    },
    ...(command === 'build'
      ? [
          cloudflare({
            viteEnvironment: { name: 'ssr' },
            config: (workerConfig) => {
              const buildVars: Record<string, string> = {}
              const dbUrl = process.env.DATABASE_URL
              const isRemoteDb =
                dbUrl &&
                !dbUrl.includes('localhost') &&
                !dbUrl.includes('127.0.0.1')

              if (isRemoteDb) {
                buildVars.DATABASE_URL = dbUrl
                if (process.env.BETTER_AUTH_SECRET) {
                  buildVars.BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET
                }
              }
              if (
                process.env.BETTER_AUTH_URL &&
                !process.env.BETTER_AUTH_URL.includes('localhost') &&
                !process.env.BETTER_AUTH_URL.includes('127.0.0.1')
              ) {
                buildVars.BETTER_AUTH_URL = process.env.BETTER_AUTH_URL
              }

              if (Object.keys(buildVars).length > 0) {
                return {
                  vars: {
                    ...workerConfig.vars,
                    ...buildVars,
                  },
                }
              }
            },
          }),
        ]
      : []),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
}))

export default config
