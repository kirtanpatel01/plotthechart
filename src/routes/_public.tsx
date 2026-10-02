import { createFileRoute, Outlet } from '@tanstack/react-router'
import Footer from '#/components/Footer'

export const Route = createFileRoute('/_public')({
  component: PublicLayout,
})

function PublicLayout() {
  return (
    <div className="flex min-h-svh w-full flex-col">
      <div className="flex flex-1 flex-col w-full min-w-0">
        <Outlet />
      </div>
      <Footer />
    </div>
  )
}
