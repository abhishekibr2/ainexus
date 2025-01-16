"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Settings2, Building2 } from "lucide-react"
import { useRouter } from "next-nprogress-bar";


import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Skeleton } from "../ui/skeleton"
import Link from "next/link";

interface WorkspaceData {
  id: number;
  name: string;
  description: string | null;
  members: string[];
  owner: string;
  created_at: string;
}

interface TeamSwitcherProps {
  teams: WorkspaceData[];
  loading?: boolean;
}

export function TeamSwitcher({ teams, loading = false }: TeamSwitcherProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [selectedTeam, setSelectedTeam] = React.useState<WorkspaceData | null>(
    teams[0] || null
  )

  // Update selected team when teams change
  React.useEffect(() => {
    if (teams.length > 0 && !selectedTeam) {
      setSelectedTeam(teams[0])
    }
  }, [teams, selectedTeam])

  if (loading) {
    return (
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[150px] bg-gray-200" />
      </div>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select a workspace"
          className="w-[calc(100%-8px)] justify-between truncate"
        >
          <div className="flex items-center truncate min-w-0">
            <Building2 className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate">{selectedTeam?.name || "Select workspace"}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 flex-shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" side="right" align="start">
        <Command>
          <CommandList>
            <CommandInput placeholder="Search workspace..." />
            <CommandEmpty>No workspace found.</CommandEmpty>
            {teams.length > 0 && (
              <CommandGroup heading="Workspaces">
                {teams.map((team) => (
                  <CommandItem
                    key={team.id}
                    onSelect={() => {
                      setSelectedTeam(team)
                      setOpen(false)
                    }}
                    className="text-sm"
                  >
                    <Building2 className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{team.name}</span>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4 flex-shrink-0",
                        selectedTeam?.id === team.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
          <CommandSeparator />
          <CommandList>
            <CommandGroup>
              <Link href="/protected/workspaces">
                <CommandItem
                  onSelect={() => {
                    setOpen(false)
                  }}
                >
                  <Settings2 className="mr-2 h-5 w-5 flex-shrink-0" />
                  Manage Workspaces
                </CommandItem>
              </Link>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

