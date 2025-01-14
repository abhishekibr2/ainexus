"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { DatabaseIcon, CalendarIcon, WorkflowIcon, FileIcon, MenuIcon, HomeIcon, NotebookIcon, PlusCircle, Settings, Loader2 } from "lucide-react"
import { getUserWorkspaces, Workspace, createWorkspace } from "@/utils/supabase/actions/workspace/workspace"
import { createClient } from "@/utils/supabase/client"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"

const SkeletonCard = () => (
    <Card>
        <CardHeader>
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardFooter>
            <Skeleton className="h-10 w-32" />
        </CardFooter>
    </Card>
)

// Custom events
const WORKSPACE_CREATED_EVENT = 'workspaceCreated'

export default function Component() {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [newWorkspace, setNewWorkspace] = useState({
        name: "",
        description: ""
    })

    useEffect(() => {
        const loadWorkspaces = async () => {
            try {
                const supabase = await createClient()
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    return null // Handle unauthorized state
                }
                const workspaces = await getUserWorkspaces(user.id)
                setWorkspaces(workspaces)
            } catch (error) {
                console.error('Error loading workspaces:', error)
            } finally {
                setLoading(false)
            }
        }

        loadWorkspaces()
    }, [])

    const handleCreateWorkspace = async () => {
        if (!newWorkspace.name.trim()) {
            toast({
                title: "Workspace name is required",
                variant: "destructive"
            })
            return
        }

        setIsCreating(true)
        try {
            const workspace = await createWorkspace(
                newWorkspace.name,
                newWorkspace.description || undefined
            )
            setWorkspaces(prev => [...prev, workspace])
            
            // Dispatch custom event to update sidebar
            const event = new CustomEvent(WORKSPACE_CREATED_EVENT, {
                detail: workspace
            })
            window.dispatchEvent(event)
            
            setDialogOpen(false)
            setNewWorkspace({ name: "", description: "" })
            toast({
                title: "Workspace created successfully",
                variant: "default"
            })
        } catch (error) {
            console.error('Error creating workspace:', error)
            toast({
                title: "Failed to create workspace",
                variant: "destructive"
            })
        } finally {
            setIsCreating(false)
        }
    }

    const renderContent = () => {
        if (loading) {
            return (
                <>
                    {[...Array(4)].map((_, index) => (
                        <SkeletonCard key={index} />
                    ))}
                </>
            )
        }

        if (workspaces.length === 0) {
            return (
                <div className="col-span-full flex flex-col items-center justify-center p-8 text-center">
                    <div className="rounded-full bg-muted p-3 mb-4">
                        <PlusCircle className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No Workspaces Yet</h3>
                    <p className="text-muted-foreground mb-4">Create your first workspace to get started with organizing your projects.</p>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create Workspace
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Workspace</DialogTitle>
                                <DialogDescription>
                                    Create a new workspace to organize your projects and collaborate with team members.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="Enter workspace name"
                                        value={newWorkspace.name}
                                        onChange={(e) => setNewWorkspace(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Enter workspace description"
                                        value={newWorkspace.description}
                                        onChange={(e) => setNewWorkspace(prev => ({ ...prev, description: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleCreateWorkspace} disabled={isCreating}>
                                    {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isCreating ? "Creating..." : "Create Workspace"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            )
        }

        return workspaces.map((workspace) => (
            <Card key={workspace.id}>
                <CardHeader className="relative">
                    <Link
                        href={`/protected/workspaces/${workspace.id}/manage-workspace`}
                        className="absolute right-4 top-4 p-2 hover:bg-muted rounded-md transition-colors"
                    >
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        <span className="sr-only">Workspace Settings</span>
                    </Link>
                    <CardTitle>{workspace.name}</CardTitle>
                    <CardDescription>{workspace.description || 'No description available'}</CardDescription>
                </CardHeader>
                <CardFooter>
                    <Button asChild>
                        <Link href={`/protected/workspaces/${workspace.id}`}>
                            Open Workspace
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        ))
    }

    return (
        <div className="flex min-h-screen w-full">
            <div className="flex flex-1 flex-col">
                <main className="flex-1 p-4 md:p-6">
                    <div className="mb-6 flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold">Workspaces</h1>
                            <p className="text-muted-foreground">Manage and collaborate on your projects in one place.</p>
                        </div>
                        {!loading && workspaces.length > 0 && (
                            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        New Workspace
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Create New Workspace</DialogTitle>
                                        <DialogDescription>
                                            Create a new workspace to organize your projects and collaborate with team members.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Name</Label>
                                            <Input
                                                id="name"
                                                placeholder="Enter workspace name"
                                                value={newWorkspace.name}
                                                onChange={(e) => setNewWorkspace(prev => ({ ...prev, name: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="description">Description</Label>
                                            <Textarea
                                                id="description"
                                                placeholder="Enter workspace description"
                                                value={newWorkspace.description}
                                                onChange={(e) => setNewWorkspace(prev => ({ ...prev, description: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button onClick={handleCreateWorkspace} disabled={isCreating}>
                                            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {isCreating ? "Creating..." : "Create Workspace"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {renderContent()}
                    </div>
                </main>
            </div>
        </div>
    )
}