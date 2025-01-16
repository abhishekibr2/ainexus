"use client"

import { useEffect, useState, use } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Users2, Settings2, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { Workspace, getWorkspaceById, updateWorkspaceDetails, deleteWorkspaceById, addWorkspaceMember } from "@/utils/supabase/actions/workspace/workspace"
import { useRouter } from "next-nprogress-bar"
import { toast } from "@/hooks/use-toast"
import { searchUsers } from "@/utils/supabase/actions/user/users"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { useDebouncedCallback } from "use-debounce"

// Custom event for workspace updates
const WORKSPACE_DELETED_EVENT = 'workspaceDeleted'

interface SearchUser {
    id: string;
    email: string;
    name: string | null;
}

export default function WorkspaceSettings({ params }: { params: Promise<{ workspaces: string }> }) {
    const resolvedParams = use(params)
    const [workspace, setWorkspace] = useState<Workspace | null>(null)
    const [loading, setLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const router = useRouter()
    const [inviteEmail, setInviteEmail] = useState("")
    const [isInviting, setIsInviting] = useState(false)
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
    const [commandOpen, setCommandOpen] = useState(false)
    const [searchResults, setSearchResults] = useState<SearchUser[]>([])
    const [searchLoading, setSearchLoading] = useState(false)
    const [inputValue, setInputValue] = useState("")
    const [open, setOpen] = useState(false)

    const debouncedSearch = useDebouncedCallback(async (value: string) => {
        if (!value) {
            setSearchResults([])
            return
        }
        
        setSearchLoading(true)
        try {
            const results = await searchUsers(value)
            setSearchResults(Array.isArray(results) ? results : [])
        } catch (error) {
            console.error('Error searching users:', error)
            setSearchResults([])
        } finally {
            setSearchLoading(false)
        }
    }, 300)

    useEffect(() => {
        if (inputValue) {
            debouncedSearch(inputValue)
        } else {
            setSearchResults([])
        }
    }, [inputValue])

    useEffect(() => {
        const loadWorkspace = async () => {
            try {
                const workspace = await getWorkspaceById(resolvedParams.workspaces)
                setWorkspace(workspace)
                setName(workspace.name)
                setDescription(workspace.description || "")
            } catch (error) {
                console.error('Error loading workspace:', error)
                toast({
                    title: "Failed to load workspace",
                    variant: "destructive"
                })
            } finally {
                setLoading(false)
            }
        }

        loadWorkspace()
    }, [resolvedParams.workspaces])

    const handleSaveChanges = async () => {
        setIsSaving(true)
        try {
            const updatedWorkspace = await updateWorkspaceDetails(resolvedParams.workspaces, {
                name,
                description: description || undefined
            })
            setWorkspace(updatedWorkspace)
            toast({
                title: "Workspace updated successfully",
                variant: "default"
            })
        } catch (error) {
            console.error('Error updating workspace:', error)
            toast({
                title: "Failed to update workspace",
                variant: "destructive"
            })
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            await deleteWorkspaceById(resolvedParams.workspaces)

            // Dispatch custom event to refresh workspaces in sidebar
            const event = new CustomEvent(WORKSPACE_DELETED_EVENT, {
                detail: { workspaceId: resolvedParams.workspaces }
            })
            window.dispatchEvent(event)

            toast({
                title: "Workspace deleted successfully",
                variant: "default"
            })
            router.push('/protected/workspaces')
        } catch (error) {
            console.error('Error deleting workspace:', error)
            toast({
                title: "Failed to delete workspace",
                variant: "destructive"
            })
            setIsDeleting(false)
        }
    }

    const handleInviteMember = async () => {
        if (!inviteEmail) {
            toast({
                title: "Please enter an email address",
                variant: "destructive"
            })
            return
        }

        setIsInviting(true)
        try {
            await addWorkspaceMember(Number(resolvedParams.workspaces), inviteEmail)
            toast({
                title: "Member invited successfully",
                variant: "default"
            })
            setInviteDialogOpen(false)
            setInviteEmail("")
        } catch (error) {
            console.error('Error inviting member:', error)
            toast({
                title: "Failed to invite member",
                description: "Please check the email and try again",
                variant: "destructive"
            })
        } finally {
            setIsInviting(false)
        }
    }

    if (loading) {
        return (
            <div className="space-y-6 p-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-48" />
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            </div>
        )
    }

    if (!workspace) {
        return (
            <div className="p-6">
                <h1 className="text-xl font-semibold">Workspace not found</h1>
                <p className="text-muted-foreground">The workspace you're looking for doesn't exist or you don't have access to it.</p>
                <Button asChild className="mt-4">
                    <Link href="/protected/workspaces">Go back to workspaces</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/protected`}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold">Workspace Settings</h1>
                </div>
            </div>

            <Tabs defaultValue="general" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="general">
                        <Settings2 className="mr-2 h-4 w-4" />
                        General
                    </TabsTrigger>
                    <TabsTrigger value="members">
                        <Users2 className="mr-2 h-4 w-4" />
                        Members
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Workspace Information</CardTitle>
                            <CardDescription>
                                Update your workspace details and settings.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter workspace name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Enter workspace description"
                                    className="min-h-[100px]"
                                />
                            </div>
                            <Button onClick={handleSaveChanges} disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSaving ? "Saving..." : "Save Changes"}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-red-600">Danger Zone</CardTitle>
                            <CardDescription>
                                Irreversible and destructive actions.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" className="flex items-center">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Workspace
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete your
                                            workspace and remove all associated data.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleDelete}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            disabled={isDeleting}
                                        >
                                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {isDeleting ? "Deleting..." : "Delete Workspace"}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="members" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Workspace Members</CardTitle>
                            <CardDescription>
                                Manage who has access to this workspace.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Invite Members</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Add members to collaborate in this workspace.
                                        </p>
                                    </div>
                                    <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button>
                                                <Users2 className="mr-2 h-4 w-4" />
                                                Invite
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Invite Team Member</DialogTitle>
                                                <DialogDescription>
                                                    Enter the email address of the person you want to invite to this workspace.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="email">Email address</Label>
                                                    <div className="relative">
                                                        <Command shouldFilter={false} className="rounded-lg border shadow-md">
                                                            <CommandInput 
                                                                id="email"
                                                                placeholder="Enter email address"
                                                                value={inputValue}
                                                                onValueChange={(value) => {
                                                                    setInputValue(value)
                                                                    setInviteEmail(value)
                                                                    if (value) {
                                                                        setOpen(true)
                                                                    } else {
                                                                        setOpen(false)
                                                                    }
                                                                }}
                                                            />
                                                            <CommandList>
                                                                {searchLoading ? (
                                                                    <CommandGroup>
                                                                        <CommandItem disabled>
                                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                            Searching...
                                                                        </CommandItem>
                                                                    </CommandGroup>
                                                                ) : searchResults.length > 0 ? (
                                                                    <CommandGroup>
                                                                        {searchResults.map((user) => (
                                                                            <CommandItem
                                                                                key={user.id}
                                                                                onSelect={() => {
                                                                                    setInviteEmail(user.email)
                                                                                    setInputValue(user.email)
                                                                                    setOpen(false)
                                                                                }}
                                                                            >
                                                                                <span>{user.email}</span>
                                                                                {user.name && (
                                                                                    <span className="ml-2 text-muted-foreground">
                                                                                        ({user.name})
                                                                                    </span>
                                                                                )}
                                                                            </CommandItem>
                                                                        ))}
                                                                    </CommandGroup>
                                                                ) : inputValue ? (
                                                                    <CommandGroup>
                                                                        <CommandItem>No users found</CommandItem>
                                                                    </CommandGroup>
                                                                ) : null}
                                                            </CommandList>
                                                        </Command>
                                                    </div>
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button
                                                    onClick={handleInviteMember}
                                                    disabled={isInviting}
                                                >
                                                    {isInviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    {isInviting ? "Inviting..." : "Invite Member"}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>

                                <div className="text-sm text-muted-foreground">
                                    Members will be displayed here ( Feature coming soon )
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
