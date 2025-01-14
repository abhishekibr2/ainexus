"use client"

import * as React from "react"
import { AudioWaveform, BookOpen, Bot, Clock, Command, Frame, GalleryVerticalEnd, Map, PieChart, Settings2, SquareTerminal, StoreIcon, Text, Sparkles, Brain, Code2, History, Star, Boxes, LucideIcon, Home } from 'lucide-react'
import { createClient } from "@/utils/supabase/client"

import { NavMain } from "@/components/sidebar/nav-main"
import { NavUser } from "@/components/sidebar/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { getUserChats } from "@/utils/supabase/actions/user/user_chat"
import { getUserAssignedModels } from "@/utils/supabase/actions/user/assignedModels"
import { useEffect, useState } from "react"
import { Separator } from "../ui/separator"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/components/ui/sidebar"

interface NavItem {
  id: string;
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

interface AssignedModel {
  id: number;
  name: string;
  assistant_id: number;
  assistant_name: string;
}

const navMainData: NavItem[] = [
  {
    id: "recent-chats",
    title: "Recent Chats",
    url: "#",
    icon: Clock,
    isActive: false,
    description: "View your recent interactions",
    items: [],
  },
  {
    id: "favorite-models",
    title: "Favorite Models",
    url: "",
    icon: Star,
    isActive: false,
    description: "Your favorite AI models",
    items: []
  },
  {
    id: "available-models",
    title: "Available Models",
    url: "",
    icon: Brain,
    isActive: true,
    description: "View available models",
    items: []
  },
  {
    id: "explore-models",
    title: "Explore Models",
    url: "/protected/models/explore-models",
    icon: Boxes,
    description: "Explore AI models"
  },
]

// Custom events
const MODEL_FAVORITED_EVENT = 'modelFavorited'
const MODEL_UNFAVORITED_EVENT = 'modelUnfavorited'

export function AppSidebar({ user, ...props }: React.ComponentProps<typeof Sidebar> & { user: SerializedUser }) {
  const [loading, setLoading] = useState(true)
  const [recentChats, setRecentChats] = useState<any[]>([])
  const [assignedModels, setAssignedModels] = useState<any[]>([])
  const [favoriteModels, setFavoriteModels] = useState<any[]>([])
  const { state } = useSidebar()

  // Transform recent chats into nav items
  const navItems = [...navMainData]
  if (recentChats.length) {
    navItems[0].items = recentChats.map(chat => ({
      id: chat.id,
      title: chat.heading,
      url: `/protected/models/${chat.model_id}?chatId=${chat.id}`,
      icon: Brain,
      description: `Continue chat: ${chat.heading}`
    }))
  }

  // Add favorite models to the Favorite Models section
  if (favoriteModels.length) {
    navItems[1].items = favoriteModels.map((model: AssignedModel) => ({
      id: model.id.toString(),
      title: model.name,
      url: `/protected/models/${model.id}`,
      icon: Star,
      description: `Use ${model.name}`
    }))
  }

  // Add assigned models to the Available Models section
  if (assignedModels.length) {
    navItems[2].items = assignedModels.map(model => ({
      id: model.id.toString(),
      title: model.name,
      url: `/protected/models/${model.id}`,
      icon: Brain,
      description: `Use ${model.assistant_name}`
    }))
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const [chatsData, modelsData] = await Promise.all([
          getUserChats(user.id),
          getUserAssignedModels(user.id)
        ])

        // Get user data to access fav_models
        const supabase = createClient();
        const { data: userData } = await supabase
          .from('user')
          .select('fav_models')
          .eq('id', user.id)
          .single();

        // Filter assigned models to get favorite models
        const favModels = modelsData?.data?.filter(model => 
          userData?.fav_models?.includes(model.id)
        ) || [];

        setRecentChats(chatsData || [])
        setAssignedModels(modelsData?.data || [])
        setFavoriteModels(favModels)
      } catch (error) {
        console.error('Error loading data:', error)
        setRecentChats([])
        setAssignedModels([])
        setFavoriteModels([])
      } finally {
        setLoading(false)
      }
    }

    loadData()

    // Add event listener for model favorited/unfavorited
    const handleModelFavorited = async () => {
      try {
        const [modelsData, userData] = await Promise.all([
          getUserAssignedModels(user.id),
          createClient()
            .from('user')
            .select('fav_models')
            .eq('id', user.id)
            .single()
        ]);

        const favModels = modelsData?.data?.filter(model => 
          userData.data?.fav_models?.includes(model.id)
        ) || [];

        setFavoriteModels(favModels);
      } catch (error) {
        console.error('Error refreshing favorite models:', error);
      }
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

    // Add event listeners
    window.addEventListener('chatCreated', handleChatCreated as EventListener);
    window.addEventListener(MODEL_FAVORITED_EVENT, handleModelFavorited);
    window.addEventListener(MODEL_UNFAVORITED_EVENT, handleModelFavorited);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('chatCreated', handleChatCreated as EventListener);
      window.removeEventListener(MODEL_FAVORITED_EVENT, handleModelFavorited);
      window.removeEventListener(MODEL_UNFAVORITED_EVENT, handleModelFavorited);
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

      <SidebarContent className="px-2">
        <NavMain items={navItems} />
      </SidebarContent>

      <SidebarFooter className="mt-auto px-2">
        <NavUser user={user} />
      </SidebarFooter>

    </Sidebar>
  )
}