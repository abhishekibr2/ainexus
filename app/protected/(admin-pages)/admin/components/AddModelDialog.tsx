"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { FileText, Code2, Settings, Plus, Wand2, Loader2, X } from "lucide-react";
import Editor from "@monaco-editor/react";
import { getApplications, getModels, createModel } from "@/utils/supabase/actions/assistant/assistant";
import { NewModel, availableIcons, sampleDescriptions, RestrictedPermissionOption } from "./types";
import { UserSearch } from "./user-search";
import { WorkspaceSearch } from "./workspace-search";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { OverrideConfigDialog } from "./OverrideConfigDialog";

interface AddModelDialogProps {
    userId: string | null;
    onModelCreated: (models: any[]) => void;
}

export function AddModelDialog({ userId, onModelCreated }: AddModelDialogProps) {
    const [newModel, setNewModel] = useState<NewModel>({
        name: "",
        description: "",
        icon: "brain",
        is_auth: false,
        override_config: "",
        chatflow_id: "",
        app_id: null,
        permission: {
            type: 'global',
            restricted_to: [],
            restricted_users: [],
            restricted_workspaces: []
        }
    });
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [appOptions, setAppOptions] = useState<Array<{ id: number; name: string; description: string; auth_required: boolean; fields: string[] }>>([]);
    const [isLoadingApps, setIsLoadingApps] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const loadApplications = async () => {
            if (!isDialogOpen) return;
            try {
                setIsLoadingApps(true);
                const apps = await getApplications();
                setAppOptions(apps);
            } catch (error) {
                console.error('Error loading applications:', error);
                toast({
                    title: "Error",
                    description: "Failed to load application types.",
                    variant: "destructive",
                });
            } finally {
                setIsLoadingApps(false);
            }
        };

        loadApplications();
    }, [isDialogOpen]);

    const resetForm = () => {
        setNewModel({
            name: "",
            description: "",
            icon: "brain",
            is_auth: false,
            override_config: "",
            chatflow_id: "",
            app_id: null,
            permission: {
                type: 'global',
                restricted_to: [],
                restricted_users: [],
                restricted_workspaces: []
            }
        });
    };

    const handleSubmit = async () => {
        if (!userId) {
            toast({
                title: "Error",
                description: "You must be logged in to create a model.",
                variant: "destructive",
            });
            return;
        }

        if (newModel.app_id === 0) {
            newModel.app_id = null;
        }

        // Validate and parse JSON before submitting
        let parsedConfig: any = null;
        try {
            if (newModel.override_config) {
                // Parse the string to get the actual JSON object
                parsedConfig = JSON.parse(newModel.override_config);
            }
        } catch (e) {
            toast({
                title: "Error",
                description: "Invalid JSON in Override Config",
                variant: "destructive",
            });
            return;
        }

        const modelToSubmit = {
            name: newModel.name,
            description: newModel.description,
            icon: newModel.icon,
            is_auth: newModel.is_auth,
            override_config: parsedConfig, // This will be the actual JSON object, not a string
            chatflow_id: newModel.chatflow_id,
            app_id: newModel.app_id,
            permission: {
                type: newModel.permission?.type || 'global',
                restricted_to: newModel.permission?.type === 'restricted' ? (newModel.permission?.restricted_to || []) : [],
                restricted_users: newModel.permission?.type === 'restricted' ? (newModel.permission?.restricted_users || []) : [],
                restricted_workspaces: newModel.permission?.type === 'restricted' ? (newModel.permission?.restricted_workspaces || []) : []
            }
        };

        try {
            setIsSubmitting(true);
            await createModel(modelToSubmit, userId);

            // Refresh the models list
            const updatedModels = await getModels(userId);
            onModelCreated(updatedModels);

            toast({
                title: "Success",
                description: "Model created successfully!",
            });
            resetForm();
            setIsDialogOpen(false);
        } catch (error: any) {
            console.error('Error creating model:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to create model. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleIconSelect = (iconId: string) => {
        setNewModel({ ...newModel, icon: iconId });
    };

    return (
        <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
                if (isSubmitting) return;
                if (!open) resetForm();
                setIsDialogOpen(open);
            }}
        >
            <DialogTrigger asChild>
                <Button className="mb-4" variant="outline" onClick={() => setIsDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Agent
                </Button>
            </DialogTrigger>
            <DialogContent
                className="max-w-[1200px] w-full h-[90vh] p-0 bg-background flex flex-col"
            >
                {/* Header - Fixed */}
                <div className="shrink-0 p-6 border-b">
                    <div className="flex items-start justify-between">
                        <div>
                            <DialogTitle className="text-2xl font-semibold tracking-tight">Create Agent</DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground mt-1">
                                Build your custom AI agent
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6">
                        <div className="grid grid-cols-2 gap-6">
                            {/* Left Column - Basic Info & Settings */}
                            <div className="space-y-6">
                                {/* Basic Information Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                        <FileText className="h-4 w-4" />
                                        Basic Information
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="name" className="text-sm font-medium">
                                                Agent Name
                                                <span className="text-destructive ml-1">*</span>
                                            </Label>
                                            <Input
                                                id="name"
                                                placeholder="Enter a descriptive name"
                                                value={newModel.name}
                                                onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                                                className="mt-1.5"
                                            />
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="description" className="text-sm font-medium">
                                                    Description
                                                    <span className="text-destructive ml-1">*</span>
                                                </Label>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        const randomIndex = Math.floor(Math.random() * sampleDescriptions.length);
                                                        setNewModel({
                                                            ...newModel,
                                                            description: sampleDescriptions[randomIndex]
                                                        });
                                                    }}
                                                    className="h-7 text-xs"
                                                >
                                                    <Wand2 className="h-3 w-3 mr-1" />
                                                    Generate
                                                </Button>
                                            </div>
                                            <Textarea
                                                id="description"
                                                placeholder="Describe what your agent does"
                                                className="mt-1.5 h-20 resize-none"
                                                value={newModel.description}
                                                onChange={(e) => setNewModel({ ...newModel, description: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-sm font-medium">Select an Icon</Label>
                                            <div className="grid grid-cols-8 gap-2 mt-1.5">
                                                {availableIcons.map((icon) => {
                                                    const IconComponent = icon.icon;
                                                    const isSelected = newModel.icon === icon.id;
                                                    return (
                                                        <button
                                                            key={icon.id}
                                                            className={`aspect-square p-2 border rounded-lg hover:border-primary transition-colors ${isSelected ? 'border-primary bg-primary/10' : 'hover:bg-muted/50'
                                                                }`}
                                                            onClick={() => handleIconSelect(icon.id)}
                                                            type="button"
                                                        >
                                                            <IconComponent className="h-full w-full" />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Authentication Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                        <Settings className="h-4 w-4" />
                                        Authentication Settings
                                    </div>
                                    <div className="bg-muted/30 rounded-lg p-4 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-sm font-medium">Authentication Required</h3>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    Enable if your agent needs API authentication
                                                </p>
                                            </div>
                                            <Switch
                                                id="is_auth"
                                                checked={newModel.is_auth}
                                                onCheckedChange={(checked) => {
                                                    setNewModel({
                                                        ...newModel,
                                                        is_auth: checked,
                                                        app_id: checked ? newModel.app_id : 0,
                                                    });
                                                }}
                                            />
                                        </div>

                                        {newModel.is_auth && (
                                            <div className="space-y-4 pt-4 border-t border-border/50">
                                                <div>
                                                    <Label htmlFor="app_id" className="text-sm font-medium">App Type</Label>
                                                    {isLoadingApps ? (
                                                        <Skeleton className="h-9 w-full mt-1.5" />
                                                    ) : (
                                                        <select
                                                            id="app_id"
                                                            className="w-full mt-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                            value={newModel.app_id?.toString() || ''}
                                                            onChange={(e) => {
                                                                setNewModel({
                                                                    ...newModel,
                                                                    app_id: parseInt(e.target.value),
                                                                });
                                                            }}
                                                            required
                                                        >
                                                            <option value="0" disabled>Select app type</option>
                                                            {appOptions.map((app) => (
                                                                <option key={app.id} value={app.id}>
                                                                    {app.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )}
                                                    {appOptions.find(app => app.id === newModel.app_id)?.description && (
                                                        <p className="text-xs text-muted-foreground mt-1.5">
                                                            {appOptions.find(app => app.id === newModel.app_id)?.description}
                                                        </p>
                                                    )}
                                                </div>

                                                {appOptions.find(app => app.id === newModel.app_id)?.fields && (
                                                    <div>
                                                        <Label className="text-sm font-medium">Required Fields</Label>
                                                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                            {appOptions.find(app => app.id === newModel.app_id)?.fields.map((field, index) => (
                                                                <Badge key={index} variant="outline" className="text-xs">
                                                                    {field}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Permission Settings */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                        <Code2 className="h-4 w-4" />
                                        Permission Settings
                                    </div>
                                    <div className="bg-muted/30 rounded-lg p-4 space-y-4">
                                        <div>
                                            <Label className="text-sm font-medium">Permission Type</Label>
                                            <div className="flex items-center gap-4 mt-2">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        id="global"
                                                        name="permission_type"
                                                        value="global"
                                                        checked={newModel.permission.type === 'global'}
                                                        onChange={(e) => setNewModel({
                                                            ...newModel,
                                                            permission: {
                                                                type: 'global',
                                                                restricted_to: [],
                                                                restricted_users: [],
                                                                restricted_workspaces: []
                                                            }
                                                        })}
                                                        className="h-4 w-4"
                                                    />
                                                    <Label htmlFor="global" className="text-sm font-normal">Global</Label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        id="restricted"
                                                        name="permission_type"
                                                        value="restricted"
                                                        checked={newModel.permission.type === 'restricted'}
                                                        onChange={(e) => setNewModel({
                                                            ...newModel,
                                                            permission: {
                                                                ...newModel.permission,
                                                                type: 'restricted'
                                                            }
                                                        })}
                                                        className="h-4 w-4"
                                                    />
                                                    <Label htmlFor="restricted" className="text-sm font-normal">Restricted</Label>
                                                </div>
                                            </div>
                                        </div>

                                        {newModel.permission.type === 'restricted' && (
                                            <>
                                                <div className="pt-4 border-t">
                                                    <Label className="text-sm font-medium">Restrict Access To</Label>
                                                    <div className="flex items-center gap-4 mt-2">
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                id="user"
                                                                checked={newModel.permission.restricted_to?.includes('user')}
                                                                onChange={(e) => {
                                                                    const currentRestrictions = newModel.permission.restricted_to || [];
                                                                    const newRestrictions = e.target.checked
                                                                        ? [...currentRestrictions, 'user' as RestrictedPermissionOption]
                                                                        : currentRestrictions.filter(r => r !== 'user');
                                                                    setNewModel({
                                                                        ...newModel,
                                                                        permission: {
                                                                            ...newModel.permission,
                                                                            restricted_to: newRestrictions
                                                                        }
                                                                    });
                                                                }}
                                                                className="h-4 w-4"
                                                            />
                                                            <Label htmlFor="user" className="text-sm font-normal">User</Label>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                id="workspace"
                                                                checked={newModel.permission.restricted_to?.includes('workspace')}
                                                                onChange={(e) => {
                                                                    const currentRestrictions = newModel.permission.restricted_to || [];
                                                                    const newRestrictions = e.target.checked
                                                                        ? [...currentRestrictions, 'workspace' as RestrictedPermissionOption]
                                                                        : currentRestrictions.filter(r => r !== 'workspace');
                                                                    setNewModel({
                                                                        ...newModel,
                                                                        permission: {
                                                                            ...newModel.permission,
                                                                            restricted_to: newRestrictions
                                                                        }
                                                                    });
                                                                }}
                                                                className="h-4 w-4"
                                                            />
                                                            <Label htmlFor="workspace" className="text-sm font-normal">Workspace</Label>
                                                        </div>
                                                    </div>
                                                </div>

                                                {newModel.permission.restricted_to?.includes('user') && (
                                                    <div className="pt-4 border-t">
                                                        <UserSearch
                                                            selectedUserIds={newModel.permission.restricted_users || []}
                                                            onUserSelect={(users) => setNewModel({
                                                                ...newModel,
                                                                permission: {
                                                                    ...newModel.permission,
                                                                    restricted_users: users
                                                                }
                                                            })}
                                                        />
                                                    </div>
                                                )}

                                                {newModel.permission.restricted_to?.includes('workspace') && (
                                                    <div className="pt-4 border-t">
                                                        <WorkspaceSearch
                                                            selectedWorkspaceIds={newModel.permission.restricted_workspaces || []}
                                                            onWorkspaceSelect={(workspaces) => setNewModel({
                                                                ...newModel,
                                                                permission: {
                                                                    ...newModel.permission,
                                                                    restricted_workspaces: workspaces
                                                                }
                                                            })}
                                                        />
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - Configuration */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                    <Settings className="h-4 w-4" />
                                    Configuration
                                </div>

                                {/* Variables Info */}
                                <div className="bg-muted/30 rounded-lg p-4 space-y-4">
                                    <h4 className="text-sm font-medium">Available Variables</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="flex items-center gap-2">
                                            <code className="px-1.5 py-0.5 rounded text-xs bg-muted">user.id</code>
                                            <span className="text-xs text-muted-foreground">User's ID</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <code className="px-1.5 py-0.5 rounded text-xs bg-muted">user.email</code>
                                            <span className="text-xs text-muted-foreground">User's email</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <code className="px-1.5 py-0.5 rounded text-xs bg-muted">timezone</code>
                                            <span className="text-xs text-muted-foreground">User's timezone</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <code className="px-1.5 py-0.5 rounded text-xs bg-muted">name</code>
                                            <span className="text-xs text-muted-foreground">User's name</span>
                                        </div>
                                    </div>

                                    {newModel.is_auth && appOptions.find(app => app.id === newModel.app_id)?.fields && (
                                        <div className="pt-4 border-t">
                                            <h4 className="text-sm font-medium mb-2">Connection Variables</h4>
                                            <div className="grid grid-cols-1 gap-2">
                                                {appOptions.find(app => app.id === newModel.app_id)?.fields.map((field, index) => (
                                                    <div key={index} className="flex items-center gap-2">
                                                        <code className="px-1.5 py-0.5 rounded text-xs bg-muted">vars.{field}</code>
                                                        <span className="text-xs text-muted-foreground">Connection {field}</span>
                                                    </div>
                                                ))}
                                                <div className="flex items-center gap-2">
                                                    <code className="px-1.5 py-0.5 rounded text-xs bg-muted">instruction</code>
                                                    <span className="text-xs text-muted-foreground">Agent's instruction</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <code className="px-1.5 py-0.5 rounded text-xs bg-muted">sessionId</code>
                                        <span className="text-xs text-muted-foreground">Session ID</span>
                                    </div>
                                </div>

                                {/* Configuration Fields */}
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="chatflow_id" className="text-sm font-medium">
                                            Chatflow ID
                                            <span className="text-destructive ml-1">*</span>
                                        </Label>
                                        <Input
                                            id="chatflow_id"
                                            placeholder="Enter your chatflow ID"
                                            value={newModel.chatflow_id}
                                            onChange={(e) => setNewModel({ ...newModel, chatflow_id: e.target.value })}
                                            className="mt-1.5"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="code" className="text-sm font-medium flex justify-between">
                                            <div>
                                                Override Config JSON
                                            </div>
                                            <OverrideConfigDialog />
                                        </Label>
                                        <div className="mt-1.5 border rounded-md overflow-hidden">
                                            <Editor
                                                height="400px"
                                                defaultLanguage="json"
                                                value={newModel.override_config || ''}
                                                onChange={(value) => {
                                                    try {
                                                        // Validate JSON as user types
                                                        if (value) {
                                                            JSON.parse(value);
                                                        }
                                                        setNewModel({ ...newModel, override_config: value || '' });
                                                    } catch (e) {
                                                        // Allow invalid JSON while typing, but it will be caught on submit
                                                        setNewModel({ ...newModel, override_config: value || '' });
                                                    }
                                                }}
                                                options={{
                                                    minimap: { enabled: false },
                                                    fontSize: 12,
                                                    lineNumbers: 'on',
                                                    scrollBeyondLastLine: false,
                                                    automaticLayout: true,
                                                    formatOnPaste: true,
                                                    formatOnType: true,
                                                    bracketPairColorization: { enabled: true },
                                                    tabSize: 2
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer - Fixed */}
                <div className="shrink-0 p-6 border-t bg-background">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            All fields marked with <span className="text-destructive">*</span> are required
                        </div>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            size="lg"
                            className="min-w-[120px]"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Agent'
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
} 