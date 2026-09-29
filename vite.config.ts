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
    ...(command === 'build'
      ? [cloudflare({ viteEnvironment: { name: 'ssr' } })]
      : []),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
}))

export default config
