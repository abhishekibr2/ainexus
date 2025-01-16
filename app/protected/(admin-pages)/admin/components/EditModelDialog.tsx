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
import { FileText, Code2, Settings, Wand2, Loader2, X } from "lucide-react";
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
            onOpenChange={onOpenChange}
        >
            <DialogContent 
                className="max-w-[95vw] w-full h-[90vh] p-0 bg-background overflow-hidden flex"
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
                {/* Main Container */}
                <div className="flex w-full h-full">
                    {/* Left Sidebar - Navigation */}
                    <div className="w-[280px] min-w-[280px] bg-muted/30 border-r flex flex-col">
                        {/* Header */}
                        <div className="shrink-0 p-6 border-b">
                            <DialogTitle className="text-2xl font-semibold tracking-tight">Edit Agent</DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground mt-1">
                                Modify your agent's configuration
                            </DialogDescription>
                        </div>

                        {/* Steps */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-primary">
                                        <FileText className="h-4 w-4" />
                                        <h3 className="font-medium">Basic Information</h3>
                                    </div>
                                    <ul className="pl-6 text-sm text-muted-foreground space-y-1">
                                        <li>• Name</li>
                                        <li>• Description</li>
                                        <li>• Icon</li>
                                    </ul>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Settings className="h-4 w-4" />
                                        <h3 className="font-medium">API Configuration</h3>
                                    </div>
                                    <ul className="pl-6 text-sm text-muted-foreground space-y-1">
                                        <li>• Authentication</li>
                                        <li>• App Type</li>
                                        <li>• Required Fields</li>
                                    </ul>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Code2 className="h-4 w-4" />
                                        <h3 className="font-medium">Implementation</h3>
                                    </div>
                                    <ul className="pl-6 text-sm text-muted-foreground space-y-1">
                                        <li>• Variables</li>
                                        <li>• Code Editor</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Close Button */}
                        <div className="shrink-0 p-6 border-t">
                            <Button 
                                variant="outline" 
                                className="w-full" 
                                onClick={() => onOpenChange(false)}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Close
                            </Button>
                        </div>
                    </div>

                    {/* Middle Section - Form Fields */}
                    <div className="flex-1 min-w-[500px] border-r flex flex-col">
                        <div className="flex-1 overflow-y-auto">
                            <div className="p-6">
                                <div className="max-w-2xl space-y-6">
                                    <div>
                                        <Label htmlFor="name" className="text-base font-semibold">
                                            Agent Name
                                            <span className="text-destructive ml-1">*</span>
                                        </Label>
                                        <Input
                                            id="name"
                                            placeholder="Enter a descriptive name"
                                            value={modelData.name}
                                            onChange={(e) => setModelData({ ...modelData, name: e.target.value })}
                                            className="mt-2"
                                        />
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="description" className="text-base font-semibold">
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
                                                className="h-8 text-xs"
                                            >
                                                <Wand2 className="h-3 w-3 mr-1" />
                                                Generate
                                            </Button>
                                        </div>
                                        <Textarea
                                            id="description"
                                            placeholder="Describe what your agent does"
                                            className="mt-2 h-24 resize-none"
                                            value={modelData.description}
                                            onChange={(e) => setModelData({ ...modelData, description: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-base font-semibold">Select an Icon</Label>
                                        <div className="grid grid-cols-8 gap-2 mt-2">
                                            {availableIcons.map((icon) => {
                                                const IconComponent = icon.icon;
                                                const isSelected = modelData.icon === icon.id;
                                                return (
                                                    <button
                                                        key={icon.id}
                                                        className={`aspect-square p-3 border rounded-lg hover:border-primary transition-colors ${
                                                            isSelected ? 'border-primary bg-primary/10' : 'hover:bg-muted/50'
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

                                    <div className="pt-6 border-t">
                                        <div className="bg-muted/30 rounded-lg p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-base font-semibold">Authentication Required</h3>
                                                    <p className="text-sm text-muted-foreground mt-1">
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
                                                <div className="mt-4 pt-4 border-t border-border/50 animate-in fade-in-50">
                                                    <div className="space-y-4">
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
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="shrink-0 border-t bg-muted/30 p-6">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    All fields marked with <span className="text-destructive">*</span> are required
                                </div>
                                <div className="flex items-center gap-3">
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
                        </div>
                    </div>

                    {/* Right Section - Code Editor */}
                    <div className="w-[45%] min-w-[600px] flex flex-col">
                        <div className="shrink-0 p-6 border-b bg-muted/30">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-semibold">Code Implementation</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Write your agent's logic and behavior
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 p-6 flex flex-col gap-4 overflow-hidden">
                            <div className="shrink-0 bg-muted/30 rounded-lg p-4">
                                <h4 className="text-sm font-medium mb-2">Available Variables</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex items-center gap-2">
                                        <code className="px-1.5 py-0.5 rounded text-xs bg-muted">user.id</code>
                                        <span className="text-xs text-muted-foreground">User's ID</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <code className="px-1.5 py-0.5 rounded text-xs bg-muted">user.email</code>
                                        <span className="text-xs text-muted-foreground">User's email</span>
                                    </div>
                                </div>

                                {modelData.is_auth && appOptions.find(app => app.id === modelData.app_id)?.fields && (
                                    <div className="mt-3 pt-3 border-t">
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

                            <div className="flex-1 border rounded-lg overflow-hidden bg-background">
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
            </DialogContent>
        </Dialog>
    );
} 