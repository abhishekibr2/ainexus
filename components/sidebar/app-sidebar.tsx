"use client"

import * as React from "react"
import { Sparkles, Brain, Star, Boxes, LucideIcon, Link2 } from 'lucide-react'
import { createClient } from "@/utils/supabase/client"
import { NavMain } from "@/components/sidebar/nav-main"
import { NavUser } from "@/components/sidebar/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { getUserChats } from "@/utils/supabase/actions/user/user_chat"
import { getUserAssignedModels } from "@/utils/supabase/actions/user/assignedAgents"
import { useEffect, useState } from "react"
import { Separator } from "@/components/ui/separator"
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
    id: "favorite-models",
    title: "Favorite AI Agent",
    url: "",
    icon: Star,
    isActive: true,
    description: "Your favorite AI models",
    items: []
  },
  {
    id: "available-models",
    title: "Available AI Agent",
    url: "",
    icon: Brain,
    isActive: true,
    description: "View available models",
    items: []
  },
  {
    id: "explore-models",
    title: "Explore AI Agent",
    url: "/protected/agents/explore-agents",
    icon: Boxes,
    description: "Explore AI models"
  },
  {
    id: "connections",
    title: "Your Connections",
    url: "/protected/connections",
    icon: Link2,
    description: "Manage your connections"
  }
]

// Custom events
const MODEL_FAVORITED_EVENT = 'modelFavorited'
const MODEL_UNFAVORITED_EVENT = 'modelUnfavorited'
const MODEL_DELETED_EVENT = 'modelDeleted'


export function AppSidebar({ user, ...props }: React.ComponentProps<typeof Sidebar> & { user: SerializedUser }) {
  const [loading, setLoading] = useState(true)
  const [recentChats, setRecentChats] = useState<any[]>([])
  const [assignedModels, setAssignedModels] = useState<any[]>([])
  const [favoriteModels, setFavoriteModels] = useState<any[]>([])
  const { state } = useSidebar()

  // Transform recent chats into nav items
  const navItems = [...navMainData]

  // Add favorite models to the Favorite Models section
  if (favoriteModels.length) {
    navItems[0].items = favoriteModels.map((model: AssignedModel) => ({
      id: model.id.toString(),
      title: model.name,
      url: `/protected/agents/${model.id}`,
      icon: Star,
      description: `Use ${model.name}`
    }))
  } else {
    navItems[0].items = []
  }

  // Add assigned models to the Available Models section
  if (assignedModels.length) {
    navItems[1].items = assignedModels.map(model => ({
      id: model.id.toString(),
      title: model.name,
      url: `/protected/agents/${model.id}`,
      icon: Brain,
      description: `Use ${model.assistant_name}`
    }))
  } else {
    navItems[1].items = []
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
        setAssignedModels(modelsData?.data || []);
      } catch (error) {
        console.error('Error refreshing favorite models:', error);
      }
    };

    // Add event listener for model deletion
    const handleModelDeleted = async (event: CustomEvent<{ modelId: number }>) => {
      const deletedModelId = event.detail.modelId;

      // Update assigned models
      setAssignedModels(prevModels =>
        prevModels.filter(model => model.id !== deletedModelId)
      );

      // Update favorite models
      setFavoriteModels(prevModels =>
        prevModels.filter(model => model.id !== deletedModelId)
      );

      // Update recent chats
      setRecentChats(prevChats =>
        prevChats.filter(chat => chat.model_id !== deletedModelId)
      );

      // Refresh from server to ensure consistency
      try {
        const [modelsData, userData, chatsData] = await Promise.all([
          getUserAssignedModels(user.id),
          createClient()
            .from('user')
            .select('fav_models')
            .eq('id', user.id)
            .single(),
          getUserChats(user.id)
        ]);

        const favModels = modelsData?.data?.filter(model =>
          userData.data?.fav_models?.includes(model.id)
        ) || [];

        setAssignedModels(modelsData?.data || []);
        setFavoriteModels(favModels);
        setRecentChats(chatsData || []);
      } catch (error) {
        console.error('Error refreshing models after deletion:', error);
      }
    };

    // Add event listener for new model assigned
    const handleModelAssigned = async () => {
      try {
        const modelsData = await getUserAssignedModels(user.id);
        setAssignedModels(modelsData?.data || []);
      } catch (error) {
        console.error('Error refreshing assigned models:', error);
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
    window.addEventListener('modelAssigned', handleModelAssigned);
    window.addEventListener(MODEL_DELETED_EVENT, handleModelDeleted as unknown as EventListener);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('chatCreated', handleChatCreated as EventListener);
      window.removeEventListener(MODEL_FAVORITED_EVENT, handleModelFavorited);
      window.removeEventListener(MODEL_UNFAVORITED_EVENT, handleModelFavorited);
      window.removeEventListener('modelAssigned', handleModelAssigned);
      window.removeEventListener(MODEL_DELETED_EVENT, handleModelDeleted as unknown as EventListener);
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
        <Separator className="my-4" />
        {/* <SidebarMenu>
          <Collapsible asChild className="group/collapsible">
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton>
                  <History className="h-4 w-4" />
                  <span>Recent History</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1">
                {recentChats.map(chat => (
                  <Link
                    key={chat.id}
                    href={`/protected/agents/${chat.model_id}?chatId=${chat.id}`}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground ml-6"
                  >
                    <Clock className="h-5 w-5 flex-shrink-0" />
                    <span className="truncate">{chat.heading}</span>
                  </Link>
                ))}
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        </SidebarMenu> */}
      </SidebarContent>

      <Separator />

      <SidebarFooter className="mt-auto px-2">
        <NavUser user={user} />
      </SidebarFooter>

    </Sidebar>
  )
}