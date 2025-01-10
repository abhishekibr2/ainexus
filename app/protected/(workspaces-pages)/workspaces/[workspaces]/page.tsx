"use client"

import { useEffect, useState, use } from "react"
import { Workspace } from "@/utils/supabase/actions/workspace/workspace"
import { createClient } from "@/utils/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"

type Params = { workspaces: string }

export default function WorkspacePage({ params }: { params: Promise<Params> }) {
  const { workspaces } = use(params)
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadWorkspace = async () => {
      try {
        const supabase = await createClient()
        const { data: workspace, error } = await supabase
          .from('Workspaces')
          .select('*')
          .eq('id', workspaces)
          .single()
        if (error) throw error
        setWorkspace(workspace)
      } catch (error) {
        console.error('Error loading workspace:', error)
      } finally {
        setLoading(false)
      }
    }

    loadWorkspace()
  }, [workspaces])

  if (loading) {
    return (
      <div className="container mx-auto py-10 space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    )
  }

  if (!workspace) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold">Workspace not found</h1>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{workspace.name}</h1>
          <p className="text-muted-foreground">{workspace.description || "No description"}</p>
        </div>

        <div className="grid gap-4">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Members</h2>
            <p>{workspace.members?.length || 0} members</p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Created</h2>
            <p>{new Date(workspace.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
