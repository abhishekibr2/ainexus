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
} from "@/components/ui/dialog";
import { FileText, Code2, Settings, Wand2, Loader2 } from "lucide-react";
import Editor from "@monaco-editor/react";
import { getApplications, getModels, updateModel } from "@/utils/supabase/actions/assistant/assistant";
import { Model, availableIcons, sampleDescriptions } from "./types";

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
        id: 0,
        created_by: "",
        created_at: "",
        name: "",
        description: "",
        icon: "",
        is_auth: false,
        code: "",
        app_id: 0,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [appOptions, setAppOptions] = useState<Array<{ id: number; name: string; description: string; auth_required: boolean; fields: string[] }>>([]);
    const [isLoadingApps, setIsLoadingApps] = useState(true);
    const { toast } = useToast();

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
                name: model.name,
                description: model.description,
                icon: model.icon,
                is_auth: model.is_auth,
                code: model.code,
                app_id: model.app_id || 0,
                id: model.id,
                created_by: model.created_by,
                created_at: model.created_at,
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

        try {
            setIsSubmitting(true);
            await updateModel(model.id, modelData, userId);

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
            onOpenChange={(open) => {
                if (isSubmitting) return;
                onOpenChange(open);
            }}
        >
            <DialogContent
                className="max-w-[1200px] p-0 flex flex-col h-[90vh]"
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
                <DialogHeader className="p-6 pb-0 flex-shrink-0">
                    <DialogTitle>Edit Agent</DialogTitle>
                    <DialogDescription>
                        Update your AI agent's settings and behavior.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 p-6 overflow-y-auto min-h-0">
                    <div className="grid grid-cols-12 gap-6">
                        {/* Left Column - Basic Info & API Config */}
                        <div className="col-span-5 space-y-6">
                            {/* Basic Info Section */}
                            <div className="space-y-6">
                                <div className="flex items-center space-x-2">
                                    <FileText className="w-5 h-5 text-muted-foreground" />
                                    <h2 className="text-lg font-semibold">Basic Information</h2>
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Agent Name</Label>
                                        <Input
                                            id="name"
                                            placeholder="Enter agent name"
                                            value={modelData.name}
                                            onChange={(e) =>
                                                setModelData({ ...modelData, name: e.target.value })
                                            }
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label htmlFor="description">Description</Label>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    const randomIndex = Math.floor(Math.random() * sampleDescriptions.length);
                                                    setModelData({
                                                        ...modelData,
                                                        description: sampleDescriptions[randomIndex]
                                                    });
                                                }}
                                                type="button"
                                            >
                                                <Wand2 className="h-4 w-4 mr-2" />
                                                Generate
                                            </Button>
                                        </div>
                                        <Textarea
                                            id="description"
                                            placeholder="Describe what your agent does"
                                            className="h-32 resize-none font-mono text-sm"
                                            value={modelData.description}
                                            onChange={(e) =>
                                                setModelData({ ...modelData, description: e.target.value })
                                            }
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Agent Icon</Label>
                                        <div className="grid grid-cols-6 gap-2">
                                            {availableIcons.map((icon) => {
                                                const IconComponent = icon.icon;
                                                const isSelected = modelData.icon === icon.id;
                                                return (
                                                    <button
                                                        key={icon.id}
                                                        className={`p-2 border rounded-lg hover:border-primary transition-colors ${isSelected ? 'border-primary bg-primary/10' : ''
                                                            }`}
                                                        onClick={() => handleIconSelect(icon.id)}
                                                        type="button"
                                                    >
                                                        <IconComponent className="h-6 w-6" />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* API Configuration Section */}
                            <div className="space-y-6 pt-6 border-t">
                                <div className="flex items-center space-x-2">
                                    <Settings className="w-5 h-5 text-muted-foreground" />
                                    <h2 className="text-lg font-semibold">API Configuration</h2>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/5">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="is_auth">Authentication Required</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Enable if your API requires authentication
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
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="app_id">App Type</Label>
                                                {isLoadingApps ? (
                                                    <Skeleton className="h-10 w-full" />
                                                ) : (
                                                    <select
                                                        id="app_id"
                                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                                                    <p className="text-xs text-muted-foreground">
                                                        {appOptions.find(app => app.id === modelData.app_id)?.description}
                                                    </p>
                                                )}
                                            </div>

                                            {appOptions.find(app => app.id === modelData.app_id)?.fields && (
                                                <div className="space-y-2">
                                                    <Label>Required Fields</Label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {appOptions.find(app => app.id === modelData.app_id)?.fields.map((field, index) => (
                                                            <Badge key={index} className="text-xs">
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
                        </div>

                        {/* Right Column - Code Section */}
                        <div className="col-span-7 space-y-6">
                            <div className="flex items-center space-x-2">
                                <Code2 className="w-5 h-5 text-muted-foreground" />
                                <h2 className="text-lg font-semibold">Code</h2>
                            </div>

                            <div className="space-y-4">
                                <div className="rounded-lg border p-4 space-y-4 bg-muted/5">
                                    <div className="space-y-2">
                                        <h4 className="font-medium">Accessible Variables</h4>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div className="flex items-center space-x-2">
                                                <code className="bg-muted px-1 py-0.5 rounded">user.id</code>
                                                <span className="text-muted-foreground">User's ID</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <code className="bg-muted px-1 py-0.5 rounded">user.email</code>
                                                <span className="text-muted-foreground">User's email</span>
                                            </div>
                                        </div>
                                    </div>
                                    {modelData.is_auth && appOptions.find(app => app.id === modelData.app_id)?.fields && (
                                        <div className="space-y-2">
                                            <h4 className="font-medium">Connection Variables</h4>
                                            <div className="grid grid-cols-1 gap-2 text-sm">
                                                {appOptions.find(app => app.id === modelData.app_id)?.fields.map((field, index) => (
                                                    <div key={index} className="flex items-center space-x-2">
                                                        <code className="bg-muted px-1 py-0.5 rounded">vars.{field}</code>
                                                        <span className="text-muted-foreground">Connection {field}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="border rounded-md h-[500px]">
                                    <Editor
                                        height="100%"
                                        defaultLanguage="javascript"
                                        theme="vs-dark"
                                        value={modelData.code}
                                        onChange={(value) => {
                                            setModelData({
                                                ...modelData,
                                                code: value || "",
                                            });
                                        }}
                                        options={{
                                            minimap: { enabled: false },
                                            fontSize: 14,
                                            lineNumbers: "on",
                                            scrollBeyondLastLine: false,
                                            automaticLayout: true,
                                            tabSize: 2,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t mt-auto">
                    <div className="flex justify-end gap-4">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
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