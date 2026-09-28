import {
  HeadContent,
  Link,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { AppSidebar } from '../components/app-sidebar'
import Footer from '../components/Footer'
import ThemeToggle from '../components/ThemeToggle'
import { Separator } from '../components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '../components/ui/sidebar'

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
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  notFoundComponent: () => (
    <main className="w-full px-6 py-16 text-center space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Page Not Found</h1>
      <p className="text-muted-foreground">
        The requested route does not exist in PlotTheChart Studio.
      </p>
      <Link
        to="/"
        search={{}}
        className="inline-flex h-9 items-center rounded-lg bg-primary px-4 font-semibold text-primary-foreground no-underline"
      >
        Return to Chart Studio
      </Link>
    </main>
  ),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
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
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="flex min-h-svh w-full flex-1 flex-col min-w-0">
            <header className="sticky top-0 z-30 flex h-12 w-full shrink-0 items-center justify-between gap-2 border-b border-border/50 bg-background/80 px-4 sm:px-6 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1.5 text-muted-foreground hover:text-foreground" />
                <Separator
                  orientation="vertical"
                  className="mx-1 data-[orientation=vertical]:h-4 opacity-60"
                />
                <span className="font-medium text-muted-foreground">
                  Workspace
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
              </div>
            </header>
            <div className="flex-1 w-full min-w-0">{children}</div>
            <Footer />
          </SidebarInset>
        </SidebarProvider>
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
