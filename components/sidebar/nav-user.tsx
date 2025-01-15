"use client"

import { LogOut, Settings, User as UserIcon } from "lucide-react"
import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
  SidebarGroupLabel,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next-nprogress-bar";
import { TeamSwitcher } from "@/components/sidebar/team-switcher"
import { getUserWorkspaces, Workspace } from "@/utils/supabase/actions/workspace/workspace"
import { useEffect, useState } from "react"
import { isSuperAdmin } from "@/utils/supabase/admin"
import { signOutAction } from "@/app/actions"


interface SerializedUser {
  id: string;
  email?: string;
  user_metadata: {
    avatar_url?: string;
    email?: string;
    name?: string;
  };
}

export function NavUser({ user }: { user: SerializedUser }) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        const workspacesData = await getUserWorkspaces(user.id)
        setWorkspaces(workspacesData)
      } catch (error) {
        console.error('Error loading workspaces:', error)
        setWorkspaces([])
      } finally {
        setLoading(false)
      }
    }

    loadWorkspaces()

    // Add event listener for workspace creation
    const handleWorkspaceCreated = (event: CustomEvent) => {
      const newWorkspace = event.detail;
      setWorkspaces(prevWorkspaces => [...prevWorkspaces, newWorkspace]);
    };

    // Add event listener for workspace deletion
    const handleWorkspaceDeleted = (event: CustomEvent) => {
      const { workspaceId } = event.detail;
      setWorkspaces(prevWorkspaces =>
        prevWorkspaces.filter(workspace => workspace.id.toString() !== workspaceId.toString())
      );

      getUserWorkspaces(user.id).then(workspacesData => {
        setWorkspaces(workspacesData);
      }).catch(error => {
        console.error('Error refreshing workspaces:', error);
      });
    };

    window.addEventListener('workspaceCreated', handleWorkspaceCreated as EventListener);
    window.addEventListener('workspaceDeleted', handleWorkspaceDeleted as EventListener);

    return () => {
      window.removeEventListener('workspaceCreated', handleWorkspaceCreated as EventListener);
      window.removeEventListener('workspaceDeleted', handleWorkspaceDeleted as EventListener);
    }
  }, [user.id])

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-8">
                <AvatarImage src={user.user_metadata.avatar_url} />
                <AvatarFallback>
                  <UserIcon className="size-4" />
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {user.user_metadata.name || user.email}
                </span>
                <span className="truncate text-xs text-muted-foreground" >
                  {workspaces.length > 0 && workspaces[0].name}
                </span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Account
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/protected/profile" className="flex items-center">
                <UserIcon className="mr-2 size-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            {isSuperAdmin(user.email) && (
              <DropdownMenuItem asChild>
                <Link href="/protected/admin" className="flex items-center">
                  <Settings className="mr-2 size-4" />
                  Super Admin
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <SidebarGroupLabel className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Workspaces
            </SidebarGroupLabel>
            <SidebarHeader className="px-2">
              <TeamSwitcher teams={workspaces} loading={loading} />
            </SidebarHeader>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { signOutAction() }}>
              <LogOut className="mr-2 size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

