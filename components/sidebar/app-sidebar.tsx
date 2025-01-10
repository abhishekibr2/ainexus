"use client"

import * as React from "react"
import { AudioWaveform, BookOpen, Bot, Clock, Command, Frame, GalleryVerticalEnd, Map, PieChart, Settings2, SquareTerminal, StoreIcon, Text, Sparkles, Brain, Code2, History, Star, Boxes } from 'lucide-react'

import { NavMain } from "@/components/sidebar/nav-main"
import { NavUser } from "@/components/sidebar/nav-user"
import { TeamSwitcher } from "@/components/sidebar/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { getUserWorkspaces } from "@/utils/supabase/actions/workspace/workspace"
import { useEffect, useState } from "react"
import { Workspace } from "@/utils/supabase/actions/workspace/workspace"
import { Separator } from "../ui/separator"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/components/ui/sidebar"

interface SerializedUser {
  id: string;
  email?: string;
  user_metadata: {
    avatar_url?: string;
    email?: string;
    name?: string;
  };
}

const navMainData = [
  {
    title: "Default AI Agent",
    url: "/",
    icon: Brain,
    description: "Your AI assistant dashboard"
  },
  {
    title: "Recent Agents",
    url: "#",
    icon: Clock,
    isActive: true,
    description: "View your recent interactions",
    items: [
      {
        title: "History",
        url: "/protected/history",
        icon: History,
        description: "Past conversations"
      },
      {
        title: "Starred",
        url: "#",
        icon: Star,
        description: "Bookmarked items"
      },
    ],
  },
  {
    title: "Explore Models",
    url: "/protected/models/explore-models",
    icon: Boxes,
    description: "Explore AI models"
  },
]

export function AppSidebar({ user, ...props }: React.ComponentProps<typeof Sidebar> & { user: SerializedUser }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const { state } = useSidebar()

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
  }, [])

  return (
    <Sidebar
      collapsible="icon"
      className="transition-all duration-300 ease-in-out"
      {...props}
    >
      <div className="mx-4 transition-all duration-300">
        <div className="flex items-center gap-2 py-2" data-sidebar="header">
          <Sparkles className="h-6 w-6 text-primary transition-transform duration-300 flex-shrink-0" />
          <div className={cn(
            "flex flex-col overflow-hidden transition-all duration-300 min-w-0",
            state === "collapsed" && "w-0 opacity-0"
          )}>
            <div className="text-2xl font-bold text-primary truncate">NexusAI</div>
            <div className="text-xs text-muted-foreground truncate">Your AI Companion</div>
          </div>
        </div>
      </div>
      <Separator className="my-4" />
      <SidebarGroupLabel className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Workspaces
      </SidebarGroupLabel>

      <SidebarHeader className="px-2">
        <TeamSwitcher teams={workspaces} loading={loading} />
      </SidebarHeader>

      <SidebarContent className="px-2">
        <NavMain items={navMainData} />
      </SidebarContent>

      <SidebarFooter className="mt-auto px-2">
        <NavUser user={user} />
      </SidebarFooter>

    </Sidebar>
  )
}

