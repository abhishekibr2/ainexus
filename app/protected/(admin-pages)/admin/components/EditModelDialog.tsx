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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { FileText, Code2, Settings, Wand2, Loader2, X } from "lucide-react";
import Editor from "@monaco-editor/react";
import { getApplications, getModels, updateModel } from "@/utils/supabase/actions/assistant/assistant";
import { Model, availableIcons, sampleDescriptions, RestrictedPermissionOption } from "./types";
import { UserSearch } from "./user-search";
import { WorkspaceSearch } from "./workspace-search";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { OverrideConfigDialog } from "./OverrideConfigDialog";

interface EditModelDialogProps {
    model: Model | null;
    showDialog: boolean;
    onOpenChange: (open: boolean) => void;
    userId: string | null;
    onModelUpdated: (models: Model[]) => void;
}

export function EditModelDialog({
    model,
    showDialog,
    onOpenChange,
    userId,
    onModelUpdated
}: EditModelDialogProps) {
    const [modelData, setModelData] = useState<Model>({
        ...model!,
        permission: {
            type: model?.permission?.type || 'global',
            restricted_to: model?.permission?.restricted_to || [],
            restricted_users: model?.permission?.restricted_users || [],
            restricted_workspaces: model?.permission?.restricted_workspaces || []
        }
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [appOptions, setAppOptions] = useState<Array<{ id: number; name: string; description: string; auth_required: boolean; fields: string[] }>>([]);
    const [isLoadingApps, setIsLoadingApps] = useState(true);
    const { toast } = useToast();

    // Format JSON string for display
    const formatJsonString = (jsonString: string | null): string => {
        if (!jsonString) return '';
        try {
            // If it's already a string representation of JSON, parse it first
            const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
            return JSON.stringify(parsed, null, 2);
        } catch (e) {
            // If parsing fails, it might be already a JSON string
            return jsonString;
        }
    };

    useEffect(() => {
        const loadApplications = async () => {
            if (!showDialog) return;
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
    }, [showDialog]);

    useEffect(() => {
        if (model) {
            setModelData({
                ...model,
                override_config: formatJsonString(model.override_config || null),
                permission: {
                    type: model.permission?.type || 'global',
                    restricted_to: model.permission?.restricted_to || [],
                    restricted_users: model.permission?.restricted_users || [],
                    restricted_workspaces: model.permission?.restricted_workspaces || []
                }
            });
        }
    }, [model]);

    const handleSubmit = async () => {
        if (!userId || !model) {
            toast({
                title: "Error",
                description: "You must be logged in to edit a model.",
                variant: "destructive",
            });
            return;
        }

        if (modelData.app_id === 0) {
            modelData.app_id = null;
        }

        // Validate and parse JSON before submitting
        let parsedConfig: any = null;
        try {
            if (modelData.override_config) {
                // Parse the string to get the actual JSON object
                parsedConfig = JSON.parse(modelData.override_config);
            }
        } catch (e) {
            toast({
                title: "Error",
                description: "Invalid JSON in Override Config",
                variant: "destructive",
            });
            return;
        }

        // Ensure permission field is properly structured
        const modelToSubmit = {
            ...modelData,
            override_config: parsedConfig, // This will be the actual JSON object, not a string
            permission: {
                type: modelData.permission?.type || 'global',
                restricted_to: modelData.permission?.type === 'restricted' ? (modelData.permission?.restricted_to || []) : [],
                restricted_users: modelData.permission?.type === 'restricted' ? (modelData.permission?.restricted_users || []) : [],
                restricted_workspaces: modelData.permission?.type === 'restricted' ? (modelData.permission?.restricted_workspaces || []) : []
            }
        };

        try {
            setIsSubmitting(true);
            await updateModel(model.id, modelToSubmit, userId);

            // Refresh the models list
            const updatedModels = await getModels(userId);
            onModelUpdated(updatedModels);

            toast({
                title: "Success",
                description: "Agent updated successfully!",
            });
            onOpenChange(false);
        } catch (error: any) {
            console.error('Error updating model:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to update agent. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleIconSelect = (iconId: string) => {
        setModelData({ ...modelData, icon: iconId });
    };

    return (
        <Dialog
            open={showDialog}
            onOpenChange={onOpenChange}
        >
            <DialogContent
                className="max-w-[1200px] w-full h-[90vh] p-0 bg-background flex flex-col"
                onPointerDownOutside={(e) => {
                    if (isSubmitting) {
                        e.preventDefault();
                    }
                }}
                onEscapeKeyDown={(e) => {
                    if (isSubmitting) {
                        e.preventDefault();
                    }
                }}
            >
                {/* Header - Fixed */}
                <div className="shrink-0 p-6 border-b">
                    <div className="flex items-start justify-between">
                        <div>
                            <DialogTitle className="text-2xl font-semibold tracking-tight">Edit Agent</DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground mt-1">
                                Modify your agent's configuration and behavior
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
                                                value={modelData.name}
                                                onChange={(e) => setModelData({ ...modelData, name: e.target.value })}
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
                                                        setModelData({
                                                            ...modelData,
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
                                                value={modelData.description}
                                                onChange={(e) => setModelData({ ...modelData, description: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-sm font-medium">Select an Icon</Label>
                                            <div className="grid grid-cols-8 gap-2 mt-1.5">
                                                {availableIcons.map((icon) => {
                                                    const IconComponent = icon.icon;
                                                    const isSelected = modelData.icon === icon.id;
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
                                                checked={modelData.is_auth}
                                                onCheckedChange={(checked) => {
                                                    setModelData({
                                                        ...modelData,
                                                        is_auth: checked,
                                                        app_id: checked ? modelData.app_id : 0,
                                                    });
                                                }}
                                            />
                                        </div>

                                        {modelData.is_auth && (
                                            <div className="space-y-4 pt-4 border-t border-border/50">
                                                <div>
                                                    <Label htmlFor="app_id" className="text-sm font-medium">App Type</Label>
                                                    {isLoadingApps ? (
                                                        <Skeleton className="h-9 w-full mt-1.5" />
                                                    ) : (
                                                        <select
                                                            id="app_id"
                                                            className="w-full mt-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                            value={modelData.app_id?.toString() || ''}
                                                            onChange={(e) => {
                                                                setModelData({
                                                                    ...modelData,
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
                                                    {appOptions.find(app => app.id === modelData.app_id)?.description && (
                                                        <p className="text-xs text-muted-foreground mt-1.5">
                                                            {appOptions.find(app => app.id === modelData.app_id)?.description}
                                                        </p>
                                                    )}
                                                </div>

                                                {appOptions.find(app => app.id === modelData.app_id)?.fields && (
                                                    <div>
                                                        <Label className="text-sm font-medium">Required Fields</Label>
                                                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                            {appOptions.find(app => app.id === modelData.app_id)?.fields.map((field, index) => (
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
                                                        checked={modelData.permission.type === 'global'}
                                                        onChange={(e) => setModelData({
                                                            ...modelData,
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
                                                        checked={modelData.permission.type === 'restricted'}
                                                        onChange={(e) => setModelData({
                                                            ...modelData,
                                                            permission: {
                                                                ...modelData.permission,
                                                                type: 'restricted'
                                                            }
                                                        })}
                                                        className="h-4 w-4"
                                                    />
                                                    <Label htmlFor="restricted" className="text-sm font-normal">Restricted</Label>
                                                </div>
                                            </div>
                                        </div>

                                        {modelData.permission.type === 'restricted' && (
                                            <>
                                                <div className="pt-4 border-t">
                                                    <Label className="text-sm font-medium">Restrict Access To</Label>
                                                    <div className="flex items-center gap-4 mt-2">
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                id="user"
                                                                checked={modelData.permission.restricted_to?.includes('user')}
                                                                onChange={(e) => {
                                                                    const currentRestrictions = modelData.permission.restricted_to || [];
                                                                    const newRestrictions = e.target.checked
                                                                        ? [...currentRestrictions, 'user' as RestrictedPermissionOption]
                                                                        : currentRestrictions.filter(r => r !== 'user');
                                                                    setModelData({
                                                                        ...modelData,
                                                                        permission: {
                                                                            ...modelData.permission,
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
                                                                checked={modelData.permission.restricted_to?.includes('workspace')}
                                                                onChange={(e) => {
                                                                    const currentRestrictions = modelData.permission.restricted_to || [];
                                                                    const newRestrictions = e.target.checked
                                                                        ? [...currentRestrictions, 'workspace' as RestrictedPermissionOption]
                                                                        : currentRestrictions.filter(r => r !== 'workspace');
                                                                    setModelData({
                                                                        ...modelData,
                                                                        permission: {
                                                                            ...modelData.permission,
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

                                                {modelData.permission.restricted_to?.includes('user') && (
                                                    <div className="pt-4 border-t">
                                                        <UserSearch
                                                            selectedUserIds={modelData.permission.restricted_users || []}
                                                            onUserSelect={(users) => setModelData({
                                                                ...modelData,
                                                                permission: {
                                                                    ...modelData.permission,
                                                                    restricted_users: users
                                                                }
                                                            })}
                                                        />
                                                    </div>
                                                )}

                                                {modelData.permission.restricted_to?.includes('workspace') && (
                                                    <div className="pt-4 border-t">
                                                        <WorkspaceSearch
                                                            selectedWorkspaceIds={modelData.permission.restricted_workspaces || []}
                                                            onWorkspaceSelect={(workspaces) => setModelData({
                                                                ...modelData,
                                                                permission: {
                                                                    ...modelData.permission,
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
                                        <div className="flex items-center gap-2">
                                            <code className="px-1.5 py-0.5 rounded text-xs bg-muted">instruction</code>
                                            <span className="text-xs text-muted-foreground">Agent's instruction</span>
                                        </div>
                                    </div>

                                    {modelData.is_auth && appOptions.find(app => app.id === modelData.app_id)?.fields && (
                                        <div className="pt-4 border-t">
                                            <h4 className="text-sm font-medium mb-2">Connection Variables</h4>
                                            <div className="grid grid-cols-1 gap-2">
                                                {appOptions.find(app => app.id === modelData.app_id)?.fields.map((field, index) => (
                                                    <div key={index} className="flex items-center gap-2">
                                                        <code className="px-1.5 py-0.5 rounded text-xs bg-muted">vars.{field}</code>
                                                        <span className="text-xs text-muted-foreground">Connection {field}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
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
                                            value={modelData.chatflow_id}
                                            onChange={(e) => setModelData({ ...modelData, chatflow_id: e.target.value })}
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
                                                value={modelData.override_config || ''}
                                                onChange={(value) => {
                                                    try {
                                                        // Validate JSON as user types
                                                        if (value) {
                                                            JSON.parse(value);
                                                        }
                                                        setModelData({ ...modelData, override_config: value || '' });
                                                    } catch (e) {
                                                        // Allow invalid JSON while typing, but it will be caught on submit
                                                        setModelData({ ...modelData, override_config: value || '' });
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
                                    Updating...
                                </>
                            ) : (
                                'Update Agent'
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
} 