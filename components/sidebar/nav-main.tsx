"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import Link from "next/link"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    id: string
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      id: string
      title: string
      url: string
    }[]
  }[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Agents</SidebarGroupLabel>
      <SidebarMenu>
        {items && items.length > 0 ? (
          items.map((item) => (
            <Collapsible
              key={item.id}
              asChild
              defaultOpen={item.isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                {item.items ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={item.title}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.length > 0 ? (
                          item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.id}>
                              <SidebarMenuSubButton asChild>
                                <Link href={subItem.url}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))
                        ) : (
                          <SidebarMenuSubItem>
                            <span className="px-4 py-2 text-sm text-muted-foreground">No items found</span>
                          </SidebarMenuSubItem>
                        )}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : (
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link href={item.url}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            </Collapsible>
          ))
        ) : (
          <SidebarMenuItem>
            <span className="px-4 py-2 text-sm text-muted-foreground">No data found</span>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}

