import * as React from 'react'
import { Link, useNavigate, useRouter, useRouterState } from '@tanstack/react-router'
import {
  FolderKanban,
  Layers,
  LogIn,
  LogOut,
  Sparkles,
  User,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '#/components/ui/sidebar'
import { authClient } from '#/lib/auth-client'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const navigate = useNavigate()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const { data: session, isPending } = authClient.useSession()

  const handleSignOut = async () => {
    await authClient.signOut()
    await router.invalidate()
    if (pathname.startsWith('/saved-projects') || pathname.startsWith('/workspace')) {
      await navigate({ to: '/signin', replace: true })
    }
  }

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border/50 bg-sidebar/50"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="PlotTheChart">
              <Link to="/" search={{}} className="no-underline">
                <div className="flex aspect-square size-8 shrink-0 items-center justify-center">
                  <img
                    src="/logo.png"
                    alt="PlotTheChart"
                    className="size-7 rounded-lg object-contain"
                  />
                </div>
                <span className="truncate font-semibold tracking-tight">
                  PlotTheChart
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith('/workspace')}
                  tooltip="Workspace"
                  className="font-medium"
                >
                  <Link to="/workspace" search={{}} className="no-underline">
                    <Sparkles />
                    <span>Workspace</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {session?.user && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith('/saved-projects')}
                    tooltip="Saved Projects"
                    className="font-medium"
                  >
                    <Link to="/saved-projects" className="no-underline">
                      <FolderKanban />
                      <span>Saved Projects</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith('/architecture')}
                  tooltip="Architecture"
                  className="font-medium"
                >
                  <Link to="/architecture" className="no-underline">
                    <Layers />
                    <span>Architecture</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40">
        <SidebarMenu>
          {isPending ? (
            <SidebarMenuItem>
              <div className="h-8 w-full rounded-md bg-sidebar-accent/40 animate-pulse" />
            </SidebarMenuItem>
          ) : session?.user ? (
            <>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip={session.user.name || session.user.email}
                >
                  <Link to="/saved-projects" className="no-underline">
                    <User className="text-muted-foreground" />
                    <span className="truncate">
                      {session.user.name || session.user.email}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => {
                    void handleSignOut()
                  }}
                  tooltip="Sign out"
                  className="text-muted-foreground hover:text-foreground"
                  data-testid="header-signout-btn"
                >
                  <LogOut />
                  <span>Sign out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          ) : (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith('/signin')}
                tooltip="Sign in"
                className="text-muted-foreground hover:text-foreground"
                data-testid="header-signin-link"
              >
                <Link to="/signin" className="no-underline">
                  <LogIn />
                  <span>Sign in</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
