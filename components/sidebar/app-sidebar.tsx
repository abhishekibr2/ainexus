"use client"

import * as React from "react"
import { AudioWaveform, BookOpen, Bot, Clock, Command, Frame, GalleryVerticalEnd, Map, PieChart, Settings2, SquareTerminal, StoreIcon, Text, Sparkles, Brain, Code2, History, Star, Boxes, LucideIcon, Home } from 'lucide-react'

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
import { getUserChats } from "@/utils/supabase/actions/user/user_chat"
import { getUserAssignedModels } from "@/utils/supabase/actions/user/assignedModels"
import { useEffect, useState } from "react"
import { Workspace } from "@/utils/supabase/actions/workspace/workspace"
import { Separator } from "../ui/separator"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/components/ui/sidebar"

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  description: string;
  isActive?: boolean;
  items?: NavItem[];
}

interface SerializedUser {
  id: string;
  email?: string;
  user_metadata: {
    avatar_url?: string;
    email?: string;
    name?: string;
  };
}

const navMainData: NavItem[] = [
  {
    title: "Recent Chats",
    url: "#",
    icon: Clock,
    isActive: false,
    description: "View your recent interactions",
    items: [],
  },
  {
    title: "Available Models",
    url: "",
    icon: Brain,
    isActive: true,
    description: "View available models",
    items: [
    ]
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
  const [recentChats, setRecentChats] = useState<any[]>([])
  const [assignedModels, setAssignedModels] = useState<any[]>([])
  const { state } = useSidebar()

  // Transform recent chats into nav items
  const navItems = [...navMainData]
  if (recentChats.length) {
    navItems[0].items = recentChats.map(chat => ({
      title: chat.heading,
      url: `/protected/models/${chat.model_id}?chatId=${chat.id}`,
      icon: Brain,
      description: `Continue chat: ${chat.heading}`
    }))
  }

  // Add assigned models to the Available Models section
  if (assignedModels.length) {
    navItems[1].items = assignedModels.map(model => ({
      title: model.assistant_name,
      url: `/protected/models/${model.assistant_id}`,
      icon: Brain,
      description: `Use ${model.assistant_name}`
    }))
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const [workspacesData, chatsData, modelsData] = await Promise.all([
          getUserWorkspaces(user.id),
          getUserChats(user.id),
          getUserAssignedModels(user.id)
        ])
        setWorkspaces(workspacesData)
        setRecentChats(chatsData || [])
        setAssignedModels(modelsData?.data || [])
      } catch (error) {
        console.error('Error loading data:', error)
        setWorkspaces([])
        setRecentChats([])
        setAssignedModels([])
      } finally {
        setLoading(false)
      }
    }

    loadData()

    // Add event listener for model assignment
    const handleModelAssigned = (event: CustomEvent) => {
      const newModel = event.detail;
      // Immediately update the UI with the new model
      setAssignedModels(prevModels => {
        // Check if model already exists
        const exists = prevModels.some(model => model.assistant_id === newModel.assistant_id);
        if (!exists) {
          return [...prevModels, newModel];
        }
        return prevModels;
      });

      // Also refresh from the server to ensure consistency
      getUserAssignedModels(user.id).then(modelsData => {
        if (modelsData?.data) {
          setAssignedModels(modelsData.data);
        }
      }).catch(error => {
        console.error('Error refreshing assigned models:', error);
      });
    };

    // Add event listener for new chats
    const handleChatCreated = (event: CustomEvent) => {
      const newChat = event.detail;
      // Immediately update the UI with the new chat
      setRecentChats(prevChats => {
        // Add new chat to the beginning of the list
        return [newChat, ...prevChats];
      });

      // Also refresh from the server to ensure consistency
      getUserChats(user.id).then(chatsData => {
        setRecentChats(chatsData || []);
      }).catch(error => {
        console.error('Error refreshing chats:', error);
      });
    };

    window.addEventListener('modelAssigned', handleModelAssigned as EventListener);
    window.addEventListener('chatCreated', handleChatCreated as EventListener);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('modelAssigned', handleModelAssigned as EventListener);
      window.removeEventListener('chatCreated', handleChatCreated as EventListener);
    }
  }, [user.id])

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
        <NavMain items={navItems} />
      </SidebarContent>

      <SidebarFooter className="mt-auto px-2">
        <NavUser user={user} />
      </SidebarFooter>

    </Sidebar>
  )
}

