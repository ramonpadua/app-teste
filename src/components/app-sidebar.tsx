import { Link, useLocation } from 'react-router-dom'
import { Calendar, FileText, LayoutDashboard } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

export function AppSidebar() {
  const location = useLocation()

  const items = [
    {
      title: 'Briefings',
      url: '/',
      icon: LayoutDashboard,
    },
    {
      title: 'Calendário',
      url: '/calendario',
      icon: Calendar,
    },
    {
      title: 'Documentos',
      url: '/documents',
      icon: FileText,
    },
  ]

  return (
    <Sidebar>
      <SidebarHeader className="p-4 py-6">
        <div className="flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">MeetManager</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive =
                  location.pathname === item.url ||
                  (item.url === '/' && location.pathname.startsWith('/briefings'))
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link to={item.url} className="flex items-center gap-3">
                        <item.icon
                          className={cn(
                            'h-4 w-4',
                            isActive ? 'text-primary-foreground' : 'text-sidebar-foreground/70',
                          )}
                        />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
