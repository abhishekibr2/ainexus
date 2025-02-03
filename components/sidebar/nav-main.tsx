"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export function NavMain({
  items,
}: {
  items: {
    id: string;
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
      id: string;
      title: string;
      url: string;
    }[];
  }[];
}) {
  const [hoveredSubItemId, setHoveredSubItemId] = useState<string | null>(null);

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        AI Agents
      </SidebarGroupLabel>
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
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="pt-2"
                      >
                        <SidebarMenuButton
                          tooltip={item.title}
                          className="transition duration-300 flex justify-between items-center space-x-2 py-2 px-2 rounded-md text-base text-black  dark:text-white "
                        >
                          <div className="flex items-center gap-4">
                            {item.icon && (
                              <item.icon size={16} className="text-primary" />
                            )}
                            <span>{item.title}</span>
                          </div>
                          <motion.div
                            animate={{ rotate: item.isActive ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" size={16}/>
                          </motion.div>
                        </SidebarMenuButton>
                      </motion.div>
                    </CollapsibleTrigger>

                    <AnimatePresence>
                      <CollapsibleContent>
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                          
                        >
                          <SidebarMenuSub className="p-2 border-none hover:bg-transparent">
                            {item.items.length > 0 ? (
                              item.items.map((subItem) => (
                                <SidebarMenuSubItem key={subItem.id}>
                                  <SidebarMenuSubButton asChild>
                                    <motion.div
                                      whileHover={{ x: 8 }}
                                      transition={{ type: "spring", stiffness: 200 }}
                                    >
                                      <Link
                                        href={subItem.url}
                                        className="group relative pl-8"
                                        onMouseEnter={() =>
                                          setHoveredSubItemId(subItem.id)
                                        }
                                        onMouseLeave={() =>
                                          setHoveredSubItemId(null)
                                        }
                                      >
                                        <div
                                          className={`absolute -left-[-10px] top-1/2 transform -translate-y-1/2 w-2 h-2 rounded-full transition-colors duration-200 pointer-events-none ${
                                            hoveredSubItemId === subItem.id
                                              ? "bg-primary"
                                              : "bg-muted-foreground/50"
                                          }`}
                                        ></div>
                                        <span className="truncate">{subItem.title}</span>
                                      </Link>
                                    </motion.div>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))
                            ) : (
                              <SidebarMenuSubItem>
                                <span className="px-4 py-2 text-base text-muted-foreground">
                                  No items found
                                </span>
                              </SidebarMenuSubItem>
                            )}
                          </SidebarMenuSub>
                        </motion.div>
                      </CollapsibleContent>
                    </AnimatePresence>
                  </>
                ) : (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="pt-2"
                  >
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      className="transition pt-3 duration-300 flex items-center space-x-2 py-2 px-2 rounded-md text-base text-black  dark:text-white "
                    >
                      <Link href={item.url}>
                        {item.icon && (
                          <item.icon size={16} className="text-primary" />
                        )}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </motion.div>
                )}
              </SidebarMenuItem>
            </Collapsible>
          ))
        ) : (
          <SidebarMenuItem>
            <span className="px-4 py-2 text-base text-muted-foreground">
              No data found
            </span>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
