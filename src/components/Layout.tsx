import { Outlet } from 'react-router-dom'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from './app-sidebar'
import { Separator } from '@/components/ui/separator'
import { ReportAssistant } from './ReportAssistant'

export default function Layout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-6">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-sm font-medium text-muted-foreground">Workspace Pessoal</h1>
        </header>
        <main className="flex-1 overflow-auto animate-fade-in bg-slate-50/50">
          <Outlet />
        </main>
      </SidebarInset>
      <ReportAssistant />
    </SidebarProvider>
  )
}
