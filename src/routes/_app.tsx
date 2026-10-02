import { createFileRoute, Outlet } from '@tanstack/react-router'
import { AppSidebar } from '#/components/app-sidebar'
import Footer from '#/components/Footer'
import ThemeToggle from '#/components/ThemeToggle'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '#/components/ui/sidebar'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

function AppLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex min-h-svh w-full flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-12 w-full shrink-0 items-center justify-between gap-2 border-b border-border/50 bg-background/80 px-4 sm:px-6 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1.5 text-muted-foreground hover:text-foreground" />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>
        <div className="flex flex-1 flex-col w-full min-w-0">
          <Outlet />
        </div>
        <Footer />
      </SidebarInset>
    </SidebarProvider>
  )
}
