import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import appCss from '../styles.css?url'
import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content:
          'width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content',
      },
      {
        name: 'theme-color',
        media: '(prefers-color-scheme: light)',
        content: '#f8f8f7',
      },
      {
        name: 'theme-color',
        media: '(prefers-color-scheme: dark)',
        content: '#191918',
      },
      {
        name: 'color-scheme',
        content: 'light dark',
      },
      {
        title: 'PlotTheChart — Data Visualization Studio',
      },
      {
        name: 'description',
        content: 'Instantly generate, configure, and save beautiful charts without writing code. PlotTheChart supports Bar, Line, Pie, Scatter, Radar, and Treemap visualizations.',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'icon',
        type: 'image/png',
        href: '/favicon.png',
      },
      {
        rel: 'icon',
        href: '/favicon.ico',
      },
      {
        rel: 'apple-touch-icon',
        href: '/logo.png',
      },
    ],
  }),
  notFoundComponent: () => (
    <main className="w-full px-6 py-16 text-center space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Page Not Found</h1>
      <p className="text-muted-foreground">
        The requested route does not exist in PlotTheChart Studio.
      </p>
      <a
        href="/workspace"
        className="inline-flex h-9 items-center rounded-lg bg-primary px-4 font-semibold text-primary-foreground no-underline"
      >
        Return to Workspace
      </a>
    </main>
  ),
  shellComponent: RootDocument,
})

function RootDocument() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body
        suppressHydrationWarning
        className="font-sans antialiased [overflow-wrap:anywhere] selection:bg-primary/25"
      >
        <Outlet />
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
