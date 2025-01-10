"use client"

import { useEffect, useState, use } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Users2, Settings2, Trash2 } from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from "@/utils/supabase/client"
import { Workspace } from "@/utils/supabase/actions/workspace/workspace"
import { useRouter } from "next-nprogress-bar";


export default function WorkspaceSettings({ params }: { params: Promise<{ workspaces: string }> }) {
    const resolvedParams = use(params)
    const [workspace, setWorkspace] = useState<Workspace | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const loadWorkspace = async () => {
            try {
                const supabase = await createClient()
                const { data: workspace, error } = await supabase
                    .from('Workspaces')
                    .select('*')
                    .eq('id', resolvedParams.workspaces)
                    .single()

                if (error) throw error
                setWorkspace(workspace)
            } catch (error) {
                console.error('Error loading workspace:', error)
                // Handle error - maybe redirect to 404 or show error message
            } finally {
                setLoading(false)
            }
        }

        loadWorkspace()
    }, [resolvedParams.workspaces])

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) {
            return
        }

        try {
            const supabase = await createClient()
            const { error } = await supabase
                .from('Workspaces')
                .delete()
                .eq('id', resolvedParams.workspaces)

            if (error) throw error
            router.push('/protected/workspaces')
        } catch (error) {
            console.error('Error deleting workspace:', error)
            // Handle error - show error message
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
                        <Link href="/protected/workspaces">
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
                                    defaultValue={workspace.name}
                                    placeholder="Enter workspace name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    defaultValue={workspace.description || ''}
                                    placeholder="Enter workspace description"
                                    className="min-h-[100px]"
                                />
                            </div>
                            <Button>Save Changes</Button>
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
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                className="flex items-center"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Workspace
                            </Button>
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
                                    <Button>
                                        <Users2 className="mr-2 h-4 w-4" />
                                        Invite
                                    </Button>
                                </div>

                                {/* Member list will be implemented here */}
                                <div className="text-sm text-muted-foreground">
                                    No members yet. Invite some team members to get started.
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
